/* ===== màndarínō · il flusso del benvenuto (caricato al primo uso: lo apre ui/welcome.js). Benvenuto una volta sola (corso di cinese: cp-ux-v1.onboarded; corso di italiano: cp-it-welcome).
   Un flusso a schermo pieno, uguale per i due corsi (cambiano i testi e la prima prova):
     1. intro animata (al massimo 6 s, senza «salta»: logo e wordmark, à í ō prendono il colore del loro tono; con
        prefers-reduced-motion è ferma);
     2. le porte: «Parto da zero», «Conosco già le basi», «Ho già un backup o un altro dispositivo»; in piccolo, l'altro corso;
     3. lo scopo (facoltativo: suggerisce l'obiettivo e resta sul dispositivo);
     a. da zero: obiettivo, primo successo in meno di un minuto (cinese: i quattro toni di 妈 麻 马 骂; italiano: l'accento di
        ciao / grazie / buongiorno), poi la prima carta;
     b. le basi: cinque domande su di sé, il test (ui/placement.js), il livello proposto che si può correggere, la conferma;
     c. un altro dispositivo: niente test, direttamente a sincronizzazione, QR o backup (pwa/sync.js, pwa/qr-transfer.js).
   CP.onboarding.open(passo) lo riapre (⚙️ → «Rifai il test di livello»). Un'azione primaria per schermata. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var IT = lsGet("cp-course") === "it", C = IT ? "it" : "zh";
  var GOALS = [5, 10, 20], PURPOSE = { travel: 10, work: 10, exam: 20, family: 10, curious: 5 };
  var st = { goal: 10, purpose: null, path: null, decl: [-1, -1, -1, -1, -1], r: 1, est: 0 };
  var box = null;
  function reduce() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function done() { return IT ? !!lsGet("cp-it-welcome") : !!CP.ux.get("onboarded"); }
  function markDone() { if (IT) lsSet("cp-it-welcome", "1"); else CP.ux.set("onboarded", 1); }
  function L(k, v) { return T(k, Object.assign({ l: T(IT ? "onb.lIt" : "onb.lZh") }, v || {})); }

  function open(step) {
    if (!box) {
      box = document.createElement("div"); box.id = "onb"; box.className = "onb"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", T("onb.aria"));
      document.body.appendChild(box);
      box.addEventListener("click", onClick);
    }
    CP.trap(box, function () { if (!/^(intro|test)$/.test(cur)) later(); });
    document.body.classList.add("in-onb");
    go(step || (sessionIntro() ? "door" : "intro"));
  }
  function close() { if (!box) return; CP.untrap(box); document.body.classList.remove("in-onb"); box.innerHTML = ""; }
  function sessionIntro() { try { return sessionStorage.getItem("md-intro") === "1"; } catch (e) { return false; } }
  var cur = "", timer = 0;
  function go(step) {
    cur = step; clearTimeout(timer);
    box.innerHTML = '<div class="onb-in">' + SCREENS[step]() + "</div>";
    box.scrollTop = 0;
    if (step === "intro") {
      try { sessionStorage.setItem("md-intro", "1"); } catch (e) {}
      timer = setTimeout(function () { go("door"); }, reduce() ? 1600 : 3800);   /* sempre sotto i 6 s */
    } else CP.focusFirst(box);
    if (step === "test") startTest();
  }
  function later() { markDone(); close(); }

  /* ---- le schermate ---- */
  function wordmark() {
    return '<div class="onb-wm" aria-hidden="true">m<span class="wm-t4">à</span>ndar<span class="wm-t2">í</span>n<span class="wm-t1">ō</span></div>';
  }
  function choice(attr, val, on, label) { return '<button type="button" ' + attr + '="' + val + '"' + (on ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + label + "</button>"; }
  var SCREENS = {
    intro: function () {
      return '<div class="onb-intro' + (reduce() ? " still" : "") + '"><svg class="onb-logo" viewBox="300 30 200 200" aria-hidden="true" focusable="false"><use href="#mandarin-symbol"/></svg>' + wordmark() +
        '<p class="onb-sub">' + esc(L("onb.tag")) + '</p><span class="sr">màndarínō</span></div>';
    },
    door: function () {
      var other = IT ? '<button type="button" class="onb-link" data-course-set="zh" lang="it">🇮🇹 Voglio imparare il cinese</button>' : '<button type="button" class="onb-link" data-course-set="it" lang="zh-CN">🇨🇳 我是中国人，我想学意大利语</button>';
      return '<div class="onb-head"><svg class="onb-mini" viewBox="300 30 200 200" aria-hidden="true" focusable="false"><use href="#mandarin-symbol"/></svg><h2>' + esc(L("onb.hello")) + "</h2><p>" + esc(L("onb.helloSub")) + "</p></div>" +
        '<div class="onb-doors">' +
        door("zero", "🌱", L("onb.zero"), L("onb.zeroSub")) + door("basics", "🧭", L("onb.basics"), L("onb.basicsSub")) + door("have", "📲", L("onb.have"), L("onb.haveSub")) + "</div>" +
        '<div class="onb-foot">' + other + '<button type="button" class="onb-link" data-onb-later>' + esc(T("onb.later")) + "</button></div>";
    },
    purpose: function () {
      return '<div class="onb-head"><h2>' + esc(L("onb.why")) + "</h2><p>" + esc(T("onb.whySub")) + '</p></div><div class="onb-chips" role="group" aria-label="' + CP.attr(L("onb.why")) + '">' +
        Object.keys(PURPOSE).map(function (p) { return choice("data-onb-purpose", p, st.purpose === p, esc(T("onb.p." + p))); }).join("") + "</div>" +
        '<button type="button" class="btn-main" data-onb-next="' + (st.path === "zero" ? "goal" : "declare") + '">' + esc(T(st.purpose ? "onb.next" : "onb.skip")) + "</button>" + back("door");
    },
    goal: function () {
      return '<div class="onb-head"><h2>' + esc(T("onb.goal")) + "</h2><p>" + esc(T("onb.goalSub")) + '</p></div><div class="welcome-goal" role="group" aria-label="' + CP.attr(T("onb.goal")) + '">' +
        GOALS.map(function (n) { return choice("data-onb-goal", n, st.goal === n, n); }).join("") + '</div><p class="small muted">' + esc(T("onb.goalHint", { n: st.goal, m: Math.max(3, Math.round(st.goal * 0.9)) })) + "</p>" +
        '<button type="button" class="btn-main" data-onb-next="' + (st.path === "zero" ? "first" : "finish") + '">' + esc(T(st.path === "zero" ? "onb.next" : "onb.start")) + "</button>" + back(st.path === "zero" ? "purpose" : "result");
    },
    first: function () { return IT ? firstIt() : firstZh(); },
    declare: function () {
      var rows = [0, 1, 2, 3, 4].map(function (i) {
        return '<div class="onb-decl"><b>' + esc(T("onb.d" + i + (IT ? "it" : ""))) + '</b><div class="seg" role="group" aria-label="' + CP.attr(T("onb.d" + i + (IT ? "it" : ""))) + '">' +
          [0, 1, 2, 3].map(function (v) { return choice("data-onb-decl", i + ":" + v, st.decl[i] === v, esc(T("onb.s" + v))); }).join("") + "</div></div>";
      }).join("");
      var all = st.decl.every(function (x) { return x >= 0; });
      return '<div class="onb-head"><h2>' + esc(T("onb.declT")) + "</h2><p>" + esc(T("onb.declSub")) + "</p></div>" + rows +
        '<button type="button" class="btn-main" data-onb-next="test"' + (all ? "" : " disabled") + ">" + esc(T("onb.testGo")) + "</button>" + back("purpose");
    },
    test: function () { return '<div class="onb-test" id="onb-test"></div>'; },
    result: function () {
      var n = CP.placement.preview(C, st.r), h;
      if (IT) h = st.r ? T("onb.resIt", { l: st.r, n: st.r + 1 }) : T("onb.resIt0");
      else h = st.r <= 1 ? T("onb.resZh1") : T("onb.resZh", { k: st.r - 1, r: st.r });
      var dv = st.decl.filter(function (x) { return x >= 0; }), avg = dv.length ? dv.reduce(function (a, b) { return a + b; }, 0) / dv.length : 0, decl = CP.placement.PL.startOf(C, st.decl);
      var cmp = st.r > decl + (IT ? 3 : 0) ? "onb.cmpMore" : st.r < decl - (IT ? 3 : 1) ? "onb.cmpLess" : "onb.cmpSame";
      var max = IT ? 30 : 6, min = IT ? 0 : 1;
      return '<div class="onb-head"><h2>' + esc(T("onb.resT")) + "</h2><p>" + esc(T(cmp)) + "</p></div>" +
        '<div class="panel onb-res"><p style="margin:0"><b>' + esc(h) + "</b></p>" + (n ? '<p class="small muted" style="margin:6px 0 0">' + esc(T(IT ? "onb.resNIt" : "onb.resN", { n: n })) + "</p>" : "") +
        '<div class="onb-step" role="group" aria-label="' + CP.attr(T("onb.adjust")) + '"><button type="button" class="btn-s" data-onb-r="-1"' + (st.r <= min ? " disabled" : "") + ' aria-label="' + CP.attr(T("onb.less")) + '">−</button><span>' + esc(T(IT ? "onb.stepIt" : "onb.stepZh", { r: st.r })) + '</span><button type="button" class="btn-s" data-onb-r="1"' + (st.r >= max ? " disabled" : "") + ' aria-label="' + CP.attr(T("onb.more")) + '">+</button></div>' +
        '<p class="small muted" style="margin:0">' + esc(T("onb.undoHint")) + "</p></div>" +
        '<button type="button" class="btn-main" data-onb-confirm>' + esc(T("onb.confirm")) + '</button><button type="button" class="btn-s" data-onb-next="declare">' + esc(T("onb.redo")) + "</button>";
    },
    have: function () {
      return '<div class="onb-head"><h2>' + esc(T("onb.haveT")) + "</h2><p>" + esc(T("onb.haveSub2")) + '</p></div><div class="onb-doors">' +
        door("h-sync", "☁️", T("onb.hSync"), T("onb.hSyncSub")) + door("h-qr", "📷", T("onb.hQr"), T("onb.hQrSub")) + door("h-file", "💾", T("onb.hFile"), T("onb.hFileSub")) + "</div>" + back("door");
    }
  };
  function door(id, ico, t, sub) { return '<button type="button" class="onb-door" data-onb-door="' + id + '"><span class="onb-dico" aria-hidden="true">' + ico + '</span><span><b>' + esc(t) + "</b><small>" + esc(sub) + "</small></span></button>"; }
  function back(to) { return '<button type="button" class="onb-link" data-onb-back="' + to + '">← ' + esc(T("onb.back")) + "</button>"; }

  /* ---- primo successo ---- */
  var TONES = [["妈", "mā", "onb.t1"], ["麻", "má", "onb.t2"], ["马", "mǎ", "onb.t3"], ["骂", "mà", "onb.t4"]], quiz = null;
  function firstZh() {
    if (!quiz) quiz = { a: Math.floor(Math.random() * 4), got: -1 };
    var cards = TONES.map(function (t, i) {
      return '<button type="button" class="onb-tone t' + (i + 1) + '" data-onb-say="' + t[0] + '"><span class="han" lang="zh-CN">' + t[0] + '</span><span class="py">' + CP.pinyinHTML(t[1]) + "</span>" + CP.toneCurveHTML(t[1]) + "<small>" + esc(T(t[2])) + "</small></button>";
    }).join("");
    var q = quiz.got < 0 ? '<p><b>' + esc(T("onb.toneQ")) + '</b></p><button type="button" class="btn-s" data-onb-say="' + TONES[quiz.a][0] + '" data-onb-q>🔊 ' + esc(T("onb.toneAgain")) + '</button><div class="onb-chips">' + TONES.map(function (t, i) { return '<button type="button" data-onb-tq="' + i + '"><span class="han" lang="zh-CN">' + t[0] + "</span> " + CP.pinyinHTML(t[1]) + "</button>"; }).join("") + "</div>"
      : '<p class="verdict ' + (quiz.got === quiz.a ? "ok" : "") + '">' + esc(T(quiz.got === quiz.a ? "onb.toneOk" : "onb.toneNo", { c: TONES[quiz.a][0] + " " + TONES[quiz.a][1] })) + "</p>";
    return '<div class="onb-head"><h2>' + esc(T("onb.tonesT")) + "</h2><p>" + esc(T("onb.tonesSub")) + '</p></div><div class="onb-tones">' + cards + "</div>" + q +
      '<button type="button" class="btn-main" data-onb-next="finish"' + (quiz.got < 0 ? " disabled" : "") + ">" + esc(T("onb.firstCard")) + "</button>";
  }
  var WORDS_IT = [["ciao", "CIA·o", "你好；再见"], ["grazie", "GRA·zie", "谢谢"], ["buongiorno", "buon·GIOR·no", "早上好"]];
  function firstIt() {
    if (!quiz) quiz = { got: -1 };
    var cards = WORDS_IT.map(function (w) {
      var syl = w[1].split("·").map(function (s) { return s === s.toUpperCase() ? "<b>" + esc(s.toLowerCase()) + "</b>" : esc(s); }).join("·");
      return '<button type="button" class="onb-tone" data-onb-sayit="' + w[0] + '"><span class="onb-it" lang="it">' + syl + "</span><small>" + esc(w[2]) + " 🔊</small></button>";
    }).join("");
    var opts = ["buon", "gior", "no"];
    var q = quiz.got < 0 ? '<p><b>' + esc(T("onb.stressQ")) + '</b></p><div class="onb-chips">' + opts.map(function (o, i) { return '<button type="button" data-onb-sq="' + i + '" lang="it">' + o + "</button>"; }).join("") + "</div>"
      : '<p class="verdict ' + (quiz.got === 1 ? "ok" : "") + '">' + esc(T(quiz.got === 1 ? "onb.stressOk" : "onb.stressNo")) + "</p>";
    return '<div class="onb-head"><h2>' + esc(T("onb.stressT")) + "</h2><p>" + esc(T("onb.stressSub")) + '</p></div><div class="onb-tones it">' + cards + "</div>" + q +
      '<button type="button" class="btn-main" data-onb-next="finish"' + (quiz.got < 0 ? " disabled" : "") + ">" + esc(T("onb.firstCard")) + "</button>";
  }

  /* ---- il test ---- */
  function startTest() {
    var el = document.getElementById("onb-test");
    CP.placement.run(el, C, st.decl, function (s) { st.est = CP.placement.PL.estimate(s); st.r = CP.placement.PL.result(s); go("result"); });
  }

  /* ---- fine ---- */
  function finish() {
    markDone();
    if (st.purpose) CP.ux.set("purpose", st.purpose);
    if (CP.game && CP.game.setGoal) CP.game.setGoal(st.goal);
    if (!IT && CP.studyCfg) CP.studyCfg({ n: st.goal });
    close();
    if (IT) { if (CP.itShow) CP.itShow(st.path === "zero" ? "review" : "lessons"); return; }
    if (st.path === "zero") { CP.show("study"); if (CP.studyStart) CP.studyStart(); }
    else CP.show("path");
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b || b.disabled) return;
    var a = function (n) { return b.getAttribute(n); };
    if (b.hasAttribute("data-course-set")) return;   /* lo gestisce il corso (it/course.js): ricarica la pagina */
    if (b.hasAttribute("data-onb-later")) { CP.sfx("tap"); later(); return; }
    if (a("data-onb-back")) { CP.sfx("tap"); go(a("data-onb-back")); return; }
    if (a("data-onb-door")) {
      var d = a("data-onb-door"); CP.sfx("tap");
      if (d === "zero" || d === "basics") { st.path = d; go("purpose"); return; }
      if (d === "have") { go("have"); return; }
      /* chi arriva da un altro dispositivo non rifà il benvenuto né il test, e ritrova tutte le schede */
      if (CP.unlock) CP.unlock.unlockAll(); markDone(); close();
      if (d === "h-qr" && CP.qrReceive) CP.qrReceive();
      else CP.openSettings(d === "h-sync" ? "set-sync" : "set-data");
      return;
    }
    if (a("data-onb-purpose")) { st.purpose = a("data-onb-purpose"); st.goal = PURPOSE[st.purpose]; CP.sfx("tap"); go("purpose"); return; }
    if (a("data-onb-goal")) { st.goal = +a("data-onb-goal"); CP.sfx("tap"); go("goal"); return; }
    if (a("data-onb-decl")) { var p = a("data-onb-decl").split(":"); st.decl[+p[0]] = +p[1]; CP.sfx("tap"); go("declare"); var r = box.querySelectorAll(".onb-decl")[+p[0] + 1]; if (r) r.scrollIntoView({ block: "nearest" }); return; }
    if (a("data-onb-r")) { var mx = IT ? 30 : 6, mn = IT ? 0 : 1; st.r = Math.max(mn, Math.min(mx, st.r + +a("data-onb-r"))); CP.sfx("tap"); go("result"); return; }
    if (b.hasAttribute("data-onb-confirm")) { CP.placement.apply(C, st.r, st.decl.slice(), st.est); CP.sfx("ok"); go("goal"); return; }
    if (a("data-onb-say")) { CP.speak(a("data-onb-say"), { el: b, rate: 0.8 }); return; }
    if (a("data-onb-sayit")) { CP.speak(a("data-onb-sayit"), { lang: "it-IT", el: b, voiceURI: CP.itVoiceURI ? CP.itVoiceURI() : "" }); return; }
    if (a("data-onb-tq") !== null) { quiz.got = +a("data-onb-tq"); CP.sfx(quiz.got === quiz.a ? "ok" : "tap"); go("first"); return; }
    if (a("data-onb-sq") !== null) { quiz.got = +a("data-onb-sq"); CP.sfx(quiz.got === 1 ? "ok" : "tap"); go("first"); return; }
    if (a("data-onb-next")) { var n = a("data-onb-next"); CP.sfx("tap"); if (n === "finish") finish(); else go(n); }
  }

  CP.onboarding = { open: open, redoTest: function () { st.path = "basics"; open("declare"); }, isOpen: function () { return !!box && !box.hidden; }, done: done };
})();
