#!/usr/bin/env node
/* Controlla i file .md del repository: link e ancore, strutture che altri strumenti leggono, e le parole che non devono
   comparire in un testo pubblico (riferimenti al lavoro interno). Solo Node, nessuna dipendenza.
   Uso:  node tools/check-docs.mjs [--root cartella] [--strict]
   Esce con 1 se trova un errore. Senza --strict le parole vietate sono solo avvisi. */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(opt("--root", process.cwd()));
const STRICT = args.includes("--strict");

const SKIP = new Set([".git", "node_modules", "dist", "_site", "android", "build"]);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const files = walk(ROOT);
const text = new Map(files.map((f) => [rel(f), fs.readFileSync(f, "utf8")]));

/* Ancore come le calcola GitHub: minuscolo, via la punteggiatura, spazi in trattini, -1 sui doppioni. */
function slugs(md) {
  const seen = new Map(), out = new Set();
  let fence = false;
  for (const line of md.split("\n")) {
    if (/^```/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    const m = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    let h = m[1].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[`*_~]/g, "");
    let s = h.trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M} _-]/gu, "").replace(/ /g, "-");
    const n = seen.get(s) || 0; seen.set(s, n + 1);
    out.add(n ? s + "-" + n : s);
  }
  return out;
}
const heads = new Map([...text].map(([f, t]) => [f, slugs(t)]));

const errors = [], warns = [];
const err = (f, m) => errors.push(f + ": " + m);

/* 1. Link interni e ancore (fuori dai blocchi di codice) */
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
for (const [f, t] of text) {
  const body = t.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  for (const m of body.matchAll(LINK)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:)/.test(u)) continue;
    const [p, a0] = u.split("#"); const a = a0 ? decodeURIComponent(a0) : "";
    const target = p ? path.posix.normalize(path.posix.join(path.posix.dirname(f), p)) : f;
    const abs = path.join(ROOT, target);
    if (p && !fs.existsSync(abs)) { err(f, "link a un file che non esiste: " + u); continue; }
    if (a && target.endsWith(".md") && !(heads.get(target) || new Set()).has(a.toLowerCase()))
      err(f, "ancora non trovata: " + u);
  }
}

/* 2. Ancore e nomi che il resto del progetto usa per nome */
const MUST_EXIST = ["README.md", "LEGGIMI.md", "NOTICE.md", "CONTRIBUTING.md", "CONTRIBUTORS.md", "PRIVACY.md",
  "THIRD-PARTY-NOTICES.md"];
for (const f of MUST_EXIST) if (!text.has(f)) err(f, "il file deve esistere con questo nome");
const need = (f, re, what) => { if (text.has(f) && !re.test(text.get(f))) err(f, "manca " + what); };
need("CONTRIBUTING.md", /^## Italiano\s*$/m, "il titolo «## Italiano»");
need("CONTRIBUTING.md", /^## 中文\s*$/m, "il titolo «## 中文» (la pagina web punta a CONTRIBUTING.md#中文)");
need("PRIVACY.md", /^## Italiano\s*$/m, "il titolo «## Italiano»");
need("PRIVACY.md", /^## 中文\s*$/m, "il titolo «## 中文»");
need("PRIVACY.md", /api\.github\.com/, "il testo «api.github.com» (lo controlla tools/unit.mjs)");
const zh = (text.get("PRIVACY.md") || "").split(/^## 中文\s*$/m)[1] || "";
if (text.has("PRIVACY.md") && !/^\|.*\|\s*$/m.test(zh)) err("PRIVACY.md", "la parte cinese deve contenere una tabella");
need("CONTRIBUTORS.md", /<!-- elenco -->[\s\S]*<!-- \/elenco -->/, "il blocco tra <!-- elenco --> e <!-- /elenco -->");
const THIRD = ["src/data/strokes.js", "src/data/anatomy.js", "src/data/levels.js", "src/data/freq.js",
  "src/data/wiki/zh-it.txt", "src/data/it/lexicon.js", "src/vendor/jsqr.min.js",
  /* librerie e dati del sito (docs/): se ci sono, devono avere la loro voce */
  "docs/assets/vendor/hanzi-writer.min.js", "docs/assets/vendor/confetti.browser.js", "docs/assets/dati/hanzi.json"];
if (text.has("THIRD-PARTY-NOTICES.md"))
  for (const p of THIRD) if (fs.existsSync(path.join(ROOT, p)) && !text.get("THIRD-PARTY-NOTICES.md").includes(p))
    err("THIRD-PARTY-NOTICES.md", "deve citare «" + p + "» (la build lo controlla)");

/* 3. Parole che non devono comparire in un testo per il pubblico */
const BAN = [
  [/\bTask\s*\d/i, "«Task N»"], [/\btappa\s+\d+\.\d+/i, "«tappa N.N»"], [/\bT\d{1,2}\b(?=[,:.)])/, "«TN» (sigla di tappa)"],
  [/\b[Ll]'autore\b/, "«l'autore»"], [/a cura dell'autore/i, "«a cura dell'autore»"],
  [/note? (per|da) (te|l'autore|verificare)/i, "«nota per…»"], [/\bnon si può fare da qui\b/i, "«non si può fare da qui»"],
  [/\bda qui\b(?! in poi)/i, "«da qui»"], [/\bspecifiche\b/i, "«specifiche»"], [/\bV6\.\d+\b/, "«V6.x»"],
  [/\bTODO\b|\bFIXME\b/, "TODO/FIXME"], [/[☑☐]/, "caselle ☑ ☐"], [/\bClaude Code\b/, "«Claude Code»"],
  [/\bprompt\b/i, "«prompt»"], [/\bmetti tu\b|\bspedisci tu\b|\brileggi e spedisci\b/i, "istruzioni «a te»"],
];
/* dove una parola è ammessa: NOTICE.md racconta di Claude (non di Claude Code) per scelta */
const ALLOW = { "NOTICE.md": ["«Claude Code»"], "README.md": ["«Claude Code»"] };
for (const [f, t] of text) {
  const body = t.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ""));
  body.split("\n").forEach((line, i) => {
    for (const [re, name] of BAN) {
      if (!re.test(line) || (ALLOW[f] || []).includes(name)) continue;
      (STRICT ? errors : warns).push(f + ":" + (i + 1) + ": " + name + " → " + line.trim().slice(0, 90));
    }
  });
}

for (const w of warns) console.log("avviso  " + w);
for (const e of errors) console.log("ERRORE  " + e);
console.log(`\n${files.length} file .md · ${errors.length} errori · ${warns.length} avvisi` + (STRICT ? "" : " (usa --strict per renderli errori)"));
process.exit(errors.length ? 1 : 0);
