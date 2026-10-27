/* màndarínō · riferimento per la digitazione: pinyin (numeri, accenti o senza toni) e italiano (accenti, apostrofi, refusi).
   Codice di esempio, già provato (vedi digitazione.test.mjs): Claude Code lo adatta allo stile del repository (ES5, window.CP).
   Nessuna dipendenza. Funzioni pure. */

/* ---------- pinyin ---------- */
const MARKS = {
  a: ["a", "ā", "á", "ǎ", "à"], e: ["e", "ē", "é", "ě", "è"], i: ["i", "ī", "í", "ǐ", "ì"],
  o: ["o", "ō", "ó", "ǒ", "ò"], u: ["u", "ū", "ú", "ǔ", "ù"], "ü": ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
};
const BASE = {};
for (const k of Object.keys(MARKS)) MARKS[k].forEach((c, t) => { BASE[c] = [k, t]; });
const VOW = /[aeiouü]/;

/* una sillaba con numero di tono (ni3, lv4, nu:3, hao3, ma5/ma0) → con accento (nǐ, lǜ, nǚ, hǎo, ma) */
export function syllableNumToMark(s) {
  const m = /^([a-züv:]+?)([0-5])?$/i.exec(s.trim().toLowerCase().replace(/u:/g, "ü").replace(/v/g, "ü"));
  if (!m) return s;
  let [, letters, tone] = m; tone = tone ? +tone : 0; if (tone === 5) tone = 0;
  if (!tone) return letters;
  /* regola: a o e portano il segno; in "ou" lo porta la o; altrimenti l'ultima vocale */
  let idx = letters.search(/[ae]/);
  if (idx < 0) idx = letters.indexOf("ou") >= 0 ? letters.indexOf("ou") : (() => { let l = -1; for (let i = 0; i < letters.length; i++) if (VOW.test(letters[i])) l = i; return l; })();
  if (idx < 0) return letters;
  return letters.slice(0, idx) + MARKS[letters[idx]][tone] + letters.slice(idx + 1);
}
/* tono di una sillaba con accento (0 = neutro) e la stessa senza accento */
export function syllableInfo(s) {
  let tone = 0, plain = "";
  for (const c of s.toLowerCase()) { if (BASE[c]) { plain += BASE[c][0]; if (BASE[c][1]) tone = BASE[c][1]; } else plain += c; }
  return { tone, plain };
}
/* sillabe di un testo digitato: separatori = spazio, punto, apostrofo, trattino; i numeri di tono chiudono la sillaba (nihao3 non si divide: serve lo spazio o ni3hao3) */
export function typedSyllables(text) {
  const t = text.trim().toLowerCase().replace(/[’']/g, " ").replace(/[.\-·]/g, " ");
  const out = [];
  for (const chunk of t.split(/\s+/).filter(Boolean)) {
    if (/[0-5]/.test(chunk)) { const parts = chunk.match(/[a-züv:]+[0-5]?/g) || []; parts.forEach((p) => out.push(syllableNumToMark(p))); }
    else out.push(chunk.replace(/v/g, "ü"));
  }
  return out;
}
/* confronto con la forma dell'app ("péng.you", "nǐ.men", "xī'ān"). Esito: "esatto" | "senza-toni" (sillabe giuste, toni mancanti) | "toni-sbagliati" | "sbagliato" */
export function comparePinyin(typed, expected) {
  const exp = expected.toLowerCase().split(/[.\s']+/).filter(Boolean);
  let got = typedSyllables(typed);
  /* digitato tutto attaccato senza separatori ("nihao", "nǐhǎo"): si ritaglia sulle sillabe attese */
  if (got.length === 1 && exp.length > 1) {
    const joined = got[0], cut = []; let rest = joined;
    for (const e of exp) {
      const withTone = e, plain = syllableInfo(e).plain;
      if (rest.startsWith(withTone)) { cut.push(withTone); rest = rest.slice(withTone.length); }
      else if (rest.startsWith(plain)) { cut.push(plain); rest = rest.slice(plain.length); }
      else { const m = /^([a-zü]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][a-zü]*?)(?=$)/.exec(rest); cut.push(m ? m[1] : rest); rest = ""; }
    }
    if (!rest) got = cut;
  }
  if (got.length !== exp.length) return "sbagliato";
  let allExact = true, allPlain = true, toneless = true;
  for (let i = 0; i < exp.length; i++) {
    const e = syllableInfo(exp[i]), g = syllableInfo(got[i]);
    if (e.plain !== g.plain) allPlain = false;
    if (got[i] !== exp[i] && !(e.tone === 0 && g.tone === 0 && e.plain === g.plain)) allExact = false;
    if (g.tone !== 0) toneless = false;
  }
  if (!allPlain) return "sbagliato";
  if (allExact) return "esatto";
  return toneless ? "senza-toni" : "toni-sbagliati";
}

/* ---------- italiano ---------- */
export function stripAccents(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
export function normalizeIt(s) {
  return s.normalize("NFC").toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,;:!?¿¡"«»“”()…]/g, " ").replace(/\s+/g, " ").trim();
}
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
/* risposta digitata contro una o più risposte accettate (le alternative di una glossa: "io, me" / "buongiorno / salve").
   Esito: "esatto" | "accento" (giusta salvo accenti) | "quasi" (un refuso, solo parole da 5 lettere in su) | "sbagliato" */
export function compareIt(typed, accepted) {
  const alts = (Array.isArray(accepted) ? accepted : String(accepted).split(/\s*[,;/]\s*/)).map(normalizeIt).filter(Boolean);
  const t = normalizeIt(typed); if (!t) return "sbagliato";
  if (alts.includes(t)) return "esatto";
  const ts = stripAccents(t);
  if (alts.some((a) => stripAccents(a) === ts)) return "accento";
  if (ts.length >= 5 && alts.some((a) => { const s = stripAccents(a); return s.length >= 5 && lev(s, ts) <= 1; })) return "quasi";
  return "sbagliato";
}
