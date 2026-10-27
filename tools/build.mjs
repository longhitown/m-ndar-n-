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
/* la lavagna deve avere ordine e direzione dei tratti per ogni carattere del vocabolario (si rigenerano con tools/strokes.mjs) */
{ const sctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(SRC, "data/strokes.js"), "utf8"), sctx);
  const ST = vm.runInContext("STROKES", sctx), miss = new Set();
  D.SECTIONS.forEach((s) => s.words.forEach((w) => [...w[1]].forEach((ch) => { if (/[㐀-鿿]/.test(ch) && !ST[ch]) miss.add(ch); })));
  if (miss.size) fail(`caratteri senza tratti in src/data/strokes.js: ${[...miss].join("")} (lancia node tools/strokes.mjs graphics.txt)`); }
/* anatomia del carattere: ogni carattere del vocabolario ha una scomposizione o è segnato come semplice ("") in
   src/data/anatomy.js (si rigenera con tools/anatomy.mjs dictionary.txt) */
{ const actx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(SRC, "data/anatomy.js"), "utf8"), actx);
  const AN = vm.runInContext("ANATOMY", actx), miss = new Set();
  D.SECTIONS.forEach((s) => s.words.forEach((w) => [...w[1]].forEach((ch) => { if (/[㐀-鿿]/.test(ch) && !Array.isArray(AN[ch])) miss.add(ch); })));
  if (miss.size) fail(`caratteri senza struttura in src/data/anatomy.js: ${[...miss].join("")} (lancia node tools/anatomy.mjs dictionary.txt)`); }
/* il Percorso: ogni tappa ha un capitolo (data/levels.js) e i file del vocabolario sono in ordine di capitolo */
{ const lctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(SRC, "data/levels.js"), "utf8"), lctx);
  const SC = vm.runInContext("SECTION_CHAPTER", lctx); let last = 0;
  for (const s of D.SECTIONS) {
    const ch = SC[s.id]; if (!ch) fail(`la tappa ${s.id} non ha un capitolo in src/data/levels.js (lancia node tools/levels.mjs complete.json)`);
    if (ch < last) fail(`la tappa ${s.id} (capitolo ${ch}) viene dopo una del capitolo ${last}: lancia node tools/levels.mjs complete.json`); last = ch;
  } }
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

/* parti di altri: ogni file di src/vendor/ e ogni dato esterno di src/data/ (intestazione con «licenza»/«license», o
   generato da una fonte esterna senza intestazione) deve avere una voce in THIRD-PARTY-NOTICES.md */
{
  const tpn = fs.existsSync(path.join(SRC, "..", "THIRD-PARTY-NOTICES.md")) ? fs.readFileSync(path.join(SRC, "..", "THIRD-PARTY-NOTICES.md"), "utf8") : "";
  const EXTERNAL_NOHEAD = ["data/wiki/zh-it.txt"];
  const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
  const ext = walk(path.join(SRC, "vendor")).map((f) => path.relative(SRC, f))
    .concat(walk(path.join(SRC, "data")).filter((f) => /\.js$/.test(f) && /licen[sz]/i.test(fs.readFileSync(f, "utf8").slice(0, 400))).map((f) => path.relative(SRC, f)))
    .concat(EXTERNAL_NOHEAD);
  const miss = ext.filter((f) => tpn.indexOf("src/" + f.split(path.sep).join("/")) < 0);
  if (miss.length) fail("parti di altri senza una voce in THIRD-PARTY-NOTICES.md: " + miss.join(", "));
}

/* «Novità» e Crediti: ogni versione di data/changelog.js ha le righe nelle due lingue; l'elenco di data/contributors.js è
   lo stesso di CONTRIBUTORS.md (tools/merge-contrib.mjs --apply li aggiorna insieme) */
{
  const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(SRC, "data/changelog.js"), "utf8") + ";this.C=CHANGELOG;", ctx);
  (ctx.C || []).forEach((e) => { if (!e.v || !e.d || !(e.it || []).length || (e.it || []).length !== (e.zh || []).length) fail(`data/changelog.js: la versione ${e.v || "?"} deve avere data e lo stesso numero di righe in italiano e in cinese`); });
  vm.runInNewContext(fs.readFileSync(path.join(SRC, "data/contributors.js"), "utf8") + ";this.P=CONTRIBUTORS;", ctx);
  const md = fs.existsSync(path.join(SRC, "..", "CONTRIBUTORS.md")) ? fs.readFileSync(path.join(SRC, "..", "CONTRIBUTORS.md"), "utf8") : "";
  const blk = (/<!-- elenco -->([\s\S]*?)<!-- \/elenco -->/.exec(md) || [, ""])[1];
  const listed = blk.split("\n").map((l) => /^- (.+)$/.exec(l.trim())).filter(Boolean).map((m) => m[1].trim());
  if (JSON.stringify(listed) !== JSON.stringify(ctx.P || [])) fail("CONTRIBUTORS.md e src/data/contributors.js non hanno lo stesso elenco");
}

/* il corso di italiano non ha testi scritti nel codice: tutto passa da t() (src/i18n/). Ammessi i commenti e le
   righe bilingui di proposito (data-noi18n: la scelta del corso, che deve capire anche chi non legge l'altra lingua). */
{
  for (const f of fs.readdirSync(path.join(SRC, "it")).filter((x) => x.endsWith(".js"))) {
    const code = fs.readFileSync(path.join(SRC, "it", f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const bad = code.split("\n").filter((l) => /[\u4e00-\u9fff]/.test(l) && !/data-noi18n/.test(l) && !/data-course-set/.test(l));
    if (bad.length) fail("src/it/" + f + ": testo cinese scritto nel codice (usa t()): " + bad[0].trim().slice(0, 80));
  }
}

/* i dati dei materiali (src/data/ex/, scritti da tools/materiali.mjs) si ricontrollano con il taglio dell'app:
   frasi cinesi solo di parole del vocabolario e con il livello non sotto quello calcolato; ogni clip dell'indice esiste,
   sotto i 60 KB; le voci insieme sotto i 10 MB; niente frasi del serbatoio (con il campo «flag»). */
const VOICE_CLIPS = [];
{
  const MATD = path.join(SRC, "..", "materiali"), exd = path.join(SRC, "data/ex");
  if (fs.existsSync(exd)) {
    const { tools, CLIP_MAX, AUDIO_MAX, voiceHash } = await import("./materiali.mjs");
    const TL = tools(SRC), ctx = {};
    for (const f of fs.readdirSync(exd).filter((x) => x.endsWith(".js"))) vm.runInNewContext(fs.readFileSync(path.join(exd, f), "utf8"), ctx);
    for (const r of (ctx.FRASI_ZH || {}).righe || []) { const c = TL.check(r[0]); if (!c.ok) fail("src/data/ex/frasi-zh.js: «" + r[0] + "» ha parole fuori dal vocabolario: " + c.unknown.join("")); if (c.lv > r[2]) fail("src/data/ex/frasi-zh.js: «" + r[0] + "» è di livello " + c.lv + ", non " + r[2]); }
    let tot = 0;
    for (const [lang, name] of [["zh", "VOCE_ZH"], ["it", "VOCE_IT"]]) for (const r of (ctx[name] || {}).righe || []) {
      const f = path.join(MATD, "audio", lang, r[0] + ".ogg");
      if (!fs.existsSync(f)) fail("materiali/audio/" + lang + "/" + r[0] + ".ogg manca (è nell'indice)");
      const b = fs.statSync(f).size; if (b > CLIP_MAX) fail("materiali/audio/" + lang + "/" + r[0] + ".ogg supera i 60 KB");
      if (lang === "zh") { const c = TL.check(r[2]); if (!c.ok) fail("src/data/ex/voce-zh.js: «" + r[2] + "» ha parole fuori dal vocabolario"); }
      tot += b;
      /* il catalogo (src/data/ex/voci-file.js) deve avere l'impronta di adesso: il file in dist/ porta quella nel nome */
      const h = ((ctx.VOICE_FILES || {})[lang] || {})[r[0]], buf = fs.readFileSync(f);
      if (h !== voiceHash(buf)) fail("src/data/ex/voci-file.js non è aggiornato per " + lang + "/" + r[0] + " (node tools/materiali.mjs)");
      VOICE_CLIPS.push([lang, r[0] + "." + h + ".ogg", buf]);
    }
    if (tot > AUDIO_MAX) fail("le voci superano i 10 MB: " + (tot / 1048576).toFixed(2) + " MB");
    /* testi graduati: stesse regole di tools/lettura.mjs */
    const rd = path.join(SRC, "data/reading"), rctx = {};
    if (fs.existsSync(rd)) for (const f of fs.readdirSync(rd).filter((x) => x.endsWith(".js"))) vm.runInNewContext(fs.readFileSync(path.join(rd, f), "utf8"), rctx);
    const { checkTexts } = await import("./lettura.mjs"), terr = checkTexts(TL, rctx.TESTI_ZH, rctx.TESTI_IT);
    if (terr.length) fail("testi graduati: " + terr.slice(0, 3).join("; "));
    /* le righe segnate «sensibile» non sono nei file «scelta» da cui nasce runtime/ (materiali/LEGGIMI-materiali.md): un
       campo «flag» nei dati vorrebbe dire che qualcuno ha copiato il serbatoio */
    for (const n of ["FRASI_ZH", "FRASI_IT"]) if (((ctx[n] || {}).campi || []).includes("flag")) fail("src/data/ex: " + n + " ha il campo «flag»: si usano solo le frasi scelte");
  }
}

/* niente segreti né dati di donatori nell'app: nessun file di chiave nel repository, e in src/ nessuna chiave privata,
   nessun token o indirizzo di webhook, nessun campo delle notifiche di Ko-fi (quelli vivono solo in lo strumento di emissione
   e sul computer dell'autore). Lo stesso controllo si ripete sul file unico, più sotto. */
const SECRET = [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, /verification_token/i, /kofi_transaction_id/i, /webhook/i];
{
  const skip = new Set([".git", "node_modules", "build", ".gradle", ".idea", "music"]);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => skip.has(e.name) ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const keyFiles = walk(path.join(SRC, "..")).filter((f) => /\.(pem|key|p8|jks|keystore)$/i.test(f));
  if (keyFiles.length) fail("file di chiave nel repository (vanno fuori, vedi docs/sigilli.md): " + keyFiles.map((f) => path.relative(path.join(SRC, ".."), f)).join(", "));
  const bad = walk(SRC).filter((f) => /\.(js|html|json|css|txt|md)$/.test(f) && SECRET.some((re) => re.test(fs.readFileSync(f, "utf8"))));
  if (bad.length) fail("in src/ c'è qualcosa che sembra un segreto o un dato dei donatori: " + bad.map((f) => path.relative(SRC, f)).join(", "));
}

/* 3. un file unico */
let out = html;
const css = styles.map((s) => "/* ---- styles/" + s.href.replace(/^styles\//, "") + " ---- */\n" + fs.readFileSync(path.join(SRC, s.href), "utf8").trimEnd()).join("\n\n");
styles.forEach((s, i) => { out = out.replace(s.tag + "\n", () => (i ? "" : "<style>\n" + css + "\n</style>\n")); });
out = out.replace(/<!-- Stili: [^\n]*-->\n/, "");
/* dati pesanti che servono solo più tardi (frasi d'esempio, tratti della lavagna): nel file unico non sono JavaScript da
   compilare all'avvio ma JSON dentro <script type="application/json">, letto la prima volta che il codice tocca EXAMPLES,
   STROKES o IT_LEXICON (il lessico del corso di italiano). Su un telefono lento l'avvio risparmia così il parsing di ~700 KB. (Da src/, senza build, restano script normali.) */
const LAZY = [["EXAMPLES", (s) => s.startsWith("data/examples/")], ["STROKES", (s) => s === "data/strokes.js"], ["IT_LEXICON", (s) => s === "data/it/lexicon.js"], ["ANATOMY", (s) => s === "data/anatomy.js"], ["FRASI_ZH", (s) => s === "data/ex/frasi-zh.js"], ["FRASI_IT", (s) => s === "data/ex/frasi-it.js"], ["VOCE_ZH", (s) => s === "data/ex/voce-zh.js"], ["VOCE_IT", (s) => s === "data/ex/voce-it.js"], ["INSIEMI", (s) => s === "data/ex/insiemi.js"], ["VOICE_FILES", (s) => s === "data/ex/voci-file.js"], ["TESTI_ZH", (s) => s === "data/reading/testi-zh.js"], ["TESTI_IT", (s) => s === "data/reading/testi-it.js"]];
for (const [name, test] of LAZY) {
  const group = scripts.filter((s) => test(s.src)); if (!group.length) continue;
  const lctx = vm.createContext({});
  group.forEach((s) => vm.runInContext(fs.readFileSync(path.join(SRC, s.src), "utf8"), lctx));
  const val = vm.runInContext(name, lctx), extra = name === "STROKES" ? "var STROKES_A = " + JSON.stringify(vm.runInContext("STROKES_A", lctx)) + ";\n" : "";
  const json = JSON.stringify(val).replace(/</g, "\\u003c");
  const id = "lazy-" + name.toLowerCase();
  const block = '<script type="application/json" id="' + id + '">' + json + "</script>\n<script>\n/* ---- " + name + " (lazy, da " + group.map((s) => s.src).join(", ") + ") ---- */\n" + extra +
    "(function () { var v; Object.defineProperty(window, " + JSON.stringify(name) + ", { configurable: true, get: function () { if (v === undefined) { var el = document.getElementById(" + JSON.stringify(id) + "); v = el ? JSON.parse(el.textContent) : {}; if (el) el.parentNode.removeChild(el); } return v; } }); })();\n</script>";
  group.forEach((s, i) => { out = out.replace(s.tag + "\n", () => (i ? "" : block + "\n")); });
  scripts.splice(0, scripts.length, ...scripts.filter((s) => !test(s.src)));
}
/* librerie di terzi che servono di rado (la lettura dei QR dalla fotocamera): testo inerte nel file unico, eseguito la prima
   volta che il codice tocca la variabile globale (window.jsQR). */
const LAZYCODE = [["jsQR", "vendor/jsqr.min.js"]];
for (const [name, src] of LAZYCODE) {
  const s = scripts.find((x) => x.src === src); if (!s) continue;
  const code = fs.readFileSync(path.join(SRC, src), "utf8").trimEnd().replace(/<\/script/gi, "<\\/script");
  const id = "lazy-code-" + name.toLowerCase();
  out = out.replace(s.tag, () => '<script type="text/plain" id="' + id + '">\n' + code + "\n</script>\n<script>\n/* ---- " + src + " (lazy) ---- */\n" +
    "(function () { Object.defineProperty(window, " + JSON.stringify(name) + ", { configurable: true, get: function () { delete window[" + JSON.stringify(name) + "]; var el = document.getElementById(" + JSON.stringify(id) + "), sc = document.createElement(\"script\"); sc.textContent = el ? el.textContent : \"\"; document.head.appendChild(sc); return window[" + JSON.stringify(name) + "]; } }); })();\n</script>");
  scripts.splice(scripts.indexOf(s), 1);
}
/* moduli dell'app che servono solo a qualcuno e solo in certi momenti (il test di livello, il correttore di frasi italiane):
   testo inerte nel file unico, eseguito la prima volta che il codice tocca una delle loro proprietà di CP. Il blocco va al
   posto dell'ultimo file del gruppo, quando CP esiste già. */
const LAZYMOD = [{ props: ["placement", "onboarding"], files: ["data/placement.js", "ui/placement.js", "ui/onboarding.js"] }, { props: ["itCheck", "itCheckHTML"], files: ["it/checker.js"] }, { props: ["challenge", "classroom"], files: ["i18n/together.js", "ui/challenge.js", "ui/classroom.js"] }, { props: ["credits"], files: ["i18n/credits-t12.js", "ui/credits.js"] }, { props: ["shareCard"], files: ["ui/share-card.js"] }, { props: ["voiceDl"], files: ["i18n/voice.js", "ui/voice-dl.js"] }];
for (const m of LAZYMOD) {
  const group = m.files.map((f) => scripts.find((x) => x.src === f)); if (group.some((x) => !x)) fail("LAZYMOD: manca uno di " + m.files.join(", ") + " in src/index.html");
  const code = group.map((x) => "/* ---- " + x.src + " ---- */\n" + fs.readFileSync(path.join(SRC, x.src), "utf8").trimEnd()).join("\n").replace(/<\/script/gi, "<\\/script");
  const id = "lazy-mod-" + m.props[0].toLowerCase(), last = group[group.length - 1];
  group.forEach((x) => { if (x !== last) out = out.replace(x.tag + "\n", ""); });
  out = out.replace(last.tag, () => '<script type="text/plain" id="' + id + '">\n' + code + "\n</script>\n<script>\n/* ---- " + m.files.join(" + ") + " (al primo uso di CP." + m.props.join(", CP.") + ") ---- */\n" +
    "(function () { var P = " + JSON.stringify(m.props) + ", done = false; function load() { if (done) return; done = true; P.forEach(function (p) { delete CP[p]; }); var el = document.getElementById(" + JSON.stringify(id) + "), sc = document.createElement(\"script\"); sc.textContent = el ? el.textContent : \"\"; document.head.appendChild(sc); if (el) el.parentNode.removeChild(el); }\n" +
    "  P.forEach(function (p) { Object.defineProperty(CP, p, { configurable: true, enumerable: true, get: function () { load(); return CP[p]; } }); }); })();\n</script>");
  group.forEach((x) => scripts.splice(scripts.indexOf(x), 1));
}
/* COURSE_IT: il corso di italiano per chi parla cinese (testi, carta «今天», corso) serve solo a chi lo ha scelto. Nel file
   unico questi file restano testo (type="text/plain") e si eseguono al loro posto, in ordine, solo se cp-course è "it":
   chi studia cinese non li compila all'avvio. Il comportamento è identico a quello degli script normali. */
const COURSE_IT = ["i18n/it-course.js", "it/today.js", "it/course.js", "it/esercizi.js", "it/lettura.js"];
for (const f of COURSE_IT) {
  const sc = scripts.find((x) => x.src === f); if (!sc) fail("COURSE_IT: manca " + f + " in src/index.html");
  const code = fs.readFileSync(path.join(SRC, f), "utf8").trimEnd().replace(/<\/script/gi, "<\\/script"), id = "course-it-" + f.replace(/[^a-z0-9]+/gi, "-");
  out = out.replace(sc.tag, () => '<script type="text/plain" id="' + id + '">\n' + code + "\n</script>\n<script>/* ---- " + f + " (solo nel corso di italiano) ---- */" +
    "(function () { var c = null; try { c = localStorage.getItem(\"cp-course\"); } catch (e) {} var el = document.getElementById(" + JSON.stringify(id) + "); if (c === \"it\" && el) { var s = document.createElement(\"script\"); s.textContent = el.textContent; document.head.appendChild(s); } if (el) el.parentNode.removeChild(el); })();</script>");
  scripts.splice(scripts.indexOf(sc), 1);
}
/* GROUPS: gruppi di moduli caricati al primo uso, generalizzando COURSE_IT. Nel file unico i file restano testo
   (type="text/plain") e non si compilano all'avvio; window.__mdLoad[NOME]() li esegue tutti, in ordine, una volta sola
   (CP.ex.carica in ui/ex-stub.js). Da src/, senza build, sono script normali e __mdLoad non c'è. */
const GROUPS = [{ name: "ESERCIZI", files: ["i18n/exercises.js", "core/typing.js", "study/distractors.js", "study/exercises.js", "study/ex-frasi.js", "study/ex-varie.js", "study/guided.js", "phrases/reading.js"] }];
for (const g of GROUPS) {
  const group = g.files.map((f) => scripts.find((x) => x.src === f)); if (group.some((x) => !x)) fail("GROUPS " + g.name + ": manca uno di " + g.files.join(", ") + " in src/index.html");
  const ids = [];
  group.forEach((sc, i) => {
    const code = fs.readFileSync(path.join(SRC, sc.src), "utf8").trimEnd().replace(/<\/script/gi, "<\\/script"), id = "group-" + g.name.toLowerCase() + "-" + i;
    ids.push(id);
    const loader = i === group.length - 1 ? "\n<script>/* ---- gruppo " + g.name + " (" + g.files.join(", ") + "): al primo uso ---- */(function () { var done = false, ids = " + JSON.stringify(ids) + "; (window.__mdLoad = window.__mdLoad || {})[" + JSON.stringify(g.name) + "] = function () { if (done) return; done = true; ids.forEach(function (id) { var el = document.getElementById(id), s = document.createElement(\"script\"); s.textContent = el ? el.textContent : \"\"; document.head.appendChild(s); if (el) el.parentNode.removeChild(el); }); }; })();</script>" : "";
    out = out.replace(sc.tag, () => '<script type="text/plain" id="' + id + '">\n/* ---- ' + sc.src + " ---- */\n" + code + "\n</script>" + loader);
  });
  group.forEach((x) => scripts.splice(scripts.indexOf(x), 1));
}
for (const s of scripts) {
  const code = fs.readFileSync(path.join(SRC, s.src), "utf8").trimEnd().replace(/<\/script/gi, "<\\/script");
  out = out.replace(s.tag, () => "<script" + (s.id ? ' id="' + s.id + '"' : "") + ">\n/* ---- " + s.src + " ---- */\n" + code + "\n</script>");   /* funzione: i «$» nel codice restano com'erano */
}
out = out.replace(/<!-- =+\n[\s\S]*?=+ -->\n/, "<!-- màndarínō: file generato da tools/build.mjs a partire da src/. Per modificare l'app lavora in src/. -->\n");
if (/<script\b[^>]*\bsrc=|<link\b[^>]*rel="stylesheet"/.test(out)) fail("è rimasto un riferimento esterno in dist/index.html");
if (SECRET.some((re) => re.test(out))) fail("dist/index.html contiene qualcosa che sembra un segreto o un dato dei donatori");

/* i brani del jukebox restano file a parte, con l'impronta nel nome (dist/audio/music/<id>.<hash>.ogg): un brano sostituito
   ha un nome nuovo e arriva anche a chi aveva già quello vecchio nella cache. Il catalogo (nome del file, byte) va nella
   pagina come window.MUSIC_FILES: da lì il riproduttore sa che file chiedere e quanti MB mancano. */
const MUS = path.join(SRC, "audio/music"), ogg = fs.existsSync(MUS) ? fs.readdirSync(MUS).filter((f) => f.endsWith(".ogg")) : [], MUSIC = {}, MUSICB = [];
for (const f of ogg) {
  const b = fs.readFileSync(path.join(MUS, f));
  if (b.length > 25 * 1024 * 1024) fail(`src/audio/music/${f} supera i 25 MB (limite di Cloudflare Pages)`);
  const id = f.replace(/\.ogg$/, ""), name = id + "." + crypto.createHash("sha256").update(b).digest("hex").slice(0, 8) + ".ogg";
  MUSICB.push([name, b]); MUSIC[id] = [name, b.length];
}
/* lo stesso per i «nomi e termini» del Lettore (tools/wikidict.mjs) */
const WIKI = path.join(SRC, "data/wiki/zh-it.txt"), WIKIB = fs.existsSync(WIKI) ? fs.readFileSync(WIKI) : null;
const WIKIF = WIKIB ? "zh-it." + crypto.createHash("sha256").update(WIKIB).digest("hex").slice(0, 8) + ".txt" : "";
out = out.replace("<head>", () => "<head>\n<script>window.MUSIC_FILES = " + JSON.stringify(MUSIC) + "; window.WIKI_FILE = " + JSON.stringify(WIKIF ? "data/wiki/" + WIKIF : "") + ";</script>");
const version = crypto.createHash("sha256").update(out).digest("hex").slice(0, 12);
const sw = fs.readFileSync(path.join(SRC, "pwa/sw.js"), "utf8");
if (!sw.includes("'__APP_VERSION__'")) fail("src/pwa/sw.js deve contenere APP_VERSION = '__APP_VERSION__'");
const files = { "index.html": out, "sw.js": sw.replace("'__APP_VERSION__'", "'" + version + "'") };
for (const f of fs.readdirSync(path.join(SRC, "pwa"))) if (!/\.js$/.test(f)) files[f] = fs.readFileSync(path.join(SRC, "pwa", f));
/* «nomi e termini» del Lettore (tools/wikidict.mjs): un file a parte, scaricato solo quando serve */
if (WIKIB) files["data/wiki/" + WIKIF] = WIKIB;
for (const [name, b] of MUSICB) files["audio/music/" + name] = b;
/* le voci reali: dist/audio/voce/<lingua>/<numero>.<impronta>.ogg; nell'APK sono dentro il pacchetto, sul sito si
   scaricano solo con «Scarica le voci» (core/voice-clip.js) */
for (const [lang, name, b] of VOICE_CLIPS) files["audio/voce/" + lang + "/" + name] = b;
for (const s of scripts.filter((s) => /^audio\/tracks\/(?!index)/.test(s.src))) {
  const m = /file: true[\s\S]*?player\(c, bus, "([\w-]+)"\)/.exec(fs.readFileSync(path.join(SRC, s.src), "utf8"));
  if (m && !ogg.includes(m[1] + ".ogg")) fail(`${s.src} vuole audio/music/${m[1]}.ogg, che non c'è`);
}

if (onlyCheck) {
  /* i file pesanti (brani, voci, nomi e termini) non stanno nel repository: si generano a ogni build (CI, Cloudflare) */
  const stale = Object.keys(files).filter((f) => !/^(audio\/(music|voce)|data\/wiki)\//.test(f)).filter((f) => { const p = path.join(OUT, f); return !fs.existsSync(p) || !Buffer.from(files[f]).equals(fs.readFileSync(p)); });
  if (stale.length) fail("dist/ non è aggiornato (" + stale.join(", ") + "): lancia «node tools/build.mjs»");
  console.log("✓ dist/ è aggiornato · versione " + version);
  process.exit(0);
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const [f, data] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true }); fs.writeFileSync(path.join(OUT, f), data); }
/* parole con lo stesso significato italiano: nelle carte italiano → cinese lo studio mette un indizio (study.js) */
{ const by = {}; for (const s of D.SECTIONS) for (const w of s.words) { const f = String(w[2]).trim().toLowerCase(); by[f] = (by[f] || 0) + 1; }
  const n = Object.values(by).filter((x) => x > 1).length; if (n) console.log("  · " + n + " gruppi di parole con lo stesso italiano: indizio nelle carte italiano → cinese"); }
console.log(`✓ dist/index.html · ${(out.length / 1024).toFixed(0)} KB · ${c.sections} sezioni, ${c.words} parole, ${c.dialogs} dialoghi, ${gv.total} frasi verificate, ${(D.LESSONS || []).length} lezioni + ${(D.ITLESSONS || []).length} 意大利语 · ${scripts.length} script, ${styles.length} fogli di stile, ${ogg.length} brani · versione ${version}`);
