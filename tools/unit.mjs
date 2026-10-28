#!/usr/bin/env node
/* màndarínō · prove veloci senza browser e senza dipendenze (le gira la CI prima di tutto il resto):
   1. il taglio in parole (src/core/segment.js) sui casi difficili già risolti, perché non tornino indietro;
   2. le regole di unione dei backup e della sincronizzazione (src/core/store.js), in una sandbox con un localStorage finto;
   3. il peso dell'avvio: i byte di JavaScript che il telefono deve compilare all'apertura (dist/index.html).
   Uso: node tools/unit.mjs */
import fs from "fs";
import os from "os";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { lab } from "./lib/lab.mjs";
import { recipes, recipesFile } from "./lib/radicali.mjs";

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

/* ---- 2b. test di livello e sblocchi tra dispositivi ---- */
{
  const { Store, LS } = sandbox();
  /* punti del test di livello: lo stesso test visto da due dispositivi conta una volta; due test diversi: vale il più alto;
     un «annulla» vince sull'unione */
  LS.setItem("cp-game-v1", JSON.stringify({ base: 0, xpBy: { a: 100 }, goal: 10, days: {}, best: 0, pl: { "a-1": 600 } }));
  await Store.importObj({ app: "mandarino", v: 5, kv: { "cp-game-v1": JSON.stringify({ base: 0, xpBy: { a: 100, b: 50 }, goal: 10, days: {}, best: 0, pl: { "a-1": 600, "b-2": 200 } }) }, log: [] }, "merge");
  let g = JSON.parse(LS.getItem("cp-game-v1"));
  check("test di livello: i punti concessi non si contano due volte unendo due dispositivi (100 + 50 + 600 = 750)", g.xp === 750, JSON.stringify(g));
  await Store.importObj({ app: "mandarino", v: 5, kv: { "cp-game-v1": JSON.stringify({ base: 0, xpBy: { a: 100, b: 50 }, goal: 10, days: {}, best: 0, pl: { "a-1": -1, "b-2": -1 } }) }, log: [] }, "merge");
  g = JSON.parse(LS.getItem("cp-game-v1"));
  check("test di livello: «annulla il salto» vince sull'unione (restano 150 punti)", g.xp === 150, JSON.stringify(g));
  /* corso di italiano: chiave propria, stessa regola */
  LS.setItem("cp-it-game-v1", JSON.stringify({ base: 40, xpBy: { a: 30 }, goal: 10, days: {}, best: 0 }));
  await Store.importObj({ app: "mandarino", v: 5, kv: { "cp-it-game-v1": JSON.stringify({ base: 40, xpBy: { a: 10, b: 20 }, goal: 10, days: {}, best: 0 }) }, log: [] }, "merge");
  check("corso di italiano: cp-it-game-v1 unito per dispositivo (40 + 30 + 20 = 90)", JSON.parse(LS.getItem("cp-it-game-v1")).xp === 90);
  /* sblocchi: «basta uno» */
  LS.setItem("cp-ux-v1", JSON.stringify({ onboarded: 1, unl: { words: 1 }, legendSeen: 1 }));
  await Store.importObj({ app: "mandarino", v: 5, kv: { "cp-ux-v1": JSON.stringify({ onboarded: 1, unl: { build: 1, "it:words": 1 }, showAll: 1 }) }, log: [] }, "merge");
  const ux = JSON.parse(LS.getItem("cp-ux-v1"));
  check("sblocchi: una scheda aperta su un dispositivo è aperta anche sull'altro (unione «basta uno»)", ux.unl.words && ux.unl.build && ux.unl["it:words"] && ux.showAll === 1 && ux.legendSeen === 1, JSON.stringify(ux));
}
{
  /* il motore del test di livello: utenti simulati di ogni livello vero. Chi sa fino al livello T risponde giusto nel 92%
     dei casi; oltre, tira a indovinare (1/4 nel cinese, 1/3 nei quiz delle lezioni). La dichiarazione iniziale è quella
     vera con un errore di ±1 grado. Si vuole la stima entro ±1 livello (cinese) e ±3 lezioni (italiano) in almeno il 90%. */
  const ctx = vm.createContext({ Math }); vm.runInContext(fs.readFileSync(path.join(SRC, "data/placement.js"), "utf8"), ctx); const PL = ctx.PLACEMENT;
  let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const sim = (course, T, N) => { let ok = 0; for (let i = 0; i < N; i++) {
    const decl = [0, 1, 2, 3, 4].map(() => Math.max(0, Math.min(3, Math.round((course === "it" ? T / 30 * 3 : (T - 1) / 4 * 3) + (rnd() * 2 - 1)))));
    const st = PL.start(course, decl), g = course === "it" ? 1 / 3 : 0.25;
    while (!PL.done(st)) PL.answer(st, rnd() < (st.lv <= T ? 0.92 : g));
    if (Math.abs(PL.estimate(st) - T) <= (course === "it" ? 3 : 1)) ok++; } return ok / N; };
  const zh = [1, 2, 3, 4, 5].map((T) => [T, sim("zh", T, 400)]), it = [1, 5, 10, 15, 20, 25, 30].map((T) => [T, sim("it", T, 300)]);
  const fmt = (a) => a.map(([T, r]) => T + ":" + Math.round(r * 100) + "%").join(" ");
  console.log("  (test di livello, simulazione: cinese " + fmt(zh) + " · italiano " + fmt(it) + ")");
  check("test di livello: corso di cinese, stima entro ±1 livello in almeno il 90% delle prove per ogni livello 1-5", zh.every(([, r]) => r >= 0.9), fmt(zh));
  check("test di livello: corso di italiano, stima entro ±3 lezioni in almeno il 90% delle prove", it.every(([, r]) => r >= 0.9), fmt(it));
  const st = PL.start("zh", [3, 3, 3, 3, 3]); for (let i = 0; i < 4; i++) PL.answer(st, true);
  check("test di livello: il livello 6 («oltre l'HSK») si apre solo dopo risposte giuste al 5", st.hist.some((h) => h[0] === 5 && h[1]) && st.lv === 6, JSON.stringify(st.hist) + " → " + st.lv);
}
{
  /* soglie della rivelazione progressiva (ui/unlock.js): con l'obiettivo 5, 10 o 20 parole al giorno e solo le carte
     (10 punti per parola nuova), in quale giorno si aprono Parole e Frasi */
  const src = fs.readFileSync(path.join(SRC, "ui/unlock.js"), "utf8"), num = (re) => +re.exec(src)[1];
  const U = { words: num(/words: (\d+), build:/), build: num(/build: (\d+), minDays/), dw: num(/minDays: \{ words: (\d+)/), db: num(/minDays: \{ words: \d+, build: (\d+)/) };
  const dayOf = (goal, xp, d) => { for (let day = 1; day < 60; day++) if (day * goal * 10 >= xp && day >= d) return day; return -1; };
  const rep = [5, 10, 20].map((g) => "obiettivo " + g + ": Parole al giorno " + dayOf(g, U.words, U.dw) + ", Frasi al giorno " + dayOf(g, U.build, U.db)).join(" · ");
  console.log("  (sblocchi: " + rep + ")");
  check("sblocchi: con l'obiettivo predefinito (10) Parole e Frasi non arrivano il primo giorno", dayOf(10, U.words, U.dw) >= 2 && dayOf(10, U.build, U.db) >= 3, rep);
}

/* ---- 2c. sigilli di gratitudine ---- */
{
  const nodeCrypto = await import("crypto"), { spawnSync } = await import("child_process"), os = await import("os");
  const ctx = vm.createContext({ btoa, atob, TextEncoder, TextDecoder, crypto: globalThis.crypto }); vm.runInContext(fs.readFileSync(path.join(SRC, "core/seal-code.js"), "utf8"), ctx); const S = ctx.MDSeal;
  const { privateKey, publicKey } = nodeCrypto.generateKeyPairSync("ec", { namedCurve: "P-256" }), jwk = publicKey.export({ format: "jwk" }), KEYS = [{ kid: "t1", jwk }];
  const mk = (lvl, num, kid, der) => { const p = S.make(kid || "t1", lvl, 2026, num); return S.encode(p, new Uint8Array(nodeCrypto.sign("sha256", Buffer.from(p), der ? privateKey : { key: privateKey, dsaEncoding: "ieee-p1363" }))); };
  const good = await S.verify(mk(2, 7), KEYS);
  check("sigilli: un codice firmato in Node (ieee-p1363) si verifica con WebCrypto", good.ok && good.seal.lvl === 2 && good.seal.num === 7, JSON.stringify(good));
  const code = mk(1, 3), tampered = code.slice(0, code.indexOf(".") + 3) + (code[code.indexOf(".") + 3] === "A" ? "B" : "A") + code.slice(code.indexOf(".") + 4);
  const res = { tampered: (await S.verify(tampered, KEYS)).err, kid: (await S.verify(mk(1, 3, "zz"), KEYS)).err, der: (await S.verify(mk(1, 3, "t1", true), KEYS)).err, format: (await S.verify("MDS1.abc", KEYS)).err, short: (await S.verify(code.slice(0, 30), KEYS)).err };
  const p4 = S.make("t1", 4, 2026, 1), lvl4 = await S.verify(S.encode(p4, new Uint8Array(nodeCrypto.sign("sha256", Buffer.from(p4), { key: privateKey, dsaEncoding: "ieee-p1363" }))), KEYS);
  check("sigilli: alterato, chiave sconosciuta, firma DER, livello fuori intervallo, formato errato → rifiutati", res.tampered && res.kid === "kid" && res.der === "sig" && res.format === "format" && res.short && lvl4.err === "level", JSON.stringify(res) + " " + JSON.stringify(lvl4));
  /* unione tra dispositivi */
  const { Store, LS } = sandbox();
  LS.setItem("cp-seal-v1", JSON.stringify({ codes: { "1-2026-3": { code: "a" } }, gram: "f", name: "Ada", share: 1, t: 100 }));
  await Store.importObj({ app: "mandarino", v: 5, kv: { "cp-seal-v1": JSON.stringify({ codes: { "2-2026-7": { code: "b" } }, gram: "m", name: "", share: 0, t: 50 }) }, log: [] }, "merge");
  const sm = JSON.parse(LS.getItem("cp-seal-v1"));
  check("sigilli: cp-seal-v1 unisce i codici; le preferenze vengono dal dispositivo più recente", sm.codes["1-2026-3"] && sm.codes["2-2026-7"] && sm.gram === "f" && sm.name === "Ada" && sm.share === 1, JSON.stringify(sm));
  /* pacchetti classe: unione per id, il pacchetto tolto su un dispositivo resta tolto */
  {
    const { Store: S2, LS: L2 } = sandbox();
    L2.setItem("cp-class-v1", JSON.stringify({ p: { a: { id: "a", t: "A", at: 5 }, b: { id: "b", t: "B", at: 9 } }, x: {} }));
    await S2.importObj({ app: "mandarino", v: 5, kv: { "cp-class-v1": JSON.stringify({ p: { b: { id: "b", t: "B", at: 3 }, c: { id: "c", t: "C", at: 4 } }, x: { a: 7 } }) }, log: [] }, "merge");
    const cm = JSON.parse(L2.getItem("cp-class-v1"));
    check("classe: cp-class-v1 unisce i pacchetti (data d'importazione più vecchia) e tiene i tolti", Object.keys(cm.p).sort().join() === "a,b,c" && cm.p.b.at === 3 && cm.x.a === 7, JSON.stringify(cm));
  }
  /* sfide e classe: i testi (caricati al primo uso) esistono in tutte e due le lingue */
  {
    const tc = vm.createContext({}); vm.runInContext("var I18N = { it: {}, zh: {} };", tc); vm.runInContext(fs.readFileSync(path.join(SRC, "i18n/together.js"), "utf8"), tc);
    const TI = vm.runInContext("I18N", tc), ki = Object.keys(TI.it).sort().join(), kz = Object.keys(TI.zh).sort().join();
    const used = new Set(["challenge.js", "classroom.js", "together.js"].flatMap((f) => [...fs.readFileSync(path.join(SRC, "ui", f), "utf8").matchAll(/T\("((?:chal|cls|tog)\.[\w]+)"/g)].map((m) => m[1])));
    const miss = [...used].filter((k) => !TI.it[k] && k !== "tog.chal");
    check("sfide e classe: stessi testi in italiano e in cinese, e nessun testo usato che manchi (" + Object.keys(TI.it).length + ")", ki === kz && !miss.length, miss.join(", "));
  }
  /* testi: nessuna desinenza di genere nei testi predefiniti; ogni titolo esiste in ogni forma */
  const ic = vm.createContext({}); vm.runInContext("var I18N = { it: {}, zh: {} }; var LANG = 'it';", ic);
  ["i18n/it.js", "i18n/zh.js", "i18n/titles.js"].forEach((f) => vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), ic));
  const I = vm.runInContext("I18N", ic), TT = vm.runInContext("I18N_TITLES", ic), tg = vm.runInContext("tg", ic);
  const DEF = Object.keys(I.it).filter((k) => /^(seal\.(n|s|m)\d|seal\.(got|thanks|ed|auth|have|share|shareHint|name)$|sup\.)/.test(k));
  const gendered = DEF.filter((k) => /\w+[oa]\/[ao]|verificat|iscritt|sostenitor|donator|benvenut[oa]/i.test(I.it[k]));
  check("sigilli: i testi predefiniti non hanno desinenze di genere (" + DEF.length + " testi)", !gendered.length, gendered.join(", "));
  const forms = [1, 2, "2it", 3].every((n) => ["m", "f", "n"].every((g) => typeof tg("seal.t" + n, g) === "string") && tg("seal.t" + n, "n") === "" && tg("seal.t" + n, "m") && TT.zh["seal.t" + n].x);
  check("sigilli: ogni titolo ha forma maschile, femminile e «senza titolo» (vuota) in italiano, e una forma in cinese", forms && I.zh["seal.n1"] && I.zh["seal.s3"]);
}

/* ---- contributi: chi chiede di comparire nei Crediti (tools/merge-contrib.mjs, su una copia di src/) ---- */
{
  const os = await import("os"), { spawnSync } = await import("child_process");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "md-contrib-")), tsrc = path.join(tmp, "src");
  fs.cpSync(SRC, tsrc, { recursive: true, filter: (f) => !/[\\/]audio([\\/]|$)/.test(f.slice(SRC.length)) });
  fs.copyFileSync(path.join(ROOT, "CONTRIBUTORS.md"), path.join(tmp, "CONTRIBUTORS.md"));
  const P = (name, author, credit, val, tg) => { const f = path.join(tmp, name + ".json"); fs.writeFileSync(f, JSON.stringify({ schema: "mandarino-contrib/1", author, credit, items: [{ id: name, op: "fix", target: tg || "你", field: "it", old: "", new: val }] })); return f; };
  const mc = (...a) => spawnSync(process.execPath, [path.join(ROOT, "tools/merge-contrib.mjs"), ...a, "--src", tsrc], { encoding: "utf8" });
  const r1 = mc(P("p1", "Lucia_88", 1, "tu (prova uno)"), P("p2", "Anonimo", undefined, "io (prova due)", "我"), "--apply");
  const r2 = mc(P("p3", "bad@mail.it", 1, "tu (prova tre)"), P("p4", "lucia_88", 1, "lui (prova quattro)", "他"), "--apply");
  const js = fs.readFileSync(path.join(tsrc, "data/contributors.js"), "utf8"), md = fs.readFileSync(path.join(tmp, "CONTRIBUTORS.md"), "utf8");
  check("contributi: con «credit» il nickname entra in contributors.js e CONTRIBUTORS.md; senza no; e-mail scartate, niente doppioni", /var CONTRIBUTORS = \["Lucia_88"\];/.test(js) && /<!-- elenco -->\n- Lucia_88\n<!-- \/elenco -->/.test(md) && !/Anonimo|bad@/.test(js + md), r1.stdout.slice(-300) + r2.stdout.slice(-300) + js.slice(-80));
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* ---- rilettura da madrelingua: modulo → review-import → merge-contrib, con risposte inventate ---- */
{
  const os = await import("os"), { spawnSync } = await import("child_process");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "md-review-")), sheet = path.join(tmp, "modulo.md"), patch = path.join(tmp, "revisione.json");
  const node = (...a) => spawnSync(process.execPath, a, { encoding: "utf8", cwd: ROOT });
  node("tools/review-sample.mjs", "--out", sheet);
  let n = 0;
  const filled = fs.readFileSync(sheet, "utf8").split("\n").map((l) => { if (!/^\| \d+ \|/.test(l) || !/`(dlg|phr):/.test(l) || n >= 2) return l; n++; return l.replace(" |  |  | ", n === 1 ? " | ✗ | 示例建议一 | " : " | ✓ |  | "); }).join("\n");
  fs.writeFileSync(sheet, filled);
  const r1 = node("tools/review-import.mjs", sheet, "--nome", "Prova", "--out", patch), r2 = node("tools/merge-contrib.mjs", patch);
  const p = JSON.parse(fs.readFileSync(patch, "utf8"));
  check("rilettura: il modulo compilato diventa una patch di segnalazioni che merge-contrib riconosce (rif. precisi)", p.schema === "mandarino-contrib/1" && p.items.length === 1 && /^(dlg|phr):/.test(p.items[0].target) && /1 segnalazioni · 0 doppioni · 0 conflitti · 0 scartati/.test(r2.stdout), r1.stderr + r2.stdout.slice(0, 300));
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* ---- sito (docs/): nessuna risorsa esterna, un solo script statico dello stesso sito, riferimenti locali che esistono, due lingue ---- */
{
  const DOCS = path.join(ROOT, "docs");
  const h = fs.readFileSync(path.join(DOCS, "index.html"), "utf8");
  const isExt = (u) => /^(https?:)?\/\//i.test(u);
  const ext = [...h.matchAll(/<(?:script|img|iframe|source|video|audio)\b[^>]*?(?:src|poster)="([^"]+)"/gi)].map((m) => m[1])
    .concat([...h.matchAll(/<link\b[^>]*\brel="(?:stylesheet|icon|preload|modulepreload)"[^>]*?href="([^"]+)"/gi)].map((m) => m[1])).filter(isExt);
  const scripts = [...h.matchAll(/<script\b([^>]*)>/gi)].map((m) => m[1]);
  const GENERATI = ["app/", "privacy.html", "manifesto.html", "mandarino.apk"];   /* nascono con la pubblicazione: non stanno in docs/ */
  const local = [...h.matchAll(/\b(?:src|poster|href)="([^"#?]+)(?:[#?][^"]*)?"/g)].map((m) => m[1])
    .filter((u) => !/^(https?:|mailto:|tel:|\/\/|data:)/i.test(u) && !GENERATI.includes(u)).filter((f) => !fs.existsSync(path.join(DOCS, f)));
  const ctas = (h.match(/class="btn"/g) || []).length;
  check("pagina di presentazione: nessuna risorsa esterna, solo assets/sito.js come script, un solo invito all'azione, italiano e cinese, file locali presenti, privacy e app",
    !ext.length && scripts.length === 1 && /src="assets\/sito\.js"/.test(scripts[0]) && !local.length && ctas === 1 && /lang="zh-CN"/.test(h) && /href="app\/"/.test(h) && /href="privacy\.html"/.test(h),
    ext.concat(local).join(", ") + " cta " + ctas + " script " + scripts.length);
  const h404 = fs.readFileSync(path.join(DOCS, "404.html"), "utf8");
  const abs404 = [...h404.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]).filter((u) => !GENERATI.some((g) => u === "/" + g) && u !== "/");
  const miss404 = abs404.filter((u) => !fs.existsSync(path.join(DOCS, u)));
  check("404.html: i percorsi dalla radice esistono, nessuno script", abs404.length > 0 && !miss404.length && !/<script\b/i.test(h404), miss404.join(", "));
  const hz = JSON.parse(fs.readFileSync(path.join(DOCS, "assets/dati/hanzi.json"), "utf8"));
  const prova = fs.readFileSync(path.join(DOCS, "assets/prova.js"), "utf8");
  const usati = [...((/var CH = \[([\s\S]*?)\];/.exec(prova) || ["", ""])[1]).matchAll(/\["(.)"/g)].map((m) => m[1]);
  const manca = usati.filter((c) => !hz[c] || !hz[c].strokes || hz[c].strokes.length !== (hz[c].medians || []).length);
  check("microprove del sito: hanzi.json ha i tratti di ogni carattere usato da prova.js", usati.length >= 8 && !manca.length, manca.join(" "));
  const brani = ["biblioteca", "calligrafia", "bambu"].filter((id) => !["ogg", "m4a"].every((e) => fs.existsSync(path.join(DOCS, "audio", id + "." + e))));
  check("radio del sito: i tre brani esistono in .ogg e .m4a", !brani.length, brani.join(", "));
  const { md2html } = await import("./site.mjs");
  const pv = md2html(fs.readFileSync(path.join(ROOT, "PRIVACY.md"), "utf8"));
  check("privacy.html da PRIVACY.md: tabelle, sezione cinese con lang, nessuno script", /<table>/.test(pv) && /<section lang="zh-CN">[\s\S]*<table>/.test(pv) && !/<script/i.test(pv) && /api\.github\.com/.test(pv));
  /* il Manifesto: due sezioni, struttura uguale, e i numeri che cita sono veri */
  const { manifestoHtml } = await import("./site.mjs");
  const mdM = fs.readFileSync(path.join(ROOT, "MANIFESTO.md"), "utf8"), mh = manifestoHtml(mdM);
  const secs = mh.split(/<section lang=/).slice(1).map((x) => ({ ol: (x.match(/<li><b>/g) || []).length, bq: (x.match(/<blockquote>/g) || []).length, s: (x.match(/<s>/g) || []).length, ul: (x.match(/<ul><li>/g) || []).length }));
  check("manifesto.html da MANIFESTO.md: italiano e cinese con la stessa struttura (4 princìpi, 2 citazioni, 1 barrato, 1 elenco), nessuno script", secs.length === 2 && secs.every((x) => x.ol === 4 && x.bq === 2 && x.s === 1 && x.ul === 1) && !/<script/i.test(mh), JSON.stringify(secs));
  const exCtx = vm.createContext({}); fs.readdirSync(path.join(SRC, "data/examples")).filter((f) => f.endsWith(".js")).forEach((f) => { try { vm.runInContext(fs.readFileSync(path.join(SRC, "data/examples", f), "utf8"), exCtx); } catch (e) {} });
  const nEx = Object.keys(exCtx.EXAMPLES || {}).length;
  const minTracks = fs.readdirSync(path.join(SRC, "audio/tracks")).filter((f) => f !== "index.js").reduce((a, f) => a + +((/sec:\s*(\d+)/.exec(fs.readFileSync(path.join(SRC, "audio/tracks", f), "utf8")) || [0, 0])[1]), 0) / 60;
  const fsrsV = /VERSION: "FSRS-6/.test(fs.readFileSync(path.join(SRC, "core/fsrs.js"), "utf8"));
  check("manifesto: «5.700 frasi», «oltre un'ora di musica» e «FSRS-6» sono veri", nEx >= 5700 && minTracks > 60 && fsrsV && /5\.700 frasi/.test(mdM) && /FSRS-6/.test(mdM), nEx + " frasi, " + Math.round(minTracks) + " min");
}

/* ---- versione per gli store: src/config.js con il ponte Android che dice «store» ---- */
{
  const cfg = fs.readFileSync(path.join(SRC, "config.js"), "utf8");
  const run = (flavor) => { const w = { MandarinoAndroid: flavor ? { flavor: () => flavor } : undefined }; const c = { window: w }; vm.runInNewContext(cfg + ";this.C=MD_CONFIG;", c); return c.C; };
  const st = run("store"), dr = run("direct"), web = run(null);
  check("versione store: niente controllo degli aggiornamenti, sostegno né sigilli; la diretta e il sito restano come prima",
    st.FLAVOR === "store" && !st.APK_UPDATES && !st.FEATURE_DONATE && !st.FEATURE_SEALS && dr.FLAVOR === "direct" && dr.APK_UPDATES && dr.FEATURE_DONATE && web.FEATURE_SEALS && web.APK_UPDATES);
  const g = fs.readFileSync(path.join(ROOT, "android/app/build.gradle"), "utf8");
  check("Android: compileSdk e targetSdk 36, versioni direct e store", /compileSdk 36/.test(g) && /targetSdk 36/.test(g) && /direct \{/.test(g) && /store \{/.test(g));
}

/* ---- i traguardi del corso di italiano si uniscono tra dispositivi (per ognuno la data più vecchia) ---- */
{
  const { Store, LS } = sandbox();
  LS.setItem("cp-it-cards-v1", JSON.stringify({ m: { first: 200, s7: 500 } }));
  await Store.importObj({ app: "mandarino", v: 5, kv: { "cp-it-cards-v1": JSON.stringify({ m: { first: 100, w100: 300 } }) }, log: [] }, "merge");
  const m = JSON.parse(LS.getItem("cp-it-cards-v1")).m;
  check("traguardi del corso di italiano: unione, per ognuno la prima volta", m.first === 100 && m.s7 === 500 && m.w100 === 300, JSON.stringify(m));
}

/* ---- Laboratorio dei radicali: le ricette vengono dai dati dell'app, le letture a mano sono coerenti ---- */
{
  const { list, base } = recipes(SRC), norm = (c) => base[c] || c;
  const cur = fs.existsSync(path.join(SRC, "data/lab-recipes.js")) ? fs.readFileSync(path.join(SRC, "data/lab-recipes.js"), "utf8") : "";
  check("laboratorio dei radicali: src/data/lab-recipes.js è aggiornato (node tools/radicali.mjs)", cur === recipesFile(list), list.length + " ricette");
  check("laboratorio dei radicali: ogni ricetta ha due componenti, un carattere dell'app con i suoi tratti e il pinyin", list.length > 1000 && list.every((r) => r.length === 8 && r[1] && r[2] && /^[⿰⿱]$/.test(r[3]) && r[6]));
  const ctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(SRC, "data/lab-readings.js"), "utf8"), ctx);
  const R = vm.runInContext("LAB_READ", ctx), by = Object.fromEntries(list.map((r) => [r[0], r])), bad = [];
  for (const [ch, v] of Object.entries(R)) {
    const r = by[ch]; if (!r) { bad.push(ch + ": non è una ricetta"); continue; }
    if ([...v[0]].map(norm).sort().join("") !== [r[1], r[2]].map(norm).sort().join("")) bad.push(ch + ": le parti non sono quelle dei dati");
    if (!/[㐀-鿿]/.test(v[2]) || v[1].length < 15 || v[1].length > 150 || v[2].length < 6 || v[2].length > 60) bad.push(ch + ": lettura troppo corta o troppo lunga");
    /* mai storia o origine: sono battute, non etimologie */
    if (/(in origine|originariamente|anticamente|nell'antichità|gli antichi|un tempo|etimolog|deriva|dinastia|secol[oi]|storicamente|i cinesi (pensavano|credevano))/i.test(v[1]) || /(古代|最初|本来|起源|字源|据说)/.test(v[2])) bad.push(ch + ": suona come un'etimologia");
  }
  check("laboratorio dei radicali: almeno 60 letture simpatiche, ognuna con le parti giuste, in italiano e in cinese, senza etimologie", Object.keys(R).length >= 60 && !bad.length, Object.keys(R).length + " letture; " + bad.slice(0, 4).join("; "));
  const it = fs.readFileSync(path.join(SRC, "i18n/lab-rad.js"), "utf8"), keys = (lang) => { const m = it.split("Object.assign(I18N." + lang + ",")[1].split("});")[0]; return [...m.matchAll(/"(lr.[^"]+)":/g)].map((x) => x[1]).sort(); };
  const ki = keys("it"), kz = keys("zh");
  check("laboratorio dei radicali: i testi hanno le stesse chiavi in italiano e in cinese", ki.length > 40 && ki.join() === kz.join(), ki.filter((k) => !kz.includes(k)).concat(kz.filter((k) => !ki.includes(k))).join(", "));
}
{
  const { Store, LS } = sandbox();
  LS.setItem("cp-labrad-v1", JSON.stringify({ f: { 好: 200, 休: 500 } }));
  await Store.importObj({ app: "mandarino", v: 5, kv: { "cp-labrad-v1": JSON.stringify({ f: { 好: 100, 明: 300 } }) }, log: [] }, "merge");
  const f = JSON.parse(LS.getItem("cp-labrad-v1")).f;
  check("laboratorio dei radicali: le scoperte si uniscono tra dispositivi (per ognuna la prima volta)", f["好"] === 100 && f["休"] === 500 && f["明"] === 300, JSON.stringify(f));
}

/* ---- pagina cinese (docs/zh/, il QR delle carte): leggera, cinese per primo, nessuna risorsa esterna; l'unico script è in
   pagina e riconosce solo il browser di WeChat ---- */
{
  const h = fs.readFileSync(path.join(ROOT, "docs/zh/index.html"), "utf8");
  const ext = [...h.matchAll(/<(script|img|link|iframe)\b[^>]*?(?:src|href)="([^"]+)"/gi)].map((m) => m[2]).filter((u) => /^(https?:)?\/\//i.test(u));
  const scripts = [...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  check("pagina cinese: html lang zh-CN, sotto 12 KB, nessuna risorsa esterna, un solo script in pagina (WeChat), nessun «官方»",
    /<html lang="zh-CN">/.test(h) && h.length < 12000 && !ext.length && scripts.length === 1 && !/src=/.test(scripts[0][1]) && /MicroMessenger/.test(scripts[0][2]) && !/官方/.test(h) && /无需注册/.test(h), ext.join(", "));
}

/* ---- digitazione (src/core/typing.js) con le prove del riferimento (materiali/riferimenti/digitazione.test.mjs) ---- */
{
  const tc = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(SRC, "core/typing.js"), "utf8"), tc);
  const raw = vm.runInContext("MDTyping", tc);   /* gli array del contesto vm diventano array di questo, per deepEqual */
  globalThis.__MDT = Object.fromEntries(Object.entries(raw).map(([k, f]) => [k, (...a) => { const r = f(...a); return Array.isArray(r) ? [...r] : r; }]));
  const ref = fs.readFileSync(path.join(ROOT, "materiali/riferimenti/digitazione.test.mjs"), "utf8")
    .replace(/import\s*\{([^}]*)\}\s*from\s*"\.\/digitazione\.mjs";/, "const {$1} = globalThis.__MDT;").replace(/console\.log\(/g, "(() => {})(");
  let err = "";
  try { await import("data:text/javascript;base64," + Buffer.from(ref).toString("base64")); } catch (e) { err = e.message; }
  check("digitazione: src/core/typing.js passa le prove del riferimento (pinyin con numeri, accenti, senza toni; italiano con accenti e refusi)", !err, err);
}

/* ---- distrattori, regole del voto, unione di cp-ex-v1 ---- */
{
  const { tools } = await import("./materiali.mjs");
  const TL = tools(SRC), POOL = Object.values(TL.W);
  const dc = vm.createContext({}); dc.window = dc;
  vm.runInContext(fs.readFileSync(path.join(SRC, "core/typing.js"), "utf8"), dc); vm.runInContext(fs.readFileSync(path.join(SRC, "study/distractors.js"), "utf8"), dc);
  const DS = vm.runInContext("MDDistract", dc), CTX = { levelOf: (w) => TL.levelOf(w), poly: (hz) => hz === "行" || hz === "长", pool: () => POOL };
  const plain = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const sample = POOL.filter((w, i) => i % 29 === 0).slice(0, 200);
  let bad = [], made = 0, same = 0;
  for (const w of sample) {
    const r1 = DS.rng(DS.seed(w.key + "|2026-10-27|mc-significato")), r2 = DS.rng(DS.seed(w.key + "|2026-10-27|mc-significato"));
    const a = DS.meaning(w, POOL, CTX, r1), b = DS.meaning(w, POOL, CTX, r2);
    if (!a) continue; made++;
    if (JSON.stringify(a.map((x) => x.key)) === JSON.stringify(b.map((x) => x.key))) same++;
    const gl = [DS.gloss(w.it)].concat(a.map((x) => DS.gloss(x.it)));
    if (new Set(gl.map(plain)).size !== 4) bad.push(w.hz + ": doppione");
    a.forEach((x) => { if (DS.sharesWord(w.it, x.it)) bad.push(w.hz + "/" + x.hz + ": parola in comune"); if (Math.abs(TL.levelOf(x) - TL.levelOf(w)) > 1) bad.push(w.hz + "/" + x.hz + ": livello lontano"); });
  }
  check("distrattori del significato: niente doppioni né parole in comune con la giusta, livello ±1, ripetibili con lo stesso seme (" + made + " parole)", made > 150 && same === made && !bad.length, bad.slice(0, 4).join("; "));
  bad = []; made = 0;
  for (const w of sample) {
    const p = DS.pinyin(w, POOL, CTX, DS.rng(DS.seed(w.key + "py"))); if (!p) continue; made++;
    const right = w.py.split(/[.\s']+/).filter(Boolean).join(" "), sylPlain = (s) => s.split(" ").map(plain).join(" ");
    if (p.includes(right) || new Set(p).size !== 3) bad.push(w.hz + ": doppione o giusta tra le sbagliate");
    if (p.filter((x) => sylPlain(x) === sylPlain(right)).length > 2) bad.push(w.hz + ": più di due con altri toni");
  }
  check("distrattori del pinyin: tre diversi dalla giusta, al massimo due con la stessa sillaba e altri toni (" + made + ")", made > 150 && !bad.length, bad.slice(0, 4).join("; "));
  const ta = POOL.find((w) => w.hz === "他"), L = DS.listen(ta, POOL, CTX, DS.rng(7));
  const sameSound = (L || []).filter((x) => plain(x.py) === "ta");
  check("distrattori dell'ascolto: per 他 niente 她/它 (stessa pronuncia) né parole con più letture", L && !sameSound.length && !L.some((x) => CTX.poly(x.hz)), (L || []).map((x) => x.hz).join(","));
  /* corso di italiano (dati inventati): stessa specie e genere, niente caratteri cinesi in comune, niente doppioni */
  const IP = [["a", "il libro", "书", "m"], ["b", "il tavolo", "桌子", "m"], ["c", "il gatto", "猫", "m"], ["d", "il cane", "狗", "m"], ["e", "lo studente", "学生", "m"], ["f", "il treno", "火车", "m"], ["g", "la casa", "房子", "f"], ["h", "la scuola", "学校", "m"], ["i", "il tavolo", "台子", "m"]]
    .map((r) => ({ id: r[0], key: r[0], it: r[1], zh: r[2], g: r[3], kind: "noun", sec: "s" + r[0] }));
  const IW = DS.itWords(IP[7], IP, { levelOf: () => 1 }, DS.rng(11)) || [];
  const iwBad = IW.filter((x) => x.g !== "m" || /学/.test(x.zh) || x.id === "h");
  check("distrattori del corso di italiano: tre nomi dello stesso genere, nessun carattere cinese in comune (学校/学生), nessun doppione", IW.length === 3 && !iwBad.length && new Set(IW.map((x) => x.it)).size === 3 && new Set(IW.map((x) => x.zh)).size === 3, IW.map((x) => x.it + "/" + x.zh).join(", "));
  /* senza materiali/audio/zh nulla si rompe: le voci cinesi restano vuote, quelle italiane ci sono */
  {
    const { build: mbuild } = await import("./materiali.mjs"), tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mat-")), MAT = path.join(ROOT, "materiali");
    for (const d of ["runtime", "dati", "crediti"]) fs.symlinkSync(path.join(MAT, d), path.join(tmp, d));
    fs.mkdirSync(path.join(tmp, "audio")); fs.symlinkSync(path.join(MAT, "audio/it"), path.join(tmp, "audio/it"));
    let mo = null, merr = ""; try { mo = mbuild(SRC, tmp).out; } catch (e) { merr = e.message; }
    fs.rmSync(tmp, { recursive: true, force: true });
    check("voci reali: senza materiali/audio/zh i materiali si generano lo stesso (0 clip cinesi, le italiane restano)", mo && mo.VOCE_ZH.righe.length === 0 && mo.VOCE_IT.righe.length > 400 && !Object.keys(mo.VOICE_FILES.zh).length, merr || (mo && mo.VOCE_IT.righe.length));
  }
  const o = DS.options("x", ["a", "b", "c"], DS.rng(3));
  check("distrattori: la giusta sta tra le quattro, in un posto deciso dal seme", o.opts.length === 4 && o.opts[o.right] === "x");
  /* regole del motore, caricate senza pagina */
  const ec = vm.createContext({ localStorage: { getItem: () => null, setItem() {} }, document: { addEventListener() {}, getElementById: () => null } });
  ec.window = ec; ec.CP = { t: (k) => k, esc: (s) => s, distract: DS, typing: {} }; ec.MDDistract = DS;
  vm.runInContext(fs.readFileSync(path.join(SRC, "study/exercises.js"), "utf8"), ec);
  const E = ec.CP.exEngine;
  const v = [E.voto({ kind: "mc", ok: true }), E.voto({ kind: "mc", ok: true, unsure: true }), E.voto({ kind: "mc", ok: false }), E.voto({ kind: "type", ok: true, esito: "esatto", ms: 3000, st: 40 }), E.voto({ kind: "type", ok: true, esito: "esatto", ms: 3000, st: 5 }), E.voto({ kind: "type", ok: true, esito: "esatto", ms: 9000, st: 40 }), E.voto({ kind: "type", ok: false, esito: "senza-toni" }), E.voto({ kind: "type", ok: false, esito: "accento" }), E.voto({ kind: "type", ok: false, esito: "toni-sbagliati" })];
  check("voti: scelta multipla giusta = Bene (mai Facile), «Non ero sicuro» = Difficile, sbagliata = Di nuovo; digitazione veloce e parola stabile = Facile; senza toni o accento = Difficile", v.join() === "2,1,0,3,2,2,1,1,0", v.join());
  const f = [E.famiglia(null), E.famiglia({ n: 2, st: 1 }), E.famiglia({ n: 4, st: 3 }), E.famiglia({ n: 9, st: 21 }), E.famiglia({ n: 9, st: 22 })], gr = [E.gradino([1, 1, 1]), E.gradino([0, 0, 1, 0, 1]), E.gradino(Array(10).fill(1)), E.gradino([1, 1, 1, 1, 0, 1, 1, 1, 0, 1])];
  check("scelta del tipo: nuova o sotto 3 giorni riconoscimento, 3-21 misto, oltre produzione; sotto il 60% si scende, sopra il 90% si sale", f.join() === "0,0,1,1,2" && gr.join() === "0,-1,1,0", f.join() + " / " + gr.join());
  /* unione di cp-ex-v1 */
  const { Store: S3, LS: L3 } = sandbox();
  L3.setItem("cp-ex-v1", JSON.stringify({ units: { a: { passo: 2, verifica: { data: 5, pct: 70 } } }, ex: { "你": { "mc-pinyin": { n: 4, ok: 3, ultimo: 9 } } }, read: { t1: 5 } }));
  const inc = JSON.stringify({ units: { a: { passo: 1, verifica: { data: 8, pct: 90 } }, b: { passo: 3 } }, ex: { "你": { "mc-pinyin": { n: 4, ok: 3, ultimo: 9 }, tono: { n: 1, ok: 0, ultimo: 3 } } }, read: { t2: 7 } });
  await S3.importObj({ app: "mandarino", v: 5, kv: { "cp-ex-v1": inc }, log: [] }, "merge");
  await S3.importObj({ app: "mandarino", v: 5, kv: { "cp-ex-v1": inc }, log: [] }, "merge");
  const xm = JSON.parse(L3.getItem("cp-ex-v1"));
  check("cp-ex-v1: passo più avanzato, verifica più recente, per ogni tipo la voce con n più alto (mai la somma, anche ripristinando due volte), testi letti uniti", xm.units.a.passo === 2 && xm.units.a.verifica.pct === 90 && xm.units.b.passo === 3 && xm.ex["你"]["mc-pinyin"].n === 4 && xm.ex["你"].tono.n === 1 && xm.read.t1 === 5 && xm.read.t2 === 7, JSON.stringify(xm));
}

/* ---- Taccuino del viaggiatore (src/data/diary.js, ui/diary.js): la tabella degli aneddoti e le coppie scambiate ---- */
{
  const dctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(SRC, "data/diary.js"), "utf8"), dctx);
  const DI = vm.runInContext("DIARY", dctx);
  const vocab = {};
  (L.D ? L.D.SECTIONS : []).forEach((s) => s.words.forEach((w) => { (vocab[w[1]] = vocab[w[1]] || []).push(w[0].replace(/\./g, "")); }));
  const bad = [], ids = new Set();
  for (const n of DI.notes) {
    if (ids.has(n.id)) bad.push("id doppio " + n.id); ids.add(n.id);
    if (!Array.isArray(n.m) || n.m.length < 2) bad.push(n.id + ": servono almeno due membri");
    for (const m of n.m || []) { const [hz, py] = m.split(" "); if (!vocab[hz]) bad.push(n.id + ": " + hz + " non è nel vocabolario"); else if (!vocab[hz].includes(py)) bad.push(n.id + ": " + hz + " si legge " + vocab[hz].join("/") + ", non " + py); }
    if (!/\{c\}/.test(n.it) || !/\{c\}/.test(n.zh)) bad.push(n.id + ": manca {c}");
    if (!/[一-鿿]/.test(n.zh) || n.it.length < 30 || n.it.length > 220 || n.zh.length < 12 || n.zh.length > 90) bad.push(n.id + ": testi troppo corti o troppo lunghi");
    if (/Task\s*\d|TODO|XXX/i.test(n.it + n.zh)) bad.push(n.id + ": nota interna nel testo");
    if (n.m.filter((m) => (n.it + n.zh).includes(m.split(" ")[0])).length < 2) bad.push(n.id + ": almeno due membri devono comparire nei testi");
  }
  check("Taccuino: almeno 40 aneddoti, id unici, ogni membro è nel vocabolario con lo stesso pinyin, {c} e testi nelle due lingue (" + DI.notes.length + ")", DI.notes.length >= 40 && !bad.length, bad.slice(0, 4).join("; "));
  const st = DI.stops, up = st.every((s, i) => !i || s.th > st[i - 1].th) && st[0].th === 0;
  check("Taccuino: le città hanno soglie crescenti dalla prima (0) e un nome in italiano e in cinese (" + st.length + ")", up && st.every((s) => s.it && /[一-鿿]/.test(s.zh) && s.x > 0 && s.y > 0), st.map((s) => s.th).join());
  check("Taccuino (corso di italiano): 11 soglie in lezioni superate crescenti da 0 fino a 51, una riga a mano per ogni città in cinese e in italiano con {c}", DI.itTh.length === st.length && DI.itTh[0] === 0 && DI.itTh.every((v, i) => !i || v > DI.itTh[i - 1]) && DI.itTh[DI.itTh.length - 1] === 51 && st.every((x) => DI.itLines[x.id] && /[一-鿿]/.test(DI.itLines[x.id].zh) && DI.itLines[x.id].it.length > 30 && (x.id === "guilin" || (/\{c\}/.test(DI.itLines[x.id].zh) && /\{c\}/.test(DI.itLines[x.id].it)))), DI.itTh.join());
  /* i testi del taccuino (caricati al primo uso): stesse chiavi nelle due lingue e nessuna chiave usata che manchi */
  const tc = vm.createContext({}); vm.runInContext("var I18N = { it: {}, zh: {} };", tc); vm.runInContext(fs.readFileSync(path.join(SRC, "i18n/diary.js"), "utf8"), tc);
  const TI = vm.runInContext("I18N", tc), ki = Object.keys(TI.it).sort().join(), kz = Object.keys(TI.zh).sort().join();
  const usedD = new Set(["ui/diary.js", "ui/share-card.js"].flatMap((f) => [...fs.readFileSync(path.join(SRC, f), "utf8").matchAll(/T\(\s*"((?:dy|dyi|dcard)\.[\w.]+)"/g)].map((m) => m[1])));
  ["light", "sepia", "dark"].forEach((t) => usedD.add("dcard.th." + t));
  const missD = [...usedD].filter((k) => !TI.it[k] || !TI.zh[k]);
  check("Taccuino: stessi testi in italiano e in cinese e nessun testo usato che manchi (" + Object.keys(TI.it).length + ")", ki === kz && !missD.length, missD.join(", "));
  /* le coppie scambiate (cp-ex-v1.conf) si uniscono senza sommarsi */
  const { Store: S4, LS: L4 } = sandbox();
  L4.setItem("cp-ex-v1", JSON.stringify({ units: {}, ex: {}, read: {}, conf: { "妈|马": { n: 2, ultimo: 50, d: 4 }, "买|~4": { n: 1, ultimo: 5, d: 2 } } }));
  const cinc = JSON.stringify({ units: {}, ex: {}, read: {}, conf: { "妈|马": { n: 3, ultimo: 40, d: 2 }, "九|酒": { n: 1, ultimo: 9, d: 7 } } });
  await S4.importObj({ app: "mandarino", v: 5, kv: { "cp-ex-v1": cinc }, log: [] }, "merge");
  await S4.importObj({ app: "mandarino", v: 5, kv: { "cp-ex-v1": cinc }, log: [] }, "merge");
  const cm = JSON.parse(L4.getItem("cp-ex-v1")).conf;
  check("Taccuino: cp-ex-v1.conf si unisce (n più alto, mai la somma; ultima volta più recente; prima tappa più bassa) anche ripristinando due volte", cm["妈|马"].n === 3 && cm["妈|马"].ultimo === 50 && cm["妈|马"].d === 2 && cm["九|酒"].n === 1 && cm["买|~4"].n === 1, JSON.stringify(cm));
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
  /* il gruppo ESERCIZI (motore, distrattori, digitazione…) e i dati dei materiali sono testo letto al primo uso */
  const grp = [...html.matchAll(/<script type="text\/plain" id="group-esercizi-\d+">/g)].length, exData = ["frasi_zh", "frasi_it", "voce_zh", "voce_it", "insiemi"].every((n) => html.includes('<script type="application/json" id="lazy-' + n + '">'));
  const lab = [...html.matchAll(/<script type="text\/plain" id="group-labrad-\d+">/g)].length;
  check("avvio: il gruppo LABRAD (ricette, letture, laboratorio) è testo letto al primo uso, non JavaScript compilato all'apertura", lab === 4 && /\["LABRAD"\] = function/.test(html), "gruppo " + lab);
  const lx = [...html.matchAll(/<script type="text\/plain" id="group-lezionix-\d+">/g)].length;
  check("avvio: le lezioni aggiuntive del corso di cinese sono un gruppo caricato al primo uso (LEZIONIX), non JavaScript compilato all'apertura", lx >= 15 && /\["LEZIONIX"\] = function/.test(html), "file " + lx);
  check("avvio: il gruppo ESERCIZI e i dati dei materiali non si compilano all'apertura (limite di 1500 KB invariato)", grp >= 4 && exData && /__mdLoad = window.__mdLoad/.test(html), "gruppo " + grp + ", dati " + exData);
}

/* widget «Pausa» (Android): non si può compilare qui, quindi si controlla almeno che le parti combacino */
{
  const RES = path.join(ROOT, "android/app/src/main/res"), MAIN = path.join(ROOT, "android/app/src/main");
  const names = (f) => [...fs.readFileSync(path.join(RES, f), "utf8").matchAll(/<string name="(p_[a-z_]+)"/g)].map((m) => m[1]).sort();
  const it = names("values/strings.xml"), zh = names("values-zh/strings.xml");
  check("widget Pausa: ogni testo c'è in italiano e in cinese", it.length >= 15 && it.join() === zh.join(), it.filter((n) => !zh.includes(n)).concat(zh.filter((n) => !it.includes(n))).join(", "));
  const java = fs.readFileSync(path.join(MAIN, "java/it/mandarino/app/PauseWidget.java"), "utf8"), layout = fs.readFileSync(path.join(RES, "layout/widget_pause.xml"), "utf8");
  const ids = [...new Set([...java.matchAll(/R\.id\.([a-z_0-9]+)/g)].map((m) => m[1]))], strs = [...new Set([...java.matchAll(/R\.string\.([a-z_0-9]+)/g)].map((m) => m[1]))];
  const lack = ids.filter((i) => !new RegExp('@\\+id/' + i + '"').test(layout)).concat(strs.filter((x) => !it.includes(x)));
  check("widget Pausa: ogni id e ogni testo usato dal codice esiste nel disegno e nelle risorse", ids.length >= 7 && !lack.length, lack.join(", "));
  const man = fs.readFileSync(path.join(MAIN, "AndroidManifest.xml"), "utf8");
  check("widget Pausa: dichiarato nel manifesto, con la sua scheda e senza permessi in più", /\.PauseWidget/.test(man) && fs.existsSync(path.join(RES, "xml/widget_pause_info.xml")) && !/SCHEDULE_EXACT_ALARM|USE_EXACT_ALARM/.test(man));
}

/* widget «Oggi» stile Giada: le quattro fasce del giorno. Anche qui si controlla che le parti combacino */
{
  const RES = path.join(ROOT, "android/app/src/main/res"), JAVA = path.join(ROOT, "android/app/src/main/java/it/mandarino/app");
  const rd = (f) => fs.readFileSync(path.join(RES, f), "utf8");
  const keys = (f) => [...rd(f).matchAll(/<(?:string|plurals|string-array) name="(w_g_[a-z_]+|w_sample_msg)"/g)].map((m) => m[1]).sort();
  const gi = keys("values/strings.xml"), gz = keys("values-zh/strings.xml");
  check("widget Giada: ogni testo delle fasce c'è in italiano e in cinese", gi.length >= 9 && gi.join() === gz.join(), gi.filter((n) => !gz.includes(n)).concat(gz.filter((n) => !gi.includes(n))).join(", "));
  const arrLen = (f, n) => (rd(f).match(new RegExp('<string-array name="' + n + '">([\\s\\S]*?)</string-array>')) || ["", ""])[1].split("<item>").length - 1;
  check("widget Giada: messaggi e proverbi in numero sufficiente, ogni proverbio con le due parti", ["values/strings.xml", "values-zh/strings.xml"].every((f) => arrLen(f, "w_g_morning") >= 3 && arrLen(f, "w_g_evening") >= 3 && arrLen(f, "w_g_proverbs") >= 6 && [...rd(f).match(/<string-array name="w_g_proverbs">([\s\S]*?)<\/string-array>/)[1].matchAll(/<item>([^<]*)<\/item>/g)].every((m) => /^[^|]+\|[^|]+$/.test(m[1]))));
  const t = fs.readFileSync(path.join(JAVA, "TodayWidget.java"), "utf8"), w = fs.readFileSync(path.join(JAVA, "WidgetState.java"), "utf8");
  const lay = ["widget_large.xml", "widget_large_narrow.xml", "widget_small.xml"].map((f) => rd("layout/" + f));
  const ids = [...new Set([...t.matchAll(/R\.id\.([a-z_0-9]+)/g)].map((m) => m[1]))].filter((i) => !/^t_/.test(i));
  const seg = Array.from({ length: 10 }, (_, i) => "w_s" + i);
  const miss = [];
  [lay[0], lay[1]].forEach((l, k) => ids.filter((i) => !["w_flame_x"].includes(i) && !(i === "w_s0" || /^w_s\d$/.test(i))).forEach((i) => { if (!new RegExp('@\\+id/' + i + '"').test(l) && !(k === 1 && i === "w_segs" && false)) miss.push(["large", "narrow"][k] + ":" + i); }));
  seg.forEach((i) => { lay.slice(0, 2).forEach((l) => { if (!l.includes('@+id/' + i + '"')) miss.push(i); }); });
  const used = new Set([...t.matchAll(/R\.(?:drawable|color)\.([a-z_0-9]+)/g), ...w.matchAll(/R\.(?:drawable|color)\.([a-z_0-9]+)/g)].map((m) => m[1]));
  const have = new Set(fs.readdirSync(path.join(RES, "drawable")).map((f) => f.replace(/\.xml$/, "")).concat([...rd("values/colors_giada.xml").matchAll(/name="([a-z_0-9]+)"/g)].map((m) => m[1])).concat([...rd("values/colors.xml").matchAll(/name="([a-z_0-9]+)"/g)].map((m) => m[1])));
  const lackRes = [...used].filter((n) => !have.has(n));
  check("widget Giada: ogni id usato dal codice sta nei disegni grande e stretto (con i dieci segmenti) e ogni risorsa esiste", ids.length >= 15 && !miss.length && !lackRes.length, miss.concat(lackRes).join(", "));
  check("widget Giada: le fasce coprono le 24 ore (6/12/17/22) e un allarme inesatto le ridisegna", /hour >= 22 \|\| hour < 6 \? NIGHT : hour < 12 \? MORNING : hour < 17 \? AFTERNOON : EVENING/.test(w) && /int\[\] edges = \{6, 12, 17, 22\}/.test(w) && /setAndAllowWhileIdle/.test(t) && !/setExact/.test(t));
}

/* Scambio linguistico: testi nelle due lingue, chiavi usate, pagina del consenso sul sito (nascosta) */
{
  const tc = vm.createContext({}); vm.runInContext("var I18N = { it: {}, zh: {} };", tc);
  for (const f of ["i18n/scambio.js", "i18n/settings.js"]) vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), tc);
  const TI = vm.runInContext("I18N", tc), keys = (o) => Object.keys(o).filter((k) => /^sc\./.test(k)).sort();
  const code = fs.readFileSync(path.join(SRC, "ui/scambio.js"), "utf8") + fs.readFileSync(path.join(SRC, "ui/scambio-stub.js"), "utf8");
  const used = new Set([...code.matchAll(/T\(\s*"(sc\.[\w.]*\w)"/g)].map((m) => m[1]));
  for (let i = 1; i <= 8; i++) used.add("sc.c." + i);
  const lack = [...used].filter((k) => !TI.it[k] || !TI.zh[k]);
  check("Scambio linguistico: stessi testi in italiano e in cinese e nessun testo usato che manchi (" + keys(TI.it).length + ")", keys(TI.it).join() === keys(TI.zh).join() && !lack.length, lack.join(", "));
  const terms = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => TI.it["sc.c." + i] + TI.zh["sc.c." + i]).join(" ");
  check("Scambio linguistico: il consenso dice licenza CC BY 4.0, maggiorenni, chi ascolta, il ritiro e la lingua non madre", /CC BY 4\.0/.test(terms) && /18/.test(terms) && /Claudio Longhitano/.test(terms) && /mandarinoapp@gmail\.com/.test(terms) && /non madrelingua/.test(terms) && /非母语/.test(terms));
  const pg = fs.readFileSync(path.join(ROOT, "docs/partecipa-voci.html"), "utf8"), st = fs.readFileSync(path.join(ROOT, "tools/site.mjs"), "utf8");
  check("Scambio linguistico: la pagina del consenso sul sito è nascosta (noindex, fuori dalla sitemap e dentro robots.txt, aperta solo con ?da=app) e senza rete", /noindex/.test(pg) && /da.*app/.test(pg) && /Disallow: \/partecipa-voci\.html/.test(st) && !/"\/partecipa-voci/.test(st) && !/<script[^>]+src=/.test(pg) && !/fetch\(|XMLHttpRequest/.test(pg) && /f-ok/.test(pg) && /f-age/.test(pg), "");
  check("Scambio linguistico: il modulo non fa richieste di rete e tiene il consenso fuori dalle chiavi cp-", !/fetch\(|XMLHttpRequest|sendBeacon/.test(code) && /md-voice-consent/.test(code) && !/"cp-voice/.test(code));
}

console.log("\n" + results.filter(Boolean).length + "/" + results.length + " prove superate.");
process.exit(results.every(Boolean) ? 0 : 1);
