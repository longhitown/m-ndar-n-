#!/usr/bin/env node
/* màndarínō · i testi graduati: da materiali/runtime/testi-*.json a src/data/reading/ (letti al primo uso).
   Testi cinesi: ogni frase si ritaglia con il taglio dell'app (src/core/segment.js) e deve essere fatta solo di parole del
   vocabolario; il livello del testo è quello della parola più alta (HSK, o il capitolo della tappa per le frasi fatte):
   se quello dichiarato è più basso, vince quello calcolato (e lo si dice). Ogni frase ha la traduzione; ogni domanda ha la
   risposta giusta tra le scelte. Le stesse regole le ricontrolla tools/build.mjs sui file scritti.
   I testi sono bozze scritte per il progetto: vanno riletti da un madrelingua prima della pubblicazione.
   Uso: node tools/lettura.mjs [--check] */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { tools } from "./materiali.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), ".."), SRC = path.join(ROOT, "src"), MAT = path.join(ROOT, "materiali");
const OUT = path.join(SRC, "data/reading"), CHECK = process.argv.includes("--check");

/* errori di un elenco di testi già nella forma dell'app (li usa anche la build) */
export function checkTexts(TL, zh, it) {
  const err = [];
  for (const t of zh || []) {
    let lv = 1;
    t.frasi.forEach((f, i) => {
      const c = TL.check(f.zh); if (!c.ok) err.push(`${t.id} frase ${i}: parole fuori dal vocabolario (${c.unknown.join("")})`);
      lv = Math.max(lv, c.lv); if (!String(f.it || "").trim()) err.push(`${t.id} frase ${i}: manca la traduzione`);
    });
    if (lv > t.livello) err.push(`${t.id}: livello dichiarato ${t.livello}, calcolato ${lv}`);
    (t.domande || []).forEach((d, i) => { if (!Array.isArray(d.scelte_it) || !(d.giusta >= 0 && d.giusta < d.scelte_it.length) || !(d.frase >= 0 && d.frase < t.frasi.length)) err.push(`${t.id} domanda ${i}: risposta giusta o frase fuori intervallo`); });
  }
  for (const t of it || []) {
    t.frasi.forEach((f, i) => { if (!String(f.it || "").trim() || !String(f.zh || "").trim()) err.push(`${t.id} frase ${i}: manca l'italiano o il cinese`); });
    (t.domande || []).forEach((d, i) => { if (!d.domanda_zh || !Array.isArray(d.scelte_it) || !(d.giusta >= 0 && d.giusta < d.scelte_it.length)) err.push(`${t.id} domanda ${i}: manca la domanda in cinese o la risposta giusta è fuori intervallo`); });
  }
  return err;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const TL = tools(SRC), zh = JSON.parse(fs.readFileSync(path.join(MAT, "runtime/testi-zh.json"), "utf8")), it = JSON.parse(fs.readFileSync(path.join(MAT, "runtime/testi-it.json"), "utf8"));
  const raised = [];
  for (const t of zh) { const lv = t.frasi.reduce((m, f) => Math.max(m, TL.check(f.zh).lv), 1); if (lv > t.livello) { raised.push(`${t.id}: ${t.livello} → ${lv}`); t.livello = lv; } }
  const err = checkTexts(TL, zh, it);
  if (err.length) { console.error("✗ testi non validi:\n  " + err.join("\n  ")); process.exit(1); }
  const head = (what) => "/* màndarínō · " + what + ". Testi scritti per il progetto, bozze da far rileggere a un madrelingua.\n   Generato da tools/lettura.mjs a partire da materiali/runtime/: non modificarlo a mano. */\n";
  const FILES = {
    "testi-zh.js": head("testi graduati di cinese, livelli 1-6, con le domande di comprensione") + "var TESTI_ZH = " + JSON.stringify(zh) + ";\n",
    "testi-it.js": head("testi graduati di italiano per chi parla cinese, A1-B1, con le domande in cinese") + "var TESTI_IT = " + JSON.stringify(it) + ";\n"
  };
  fs.mkdirSync(OUT, { recursive: true });
  const stale = [];
  for (const [f, text] of Object.entries(FILES)) { const p = path.join(OUT, f); if (CHECK) { if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== text) stale.push(f); } else fs.writeFileSync(p, text); }
  console.log("  testi: " + zh.length + " cinesi, " + it.length + " italiani" + (raised.length ? "; livello alzato a quello calcolato: " + raised.join(", ") : ""));
  if (CHECK && stale.length) { console.error("✗ src/data/reading/ non è aggiornato: " + stale.join(", ") + " (node tools/lettura.mjs)"); process.exit(1); }
  console.log(CHECK ? "✓ src/data/reading/ aggiornato" : "✓ scritto src/data/reading/");
}
