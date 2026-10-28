#!/usr/bin/env node
/* màndarínō · estrae da Make Me a Hanzi (graphics.txt) l'ordine e la direzione dei tratti dei caratteri del vocabolario
   e scrive src/data/strokes.js. Si rilancia quando si aggiungono parole con caratteri nuovi.
   graphics.txt: https://github.com/skishore/makemeahanzi (licenza Arphic Public License, derivata dai font Arphic):
   il file generato è un'opera derivata e resta sotto la stessa licenza, con il suo testo nei crediti dell'app.
   Uso: node tools/strokes.mjs percorso/graphics.txt

   Di ogni tratto si tiene solo la «mediana» (la linea centrale, dall'inizio alla fine del tratto, nell'ordine giusto),
   non il contorno: basta per controllare ordine e direzione e per l'animazione, e pesa un decimo.
   Codifica: per ogni carattere, i tratti separati da uno spazio; ogni punto sono due simboli dell'alfabeto A (91
   simboli stampabili, senza virgolette e barra rovesciata), coordinate da 0 a 90 su una griglia 1024×1024 (y verso
   il basso, già raddrizzata). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load } from "./lib/data.mjs";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const file = process.argv[2];
if (!file) { console.error("Uso: node tools/strokes.mjs graphics.txt"); process.exit(2); }
export const A = [...Array(94)].map((_, i) => String.fromCharCode(33 + i)).filter((c) => c !== '"' && c !== "\\" && c !== "'").join("");
const Q = A.length - 1;   /* 90 */
const D = load(SRC), need = new Set();
D.SECTIONS.forEach((s) => s.words.forEach((w) => [...w[1]].forEach((c) => { if (/[㐀-鿿]/.test(c)) need.add(c); })));
const out = {}, miss = [];
for (const line of fs.readFileSync(file, "utf8").split("\n")) {
  if (!line) continue;
  const g = JSON.parse(line); if (!need.has(g.character)) continue;
  /* in graphics.txt la y va verso l'alto con origine 900 sotto il bordo superiore: y_schermo = 900 - y */
  out[g.character] = g.medians.map((m) => m.map(([x, y]) => {
    const qx = Math.max(0, Math.min(Q, Math.round(x / 1024 * Q))), qy = Math.max(0, Math.min(Q, Math.round((900 - y) / 1024 * Q)));
    return A[qx] + A[qy];
  }).join("")).join(" ");
}
for (const c of need) if (!out[c]) miss.push(c);
const keys = Object.keys(out).sort();
const js = "/* Ordine e direzione dei tratti di " + keys.length + " caratteri, da Make Me a Hanzi (github.com/skishore/makemeahanzi),\n" +
  "   ricavati dai font Arphic PL KaitiM GB e UKai. Questo file è sotto la Arphic Public License: il testo completo è nei\n" +
  "   crediti dell'app (⚙️ → Informazioni → Come funziona → Crediti e licenze) e in LICENZE/ARPHIC-PUBLIC-LICENSE.txt.\n" +
  "   Modifiche rispetto a graphics.txt (fatte il " + new Date().toISOString().slice(0, 10) + " da tools/strokes.mjs): tenuti solo i caratteri del vocabolario e solo\n" +
  "   le mediane dei tratti (non i contorni), coordinate raddrizzate (y verso il basso) e arrotondate a 91 livelli. Non modificarlo a mano. */\n" +
  "var STROKES_A = " + JSON.stringify(A) + ";\nvar STROKES = {\n" + keys.map((k) => JSON.stringify(k) + ":" + JSON.stringify(out[k])).join(",\n") + "\n};\n";
fs.writeFileSync(path.join(SRC, "data/strokes.js"), js);
console.log(keys.length + " caratteri, " + (js.length / 1024).toFixed(0) + " KB" + (miss.length ? "; senza dati: " + miss.join("") : ""));
