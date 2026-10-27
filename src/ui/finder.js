/* ===== màndarínō · «Cerca ovunque»: un solo campo per arrivare a tutto, da qualunque scheda (🔍 in alto, o il tasto /).
   Cerca tra gli strumenti, le lezioni di grammatica, i dialoghi, le tappe del Percorso e le parole, e porta lì con un tocco.
   Così lezioni, dialoghi e strumenti non sono più «nascosti» dentro Frasi o Studia: basta scriverne il nome. ===== */
(function () {
  var CP = window.CP, esc = CP.esc, T = CP.t;
  var btn = document.getElementById("find-btn");
  function norm(s) { return " " + String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9㐀-鿿]+/g, " ").trim() + " "; }
  /* una scheda ancora chiusa (ui/unlock.js) si apre in immersione, senza mostrarla */
  function go(tab, fn) { CP.closeSheet(); if (CP.unlock && !CP.unlock.ok(tab)) { CP.unlock.peek(tab, fn || function () {}); return; } CP.show(tab); if (fn) setTimeout(fn, 60); }
  /* gli strumenti avanzati di Frasi ancora chiusi: si vedono, con «si apre…», ma non portano da nessuna parte */
  var LOCK = { "fd.t5": "fr:pat", "fd.t7": "fr:lab", "fd.t8": "fr:slot", "fd.t10": "fr:thought", "fd.t11": "fr:reader", "fd.t13": "words", "fd.t17": "fr:rad" };
  function lockOf(id) {
    var k = LOCK[id]; if (!k || !CP.unlock) return "";
    if (k === "words") return CP.unlock.ok("words") ? "" : CP.unlock.why("words");
    return CP.unlock.toolOk(k.slice(3)) && CP.unlock.ok("build") ? "" : CP.unlock.why(CP.unlock.ok("build") ? k : "build");
  }
  /* strumenti: [icona, nome, parole chiave, azione] */
  var TOOLS = [
    ["🎴", "fd.t0", "ripasso carte flashcard sessione oggi fsrs", function () { go("study", function () { if (CP.studyStart) CP.studyStart(); }); }],
    ["🎧", "fd.t1", "toni ascolto orecchio ear", function () { go("study", function () { if (CP.mode) CP.mode.ear(); }); }],
    ["⚡", "fd.t2", "sfida gara veloce sprint tempo", function () { go("study", function () { if (CP.mode) CP.mode.sprint(); }); }],
    ["📊", "fd.t3", "progressi statistiche memoria dottore dei toni confusioni", function () { go("study"); }],
    ["📘", "fd.t4", "lezioni grammatica regole", function () { go("build", function () { CP.build.setSub("lessons"); }); }],
    ["📐", "fd.t5", "modelli strutture schemi pattern", function () { go("build", function () { CP.build.setSub("pat"); }); }],
    ["🧩", "fd.t6", "esercizi traduci ordine frasi puzzle", function () { go("build", function () { CP.build.setSub("ex"); }); }],
    ["🔬", "fd.t7", "laboratorio traduttore costruisci frase correttore", function () { go("build", function () { CP.build.setSub("lab"); }); }],
    ["🎰", "fd.t8", "slot macchina combinazioni", function () { go("build", function () { CP.build.setSub("lab"); if (CP.build.setSlot) CP.build.setSlot(); }); }],
    ["💬", "fd.t9", "dialoghi conversazione parla roleplay", function () { go("build", function () { CP.build.setSub("dlg"); }); }],
    ["🧠", "fd.t10", "pensiero ordine cinese italiano", function () { go("build", function () { CP.build.setSub("thought"); }); }],
    ["📖", "fd.t11", "lettore leggi testo raggi x incolla", function () { go("build", function () { CP.build.setSub("reader"); }); }],
    ["🗺️", "fd.t12", "percorso tappe capitoli livelli hsk", function () { go("path"); }],
    ["🔎", "fd.t13", "parole dizionario vocabolario tabella", function () { go("words"); }],
    ["🚶", "fd.t14", "guida ascolta camminando cuffie", function () { CP.closeSheet(); var g = document.getElementById("guide-btn"); if (g) g.click(); }],
    ["🎵", "fd.t15", "musica jukebox brani tracce", function () { CP.closeSheet(); if (CP.jukeboxOpen) setTimeout(CP.jukeboxOpen, 60); }],
    ["⚗️", "fd.t17", "laboratorio radicali componenti caratteri unisci reazione elementi chimica", function () { go("build", function () { CP.build.setSub("rad"); }); }],
    ["⚙️", "fd.t16", "impostazioni tema voce audio caratteri backup ripristino lingua", function () { CP.closeSheet(); setTimeout(function () { var s = document.getElementById("settings-btn"); if (s) s.click(); }, 60); }]
  ];
  var IDX = null;
  function index() {
    if (IDX) return IDX;
    IDX = [];
    TOOLS.forEach(function (t) { var n = T(t[1]); IDX.push({ g: 0, ico: t[0], t: n, sub: "", id: t[1], k: norm(n + " " + I18N.it[t[1]] + " " + t[2]), run: t[3] }); });
    (typeof LESSONS !== "undefined" ? LESSONS : []).forEach(function (l) {
      IDX.push({ g: 1, ico: "📘", t: l.title, sub: l.goal || "", k: norm(l.title + " " + (l.goal || "") + " " + (l.id || "")), run: function () { go("build", function () { CP.build.openLesson(l.id); }); } });
    });
    (typeof DIALOGS !== "undefined" ? DIALOGS : []).forEach(function (d) {
      IDX.push({ g: 2, ico: "💬", t: d.title, sub: d.sub || "", k: norm(d.title + " " + (d.sub || "")), run: function () { go("build", function () { CP.dlg.open(d.id); }); } });
    });
    SECTIONS.forEach(function (s) {
      var t = s.title.replace(/^\d+\.\s*/, "");
      IDX.push({ g: 3, ico: "🚩", t: t, sub: T("fd.words", { n: s.words.length }), k: norm(t), run: function () { go("path", function () { if (CP.pathOpen) CP.pathOpen(s.id); }); } });
    });
    return IDX;
  }
  var GN = ["fd.gTools", "sub.lessons", "sub.dlg", "fd.gStops", "lab.words"].map(function (k) { return T(k); });
  function results(q) {
    var n = norm(q).trim(), out = [];
    if (!n) return index().filter(function (x) { return x.g === 0; }).slice(0, 8);
    var w = " " + n;
    index().forEach(function (x) { var p = x.k.indexOf(w); if (p >= 0) out.push({ x: x, r: (p === 0 ? 0 : 1) + x.g * 0.01 }); });
    out.sort(function (a, b) { return a.r - b.r; });
    var res = out.slice(0, 14).map(function (o) { return o.x; });
    /* le parole, con la stessa ricerca della scheda Parole (pinyin senza toni, caratteri, italiano) */
    var sq = CP.search.query(q), Q = CP.ensureQ(), best = [];
    for (var i = 0; i < CP.ORDER.length && best.length < 40; i++) { var r = CP.search.rank(Q[i], sq); if (r >= 0) best.push([r, i]); }
    best.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    best.slice(0, 8).forEach(function (b) {
      var k = CP.ORDER[b[1]], wd = CP.WORDS[k];
      res.push({ g: 4, ico: "", hz: wd.hz, py: wd.py, t: CP.gloss(wd), sub: "", run: function () { go("words", function () { CP.resetFilters(); var tr = CP.reveal(k); if (tr) { tr.classList.add("flash"); setTimeout(function () { tr.classList.remove("flash"); }, 1600); } }); } });
    });
    return res;
  }
  var cur = [];
  function paint(q) {
    cur = results(q);
    var box = document.getElementById("fd-res"); if (!box) return;
    if (!cur.length) { box.innerHTML = '<p class="muted small" style="margin:8px 2px">' + esc(T("find.none")) + "</p>"; return; }
    var h = "", last = -1;
    cur.forEach(function (x, i) {
      if (x.g !== last) { h += '<div class="fd-g">' + GN[x.g] + "</div>"; last = x.g; }
      x.lock = x.id ? lockOf(x.id) : ""; var sub = x.lock ? "🔒 " + x.lock : x.sub;
      h += '<button type="button" class="fd-it" data-fd="' + i + '">' +
        (x.hz ? '<span class="fd-hz" lang="zh-CN">' + esc(x.hz) + '</span><span class="fd-t"><b>' + CP.pinyinHTML(x.py) + "</b><i lang=\"it\">" + esc(x.t) + "</i></span>"
              : '<span class="fd-ico" aria-hidden="true">' + x.ico + '</span><span class="fd-t"' + (x.g ? ' lang="it"' : "") + "><b>" + esc(x.t) + "</b>" + (sub ? "<i>" + esc(sub) + "</i>" : "") + "</span>") + "</button>";
    });
    box.innerHTML = h;
  }
  function open() {
    CP.openSheet('<div class="fd"><div class="fam-head"><div class="meta"><b>' + esc(T("find.title")) + '</b></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + '</button></div>' +
      '<input type="search" id="fd-q" class="fd-q" autocomplete="off" placeholder="' + CP.attr(T("find.ph")) + '" aria-label="' + CP.attr(T("find.title")) + '" aria-controls="fd-res">' +
      '<div id="fd-res" class="fd-res" role="list"></div></div>');
    var q = document.getElementById("fd-q"); paint("");
    q.focus();
    q.addEventListener("input", function () { paint(q.value); });
    q.addEventListener("keydown", function (e) { if (e.key === "Enter" && cur[0]) { e.preventDefault(); cur[0].run(); } });
    document.getElementById("fd-res").addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-fd]") : null; if (!b) return;
      var x = cur[+b.getAttribute("data-fd")]; if (!x) return;
      if (x.lock) { CP.toast(x.lock); return; }
      CP.sfx("tap"); x.run();
    });
  }
  CP.finder = open;
  if (btn) btn.addEventListener("click", function () { CP.sfx("tap"); open(); });
  document.addEventListener("keydown", function (e) {
    var a = document.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
    if (typing || e.altKey) return;
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && document.getElementById("view-words").hidden && !e.ctrlKey && !e.metaKey)) { e.preventDefault(); open(); }
  });
})();
