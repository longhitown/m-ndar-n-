#!/usr/bin/env node
/* màndarínō · dal modulo di rilettura compilato (tools/review-sample.mjs) a una patch «mandarino-contrib/1».
   Ogni riga segnata «~» (si capisce ma non è naturale) o «✗» (sbagliata), o con una proposta nella colonna 建议, diventa
   una segnalazione (op: "flag") sulla frase indicata da «rif.»: la parola dell'esempio (ex:<parola>), la battuta del
   dialogo (dlg:<id>:<riga>) o la frase di tutti i giorni (phr:<gruppo>:<riga>). Le segnalazioni non cambiano niente:
   tools/merge-contrib.mjs le elenca, e l'autore corregge a mano il cinese nei file di src/data/ (il cinese di una frase
   cambia anche il pinyin, quindi si rilegge riga per riga). Le righe «✓» senza proposta si contano e basta.
     node tools/review-import.mjs modulo.md [--nome revisore] [--out revisione.json] */
import fs from "fs";

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const file = args.find((a, i) => !a.startsWith("--") && !["--nome", "--out"].includes(args[i - 1]));
if (!file) { console.error("Uso: node tools/review-import.mjs modulo.md [--nome revisore] [--out revisione.json]"); process.exit(2); }
const nome = String(opt("--nome", "") || "").replace(/[<>@]/g, "").slice(0, 40), out = opt("--out", "");
const clean = (s) => String(s || "").replace(/\\\|/g, "|").replace(/[<>]/g, "").trim();
/* una riga della tabella: | # | 中文 | italiano | 判断 | 建议 | rif. | (le barre dentro le celle sono «\|») */
const cells = (line) => line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split(/(?<!\\)\|/).map(clean);
const items = [], seen = { ok: 0, flag: 0, skip: [] };
for (const line of fs.readFileSync(file, "utf8").split("\n")) {
  if (!/^\s*\|\s*\d+\s*\|/.test(line)) continue;
  const c = cells(line); if (c.length < 6) { seen.skip.push(line.slice(0, 60)); continue; }
  const [n, zh, , verdict, idea, ref] = c, m = /`([^`]+)`/.exec(ref);
  const v = /✗|x|错/i.test(verdict) ? "✗" : /~|不自然/.test(verdict) ? "~" : /✓|自然|ok/i.test(verdict) ? "✓" : "";
  if ((v === "✓" || !v) && !idea) { if (v) seen.ok++; continue; }
  if (!m) { seen.skip.push("#" + n + ": manca il riferimento"); continue; }
  const target = m[1].replace(/^ex:/, "");
  const why = ("母语者审校 " + (v || "?") + (idea ? " → " + idea : "") + " · 原句：" + zh).slice(0, 200);
  items.push({ id: "rev-" + n + "-" + target.replace(/[^\w:\u4e00-\u9fff-]/g, "").slice(0, 30), op: "flag", target, why });
  seen.flag++;
}
const patch = { schema: "mandarino-contrib/1", app: "review", created: Date.now(), author: nome || undefined, items };
const text = JSON.stringify(patch, null, 2) + "\n";
if (out) fs.writeFileSync(out, text); else process.stdout.write(text);
console.error("✓ " + seen.flag + " segnalazioni, " + seen.ok + " righe «✓»" + (seen.skip.length ? ", " + seen.skip.length + " righe saltate: " + seen.skip.slice(0, 3).join(" · ") : "") + (out ? " → " + out : ""));
