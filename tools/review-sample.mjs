/* màndarínō · campione da far rileggere a un madrelingua cinese.
   Sceglie in modo ripetibile (stesso --seme, stesso campione) frasi d'esempio da ogni sezione del vocabolario, battute da
   ogni dialogo e frasi di tutti i giorni, e scrive un modulo Markdown con le istruzioni in cinese: per ogni riga
   «自然 / 不自然 / 错误» e una proposta. Il modulo compilato torna all'autore e diventa una patch di segnalazioni con
   tools/review-import.mjs, che tools/merge-contrib.mjs riassume (docs/rilettura.md).
     node tools/review-sample.mjs [--per-sezione 1] [--per-dialogo 2] [--frasi 20] [--seme 1] [--out revisione.md] */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load } from "./lib/data.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const perSec = +arg("--per-sezione", 1), perDlg = +arg("--per-dialogo", 2), nPhr = +arg("--frasi", 20), out = arg("--out", "");
let seed = (+arg("--seme", 1) >>> 0) || 1;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const pick = (arr, n) => { const a = arr.slice(), r = []; while (a.length && r.length < n) r.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return r; };

const D = load(path.join(ROOT, "src"));
const rows = [];
for (const s of D.SECTIONS) {
  const ex = s.words.map((w) => [w[1], D.EXAMPLES[w[1]]]).filter((x) => x[1]);
  for (const [hz, e] of pick(ex, perSec)) rows.push({ kind: "例句 · " + s.title, zh: e[0], it: e[1], ref: "ex:" + hz });
}
for (const d of D.DIALOGS) for (const l of pick(d.lines, perDlg)) rows.push({ kind: "对话 · " + d.title, zh: l[2], it: l[3], ref: "dlg:" + d.id + ":" + d.lines.indexOf(l) });
const phr = D.PHRASES.flatMap((g, gi) => g.items.map((i, ri) => ({ kind: "常用语 · " + g.title, zh: i[1], it: i[2], ref: "phr:" + gi + ":" + ri })));
rows.push(...pick(phr, nPhr));

const cell = (s) => String(s).replace(/\|/g, "\\|");
const md = ["# màndarínō · 母语者审校 / revisione di un madrelingua", "",
  "请读每一句中文，判断它是否自然、正确。意大利语翻译只作参考。", "在「判断」一栏写：✓ 自然 · ~ 能懂但不自然 · ✗ 错误；如果不是 ✓，请在「建议」一栏写出更好的说法。", "",
  "Per chi prepara il modulo: " + rows.length + " righe, seme " + (+arg("--seme", 1)) + ". Compilato, torna all'autore: `node tools/review-import.mjs modulo.md --nome <chi> --out revisione.json`, poi `node tools/merge-contrib.mjs revisione.json` (docs/rilettura.md).", "",
  "| # | 中文 | italiano | 判断 | 建议 | rif. |", "|---|---|---|---|---|---|",
  ...rows.map((r, i) => "| " + (i + 1) + " | " + cell(r.zh) + " | " + cell(r.it) + " |  |  | " + cell(r.kind) + " · `" + r.ref + "` |")].join("\n") + "\n";
if (out) { fs.writeFileSync(out, md); console.log("✓ " + out + " · " + rows.length + " righe"); } else process.stdout.write(md);
