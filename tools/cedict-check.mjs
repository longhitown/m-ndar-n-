#!/usr/bin/env node
/* màndarínō · confronto del vocabolario con CC-CEDICT. SOLO PER LO SVILUPPO: CC-CEDICT non entra nell'app né nel
   repository (licenza CC BY-SA 4.0: copiarne i dati obbligherebbe a ridistribuire i nostri con la stessa licenza).
   Lo usiamo come un secondo paio d'occhi: dice dove il nostro pinyin non coincide con nessuna lettura nota e mette
   accanto all'italiano il significato inglese, così una persona controlla. Nessuna correzione è automatica.

   Scarica il file (gratis) da https://www.mdbg.net/chinese/dictionary?page=cedict, poi:
     node tools/cedict-check.mjs percorso/cedict_ts.u8[.gz] [--out rapporto.md] [--tutto]
   Senza --tutto il rapporto elenca solo i casi da guardare: pinyin diverso, parola assente da CC-CEDICT.
   Il rapporto è un file di lavoro: non va committato. */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { load, keysOf } from "./lib/data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2), file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--out");
const outPath = args.includes("--out") ? args[args.indexOf("--out") + 1] : null, all = args.includes("--tutto");
if (!file) { console.error("Uso: node tools/cedict-check.mjs cedict_ts.u8[.gz] [--out rapporto.md] [--tutto]"); process.exit(2); }

let raw = fs.readFileSync(file); if (/\.gz$/.test(file)) raw = zlib.gunzipSync(raw);
/* riga CC-CEDICT: Tradizionale Semplificato [pin1 yin1] /significato/significato/ */
const DICT = new Map();
for (const line of raw.toString("utf8").split("\n")) {
  if (!line || line[0] === "#") continue;
  const m = /^(\S+) (\S+) \[([^\]]*)\] \/(.*)\/\s*$/.exec(line); if (!m) continue;
  const e = { py: m[3], en: m[4].split("/") };
  if (!DICT.has(m[2])) DICT.set(m[2], []);
  DICT.get(m[2]).push(e);
}
/* pinyin con i segni → sillabe con il numero del tono, minuscole: «Zhōng.guó» → «zhong1 guo2» */
const MARK = { "̄": 1, "́": 2, "̌": 3, "̀": 4 };
function numbered(py) {
  return String(py).replace(/[!?,;:…"“”«»()（），。？！、]/g, " ").replace(/\.(?=\s|$)/g, " ").trim().split(/[\s.]+/).filter(Boolean).map((s) => {
    const d = s.normalize("NFD"); let t = 5;
    for (const c of d) if (MARK[c]) t = MARK[c];
    return d.replace(/u\u0308/g, "u:").replace(/[\u0300-\u036f]/g, "").toLowerCase() + t;
  }).join(" ");
}
const norm = (p) => p.toLowerCase().replace(/v/g, "u:").replace(/\s+/g, " ").trim();
/* il tono neutro (5) e il cambio di tono di 一 e 不 non sono errori: si confronta anche senza toni */
const bare = (p) => p.replace(/[1-5]/g, "");

const D = load(path.join(ROOT, "src")), W = keysOf(D.SECTIONS);
const rows = { diff: [], missing: [], tone: [], ok: [] };
for (const k of Object.keys(W)) {
  const [py, hz, it] = W[k].w, ours = numbered(py), es = DICT.get(hz);
  if (!es) { rows.missing.push({ hz, py, it, sec: W[k].sec }); continue; }
  const theirs = es.map((e) => norm(e.py)), en = es.map((e) => e.en.join("; ")).join(" | ");
  if (theirs.includes(ours)) { rows.ok.push({ hz, py, it, en }); continue; }
  const sameSounds = theirs.some((t) => bare(t) === bare(ours));
  (sameSounds ? rows.tone : rows.diff).push({ hz, py, it, en, theirs: [...new Set(theirs)].join(" / "), sec: W[k].sec });
}
const line = (r) => `- ${r.hz} · ${r.py} · «${r.it}» (${r.sec || ""})` + (r.theirs ? `\n  CC-CEDICT: [${r.theirs}] ${r.en}` : r.en ? `\n  CC-CEDICT: ${r.en}` : "");
let md = `# Vocabolario e CC-CEDICT\n\n${Object.keys(W).length} parole · ${rows.ok.length} uguali · ${rows.tone.length} con toni diversi · ${rows.diff.length} con sillabe diverse · ${rows.missing.length} assenti da CC-CEDICT\n\n` +
  "Toni diversi: spesso è il tono neutro o il cambio di tono di 一/不 (non sono errori). Sillabe diverse: da controllare con attenzione. " +
  "Assenti: di solito sono frasi fatte (non parole del dizionario) o parole recenti.\n";
md += `\n## Sillabe diverse (da controllare)\n\n${rows.diff.map(line).join("\n") || "nessuna"}\n`;
md += `\n## Toni diversi\n\n${rows.tone.map(line).join("\n") || "nessuna"}\n`;
md += `\n## Assenti da CC-CEDICT\n\n${rows.missing.map(line).join("\n") || "nessuna"}\n`;
if (all) md += `\n## Uguali (con il significato inglese, per rileggere l'italiano)\n\n${rows.ok.map(line).join("\n")}\n`;
if (outPath) { fs.writeFileSync(outPath, md); console.log(`Rapporto in ${outPath}: ${rows.diff.length} sillabe diverse, ${rows.tone.length} toni diversi, ${rows.missing.length} assenti.`); }
else process.stdout.write(md);
