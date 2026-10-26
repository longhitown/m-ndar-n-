/* ===== màndarínō · lettore del jukebox: motore (dissolvenze, casuale, umori) e interfaccia (🎵, pannello, ⚙️).
   Le tracce stanno in audio/tracks/ e gli attrezzi sonori in audio/synth.js. ===== */
(function () {
  var CP = window.CP, esc = CP.esc;
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var mus = document.getElementById("music-btn");
  var SLOT_MS = 7.5 * 60 * 1000;           /* 8 tracce x 7,5 minuti = 1 ora, poi si rimescola */
  var FADE = 1.8;

  var J = { want: lget("cp-music") === "1", sel: lget("cp-track") || "shuffle", vol: parseFloat(lget("cp-musicvol") || "0.8"),
    run: false, timer: 0, hold: 0, bus: null, cur: null, curId: "", order: [], pos: 0, slotAt: 0, bufs: {}, noise: null, played: [],
    mood: lget("cp-jkmood") || "", auto: lget("cp-jkauto") !== "0" };
  var TRACKS = CP.audioTracks.list, groove = CP.synth.groove;
  var MOODS = [["", CP.t("jk.mAll")], ["calm", CP.t("jk.mCalm")], ["focus", CP.t("jk.mFocus")], ["energy", CP.t("jk.mEnergy")]];
  var BYID = {}; TRACKS.forEach(function (t) { BYID[t.id] = t; });
  /* una traccia scelta che non c'è più (le vecchie tracce generate) torna a «tutte, in ordine casuale» */
  if (J.sel !== "shuffle" && !BYID[J.sel]) { J.sel = "shuffle"; lset("cp-track", "shuffle"); }
  var ZH = typeof LANG !== "undefined" && LANG === "zh";
  function nm(t) { return ZH && t.zh ? t.zh[0] : t.name; }
  function ds(t) { return ZH && t.zh ? t.zh[1] : t.desc; }
  var MB = 80, DL = null;

  /* ---------- motore ---------- */
  function pool() { var a = TRACKS.filter(function (t) { return !J.mood || t.mood === J.mood; }); return a.length ? a : TRACKS; }
  function shuffleOrder(avoid) {
    var a = pool().map(function (t) { return t.id; }), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    if (avoid && a[0] === avoid && a.length > 1) { t = a[0]; a[0] = a[1]; a[1] = t; }
    return a;
  }
  function ensureBus(c) {
    if (J.bus) return J.bus;
    J.bus = c.createGain(); J.bus.gain.value = 0.34 * J.vol;
    var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5200; J.bus.connect(lp); lp.connect((CP.bus && CP.bus.music()) || CP.master());
    return J.bus;
  }
  function play(id) {
    var c = CP.getCtx(); if (!c || !BYID[id]) return;
    var now = c.currentTime, old = J.cur;
    if (old) { try { old.tb.gain.cancelScheduledValues(now); old.tb.gain.setValueAtTime(old.tb.gain.value, now); old.tb.gain.linearRampToValueAtTime(0, now + FADE); } catch (e) {} setTimeout(function () { try { old.inst.stop(); old.tb.disconnect(); } catch (e) {} }, FADE * 1000 + 400); }
    CP.synth.reset();
    var tb = c.createGain(); tb.gain.setValueAtTime(0, now); tb.gain.linearRampToValueAtTime(1, now + FADE); tb.connect(ensureBus(c));
    J.cur = { id: id, tb: tb, inst: BYID[id].make(c, tb) }; J.curId = id; J.slotAt = Date.now();
    if (J.played[J.played.length - 1] !== id) J.played.push(id);
    paint(); schedule();
  }
  function schedule() {
    var c = CP.getCtx(); if (!c || !J.cur || c.state !== "running") return;
    J.cur.inst.step(c.currentTime + 1.4, c.currentTime);
  }
  function tick() {
    if (!J.run) return;
    if (J.sel === "shuffle" && J.cur && Date.now() - J.slotAt > slot()) next();
    schedule();
  }
  /* un brano registrato suona una volta intera (dal momento in cui è pronto), poi parte il successivo */
  function slot() { var t = BYID[J.curId]; return t && t.sec ? t.sec * 1000 - FADE * 1000 : SLOT_MS; }
  function next() {
    if (J.pos >= J.order.length - 1) { J.order = shuffleOrder(J.curId); J.pos = 0; } else J.pos++;
    play(J.order[J.pos]);
  }
  function start() {
    var c = CP.getCtx(); if (!c || J.run) return;
    CP.audioUnlock().then(function () {
      if (J.run || !J.want) return;
      J.run = true;
      /* iOS 17+: la musica suona anche col tasto silenzioso (gli effetti no) */
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
      if (J.sel === "shuffle") { if (!J.order.length) { J.order = shuffleOrder(); J.pos = 0; } play(J.order[J.pos]); } else play(J.sel);
      J.timer = setInterval(tick, 400);
    });
  }
  function stop() {
    if (!J.run) return; J.run = false; clearInterval(J.timer); J.timer = 0;
    try { if (navigator.audioSession) navigator.audioSession.type = "ambient"; } catch (e) {}
    var c = CP.getCtx(), old = J.cur; J.cur = null; J.curId = "";
    if (old && c) { try { old.tb.gain.cancelScheduledValues(c.currentTime); old.tb.gain.setValueAtTime(old.tb.gain.value, c.currentTime); old.tb.gain.linearRampToValueAtTime(0, c.currentTime + 0.5); } catch (e) {} setTimeout(function () { try { old.inst.stop(); old.tb.disconnect(); } catch (e) {} }, 700); }
    paint();
  }
  function modeNow() { return !CP.pref.sfx ? "mute" : "on"; }
  CP.musicApply = function () {
    var on = J.want && modeNow() !== "mute" && !J.hold && !document.hidden;
    if (on) start(); else stop();
    if (mus) {
      mus.textContent = "🎵"; mus.classList.toggle("on", J.want && modeNow() !== "mute"); mus.setAttribute("aria-pressed", J.want ? "true" : "false");
      mus.setAttribute("aria-label", CP.t("jk.aria", { s: CP.t(J.want ? "jk.on" : "jk.off") })); mus.title = CP.t("jk.title").replace(/^\S+\s/, "");
    }
    paint();
  };
  CP.musicHold = function (on) { J.hold = Math.max(0, J.hold + (on ? 1 : -1)); CP.musicApply(); };
  CP.musicState = function () { return { want: J.want, running: J.run, hold: J.hold, track: J.curId, sel: J.sel, played: J.played.slice(), mood: J.mood, live: CP.synth.live() }; };
  /* abbinamento automatico: in modalità casuale, la Sfida parte con una traccia ⚡ e lo studio con una 🎯 */
  CP.musicMood = function (m) {
    if (!J.auto || !J.run || J.sel !== "shuffle" || !J.cur) return;
    var cur = BYID[J.curId]; if (cur && cur.mood === m) return;
    var c = TRACKS.filter(function (t) { return t.mood === m && t.id !== J.curId; }); if (!c.length) return;
    play(c[Math.floor(Math.random() * c.length)].id);
  };
  CP.jukebox = { tracks: TRACKS, groove: groove, play: function (id) { J.want = true; lset("cp-music", "1"); J.sel = id; lset("cp-track", id); if (J.run) play(id === "shuffle" ? (J.order[J.pos] || TRACKS[0].id) : id); else CP.musicApply(); }, next: next };

  /* ---------- interfaccia: popup sul 🎵 + selettore in "Voce e audio" ---------- */
  var pop = document.createElement("div"); pop.id = "jk-pop"; pop.hidden = true; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "true"); pop.setAttribute("aria-label", "Jukebox"); document.body.appendChild(pop);
  function moodPills() {
    return '<div class="cpills jk-moods" role="group" aria-label="Filtra per umore">' + MOODS.map(function (m) {
      return '<button type="button" data-jk-mood="' + m[0] + '"' + (J.mood === m[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + m[1] + "</button>";
    }).join("") + "</div>";
  }
  function list(extraCls) {
    var cur = J.sel, h = '<div class="jk-list ' + (extraCls || "") + '" role="radiogroup" aria-label="' + CP.t("jk.choose") + '">', mn = MOODS.filter(function (m) { return m[0] === J.mood; })[0];
    h += '<button type="button" class="jk-it' + (cur === "shuffle" ? " on" : "") + '" role="radio" aria-checked="' + (cur === "shuffle") + '" data-jk="shuffle"><span class="ico">🔀</span><span><b>' + (J.mood ? CP.t("jk.rand", { m: mn[1] }) : CP.t("jk.all")) + '</b><i>' + CP.t("jk.cycle") + '</i></span></button>';
    pool().forEach(function (t) {
      h += '<button type="button" class="jk-it' + (cur === t.id ? " on" : "") + '" role="radio" aria-checked="' + (cur === t.id) + '" data-jk="' + t.id + '"><span class="ico">' + t.ico + '</span><span><b>' + esc(nm(t)) + '</b><i>' + esc(ds(t)) + "</i></span></button>";
    });
    return h + "</div>";
  }
  function left() { var ms = Math.max(0, slot() - (Date.now() - J.slotAt)), m = Math.floor(ms / 60000), sec = Math.floor(ms / 1000) % 60; return m + ":" + (sec < 10 ? "0" : "") + sec; }
  function nowLine() {
    var t = BYID[J.curId];
    if (!J.want) return CP.t("jk.nowOff");
    if (J.hold) return CP.t("jk.nowHold");
    if (!t) return CP.t("jk.nowWait");
    var st = CP.audioFile && t.file ? CP.audioFile.state(t.id) : "";
    if (st === "file") return CP.t("jk.errFile");
    if (st === "err") return CP.t("jk.err");
    if (st === "loading") return CP.t("jk.loading", { t: t.ico + " " + esc(nm(t)) });
    return CP.t("jk.now", { t: t.ico + " " + esc(nm(t)) }) + (J.sel === "shuffle" && J.run ? ' <span class="muted">· ' + CP.t("jk.left", { t: left() }) + "</span>" : "");
  }
  function popHTML() {
    return '<div class="jk-card"><div class="jk-h"><b>' + CP.t("jk.music") + '</b><button type="button" class="btn-s" data-jk-close aria-label="' + CP.attr(CP.t("common.close")) + '">✕</button></div>' +
      '<p class="small muted jk-now" id="jk-now" aria-live="polite">' + nowLine() + "</p>" +
      '<div class="acts" style="margin:0 0 8px"><button type="button" class="btn-main" data-jk-toggle style="flex:1">' + (J.want ? CP.t("jk.stopLong") : CP.t("jk.startLong")) + '</button><button type="button" class="btn-s" data-jk-next' + (J.want ? "" : " disabled") + '>' + CP.t("jk.next") + '</button></div>' +
      '<label class="jk-vol small muted">' + CP.t("jk.music") + ' <input type="range" min="0.1" max="1" step="0.05" value="' + J.vol + '" data-jk-vol></label>' +
      '<label class="jk-vol small muted">' + CP.t("jk.fx") + ' <input type="range" min="0" max="1" step="0.05" value="' + (CP.bus ? CP.bus.sfxVol() : 0.7) + '" data-sfx-vol></label>' +
      '<label class="chk small"><input type="checkbox" data-jk-auto' + (J.auto ? " checked" : "") + '> ' + CP.t("jk.auto") + '</label>' +
      offLine() + moodPills() + list() + "</div>";
  }
  /* offline: sul sito i brani si salvano sul telefono al primo ascolto, oppure tutti insieme; nell'APK sono già dentro */
  function fileIds() { return TRACKS.filter(function (t) { return t.file; }).map(function (t) { return t.id; }); }
  function offLine() {
    if (!CP.audioFile || CP.audioFile.fileProto || window.MandarinoAndroid || !("serviceWorker" in navigator)) return "";
    return '<div class="jk-off small muted" id="jk-off">' + (DL ? esc(CP.t("jk.dling", { n: DL.n, tot: DL.tot })) : "") + "</div>";
  }
  function paintOff() {
    var box = document.getElementById("jk-off"); if (!box || DL) return;
    CP.audioFile.offline().then(function (have) {
      if (!have) { box.textContent = ""; return; }
      var ids = fileIds(), n = ids.filter(function (id) { return have[id]; }).length;
      if (n === ids.length) { box.textContent = CP.t("jk.offAll", { tot: ids.length }); return; }
      box.innerHTML = esc(CP.t("jk.off1", { n: n, tot: ids.length })) + ' <button type="button" class="btn-s" data-jk-dl>' + esc(CP.t("jk.dl", { mb: Math.max(1, Math.round(MB * (ids.length - n) / ids.length)) })) + "</button>";
    });
  }
  function downloadAll() {
    var ids = fileIds(), box = document.getElementById("jk-off");
    DL = { n: 1, tot: ids.length }; if (box) box.textContent = CP.t("jk.dling", DL);
    CP.audioFile.downloadAll(ids, function (done, fail, tot) {
      DL.n = Math.min(tot, done + fail + 1); var b = document.getElementById("jk-off"); if (b) b.textContent = CP.t("jk.dling", { n: DL.n, tot: tot });
    }).then(function (r) {
      DL = null; paintOff();
      if (r.fail && CP.toast) CP.toast(CP.t("jk.dlFail", { n: r.fail }));
    }, function () { DL = null; paintOff(); });
  }
  function paint() {
    var n = document.getElementById("jk-now"); if (n) n.innerHTML = nowLine();
    var box = document.getElementById("jk-sel"); if (box) box.innerHTML = list("compact");
    if (!pop.hidden) { pop.querySelectorAll(".jk-it").forEach(function (b) { var on = b.getAttribute("data-jk") === J.sel; b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false"); }); }
  }
  function openPop() { pop.innerHTML = popHTML(); paintOff(); CP.trap(pop, closePop); var f = pop.querySelector("[data-jk-toggle]"); if (f) f.focus(); }
  if (CP.audioFile) CP.audioFile.onState(function (id, s) { if (id === J.curId) { if (s === "ok") J.slotAt = Date.now(); paint(); } if (s === "ok" && !pop.hidden) paintOff(); });
  function closePop() { CP.untrap(pop); }
  function toggle() {
    J.want = !J.want; lset("cp-music", J.want ? "1" : "0");
    if (J.want && !CP.pref.sfx) CP.setPref("sfx", true);
    CP.musicApply(); if (!pop.hidden) { pop.innerHTML = popHTML(); paintOff(); }
  }
  function choose(id) {
    J.sel = id; lset("cp-track", id);
    if (!J.want) { J.want = true; lset("cp-music", "1"); if (!CP.pref.sfx) CP.setPref("sfx", true); }
    if (J.run) { if (id === "shuffle") { J.order = shuffleOrder(J.curId); J.pos = 0; play(J.order[0]); } else play(id); } else CP.musicApply();
    CP.sfx("tap"); paint(); if (!pop.hidden) { pop.innerHTML = popHTML(); paintOff(); }
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    if (b.hasAttribute("data-jk-mood")) {
      J.mood = b.getAttribute("data-jk-mood"); lset("cp-jkmood", J.mood); CP.sfx("tap");
      if (J.sel === "shuffle") { J.order = shuffleOrder(J.curId); J.pos = 0; if (J.run && BYID[J.curId] && J.mood && BYID[J.curId].mood !== J.mood) play(J.order[0]); }
      if (!pop.hidden) { pop.innerHTML = popHTML(); paintOff(); } paint(); return;
    }
    if (b.hasAttribute("data-jk")) choose(b.getAttribute("data-jk"));
    else if (b.hasAttribute("data-jk-close")) closePop();
    else if (b.hasAttribute("data-jk-dl")) downloadAll();
    else if (b.hasAttribute("data-jk-toggle")) toggle();
    else if (b.hasAttribute("data-jk-next")) { if (J.sel === "shuffle") next(); else { var i = (TRACKS.map(function (t) { return t.id; }).indexOf(J.sel) + 1) % TRACKS.length; choose(TRACKS[i].id); } paint(); }
  }
  pop.addEventListener("click", function (e) { if (e.target === pop) closePop(); else onClick(e); });
  pop.addEventListener("input", function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute("data-jk-vol")) { J.vol = parseFloat(e.target.value); lset("cp-musicvol", String(J.vol)); if (J.bus) J.bus.gain.value = 0.34 * J.vol; }
    if (e.target.hasAttribute && e.target.hasAttribute("data-sfx-vol") && CP.bus) { CP.bus.setSfxVol(parseFloat(e.target.value)); }
  });
  pop.addEventListener("change", function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute("data-sfx-vol")) CP.sfx("tap");
    if (e.target.hasAttribute && e.target.hasAttribute("data-jk-auto")) { J.auto = e.target.checked; lset("cp-jkauto", J.auto ? "1" : "0"); }
  });
  /* il conto alla rovescia del cambio traccia si aggiorna mentre il pannello è aperto */
  setInterval(function () { if (!pop.hidden && J.run) { var n = document.getElementById("jk-now"); if (n) n.innerHTML = nowLine(); } }, 1000);
  document.getElementById("vset-body").addEventListener("click", onClick);
  mus.addEventListener("click", function () {
    if (!J.want) { J.want = true; lset("cp-music", "1"); if (!CP.pref.sfx) CP.setPref("sfx", true); CP.musicApply(); }
    openPop();
  });
  CP.jukeboxOpen = openPop;
  CP.jukeboxUI = function () {
    return '<div class="vab" id="jk-box"><div class="small" style="font-weight:700">' + CP.t("jk.title") + '</div><p class="small muted" style="margin:2px 0 6px" id="jk-now2">' + CP.t("jk.hint") + '</p><details class="jk-det"><summary>' + CP.t("jk.choose") + '</summary><div id="jk-sel">' + list("compact") + '</div></details><div class="acts"><button type="button" class="btn-s" data-jk-toggle>' + (J.want ? CP.t("jk.stop") : CP.t("jk.start")) + "</button></div></div>";
  };
  document.addEventListener("visibilitychange", CP.musicApply);
  if (J.want) document.addEventListener("pointerdown", function () { setTimeout(CP.musicApply, 50); }, { once: true, capture: true, passive: true });
  var L = CP.listen;
  if (L) CP.listen = function (t, cb) {
    CP.musicHold(true); var done = false;
    var r = L.call(CP, t, function (o) { if (!done) { done = true; CP.musicHold(false); } cb(o); });
    if (!r && !done) { done = true; CP.musicHold(false); }
    return r;
  };
  CP.musicApply();
})();

