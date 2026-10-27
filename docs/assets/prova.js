/* màndarínō · «Provala qui»: tre microprove nella pagina (orecchio ai toni, scrittura dei caratteri, parole).
   Si carica da sola quando la sezione sta per comparire (vedi sito.js), dopo hanzi-writer e confetti.
   Nessun dato esce dal browser e niente viene salvato. Dati dei caratteri: assets/dati/hanzi.json. */
(function () {
  var d = document, M = window.MDS || {}, root = d.getElementById("prova");
  if (!root || !window.HanziWriter) return;
  var calm = !!M.calm;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var css = function (v) { return getComputedStyle(d.documentElement).getPropertyValue(v).trim(); };

  var score = 0, scoreEl = $("[data-score]", root);
  function addScore(n) {
    score += n; if (scoreEl) { scoreEl.textContent = score; scoreEl.classList.remove("pop"); void scoreEl.offsetWidth; scoreEl.classList.add("pop"); }
    var f = $("[data-final]", root); if (f && score > 0) f.hidden = false;
  }
  function party(el, big) {
    if (calm || !window.confetti) return;
    var r = el.getBoundingClientRect();
    window.confetti({ particleCount: big ? 120 : 50, spread: big ? 90 : 60, startVelocity: 32, ticks: 160,
      origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height * .35) / innerHeight },
      colors: ["#F37905", "#FFA41C", "#2EB88A", "#14594A", "#2D7DD2"], disableForReducedMotion: true });
  }
  var el = function (tag, cls, html) { var e = d.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---------------- 1 · orecchio ai toni ---------------- */
  (function () {
    var host = $("#p-toni .play-area", root); if (!host) return;
    var SYL = [["ma", ["mā", "má", "mǎ", "mà"]], ["shi", ["shī", "shí", "shǐ", "shì"]], ["yi", ["yī", "yí", "yǐ", "yì"]], ["bao", ["bāo", "báo", "bǎo", "bào"]], ["tang", ["tāng", "táng", "tǎng", "tàng"]]];
    var CUR = { 1: "0,6 36,6", 2: "0,22 36,6", 3: "0,10 11,26 22,26 36,4", 4: "0,4 36,26" };
    var N = 5, round = 0, ok = 0, order = [], want = 0, answered = false;
    function svg(n) { return '<svg viewBox="-2 -2 40 32" width="40" height="32" aria-hidden="true"><polyline points="' + CUR[n] + '" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
    function view() {
      host.innerHTML = "";
      var h = el("p", "q", 'Round <b>' + (round + 1) + "</b> di " + N + ' · sillaba «<b>' + SYL[order[round]][0] + '</b>»');
      var play = el("button", "btn ghost", "▶ Ascolta"); play.type = "button";
      play.addEventListener("click", function () { M.tone(want); });
      var opts = el("div", "opts tonopts");
      [1, 2, 3, 4].forEach(function (n) {
        var b = el("button", "opt", svg(n) + "<span>" + n + "° tono</span>"); b.type = "button"; b.dataset.n = n;
        b.addEventListener("click", function () { pick(b, n); }); opts.appendChild(b);
      });
      var fb = el("p", "fb"); fb.setAttribute("aria-live", "polite");
      host.appendChild(h); host.appendChild(play); host.appendChild(opts); host.appendChild(fb);
      setTimeout(function () { M.tone(want); }, 250);
    }
    function pick(b, n) {
      if (answered) return; answered = true;
      var right = n === want, fb = $(".fb", host);
      $$(".opt", host).forEach(function (x) { x.disabled = true; if (+x.dataset.n === want) x.classList.add("good"); });
      if (right) { ok++; addScore(5); } else b.classList.add("bad");
      fb.innerHTML = (right ? "Esatto! " : "Quasi. ") + "È <b>" + SYL[order[round]][1][want - 1] + "</b>, " + want + "° tono.";
      var nx = el("button", "btn small", round + 1 < N ? "Avanti" : "Vedi il risultato"); nx.type = "button";
      nx.addEventListener("click", function () { round++; answered = false; if (round < N) { want = 1 + Math.floor(Math.random() * 4); view(); } else end(); });
      host.appendChild(nx); nx.focus({ preventScroll: true });
    }
    function end() {
      host.innerHTML = "";
      host.appendChild(el("p", "big", ok + " su " + N));
      host.appendChild(el("p", "fb", ok === N ? "Orecchio perfetto." : ok >= 3 ? "Ottimo inizio: l'orecchio si allena in fretta." : "Normale: i toni sono la parte più strana all'inizio. Nell'app c'è un allenamento a parte."));
      var again = el("button", "btn ghost small", "Rifai"); again.type = "button"; again.addEventListener("click", start);
      host.appendChild(again);
      if (ok >= 4) party(host, ok === N);
    }
    function start() { round = 0; ok = 0; answered = false; order = shuffle([0, 1, 2, 3, 4]); want = 1 + Math.floor(Math.random() * 4); view(); }
    start();
  })();

  /* ---------------- 2 · scrivere i caratteri ---------------- */
  (function () {
    var host = $("#p-scrivi .play-area", root); if (!host) return;
    var CH = [["人", "rén", "persona, gente"], ["大", "dà", "grande"], ["中", "zhōng", "in mezzo, dentro, centro"], ["你", "nǐ", "tu"],
      ["好", "hǎo", "bene, ok"], ["我", "wǒ", "io, me"], ["学", "xué", "studiare, imparare"], ["爱", "ài", "amare"]];
    var DATA = null, i = 0, w = null, box, cap, msg, bQ, bA, bN, busy = false;
    function colors() { return { strokeColor: css("--accent") || "#14594A", outlineColor: css("--line") || "#D5DED9", radicalColor: css("--warm") || "#B94700", highlightColor: css("--orange") || "#F37905", drawingColor: css("--ink") || "#16201B" }; }
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
        onComplete: function () { var pts = Math.max(3, 10 - errs * 2); addScore(pts); msg.innerHTML = "<b>Bravo!</b> +" + pts + " punti" + (errs === 0 ? ", senza errori." : "."); party(box, errs === 0); } });
    }
    fetch("assets/dati/hanzi.json").then(function (r) { return r.json(); }).then(function (j) { DATA = j; build(); }).catch(function () { host.textContent = "Non riesco a caricare i caratteri: riprova dopo aver ricaricato la pagina."; });
    /* se cambia il tema, ridisegna con i colori giusti */
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if (DATA) show(); });
  })();

  /* ---------------- 3 · parole ---------------- */
  (function () {
    var host = $("#p-parole .play-area", root); if (!host) return;
    var W = [["水", "shuǐ", "acqua"], ["茶", "chá", "tè"], ["书", "shū", "libro"], ["爱", "ài", "amare"], ["吃", "chī", "mangiare"], ["学", "xué", "studiare, imparare"],
      ["朋友", "péngyou", "amico"], ["谢谢", "xièxie", "grazie"], ["学校", "xuéxiào", "scuola"], ["猫", "māo", "gatto"], ["大", "dà", "grande"], ["你", "nǐ", "tu"]];
    var N = 5, q = 0, ok = 0, set = [], answered = false, canSay = "speechSynthesis" in window;
    function say(t) {
      if (!canSay) return;
      var vs = speechSynthesis.getVoices(); var v = vs.filter(function (x) { return /^zh/i.test(x.lang); })[0];
      if (!v) { M.toast("Su questo dispositivo non c'è una voce cinese: nell'app trovi quelle registrate."); return; }
      var u = new SpeechSynthesisUtterance(t); u.lang = "zh-CN"; u.voice = v; u.rate = .8; speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
    function view() {
      host.innerHTML = ""; answered = false;
      var w = set[q], opts = shuffle([w].concat(shuffle(W.filter(function (x) { return x !== w; })).slice(0, 3)));
      host.appendChild(el("p", "q", "Domanda <b>" + (q + 1) + "</b> di " + N));
      host.appendChild(el("p", "word", '<span class="hz" lang="zh-CN">' + w[0] + '</span><span class="py">' + w[1] + "</span>"));
      if (canSay) { var s = el("button", "btn ghost small", "▶ Ascolta"); s.type = "button"; s.addEventListener("click", function () { say(w[0]); }); host.appendChild(s); }
      var box = el("div", "opts");
      opts.forEach(function (o) {
        var b = el("button", "opt", "<span>" + o[2] + "</span>"); b.type = "button";
        b.addEventListener("click", function () {
          if (answered) return; answered = true; var right = o === w;
          $$(".opt", box).forEach(function (x) { x.disabled = true; }); b.classList.add(right ? "good" : "bad");
          if (!right) $$(".opt", box).forEach(function (x, k) { if (opts[k] === w) x.classList.add("good"); });
          if (right) { ok++; addScore(4); }
          var fb = el("p", "fb", (right ? "Giusto! " : "Era «" + w[2] + "». ") + '<span lang="zh-CN">' + w[0] + "</span> si legge <b>" + w[1] + "</b>.");
          fb.setAttribute("aria-live", "polite"); host.appendChild(fb);
          var nx = el("button", "btn small", q + 1 < N ? "Avanti" : "Vedi il risultato"); nx.type = "button";
          nx.addEventListener("click", function () { q++; if (q < N) view(); else end(); }); host.appendChild(nx); nx.focus({ preventScroll: true });
        }); box.appendChild(b);
      });
      host.appendChild(box);
    }
    function end() {
      host.innerHTML = ""; host.appendChild(el("p", "big", ok + " su " + N));
      host.appendChild(el("p", "fb", ok === N ? "Tutte giuste: la prossima volta ti faccio le frasi." : "Nell'app le parole tornano quando stai per dimenticarle."));
      var a = el("button", "btn ghost small", "Rifai"); a.type = "button"; a.addEventListener("click", start); host.appendChild(a);
      if (ok >= 4) party(host, ok === N);
    }
    function start() { q = 0; ok = 0; set = shuffle(W).slice(0, N); view(); }
    if (canSay) speechSynthesis.getVoices();
    start();
  })();
})();
