/* ===== màndarínō · ⚙️ → «Comunità e voci»: lo Scambio linguistico (il box sta in ui/scambio-stub.js), i tuoi numeri, i ringraziamenti,
   l'invito a un amico, i widget di Android e il controllo del pacchetto voci. Si carica con le Impostazioni, al loro primo uso
   (tools/build.mjs, LAZYMOD), così non pesa all'avvio. Qui c'è anche il pallino «Nuovo» (su ⚙️, sulla voce Comunità e su Informazioni).
   Regole del Manifesto: niente parte da solo, nessun numero lascia il telefono, nessuna classifica, nessun avviso a comparsa.
   L'unica richiesta di rete è «Controlla aggiornamenti», e solo se la persona tocca il pulsante (PRIVACY.md). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, el = document.getElementById("settings"), btn = document.getElementById("settings-btn");
  if (!el) return;
  var PACK_URL = "https://mandarinoapp.org/voci/index.json", K_PACK = "md-voicepack", K_COMM = "md-seen-community", K_VER = "md-seen-version";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  /* la versione dell'app: quella dell'APK se c'è, altrimenti quella della build */
  function ver() { return String((window.__MD_APK && window.__MD_APK.version) || CP.VERSION || ""); }

  /* ---- pallino «Nuovo»: solo un punto e un testo per i lettori di schermo, mai numeri né suoni ---- */
  function dots() {
    var c = !get(K_COMM), n = get(K_VER) !== ver(), sr = document.getElementById("set-new-sr");
    if (btn) { btn.classList.toggle("has-new", c || n); if (c || n) btn.setAttribute("aria-describedby", "set-new-sr"); else btn.removeAttribute("aria-describedby"); }
    if (sr) sr.textContent = c || n ? T("cm.new") : "";
    [["community", c], ["info", n]].forEach(function (x) {
      var tile = el.querySelector('[data-set-open="' + x[0] + '"]'), b = tile && tile.querySelector("b"), old = tile && tile.querySelector(".nd-sr");
      if (!tile) return;
      tile.classList.toggle("has-new", x[1]);
      if (old) old.parentNode.removeChild(old);
      if (x[1] && b) { var s = document.createElement("span"); s.className = "sr nd-sr"; s.textContent = " " + T("cm.newItem"); b.appendChild(s); }
    });
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
  function widgetsHTML() {
    if (!bridge()) return "";
    var pin = canPin();
    return '<section class="set-sec" id="set-widgets" aria-labelledby="set-widgets-h"><h3 class="set-h" id="set-widgets-h">' + T("cm.w.t") + '</h3><div class="vbody"><p class="small muted" style="margin:0">' + T("cm.w.p") + "</p>" +
      '<ul class="cm-list">' + KINDS.map(function (k) {
        var n = T("cm.w." + k);
        return '<li><div><b>' + esc(n) + '</b><div class="small muted">' + T("cm.w." + k + "D") + "</div></div>" +
          (pin ? '<button type="button" class="btn-s" data-cm-pin="' + k + '" aria-label="' + CP.attr(T("cm.w.addAria", { n: n })) + '">' + T("cm.w.add") + "</button>" : "") + "</li>";
      }).join("") + "</ul>" + (pin ? "" : '<p class="small" style="margin:0">' + T("cm.w.manual") + "</p>") + "</div></section>";
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
    if (page === "community") { set(K_COMM, "1"); paintMine(); loadMine(); }
    if (page === "info") set(K_VER, ver());
    dots();
  };

  el.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    if (b.hasAttribute("data-cm-invite")) { CP.sfx("tap"); invite(); }
    else if (b.hasAttribute("data-cm-check")) { CP.sfx("tap"); checkPack(b); }
    else if (b.hasAttribute("data-cm-pin")) { CP.sfx("tap"); pinWidget(b.getAttribute("data-cm-pin")); }
  });
})();
