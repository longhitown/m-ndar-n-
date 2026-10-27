#!/usr/bin/env node
/* màndarínō · lessico del corso di italiano per chi parla cinese, ricavato dal vocabolario cinese→italiano e controllato
   con Morph-it! (Università di Bologna, doppia licenza CC BY-SA 2.0 / LGPL: il file non entra nel repository, ma genere,
   plurale e forme degli aggettivi finiscono in lexicon.js, che quindi segue la LGPL: vedi THIRD-PARTY-NOTICES.md).
   Scrive src/data/it/lexicon.js. Si rilancia quando si aggiungono parole.
   Uso: node tools/itlex.mjs morph-it.txt

   Per ogni parola cinese si prende il primo significato italiano (quello prima di ; , ( :). Si tiene solo se Morph-it lo
   conosce davvero, e se ne ricava che cos'è:
     nome:      il singolare con il suo genere e il plurale (gatto, M, gatti)
     aggettivo: le quattro forme (bello, bella, belli, belle)
     verbo:     l'infinito (anche riflessivo: svegliarsi)
     altro:     avverbi, espressioni fino a tre parole tutte note a Morph-it (andata e ritorno)
   Le parole che il corso ha già dalle schede grammaticali (data/grammar.js) restano a quelle, più ricche. Quando più
   parole cinesi hanno lo stesso significato italiano (公斤 / 千克 = chilogrammo) diventano una voce sola. */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { load, keysOf } from "./lib/data.mjs";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
if (!process.argv[2]) { console.error("Uso: node tools/itlex.mjs morph-it.txt"); process.exit(2); }
const M = new Map();   /* forma → [[lemma, tag], …] */
for (const line of fs.readFileSync(process.argv[2], "utf8").split("\n")) {
  const [f, l, t] = line.split("\t"); if (!t) continue;
  const k = f.toLowerCase(); if (!M.has(k)) M.set(k, []); M.get(k).push([l, t]);
}
const tags = (w) => M.get(w) || [];
const plIdx = new Map();   /* lemma+genere → plurale */
function nounOf(w) {
  const s = tags(w).find(([l, t]) => l === w && /^NOUN-[MF]:s$/.test(t)); if (!s) return null;
  const both = tags(w).some(([l, t]) => l === w && t === "NOUN-M:s") && tags(w).some(([l, t]) => l === w && t === "NOUN-F:s");
  const g = both ? "mf" : s[1][5].toLowerCase();
  if (!plIdx.size) for (const [f, a] of M) for (const [l, t] of a) if (/^NOUN-[MF]:p$/.test(t) && !plIdx.has(l + t[5])) plIdx.set(l + t[5], f);
  return { g, p: plIdx.get(w + (g === "mf" ? "M" : g.toUpperCase())) || w };
}
const lemmaIdx = new Map();   /* lemma → forme per tag (per gli aggettivi) */
function adjOf(w) {
  if (!tags(w).some(([l, t]) => l === w && t === "ADJ:pos+m+s")) return null;
  if (!lemmaIdx.size) for (const [f, a] of M) for (const [l, t] of a) if (/^ADJ:pos\+[mf]\+[sp]$/.test(t)) { const o = lemmaIdx.get(l) || {}; if (!o[t]) o[t] = f; lemmaIdx.set(l, o); }
  const o = lemmaIdx.get(w) || {};
  const forms = ["m+s", "f+s", "m+p", "f+p"].map((x) => o["ADJ:pos+" + x]);
  return forms.every(Boolean) ? forms : null;
}
const verbOf = (w) => tags(w).some(([l, t]) => /^VER:inf/.test(t)) ? w : null;
const known = (w) => M.has(w);

const D = load(SRC), K = keysOf(D.SECTIONS);
const gctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(SRC, "data/grammar.js"), "utf8"), gctx);
const G = vm.runInContext("GRAM", gctx), have = new Set();
for (const t of ["nouns", "places", "verbs", "adjs", "time"]) Object.keys(G[t] || {}).forEach((k) => have.add(k));
Object.keys(G.nations || {}).forEach((k) => have.add(k + "人"));

const out = new Map();   /* italiano → voce */
let skipped = 0;
for (const key of Object.keys(K)) {
  const w = K[key].w, hz = w[1];
  if (have.has(key) || have.has(hz)) continue;
  let it = String(w[2]).split(/[;,(:]/)[0].trim().toLowerCase().replace(/^(il|lo|la|i|gli|le|un|uno|una)\s+|^(l'|un')/, "");
  if (!it || /[0-9/«»"=…?!]/.test(it) || /classificatore|particella|suffisso|prefisso/.test(it)) { skipped++; continue; }
  const parts = it.split(/\s+/);
  let e = null;
  if (parts.length === 1) {
    const n = nounOf(it), a = adjOf(it), v = verbOf(it);
    /* pronomi, avverbi, preposizioni, saluti: «altro», anche se Morph-it li conosce pure come nomi (voi, buongiorno) */
    const func = tags(it).some(([l, t]) => /^(PRO|ADV|PRE|CON|DET|INT|CLI|NUM|ART|WH|CE|NE|SI|ASP|AUX|CAU|MOD)/.test(t));
    if (v) e = { k: "v", it: v };
    else if (func && !a) e = { k: "x", it };
    else if (a) e = { k: "j", it, f: a };   /* nome e aggettivo insieme (marcio, giovane): vale l'aggettivo */
    else if (n) e = { k: "n", it, g: n.g, p: n.p };
    else if (known(it)) e = { k: "x", it };
  } else if (parts.length <= 3 && parts.every(known)) e = { k: "x", it };
  if (!e) { skipped++; continue; }
  const id = e.k + ":" + e.it, cur = out.get(id);
  if (cur) { if (cur.keys.length < 3) cur.keys.push(key); continue; }
  out.set(id, Object.assign(e, { keys: [key] }));
}
const rows = [...out.values()].map((e) => {
  const extra = e.k === "n" ? [e.g, e.p] : e.k === "j" ? [e.f] : [];
  return "  " + JSON.stringify([e.keys.join("|"), e.k, e.it, ...extra]);
});
const js = "/* Lessico del corso di italiano, generato da tools/itlex.mjs dal vocabolario e con genere, plurale e forme presi da Morph-it! (Marco Baroni ed Eros Zanchetta, Università di Bologna, versione 0.4.8; estratto e modificato a ottobre 2026; usato con la licenza LGPL: vedi\n" +
  "   THIRD-PARTY-NOTICES.md, LICENZE/MORPH-IT.txt e LICENZE/LGPL-2.1.txt). Non modificarlo a mano. Una voce per riga: [chiavi cinesi separate da |, tipo, italiano, …]\n" +
  "   tipo n = nome [genere, plurale] · j = aggettivo [[m.s, f.s, m.p, f.p]] · v = verbo all'infinito · x = altro (avverbi, espressioni). */\n" +
  "var IT_LEXICON = [\n" + rows.join(",\n") + "\n];\n";
fs.mkdirSync(path.join(SRC, "data/it"), { recursive: true });
fs.writeFileSync(path.join(SRC, "data/it/lexicon.js"), js);
const by = {}; for (const e of out.values()) by[e.k] = (by[e.k] || 0) + 1;
console.log("lexicon.js: " + out.size + " voci (" + Object.entries(by).map(([k, n]) => k + " " + n).join(", ") + "), " + skipped + " parole senza un italiano semplice");
