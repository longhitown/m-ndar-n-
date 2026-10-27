/* ===== màndarínō · confronto delle risposte digitate (Task 12): pinyin (numeri, accenti o senza toni) e italiano (accenti,
   apostrofi, refusi). Adattato da materiali/riferimenti/digitazione.mjs (le sue prove sono in tools/unit.mjs). Funzioni pure.
   CP.typing.comparePinyin(digitato, atteso) → "esatto" | "senza-toni" | "toni-sbagliati" | "sbagliato"
   CP.typing.compareIt(digitato, accettate) → "esatto" | "accento" | "quasi" | "sbagliato"
   Nel file unico fa parte del gruppo ESERCIZI (tools/build.mjs, GROUPS): si esegue al primo uso. ===== */
(function (root) {
  var MARKS = { a: ["a", "ā", "á", "ǎ", "à"], e: ["e", "ē", "é", "ě", "è"], i: ["i", "ī", "í", "ǐ", "ì"], o: ["o", "ō", "ó", "ǒ", "ò"], u: ["u", "ū", "ú", "ǔ", "ù"], "ü": ["ü", "ǖ", "ǘ", "ǚ", "ǜ"] };
  var BASE = {}, VOW = /[aeiouü]/;
  Object.keys(MARKS).forEach(function (k) { MARKS[k].forEach(function (c, t) { BASE[c] = [k, t]; }); });

  /* una sillaba con numero di tono (ni3, lv4, nu:3, ma5) → con accento (nǐ, lǜ, nǚ, ma) */
  function syllableNumToMark(s) {
    var m = /^([a-züv:]+?)([0-5])?$/i.exec(String(s).trim().toLowerCase().replace(/u:/g, "ü").replace(/v/g, "ü"));
    if (!m) return s;
    var letters = m[1], tone = m[2] ? +m[2] : 0; if (tone === 5) tone = 0;
    if (!tone) return letters;
    /* a ed e portano il segno; in «ou» lo porta la o; altrimenti l'ultima vocale */
    var idx = letters.search(/[ae]/);
    if (idx < 0) { if (letters.indexOf("ou") >= 0) idx = letters.indexOf("ou"); else for (var i = 0; i < letters.length; i++) if (VOW.test(letters[i])) idx = i; }
    if (idx < 0) return letters;
    return letters.slice(0, idx) + MARKS[letters[idx]][tone] + letters.slice(idx + 1);
  }
  /* tono di una sillaba con accento (0 = neutro) e la stessa senza accento */
  function syllableInfo(s) {
    var tone = 0, plain = "";
    Array.from(String(s).toLowerCase()).forEach(function (c) { if (BASE[c]) { plain += BASE[c][0]; if (BASE[c][1]) tone = BASE[c][1]; } else plain += c; });
    return { tone: tone, plain: plain };
  }
  /* sillabe digitate: separatori = spazio, punto, apostrofo, trattino; i numeri di tono chiudono la sillaba */
  function typedSyllables(text) {
    var t = String(text).trim().toLowerCase().replace(/[’']/g, " ").replace(/[.\-·]/g, " "), out = [];
    t.split(/\s+/).filter(Boolean).forEach(function (chunk) {
      if (/[0-5]/.test(chunk)) (chunk.match(/[a-züv:]+[0-5]?/g) || []).forEach(function (p) { out.push(syllableNumToMark(p)); });
      else out.push(chunk.replace(/v/g, "ü"));
    });
    return out;
  }
  /* confronto con la forma dell'app («péng.you», «nǐ.men», «xī'ān») */
  function comparePinyin(typed, expected) {
    var exp = String(expected).toLowerCase().split(/[.\s']+/).filter(Boolean), got = typedSyllables(typed), i;
    /* tutto attaccato («nihao», «nǐhǎo»): si ritaglia sulle sillabe attese */
    if (got.length === 1 && exp.length > 1) {
      var rest = got[0], cut = [];
      exp.forEach(function (e) {
        var plain = syllableInfo(e).plain;
        if (rest.indexOf(e) === 0) { cut.push(e); rest = rest.slice(e.length); }
        else if (rest.indexOf(plain) === 0) { cut.push(plain); rest = rest.slice(plain.length); }
        else { var m = /^([a-zü]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][a-zü]*?)(?=$)/.exec(rest); cut.push(m ? m[1] : rest); rest = ""; }
      });
      if (!rest) got = cut;
    }
    if (got.length !== exp.length) return "sbagliato";
    var allExact = true, allPlain = true, toneless = true;
    for (i = 0; i < exp.length; i++) {
      var e = syllableInfo(exp[i]), g = syllableInfo(got[i]);
      if (e.plain !== g.plain) allPlain = false;
      if (got[i] !== exp[i] && !(e.tone === 0 && g.tone === 0 && e.plain === g.plain)) allExact = false;
      if (g.tone !== 0) toneless = false;
    }
    if (!allPlain) return "sbagliato";
    if (allExact) return "esatto";
    return toneless ? "senza-toni" : "toni-sbagliati";
  }

  /* ---- italiano ---- */
  function stripAccents(s) { return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function normalizeIt(s) { return String(s).normalize("NFC").toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,;:!?¿¡"«»“”()…]/g, " ").replace(/\s+/g, " ").trim(); }
  function lev(a, b) {
    var m = a.length, n = b.length, i, j; if (!m) return n; if (!n) return m;
    var prev = []; for (j = 0; j <= n; j++) prev.push(j);
    for (i = 1; i <= m; i++) { var cur = [i]; for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[n];
  }
  /* risposta digitata contro una o più risposte accettate (le alternative di una glossa: «io, me», «buongiorno / salve») */
  function compareIt(typed, accepted) {
    var alts = (Array.isArray(accepted) ? accepted : String(accepted).split(/\s*[,;/]\s*/)).map(normalizeIt).filter(Boolean);
    var t = normalizeIt(typed); if (!t) return "sbagliato";
    if (alts.indexOf(t) >= 0) return "esatto";
    var ts = stripAccents(t);
    if (alts.some(function (a) { return stripAccents(a) === ts; })) return "accento";
    if (ts.length >= 5 && alts.some(function (a) { var s = stripAccents(a); return s.length >= 5 && lev(s, ts) <= 1; })) return "quasi";
    return "sbagliato";
  }
  var API = { syllableNumToMark: syllableNumToMark, syllableInfo: syllableInfo, typedSyllables: typedSyllables, comparePinyin: comparePinyin, stripAccents: stripAccents, normalizeIt: normalizeIt, compareIt: compareIt };
  if (root.CP) root.CP.typing = API; else root.MDTyping = API;
})(typeof window !== "undefined" ? window : this);
