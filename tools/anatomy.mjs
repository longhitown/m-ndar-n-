#!/usr/bin/env node
/* màndarínō · estrae da Make Me a Hanzi (dictionary.txt) la struttura dei caratteri del vocabolario e scrive
   src/data/anatomy.js (Task 5, «anatomia del carattere»). Si rilancia quando si aggiungono parole con caratteri nuovi.
   dictionary.txt: https://github.com/skishore/makemeahanzi, derivato da Unihan e CJKlib, licenza GNU LGPL 3.0 o successiva
   (vedi COPYING del progetto). Il file generato resta sotto la LGPL.
   Si tengono SOLO i campi strutturali:
     - decomposizione (IDS): i componenti del primo livello;
     - radicale;
     - tipo di etimologia (pittogramma, ideogramma composto, fonetico-semantico) con la parte che dà il suono e quella che
       dà il significato;
     - matches: per ogni tratto, il componente a cui appartiene (per evidenziarlo nella lavagna).
   NON si tengono definizioni, pinyin e «hint» (spiegazioni in inglese, spesso etimologie popolari senza fonte).
   Uso: node tools/anatomy.mjs percorso/dictionary.txt */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load } from "./lib/data.mjs";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const file = process.argv[2];
if (!file) { console.error("Uso: node tools/anatomy.mjs dictionary.txt"); process.exit(2); }
const DICT = {};
for (const line of fs.readFileSync(file, "utf8").split("\n")) { if (!line.trim()) continue; const o = JSON.parse(line); DICT[o.character] = o; }

/* IDS: operatori con due o tre argomenti */
const OP3 = new Set(["⿲", "⿳"]), OPS = new Set(["⿰", "⿱", "⿲", "⿳", "⿴", "⿵", "⿶", "⿷", "⿸", "⿹", "⿺", "⿻"]);
function parse(s) {
  const t = Array.from(s); let i = 0;
  function node() { const c = t[i++]; if (OPS.has(c)) { const n = OP3.has(c) ? 3 : 2, kids = []; for (let k = 0; k < n; k++) kids.push(node()); return { op: c, kids }; } return c; }
  try { const r = node(); return i === t.length ? r : null; } catch (e) { return null; }
}
const leaves = (n) => typeof n === "string" ? [n] : n.kids.flatMap(leaves);
/* i componenti del primo livello: un carattere, oppure i caratteri di un sotto-albero (senza i «？») */
function top(ids) {
  if (!ids || ids[0] === "？") return null;
  const tr = parse(ids); if (!tr || typeof tr === "string") return null;
  return { op: tr.op, parts: tr.kids.map((k) => leaves(k).filter((c) => c !== "？").join("")) };
}
const TYPE = { pictographic: "p", ideographic: "i", pictophonetic: "s" };
const D = load(SRC), need = new Set();
D.SECTIONS.forEach((s) => s.words.forEach((w) => [...w[1]].forEach((c) => { if (/[㐀-鿿]/.test(c)) need.add(c); })));
const out = {}, queue = [...need], vocab = new Set(need);
while (queue.length) {
  const c = queue.shift(); if (out[c]) continue;
  const o = DICT[c]; if (!o) { if (vocab.has(c)) out[c] = ["", "", "", "", "", ""]; continue; }
  const tp = top(o.decomposition), e = o.etymology || {};
  /* matches: per ogni tratto il componente del primo livello (cifra), «-» se non si sa */
  const m = (o.matches || []).map((x) => Array.isArray(x) && x.length && x[0] < 10 ? String(x[0]) : "-").join("");
  out[c] = [tp ? tp.op + tp.parts.join("|") : "", o.radical && o.radical !== c ? o.radical : "", TYPE[e.type] || "", e.phonetic || "", e.semantic || "", tp ? m : ""];
  if (tp) tp.parts.forEach((p) => { if (Array.from(p).length === 1 && !out[p]) queue.push(p); });
}
const keys = Object.keys(out), atomic = [...vocab].filter((c) => !out[c][0]).length;
const head = `/* Struttura dei caratteri (Task 5): ${keys.length} caratteri (${vocab.size} del vocabolario, ${atomic} senza scomposizione: semplici o
   non scomponibili), da Make Me a Hanzi (github.com/skishore/makemeahanzi, file dictionary.txt), derivato da Unihan e
   CJKlib. Questo file è sotto la licenza GNU LGPL 3.0 o successiva: il testo è in LICENZE/LGPL-3.0.txt e nei crediti
   dell'app. Modifiche rispetto a dictionary.txt (tools/anatomy.mjs, ${new Date().toISOString().slice(0, 10)}): tenuti solo i caratteri del vocabolario e
   i loro componenti; solo decomposizione del primo livello, radicale, tipo di etimologia, componente fonetico e semantico,
   e il componente di ogni tratto. Tolti definizioni, pinyin e spiegazioni. Non modificarlo a mano: rilancia lo strumento.
   Formato: carattere → [operatore IDS + componenti separati da «|», radicale, tipo (p pittogramma, i ideogramma composto,
   s fonetico-semantico), componente fonetico, componente semantico, componente di ogni tratto (cifre, «-» = sconosciuto)] */
`;
fs.writeFileSync(path.join(SRC, "data/anatomy.js"), head + "var ANATOMY = " + JSON.stringify(out).replace(/\],"/g, '],\n"') + ";\n");
console.log(`✓ src/data/anatomy.js · ${keys.length} caratteri · ${Math.round(fs.statSync(path.join(SRC, "data/anatomy.js")).size / 1024)} KB · ${atomic} del vocabolario senza scomposizione`);
