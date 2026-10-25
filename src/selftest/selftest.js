/* ===== V5: #selftest — controlli automatici dentro l'app (apri la pagina con #selftest in fondo all'indirizzo) ===== */
(function () {
  var CP = window.CP, esc = CP.esc;
  var box = document.createElement("div"); box.id = "selftest"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Autodiagnosi");
  document.body.appendChild(box);
  var R = [];
  function add(name, ok, detail) { R.push({ name: name, ok: ok, detail: detail || "" }); }
  function sine(f, sr, n, a) { var b = new Float32Array(n); for (var i = 0; i < n; i++) b[i] = (a || 0.4) * Math.sin(2 * Math.PI * f * i / sr); return b; }
  function pitchTrack(f0, f1, sr, win, hop, total) {      /* sinusoide con frequenza che scorre da f0 a f1; ritorna [{s: semitoni}] */
    var out = [], n = total, buf = new Float32Array(n), ph = 0, i;
    for (i = 0; i < n; i++) { var f = f0 + (f1 - f0) * i / n; ph += 2 * Math.PI * f / sr; buf[i] = 0.4 * Math.sin(ph); }
    for (var s = 0; s + win <= n; s += hop) { var r = CP._detect(buf.subarray(s, s + win), sr); if (r.f) out.push({ s: 12 * Math.log(r.f / 150) / Math.LN2 }); }
    return out;
  }
  function run() {
    R = [];
    /* dati */
    var ORD = CP.ORDER || [], seen = {}, dup = 0, bad = 0;
    ORD.forEach(function (k) { if (seen[k]) dup++; seen[k] = 1; var w = CP.WORDS[k]; if (!w || !w.py || !w.hz || !w.it) bad++; });
    add("Parole nel dizionario", ORD.length === 3500, ORD.length + " (attese 3500)");
    add("Chiavi uniche e righe complete", dup === 0 && bad === 0, dup + " doppie, " + bad + " incomplete");
    add("Sezioni", (CP.SEC || []).length === 155, (CP.SEC || []).length + " (attese 155)");
    var rows = document.querySelectorAll("#sections tbody tr").length;
    add("Tabella virtualizzata", rows < 700, rows + " righe nel documento ora (non 3500)");
    /* V6.7: tema Carta di Riso indipendente dal tema del sistema */
    try {
      var de = document.documentElement, prevT = de.getAttribute("data-theme");
      de.setAttribute("data-theme", "sepia");
      var t1 = getComputedStyle(de).getPropertyValue("--t1").trim().toUpperCase();
      if (prevT) de.setAttribute("data-theme", prevT); else de.removeAttribute("data-theme");
      add("Tema Carta di Riso: toni tarati sulla carta (anche col sistema scuro)", t1 === "#B42A24", "--t1 = " + t1);
    } catch (e) { add("Tema Carta di Riso", false, String(e)); }
    try {
      var zn = CP.lab.zhNum, zc = [[["二", "十"], 20], [["三", "十", "五"], 35], [["十", "二"], 12], [["一", "百", "零", "五"], 105], [["三", "百", "五"], 350]], zbad = zc.filter(function (x) { return zn(x[0]) !== x[1]; });
      add("Laboratorio: numeri composti (二十 = 20, 三十五 = 35, 十二 = 12…)", !zbad.length, zbad.length ? zbad.map(function (x) { return x[0].join("") + "→" + zn(x[0]); }).join(", ") : zc.length + " casi");
    } catch (e) { add("Laboratorio: numeri composti", false, String(e)); }
    try {
      var sbad = [], scount = 0;
      SLOTS.forEach(function (m) {
        var idx = m.cols.map(function () { return 0; });
        for (;;) {
          var c = CP.slotCompose(m, idx); scount++;
          if (/^[,，]/.test(c.py) || /^[,，]/.test(c.hz) || /,\s*[.?!]/.test(c.py) || /，[。？！]/.test(c.hz) || /[.?!,]\s*[,.?!]/.test(c.py)) sbad.push(c.py);
          var k = 0; while (k < idx.length && ++idx[k] >= m.cols[k].o.length) { idx[k] = 0; k++; }
          if (k === idx.length) break;
        }
      });
      add("Slot machine: nessuna frase con punteggiatura orfana", !sbad.length, sbad.length ? sbad.slice(0, 2).join(" | ") : scount + " combinazioni");
    } catch (e) { add("Slot machine", false, String(e)); }
    try {
      var ep = CP.earPool(), epBad = ep.filter(function (w) { return CP.POLY.has(w.hz); });
      add("Orecchio: nessun carattere con più letture (" + CP.POLY.size + " esclusi)", !epBad.length && ep.length > 50, ep.length + " parole; " + (epBad.length ? "da togliere: " + epBad.map(function (w) { return w.hz; }).join("") : "ok"));
      var hw = CP.WORDS["还#huán"];
      add("Voce: 还 huán si fa leggere dentro un esempio", !!hw && CP.sayHz(hw) !== "还" && CP.sayHz(hw).indexOf("还") >= 0, hw ? CP.sayHz(hw) : "parola assente");
    } catch (e) { add("Caratteri con più letture", false, String(e)); }
    try {
      var jt = CP.jukebox.tracks, jm = { calm: 0, focus: 0, energy: 0 }, jbad = jt.filter(function (t) { if (jm[t.mood] === undefined) return true; jm[t.mood]++; return false; });
      var jmiss = (CP.audioTracks && CP.audioTracks.missing) || [];
      add("Jukebox: ogni traccia del catalogo ha il suo file e un umore", jt.length >= 1 && !jbad.length && !jmiss.length, jt.length + " tracce · 🧘 " + jm.calm + " · 🎯 " + jm.focus + " · ⚡ " + jm.energy + (jmiss.length ? " · senza file: " + jmiss.join(", ") : ""));
      add("Audio: bus separati per effetti e musica", !!(CP.bus && CP.bus.duck && CP.bus.setSfxVol), "volume effetti " + Math.round(CP.bus.sfxVol() * 100) + "%");
    } catch (e) { add("Jukebox", false, String(e)); }
    try {
      var V = CP.contrib.validate, vok = !V({ op: "fix", target: "炸菜", field: "py", new: "zhà.cài" }).length && V({ op: "fix", target: "炸菜", field: "hz", new: "榨菜" }).length && V({ op: "fix", target: "我", field: "py", new: "wǒ.men" }).length && V({ op: "add", section: CP.SEC[0].id, hz: "x<y", py: "", it: "" }).length && !V({ op: "flag", target: "dlg:jiali:5", why: "pinyin diviso male" }).length;
      var mc = Store.mergeContribs([{ id: "a", t: 1, why: "vecchio" }, { id: "b", t: 5 }], [{ id: "a", t: 3, why: "nuovo" }, { id: "c", t: 2 }]);
      add("Contributi: validazione (mai hz, sillabe = caratteri, niente HTML) e unione per id", !!vok && mc.length === 3 && mc.filter(function (x) { return x.id === "a"; })[0].why === "nuovo", mc.map(function (x) { return x.id; }).join(""));
    } catch (e) { add("Contributi", false, String(e)); }
    try {
      var miss = Object.keys(I18N.it).filter(function (k) { return I18N.zh[k] == null; }), extra = Object.keys(I18N.zh).filter(function (k) { return I18N.it[k] == null; });
      add("Interfaccia: ogni chiave I18N ha la traduzione cinese, e t() sostituisce le variabili", !miss.length && !extra.length && t("u.min", { n: 3 }) === (LANG === "zh" ? "3 分钟" : "3 min"), Object.keys(I18N.it).length + " chiavi" + (miss.length ? "; manca zh: " + miss.slice(0, 4).join(", ") : "") + (extra.length ? "; solo zh: " + extra.slice(0, 4).join(", ") : ""));
    } catch (e) { add("Interfaccia I18N", false, String(e)); }
    var ml = document.querySelector('link[rel="manifest"]');
    add("PWA: manifest collegato dal <head>", !!ml && (location.protocol === "file:" ? /^blob:/.test(ml.href) : /manifest\.json$/.test(ml.getAttribute("href") || "")), ml ? (ml.getAttribute("href") || "").slice(0, 40) : "manca");
    /* memoria */
    try {
      var sch = new FSRS.Scheduler({ retention: 0.9, fuzz: false }), c = sch.review(sch.newCard(0), 3, 0);
      add("FSRS: prima risposta «Bene»", Math.abs(c.st - FSRS.DEFAULT_W[2]) < 1e-9, "S=" + c.st.toFixed(4));
      var r = sch.rAt(c, c.st * FSRS.DAY);
      add("FSRS: a t=S il ricordo è al 90%", Math.abs(r - 0.9) < 1e-6, r.toFixed(6));
    } catch (e) { add("FSRS", false, String(e)); }
    /* altezza della voce */
    try {
      var sr = 16000, tol = 0.03, ok = true, txt = [];
      [120, 180, 250].forEach(function (f) { var d = CP._detect(sine(f, sr, 2048), sr); var e = Math.abs(d.f - f) / f; if (!(e < tol)) ok = false; txt.push(f + "→" + d.f.toFixed(1)); });
      add("Altezza: toni puri 120/180/250 Hz entro il 3%", ok, txt.join(", "));
      add("Altezza: silenzio non dà falsi risultati", CP._detect(new Float32Array(2048), sr).f === 0);
      var noise = new Float32Array(2048); for (var i = 0; i < noise.length; i++) noise[i] = (Math.random() * 2 - 1) * 0.3;
      add("Altezza: rumore bianco non dà una nota sicura", (function () { var d = CP._detect(noise, sr); return d.f === 0 || d.c < 0.8; })());
      var shapes = { 1: [150, 150], 2: [120, 190], 4: [200, 110] }, okc = true, det = [];
      Object.keys(shapes).forEach(function (t) { var tr = pitchTrack(shapes[t][0], shapes[t][1], sr, 1024, 256, 12000), c2 = CP._classify(tr); det.push(t + "→" + c2); if (c2 !== +t) okc = false; });
      add("Toni sintetici 1, 2, 4 riconosciuti", okc, det.join(", "));
    } catch (e) { add("Altezza della voce", false, String(e)); }
    /* archiviazione */
    var st = window.Store ? Store.status() : { ls: false, idb: false };
    add("Memoria del browser (localStorage)", !!st.ls, st.ls ? "ok" : "bloccata: i progressi non si salvano");
    add("Copia di sicurezza interna (IndexedDB)", !!st.idb, st.idb ? "ok" : "non disponibile (resta il solo localStorage)");
    /* rete */
    var ext = [];
    /* i file dell'app sullo stesso dominio (manifest.json, sw.js, icone) non contano come rete esterna */
    try { performance.getEntriesByType("resource").forEach(function (e) { if (!/^(data|blob|file):/.test(e.name) && !(location.origin !== "null" && e.name.indexOf(location.origin + "/") === 0)) ext.push(e.name); }); } catch (e) {}
    add("Nessuna richiesta di rete esterna", ext.length === 0, ext.length ? ext.slice(0, 3).join(", ") : "zero");
    /* dispositivo (informativo: «non disponibile» non è un errore dell'app) */
    var info = [];
    var a = CP.audioState(); info.push(["Audio (AudioContext)", a === "running" || a === "none" || a === "suspended", a === "none" ? "non ancora avviato" : a]);
    info.push(["Sintesi vocale", !!window.speechSynthesis, window.speechSynthesis ? CP.voices().length + " voci cinesi" : "assente"]);
    info.push(["Riconoscimento vocale", CP.canListen(), CP.canListen() ? "presente" : "assente su questo browser"]);
    info.push(["Microfono (oscilloscopio)", CP.canScope(), CP.canScope() ? "presente" : "assente"]);
    info.push(["Dentro un riquadro?", !CP.inFrame, CP.inFrame ? "sì: microfono e audio possono essere bloccati" : "no"]);
    return Store.exportObj(true).then(function (o) { add("Backup: il file si genera e si rilegge", !!o && o.app === "mandarino" && o.v === 5 && typeof o.kv === "object" && Array.isArray(o.log), "versione " + (o && o.v) + ", " + Object.keys(o.kv || {}).length + " chiavi"); }, function (e) { add("Backup", false, String(e)); })
      .then(function () { return CP.micState(); }).then(function (m) { info.push(["Permesso microfono", m !== "denied", m]); return info; });
  }
  function close() { CP.untrap(box); if (location.hash === "#selftest") history.replaceState(null, "", location.pathname + location.search); }
  function show() {
    CP.trap(box, close);
    box.innerHTML = '<div class="st-in"><h2>Autodiagnosi</h2><p class="muted small">Sto controllando…</p></div>';
    setTimeout(function () {
      run().then(function (info) {
        var pass = R.filter(function (r) { return r.ok; }).length;
        var h = '<div class="st-in"><h2>Autodiagnosi</h2><p id="st-sum"><b>' + pass + " su " + R.length + "</b> controlli superati.</p><ul>";
        R.forEach(function (r) { h += '<li class="' + (r.ok ? "ok" : "ko") + '"><b>' + (r.ok ? "✓" : "✗") + "</b> " + esc(r.name) + (r.detail ? ' <span class="muted small">— ' + esc(r.detail) + "</span>" : "") + "</li>"; });
        h += '</ul><h3>Questo dispositivo</h3><ul>';
        info.forEach(function (r) { h += '<li class="' + (r[1] ? "ok" : "wa") + '"><b>' + (r[1] ? "✓" : "!") + "</b> " + esc(r[0]) + ' <span class="muted small">— ' + esc(r[2]) + "</span></li>"; });
        h += '</ul><div class="acts"><button type="button" class="btn-s" id="st-copy">Copia il risultato</button><button type="button" class="btn-s" id="st-close">Chiudi</button></div></div>';
        box.innerHTML = h; window.__SELFTEST = { pass: pass, total: R.length, results: R, info: info };
        var cb = document.getElementById("st-close"); if (cb) cb.focus({ preventScroll: true });
      });
    }, 30);
  }
  box.addEventListener("click", function (e) {
    if (e.target.id === "st-close") close();
    if (e.target.id === "st-copy") {
      var t = R.map(function (r) { return (r.ok ? "OK  " : "KO  ") + r.name + " — " + r.detail; }).join("\n");
      try { navigator.clipboard.writeText(t).then(function () { CP.toast("Copiato."); }, function () { CP.toast("Non riesco a copiare: fai uno screenshot."); }); } catch (er) { CP.toast("Non riesco a copiare: fai uno screenshot."); }
    }
  });
  CP.selftest = show;
  function check() { if (location.hash === "#selftest") show(); }
  window.addEventListener("hashchange", check); check();
})();

