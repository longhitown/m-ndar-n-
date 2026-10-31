/* ===== màndarínō · rivelazione progressiva: le schede (e gli strumenti di Frasi) compaiono quando hanno senso; le soglie stanno in UNLOCK.
   Perché, regole, pop-up: docs/ux-architettura.md. Chi aveva già progressi ha tutto aperto; uno sblocco non si perde mai (cp-ux-v1.unl).
   ⚙️ → Studio → «Mostra tutto» apre tutto; CP.unlock.ok(scheda) è la domanda che si fanno core.js, i gesti, «Cerca ovunque» e ?go=. ===== */
(function () {
  var CP = window.CP, T = CP.t;
  var UNLOCK = {
    words: 200, build: 300, minDays: { words: 1, build: 2 },   /* punti (XP) e giorni attivi per le schede del corso di cinese; i primi 300 punti valgono il doppio (core/game.js) */
    advancedXp: 1500,                                          /* da qui (grado «Mercante di Seta») tutto è aperto */
    frasi: { pat: 3, thought: 3, lab: 6, slot: 6, reader: 6, rad: 6 }, /* lezioni superate per gli strumenti di Frasi */
    frasiXp: 1000,                                             /* ...oppure questi punti */
    it: { words: [200, 1], conj: [300, 2], phrases: [300, 2], conjLesson: "presente" }
  };
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function jget(k) { try { return JSON.parse(lsGet(k) || "null"); } catch (e) { return null; } }
  var IT = lsGet("cp-course") === "it";
  var BASE = IT ? { lessons: 1, review: 1 } : { path: 1, study: 1 };
  var ALL_ZH = ["words", "build", "fr:pat", "fr:thought", "fr:lab", "fr:slot", "fr:reader", "fr:rad"], ALL_IT = ["it:words", "it:conj", "it:phrases"];
  function unl() { var u = CP.ux.get("unl"); return u && typeof u === "object" ? u : {}; }
  function setUnl(u) { CP.ux.set("unl", u); }
  function hasProgress() {
    if (Object.keys(CP.S()).length) return true;
    var s = jget("cp-it-srs-v1"); if (s && Object.keys(s).some(function (k) { return k !== "__meta"; })) return true;
    return !!(lsGet("cp-game-v1") || lsGet("cp-lessons-v1") || lsGet("cp-it-lessons-v1"));
  }
  /* utenti di prima di questa versione: nessuna perdita, tutto aperto */
  if (!CP.ux.get("unlv")) {
    if (CP.ux.get("onboarded") || hasProgress()) { var u0 = unl(); ALL_ZH.concat(ALL_IT).forEach(function (k) { u0[k] = 1; }); setUnl(u0); }
    CP.ux.set("unlv", 1);
  }
  function key(tab) { return (IT ? "it:" : "") + tab; }
  function ok(tab) { return !!BASE[tab] || !!CP.ux.get("showAll") || !!unl()[key(tab)]; }
  function toolOk(t) { return !UNLOCK.frasi[t] || !!CP.ux.get("showAll") || !!unl()["fr:" + t]; }
  function xpDays() { return CP.game ? [CP.game.rank().xp, CP.game.activeDays ? CP.game.activeDays() : 0] : [0, 0]; }
  function lessonsDone() { return CP.lessons && CP.lessons.list ? CP.lessons.list().filter(function (l) { return (CP.lessons.progress(l.id).best || 0) >= 80; }).length : 0; }
  function itLessonDone(id) { var o = jget("cp-it-lessons-v1") || {}; return !!(o[id] && o[id].done); }
  /* perché è ancora chiuso: il testo «si apre…» per la scheda o lo strumento */
  function why(k) {
    var xd = xpDays();
    if (k === "words" || k === "build") return T("unl.need", { xp: UNLOCK[k], d: UNLOCK.minDays[k], have: xd[0] });
    if (/^it:/.test(k)) { var c = UNLOCK.it[k.slice(3)]; return T("unl.need", { xp: c[0], d: c[1], have: xd[0] }); }
    if (/^fr:/.test(k)) return T("unl.needLs", { n: UNLOCK.frasi[k.slice(3)], have: lessonsDone(), xp: UNLOCK.frasiXp });
    return "";
  }
  /* che cosa si apre adesso, dato lo stato */
  function due() {
    var xd = xpDays(), xp = xd[0], days = xd[1], u = unl(), out = [], pl = CP.ux.get("pl") || {};
    var adv = xp >= UNLOCK.advancedXp || (pl.adv && !pl.undone);
    function want(k, cond, no) { if (!u[k] && (cond || (adv && !no))) out.push(k); }
    if (IT) {
      Object.keys(UNLOCK.it).forEach(function (t) { var c = UNLOCK.it[t]; if (!Array.isArray(c)) return; want("it:" + t, (xp >= c[0] && days >= c[1]) || (t === "conj" && itLessonDone(UNLOCK.it.conjLesson))); });
    } else {
      want("words", xp >= UNLOCK.words && days >= UNLOCK.minDays.words);
      want("build", xp >= UNLOCK.build && days >= UNLOCK.minDays.build);
      var ld = lessonsDone();
      Object.keys(UNLOCK.frasi).forEach(function (t) { want("fr:" + t, ld >= UNLOCK.frasi[t] || xp >= UNLOCK.frasiXp); });
    }
    want("x:pleco", !IT && CP.pleco && CP.pleco.available() && xp >= 500 && days >= 2, 1);
    want("x:anki", CP.anki && CP.anki.allowed(), 1);
    return out;
  }
  var NAME = { words: "nav.words", build: "nav.build", "fr:pat": "sub.pat", "fr:thought": "sub.thought", "fr:lab": "sub.lab", "fr:slot": "sub.slot", "fr:reader": "sub.reader", "fr:rad": "sub.rad", "it:words": "unl.itWords", "it:conj": "unl.itConj", "it:phrases": "unl.itPhrases", "x:pleco": "plc.title", "x:anki": "anki.title" };
  var queue = [], noteEl = null, popOpen = false, soloKey = "";
  /* il messaggio dello sblocco: una riga dentro la pagina, sopra la barra in basso; una novità alla volta, mai un pop-up */
  function announce() {
    if (queue.length && document.querySelector("[data-itr-grade]")) { setTimeout(announce, 4000); return; }
    if (noteEl || popOpen || !queue.length || document.body.classList.contains("in-session") || document.body.classList.contains("in-focus")) return;
    var k = queue.shift(), tabK = k === "words" || k === "build" ? k : /^it:/.test(k) ? k.slice(3) : /^fr:/.test(k) ? "build" : null;
    /* pop-up (ui/grow.js) solo per UNA scheda guadagnata studiando e mai sopra un'altra finestra; altrimenti la riga in basso */
    if (k === soloKey || /^x:/.test(k)) {
      if (CP.topSheet && CP.topSheet()) { queue.unshift(k); setTimeout(announce, 5000); return; }
      try { var xd = xpDays(); popOpen = !!(CP.unlockPop && CP.unlockPop(k, { tab: tabK, xp: xd[0], days: xd[1], next: next() }, function () { popOpen = false; setTimeout(announce, 400); })); } catch (e) { popOpen = false; }
      if (popOpen) return;
      if (/^x:/.test(k)) { var u2 = unl(); delete u2[k]; delete u2["new:" + k]; setUnl(u2); return; }
    }
    noteEl = document.createElement("div"); noteEl.className = "unl-note"; noteEl.setAttribute("role", "status");
    noteEl.innerHTML = '<span class="unl-ico" aria-hidden="true">✨</span><span class="unl-tx">' + CP.esc(T("unl.new", { n: T(NAME[k]) })) + "<small>" + CP.esc(T("unl." + k.replace(":", "_"))) + "</small></span>" +
      (tabK ? '<button type="button" class="btn-s" data-unl-go="' + tabK + '">' + CP.esc(T("unl.go")) + "</button>" : "") + '<button type="button" class="btn-s unl-x" data-unl-x aria-label="' + CP.attr(T("common.close")) + '">✕</button>';
    document.body.appendChild(noteEl);
    var me = noteEl; setTimeout(function () { if (noteEl === me) closeNote(); }, 9000);   /* la riga si toglie da sola */
  }
  function closeNote() { if (noteEl && noteEl.parentNode) noteEl.parentNode.removeChild(noteEl); noteEl = null; setTimeout(announce, 400); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-unl-go], [data-unl-x]") : null; if (!t) return;
    var g = t.getAttribute("data-unl-go"); closeNote(); CP.sfx("tap");
    if (g) { if (IT && CP.itShow) CP.itShow(g); else CP.show(g); }
  });
  /* la prossima scheda da aprire e a che punto sei (per il pop-up, ui/grow.js) */
  function next() {
    var xp = xpDays()[0], u = unl(), seq = IT ? ["it:words", "it:conj", "it:phrases"] : ["words", "build"], i, k, c, t, ld = lessonsDone(), pc = function (a, b) { return Math.max(4, Math.min(100, Math.round(a * 100 / b))); };
    for (i = 0; i < seq.length; i++) if (!u[k = seq[i]]) { c = IT ? UNLOCK.it[k.slice(3)][0] : UNLOCK[k]; return { k: k, xp: c, have: xp, pct: pc(xp, c) }; }
    t = IT ? 0 : Object.keys(UNLOCK.frasi).filter(function (x) { return !u["fr:" + x]; })[0];
    return t ? { k: "fr:" + t, ls: UNLOCK.frasi[t], haveLs: ld, pct: pc(ld, UNLOCK.frasi[t]) } : null;
  }
  /* la barra in basso: solo le schede aperte, con le colonne giuste */
  function paintDock() {
    var dock = IT ? document.querySelector(".dock-it") : document.querySelector("nav.dock:not(.dock-it)"); if (!dock) return;
    var n = 0;
    Array.prototype.forEach.call(dock.querySelectorAll(".dtab"), function (b) {
      var t = IT ? b.getAttribute("data-it-tab") : (b.id || "").replace("tab-", ""), on = ok(t);
      b.hidden = !on; if (on) n++;
      b.classList.toggle("is-new", on && !!unl()["new:" + key(t)]);
    });
    dock.setAttribute("data-n", n); dock.style.gridTemplateColumns = "repeat(" + n + ", 1fr)";
  }
  function check(silent) {
    var add = due(); if (!add.length) { paintDock(); return; }
    soloKey = add.length === 1 ? add[0] : "";
    var u = unl(); add.forEach(function (k) { u[k] = 1; if (!silent && !/^fr:/.test(k)) u["new:" + k] = 1; }); setUnl(u);
    /* molte novità insieme (un test di livello, un dispositivo unito): si annunciano solo le schede, non ogni strumento */
    if (!silent) { add.filter(function (k) { return add.length <= 2 || !/^fr:/.test(k); }).forEach(function (k) { if (queue.indexOf(k) < 0) queue.push(k); }); setTimeout(announce, 600); }
    paintDock();
    if (CP.build && CP.build.render && !IT && add.some(function (k) { return /^fr:/.test(k); })) { try { if (!document.getElementById("view-build").hidden) CP.build.render(); } catch (e) {} }
  }
  /* la scheda visitata non è più «nuova» */
  function seen(tab) { var u = unl(); if (u["new:" + key(tab)]) { delete u["new:" + key(tab)]; setUnl(u); paintDock(); } }
  /* aprire una lezione, un dialogo o le parole di una tappa quando la loro scheda è ancora chiusa: in immersione, senza
     mostrare la scheda; all'uscita si torna dov'eri */
  function peek(tab, run, title) {
    if (ok(tab)) { CP.show(tab); setTimeout(run, 60); return; }
    var prev = ["path", "study", "words", "build"].filter(function (t) { var v = document.getElementById("view-" + t); return v && !v.hidden; })[0] || "path";
    CP.show(tab, true, true);
    if (CP.immerse) CP.immerse.enter({ title: title || "", onExit: function () { CP.show(prev, true); } });
    setTimeout(run, 60);
  }
  CP.unlock = {
    UNLOCK: UNLOCK, ok: ok, toolOk: toolOk, why: why, check: check, seen: seen, peek: peek, paint: paintDock, next: next, name: function (k) { return NAME[k] ? T(NAME[k]) : k; },
    tabs: function () { return (IT ? ["lessons", "review", "words", "conj", "phrases"] : ["path", "study", "words", "build"]).filter(ok); },
    /* la scheda più vicina che si può aprire (per ?go=, cp-tab, gesti) */
    nearest: function (tab) { if (ok(tab)) return tab; return IT ? (tab === "conj" || tab === "phrases" ? "lessons" : "review") : (tab === "words" ? "study" : "path"); },
    unlockAll: function () { var u = unl(); ALL_ZH.concat(ALL_IT).forEach(function (k) { u[k] = 1; }); setUnl(u); paintDock(); },
    showAll: function (on) { CP.ux.set("showAll", on ? 1 : 0); paintDock(); if (CP.build && CP.build.render) try { CP.build.render(); } catch (e) {} },
    isShowAll: function () { return !!CP.ux.get("showAll"); },
    count: function () { return IT ? ALL_IT.filter(function (k) { return unl()[k]; }).length : ALL_ZH.filter(function (k) { return unl()[k]; }).length; }
  };
  /* ---- ⚙️ → Studio → «Livello e schede»: rifare il test, annullare il salto, mostrare tutto (con doppia conferma) ---- */
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "adv", html: function () {
    var pl = CP.ux.get("pl"), canUndo = pl && !pl.undone && (pl.n > 0 || (CP.game && CP.game.granted && CP.game.granted() > 0));
    return '<details class="set-sec" id="set-level"><summary>📶 ' + CP.esc(T("unl.setT")) + '</summary><div class="vbody">' +
      '<p class="small muted" style="margin:0">' + CP.esc(T("unl.setHint")) + "</p>" +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-unl-redo>🧭 ' + CP.esc(T("unl.redo")) + "</button>" +
      (canUndo ? '<button type="button" class="btn-s" data-unl-undo>↩️ ' + CP.esc(T("unl.undo")) + "</button>" : "") + "</div>" +
      '<label class="chk"><input type="checkbox" id="opt-showall"' + (CP.ux.get("showAll") ? " checked" : "") + "> " + CP.esc(T("unl.showAll")) + "</label></div></details>";
  } });
  /* la conferma va sopra: le Impostazioni si chiudono e si riaprono a lavoro fatto */
  function setClose() { var se = document.getElementById("settings"); if (se && !se.hidden) CP.untrap(se); }
  function setBack() { CP.closeSheet(); if (CP.openSettings) CP.openSettings("set-level"); }
  function sheet(body) { setClose(); CP.openSheet('<div class="unl-sheet"><div class="fam-head"><b>' + CP.esc(T("unl.setT")) + '</b><button type="button" class="fam-x btn-s" data-famclose>' + CP.esc(T("common.close")) + "</button></div>" + body + "</div>"); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-unl-redo], [data-unl-undo], [data-unl-all1], [data-unl-all2], [data-unl-undo-ok]") : null; if (!b) return;
    if (b.hasAttribute("data-unl-redo")) { setClose(); CP.onboarding.redoTest(); return; }
    if (b.hasAttribute("data-unl-undo")) { var pl = CP.ux.get("pl") || {}; sheet('<p>' + CP.esc(T("unl.undoQ", { n: pl.n || 0 })) + '</p><button type="button" class="btn-main" data-unl-undo-ok>' + CP.esc(T("unl.undo")) + "</button>"); return; }
    if (b.hasAttribute("data-unl-undo-ok")) { var n = CP.placement.undo(); setBack(); CP.toast(T("unl.undone", { n: n })); return; }
    /* «Mostra tutto»: due conferme, perché toglie la guida passo passo */
    if (b.hasAttribute("data-unl-all1")) { sheet('<p><b>' + CP.esc(T("unl.all2")) + '</b></p><button type="button" class="btn-main" data-unl-all2>' + CP.esc(T("unl.allYes")) + "</button>"); return; }
    if (b.hasAttribute("data-unl-all2")) { CP.unlock.showAll(true); setBack(); CP.toast(T("unl.allDone")); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id !== "opt-showall") return;
    if (e.target.checked) { e.target.checked = false; sheet('<p>' + CP.esc(T("unl.all1")) + '</p><button type="button" class="btn-main" data-unl-all1>' + CP.esc(T("unl.showAll")) + "</button>"); }
    else CP.unlock.showAll(false);
  });
  paintDock();
  /* core.js ha già aperto la scheda dell'ultima volta: se è ancora chiusa si va alla più vicina */
  if (!IT) { var curTab = ["path", "study", "words", "build"].filter(function (t) { var v = document.getElementById("view-" + t); return v && !v.hidden; })[0]; if (curTab && !ok(curTab)) CP.show(CP.unlock.nearest(curTab), true); }
  setTimeout(function () { check(false); }, 1500);
})();
