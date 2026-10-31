/* màndarínō · importazione delle voci di madrelingua (Node, nessuna dipendenza). La riga di comando è tools/voice-import.mjs.
   Contesto e garanzie: docs/scambio-linguistico.md («Il filtro»). In breve: il manifest dice il testo MOSTRATO, non quello DETTO,
   e `checked`/`heard`/`match` si possono falsificare. Quindi qui si rifà tutto da capo, e NULLA entra nell'app senza
     1. validazione rigorosa del pacchetto (zip sicuro, manifest, riferimenti, testo, formato audio),
     2. trascrizione locale offline di ogni voce e confronto con il testo atteso,
     3. elenco di parole vietate (fuori dal repository),
     4. approvazione ESPLICITA di una persona, voce per voce, dopo l'ascolto.
   Questo modulo non approva mai niente: prepare() produce solo voci «da-ascoltare» o «scartata»; apply() porta in src/ soltanto
   quelle che una persona ha messo a mano su `approved: true` e il cui file ha ancora l'impronta registrata.
   Nessuna chiamata di rete, mai. I comandi esterni sono solo ffmpeg e il riconoscitore scelto da chi gestisce il progetto. */
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { execFileSync } from "child_process";
import { load as loadData } from "./data.mjs";
import { readZip, ZipError, LIMITS } from "./zip.mjs";
import { score as scoreOf, readingsFrom } from "./voice-score.mjs";
import { goodNick, addNicks } from "./credits.mjs";

export const MAX_MS = 8500, MAX_ITEMS = 200, LOW = 0.8, MIN_DEFAULT = 0.6, STT_TIMEOUT = 60000;
export const LANGS = { "zh-CN": { lang: "zh", locale: "zh-CN" }, "it-IT": { lang: "it", locale: "it-IT" } };
/* estensione → firma dei primi byte (e dove) */
export const MAGIC = { ".ogg": { at: 0, hex: "4f676753" }, ".webm": { at: 0, hex: "1a45dfa3" }, ".m4a": { at: 4, hex: "66747970" }, ".mp4": { at: 4, hex: "66747970" } };
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const sig = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };   /* come sig() in src/ui/scambio.js */
const cleanLine = (s, n = 400) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const mdCell = (s) => cleanLine(s).replace(/[\\|`<>\[\]]/g, (c) => c === "<" ? "&lt;" : c === ">" ? "&gt;" : "\\" + c);

/* ---------- i dati dell'app: che cosa dicono oggi i riferimenti ---------- */
export function loadRefs(srcDir) {
  const D = loadData(srcDir), gloss = (it) => String(it).split(/[;,(:]/)[0].trim();   /* come CP.gloss */
  const words = new Map();
  for (const s of D.SECTIONS) for (const w of s.words) { const a = words.get(w[1]) || []; a.push(gloss(w[2])); words.set(w[1], a); }
  const own = (o, k) => o && Object.prototype.hasOwnProperty.call(o, k);
  /* i testi attuali di un riferimento: { zh: [..], it: [..] } oppure null se il riferimento non esiste */
  function resolve(ref) {
    if (typeof ref !== "string" || ref.length > 120) return null;
    let m;
    if ((m = /^w:(.+)$/.exec(ref))) { const g = words.get(m[1]); return g ? { zh: [m[1]], it: g } : null; }
    if ((m = /^ex:(.+)$/.exec(ref))) { const e = own(D.EXAMPLES, m[1]) ? D.EXAMPLES[m[1]] : null; return e ? { zh: [e[0]], it: [e[1]] } : null; }
    if ((m = /^phr:(\d{1,6}):(\d{1,6})$/.exec(ref))) { const p = D.PHRASES && D.PHRASES[+m[1]] && D.PHRASES[+m[1]].items[+m[2]]; return p ? { zh: [p[1]], it: [p[2]] } : null; }
    if ((m = /^dlg:([^:]{1,60}):(\d{1,6})$/.exec(ref))) { const d = D.DIALOGS.find((x) => x.id === m[1]), l = d && d.lines[+m[2]]; return l ? { zh: [l[2]], it: [l[3]] } : null; }
    return null;
  }
  return { resolve, readings: readingsFrom(D.SECTIONS) };
}

/* ---------- pezzi di validazione ---------- */
export const cleanNick = (n) => (typeof n === "string" && goodNick(n) ? n.trim() : "");
export function cleanRegion(r) {
  if (typeof r === "number" && Number.isFinite(r)) return String(r);
  return typeof r === "string" && r.trim().length >= 1 && r.trim().length <= 40 && !/[<>\u0000-\u001f]/.test(r) ? r.trim() : "";
}
export function audioProblem(ext, data) {
  const m = MAGIC[ext]; if (!m) return "estensione non ammessa";
  if (data.length < 16) return "file audio troppo corto";
  if (data.subarray(m.at, m.at + 4).toString("hex") !== m.hex) return "i primi byte non sono quelli di un file " + ext + " (formato non coerente)";
  return "";
}

/* metadati di una voce del manifest, senza guardare l'audio. Restituisce { why } (scartata) oppure { clean } */
export function checkItem(it, refs) {
  if (!it || typeof it !== "object" || Array.isArray(it)) return { why: "voce non valida" };
  if (typeof it.ref !== "string") return { why: "manca ref" };
  const r = refs.resolve(it.ref); if (!r) return { why: "il riferimento «" + cleanLine(it.ref, 60) + "» non esiste nei dati" };
  if (!Object.prototype.hasOwnProperty.call(LANGS, it.lang)) return { why: "lingua non ammessa (solo zh-CN e it-IT)" };
  if (typeof it.native !== "boolean") return { why: "«native» deve essere vero o falso" };
  if (typeof it.text !== "string") return { why: "manca il testo" };
  if (!r[it.lang === "zh-CN" ? "zh" : "it"].includes(it.text)) return { why: "testo cambiato: non è più quello di " + cleanLine(it.ref, 60) };
  if (typeof it.ms !== "number" || !Number.isFinite(it.ms) || it.ms <= 0 || it.ms > MAX_MS) return { why: "durata fuori limite (al massimo " + MAX_MS + " ms)" };
  if (typeof it.file !== "string" || !it.file) return { why: "manca il nome del file" };
  const ext = path.extname(it.file).toLowerCase(); if (!MAGIC[ext]) return { why: "estensione non ammessa (solo .ogg, .webm, .m4a, .mp4)" };
  return { clean: { ref: it.ref, lang: it.lang, native: it.native, text: it.text, ms: Math.round(it.ms), file: it.file, ext, speaker: cleanNick(it.speaker), region: cleanRegion(it.region) } };
}

/* ---------- 1. il pacchetto: zip sicuro + manifest ---------- */
export function readPackage(zipPath, refs) {
  const name = path.basename(zipPath), res = { name, sha256: "", status: "ok", reason: "", speaker: "", items: [] };
  const refuse = (why) => { res.status = "rifiutato"; res.reason = why; return res; };
  let buf;
  try { const st = fs.statSync(zipPath); if (!st.isFile()) return refuse("non è un file"); if (st.size > LIMITS.zipBytes) return refuse("il file .zip pesa troppo"); buf = fs.readFileSync(zipPath); }
  catch (e) { return refuse("file illeggibile: " + e.message); }
  res.sha256 = sha256(buf);
  let entries;
  try { entries = readZip(buf); } catch (e) { if (e instanceof ZipError) return refuse("zip non sicuro: " + e.message); throw e; }
  const man = entries.find((e) => e.name === "manifest.json");
  if (!man) return refuse("manca manifest.json");
  let M;
  try { M = JSON.parse(man.data.toString("utf8").replace(/^﻿/, "")); } catch (e) { return refuse("manifest.json non è JSON valido"); }
  if (!M || typeof M !== "object" || Array.isArray(M)) return refuse("manifest.json non valido");
  if (M.schema !== "mandarino-voice/1") return refuse("schema diverso da mandarino-voice/1");
  if (M.license !== "CC-BY-4.0") return refuse("licenza diversa da CC-BY-4.0");
  if (M.adult !== true) return refuse("manca la dichiarazione di maggiore età (adult: true)");
  if (!Array.isArray(M.items) || !M.items.length) return refuse("nessuna voce nel manifest");
  if (M.items.length > MAX_ITEMS) return refuse("troppe voci (" + M.items.length + ", al massimo " + MAX_ITEMS + ")");
  /* solo i file elencati nel manifest (più manifest.json): un file in più è un pacchetto che l'app non ha fatto */
  const listed = new Set(M.items.map((x) => (x && typeof x.file === "string" ? x.file : null)).filter(Boolean));
  const extra = entries.filter((e) => e.name !== "manifest.json" && !listed.has(e.name)).map((e) => e.name);
  if (extra.length) return refuse("file non elencati nel manifest: " + extra.slice(0, 3).map((x) => cleanLine(x, 60)).join(", ") + (extra.length > 3 ? "…" : ""));
  const top = cleanNick(M.speaker), topRegion = cleanRegion(M.region), byName = new Map(entries.map((e) => [e.name, e])), usedFile = new Set();
  res.speaker = top;
  M.items.forEach((raw, i) => {
    const c = checkItem(raw, refs), item = { n: i, ref: raw && typeof raw.ref === "string" ? cleanLine(raw.ref, 120) : "", lang: raw && LANGS[raw.lang] ? raw.lang : "", text: "", native: !!(raw && raw.native === true), ms: 0, speaker: "", region: "", data: null, ext: "", why: "" };
    if (!c.clean) { item.why = c.why; res.items.push(item); return; }
    Object.assign(item, c.clean, { speaker: c.clean.speaker || top, region: c.clean.region || topRegion });
    if (usedFile.has(c.clean.file)) { item.why = "lo stesso file è usato da due voci"; res.items.push(item); return; }
    usedFile.add(c.clean.file);
    const e = byName.get(c.clean.file);
    if (!e) { item.why = "file audio mancante nel pacchetto"; res.items.push(item); return; }
    const bad = audioProblem(c.clean.ext, e.data);
    if (bad) { item.why = bad; res.items.push(item); return; }
    item.data = e.data;
    res.items.push(item);
  });
  return res;
}

/* ---------- 2. trascrizione locale ---------- */
/* "comando {file} --lingua {lang}" → ["comando", "{file}", …]: spazi e virgolette, nessuna shell (niente ; | & $ ` che contino qualcosa) */
export function tokenize(cmd) {
  const out = []; let cur = "", q = "", has = false;
  for (const ch of String(cmd)) {
    if (q) { if (ch === q) q = ""; else cur += ch; }
    else if (ch === '"' || ch === "'") { q = ch; has = true; }
    else if (/\s/.test(ch)) { if (cur || has) out.push(cur); cur = ""; has = false; }
    else cur += ch;
  }
  if (q) throw new Error("virgolette non chiuse nel comando --stt");
  if (cur || has) out.push(cur);
  return out;
}
/* sostituisce {file}, {lang} (zh|it), {locale} (zh-CN|it-IT) con valori già controllati: mai testo preso dal manifest */
export function sttArgv(template, file, locale) {
  const t = tokenize(template); if (!t.length) throw new Error("comando --stt vuoto");
  if (!t.some((x) => x.includes("{file}"))) throw new Error("il comando --stt deve contenere {file}");
  if (!Object.prototype.hasOwnProperty.call(LANGS, locale)) throw new Error("lingua non ammessa");
  const sub = (x) => x.split("{file}").join(file).split("{locale}").join(LANGS[locale].locale).split("{lang}").join(LANGS[locale].lang);
  return [t[0] === "node" ? process.execPath : t[0], ...t.slice(1).map(sub)];
}
/* l'uscita di un riconoscitore → una riga di testo (toglie i tempi «[00:00.000 --> 00:02.000]» che stampano whisper e simili) */
export function cleanTranscript(out) {
  return cleanLine(String(out || "").split(/\r?\n/).map((l) => l.replace(/^\s*\[[^\]]*-->[^\]]*\]\s*/, "").trim()).filter(Boolean).join(" "));
}
const run = (prog, args, opt = {}) => execFileSync(prog, args, { encoding: "utf8", timeout: STT_TIMEOUT, maxBuffer: 4 << 20, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], ...opt });
let FF = null;
export function hasFfmpeg() { if (FF === null) { try { run("ffmpeg", ["-version"], { timeout: 15000 }); FF = true; } catch (e) { FF = false; } } return FF; }
function wavOf(file, outDir) {
  const out = path.join(outDir, path.basename(file).replace(/\.[^.]+$/, "") + ".wav");
  run("ffmpeg", ["-nostdin", "-loglevel", "error", "-y", "-i", file, "-ar", "16000", "-ac", "1", out]);
  return out;
}
/* riconoscitori che si trovano nel PATH (si propone il comando, non si esegue) */
export function findRecognizers(env = process.env) {
  const exts = process.platform === "win32" ? (env.PATHEXT || ".EXE;.CMD").split(";").concat([""]) : [""], dirs = String(env.PATH || env.Path || "").split(path.delimiter).filter(Boolean), found = [];
  for (const n of ["faster-whisper", "whisper-ctranslate2", "whisper"]) {
    if (dirs.some((d) => exts.some((x) => { try { return fs.statSync(path.join(d, n + x.toLowerCase())).isFile() || fs.statSync(path.join(d, n + x)).isFile(); } catch (e) { return false; } }))) found.push(n);
  }
  return found;
}
export function suggestStt(name, reviewDir) {
  const tmp = path.join(reviewDir, ".stt");
  if (name === "whisper") return `whisper "{file}" --language {lang} --model small --fp16 False --output_format txt --output_dir "${tmp}"`;
  return `${name} "{file}" --language {lang} --model small --local_files_only True`;
}

/* ---------- 3. elenco di parole vietate ---------- */
const normLatin = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const cjkOnly = (s) => Array.from(String(s || "")).filter((c) => /[㐀-鿿]/.test(c)).join("");
export function loadBlocklist(file, repoRoot) {
  const abs = path.resolve(file);
  if (repoRoot) { const rel = path.relative(path.resolve(repoRoot), abs); if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) throw new Error("l'elenco di parole vietate deve stare FUORI dal repository (contiene insulti): " + abs); }
  const terms = [];
  fs.readFileSync(abs, "utf8").replace(/^﻿/, "").split(/\r?\n/).forEach((l, i) => {
    l = l.trim(); if (!l || l.startsWith("#")) return;
    const zh = cjkOnly(l), la = normLatin(l);
    if (zh) terms.push({ line: i + 1, zh }); else if (la) terms.push({ line: i + 1, la });
  });
  return terms;
}
/* la riga dell'elenco che compare nel testo sentito (sottostringa su testo normalizzato; per il cinese sui soli caratteri), oppure 0 */
export function blockedBy(text, terms) {
  const la = normLatin(text), zh = cjkOnly(text);
  for (const t of terms) if ((t.zh && zh.includes(t.zh)) || (t.la && la.includes(t.la))) return t.line;
  return 0;
}

/* ---------- fase 1: prepara ---------- */
export function prepare(opt) {
  const o = { ...opt, min: opt.min === undefined ? MIN_DEFAULT : opt.min }, reviewDir = path.resolve(o.reviewDir), notes = [];
  if (!o.zips || !o.zips.length) throw new Error("serve almeno un pacchetto .zip");
  if (!(o.min >= 0 && o.min <= 1)) throw new Error("--min deve essere un numero tra 0 e 1");
  const outMd = path.resolve(o.out || path.join(reviewDir, "riepilogo.md")), rel = path.relative(reviewDir, outMd);
  if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("--out deve stare dentro --review-dir: lo strumento non scrive fuori da lì");
  if (fs.existsSync(path.join(reviewDir, "review.json"))) throw new Error("in " + reviewDir + " c'è già un review.json (con le approvazioni a mano): usa un'altra cartella o toglilo tu");
  const refs = o.refs || loadRefs(path.resolve(o.src || "src"));
  const terms = o.blocklist ? loadBlocklist(o.blocklist, o.repoRoot) : null;
  const doStt = !!o.stt, ffmpeg = doStt && (o.hasFfmpeg !== undefined ? o.hasFfmpeg : hasFfmpeg());
  const runner = o.runStt || ((prog, args) => run(prog, args, { env: { ...process.env, HF_HUB_OFFLINE: "1", TRANSFORMERS_OFFLINE: "1" } }));   /* i modelli non si scaricano mai */
  fs.mkdirSync(reviewDir, { recursive: true });
  const tmpDir = path.join(reviewDir, ".stt");
  const packages = [], items = [], seenAudio = new Map();
  let idx = 0;
  for (const z of o.zips) {
    const pk = readPackage(z, refs);
    packages.push({ name: pk.name, sha256: pk.sha256, status: pk.status, reason: pk.reason, speaker: pk.speaker, items: pk.items.length });
    if (pk.status !== "ok") continue;
    for (const it of pk.items) {
      const rec = { id: idx++, ref: it.ref, lang: it.lang, text: it.text, heard: null, score: null, status: "scartata", reason: "", priorita: null, file: null, sha256: null, native: it.native, ms: it.ms, speaker: it.speaker, region: it.region, package: pk.name, approved: false, note: "" };
      items.push(rec);
      if (!it.data) { rec.reason = it.why; continue; }
      const h = sha256(it.data), dup = seenAudio.get(h + "|" + it.ref + "|" + it.lang + "|" + it.native);
      if (dup !== undefined) { rec.reason = "doppione della voce " + dup; continue; }
      seenAudio.set(h + "|" + it.ref + "|" + it.lang + "|" + it.native, rec.id);
      rec.file = rec.id + "-" + h.slice(0, 8) + it.ext; rec.sha256 = h;
      fs.writeFileSync(path.join(reviewDir, rec.file), it.data);
      /* trascrizione */
      if (doStt) {
        try {
          let f = path.join(reviewDir, rec.file);
          if (ffmpeg) { fs.mkdirSync(tmpDir, { recursive: true }); f = wavOf(f, tmpDir); }
          const argv = sttArgv(o.stt, f, it.lang), txt = cleanTranscript(runner(argv[0], argv.slice(1)));
          if (txt) rec.heard = txt; else rec.reason = "nessun testo riconosciuto";
        } catch (e) { rec.reason = "trascrizione non riuscita: " + cleanLine(e && e.code === "ETIMEDOUT" ? "tempo scaduto (60 s)" : (e && e.message) || e, 160); }
      }
      if (rec.heard !== null) rec.score = Math.round(scoreOf(it.text, rec.heard, it.lang, refs.readings) * 1000) / 1000;
      const line = terms && rec.heard !== null ? blockedBy(rec.heard, terms) : 0;
      if (line) { rec.reason = "contiene una parola dell'elenco vietato (riga " + line + ")"; continue; }
      if (rec.score !== null && rec.score < o.min) { rec.reason = "la trascrizione non somiglia al testo (punteggio " + rec.score.toFixed(2) + " < " + o.min + ")"; continue; }
      rec.status = "da-ascoltare";
      rec.priorita = rec.heard === null || rec.score < LOW || !rec.native ? "alta" : "normale";
      if (!rec.reason && rec.heard === null) rec.reason = doStt ? "non trascritta" : "senza trascrizione";
      if (!rec.native && !rec.reason) rec.reason = "non madrelingua";
    }
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
  const review = { schema: "mandarino-voice-review/1", created: (o.now ? o.now() : new Date()).toISOString(), min: o.min, stt: doStt, blocklist: !!terms, packages, items };
  fs.writeFileSync(path.join(reviewDir, "review.json"), JSON.stringify(review, null, 1) + "\n");
  const md = summary(review, { outMd, reviewDir, recognizers: doStt ? [] : (o.recognizers || findRecognizers()), nStt: ffmpeg });
  fs.writeFileSync(outMd, md);
  return { review, md, reviewDir, summaryPath: outMd };
}

function summary(R, c) {
  const L = [], ok = R.items.filter((x) => x.status === "da-ascoltare"), no = R.items.filter((x) => x.status === "scartata");
  const link = (f) => f ? "[ascolta](" + encodeURI(path.relative(path.dirname(c.outMd), path.join(c.reviewDir, f)).split(path.sep).join("/")) + ")" : "—";
  L.push("# Voci · riepilogo della revisione", "");
  L.push(`${R.packages.length} pacchetti · ${R.items.length} voci · **${ok.length} da ascoltare** · ${no.length} scartate · ${R.packages.filter((p) => p.status !== "ok").length} pacchetti rifiutati`, "");
  if (!R.stt) {
    L.push("> **ATTENZIONE: nessuna trascrizione.** Senza `--stt` lo strumento non sa che cosa dica davvero ogni registrazione: **tutte** le voci vanno ascoltate per intero, una per una, e `checked`/`heard` del manifest non contano (si possono falsificare).");
    if (c.recognizers && c.recognizers.length) L.push(">", "> Nel PATH ho trovato: " + c.recognizers.map((n) => "`" + n + "`").join(", ") + ". Un comando da provare (non l'ho eseguito, controllalo con la tua installazione):", ">", "> `" + suggestStt(c.recognizers[0], c.reviewDir) + "`", ">", "> Si passa con `--stt \"<comando>\"`; `{file}` e `{lang}` (zh o it) li riempie lo strumento. I modelli vanno già scaricati: lo strumento non scarica nulla.");
    else L.push(">", "> Nel PATH non ho trovato `faster-whisper`, `whisper-ctranslate2` né `whisper`. Installane uno (a mano, con il modello già scaricato) e rilancia con `--stt \"<comando>\"`.");
    L.push("");
  } else if (!c.nStt) L.push("> Avviso: ffmpeg non è nel PATH, il riconoscitore ha ricevuto i file originali (non convertiti in wav 16 kHz): se la trascrizione è scarsa, installa ffmpeg.", "");
  if (!R.blocklist) L.push("> **ATTENZIONE: il controllo delle parole vietate NON è stato fatto** (manca `--blocklist elenco.txt`, un file fuori dal repository con una parola o frase per riga).", "");
  L.push("Per approvare: ascolta ogni voce, poi in `review.json` metti `\"approved\": true` **a mano** sulle sole voci giuste (`note` è libero). Poi: `node tools/voice-import.mjs --apply " + path.join(c.reviewDir, "review.json").replace(/\\/g, "/") + "`. Nessuna voce è approvata da questo strumento. Priorità alta = non trascritta, punteggio sotto " + LOW + " o non madrelingua.", "");
  const bad = R.packages.filter((p) => p.status !== "ok");
  if (bad.length) { L.push("## Pacchetti rifiutati", ""); bad.forEach((p) => L.push(`- ${mdCell(p.name)}: ${mdCell(p.reason)}`)); L.push(""); }
  if (ok.length) {
    const ord = ok.slice().sort((a, b) => (a.priorita === b.priorita ? 0 : a.priorita === "alta" ? -1 : 1) || (a.score === null ? -1 : b.score === null ? 1 : a.score - b.score) || a.id - b.id);
    L.push("## Da ascoltare", "", "| Priorità | # | Rif. | Lingua | Atteso | Sentito | Punt. | Madrelingua | ms | Ascolto | Nota |", "|---|---|---|---|---|---|---|---|---|---|---|");
    ord.forEach((x) => L.push(`| ${x.priorita} | ${x.id} | ${mdCell(x.ref)} | ${x.lang} | ${mdCell(x.text)} | ${x.heard === null ? "—" : mdCell(x.heard)} | ${x.score === null ? "—" : x.score.toFixed(2)} | ${x.native ? "sì" : "**no**"} | ${x.ms} | ${link(x.file)} | ${mdCell(x.reason)} |`));
    L.push("");
  }
  if (no.length) {
    L.push("## Scartate", "", "| # | Rif. | Lingua | Motivo | Pacchetto | Ascolto |", "|---|---|---|---|---|---|");
    no.forEach((x) => L.push(`| ${x.id} | ${mdCell(x.ref)} | ${x.lang || "—"} | ${mdCell(x.reason)} | ${mdCell(x.package)} | ${link(x.file)} |`));
    L.push("");
  }
  return L.join("\n");
}

/* ---------- fase 2: applica ---------- */
/* il file `.ogg` della voce nel repository: <ref sanificato>-<sigla del ref>.<impronta 8>.ogg, come fname() dell'app */
export const voiceFile = (ref, hash8) => ref.replace(/[^\w.-]+/g, "_") + "-" + sig(ref) + "." + hash8 + ".ogg";

/* ffmpeg: Ogg/Opus mono, silenzi tagliati a inizio e fine, −16 LUFS, niente metadati (le registrazioni non devono portarsi dietro nulla) */
export function ffmpegConvert(inp, out) {
  const cut = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1";
  run("ffmpeg", ["-nostdin", "-loglevel", "error", "-y", "-i", inp, "-map_metadata", "-1", "-af", `${cut},areverse,${cut},areverse,loudnorm=I=-16:TP=-1.5:LRA=11`, "-ac", "1", "-c:a", "libopus", "-b:a", "24k", "-f", "ogg", out], { timeout: 120000 });
}
const byKey = (a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : a.lang < b.lang ? -1 : a.lang > b.lang ? 1 : a.native === b.native ? (a.file < b.file ? -1 : a.file > b.file ? 1 : 0) : a.native ? -1 : 1);

export function apply(opt) {
  const o = { ...opt }, srcDir = path.resolve(o.src || "src"), reviewPath = path.resolve(o.review), reviewDir = path.dirname(reviewPath);
  const log = [], skip = [];
  let R;
  try { R = JSON.parse(fs.readFileSync(reviewPath, "utf8")); } catch (e) { throw new Error("review.json illeggibile: " + e.message); }
  if (!R || R.schema !== "mandarino-voice-review/1" || !Array.isArray(R.items)) throw new Error("non è un review.json di mandarino-voice-review/1");
  const refs = o.refs || loadRefs(srcDir);
  /* solo ciò che una persona ha approvato, e che regge ancora a tutti i controlli: il review.json si modifica a mano, quindi non ci si fida di niente */
  const good = [], taken = new Map();
  for (const x of R.items) {
    if (!x || x.approved !== true) continue;
    const no = (why) => skip.push(`#${x && x.id}: ${why}`);
    if (x.status !== "da-ascoltare") { no("ignorata, lo stato è «" + cleanLine(x.status, 30) + "» (le scartate non entrano mai)"); continue; }
    const c = checkItem({ ref: x.ref, lang: x.lang, native: x.native, text: x.text, ms: x.ms, file: typeof x.file === "string" ? x.file : "", speaker: x.speaker }, refs);
    if (!c.clean) { no("rifiutata, " + c.why); continue; }
    if (typeof x.file !== "string" || !/^\d{1,6}-[0-9a-f]{8}\.(ogg|webm|m4a|mp4)$/.test(x.file)) { no("rifiutata, nome del file non valido"); continue; }
    if (typeof x.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(x.sha256) || x.file.split("-")[1].slice(0, 8) !== x.sha256.slice(0, 8)) { no("rifiutata, impronta non valida"); continue; }
    const fp = path.join(reviewDir, x.file); let data;
    try { data = fs.readFileSync(fp); } catch (e) { no("rifiutata, il file " + x.file + " non c'è più"); continue; }
    if (sha256(data) !== x.sha256) { no("rifiutata, il file " + x.file + " è cambiato dopo la preparazione (impronta diversa)"); continue; }
    if (data.length > LIMITS.fileBytes) { no("rifiutata, file troppo grande"); continue; }
    const bad = audioProblem(c.clean.ext, data); if (bad) { no("rifiutata, " + bad); continue; }
    const k = c.clean.ref + "|" + c.clean.lang + "|" + c.clean.native;
    if (taken.has(k)) { no("ignorata, per lo stesso riferimento è già approvata la voce #" + taken.get(k) + " (se ne tiene una sola)"); continue; }
    taken.set(k, x.id);
    good.push({ id: x.id, ...c.clean, speaker: cleanNick(x.speaker), data, sha: x.sha256 });
  }
  const vdir = path.join(srcDir, "audio", "voices"), idxPath = path.join(vdir, "index.json");
  let index = [];
  if (fs.existsSync(idxPath)) {
    try { index = JSON.parse(fs.readFileSync(idxPath, "utf8")); } catch (e) { throw new Error("src/audio/voices/index.json illeggibile: " + e.message); }
    if (!Array.isArray(index)) throw new Error("src/audio/voices/index.json deve essere un array");
  }
  /* che cosa c'è da convertire: quello che non è già in index.json con lo stesso file */
  const plan = good.map((g) => {
    const name = voiceFile(g.ref, g.sha.slice(0, 8)), rel = g.lang + "/" + name, have = index.find((e) => e && e.file === rel && e.ref === g.ref && e.lang === g.lang && e.native === g.native) && fs.existsSync(path.join(vdir, g.lang, name));
    return { g, name, rel, have: !!have };
  });
  const todo = plan.filter((p) => !p.have);
  let convert = o.convert;
  if (todo.length && !convert) {
    if (!(o.hasFfmpeg !== undefined ? o.hasFfmpeg : hasFfmpeg())) throw new Error("ffmpeg non è nel PATH: serve per convertire le voci in Ogg/Opus (silenzi, −16 LUFS). Non ho scritto nulla.");
    convert = ffmpegConvert;
  }
  /* si converte tutto in una cartella temporanea PRIMA di toccare src/: se una conversione fallisce non resta niente a metà */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "md-voice-")), done = [];
  try {
    for (const p of todo) {
      const inp = path.join(tmp, "in-" + p.g.id + p.g.ext), out = path.join(tmp, "out-" + p.g.id + ".ogg");
      fs.writeFileSync(inp, p.g.data);
      try { convert(inp, out); } catch (e) { throw new Error("conversione fallita per #" + p.g.id + " (" + p.g.ref + "): " + cleanLine(e && e.message, 200) + ". Non ho scritto nulla."); }
      let b; try { b = fs.readFileSync(out); } catch (e) { throw new Error("la conversione di #" + p.g.id + " non ha prodotto il file. Non ho scritto nulla."); }
      if (!b.length || b.length > LIMITS.fileBytes || b.subarray(0, 4).toString("latin1") !== "OggS") throw new Error("la conversione di #" + p.g.id + " non ha prodotto un Ogg valido. Non ho scritto nulla.");
      done.push({ p, b });
    }
    for (const { p, b } of done) {
      const g = p.g, old = index.filter((e) => e && e.ref === g.ref && e.lang === g.lang && e.native === g.native && e.file !== p.rel);
      index = index.filter((e) => !old.includes(e));
      for (const e of old) { const f = path.resolve(vdir, String(e.file)); if (f.startsWith(path.resolve(vdir) + path.sep) && fs.existsSync(f)) { fs.rmSync(f); log.push(`sostituita la voce precedente di ${g.ref}: ${e.file}`); } }
      fs.mkdirSync(path.join(vdir, g.lang), { recursive: true });
      fs.writeFileSync(path.join(vdir, p.rel), b);
      index.push({ ref: g.ref, lang: g.lang, file: p.rel, bytes: b.length, sha256: sha256(b), native: g.native, ms: g.ms });
      log.push(`applicata #${g.id} ${g.ref} (${g.lang}${g.native ? "" : ", non madrelingua"}) → ${p.rel}`);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  for (const p of plan.filter((q) => q.have)) log.push(`già presente #${p.g.id} ${p.g.ref} → ${p.rel}`);
  index.sort(byKey);
  if (done.length || fs.existsSync(idxPath) || plan.length) { fs.mkdirSync(vdir, { recursive: true }); const txt = JSON.stringify(index, null, 1) + "\n"; if (!fs.existsSync(idxPath) || fs.readFileSync(idxPath, "utf8") !== txt) fs.writeFileSync(idxPath, txt); }
  /* Crediti: solo se il manifest aveva un nickname (cioè il permesso) e almeno una sua voce è entrata */
  const nicks = [...new Set(plan.map((p) => p.g.speaker).filter(Boolean))];
  const credited = nicks.length ? addNicks(srcDir, nicks) : [];
  if (credited.length) log.push("nei Crediti: " + credited.join(", ") + " (src/data/contributors.js, CONTRIBUTORS.md)");
  /* pacchetto pubblicabile: tutte le voci madrelingua di index.json (le non madrelingua non hanno un posto nel contratto) */
  let pack = null;
  if (o.packOut) {
    const out = path.resolve(o.packOut), files = [];
    for (const e of index.filter((x) => x.native !== false)) {
      const from = path.join(vdir, e.file); if (!fs.existsSync(from)) { skip.push(`pacchetto: manca ${e.file}`); continue; }
      fs.mkdirSync(path.join(out, e.lang), { recursive: true });
      fs.copyFileSync(from, path.join(out, e.file));
      files.push({ ref: e.ref, lang: e.lang, file: e.file, bytes: e.bytes, sha256: e.sha256 });
    }
    pack = { v: 1, updated: (o.now ? o.now() : new Date()).toISOString().slice(0, 10), count: files.length, bytes: files.reduce((a, f) => a + f.bytes, 0), files };
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(pack, null, 1) + "\n");
    log.push(`pacchetto: ${pack.count} voci, ${pack.bytes} byte in ${out}`);
  }
  return { applied: done.map((d) => d.p.g.id), already: plan.filter((p) => p.have).map((p) => p.g.id), skipped: skip, log, index, pack, credited };
}
