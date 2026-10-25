#!/usr/bin/env node
/* màndarínō · unione dei contributi della community (prompt V6.7, §6.5). Node, nessuna dipendenza.

   Legge una o più patch «mandarino-contrib/1» (i file .json scaricati dall'app, o il testo arrivato via WeChat / email /
   Modulo Google salvato in un file), rifà la validazione dell'app, segnala doppioni e conflitti e stampa un riepilogo
   leggibile. Solo con --apply modifica i dati in src/data/ (il file della sezione, phrases.js, il file del dialogo),
   con lo stesso formato di tools/lib/data.mjs: un diff mostra solo le righe cambiate. Poi: node tools/build.mjs.

   Regole (le stesse di CP.contrib.validate nell'app):
     - fix cambia py, it o note di una parola (target = chiave), py o it di una frase (phr:<gruppo>:<riga>) o di una battuta
       (dlg:<id>:<riga>). Mai hz: è la chiave dei progressi (cp-srs-v1). Per un carattere sbagliato c'è flag.
     - add aggiunge una parola in fondo a una sezione; se i caratteri esistono già è un doppione.
     - flag non cambia niente: finisce nel riepilogo, da guardare a mano.
     - pinyin: sillabe = caratteri, segni di tono presenti; niente < o >; al massimo 200 caratteri per campo.

   Uso:  node tools/merge-contrib.mjs patch1.json [patch2.json …] [--src src] [--out riepilogo.md] [--apply]
   Codice d'uscita: 0 se tutto è valido, 1 se ci sono voci scartate o conflitti (con --apply quelle voci restano fuori). */
import fs from "fs";
import path from "path";
import { assets, load as loadData, sectionFile, dialogFile, phrasesFile } from "./lib/data.mjs";

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const apply = args.includes("--apply");
const srcDir = path.resolve(opt("--src", "src"));
const outPath = opt("--out", null);
const files = args.filter((a, i) => !a.startsWith("--") && !["--src", "--out"].includes(args[i - 1]));
if (!files.length) { console.error("Uso: node tools/merge-contrib.mjs patch.json [...] [--src src] [--out riepilogo.md] [--apply]"); process.exit(2); }

/* ---------- dati (da src/data, nell'ordine di src/index.html) ---------- */
const DATA = loadData(srcDir), list = assets(srcDir).scripts.map((x) => x.src);
const vocabFiles = list.filter((f) => f.startsWith("data/vocab/")), dialogFiles = list.filter((f) => f.startsWith("data/dialogs/") && !f.includes("/_"));
const SEC = { data: DATA.SECTIONS }, PHR = { data: DATA.PHRASES }, DLG = { data: DATA.DIALOGS };
const touched = new Set();
function store() {
  for (const t of touched) {
    const [kind, i] = t.split(":"), n = +i;
    if (kind === "sec") fs.writeFileSync(path.join(srcDir, vocabFiles[n]), sectionFile(SEC.data[n], n + 1));
    else if (kind === "dlg") fs.writeFileSync(path.join(srcDir, dialogFiles[n]), dialogFile(DLG.data[n]));
    else if (kind === "phr") fs.writeFileSync(path.join(srcDir, "data/phrases.js"), phrasesFile(PHR.data));
  }
}

/* le stesse chiavi dell'app: il carattere, e per i doppioni carattere#pinyin */
const WORDS = {};
SEC.data.forEach((s) => s.words.forEach((w) => { let k = w[1]; if (WORDS[k]) { k = w[1] + "#" + w[0]; while (WORDS[k]) k += "'"; } WORDS[k] = { w, sec: s.id }; }));

/* ---------- regole ---------- */
const CJK = /[㐀-鿿]/, CJKONLY = /^[㐀-鿿]+$/;
const syllables = (py) => { const c = String(py).replace(/[!?,;:…"“”«»()（），。？！、]/g, " ").replace(/\.(?=\s|$)/g, " ").trim(); return c ? c.split(/\s+/).flatMap((w) => w.split(/\.(?=[^\s.])/)) : []; };
const cjkCount = (h) => Array.from(String(h)).filter((c) => CJK.test(c)).length;
const hasTone = (py) => /[̄́̌̀]/.test(String(py).normalize("NFD"));
function lineOf(target) {
  const m = /^(phr|dlg):([^:]+):(\d+)$/.exec(target || ""); if (!m) return null;
  if (m[1] === "phr") { const it = PHR.data[+m[2]] && PHR.data[+m[2]].items[+m[3]]; return it ? { row: it, py: 0, hz: 1, it: 2, view: { py: it[0], hz: it[1], it: it[2] } } : null; }
  const d = DLG.data.find((x) => x.id === m[2]), l = d && d.lines[+m[3]];
  return l ? { row: l, py: 1, hz: 2, it: 3, view: { py: l[1], hz: l[2], it: l[3] } } : null;
}
function validate(it) {
  const e = [];
  if (!it || typeof it !== "object") return ["voce non valida"];
  for (const f of ["target", "field", "old", "new", "why", "section", "py", "hz", "it", "author"]) {
    if (it[f] == null) continue; const v = String(it[f]);
    if (/[<>]/.test(v)) e.push(`«${f}»: contiene < o >`);
    if (v.length > 200) e.push(`«${f}»: più di 200 caratteri`);
  }
  const pyOk = (py, hz) => { if (!String(py).trim()) return "pinyin vuoto"; if (!hasTone(py)) return "pinyin senza segni di tono"; const a = syllables(py).length, b = cjkCount(hz); return a !== b ? `pinyin con ${a} sillabe per ${b} caratteri` : ""; };
  if (it.op === "fix") {
    const w = WORDS[it.target], ln = w ? null : lineOf(it.target);
    if (!w && !ln) e.push(`non trovo «${it.target}»`);
    else if (!["py", "it", "note"].includes(it.field) || (!w && it.field === "note")) e.push(`campo «${it.field}» non correggibile (mai hz)`);
    else if (it.field === "py") { const m = pyOk(it.new, w ? w.w[1] : ln.view.hz); if (m) e.push(m); }
    else if (it.field === "it" && !String(it.new || "").trim()) e.push("italiano vuoto");
  } else if (it.op === "add") {
    if (!SEC.data.some((s) => s.id === it.section)) e.push(`sezione «${it.section}» inesistente`);
    if (!CJKONLY.test(it.hz || "") || cjkCount(it.hz) > 8) e.push("caratteri non validi");
    const m = pyOk(it.py || "", it.hz || ""); if (m) e.push(m);
    if (!String(it.it || "").trim()) e.push("manca l'italiano");
  } else if (it.op === "flag") {
    if (!it.target || (!WORDS[it.target] && !lineOf(it.target))) e.push(`non trovo «${it.target}»`);
    if (String(it.why || "").trim().length < 3) e.push("segnalazione senza motivo");
  } else e.push(`tipo «${it.op}» sconosciuto`);
  return e;
}

/* ---------- lettura delle patch ---------- */
const all = [], rejected = [], dup = [], flags = [], conflicts = [], same = [];
const current = (it) => { const w = WORDS[it.target]; if (w) return { py: w.w[0], it: w.w[2], note: w.w[3] || "" }[it.field]; const ln = lineOf(it.target); return ln ? ln.view[it.field] : undefined; };
const seenId = new Map(), seenFix = new Map(), seenAdd = new Map();
for (const f of files) {
  let p;
  try { const raw = fs.readFileSync(f, "utf8"); const j = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1); p = JSON.parse(j); }
  catch (e) { rejected.push({ src: f, it: null, why: ["file illeggibile: " + e.message] }); continue; }
  if (p.schema !== "mandarino-contrib/1" || !Array.isArray(p.items)) { rejected.push({ src: f, it: null, why: ["non è una patch mandarino-contrib/1"] }); continue; }
  for (const it of p.items) {
    const src = path.basename(f) + (p.author ? " · " + p.author : "");
    if (it && it.id && seenId.has(it.id)) { dup.push({ src, it, of: seenId.get(it.id) }); continue; }
    if (it && it.id) seenId.set(it.id, src);
    const why = validate(it);
    if (why.length) { rejected.push({ src, it, why }); continue; }
    if (it.op === "flag") { flags.push({ src, it }); continue; }
    if (it.op === "fix") {
      if (current(it) === it.new) { same.push({ src, it }); continue; }
      const k = it.target + "|" + it.field, prev = seenFix.get(k);
      if (prev && prev.it.new === it.new) { dup.push({ src, it, of: prev.src }); continue; }
      if (prev) { conflicts.push({ a: prev, b: { src, it } }); continue; }
      seenFix.set(k, { src, it });
    }
    if (it.op === "add") {
      if (WORDS[it.hz]) { dup.push({ src, it, of: "dizionario" }); continue; }
      if (seenAdd.has(it.hz)) { dup.push({ src, it, of: seenAdd.get(it.hz) }); continue; }
      seenAdd.set(it.hz, src);
    }
    all.push({ src, it });
  }
}
/* un conflitto tiene fuori entrambe le proposte: decide una persona */
const conflictKeys = new Set(conflicts.map((c) => c.a.it.target + "|" + c.a.it.field));
const ok = all.filter((x) => !(x.it.op === "fix" && conflictKeys.has(x.it.target + "|" + x.it.field)));

/* ---------- riepilogo ---------- */
const show = (it) => {
  if (!it) return "—";
  if (it.op === "fix") { const cur = current(it) ?? "—"; return `fix ${it.target} · ${it.field}: «${cur}» → «${it.new}»` + (it.old != null && it.old !== cur ? ` (attenzione: la patch partiva da «${it.old}»)` : ""); }
  if (it.op === "add") return `add ${it.hz} ${it.py} «${it.it}» in ${it.section}`;
  return `flag ${it.target}: ${it.why}`;
};
let md = `# Contributi · riepilogo\n\n${files.length} file · ${ok.length} da applicare · ${flags.length} segnalazioni · ${dup.length + same.length} doppioni · ${conflicts.length} conflitti · ${rejected.length} scartati\n`;
if (ok.length) md += "\n## Da applicare\n\n" + ok.map((x) => `- ${show(x.it)}${x.it.why ? " — " + x.it.why : ""} _(${x.src})_`).join("\n") + "\n";
if (flags.length) md += "\n## Segnalazioni (da guardare a mano)\n\n" + flags.map((x) => `- ${show(x.it)} _(${x.src})_`).join("\n") + "\n";
if (conflicts.length) md += "\n## Conflitti (restano fuori: decide una persona)\n\n" + conflicts.map((c) => `- ${show(c.a.it)} _(${c.a.src})_\n  vs ${show(c.b.it)} _(${c.b.src})_`).join("\n") + "\n";
if (same.length) md += "\n## Già così nel dizionario (ignorati)\n\n" + same.map((x) => `- ${show(x.it)} _(${x.src})_`).join("\n") + "\n";
if (dup.length) md += "\n## Doppioni (ignorati)\n\n" + dup.map((x) => `- ${show(x.it)} _(${x.src}, già in ${x.of})_`).join("\n") + "\n";
if (rejected.length) md += "\n## Scartati\n\n" + rejected.map((x) => `- ${x.it ? show(x.it) : x.src}: ${x.why.join("; ")} _(${x.src})_`).join("\n") + "\n";

/* ---------- applicazione ---------- */
if (apply && ok.length) {
  let n = 0;
  for (const { it } of ok) {
    if (it.op === "fix") {
      const w = WORDS[it.target];
      if (w) { const idx = { py: 0, it: 2, note: 3 }[it.field]; if (idx === 3 && w.w.length < 4) w.w.push(""); w.w[idx] = it.new; if (idx === 3 && !it.new) w.w.length = 3; touched.add("sec:" + SEC.data.findIndex((s) => s.id === w.sec)); n++; }
      else { const ln = lineOf(it.target); ln.row[ln[it.field]] = it.new; const m = /^(phr|dlg):([^:]+)/.exec(it.target); touched.add(m[1] === "phr" ? "phr:0" : "dlg:" + DLG.data.findIndex((d) => d.id === m[2])); n++; }
    } else if (it.op === "add") { const si = SEC.data.findIndex((s) => s.id === it.section); SEC.data[si].words.push([it.py, it.hz, it.it]); touched.add("sec:" + si); n++; }
  }
  store();
  md += `\n**Applicati ${n} contributi in src/data/ (${[...touched].length} file).** Poi: node tools/build.mjs. Le parole aggiunte cambiano il conteggio atteso in #selftest (oggi 3500).\n`;
} else if (apply) md += "\nNiente da applicare.\n";
else if (ok.length) md += "\nProva a secco: rilancia con --apply per scrivere le modifiche.\n";

if (outPath) fs.writeFileSync(outPath, md); else process.stdout.write(md);
process.exit(rejected.length || conflicts.length ? 1 : 0);
