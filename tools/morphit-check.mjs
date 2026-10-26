#!/usr/bin/env node
/* màndarínō · controllo dell'italiano con Morph-it! (lessico morfologico libero dell'italiano, Università di Bologna).
   SOLO PER LO SVILUPPO, come tools/cedict-check.mjs: Morph-it non entra nell'app né nel repository (LGPL / CC BY-SA).
   Scarica: https://docs.sslmit.unibo.it/doku.php?id=resources:morph-it  (file morph-it_048.txt, codifica latin-1)

   Controlla, contro un lessico indipendente:
   1. le schede di src/data/grammar.js: singolare e plurale dei nomi col loro genere, le 4 forme degli aggettivi,
      le nazionalità;
   2. le coniugazioni prodotte da src/phrases/italian.js per ogni verbo delle schede (presente, participio, futuro,
      imperfetto, condizionale, gerundio);
   3. l'ortografia di ogni parola italiana delle frasi verificate, delle lezioni e del corso di italiano.
   Uso: node tools/morphit-check.mjs percorso/morph-it_048.txt [--out rapporto.md] [--dump da-controllare.txt]
   Morph-it 0.48 ha delle lacune (es. manca «visto» come participio di vedere): con --dump le parole non confermate
   finiscono in un file, da passare al correttore ortografico Hunspell di LibreOffice con tools/hunspell-check.py.
   Una forma è buona se la conferma Morph-it (genere, numero, persona) o, se Morph-it non la ha, Hunspell. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { lab } from "./lib/lab.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2), file = args.find((a, i) => !a.startsWith("--") && !["--out", "--dump"].includes(args[i - 1]));
const outPath = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
const dumpPath = args.includes("--dump") ? args[args.indexOf("--dump") + 1] : null;
if (!file) { console.error("Uso: node tools/morphit-check.mjs morph-it_048.txt [--out rapporto.md]"); process.exit(2); }

/* forma → insieme di "lemma|tag" */
const M = new Map();
const raw = fs.readFileSync(file);
const text = /�/.test(raw.toString("utf8").slice(0, 200000)) ? raw.toString("latin1") : raw.toString("utf8");
for (const line of text.split("\n")) {
  const [form, lemma, tag] = line.trim().split("\t"); if (!tag) continue;
  const k = form.toLowerCase(); if (!M.has(k)) M.set(k, new Set()); M.get(k).add(lemma + "|" + tag);
}
const has = (form, lemma, re) => { const s = M.get(String(form).toLowerCase()); if (!s) return false; for (const x of s) { const [l, t] = x.split("|"); if ((!lemma || l === lemma) && (!re || re.test(t))) return true; } return false; };
const known = (form) => M.has(String(form).toLowerCase());

const L = lab(path.join(ROOT, "src")), G = L.D.GRAM, I = L.CP.ita;
const bad = [], warn = [];
const head = (s) => s.split(" ")[0];

/* 1. nomi */
for (const [hz, n] of Object.entries(G.nouns)) {
  const [s, g, p, fl = "", fs_, fp] = n, G1 = g === "f" ? "F" : "M";
  const sh = head(s), ph = head(p);
  if (/p/.test(fl) && s === p) { if (!has(ph, null, /^NOUN/)) bad.push(`nome ${hz}: «${p}» non è un nome noto`); continue; }
  if (!has(sh, null, new RegExp("^NOUN-(" + G1 + "|M|F)?:?.*s|^NOUN-" + G1))) bad.push(`nome ${hz}: «${sh}» non risulta nome ${g === "f" ? "femminile" : "maschile"} singolare`);
  else if (!has(sh, null, new RegExp("^NOUN-" + G1 + ":s")) && !(sh === ph)) warn.push(`nome ${hz}: «${sh}» in Morph-it non è ${G1}:s (${[...M.get(sh.toLowerCase())].join(", ")})`);
  if (sh !== ph && !has(ph, null, /^NOUN-[MF]:p/)) bad.push(`nome ${hz}: plurale «${ph}» non risulta`);
  if (fs_ && !has(head(fs_), null, /^NOUN-F:s|^ADJ:pos\+f\+s/)) bad.push(`nome ${hz}: femminile «${fs_}» non risulta`);
  if (fp && !has(head(fp), null, /^NOUN-F:p|^ADJ:pos\+f\+p/)) bad.push(`nome ${hz}: femminile plurale «${fp}» non risulta`);
}
/* 2. aggettivi e nazionalità */
const tags = ["m+s", "f+s", "m+p", "f+p"];
const adj4 = (what, forms) => forms.forEach((f, i) => { if (!has(f, null, new RegExp("^ADJ:pos\\+" + tags[i].replace("+", "\\+")))) bad.push(`${what}: «${f}» non risulta aggettivo ${tags[i]}`); });
for (const [hz, a] of Object.entries(G.adjs)) adj4("aggettivo " + hz, a);
for (const [hz, a] of Object.entries(G.nations)) if (Array.isArray(a)) adj4("nazionalità " + hz, a);
/* 3. verbi */
const P = ["1+s", "2+s", "3+s", "1+p", "2+p", "3+p"];
const lemmaOf = (inf) => { const v = head(inf); return /rsi$/.test(v) ? v.replace(/si$/, "e") : v; };
const verbs = new Set(Object.values(G.verbs).map((v) => v[0]).concat(Object.values(G.verbObj).flatMap((o) => Object.values(o).map((x) => x[0]))).concat(["essere", "avere", "stare", "volere", "potere", "dovere", "sapere", "amare", "mancare", "piacere", "imparare", "prepararsi", "vedersi"]));
for (const inf of verbs) {
  const lem = lemmaOf(inf), strip = (f) => head(f.replace(/^(mi|ti|si|ci|vi) /, ""));
  P.forEach((pp, i) => {
    const f = strip(I.present(inf, i)); if (!has(f, lem, new RegExp("^VER.*:ind\\+pres\\+" + pp.replace("+", "\\+")))) bad.push(`${inf}: presente ${pp} «${f}» non risulta`);
    const fu = strip(I.future(inf, i)); if (!has(fu, lem, new RegExp("^VER.*:ind\\+fut\\+" + pp.replace("+", "\\+")))) bad.push(`${inf}: futuro ${pp} «${fu}» non risulta`);
    const im = strip(I.imperfect(inf, i)); if (!has(im, lem, new RegExp("^VER.*:ind\\+impf\\+" + pp.replace("+", "\\+")))) bad.push(`${inf}: imperfetto ${pp} «${im}» non risulta`);
    const co = strip(I.conditional(inf, i)); if (!has(co, lem, new RegExp("^VER.*:cond\\+pres\\+" + pp.replace("+", "\\+")))) bad.push(`${inf}: condizionale ${pp} «${co}» non risulta`);
  });
  const pt = I.pp(inf); if (!has(pt, lem, /^VER.*:part\+past\+s\+m/)) bad.push(`${inf}: participio «${pt}» non risulta`);
  const ge = I.gerund(inf); if (!has(ge, lem, /^VER.*:ger/)) bad.push(`${inf}: gerundio «${ge}» non risulta`);
}
/* 4. ortografia delle frasi italiane */
const NAMES = new Set(["Pechino", "Shanghai", "Roma", "Cina", "Italia", "Sicilia", "Europa", "Giappone", "Francia", "Germania", "Spagna", "Regno", "Unito", "Stati", "Uniti", "Lei", "Suo", "Sua", "Le", "La", "noodles", "WeChat", "tofu", "taxi", "hotel", "computer", "film", "bar", "pub", "menù", "tè", "Marco", "Giulia", "Anna", "Luca", "Wang", "Li", "Lin", "Zhang", "OK", "ok", "yuan"]);
const sentences = [];
(L.D.VERIFIED || []).forEach((v) => sentences.push(["verificate", v[1]]));
(L.D.LESSONS || []).forEach((l) => (l.ex || []).forEach((e) => sentences.push(["lezione " + l.id, e[1]])));
(L.D.ITLESSONS || []).forEach((l) => { (l.ex || []).forEach((e) => sentences.push(["corso it " + l.id, e[0]])); (l.quiz || []).forEach((q) => { if (q.it) sentences.push(["corso it " + l.id, q.it]); const right = q.opts && q.opts[q.a]; if (right && !/[㐀-鿿]/.test(right)) sentences.push(["corso it " + l.id + " (risposta giusta)", right]); (l.traps || []).forEach((t) => sentences.push(["corso it " + l.id + " (forma giusta)", t[1]])); }); });
const unknown = new Map();
for (const [where, s] of sentences) {
  for (let w of String(s).replace(/[.,!?;:«»"()…–—]/g, " ").split(/\s+/)) {
    w = w.replace(/^[a-zà-ù]+'/i, "").replace(/\/.*$/, ""); if (!w || /\d/.test(w) || NAMES.has(w)) continue;
    if (/^(o|a|e|i)$/i.test(w) || known(w)) continue;
    if (!unknown.has(w)) unknown.set(w, where);
  }
}

let md = `# Italiano e Morph-it\n\n${bad.length} forme generate che non risultano · ${warn.length} avvisi · ${unknown.size} parole delle frasi non trovate\n`;
md += "\n## Forme che non risultano (errori)\n\n" + (bad.map((x) => "- " + x).join("\n") || "nessuna") + "\n";
md += "\n## Avvisi\n\n" + (warn.map((x) => "- " + x).join("\n") || "nessuno") + "\n";
md += "\n## Parole delle frasi non trovate (controllare: nomi propri, parole recenti o errori)\n\n" + ([...unknown].map(([w, where]) => `- ${w} (${where})`).join("\n") || "nessuna") + "\n";
if (outPath) fs.writeFileSync(outPath, md); else process.stdout.write(md);
if (dumpPath) {
  const words = new Set([...bad.map((x) => (/«([^»]+)»/.exec(x) || [])[1]).filter(Boolean), ...unknown.keys()]);
  fs.writeFileSync(dumpPath, [...words].join("\n") + "\n");
  console.error(`${words.size} parole da passare a Hunspell in ${dumpPath}`);
}
console.error(`${bad.length} forme sbagliate, ${warn.length} avvisi, ${unknown.size} parole da controllare.`);
process.exit(bad.length ? 1 : 0);
