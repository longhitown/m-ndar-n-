/* ===== V6: PWA (manifest, service worker, aggiornamenti, pacchetto per GitHub/Cloudflare) ===== */
(function () {
  var CP = window.CP, esc = CP.esc;

  /* ---- 2. PWA ---- */
  var NAME = "màndarínō", SHORT = "màndarínō";
  function iconSVG() {
    var l = document.querySelector('link[rel="icon"]'); if (!l) return "";
    var h = l.getAttribute("href") || ""; var i = h.indexOf(",");
    try { return decodeURIComponent(h.slice(i + 1)); } catch (e) { return ""; }
  }
  function manifestObj(base) {
    return {
      name: "màndarínō · cinese per italiani", short_name: SHORT, description: "Il cinese per italiani: oltre 6.300 parole (HSK 1–5), pinyin davanti, toni a colori, ripasso FSRS. Funziona offline.",
      id: "./", start_url: "./", scope: "./", display: "standalone", orientation: "portrait", lang: "it",
      background_color: "#F4EFE6", theme_color: "#14594A",
      icons: base ? [
        { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
      ] : [{ src: "data:image/svg+xml," + encodeURIComponent(iconSVG()), sizes: "any", type: "image/svg+xml", purpose: "any" }]
    };
  }
  /* service worker: APP_VERSION la scrive il pacchetto (data di build). Cambia -> nuova cache, e la pagina avvisa. */
  function swSource(version) {
    return "/* màndarínō · service worker. Cache dell'intera app: dopo il primo caricamento funziona senza rete. */\n" +
    "const APP_VERSION = '" + String(version).replace(/[^0-9A-Za-z.\-]/g, "") + "';\n" +
    "const CACHE = 'mandarino-' + APP_VERSION + '-' + (self.registration ? self.registration.scope : '');\n" +
    "const MUSIC = 'mandarino-music';\n" +
    "const VOICE = 'mandarino-voice';\n" +
    "const CORE = ['./', './index.html', './manifest.json', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];\n" +
    "self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null))))); });\n" +
    "/* la nuova versione aspetta: la pagina mostra «Nuova versione disponibile · Aggiorna» e manda SKIP_WAITING */\n" +
    "self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });\n" +
    "self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mandarino-') && k !== CACHE && k !== MUSIC && k !== VOICE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });\n" +
    "self.addEventListener('fetch', e => {\n  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;\n" +
    "  if (/\\/audio\\/voce\\//.test(new URL(r.url).pathname)) {\n    e.respondWith(caches.open(VOICE).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));\n    return;\n  }\n" +
    "  if (/\\/(audio\\/music|data\\/wiki)\\//.test(new URL(r.url).pathname)) {\n    e.respondWith(caches.open(MUSIC).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));\n    return;\n  }\n" +
    "  if (r.mode === 'navigate') {\n    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return res; }).catch(() => caches.match('./index.html').then(m => m || caches.match('./'))));\n    return;\n  }\n" +
    "  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; })));\n});\n";
  }
  function buildStamp() { var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + "-" + z(d.getHours()) + z(d.getMinutes()); }
  /* intestazioni per Cloudflare Pages (file _headers) */
  var HEADERS = "/*\n  Permissions-Policy: microphone=(self), camera=(self)\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: same-origin\n/sw.js\n  Cache-Control: no-cache\n/manifest.json\n  Cache-Control: no-cache\n/audio/music/*\n  Cache-Control: public, max-age=604800\n/data/wiki/*\n  Cache-Control: public, max-age=604800\n/audio/voce/*\n  Cache-Control: public, max-age=604800\n";
  CP.pwaFiles = { sw: swSource, headers: HEADERS, stamp: buildStamp, manifest: function () { return JSON.stringify(manifestObj(true), null, 2); } };

  /* il <link rel="manifest" href="manifest.json"> è statico nel <head>: su https Chrome lo legge subito.
     Solo da file:// (dove manifest.json non c'è) lo si sostituisce con un manifest in memoria. */
  var http = /^https?:$/.test(location.protocol), link = document.querySelector('link[rel="manifest"]');
  if (location.protocol === "file:") {
    try {
      if (!link) { link = document.createElement("link"); link.rel = "manifest"; document.head.appendChild(link); }
      link.href = URL.createObjectURL(new Blob([JSON.stringify(manifestObj(false))], { type: "application/manifest+json" }));
    } catch (e) {}
  }
  /* ---- aggiornamenti: un service worker nuovo resta in attesa finché l'utente non tocca «Aggiorna» ---- */
  var swNote = document.getElementById("sw-notice"), reloading = false;
  function offerUpdate(reg) {
    if (!swNote || !reg || !reg.waiting || !navigator.serviceWorker.controller) return;
    swNote.innerHTML = "<p><b>" + CP.t("upd.title") + "</b> " + CP.t("upd.keep") + '</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn-s" data-sw-update>' + CP.t("upd.go") + '</button><button type="button" class="btn-s" data-sw-later>' + CP.t("common.later") + "</button></div>";
    swNote.hidden = false;
    swNote.onclick = function (e) {
      var t = e.target.closest ? e.target.closest("button") : null; if (!t) return;
      if (t.hasAttribute("data-sw-later")) { swNote.hidden = true; return; }
      if (t.hasAttribute("data-sw-update") && reg.waiting) { t.disabled = true; t.textContent = CP.t("upd.going"); if (window.Store) Store.flush(); reg.waiting.postMessage({ type: "SKIP_WAITING" }); }
    };
  }
  /* APK: un controllo leggero e facoltativo dell'ultima Release su GitHub (una richiesta al giorno, solo con la rete),
     con lo stesso avviso della PWA. Si spegne in ⚙️ → Voce e audio → App Android. */
  var REPO = MD_CONFIG.REPO;   /* src/config.js; se il repository cambia nome, GitHub reindirizza anche le API */
  /* nella versione per gli store (MD_CONFIG.APK_UPDATES false) niente controllo né interruttore: gli aggiornamenti li dà lo store */
  CP.apkUpdates = window.MD_CONFIG && MD_CONFIG.APK_UPDATES === false ? null : { on: function () { try { return localStorage.getItem("cp-apkcheck") !== "0"; } catch (e) { return true; } }, set: function (v) { try { localStorage.setItem("cp-apkcheck", v ? "1" : "0"); } catch (e) {} } };
  function vnum(v) { return String(v || "").replace(/^v/, "").split(".").map(function (x) { return parseInt(x, 10) || 0; }); }
  function newer(a, b) { a = vnum(a); b = vnum(b); for (var i = 0; i < Math.max(a.length, b.length); i++) { if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0); } return false; }
  function apkCheck() {
    var cur = window.__MD_APK && window.__MD_APK.version; if (!cur || !CP.apkUpdates || !CP.apkUpdates.on() || navigator.onLine === false || !swNote) return;
    var last = 0; try { last = +localStorage.getItem("md-apkcheck-t") || 0; } catch (e) {}
    if (Date.now() - last < 86400000) return;
    try { localStorage.setItem("md-apkcheck-t", String(Date.now())); } catch (e) {}
    fetch("https://api.github.com/repos/" + REPO + "/releases/latest", { headers: { Accept: "application/vnd.github+json" } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (rel) {
      if (!rel || !rel.tag_name || !newer(rel.tag_name, cur)) return;
      var skip = ""; try { skip = localStorage.getItem("md-apkskip") || ""; } catch (e) {}
      if (skip === rel.tag_name) return;
      var asset = (rel.assets || []).filter(function (a) { return /\.apk$/.test(a.name); })[0], href = asset ? asset.browser_download_url : rel.html_url;
      swNote.innerHTML = "<p><b>" + CP.t("upd.apk", { v: CP.esc(rel.tag_name.replace(/^v/, "")) }) + "</b> " + CP.t("upd.apkKeep") + '</p><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn-s" href="' + CP.attr(href) + '" target="_blank" rel="noopener">' + CP.t("upd.dl") + '</a><button type="button" class="btn-s" data-apk-later>' + CP.t("common.later") + "</button></div>";
      swNote.hidden = false;
      swNote.onclick = function (e) { var t = e.target.closest ? e.target.closest("[data-apk-later]") : null; if (t) { swNote.hidden = true; try { localStorage.setItem("md-apkskip", rel.tag_name); } catch (er) {} } };
    }).catch(function () {});
  }
  if (window.__MD_APK) setTimeout(apkCheck, 4000);
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "opt-apkcheck") CP.apkUpdates.set(e.target.checked); });
  /* nell'APK l'app è già dentro il pacchetto: niente service worker (gli aggiornamenti arrivano con un APK nuovo) */
  if (http && "serviceWorker" in navigator && !window.__MD_APK) {
    navigator.serviceWorker.addEventListener("controllerchange", function () { if (reloading || !swNote || swNote.hidden) return; reloading = true; location.reload(); });
    fetch("sw.js", { cache: "no-store" }).then(function (r) {
      if (!r.ok) return;
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        offerUpdate(reg);
        reg.addEventListener("updatefound", function () {
          var nw = reg.installing; if (!nw) return;
          nw.addEventListener("statechange", function () { if (nw.state === "installed") offerUpdate(reg); });
        });
        /* controlla aggiornamenti quando l'app torna in primo piano */
        document.addEventListener("visibilitychange", function () { if (!document.hidden) { try { reg.update(); } catch (e) {} } });
      }).catch(function () {});
    }).catch(function () {});
  }
  CP.pwaState = function () {
    return { http: http, sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller), standalone: !!window.__MD_APK || (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true, apk: window.__MD_APK ? window.__MD_APK.version || true : false };
  };

  /* ---- 3. pacchetto ZIP (senza librerie: formato "store") ---- */
  var CRC = (function () { var t = [], n, k, c; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u) { var c = 0xFFFFFFFF, i; for (i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function u8(s) { return typeof s === "string" ? new TextEncoder().encode(s) : s; }
  function zip(files) {
    var parts = [], cen = [], off = 0;
    function w16(a, v) { a.push(v & 255, (v >>> 8) & 255); } function w32(a, v) { a.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255); }
    files.forEach(function (f) {
      var nm = u8(f.name), d = u8(f.data), c = crc32(d), h = [];
      w32(h, 0x04034b50); w16(h, 20); w16(h, 0x0800); w16(h, 0); w16(h, 0); w16(h, 0x21); w32(h, c); w32(h, d.length); w32(h, d.length); w16(h, nm.length); w16(h, 0);
      parts.push(new Uint8Array(h), nm, d);
      var r = []; w32(r, 0x02014b50); w16(r, 20); w16(r, 20); w16(r, 0x0800); w16(r, 0); w16(r, 0); w16(r, 0x21); w32(r, c); w32(r, d.length); w32(r, d.length); w16(r, nm.length); w16(r, 0); w16(r, 0); w16(r, 0); w16(r, 0); w32(r, 0); w32(r, off);
      cen.push(new Uint8Array(r), nm);
      off += h.length + nm.length + d.length;
    });
    var cl = 0; cen.forEach(function (a) { cl += a.length; });
    var e = []; w32(e, 0x06054b50); w16(e, 0); w16(e, 0); w16(e, files.length); w16(e, files.length); w32(e, cl); w32(e, off); w16(e, 0);
    return new Blob(parts.concat(cen, [new Uint8Array(e)]), { type: "application/zip" });
  }
  CP._zip = zip;
  function png(svg, size, pad) {
    return new Promise(function (res) {
      try {
        var img = new Image(); img.onload = function () {
          var cv = document.createElement("canvas"); cv.width = cv.height = size; var x = cv.getContext("2d");
          if (pad) { x.fillStyle = "#F4EFE6"; x.fillRect(0, 0, size, size); }
          var p = pad ? size * 0.18 : size * 0.04; x.drawImage(img, p, p, size - 2 * p, size - 2 * p);
          cv.toBlob(function (b) { if (!b) return res(null); var fr = new FileReader(); fr.onload = function () { res(new Uint8Array(fr.result)); }; fr.readAsArrayBuffer(b); }, "image/png");
        }; img.onerror = function () { res(null); };
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      } catch (e) { res(null); }
    });
  }
  var README = "màndarínō · pacchetto PWA\n==========================\n\n" +
    "Cartella da caricare nel repository su GitHub e da collegare a Cloudflare Pages, Vercel o GitHub Pages:\n\n" +
    "  index.html           <- l'app\n  manifest.json        <- nome, colori, icone (collegato in modo statico dal <head> di index.html)\n  sw.js                <- service worker: cache completa, offline al 100%\n  _headers             <- intestazioni per Cloudflare Pages (microfono, cache di sw.js e manifest)\n  icon.svg, icon-*.png <- icone (icon-180.png è quella che usa iPhone)\n\n" +
    "Passi (Cloudflare Pages, il più semplice):\n  1. GitHub: nuovo repository, trascina qui dentro tutti questi file.\n  2. Cloudflare -> Workers & Pages -> Create -> Pages -> Connect to Git -> scegli il repository.\n  3. Build command: vuoto. Output directory: / (la radice). Salva.\n  4. Apri l'indirizzo https://....pages.dev dal telefono -> menu del browser -> «Aggiungi a schermata Home».\n\n" +
    "Su https il microfono chiede il permesso UNA volta sola. Al primo caricamento l'app si salva nel telefono: poi funziona anche senza rete.\n\n" +
    "Aggiornare: sostituisci i file nel repository. sw.js contiene APP_VERSION (la data di questo pacchetto): quando cambia, il telefono scarica la nuova\n" +
    "versione e l'app mostra «Nuova versione disponibile · Aggiorna». Se cambi solo index.html, basta: viene sempre chiesto prima alla rete.\n\n" +
    "Nota sul nome: GitHub ha tolto gli accenti e il repository si chiama «m-ndar-n-». Conviene rinominarlo «mandarino»\n" +
    "(GitHub -> Settings -> General -> Repository name): i vecchi indirizzi vengono reindirizzati.\n\n" +
    "Microfono su iPhone: nell'app aggiunta alla schermata Home il riconoscimento vocale di Safari non è garantito.\n" +
    "Se manca, il pulsante 🎤 diventa «🎙️ Registra e confronta»: registra 3 secondi, poi senti te e la voce, con la curva del tono.\n";
  CP.pwaDownload = function () {
    var svg = iconSVG(), stamp = buildStamp();
    var self = fetch(location.href.split("#")[0], { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; });
    return Promise.all([self, png(svg, 192, false), png(svg, 512, false), png(svg, 512, true), png(svg, 180, true)]).then(function (a) {
      var files = [], index = a[0] || (CP.snapshot ? "<!doctype html>\n" + CP.snapshot : null);
      if (index) files.push({ name: "index.html", data: index });
      files.push({ name: "manifest.json", data: CP.pwaFiles.manifest() }, { name: "sw.js", data: swSource(stamp) }, { name: "_headers", data: HEADERS }, { name: "icon.svg", data: svg || "<svg xmlns='http://www.w3.org/2000/svg'/>" });
      if (a[1]) files.push({ name: "icon-192.png", data: a[1] }); if (a[2]) files.push({ name: "icon-512.png", data: a[2] }); if (a[3]) files.push({ name: "icon-maskable-512.png", data: a[3] }); if (a[4]) files.push({ name: "icon-180.png", data: a[4] });
      files.push({ name: "LEGGIMI.txt", data: README + "\nVersione del pacchetto (APP_VERSION): " + stamp + "\n" + (index ? "" : "\nNOTA: il browser non ha permesso di includere index.html: aggiungilo tu a mano.\n") });
      var bl = zip(files), url = URL.createObjectURL(bl), el = document.createElement("a");
      el.href = url; el.download = "mandarino-pwa.zip"; document.body.appendChild(el); el.click();
      setTimeout(function () { URL.revokeObjectURL(url); el.remove(); }, 4000);
      return { files: files.map(function (f) { return f.name; }), withIndex: !!index, bytes: bl.size };
    });
  };
})();

