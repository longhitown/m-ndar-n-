/* màndarínō · «Provala qui» / «试一试»: microprove nella pagina, nelle due lingue.
   Italiano: orecchio ai toni, scrittura dei caratteri, parole. 中文: 词语, 冠词, 听一听.
   Si carica da sola quando una delle sezioni sta per comparire (vedi sito.js), dopo hanzi-writer e confetti.
   Nessun dato esce dal browser e niente viene salvato. Dati dei caratteri: assets/dati/hanzi.json. Nessun suono parte da solo. */
(function () {
  var d = document, M = window.MDS || {}, secs = Array.prototype.slice.call(d.querySelectorAll(".try"));
  if (!secs.length) return;
  var calm = !!M.calm;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var css = function (v) { return getComputedStyle(d.documentElement).getPropertyValue(v).trim(); };
  var el = function (tag, cls, html) { var e = d.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function Score(sec) {
    var score = 0, out = $("[data-score]", sec);
    return {
      add: function (n) {
        score += n; if (out) { out.textContent = score; out.classList.remove("pop"); void out.offsetWidth; out.classList.add("pop"); }
        var f = $("[data-final]", sec); if (f && score > 0) f.hidden = false;
      }
    };
  }
  function party(node, big) {
    if (calm || !window.confetti) return;
    var r = node.getBoundingClientRect();
    window.confetti({ particleCount: big ? 120 : 50, spread: big ? 90 : 60, startVelocity: 32, ticks: 160,
      origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height * .35) / innerHeight },
      colors: ["#F37905", "#FFA41C", "#2EB88A", "#14594A", "#2D7DD2"], disableForReducedMotion: true });
  }

  /* una domanda a scelta multipla riusabile: render(q) dà il testo, opts le risposte, right quella giusta */
  function Quiz(host, sc, cfg) {
    var N = cfg.n || 5, q = 0, ok = 0, set = [], answered = false;
    function view() {
      host.innerHTML = ""; answered = false;
      var w = set[q], opts = cfg.options(w);
      host.appendChild(el("p", "q", cfg.counter(q + 1, N)));
      if (cfg.stem) host.appendChild(cfg.stem(w));
      var box = el("div", "opts" + (cfg.cls ? " " + cfg.cls : ""));
      opts.forEach(function (o) {
        var b = el("button", "opt", "<span>" + cfg.label(o) + "</span>"); b.type = "button";
        b.addEventListener("click", function () {
          if (answered) return; answered = true; var right = cfg.isRight(w, o);
          $$(".opt", box).forEach(function (x, k) { x.disabled = true; if (cfg.isRight(w, opts[k])) x.classList.add("good"); });
          if (!right) b.classList.add("bad"); else { ok++; sc.add(cfg.points || 4); }
          var fb = el("p", "fb", cfg.feedback(w, right)); fb.setAttribute("aria-live", "polite"); host.appendChild(fb);
          var nx = el("button", "btn small", q + 1 < N ? cfg.next : cfg.result); nx.type = "button";
          nx.addEventListener("click", function () { q++; if (q < N) view(); else end(); }); host.appendChild(nx); nx.focus({ preventScroll: true });
        }); box.appendChild(b);
      });
      host.appendChild(box);
    }
    function end() {
      host.innerHTML = ""; host.appendChild(el("p", "big", ok + " / " + N));
      host.appendChild(el("p", "fb", ok === N ? cfg.perfect : cfg.ending));
      var a = el("button", "btn ghost small", cfg.again); a.type = "button"; a.addEventListener("click", start); host.appendChild(a);
      if (ok >= 4) party(host, ok === N);
    }
    function start() { q = 0; ok = 0; set = shuffle(cfg.pool).slice(0, N); view(); }
    start();
  }

  /* ====================== italiano ====================== */
  function toni(host, sc) {
    var SYL = [["ma", ["mā", "má", "mǎ", "mà"]], ["shi", ["shī", "shí", "shǐ", "shì"]], ["yi", ["yī", "yí", "yǐ", "yì"]], ["bao", ["bāo", "báo", "bǎo", "bào"]], ["tang", ["tāng", "táng", "tǎng", "tàng"]]];
    var CUR = { 1: "0,6 36,6", 2: "0,22 36,6", 3: "0,10 11,26 22,26 36,4", 4: "0,4 36,26" };
    var N = 5, round = 0, ok = 0, order = [], want = 0, answered = false;
    var svg = function (n) { return '<svg viewBox="-2 -2 40 32" width="40" height="32" aria-hidden="true"><polyline points="' + CUR[n] + '" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };
    function view() {
      host.innerHTML = "";
      host.appendChild(el("p", "q", "Round <b>" + (round + 1) + "</b> di " + N + " · sillaba «<b>" + SYL[order[round]][0] + "</b>»"));
      var play = el("button", "btn small pulse", "▶ Ascolta il tono"); play.type = "button";
      play.addEventListener("click", function () { play.classList.remove("pulse"); M.tone(want); });
      var opts = el("div", "opts tonopts");
      [1, 2, 3, 4].forEach(function (n) {
        var b = el("button", "opt", svg(n) + "<span>" + n + "° tono</span>"); b.type = "button"; b.dataset.n = n;
        b.addEventListener("click", function () { pick(b, n); }); opts.appendChild(b);
      });
      var fb = el("p", "fb"); fb.setAttribute("aria-live", "polite");
      host.appendChild(play); host.appendChild(opts); host.appendChild(fb);
    }
    function pick(b, n) {
      if (answered) return; answered = true;
      var right = n === want, fb = $(".fb", host);
      $$(".opt", host).forEach(function (x) { x.disabled = true; if (+x.dataset.n === want) x.classList.add("good"); });
      if (right) { ok++; sc.add(5); } else b.classList.add("bad");
      fb.innerHTML = (right ? "Esatto! " : "Quasi. ") + "È <b>" + SYL[order[round]][1][want - 1] + "</b>, " + want + "° tono.";
      var nx = el("button", "btn small", round + 1 < N ? "Avanti" : "Vedi il risultato"); nx.type = "button";
      nx.addEventListener("click", function () { round++; answered = false; if (round < N) { want = 1 + Math.floor(Math.random() * 4); view(); } else end(); });
      host.appendChild(nx); nx.focus({ preventScroll: true });
    }
    function end() {
      host.innerHTML = ""; host.appendChild(el("p", "big", ok + " su " + N));
      host.appendChild(el("p", "fb", ok === N ? "Orecchio perfetto." : ok >= 3 ? "Ottimo inizio: l'orecchio si allena in fretta." : "Normale: i toni sono la parte più strana all'inizio. Nell'app c'è un allenamento a parte."));
      var again = el("button", "btn ghost small", "Rifai"); again.type = "button"; again.addEventListener("click", start); host.appendChild(again);
      if (ok >= 4) party(host, ok === N);
    }
    function start() { round = 0; ok = 0; answered = false; order = shuffle([0, 1, 2, 3, 4]); want = 1 + Math.floor(Math.random() * 4); view(); }
    start();
  }

  function scrivi(host, sc) {
    var CH = [["人", "rén", "persona, gente"], ["大", "dà", "grande"], ["中", "zhōng", "in mezzo, dentro, centro"], ["你", "nǐ", "tu"],
      ["好", "hǎo", "bene, ok"], ["我", "wǒ", "io, me"], ["学", "xué", "studiare, imparare"], ["爱", "ài", "amare"]];
    var DATA = null, i = 0, w = null, box, cap, msg, bQ, bA, bN, busy = false;
    var colors = function () { return { strokeColor: css("--accent") || "#14594A", outlineColor: css("--line") || "#D5DED9", radicalColor: css("--warm") || "#B94700", highlightColor: css("--orange") || "#F37905", drawingColor: css("--ink") || "#16201B" }; };
    function build() {
      host.innerHTML = "";
      box = el("div", "hw"); cap = el("p", "q"); msg = el("p", "fb"); msg.setAttribute("aria-live", "polite");
      var row = el("div", "row");
      bA = el("button", "btn ghost small", "Guarda come si scrive"); bQ = el("button", "btn small", "Scrivilo tu"); bN = el("button", "btn ghost small", "Un altro");
      [bA, bQ, bN].forEach(function (b) { b.type = "button"; row.appendChild(b); });
      host.appendChild(cap); host.appendChild(box); host.appendChild(msg); host.appendChild(row);
      bA.addEventListener("click", function () { if (w && !busy) { busy = true; msg.textContent = "Guarda l'ordine dei tratti…"; w.cancelQuiz(); w.animateCharacter({ onComplete: function () { busy = false; msg.textContent = "Ora tocca a te."; } }); } });
      bQ.addEventListener("click", quiz); bN.addEventListener("click", function () { i = (i + 1) % CH.length; show(); });
      show();
    }
    function show() {
      var c = CH[i]; box.innerHTML = ""; busy = false;
      cap.innerHTML = '<span class="hz" lang="zh-CN">' + c[0] + "</span> <b>" + c[1] + "</b> · " + c[2];
      msg.textContent = "Tocca «Scrivilo tu» e disegna i tratti con il dito o il mouse.";
      var size = Math.min(260, Math.max(200, box.parentNode.clientWidth - 8));
      w = HanziWriter.create(box, c[0], Object.assign({ width: size, height: size, padding: 14, showCharacter: false, showOutline: true, strokeAnimationSpeed: calm ? 6 : 1.4, delayBetweenStrokes: 180,
        charDataLoader: function (ch, ok) { ok(DATA[ch]); } }, colors()));
    }
    function quiz() {
      if (busy) return; w.cancelQuiz(); var errs = 0; msg.textContent = "Tocca al primo tratto.";
      w.quiz({ leniency: 1.2, showHintAfterMisses: 2, onMistake: function () { errs++; msg.textContent = "Quasi: riprova quel tratto."; },
        onCorrectStroke: function () { msg.textContent = "Bene."; },
        onComplete: function () { var pts = Math.max(3, 10 - errs * 2); sc.add(pts); msg.innerHTML = "<b>Bravo!</b> +" + pts + " punti" + (errs === 0 ? ", senza errori." : "."); party(box, errs === 0); } });
    }
    fetch("assets/dati/hanzi.json").then(function (r) { return r.json(); }).then(function (j) { DATA = j; build(); }).catch(function () { host.textContent = "Non riesco a caricare i caratteri: riprova dopo aver ricaricato la pagina."; });
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if (DATA && host.isConnected) show(); });
  }

  function parole(host, sc) {
    var W = [["水", "shuǐ", "acqua"], ["茶", "chá", "tè"], ["书", "shū", "libro"], ["爱", "ài", "amare"], ["吃", "chī", "mangiare"], ["学", "xué", "studiare, imparare"],
      ["朋友", "péngyou", "amico"], ["谢谢", "xièxie", "grazie"], ["学校", "xuéxiào", "scuola"], ["猫", "māo", "gatto"], ["大", "dà", "grande"], ["你", "nǐ", "tu"]];
    var canSay = "speechSynthesis" in window;
    var say = function (t) {
      if (!canSay) return;
      var v = speechSynthesis.getVoices().filter(function (x) { return /^zh/i.test(x.lang); })[0];
      if (!v) { M.toast("Su questo dispositivo non c'è una voce cinese: nell'app trovi quelle registrate."); return; }
      var u = new SpeechSynthesisUtterance(t); u.lang = "zh-CN"; u.voice = v; u.rate = .8; speechSynthesis.cancel(); speechSynthesis.speak(u);
    };
    if (canSay) speechSynthesis.getVoices();
    Quiz(host, sc, { pool: W, n: 5, points: 4, cls: "",
      counter: function (a, n) { return "Domanda <b>" + a + "</b> di " + n; },
      stem: function (w) { var s = el("div", "stem"); s.appendChild(el("p", "word", '<span class="hz" lang="zh-CN">' + w[0] + '</span><span class="py">' + w[1] + "</span>"));
        if (canSay) { var b = el("button", "btn ghost small", "▶ Ascolta"); b.type = "button"; b.addEventListener("click", function () { say(w[0]); }); s.appendChild(b); } return s; },
      options: function (w) { return shuffle([w].concat(shuffle(W.filter(function (x) { return x !== w; })).slice(0, 3))); },
      label: function (o) { return o[2]; }, isRight: function (w, o) { return w === o; },
      feedback: function (w, right) { return (right ? "Giusto! " : "Era «" + w[2] + "». ") + '<span lang="zh-CN">' + w[0] + "</span> si legge <b>" + w[1] + "</b>."; },
      next: "Avanti", result: "Vedi il risultato", again: "Rifai",
      perfect: "Tutte giuste: la prossima volta ti faccio le frasi.", ending: "Nell'app le parole tornano quando stai per dimenticarle." });
  }

  /* ====================== 中文 ====================== */
  var ZW = [["gatto", "猫"], ["acqua", "水"], ["libro", "书"], ["amico", "朋友"], ["scuola", "学校"], ["grazie", "谢谢"], ["mangiare", "吃"], ["bere", "喝"],
    ["grande", "大"], ["piccolo", "小"], ["città", "城市"], ["pane", "面包"], ["latte", "牛奶"], ["casa", "家，房子"]];
  var itVoice = function () { return "speechSynthesis" in window && speechSynthesis.getVoices().filter(function (x) { return /^it/i.test(x.lang); })[0]; };
  var sayIt = function (t) {
    var v = itVoice(); if (!v) { M.toast("你的设备没有意大利语语音：应用里有真人录音。"); return; }
    var u = new SpeechSynthesisUtterance(t); u.lang = "it-IT"; u.voice = v; u.rate = .85; speechSynthesis.cancel(); speechSynthesis.speak(u);
  };
  function zparole(host, sc) {
    Quiz(host, sc, { pool: ZW, n: 5, points: 4,
      counter: function (a, n) { return "第 <b>" + a + "</b> 题，共 " + n + " 题"; },
      stem: function (w) { var s = el("div", "stem"); s.appendChild(el("p", "word", '<span class="hz it" lang="it">' + w[0] + "</span>"));
        if (itVoice()) { var b = el("button", "btn ghost small", "▶ 听发音"); b.type = "button"; b.addEventListener("click", function () { sayIt(w[0]); }); s.appendChild(b); } return s; },
      options: function (w) { return shuffle([w].concat(shuffle(ZW.filter(function (x) { return x !== w; })).slice(0, 3))); },
      label: function (o) { return '<span lang="zh-CN">' + o[1] + "</span>"; }, isRight: function (w, o) { return w === o; },
      feedback: function (w, right) { return (right ? "答对了！" : "正确答案是「" + w[1] + "」。") + '<span lang="it">' + w[0] + "</span> = " + w[1] + "。"; },
      next: "下一题", result: "看结果", again: "再来一次",
      perfect: "全对！", ending: "应用里的词会在你快忘记时回来复习。" });
  }
  function articoli(host, sc) {
    var A = [["libro", "il", "il：阳性单数，辅音开头"], ["studente", "lo", "lo：阳性单数，s+辅音（st、sp…）开头"], ["casa", "la", "la：阴性单数，辅音开头"], ["zaino", "lo", "lo：阳性单数，z 开头"],
      ["amico", "l'", "l'：元音开头的单数名词（阴阳性都用）"], ["acqua", "l'", "l'：元音开头的单数名词（阴阳性都用）"], ["scuola", "la", "la：阴性单数，辅音开头"], ["gatto", "il", "il：阳性单数，辅音开头"],
      ["psicologo", "lo", "lo：阳性单数，ps 开头"], ["isola", "l'", "l'：元音开头的单数名词（阴阳性都用）"]];
    var OPT = ["il", "lo", "la", "l'"];
    Quiz(host, sc, { pool: A, n: 5, points: 4, cls: "tonopts",
      counter: function (a, n) { return "第 <b>" + a + "</b> 题，共 " + n + " 题：选冠词"; },
      stem: function (w) { return el("p", "word", '<span class="hz it" lang="it">___ ' + w[0] + "</span>"); },
      options: function () { return OPT; }, label: function (o) { return '<span lang="it">' + o + "</span>"; }, isRight: function (w, o) { return o === w[1]; },
      feedback: function (w, right) { return (right ? "答对了！" : "再想想。") + ' <span lang="it"><b>' + (w[1] === "l'" ? "l'" + w[0] : w[1] + " " + w[0]) + "</b></span>：" + w[2] + "。"; },
      next: "下一题", result: "看结果", again: "再来一次",
      perfect: "全对！冠词不再是难题。", ending: "应用的第 3 课专门讲冠词，还有练习。" });
  }
  function ascolta(host, sc) {
    if (!("speechSynthesis" in window)) { host.appendChild(el("p", "q", "这个浏览器不能朗读：请在应用里试试真人录音。")); return; }
    var go = function () {
      if (!itVoice()) { host.innerHTML = ""; host.appendChild(el("p", "q", "你的设备没有意大利语语音，所以这里不能听写。应用里有真人录音（约 7 MB，可下载）。")); return; }
      host.innerHTML = "";
      Quiz(host, sc, { pool: ZW, n: 5, points: 5,
        counter: function (a, n) { return "第 <b>" + a + "</b> 题，共 " + n + " 题：先听，再选意思"; },
        stem: function (w) { var s = el("div", "stem"); var b = el("button", "btn small pulse", "▶ 听一听"); b.type = "button"; b.addEventListener("click", function () { b.classList.remove("pulse"); sayIt(w[0]); }); s.appendChild(b); return s; },
        options: function (w) { return shuffle([w].concat(shuffle(ZW.filter(function (x) { return x !== w; })).slice(0, 3))); },
        label: function (o) { return '<span lang="zh-CN">' + o[1] + "</span>"; }, isRight: function (w, o) { return w === o; },
        feedback: function (w, right) { return (right ? "听对了！" : "正确答案是「" + w[1] + "」。") + '<span lang="it">' + w[0] + "</span> = " + w[1] + "。"; },
        next: "下一题", result: "看结果", again: "再来一次", perfect: "听力满分！", ending: "应用里的听写用真人录音，更自然。" });
    };
    if (speechSynthesis.getVoices().length) go(); else { host.appendChild(el("p", "q", "正在加载语音…")); speechSynthesis.onvoiceschanged = go; setTimeout(go, 1500); }
  }

  var MAP = { toni: toni, scrivi: scrivi, parole: parole, zparole: zparole, articoli: articoli, ascolta: ascolta };
  secs.forEach(function (sec) {
    var sc = Score(sec);
    $$("[data-play]", sec).forEach(function (host) { var f = MAP[host.getAttribute("data-play")]; if (f) { host.innerHTML = ""; f(host, sc); } });
  });
})();
