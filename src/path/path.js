
/* ===== V4b: il Percorso (una tappa per sezione) ===== */
(function () {
  var CP = window.CP, esc = CP.esc, root = document.getElementById("path-root");
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
    var p = Math.min(100, Math.round(wt / goal * 100)), wk = CP.game.weekDots(), days = ["L", "M", "M", "G", "V", "S", "D"];
    var goalOpts = [5, 10, 15, 20].map(function (n) { return '<option value="' + n + '"' + (n === goal ? " selected" : "") + ">" + n + " parole al giorno</option>"; }).join("");
    return '<div class="panel hero"><div class="hero-top">' + CP.stamp(r, true) + '<div class="rk"><div class="lbl">Il tuo grado</div><div class="nm">' + esc(r.name) +
      '</div><div class="sub">' + r.xp + " XP" + (r.next ? " · il prossimo grado a " + r.next : " · grado massimo") + '</div></div></div>' +
      '<div class="bar-xp" role="progressbar" aria-valuenow="' + r.pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Avanzamento verso il prossimo grado"><i style="width:' + r.pct + '%"></i></div>' +
      '<div class="gstats"><div class="gst"><span class="flame" aria-hidden="true">🔥</span><div><b>' + s + "</b><span>" + (s === 1 ? "giorno di fila" : "giorni di fila") + "</span></div></div>" +
      '<div class="gst"><div class="ring-w" aria-hidden="true"><div class="ring" style="--p:' + p + '"></div><span class="tx">' + wt + "</span></div><div><b>" + wt + "/" + goal + "</b><span>Oggi " + wt + "/" + goal + " parole</span></div></div></div>" +
      '<div class="week" aria-label="Questa settimana">' + wk.map(function (d, i) { return '<span class="' + (d.on ? "on " : "") + (d.td ? "td" : "") + '">' + days[i] + "<i></i></span>"; }).join("") + "</div>" +
      '<label class="small muted" style="display:grid;gap:4px;font-weight:600">Obiettivo<select id="goal-sel">' + goalOpts + "</select></label>" +
      '<button type="button" class="btn-s" id="path-go">' + CP.t("path.goto", { n: cur + 1 }) + "</button></div>";
  }
  /* U3: il primo gesto del Percorso è riprendere a studiare (la stessa azione di «Inizia» in Studia) */
  function resumeHTML(cur) {
    var c = CP.studyCounts ? CP.studyCounts() : { due: 0, nw: 0 }, n = c.due + c.nw, s = SECTIONS[cur], T = CP.t;
    return '<div class="panel resume"><div class="small muted">' + T("path.stage", { n: cur + 1 }) + " · " + esc(title(s)) + "</div>" +
      '<button type="button" class="btn-main" id="path-continue">' + (n ? T("path.continue", { min: Math.max(1, Math.round(n * 20 / 60)) }) : T("path.explore", { n: cur + 1 })) + "</button>" +
      '<div class="small muted">' + (n ? T("path.counts", { due: c.due, nw: c.nw, "new": T(c.nw === 1 ? "study.new1" : "study.newN") }) : T("path.doneToday")) + "</div></div>";
  }
  function stopHTML(s, i, cur) {
    var st = stats(s.id), P = PATH[s.id] || { o: "Leggi le " + KEYS[s.id].length + " parole di questo argomento, poi mettile alla prova con le carte e le frasi.", g: -1 }, d = dlgFor(s.id), isOpen = open[s.id];
    var pat = (P.g >= 0 && PATTERNS[P.g]) ? PATTERNS[P.g] : null;
    return '<div class="stop' + (st.done ? " done" : "") + (i === cur ? " cur" : "") + '" id="stop-' + s.id + '">' +
      '<div class="node" aria-hidden="true">' + (st.done ? "✓" : i + 1) + "</div>" +
      '<div class="scard"><button type="button" class="shead" data-toggle="' + s.id + '" aria-expanded="' + (isOpen ? "true" : "false") + '">' +
        '<span class="tt"><small>Tappa ' + (i + 1) + "</small>" + esc(title(s)) + '</span><span class="pc">' + (st.done ? "Completata" : st.pct + "%") + "</span>" +
        '<span class="mini"><i style="width:' + st.pct + '%"></i></span></button>' +
      '<div class="sbody"' + (isOpen ? "" : " hidden") + ">" +
        '<p class="obj">' + esc(P.o) + "</p>" +
        '<div class="small muted">' + st.n + " parole · " + st.started + " iniziate · " + st.known + " sicure</div>" +
        (st.done ? '<div class="okline">✓ Completata: hai iniziato almeno l\'80% delle parole.</div>' : "") +
        '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
          (pat ? '<button type="button" class="gpl" data-pat="' + P.g + '">📐 ' + esc(pat.t) + "</button>" : "") +
          (d ? '<button type="button" class="gpl" data-dlg="' + d.id + '">💬 Dialogo: ' + esc(d.title) + "</button>" : "") +
          (CP.lessons ? CP.lessons.forPath(s.id).map(function (l) { var pr = CP.lessons.progress(l.id); return '<button type="button" class="gpl" data-lesson="' + CP.attr(l.id) + '">📘 ' + ((pr.best || 0) >= 80 ? "✓ " : "") + "Lezione: " + esc(l.title) + "</button>"; }).join("") : "") + "</div>" +
        '<div class="sacts"><button type="button" data-go="words" data-id="' + s.id + '"><span aria-hidden="true">📖</span>Esplora le parole</button>' +
        '<button type="button" data-go="study" data-id="' + s.id + '"><span aria-hidden="true">🎴</span>Impara con le carte</button>' +
        '<button type="button" data-go="practice" data-id="' + s.id + '"><span aria-hidden="true">🧩</span>Pratica</button></div>' +
      "</div></div></div>";
  }
  /* Capitoli: raggruppano le tappe per difficolta'. Il livello HSK e' indicativo (le tappe sono per argomento, non per esame). */
  var CHAPTERS = [
    { t: "Sopravvivenza", hsk: "HSK 1", a: 0, b: 30, d: "Saluti, numeri, cibo, spostarsi: quello che serve il primo giorno." },
    { t: "Vita quotidiana", hsk: "HSK 2", a: 30, b: 65, d: "Casa, lavoro, tempo libero: parlare di sé e delle abitudini." },
    { t: "Conversazione sicura", hsk: "HSK 3", a: 65, b: 110, d: "Opinioni, progetti, spiegazioni: reggere una conversazione vera." },
    { t: "Padronanza", hsk: "HSK 4", a: 110, b: 135, d: "Sfumature, registri e temi più astratti." },
    { t: "Lessico specialistico e cultura", hsk: "HSK 5+", a: 135, b: SECTIONS.length, d: "Lavoro, società, storia e tradizioni." }
  ];
  CHAPTERS.forEach(function (c) { c.b = Math.min(c.b, SECTIONS.length); });
  var chap = null;   /* null = il capitolo della tappa corrente; -1 = tutti */
  function chapOf(i) { for (var k = 0; k < CHAPTERS.length; k++) if (i >= CHAPTERS[k].a && i < CHAPTERS[k].b) return k; return CHAPTERS.length - 1; }
  function chapDone(c) { var n = 0; for (var i = c.a; i < c.b; i++) if (stats(SECTIONS[i].id).done) n++; return n; }
  function chapNav(sel) {
    return '<div class="cpills chap-nav" role="group" aria-label="Capitoli">' + CHAPTERS.map(function (c, k) {
      var n = c.b - c.a, d = chapDone(c);
      return '<button type="button" data-chap="' + k + '"' + (sel === k ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '><b>Cap. ' + (k + 1) + "</b> " + esc(c.t.split(" ")[0]) + ' <small>' + d + "/" + n + "</small></button>";
    }).join("") + '<button type="button" data-chap="-1"' + (sel === -1 ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🗂️ Tutti</button></div>";
  }
  function chapHead(k) {
    var c = CHAPTERS[k], n = c.b - c.a, d = chapDone(c);
    return '<div class="chap-head"><div><small>Capitolo ' + (k + 1) + " · " + c.hsk + ' (indicativo)</small><h3>' + esc(c.t) + '</h3><p class="muted small" style="margin:2px 0 0">' + esc(c.d) + '</p></div><div class="chap-pc"><b>' + d + "/" + n + '</b><span>tappe</span></div><span class="mini"><i style="width:' + Math.round(d / n * 100) + '%"></i></span></div>';
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
      for (var i = CHAPTERS[k].a; i < CHAPTERS[k].b; i++) list += stopHTML(SECTIONS[i], i, cur);
    });
    root.innerHTML = resumeHTML(cur) + heroHTML(cur) +
      '<div class="path-head"><h2>Il percorso</h2><span class="muted small">' + done + " / " + SECTIONS.length + " tappe</span></div>" +
      '<p class="muted" style="margin:0">' + SECTIONS.length + " tappe in " + CHAPTERS.length + ' capitoli, dal primo giorno in Cina ai temi più specifici. Ogni tappa ti porta da «ho visto le parole» a «le uso in una frase». Apri il capitolo che ti serve: non sei obbligato a seguire l\'ordine.</p>' +
      chapNav(sel) + '<div class="path">' + list + "</div>";
  }
  CP.pathDirty = function () { dirty = true; };
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
      var cur = SECTIONS[currentIdx()].id; open[cur] = true; chap = chapOf(currentIdx()); render();
      var el = document.getElementById("stop-" + cur); if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
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


