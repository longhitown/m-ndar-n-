
/* ===== V4b: il Percorso (una tappa per sezione) ===== */
(function () {
  var CP = window.CP, esc = CP.esc, root = document.getElementById("path-root"), T = CP.t;
  var KEYS = {}; SECTIONS.forEach(function (s) { KEYS[s.id] = []; });
  CP.ORDER.forEach(function (k) { KEYS[CP.WORDS[k].sec].push(k); });
  var open = {}, openInit = false, dirty = true, lastCur = -1, showAll = false, BASE = 30;
  function title(s) { return s.title.replace(/^\d+\.\s*/, ""); }
  function stats(id) {
    var ks = KEYS[id], n = ks.length, st = 0, known = 0;
    ks.forEach(function (k) { var s = CP.state(k); if (s >= 1) st++; if (s === 2) known++; });
    return { n: n, started: st, known: known, pct: Math.round(st / n * 100), done: st / n >= 0.8 };
  }
  function dlgFor(id) { return DIALOGS.filter(function (d) { return d.sec === id; })[0] || null; }
  function currentIdx() {
    for (var i = 0; i < SECTIONS.length; i++) if (!stats(SECTIONS[i].id).done) return i;
    return SECTIONS.length - 1;
  }
  function heroHTML(cur) {
    var r = CP.game.rank(), s = CP.game.streak(), wt = CP.game.wordsToday(), goal = CP.game.goal();
    var p = Math.min(100, Math.round(wt / goal * 100)), wk = CP.game.weekDots(), days = T("path.days").split(",");
    var goalOpts = [5, 10, 15, 20].map(function (n) { return '<option value="' + n + '"' + (n === goal ? " selected" : "") + ">" + T("path.perDay", { n: n }) + "</option>"; }).join("");
    return '<div class="panel hero"><div class="hero-top">' + CP.stamp(r, true) + '<div class="rk"><div class="lbl">' + T("path.rank") + '</div><div class="nm">' + esc(r.name) +
      '</div><div class="sub">' + r.xp + " XP" + " · " + (r.next ? T("path.nextRank", { n: r.next }) : T("path.maxRank")) + '</div></div></div>' +
      '<div class="bar-xp" role="progressbar" aria-valuenow="' + r.pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + CP.attr(T("path.rankAria")) + '"><i style="width:' + r.pct + '%"></i></div>' +
      '<div class="gstats"><div class="gst"><span class="flame" aria-hidden="true">🔥</span><div><b>' + s + "</b><span>" + T(s === 1 ? "done.streak1" : "done.streakN") + "</span></div></div>" +
      '<div class="gst"><div class="ring-w" aria-hidden="true"><div class="ring" style="--p:' + p + '"></div><span class="tx">' + wt + "</span></div><div><b>" + wt + "/" + goal + "</b><span>" + T("path.today", { n: wt, goal: goal }) + "</span></div></div></div>" +
      '<div class="week" aria-label="' + CP.attr(T("path.week")) + '">' + wk.map(function (d, i) { return '<span class="' + (d.on ? "on " : "") + (d.td ? "td" : "") + '">' + days[i] + "<i></i></span>"; }).join("") + "</div>" +
      '<label class="small muted" style="display:grid;gap:4px;font-weight:600">' + T("path.goal") + '<select id="goal-sel">' + goalOpts + "</select></label>" +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" id="path-go">' + CP.t("path.goto", { n: cur + 1 }) + '</button><button type="button" class="btn-s" data-card-open>📤 ' + CP.t("card.open") + "</button></div></div>";
  }
  /* U3: il primo gesto del Percorso è riprendere a studiare (la stessa azione di «Inizia» in Studia) */
  function resumeHTML(cur) {
    var c = CP.studyCounts ? CP.studyCounts() : { due: 0, nw: 0 }, n = c.due + c.nw, s = SECTIONS[cur], T = CP.t;
    return '<div class="panel resume"><div class="small muted">' + T("path.stage", { n: cur + 1 }) + ' · <span lang="it">' + esc(title(s)) + "</span></div>" +
      '<button type="button" class="btn-main" id="path-continue">' + (n ? T("path.continue", { min: Math.max(1, Math.round(n * 20 / 60)) }) : T("path.explore", { n: cur + 1 })) + "</button>" +
      '<div class="small muted">' + (n ? T("path.counts", { due: c.due, nw: c.nw, "new": T(c.nw === 1 ? "study.new1" : "study.newN") }) : T("path.doneToday")) + "</div>" + nextSteps(s) + "</div>";
  }
  /* sotto «Continua»: la lezione e il dialogo della tappa corrente, a un tocco (non nascosti dentro Frasi) */
  function nextSteps(s) {
    var b = [], d = dlgFor(s.id);
    if (CP.lessons) CP.lessons.forPath(s.id).forEach(function (l) { var pr = CP.lessons.progress(l.id); if ((pr.best || 0) < 80) b.push('<button type="button" class="gpl" data-lesson="' + CP.attr(l.id) + '">📘 <span lang="it">' + esc(l.title) + "</span></button>"); });
    if (d) b.push('<button type="button" class="gpl" data-dlg="' + d.id + '">💬 <span lang="it">' + esc(d.title) + "</span></button>");
    return b.length ? '<div class="next-steps">' + b.slice(0, 2).join("") + "</div>" : "";
  }
  function stopHTML(s, i, cur) {
    var st = stats(s.id), P = PATH[s.id] || { o: T("path.objDefault", { n: KEYS[s.id].length }), g: -1 }, d = dlgFor(s.id), isOpen = open[s.id];
    var pat = (P.g >= 0 && PATTERNS[P.g]) ? PATTERNS[P.g] : null;
    return '<div class="stop' + (st.done ? " done" : "") + (i === cur ? " cur" : "") + '" id="stop-' + s.id + '">' +
      '<div class="node" aria-hidden="true">' + (st.done ? "✓" : i + 1) + "</div>" +
      '<div class="scard"><button type="button" class="shead" data-toggle="' + s.id + '" aria-expanded="' + (isOpen ? "true" : "false") + '">' +
        '<span class="tt"><small>' + T("path.stopN", { n: i + 1 }) + '</small><span lang="it">' + esc(title(s)) + '</span></span><span class="pc">' + (st.done ? T("path.done") : st.pct + "%") + "</span>" +
        '<span class="mini"><i style="width:' + st.pct + '%"></i></span></button>' +
      '<div class="sbody"' + (isOpen ? "" : " hidden") + ">" +
        '<p class="obj" lang="it">' + esc(P.o) + "</p>" +
        '<div class="small muted">' + T("path.stats", { n: st.n, s: st.started, k: st.known }) + "</div>" +
        (st.done ? '<div class="okline">✓ ' + T("path.doneLine") + "</div>" : "") +
        '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
          (pat ? '<button type="button" class="gpl" data-pat="' + P.g + '">📐 <span lang="it">' + esc(pat.t) + "</span></button>" : "") +
          (d ? '<button type="button" class="gpl" data-dlg="' + d.id + '">💬 ' + T("path.dlg") + ' <span lang="it">' + esc(d.title) + "</span></button>" : "") +
          (CP.lessons ? CP.lessons.forPath(s.id).map(function (l) { var pr = CP.lessons.progress(l.id); return '<button type="button" class="gpl" data-lesson="' + CP.attr(l.id) + '">📘 ' + ((pr.best || 0) >= 80 ? "✓ " : "") + T("path.lesson") + ' <span lang="it">' + esc(l.title) + "</span></button>"; }).join("") : "") + "</div>" +
        '<div class="sacts"><button type="button" data-go="words" data-id="' + s.id + '"><span aria-hidden="true">📖</span>' + T("path.explore1") + '</button>' +
        '<button type="button" data-go="study" data-id="' + s.id + '"><span aria-hidden="true">🎴</span>' + T("path.cards") + '</button>' +
        '<button type="button" data-go="practice" data-id="' + s.id + '"><span aria-hidden="true">🧩</span>' + T("path.practice") + '</button></div>' +
      "</div></div></div>";
  }
  /* Capitoli per difficoltà: un solo vocabolario, ogni tappa nel capitolo del suo livello (data/levels.js, tools/levels.mjs).
     Dentro un capitolo prima i temi, poi la «lista HSK» del livello: le parole d'esame che i temi non hanno già portato. */
  var CHAPTERS = [
    { t: "Primi passi", hsk: "HSK 1", d: "Presentarsi, salutare, contare, chiedere: le basi del primo giorno." },
    { t: "Vita quotidiana", hsk: "HSK 2", d: "Cibo, viaggi, casa, acquisti, città: muoversi e cavarsela." },
    { t: "Conversazione", hsk: "HSK 3", d: "Opinioni, economia, sport, media: reggere una conversazione vera." },
    { t: "Padronanza", hsk: "HSK 4", d: "Studio, società, amministrazione: temi più astratti." },
    { t: "Approfondimento", hsk: "HSK 5", d: "Sentimenti, scienza, diritto, arte, lavoro: le sfumature." },
    { t: "Oltre l'HSK", hsk: "lessico specialistico", d: "Professioni, scienze, cultura e tradizioni cinesi: scegli i temi che ti servono." }
  ];
  var CHOF = typeof SECTION_CHAPTER !== "undefined" ? SECTION_CHAPTER : {};
  function isList(s) { return /^hsk\d/.test(s.id); }
  CHAPTERS.forEach(function (c, k) {
    c.idx = []; SECTIONS.forEach(function (s, i) { var n = CHOF[s.id] || (isList(s) ? +s.id.charAt(3) : 6); if (n === k + 1) c.idx.push(i); });
  });
  CP.chapters = CHAPTERS;   /* anche per il filtro per livello della scheda Parole (ui/theme-tiers.js) */
  var chap = null;   /* null = il capitolo della tappa corrente; -1 = tutti */
  function chapOf(i) { for (var k = 0; k < CHAPTERS.length; k++) if (CHAPTERS[k].idx.indexOf(i) >= 0) return k; return CHAPTERS.length - 1; }
  function chapDone(c) { return c.idx.filter(function (i) { return stats(SECTIONS[i].id).done; }).length; }
  function chapNav(sel) {
    return '<div class="cpills chap-nav" role="group" aria-label="' + CP.attr(T("path.chapters")) + '">' + CHAPTERS.map(function (c, k) {
      var n = c.idx.length, d = chapDone(c);
      return '<button type="button" data-chap="' + k + '"' + (sel === k ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '><b>' + (k + 1) + "</b> " + esc(T("chap." + k)) + ' <small>' + d + "/" + n + "</small></button>";
    }).join("") + '<button type="button" data-chap="-1"' + (sel === -1 ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🗂️ " + T("path.all") + "</button></div>";
  }
  function chapHead(k) {
    var c = CHAPTERS[k], n = c.idx.length, d = chapDone(c);
    return '<div class="chap-head"><div><small>' + T("path.chapN", { n: k + 1 }) + " · " + esc(k === 5 ? T("chap.beyond") : c.hsk) + "</small><h3>" + esc(T("chap." + k)) + '</h3><p class="muted small" style="margin:2px 0 0">' + esc(T("chap." + k + ".d")) + '</p></div><div class="chap-pc"><b>' + d + "/" + n + "</b><span>" + T("path.stops") + '</span></div><span class="mini"><i style="width:' + Math.round(d / n * 100) + '%"></i></span></div>';
  }
  /* la lista HSK del capitolo: un blocco unico, chiuso finché non ci si arriva */
  function listHTML(k, ids, cur) {
    var words = 0, started = 0;
    ids.forEach(function (i) { var st = stats(SECTIONS[i].id); words += st.n; started += st.started; });
    var d = ids.filter(function (i) { return stats(SECTIONS[i].id).done; }).length, inside = ids.indexOf(cur) >= 0, key = "list" + k;
    if (open[key] == null) open[key] = inside;
    var body = ""; if (open[key]) ids.forEach(function (i) { body += stopHTML(SECTIONS[i], i, cur); });
    return '<div class="hsk-list' + (d === ids.length ? " done" : "") + (inside ? " cur" : "") + '"><button type="button" class="hl-head" data-list="' + k + '" aria-expanded="' + (open[key] ? "true" : "false") + '">' +
      '<span class="hl-ico" aria-hidden="true">📋</span><span class="hl-t"><b>' + T("path.list", { n: k + 1 }) + "</b><small>" + T("path.listSub", { w: words, n: ids.length }) + "</small></span>" +
      '<span class="pc">' + d + "/" + ids.length + '</span><span class="mini"><i style="width:' + Math.round(started / Math.max(1, words) * 100) + '%"></i></span></button>' +
      (open[key] ? '<div class="hl-body">' + body + "</div>" : "") + "</div>";
  }
  function render() {
    dirty = false;
    var cur = currentIdx();
    if (!openInit || cur !== lastCur) { open[SECTIONS[cur].id] = true; openInit = true; }
    lastCur = cur;
    var done = SECTIONS.filter(function (s) { return stats(s.id).done; }).length;
    var sel = chap === null ? chapOf(cur) : chap, list = "";
    var ks = sel === -1 ? CHAPTERS.map(function (_, k) { return k; }) : [sel];
    ks.forEach(function (k) {
      list += chapHead(k);
      var lists = [];
      CHAPTERS[k].idx.forEach(function (i) { if (isList(SECTIONS[i])) lists.push(i); else list += stopHTML(SECTIONS[i], i, cur); });
      if (lists.length) list += listHTML(k, lists, cur);
    });
    root.innerHTML = resumeHTML(cur) + heroHTML(cur) +
      '<div class="path-head"><h2>' + T("path.title") + '</h2><span class="muted small">' + done + " / " + SECTIONS.length + " " + T("path.stops") + "</span></div>" +
      '<p class="muted" style="margin:0">' + T("path.lede", { n: SECTIONS.length, c: CHAPTERS.length }) + "</p>" +
      chapNav(sel) + '<div class="path">' + list + "</div>";
  }
  CP.pathDirty = function () { dirty = true; };
  /* apre una tappa (dalla ricerca universale): il suo capitolo, la tappa aperta, centrata sullo schermo */
  CP.pathOpen = function (id) {
    var i = -1; SECTIONS.forEach(function (s, j) { if (s.id === id) i = j; }); if (i < 0) return;
    var k = chapOf(i); chap = k; open[id] = true; if (isList(SECTIONS[i])) open["list" + k] = true; render();
    var el = document.getElementById("stop-" + id); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); setTimeout(function () { el.classList.remove("flash"); }, 1600); }
  };
  CP.onPath = function () { render(); };

  function goWords(id) {
    CP.resetFilters();
    CP.show("words");
    setTimeout(function () { CP.gotoSection(id, false); }, 200);
  }
  root.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("button") : null; if (!t) return;
    if (t.hasAttribute("data-chap")) { chap = parseInt(t.getAttribute("data-chap"), 10); CP.sfx("tap"); render(); var ch = root.querySelector(".chap-head"); if (ch && ch.scrollIntoView) ch.scrollIntoView({ block: "nearest" }); return; }
    if (t.id === "path-continue") {
      var cc = CP.studyCounts ? CP.studyCounts() : { due: 0, nw: 0 };
      if (cc.due + cc.nw) { CP.show("study"); CP.studyStart(); return; }
      t = { id: "path-go" };
    }
    if (t.id === "path-go") {
      var ci = currentIdx(), cur = SECTIONS[ci].id, ck = chapOf(ci); open[cur] = true; chap = ck; if (isList(SECTIONS[ci])) open["list" + ck] = true; render();
      var el = document.getElementById("stop-" + cur); if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (t.hasAttribute("data-list")) { var lk = "list" + t.getAttribute("data-list"); open[lk] = !open[lk]; CP.sfx("tap"); render(); var hb = root.querySelector('[data-list="' + t.getAttribute("data-list") + '"]'); if (hb && hb.focus) hb.focus({ preventScroll: true }); return; }
    var tg = t.getAttribute("data-toggle");
    if (tg) { open[tg] = !open[tg]; t.setAttribute("aria-expanded", open[tg] ? "true" : "false"); var b = t.parentNode.querySelector(".sbody"); if (b) b.hidden = !open[tg]; CP.sfx("tap"); return; }
    var go = t.getAttribute("data-go"), id = t.getAttribute("data-id");
    if (go === "words") goWords(id);
    else if (go === "study") { CP.studySection(id); CP.show("study"); }
    else if (go === "practice") { CP.build.practice(id); CP.show("build"); }
    else if (t.hasAttribute("data-pat")) { CP.build.openPattern(parseInt(t.getAttribute("data-pat"), 10)); CP.show("build"); }
    else if (t.hasAttribute("data-dlg")) { CP.dlg.open(t.getAttribute("data-dlg")); CP.show("build"); }
    else if (t.hasAttribute("data-lesson")) { CP.build.openLesson(t.getAttribute("data-lesson")); CP.show("build"); }
  });
  root.addEventListener("change", function (e) {
    if (e.target.id === "goal-sel") { CP.game.setGoal(parseInt(e.target.value, 10)); render(); }
  });
})();


