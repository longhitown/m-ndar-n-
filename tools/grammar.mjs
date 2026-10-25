#!/usr/bin/env node
/* màndarínō · banco di prova della grammatica del laboratorio (Node puro, nessuna dipendenza).

   node tools/grammar.mjs                    prova tutte le frasi verificate (src/data/verified.js): le regole devono
                                             arrivare da sole alla stessa traduzione (tranne le frasi segnate "memoria")
   node tools/grammar.mjs 我是意大利人 …       traduce le frasi date e dice perché, quando non sa tradurle
   node tools/grammar.mjs --copertura        quante frasi dell'app (esercizi, modelli, frasi, dialoghi, lezioni) le regole
                                             sanno tradurre, e quali parole mancano più spesso nelle schede di src/data/grammar.js
   node tools/grammar.mjs --nuove file.txt   traduce una frase per riga e stampa le righe pronte da incollare in verified.js
                                             (da rileggere una per una prima di incollarle: è così che si insegna una frase nuova)

   Come si migliora la grammatica, un passo alla volta:
   1. scrivi la frase cinese e la traduzione giusta in src/data/verified.js;
   2. lancia questo strumento: se le regole non ci arrivano, dice dove si fermano;
   3. aggiungi la scheda che manca in src/data/grammar.js (un nome, un verbo, un aggettivo…) o migliora la regola
      in src/phrases/translate.js, finché la prova passa. Se non ci arrivano ancora, segna la frase "memoria":
      il laboratorio userà la traduzione scritta a mano. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { lab, verify } from "./lib/lab.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const L = lab(path.join(ROOT, "src"));
const args = process.argv.slice(2);

if (args[0] === "--copertura") {
  const rows = [];
  L.D.EX.forEach((e) => rows.push(e[0].join("")));
  L.D.PATTERNS.forEach((p) => p.ex.forEach((e) => rows.push(typeof e[0] === "string" ? e[0] : e[0].join(""))));
  L.D.PHRASES.forEach((g) => g.items.forEach((i) => rows.push(i[1])));
  L.D.DIALOGS.forEach((d) => d.lines.forEach((l) => rows.push(l[2])));
  (L.D.LESSONS || []).forEach((l) => (l.ex || []).forEach((e) => rows.push(e[0])));
  let sure = 0; const miss = {};
  for (const z of rows) {
    const r = L.translate(z.replace(/[，。、]/g, ""), { rulesOnly: true });
    if (r.sure) sure++; else if (r.missing) miss[r.missing] = (miss[r.missing] || 0) + 1;
  }
  console.log(`Le regole traducono da sole ${sure} frasi su ${rows.length} (${Math.round(sure * 100 / rows.length)}%). Le altre usano la traduzione scritta a mano.`);
  const top = Object.entries(miss).sort((a, b) => b[1] - a[1]).slice(0, 40);
  if (top.length) console.log("Dove si fermano più spesso (aggiungere la scheda o la regola sblocca queste frasi):\n  " + top.map(([w, n]) => w + " ×" + n).join("   "));
  process.exit(0);
}
if (args[0] === "--nuove") {
  const lines = fs.readFileSync(args[1], "utf8").split("\n").map((x) => x.trim()).filter(Boolean);
  for (const z of lines) {
    const r = L.translate(z, { rulesOnly: true });
    if (r.sure) console.log("  " + JSON.stringify([z, r.it]) + ",");
    else console.log("  // " + z + " → non so ancora: " + r.reason);
  }
  process.exit(0);
}
if (args.length) {
  for (const z of args) {
    const r = L.translate(z, { rulesOnly: true });
    console.log(z + "\n  → " + r.it + (r.reason ? "\n  perché: " + r.reason : "") + (r.notes.length ? "\n  note: " + r.notes.join(" | ") : ""));
  }
  process.exit(0);
}
const v = verify(L);
for (const b of v.bad) console.log("✗ " + b.zh + "\n    attesa:  " + b.want + "\n    regole:  " + b.got + (b.why ? "  (" + b.why + ")" : ""));
for (const f of v.fixable) console.log("ℹ " + f[0] + ": ora le regole ci arrivano da sole, si può togliere \"memoria\"");
console.log((v.bad.length ? "✗ " : "✓ ") + (v.total - v.bad.length) + "/" + v.total + " frasi verificate" + (v.memo.length ? " (" + v.memo.length + " solo a memoria)" : "") + ".");
process.exit(v.bad.length ? 1 : 0);
