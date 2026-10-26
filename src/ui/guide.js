/* ===== V4e: Modalità Guida / Passeggiata (a mani libere) ===== */
(function () {
  var CP = window.CP, esc = CP.esc, U = CP.u, W = CP.WORDS;
  var el = document.getElementById("guide"), btn = document.getElementById("guide-btn");
  var items = [], pos = 0, run = 0, timers = [], paused = false, phase = "", wl = null, cfg = { src: "phr", grp: "", shuffle: true, awake: true };
  var PAUSE_IT = 3200, PAUSE_MID = 1100, PAUSE_END = 1400;

  function clearT() { timers.forEach(clearTimeout); timers = []; }
  function later(ms, fn, me) { timers.push(setTimeout(function () { if (me === run) fn(); }, ms)); }
  function sourceItems() {
    var out = [];
    if (cfg.src === "phr") {
      PHRASES.forEach(function (g, gi) { if (cfg.grp === "" || String(gi) === cfg.grp) g.items.forEach(function (p) { out.push({ it: p[2], py: p[0], hz: p[1] }); }); });
    } else if (cfg.src === "words") {
      var prog = CP.ORDER.filter(function (k) { return CP.state(k) === 1; });
      var pool = prog.length >= 10 ? prog : CP.ORDER.filter(function (k) { return CP.state(k) !== 2; }).slice(0, 40);
      pool.forEach(function (k) { var w = W[k]; out.push({ it: CP.gloss(w), py: w.py, hz: w.hz, say: CP.sayHz(w) }); });
    } else {
      DIALOGS.forEach(function (d) { d.lines.forEach(function (l) { out.push({ it: l[3], py: l[1], hz: l[2] }); }); });
    }
    return out;
  }
  function setupHTML() {
    var n = sourceItems().length;
    return '<div class="g-top"><h2>🎧 Modalità guida</h2><button type="button" id="g-close" aria-label="Chiudi">✕</button></div>' +
      '<div style="flex:1;display:grid;align-content:center;gap:12px;padding:12px 0"><p class="intro" style="margin:0">Per quando cammini, guidi o hai le mani occupate. Ti dico la frase in italiano, hai qualche secondo per provare a dirla tu, poi la senti in cinese: prima piano, poi a velocità naturale. Va avanti da sola.</p>' +
      '<div class="g-sel" role="group" aria-label="Cosa ascoltare">' +
      '<button type="button" data-gsrc="phr"' + (cfg.src === "phr" ? ' class="on"' : "") + '>Frasi di tutti i giorni<small>120 frasi in 12 situazioni</small></button>' +
      '<button type="button" data-gsrc="words"' + (cfg.src === "words" ? ' class="on"' : "") + '>Le tue parole in corso<small>quelle che stai ripassando</small></button>' +
      '<button type="button" data-gsrc="dlg"' + (cfg.src === "dlg" ? ' class="on"' : "") + '>Le battute dei dialoghi<small>quello che ti serve nelle 8 situazioni</small></button></div>' +
      (cfg.src === "phr" ? '<label class="small muted" for="g-grp" style="display:grid;gap:4px;font-weight:600">Situazione<select id="g-grp"><option value="">Tutte</option>' + PHRASES.map(function (g, i) { return '<option value="' + i + '"' + (cfg.grp === String(i) ? " selected" : "") + ">" + esc(g.title) + "</option>"; }).join("") + "</select></label>" : "") +
      '<label class="chk"><input type="checkbox" id="g-shuf"' + (cfg.shuffle ? " checked" : "") + '> Ordine casuale</label>' +
      '<label class="chk"><input type="checkbox" id="g-awake"' + (cfg.awake ? " checked" : "") + '> Tieni lo schermo acceso</label>' +
      '<button type="button" class="btn-main" id="g-start">▶️ Parti (' + n + " frasi)</button>" +
      '<p class="small muted" style="margin:0">Serve la voce del dispositivo. Se senti solo silenzio, prova «Usa la voce alternativa» in Voce e audio.</p></div>';
  }
  function playHTML() {
    return '<div class="g-top"><h2>🎧 In ascolto</h2><button type="button" id="g-close" aria-label="Chiudi">✕</button></div>' +
      '<div class="g-main"><div class="g-phase" id="g-phase"></div><div class="g-it" id="g-it"></div><div class="g-py" id="g-py"></div><div class="g-hz" lang="zh-CN" id="g-hz"></div><div class="g-bar" aria-hidden="true"><i id="g-bar"></i></div><div class="g-count" id="g-count"></div></div>' +
      '<div class="g-ctl"><button type="button" id="g-prev" aria-label="Frase precedente">⏮</button><button type="button" class="btn-main" id="g-pp" style="margin:0" aria-label="Pausa">⏸ Pausa</button><button type="button" id="g-next" aria-label="Frase successiva">⏭</button></div>';
  }
  function $(id) { return document.getElementById(id); }
  function barAnim(ms) {
    var b = $("g-bar"); if (!b) return;
    b.style.transition = "none"; b.style.width = "0%"; void b.offsetWidth;
    b.style.transition = "width " + ms + "ms linear"; b.style.width = "100%";
  }
  function show(it, ph, reveal) {
    $("g-phase").textContent = ph;
    $("g-it").textContent = it.it;
    $("g-py").innerHTML = reveal ? CP.pinyinHTML(it.py) : "";
    $("g-hz").innerHTML = reveal ? CP.hanziHTML(it.hz, it.py) : "";
    $("g-count").textContent = (pos + 1) + " / " + items.length;
  }
  function play() {
    var me = ++run, it = items[pos]; clearT(); CP.stopSpeak();
    if (!it || !$("g-it")) return;
    show(it, "🇮🇹 Ascolta", false);
    var bar = $("g-bar"); if (bar) { bar.style.transition = "none"; bar.style.width = "0%"; }
    CP.speak(it.it, { lang: "it-IT", rate: 1, onEnd: function () {
      if (me !== run) return;
      show(it, "🗣 Tocca a te", false); barAnim(PAUSE_IT);
      later(PAUSE_IT, function () {
        show(it, "🐢 Lento", true);
        CP.speak(it.say || it.hz, { rate: 0.8, onEnd: function () {
          if (me !== run) return;
          later(PAUSE_MID, function () {
            show(it, "🐇 Naturale", true);
            CP.speak(it.say || it.hz, { rate: 1, onEnd: function () {
              if (me !== run) return;
              later(PAUSE_END, function () { pos = (pos + 1) % items.length; if (pos === 0 && cfg.shuffle) items = U.shuffle(items); play(); }, me);
            }, onStop: function () {} });
          }, me);
        }, onStop: function () {} });
      }, me);
    }, onStop: function () {} });
  }
  function halt() { run++; clearT(); CP.stopSpeak(); }
  function wake() {
    try { if (cfg.awake && navigator.wakeLock && !wl) navigator.wakeLock.request("screen").then(function (l) { wl = l; l.addEventListener("release", function () { wl = null; }); }, function () {}); } catch (e) {}
  }
  function unwake() { try { if (wl) { wl.release(); wl = null; } } catch (e) {} }
  function open() {
    el.innerHTML = setupHTML(); CP.trap(el, close);
    var c = $("g-close"); if (c) c.focus({ preventScroll: true });
  }
  function close() { halt(); unwake(); CP.untrap(el); el.innerHTML = ""; }
  btn.addEventListener("click", function () { CP.sfx("tap"); open(); });
  document.addEventListener("keydown", function (e) {
    if (el.hidden) return;
    if (!$("g-pp")) return;
    if (e.key === " " && document.activeElement && document.activeElement.tagName !== "BUTTON") { e.preventDefault(); toggle(); }
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  function toggle() {
    var pp = $("g-pp"); if (!pp) return;
    paused = !paused;
    if (paused) { halt(); pp.innerHTML = "▶️ Riprendi"; pp.setAttribute("aria-label", "Riprendi"); $("g-phase").textContent = "⏸ In pausa"; }
    else { pp.innerHTML = "⏸ Pausa"; pp.setAttribute("aria-label", "Pausa"); play(); }
  }
  function step(d) { if (!items.length) return; pos = (pos + d + items.length) % items.length; paused = false; var pp = $("g-pp"); if (pp) { pp.innerHTML = "⏸ Pausa"; } play(); }
  el.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest) return; var b;
    if (t.closest("#g-close")) { close(); return; }
    if ((b = t.closest("[data-gsrc]"))) { cfg.src = b.getAttribute("data-gsrc"); el.innerHTML = setupHTML(); return; }
    if (t.closest("#g-start")) {
      items = sourceItems(); if (!items.length) { CP.toast("Niente da ascoltare con questa scelta."); return; }
      if (cfg.shuffle) items = U.shuffle(items);
      pos = 0; paused = false; el.innerHTML = playHTML(); wake(); CP.sfx("tap");
      var x = $("g-pp"); if (x) x.focus({ preventScroll: true });
      play(); return;
    }
    if (t.closest("#g-pp")) { toggle(); return; }
    if (t.closest("#g-prev")) { step(-1); return; }
    if (t.closest("#g-next")) { step(1); return; }
  });
  el.addEventListener("change", function (e) {
    if (e.target.id === "g-grp") { cfg.grp = e.target.value; el.innerHTML = setupHTML(); var s = $("g-grp"); if (s) s.focus(); }
    else if (e.target.id === "g-shuf") cfg.shuffle = e.target.checked;
    else if (e.target.id === "g-awake") cfg.awake = e.target.checked;
  });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && !el.hidden && $("g-pp") && !paused) wake(); });
  CP.guide = { open: open, close: close };
})();
