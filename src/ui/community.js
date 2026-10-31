/* ===== màndarínō · ⚙️ → «Comunità e voci»: lo Scambio linguistico (il box sta in ui/scambio-stub.js), i tuoi numeri, i ringraziamenti,
   l'invito a un amico, i widget di Android e il controllo del pacchetto voci. Si carica con le Impostazioni, al loro primo uso
   (tools/build.mjs, LAZYMOD), così non pesa all'avvio. Qui c'è anche il pallino «Nuovo» (su ⚙️, sulla voce Comunità e su Informazioni).
   Regole del Manifesto: niente parte da solo, nessun numero lascia il telefono, nessuna classifica, nessun avviso a comparsa.
   L'unica richiesta di rete è «Controlla aggiornamenti», e solo se la persona tocca il pulsante (PRIVACY.md). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, el = document.getElementById("settings"), btn = document.getElementById("settings-btn");
  if (!el) return;
  var PACK_URL = "https://mandarinoapp.org/voci/index.json", K_PACK = "md-voicepack";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  /* la versione dell'app: quella dell'APK se c'è, altrimenti quella della build */
  function ver() { return String((window.__MD_APK && window.__MD_APK.version) || CP.VERSION || ""); }

  /* ---- pallino «Nuovo»: su ⚙️ e su ogni voce delle Impostazioni, finché la pagina non è stata letta davvero ----
     «Letta» vuol dire: scorsa fino in fondo, fermandosi in ogni schermata abbastanza da vederla (vedi readStart).
     Chi scorre di corsa vede il pallino restare: è fatto apposta, perché le Impostazioni si guardino, non si saltino.
     Solo un punto e un testo per i lettori di schermo, mai numeri né suoni. */
  var PAGES = ["look", "sound", "community", "study", "data", "info"], KP = "md-seen-p-";
  function seenVal(p) { return p === "info" ? ver() : "1"; }   /* Informazioni (con le Novità) torna «nuova» a ogni versione */
  function unseen(p) { return get(KP + p) !== seenVal(p); }
  function dots() {
    var any = PAGES.some(unseen), sr = document.getElementById("set-new-sr");
    if (btn) { btn.classList.toggle("has-new", any); if (any) btn.setAttribute("aria-describedby", "set-new-sr"); else btn.removeAttribute("aria-describedby"); }
    if (sr) sr.textContent = any ? T("cm.new") : "";
    PAGES.forEach(function (p) {
      var tile = el.querySelector('[data-set-open="' + p + '"]'), b = tile && tile.querySelector("b"), old = tile && tile.querySelector(".nd-sr");
      if (!tile) return;
      tile.classList.toggle("has-new", unseen(p));
      if (old) old.parentNode.removeChild(old);
      if (unseen(p) && b) { var s = document.createElement("span"); s.className = "sr nd-sr"; s.textContent = " " + T("cm.newItem"); b.appendChild(s); }
    });
  }
  /* la lettura si misura a pezzi: la pagina è divisa in «schermate» e ognuna deve restare in vista almeno mezzo secondo
     (una pagina corta, due secondi e mezzo); chi salta in fondo di corsa lascia le schermate di mezzo senza tempo e il pallino resta */
  var card = el.querySelector(".set-card"), rdg = null, SEG_MS = 500, ONE_MS = 2500;
  function readStop() { if (rdg) { clearInterval(rdg.t); rdg = null; } }
  function readStart(page) {
    readStop(); if (!card || !page || !unseen(page)) return;
    var me = { t: 0, dw: [] }, TICK = 200;
    function tick() {
      if (rdg !== me) return;
      if (el.hidden || document.hidden) return;
      var ch = Math.max(1, card.clientHeight), step = ch * 0.85, max = card.scrollHeight - ch, n = max <= 4 ? 1 : Math.ceil(max / step) + 1, i, ok = true;
      var cur = max <= 4 ? 0 : Math.min(n - 1, Math.round(card.scrollTop / max * (n - 1)));   /* n «schermate» a distanza uguale, dalla prima all'ultima */
      while (me.dw.length < n) me.dw.push(0);
      me.dw[cur] += TICK;
      for (i = 0; i < n; i++) if (me.dw[i] < (n === 1 ? ONE_MS : SEG_MS)) { ok = false; break; }
      if (ok) { set(KP + page, seenVal(page)); readStop(); dots(); }
    }
    rdg = me; me.t = setInterval(tick, TICK);
  }

  /* ---- i tuoi numeri (IndexedDB locale, via CP.scambio.all) ---- */
  var mine = null, loading = false;
  function paintMine() {
    var a = document.getElementById("cm-n-rec"), b = document.getElementById("cm-n-chk"), m = document.getElementById("cm-mine-msg");
    if (!a || !b) return;
    a.textContent = mine && !mine.err ? String(mine.rec) : "–"; b.textContent = mine && !mine.err ? String(mine.chk) : "–";
    if (m) m.textContent = !mine ? "" : mine.err ? T("cm.mine.err") : mine.rec ? "" : T("cm.mine.zero");
  }
  function loadMine() {
    if (loading) return; loading = true;
    var p; try { p = Promise.resolve(CP.scambio.all()); } catch (e) { p = Promise.reject(e); }
    p.then(function (rs) { rs = Array.isArray(rs) ? rs : []; mine = { rec: rs.length, chk: rs.filter(function (r) { return r && r.checked === true; }).length }; },
      function () { mine = { err: true }; }).then(function () { loading = false; paintMine(); });
  }

  /* ---- il pacchetto voci: l'ultimo esito del controllo, in md-voicepack (senza «cp-»: fuori dai backup) ---- */
  function pack() { try { var o = JSON.parse(get(K_PACK) || "null"); return o && typeof o.updated === "string" && isFinite(o.count) ? o : null; } catch (e) { return null; } }
  function dateOf(s) {
    var d = /^\d{4}-\d{2}-\d{2}/.test(String(s)) ? new Date(String(s).slice(0, 10) + "T12:00:00") : new Date(s);
    try { return isNaN(d) ? String(s) : d.toLocaleDateString(LANG === "zh" ? "zh-CN" : "it-IT", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return String(s); }
  }
  function mb(n) { var s = (Math.round(n / 104857.6) / 10).toFixed(1); return LANG === "zh" ? s : s.replace(".", ","); }
  function packLine() {
    var o = pack();
    return '<span class="cm-pip ' + (o ? "on" : "off") + '" aria-hidden="true"></span><span>' + esc(o ? T("cm.vp.have", { d: dateOf(o.updated), n: o.count }) : T("cm.vp.none")) + "</span>";
  }
  function packSay(s) { var m = document.getElementById("cm-vp-msg"); if (m) m.textContent = s; }
  function checkPack(b) {
    if (b.disabled) return;
    b.disabled = true; packSay(T("cm.vp.busy"));
    var done = function (msg) { b.disabled = false; packSay(msg); }, ac = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ac) ac.abort(); }, 12000);
    /* una sola richiesta, solo al tocco, senza cookie né mittente (credentials/referrer) e senza dati nostri */
    fetch(PACK_URL, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", signal: ac ? ac.signal : undefined }).then(function (r) {
      clearTimeout(to);
      if (!r.ok) { done(T("cm.vp.nope")); return; }
      return r.json().then(function (j) {
        var ok = j && j.v === 1 && /^\d{4}-\d{2}-\d{2}$/.test(String(j.updated)) && isFinite(j.count) && j.count >= 0 && isFinite(j.bytes) && j.bytes >= 0;
        if (!ok) { done(T("cm.vp.bad")); return; }
        set(K_PACK, JSON.stringify({ updated: j.updated, count: Math.floor(j.count), bytes: Math.floor(j.bytes), checked: Date.now() }));
        var line = document.getElementById("cm-vp-line"); if (line) line.innerHTML = packLine();
        done(T("cm.vp.found", { n: Math.floor(j.count), mb: mb(j.bytes), d: dateOf(j.updated) }));
      }, function () { done(T("cm.vp.bad")); });
    }, function () { clearTimeout(to); done(T("cm.vp.nope")); });
  }

  /* ---- invito a un amico: si copia un testo, non parte niente ---- */
  function inviteText() { return T(CP.course && CP.course() === "it" ? "cm.inv.msgZh" : "cm.inv.msgIt"); }
  function copyText(s, ok, ko) {
    function fallback() {
      var ta = document.createElement("textarea"), good = false;
      ta.value = s; ta.setAttribute("readonly", ""); ta.className = "cm-offscreen"; document.body.appendChild(ta);
      try { ta.select(); ta.setSelectionRange(0, s.length); good = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); if (good) ok(); else ko();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, fallback); else fallback();
  }
  function invite() {
    var s = inviteText();
    copyText(s, function () { CP.toast(T("cm.inv.done")); var m = document.getElementById("cm-inv-manual"); if (m) m.innerHTML = ""; }, function () {
      var m = document.getElementById("cm-inv-manual"); if (!m) return;
      m.innerHTML = '<p class="small" style="margin:0">' + esc(T("cm.inv.manual")) + '</p><textarea class="cm-copy" readonly rows="4" id="cm-inv-ta" lang="' + (s === T("cm.inv.msgZh") ? "zh-CN" : "it") + '">' + esc(s) + "</textarea>";
      var ta = document.getElementById("cm-inv-ta"); if (ta) { ta.focus(); ta.select(); }
    });
  }

  /* ---- widget (solo nell'APK: il ponte Android li aggiunge solo su tocco) ---- */
  var KINDS = ["today_large", "today_small", "pause", "review"];
  function bridge() { return window.MandarinoAndroid || null; }
  function canPin() { var A = bridge(); try { return !!(A && typeof A.pinWidget === "function" && typeof A.widgetPinSupported === "function" && A.widgetPinSupported() === true); } catch (e) { return false; } }
  /* le anteprime: piccoli disegni dei quattro widget (solo CSS, nessuna immagine), visibili anche fuori da Android */
  function wdCss() {
    if (document.getElementById("wd-css")) return;
    var s = document.createElement("style"); s.id = "wd-css";
    s.textContent = ".wd-pv{display:grid;place-items:center;min-height:96px;padding:10px;border-radius:14px;background:var(--chip)}" +
      ".wd{box-sizing:border-box;color:#FAF7EE;background:linear-gradient(145deg,#14594A,#1E7A63);border-radius:18px;padding:10px 12px;display:grid;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,.18);font-size:13px;line-height:1.25}" +
      ".wd b{font-size:13px}.wd .hz{font-size:30px;line-height:1;font-family:var(--f-han,serif)}.wd .mut{opacity:.8}" +
      ".wd-l{width:200px;grid-template-columns:auto 1fr;align-items:center;gap:10px}.wd-s{width:108px;text-align:center}.wd-p{width:150px;text-align:center}.wd-p .t{font-size:24px;font-weight:700}" +
      ".wd-p .go{justify-self:center;background:#FAF7EE;color:#14594A;border-radius:99px;padding:2px 12px;font-weight:700}.wd-r{width:184px}" +
      ".wd-r .py{opacity:.85}.wd-r .bt{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;font-size:13px;text-align:center}.wd-r .bt i{font-style:normal;background:rgba(250,247,238,.2);border-radius:6px;padding:3px 0}" +
      ".cm-list li.wd-li{display:grid;gap:8px}.cm-list li.wd-li .wd-row{display:flex;align-items:center;justify-content:space-between;gap:10px}";
    document.head.appendChild(s);
  }
  function wdPreview(k) {
    var w = function (x) { return T("wd." + x); };
    if (k === "today_large") return '<div class="wd wd-l"><span class="hz" lang="zh-CN">今</span><div><b>' + w("today") + '</b><div class="mut">6 ' + w("words") + ' · 🔥 4 ' + w("streak") + "</div></div></div>";
    if (k === "today_small") return '<div class="wd wd-s"><span class="hz" lang="zh-CN">今</span><div class="mut">6 ' + w("words") + "</div></div>";
    if (k === "pause") return '<div class="wd wd-p"><b>' + w("pause") + '</b><div class="t">25:00</div><div class="go">' + w("start") + "</div></div>";
    return '<div class="wd wd-r"><div class="hz" lang="zh-CN">你好</div><div class="py">nǐ hǎo</div><div class="bt"><i>' + w("again") + "</i><i>" + w("hard") + "</i><i>" + w("good") + "</i><i>" + w("easy") + "</i></div></div>";
  }
  function widgetsHTML() {
    wdCss();
    var pin = canPin(), droid = !!bridge();
    return '<section class="set-sec" id="set-widgets" aria-labelledby="set-widgets-h"><h3 class="set-h" id="set-widgets-h">' + T("cm.w.t") + '</h3><div class="vbody"><p class="small muted" style="margin:0">' + T(droid ? "cm.w.p" : "wd.web") + "</p>" +
      '<ul class="cm-list">' + KINDS.map(function (k) {
        var n = T("cm.w." + k);
        return '<li class="wd-li"><div class="wd-pv" role="img" aria-label="' + CP.attr(T("wd.t") + ": " + n) + '">' + wdPreview(k) + "</div>" +
          '<div class="wd-row"><div><b>' + esc(n) + '</b><div class="small muted">' + T("cm.w." + k + "D") + "</div></div>" +
          (pin ? '<button type="button" class="btn-s" data-cm-pin="' + k + '" aria-label="' + CP.attr(T("cm.w.addAria", { n: n })) + '">' + T("cm.w.add") + "</button>" : "") + "</div></li>";
      }).join("") + "</ul>" + (droid && !pin ? '<p class="small" style="margin:0">' + T("cm.w.manual") + "</p>" : "") + "</div></section>";
  }
  function pinWidget(kind) {
    var ok = false;
    try { ok = canPin() && bridge().pinWidget(kind) === true; } catch (e) { ok = false; }
    CP.toast(T(ok ? "cm.w.ok" : "cm.w.ko"));
  }

  /* ---- le sezioni ---- */
  function sec(id, title, body) { return '<section class="set-sec" id="' + id + '" aria-labelledby="' + id + '-h"><h3 class="set-h" id="' + id + '-h">' + title + '</h3><div class="vbody">' + body + "</div></section>"; }
  function html() {
    var o = pack();
    return sec("set-mine", T("cm.mine.t"),
        '<div class="cm-nums"><div class="cm-num"><b id="cm-n-rec" aria-live="polite">–</b><span>' + T("cm.mine.rec") + '</span></div><div class="cm-num"><b id="cm-n-chk" aria-live="polite">–</b><span>' + T("cm.mine.chk") + "</span></div></div>" +
        '<p class="small" id="cm-mine-msg" style="margin:0" aria-live="polite"></p><p class="small muted" style="margin:0">' + T("cm.mine.note") + "</p>") +
      sec("set-thanks", T("cm.thanks.t"), '<p style="margin:0">' + T("cm.thanks.p1") + '</p><p class="small muted" style="margin:0">' + T("cm.thanks.p2") + '</p><div class="acts" style="margin:0"><button type="button" class="btn-s" data-set-goto="set-scambio">' + T("cm.thanks.go") + '</button><button type="button" class="btn-quiet small" data-credits>' + T("set.credits") + "</button></div>") +
      sec("set-invite", T("cm.inv.t"), '<p class="small muted" style="margin:0">' + T("cm.inv.p") + '</p><div class="acts" style="margin:0"><button type="button" class="btn-s" data-cm-invite>' + T("cm.inv.btn") + '</button></div><div id="cm-inv-manual" aria-live="polite"></div>') +
      widgetsHTML() +
      sec("set-voicepack", T("cm.vp.t"), '<p class="cm-line" id="cm-vp-line" style="margin:0">' + packLine() + '</p><p class="small muted" style="margin:0">' + T("cm.vp.hint") + '</p><div class="acts" style="margin:0"><button type="button" class="btn-s" data-cm-check>' + T("cm.vp.check") + '</button></div>' +
        '<p class="small" id="cm-vp-msg" style="margin:0" aria-live="polite">' + (o && o.checked ? esc(T("cm.vp.last", { d: dateOf(o.checked) })) : "") + "</p>");
  }
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "community", html: html });

  /* ganci chiamati da ui/settings-pages.js: dopo ogni disegno, e quando si apre una pagina (aprirla = averla vista) */
  CP.communityPaint = function () { dots(); paintMine(); if (CP.settingsPage() === "community") loadMine(); };
  CP.communityShown = function (page) {
    if (page === "community") { paintMine(); loadMine(); }
    readStart(page);
    dots();
  };

  el.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    if (b.hasAttribute("data-cm-invite")) { CP.sfx("tap"); invite(); }
    else if (b.hasAttribute("data-cm-check")) { CP.sfx("tap"); checkPack(b); }
    else if (b.hasAttribute("data-cm-pin")) { CP.sfx("tap"); pinWidget(b.getAttribute("data-cm-pin")); }
  });
})();
