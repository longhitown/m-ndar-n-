/* Morfologia italiana per il traduttore del laboratorio: coniugazioni, articoli, preposizioni articolate,
   possessivi, accordi. Nessun dato sul cinese qui: solo regole dell'italiano, provate da tools/grammar.mjs.
   Persone: pi = 0..5 (io, tu, lui/lei, noi, voi, loro). Genere: "m", "f" o "x" (non si sa: «o/a»). */
(function () {
  var CP = window.CP;
  var IRR = {   /* presente indicativo */
    essere: ["sono", "sei", "è", "siamo", "siete", "sono"], avere: ["ho", "hai", "ha", "abbiamo", "avete", "hanno"],
    andare: ["vado", "vai", "va", "andiamo", "andate", "vanno"], venire: ["vengo", "vieni", "viene", "veniamo", "venite", "vengono"],
    fare: ["faccio", "fai", "fa", "facciamo", "fate", "fanno"], dire: ["dico", "dici", "dice", "diciamo", "dite", "dicono"],
    potere: ["posso", "puoi", "può", "possiamo", "potete", "possono"], volere: ["voglio", "vuoi", "vuole", "vogliamo", "volete", "vogliono"],
    dovere: ["devo", "devi", "deve", "dobbiamo", "dovete", "devono"], sapere: ["so", "sai", "sa", "sappiamo", "sapete", "sanno"],
    bere: ["bevo", "bevi", "beve", "beviamo", "bevete", "bevono"], uscire: ["esco", "esci", "esce", "usciamo", "uscite", "escono"],
    stare: ["sto", "stai", "sta", "stiamo", "state", "stanno"], dare: ["do", "dai", "dà", "diamo", "date", "danno"],
    salire: ["salgo", "sali", "sale", "saliamo", "salite", "salgono"], scegliere: ["scelgo", "scegli", "sceglie", "scegliamo", "scegliete", "scelgono"],
    piacere: ["piaccio", "piaci", "piace", "piacciamo", "piacete", "piacciono"], sedere: ["siedo", "siedi", "siede", "sediamo", "sedete", "siedono"],
    rimanere: ["rimango", "rimani", "rimane", "rimaniamo", "rimanete", "rimangono"], tenere: ["tengo", "tieni", "tiene", "teniamo", "tenete", "tengono"],
    tradurre: ["traduco", "traduci", "traduce", "traduciamo", "traducete", "traducono"], morire: ["muoio", "muori", "muore", "moriamo", "morite", "muoiono"],
    togliere: ["tolgo", "togli", "toglie", "togliamo", "togliete", "tolgono"], spegnere: ["spengo", "spegni", "spegne", "spegniamo", "spegnete", "spengono"],
    porre: ["pongo", "poni", "pone", "poniamo", "ponete", "pongono"], cuocere: ["cuocio", "cuoci", "cuoce", "cuociamo", "cuocete", "cuociono"]
  };
  var PP = {   /* participi passati irregolari */
    essere: "stato", stare: "stato", fare: "fatto", dire: "detto", bere: "bevuto", leggere: "letto", scrivere: "scritto", prendere: "preso",
    mettere: "messo", vedere: "visto", aprire: "aperto", chiudere: "chiuso", rispondere: "risposto", perdere: "perso", scegliere: "scelto",
    spendere: "speso", venire: "venuto", chiedere: "chiesto", correre: "corso", ridere: "riso", piangere: "pianto", rimanere: "rimasto",
    scendere: "sceso", decidere: "deciso", conoscere: "conosciuto", nascere: "nato", vendere: "venduto", piacere: "piaciuto", sedere: "seduto",
    tenere: "tenuto", vivere: "vissuto", morire: "morto", rompere: "rotto", succedere: "successo", offrire: "offerto", scoprire: "scoperto",
    accendere: "acceso", spegnere: "spento", vincere: "vinto", dipingere: "dipinto", tradurre: "tradotto", crescere: "cresciuto",
    muovere: "mosso", discutere: "discusso", permettere: "permesso", promettere: "promesso", smettere: "smesso", togliere: "tolto",
    porre: "posto", aggiungere: "aggiunto", raggiungere: "raggiunto", dividere: "diviso", sorridere: "sorriso", cuocere: "cotto",
    friggere: "fritto", assumere: "assunto", ricevere: "ricevuto", credere: "creduto", ripetere: "ripetuto", sapere: "saputo",
    dovere: "dovuto", potere: "potuto", volere: "voluto", avere: "avuto", tagliare: "tagliato", appendere: "appeso", spingere: "spinto",
    raccogliere: "raccolto", restituire: "restituito", difendere: "difeso", proteggere: "protetto", esprimere: "espresso", uccidere: "ucciso"
  };
  var FUT = {   /* radici irregolari di futuro e condizionale */
    essere: "sar", avere: "avr", andare: "andr", venire: "verr", fare: "far", bere: "berr", potere: "potr", volere: "vorr", dovere: "dovr",
    sapere: "sapr", vedere: "vedr", vivere: "vivr", stare: "star", dare: "dar", tenere: "terr", rimanere: "rimarr", dire: "dir",
    tradurre: "tradurr", morire: "morr", porre: "porr", cadere: "cadr"
  };
  var IMPF = { essere: ["ero", "eri", "era", "eravamo", "eravate", "erano"], fare: "fac", dire: "dic", bere: "bev", tradurre: "traduc", porre: "pon" };
  var GER = { fare: "facendo", dire: "dicendo", bere: "bevendo", tradurre: "traducendo", porre: "ponendo" };
  /* verbi in -ire senza «-isc-» (dormo, apro, parto…): tutti gli altri prendono -isc- (capisco, finisco) */
  var NOISC = { dormire: 1, aprire: 1, partire: 1, sentire: 1, offrire: 1, servire: 1, seguire: 1, coprire: 1, scoprire: 1, soffrire: 1, vestire: 1, fuggire: 1, bollire: 1, divertire: 1, avvertire: 1, cucire: 1, riaprire: 1, ripartire: 1 };
  var CLITIC = ["mi", "ti", "si", "ci", "vi", "si"];

  /* "fare la doccia" -> verbo "fare" + resto " la doccia"; "alzarsi" -> base "alzare", riflessivo */
  function parts(inf) {
    var i = inf.indexOf(" "), v = i < 0 ? inf : inf.slice(0, i), rest = i < 0 ? "" : inf.slice(i);
    var refl = /rsi$/.test(v), base = refl ? v.replace(/si$/, "e") : v;
    return { v: v, base: base, rest: rest, refl: refl };
  }
  function stem(base) { return base.slice(0, -3); }
  function presentRegular(base, pi) {
    var st = stem(base), t = base.slice(-3);
    if (t === "are") {
      var e = ["o", "i", "a", "iamo", "ate", "ano"][pi];
      if (/[cg]$/.test(st) && /^i/.test(e)) st += "h";
      else if (/i$/.test(st) && /^i/.test(e)) e = e.slice(1);   /* mangi, mangiamo, studi */
      return st + e;
    }
    if (t === "ere") return st + ["o", "i", "e", "iamo", "ete", "ono"][pi];
    if (t === "ire") return NOISC[base] ? st + ["o", "i", "e", "iamo", "ite", "ono"][pi] : st + ["isco", "isci", "isce", "iamo", "ite", "iscono"][pi];
    return null;
  }
  function present(inf, pi) {
    var p = parts(inf), f = IRR[p.base] ? IRR[p.base][pi] : presentRegular(p.base, pi);
    if (f == null) return null;
    return (p.refl ? CLITIC[pi] + " " : "") + f + p.rest;
  }
  function pp(inf) {
    var b = parts(inf).base; if (PP[b]) return PP[b];
    var t = b.slice(-3), st = stem(b);
    return t === "are" ? st + "ato" : t === "ere" ? st + "uto" : t === "ire" ? st + "ito" : null;
  }
  /* accordo del participio (con essere) o di un aggettivo in -o: g "x" al singolare = «o/a» */
  function agreeO(w, g, num) {
    if (!/o$/.test(w)) return w;
    var r = w.slice(0, -1);
    if (num === "p") return r + (g === "f" ? "e" : "i");
    return g === "f" ? r + "a" : g === "x" ? w + "/a" : w;
  }
  function passato(inf, aux, pi, g, num) {
    var p = parts(inf), part = pp(inf); if (!part) return null;
    if (aux === "e" || p.refl) return (p.refl ? CLITIC[pi] + " " : "") + IRR.essere[pi] + " " + agreeO(part, g, num) + p.rest;
    return IRR.avere[pi] + " " + part + p.rest;
  }
  function futStem(base) {
    if (FUT[base]) return FUT[base];
    var st = stem(base), t = base.slice(-3);
    if (t === "are") { if (/[cg]$/.test(st)) return st + "her"; if (/[cg]i$/.test(st)) return st.slice(0, -1) + "er"; return st + "er"; }
    return st + (t === "ere" ? "er" : "ir");
  }
  function future(inf, pi) { var p = parts(inf); return (p.refl ? CLITIC[pi] + " " : "") + futStem(p.base) + ["ò", "ai", "à", "emo", "ete", "anno"][pi] + p.rest; }
  function conditional(inf, pi) { var p = parts(inf); return (p.refl ? CLITIC[pi] + " " : "") + futStem(p.base) + ["ei", "esti", "ebbe", "emmo", "este", "ebbero"][pi] + p.rest; }
  function imperfect(inf, pi) {
    var p = parts(inf), b = p.base, x = IMPF[b], f;
    if (Array.isArray(x)) f = x[pi];
    else {
      var st = x || stem(b), v = x ? "e" : b.slice(-3, -2);
      f = st + v + ["vo", "vi", "va", "vamo", "vate", "vano"][pi];
    }
    return (p.refl ? CLITIC[pi] + " " : "") + f + p.rest;
  }
  function gerund(inf) { var p = parts(inf), b = p.base; return GER[b] || (b.slice(-3) === "are" ? stem(b) + "ando" : stem(b) + "endo"); }

  /* ---- nomi e articoli ---- */
  function vowel(w) { return /^[aeiouàèéìòùh]/i.test(w) && !/^h[^aeiou]/i.test(w); }
  function sImpure(w) { return /^(s[bcdfghlmnpqrtvwz]|z|gn|ps|pn|x|y|i[aeiou])/i.test(w); }
  function first(s) { return String(s).split(" ")[0]; }
  /* articolo determinativo per la parola «w» (la prima parola del sintagma) */
  function def(w, g, num) {
    var f = first(w);
    if (num === "p") return g === "f" ? "le" : (vowel(f) || sImpure(f) ? "gli" : "i");
    if (g === "f") return vowel(f) ? "l'" : "la";
    return vowel(f) ? "l'" : sImpure(f) ? "lo" : "il";
  }
  function indef(w, g) {
    var f = first(w);
    if (g === "f") return vowel(f) ? "un'" : "una";
    return sImpure(f) ? "uno" : "un";
  }
  function partitive(w, g, num) { return prep("di", def(w, g, num)); }
  function join(art, w) { return /'$/.test(art) ? art + w : art + " " + w; }
  /* preposizione + articolo: di + il = del, a + l' = all', in + gli = negli… */
  var PA = { di: "de", a: "a", da: "da", "in": "ne", su: "su" };
  function prep(p, art) {
    if (!PA[p]) return p + " " + art;
    var b = PA[p];
    if (art === "il") return b + "l"; if (art === "lo") return b + "llo"; if (art === "la") return b + "lla"; if (art === "l'") return b + "ll'";
    if (art === "i") return b + "i"; if (art === "gli") return b + "gli"; if (art === "le") return b + "lle";
    return p + " " + art;
  }
  /* applica una preposizione a un sintagma che comincia (forse) con un articolo: "di" + "il pane" = "del pane" */
  function withPrep(p, np) {
    var m = /^(il|lo|la|i|gli|le) (.*)$/.exec(np) || /^(l')(.*)$/.exec(np);
    if (m) { var a = prep(p, m[1]); return /'$/.test(a) ? a + m[2] : a + " " + m[2]; }
    if (p === "di" && vowel(np)) return "d'" + np;
    return p + " " + np;
  }
  /* aggettivo con 4 forme [m s, f s, m p, f p] */
  function adj(forms, g, num) {
    if (num === "p") return g === "f" ? forms[3] : forms[2];
    if (g === "x") return forms[0] === forms[1] ? forms[0] : (/o$/.test(forms[0]) && forms[1] === forms[0].slice(0, -1) + "a" ? forms[0] + "/a" : forms[0] + "/" + forms[1]);
    return g === "f" ? forms[1] : forms[0];
  }
  /* possessivo: base "mio", "tuo", "suo", "nostro", "vostro", "loro", "Suo" */
  var POSSF = { mio: ["mio", "mia", "miei", "mie"], tuo: ["tuo", "tua", "tuoi", "tue"], suo: ["suo", "sua", "suoi", "sue"], Suo: ["Suo", "Sua", "Suoi", "Sue"], nostro: ["nostro", "nostra", "nostri", "nostre"], vostro: ["vostro", "vostra", "vostri", "vostre"], loro: ["loro", "loro", "loro", "loro"] };
  function poss(base, g, num) { return adj(POSSF[base], g === "x" ? "m" : g, num); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  var NUMW = ["zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci"];
  function num(n, g) { if (n === 1) return g === "f" ? "una" : "un"; return n >= 0 && n <= 10 ? NUMW[n] : String(n); }

  CP.ita = {
    present: present, pp: pp, passato: passato, future: future, conditional: conditional, imperfect: imperfect, gerund: gerund,
    agreeO: agreeO, def: def, indef: indef, partitive: partitive, join: join, prep: prep, withPrep: withPrep, adj: adj, poss: poss,
    cap: cap, num: num, vowel: vowel, CLITIC: CLITIC, IRR: IRR
  };
})();
