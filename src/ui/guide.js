/* ===== V4e: Modalità Guida / Passeggiata (a mani libere) ===== */
(function () {
  var CP = window.CP, esc = CP.esc, U = CP.u, W = CP.WORDS, T = CP.t;
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
    var n = sourceItems().length, np = 0; PHRASES.forEach(function (g) { np += g.items.length; });
    return '<div class="g-top"><h2>🎧 ' + T("gd.title") + '</h2><button type="button" id="g-close" aria-label="' + CP.attr(T("common.close")) + '">✕</button></div>' +
      '<div style="flex:1;display:grid;align-content:center;gap:12px;padding:12px 0"><p class="intro" style="margin:0">' + T("gd.lede") + "</p>" +
      '<div class="g-sel" role="group" aria-label="' + CP.attr(T("gd.what")) + '">' +
      '<button type="button" data-gsrc="phr"' + (cfg.src === "phr" ? ' class="on"' : "") + ">" + T("gd.phr") + "<small>" + T("gd.phrSub", { n: np, g: PHRASES.length }) + "</small></button>" +
      '<button type="button" data-gsrc="words"' + (cfg.src === "words" ? ' class="on"' : "") + ">" + T("gd.words") + "<small>" + T("gd.wordsSub") + "</small></button>" +
      '<button type="button" data-gsrc="dlg"' + (cfg.src === "dlg" ? ' class="on"' : "") + ">" + T("gd.dlg") + "<small>" + T("gd.dlgSub", { n: DIALOGS.length }) + "</small></button></div>" +
      (cfg.src === "phr" ? '<label class="small muted" for="g-grp" style="display:grid;gap:4px;font-weight:600">' + T("gd.sit") + '<select id="g-grp"><option value="">' + T("jk.mAll") + "</option>" + PHRASES.map(function (g, i) { return '<option value="' + i + '"' + (cfg.grp === String(i) ? " selected" : "") + ' lang="it">' + esc(g.title) + "</option>"; }).join("") + "</select></label>" : "") +
      '<label class="chk"><input type="checkbox" id="g-shuf"' + (cfg.shuffle ? " checked" : "") + "> " + T("gd.shuffle") + "</label>" +
      '<label class="chk"><input type="checkbox" id="g-awake"' + (cfg.awake ? " checked" : "") + "> " + T("gd.awake") + "</label>" +
      '<button type="button" class="btn-main" id="g-start">▶️ ' + T("gd.start", { n: n }) + "</button>" +
      '<p class="small muted" style="margin:0">' + T("gd.voice") + "</p></div>";
  }
  function playHTML() {
    return '<div class="g-top"><h2>🎧 ' + T("gd.playing") + '</h2><button type="button" id="g-close" aria-label="' + CP.attr(T("common.close")) + '">✕</button></div>' +
      '<div class="g-main"><div class="g-phase" id="g-phase"></div><div class="g-it" id="g-it" lang="it"></div><div class="g-py" id="g-py"></div><div class="g-hz" lang="zh-CN" id="g-hz"></div><div class="g-bar" aria-hidden="true"><i id="g-bar"></i></div><div class="g-count" id="g-count"></div></div>' +
      '<div class="g-ctl"><button type="button" id="g-prev" aria-label="' + CP.attr(T("gd.prev")) + '">⏮</button><button type="button" class="btn-main" id="g-pp" style="margin:0" aria-label="' + CP.attr(T("gd.pause")) + '">⏸ ' + T("gd.pause") + '</button><button type="button" id="g-next" aria-label="' + CP.attr(T("gd.next")) + '">⏭</button></div>';
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
    show(it, "🇮🇹 " + T("gd.listen"), false);
    var bar = $("g-bar"); if (bar) { bar.style.transition = "none"; bar.style.width = "0%"; }
    CP.speak(it.it, { lang: "it-IT", rate: 1, onEnd: function () {
      if (me !== run) return;
      show(it, "🗣 " + T("gd.you"), false); barAnim(PAUSE_IT);
      later(PAUSE_IT, function () {
        show(it, "🐢 " + T("vo.slow"), true);
        CP.speak(it.say || it.hz, { rate: 0.8, onEnd: function () {
          if (me !== run) return;
          later(PAUSE_MID, function () {
            show(it, "🐇 " + T("gd.natural"), true);
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
    if (paused) { halt(); pp.innerHTML = "▶️ " + T("gd.resume"); pp.setAttribute("aria-label", T("gd.resume")); $("g-phase").textContent = "⏸ " + T("gd.paused"); }
    else { pp.innerHTML = "⏸ " + T("gd.pause"); pp.setAttribute("aria-label", T("gd.pause")); play(); }
  }
  function step(d) { if (!items.length) return; pos = (pos + d + items.length) % items.length; paused = false; var pp = $("g-pp"); if (pp) { pp.innerHTML = "⏸ " + T("gd.pause"); } play(); }
  el.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest) return; var b;
    if (t.closest("#g-close")) { close(); return; }
    if ((b = t.closest("[data-gsrc]"))) { cfg.src = b.getAttribute("data-gsrc"); el.innerHTML = setupHTML(); return; }
    if (t.closest("#g-start")) {
      items = sourceItems(); if (!items.length) { CP.toast(T("gd.empty")); return; }
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
