/* màndarínō · le «ricette» del Laboratorio dei radicali: due componenti che, uniti, danno un carattere del vocabolario.
   Si ricavano dai dati dell'app (src/data/anatomy.js, radicals.js, vocabolario), senza fonti esterne. Usata da
   tools/radicali.mjs (scrive src/data/lab-recipes.js), da tools/unit.mjs (controlla che il file sia aggiornato e che
   le letture a mano siano coerenti) e da tools/build.mjs (nessuna dipendenza). */
import fs from "fs";
import path from "path";
import vm from "vm";
import { load } from "./data.mjs";

export function recipes(srcDir) {
  const D = load(srcDir), ctx = vm.createContext({});
  for (const f of ["data/anatomy.js", "data/radicals.js"]) vm.runInContext(fs.readFileSync(path.join(srcDir, f), "utf8"), ctx);
  const A = vm.runInContext("ANATOMY", ctx), R = vm.runInContext("RADICALS", ctx);
  const base = {}; R.forEach((r) => { base[r[1]] = r[1]; Array.from(r[2] || "").forEach((v) => { base[v] = r[1]; }); });
  const norm = (c) => base[c] || c;
  /* ogni carattere del vocabolario, nell'ordine in cui compare; per ciascuno la prima parola (meglio se d'un carattere solo) che lo contiene */
  const words = [], seen = new Map();
  D.SECTIONS.forEach((s) => s.words.forEach((w) => words.push(w)));
  for (const w of words) for (const c of Array.from(w[1])) {
    if (!/[㐀-鿿]/.test(c)) continue;
    const cur = seen.get(c), single = Array.from(w[1]).length === 1;
    if (!cur || (single && !cur.single)) seen.set(c, { w, single });
  }
  const raw = {};
  for (const [ch] of seen) {
    const x = A[ch]; if (!x || !x[0]) continue;
    const d = Array.from(x[0]), op = d[0], parts = d.slice(1).join("").split("|").filter(Boolean);
    if ((op === "⿰" || op === "⿱") && parts.length === 2) raw[ch] = { op, parts, t: x[2] || "", phon: x[3] || "" };
  }
  /* una parte fatta di due caratteri uguali a quelli di un altro carattere (木木 = 林) vale quel carattere */
  const byPair = {};
  for (const ch in raw) { const p = raw[ch].parts; if (Array.from(p[0]).length === 1 && Array.from(p[1]).length === 1) { const k = p.map(norm).join(""); (byPair[k] = byPair[k] || []).push(ch); } }
  const out = [];
  for (const [ch, info] of seen) {
    const r = raw[ch]; if (!r) continue;
    const p = r.parts.map((s) => { if (Array.from(s).length === 1) return s; const k = Array.from(s).map(norm).join(""); return byPair[k] && byPair[k].length === 1 ? byPair[k][0] : null; });
    if (p.includes(null) || p[0] === ch || p[1] === ch) continue;
    const phon = r.t === "s" ? (r.phon === r.parts[0] ? 0 : r.phon === r.parts[1] ? 1 : -1) : -1;
    /* pinyin del carattere: la sillaba nella posizione giusta della parola, se le sillabe tornano */
    const w = info.w, syl = w[0].split(/[ .]/).filter(Boolean), chars = Array.from(w[1]), i = chars.indexOf(ch);
    const py = syl.length === chars.length && i >= 0 ? syl[i] : "";
    out.push([ch, p[0], p[1], r.op, r.t, phon, py, info.single ? "" : w[1]]);
  }
  return { list: out, base };
}

export function recipesFile(list) {
  return "/* màndarínō · le ricette del Laboratorio dei radicali: " + list.length + " caratteri del vocabolario fatti di due componenti.\n" +
    "   File generato da tools/radicali.mjs a partire da data/anatomy.js (Make Me a Hanzi, LGPL 3.0 o successiva: LICENZE/LGPL-3.0.txt), data/radicals.js\n" +
    "   e dal vocabolario. Non modificarlo a mano: rilancia lo strumento.\n" +
    "   Formato: [carattere, componente A, componente B, disposizione (⿰ a fianco, ⿱ sopra e sotto), tipo (p pittogramma, i ideogramma composto,\n" +
    "   s fonetico-semantico), quale componente dà il suono (0 = A, 1 = B, -1 = nessuno o non si sa), pinyin, parola dell'app che lo contiene\n" +
    "   (vuota se il carattere è una parola da solo)]. Nell'ordine del vocabolario. */\n" +
    "var LAB_RECIPES = [\n" + list.map((r) => "  " + JSON.stringify(r)).join(",\n") + "\n];\n";
}
