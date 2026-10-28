#!/usr/bin/env node
/* màndarínō · controllo delle lezioni di grammatica con fonti esterne. SOLO PER LO SVILUPPO: CC-CEDICT (CC BY-SA 4.0) e Tatoeba
   (CC BY 2.0 FR) non entrano nell'app né nel repository; qui servono come secondo paio d'occhi, perché non c'è un madrelingua a portata di mano.
   Non corregge niente: scrive un rapporto da leggere (frase per frase) e esce con 1 solo per gli errori certi (vedi «ERRORE»).

   Prima, scarica (gratis) in una cartella qualsiasi:
     CC-CEDICT      https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.zip   → cedict_ts.u8
     Tatoeba        https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences.tsv.bz2      → cmn.tsv
                    https://downloads.tatoeba.org/exports/per_language/ita/ita_sentences.tsv.bz2      → ita.tsv
                    https://downloads.tatoeba.org/exports/per_language/cmn/cmn-ita_links.tsv.bz2      → cmn-ita.tsv
   Poi:  node tools/lezioni-check.mjs cartella [--out rapporto.md] [--solo zh|it] [--lezione N]

   Che cosa controlla, per ogni frase di esempio, errore tipico e risposta degli esercizi:
   1. cinese: ogni parola è in CC-CEDICT (taglio per parole più lunghe) oppure nel vocabolario dell'app; il resto è «da guardare»;
   2. cinese e italiano: la frase compare identica in Tatoeba? Se sì, accanto c'è la traduzione di Tatoeba da confrontare con la nostra;
   3. un errore tipico («sbagliata») che compare in Tatoeba è sospetto: forse la forma «sbagliata» è usata davvero;
   4. regole certe: elenco corto di costruzioni che un manuale non accetta mai (REGOLE), cercate nelle frasi «giuste»;
   5. struttura: l'errore tipico è diverso dalla forma giusta, la risposta di ogni quiz «pick» esiste, nessuna frase doppia nella stessa lezione. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { load } from "./lib/data.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2), dir = args.find((a, i) => !a.startsWith("--") && !["--out", "--solo", "--lezione"].includes(args[i - 1]));
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
if (!dir) { console.error("Uso: node tools/lezioni-check.mjs cartella-con-i-file [--out rapporto.md] [--solo zh|it] [--lezione N]"); process.exit(2); }
const rd = (f) => { const p = path.join(dir, f); return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : ""; };

/* ---------- fonti ---------- */
const CED = new Map();
for (const line of rd("cedict_ts.u8").split("\n")) {
  if (!line || line[0] === "#") continue;
  const m = /^(\S+) (\S+) \[([^\]]*)\] \/(.*)\/\s*$/.exec(line); if (m) { if (!CED.has(m[2])) CED.set(m[2], m[4].split("/")[0]); }
}
const tsv = (f) => rd(f).split("\n").filter(Boolean).map((l) => l.split("\t"));
const ZHN = new Map(), ITN = new Map();            /* testo normalizzato → id */
const zhText = new Map(), itText = new Map();      /* id → testo */
const normZ = (s) => s.replace(/[\s，。！？、；：,.!?;:“”"'‘’「」（）()…—-]/g, "");
const normI = (s) => s.toLowerCase().replace(/[\s.,!?;:"“”«»…—-]+/g, " ").replace(/’/g, "'").trim();
for (const [id, , t] of tsv("cmn.tsv")) { ZHN.set(normZ(t), id); zhText.set(id, t); }
for (const [id, , t] of tsv("ita.tsv")) { ITN.set(normI(t), id); itText.set(id, t); }
const LINK = new Map();                            /* id cmn → [id ita] e viceversa */
for (const [a, b] of tsv("cmn-ita.tsv")) { (LINK.get(a) || LINK.set(a, []).get(a)).push(b); (LINK.get(b) || LINK.set(b, []).get(b)).push(a); }
console.log(`fonti: CC-CEDICT ${CED.size} voci · Tatoeba cmn ${zhText.size}, ita ${itText.size}, legami ${LINK.size}`);

const D = load(path.join(ROOT, "src"));
const VOC = new Set(); D.SECTIONS.forEach((s) => s.words.forEach((w) => VOC.add(w[1])));
const CJK = /[㐀-鿿]/;

/* costruzioni che nessun manuale accetta: [regex, perché]. Solo certezze, poche. */
const REGOLE = [
  [/(?<![但可还就只要于总倒不])是(很|非常|太|真)/, "是 non si mette davanti a un aggettivo con 很/非常/太"],
  [/很不太/, "«很不太» non si dice"],
  [/不没|没不/, "不 e 没 non si sovrappongono"],
  [/在在/, "在 doppio"],
  [/了了(?!解)/, "了 doppio"],
  [/吗呢|呢吗/, "吗 e 呢 non stanno insieme come domanda"],
  [/都也|也都都/, "ordine di 也/都: 也 viene prima di 都"],
  [/我们们|你们们|他们们/, "plurale doppio"]
];

/* taglio per parole più lunghe (CC-CEDICT + vocabolario): restituisce i pezzi che non si riconoscono */
function unknown(zh) {
  const s = zh.replace(/[^㐀-鿿]/g, ""), out = [];
  for (let i = 0; i < s.length;) {
    let hit = 0;
    for (let n = Math.min(6, s.length - i); n >= 1; n--) { const w = s.slice(i, i + n); if (CED.has(w) || VOC.has(w)) { hit = n; break; } }
    if (!hit) { out.push(s[i]); i++; } else i += hit;
  }
  return out;
}

const rows = [], errs = [], flags = { attestate: 0, tot: 0 };
const say = (lv, l, kind, text, note) => rows.push({ lv, l, kind, text, note });
const only = opt("--solo"), one = opt("--lezione") ? +opt("--lezione") : 0;

function zhLesson(L) {
  const tag = "zh L" + L.n + " " + L.id, seen = new Set();
  const sents = [];
  (L.ex || []).forEach((e, i) => sents.push({ kind: "esempio " + (i + 1), zh: e[0], it: e[1], good: true }));
  (L.traps || []).forEach((t, i) => { sents.push({ kind: "errore " + (i + 1) + " (sbagliata)", zh: t[0], it: "", good: false }); sents.push({ kind: "errore " + (i + 1) + " (giusta)", zh: t[1], it: "", good: true }); });
  (L.dlg || []).forEach((d, i) => sents.push({ kind: "dialogo " + (i + 1), zh: d[1], it: d[2], good: true }));
  (L.quiz || []).forEach((q, i) => {
    if (q.k === "order") sents.push({ kind: "quiz " + (i + 1) + " ordine", zh: q.zh, it: q.it, good: true });
    else if (q.k === "pick") {
      const opts = q.opts || [];
      opts.forEach((o, j) => { if (CJK.test(o) && /[。？！]$/.test(o)) sents.push({ kind: "quiz " + (i + 1) + " opz " + (j + 1) + (j === q.a ? " (giusta)" : " (sbagliata)"), zh: o, it: "", good: j === q.a }); });
    }
    if (q.k === "pick" && (q.opts || [])[q.a] === undefined) errs.push(tag + ": quiz " + (i + 1) + " ha una risposta (a) che non esiste");
  });
  (L.traps || []).forEach((t, i) => { if (t[0] === t[1]) errs.push(tag + ": errore " + (i + 1) + " identico alla forma giusta"); });
  for (const s of sents) {
    flags.tot++;
    const key = normZ(s.zh);
    if (s.good && seen.has(key) && s.kind.startsWith("esempio")) say("lieve", tag, s.kind, s.zh, "frase doppia nella lezione");
    if (s.good && s.kind.startsWith("esempio")) seen.add(key);
    const u = unknown(s.zh);
    if (u.length) say("medio", tag, s.kind, s.zh, "non in CC-CEDICT né nel vocabolario: " + u.join(" "));
    const id = ZHN.get(key);
    if (id) {
      flags.attestate++;
      const tr = (LINK.get(id) || []).filter((x) => itText.has(x)).map((x) => itText.get(x));
      if (!s.good) say("medio", tag, s.kind, s.zh, "SOSPETTA: la forma «sbagliata» compare in Tatoeba (#" + id + ")" + (tr.length ? " = " + tr[0] : ""));
      else if (tr.length && s.it) say("info", tag, s.kind, s.zh, "attestata in Tatoeba (#" + id + "): nostra «" + s.it + "» · Tatoeba «" + tr[0] + "»");
      else say("info", tag, s.kind, s.zh, "attestata in Tatoeba (#" + id + ")");
    }
    if (s.good) for (const [re, why] of REGOLE) if (re.test(s.zh)) { errs.push(tag + ": «" + s.zh + "» " + why); }
  }
}

function itLesson(L) {
  const tag = "it L" + L.n + " " + L.id, seen = new Set();
  const sents = [];
  (L.ex || []).forEach((e, i) => sents.push({ kind: "esempio " + (i + 1), it: e[0], zh: e[1], good: true }));
  (L.traps || []).forEach((t, i) => { sents.push({ kind: "errore " + (i + 1) + " (sbagliata)", it: t[0], zh: "", good: false }); sents.push({ kind: "errore " + (i + 1) + " (giusta)", it: t[1], zh: "", good: true }); });
  (L.dlg || []).forEach((d, i) => sents.push({ kind: "dialogo " + (i + 1), it: d[1], zh: d[2], good: true }));
  (L.traps || []).forEach((t, i) => { if (t[0] === t[1]) errs.push(tag + ": errore " + (i + 1) + " identico alla forma giusta"); });
  (L.quiz || []).forEach((q, i) => { if (q.k === "pick" && (q.opts || [])[q.a] === undefined) errs.push(tag + ": quiz " + (i + 1) + " ha una risposta (a) che non esiste"); });
  for (const s of sents) {
    flags.tot++;
    const key = normI(s.it);
    if (s.zh) { const u = unknown(s.zh); if (u.length) say("medio", tag, s.kind, s.zh, "la traduzione cinese ha pezzi non in CC-CEDICT né nel vocabolario: " + u.join(" ")); }
    if (s.good && s.kind.startsWith("esempio")) { if (seen.has(key)) say("lieve", tag, s.kind, s.it, "frase doppia nella lezione"); seen.add(key); }
    const id = ITN.get(key);
    if (!id) continue;
    flags.attestate++;
    const tr = (LINK.get(id) || []).filter((x) => zhText.has(x)).map((x) => zhText.get(x));
    if (!s.good) say("medio", tag, s.kind, s.it, "SOSPETTA: la forma «sbagliata» compare in Tatoeba (#" + id + ")");
    else if (tr.length && s.zh) say("info", tag, s.kind, s.it, "attestata in Tatoeba (#" + id + "): nostra «" + s.zh + "» · Tatoeba «" + tr[0] + "»");
    else say("info", tag, s.kind, s.it, "attestata in Tatoeba (#" + id + ")");
  }
}

if (only !== "it") for (const L of D.LESSONS || []) if (!one || L.n === one) zhLesson(L);
if (only !== "zh") for (const L of D.ITLESSONS || []) if (!one || L.n === one) itLesson(L);

const by = (lv) => rows.filter((r) => r.lv === lv);
let md = "# Rapporto sulle lezioni\n\n" + `Frasi controllate: ${flags.tot} · attestate identiche in Tatoeba: ${flags.attestate}\n\n`;
md += "## ERRORI CERTI (" + errs.length + ")\n" + (errs.length ? errs.map((e) => "- " + e).join("\n") : "nessuno") + "\n\n";
for (const [lv, title] of [["medio", "Da guardare"], ["lieve", "Lievi"], ["info", "Informazioni (traduzioni di Tatoeba da confrontare)"]]) {
  md += "## " + title + " (" + by(lv).length + ")\n" + by(lv).map((r) => `- ${r.l} · ${r.kind}: ${r.text} — ${r.note}`).join("\n") + "\n\n";
}
const out = opt("--out");
if (out) { fs.writeFileSync(out, md); console.log("rapporto:", out); }
console.log(`ERRORI ${errs.length} · da guardare ${by("medio").length} · lievi ${by("lieve").length} · info ${by("info").length}`);
errs.slice(0, 20).forEach((e) => console.log("  ERRORE " + e));
process.exit(errs.length ? 1 : 0);
