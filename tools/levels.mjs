#!/usr/bin/env node
/* màndarínō · livelli HSK delle parole e capitoli del Percorso, da complete-hsk-vocabulary (MIT, github.com/drkameleon/
   complete-hsk-vocabulary; il file della lista non entra nel repository). Scrive src/data/levels.js e rimette in ordine i
   file del vocabolario in src/index.html (l'ordine dei file è l'ordine del Percorso). Si rilancia quando si aggiungono parole.
   Uso: node tools/levels.mjs complete.json

   Un solo vocabolario, sei capitoli per difficoltà:
   - le liste HSK (data/vocab/hsk/hskN_*) vanno nel capitolo N;
   - una tappa tematica va nel capitolo del suo livello: il livello HSK sotto cui sta il 40% delle sue parole (le parole
     fuori dall'HSK contano 7), tra 3 e 6; i 30 temi di base restano nei capitoli 1-2 (i primi 10, saluti compresi, nel 1);
   - dentro un capitolo prima i temi, poi la lista HSK del livello (le parole d'esame non ancora incontrate). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load } from "./lib/data.mjs";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
if (!process.argv[2]) { console.error("Uso: node tools/levels.mjs complete.json"); process.exit(2); }
const H = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), LV = new Map();
const put = (w, l) => LV.set(w, Math.min(LV.get(w) || 99, l));
for (const w of H) {
  const l = Math.min(...w.level.filter((x) => /^new-/.test(x)).map((x) => +x.slice(4)), 99);
  if (l > 6) continue;
  put(w.simplified, l); if (w.simplified.endsWith("儿")) put(w.simplified.slice(0, -1), l);
}
const D = load(SRC), CH = {}, byLevel = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
const vf = D.files.filter((x) => x.startsWith("data/vocab/"));
D.SECTIONS.forEach((s, i) => { s.file = vf[i]; });
for (const s of D.SECTIONS) {
  for (const w of s.words) { const l = LV.get(w[1]); if (l && l <= 6 && !byLevel[l].includes(w[1])) byLevel[l].push(w[1]); }
  const m = /^hsk(\d)/.exec(s.id);
  if (m) { CH[s.id] = +m[1]; continue; }
  const n = +(/vocab\/(\d+)-/.exec(s.file) || [0, 999])[1];
  const ls = s.words.map((w) => LV.get(w[1]) || 7).sort((a, b) => a - b), p40 = ls[Math.floor(ls.length * 0.4)];
  CH[s.id] = n <= 10 ? 1 : n <= 30 ? Math.min(p40, 2) : Math.min(Math.max(p40, 3), 6);
}
const js = "/* Livelli e capitoli, generato da tools/levels.mjs (da complete-hsk-vocabulary, licenza MIT: vedi i crediti). Non modificarlo a mano.\n" +
  "   HSK_LEVEL: per ogni livello HSK 3.0 da 1 a 6, le parole del vocabolario di quel livello (le altre sono «oltre l'HSK»).\n" +
  "   SECTION_CHAPTER: il capitolo del Percorso di ogni tappa (1-5 = HSK 1-5, 6 = oltre l'HSK). */\n" +
  "var HSK_LEVEL = {\n" + Object.entries(byLevel).map(([l, ws]) => "  " + l + ": " + JSON.stringify(ws.join("|"))).join(",\n") + "\n};\n" +
  "var SECTION_CHAPTER = {\n" + D.SECTIONS.map((s) => "  " + JSON.stringify(s.id) + ": " + CH[s.id]).join(",\n") + "\n};\n";
fs.writeFileSync(path.join(SRC, "data/levels.js"), js);

/* l'ordine dei file del vocabolario in index.html: capitolo, poi temi prima delle liste HSK, poi l'ordine di prima */
const ip = path.join(SRC, "index.html"); let html = fs.readFileSync(ip, "utf8");
const tags = [...html.matchAll(/<script src="data\/vocab\/[^"]+"><\/script>\n/g)].map((m) => m[0]);
const idOf = (tag) => { const f = /src="([^"]+)"/.exec(tag)[1]; return D.SECTIONS[vf.indexOf(f)].id; };
const num = (tag) => +(/vocab\/(\d+)-/.exec(tag) || [0, 0])[1];   /* i temi nel loro ordine originale (il numero del file), le liste come sono */
const sorted = tags.map((t, i) => [t, i]).sort((a, b) => { const A = idOf(a[0]), B = idOf(b[0]); return CH[A] - CH[B] || (/^hsk/.test(A) - /^hsk/.test(B)) || num(a[0]) - num(b[0]) || a[1] - b[1]; }).map((x) => x[0]);
const start = html.indexOf(tags[0]), end = html.indexOf(tags[tags.length - 1]) + tags[tags.length - 1].length;
if (html.slice(start, end) !== tags.join("")) { console.error("i file del vocabolario in index.html non sono contigui"); process.exit(1); }
html = html.slice(0, start) + sorted.join("") + html.slice(end); fs.writeFileSync(ip, html);
const count = [1, 2, 3, 4, 5, 6].map((c) => "cap." + c + " " + D.SECTIONS.filter((s) => CH[s.id] === c).length);
console.log("levels.js scritto · " + count.join(", ") + " · parole HSK per livello: " + Object.values(byLevel).map((a) => a.length).join("/"));
