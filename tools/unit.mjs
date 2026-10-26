#!/usr/bin/env node
/* màndarínō · prove veloci senza browser e senza dipendenze (le gira la CI prima di tutto il resto):
   1. il taglio in parole (src/core/segment.js) sui casi difficili già risolti, perché non tornino indietro;
   2. le regole di unione dei backup e della sincronizzazione (src/core/store.js), in una sandbox con un localStorage finto;
   3. il peso dell'avvio: i byte di JavaScript che il telefono deve compilare all'apertura (dist/index.html).
   Uso: node tools/unit.mjs */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { lab } from "./lib/lab.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), ".."), SRC = path.join(ROOT, "src");
const results = [];
const check = (name, ok, detail) => { results.push(!!ok); console.log((ok ? "✓ " : "✗ ") + name + (ok || !detail ? "" : " — " + detail)); };

/* ---- 1. taglio in parole ---- */
const L = lab(SRC);
const cut = (zh) => L.CP.segment(zh).filter((x) => !x.p).map((x) => x.raw).join("|");
const CASES = [
  ["你有时间吗", "你|有|时间|吗"], ["他从中国来", "他|从|中国|来"], ["我想学中文", "我|想|学|中文"],
  ["只有努力才能成功", "只有|努力|才|能|成功"], ["他的才能很高", "他|的|才能|很|高"], ["这个人很好", "这个|人|很|好"],
  ["他的话", "他|的|话"], ["八点十分", "八|点|十|分"], ["有一些人不喜欢吃辣", "有|一些|人|不|喜欢|吃|辣"]
];
for (const [zh, want] of CASES) { const got = cut(zh); check("taglio: " + zh + " → " + want, got === want, got); }

/* ---- 2. unione dei dati (backup, sincronizzazione) ---- */
function sandbox() {
  const mem = {};
  const LS = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; }, key: (i) => Object.keys(mem)[i], get length() { return Object.keys(mem).length; } };
  const ctx = vm.createContext({ console, setTimeout, clearTimeout, Promise, JSON, Date, Math, localStorage: LS });
  ctx.window = ctx; ctx.Storage = function () {}; ctx.Storage.prototype = {};
  vm.runInContext(fs.readFileSync(path.join(SRC, "core/store.js"), "utf8"), ctx, { filename: "core/store.js" });
  return { Store: ctx.Store, LS, mem };
}
{
  const { Store, LS } = sandbox();
  const day = { w: ["好"], s: 1 };
  LS.setItem("cp-srs-v1", JSON.stringify({ 好: { n: 3, lr: 200 }, 你: { n: 1, lr: 100 } }));
  LS.setItem("cp-game-v1", JSON.stringify({ xp: 150, base: 50, xpBy: { a: 100 }, goal: 10, days: { "2026-10-01": day }, best: 5 }));
  LS.setItem("cp-fav-v1", JSON.stringify(["好"]));
  const inc = { app: "mandarino", v: 5, kv: {
    "cp-srs-v1": JSON.stringify({ 好: { n: 2, lr: 100 }, 我: { n: 1, lr: 300 } }),
    "cp-game-v1": JSON.stringify({ xp: 120, base: 50, xpBy: { a: 60, b: 70 }, goal: 20, days: { "2026-10-01": { w: ["我"] }, "2026-10-02": { w: ["你"] } }, best: 9 }),
    "cp-fav-v1": JSON.stringify(["我"]) }, log: [] };
  const r = await Store.importObj(inc, "merge");
  const srs = JSON.parse(LS.getItem("cp-srs-v1")), g = JSON.parse(LS.getItem("cp-game-v1")), fav = JSON.parse(LS.getItem("cp-fav-v1"));
  check("unione: per ogni parola vince il ripasso più recente, le parole nuove si aggiungono", srs["好"].lr === 200 && srs["我"] && srs["你"] && r.changed);
  check("unione: punti per dispositivo senza doppioni (base 50 + a 100 + b 70 = 220), giorni uniti, record più alto", g.xp === 220 && g.days["2026-10-01"].w.length === 2 && g.days["2026-10-02"] && g.best === 9 && g.goal === 10, JSON.stringify(g));
  check("unione: preferiti uniti", fav["好"] && fav["我"]);
  const again = await Store.importObj(inc, "merge");
  check("unione: rifarla con gli stessi dati non cambia niente", !again.changed);
}

/* ---- 3. peso dell'avvio ---- */
{
  const html = fs.readFileSync(path.join(ROOT, "dist/index.html"), "utf8");
  let js = 0, lazy = 0;
  for (const m of html.matchAll(/<script(\b[^>]*)>([\s\S]*?)<\/script>/g)) { if (/type="(application\/json|text\/plain)"/.test(m[1])) lazy += m[2].length; else js += m[2].length; }
  const KB = (n) => Math.round(n / 1024);
  console.log("  (avvio: " + KB(js) + " KB di JavaScript da compilare, " + KB(lazy) + " KB di dati e librerie letti solo quando servono)");
  check("avvio: JavaScript da compilare all'apertura sotto i 1500 KB", js < 1500 * 1024, KB(js) + " KB");
  check("avvio: i dati pesanti (esempi, tratti, lessico, jsQR) restano fuori dalla compilazione iniziale", lazy > 700 * 1024, KB(lazy) + " KB");
}

console.log("\n" + results.filter(Boolean).length + "/" + results.length + " prove superate.");
process.exit(results.every(Boolean) ? 0 : 1);
