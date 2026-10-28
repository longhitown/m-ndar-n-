#!/usr/bin/env node
/* màndarínō · controllo dei file linguistici (src/i18n/): stesse chiavi in italiano e cinese, segnaposto {x} e tag HTML uguali, testi
   vuoti, punteggiatura a mezza larghezza nel cinese, errori tipici dell'italiano (perchè, qual'è, spazi doppi, virgolette «» non
   chiuse) e chiavi usate nel codice ma non definite. È un rapporto per chi legge, non una prova che fallisce: i frammenti di frase
   (itc.*) e le chiavi composte a runtime (onb.d + i) danno falsi allarmi noti. Uso:  node tools/lang-audit.mjs */
import fs from "fs"; import vm from "vm"; import path from "path";
const SRC = "src/i18n";
const files = ["i18n.js", "it.js", "zh.js", "titles.js", "exercises.js", "voice.js", "credits-t12.js", "it-course.js", "together.js", "worksheet.js"];
const ctx = { console, window: {}, localStorage: { getItem: () => null }, document: { documentElement: { setAttribute() {} }, querySelectorAll: () => [] }, navigator: {} };
vm.createContext(ctx);
for (const f of files) { try { vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), ctx, { filename: f }); } catch (e) { console.log("ERRORE di caricamento", f, e.message); } }
const I = vm.runInContext("I18N", ctx);
const it = I.it, zh = I.zh;
const out = { grave: [], medio: [], lieve: [] };
const P = (lv, m) => out[lv].push(m);

const ik = Object.keys(it), zk = Object.keys(zh);
console.log("chiavi it:", ik.length, "· zh:", zk.length);
for (const k of ik) if (!(k in zh)) P("medio", "manca in zh: " + k);
for (const k of zk) if (!(k in it)) P("lieve", "solo in zh (senza italiano): " + k);

const ph = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(",");
const tags = (s) => (String(s).match(/<\/?[a-z][^>]*>/gi) || []).map((x) => x.replace(/\s.*?>/, ">").toLowerCase()).sort().join(",");
const CJK = /[㐀-鿿]/, LAT = /[A-Za-zÀ-ÿ]{3,}/;
for (const k of ik) {
  if (!(k in zh)) continue;
  const a = String(it[k]), b = String(zh[k]);
  if (ph(a) !== ph(b)) P("grave", `segnaposto diversi in ${k}: it ${ph(a)} · zh ${ph(b)}`);
  if (tags(a) !== tags(b)) P("medio", `tag HTML diversi in ${k}: it ${tags(a)} · zh ${tags(b)}`);
  if (!b.trim()) P("grave", "zh vuoto: " + k);
  if (!a.trim()) P("grave", "it vuoto: " + k);
  if (a === b && LAT.test(a) && !/^[\w .·:,\-+/%{}→←↑↓…°✓✗0-9]*$/.test("")) { if (!CJK.test(a) && a.length > 12) P("lieve", "zh uguale all'italiano: " + k + " «" + a.slice(0, 50) + "»"); }
  if (!CJK.test(b) && LAT.test(b) && b.length > 20 && a !== b) P("medio", "zh senza caratteri cinesi: " + k + " «" + b.slice(0, 60) + "»");
}
// zh: punteggiatura ASCII fra caratteri cinesi, spazi tra caratteri cinesi
for (const k of zk) {
  const b = String(zh[k]).replace(/<[^>]+>/g, "");
  if (/[㐀-鿿][,;:!?]\s?[㐀-鿿]/.test(b)) P("lieve", "zh: punteggiatura a mezza larghezza tra caratteri cinesi in " + k + " «" + b.slice(0, 50) + "»");
  if (/[㐀-鿿]\.(\s|$)/.test(b)) P("lieve", "zh: punto ASCII dopo un carattere cinese in " + k + " «" + b.slice(0, 50) + "»");
  if (/[㐀-鿿] {1,2}[㐀-鿿]/.test(b)) P("lieve", "zh: spazio tra caratteri cinesi in " + k + " «" + b.slice(0, 50) + "»");
  if (/\(.*[㐀-鿿].*\)/.test(b) && /[㐀-鿿]\(/.test(b)) P("lieve", "zh: parentesi ASCII dopo un carattere cinese in " + k + " «" + b.slice(0, 50) + "»");
}
// it: errori tipici
const BAD = [
  [/\bperchè\b|\bpoichè\b|\bné che\b|\bcioè\b(?!)/i, "accento errato (perchè/poichè)"], [/\bqual'è\b|\bQual'è\b/, "qual'è (si scrive qual è)"], [/\bun pò\b|\bpò\b/, "pò (si scrive po')"],
  [/\bE'\s|\be' /, "e' al posto di è"], [/\bsé stesso\b/, "sé stesso (accettato, ma di solito se stesso)"], [/\bpiù\s+piu\b/i, "ripetizione"],
  [/ {2,}/, "spazi doppi"], [/\s[,.;:!?](?!\.)/, "spazio prima della punteggiatura"], [/«\s|\s»/, "spazi dentro le virgolette caporali"], [/[a-zà-ù]\.[A-ZÀ-Ù]/, "manca lo spazio dopo il punto"],
  [/\bdel[l]?'/, ""], [/\bun' (?=[aeiou]\w+ [a-z]+o\b)/, ""], [/\bcomunque\b.*\bpertanto\b/, ""],
];
for (const k of ik) {
  const a = String(it[k]).replace(/<[^>]+>/g, "");
  for (const [re, msg] of BAD) { if (msg && re.test(a)) P("lieve", `it: ${msg} in ${k} «${a.slice(0, 70)}»`); }
  const open = (a.match(/«/g) || []).length, close = (a.match(/»/g) || []).length; if (open !== close) P("medio", `it: virgolette «» non chiuse in ${k}`);
  if (/[“”]/.test(a) && !/lang=|^[\W]*$/.test(a)) P("lieve", "it: virgolette inglesi in " + k);
  if (/\.\.(?!\.)/.test(a)) P("lieve", "it: due punti consecutivi in " + k);
  if (/[a-z]'(?= )/.test(a) && !/l'|un'|dell'|all'|nell'|sull'|dall'|quest'|quell'|c'|d'|po'|sant'|m'|t'|s'|v'|n'|gl'|anch'|nient'|tutt'|mezz'|cos'|com'|dov'|buon'|grand'|bell'|nessun'|ciascun'/i.test(a)) P("lieve", "it: apostrofo finale sospetto in " + k + " «" + a.slice(0, 60) + "»");
}
// chiavi usate nel codice ma assenti
const used = new Set();
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (!/data|vendor|audio$/.test(p.replace(/\\/g, "/").replace(/^src\//, ""))) walk(p); } else if (/\.(js|html)$/.test(f.name)) { const s = fs.readFileSync(p, "utf8"); for (const m of s.matchAll(/\b(?:t|T|CP\.t)\(\s*"([a-zA-Z0-9_.\-]+)"/g)) used.add(m[1]); for (const m of s.matchAll(/data-i18n(?:-ph|-aria)?="([a-zA-Z0-9_.\-]+)"/g)) used.add(m[1]); } } };
walk("src");
let miss = 0; for (const k of used) if (!(k in it) && !/\.$/.test(k)) { miss++; if (miss <= 40) P("grave", "chiave usata e non definita in it: " + k); }
console.log("chiavi usate nel codice:", used.size, "· non definite:", miss);
for (const lv of ["grave", "medio", "lieve"]) { console.log("\n== " + lv.toUpperCase() + " (" + out[lv].length + ")"); out[lv].slice(0, 40).forEach((m) => console.log(" -", m)); if (out[lv].length > 40) console.log("  … altri", out[lv].length - 40); }
