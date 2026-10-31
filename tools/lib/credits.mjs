/* màndarínō · i Crediti: chi ha chiesto di comparire con il proprio nickname (Node, nessuna dipendenza).
   Estratto da tools/merge-contrib.mjs perché lo usa anche tools/voice-import.mjs: una sola regola, due strumenti.
   Il nickname entra in src/data/contributors.js (il foglio Crediti dell'app) e in CONTRIBUTORS.md (accanto a src/). */
import fs from "fs";
import path from "path";

/* 1-40 caratteri, niente < > @ né caratteri di controllo né indirizzi web */
export const goodNick = (n) => typeof n === "string" && n.trim().length >= 1 && n.trim().length <= 40 && !/[<>@\u0000-\u001f]|https?:|www\./i.test(n);

export const contribPaths = (srcDir) => ({ js: path.join(srcDir, "data/contributors.js"), md: path.resolve(srcDir, "..", "CONTRIBUTORS.md") });

/* i nickname già presenti in contributors.js */
export function knownNicks(srcDir) {
  try { const t = fs.readFileSync(contribPaths(srcDir).js, "utf8"); return JSON.parse(t.slice(t.indexOf("[", t.indexOf("CONTRIBUTORS")), t.lastIndexOf("]") + 1)); } catch (e) { return []; }
}

/* quelli di `nicks` che non ci sono ancora (senza badare alle maiuscole), senza doppioni */
export function newNicks(srcDir, nicks) {
  const known = knownNicks(srcDir), lc = (x) => x.toLowerCase(), seen = new Set(known.map(lc)), out = [];
  for (const n of nicks) if (!seen.has(lc(n))) { seen.add(lc(n)); out.push(n); }
  return out;
}

/* aggiunge i nickname nuovi ai due elenchi (stesso formato di prima: un diff mostra solo le righe cambiate) */
export function addNicks(srcDir, nicks) {
  const { js, md } = contribPaths(srcDir), add = newNicks(srcDir, nicks);
  if (!add.length) return [];
  const L = knownNicks(srcDir).concat(add), t = fs.readFileSync(js, "utf8");
  fs.writeFileSync(js, t.replace(/var CONTRIBUTORS = \[[\s\S]*?\];/, "var CONTRIBUTORS = " + JSON.stringify(L, null, 1).replace(/\n\s*/g, " ").replace("[ ", "[").replace(" ]", "]") + ";"));
  if (fs.existsSync(md)) {
    const m = fs.readFileSync(md, "utf8"), body = L.map((n) => "- " + n).join("\n") || "_(ancora nessuno)_";
    fs.writeFileSync(md, m.replace(/<!-- elenco -->[\s\S]*?<!-- \/elenco -->/, "<!-- elenco -->\n" + body + "\n<!-- /elenco -->"));
  }
  return add;
}
