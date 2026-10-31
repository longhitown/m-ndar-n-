#!/usr/bin/env node
/* màndarínō · finto riconoscitore vocale per le prove di tools/voice-import.mjs (tools/unit.mjs). Non riconosce niente: stampa un testo
   prefissato scelto dal NOME del file. Il nome è «<indice>-<impronta>.<ext>» (o «<indice>-<impronta>.wav»): l'indice sceglie la riga
   dell'array JSON in FAKE_STT_SAY. Se la riga manca, non stampa niente (come un riconoscitore che non sente nulla); se il file
   non esiste, esce con errore. Nessuna rete, nessun modello. Uso:  FAKE_STT_SAY='["你好","buongiorno"]' node fake-stt.mjs file */
import fs from "fs";
import path from "path";

const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error("file non trovato"); process.exit(1); }
const n = parseInt(path.basename(file), 10), say = JSON.parse(process.env.FAKE_STT_SAY || "[]");
if (Number.isInteger(n) && typeof say[n] === "string") process.stdout.write("[00:00.000 --> 00:02.000]  " + say[n] + "\n");
