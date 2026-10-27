/* ===== màndarínō · il percorso guidato «impara · esercitati · verifica», corso di cinese.
   L'unità è una tappa del Percorso; lo stato sta in cp-ex-v1.units[tappa] = { passo, verifica: { data, pct, parti, ok }, letto, xp }.
   Il passo successivo lo calcola ui/ex-stub.js (CP.ex.prossimo) e lo mostra la carta «Continua» del Percorso; qui si fa:
   1. impara + esercitati: una sessione di Studia con 5 parole nuove della tappa (carte di presentazione), poi gli
      esercizi su di loro e i ripassi in scadenza, nella durata scelta (5/10/15 minuti);
   2. verifica: 12 domande senza aiuti (riconoscimento, ascolto, un buco, una digitazione, un ordinamento…), soglia 80%.
      Il risultato è diviso nelle cinque parti del test di livello; sotto la soglia «Rinforza» ripassa le parole sbagliate.
      La verifica non tocca le schede FSRS: è una misura, non un ripasso. Superata, una volta per tappa, CP.game.xp(20);
   3. il dialogo della tappa, in Frasi.
   Lezioni: CP.guided.miniQuiz(lezione) → 2 domande nuove a buco dagli esempi. Gruppo ESERCIZI (al primo uso). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, ENG = CP.exEngine, D = CP.distract, KIT = CP.studyKit;
  var PASS = 80, GROUP = 5, XP = 20, NQ = 12;
  /* le cinque parti del test di livello: 0 pinyin e toni, 1 caratteri, 2 vocabolario, 3 ordine e grammatica, 4 ascolto */
  var PLAN = [["mc-significato", 2], ["mc-parola", 1], ["mc-pinyin", 0], ["buco", 3], ["mc-ascolto", 4], ["ordina", 3], ["scrivi-pinyin", 0], ["tono", 0], ["mc-significato", 2], ["buco-gram", 3], ["scrivi-significato", 2], ["mc-parola", 1]];
  function units() { var o = ENG.load(); o.units = o.units || {}; return o; }
  function setUnit(id, patch) { var o = units(), u = o.units[id] = o.units[id] || { passo: 0 }; Object.keys(patch).forEach(function (k) { u[k] = patch[k]; }); ENG.save(o); if (window.Store && Store.flush) Store.flush(); return u; }
  function keysOf(id) { return CP.ORDER.filter(function (k) { return CP.WORDS[k].sec === id; }); }

  function go(p, dur) {
    if (!p || !p.sec) return;
    if (p.passo === "verifica") return verifica(p.sec);
    if (p.passo === "leggi") return leggi(p.sec, p.dlg);
    impara(p.sec, dur || 10);
  }
  /* 1. impara + esercitati: parole nuove della tappa, esercizi su di loro, ripassi in scadenza */
  function impara(sec, dur) {
    var room = (CP.studyCounts().room) || 0, fresh = keysOf(sec).filter(function (k) { return CP.state(k) < 1; }).slice(0, Math.min(GROUP, room));
    var budget = dur * 3, q = [];
    fresh.forEach(function (k) { q.push({ k: k, kind: "intro", retry: false }); });
    KIT.due(Math.max(0, budget - fresh.length * 3)).forEach(function (k) { if (fresh.indexOf(k) < 0) q.push({ k: k, kind: "test", type: "pi", retry: false }); });
    /* esercizio in più sulle parole del gruppo, in fondo: rinforzo, non cambia i conteggi della sessione */
    fresh.forEach(function (k) { q.push({ k: k, kind: "test", ex: 1, bonus: true, retry: true }); });
    if (!q.length) { CP.toast(T("gd.nothing")); return; }
    setUnit(sec, { passo: Math.max(1, (units().units[sec] || {}).passo || 0) });
    CP.show("study", true); KIT.start(q);
  }
  /* 3. il dialogo della tappa */
  function leggi(sec, dlg) {
    setUnit(sec, { letto: Date.now(), passo: 4 });
    if (dlg && CP.unlock && CP.dlg) CP.unlock.peek("build", function () { CP.dlg.open(dlg); }, T("build.title"));
  }

  /* 2. la verifica */
  var V = null;
  function pickItems(sec) {
    var ws = D.shuffle(keysOf(sec).filter(function (k) { return CP.state(k) >= 1; }), Math.random).map(function (k) { return CP.WORDS[k]; }), out = [], used = {};
    if (ws.length < 4) ws = D.shuffle(keysOf(sec), Math.random).map(function (k) { return CP.WORDS[k]; });
    var tryType = function (type, part) {
      var def = ENG.REG[type]; if (!def) return false;
      for (var j = 0; j < ws.length; j++) {
        var w = ws[(out.length + j) % ws.length]; if (used[w.key + type]) continue;
        if (def.richiede && def.richiede(w, ENG.ctx) === false) continue;
        var it = def.crea(w, ENG.ctx, D.rng(D.seed(w.key + type + Date.now()))); if (!it) continue;
        used[w.key + type] = 1; out.push({ w: w, type: type, part: part, item: it }); return true;
      }
      return false;
    };
    PLAN.forEach(function (p) { if (!tryType(p[0], p[1])) tryType(p[1] === 4 || p[1] === 0 ? "mc-pinyin" : "mc-significato", p[1] === 4 ? 0 : p[1]); });
    while (out.length < NQ && (tryType("mc-significato", 2) || tryType("mc-parola", 1))) { /* fino a 12 */ }
    return out.slice(0, NQ);
  }
  var VKIT = {
    get root() { return KIT.root; },
    head: function () { var pct = Math.round(V.i / V.items.length * 100); return '<div class="sess"><button type="button" id="quit" class="btn-quiet" aria-label="' + CP.attr(T("sess.quitLabel")) + '">' + T("sess.quit") + '</button><div class="meter" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + CP.attr(T("gd.vTitle")) + '"><i class="k" style="width:' + pct + '%"></i></div><span class="cnt">' + (V.i + 1) + " / " + V.items.length + "</span></div>"; },
    parts: KIT.parts, tools: KIT.tools, example: KIT.example, kbd: KIT.kbd, noReveal: true,
    sess: function () { return V; },
    answer: function (g) { var x = V.items[V.i]; V.res.push({ part: x.part, ok: g >= 2, k: x.w.key }); V.i++; next(); }
  };
  function verifica(sec) {
    var items = pickItems(sec); if (items.length < 6) { CP.toast(T("gd.nothing")); return; }
    V = { sec: sec, items: items, i: 0, res: [] };
    CP.show("study", true); CP.focusMode(true); next();
  }
  function next() {
    if (!V) return;
    if (V.i >= V.items.length) return result();
    var x = V.items[V.i];
    ENG.render({ k: x.w.key, kind: "test", ex: 1, exType: x.type, item: x.item }, VKIT);
  }
  /* il punto più debole, detto con gentilezza */
  function result() {
    var r = V.res, ok = r.filter(function (x) { return x.ok; }).length, pct = Math.round(ok / r.length * 100), pass = pct >= PASS, parti = [0, 1, 2, 3, 4].map(function () { return [0, 0]; });
    r.forEach(function (x) { parti[x.part][1]++; if (x.ok) parti[x.part][0]++; });
    var weak = -1, wv = 2; parti.forEach(function (p, i) { if (p[1]) { var v = p[0] / p[1]; if (v < wv) { wv = v; weak = i; } } });
    var sec = V.sec, u = (units().units[sec]) || {}, first = pass && !u.xp, wrong = r.filter(function (x) { return !x.ok; }).map(function (x) { return x.k; });
    setUnit(sec, { verifica: { data: Date.now(), pct: pct, parti: parti, ok: pass || !!(u.verifica && u.verifica.ok) }, passo: pass ? Math.max(3, u.passo || 0) : (u.passo || 1), xp: u.xp || (pass ? Date.now() : 0) });
    if (first && CP.game && CP.game.xp) CP.game.xp(XP);
    V.wrong = wrong;
    var title = ((typeof SECTIONS !== "undefined" ? SECTIONS : []).filter(function (s) { return s.id === sec; })[0] || { title: "" }).title.replace(/^\d+\.\s*/, "");
    var rows = parti.map(function (p, i) { return p[1] ? '<div class="gd-part"><span>' + esc(T("onb.d" + i)) + '</span><b>' + (p[0] === p[1] ? "✓ " : "· ") + p[0] + " / " + p[1] + "</b></div>" : ""; }).join("");
    var h = '<div class="panel done gd-res">' + (pass ? '<span class="seal new-seal" aria-hidden="true">验</span>' : "") + "<h2>" + esc(T(pass ? "gd.vPass" : "gd.vFail")) + '</h2><p class="small muted" lang="it" style="margin:0">' + esc(title) + "</p>" +
      '<p class="gd-score"><b>' + esc(T("gd.vScore", { ok: ok, n: r.length, p: pct })) + "</b></p>" + '<div class="gd-parts">' + rows + "</div>" +
      (weak >= 0 && wv < 1 ? '<p class="small gd-weak">' + esc(T("gd.weak", { p: T("onb.d" + weak) })) + "</p>" : "") + (first ? '<p class="small okline">' + esc(T("gd.xp", { n: XP })) + "</p>" : "") +
      (pass ? '<button type="button" class="btn-main" data-gd-back>' + esc(T("gd.back")) + "</button>" :
        '<button type="button" class="btn-main" data-gd-rinforza>' + esc(T("gd.rinforza", { n: wrong.length })) + '</button><button type="button" class="btn-main btn-quiet" data-gd-again>' + esc(T("gd.again")) + "</button>") + "</div>";
    KIT.root.innerHTML = h; KIT.root.classList.remove("is-card"); CP.focusMode(false); window.scrollTo(0, 0);
    if (CP.sfx) CP.sfx(pass ? "level" : "tap");
    if (pass) CP.toast(T("gd.vPassToast"), { label: T("gd.back"), run: function () { CP.show("path"); } });
  }
  /* «Rinforza»: le parole sbagliate, con gli esercizi del ripasso (queste sì aggiornano FSRS) */
  function rinforza() {
    var ks = (V && V.wrong) || []; if (!ks.length) return;
    var q = ks.filter(function (k, i) { return ks.indexOf(k) === i; }).map(function (k) { return { k: k, kind: "test", type: "pi", retry: false }; });
    V = null; CP.show("study", true); KIT.start(q);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-gd-back], [data-gd-rinforza], [data-gd-again]") : null; if (!b) return;
    CP.sfx("tap");
    if (b.hasAttribute("data-gd-back")) { V = null; CP.studyHome(); CP.show("path"); }
    else if (b.hasAttribute("data-gd-rinforza")) rinforza();
    else if (b.hasAttribute("data-gd-again") && V) verifica(V.sec);
  });

  /* ---- lezioni: 2 domande nuove a buco dagli esempi della lezione ---- */
  function miniQuiz(l) {
    var out = [], ex = D.shuffle(l.ex || [], Math.random);
    ex.forEach(function (e) {
      if (out.length >= 2) return;
      var toks = CP.segment(e[0]), cand = toks.map(function (t, i) { return t.w ? i : -1; }).filter(function (i) { return i >= 0 && Array.from(toks[i].w.hz).length <= 2; });
      if (!cand.length) return;
      var i = cand[Math.floor(Math.random() * cand.length)], w = toks[i].w, x = D.word(w, ENG.ctx.pool(), ENG.ctx, D.rng(D.seed(w.key + l.id)));
      if (!x) return;
      var o = D.options(w.hz, x.slice(0, 3).map(function (y) { return y.hz; }), Math.random), zh = toks.map(function (t, j) { return j === i ? "＿" : t.raw; }).join("");
      out.push({ k: "buco", zh: zh, opts: o.opts, a: o.right, why: e[1] });
    });
    return out;
  }

  CP.guided = { go: go, impara: impara, verifica: verifica, leggi: leggi, miniQuiz: miniQuiz, pickItems: pickItems, current: function () { return V; }, PASS: PASS };
})();
