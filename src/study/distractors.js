/* ===== màndarínō · risposte sbagliate credibili per la scelta multipla. Funzioni pure: ricevono il pool
   delle parole e un seme, quindi le stesse domande escono uguali nelle prove (seme = hash(parola + data + tipo)).
   Regole:
     - livello vicino (±1) e, per il 40%, la stessa tappa; lunghezza simile, per non dare indizi;
     - significato: nessuna risposta sbagliata che condivida una parola con quella giusta (niente sinonimi né quasi uguali);
       di ogni glossa si usa la prima alternativa;
     - pinyin: al massimo due con la stessa sillaba e altri toni, una con una confusione tipica (zh/z, n/l, an/ang…);
     - ascolto: niente opzioni con la stessa pronuncia della giusta (他/她/它) né parole con più letture;
     - niente doppioni, la giusta in un posto a caso; con meno di 3 candidati la domanda non si fa (null).
   CP.distract.{ seed, rng, shuffle, gloss, meaning, word, pinyin, listen, options, itWords }. Gruppo ESERCIZI (al primo uso). ===== */
(function (root) {
  var STOP = { il: 1, lo: 1, la: 1, gli: 1, le: 1, un: 1, una: 1, uno: 1, di: 1, da: 1, del: 1, della: 1, per: 1, con: 1, che: 1, non: 1, essere: 0, qualcosa: 1, qualcuno: 1, molto: 1, piu: 1 };
  /* hash FNV-1a a 32 bit e generatore mulberry32 */
  function seed(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(s) { var a = s >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function plain(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  /* la prima alternativa di una glossa: prima di virgola, punto e virgola, barra, due punti o parentesi */
  function gloss(it) { var g = String(it).split(/[;,/(:]/)[0].trim(); return g || String(it).trim(); }
  function words(it) { return plain(it).split(/[^a-z]+/).filter(function (w) { return w.length >= 3 && !STOP[w]; }); }
  function sharesWord(a, b) { var A = {}; words(a).forEach(function (w) { A[w] = 1; }); return words(b).some(function (w) { return A[w]; }); }
  function nChars(w) { return Array.from(w.hz).length; }
  /* candidati comuni: livello ±1, non la stessa parola, non gli stessi caratteri; per il 40% della stessa tappa */
  function base(w, pool, ctx, r, n, ok) {
    var lv = ctx.levelOf(w), same = [], near = [];
    pool.forEach(function (x) {
      if (x === w || x.hz === w.hz || !ok(x)) return;
      var d = Math.abs(ctx.levelOf(x) - lv); if (d > 1) return;
      (x.sec === w.sec ? same : near).push(x);
    });
    same = shuffle(same, r); near = shuffle(near, r);
    var want = Math.round(n * 0.4), out = same.slice(0, want);
    near.forEach(function (x) { if (out.length < n && out.indexOf(x) < 0) out.push(x); });
    same.forEach(function (x) { if (out.length < n && out.indexOf(x) < 0) out.push(x); });
    return out;
  }
  /* significato in italiano: glosse diverse, senza parole in comune, lunghezza simile */
  function meaning(w, pool, ctx, r) {
    var g = gloss(w.it), L = g.length, seen = {}; seen[plain(g)] = 1;
    var c = base(w, pool, ctx, r, 40, function (x) {
      var gx = gloss(x.it), k = plain(gx);
      if (seen[k] || sharesWord(g, gx) || sharesWord(w.it, x.it)) return false;
      return gx.length <= Math.max(6, L * 2.2) && gx.length >= Math.min(L / 2.2, 4);
    });
    var out = [];
    c.forEach(function (x) { var k = plain(gloss(x.it)); if (out.length < 3 && !seen[k]) { seen[k] = 1; out.push(x); } });
    return out.length >= 3 ? out : null;
  }
  /* il carattere giusto per un significato: stesso numero di caratteri (o ±1), glosse senza parole in comune */
  function word(w, pool, ctx, r) {
    var n = nChars(w), seen = {}; seen[w.hz] = 1;
    var c = base(w, pool, ctx, r, 40, function (x) { return Math.abs(nChars(x) - n) <= (n > 2 ? 1 : 0) && !sharesWord(w.it, x.it); });
    var out = []; c.forEach(function (x) { if (out.length < 3 && !seen[x.hz]) { seen[x.hz] = 1; out.push(x); } });
    return out.length >= 3 ? out : null;
  }
  /* pinyin: stessa sillaba con altri toni (al massimo due), una confusione tipica, il resto da parole simili.
     Si lavora sulla sillaba senza accento più il tono (core/typing.js) e si rimette l'accento alla fine. */
  var INI = [["zh", "z"], ["ch", "c"], ["sh", "s"], ["n", "l"], ["f", "h"]], FIN = [["ang", "an"], ["eng", "en"], ["ing", "in"]];
  function TY() { return (root.CP && root.CP.typing) || root.MDTyping; }
  function sylls(py) { return String(py).split(/[.\s']+/).filter(Boolean); }
  function confuse(p) {
    var out = [];
    INI.forEach(function (x) {
      if (p.indexOf(x[0]) === 0) out.push(x[1] + p.slice(x[0].length));
      else if (p.indexOf(x[1]) === 0 && !(x[1].length === 1 && /^[zcs]h/.test(p))) out.push(x[0] + p.slice(x[1].length));
    });
    FIN.forEach(function (x) {
      if (p.slice(-x[0].length) === x[0]) out.push(p.slice(0, -x[0].length) + x[1]);
      else if (p.slice(-x[1].length) === x[1]) out.push(p.slice(0, -x[1].length) + x[0]);
    });
    return out;
  }
  function pinyin(w, pool, ctx, r) {
    var S = sylls(w.py), I = S.map(function (x) { return TY().syllableInfo(x); }), seen = {}, out = [];
    var mark = function (p, t) { return TY().syllableNumToMark(p + (t || 5)); };
    var key = function (arr) { return arr.join(" "); };
    seen[key(S)] = 1;
    var add = function (arr) { var k = key(arr); if (!seen[k] && out.length < 3) { seen[k] = 1; out.push(k); return true; } return false; };
    /* altri toni: il tono di una sillaba (a caso) cambia */
    var tones = 0;
    shuffle(S.map(function (_, i) { return i; }), r).forEach(function (i) {
      if (tones >= 2 || !I[i].tone) return;
      shuffle([1, 2, 3, 4].filter(function (t) { return t !== I[i].tone; }), r).forEach(function (t) { if (tones >= 2) return; var s = S.slice(); s[i] = mark(I[i].plain, t); if (add(s)) tones++; });
    });
    /* una confusione tipica (iniziale o finale), con lo stesso tono */
    shuffle(S.map(function (_, i) { return i; }), r).some(function (i) {
      return shuffle(confuse(I[i].plain), r).some(function (p) { var s = S.slice(); s[i] = mark(p, I[i].tone); return add(s); });
    });
    /* il resto: il pinyin di parole con lo stesso numero di sillabe */
    if (out.length < 3) base(w, pool, ctx, r, 60, function (x) { return sylls(x.py).length === S.length; }).forEach(function (x) { add(sylls(x.py)); });
    return out.length >= 3 ? out : null;
  }
  /* ascolto: risposte con una pronuncia diversa dalla giusta e senza più letture */
  function listen(w, pool, ctx, r) {
    var me = plain(sylls(w.py).join("")) + "|" + toneSig(w.py);
    var c = base(w, pool, ctx, r, 40, function (x) { return !(ctx.poly && ctx.poly(x.hz)) && plain(sylls(x.py).join("")) + "|" + toneSig(x.py) !== me && !sharesWord(w.it, x.it) && Math.abs(nChars(x) - nChars(w)) <= 1; });
    var out = [], seen = {}; seen[w.hz] = 1; c.forEach(function (x) { if (out.length < 3 && !seen[x.hz]) { seen[x.hz] = 1; out.push(x); } });
    return out.length >= 3 ? out : null;
  }
  function toneSig(py) { return sylls(py).map(function (s) { return TY().syllableInfo(s).tone || 5; }).join(""); }
  /* corso di italiano (voci di it/course.js: { id, it, zh, kind, g, sec }): stessa specie e, per i nomi, stesso genere (così
     l'articolo non dà la risposta); livello ±1 dal capitolo della tappa; nessun carattere cinese in comune con la giusta
     (niente quasi sinonimi come 学生/学校); né lo stesso italiano né lo stesso cinese due volte. */
  function hanSet(s) { var o = {}; Array.from(String(s)).forEach(function (c) { if (/[\u3400-\u9fff]/.test(c)) o[c] = 1; }); return o; }
  function itWords(e, pool, ctx, r) {
    var lv = ctx.levelOf(e), H = hanSet(e.zh), same = [], near = [], seenIt = {}, seenZh = {};
    seenIt[plain(e.it)] = 1; seenZh[e.zh] = 1;
    pool.forEach(function (x) {
      if (x.id === e.id || x.kind !== e.kind || (e.kind === "noun" && x.g !== e.g)) return;
      if (Math.abs(ctx.levelOf(x) - lv) > 1) return;
      if (Array.from(String(x.zh)).some(function (c) { return H[c]; })) return;
      (x.sec === e.sec ? same : near).push(x);
    });
    same = shuffle(same, r); near = shuffle(near, r);
    var out = [], take = function (x) { var a = plain(x.it), b = x.zh; if (out.length >= 3 || seenIt[a] || seenZh[b]) return; seenIt[a] = 1; seenZh[b] = 1; out.push(x); };
    same.slice(0, 1).forEach(take); near.forEach(take); same.forEach(take);
    return out.length >= 3 ? out : null;
  }
  /* la giusta in un posto a caso tra le sbagliate */
  function options(right, wrong, r) { var all = shuffle(wrong.concat([right]), r); return { opts: all, right: all.indexOf(right) }; }

  var API = { seed: seed, rng: rng, shuffle: shuffle, gloss: gloss, sharesWord: sharesWord, meaning: meaning, word: word, pinyin: pinyin, listen: listen, options: options, toneSig: toneSig, itWords: itWords };
  if (root.CP) root.CP.distract = API; else root.MDDistract = API;
})(typeof window !== "undefined" ? window : this);
