/* ===== màndarínō · 句子检查: il correttore di frasi italiane del corso per chi parla cinese.
   Chi studia scrive una frase in italiano; il correttore controlla solo quello che sa controllare con sicurezza, con le
   parole del lessico del corso (CP.itLexicon) e le regole di phrases/italian.js (CP.ita):
     - articolo + nome (la libro → il libro; lo/il/l', un/uno/una/un'), anche con un aggettivo in mezzo;
     - preposizione + articolo (a il → al, su il → sul, in la → nella);
     - numero + nome (due libro → due libri); possessivi e dimostrativi (il suo casa → la sua casa, quello libro → quel libro);
     - nome + aggettivo e soggetto + essere + aggettivo (la casa bianco → bianca; lei è alto → alta);
     - soggetto + verbo al presente (io parla → parlo; io parlare → parlo), «piacere» (io piace → mi piace; mi piace i cani);
     - ausiliare e participio (ho andato → sono andato; lei è andato → andata; mi ho alzato → mi sono alzato); sono fame → ho fame;
     - nazionalità e lingue in minuscolo (Cinese → cinese) e gli accenti dimenticati (citta → città, perche → perché).
   Non giudica il senso né l'ordine delle parole, e lo dice. Le parole che non conosce restano fuori dal controllo.
   Prova di sicurezza: tools/e2e.mjs passa al correttore tutte le frasi italiane dell'app (giuste) e non vuole segnalazioni.
   CP.itCheck(testo) → { toks, issues: [{ at, len, kind, zh, fix }], fixed, unknown, known }; CP.itCheckHTML() = il pannello. ===== */
(function () {
  var CP = window.CP, tt = CP.t, esc = CP.esc;
  var IDX = null;
  var ARTS = { il: ["m", "s", "d"], lo: ["m", "s", "d"], la: ["f", "s", "d"], "l'": ["x", "s", "d"], i: ["m", "p", "d"], gli: ["m", "p", "d"], le: ["f", "p", "d"],
    un: ["m", "s", "i"], uno: ["m", "s", "i"], una: ["f", "s", "i"], "un'": ["f", "s", "i"] };
  var PRON = { io: [0], tu: [1], lui: [2, "m", "s"], lei: [2, "f", "s"], noi: [3, null, "p"], voi: [4, null, "p"], loro: [5, null, "p"] };
  var CLIT = { non: 1, mi: 1, ti: 1, si: 1, ci: 1, vi: 1, lo: 1, la: 1, li: 1, le: 1, ne: 1, gli: 1 };
  var OBJ = { lo: 1, la: 1, li: 1, le: 1, ne: 1 };
  var ESS = ["sono", "sei", "è", "siamo", "siete", "sono"], AVE = ["ho", "hai", "ha", "abbiamo", "avete", "hanno"];
  var PREP = { di: 1, a: 1, da: 1, "in": 1, su: 1 };
  var NUMS = { due: 1, tre: 1, quattro: 1, cinque: 1, sei: 1, sette: 1, otto: 1, nove: 1, dieci: 1, venti: 1, trenta: 1, cento: 1, mille: 1 };
  var POSS = { mio: ["mio", "mia", "miei", "mie"], tuo: ["tuo", "tua", "tuoi", "tue"], suo: ["suo", "sua", "suoi", "sue"], nostro: ["nostro", "nostra", "nostri", "nostre"], vostro: ["vostro", "vostra", "vostri", "vostre"] };
  var POSSOF = {}; Object.keys(POSS).forEach(function (b) { POSS[b].forEach(function (f, i) { POSSOF[f] = { forms: POSS[b], g: i % 2 ? "f" : "m", n: i > 1 ? "p" : "s" }; }); });
  var QUESTO = ["questo", "questa", "questi", "queste"], QUELLO = { il: "quel", lo: "quello", "l'": "quell'", la: "quella", i: "quei", gli: "quegli", le: "quelle" };
  var DEM = { questo: 1, questa: 1, questi: 1, queste: 1, "quest'": 1, quel: 1, quello: 1, "quell'": 1, quella: 1, quei: 1, quegli: 1, quelle: 1, quelli: 1 };
  /* parenti al singolare: «mia madre», senza articolo */
  var FAM = { madre: 1, padre: 1, fratello: 1, sorella: 1, marito: 1, moglie: 1, figlio: 1, figlia: 1, zio: 1, zia: 1, nonno: 1, nonna: 1, cugino: 1, cugina: 1, nipote: 1, suocero: 1, suocera: 1, cognato: 1, cognata: 1 };
  /* avere + nome: «ho fame», non «sono fame» */
  var HAVE = { fame: 1, sete: 1, sonno: 1, paura: 1, ragione: 1, torto: 1, fretta: 1, bisogno: 1, voglia: 1 };
  var CL = { io: "mi", tu: "ti", lui: "gli", lei: "le", noi: "ci", voi: "vi", loro: "gli" };
  /* parole grammaticali e frequenti che non stanno nel lessico: note, ma senza controlli */
  var FUNC = {}; ("e ed o oppure ma però che chi cosa come dove quando perché se di da in con su per tra fra a al allo alla ai agli alle del dello della dei degli delle dal dalla nel nella nei nelle sul sulla " +
    "anche molto poco tanto troppo più meno bene male già ancora sempre mai ecco sì no qui qua lì là oggi ieri domani adesso ora poi prima dopo " +
    "mio mia miei mie tuo tua tuoi tue suo sua suoi sue nostro nostra nostri nostre vostro vostra vostri vostre questo questa questi queste quello quella quelli quelle quel quei quegli " +
    "ciao grazie prego scusi scusa buongiorno buonasera arrivederci così davvero abbastanza proprio piuttosto parecchio solo tutto tutta tutti tutte altro altra altri altre").split(" ").forEach(function (w) { FUNC[w] = 1; });
  var ADV = { molto: 1, troppo: 1, poco: 1, tanto: 1, proprio: 1, "così": 1, davvero: 1, abbastanza: 1, piuttosto: 1, "più": 1, meno: 1, parecchio: 1, sempre: 1, ancora: 1, "già": 1, anche: 1 };
  /* dopo queste parole comincia una frase nuova: il soggetto può essere lì */
  var START = { e: 1, ed: 1, ma: 1, "però": 1, che: 1, "perché": 1, quando: 1, se: 1, o: 1, oppure: 1, poi: 1, anche: 1, oggi: 1, ieri: 1, domani: 1, adesso: 1, ora: 1 };
  /* nomi di tempo: «una volta», «la mattina» non sono il soggetto */
  var TIME = { volta: 1, mattina: 1, sera: 1, notte: 1, pomeriggio: 1, giorno: 1, settimana: 1, mese: 1, anno: 1, domenica: 1, sabato: 1, estate: 1, inverno: 1, primavera: 1, autunno: 1 };
  var NOACC = { menu: 1, papa: 1, pero: 1, te: 1, se: 1, da: 1, ne: 1, si: 1, li: 1, la: 1 };   /* parole giuste anche senza accento */
  /* verbi che con il passato prossimo vogliono sempre essere: solo qui «ho andato» è un errore sicuro */
  var ESSERE_ONLY = { andare: 1, venire: 1, arrivare: 1, partire: 1, tornare: 1, entrare: 1, uscire: 1, restare: 1, rimanere: 1, stare: 1, essere: 1, nascere: 1, morire: 1, diventare: 1, sembrare: 1, cadere: 1, piacere: 1, succedere: 1, riuscire: 1 };
  var PNAME = [tt("itc.180"), tt("itc.181"), tt("itc.182"), tt("itc.183"), tt("itc.184"), tt("itc.185")];
  var GN = { ms: tt("itc.186"), fs: tt("itc.187"), mp: tt("itc.188"), fp: tt("itc.189") };

  function push(m, k, v) { (m[k] = m[k] || []).push(v); }
  function strip(s) { return String(s).replace(/（[^）]*）/g, "").trim(); }
  function bare(s) { var m = /^(il|lo|la|i|gli|le|l')\s*(.+)$/.exec(strip(s)); return m ? m[2] : strip(s); }
  function noAcc(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function index() {
    if (IDX) return IDX;
    var I = CP.ita, N = {}, N2 = {}, A = {}, V = {}, INF = {}, PPI = {};
    var LEX = CP.itLexicon ? CP.itLexicon() : [], later = [];
    function verb(inf, aux) {
      var refl = /^\S+rsi(\s|$)/.test(inf), v0 = inf.split(" ")[0]; aux = aux || (refl ? "e" : null);
      if (!INF[v0]) INF[v0] = { inf: inf, aux: aux };
      for (var pi = 0; pi < 6; pi++) {
        var p = I.present(inf, pi); if (!p) continue;
        var w = p.split(" ")[refl ? 1 : 0]; if (w) push(V, w.toLowerCase(), { inf: inf, pi: pi });
      }
      if (aux) { var pp = I.pp(inf); if (pp && pp.indexOf(" ") < 0 && /o$/.test(pp)) { var st = pp.slice(0, -1); [["o", "m", "s"], ["a", "f", "s"], ["i", "m", "p"], ["e", "f", "p"]].forEach(function (x) { push(PPI, st + x[0], { inf: inf, aux: aux, refl: refl, g: x[1], n: x[2], st: st }); }); } }
    }
    LEX.forEach(function (e) {
      if (e.kind === "noun") {
        var f = e.forms || [], gs = e.g === "mf" ? ["m", "f"] : [e.g === "f" ? "f" : "m"], sg = "", pl = "";
        f.forEach(function (x, i) {
          if (x.indexOf(tt("itc.108").trim()) >= 0) { push(N, bare(x).toLowerCase(), { g: "f", n: "s" }); return; }
          var n = x.indexOf(tt("itc.107").trim()) >= 0 || i > 0 ? "p" : "s";
          strip(x).split(" / ").forEach(function (y) {
            var m = /^(il|lo|la|i|gli|le|l')\s*(.+)$/.exec(y.trim()), w = (m ? m[2] : y).toLowerCase(), a = m ? ARTS[m[1]] : null;
            if (n === "s" && !sg) sg = w; if (n === "p" && !pl) pl = w;
            var both = e.g === "mf" || /(ante|ente|ista|isti)$/.test(w);   /* l'insegnante, il/la cantante, il/la giornalista */
            (both ? ["m", "f"] : [a && a[0] !== "x" ? a[0] : gs[0]]).forEach(function (g) {
              var r = { g: g, n: n, sg: "", pl: "" };
              if (w.indexOf(" ") < 0) push(N, w, r); else if (w.split(" ").length === 2) push(N2, w, r);
            });
          });
        });
        [sg, pl].forEach(function (w) { (N[w] || N2[w] || []).forEach(function (r) { if (!r.sg) r.sg = sg; if (!r.pl) r.pl = pl; }); });
      } else if (e.kind === "adj" || e.kind === "nat") {
        var fs = e.forms || [];
        if (fs.length === 4) [["m", "s"], ["f", "s"], ["m", "p"], ["f", "p"]].forEach(function (gn, i) { if (fs[i] && fs[i].indexOf(" ") < 0) push(A, fs[i].toLowerCase(), { g: gn[0], n: gn[1], forms: fs, nat: e.kind === "nat" }); });
      } else if (e.kind === "verb" && I) verb(e.it, e.aux);
      else if (e.kind === "other" && /^[a-z]+(are|ere|ire|rsi) /.test(e.it)) later.push(e.it.split(" ")[0]);
    });
    /* i verbi delle locuzioni («vivere da soli», «farsi male»), ma non i nomi che finiscono come un infinito («mare aperto») */
    if (I) later.forEach(function (v) { if (!N[v] && !A[v] && !INF[v]) verb(v, null); });
    Object.keys(I && I.IRR || {}).forEach(function (inf) { I.IRR[inf].forEach(function (w, pi) { if (!(V[w] || []).some(function (x) { return x.inf === inf && x.pi === pi; })) push(V, w, { inf: inf, pi: pi }); }); });
    push(N2, "fine settimana", { g: "m", n: "s", sg: "fine settimana", pl: "fine settimana" }); push(N2, "fine settimana", { g: "m", n: "p", sg: "fine settimana", pl: "fine settimana" });
    Object.keys(FUNC).forEach(function (w) { delete N[w]; delete A[w]; });   /* «dei», «molto», «proprio»: parole grammaticali, non nomi o aggettivi */
    /* tutte le parole note, anche senza accenti, per i suggerimenti di ortografia */
    var ALL = {}, BARE = {};
    [N, A, V, INF, PPI, FUNC, PRON, ARTS].forEach(function (m) { Object.keys(m).forEach(function (w) { ALL[w] = 1; var b = noAcc(w); if (b !== w) push(BARE, b, w); }); });
    return (IDX = { N: N, N2: N2, A: A, V: V, INF: INF, PPI: PPI, ALL: ALL, BARE: BARE });
  }

  /* parole con la loro posizione nel testo (l', un', quell' restano attaccati alla parola dopo, come si scrivono) */
  function tokenize(s) {
    var out = [], re = /[A-Za-zÀ-ÖØ-öø-ÿ]+'?/g, m;
    while ((m = re.exec(s))) out.push({ w: m[0], lw: m[0].toLowerCase(), at: m.index, len: m[0].length });
    return out;
  }
  function cap(src, dst) { return /^[A-ZÀ-Ö]/.test(src) ? dst.charAt(0).toUpperCase() + dst.slice(1) : dst; }
  function adjFix(a, g, n) { return a.forms[(g === "f" ? 1 : 0) + (n === "p" ? 2 : 0)]; }

  function check(text) {
    var X = index(), I = CP.ita, src = String(text || "").replace(/’/g, "'"), T = tokenize(src), issues = [], unknown = [], known = 0, nounAt = {};
    function adj2(a, b) { var A0 = T[a], B0 = T[b]; return !!(A0 && B0) && /^\s*$/.test(src.slice(A0.at + A0.len, B0.at)); }   /* vicine, senza punteggiatura in mezzo */
    function start(i) {
      if (i === 0 || !adj2(i - 1, i)) return true;
      if (/^(e|ed)$/.test(T[i - 1].lw) && i > 1 && adj2(i - 2, i - 1) && X.N[T[i - 2].lw]) return false;   /* «il libro e il suo autore»: soggetto doppio */
      return !!START[T[i - 1].lw];
    }
    function skipAdv(k) { var s = k; while (T[k] && ADV[T[k].lw] && adj2(k - 1, k) && T[k + 1] && adj2(k, k + 1)) k++; return { k: k, cmp: T.slice(s, k).some(function (t) { return t.lw === "più" || t.lw === "meno"; }) }; }
    function issue(a, b, kind, zh, fix) { issues.push({ at: T[a].at, len: T[b].at + T[b].len - T[a].at, kind: kind, zh: zh, fix: fix, w: src.slice(T[a].at, T[b].at + T[b].len) }); }
    function one(i, kind, zh, fix) { issue(i, i, kind, zh, fix); }
    function isNoun(i) { return T[i] && (X.N[T[i].lw] || (T[i + 1] && adj2(i, i + 1) && X.N2[T[i].lw + " " + T[i + 1].lw])); }
    /* un sintagma nominale da i: [aggettivo] nome [nome] → { j (ultimo token), n0 (il nome), cands (genere, numero, forme), mid } */
    function np(i) {
      var j = i, mid = null;
      if (!T[j]) return null;
      if (T[j + 1] && adj2(j, j + 1) && X.N2[T[j].lw + " " + T[j + 1].lw]) return { j: j + 1, n0: j, cands: X.N2[T[j].lw + " " + T[j + 1].lw], mid: null };   /* il fine settimana */
      if (X.A[T[j].lw] && !X.N[T[j].lw] && adj2(j, j + 1) && X.N[(T[j + 1] || {}).lw]) { mid = j; j++; }
      var two = T[j + 1] && adj2(j, j + 1) ? X.N2[T[j].lw + " " + T[j + 1].lw] : null, cands = two || X.N[T[j].lw];
      if (!cands) return null;
      return { j: two ? j + 1 : j, n0: j, cands: cands, mid: mid };
    }
    /* aggettivo dopo il nome (anche dopo «molto»), accordato con c */
    function after(p, c, head) {
      var s = skipAdv(p.j + 1), at = adj2(s.k - 1, s.k) ? T[s.k] : null, aa = at && X.A[at.lw];
      if (!aa || X.V[at.lw] || X.N[at.lw] || s.cmp) return p.j;
      if (!aa.some(function (x) { return x.g === c.g && x.n === c.n; })) one(s.k, "adj", "「" + head + " " + at.w + "」：" + head + tt("itc.190") + GN[c.g + c.n] + tt("itc.191") + adjFix(aa[0], c.g, c.n) + "」。", cap(at.w, adjFix(aa[0], c.g, c.n)));
      return s.k;
    }
    /* il soggetto ricorda tutte le letture possibili del nome (vite: «la vite» e «le vite»): si segnala solo se nessuna va */
    function subjectAt(j, c, s, head, all) { if (!TIME[T[head].lw]) nounAt[j] = { g: c.g, n: c.n, s: s, all: all && all.length ? all : [c] }; }

    for (var i = 0; i < T.length; i++) {
      var t = T[i], lw = t.lw;
      var isKnown = X.ALL[lw] || CLIT[lw] || NUMS[lw] || DEM[lw];
      if (isKnown) known++;
      else if (!/^[A-ZÀ-Ö]/.test(t.w) || i === 0) {
        unknown.push(t.w);
        /* ortografia: solo l'accento dimenticato (citta → città). Una lettera di differenza no: il lessico non ha tutte le forme
           (gerundi, imperfetti, «favore»…) e i suggerimenti sbagliati sarebbero più di quelli giusti */
        if (lw.length >= 3 && !/'$/.test(lw)) {
          var acc = X.BARE[noAcc(lw)], sug = acc && acc.length === 1 && !NOACC[lw] ? acc[0] : null;
          if (sug) one(i, "spell", "「" + t.w + tt("itc.192") + sug + "」？", cap(t.w, sug));
        }
      }
      /* nazionalità e lingue: minuscole in italiano */
      var A0 = X.A[lw];
      if (A0 && A0.some(function (x) { return x.nat; }) && /^[A-ZÀ-Ö]/.test(t.w) && i > 0 && adj2(i - 1, i)) one(i, "case", "「" + t.w + tt("itc.193") + lw + "」。", lw);

      /* articolo (+ aggettivo) + nome, con la preposizione davanti se c'è */
      var clitic = CLIT[lw] && T[i + 1] && X.V[T[i + 1].lw] && (i === 0 || !adj2(i - 1, i) || PRON[T[i - 1].lw] || /^(non|te|me|se|ce|ve|glie)$/.test(T[i - 1].lw));
      if (ARTS[lw] && T[i + 1] && adj2(i, i + 1) && !clitic) {
        var p = np(i + 1), a = ARTS[lw], prp = i > 0 && adj2(i - 1, i) && PREP[T[i - 1].lw] && a[2] === "d" ? i - 1 : -1, artNow = lw;
        if (prp > 0 && T[prp].lw === "su" && (X.V[T[prp - 1].lw] || X.INF[T[prp - 1].lw])) prp = -1;   /* «portare su i bagagli»: su è un avverbio */
        if (p) {
          var nt = T[p.n0], ok = p.cands.filter(function (c) { return c.n === a[1] && (a[0] === "x" || c.g === a[0]); }), c0 = ok[0] || p.cands[0];
          var next = T[p.mid != null ? p.mid : p.n0].w, nn = /^(ch|h|w|y|j|k|x)/i.test(next);
          var want = a[2] === "i" ? (c0.n === "s" ? I.indef(next, c0.g) : null) : I.def(next, c0.g, c0.n);
          if (a[2] === "i" && c0.n === "p") one(i, "art", "「" + t.w + " " + nt.w + "」：" + nt.w + tt("itc.194") + I.def(next, c0.g, "p") + "」。", cap(t.w, I.def(next, c0.g, "p")));
          else if (want && (!ok.length || (want !== lw && !nn))) {
            if (prp < 0) one(i, "art", "「" + t.w + " " + nt.w + "」：" + nt.w + tt("itc.190") + GN[c0.g + c0.n] + "，" + (ok.length ? tt("itc.195") + want + tt("itc.196") : tt("itc.197") + want + "」。"), cap(t.w, want));
            artNow = want;
          }
          if (p.mid != null) { var ma = X.A[T[p.mid].lw]; if (!ma.some(function (x) { return x.g === c0.g && x.n === c0.n; })) one(p.mid, "adj", "「" + T[p.mid].w + " " + nt.w + "」：" + nt.w + tt("itc.190") + GN[c0.g + c0.n] + tt("itc.191") + adjFix(ma[0], c0.g, c0.n) + "」。", cap(T[p.mid].w, adjFix(ma[0], c0.g, c0.n))); }
          var end = after(p, c0, nt.w);
          if (prp < 0) subjectAt(end, c0, i, p.n0, ok);
        }
        if (prp >= 0) { var comb = I.prep(T[prp].lw, artNow); issue(prp, i, "prep", "「" + T[prp].w + " " + t.w + tt("itc.198") + T[prp].lw + tt("itc.199") + comb + "」。", cap(T[prp].w, comb)); }
      }
      /* numero + nome: plurale */
      if (NUMS[lw] && adj2(i, i + 1)) {
        var q = np(i + 1);
        if (q && !q.cands.some(function (c) { return c.n === "p"; }) && q.cands[0].pl && q.cands[0].pl !== T[q.n0].lw) {
          var c1 = q.cands[0]; one(q.n0, "num", "「" + t.w + " " + T[q.n0].w + tt("itc.200") + c1.pl + "」。", cap(T[q.n0].w, c1.pl));
          after(q, { g: c1.g, n: "p" }, c1.pl);
        } else if (q) after(q, q.cands.filter(function (c) { return c.n === "p"; })[0] || q.cands[0], T[q.n0].w);
      }
      /* possessivo o dimostrativo + nome */
      var POS = POSSOF[lw], isDem = DEM[lw];
      /* la mia madre → mia madre (i parenti al singolare non vogliono l'articolo; con «loro» sì: la loro madre) */
      if (POS && i > 0 && adj2(i - 1, i) && ARTS[T[i - 1].lw] && ARTS[T[i - 1].lw][2] === "d" && ARTS[T[i - 1].lw][1] === "s" && T[i + 1] && adj2(i, i + 1) && FAM[T[i + 1].lw] && !(T[i + 2] && adj2(i + 1, i + 2) && X.A[T[i + 2].lw]))
        issue(i - 1, i - 1, "poss", "「" + T[i - 1].w + " " + t.w + " " + T[i + 1].w + tt("itc.201"), "");
      if ((POS || isDem) && adj2(i, i + 1)) {
        var r = np(i + 1);
        if (r && isDem && r.mid == null && X.A[T[r.n0].lw]) r = null;   /* «quella cinese»: pronome + aggettivo */
        if (r) {
          var prev = i > 0 && adj2(i - 1, i) ? T[i - 1].lw : "", artP = ARTS[prev] || null;
          var hasArt = !!artP || /^(del|dello|della|dei|degli|delle|al|allo|alla|ai|agli|alle|nel|nello|nella|nei|negli|nelle|sul|sullo|sulla|sui|sugli|sulle|dal|dallo|dalla|dai|dagli|dalle)$/.test(prev);
          var wantOf = function (c) { var k2 = (c.g === "f" ? 1 : 0) + (c.n === "p" ? 2 : 0); return POS ? POS.forms[k2] : /^quest/.test(lw) ? QUESTO[k2] : QUELLO[I.def(T[r.mid != null ? r.mid : r.n0].w, c.g, c.n)]; };
          var cc = r.cands.filter(function (c) { return wantOf(c) === lw && (!artP || (c.n === artP[1] && (artP[0] === "x" || c.g === artP[0]))); }).concat(r.cands)[0], head = T[r.n0].w, nx = T[r.mid != null ? r.mid : r.n0].w;
          var gi = (cc.g === "f" ? 1 : 0) + (cc.n === "p" ? 2 : 0);
          var wantP = POS ? POS.forms[gi] : /^quest/.test(lw) ? QUESTO[gi] : QUELLO[I.def(nx, cc.g, cc.n)];
          var okP = r.cands.some(function (c) { var w2 = wantOf(c); return w2 === lw || (lw === "quest'" && c.n === "s" && I.vowel(nx)); });
          if (!okP) one(i, "poss", "「" + t.w + " " + head + "」：" + head + tt("itc.190") + GN[cc.g + cc.n] + tt("itc.202") + wantP + "」。", cap(t.w, wantP));
          var fam = FAM[T[r.n0].lw] && cc.n === "s" && r.n0 === i + 1;
          if (POS && fam && artP && artP[2] === "d" && artP[1] === "s") { /* già segnalato sopra */ }
          else if (artP && artP[2] === "d" && I.def(wantP, cc.g, cc.n) !== prev) issue(i - 1, i - 1, "art", "「" + T[i - 1].w + " " + t.w + " " + head + "」：" + head + tt("itc.190") + GN[cc.g + cc.n] + tt("itc.203") + I.def(wantP, cc.g, cc.n) + "」。", cap(T[i - 1].w, I.def(wantP, cc.g, cc.n)));
          else if (POS && !hasArt && !fam && start(i) && !/^[A-ZÀ-Ö]/.test(head) && !/^(caro|cara|cari|care)$/.test(T[r.n0].lw)) one(i, "poss", "「" + t.w + " " + head + tt("itc.204") + I.def(wantP, cc.g, cc.n) + " " + wantP + "」。", cap(t.w, I.join(I.def(wantP, cc.g, cc.n), wantP)));
          var e2 = after(r, cc, head);
          if (!hasArt || artP) subjectAt(e2, cc, artP ? i - 1 : i, r.n0, r.cands.filter(function (c) { return wantOf(c) === lw; }));
        }
      }

      /* soggetto (pronome o sintagma nominale) + [non / pronomi atoni] + verbo */
      var subj = null;
      if (PRON[lw] && start(i)) subj = { pi: PRON[lw][0], g: PRON[lw][1], n: PRON[lw][2] || "s", w: t.w, pron: lw };
      else if (nounAt[i] && start(nounAt[i].s)) subj = { pi: nounAt[i].n === "p" ? 5 : 2, g: nounAt[i].g, n: nounAt[i].n, w: t.w, all: nounAt[i].all };
      if (!subj) continue;
      var k = i + 1, obj = false;
      while (T[k] && (CLIT[T[k].lw] || T[k].lw === "c'") && !X.V[T[k].lw] && adj2(k - 1, k)) { if (OBJ[T[k].lw] || /^(ci|c')$/.test(T[k].lw)) obj = true; k++; }
      var vt = T[k]; if (!vt || !adj2(k - 1, k) || (obj && !subj.pron)) continue;   /* «il pane lo mangio io»: l'oggetto è davanti */
      var vs = X.V[vt.lw], inf = X.INF[vt.lw];
      if (inf && !vs && I.present(inf.inf, subj.pi)) {
        var fi = I.present(inf.inf, subj.pi).split(" "), fw = fi[/^\S+rsi(\s|$)/.test(inf.inf) ? 1 : 0];
        one(k, "verb", "「" + subj.w + " " + vt.w + tt("itc.205") + PNAME[subj.pi] + "：「" + fw + "」。", cap(vt.w, fw));
        continue;
      }
      if (!vs || X.N[vt.lw] || X.A[vt.lw]) continue;
      var piac = vs.some(function (v) { return v.inf === "piacere"; });
      if (piac && subj.pron && T[k + 1] && adj2(k, k + 1) && (ARTS[T[k + 1].lw] || isNoun(k + 1))) {
        var pl2 = ARTS[T[k + 1].lw] ? ARTS[T[k + 1].lw][1] === "p" : false;
        issue(i, k, "verb", "「" + subj.w + " " + vt.w + tt("itc.206") + CL[subj.pron] + tt("itc.207"), cap(subj.w, CL[subj.pron]) + " " + (pl2 ? "piacciono" : "piace"));
        continue;
      }
      var pis = subj.all ? subj.all.map(function (c) { return c.n === "p" ? 5 : 2; }) : [subj.pi];
      if (!vs.some(function (v) { return pis.indexOf(v.pi) >= 0; }) && (subj.pron || vs.every(function (v) { return v.pi === 2 || v.pi === 5; }))) {
        var right = I.present(vs[0].inf, subj.pi), rw = right ? right.split(" ")[/^\S+rsi(\s|$)/.test(vs[0].inf) ? 1 : 0] : "";
        if (rw) { one(k, "verb", "「" + subj.w + " … " + vt.w + tt("itc.208") + PNAME[subj.pi] + tt("itc.209") + vs[0].inf + tt("itc.210") + rw + "」。", cap(vt.w, rw)); continue; }
      }
      /* essere + aggettivo: il predicato si accorda con il soggetto */
      var ess = ESS.indexOf(vt.lw) >= 0, sk = skipAdv(k + 1), pt = adj2(sk.k - 1, sk.k) ? T[sk.k] : null, pa = pt && !X.N[pt.lw] && X.A[pt.lw];
      if (ess && pa && !sk.cmp && !(T[sk.k + 1] && adj2(sk.k, sk.k + 1) && !FUNC[T[sk.k + 1].lw])) {
        if (!pa.some(function (x) { return (subj.all || [subj]).some(function (c) { return x.n === c.n && (!c.g || x.g === c.g); }); })) { var pg = subj.g || "m", pf = adjFix(pa[0], pg, subj.n); one(sk.k, "adj", "「" + subj.w + " " + vt.w + " " + pt.w + tt("itc.208") + (subj.g ? GN[subj.g + subj.n] : subj.n === "p" ? tt("itc.211") : tt("itc.212")) + tt("itc.191") + pf + "」" + (subj.g ? "" : tt("itc.213") + adjFix(pa[0], "f", subj.n) + "」）") + "。", cap(pt.w, pf)); }
      }
      /* essere + participio di un verbo con essere: accordo */
      var pp = T[k + 1] && adj2(k, k + 1) ? X.PPI[T[k + 1].lw] : null;
      if (ess && pp && pp[0].aux === "e" && subj.g && !pp.some(function (x) { return (subj.all || [subj]).some(function (c) { return x.g === c.g && x.n === c.n; }); })) {
        var pw = pp[0].st + (subj.g === "f" ? (subj.n === "p" ? "e" : "a") : (subj.n === "p" ? "i" : "o"));
        one(k + 1, "pp", "「" + subj.w + " " + vt.w + " " + T[k + 1].w + tt("itc.214") + pw + "」。", cap(T[k + 1].w, pw));
      }
    }

    /* ausiliare sbagliato: ho andato → sono andato, sono mangiato → ho mangiato, mi ho alzato → mi sono alzato; sono fame → ho fame */
    for (var h = 0; h < T.length - 1; h++) {
      if (!adj2(h, h + 1)) continue;
      var w0 = T[h].lw, ai = AVE.indexOf(w0), ei = ESS.indexOf(w0), nx2 = T[h + 1].lw, P2 = X.PPI[nx2];
      var cw = h > 0 && adj2(h - 1, h) ? T[h - 1].lw : "", clit = /^(mi|ti|si|ci|vi|me|te|se|ce|ve|ne|c')$/.test(cw);
      /* riflessivo solo se il pronome è della stessa persona dell'ausiliare: «mi ho alzato» sì, «mi ha chiamato» no */
      var refl = ai >= 0 && ["mi", "ti", "si", "ci", "vi", "si"][ai] === cw;
      /* il participio può venire da due verbi (chiamato: chiamare con avere, chiamarsi con essere): si segnala solo se tutti dicono così */
      if (ai >= 0 && P2 && (refl ? P2.some(function (x) { return x.refl; }) : !clit && P2.every(function (x) { return ESSERE_ONLY[x.inf.split(" ")[0]] && !x.refl; }))) {
        var g0 = P2.some(function (x) { return x.g === "m" && x.n === (ai >= 3 ? "p" : "s"); }) ? nx2 : P2[0].st + (ai >= 3 ? "i" : "o");
        issue(h, h + 1, "aux", "「" + T[h].w + " " + T[h + 1].w + "」：" + P2[0].inf + tt("itc.215") + ESS[ai] + " " + g0 + tt("itc.216"), cap(T[h].w, ESS[ai] + " " + g0));
      } else if (ei >= 0 && w0 !== "è" && P2 && /o$/.test(nx2) && P2.every(function (x) { return x.aux === "a" && !x.refl; }) && !clit && !(T[h + 2] && adj2(h + 1, h + 2) && /^(da|dal|dalla|dai|dalle|dallo|dagli)$/.test(T[h + 2].lw))) {
        var who = w0 === "sono" ? 0 : ei;
        issue(h, h + 1, "aux", "「" + T[h].w + " " + T[h + 1].w + "」：" + P2[0].inf + tt("itc.217") + AVE[who] + " " + P2[0].st + "o」。", cap(T[h].w, AVE[who] + " " + P2[0].st + "o"));
      } else if (ei >= 0 && HAVE[nx2] && !clit) {
        issue(h, h, "aux", "「" + T[h].w + " " + T[h + 1].w + tt("itc.218") + nx2 + "」：「" + AVE[w0 === "sono" ? 0 : ei] + " " + nx2 + "」。", cap(T[h].w, AVE[w0 === "sono" ? 0 : ei]));
      }
      /* mi piace + plurale → mi piacciono; mi piacciono + singolare → mi piace */
      if (/^(mi|ti|gli|le|ci|vi)$/.test(w0) && (nx2 === "piace" || nx2 === "piacciono") && T[h + 2] && adj2(h + 1, h + 2) && ARTS[T[h + 2].lw] && T[h + 3] && X.N[T[h + 3].lw]) {
        var pn = ARTS[T[h + 2].lw][1] === "p", wantV = pn ? "piacciono" : "piace";
        if (wantV !== nx2) one(h + 1, "verb", "「" + T[h + 1].w + " " + T[h + 2].w + " " + T[h + 3].w + tt("itc.219") + (pn ? tt("itc.211") : tt("itc.212")) + tt("itc.220") + wantV + "」。", wantV);
      }
    }

    issues.sort(function (a, b) { return a.at - b.at; });
    var lastEnd = -1; issues = issues.filter(function (x) { if (x.at < lastEnd) return false; lastEnd = x.at + x.len; return true; });
    var fixed = src, off = 0;
    issues.forEach(function (x) {
      var f = x.fix, s0 = x.at + off, e0 = s0 + x.len;
      if (!f) {   /* togliere una parola: «la mia madre» → «mia madre» */
        while (fixed.charAt(e0) === " ") e0++;
        var rest = fixed.slice(e0); if (/^[A-ZÀ-Ö]/.test(x.w)) rest = rest.charAt(0).toUpperCase() + rest.slice(1);
        fixed = fixed.slice(0, s0) + rest; off -= e0 - s0; return;
      }
      if (/'$/.test(x.w) && !/'$/.test(f) && /[A-Za-zÀ-ÿ]/.test(fixed.charAt(e0))) f += " ";   /* l'studente → lo studente */
      fixed = fixed.slice(0, s0) + f + fixed.slice(e0); off += f.length - x.len;
    });
    fixed = fixed.replace(/\b(l'|un'|all'|dell'|nell'|sull'|dall'|quell') +/gi, "$1");
    return { toks: T, issues: issues, fixed: fixed, unknown: unknown, known: known };
  }
  CP.itCheck = check; check.index = index;   /* per le prove */

  /* ---- il pannello nella scheda 句子 ---- */
  var last = "";
  function resultHTML(s) {
    if (!s.trim()) return "";
    var r = check(s), h = "";
    if (!r.toks.length) return "";
    if (!r.known) return tt("itc.221");
    if (r.issues.length) {
      var marked = "", pos = 0;
      r.issues.forEach(function (x) { marked += esc(s.slice(pos, x.at)) + '<mark class="itc-bad">' + esc(s.slice(x.at, x.at + x.len)) + "</mark>"; pos = x.at + x.len; });
      marked += esc(s.slice(pos));
      h += '<p class="it-big" lang="it">' + marked + "</p>" + r.issues.map(function (x) { return '<p class="verdict ' + (x.kind === "spell" ? "" : "ko ") + 'small" style="margin:4px 0">' + (x.kind === "spell" ? "❓ " : "✗ ") + esc(x.zh) + "</p>"; }).join("") +
        tt("itc.222") + esc(r.fixed) + '</b> <button type="button" class="say" data-it-say="' + CP.attr(r.fixed) + tt("itc.223");
    } else h += tt("itc.224");
    var unk = r.unknown.filter(function (w) { return !r.issues.some(function (x) { return x.kind === "spell" && x.w === w; }); });
    if (unk.length) h += tt("itc.225") + esc(unk.slice(0, 12).join("、")) + "</span></p>";
    return h;
  }
  CP.itCheckHTML = function () {
    return tt("itc.226") +
      tt("itc.227") +
      tt("itc.228") + CP.attr(last) + '" style="flex:1 1 220px;min-width:0">' +
      tt("itc.229") + resultHTML(last) + "</div></div>";
  };
  document.addEventListener("submit", function (e) {
    var f = e.target; if (!f || !f.hasAttribute || !f.hasAttribute("data-itc-form")) return;
    e.preventDefault();
    var inp = document.getElementById("itc-in"), out = document.getElementById("itc-out"); if (!inp || !out) return;
    last = inp.value.slice(0, 300); out.innerHTML = resultHTML(last);
    var r = check(last); if (last.trim() && r.known) CP.sfx(r.issues.some(function (x) { return x.kind !== "spell"; }) ? "ko" : "ok");
  });
})();
