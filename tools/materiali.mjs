#!/usr/bin/env node
/* màndarínō · dai materiali (materiali/runtime/, materiali/dati/) ai dati dell'app letti al primo uso (src/data/ex/).
   Task 12. Ricontrolla tutto con il taglio dell'app (src/core/segment.js), non con quello approssimato del pacchetto:
     - frasi cinesi (frasi-zh, voce-zh): ogni parola nel vocabolario; livello calcolato (la parola più alta, HSK 1-5, 6 = oltre)
       non sopra quello dichiarato. Le frasi che non passano si scartano e si contano (è normale che qualcuna cada);
     - clip (voce-zh, voce-it): il file .ogg c'è, sotto i 60 KB; le frasi di materiali/escludi-frasi.txt si tolgono;
     - insiemi confondibili: si tengono i membri che sono parole del vocabolario (cinese).
   Scrive src/data/ex/{frasi-zh,frasi-it,voce-zh,voce-it,voci-file,insiemi}.js; tools/build.mjs li ricontrolla e fallisce se qualcosa
   non torna. Uso: node tools/materiali.mjs [--check]   (--check: non scrive, dice solo se i file sono aggiornati) */
import fs from "fs";
import path from "path";
import vm from "vm";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { load, keysOf } from "./lib/data.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), ".."), SRC = path.join(ROOT, "src"), MAT = path.join(ROOT, "materiali");
const OUT = path.join(SRC, "data/ex"), CHECK = process.argv.includes("--check");
export const CLIP_MAX = 60 * 1024, AUDIO_MAX = 10 * 1024 * 1024;

/* vocabolario, livelli e taglio, come nella pagina */
export function tools(srcDir) {
  const D = load(srcDir), K = keysOf(D.SECTIONS), W = {};
  for (const k of Object.keys(K)) { const w = K[k].w; W[k] = { key: k, py: w[0], hz: w[1], it: w[2], sec: K[k].sec }; }
  const sctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(srcDir, "core/segment.js"), "utf8"), sctx);
  const segment = vm.runInContext("MDSegment", sctx).make(W, D.WORD_FREQ);
  const lctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(srcDir, "data/levels.js"), "utf8"), lctx);
  const HSK = vm.runInContext("HSK_LEVEL", lctx), CH = vm.runInContext("SECTION_CHAPTER", lctx), LV = {};
  for (const l of Object.keys(HSK)) HSK[l].split("|").forEach((w) => { if (w && !LV[w]) LV[w] = +l; });
  /* livello di una parola: il suo livello HSK; per le parole fuori dalle liste (frasi fatte come 这个, 坏了, 星期二) il
     capitolo della sua tappa (SECTION_CHAPTER, 1-5; 6 = oltre l'HSK) */
  const levelOf = (w) => LV[w.hz] || CH[w.sec] || 6;
  /* { ok, words, lv, unknown }: ok se ogni pezzo cinese è una parola del vocabolario */
  const check = (zh) => {
    const seg = segment(zh), unknown = seg.filter((s) => !s.w && !s.p).map((s) => s.raw), ws = seg.filter((s) => s.w).map((s) => s.w);
    return { ok: !unknown.length && ws.length > 0, words: ws.map((w) => w.hz), unknown, lv: ws.reduce((m, w) => Math.max(m, levelOf(w)), 1) };
  };
  return { W, segment, check, levelOf };
}

/* impronta di una clip: 8 cifre esadecimali dello SHA-256 (la build la ricontrolla) */
export const voiceHash = (b) => crypto.createHash("sha256").update(b).digest("hex").slice(0, 8);
const readJ = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const rows = (o) => (o && o.righe) || [];
const head = (what, lic) => "/* màndarínō · " + what + ". Generato da tools/materiali.mjs a partire da materiali/: non modificarlo a mano.\n   " + lic + " */\n";
function js(name, obj, h) { return h + "var " + name + " = " + JSON.stringify(obj) + ";\n"; }

export function build(srcDir, matDir) {
  const T = tools(srcDir), out = {}, report = [];
  const excl = new Set((fs.existsSync(path.join(matDir, "escludi-frasi.txt")) ? fs.readFileSync(path.join(matDir, "escludi-frasi.txt"), "utf8") : "").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
  const keyZh = (s) => Array.from(String(s)).filter((c) => /[㐀-鿿]/.test(c)).join("");
  const keyIt = (s) => String(s).normalize("NFC").toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,;:!?¿¡"«»“”()…]/g, " ").replace(/\s+/g, " ").trim();
  const ex = (s) => excl.has(String(s).trim()) || excl.has(keyZh(s)) || excl.has(keyIt(s));
  /* frasi cinese → italiano: [zh, it, lv, zh_id, it_id, diretta] */
  const fz = readJ(path.join(matDir, "runtime/frasi-zh.json")), keepZ = [];
  let oov = 0, lvUp = 0, exN = 0;
  for (const r of rows(fz)) {
    if (ex(r[0])) { exN++; continue; }
    const c = T.check(r[0]); if (!c.ok) { oov++; continue; }
    if (c.lv > r[2]) { lvUp++; r[2] = c.lv; }   /* il livello calcolato vince: mai una frase sotto il livello delle sue parole */
    keepZ.push(r);
  }
  out.FRASI_ZH = { campi: fz.campi, righe: keepZ };
  report.push(`frasi-zh: ${keepZ.length} tenute su ${rows(fz).length} (${oov} con parole fuori dal vocabolario secondo segment.js, ${exN} escluse a mano; ${lvUp} con il livello alzato a quello calcolato)`);
  /* frasi italiano → cinese: [it, zh, livello, it_id, audio_id]; il cinese è la traduzione mostrata a chi parla cinese */
  const fi = readJ(path.join(matDir, "runtime/frasi-it.json")), keepI = rows(fi).filter((r) => !ex(r[0]));
  out.FRASI_IT = { campi: fi.campi, righe: keepI };
  report.push(`frasi-it: ${keepI.length} tenute su ${rows(fi).length}`);
  /* voci: [audio_id, chiave, frase, lv, durata_s]; la clip deve esserci */
  let bytes = 0;
  for (const [lang, name] of [["zh", "VOCE_ZH"], ["it", "VOCE_IT"]]) {
    const f = path.join(matDir, "runtime/voce-" + lang + ".json"); if (!fs.existsSync(f)) { out[name] = { campi: [], righe: [] }; continue; }
    const v = readJ(f), keep = []; let miss = 0, big = 0, bad = 0, exV = 0;
    for (const r of rows(v)) {
      const clip = path.join(matDir, "audio", lang, r[0] + ".ogg");
      if (!fs.existsSync(clip)) { miss++; continue; }
      const sz = fs.statSync(clip).size; if (sz > CLIP_MAX) { big++; continue; }
      if (ex(r[2])) { exV++; continue; }
      if (lang === "zh") { const c = T.check(r[2]); if (!c.ok) { bad++; continue; } if (c.lv > r[3]) r[3] = c.lv; }
      bytes += sz; keep.push(r);
    }
    out[name] = { campi: v.campi, righe: keep, credito: v.credito || "", ext: v.ext || "ogg" };
    /* il catalogo dei file (Task 12, T5-T6): per ogni clip l'impronta del contenuto, che va nel nome del file in dist/ */
    const F = (out.VOICE_FILES = out.VOICE_FILES || { byte: {} });
    F[lang] = {}; F.byte[lang] = 0;
    for (const r of keep) { const b = fs.readFileSync(path.join(matDir, "audio", lang, r[0] + ".ogg")); F[lang][r[0]] = voiceHash(b); F.byte[lang] += b.length; }
    report.push(`voce-${lang}: ${keep.length} clip su ${rows(v).length} (${miss} senza file, ${big} oltre 60 KB, ${bad} con parole fuori dal vocabolario, ${exV} escluse a mano)`);
  }
  if (bytes > AUDIO_MAX) throw new Error("voci oltre il tetto di 10 MB: " + (bytes / 1048576).toFixed(2) + " MB");
  report.push(`audio: ${(bytes / 1048576).toFixed(2)} MB (tetto 10 MB)`);
  /* insiemi confondibili: per il cinese solo i membri che sono parole del vocabolario */
  const ins = readJ(path.join(matDir, "dati/insiemi-confondibili.json")), hz = new Set(Object.values(T.W).map((w) => w.hz));
  const zh = (ins.zh || []).map((s) => Object.assign({}, s, { membri: s.membri.filter((m) => hz.has(m)) })).filter((s) => s.membri.length >= 2);
  out.INSIEMI = { zh, it: ins.it || [] };
  report.push(`insiemi: ${zh.length} cinesi, ${(ins.it || []).length} italiani`);
  return { out, report, bytes };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { out, report } = build(SRC, MAT);
  const FILES = {
    "frasi-zh.js": js("FRASI_ZH", out.FRASI_ZH, head("frasi d'esempio cinese → italiano (Task 12): frase, traduzione, livello, numeri delle frasi su Tatoeba, traduzione diretta (1) o via inglese (0)", "Fonte: Tatoeba (tatoeba.org), licenza CC BY 2.0 FR; autori in materiali/crediti/autori-frasi.tsv.")),
    "frasi-it.js": js("FRASI_IT", out.FRASI_IT, head("frasi italiano → cinese per il corso di italiano (Task 12): frase, traduzione, livello stimato, numero su Tatoeba, numero della clip", "Fonte: Tatoeba (tatoeba.org), licenza CC BY 2.0 FR; autori in materiali/crediti/autori-frasi.tsv.")),
    "voce-zh.js": js("VOCE_ZH", out.VOCE_ZH, head("indice delle voci cinesi reali (Task 12): clip, chiave (solo caratteri), frase, livello, durata", "Fonte: Mozilla Common Voice Scripted Speech 27.0, licenza CC0-1.0. Nessun dato dei parlanti.")),
    "voce-it.js": js("VOCE_IT", out.VOCE_IT, head("indice delle voci italiane reali (Task 12): clip, chiave, frase, livello stimato, durata", "Fonte: Tatoeba, voce NM1, licenza CC BY 4.0.")),
    "voci-file.js": js("VOICE_FILES", out.VOICE_FILES || { byte: {} }, head("catalogo dei file delle voci reali (Task 12): per lingua, numero della clip → impronta del contenuto; byte per lingua", "I file vanno in dist/audio/voce/<lingua>/<numero>.<impronta>.ogg (tools/build.mjs).")),
    "insiemi.js": js("INSIEMI", out.INSIEMI, "/* màndarínō · insiemi di elementi grammaticali da confondere, per le frasi a buco grammaticali (Task 12). Generato da\n   tools/materiali.mjs a partire da materiali/dati/insiemi-confondibili.json (scritti per il progetto): non modificarlo a mano. */\n")
  };
  fs.mkdirSync(OUT, { recursive: true });
  let stale = [];
  for (const [f, text] of Object.entries(FILES)) {
    const p = path.join(OUT, f);
    if (CHECK) { if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== text) stale.push(f); }
    else fs.writeFileSync(p, text);
  }
  report.forEach((l) => console.log("  " + l));
  if (CHECK && stale.length) { console.error("✗ src/data/ex/ non è aggiornato: " + stale.join(", ") + " (node tools/materiali.mjs)"); process.exit(1); }
  console.log(CHECK ? "✓ src/data/ex/ aggiornato" : "✓ scritto src/data/ex/ (" + Object.keys(FILES).length + " file)");
}
