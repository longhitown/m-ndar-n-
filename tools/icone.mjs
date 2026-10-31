#!/usr/bin/env node
/* màndarínō · icone: controlla la cartella icone/ (fonte unica), costruisce lo sprite e le somme SHA-256 e cerca le emoji ancora nell'app.
   Nessuna dipendenza. L'architettura, la licenza e le regole del set sono in icone/ICONE.md; il perché del disegno in icone/DESIGN.md.

   node tools/icone.mjs              controlla (manifest, SVG, sprite, somme, emoji) e stampa un riepilogo; esce con 1 se qualcosa non va
   node tools/icone.mjs --scrivi     riscrive icone/sprite.svg, icone/SHA256SUMS.txt e la tabella delle somme in icone/ICONE.md
   node tools/icone.mjs --emoji      elenca le emoji ancora nel codice dell'app e se sono mappate */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), ".."), DIR = path.join(ROOT, "icone");
const COL = ["#DB5F00", "#C0281D"];   /* i soli due colori ammessi nei file, come valori di riserva delle variabili CSS */
const EMOJI = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu;
const norm = (e) => e.replace(/\uFE0F/g, "");
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const read = (f) => fs.readFileSync(path.join(DIR, f));
const manifest = () => JSON.parse(read("manifest.json").toString("utf8"));

/* i file SVG sotto icone/svg, con percorso relativo a icone/ */
function svgFiles() {
  const out = [];
  const walk = (d) => { for (const e of fs.readdirSync(path.join(DIR, d), { withFileTypes: true })) { const p = d + "/" + e.name; if (e.isDirectory()) walk(p); else out.push(p); } };
  if (fs.existsSync(path.join(DIR, "svg"))) walk("svg");
  return out.sort();
}
/* l'interno di un SVG (senza il titolo): è quello che va nello <symbol> */
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/\s*<title[^>]*>[\s\S]*?<\/title>/, "").trim();
const rootAttrs = (svg) => (svg.match(/<svg([^>]*)>/) || [, ""])[1];

export function sprite() {
  const m = manifest(), body = m.icone.filter((i) => i.file).sort((a, b) => a.id.localeCompare(b.id)).map((i) => {
    const s = read(i.file).toString("utf8");
    return `<symbol id="i-${i.id}" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">\n${inner(s).split("\n").map((l) => "  " + l.trim()).join("\n")}\n</symbol>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">\n<!-- màndarínō · icone ${m.versione} (${m.set}) · © ${m.autore}, ${m.licenza} · file generato da tools/icone.mjs, non si modifica a mano -->\n${body.join("\n")}\n</svg>\n`;
}
/* somme di ogni file del set, in ordine, nel formato di sha256sum */
export function sums() {
  const files = ["manifest.json", ...svgFiles(), "sprite.svg"].filter((f) => fs.existsSync(path.join(DIR, f)));
  return files.map((f) => ({ file: f, sha: sha(f === "sprite.svg" ? fs.readFileSync(path.join(DIR, f)) : read(f)) }));
}
export const sumsText = () => sums().map((x) => `${x.sha}  ${x.file}`).join("\n") + "\n";
const TABLE_A = "<!-- somme:inizio -->", TABLE_B = "<!-- somme:fine -->";
export function table() {
  const m = manifest(), s = Object.fromEntries(sums().map((x) => [x.file, x.sha]));
  const all = sha(Buffer.from(sumsText()));
  return [`| File | SHA-256 |`, `|---|---|`, `| \`icone/sprite.svg\` (tutte le icone disegnate, in un file) | \`${s["sprite.svg"] || "-"}\` |`, `| \`icone/manifest.json\` (nomi, categorie, emoji sostituite) | \`${s["manifest.json"]}\` |`,
    `| \`icone/SHA256SUMS.txt\` (una riga per ogni file SVG, ${m.icone.filter((i) => i.file).length} icone) | \`${all}\` (somma del suo contenuto) |`].join("\n");
}

/* ---- controlli ---- */
export function problems() {
  const out = [], m = manifest(), ids = new Set(), files = svgFiles();
  if (m.griglia !== 24 || m.tratto !== 1.8) out.push("manifest: griglia 24 e tratto 1.8 sono il set (non si cambiano a metà)");
  if (m.icone.length < m.obiettivoFase1) out.push(`manifest: servono ${m.obiettivoFase1} voci per la fase 1 (ci sono ${m.icone.length})`);
  const emojiMap = new Map();
  for (const i of m.icone) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(i.id)) out.push(`manifest: id non valido «${i.id}» (minuscole e trattini)`);
    if (ids.has(i.id)) out.push(`manifest: id doppio «${i.id}»`); ids.add(i.id);
    if (!i.it || !i.zh) out.push(`manifest: ${i.id} senza nome in italiano o in cinese`);
    if (!["ui", "studio", "vita", "comunita"].includes(i.categoria)) out.push(`manifest: ${i.id} ha una categoria sconosciuta`);
    if (!["disegnata", "da-disegnare"].includes(i.stato)) out.push(`manifest: ${i.id} ha uno stato sconosciuto`);
    if ((i.stato === "disegnata") !== !!i.file) out.push(`manifest: ${i.id} deve avere il file se e solo se è disegnata`);
    for (const e of i.emoji || []) { if (emojiMap.has(norm(e))) out.push(`manifest: l'emoji ${e} è mappata due volte (${emojiMap.get(norm(e))} e ${i.id})`); emojiMap.set(norm(e), i.id); }
  }
  const listed = new Set(m.icone.filter((i) => i.file).map((i) => i.file));
  for (const f of files) if (!listed.has(f)) out.push(`${f}: file SVG non presente nel manifest`);
  for (const i of m.icone.filter((x) => x.file)) {
    const f = i.file;
    if (!fs.existsSync(path.join(DIR, f))) { out.push(`${f}: file mancante`); continue; }
    if (f !== `svg/${i.categoria}/${i.id}.svg`) out.push(`${f}: il percorso deve essere svg/${i.categoria}/${i.id}.svg`);
    const s = read(f).toString("utf8"), a = rootAttrs(s);
    if (!/viewBox="0 0 24 24"/.test(a)) out.push(`${f}: viewBox deve essere 0 0 24 24`);
    if (!/stroke-width="1\.8"/.test(a) || !/stroke-linecap="round"/.test(a) || !/stroke-linejoin="round"/.test(a)) out.push(`${f}: tratto 1.8 con terminazioni e giunzioni arrotondate sulla radice`);
    if (!new RegExp(`<title id="t">${i.it.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</title>`).test(s)) out.push(`${f}: il titolo deve essere «${i.it}» (nome del manifest)`);
    const tags = [...s.matchAll(/<([a-z]+)\b/g)].map((x) => x[1]).filter((t) => t !== "svg" && t !== "title");
    if (!tags.length) out.push(`${f}: nessuna forma`);
    for (const t of new Set(tags)) if (!["path", "circle"].includes(t)) out.push(`${f}: elemento non ammesso <${t}> (solo path e circle)`);
    if (/<(script|style|image|text|filter|linearGradient|radialGradient)\b/i.test(s) || /\son[a-z]+=/i.test(s) || /url\(|href=/i.test(s)) out.push(`${f}: contenuti non ammessi (script, stili, immagini, gradienti, collegamenti)`);
    for (const c of s.match(/#[0-9a-fA-F]{3,8}\b/g) || []) if (!COL.includes(c.toUpperCase())) out.push(`${f}: colore fisso non ammesso ${c} (solo i valori di riserva ${COL.join(" e ")})`);
    for (const v of s.match(/var\(--[a-z]+/g) || []) if (!["var(--im", "var(--iv", "var(--ia"].includes(v)) out.push(`${f}: variabile non ammessa ${v})`);
    if (/fill="#|stroke="#/.test(s)) out.push(`${f}: i colori vanno negli stili con le variabili, non negli attributi`);
    for (const n of (s.match(/\bd="([^"]*)"/g) || []).join(" ").match(/-?\d+(\.\d+)?/g) || []) { const v = parseFloat(n); if (v < -0.01 || v > 24.01) { out.push(`${f}: coordinata fuori dal quadrato 24: ${n}`); break; } }
    if (s.length > 1800) out.push(`${f}: troppo pesante (${s.length} byte, massimo 1800)`);
    if (!/\n$/.test(s) || /\r/.test(s)) out.push(`${f}: fine riga LF e newline finale`);
  }
  /* sprite e somme aggiornati */
  const sp = path.join(DIR, "sprite.svg");
  if (!fs.existsSync(sp) || fs.readFileSync(sp, "utf8") !== sprite()) out.push("icone/sprite.svg non è aggiornato (node tools/icone.mjs --scrivi)");
  const sf = path.join(DIR, "SHA256SUMS.txt");
  if (!fs.existsSync(sf) || fs.readFileSync(sf, "utf8") !== sumsText()) out.push("icone/SHA256SUMS.txt non è aggiornato (node tools/icone.mjs --scrivi)");
  const md = path.join(DIR, "ICONE.md");
  if (fs.existsSync(md)) { const t = fs.readFileSync(md, "utf8"), a = t.indexOf(TABLE_A), b = t.indexOf(TABLE_B); if (a < 0 || b < 0 || t.slice(a + TABLE_A.length, b).trim() !== table().trim()) out.push("icone/ICONE.md: la tabella delle somme non è aggiornata (node tools/icone.mjs --scrivi)"); } else out.push("icone/ICONE.md manca");
  return out;
}
/* le emoji nel codice dell'app (src/, esclusi vendor e audio): quali, quante, e se il manifest le conosce */
export function emojiInSrc() {
  const m = manifest(), map = new Set(m.icone.flatMap((i) => (i.emoji || []).map(norm))), ok = new Set((m.consentitiComeTesto || []).map(norm)), found = new Map();
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!["vendor", "audio"].includes(e.name)) walk(p); } else if (/\.(js|html|css)$/.test(e.name)) for (const x of fs.readFileSync(p, "utf8").match(EMOJI) || []) { const k = norm(x); found.set(k, (found.get(k) || 0) + 1); } } };
  walk(path.join(ROOT, "src"));
  const rows = [...found].map(([e, n]) => ({ e, n, mappata: map.has(e), testo: ok.has(e) })).sort((a, b) => b.n - a.n);
  return { rows, nonMappate: rows.filter((r) => !r.mappata && !r.testo), totale: rows.reduce((s, r) => s + r.n, 0), attiva: !!m.sostituzioneAttiva };
}
/* con la sostituzione attiva (dopo la PR che cambia l'app) ogni emoji rimasta è un errore; prima, è un errore solo se non è mappata */
export function emojiProblems() {
  const r = emojiInSrc(), out = r.nonMappate.map((x) => `emoji senza icona nel manifest: ${x.e} (${x.n} volte)`);
  if (r.attiva) for (const x of r.rows.filter((y) => !y.testo)) out.push(`emoji ancora nel codice con la sostituzione attiva: ${x.e} (${x.n} volte)`);
  return out;
}

function main() {
  const a = process.argv.slice(2);
  if (a.includes("--scrivi")) {
    fs.writeFileSync(path.join(DIR, "sprite.svg"), sprite());
    fs.writeFileSync(path.join(DIR, "SHA256SUMS.txt"), sumsText());
    const md = path.join(DIR, "ICONE.md");
    if (fs.existsSync(md)) { let t = fs.readFileSync(md, "utf8"); const i = t.indexOf(TABLE_A), j = t.indexOf(TABLE_B); if (i >= 0 && j >= 0) { t = t.slice(0, i + TABLE_A.length) + "\n" + table() + "\n" + t.slice(j); fs.writeFileSync(md, t); } }
    console.log("✓ scritti icone/sprite.svg, icone/SHA256SUMS.txt e la tabella in icone/ICONE.md");
    return;
  }
  if (a.includes("--emoji")) { const r = emojiInSrc(); for (const x of r.rows) console.log(`${x.e}\t${x.n}\t${x.mappata ? "mappata" : x.testo ? "testo" : "NON MAPPATA"}`); console.log(`\n${r.rows.length} emoji diverse, ${r.totale} occorrenze, ${r.nonMappate.length} non mappate · sostituzione ${r.attiva ? "attiva" : "non ancora attiva"}`); return; }
  const m = manifest(), p = problems().concat(emojiProblems());
  for (const x of p) console.log("✗ " + x);
  console.log(`${p.length ? "✗" : "✓"} icone: ${m.icone.filter((i) => i.stato === "disegnata").length} disegnate su ${m.icone.length} (fase 1: ${m.obiettivoFase1}) · ${p.length} problemi`);
  process.exit(p.length ? 1 : 0);
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
