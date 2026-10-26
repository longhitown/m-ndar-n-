#!/usr/bin/env node
/* màndarínō · build. Node puro, nessuna dipendenza, nessun «npm install».

   src/  (la versione su cui si lavora, divisa in moduli: si apre anche così com'è, da file://)
     → dist/index.html   un file unico con stili, script e dati dentro: funziona offline da file://, su https e nell'APK
     → dist/sw.js        il service worker, con APP_VERSION = impronta di index.html (ogni modifica = avviso «Aggiorna»)
     → dist/manifest.json, _headers, icone

   Prima di scrivere controlla i dati (chiavi uniche, sillabe = caratteri, niente HTML), prova le frasi verificate
   della grammatica (src/data/verified.js, vedi tools/grammar.mjs) e che ogni file di
   src/data/vocab, src/data/dialogs e src/audio/tracks sia elencato in src/index.html: se qualcosa non va, si ferma.

   Uso:  node tools/build.mjs            costruisce dist/
         node tools/build.mjs --check    costruisce in memoria e fallisce se dist/ non è aggiornato (per la CI) */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import vm from "vm";
import { fileURLToPath } from "url";
import { assets, load, check } from "./lib/data.mjs";
import { lab, verify, checkLessons, checkExamples } from "./lib/lab.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src"), OUT = path.join(ROOT, "dist");
const onlyCheck = process.argv.includes("--check");
const fail = (m) => { console.error("✗ " + m); process.exit(1); };

/* 1. dati */
const D = load(SRC), c = check(D);
/* il conteggio atteso (VOCAB_EXPECT in src/data/path-hsk.js) è quello che #selftest controlla nella pagina */
{ const ctx = vm.createContext({ PATH: {} }); vm.runInContext(fs.readFileSync(path.join(SRC, "data/path-hsk.js"), "utf8"), ctx);
  const E = vm.runInContext("VOCAB_EXPECT", ctx);
  if (E.words !== c.words || E.sections !== c.sections) c.err.push(`VOCAB_EXPECT dice ${E.words} parole e ${E.sections} sezioni, i dati ne hanno ${c.words} e ${c.sections}: aggiorna src/data/path-hsk.js`); }
if (c.err.length) fail("dati non validi:\n  " + c.err.slice(0, 30).join("\n  ") + (c.err.length > 30 ? "\n  … e altri " + (c.err.length - 30) : ""));

/* 1b. grammatica: le frasi verificate (src/data/verified.js) devono uscire identiche dalle regole;
       le lezioni (src/data/lessons) devono usare solo parole del vocabolario e avere esercizi ben fatti */
const LAB = lab(SRC), gv = verify(LAB), le = checkLessons(LAB), ee = checkExamples(LAB);
if (le.length) fail("lezioni non valide:\n  " + le.slice(0, 20).join("\n  "));
if (ee.length) fail("frasi d'esempio non valide:\n  " + ee.slice(0, 20).join("\n  "));
if (gv.bad.length) fail("frasi verificate che le regole non traducono più così (dettagli: node tools/grammar.mjs):\n  " + gv.bad.slice(0, 10).map((b) => b.zh + " → «" + b.got + "», attesa «" + b.want + "»").join("\n  "));

/* 2. ogni file è elencato */
const { html, scripts, styles } = assets(SRC);
const listed = new Set(scripts.map((s) => s.src));
for (const dir of ["data/vocab", "data/dialogs", "data/lessons", "data/examples", "data/it/lessons", "audio/tracks"]) {
  for (const f of fs.readdirSync(path.join(SRC, dir)).filter((x) => x.endsWith(".js"))) {
    if (!listed.has(dir + "/" + f)) fail(`src/${dir}/${f} non è elencato in src/index.html (aggiungi <script src="${dir}/${f}"></script>)`);
  }
}
for (const s of scripts) if (!fs.existsSync(path.join(SRC, s.src))) fail("src/index.html elenca un file che non c'è: " + s.src);
/* ogni script deve almeno compilare: un errore di sintassi fermerebbe tutta l'app */
for (const s of scripts) {
  try { new vm.Script(fs.readFileSync(path.join(SRC, s.src), "utf8"), { filename: "src/" + s.src }); }
  catch (e) { fail("errore di sintassi in src/" + s.src + ": " + e.message); }
}

/* 3. un file unico */
let out = html;
const css = styles.map((s) => "/* ---- styles/" + s.href.replace(/^styles\//, "") + " ---- */\n" + fs.readFileSync(path.join(SRC, s.href), "utf8").trimEnd()).join("\n\n");
styles.forEach((s, i) => { out = out.replace(s.tag + "\n", i ? "" : "<style>\n" + css + "\n</style>\n"); });
out = out.replace(/<!-- Stili: [^\n]*-->\n/, "");
for (const s of scripts) {
  const code = fs.readFileSync(path.join(SRC, s.src), "utf8").trimEnd().replace(/<\/script/gi, "<\\/script");
  out = out.replace(s.tag, "<script" + (s.id ? ' id="' + s.id + '"' : "") + ">\n/* ---- " + s.src + " ---- */\n" + code + "\n</script>");
}
out = out.replace(/<!-- =+\n[\s\S]*?=+ -->\n/, "<!-- màndarínō: file generato da tools/build.mjs a partire da src/. Per modificare l'app lavora in src/. -->\n");
if (/<script\b[^>]*\bsrc=|<link\b[^>]*rel="stylesheet"/.test(out)) fail("è rimasto un riferimento esterno in dist/index.html");

const version = crypto.createHash("sha256").update(out).digest("hex").slice(0, 12);
const sw = fs.readFileSync(path.join(SRC, "pwa/sw.js"), "utf8");
if (!sw.includes("'__APP_VERSION__'")) fail("src/pwa/sw.js deve contenere APP_VERSION = '__APP_VERSION__'");
const files = { "index.html": out, "sw.js": sw.replace("'__APP_VERSION__'", "'" + version + "'") };
for (const f of fs.readdirSync(path.join(SRC, "pwa"))) if (!/\.js$/.test(f)) files[f] = fs.readFileSync(path.join(SRC, "pwa", f));
/* i brani del jukebox restano file a parte (dist/audio/music/): ogni modulo audio/tracks/<id>.js con «file: true» ha il suo .ogg */
const MUS = path.join(SRC, "audio/music"), ogg = fs.existsSync(MUS) ? fs.readdirSync(MUS).filter((f) => f.endsWith(".ogg")) : [];
for (const f of ogg) {
  const b = fs.readFileSync(path.join(MUS, f));
  if (b.length > 25 * 1024 * 1024) fail(`src/audio/music/${f} supera i 25 MB (limite di Cloudflare Pages)`);
  files["audio/music/" + f] = b;
}
for (const s of scripts.filter((s) => /^audio\/tracks\/(?!index)/.test(s.src))) {
  const m = /file: true[\s\S]*?player\(c, bus, "([\w-]+)"\)/.exec(fs.readFileSync(path.join(SRC, s.src), "utf8"));
  if (m && !ogg.includes(m[1] + ".ogg")) fail(`${s.src} vuole audio/music/${m[1]}.ogg, che non c'è`);
}

if (onlyCheck) {
  const stale = Object.keys(files).filter((f) => { const p = path.join(OUT, f); return !fs.existsSync(p) || !Buffer.from(files[f]).equals(fs.readFileSync(p)); });
  if (stale.length) fail("dist/ non è aggiornato (" + stale.join(", ") + "): lancia «node tools/build.mjs»");
  console.log("✓ dist/ è aggiornato · versione " + version);
  process.exit(0);
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const [f, data] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true }); fs.writeFileSync(path.join(OUT, f), data); }
console.log(`✓ dist/index.html · ${(out.length / 1024).toFixed(0)} KB · ${c.sections} sezioni, ${c.words} parole, ${c.dialogs} dialoghi, ${gv.total} frasi verificate, ${(D.LESSONS || []).length} lezioni + ${(D.ITLESSONS || []).length} 意大利语 · ${scripts.length} script, ${styles.length} fogli di stile, ${ogg.length} brani · versione ${version}`);
