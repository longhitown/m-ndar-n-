/* màndarínō · punteggio «la frase sentita somiglia a quella attesa» (Node, nessuna dipendenza).
   È la STESSA logica di score() in src/ui/scambio.js (il filtro dentro l'app) e di CP.readings in src/voice/voice-panel.js: se cambia
   una, cambia anche l'altra; tools/unit.mjs li confronta estraendo le funzioni dai sorgenti (prova di parità).
     cinese:   LCS tra i caratteri; due caratteri sono uguali se sono lo stesso o se hanno una lettura pinyin senza toni in comune
               (他/她 sono la stessa pronuncia); diviso il massimo tra lunghezza attesa e lunghezza sentita;
     italiano: 1 − Levenshtein / lunghezza massima, sul testo senza accenti né punteggiatura.
   Le letture di un carattere si ricavano dal vocabolario (come CP.readings: 都 → dōu, dū), non da una tabella a parte. */

const CJK = /[㐀-鿿]/;                 /* come in voice-panel.js */
const CJKR = /[㐀-鿿]/;        /* come in scambio.js */

/* le sillabe di un pinyin (src/words/table.js): gli spazi separano le parole, il punto le sillabe */
function syllables(py) {
  const out = [];
  String(py).split(" ").forEach((w) => w.split(/\.(?=[^\s.])/).forEach((s) => out.push(s)));
  return out;
}

/* carattere → letture (minuscole, solo lettere e segni di tono), dalle parole del vocabolario: SECTIONS = [{ words: [[pinyin, caratteri, …]] }] */
export function readingsFrom(SECTIONS) {
  const RD = {};
  const KEEP = /[^a-zǜ-ͯāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g;
  for (const s of SECTIONS) for (const w of s.words) {
    const cs = Array.from(w[1]).filter((c) => CJK.test(c)), sy = syllables(w[0]);
    if (cs.length !== sy.length) continue;
    cs.forEach((c, i) => { const r = sy[i].toLowerCase().replace(KEEP, ""); const a = RD[c] || (RD[c] = []); if (r && a.indexOf(r) < 0) a.push(r); });
  }
  return (ch) => RD[ch] || [];
}

export const bareSyl = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ü/g, "v").toLowerCase();
export function lcs(a, b, eq) {
  const m = a.length, n = b.length, d = [];
  for (let i = 0; i <= m; i++) { d[i] = []; for (let j = 0; j <= n; j++) d[i][j] = 0; }
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = eq(a[i - 1], b[j - 1]) ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1]);
  return d[m][n];
}
export function lev(a, b) {
  const p = [];
  for (let j = 0; j <= b.length; j++) p[j] = j;
  for (let i = 1; i <= a.length; i++) { let prev = p[0]; p[0] = i; for (let j = 1; j <= b.length; j++) { const c = p[j]; p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = c; } }
  return p[b.length];
}
export const normIt = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/* 0..1. readings: la funzione di readingsFrom (serve solo per il cinese) */
export function score(expected, heard, lang, readings) {
  if (lang === "zh-CN") {
    const g = Array.from(String(expected || "")).filter((c) => CJKR.test(c)), h = Array.from(String(heard || "")).filter((c) => CJKR.test(c));
    if (!g.length || !h.length) return 0;
    const rd = readings || (() => []);
    const l = lcs(g, h, (x, y) => {
      if (x === y) return true;
      const a = rd(x).map(bareSyl), b = rd(y).map(bareSyl);
      return a.some((z) => b.indexOf(z) >= 0);
    });
    return l / Math.max(g.length, h.length);
  }
  const a2 = normIt(expected), b2 = normIt(heard);
  if (!a2 || !b2) return 0;
  return 1 - lev(a2, b2) / Math.max(a2.length, b2.length);
}
