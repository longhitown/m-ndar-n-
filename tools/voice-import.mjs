#!/usr/bin/env node
/* màndarínō · importazione delle voci di madrelingua (Scambio linguistico). Node, nessuna dipendenza, nessuna rete.

   NULLA entra nell'app senza validazione del pacchetto, trascrizione locale, elenco di parole vietate e approvazione esplicita
   di una persona, voce per voce, dopo l'ascolto (docs/scambio-linguistico.md, «Come si importa»). L'automazione fa il lavoro
   pesante e rende l'ascolto veloce; non approva mai da sola (non esiste un flag per farlo).

   Fase 1 · prepara (non scrive nulla in src/; scrive solo in --review-dir):
     node tools/voice-import.mjs pacchetto1.zip [pacchetto2.zip …] --review-dir revisione/ [--stt "<comando>"] [--blocklist elenco.txt] [--min 0.6] [--out riepilogo.md]
       --stt        comando del riconoscitore locale; {file} è l'audio, {lang} è zh o it, {locale} è zh-CN o it-IT; stampa il testo su stdout
       --blocklist  una parola o frase per riga, «#» commenti; il file sta FUORI dal repository
       --min        punteggio minimo (0-1) tra trascrizione e testo atteso, default 0.6
       --out        riepilogo Markdown, dentro --review-dir (default riepilogo.md)
   Fase 2 · applica (scrive in src/ SOLO le voci con "approved": true messo a mano in review.json):
     node tools/voice-import.mjs --apply revisione/review.json [--src src] [--pack-out cartella/]
   Codice d'uscita: 0 se è andata bene, 1 se un pacchetto è stato rifiutato o una voce approvata non ha retto ai controlli, 2 per un uso sbagliato. */
import path from "path";
import { fileURLToPath } from "url";
import { prepare, apply, findRecognizers } from "./lib/voice-import.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const USAGE = "Uso:  node tools/voice-import.mjs pacchetto.zip [...] --review-dir cartella/ [--stt \"<comando>\"] [--blocklist elenco.txt] [--min 0.6] [--out riepilogo.md]\n" +
  "      node tools/voice-import.mjs --apply cartella/review.json [--src src] [--pack-out cartella/]";
const WITH_VALUE = new Set(["--review-dir", "--stt", "--blocklist", "--min", "--out", "--apply", "--src", "--pack-out"]);
const O = {}, files = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    if (!WITH_VALUE.has(a)) { console.error("Opzione sconosciuta: " + a + "\n" + USAGE); process.exit(2); }
    if (argv[i + 1] === undefined || (argv[i + 1].startsWith("--") && a !== "--stt")) { console.error("Manca il valore di " + a + "\n" + USAGE); process.exit(2); }
    O[a.slice(2)] = argv[++i];
  } else files.push(a);
}

try {
  if (O.apply) {
    if (files.length || O["review-dir"] || O.stt || O.blocklist || O.min || O.out) { console.error("Con --apply non si passano pacchetti né opzioni della fase 1.\n" + USAGE); process.exit(2); }
    const r = apply({ review: O.apply, src: O.src || "src", packOut: O["pack-out"] });
    r.log.forEach((l) => console.log(l));
    r.skipped.forEach((l) => console.error("NON applicata " + l));
    console.log(`\nApplicate ${r.applied.length}, già presenti ${r.already.length}, non applicate ${r.skipped.length}.` + (r.applied.length ? " Poi: node tools/build.mjs." : ""));
    process.exit(r.skipped.length ? 1 : 0);
  }
  if (!files.length || !O["review-dir"] || O.src || O["pack-out"]) { console.error(USAGE); process.exit(2); }
  const min = O.min === undefined ? undefined : Number(O.min);
  const r = prepare({ zips: files, reviewDir: O["review-dir"], stt: O.stt, blocklist: O.blocklist, min, out: O.out, src: path.join(ROOT, "src"), repoRoot: ROOT });
  const it = r.review.items, ok = it.filter((x) => x.status === "da-ascoltare").length, bad = r.review.packages.filter((p) => p.status !== "ok");
  console.log(`Riepilogo: ${r.summaryPath}\nreview.json: ${path.join(r.reviewDir, "review.json")}\n${files.length} pacchetti · ${it.length} voci · ${ok} da ascoltare · ${it.length - ok} scartate · ${bad.length} pacchetti rifiutati`);
  if (!r.review.stt) { const f = findRecognizers(); console.log("ATTENZIONE: nessuna trascrizione (manca --stt): vanno ascoltate tutte." + (f.length ? " Nel PATH c'è: " + f.join(", ") + " (il comando proposto è nel riepilogo)." : "")); }
  if (!r.review.blocklist) console.log("ATTENZIONE: il controllo delle parole vietate NON è stato fatto (manca --blocklist).");
  bad.forEach((p) => console.error("Pacchetto rifiutato " + p.name + ": " + p.reason));
  process.exit(bad.length ? 1 : 0);
} catch (e) {
  console.error("Errore: " + e.message);
  process.exit(2);
}
