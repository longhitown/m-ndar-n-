/* ===== V4c: orecchio ai toni e sfida di 60 secondi (dentro "Studia") ===== */
(function () {
  var CP = window.CP, esc = CP.esc, root = CP.studyRoot, W = CP.WORDS;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var mode = null;      /* "ear" | "sprint" | null */

  /* ================= orecchio ================= */
  var ROUNDS = 10, ear = null, TONE_NAMES = { 1: CP.t("tone.1"), 2: CP.t("tone.2"), 3: CP.t("tone.3"), 4: CP.t("tone.4") }, T = CP.t;
  function earPool() {
    return CP.ORDER.map(function (k) { return W[k]; }).filter(function (w) {
      return Array.from(w.hz).length === 1 && CP.syllables(w.py).length === 1 && CP.tone(w.py) <= 4 && !(CP.POLY && CP.POLY.has(w.hz));
    });
  }
  function baseOf(w) { return CP.baseSyl(w.py); }
  function earStart() {
    var pool = earPool(), groups = {};
    pool.forEach(function (w) { (groups[baseOf(w)] = groups[baseOf(w)] || []).push(w); });
    var paired = pool.filter(function (w) { return groups[baseOf(w)].some(function (o) { return CP.tone(o.py) !== CP.tone(w.py); }); });
    ear = { n: 0, ok: 0, groups: groups, paired: paired, pool: pool, q: null, answered: false, used: {} };
    mode = "ear"; root.classList.remove("is-card"); CP.focusMode(true); earNext();
  }
  function earNext() {
    if (ear.n >= ROUNDS) return earDone();
    var src = (ear.paired.length && Math.random() < 0.65) ? ear.paired : ear.pool, w, tries = 0;
    do { w = pick(src); tries++; } while (ear.used[w.key] && tries < 30);
    ear.used[w.key] = 1; ear.q = w; ear.answered = false; ear.picked = 0;
    earRender();
    CP.speak(w.hz, { rate: Math.min(CP.pref.rate, 0.9) });
  }
  function toneBtns() {
    return [1, 2, 3, 4].map(function (t) {
      var sample = ["mā", "má", "mǎ", "mà"][t - 1];
      var st = "";
      if (ear.answered) st = (t === CP.tone(ear.q.py)) ? " right" : (t === ear.picked ? " wrong" : "");
      return '<button type="button" class="t' + t + st + '" data-etone="' + t + '"' + (ear.answered ? " disabled" : "") + ' aria-label="' + CP.attr(T("ear.toneN", { n: t }) + ", " + TONE_NAMES[t]) + '">' + CP.toneCurveHTML(sample) + "<span>" + t + "° · " + TONE_NAMES[t] + "</span></button>";
    }).join("");
  }
  function earRender() {
    var w = ear.q, pct = Math.round(ear.n / ROUNDS * 100), h = '<div class="sess"><button type="button" class="btn-quiet" id="m-quit">' + T("fx.leave") + "</button>" +
      '<div class="meter" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i class="k" style="width:' + pct + '%"></i></div><span class="cnt">' + ear.n + " / " + ROUNDS + "</span></div>";
    h += '<div class="panel fc"><span class="tag">' + T("ear.q") + "</span>" +
      '<button type="button" class="btn-main" style="margin:0;max-width:260px" data-eplay>🔊 ' + T("ear.again") + "</button>";
    if (ear.answered) {
      var t = CP.tone(w.py), right = ear.picked === t;
      h += '<p class="verdict ' + (right ? "ok" : "ko") + '" style="width:100%;text-align:left">' + (right ? T("ex.right") : T("ear.was", { n: t, name: TONE_NAMES[t] })) + "</p>" +
        '<div class="cd-py">' + CP.pinyinHTML(w.py) + '</div><div class="cd-hz" lang="zh-CN">' + CP.hanziHTML(w.hz, w.py) + '</div><div class="cd-it" style="font-size:20px" lang="it">' + esc(w.it) + "</div>";
      var mates = (ear.groups[baseOf(w)] || []).filter(function (o) { return CP.tone(o.py) !== t; }).slice(0, 3);
      if (mates.length) {
        h += '<div class="cd-ex"><span class="tag">' + T("ear.mates") + "</span>" + mates.map(function (o) {
          return '<div class="fw"><div class="lp">' + CP.pinyinHTML(o.py) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(o.hz, o.py) + '</div><div class="small muted" lang="it">' + esc(o.it) + "</div>" + CP.audioBtns(o.hz, true) + "</div>";
        }).join("") + "</div>";
      }
    }
    h += '<div class="tonebtns">' + toneBtns() + "</div>";
    if (ear.answered) {
      h += '<div class="acts cardacts">' + (CP.canScope && CP.canScope() ? '<button type="button" data-scope="' + CP.attr(w.key) + '">〰️ ' + T("ear.scope") + "</button>" : "") + "</div>" +
        '<button type="button" class="btn-main" id="e-next" style="margin-top:0">' + T(ear.n >= ROUNDS ? "ear.result" : "common.next") + "</button>";
    }
    h += "</div>";
    root.innerHTML = h; window.scrollTo(0, 0);
  }
  function earAnswer(t) {
    if (ear.answered) return;
    var right = t === CP.tone(ear.q.py);
    ear.answered = true; ear.picked = t; ear.n++; if (right) ear.ok++;
    CP.sfx(right ? "ok" : "ko"); CP.game.ear(right);
    if (CP.confuse) CP.confuse(CP.tone(ear.q.py), t, ear.q.key);
    earRender();
  }
  function earDone() {
    mode = null; CP.focusMode(false);
    root.innerHTML = '<h2 style="margin-top:20px">' + T("ear.title") + '</h2><div class="stats"><div class="stat"><b>' + ear.ok + "/" + ROUNDS + "</b><span>" + T("ear.okN") + "</span></div></div>" +
      '<p class="muted">' + T(ear.ok >= 9 ? "ear.r9" : ear.ok >= 6 ? "ear.r6" : "ear.r0") + "</p>" +
      '<button type="button" class="btn-main" id="ear-open">' + T("ex.again") + '</button><button type="button" class="btn-main btn-quiet" id="m-quit" style="margin-top:10px">' + T("ear.back") + "</button>";
    window.scrollTo(0, 0);
  }

  /* ================= sfida 60 secondi ================= */
  var SP = null, sprintTimer = 0;
  function sprintPool() {
    var started = CP.ORDER.filter(function (k) { return CP.state(k) >= 1; });
    return (started.length >= 12 ? started : CP.ORDER.slice(0, 300)).map(function (k) { return W[k]; });
  }
  function shortGloss(w) { var g = CP.gloss(w); return g.length > 38 ? g.slice(0, 36) + "…" : g; }
  function sprintStart() {
    CP.stopSpeak();
    SP = { pool: sprintPool(), pts: 0, ok: 0, ko: 0, streak: 0, bestStreak: 0, t0: Date.now(), dur: 60000, q: null, lock: false, last: null };
    mode = "sprint"; root.classList.remove("is-card"); CP.focusMode(true); sprintQ();
    if (CP.musicMood) CP.musicMood("energy");
    clearInterval(sprintTimer); sprintTimer = setInterval(sprintTick, 100);
  }
  function mult() { return SP.streak >= 6 ? 3 : SP.streak >= 3 ? 2 : 1; }
  function sprintQ() {
    var w, tries = 0;
    do { w = pick(SP.pool); tries++; } while (SP.last === w.key && tries < 20);
    SP.last = w.key;
    var same = CP.ORDER.map(function (k) { return W[k]; }).filter(function (o) { return o.sec === w.sec && o.key !== w.key && CP.gloss(o) !== CP.gloss(w); });
    var others = CP.ORDER.map(function (k) { return W[k]; }).filter(function (o) { return o.key !== w.key && CP.gloss(o) !== CP.gloss(w); });
    var ds = [];
    shuffle(same).slice(0, 2).concat(shuffle(others)).forEach(function (o) {
      if (ds.length < 3 && !ds.some(function (d) { return CP.gloss(d) === CP.gloss(o); })) ds.push(o);
    });
    SP.q = { w: w, opts: shuffle([w].concat(ds)) }; SP.lock = false;
    sprintRender();
    if (CP.pref.auto) CP.speak(CP.sayHz(w), { rate: 1 });
  }
  function sprintRender() {
    var left = Math.max(0, SP.dur - (Date.now() - SP.t0)), w = SP.q.w, m = mult();
    root.innerHTML = '<div class="sprint-top"><button type="button" class="btn-quiet" id="m-quit" style="min-height:44px">' + T("fx.leave") + '</button><span class="pts" id="sp-pts">' + SP.pts + '</span><span class="combo" id="sp-combo">' + (m > 1 ? "×" + m : "") + '</span><span id="sp-time">' + Math.ceil(left / 1000) + ' s</span></div>' +
      '<div class="timebar" aria-hidden="true"><i id="sp-bar" style="width:' + (left / SP.dur * 100) + '%"></i></div>' +
      '<div class="panel fc"><div class="cd-hz" lang="zh-CN" style="font-size:calc(var(--hz)*2.4)">' + CP.hanziHTML(w.hz, w.py) + '</div><div class="cd-py">' + CP.pinyinHTML(w.py) + "</div>" +
      '<div class="btns">' + CP.sayBtn(CP.sayHz(w)) + '</div>' +
      '<div class="choices">' + SP.q.opts.map(function (o, i) { return '<button type="button" data-sp="' + i + '">' + '<span lang="it">' + esc(shortGloss(o)) + "</span></button>"; }).join("") + "</div></div>" +
      '<p class="kbd-hint">' + T("sp.kbd") + "</p>";
  }
  function sprintTick() {
    if (mode !== "sprint" || !SP) { clearInterval(sprintTimer); return; }
    if (document.getElementById("view-study").hidden) { clearInterval(sprintTimer); mode = null; SP = null; return; }
    var left = Math.max(0, SP.dur - (Date.now() - SP.t0));
    var bar = document.getElementById("sp-bar"), tm = document.getElementById("sp-time");
    if (bar) bar.style.width = (left / SP.dur * 100) + "%";
    if (tm) tm.textContent = Math.ceil(left / 1000) + " s";
    if (left <= 0) sprintDone();
  }
  function sprintAnswer(i) {
    if (!SP || SP.lock) return;
    var o = SP.q.opts[i], right = o.key === SP.q.w.key, btns = root.querySelectorAll("[data-sp]");
    SP.lock = true;
    if (right) {
      SP.streak++; SP.bestStreak = Math.max(SP.bestStreak, SP.streak); SP.ok++; SP.pts += 10 * mult();
      CP.sfx("ok", Math.min(5, SP.streak - 1));
    } else { SP.streak = 0; SP.ko++; CP.sfx("ko"); }
    Array.prototype.forEach.call(btns, function (b, j) {
      var jo = SP.q.opts[j];
      if (jo.key === SP.q.w.key) b.classList.add("right"); else if (j === i) { b.classList.add("wrong", "shake"); }
    });
    var pts = document.getElementById("sp-pts"), cb = document.getElementById("sp-combo");
    if (pts) pts.textContent = SP.pts; if (cb) cb.textContent = mult() > 1 ? "×" + mult() : "";
    setTimeout(function () { if (mode === "sprint" && SP) { if (Date.now() - SP.t0 >= SP.dur) sprintDone(); else sprintQ(); } }, right ? 280 : 650);
  }
  function sprintDone() {
    clearInterval(sprintTimer); if (!SP || mode !== "sprint") return;
    mode = null; CP.focusMode(false); var s = SP; CP.stopSpeak();
    var rec = CP.game.setBest(s.pts); CP.game.xp(s.ok * 2);
    root.innerHTML = '<h2 style="margin-top:20px">' + T("sp.time") + '</h2><div class="stats"><div class="stat"><b>' + s.pts + "</b><span>" + T("sp.pts") + '</span></div><div class="stat"><b>' + s.ok + "</b><span>" + T("sp.ok") + '</span></div><div class="stat"><b>' + s.bestStreak + "</b><span>" + T("sp.best") + "</span></div></div>" +
      '<p class="' + (rec ? "verdict ok" : "muted") + '">' + (rec ? T("sp.rec", { n: s.pts }) : T("sp.recOld", { n: CP.game.best() })) + " " + T("sp.xp", { n: s.ok * 2 }) + "</p>" +
      '<button type="button" class="btn-main" id="sprint-open">' + T("sp.again") + '</button><button type="button" class="btn-main btn-quiet" id="m-quit" style="margin-top:10px">' + T("ear.back") + "</button>";
    SP = null; window.scrollTo(0, 0);
  }
  function quit() { clearInterval(sprintTimer); mode = null; SP = null; CP.stopSpeak(); CP.studyHome(); }

  root.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("button") : null; if (!t) return;
    if (t.id === "ear-open") { CP.sfx("tap"); earStart(); }
    else if (t.id === "sprint-open") { CP.sfx("tap"); sprintStart(); }
    else if (t.id === "m-quit") quit();
    else if (t.id === "e-next") { CP.sfx("tap"); earNext(); }
    else if (t.hasAttribute("data-eplay")) CP.speak(ear.q.hz, { rate: Math.min(CP.pref.rate, 0.9) });
    else if (t.hasAttribute("data-etone")) earAnswer(parseInt(t.getAttribute("data-etone"), 10));
    else if (t.hasAttribute("data-sp")) sprintAnswer(parseInt(t.getAttribute("data-sp"), 10));
  });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || document.getElementById("view-study").hidden || !document.getElementById("fam").hidden) return;
    var a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    if (mode === "sprint" && /^[1-4]$/.test(e.key)) { e.preventDefault(); sprintAnswer(parseInt(e.key, 10) - 1); }
    else if (mode === "ear" && ear && !ear.answered && /^[1-4]$/.test(e.key)) { e.preventDefault(); earAnswer(parseInt(e.key, 10)); }
    else if (mode === "ear" && ear && ear.answered && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); if (a && a.blur) a.blur(); earNext(); }
  });
  function cancelMode() { clearInterval(sprintTimer); mode = null; SP = null; ear = null; CP.focusMode(false); }
  var oldOnStudy = CP.onStudy;
  CP.onStudy = function () { if (mode) { cancelMode(); CP.studyHome(); return; } if (oldOnStudy) oldOnStudy(); };
  CP.mode = { sprint: sprintStart, ear: earStart, active: function () { return mode; } };
  CP.earPool = earPool;
})();
