/* ===== màndarínō · test di livello: le domande e il loro svolgimento. Il motore (scala, stima, punti) sta in
   data/placement.js; qui si costruiscono le domande con i dati dell'app e si disegnano, una alla volta.
   Corso di cinese: per il livello HSK richiesto, una parola della fascia centrale di frequenza di quel livello
   (data/levels.js, data/freq.js) e distrattori dello stesso livello. Cinque tipi di domanda, scelti secondo ciò che
   l'utente ha dichiarato: significato del carattere, pinyin, ascolto (solo se c'è una voce cinese sul telefono: niente
   rete, mai), frase da tradurre (data/examples), ordine delle parole. Corso di italiano: le domande a scelta dei quiz
   delle 30 lezioni. Il test non dice se una risposta è giusta: va avanti e basta. «Non lo so» conta come errore, senza
   colpa. Si può interrompere: la stima usa le risposte date fin lì.
   CP.placement.run(box, corso, dichiarazione[5], fine(stato)) ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, PL = window.PLACEMENT;
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var FREQ = null;
  function freqOf(k) { if (!FREQ) { FREQ = {}; String(window.WORD_FREQ || "").split("|").forEach(function (w, i) { if (!(w in FREQ)) FREQ[w] = i; }); } return k in FREQ ? FREQ[k] : 1e6; }
  var POOLS = {};
  /* le parole del livello che ci sono nel vocabolario, ordinate per frequenza: si tiene la metà centrale */
  function pool(L) {
    if (POOLS[L]) return POOLS[L];
    var lv = Math.min(L, 6), ks = String((window.HSK_LEVEL || {})[lv] || "").split("|").filter(function (k) { return CP.WORDS[k]; });
    if (L === 6 && !ks.length) ks = CP.ORDER.slice(-800);   /* «oltre l'HSK»: le parole in fondo al vocabolario */
    ks.sort(function (a, b) { return freqOf(a) - freqOf(b); });
    var n = ks.length, mid = n > 12 ? ks.slice(Math.floor(n * 0.25), Math.ceil(n * 0.75)) : ks;
    return (POOLS[L] = mid.length ? mid : ks);
  }
  function others(L, k, n, keyFn) {
    var seen = {}, out = [], p = shuffle(pool(L)); seen[keyFn(CP.WORDS[k])] = 1;
    for (var i = 0; i < p.length && out.length < n; i++) { var w = CP.WORDS[p[i]], kk = keyFn(w); if (!seen[kk]) { seen[kk] = 1; out.push(w); } }
    return out;
  }
  function hasVoice() { return !!window.MandarinoAndroid || (CP.voices && CP.voices().length > 0); }
  function opts(right, wrong) { var all = shuffle([right].concat(wrong)); return { o: all, a: all.indexOf(right) }; }
  var BUILD = {
    /* significato di una parola scritta in caratteri */
    mean: function (L) {
      var k = pick(pool(L)), w = CP.WORDS[k], d = others(L, k, 3, CP.gloss), x = opts(CP.gloss(w), d.map(CP.gloss));
      return { ask: T("pl.qMean"), big: '<span class="han" lang="zh-CN">' + esc(w.hz) + "</span>", o: x.o.map(function (s) { return '<span lang="it">' + esc(s) + "</span>"; }), a: x.a };
    },
    /* il pinyin giusto, leggendo i caratteri */
    py: function (L) {
      var k = pick(pool(L)), w = CP.WORDS[k], n = CP.syllables(w.py).length, d = others(L, k, 12, function (v) { return v.py; }).filter(function (v) { return CP.syllables(v.py).length === n; }).slice(0, 3);
      if (d.length < 3) d = others(L, k, 3, function (v) { return v.py; });
      var x = opts(w.py, d.map(function (v) { return v.py; }));
      return { ask: T("pl.qPy"), big: '<span class="han" lang="zh-CN">' + esc(w.hz) + "</span>", o: x.o.map(function (p) { return CP.pinyinHTML(p); }), a: x.a };
    },
    /* ascolto: quale pinyin hai sentito */
    tone: function (L) {
      var q = BUILD.py(L), hz = /lang="zh-CN">([^<]+)</.exec(q.big)[1];
      return { ask: T("pl.qTone"), audio: hz, big: "", o: q.o, a: q.a };
    },
    /* una frase d'esempio da capire */
    sent: function (L) {
      var E = window.EXAMPLES || {}, ks = shuffle(pool(L)).filter(function (k) { return E[k]; });
      if (ks.length < 4) return BUILD.mean(L);
      var x = opts(E[ks[0]][1], [E[ks[1]][1], E[ks[2]][1], E[ks[3]][1]]);
      return { ask: T("pl.qSent"), big: '<span class="han pl-sent" lang="zh-CN">' + esc(E[ks[0]][0]) + "</span>", o: x.o.map(function (s) { return '<span lang="it">' + esc(s) + "</span>"; }), a: x.a };
    },
    /* l'ordine giusto delle parole */
    order: function (L) {
      var E = window.EXAMPLES || {}, ks = shuffle(pool(L)).filter(function (k) { return E[k]; });
      for (var i = 0; i < ks.length && i < 30; i++) {
        var zh = E[ks[i]][0], parts = CP.segment(zh.replace(/[。！？，、]/g, "")).filter(function (s) { return !s.p; }).map(function (s) { return s.raw; }).filter(Boolean);
        if (parts.length < 4) continue;
        var right = parts.join(""), wr = [], tries = 0;
        while (wr.length < 2 && tries++ < 20) { var sh = shuffle(parts).join(""); if (sh !== right && wr.indexOf(sh) < 0) wr.push(sh); }
        if (wr.length < 2) continue;
        var x = opts(right, wr);
        return { ask: T("pl.qOrder"), big: '<span class="pl-sent" lang="it">' + esc(E[ks[i]][1]) + "</span>", o: x.o.map(function (s) { return '<span class="han" lang="zh-CN">' + esc(s) + "</span>"; }), a: x.a };
      }
      return BUILD.sent(L);
    }
  };
  /* i tipi di domanda pesati sulla dichiarazione: [pinyin e toni, caratteri, vocabolario, ordine, ascolto] */
  function types(decl) {
    var d = decl.map(function (x) { return Math.max(0, x | 0); }), w = { py: d[0], mean: d[1] + d[2], sent: d[2], order: d[3], tone: hasVoice() ? d[4] : 0 };
    if (!Object.keys(w).some(function (k) { return w[k] > 0; })) w.mean = 1;
    return w;
  }
  function chooseType(w, last) {
    var ks = Object.keys(w).filter(function (k) { return w[k] > 0 && k !== last; }); if (!ks.length) ks = Object.keys(w).filter(function (k) { return w[k] > 0; });
    var tot = ks.reduce(function (a, k) { return a + w[k]; }, 0), r = Math.random() * tot;
    for (var i = 0; i < ks.length; i++) { r -= w[ks[i]]; if (r <= 0) return ks[i]; }
    return ks[0];
  }
  /* corso di italiano: una domanda a scelta del quiz della lezione richiesta */
  var asked = {};
  function itQuestion(lv) {
    var ls = (window.ITLESSONS || []).slice().sort(function (a, b) { return a.n - b.n; }), l = ls[Math.max(0, Math.min(ls.length - 1, lv - 1))];
    var qs = l.quiz.filter(function (q) { return q.k !== "order" && q.opts && !asked[l.id + "|" + q.q]; }); if (!qs.length) qs = l.quiz.filter(function (q) { return q.k !== "order" && q.opts; });
    var q = pick(qs); asked[l.id + "|" + q.q] = 1;
    var x = opts(q.opts[q.a], q.opts.filter(function (o, j) { return j !== q.a; }));
    return { ask: esc(q.q), big: q.it ? '<span lang="it">' + esc(q.it) + "</span>" : "", o: x.o.map(function (s) { return '<span lang="it">' + esc(s) + "</span>"; }), a: x.a };
  }

  function run(box, course, decl, done) {
    var st = PL.start(course, decl), w = course === "it" ? null : types(decl), last = null, q = null, skippedAudio = false;
    asked = {};
    function next() {
      if (PL.done(st)) { done(st); return; }
      if (course === "it") q = itQuestion(st.lv);
      else { last = chooseType(w, last); try { q = BUILD[last](st.lv); } catch (e) { q = BUILD.mean(st.lv); } }
      paint();
      if (q.audio) setTimeout(function () { CP.speak(q.audio, { rate: 0.85 }); }, 250);
    }
    function paint() {
      var n = st.hist.length + 1, M = PL.P.MAX_Q;
      box.innerHTML = '<div class="pl-top"><span class="small muted">' + esc(T("pl.count", { n: n, m: M })) + '</span><button type="button" class="btn-s pl-stop" data-pl-stop>' + esc(T("pl.stop")) + "</button></div>" +
        '<div class="pl-bar" aria-hidden="true"><i style="width:' + Math.round((n - 1) / M * 100) + '%"></i></div>' +
        '<p class="ask pl-ask">' + q.ask + "</p>" + (q.big ? '<div class="pl-big">' + q.big + "</div>" : "") +
        (q.audio ? '<button type="button" class="btn-s pl-play" data-pl-play>🔊 ' + esc(T("pl.listen")) + "</button>" : "") +
        '<div class="ls-opts pl-opts">' + q.o.map(function (o, j) { return '<button type="button" class="ls-opt" data-pl-opt="' + j + '">' + o + "</button>"; }).join("") + "</div>" +
        '<button type="button" class="btn-s pl-idk" data-pl-idk>' + esc(T("pl.idk")) + "</button>" +
        (skippedAudio ? '<p class="small muted">' + esc(T("pl.noVoice")) + "</p>" : "");
      var f = box.querySelector("[data-pl-opt]"); if (f) f.focus({ preventScroll: true });
    }
    function onClick(e) {
      var b = e.target.closest ? e.target.closest("[data-pl-opt], [data-pl-idk], [data-pl-stop], [data-pl-play]") : null; if (!b || !q) return;
      if (b.hasAttribute("data-pl-play")) { CP.speak(q.audio, { rate: 0.85, el: b }); return; }
      if (b.hasAttribute("data-pl-stop")) { box.removeEventListener("click", onClick); done(st, true); return; }
      CP.sfx("tap");
      var ok = b.hasAttribute("data-pl-opt") && +b.getAttribute("data-pl-opt") === q.a;
      PL.answer(st, ok); q = null; next();
    }
    box.addEventListener("click", onClick);
    if (course !== "it" && !hasVoice() && decl[4] > 0) skippedAudio = true;
    next();
    return st;
  }
  /* ---- applicare il livello confermato: parole e lezioni già note, senza XP né registro dei ripassi ---- */
  var DAY = 86400000;
  function due(now) { var a = PL.P.SPREAD[0], b = PL.P.SPREAD[1]; return now + Math.round((a + Math.random() * (b - a)) * DAY); }
  function hskOf() { var m = {}; Object.keys(window.HSK_LEVEL || {}).forEach(function (l) { String(HSK_LEVEL[l]).split("|").forEach(function (k) { if (!m[k]) m[k] = +l; }); }); return m; }
  /* quante parole diventerebbero «note» partendo dal capitolo r (corso di cinese) */
  function zhKeys(r) {
    var out = [], S = CP.S();
    if (r < 2) return out;
    CP.ORDER.forEach(function (k) { var ch = (window.SECTION_CHAPTER || {})[CP.WORDS[k].sec] || 6; if (ch < r && !(S[k] && S[k].n)) out.push([k, ch]); });
    return out;
  }
  function itEntries(l) {
    var lv = Math.floor(l / PL.P.it.hskPerLessons), H = hskOf(), S = itSrs();
    if (lv < 1) return [];
    return (CP.itLexicon ? CP.itLexicon() : []).filter(function (e) { var h = H[e.zh]; return h && h <= lv && !(S[e.id] && S[e.id].c); });
  }
  function jget(k) { try { var o = JSON.parse(localStorage.getItem(k) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function jset(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }
  function itSrs() { return jget("cp-it-srs-v1"); }
  function apply(course, r, decl, est) {
    var now = Date.now(), n = 0, before = CP.unlock ? JSON.stringify(CP.ux.get("unl") || {}) : "{}";
    undo(true);   /* un test rifatto sostituisce quello di prima */
    if (course === "it") {
      var S = itSrs(), L = jget("cp-it-lessons-v1");
      itEntries(r).forEach(function (e) { S[e.id] = { c: { state: FSRS.REVIEW, step: null, st: PL.P.it.stab, df: 5, due: due(now), last: now }, n: 0, lr: now, pl: 1 }; n++; });
      (window.ITLESSONS || []).forEach(function (l) { if (l.n <= r) { var x = L[l.id] || {}; if (!x.done) { L[l.id] = { best: Math.max(x.best || 0, 80), done: now, seen: x.seen || 0, pl: 1 }; } } });
      jset("cp-it-srs-v1", S); jset("cp-it-lessons-v1", L);
    } else {
      var Z = CP.S();
      zhKeys(r).forEach(function (kc) {
        var st = PL.P.zh.stab[kc[1]] || 7;
        Z[kc[0]] = { n: 1, st: st, df: 5, sd: FSRS.REVIEW, sp: null, lr: now, d: due(now), rp: 0, lp: 0, pl: 1, b: Math.max(1, Math.min(6, Math.floor(Math.log2(st)) + 1)) };
        n++;
      });
      CP.setS(Z);
    }
    var adv = course === "it" ? r >= PL.P.it.advanced : r >= PL.P.zh.advanced;
    CP.ux.set("pl", { d: now, c: course, decl: decl || [], est: est, r: r, n: n, adv: adv ? 1 : 0, unl0: JSON.parse(before) });
    if (CP.game && CP.game.grant) CP.game.grant(PL.grantFor(course, r));
    if (CP.unlock) CP.unlock.check(true);
    return n;
  }
  /* annullare il salto: via le parole segnate dal test e mai ripassate, via i punti, gli sblocchi tornano come prima */
  function undo(quiet) {
    var pl = CP.ux.get("pl"); if (!pl || pl.undone) return 0;
    var n = 0;
    if (pl.c === "it") {
      var S = itSrs(), L = jget("cp-it-lessons-v1");
      Object.keys(S).forEach(function (k) { if (S[k] && S[k].pl && !S[k].n) { delete S[k]; n++; } });
      Object.keys(L).forEach(function (k) { var x = L[k]; if (x && x.pl && (x.best || 0) <= 80) delete L[k]; });
      jset("cp-it-srs-v1", S); jset("cp-it-lessons-v1", L);
    } else {
      var Z = CP.S();
      Object.keys(Z).forEach(function (k) { if (Z[k] && Z[k].pl && Z[k].n === 1) { delete Z[k]; n++; } });
      CP.setS(Z);
    }
    if (CP.game && CP.game.ungrant) CP.game.ungrant();
    pl.undone = 1; CP.ux.set("pl", pl);
    if (!quiet && pl.unl0) { CP.ux.set("unl", pl.unl0); if (CP.unlock) CP.unlock.check(true); }
    return n;
  }
  CP.placement = { PL: PL, run: run, build: BUILD, pool: pool, apply: apply, undo: undo, preview: function (course, r) { return course === "it" ? itEntries(r).length : zhKeys(r).length; } };
})();
