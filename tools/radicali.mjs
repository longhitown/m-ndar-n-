#!/usr/bin/env node
/* màndarínō · rigenera src/data/lab-recipes.js (le ricette del Laboratorio dei radicali) dai dati dell'app.
   Uso: node tools/radicali.mjs        (con --check non scrive, dice solo se il file è aggiornato) */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { recipes, recipesFile } from "./lib/radicali.mjs";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src"), OUT = path.join(SRC, "data/lab-recipes.js");
const { list } = recipes(SRC), text = recipesFile(list);
if (process.argv.includes("--check")) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (cur !== text) { console.error("src/data/lab-recipes.js non è aggiornato: lancia node tools/radicali.mjs"); process.exit(1); }
  console.log("src/data/lab-recipes.js è aggiornato (" + list.length + " ricette)."); process.exit(0);
}
fs.writeFileSync(OUT, text);
console.log("Scritto src/data/lab-recipes.js: " + list.length + " ricette, " + list.filter((r) => !r[6]).length + " senza pinyin.");
