#!/usr/bin/env node
/* màndarínō · «nomi e termini» per il Lettore, da wikidict-it (github.com/open-dict-data/wikidict-it, dati di Wikidata,
   licenza CC0: i titoli delle voci di Wikipedia in cinese collegati a quelli in italiano). Il file della fonte non entra nel
   repository. Scrive src/data/wiki/zh-it.txt (una riga = «cinese<TAB>italiano»), che la build copia a parte in dist/: l'app
   lo scarica solo la prima volta che serve e poi lo tiene offline.
   Uso: node tools/wikidict.mjs zh-it_wiki.txt
   Si tengono i titoli da 2 a 6 caratteri cinesi che non sono già parole del vocabolario; si scartano categorie, modelli,
   titoli con cifre (asteroidi, anni) e le pagine di disambiguazione. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load, keysOf } from "./lib/data.mjs";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
if (!process.argv[2]) { console.error("Uso: node tools/wikidict.mjs zh-it_wiki.txt"); process.exit(2); }
const D = load(SRC), have = new Set(Object.values(keysOf(D.SECTIONS)).map((x) => x.w[1])), seen = new Set(), out = [];
for (const line of fs.readFileSync(process.argv[2], "utf8").split("\n")) {
  let [zh, it] = line.split("\t"); if (!zh || !it) continue;
  zh = zh.trim(); it = it.trim().replace(/\s*\((disambigua|pagina di disambiguazione)\)$/i, "");
  if (!/^[一-鿿]{2,6}$/.test(zh) || have.has(zh) || seen.has(zh)) continue;
  if (/\d|^(Categoria|Template|Portale|Aiuto|Wikipedia|Progetto):|^Lingua /i.test(it) || /小行星/.test(zh) || /[\t\n]/.test(it)) continue;
  seen.add(zh); out.push(zh + "\t" + it);
}
fs.mkdirSync(path.join(SRC, "data/wiki"), { recursive: true });
fs.writeFileSync(path.join(SRC, "data/wiki/zh-it.txt"), out.join("\n") + "\n");
console.log("data/wiki/zh-it.txt: " + out.length + " voci, " + Math.round(out.join("\n").length / 1024) + " KB");
