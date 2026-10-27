/* ===== màndarínō · corso di italiano: la carta «今天», i progressi «我的进步», i traguardi e le carte da condividere. Gira prima di it/course.js e legge i dati del corso solo quando servono, da CP.itApi (nessun dato duplicato):
   - carta «今天» in cima a 课程: saluto, un solo pulsante primario («继续：第 N 课»), anello dell'obiettivo e serie, sigillo del
     grado con la barra, «复习 N 张» solo se ci sono carte in scadenza, «今日意大利语» (una frase scelta per il giorno);
   - «+N 分» che sale dopo ogni esercizio, con il sigillo che si riempie verso il grado successivo;
   - traguardi (primo gradino, 7/30/100 giorni, 100/500/1000 parole, nuovo grado, tutte le lezioni): un «分享纪念卡» dentro il
     messaggio di congratulazioni già mostrato, mai una finestra in più. Si ricordano in cp-it-cards-v1 (unione: la prima data);
   - «我的进步»: il racconto della settimana (study/story.js), la raccolta «纪念卡» se c'è almeno un traguardo, «分享».
   Nessuna notifica, nessun conteggio delle condivisioni: l'app non sa se qualcuno condivide. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  var IT = (function () { try { return localStorage.getItem("cp-course") === "it"; } catch (e) { return false; } })();
  if (!IT) return;
  var MK = "cp-it-cards-v1", DAY = 86400000;
  function api() { return CP.itApi; }
  function lget(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function reduce() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }

  /* ---- la frase del giorno: tra gli esempi delle lezioni superate (o delle prime tre, all'inizio), scelta dal giorno ---- */
  function dayIndex(d) { d = d || new Date(); var y = d.getFullYear(); return y * 366 + Math.round((Date.UTC(y, d.getMonth(), d.getDate()) - Date.UTC(y, 0, 0)) / DAY); }
  function phrasePool() {
    var A = api(); if (!A) return [];
    var P = A.progress(), L = A.lessons(), passed = L.filter(function (l) { var p = P[l.id] || {}; return p.done || (p.best || 0) >= A.PASS; });
    var src = passed.length ? passed : L.slice(0, 3), out = [];
    src.forEach(function (l) { (l.ex || []).forEach(function (e) { if (e && e[0] && e[1]) out.push({ it: e[0], zh: e[1], n: l.n }); }); });
    return out;
  }
  function phraseOfDay(d) { var p = phrasePool(); return p.length ? p[dayIndex(d) % p.length] : null; }
  /* la sillaba accentata, dove l'ortografia la segna (città, perché, è): il resto delle parole non ha il dato */
  function accentHTML(s) { return esc(s).replace(/([àèéìíòóùú])/g, '<b class="acc">$1</b>'); }

  /* ---- numeri del corso ---- */
  function wordsLearned() { var S = lget("cp-it-srs-v1") || {}; return Object.keys(S).filter(function (k) { return k !== "__meta" && S[k] && S[k].n; }).length; }
  function lessonsPassed() { var A = api(); if (!A) return 0; var P = A.progress(); return A.lessons().filter(function (l) { var p = P[l.id] || {}; return p.done || (p.best || 0) >= A.PASS; }).length; }
  function greet() { var h = new Date().getHours(); return h >= 5 && h < 11 ? ["itd.morning", "Buongiorno"] : h < 13 && h >= 11 ? ["itd.noon", "Buongiorno"] : h >= 13 && h < 18 ? ["itd.afternoon", "Buon pomeriggio"] : ["itd.evening", "Buonasera"]; }
  function minutes(l) { return Math.max(3, Math.round(2 + (l.quiz ? l.quiz.length : 6) * 0.4)); }

  /* ---- la carta «今天» ---- */
  function html() {
    var A = api(); if (!A || !CP.game) return "";
    var g = greet(), r = CP.game.rank(), s = CP.game.streak(), goal = CP.game.goal(), wt = CP.game.wordsToday(), p = Math.min(100, Math.round(wt / goal * 100));
    var curId = A.current(), cur = curId ? A.lessons().filter(function (l) { return l.id === curId; })[0] : null, q = A.queue(), due = q.due.length, ph = phraseOfDay();
    var main = cur ? '<button type="button" class="btn-main itd-go" data-itd-go="' + CP.attr(cur.id) + '">' + esc(T("itd.continue", { n: cur.n, t: cur.title })) + "<small>" + esc(T("itd.min", { m: minutes(cur) })) + "</small></button>"
      : '<button type="button" class="btn-main itd-go" data-itd-review>' + esc(T(due ? "itd.reviewN" : "itd.allDone", { n: due })) + "</button>";
    /* nello stile Guidato il pulsante dice il passo successivo (lezione, esercizi, lettura: it/esercizi.js) */
    var gs = CP.itEx ? CP.itEx.stepHTML() : ""; if (gs) main = gs;
    return '<section class="panel it-today" aria-labelledby="itd-h">' +
      '<h2 id="itd-h" class="itd-hi">' + esc(T(g[0])) + ' <span class="muted" lang="it">· ' + g[1] + "</span></h2>" + main +
      '<div class="itd-row">' +
        '<div class="itd-rank">' + CP.stamp(r) + '<div><b>' + esc(r.name) + '</b><div class="bar-xp" role="progressbar" aria-valuenow="' + r.pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + CP.attr(T("itd.toNext", { n: r.next })) + '"><i style="width:' + r.pct + '%"></i></div><small class="muted">' + esc(T("itd.points", { x: r.xp, n: r.next })) + "</small></div></div>" +
        '<div class="itd-ring"><div class="ring-w" aria-hidden="true"><div class="ring itd-ring-a" style="--p:' + p + '"></div><span class="tx">' + wt + "</span></div><div><b>" + wt + "/" + goal + "</b><small>" + esc(T("itd.goal")) + '</small><b class="itd-streak">🔥 ' + esc(T("itd.streak", { n: s })) + "</b></div></div>" +
      "</div>" +
      (cur && due ? '<button type="button" class="btn-s itd-rev" data-itd-review>🎴 ' + esc(T("itd.reviewN", { n: due })) + "</button>" : "") +
      (ph ? '<div class="itd-phrase"><span class="tag">' + esc(T("itd.phraseT")) + '</span><p class="itd-it" lang="it">' + accentHTML(ph.it) + '</p><p class="itd-zh">' + esc(ph.zh) + "</p>" +
        '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-it-say="' + CP.attr(ph.it) + '" aria-label="' + CP.attr(T("itd.listen")) + '">🔊 ' + esc(T("itd.listen")) + '</button><button type="button" class="btn-s" data-itd-share>' + esc(T("itd.share")) + "</button></div></div>" : "") +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-itd-progress>📈 ' + esc(T("itd.progress")) + "</button></div>" +
      "</section>";
  }

  /* ---- «+N 分» che sale ---- */
  var gainEl = null, gainT = 0, gainSum = 0;
  function gain(n) {
    if (!(n > 0) || !CP.game) return;
    gainSum += n; var r = CP.game.rank();
    if (!gainEl) { gainEl = document.createElement("div"); gainEl.className = "it-gain"; gainEl.setAttribute("role", "status"); document.body.appendChild(gainEl); }
    gainEl.innerHTML = CP.stamp(r) + '<span class="it-gain-n">' + esc(T("itd.gain", { n: gainSum })) + '</span><span class="it-gain-bar" aria-hidden="true"><i style="width:' + r.pct + '%"></i></span>';
    gainEl.classList.remove("on"); void gainEl.offsetWidth; gainEl.classList.add("on");
    clearTimeout(gainT); gainT = setTimeout(function () { gainEl.classList.remove("on"); gainSum = 0; }, reduce() ? 1600 : 1900);
  }

  /* ---- traguardi ---- */
  function marks() { var o = lget(MK); return o && o.m && typeof o.m === "object" ? o : { m: {} }; }
  function saveMarks(o) { try { localStorage.setItem(MK, JSON.stringify(o)); } catch (e) {} }
  var LIST = [
    ["first", function (c) { return c.lessons >= 1; }], ["s7", function (c) { return c.streak >= 7; }], ["s30", function (c) { return c.streak >= 30; }], ["s100", function (c) { return c.streak >= 100; }],
    ["w100", function (c) { return c.words >= 100; }], ["w500", function (c) { return c.words >= 500; }], ["w1000", function (c) { return c.words >= 1000; }], ["all", function (c) { return c.lessons >= c.total; }]
  ];
  function counts() { var A = api(); return { lessons: lessonsPassed(), streak: CP.game ? CP.game.streak() : 0, words: wordsLearned(), total: A ? A.lessons().length : 30 }; }
  function label(id) { return id.indexOf("rank:") === 0 ? T("itm.rank", { r: id.slice(5) }) : T("itm." + id); }
  /* restituisce i traguardi nuovi (e li ricorda) */
  function check(extra) {
    var o = marks(), c = counts(), fresh = [];
    LIST.forEach(function (x) { if (!o.m[x[0]] && x[1](c)) { o.m[x[0]] = Date.now(); fresh.push(x[0]); } });
    (extra || []).forEach(function (id) { if (!o.m[id]) { o.m[id] = Date.now(); fresh.push(id); } });
    if (fresh.length) saveMarks(o);
    return fresh;
  }
  function offer(id) {
    CP.toast(T("itm.congrats", { m: label(id) }), { label: T("itd.shareCard"), run: function () { CP.shareCard.open("it-milestone", cardData("it-milestone", id)); } });
  }
  /* chi aveva già raggiunto un traguardo prima di questa versione non riceve una pioggia di messaggi: si segnano in silenzio */
  var firstRun = !lget(MK);
  CP.onRankUp = function (r) { var f = check(["rank:" + r.name]); if (f.length) offer("rank:" + r.name); };
  CP.onAward = function (n) {
    gain(n);
    setTimeout(function () { var f = check(); if (f.length) offer(f[f.length - 1]); }, 50);
  };

  /* ---- dati della carta (ui/share-card.js) ---- */
  function cardData(tpl, milestone) {
    var c = counts(), W = CP.story ? CP.story.weeks("it", []) : [], w = W[W.length - 1] || { days: 0, words: 0, lessons: 0 };
    return { rank: CP.game.rank(), streak: c.streak, words: c.words, lessons: c.lessons, total: c.total, phrase: phraseOfDay() || { it: "Ciao!", zh: T("itd.ciaoZh") },
      date: new Date(), milestone: milestone ? label(milestone) : "", week: { days: w.days, words: w.words, lessons: w.lessons } };
  }
  CP.itCardData = function () { return cardData("it-day"); };

  /* ---- 我的进步 ---- */
  function progressSheet() {
    var o = marks(), ids = Object.keys(o.m).sort(function (a, b) { return o.m[a] - o.m[b]; });
    CP.openSheet('<div class="fam-head"><div class="meta"><b>' + esc(T("itd.progress")) + '</b></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" +
      '<div id="itp-story" aria-live="polite"></div>' +
      (ids.length ? '<h3 class="itd-h3">' + esc(T("itd.cards")) + '</h3><div class="itd-cards">' + ids.map(function (id) { return '<button type="button" class="itd-card" data-itd-mile="' + CP.attr(id) + '"><span class="it-stamp sm" aria-hidden="true">' + esc(T("itd.passed")) + "</span><b>" + esc(label(id)) + "</b><small>" + esc(new Date(o.m[id]).toLocaleDateString("zh-CN")) + "</small></button>"; }).join("") + "</div>" : "") +
      '<div class="acts"><button type="button" class="btn-main" data-itd-week style="margin:0">' + esc(T("itd.shareWeek")) + '</button><button type="button" class="btn-s" data-chal-open>' + esc(T("tog.chal")) + "</button></div>");
    if (CP.story) CP.story.html("it").then(function (h) { var b = document.getElementById("itp-story"); if (b) b.innerHTML = h; });
  }
  CP.itProgress = progressSheet;

  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-itd-go], [data-itd-review], [data-itd-share], [data-itd-progress], [data-itd-mile], [data-itd-week]") : null; if (!b) return;
    var A = api(); CP.sfx("tap");
    if (b.hasAttribute("data-itd-go") && A) { A.open(b.getAttribute("data-itd-go")); window.scrollTo(0, 0); }
    else if (b.hasAttribute("data-itd-review") && A) A.show("review");
    else if (b.hasAttribute("data-itd-share")) CP.shareCard.open("it-day", cardData("it-day"));
    else if (b.hasAttribute("data-itd-progress")) progressSheet();
    else if (b.hasAttribute("data-itd-mile")) { var id = b.getAttribute("data-itd-mile"); CP.closeSheet(); CP.shareCard.open("it-milestone", cardData("it-milestone", id)); }
    else if (b.hasAttribute("data-itd-week")) { CP.closeSheet(); CP.shareCard.open("it-week", cardData("it-week")); }
  });
  CP.itToday = { html: html, phraseOfDay: phraseOfDay, pool: phrasePool, check: check, marks: marks, gain: gain, cardData: cardData, dayIndex: dayIndex };
  /* al primo avvio si segnano in silenzio i traguardi già raggiunti (e i gradi), dopo che il corso è pronto */
  if (firstRun) setTimeout(function () { if (api()) { var o = marks(); check(); o = marks(); if (CP.game) { var r = CP.game.rank(); if (r.i > 0) { o.m["rank:" + r.name] = o.m["rank:" + r.name] || Date.now(); saveMarks(o); } } } }, 0);
})();
