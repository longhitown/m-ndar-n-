/* màndarínō · taglio di un testo cinese nelle parole del vocabolario. Lo stesso codice gira nella pagina (CP.segment, in
   src/core/core.js) e negli strumenti Node (tools/lib/lab.mjs), così build e app tagliano le frasi allo stesso modo.
   Tra tutte le divisioni possibili si sceglie la più probabile (programmazione dinamica su un modello a unigrammi): ogni
   parola costa log(rango di frequenza) più una piccola quota fissa, un carattere sconosciuto costa molto.
   Così 你有时间吗 = 你|有|时间|吗 (non 有时|间) e 他从中国来 = 他|从|中国|来 (non 从中|国). */
var MDSegment = (function () {
  var CJK = /[㐀-鿿]/, RARE = 3000, UNK = Math.log(3e6), TOK = 1.5;
  function make(WORDS, freq) {
    var RANK = {}, MAXL = 1, has = Object.prototype.hasOwnProperty;
    String(freq || "").split("|").forEach(function (w, i) { if (w) RANK[w] = i + 1; });
    Object.keys(WORDS).forEach(function (k) { MAXL = Math.max(MAXL, Array.from(WORDS[k].hz).length); });
    /* una parola che non è nella lista di frequenza (spesso una frase fatta come 你好 o 这个) vale quanto il suo
       carattere meno comune: non deve perdere contro i suoi stessi pezzi */
    function est(w) { var r = 0; Array.from(w).forEach(function (c) { r = Math.max(r, RANK[c] || RARE); }); return r; }
    /* composti che nelle frasi sono più spesso due parole: 才能 «talento» ma 只有…才能… = 才|能; 个人 ma 这个人 = 这个|人 */
    var WEAK = { "才能": 3, "只有": 2, "还有": 2, "有时": 2, "从中": 2, "个人": 2, "有一些": 4, "请进": 2.5, "请坐": 2.5 };
    /* parole che dipendono dal contesto: 他的话 = 他的|话 (non «se»), 八点十分 = 十|分 (non «molto»); un costo negativo
       restituisce il composto debole dove è un nome: 他的才能 «il suo talento», 个人信息 «dati personali» */
    var CTX = [[/^的话$/, /[我你他她它们]$/, null, 4], [/^十分$/, /点$/, null, 9], [/^挺好$/, null, /^[吃看听玩用喝]/, 6],
      [/^才能$/, /[的有]$/, null, -3], [/^个人$/, /(^|[的我你他她])$/, null, -2]];
    function ctx(w, before, after) {
      var p = 0;
      for (var i = 0; i < CTX.length; i++) if (CTX[i][0].test(w) && (!CTX[i][1] || CTX[i][1].test(before)) && (!CTX[i][2] || CTX[i][2].test(after))) p += CTX[i][3];
      return p;
    }
    /* caratteri che oggi vivono quasi sempre dentro parole composte: da soli costano di più (中文|学 e non 中|文学) */
    var BOUND = { "中": 1.5, "国": 1.5, "文": 1.5, "时": 1.5, "间": 1.5, "日": 1, "语": 1.5 };
    function cost(w) { return Math.log((RANK[w] || est(w)) + 20) + TOK + (WEAK[w] || 0) + (BOUND[w] || 0); }
    function run(cs) {
      var n = cs.length, best = [0], prev = [], wi = [], i, L;
      for (i = 1; i <= n; i++) best[i] = Infinity;
      for (i = 0; i < n; i++) {
        if (best[i] === Infinity) continue;
        if (best[i] + UNK < best[i + 1]) { best[i + 1] = best[i] + UNK; prev[i + 1] = i; wi[i + 1] = null; }
        for (L = 1; L <= MAXL && i + L <= n; L++) {
          var sub = cs.slice(i, i + L).join("");
          if (!has.call(WORDS, sub)) continue;
          var c = best[i] + cost(sub) + ctx(sub, cs.slice(Math.max(0, i - 2), i).join(""), cs.slice(i + L, i + L + 1).join(""));
          if (c < best[i + L] - 1e-9) { best[i + L] = c; prev[i + L] = i; wi[i + L] = sub; }
        }
      }
      var out = [], j = n;
      while (j > 0) { var p = prev[j]; out.push(wi[j] ? { w: WORDS[wi[j]], raw: wi[j] } : { w: null, raw: cs[p] }); j = p; }
      return out.reverse();
    }
    /* [{ w: parola | null, raw: testo, p: true se è punteggiatura o testo non cinese }] */
    function segment(raw) {
      var s = Array.from(String(raw)), out = [], i = 0, j;
      while (i < s.length) {
        j = i;
        if (!CJK.test(s[i])) { while (j < s.length && !CJK.test(s[j])) j++; out.push({ w: null, raw: s.slice(i, j).join(""), p: true }); i = j; continue; }
        while (j < s.length && CJK.test(s[j])) j++;
        Array.prototype.push.apply(out, run(s.slice(i, j)));
        i = j;
      }
      return out;
    }
    segment.rank = function (hz) { return RANK[hz] || 0; };
    return segment;
  }
  return { make: make };
})();
if (typeof module !== "undefined" && module.exports) module.exports = MDSegment;
