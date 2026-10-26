/* màndarínō · lettura e scrittura dei dati in src/ (Node, nessuna dipendenza).
   Usata da tools/build.mjs (controlli e file unico), tools/merge-contrib.mjs (contributi) e da chi aggiunge parole.

   I file di dati sono script classici, così l'app si apre anche da file:// senza build:
     src/data/vocab/NNN-<id>.js   SECTIONS.push({ "id", "title", "words": [ [pinyin, caratteri, italiano, nota?], … ] });
     src/data/dialogs/<id>.js     DIALOGS.push({ "id", "title", "sub", "sec", "cat", "lines": [ [A|B, pinyin, caratteri, italiano], … ] });
     src/data/phrases.js          var PHRASES = [ { "title", "items": [ [pinyin, caratteri, italiano], … ] }, … ];
     src/data/think.js, exercises.js, patterns.js, slots.js, path.js: dati con lo stesso stile.
   L'ordine dei file è quello dei <script src> in src/index.html: è l'unica fonte. */
import fs from "fs";
import path from "path";
import vm from "vm";

/* i <script src> e <link rel="stylesheet"> di src/index.html, in ordine */
export function assets(srcDir) {
  const html = fs.readFileSync(path.join(srcDir, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/g)].map((m) => ({ tag: m[0], src: m[2], id: ((m[1] + m[3]).match(/\bid="([^"]+)"/) || [])[1] || "" }));
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map((m) => ({ tag: m[0], href: m[1] }));
  return { html, scripts, styles };
}

/* esegue i soli file di dati (src/data/…) in una sandbox e restituisce le strutture globali */
export function load(srcDir) {
  const { scripts } = assets(srcDir);
  const ctx = vm.createContext({ SECTIONS: [], DIALOGS: [], LESSONS: [], ITLESSONS: [] });
  const files = scripts.filter((s) => s.src.startsWith("data/"));
  for (const s of files) vm.runInContext(fs.readFileSync(path.join(srcDir, s.src), "utf8"), ctx, { filename: s.src });
  const g = (n) => vm.runInContext("typeof " + n + " === 'undefined' ? undefined : " + n, ctx);
  return {
    files: files.map((s) => s.src),
    SECTIONS: ctx.SECTIONS, DIALOGS: ctx.DIALOGS, PHRASES: g("PHRASES"), DIALOG_CATS: g("DIALOG_CATS"), THINK: g("THINK"), THINK_CATS: g("THINK_CATS"),
    EX: g("EX"), PATTERNS: g("PATTERNS"), SLOTS: g("SLOTS"), SITUATIONS: g("SITUATIONS"), PATH: g("PATH"),
    GRAM: g("GRAM"), VERIFIED: g("VERIFIED"), WORD_FREQ: g("WORD_FREQ"), VOCAB_EXPECT: g("VOCAB_EXPECT"), LESSONS: g("LESSONS"), ITLESSONS: g("ITLESSONS"), EXAMPLES: g("EXAMPLES")
  };
}

/* ---------- formati: una voce per riga, così un diff mostra esattamente la parola cambiata ---------- */
const j = (x) => JSON.stringify(x);
export function sectionFile(s, nr) {
  return "/* " + s.title + " · " + s.words.length + " parole. Una parola per riga: [pinyin, caratteri, italiano, nota facoltativa].\n" +
    "   Il pinyin separa le sillabe di una parola con il punto (péng.you); i caratteri sono la chiave dei progressi: non cambiarli. */\n" +
    "SECTIONS.push({\n  \"id\": " + j(s.id) + ",\n  \"title\": " + j(s.title) + ",\n  \"words\": [\n" +
    s.words.map((w) => "    " + j(w)).join(",\n") + "\n  ]\n});\n";
}
export function sectionPath(s, nr) { return "data/vocab/" + String(nr).padStart(3, "0") + "-" + s.id + ".js"; }
export function dialogFile(d) {
  const head = ["id", "title", "sub", "sec", "cat"].filter((k) => d[k] !== undefined).map((k) => "  " + j(k) + ": " + j(d[k])).join(",\n");
  const extra = Object.keys(d).filter((k) => !["id", "title", "sub", "sec", "cat", "lines"].includes(k)).map((k) => "  " + j(k) + ": " + j(d[k])).join(",\n");
  return "/* Dialogo «" + d.title + "» · " + d.lines.length + " battute: [A|B, pinyin, caratteri, italiano]. A = l'altra persona, B = chi studia. */\n" +
    "DIALOGS.push({\n" + head + (extra ? ",\n" + extra : "") + ",\n  \"lines\": [\n" + d.lines.map((l) => "    " + j(l)).join(",\n") + "\n  ]\n});\n";
}
export function phrasesFile(P) {
  return "/* Frasi corte di tutti i giorni, in " + P.length + " situazioni: [pinyin, caratteri, italiano]. Target dei contributi: phr:<gruppo>:<riga>, da 0. */\n" +
    "var PHRASES = [\n" + P.map((g) => "  {\n    \"title\": " + j(g.title) + ",\n    \"items\": [\n" + g.items.map((i) => "      " + j(i)).join(",\n") + "\n    ]\n  }").join(",\n") + "\n];\n";
}
export function thinkFile(T, C) {
  return "/* Ordine del Pensiero: la frase italiana, i blocchi [ruolo, pinyin, caratteri, italiano] nell'ordine cinese, order = ordine italiano. */\n" +
    "var THINK_CATS = [\n" + C.map((c) => "  " + j(c)).join(",\n") + "\n];\n" +
    "var THINK = [\n" + T.map((t) => "  " + j(t)).join(",\n") + "\n];\n";
}

/* src/data/verified.js: tiene il commento iniziale del file com'è, riscrive una frase per riga */
export function verifiedFile(V, old) {
  const head = old && old.indexOf("var VERIFIED") > 0 ? old.slice(0, old.indexOf("var VERIFIED")) : "/* Frasi verificate: [cinese, italiano corretto] (+ \"memoria\" se le regole non ci arrivano ancora). */\n";
  return head + "var VERIFIED = [\n" + V.map((v) => "  " + j(v)).join(",\n") + "\n];\n";
}

/* ---------- controlli (gli stessi della revisione e di #selftest) ---------- */
const CJK = /[㐀-鿿]/;
export function syllables(py) { const c = String(py).replace(/[!?,;:…"“”«»()（），。？！、]/g, " ").replace(/\.(?=\s|$)/g, " ").trim(); return c ? c.split(/\s+/).flatMap((w) => w.split(/\.(?=[^\s.])/)) : []; }
export function cjkCount(h) { return Array.from(String(h)).filter((c) => CJK.test(c)).length; }
export function keysOf(SECTIONS) {
  const W = {};
  SECTIONS.forEach((s) => s.words.forEach((w) => { let k = w[1]; if (W[k]) { k = w[1] + "#" + w[0]; while (W[k]) k += "'"; } W[k] = { w, sec: s.id }; }));
  return W;
}
export function check(D) {
  const err = [], warn = [];
  const ids = new Set();
  D.SECTIONS.forEach((s) => {
    if (!s.id || ids.has(s.id)) err.push("sezione con id mancante o doppio: " + s.id); ids.add(s.id);
    s.words.forEach((w, i) => {
      if (!Array.isArray(w) || w.length < 3 || w.length > 4 || w.some((x) => typeof x !== "string")) err.push(`${s.id}[${i}]: la parola deve essere [pinyin, caratteri, italiano, nota?]`);
      else if (syllables(w[0]).length !== cjkCount(w[1])) err.push(`${s.id}[${i}] ${w[1]}: ${syllables(w[0]).length} sillabe per ${cjkCount(w[1])} caratteri («${w[0]}»)`);
      else if (/[<>]/.test(w.join(""))) err.push(`${s.id}[${i}]: niente < o >`);
    });
  });
  (D.PHRASES || []).forEach((g, gi) => g.items.forEach((p, ri) => { if (syllables(p[0]).length !== cjkCount(p[1])) err.push(`phr:${gi}:${ri} ${p[1]}: sillabe e caratteri non tornano`); }));
  const dids = new Set();
  D.DIALOGS.forEach((d) => {
    if (dids.has(d.id)) err.push("dialogo doppio: " + d.id); dids.add(d.id);
    d.lines.forEach((l, i) => { if (syllables(l[1]).length !== cjkCount(l[2])) err.push(`dlg:${d.id}:${i} ${l[2]}: sillabe e caratteri non tornano`); });
  });
  (D.THINK || []).forEach((t, i) => t.blocks.forEach((b) => { if (syllables(b[1]).length !== cjkCount(b[2])) err.push(`think ${i} ${b[2]}: sillabe e caratteri non tornano`); }));
  const vz = new Set();
  (D.VERIFIED || []).forEach((v, i) => {
    if (!Array.isArray(v) || v.length < 2 || v.length > 3 || typeof v[0] !== "string" || typeof v[1] !== "string" || (v[2] !== undefined && v[2] !== "memoria")) err.push(`verified[${i}]: deve essere [cinese, italiano] o [cinese, italiano, "memoria"]`);
    else if (/[<>]/.test(v[0] + v[1])) err.push(`verified[${i}]: niente < o >`);
    else if (vz.has(v[0])) err.push(`verified[${i}] ${v[0]}: frase doppia`);
    vz.add(v[0]);
  });
  const n = D.SECTIONS.reduce((a, s) => a + s.words.length, 0);
  return { err, warn, words: n, sections: D.SECTIONS.length, dialogs: D.DIALOGS.length };
}
