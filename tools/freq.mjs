#!/usr/bin/env node
/* màndarínō · rigenera src/data/freq.js (rango di frequenza delle parole, per il taglio delle frasi) dalla lista
   complete-hsk-vocabulary (MIT). Va rilanciato quando si aggiungono parole. Il file della lista non entra nel repository. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load } from "./lib/data.mjs";
const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const args = process.argv.slice(2); if (!args[0]) { console.error("Uso: node tools/freq.mjs complete.json   (da github.com/drkameleon/complete-hsk-vocabulary)"); process.exit(2); }
const H = JSON.parse(fs.readFileSync(args[0], "utf8"));
const have = new Set(load(SRC).SECTIONS.flatMap((s) => s.words.map((w) => w[1])));
/* rango = il più basso tra la frequenza nei testi e il livello HSK (una parola dell'HSK 1 è comune anche se nei testi
   compare poco come voce a sé, es. 中文): HSK1 ≤ 300, HSK2 ≤ 800, HSK3 ≤ 1500, HSK4 ≤ 2500, HSK5 ≤ 3500, HSK6 ≤ 4500 */
const LV = { 1: 300, 2: 800, 3: 1500, 4: 2500, 5: 3500, 6: 4500, 7: 7000 };
const f = new Map();
const put = (w, q) => { if (have.has(w) && q) f.set(w, Math.min(f.get(w) || 1e9, q)); };
for (const w of H) {
  const lv = Math.min(...w.level.filter((l) => /^new-/.test(l)).map((l) => +l.slice(4)), 7);
  const r = Math.min(w.frequency || 1e9, LV[lv] || 1e9);
  put(w.simplified, r); if (w.simplified.endsWith("儿")) put(w.simplified.slice(0, -1), r);
}
const list = [...f.entries()].sort((a, b) => a[1] - b[1]);
const js = "/* Frequenza d'uso delle parole, dalla più comune: serve al taglio delle frasi in parole (src/core/segment.js) per\n   scegliere, tra due divisioni possibili, quella più probabile (有+时间 e non 有时+间). Ricavata da complete-hsk-vocabulary\n   (licenza MIT, Yanis Zafirópulos; vedi i crediti): il più basso tra il rango di frequenza e il livello HSK; le forme\n   con 儿 valgono anche senza. Si rigenera con tools/freq.mjs quando si aggiungono parole. */\nvar WORD_FREQ = \"" + list.map((x) => x[0]).join("|") + "\";\n";
fs.writeFileSync(path.join(SRC, "data/freq.js"), js);
console.log(list.length + " parole con frequenza");
