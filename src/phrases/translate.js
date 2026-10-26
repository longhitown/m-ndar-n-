/* Traduttore del laboratorio, cinese → italiano. Prudente per costruzione:
   1. una frase verificata (src/data/verified.js, le frasi tradotte a mano nell'app, le correzioni dell'utente) vince sempre;
   2. altrimenti analizza la frase con le regole e le schede di src/data/grammar.js;
   3. se una parola non ha la scheda o la costruzione non è tra quelle note, NON indovina: risponde
      «Non so ancora tradurre questa frase», mostra la frase parola per parola e dice che cosa manca.
   Le regole si provano con «node tools/grammar.mjs» su tutte le frasi verificate. */
(function () {
  var CP = window.CP, I = CP.ita, G = GRAM, W = CP.WORDS;
  var NOPE = "Non so ancora tradurre questa frase.";
  function hz(k) { return W[k] ? W[k].hz : String(k); }
  /* scheda di una parola: la chiave esatta se ha «#» (omografi), altrimenti i caratteri */
  function lex(t, k) { if (k == null) return undefined; if (Object.prototype.hasOwnProperty.call(t, k)) return t[k]; if (String(k).indexOf("#") >= 0) return undefined; var h = hz(k); return Object.prototype.hasOwnProperty.call(t, h) ? t[h] : undefined; }
  function gloss(k) { return W[k] ? CP.gloss(W[k]) : String(k); }

  /* parole grammaticali (non sono dati da ampliare: ognuna ha una regola nel codice qui sotto) */
  var NEG = { "不": 1, "没": 1, "没有": 1 }, MODAL = { "想": 1, "要": 1, "想要": 1, "会": 1, "能": 1, "可以": 1, "应该": 1, "必须": 1 };
  var FINAL = { "吗": 1, "呢": 1, "吧": 1 };
  var DEMS = { "这": ["这", 0], "那": ["那", 0], "这个": ["这", 1], "那个": ["那", 1], "这些": ["这", 2], "那些": ["那", 2] };
  var ADVS = { "也": 1, "都": 1, "还": 1, "已经": 1, "只": 1, "经常": 1, "一直": 1, "马上": 1, "有时候": 1, "从来不": 1 };
  var QPLACE = { "哪里": 1, "哪儿": 1 };
  var ABIL = { "说": 1, "写": 1, "读": 1, "画": 1, "做": 1, "唱歌": 1, "跳舞": 1, "游泳": 1, "做饭": 1, "开车": 1 };

  var NOTES = [], CURSUBJ = null;
  function Fail(msg, k) { this.msg = msg; this.k = k; }
  function fail(msg, k) { throw new Fail(msg, k); }

  /* ================= analisi ================= */
  function Parser(keys) { this.k = keys; this.i = 0; }
  Parser.prototype.h = function (o) { var k = this.k[this.i + (o || 0)]; return k == null ? null : hz(k); };
  Parser.prototype.key = function (o) { return this.k[this.i + (o || 0)]; };
  Parser.prototype.end = function () { return this.i >= this.k.length; };
  Parser.prototype.eat = function (h) { if (this.h() === h) { this.i++; return true; } return false; };

  function isNoun(k) { return lex(G.nouns, k) !== undefined; }
  function isPlace(k) { return lex(G.places, k) !== undefined; }
  function isVerb(k) { return lex(G.verbs, k) !== undefined; }
  function isAdj(k) { return lex(G.adjs, k) !== undefined || lex(G.haveAdjs, k) !== undefined; }
  function isNum(h) { return h != null && G.nums[h] !== undefined; }
  function zhNum(hs) {   /* 二十 = 20, 十二 = 12, 三十五 = 35, 一百 = 100, 三百五 = 350 */
    var total = 0, cur = 0, unit = 0, zero = false;
    hs.forEach(function (h) { var v = G.nums[h]; if (v === 10 || v === 100) { total += (cur || 1) * v; cur = 0; unit = v; zero = false; } else if (v === 0) zero = true; else cur = v; });
    if (cur && unit === 100 && !zero && hs.length > 2) cur *= 10;
    return total + cur;
  }

  /* sintagma nominale */
  Parser.prototype.np = function () {
    var h = this.h(), k = this.key(), np;
    if (h == null) return null;
    if (G.pron[h]) {
      var nk = this.key(1), nh = this.h(1);
      if (nh === "的" && this.key(2) && isNoun(this.key(2))) { this.i += 3; return { t: "poss", pron: h, head: this.k[this.i - 1] }; }
      if (nk && isNoun(nk) && /[rk]/.test(lex(G.nouns, nk)[3] || "")) {
        this.i += 2; var po = { t: "poss", pron: h, head: nk, noDe: true };
        if (this.h() === "的" && this.key(1) && isNoun(this.key(1))) { this.i += 2; return { t: "of", owner: po, head: this.key(-1) }; }
        return po;
      }
      this.i++; return { t: "pron", pron: h };
    }
    if (DEMS[h]) {
      var d = DEMS[h]; this.i++;
      np = { t: "dem", dem: d[0], plural: d[1] === 2 };
      if (d[1] === 0) { var nn = this.numSeq(); if (nn != null) np.n = nn; if (G.clf[this.h()] !== undefined) { np.clf = this.h(); this.i++; } }
      if (this.key() && isNoun(this.key())) { np.head = this.key(); this.i++; }
      else if (np.n != null) fail("dopo il numero manca la cosa contata", this.key());
      if (np.n != null && np.n > 1) np.plural = true;
      return np;
    }
    if (h === "几" || h === "多少") {
      this.i++; var qc = G.clf[this.h()] !== undefined ? this.h() : null; if (qc) this.i++;
      if (this.h() === "岁") { this.i++; return { t: "qage" }; }
      if (h === "多少" && this.h() === "钱") { this.i++; return { t: "qprice" }; }
      if (this.key() && isNoun(this.key())) { this.i++; return { t: "qnum", head: this.key(-1), clf: qc }; }
      fail("dopo «" + h + "» mi serve la cosa da contare", this.key());
    }
    if (isNum(h)) {
      var n = this.numSeq(), c = G.clf[this.h()] !== undefined ? this.h() : null;
      if (this.h() === "岁") { this.i++; return { t: "age", n: n }; }
      if (c) this.i++;
      if (this.key() && isNoun(this.key())) {
        if (!c && n > 0) fail("tra il numero e la cosa manca il classificatore (一个, 一本, 两杯…)", this.key());
        this.i++; return { t: "count", n: n, clf: c, head: this.key(-1) };
      }
      fail("dopo il numero manca la cosa contata", this.key());
    }
    if (h === "很" && this.h(1) === "多" && this.key(2) && isNoun(this.key(2))) { this.i += 3; return { t: "many", head: this.key(-1) }; }
    if ((QPLACE[h] || h === "哪") && this.h(1) === "人") { this.i += 2; return { t: "qnat" }; }
    if (G.nations[h] !== undefined && this.h(1) === "人") { this.i += 2; return { t: "nat", nat: h }; }
    if (h === "什么") { this.i++; if (this.key() && isNoun(this.key())) { this.i++; return { t: "qwhich", head: this.key(-1) }; } return { t: "q", q: "什么" }; }
    if (h === "谁") { this.i++; return { t: "q", q: "谁" }; }
    if (isNoun(k)) {
      this.i++;
      if (this.h() === "的" && this.key(1) && isNoun(this.key(1))) { this.i += 2; return { t: "of", owner: { t: "noun", head: k }, head: this.key(-1) }; }
      return { t: "noun", head: k };
    }
    if (isPlace(k)) { this.i++; return { t: "place", head: k }; }
    return null;
  };
  Parser.prototype.numSeq = function () { var hs = []; while (isNum(this.h())) { hs.push(this.h()); this.i++; } return hs.length ? zhNum(hs) : null; };
  Parser.prototype.place = function () {
    var k = this.key();
    if (k && isPlace(k)) { this.i++; return { t: "place", head: k }; }
    var save = this.i, np = this.np();
    if (np && np.t === "poss" && hz(np.head) === "家") return np;
    this.i = save; return null;
  };

  /* frase: [tempo] soggetto [tempo] [avverbi] [不/没] [modale] [跟…/在…/给…/从…] predicato [了] [吗/呢/吧] */
  function parse(keys) {
    var p = new Parser(keys), S = { time: [], adv: [], pp: [] };
    if (p.h() === "有时候") { S.adv.push("有时候"); p.i++; }
    function times() { while (p.key() && lex(G.time, p.key()) !== undefined) { S.time.push(p.h()); p.i++; } }
    times();
    /* soggetto */
    var h0 = p.h();
    if (h0 === "谁") { p.i++; S.subj = { t: "q", q: "谁" }; }
    else if (h0 && !isVerb(p.key()) && !MODAL[h0] && !NEG[h0] && !isAdj(p.key()) && h0 !== "是" && h0 !== "有" && h0 !== "在" && !ADVS[h0]) {
      var save = p.i, np = p.np();
      if (np) S.subj = np; else p.i = save;
      if (np && np.t === "place" && (p.h() === "有" || p.h() === "没有")) { S.topicPlace = np; S.subj = null; }
    }
    times();
    if (p.h() === "为什么" || p.h() === "怎么") { S.qadv = p.h(); p.i++; }
    if (p.h() === "什么时候") { S.qwhen = true; p.i++; }
    while (p.h() && ADVS[p.h()]) { S.adv.push(p.h()); p.i++; }
    if (p.h() === "为什么" || p.h() === "怎么") { S.qadv = p.h(); p.i++; }
    if (p.h() === "不" || p.h() === "没" || (p.h() === "没有" && (isVerb(p.key(1)) || p.h(1) === "去"))) { S.neg = p.h(); p.i++; }
    if (p.h() === "太" && S.neg === "不") { S.notVery = true; p.i++; }
    if (p.h() === "会" && p.key(1) && (isAdj(p.key(1)) || G.degree[p.h(1)] !== undefined && isAdj(p.key(2)))) { S.modal = "会"; p.i++; }
    else if (p.h() && MODAL[p.h()] && (isVerb(p.key(1)) || ADVS[p.h(1)] || p.h(1) === "跟" || p.h(1) === "和" || p.h(1) === "在" || p.h(1) === "给" || p.h(1) === "去" || p.h(1) === "一起")) {
      if (p.h() === "要" && S.neg === "不" && !S.subj) fail("「不要 + verbo」 è un divieto: non lo traduco ancora");
      S.modal = p.h(); p.i++;
    }
    /* complementi prima del verbo */
    for (;;) {
      var hh = p.h();
      if ((hh === "跟" || hh === "和") && S.subj) { p.i++; var wn = p.np(); if (!wn) fail("dopo «" + hh + "» mi serve una persona", p.key()); S.pp.push({ t: "with", np: wn }); if (p.eat("一起")) S.together = true; continue; }
      if (hh === "一起") { p.i++; S.together = true; continue; }
      if (hh === "在" && p.key(1) && !isVerb(p.key(1))) {
        var save2 = p.i; p.i++; var pl = p.place();
        if (pl && !p.end() && !FINAL[p.h()]) { S.pp.push({ t: "at", np: pl }); continue; }
        p.i = save2; break;
      }
      if (hh === "给" && S.subj) {
        var save4 = p.i; p.i++; var gn = p.np(); if (!gn) fail("dopo «给» mi serve una persona", p.key());
        if (p.key() && (isVerb(p.key()) || MODAL[p.h()] || ADVS[p.h()])) { S.pp.push({ t: "to", np: gn }); continue; }
        p.i = save4; break;   /* 我给你一本书: qui 给 è il verbo «dare» */
      }
      if (hh === "从") { p.i++; var fp = p.place(); if (!fp) fail("dopo «从» mi serve un luogo", p.key()); S.pp.push({ t: "from", np: fp }); continue; }
      break;
    }
    if (!S.neg && (p.h() === "不" || p.h() === "没")) { S.neg = p.h(); p.i++; }
    /* domanda «sì o no» col verbo ripetuto: 是不是, 有没有, 去不去 */
    if (!S.neg && p.h() && (p.h(1) === "不" || p.h(1) === "没") && p.h(2) === p.h()) { S.anotA = true; p.i += 2; }
    else if (!S.neg && p.h() && (p.h(1) === "不" + p.h() || p.h(1) === "没" + p.h())) { S.anotA = true; p.i += 1; p.k = p.k.slice(); p.k[p.i] = p.k[p.i - 1]; }
    /* predicato */
    var h = p.h(), k = p.key();
    if (h == null) fail("manca il verbo");
    if ((h === "很" || h === "非常") && (p.h(1) === "喜欢" || p.h(1) === "爱")) { S.likeMuch = true; p.i++; h = p.h(); k = p.key(); }
    if (h === "呢" && p.i === p.k.length - 1 && S.subj && !S.time.length && !S.adv.length && !S.neg && !S.modal && !S.pp.length) { p.i++; S.pred = { t: "ne" }; return S; }
    if ((h === "多少钱" || h === "多少" && p.h(1) === "钱") && S.subj) { p.i += h === "多少钱" ? 1 : 2; S.pred = { t: "price" }; if (p.h() && FINAL[p.h()]) { S.fin = p.h(); p.i++; } if (!p.end()) fail("non so dove mettere «" + p.h() + "» in questa frase", p.key()); return S; }
    if (h === "是" || h === "不是") {
      if (h === "不是") S.neg = "不"; p.i++;
      var pn = p.np(); if (!pn) fail("dopo «是» mi serve chi o che cosa", p.key());
      S.pred = { t: "cop", np: pn };
    } else if (h === "有" || h === "没有") {
      if (h === "没有") S.neg = "没"; p.i++;
      var hn = p.np(); if (!hn) fail("dopo «" + h + "» mi serve una cosa o una persona", p.key());
      S.pred = { t: "have", np: hn };
    } else if (h === "在" || h === "正在") {
      p.i++;
      if (h === "在" && !isVerb(p.key())) { var lp = p.place(); if (!lp) fail("dopo «在» mi serve un luogo", p.key()); S.pred = { t: "loc", np: lp }; }
      else { S.prog = true; S.pred = verbPred(p); }
    } else if (h === "比") {
      p.i++; var than = null;
      if (p.key() && lex(G.time, p.key()) !== undefined) { than = { t: "time", h: p.h() }; p.i++; } else than = p.np();
      if (!than) fail("dopo «比» mi serve con chi o che cosa paragoni", p.key());
      p.eat("更"); var ak = p.key(); if (!ak || !isAdj(ak) || lex(G.haveAdjs, ak) !== undefined) fail("nel paragone con «比» mi serve un aggettivo che conosco", ak);
      p.i++; S.pred = { t: "cmp", than: than, adj: ak };
    } else if (G.degree[h] !== undefined && p.key(1) && isAdj(p.key(1))) {
      p.i++; S.pred = { t: "adj", adj: p.key(), deg: h }; p.i++;
      if (h === "太") S.tooLe = p.h() === "了";
    } else if (isAdj(k) && !isVerb(k)) {
      p.i++; S.pred = { t: "adj", adj: k };
    } else if (h === "喜欢" || h === "爱") {
      p.i++; S.pred = { t: "like", love: h === "爱" };
      if (p.key() && isVerb(p.key())) S.pred.vp = verbPred(p);
      else { var ln = p.np(); if (!ln) fail("dopo «" + h + "» mi serve che cosa piace", p.key()); S.pred.np = ln; }
      if (h === "爱" && S.pred.vp) fail("«爱 + verbo» non lo traduco ancora: prova con 喜欢");
    } else if (MODAL[h] && !S.modal && (h === "要" || h === "想" || h === "想要")) {
      p.i++; var mn = p.np(); if (!mn) fail("dopo «" + h + "» mi serve un verbo o una cosa", p.key());
      if (h === "想" && mn.t === "pron") S.pred = { t: "like", np: mn, miss: true };
      else if (h === "想") fail("«想 + cosa» vuol dire «mi manca, penso a»: non lo traduco ancora. Per «ho voglia di» usa 想 + verbo (想喝茶)");
      else S.pred = { t: "want", np: mn, cond: h === "想要" };
    } else if (isVerb(k)) {
      S.pred = verbPred(p);
      /* 坐地铁去机场: il mezzo, poi il verbo di movimento */
      if (hz(S.pred.k) === "坐" && S.pred.obj && S.pred.obj.t === "noun" && /t/.test(lex(G.nouns, S.pred.obj.head)[3] || "") && p.key() && isVerb(p.key()) && /d/.test(lex(G.verbs, p.key())[2] || "")) {
        S.means = S.pred.obj; S.pred = verbPred(p);
      }
    } else {
      var save3 = p.i, agn = p.np();
      if (agn && agn.t === "age") { S.pred = { t: "age", n: agn.n }; }
      else if (agn && agn.t === "qage") { S.pred = { t: "age", q: true }; }
      else { p.i = save3; fail(W[k] ? "non conosco ancora la grammatica di «" + h + "»" : "non riconosco «" + h + "»", k); }
    }
    /* fine */
    if (p.h() === "了") { S.le = true; p.i++; }
    if (p.h() && FINAL[p.h()]) { S.fin = p.h(); p.i++; }
    if (!p.end()) fail(W[p.key()] ? "non so dove mettere «" + p.h() + "» in questa frase" : "non riconosco «" + p.h() + "»", p.key());
    return S;
  }
  /* verbo [了/过/着] [oggetto | luogo | verbo] */
  function verbPred(p) {
    var k = p.key(), v = { t: "verb", k: k, info: lex(G.verbs, k) }; p.i++;
    if (p.h() === "了") { v.le = true; p.i++; }
    else if (p.h() === "过") { v.guo = true; p.i++; }
    else if (p.h() === "着") fail("«着» (stato che continua) non lo traduco ancora");
    var fl = v.info[2] || "";
    if (/d/.test(fl)) {
      if (p.h() === "在" && hz(k) === "住") p.i++;
      var save = p.i, pl = p.place(); if (pl) { v.dest = pl; return v; } p.i = save;
      if (p.key() && isVerb(p.key()) && /^(去|来)$/.test(hz(k))) { v.then = verbPred(p); return v; }
    }
    if (p.key() && !FINAL[p.h()] && p.h() !== "了") {
      if (p.key() && isPlace(p.key()) && lex(G.places, p.key())[0] === null) { v.objPlace = { t: "place", head: p.key() }; p.i++; return v; }
      if (/n/.test(fl) && !(p.key() && /^(什么|哪里|哪儿)$/.test(p.h()))) fail("«" + hz(k) + "» non vuole un oggetto: non so cosa farne di «" + p.h() + "»", p.key());
      if (isVerb(p.key()) && /^(开始|学|学习|准备|喜欢)$/.test(hz(k))) { v.then = verbPred(p); return v; }
      var save2 = p.i, o = p.np();
      if (o && o.t === "pron" && /^(给|送|教|告诉|问)$/.test(hz(k)) && p.key() && !FINAL[p.h()] && p.h() !== "了") {
        var o2 = p.np(); if (!o2) fail("dopo «" + hz(k) + " + persona» mi serve che cosa", p.key());
        v.io = o; o = o2;
      }
      if (o) v.obj = o;
      else { p.i = save2; var pl2 = p.place(); if (pl2) v.objPlace = pl2; }
    }
    if (/o/.test(fl) && !v.obj && !v.objPlace && !v.then) fail("«" + hz(k) + "» qui ha bisogno di un oggetto");
    return v;
  }

  /* ================= generazione ================= */
  function noun(k) { var n = lex(G.nouns, k); return { s: n[0], g: n[1], p: n[2], fl: n[3] || "", fs: n[4], fp: n[5] }; }
  function haveNoun(k) { var n = lex(G.haveNouns, k); return n ? { s: n[0], g: n[1], p: n[2], fl: n[3] || "", fs: n[4], fp: n[5] } : noun(k); }
  /* il genere del nome al singolare e al plurale (uovo è maschile, uova femminile) */
  function gOf(n, num) { return n.g === "f" ? "f" : (num === "p" && /a$/.test(n.p) && /o$/.test(n.s)) ? "f" : "m"; }
  function form(n, num, g) { if (g === "f" && n.fs) return num === "p" ? n.fp : n.fs; if (g === "x" && n.fs && n.fs !== n.s) return num === "p" ? n.p : n.s + "/" + n.fs; return num === "p" ? n.p : n.s; }
  function defNP(n, num) { var w = num === "p" ? n.p : n.s; return I.join(I.def(w, gOf(n, num), num), w); }
  function personKey(P) { return P[0] + P[1] + (P[0] === 3 && P[1] === "s" ? P[2] : ""); }
  var PRON_IT = { "1s": "io", "2s": "tu", "3sm": "lui", "3sf": "lei", "3sx": "Lei", "1p": "noi", "2p": "voi", "3pm": "loro", "3p": "loro" };
  var STRONG = { "1s": "me", "2s": "te", "3sm": "lui", "3sf": "lei", "3sx": "Lei", "1p": "noi", "2p": "voi", "3p": "loro" };
  var CL_DIR = { "1s": "mi", "2s": "ti", "3sm": "lo", "3sf": "la", "3sx": "La", "1p": "ci", "2p": "vi", "3p": "li" };
  var CL_IND = { "1s": "mi", "2s": "ti", "3sm": "gli", "3sf": "le", "3sx": "Le", "1p": "ci", "2p": "vi", "3p": "gli" };

  /* testo italiano di un sintagma nominale, in un ruolo:
     role = "subj" | "pred" | "obj" | "with" | "than" | "like";  ctx = { verb, neg, q, have, mass… } */
  function npIt(np, role, ctx) {
    ctx = ctx || {};
    var n;
    switch (np.t) {
      case "pron": return { it: STRONG[personKey(G.pron[np.pron])], P: G.pron[np.pron], pron: true };
      case "poss": {
        var pr = G.pron[np.pron], hn = ctx.have ? haveNoun(np.head) : noun(np.head), num = /p/.test(hn.fl) && hn.s === hn.p ? "p" : (hz(np.head) === "父母" ? "p" : "s");
        if (role === "pred" && ctx.plural) num = "p";
        if (np.noDe && !/[rk]/.test(hn.fl)) fail("senza 的 si dice solo per parenti e amici (我妈妈, 我朋友): qui serve 我的…");
        var g = role === "pred" && ctx.g === "f" && hn.fs ? "f" : gOf(hn, num), w = form(hn, num, g), ps = I.poss(pr[3], g, num);
        if (hz(np.head) === "家") return { it: "casa " + (pr[3] === "loro" ? "loro" : I.poss(pr[3], "f", "s")), P: [3, "s", "f"], place: true };
        if (role === "pred" && /u/.test(hn.fl) && !ctx.plural) return { it: I.indef(ps, g) + " " + ps + " " + w, P: [3, num, g] };
        if (role === "pred" && /u/.test(hn.fl) && ctx.plural) return { it: I.poss(pr[3], g, "p") + " " + hn.p, P: [3, "p", g] };
        var art = /k/.test(hn.fl) && num === "s" && pr[3] !== "loro" ? "" : I.def(ps, g, num);
        return { it: (art ? I.join(art, ps) : ps) + " " + w, P: [3, num, g], kin: !art };
      }
      case "dem": {
        var near = np.dem === "这";
        if (!np.head) { var pl0 = np.plural; return { it: near ? (pl0 ? "questi" : "questo") : (pl0 ? "quelli" : "quello"), P: [3, pl0 ? "p" : "s", "m"], dem: np.dem }; }
        n = noun(np.head); var num2 = np.plural ? "p" : "s", g2 = gOf(n, num2), w2 = num2 === "p" ? n.p : n.s;
        var det = near ? I.adj(["questo", "questa", "questi", "queste"], g2, num2) : quel(w2, g2, num2);
        if (near && num2 === "s" && I.vowel(w2)) det = "quest'";
        var nn = np.n != null && np.n > 1 ? " " + I.num(np.n) : "";
        return { it: (/'$/.test(det) ? det + w2 : det + nn + " " + w2), P: [3, num2, g2] };
      }
      case "count": {
        n = ctx.have ? haveNoun(np.head) : noun(np.head); var h = hz(np.head), many = np.n !== 1;
        if (np.n === 0) fail("con lo zero non so contare");
        if (np.clf === "杯" && G.cups[h]) return { it: np.n === 1 ? G.cups[h][0] : G.cups[h][1].replace("%N", I.num(np.n)), P: [3, many ? "p" : "s", "m"] };
        var cl = np.clf ? G.clf[np.clf] : "";
        if (cl) {
          var cont = many ? cl[2] : cl[0], of = np.clf === "双" ? n.p : n.s;
          return { it: (many ? I.num(np.n) : I.num(1, cl[1]) + (cl[1] === "f" && I.vowel(cont) ? "'" : "")).replace(/un'$/, "un'") + (many || !(cl[1] === "f" && I.vowel(cont)) ? " " : "") + cont + " " + (I.vowel(of) ? "d'" + of : "di " + of), P: [3, many ? "p" : "s", cl[1]] };
        }
        if (/m/.test(n.fl) && !/p/.test(n.fl)) fail("«" + h + "» non si conta così: serve un contenitore (一杯, 一瓶…)", np.head);
        var gg = ctx.g && n.fs ? ctx.g : n.g;
        if (!many) { var s1 = form(n, "s", gg === "x" ? "m" : gg), g1 = gg === "f" ? "f" : gOf(n, "s"); return { it: I.join(I.indef(s1, g1), s1), P: [3, "s", g1] }; }
        return { it: I.num(np.n) + " " + form(n, "p", gg === "x" ? "m" : gg), P: [3, "p", gOf(n, "p")] };
      }
      case "many": { n = noun(np.head); var gm = gOf(n, "p"); return { it: (/m/.test(n.fl) && !/p/.test(n.fl) ? (n.g === "f" ? "molta " : "molto ") + n.s : (gm === "f" ? "molte " : "molti ") + n.p), P: [3, /m/.test(n.fl) && !/p/.test(n.fl) ? "s" : "p", gm] }; }
      case "nat": { var na = G.nations[np.nat]; return { nat: na }; }
      case "noun": {
        n = ctx.have ? haveNoun(np.head) : noun(np.head);
        if ((/k/.test(n.fl) || /^(爸爸|妈妈|父母)$/.test(hz(np.head))) && role !== "pred" && !ctx.have) {
          /* 妈妈 da solo = la mamma di chi parla: lo dico solo quando chi parla è il soggetto (或 il parente stesso) */
          var owner = role === "subj" ? "我" : CURSUBJ && CURSUBJ.t === "pron" && /^(我|我们)$/.test(CURSUBJ.pron) ? CURSUBJ.pron : null;
          if (!owner) fail("di chi è «" + hz(np.head) + "»? Scrivi 我" + hz(np.head) + ", 他" + hz(np.head) + "…", np.head);
          var asPoss = npIt({ t: "poss", pron: owner, head: np.head }, role, ctx);
          NOTES.push(hz(np.head) + " da solo vuol dire di solito «" + asPoss.it + "»: in cinese il possessivo dei parenti si sottintende.");
          return asPoss;
        }
        var mass = /m/.test(n.fl), plu = /p/.test(n.fl) && !mass ? true : (/p/.test(n.fl) && mass && n.s === n.p);
        var numN = plu ? "p" : "s";
        if (/l/.test(n.fl) && ctx.lang) return { it: n.s, P: [3, "s", "m"] };
        if (role === "subj" || role === "like" || role === "than" || role === "defobj") return { it: likeForm(n, mass, role), P: [3, likeNum(n, mass, role), gOf(n, likeNum(n, mass, role))], n: n };
        if (role === "pred") {
          if (/j/.test(n.fl) || /[ru]/.test(n.fl) && ctx.plural) { var num3 = ctx.plural ? "p" : "s"; return { it: form(n, num3, ctx.g || "m"), P: [3, num3, n.g] }; }
          if (ctx.plural) return { it: n.p, P: [3, "p", gOf(n, "p")] };
          if (mass) fail("«" + hz(np.head) + "» dopo «是» non lo traduco ancora", np.head);
          return { it: I.join(I.indef(n.s, n.g), n.s), P: [3, "s", n.g] };
        }
        if (role === "with") { if (mass) fail("«跟/和» va con le persone", np.head); var gw = gOf(n, "s"); return { it: I.join(I.indef(n.s, gw), n.s), P: [3, "s", gw] }; }
        if (role === "to") return { it: defNP(n, "s"), P: [3, "s", gOf(n, "s")] };
        /* oggetto */
        if ((ctx.eat || ctx.massBare) && mass && !ctx.partitive) return { it: n.s, P: [3, "s", gOf(n, "s")] };
        if (ctx.partitive) {
          if (/z/.test(n.fl)) return { it: n.s, P: [3, "s", gOf(n, "s")] };
          if (/1/.test(n.fl)) return { it: I.join(I.indef(n.s, gOf(n, "s")), n.s), P: [3, "s", gOf(n, "s")] };
          if (ctx.neg || (ctx.q && !mass)) return { it: mass ? n.s : n.p, P: [3, mass ? "s" : "p", gOf(n, mass ? "s" : "p")] };
          var nm = mass ? (plu ? "p" : "s") : "p", wp = nm === "p" ? n.p : n.s;
          return { it: I.partitive(wp, gOf(n, nm), nm) + (/'$/.test(I.partitive(wp, gOf(n, nm), nm)) ? "" : " ") + wp, P: [3, nm, gOf(n, nm)] };
        }
        if (ctx.eat && !mass) return { it: defNP(n, "p"), P: [3, "p", gOf(n, "p")] };
        if (ctx.neg && mass) return { it: n.s, P: [3, "s", gOf(n, "s")] };
        return { it: defNP(n, numN), P: [3, numN, gOf(n, numN)] };
      }
      case "of": {
        var hd = noun(np.head), ow = npIt(np.owner, "defobj", {});
        return { it: defNP(hd, "s") + " " + I.withPrep("di", ow.it), P: [3, "s", gOf(hd, "s")] };
      }
      case "place": { var pl = lex(G.places, np.head); if (!pl[0]) fail("«" + hz(np.head) + "» qui non lo so usare", np.head); var gpl = /^(la|l'[A-Z]?)/.test(pl[0]) && /a$/.test(pl[0]) ? "f" : /^(gli|i) /.test(pl[0]) ? "m" : "m"; return { it: pl[0], P: [3, /^(gli|i|le) /.test(pl[0]) ? "p" : "s", /^la /.test(pl[0]) || /^l'.*a$/.test(pl[0]) ? "f" : "m"], place: true }; }
      case "q": return { it: np.q === "谁" ? "chi" : "che cosa", q: np.q };
      case "time": return { it: G.time[np.h][0] };
      case "qwhich": { n = noun(np.head); return { it: "che " + n.s, q: "什么", P: [3, "s", n.g] }; }
      case "qnum": { n = ctx.have ? haveNoun(np.head) : noun(np.head); var gq = gOf(n, "p"); return { it: (gq === "f" ? "quante " : "quanti ") + n.p, q: "几", P: [3, "p", gq] }; }
      default: fail("questa costruzione non la conosco ancora");
    }
  }
  function quel(w, g, num) {
    if (num === "p") return g === "f" ? "quelle" : (I.vowel(w) || /^(s[^aeiou]|z|gn|ps)/i.test(w) ? "quegli" : "quei");
    if (g === "f") return I.vowel(w) ? "quell'" : "quella";
    return I.vowel(w) ? "quell'" : /^(s[^aeiou]|z|gn|ps)/i.test(w) ? "quello" : "quel";
  }
  /* soggetto, cosa che piace, termine di paragone: con l'articolo determinativo; i numerabili al plurale (mi piacciono i cani) */
  function likeNum(n, mass, role) { return mass ? (n.s === n.p && /p/.test(n.fl) ? "p" : "s") : (/p/.test(n.fl) || role === "like" ? "p" : "s"); }
  function likeForm(n, mass, role) { var num = likeNum(n, mass, role); return defNP(n, num); }

  function placeAt(np) {
    if (np.t === "place") return lex(G.places, np.head)[1];
    if (np.t === "poss" && hz(np.head) === "家") { var pr = G.pron[np.pron]; return "a casa " + (pr[3] === "loro" ? "loro" : I.poss(pr[3], "f", "s")); }
    fail("questo non è un luogo che conosco");
  }
  function placeFrom(np) {
    if (np.t === "place") { var pl = lex(G.places, np.head); return pl[2] || (pl[0] ? I.withPrep("da", pl[0]) : fail("non so dire «da» con questo luogo")); }
    return "da " + placeAt(np).replace(/^a /, "");
  }

  /* coniuga «inf» per la persona P nel tempo «tns»: pres | past | exp | fut | impf | cond */
  function conj(inf, aux, P, tns, g) {
    var pi = (P[0] - 1) + (P[1] === "p" ? 3 : 0), gg = g || P[2];
    if (tns === "past" || tns === "exp") return I.passato(inf, aux, pi, gg, P[1]);
    if (tns === "fut") return I.future(inf, pi);
    if (tns === "impf") return I.imperfect(inf, pi);
    if (tns === "cond") return I.conditional(inf, pi);
    return I.present(inf, pi);
  }
  /* infinito con il pronome riflessivo della persona giusta: alzarsi -> alzarmi */
  function infFor(inf, P) {
    var pi = (P[0] - 1) + (P[1] === "p" ? 3 : 0), m = /^(\S+?)si(\b.*)?$/.exec(inf);
    if (m && /r$/.test(m[1])) return m[1] + I.CLITIC[pi] + (m[2] || "");
    return inf;
  }
  /* inserisce una parola dopo il verbo coniugato (dopo l'ausiliare nei tempi composti): «ho già mangiato», «siamo tutti» */
  function afterFinite(vp, w) {
    var m = /^((?:non )?(?:(?:mi|ti|si|ci|vi|lo|la|li|le|gli|l')\s?)?)(\S+)(.*)$/.exec(vp);
    return m ? m[1] + m[2] + " " + w + m[3] : vp + " " + w;
  }

  function generate(S, punct) {
    var notes = [], it = "", subjIt = "", P, g;
    var isQ = S.fin === "吗" || punct === "?" || !!S.anotA;
    if (S.anotA && S.fin === "吗") fail("con 是不是 (o 去不去…) la domanda c'è già: niente 吗");
    var past = S.time.some(function (t) { return G.time[t][1] === "past"; });
    var ye = S.adv.indexOf("也") >= 0, dou = S.adv.indexOf("都") >= 0, hai = S.adv.indexOf("还") >= 0, yijing = S.adv.indexOf("已经") >= 0,
      zhi = S.adv.indexOf("只") >= 0, jingchang = S.adv.indexOf("经常") >= 0, yizhi = S.adv.indexOf("一直") >= 0, mashang = S.adv.indexOf("马上") >= 0,
      youshihou = S.adv.indexOf("有时候") >= 0, conglaibu = S.adv.indexOf("从来不") >= 0;
    var neg = !!S.neg || conglaibu, q = null;

    /* soggetto */
    var subj = S.subj; CURSUBJ = subj;
    var used = {}; function use(a) { used[a] = 1; return true; }
    if (S.topicPlace) { P = [3, "s", "m"]; }
    else if (!subj) {
      var weatherOnly = S.pred && S.pred.t === "adj" && lex(G.weatherAdjs, S.pred.adj) !== undefined || S.pred && S.pred.t === "cmp" && lex(G.weatherAdjs, S.pred.adj) !== undefined;
      var rain = S.pred && S.pred.t === "verb" && /^(下雨|下雪)$/.test(hz(S.pred.k));
      if (!weatherOnly && !rain) fail("manca il soggetto: in cinese a volte si sottintende, ma per tradurre mi serve (我, 你, 他…)");
      P = [3, "s", "m"];
    } else if (subj.t === "q") { P = [3, "s", "m"]; subjIt = "chi"; q = "谁"; }
    else {
      var sj = npIt(subj, "subj", {});
      if (sj.nat) fail("«" + hz(subj.nat) + "人» come soggetto non lo traduco ancora: prova 他是" + hz(subj.nat) + "人");
      P = sj.P; g = P[2];
      if (sj.pron) {
        var pk = personKey(P);
        subjIt = P[0] === 3 ? PRON_IT[pk] : "";
        if (S.subj.pron === "您") subjIt = "Lei";
      } else subjIt = sj.it;
      if (ye) subjIt = sj.pron ? { "1s": "anch'io", "2s": "anche tu", "3sm": "anche lui", "3sf": "anche lei", "3sx": "anche Lei", "1p": "anche noi", "2p": "anche voi", "3p": "anche loro", "3pm": "anche loro" }[personKey(P)] : "anche " + subjIt;
    }
    if (dou && P[1] !== "p") fail("«都» (tutti) vuole un soggetto plurale");
    var tutti = dou ? (P[2] === "f" ? "tutte" : "tutti") : "";
    var gx = P[2];

    /* tempo verbale */
    var tense = "pres";
    var pr = S.pred, vp = "", tail = [], front = "", qWord = "";
    function stateTense() { return past ? "impf" : "pres"; }

    if (S.modal && pr.t !== "verb" && !(S.modal === "会" && (pr.t === "adj" || pr.t === "cmp"))) fail("«" + S.modal + "» qui non lo so ancora tradurre");
    if (pr.t === "ne") {
      var neIt = subj.t === "pron" ? (subj.pron === "您" ? "Lei" : PRON_IT[personKey(P)]) : npIt(subj, "subj", {}).it;
      return { it: "E " + neIt + "?", notes: [] };
    }
    if (pr.t === "price") {
      if (subj.t === "pron") fail("«多少钱» va dopo una cosa (这本书多少钱?)");
      if (subj.t === "noun" && !/m/.test(noun(subj.head).fl)) { var pn0 = noun(subj.head); subjIt = defNP(pn0, "p"); P = [3, "p", gOf(pn0, "p")]; }
      return { it: "Quanto " + (P[1] === "p" ? "costano " : "costa ") + subjIt + "?", notes: [] };
    }
    if (pr.t === "cop") {
      var tn = stateTense(), essere = conj("essere", "e", P, tn), np = pr.np;
      if (np.t === "nat") {
        var na = G.nations[np.nat], pred = typeof na === "string" ? na : I.adj(na, gx === "x" && P[1] === "p" ? "m" : gx, P[1]);
        vp = essere + " " + pred;
      } else if (np.t === "qnat") {
        q = "dove"; vp = essere; qWord = "di dove";
        if (/^è/.test(vp)) { qWord = "di dov'"; }
      } else if (np.t === "q") {
        q = np.q;
        if (np.q === "什么") { if (!subj || subj.t !== "dem") fail("«是什么» lo traduco solo con 这/那 (这是什么?)"); qWord = "che cos'"; vp = essere; }
        else { qWord = "chi"; vp = essere; }
      } else {
        /* genere naturale: «persona» è femminile per grammatica, ma «questa persona è un mio amico» */
        var natG = subj && subj.head && /N/.test((lex(G.nouns, subj.head) || [])[3] || "") ? "m" : gx;
        var pn = npIt(np, "pred", { plural: P[1] === "p", g: natG });
        vp = essere + " " + pn.it;
        if (subj && subj.t === "dem" && !subj.head && pn.P) { subjIt = subj.dem === "这" ? I.adj(["questo", "questa", "questi", "queste"], pn.P[2] === "x" ? "m" : pn.P[2], pn.P[1]) : I.adj(["quello", "quella", "quelli", "quelle"], pn.P[2] === "x" ? "m" : pn.P[2], pn.P[1]); P = [3, pn.P[1], pn.P[2]]; vp = conj("essere", "e", P, tn) + " " + pn.it; if (ye) subjIt = "anche " + subjIt; }
      }
      if (neg) vp = "non " + vp;
      if (tutti) vp = afterFinite(vp, tutti);
      if (yijing) vp = afterFinite(vp, "già");
    } else if (pr.t === "have") {
      var hn = pr.np;
      if (hn.t === "q" || hn.t === "qwhich") { q = "什么"; qWord = hn.t === "q" ? "che cosa" : npIt(hn, "obj", {}).it; }
      var obj = hn.t === "q" ? null : npIt(hn, "obj", { have: true, partitive: true, neg: neg, q: isQ });
      if (hn.t === "qnum") { q = "几"; qWord = obj.it; obj = null; }
      if (S.topicPlace || (!subj && S.time.length)) {
        var where = S.topicPlace ? placeAt(S.topicPlace) : "";
        var plural = obj && obj.P && obj.P[1] === "p";
        var ce = past ? (plural ? "c'erano" : "c'era") : (plural ? "ci sono" : "c'è");
        if (neg) { ce = "non " + ce; }
        subjIt = where; vp = ce; if (obj) tail.push(obj.it);
        if (S.topicPlace && hn.t === "count" && !isQ) { /* 这里有一个超市 */ }
      } else {
        vp = (neg ? "non " : "") + conj("avere", "a", P, stateTense());
        if (obj) tail.push(obj.it);
        if (yijing) vp = afterFinite(vp, "già");
        if (tutti) vp = afterFinite(vp, tutti);
      }
      if (hai) fail("«还有» (c'è ancora / e poi) non lo traduco ancora");
    } else if (pr.t === "loc") {
      if (pr.np.t === "place" && QPLACE[hz(pr.np.head)]) { q = "哪里"; qWord = "dove"; vp = (neg ? "non " : "") + conj("essere", "e", P, stateTense()); }
      else { vp = (neg ? "non " : "") + conj("essere", "e", P, stateTense()); tail.push(placeAt(pr.np)); }
      if (yijing) vp = afterFinite(vp, "già"); if (tutti) vp = afterFinite(vp, tutti); if (hai) vp = afterFinite(vp, "ancora");
    } else if (pr.t === "adj" || pr.t === "cmp") {
      var ak = pr.adj, haveA = lex(G.haveAdjs, ak), weather = lex(G.weatherAdjs, ak), forms = lex(G.adjs, ak), deg = pr.deg ? G.degree[pr.deg] : "";
      if (S.notVery) deg = "molto";
      var personSubj = subj && (subj.t === "pron" || subj.t === "poss");
      var fut = S.modal === "会", tn2 = fut ? "fut" : stateTense(), more = pr.t === "cmp" ? "più " : "";
      var than = "";
      if (pr.t === "cmp" && pr.than.t === "time") { if (subj || !S.time.length) fail("il paragone tra due momenti lo so fare solo col tempo che fa (今天比昨天热)"); than = "di " + G.time[pr.than.h][0]; }
      else if (pr.t === "cmp") { var tt = npIt(pr.than, "than", {}); than = tt.pron ? "di " + tt.it : I.withPrep("di", tt.it); if (pr.than.t === "place" && lex(G.places, pr.than.head)[0] === null) fail("questo paragone non lo so ancora fare"); }
      if (pr.deg === "很") notes.push("很 qui lega soltanto l'aggettivo: non vuol dire per forza «molto». «Molto» è 非常.");
      if (haveA !== undefined && personSubj) {
        if (pr.t === "cmp") fail("questo paragone non lo so ancora fare");
        var amt = deg === "molto" ? "molta " : deg === "troppo" ? "troppa " : deg === "un po'" ? "un po' di " : "";
        if (deg && !amt) fail("questo grado con «" + hz(ak) + "» non lo so ancora dire");
        vp = (neg ? "non " : "") + conj("avere", "a", P, tn2) + " " + amt + haveA;
        if (S.le && !neg) notes.push("了 dopo uno stato dice che è appena cambiato: «mi è venuta " + haveA + "», cioè adesso ho " + haveA + ".");
      } else if (weather !== undefined && (!subj || subj.t === "noun" && hz(subj.head) === "天气")) {
        if (subj) subjIt = "";
        vp = (neg ? "non " : "") + (fut ? "farà" : past ? "faceva" : "fa") + " " + (deg ? deg + " " : "") + more + weather + (than ? " " + than : "");
      } else if (weather !== undefined && personSubj) {
        vp = (neg ? "non " : "") + conj("avere", "a", P, tn2) + " " + (deg ? deg + " " : "") + more + weather + (than ? " " + than : "");
        if (deg === "molto") vp = vp.replace("molto " + weather, "molto " + weather);
      } else if (forms) {
        if (!subj && !S.topicPlace) fail("manca il soggetto");
        if (subj && subj.t === "pron" && hz(ak) === "好") { vp = (neg ? "non " : "") + conj("stare", "a", P, tn2) + (deg ? " " + deg : "") + " bene"; }
        else {
          if (hz(ak) === "好" && subj && subj.t === "noun" && hz(subj.head) === "天气") forms = ["bello", "bella", "belli", "belle"];
          else if (hz(ak) === "好" && subj && (subj.t === "poss" || subj.t === "noun" || subj.t === "of") && /[jrku]/.test(noun(subj.head).fl)) forms = ["bravo", "brava", "bravi", "brave"];
          var af = I.adj(forms, gx === "x" && P[1] === "p" ? "m" : gx, P[1]);
          vp = (neg ? "non " : "") + conj("essere", "e", P, tn2) + " " + (deg ? deg + " " : "") + more + af + (than ? " " + than : "");
        }
      } else if (hz(ak) === "好" && subj && subj.t === "pron") { vp = (neg ? "non " : "") + conj("stare", "a", P, tn2) + (deg ? " " + deg : "") + " bene"; }
      else fail("l'aggettivo «" + hz(ak) + "» con questo soggetto non lo so ancora usare", ak);
      if (pr.deg === "太" && S.tooLe) S.le = false;
      if (S.le && haveA === undefined && !neg) notes.push("了 dopo un aggettivo dice che la situazione è cambiata (adesso è così).");
      if (yijing) vp = afterFinite(vp, "già"); if (tutti) vp = afterFinite(vp, tutti); if (hai) vp = afterFinite(vp, "ancora");
      S.le = false;
    } else if (pr.t === "age") {
      if (pr.q) { q = "几"; qWord = "quanti anni"; vp = conj("avere", "a", P, "pres"); }
      else vp = (neg ? "non " : "") + conj("avere", "a", P, "pres") + " " + (pr.n > 10 ? pr.n : I.num(pr.n)) + " anni";
      if (pr.n === 1) vp = vp.replace(/ un anni$/, " un anno");
    } else if (pr.t === "want") {
      var wo = npIt(pr.np, "obj", { partitive: true, neg: neg, q: isQ });
      if (pr.np.t === "q" || pr.np.t === "qwhich") { q = "什么"; qWord = wo.it; wo = null; }
      if (pr.np.t === "qnum") { q = "几"; qWord = wo.it; wo = null; }
      if (pr.np.t === "pron") fail("«要 + persona» non lo traduco ancora");
      vp = (neg ? "non " : "") + conj("volere", "a", P, past ? "impf" : pr.cond && !neg ? "cond" : "pres");
      if (wo) tail.push(wo.it);
      if (!pr.cond) notes.push("要 + cosa = «voglio…»; al bar e al ristorante l'italiano dice più spesso «prendo…».");
    } else if (pr.t === "like") {
      var lt = past || S.le ? "past" : "pres", likeSubj = "";
      if (ye) use("也");
      if (pr.vp) {
        var vinf = verbPhraseInf(pr.vp, P, notes);
        vp = likeVerb(P, subj, ye, neg, "s", "m", lt, subjIt) + " " + vinf.it; if (vinf.q) { q = vinf.q; qWord = vinf.qWord; }
        subjIt = ""; S.le = false;
      } else {
        var lo = pr.np;
        if (lo.t === "q" || lo.t === "qwhich") { q = "什么"; qWord = lo.t === "q" ? "che cosa" : npIt(lo, "like", {}).it; vp = likeVerb(P, subj, ye, neg, lo.t === "qwhich" && /p/.test(noun(lo.head).fl) ? "p" : "s", "f", lt, subjIt); }
        else if (lo.t === "pron") {
          var OP = G.pron[lo.pron];
          if (pr.love) { vp = (neg ? "non " : "") + CL_DIR[personKey(OP)] + " " + conj("amare", "a", P, lt); }
          else {
            if (subj && subj.t !== "pron") fail("«… 喜欢 + persona» con questo soggetto non lo traduco ancora");
            if (ye) fail("«也» con «mi piaci / mi manchi» non lo traduco ancora");
            vp = (neg ? "non " : "") + CL_IND[personKey(P)] + " " + conj(pr.miss ? "mancare" : "piacere", "e", OP, lt, OP[2]);
            /* chi piace (o manca) diventa il soggetto italiano: «Lei gli piace», «Mi manchi» */
            likeSubj = OP[0] === 3 ? (lo.pron === "您" ? "Lei" : PRON_IT[personKey(OP)]) : "";
            if (pr.miss) notes.push("想 + persona = «mi manchi»: in italiano chi manca è il soggetto.");
          }
        } else {
          var lk = npIt(lo, "like", {});
          if (pr.love) vp = (neg ? "non " : "") + conj("amare", "a", P, lt) + " " + lk.it;
          else vp = likeVerb(P, subj, ye, neg, lk.P[1], lk.P[2], lt, subjIt) + " " + lk.it;
        }
        if (!pr.love) subjIt = likeSubj;
      }
      if (!pr.love && ye) { /* già dentro likeVerb */ }
      if (tutti) fail("«都喜欢» non lo traduco ancora");
      if (S.likeMuch) {
        /* «mi piace molto», «ti amo molto»: molto subito dopo il verbo */
        var lm = /^(.*?\b(?:piace|piacciono|piaci|piaccio|piacciamo|piacete|manca|mancano|manchi|amo|ami|ama|amiamo|amate|amano|è piaciuto|è piaciuta|sono piaciuti|sono piaciute))(.*)$/.exec(vp);
        if (!lm) fail("«很喜欢» qui non lo so ancora dire");
        vp = lm[1] + " molto" + lm[2];
      }
      S.le = false;
    } else if (pr.t === "verb") {
      var r = verbIt(S, P, neg, isQ, notes, { yijing: yijing, hai: hai, zhi: zhi, tutti: tutti, past: past });
      vp = r.vp; tail = tail.concat(r.tail); if (r.q) { q = r.q; qWord = r.qWord; } if (r.front) front = r.front;
    }

    /* complementi: luogo, compagnia, a chi, da dove */
    S.pp.forEach(function (x) {
      if (x.t === "at" && x.np.t === "place" && QPLACE[hz(x.np.head)]) { if (q) fail("due domande nella stessa frase"); q = "哪里"; qWord = "dove"; }
      else if (x.t === "at") tail.push(placeAt(x.np));
      else if (x.t === "with" && x.np.t === "q") { if (q) fail("due domande nella stessa frase"); q = "谁"; qWord = "con chi"; }
      else if (x.t === "with") { var w = npIt(x.np, "with", {}); if (S.together) { tail.push(w.pron ? "insieme a " + w.it : "insieme " + I.withPrep("a", w.it)); S.together = false; } else tail.push("con " + w.it); }
      else if (x.t === "from") tail.push(placeFrom(x.np));
      else if (x.t === "to") {
        var tn = npIt(x.np, "to", {});
        if (tn.pron) vp = vp.replace(/^(non )?/, "$1" + CL_IND[personKey(tn.P)] + " ");
        else tail.push(I.withPrep("a", tn.it));
      }
    });
    if (S.together) tail.push("insieme");
    if (S.means) tail.push("in " + noun(S.means.head).s);
    if (zhi && !used["只"]) { if (!tail.length || q) fail("«只» (solo) qui non so dove metterlo"); tail[0] = "solo " + tail[0]; use("只"); }
    if (jingchang) vp = afterFinite(vp, "spesso");
    if (yizhi) vp = afterFinite(vp, "sempre");
    if (mashang) vp = afterFinite(vp, "subito");
    if (conglaibu) { vp = afterFinite(vp, "mai"); }
    if (youshihou) front = (front ? front + " " : "") + "a volte";
    ["经常", "一直", "马上", "从来不", "有时候"].forEach(function (a) { use(a); });
    /* anche + non = neanche: «Neanch'io lo so» */
    if (ye && neg && pr.t !== "like" && subjIt) {
      subjIt = subjIt.replace(/^anch'io$/, "neanch'io").replace(/^anche /, "neanche ").replace(/^Anche /, "Neanche ");
      vp = vp.replace(/^non /, "");
    }
    if (ye && subjIt) use("也");
    if (tutti && vp.indexOf(" " + tutti) > 0) use("都");
    if (yijing && / già(\s|$)/.test(vp)) use("已经");
    if (hai && / ancora(\s|$)/.test(vp)) use("还");
    S.adv.forEach(function (a) { if (!used[a]) fail("non so ancora dove mettere «" + a + "» in questa frase", a); });

    /* domande con parola interrogativa */
    if (S.qadv === "为什么") { if (q) fail("due domande nella stessa frase"); q = "为什么"; qWord = "perché"; }
    if (S.qadv === "怎么") { if (q || pr.t !== "verb" || !subj || subj.t !== "pron") fail("«怎么» lo traduco solo con una persona e un verbo (你怎么去?)"); q = "怎么"; qWord = "come"; }
    if (S.qwhen) { if (q) fail("due domande nella stessa frase"); q = "什么时候"; qWord = "quando"; }
    if (q && S.fin === "吗") fail("con una parola interrogativa (什么, 哪里, 谁…) non si usa 吗");
    if (S.fin === "呢" && !q) fail("«呢» qui non lo traduco ancora");

    /* assemblaggio */
    var timeIt = S.time.map(function (t) { return G.time[t][0]; }).join(" ")
      .replace(/^ogni giorno la (mattina|sera)$/, "ogni $1").replace(/^ogni giorno il pomeriggio$/, "ogni pomeriggio");
    var words;
    if (q) {
      isQ = true;
      if (q === "谁" && subj && subj.t === "q") words = [timeIt, front, "chi", vp].concat(tail);
      else if (qWord === "di dov'") words = [timeIt, front, subjIt, "di dov'" + vp].concat(tail);
      else if (qWord === "che cos'") words = [timeIt, front, "che cos'" + vp, subjIt].concat(tail);
      else if (q === "谁" && pr.t === "cop") words = [timeIt, front, "chi", vp, subjIt].concat(tail);
      else if (q === "哪里" && pr.t === "loc") words = [timeIt, front, /^è$/.test(vp) ? "dov'è" : "dove " + vp, subjIt].concat(tail);
      else words = [timeIt, front, subjIt && !/^(io|tu|noi|voi)$/.test(subjIt) ? subjIt : "", qWord, vp].concat(tail);
    } else words = [timeIt, front, subjIt, vp].concat(tail);
    it = words.filter(function (x) { return x && String(x).trim(); }).join(" ").replace(/\s+/g, " ").trim();
    it = it.replace(/\bdi dov' è\b/, "di dov'è").replace(/\bche cos' è\b/, "che cos'è");
    var excl = false;
    if (S.fin === "吧") {
      if (P[0] === 1 && P[1] === "p" && pr.t === "verb" && !neg && !past) excl = true;
      else if (P[0] === 2 && (pr.t === "verb" || pr.t === "like")) fail("«你…吧» è un invito («fallo!»): l'imperativo non lo traduco ancora");
      else { it += ", vero"; isQ = true; }
    }
    if (S.fin === "呢" && q) { /* 呢 ammorbidisce la domanda: non si traduce */ }
    it = I.cap(it) + (isQ ? "?" : (excl || punct === "!") ? "!" : ".");
    if (/\w\/\w/.test(it)) notes.push("«o/a»: in italiano la parola cambia se sei uomo o donna: scegli tu.");
    return { it: it, notes: notes };
  }
  /* «mi piace», «anche a me piace», «a mia madre piace» */
  function likeVerb(P, subj, ye, neg, num, g, tense, subjIt) {
    var pv = tense === "past" ? (num === "p" ? "sono piaciut" + (g === "f" ? "e" : "i") : "è piaciut" + (g === "f" ? "a" : "o")) : (num === "p" ? "piacciono" : "piace");
    var pk = personKey(P), n = neg ? "non " : "";
    if (subj && subj.t !== "pron") return (ye ? (neg ? "neanche " : "anche ") : "") + I.withPrep("a", subjIt.replace(/^(anche|neanche) /, "")) + " " + (ye && neg ? "" : n) + pv;
    if (ye) return (neg ? "neanche a " : "anche a ") + STRONG[pk] + " " + (neg ? "" : n) + pv;
    return n + CL_IND[pk] + " " + pv;
  }
  /* verbo all'infinito con il suo oggetto (dopo 喜欢, 想, 会…) */
  function verbPhraseInf(v, P, notes, afterGo) {
    var info = v.info, k = v.k, inf = afterGo && info[4] ? info[4] : info[0], out = { it: "" };
    var o = objOf(v, { inf: true }); fixedObj(v, o);
    if (o.q) { out.q = o.q; out.qWord = o.qWord; }
    var vo = lex(G.verbObj, k);
    if (vo && v.obj && v.obj.head) { var nf = lex(G.nouns, v.obj.head), alt = vo[hz(v.obj.head)] || (nf && /t/.test(nf[3] || "") ? vo.t : null); if (alt) inf = alt[0]; }
    if (vo && vo.t && inf === info[0] && /^坐$/.test(hz(k)) && v.obj) fail("«坐» con questo oggetto non lo so tradurre");
    var base = infFor(inf, P);
    if (o.clitic) base = base.replace(/e$/, "") + o.clitic;
    out.it = [base].concat(o.tail).join(" ");
    if (v.then) { var t2 = verbPhraseInf(v.then, P, notes); out.it += " " + aPrep(t2.it); if (t2.q) { out.q = t2.q; out.qWord = t2.qWord; } }
    return out;
  }
  /* «a» davanti a un infinito: «ad» se comincia per a (vado ad aiutare) */
  function aPrep(w) { return (/^a/i.test(w) ? "ad " : "a ") + w; }
  /* verbo + oggetto con una resa fissa: 看电影 = guardare un film, 买东西 = fare acquisti */
  function fixedObj(v, o) {
    var vo = lex(G.verbObj, v.k), alt = vo && v.obj && v.obj.t === "noun" ? vo[hz(v.obj.head)] : null;
    if (!alt || alt.length < 3 || o.objIndex == null) return;
    if (alt[2]) o.tail[o.objIndex] = alt[2]; else o.tail.splice(o.objIndex, 1);
  }
  /* oggetto, luogo e complementi di un verbo */
  function objOf(v, ctx) {
    var info = v.info, fl = info[2] || "", res = { tail: [] };
    if (v.dest) {
      if (v.dest.t === "place" && QPLACE[hz(v.dest.head)]) { res.q = "哪里"; res.qWord = "dove"; }
      else res.tail.push(placeAt(v.dest));
    }
    if (v.objPlace) {
      if (v.objPlace.t === "place" && QPLACE[hz(v.objPlace.head)]) { res.q = "哪里"; res.qWord = "dove"; }
      else if (lex(G.places, v.objPlace.head)[0] === null) res.tail.push(placeAt(v.objPlace));
      else fail("«" + hz(v.k) + "» + luogo non lo so ancora tradurre");
    }
    if (v.io) { var IP = G.pron[v.io.pron]; res.clitic = CL_IND[personKey(IP)]; res.cliticInd = true; }
    if (v.obj) {
      var o = v.obj;
      if (o.t === "q") { res.q = o.q; res.qWord = o.q === "谁" ? "chi" : "che cosa"; if (info[3]) res.qWord = info[3] + " " + res.qWord; }
      else if (o.t === "qwhich" || o.t === "qnum") { var qq = npIt(o, "obj", {}); res.q = qq.q; res.qWord = qq.it; }
      else if (o.t === "pron") {
        if (res.clitic) fail("due pronomi complemento insieme non li so ancora combinare");
        var OP = G.pron[o.pron], pk = personKey(OP);
        if (info[3] === "a") res.clitic = CL_IND[pk]; else res.clitic = CL_DIR[pk];
        res.cliticP = OP;
      } else if (o.t === "nat" || o.t === "qnat" || o.t === "age" || o.t === "qage" || o.t === "qprice") fail("questo oggetto non lo so ancora usare");
      else {
        var ctxo = { eat: /e/.test(fl) && !ctx.past && !ctx.modal, massBare: !ctx.past && !ctx.modal, lang: /l/.test(fl), neg: ctx.neg, partitive: /e/.test(fl) && !!ctx.modal };
        if (/^(买|要)$/.test(hz(v.k)) && o.t === "noun") ctxo.partitive = true;
        var oi = npIt(o, "obj", ctxo);
        res.objIndex = res.tail.length;
        res.tail.push(info[3] ? I.withPrep(info[3], oi.it) : oi.it);
        res.objP = oi.P;
      }
    }
    return res;
  }
  function verbIt(S, P, neg, isQ, notes, F) {
    var v = S.pred, info = v.info, k = v.k, h = hz(k), inf = info[0], aux = info[1], fl = info[2] || "";
    var vo = lex(G.verbObj, k);
    if (vo && v.obj && v.obj.head) { var nf = lex(G.nouns, v.obj.head), alt = vo[hz(v.obj.head)] || (nf && /t/.test(nf[3] || "") ? vo.t : null); if (alt) { inf = alt[0]; aux = alt[1]; } else if (h === "坐") fail("«坐» con questo oggetto non lo so tradurre"); }
    if (v.then && h === "学") inf = "imparare";
    if (v.then && h === "准备") { inf = "prepararsi"; aux = "e"; }
    if (h === "告诉" && !v.io) fail("«告诉» vuole a chi e che cosa (我告诉你一件事): così non lo traduco ancora");
    var tense = "pres";
    if (v.le || S.le || v.then && v.then.le) tense = "past";
    if (S.neg === "没" || S.neg === "没有") tense = "past";
    if (F.past && !S.modal) tense = "past";
    if (v.guo) tense = "exp";
    if (/^(下雨|下雪)$/.test(h) && (v.le || S.le) && !F.past) { tense = "pres"; S.le = false; notes.push("下雨了 = ha appena cominciato a piovere: adesso piove."); }
    if (h === "见" && !v.obj) { if (P[0] === 1 && P[1] === "p") inf = "vedersi"; else fail("«见» qui ha bisogno di qualcuno da vedere"); }
    if (/L/.test(fl) && !v.obj && !v.then) { if (tense !== "pres") fail("«" + h + "» al passato non lo traduco ancora"); v.loClitic = true; }
    if (S.prog) { if (tense !== "pres") fail("«在 + verbo» con il passato non lo traduco ancora"); tense = "prog"; }
    var o = objOf(v, { neg: neg, past: tense === "past" || tense === "exp", modal: !!S.modal });
    if (v.loClitic) o.clitic = "lo";
    fixedObj(v, o);
    var vp;
    var modal = S.modal, front = "";
    if (modal) {
      if (tense === "past" || tense === "exp") fail("verbo modale al passato: non lo traduco ancora");
      var base = infFor(inf, P);
      var mv;
      if (modal === "想要") mv = neg ? conj("volere", "a", P, "pres") : conj("volere", "a", P, F.past ? "impf" : "cond");
      else if (modal === "想") { mv = neg ? conj("volere", "a", P, "pres") : conj("volere", "a", P, F.past ? "impf" : "cond"); if (!neg && !F.past) notes.push("想 + verbo = «vorrei / ho voglia di…»."); }
      else if (modal === "要") { mv = conj("volere", "a", P, F.past ? "impf" : "pres"); notes.push("要 + verbo può voler dire «voglio», ma anche «devo» o «sto per»: dipende dal contesto."); }
      else if (modal === "会") {
        if (ABIL[h] || /s/.test(fl)) { mv = conj("sapere", "a", P, "pres"); notes.push("会 + verbo = «so fare»: un'abilità imparata."); }
        else { mv = null; vp = (neg ? "non " : "") + (o.clitic ? o.clitic + " " : "") + conj(inf, aux, P, "fut"); }
      }
      else if (modal === "能" || modal === "可以") mv = conj("potere", "a", P, F.past ? "impf" : "pres");
      else if (modal === "应该") mv = conj("dovere", "a", P, "cond");
      else if (modal === "必须") mv = conj("dovere", "a", P, "pres");
      if (mv) vp = (neg ? "non " : "") + (o.clitic ? o.clitic + " " : "") + mv + " " + base;
    } else if (tense === "prog") {
      var pi = (P[0] - 1) + (P[1] === "p" ? 3 : 0), refl = /rsi(\s|$)/.test(inf);
      vp = (neg ? "non " : "") + (refl ? I.CLITIC[pi] + " " : "") + (o.clitic ? o.clitic + " " : "") + conj("stare", "a", P, "pres") + " " + I.gerund(inf) + (inf.indexOf(" ") > 0 ? inf.slice(inf.indexOf(" ")) : "");
    } else {
      var fin = conj(inf, aux, P, tense, P[2]);
      if ((tense === "past" || tense === "exp") && o.clitic && !o.cliticInd && /^(lo|la|li|le|La)$/.test(o.clitic) && aux === "a") {
        var OP = o.cliticP, part = I.pp(inf);
        fin = fin.replace(part, I.agreeO(part, OP[2] === "x" ? "m" : OP[2], OP[1]));
        fin = (/^(lo|la|La)$/.test(o.clitic) && /^h/.test(fin) ? "l'" : o.clitic + " ") + fin;
      } else if (o.clitic) fin = o.clitic + " " + fin;
      vp = (neg ? "non " : "") + fin;
      if (h === "去" && v.guo) { vp = (neg ? "non " : "") + conj("essere", "e", P, "past"); notes.push("去过 = «ci sono stato»: l'esperienza di essere andato."); }
    }
    if (v.guo) {
      if (neg) vp = afterFinite(vp, "mai");
      else if (isQ) vp = afterFinite(vp, "mai");
      else if (h !== "去") vp = afterFinite(vp, "già");
      if (h !== "去") notes.push("过 = l'hai fatto almeno una volta nella vita.");
    }
    if (F.yijing && !v.guo) vp = afterFinite(vp, "già");
    if (F.hai) { if (S.neg) vp = afterFinite(vp, "ancora"); else vp = afterFinite(vp, "ancora"); }
    if (F.tutti) vp = afterFinite(vp, F.tutti);
    var tail = o.tail.slice();
    if (v.then) {
      if (!/^(去|来)$/.test(h) && !/^(开始|学|学习|准备)$/.test(h)) fail("due verbi di fila: non lo traduco ancora");
      var t2 = verbPhraseInf(v.then, P, notes, /^(去|来)$/.test(h));
      tail.push(aPrep(t2.it)); if (t2.q) { o.q = t2.q; o.qWord = t2.qWord; }
    }
    if (v.le && S.fin === "了") { /* 了 doppio: compiuto */ }
    if (tense === "past" && !neg && !v.le && S.le) notes.push("了 in fondo alla frase: l'azione è avvenuta (o la situazione è cambiata).");
    return { vp: vp, tail: tail, q: o.q, qWord: o.qWord, front: front };
  }

  /* ================= memoria: frasi verificate e correzioni dell'utente ================= */
  var MEM = null;
  function strip(s) { return String(s).replace(/[\s，。？！、,.!?;；:：“”"'‘’…]/g, ""); }
  function memory() {
    if (MEM) return MEM;
    MEM = {};
    var add = function (zh, it, src) { var k = strip(zh); if (k && it && !MEM[k]) MEM[k] = { it: it, src: src }; };
    (typeof VERIFIED !== "undefined" ? VERIFIED : []).forEach(function (v) { add(v[0], v[1], "verified"); });
    (typeof EX !== "undefined" ? EX : []).forEach(function (e) { add(e[0].join(""), e[2], "data"); });
    (typeof PATTERNS !== "undefined" ? PATTERNS : []).forEach(function (p) { p.ex.forEach(function (e) { add(typeof e[0] === "string" ? e[0] : e[0].join(""), e[2], "data"); }); });
    (typeof PHRASES !== "undefined" ? PHRASES : []).forEach(function (g) { g.items.forEach(function (x) { add(x[1], x[2], "data"); }); });
    (typeof DIALOGS !== "undefined" ? DIALOGS : []).forEach(function (d) { d.lines.forEach(function (l) { add(l[2], l[3], "data"); }); });
    (typeof LESSONS !== "undefined" ? LESSONS : []).forEach(function (l) { (l.ex || []).forEach(function (e) { add(e[0], e[1], "data"); }); (l.quiz || []).forEach(function (q) { if (q.k === "order") add(q.zh, q.it, "data"); }); });
    return MEM;
  }
  /* correzioni dell'utente (contributi «tr»): vincono su tutto, solo nella sua copia */
  function mine() {
    var out = {};
    if (CP.contrib && CP.contrib.list) CP.contrib.list().forEach(function (c) { if (c.op === "tr" && !c.undone && c.target) out[strip(c.target)] = { it: c.new, id: c.id }; });
    return out;
  }

  /* verbo + oggetto che in italiano è un verbo solo (吃 + 晚饭 = cenare), 想 + 要 = vorrei */
  var FUNC = { "是": 1, "不是": 1, "有": 1, "在": 1, "正在": 1, "比": 1, "更": 1, "了": 1, "过": 1, "着": 1, "的": 1, "跟": 1, "和": 1, "给": 1, "从": 1, "一起": 1, "多": 1, "几": 1, "多少": 1, "钱": 1, "岁": 1, "人": 1, "什么": 1, "谁": 1, "为什么": 1, "怎么": 1, "什么时候": 1, "喜欢": 1, "爱": 1, "哪": 1, "多少钱": 1 };
  function covered(k) {
    var h = hz(k);
    return [G.pron, G.nouns, G.places, G.verbs, G.adjs, G.haveAdjs, G.time, G.nums, G.clf, G.degree, G.nations].some(function (t) { return lex(t, k) !== undefined; }) ||
      NEG[h] || MODAL[h] || FINAL[h] || DEMS[h] || ADVS[h] || QPLACE[h] || FUNC[h];
  }
  /* una parola del vocabolario che è in realtà una frase fatta (我也是, 太贵了, 明天见): la divido nelle sue parole */
  function split(keys) {
    var out = [];
    keys.forEach(function (k) {
      var h = hz(k), cs = Array.from(h);
      if (cs.length < 2 || covered(k)) { out.push(k); return; }
      var parts = [], i = 0;
      while (i < cs.length) {
        var L = Math.min(4, cs.length - i), got = null;
        for (; L >= 1; L--) { var sub = cs.slice(i, i + L).join(""); if (sub !== h && W[sub]) { got = sub; break; } }
        if (!got) { parts = null; break; }
        parts.push(got); i += L;
      }
      if (parts && parts.every(function (x) { return covered(x); })) out.push.apply(out, parts); else out.push(k);
    });
    return out;
  }
  function merge(keys) {
    var out = [];
    for (var i = 0; i < keys.length; i++) {
      var a = hz(keys[i]), b = keys[i + 1] != null ? hz(keys[i + 1]) : null, c = keys[i + 2] != null ? hz(keys[i + 2]) : null;
      if (b && a === "想" && b === "要") { out.push("想要"); i++; continue; }
      /* 吃了饭 = 吃饭 + 了 */
      if (c && (b === "了" || b === "过") && lex(G.verbs, a + c) !== undefined) { out.push(a + c); out.push(keys[i + 1]); i += 2; continue; }
      if (b && !W[a + b] && lex(G.verbs, a + b) !== undefined) { out.push(a + b); i++; continue; }
      out.push(keys[i]);
    }
    return out;
  }

  /* ================= ingresso ================= */
  /* keys: chiavi del vocabolario nell'ordine della frase; punct: ".", "?", "!" o "" */
  function translate(keys, punct, opt) {
    opt = opt || {};
    var zh = keys.map(hz).join(""), sk = strip(zh), res = { zh: zh, it: "", notes: [], sure: false, src: "", words: keys.map(function (k) { return [hz(k), gloss(k)]; }) };
    if (!keys.length) return res;
    if (!opt.rulesOnly) {
      var my = mine()[sk]; if (my) { res.it = my.it; res.sure = true; res.src = "mine"; res.contribId = my.id; return res; }
      var m = memory()[sk]; if (m) { res.it = m.it; res.sure = true; res.src = m.src; return res; }
    }
    var fx = G.fixed[zh] || G.fixed[zh.replace(/[吗呢吧]$/, "")] && null;
    if (G.fixed[zh]) { var f = G.fixed[zh]; res.it = /[.!?]$/.test(f) ? f : f + (punct === "?" ? "?" : punct === "!" ? "!" : "."); res.sure = true; res.src = "rules"; return res; }
    for (var i = 0; i < keys.length; i++) if (!W[keys[i]]) { res.reason = "non riconosco «" + keys[i] + "»"; res.it = NOPE; return res; }
    try {
      NOTES = [];
      var S = parse(merge(split(keys))), out = generate(S, punct);
      res.it = out.it; res.notes = NOTES.concat(out.notes).filter(function (x, j, a) { return a.indexOf(x) === j; }); res.sure = true; res.src = "rules";
    } catch (e) {
      if (!(e instanceof Fail)) { if (opt.throwErrors) throw e; res.reason = "errore interno: " + e.message; }
      else { res.reason = e.msg; if (e.k) res.missing = hz(e.k); }
      res.it = NOPE; res.sure = false;
    }
    return res;
  }
  CP.lab = CP.lab || {};
  CP.lab.translate = translate;
  CP.lab.NOPE = NOPE;
  CP.lab.memory = function () { MEM = null; return memory(); };
  CP.lab.strip = strip;
  CP.lab.zhNum = zhNum;
  /* compatibilità con il vecchio nome */
  CP.lab.fluid = function (keys, punct) { var r = translate(keys, punct); return { it: r.it, notes: r.notes, approx: r.sure ? [] : ["?"], sure: r.sure, src: r.src, reason: r.reason, words: r.words }; };
})();
