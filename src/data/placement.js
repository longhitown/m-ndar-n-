/* màndarínō · test di livello: parametri e motore (funzioni pure, nessun accesso alla pagina: le prove in Node lo usano
   così com'è, tools/unit.mjs simula utenti di ogni livello). Le domande le costruisce ui/placement.js con i dati dell'app.

   Corso di cinese (livelli HSK 1-5, il 6 si apre dopo risposte giuste al 5). Una scala a gradini sceglie il livello della
   domanda: giusta → si sale, sbagliata o «non lo so» → si scende. Dopo al massimo 10 domande, o prima se le ultime quattro
   oscillano tra due livelli vicini, si stima il «livello di rottura»: il livello T che spiega meglio le risposte, se chi sa
   fino a T risponde giusto quasi sempre (P_KNOW) e oltre T tira a indovinare (1 / numero di opzioni). È la stima di massima
   verosimiglianza; a parità vince il valore più basso, perché sbagliare per difetto costa meno che per eccesso.

   Corso di italiano (0-30 lezioni note, quiz a 3 opzioni). Qui la scala a gradini sbagliava troppo, quindi la domanda è
   quella che più riduce l'incertezza sul livello (entropia attesa) e la stima è la mediana del posteriore, con la
   dichiarazione iniziale come prior. Simulazione (tools/unit.mjs): entro ±1 livello (cinese) e ±3 lezioni (italiano) in
   più del 90% delle prove, per ogni livello vero. */
var PLACEMENT = (function () {
  var P = {
    MAX_Q: 10,
    P_KNOW: 0.9,
    zh: {
      min: 1, max: 5, top: 6,                 /* il 6 («oltre l'HSK») solo dopo risposte giuste al 5 */
      guess: 0.25,                            /* 4 opzioni */
      /* punti iniziali per capitolo di partenza: portano il grado al punto corrispondente, con un tetto */
      grant: { 1: 0, 2: 200, 3: 600, 4: 1500, 5: 3000, 6: 3000 },
      /* stabilità (giorni) delle parole segnate come note: più alta per i capitoli più facili */
      stab: { 1: 30, 2: 21, 3: 14, 4: 10, 5: 7, 6: 7 },
      advanced: 2                             /* da questo capitolo di partenza tutte le schede sono aperte */
    },
    it: {
      min: 1, max: 30, guess: 1 / 3,          /* 3 opzioni nei quiz delle lezioni */
      grant: [[22, 3000], [15, 1500], [10, 600], [5, 200]],   /* [lezioni note almeno, punti] */
      stab: 14, advanced: 6,
      /* parole del lessico che diventano note: quelle dei livelli HSK fino a floor(lezioni / 6) */
      hskPerLessons: 6
    },
    SPREAD: [14, 28]                          /* le scadenze dei ripassi si spargono tra 2 e 4 settimane */
  };
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  /* dichiarazione: 5 valori da 0 (mai) a 3 (bene) → livello di partenza */
  function startOf(course, decl) {
    var d = (decl || []).filter(function (x) { return x >= 0; }), avg = d.length ? d.reduce(function (a, b) { return a + b; }, 0) / d.length : 0;
    return course === "it" ? clamp(1 + Math.round(avg * 10), 1, P.it.max) : clamp(1 + Math.round(avg * 1.4), 1, P.zh.max);
  }
  /* corso di italiano: 31 possibili livelli (0-30 lezioni note) e quiz a 3 opzioni. Qui una scala a gradini sbaglia troppo
     (prova: ±3 lezioni solo nell'85% dei casi), quindi la domanda si sceglie sul posteriore: si chiede la lezione per cui
     la probabilità di saperla è più vicina al 50%. Il punto di partenza dichiarato fa da prior (larghezza PRIOR_SD). */
  P.it.PRIOR_SD = 7;
  function post(s) {
    var top = P.it.max, m = s.lv0, w = [];
    for (var T = 0; T <= top; T++) {
      var L = -0.5 * Math.pow((T - m) / P.it.PRIOR_SD, 2);
      s.hist.forEach(function (x) { var p = x[0] <= T ? P.P_KNOW : P.it.guess; L += Math.log(x[1] ? p : 1 - p); });
      w.push(L);
    }
    var mx = Math.max.apply(null, w), z = 0; w = w.map(function (l) { var e = Math.exp(l - mx); z += e; return e; });
    return w.map(function (e) { return e / z; });
  }
  /* la domanda che più riduce l'incertezza (entropia attesa del posteriore dopo la risposta) */
  function nextIt(s) {
    var p = post(s), best = 1, bH = Infinity, K = P.P_KNOW, g = P.it.guess;
    function H(q) { var z = 0, h = 0; q.forEach(function (x) { z += x; }); q.forEach(function (x) { if (x > 0) { var y = x / z; h -= y * Math.log(y); } }); return [h, z]; }
    for (var l = 1; l <= P.it.max; l++) {
      var okq = p.map(function (x, T) { return x * (T >= l ? K : g); }), koq = p.map(function (x, T) { return x * (T >= l ? 1 - K : 1 - g); });
      var a = H(okq), b = H(koq), e = a[1] * a[0] + b[1] * b[0];
      if (e < bH - 1e-12) { bH = e; best = l; }
    }
    return best;
  }
  function start(course, decl) {
    var s = { course: course, lv: startOf(course, decl), step: 1, dir: 0, hist: [] };
    if (course === "it") { s.lv0 = s.lv; s.lv = nextIt(s); }
    return s;
  }
  function cap(s) {
    if (s.course === "it") return P.it.max;
    return s.hist.some(function (h) { return h[0] === 5 && h[1]; }) ? P.zh.top : P.zh.max;
  }
  function answer(s, ok) {
    s.hist.push([s.lv, !!ok]);
    if (s.course === "it") { s.lv = nextIt(s); return s; }
    s.lv = clamp(s.lv + (ok ? 1 : -1), P.zh.min, cap(s));
    return s;
  }
  /* fine: 10 domande, oppure le ultime 4 risposte oscillano tra due livelli vicini (giusta sotto, sbagliata sopra) */
  function done(s) {
    var h = s.hist, n = h.length;
    if (n >= P.MAX_Q) return true;
    if (n < 6) return false;
    var last = h.slice(-4), lv = last.map(function (x) { return x[0]; }), lo = Math.min.apply(null, lv), hi = Math.max.apply(null, lv);
    if (s.course === "it") return false;   /* l'italiano usa tutte le 10 domande: con 31 livelli servono */
    if (hi - lo !== 1) return false;
    return last.every(function (x) { return (x[0] === lo) === x[1]; });
  }
  /* stima: il livello noto più alto (0 = nessuno) che rende più probabili le risposte date */
  function estimate(s) {
    var c = s.course === "it" ? P.it : P.zh, top = s.course === "it" ? P.it.max : P.zh.top, best = 0, bestL = -Infinity;
    if (s.course === "it") { var p = post(s), acc = 0; for (var i = 0; i < p.length; i++) { acc += p[i]; if (acc >= 0.5) return i; } return p.length - 1; }
    for (var T = 0; T <= top; T++) {
      var L = 0;
      s.hist.forEach(function (x) { var p = x[0] <= T ? P.P_KNOW : c.guess; L += Math.log(x[1] ? p : 1 - p); });
      if (L > bestL + 1e-9) { bestL = L; best = T; }
    }
    return best;
  }
  /* corso di cinese: il capitolo da cui ripartire; corso di italiano: le lezioni note */
  function result(s) { var e = estimate(s); return s.course === "it" ? e : Math.min(P.zh.top, e + 1); }
  function grantFor(course, r) {
    if (course === "it") { for (var i = 0; i < P.it.grant.length; i++) if (r >= P.it.grant[i][0]) return P.it.grant[i][1]; return 0; }
    return P.zh.grant[r] || 0;
  }
  return { P: P, startOf: startOf, start: start, answer: answer, done: done, estimate: estimate, result: result, grantFor: grantFor };
})();
