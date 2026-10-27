#!/usr/bin/env node
/* màndarínō · emissione dei sigilli di gratitudine, sul computer dell'autore. Node puro, nessuna dipendenza, nessuna rete,
   nessun invio automatico di e-mail. L'app non ne sa nulla: qui nascono i codici firmati che l'autore spedisce a mano.
   Procedura completa: docs/sigilli.md.

   Uso:
     node tools/seal-issue.mjs process <file…> [--manual "email=…,amount=…,currency=EUR,id=…,date=AAAA-MM-GG,message=SIGILLO"]
                                [--map "Colonna=campo,…"] [--today AAAA-MM-GG] [--apply] [--kid k2026] [--key file.pem] [--site URL]
     node tools/seal-issue.mjs merge --from a@x --into b@y [--apply]     (due indirizzi della stessa persona)
     node tools/seal-issue.mjs forget --email a@x [--apply]              (cancella una persona dal registro)
     node tools/seal-issue.mjs export-anon                               (riepilogo senza dati personali)
     node tools/seal-issue.mjs status

   Ingressi equivalenti: notifiche dei webhook di Ko-fi (JSON: un oggetto, un elenco o una per riga; campi message_id,
   kofi_transaction_id, type Tip/Donation, from_name, message, amount come stringa, currency, email, timestamp), un CSV
   esportato dal pannello di Ko-fi con una mappa esplicita delle colonne (--map, perché il formato non è garantito), o
   una donazione scritta a mano (--manual). Regole (costanti qui sotto):
   - si elaborano solo le donazioni che nel messaggio contengono SIGILLO, 印章 o SEAL (senza distinzione di maiuscole);
   - la chiave è kofi_transaction_id (o message_id): rielaborare non emette niente di nuovo;
   - persona = e-mail normalizzata; il nome non fa fede;
   - totale cumulativo in euro, con i cambi del file cambi.json (aggiornato a mano), arrotondando a favore di chi dona;
   - attesa di HOLD_DAYS giorni dalla donazione (contestazioni: un codice offline non si può revocare);
   - livello = il più alto la cui soglia è raggiunta; chi sale di fascia riceve il sigillo nuovo e tiene i precedenti;
   - sotto SEAL_MIN_EUR niente sigillo, ma una bozza di ringraziamento senza importi.
   Senza --apply è una simulazione: mostra che cosa farebbe e non scrive nulla. Il registro è un dato personale: sta in
   $MANDARINO_SEAL_HOME (altrimenti ~/.mandarino-sigilli), mai nel repository; fanne una copia di sicurezza. */
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";
import vm from "vm";
import { fileURLToPath } from "url";

export const SEAL_MIN_EUR = 5;
export const LEVELS = [{ eur: 51, lvl: 3 }, { eur: 20, lvl: 2 }, { eur: 5, lvl: 1 }];   /* il più alto raggiunto */
export const HOLD_DAYS = 7;
export const KEYWORD = /sigillo|印章|\bseal\b/i;
const NAMES = { 1: ["Sigillo del Sostegno", "支持之印"], 2: ["Sigillo della Cultura", "交流之印"], 3: ["Sigillo del Custodire", "永恒之印"] };

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOME = process.env.MANDARINO_SEAL_HOME || path.join(os.homedir(), ".mandarino-sigilli");
const REG = path.join(HOME, "registro.json"), RATES = path.join(HOME, "cambi.json");

/* ---- codice e QR: gli stessi moduli dell'app ---- */
function appModule(file, extra) {
  const ctx = vm.createContext(Object.assign({ btoa, atob, TextEncoder, TextDecoder, crypto: globalThis.crypto, Math, JSON }, extra || {}));
  vm.runInContext(fs.readFileSync(path.join(ROOT, "src", file), "utf8"), ctx);
  return ctx;
}
const MDSeal = appModule("core/seal-code.js").MDSeal;
function qrSVG(text) {
  const c2 = vm.createContext({ window: { CP: {} }, Math, JSON, TextEncoder });
  vm.runInContext("var CP = window.CP;" + fs.readFileSync(path.join(ROOT, "src/pwa/qr.js"), "utf8"), c2);
  const q = c2.window.CP.qr.encode(text, "M"), n = q.size + 8;
  let d = ""; for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.get(x, y)) d += "M" + (x + 4) + " " + (y + 4) + "h1v1h-1z";
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + " " + n + '" width="' + n * 8 + '" height="' + n * 8 + '" shape-rendering="crispEdges"><rect width="' + n + '" height="' + n + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>\n';
}

/* ---- ingressi ---- */
const norm = (e) => String(e || "").trim().toLowerCase().replace(/\s+/g, "");
function fromWebhook(o) {
  if (o && typeof o.data === "string") { try { o = JSON.parse(o.data); } catch (e) { return null; } }
  if (!o || typeof o !== "object") return null;
  return { id: String(o.kofi_transaction_id || o.message_id || ""), email: norm(o.email), amount: parseFloat(String(o.amount || "0").replace(",", ".")), currency: String(o.currency || "EUR").toUpperCase(),
    date: String(o.timestamp || o.date || "").slice(0, 10), message: String(o.message || ""), type: String(o.type || ""), name: String(o.from_name || "") };
}
function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(cur); cur = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
export function readInputs(files, opt) {
  const out = [];
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    if (/\.csv$/i.test(f)) {
      if (!opt.map) throw new Error("Per un CSV serve --map \"Colonna=campo,…\" (campi: id, email, amount, currency, date, message, type, name): il formato del pannello di Ko-fi non è garantito.");
      const map = Object.fromEntries(opt.map.split(",").map((x) => x.split("=").map((s) => s.trim())));
      const [head, ...rows] = parseCSV(text);
      for (const r of rows) { const o = {}; head.forEach((h, i) => { if (map[h.trim()]) o[map[h.trim()]] = r[i]; }); out.push({ id: String(o.id || ""), email: norm(o.email), amount: parseFloat(String(o.amount || "0").replace(",", ".")), currency: String(o.currency || "EUR").toUpperCase(), date: String(o.date || "").slice(0, 10), message: String(o.message || ""), type: String(o.type || "Donation"), name: String(o.name || "") }); }
    } else {
      let items;
      try { const j = JSON.parse(text); items = Array.isArray(j) ? j : [j]; } catch (e) { items = text.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l)); }
      for (const o of items) { const r = fromWebhook(o); if (r) out.push(r); }
    }
  }
  if (opt.manual) { const o = Object.fromEntries(opt.manual.split(",").map((x) => { const i = x.indexOf("="); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; })); out.push({ id: o.id || "", email: norm(o.email), amount: parseFloat(o.amount), currency: (o.currency || "EUR").toUpperCase(), date: (o.date || "").slice(0, 10), message: o.message || "SIGILLO", type: "Donation", name: o.name || "" }); }
  return out;
}

/* ---- registro ---- */
export function loadReg() { try { return JSON.parse(fs.readFileSync(REG, "utf8")); } catch (e) { return { v: 1, people: {}, done: {}, counters: {} }; } }
function saveReg(r) { fs.mkdirSync(HOME, { recursive: true, mode: 0o700 }); fs.writeFileSync(REG, JSON.stringify(r, null, 1), { mode: 0o600 }); }
function loadRates() { try { return JSON.parse(fs.readFileSync(RATES, "utf8")); } catch (e) { return { EUR: 1 }; } }
export const levelFor = (cents) => { for (const l of LEVELS) if (cents >= l.eur * 100) return l.lvl; return 0; };
const days = (a, b) => Math.floor((Date.parse(b) - Date.parse(a)) / 86400000);

/* il cuore: dato il registro e le donazioni, che cosa cambia (funzione pura, provata da tools/unit.mjs) */
export function plan(reg, donations, today, rates) {
  const R = JSON.parse(JSON.stringify(reg)), log = { used: [], skipped: [], waiting: [], ignored: [], issue: [], thanks: [] }, touched = new Set();
  for (const d of donations) {
    if (!d.id) { log.skipped.push([d, "senza id della transazione"]); continue; }
    if (R.done[d.id]) { log.skipped.push([d, "già elaborata"]); continue; }
    if (!/^(tip|donation)$/i.test(d.type || "Donation")) { log.skipped.push([d, "tipo " + d.type]); continue; }
    if (!KEYWORD.test(d.message || "")) { log.ignored.push(d); continue; }   /* mai scrivere a chi non lo ha chiesto */
    if (!d.email) { log.skipped.push([d, "senza e-mail"]); continue; }
    if (!d.date || days(d.date, today) < HOLD_DAYS) { log.waiting.push(d); continue; }
    const rate = rates[d.currency]; if (!rate) { log.skipped.push([d, "manca il cambio per " + d.currency + " in cambi.json"]); continue; }
    const cents = Math.ceil(d.amount * rate * 100 - 1e-9);   /* a favore di chi dona */
    const p = R.people[d.email] || (R.people[d.email] = { cents: 0, tx: [], seals: [], first: d.date });
    p.cents += cents; p.tx.push(d.id); p.last = d.date; R.done[d.id] = 1; touched.add(d.email);
    log.used.push([d, cents]);
  }
  const year = String(today).slice(0, 4);
  for (const email of touched) {
    const p = R.people[email], lvl = levelFor(p.cents), held = Math.max(0, ...p.seals.map((s) => s.lvl));
    if (lvl > held) {
      const c = R.counters[year] || (R.counters[year] = {}); c[lvl] = (c[lvl] || 0) + 1;
      const s = { lvl, year: +year, num: c[lvl], at: today }; p.seals.push(s); log.issue.push({ email, seal: s, eur: p.cents / 100 });
    } else if (!lvl) log.thanks.push({ email });
  }
  return { reg: R, log };
}

async function ask(q) {
  if (process.env.MANDARINO_SEAL_PASS) return process.env.MANDARINO_SEAL_PASS;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const a = await new Promise((r) => rl.question(q, r)); rl.close(); return a;
}
function keyFile(opt) {
  if (opt.key) return { file: opt.key, kid: opt.kid || path.basename(opt.key).replace(/^seal-private-|\.pem$/g, "") };
  const fl = fs.existsSync(HOME) ? fs.readdirSync(HOME).filter((f) => /^seal-private-.+\.pem$/.test(f)).sort() : [];
  const f = opt.kid ? "seal-private-" + opt.kid + ".pem" : fl[fl.length - 1];
  if (!f || !fs.existsSync(path.join(HOME, f))) throw new Error("Nessuna chiave privata in " + HOME + " (node tools/seal-keygen.mjs).");
  return { file: path.join(HOME, f), kid: f.replace(/^seal-private-|\.pem$/g, "") };
}
export function sign(seal, key, kid) {
  const p = MDSeal.make(kid, seal.lvl, seal.year, seal.num);
  return MDSeal.encode(p, new Uint8Array(crypto.sign("sha256", Buffer.from(p), { key, dsaEncoding: "ieee-p1363" })));
}
function siteURL(opt) {
  if (opt.site) return opt.site;
  const m = /SITE_URL:\s*"([^"]*)"/.exec(fs.readFileSync(path.join(ROOT, "src/config.js"), "utf8")); return m ? m[1] : "";
}
/* il link di un sigillo apre l'app: se l'indirizzo è quello del sito (…/), si aggiunge app/; se è già quello dell'app (…/app/) resta com'è */
function appURL(site) { const b = site.replace(/#.*$/, "").replace(/\/?$/, "/"); return /\/app\/$/.test(b) ? b : b + "app/"; }
function tpl(name, v) { return fs.readFileSync(path.join(ROOT, "docs/sigilli", name), "utf8").replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)); }

async function main() {
  const [cmd, ...rest] = process.argv.slice(2), opt = { files: [] };
  for (let i = 0; i < rest.length; i++) { const a = rest[i]; if (a === "--apply") opt.apply = true; else if (a.startsWith("--")) opt[a.slice(2)] = rest[++i]; else opt.files.push(a); }
  console.log("⚠️  Questo strumento tratta dati personali (e-mail). Il registro sta in " + HOME + ", fuori dal repository: non condividerlo.\n");
  const reg = loadReg();
  if (cmd === "status") { const n = Object.keys(reg.people).length; console.log(n + " persone nel registro, " + Object.keys(reg.done).length + " transazioni elaborate. Contatori:", JSON.stringify(reg.counters)); return; }
  if (cmd === "export-anon") { const by = { 1: 0, 2: 0, 3: 0 }; Object.values(reg.people).forEach((p) => p.seals.forEach((s) => by[s.lvl]++)); console.log(JSON.stringify({ persone: Object.keys(reg.people).length, sigilli: by, contatori: reg.counters }, null, 1)); return; }
  if (cmd === "forget") {
    const e = norm(opt.email); if (!reg.people[e]) { console.log("Nessuna persona con " + e); return; }
    console.log((opt.apply ? "Cancello " : "Cancellerei ") + e + " dal registro (i numeri già emessi restano usati)."); if (opt.apply) { delete reg.people[e]; saveReg(reg); } return;
  }
  if (cmd === "merge") {
    const a = norm(opt.from), b = norm(opt.into); if (!reg.people[a] || !reg.people[b]) { console.log("Servono due persone presenti nel registro."); return; }
    const P = reg.people[b], Q = reg.people[a]; P.cents += Q.cents; P.tx = P.tx.concat(Q.tx); P.seals = P.seals.concat(Q.seals);
    console.log((opt.apply ? "Unisco " : "Unirei ") + a + " in " + b + ": totale " + (P.cents / 100).toFixed(2) + " €. Un eventuale livello nuovo arriva al prossimo «process»."); if (opt.apply) { delete reg.people[a]; saveReg(reg); } return;
  }
  if (cmd !== "process") { console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]); return; }
  const today = opt.today || new Date().toISOString().slice(0, 10);
  const { reg: R, log } = plan(reg, readInputs(opt.files, opt), today, loadRates());
  log.used.forEach(([d, c]) => console.log("· elaborata " + d.id + " (" + d.amount + " " + d.currency + " = " + (c / 100).toFixed(2) + " €)"));
  log.waiting.forEach((d) => console.log("… in attesa " + d.id + " (" + d.date + ", meno di " + HOLD_DAYS + " giorni)"));
  log.ignored.forEach((d) => console.log("– ignorata " + d.id + ": il messaggio non chiede il sigillo"));
  log.skipped.forEach(([d, why]) => console.log("– saltata " + (d.id || "?") + ": " + why));
  log.thanks.forEach((t) => console.log("♥ sotto la soglia, bozza di ringraziamento per " + t.email));
  log.issue.forEach((x) => console.log("★ " + x.email + " → " + NAMES[x.seal.lvl][0] + ", edizione " + x.seal.year + " n. " + x.seal.num + " (totale " + x.eur.toFixed(2) + " €)"));
  if (!opt.apply) { console.log("\nSimulazione: niente è stato scritto. Rilancia con --apply per emettere."); return; }
  let key = null, kid = "";
  if (log.issue.length) { const k = keyFile(opt); kid = k.kid; key = crypto.createPrivateKey({ key: fs.readFileSync(k.file, "utf8"), passphrase: await ask("Frase segreta della chiave " + kid + ": ") }); }
  const outDir = path.join(HOME, "uscita", today), site = siteURL(opt);
  if (!site && log.issue.length) console.log("\n(MD_CONFIG.SITE_URL è vuoto e manca --site: le e-mail avranno il codice e il QR ma non il link.)");
  for (const x of log.issue) {
    const code = sign(x.seal, key, kid), link = site ? appURL(site) + "#seal=" + code : "", dir = path.join(outDir, x.seal.year + "-" + x.seal.lvl + "-" + x.seal.num);
    const v = { SIGILLO: NAMES[x.seal.lvl][0], SIGILLO_ZH: NAMES[x.seal.lvl][1], EDIZIONE: x.seal.year, NUMERO: x.seal.num, CODICE: code, LINK: link || "(apri l'app → ⚙️ → Sostieni il progetto → Riscatta un sigillo)" };
    const mail = tpl("email-it.txt", v) + "\n\n———\n\n" + tpl("email-zh.txt", v);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(dir, "codice.txt"), code + "\n"); if (link) fs.writeFileSync(path.join(dir, "link.txt"), link + "\n");
    fs.writeFileSync(path.join(dir, "qr.svg"), qrSVG(link || code)); fs.writeFileSync(path.join(dir, "email.txt"), mail);
    fs.writeFileSync(path.join(dir, "mailto.txt"), "mailto:" + x.email + "?subject=" + encodeURIComponent("màndarínō · " + v.SIGILLO + " · " + v.SIGILLO_ZH) + "&body=" + encodeURIComponent(mail) + "\n");
    console.log("✓ " + dir);
  }
  for (const t of log.thanks) { const dir = path.join(outDir, "grazie"); fs.mkdirSync(dir, { recursive: true, mode: 0o700 }); fs.writeFileSync(path.join(dir, t.email.replace(/[^a-z0-9.@_-]/g, "_") + ".txt"), "A: " + t.email + "\n\n" + tpl("grazie-it.txt", {}) + "\n\n———\n\n" + tpl("grazie-zh.txt", {})); }
  saveReg(R); console.log("\nRegistro aggiornato. Rivedi i file in " + outDir + " e spedisci le e-mail a mano.");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error("✗ " + e.message); process.exit(1); });
