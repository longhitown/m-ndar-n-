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

/* ---- 2. il pinyin di ogni frase dell'app (frasi, dialoghi, Ordine del Pensiero, modelli, slot, percorso…) ----
   Si cercano nei dati le coppie [pinyin, caratteri]; i caratteri si tagliano con CC-CEDICT (la parola più lunga) e si
   confronta ogni pezzo. Un errore vero è una sillaba diversa; il tono diverso si segnala solo se non è il neutro
   o il cambio di tono di 一 e 不 (che scriviamo come si pronuncia). */
const CJKC = /[㐀-鿿]/, MAXW = 8;
const charReads = new Map();   /* carattere -> letture note (da tutte le voci in cui compare, posizione per posizione) */
for (const [hz, es] of DICT) {
  const cs = [...hz]; for (const e of es) { const sy = norm(e.py).split(" "); if (sy.length !== cs.length) continue; cs.forEach((c, i) => { if (!charReads.has(c)) charReads.set(c, new Set()); charReads.get(c).add(sy[i]); }); }
}
function pairs(x, where, out) {
  if (Array.isArray(x)) {
    x.forEach((v, i) => { if (typeof v === "string" && typeof x[i + 1] === "string" && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(v) && !CJKC.test(v) && CJKC.test(x[i + 1])) out.push({ py: v, hz: x[i + 1], where }); });
    x.forEach((v) => { if (v && typeof v === "object") pairs(v, where, out); });
  } else if (x && typeof x === "object") for (const k of Object.keys(x)) pairs(x[k], where + (k === "id" || k === "title" ? "" : ""), out);
  return out;
}
const srcs = [["frasi", D.PHRASES], ["dialoghi", D.DIALOGS], ["pensiero", D.THINK], ["modelli", D.PATTERNS], ["slot", D.SLOTS], ["situazioni", D.SITUATIONS], ["percorso", D.PATH]];
const sent = []; for (const [n, x] of srcs) if (x) pairs(x, n, sent);
/* --prova: errori messi apposta, per vedere che il controllo li trova */
if (args.includes("--prova")) sent.push({ py: "Wǒ sì Yì.dà.lì rén.", hz: "我是意大利人。", where: "prova: sillaba" }, { py: "Wǒ shì Yì.dà.lì rèn.", hz: "我是意大利人。", where: "prova: tono" }, { py: "Wǒ shì Yì.dà.lì.", hz: "我是意大利人。", where: "prova: conteggio" }, { py: "Yì.qǐ qù ba.", hz: "一起去吧。", where: "prova: 一 va bene" });
const toneOk = (ours, theirs, ch) => { const t1 = ours.slice(-1), t2 = theirs.slice(-1); return t1 === t2 || t1 === "5" || t2 === "5" || ch === "一" || ch === "不"; };
const sbad = [], stone = [], scount = [];
for (const p of sent) {
  const ours = numbered(p.py).split(" ").filter(Boolean), cs = [...p.hz].filter((c) => CJKC.test(c));
  if (ours.length !== cs.length) { scount.push(p); continue; }
  for (let i = 0; i < cs.length;) {
    let L = Math.min(MAXW, cs.length - i), es = null;
    for (; L > 1; L--) { es = DICT.get(cs.slice(i, i + L).join("")); if (es) break; }
    const seg = cs.slice(i, i + L), mine = ours.slice(i, i + L);
    const reads = (L > 1 && es ? es : DICT.get(seg[0]) || []).map((e) => norm(e.py).split(" ")).filter((r) => r.length === L);
    const word = seg.join(""), whole = reads.some((r) => r.every((s, j) => bare(s) === bare(mine[j])));
    const perChar = seg.every((c, j) => [...(charReads.get(c) || [])].some((s) => bare(s) === bare(mine[j])));
    if (!whole && !perChar) sbad.push({ ...p, word, mine: mine.join(" "), theirs: [...new Set(reads.map((r) => r.join(" ")))].join(" / ") || [...(charReads.get(seg[0]) || [])].join(" / ") });
    else {
      const tonesFit = reads.some((r) => r.every((s, j) => bare(s) !== bare(mine[j]) || toneOk(mine[j], s, seg[j])));
      /* carattere per carattere si è più severi: il loro tono neutro non giustifica un nostro tono pieno diverso */
      const charTones = seg.every((c, j) => [...(charReads.get(c) || [])].some((s) => bare(s) === bare(mine[j]) && (s === mine[j] || mine[j].endsWith("5") || c === "一" || c === "不")));
      if (!tonesFit && !charTones) stone.push({ ...p, word, mine: mine.join(" "), theirs: [...new Set(reads.map((r) => r.join(" ")))].join(" / ") });
    }
    i += L;
  }
}
const sl = (r) => `- ${r.word ? "**" + r.word + "** [" + r.mine + "] ≠ [" + r.theirs + "] · " : ""}${r.hz} · ${r.py} (${r.where})`;
md += `\n# Frasi dell'app e CC-CEDICT\n\n${sent.length} frasi con pinyin · ${sbad.length} sillabe diverse · ${stone.length} toni diversi · ${scount.length} con il numero di sillabe diverso dai caratteri\n`;
md += `\n## Sillabe diverse (da controllare)\n\n${sbad.map(sl).join("\n") || "nessuna"}\n`;
md += `\n## Toni diversi (né neutro né 一/不)\n\n${stone.map(sl).join("\n") || "nessuno"}\n`;
md += `\n## Sillabe e caratteri in numero diverso\n\n${scount.map(sl).join("\n") || "nessuna"}\n`;

/* ---- 3. i classificatori del correttore (NCLF in src/phrases/grammar.js) contro le indicazioni «CL:» di CC-CEDICT ---- */
const gsrc = fs.readFileSync(path.join(ROOT, "src/phrases/grammar.js"), "utf8"), nm = /var NCLF = (\{[^}]*\})/.exec(gsrc);
const NCLF = nm ? JSON.parse(nm[1]) : {}, cbad = [];
if (args.includes("--prova")) { NCLF["书(prova)"] = "条"; }
const clOf = (hz) => { const out = new Set(); for (const e of DICT.get(hz) || []) for (const d of e.en) { const m = /^CL:(.*)$/.exec(d); if (m) for (const c of m[1].split(",")) { const z = /(?:[^|\[]+\|)?([^\[]+)\[/.exec(c.trim()); if (z) out.add(z[1]); } } return out; };
for (const [n, c] of Object.entries(NCLF)) { const cl = clOf(n.replace("(prova)", "")); if (cl.size && !cl.has(c) && !(c === "个" && cl.size)) cbad.push(`- ${n}: noi ${c}, CC-CEDICT ${[...cl].join(" ")}`); }
md += `\n# Classificatori del correttore\n\n${Object.keys(NCLF).length} nomi · ${cbad.length} diversi da CC-CEDICT (个 va bene ovunque nel parlato)\n\n${cbad.join("\n") || "nessuno"}\n`;

if (outPath) { fs.writeFileSync(outPath, md); console.log(`Rapporto in ${outPath}: parole ${rows.diff.length} sillabe diverse, ${rows.tone.length} toni diversi, ${rows.missing.length} assenti · frasi ${sbad.length} sillabe diverse, ${stone.length} toni, ${scount.length} conteggi · classificatori ${cbad.length} diversi.`); }
else process.stdout.write(md);
