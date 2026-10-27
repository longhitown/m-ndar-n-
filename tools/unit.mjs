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

/* ---- 2b. test di livello e sblocchi tra dispositivi (Task 1) ---- */
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

/* ---- 2c. sigilli di gratitudine (Task 4) ---- */
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
  /* pacchetti classe (Task 9): unione per id, il pacchetto tolto su un dispositivo resta tolto */
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
  /* lo strumento dell'autore: regole (funzione pura) e riga di comando in una cartella usa-e-getta */
  const T = await import("./seal-issue.mjs");
  const D = (id, email, amount, date, extra) => Object.assign({ id, email, amount, currency: "EUR", date, message: "Per il SIGILLO, grazie", type: "Donation" }, extra || {});
  const reg0 = { v: 1, people: {}, done: {}, counters: {} }, rates = { EUR: 1, USD: 0.9 };
  let r = T.plan(reg0, [D("a1", "a@x.it", 3, "2026-10-01"), D("a1", "a@x.it", 3, "2026-10-01")], "2026-10-20", rates);
  check("strumento: donazione doppia non conta due volte; sotto i 5 € nessun sigillo ma una bozza di ringraziamento", r.reg.people["a@x.it"].cents === 300 && !r.log.issue.length && r.log.thanks.length === 1 && r.log.skipped.length === 1);
  r = T.plan(r.reg, [D("a2", "a@x.it", 60, "2026-10-02", { type: "Tip" })], "2026-10-20", rates);
  check("strumento: somma cumulativa, salto di più livelli (Tip vale come Donation): un solo sigillo, il più alto", r.log.issue.length === 1 && r.log.issue[0].seal.lvl === 3 && r.reg.people["a@x.it"].cents === 6300);
  r = T.plan(reg0, [D("b1", "b@x.it", 10, "2026-10-01", { currency: "USD" }), D("c1", "c@x.it", 50.5, "2026-10-01"), D("d1", "d@x.it", 30, "2026-10-01", { message: "grazie!" }), D("e1", "e@x.it", 30, "2026-10-18")], "2026-10-20", rates);
  const lv = Object.fromEntries(r.log.issue.map((x) => [x.email, x.seal.lvl]));
  check("strumento: cambio arrotondato a favore di chi dona (10 USD = 9 €), 50,50 € = Cultura, senza parola chiave ignorata, attesa di 7 giorni", r.reg.people["b@x.it"].cents === 900 && lv["b@x.it"] === 1 && lv["c@x.it"] === 2 && r.log.ignored.length === 1 && r.log.waiting.length === 1 && !r.reg.people["d@x.it"]);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "md-seal-")), env = Object.assign({}, process.env, { MANDARINO_SEAL_HOME: home, MANDARINO_SEAL_PASS: "frase-di-prova-lunga" });
  fs.writeFileSync(path.join(home, "seal-private-t1.pem"), privateKey.export({ type: "pkcs8", format: "pem", cipher: "aes-256-cbc", passphrase: "frase-di-prova-lunga" }));
  fs.writeFileSync(path.join(home, "in.json"), JSON.stringify([{ verification_token: "esempio", message_id: "m1", kofi_transaction_id: "tx1", type: "Donation", from_name: "Ada", message: "SIGILLO", amount: "25.00", currency: "EUR", email: "Ada@Esempio.it ", timestamp: "2026-10-01T10:00:00Z" }]));
  const run = (...a) => spawnSync(process.execPath, [path.join(ROOT, "tools/seal-issue.mjs"), ...a], { env, encoding: "utf8" });
  const dry = run("process", path.join(home, "in.json"), "--today", "2026-10-20", "--site", "https://esempio.org/app/");
  check("strumento: per default è una simulazione (non scrive niente)", /Simulazione/.test(dry.stdout) && !fs.existsSync(path.join(home, "registro.json")), dry.stderr);
  const ap = run("process", path.join(home, "in.json"), "--today", "2026-10-20", "--site", "https://esempio.org/app/", "--apply");
  const out = path.join(home, "uscita", "2026-10-20", "2026-2-1"), files = fs.existsSync(out) ? fs.readdirSync(out) : [];
  const codeOut = files.length ? fs.readFileSync(path.join(out, "codice.txt"), "utf8").trim() : "", ver = codeOut ? await S.verify(codeOut, KEYS) : {};
  const leaks = files.filter((f) => f !== "mailto.txt" && /ada@esempio|Ada/i.test(fs.readFileSync(path.join(out, f), "utf8")));
  check("strumento: con --apply emette il sigillo (Cultura n. 1), il codice si verifica nell'app, nessun dato personale nei file tranne il mailto", ver.ok && ver.seal.lvl === 2 && files.includes("qr.svg") && files.includes("email.txt") && !leaks.length && /mailto:ada@esempio\.it/.test(fs.readFileSync(path.join(out, "mailto.txt"), "utf8")), ap.stderr + " " + leaks.join(","));
  const again = run("process", path.join(home, "in.json"), "--today", "2026-10-21", "--apply");
  check("strumento: rielaborare la stessa transazione non emette niente di nuovo", /già elaborata/.test(again.stdout) && !/★/.test(again.stdout));
  run("forget", "--email", "ada@esempio.it", "--apply");
  check("strumento: forget cancella davvero la persona dal registro", !JSON.parse(fs.readFileSync(path.join(home, "registro.json"), "utf8")).people["ada@esempio.it"]);
  fs.rmSync(home, { recursive: true, force: true });
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

/* ---- pagina di presentazione (docs/index.html) e privacy.html: niente script, font, immagini o fogli esterni; due lingue ---- */
{
  const h = fs.readFileSync(path.join(ROOT, "docs/index.html"), "utf8");
  const ext = [...h.matchAll(/<(script|img|link|iframe|source|video|audio)\b[^>]*?(?:src|href|poster)="([^"]+)"/gi)].map((m) => m[2]).filter((u) => /^(https?:)?\/\//i.test(u));
  const local = [...h.matchAll(/(?:src|poster)="(img\/[^"]+|icon\.svg)"/g)].map((m) => m[1]).filter((f) => !fs.existsSync(path.join(ROOT, "docs", f)));
  const ctas = (h.match(/class="btn"/g) || []).length;
  check("pagina di presentazione: nessuno script né risorsa esterna, un solo invito all'azione, italiano e cinese, immagini presenti, privacy e app", !/<script\b/i.test(h) && !ext.length && !local.length && ctas === 1 && /lang="zh-CN"/.test(h) && /href="app\/"/.test(h) && /href="privacy\.html"/.test(h), ext.concat(local).join(", ") + " cta " + ctas);
  const { md2html } = await import("./site.mjs");
  const pv = md2html(fs.readFileSync(path.join(ROOT, "PRIVACY.md"), "utf8"));
  check("privacy.html da PRIVACY.md: tabelle, sezione cinese con lang, nessuno script", /<table>/.test(pv) && /<section lang="zh-CN">[\s\S]*<table>/.test(pv) && !/<script/i.test(pv) && /api\.github\.com/.test(pv));
}

/* ---- versione per gli store (Task 7D): src/config.js con il ponte Android che dice «store» ---- */
{
  const cfg = fs.readFileSync(path.join(SRC, "config.js"), "utf8");
  const run = (flavor) => { const w = { MandarinoAndroid: flavor ? { flavor: () => flavor } : undefined }; const c = { window: w }; vm.runInNewContext(cfg + ";this.C=MD_CONFIG;", c); return c.C; };
  const st = run("store"), dr = run("direct"), web = run(null);
  check("versione store: niente controllo degli aggiornamenti, sostegno né sigilli; la diretta e il sito restano come prima",
    st.FLAVOR === "store" && !st.APK_UPDATES && !st.FEATURE_DONATE && !st.FEATURE_SEALS && dr.FLAVOR === "direct" && dr.APK_UPDATES && dr.FEATURE_DONATE && web.FEATURE_SEALS && web.APK_UPDATES);
  const g = fs.readFileSync(path.join(ROOT, "android/app/build.gradle"), "utf8");
  check("Android: compileSdk e targetSdk 36, versioni direct e store", /compileSdk 36/.test(g) && /targetSdk 36/.test(g) && /direct \{/.test(g) && /store \{/.test(g));
}

/* ---- Task 11: i traguardi del corso di italiano si uniscono tra dispositivi (per ognuno la data più vecchia) ---- */
{
  const { Store, LS } = sandbox();
  LS.setItem("cp-it-cards-v1", JSON.stringify({ m: { first: 200, s7: 500 } }));
  await Store.importObj({ app: "mandarino", v: 5, kv: { "cp-it-cards-v1": JSON.stringify({ m: { first: 100, w100: 300 } }) }, log: [] }, "merge");
  const m = JSON.parse(LS.getItem("cp-it-cards-v1")).m;
  check("traguardi del corso di italiano: unione, per ognuno la prima volta", m.first === 100 && m.s7 === 500 && m.w100 === 300, JSON.stringify(m));
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
