#!/usr/bin/env node
/* màndarínō · prove end-to-end in Chromium (Playwright), §8 del prompt V6.7.
   1. #selftest tutto verde (da file:// e da http://).
   2. PWA su un server http locale: manifest senza errori, installabile, funziona offline, l'avviso
      «Nuova versione disponibile · Aggiorna» compare quando cambia APP_VERSION e rinnova la cache.
   3. Backup → ripristino su un secondo profilo: cp-community-contribs unito per id, cp-srs-v1 dell'altro profilo
      intatto, registro dei ripassi sommato.
   5. Corso di italiano per chi parla cinese: si sceglie dal benvenuto, le lezioni si superano con le risposte giuste, il ripasso salva.
   6. Le lezioni di grammatica del corso di cinese si superano tutte con le risposte giuste.
   4. Senza riconoscimento vocale il 🎤 resta e registra e confronta (microfono finto di Chromium);
      l'indicatore 🎙️ compare e un tocco chiude il flusso.
   Restano da fare a mano, su un telefono vero: tap udibile a volume 50% e 10 tap di fila non fastidiosi, la musica
   che si abbassa quando parla la voce, Lighthouse «Installable» su https, il microfono in modalità standalone su iPhone.

   Uso: node tools/e2e.mjs [dist/index.html]   (prima: node tools/build.mjs) */
import { createRequire } from "module";
import http from "http";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const file = path.resolve(process.argv[2] || "dist/index.html"), dir = path.dirname(file);
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail: detail || "" }); console.log((ok ? "✓ " : "✗ ") + name + (detail ? " — " + detail : "")); };

/* server statico minimo, con sw.js riscrivibile al volo per provare l'aggiornamento */
let swOverride = null;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ogg": "audio/ogg", ".txt": "text/plain; charset=utf-8" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/" + path.basename(file);
  if (p === "/sw.js" && swOverride) { res.writeHead(200, { "Content-Type": TYPES[".js"], "Cache-Control": "no-cache" }); return res.end(swOverride); }
  const f = path.join(dir, p); if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-cache" }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port + "/";

const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
async function selftest(url) {
  const ctx = await browser.newContext(); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(url + "#selftest"); await p.waitForFunction(() => window.__SELFTEST, null, { timeout: 30000 });
  const st = await p.evaluate(() => window.__SELFTEST); await ctx.close();
  return { st, errs };
}
try {
  /* 1 */
  for (const url of [pathToFileURL(file).href, base]) {
    const { st, errs } = await selftest(url);
    check("#selftest da " + url.split(":")[0], st.pass === st.total && !errs.length, st.pass + "/" + st.total + (errs.length ? " · " + errs[0] : "") + (st.pass !== st.total ? " · KO: " + st.results.filter((r) => !r.ok).map((r) => r.name).join(", ") : ""));
  }
  /* 2 */
  {
    const ctx = await browser.newContext(); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); return navigator.serviceWorker.ready; }); await p.reload(); await p.waitForTimeout(800);
    const cdp = await ctx.newCDPSession(p);
    const man = await cdp.send("Page.getAppManifest"); const inst = await cdp.send("Page.getInstallabilityErrors");
    check("PWA: manifest letto senza errori", !man.errors.length && /manifest\.json$/.test(man.url), man.url);
    check("PWA: installabile (nessun errore di installabilità)", !inst.installabilityErrors.length, JSON.stringify(inst.installabilityErrors));
    check("PWA: controllata dal service worker", await p.evaluate(() => !!navigator.serviceWorker.controller));
    await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(600);
    check("PWA: si apre offline", (await p.evaluate(() => window.CP && CP.ORDER.length)) > 3000);
    await ctx.setOffline(false);
    const sw = fs.readFileSync(path.join(dir, "sw.js"), "utf8");
    swOverride = sw.replace(/APP_VERSION = '[^']*'/, "APP_VERSION = 'e2e-" + Date.now() + "'");
    await p.reload(); await p.waitForTimeout(2500);
    const shown = await p.evaluate(() => !document.getElementById("sw-notice").hidden);
    check("PWA: avviso «Nuova versione disponibile»", shown);
    if (shown) {
      await Promise.all([p.waitForNavigation({ timeout: 8000 }).catch(() => null), p.click("[data-sw-update]")]); await p.waitForTimeout(600);
      const keys = await p.evaluate(() => caches.keys());
      check("PWA: «Aggiorna» passa alla cache nuova", keys.length === 1 && /mandarino-e2e-/.test(keys[0]), keys.join(", "));
    }
    swOverride = null;
    check("PWA: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 3 */
  {
    const mk = async () => { const ctx = await browser.newContext(); const p = await ctx.newPage(); await p.goto(pathToFileURL(file).href); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); }); await p.reload(); await p.evaluate(() => Store.ready); return { ctx, p }; };
    const A = await mk();
    await A.p.evaluate(() => { const l = CP.contrib.list(); l.push({ id: "c_A", op: "fix", target: "我", field: "it", old: "io, me", new: "io, me (pronome)", t: Date.now() }); CP.contrib.save(l); CP.grade("你", 2, false, { ms: 1000, type: "pi" }); });
    await A.p.waitForTimeout(400);
    const bk = await A.p.evaluate(() => Store.exportObj(true));
    const B = await mk();
    await B.p.evaluate(() => { const l = CP.contrib.list(); l.push({ id: "c_B", op: "flag", target: "好", why: "tono strano", t: Date.now() }); CP.contrib.save(l); CP.grade("好", 2, false, { ms: 900, type: "pi" }); });
    await B.p.waitForTimeout(400);
    const before = await B.p.evaluate(() => Store.logAll().then((l) => ({ srs: localStorage.getItem("cp-srs-v1"), log: l.length })));
    await B.p.evaluate((o) => Store.importObj(o, "merge"), bk);
    const after = await B.p.evaluate(() => Store.logAll().then((l) => ({ srs: JSON.parse(localStorage.getItem("cp-srs-v1")), log: l.length, ct: JSON.parse(localStorage.getItem("cp-community-contribs")).map((x) => x.id) })));
    check("Backup → ripristino: contributi uniti per id", after.ct.includes("c_A") && after.ct.includes("c_B"), after.ct.join(", "));
    check("Backup → ripristino: cp-srs-v1 del secondo profilo intatto, il primo aggiunto", JSON.stringify(after.srs["好"]) === JSON.stringify(JSON.parse(before.srs)["好"]) && !!after.srs["你"]);
    check("Backup → ripristino: registro dei ripassi sommato", after.log === before.log + 1, before.log + " → " + after.log);
    await A.ctx.close(); await B.ctx.close();
  }
  /* 4 */
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, permissions: ["microphone"] });
    await ctx.addInitScript(() => { delete window.webkitSpeechRecognition; delete window.SpeechRecognition; });
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); }); await p.reload();
    await p.click("#tab-words"); await p.waitForTimeout(200);
    const lbl = await p.evaluate(() => { const m = document.querySelector("#frasi .ln .mic"); if (!m) return null; m.scrollIntoView(); m.click(); return m.getAttribute("aria-label"); });
    check("Senza riconoscimento vocale il 🎤 resta e apre il pannello «Parla»", lbl === "Registra e confronta" && await p.evaluate(() => !!document.querySelector(".vp")), lbl);
    await p.waitForTimeout(500);
    check("Indicatore 🎙️ col microfono aperto", await p.evaluate(() => !document.getElementById("mic-live").hidden));
    await p.waitForFunction(() => !document.querySelector(".vp.on"), null, { timeout: 12000 }).catch(() => {});
    check("Il pannello «Parla» si ferma da solo e la registrazione si riascolta", await p.evaluate(() => { const b = document.querySelector("[data-vp-me]"); return !!b && !b.disabled; }));
    /* voce sintetica: un 4° tono (240 → 140 Hz) deve risultare «che cade» */
    const tone = await p.evaluate(() => { const sr = 48000, pts = []; for (let i = 0; i < 40; i++) pts.push({ t: i * 0.015, f: 240 * Math.pow(140 / 240, i / 39) }); const r = CP.pitchAnalyze(pts, [4]); return r.tone + "/" + r.score; });
    check("Analisi del tono: una curva che cade è un 4° tono", tone === "4/100", tone);
    check("Riconoscimento per suono: 她 vale come 他, 妈 vs 马 è «quasi»", await p.evaluate(() => CP.soundMatch("他", "她").level === 2 && CP.soundMatch("妈", "马").level === 1 && CP.soundMatch("你好", "我说你好吗").level === 2));
    await p.click("#mic-live", { force: true });
    check("Un tocco sull'indicatore chiude il microfono", await p.evaluate(() => !CP.micInfo().live && document.getElementById("mic-live").hidden));
    check("Registra e confronta: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4b. Immersione: gli esercizi di Frasi a schermo pieno */
  {
    const ctx = await browser.newContext({ viewport: { width: 380, height: 800 } });
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); }); await p.reload();
    await p.click("#tab-build"); await p.waitForTimeout(200);
    await p.click('[data-group="build"]'); await p.waitForTimeout(150);   /* Frasi si apre sulle quattro carte */
    await p.click(".fx-go"); await p.waitForTimeout(200);
    check("Immersione: ⛶ nasconde schede e menu, resta la barra con l'avanzamento", await p.evaluate(() => document.body.classList.contains("in-focus") && getComputedStyle(document.querySelector(".dock")).display === "none" && !document.getElementById("fx-bar").hidden && document.querySelector("#fx-bar .fx-n").textContent === "0/10"));
    await p.keyboard.press("Escape"); await p.waitForTimeout(150);
    check("Immersione: Esc esce", await p.evaluate(() => !document.body.classList.contains("in-focus") && document.getElementById("fx-bar").hidden));
    await p.evaluate(() => CP.build.openLesson(CP.lessons.list()[0].id)); await p.click("[data-ls-quiz]"); await p.waitForTimeout(150);
    check("Immersione: gli esercizi di una lezione partono a schermo pieno", await p.evaluate(() => document.body.classList.contains("in-focus")));
    await p.goBack(); await p.waitForTimeout(200);
    check("Immersione: il tasto Indietro esce", await p.evaluate(() => !document.body.classList.contains("in-focus")));
    check("Immersione: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4c. benvenuto, test di livello, rivelazione progressiva (Task 1) */
  {
    const tabs = (p) => p.evaluate(() => [...document.querySelectorAll("nav.dock:not(.dock-it) .dtab")].filter((b) => !b.hidden).map((b) => b.id.replace("tab-", "")).join(","));
    /* a. «Parto da zero»: obiettivo, i quattro toni, la prima carta; nella barra solo Percorso e Studia */
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
      await p.goto(base); const door = await p.waitForSelector('[data-onb-door="zero"]', { timeout: 8000 }).catch(() => null);
      check("Benvenuto: l'intro dura meno di 6 secondi", !!door);
      if (door) {
        await door.click(); await p.click('[data-onb-next="goal"]'); await p.click('[data-onb-goal="5"]'); await p.click('[data-onb-next="first"]');
        await p.click('[data-onb-tq="0"]'); await p.click('[data-onb-next="finish"]'); await p.waitForTimeout(300);
      }
      check("Da zero: la prima carta parte subito e l'obiettivo è quello scelto", await p.evaluate(() => document.body.classList.contains("in-session") && CP.game.goal() === 5 && CP.ux.get("onboarded") === 1));
      await p.evaluate(() => { if (document.getElementById("quit")) document.getElementById("quit").click(); });
      check("Da zero: nella barra solo Percorso e Studia", (await tabs(p)) === "path,study", await tabs(p));
      await p.evaluate(() => CP.go("frasi")); await p.waitForTimeout(150);
      check("?go=frasi con Frasi ancora chiusa porta alla scheda aperta più vicina, senza errori", await p.evaluate(() => !document.getElementById("view-path").hidden && document.getElementById("view-build").hidden));
      await p.evaluate(() => CP.unlock.peek("build", () => CP.build.openLesson(CP.lessons.list()[0].id), "Frasi")); await p.waitForTimeout(250);
      check("Lezione dal Percorso con Frasi chiusa: si apre in immersione, senza la scheda Frasi", await p.evaluate(() => document.body.classList.contains("in-focus") && getComputedStyle(document.querySelector("nav.dock")).display === "none" && document.getElementById("tab-build").hidden));
      await p.keyboard.press("Escape"); await p.waitForTimeout(250);
      check("…e all'uscita si torna al Percorso", await p.evaluate(() => !document.body.classList.contains("in-focus") && !document.getElementById("view-path").hidden));
      await p.evaluate(() => CP.finder()); await p.fill("#fd-q", "laboratorio"); await p.waitForTimeout(150);
      check("Cerca ovunque: uno strumento ancora chiuso compare con «si apre…» e non porta a una scheda nascosta", /🔒/.test(await p.textContent("#fd-res")));
      await p.keyboard.press("Escape");
      /* «Mostra tutto»: due conferme */
      await p.evaluate(() => { CP.openSettings("set-level"); }); await p.waitForTimeout(150);
      await p.click("#opt-showall"); await p.click("[data-unl-all1]"); await p.click("[data-unl-all2]"); await p.waitForTimeout(200);
      check("Mostra tutto (con doppia conferma): tutte le schede", (await tabs(p)) === "path,study,words,build", await tabs(p));
      check("Benvenuto da zero: nessun errore JavaScript", !errs.length, errs[0]);
      await ctx.close();
    }
    /* b. «Conosco già le basi»: dichiarazione, test, livello corretto a mano, conferma, poi «Annulla il salto» */
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
      await p.goto(base); await p.waitForSelector('[data-onb-door="basics"]', { timeout: 8000 });
      await p.click('[data-onb-door="basics"]'); await p.click('[data-onb-purpose="exam"]'); await p.click('[data-onb-next="declare"]');
      for (let i = 0; i < 5; i++) await p.click(`[data-onb-decl="${i}:1"]`);
      await p.click('[data-onb-next="test"]'); let n = 0;
      while (n < 12 && (await p.$("[data-pl-idk]"))) { await p.click("[data-pl-idk]"); n++; }
      check("Test di livello: al massimo 10 domande, «Non lo so» sempre possibile", n >= 6 && n <= 10, n + " domande");
      while (await p.$('[data-onb-r="1"]:not([disabled])') && (await p.textContent(".onb-step span")) !== "Capitolo 3") await p.click('[data-onb-r="1"]');
      await p.click("[data-onb-confirm]"); await p.waitForTimeout(150);
      const r = await p.evaluate(() => { const S = CP.S(), pl = Object.keys(S).filter((k) => S[k].pl); return { n: pl.length, ch: [...new Set(pl.map((k) => SECTION_CHAPTER[CP.WORDS[k].sec]))].join(","), log: (localStorage.getItem("cp-log") || "").length, days: CP.game.activeDays(), xp: CP.game.rank().xp, goal: (document.querySelector("[data-onb-goal].on") || {}).textContent }; });
      check("Livello confermato (capitolo 3): le parole dei capitoli 1-2 sono note, senza registro né serie, con i punti del grado", r.n > 1000 && r.ch === "1,2" && r.log === 0 && r.days === 0 && r.xp === 600 && r.goal === "20", JSON.stringify(r));
      await p.click('[data-onb-next="finish"]'); await p.waitForTimeout(300);
      check("Livello avanzato: tutte le schede subito; il Percorso riparte dal capitolo 3", (await tabs(p)) === "path,study,words,build" && await p.evaluate(() => SECTION_CHAPTER[SECTIONS.filter((s) => (document.querySelector("#path-root .resume .small") || {}).textContent.indexOf(s.title.replace(/^\d+\.\s*/, "")) >= 0)[0].id] === 3));
      await p.evaluate(() => CP.openSettings("set-level")); await p.click("[data-unl-undo]"); await p.click("[data-unl-undo-ok]"); await p.waitForTimeout(200);
      check("Annulla il salto: via le parole del test e i punti, le schede tornano come prima", await p.evaluate(() => !Object.values(CP.S()).some((x) => x.pl) && CP.game.rank().xp === 0) && (await tabs(p)) === "path,study", await tabs(p));
      check("Benvenuto e test di livello: nessun errore JavaScript", !errs.length, errs[0]);
      await ctx.close();
    }
    /* c. profilo di prima di questa versione: nessuna perdita, tutto aperto, niente benvenuto */
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
      await p.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("cp-srs-v1", JSON.stringify({ 我: { n: 2, st: 3, df: 5, sd: 2, sp: null, lr: Date.now() - 864e5, d: Date.now() + 864e5 } })); localStorage.setItem("cp-game-v1", JSON.stringify({ xp: 40, goal: 10, days: {} })); localStorage.setItem("cp-tab", "words"); } });
      await p.goto(base); await p.waitForTimeout(1200);
      check("Profilo vecchio: tutte le schede, l'ultima scheda aperta, nessun benvenuto, progressi intatti", (await tabs(p)) === "path,study,words,build" && await p.evaluate(() => !document.getElementById("view-words").hidden && !document.getElementById("onb") && CP.S()["我"].n === 2 && CP.game.rank().xp === 40));
      check("Profilo vecchio: nessun errore JavaScript", !errs.length, errs[0]);
      await ctx.close();
    }
  }
  /* 4d. sostegno e sigilli di gratitudine (Task 4): chiavi usa-e-getta, nessuna richiesta di rete */
  {
    const nc = require("crypto"), vmm = require("vm");
    const sctx = vmm.createContext({ btoa, atob, TextEncoder, TextDecoder, crypto: globalThis.crypto }); vmm.runInContext(fs.readFileSync(path.join(path.dirname(file), "..", "src/core/seal-code.js"), "utf8"), sctx);
    const { privateKey, publicKey } = nc.generateKeyPairSync("ec", { namedCurve: "P-256" }), jwk = publicKey.export({ format: "jwk" });
    const mk = (lvl, num) => { const pl = sctx.MDSeal.make("e2e", lvl, 2026, num); return sctx.MDSeal.encode(pl, new Uint8Array(nc.sign("sha256", Buffer.from(pl), { key: privateKey, dsaEncoding: "ieee-p1363" }))); };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    const net = []; await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => { net.push(r.request().url()); r.abort(); });
    await ctx.addInitScript(([jwk]) => { window.__mdConfigTest = { SEAL_PUBKEYS: [{ kid: "e2e", jwk }] }; if (!sessionStorage.getItem("s")) { sessionStorage.setItem("s", 1); localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); } }, [jwk]);
    await p.goto(base + "#seal=" + encodeURIComponent(mk(2, 17))); await p.waitForSelector("[data-seal-add]", { timeout: 5000 }).catch(() => null);
    check("Sigillo da link: il codice sparisce dall'indirizzo e l'app chiede conferma prima di salvarlo", (await p.evaluate(() => location.hash)) === "" && !!(await p.$("[data-seal-add]")) && !(await p.evaluate(() => localStorage.getItem("cp-seal-v1"))));
    await p.click("[data-seal-add]"); await p.waitForSelector("[data-seal-prefs]");
    check("Sigillo: senza un titolo è la scelta predefinita; il sigillo non va nelle immagini senza consenso", await p.evaluate(() => document.querySelector('input[name="seal-gram"]:checked').value === "n" && !document.getElementById("seal-share").checked && CP.seals.forShare() === null));
    await p.check("#seal-share"); await p.click("[data-seal-prefs]"); await p.waitForTimeout(300);
    check("Sigillo: con il consenso compare nella carta da condividere", await p.evaluate(() => !!CP.seals.forShare() && document.querySelectorAll("#set-support .seal-main").length === 1));
    /* da testo incollato, poi da QR (codice scritto con il generatore dell'app, letto con jsQR) */
    await p.evaluate(() => { document.querySelector(".seal-redeem").open = true; }); await p.fill("#seal-code", mk(1, 4)); await p.click("[data-seal-try]"); await p.click("[data-seal-add]"); await p.waitForTimeout(300); await p.click("[data-seal-prefs]");
    const qrOk = await p.evaluate((code) => { const q = CP.qr.encode(code, "M"), cv = document.createElement("canvas"); CP.qr.draw(cv, q, 4); const img = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height), r = window.jsQR(img.data, cv.width, cv.height); if (!r) return false; CP.seals.offer(r.data); return true; }, mk(3, 9));
    if (qrOk) { await p.waitForSelector("[data-seal-add]"); await p.click("[data-seal-add]"); await p.waitForTimeout(300); }
    check("Sigillo da testo e da QR: tre sigilli nella raccolta, il più alto in primo piano", qrOk && await p.evaluate(() => CP.seals.list().length === 3 && CP.seals.best().lvl === 3));
    await p.evaluate(() => { CP.closeSheet(); }); await p.evaluate(() => { document.getElementById("seal-code") && (document.getElementById("seal-code").value = "MDS1.abc"); });
    await p.evaluate(() => CP.seals.offer("MDS1.abc")); await p.waitForTimeout(150);
    check("Sigillo: un codice rotto dà un messaggio gentile", /incompleto/.test(await p.textContent(".seal-sheet")));
    await p.reload(); await p.waitForTimeout(400);
    check("Avvio con un sigillo: il suo carattere dietro il frutto, senza attendere la verifica", await p.evaluate(() => (document.querySelector("#splash .sp-seal") || {}).textContent === "永"));
    check("Sostegno e sigilli: nessuna richiesta di rete, nessun errore JavaScript", !net.length && !errs.length, net[0] || errs[0]);
    await ctx.close();
    /* interruttori spenti (versione per gli store): nessuna traccia, nemmeno con codici arrivati da un backup */
    const c2 = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p2 = await c2.newPage();
    await c2.addInitScript(([jwk, code]) => { window.__mdConfigTest = { FEATURE_DONATE: false, FEATURE_SEALS: false, SEAL_PUBKEYS: [{ kid: "e2e", jwk }] }; localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); localStorage.setItem("cp-seal-v1", JSON.stringify({ codes: { "3-2026-9": { code, ok: true } }, share: 1 })); }, [jwk, mk(3, 9)]);
    await p2.goto(base + "#seal=" + encodeURIComponent(mk(1, 5))); await p2.waitForTimeout(1200); await p2.evaluate(() => CP.openSettings("grp-info")); await p2.waitForTimeout(200);
    check("Versione store (FEATURE_* spenti): niente sostegno né sigilli nel DOM, il link #seal= viene ignorato", await p2.evaluate(() => !document.getElementById("set-support") && !document.querySelector(".seal-svg, .sp-seal, [data-seal-add]") && !CP.seals && location.hash === "" && /cp-seal-v1/.test(Object.keys(localStorage).join(","))));
    await c2.close();
  }
  /* 4b. contributi con consenso ai Crediti, «Novità» e Crediti in tutte e due le lingue */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); });
    await p.goto(base); await p.waitForTimeout(500);
    await p.evaluate(() => CP.contribOpen({ op: "fix", target: "你", field: "it" })); await p.waitForSelector("#ct-credit");
    const off = await p.evaluate(() => !document.getElementById("ct-credit").checked);
    await p.fill("#ct-nick", "Prova_e2e"); await p.fill("#ct-new", "tu (prova)"); await p.check("#ct-credit"); await p.click("#ct-save"); await p.waitForTimeout(200);
    await p.evaluate(() => { window.__sent = null; Store.download = (n, t) => { window.__sent = t; }; }); await p.click('[data-ct-send="file"]').catch(() => {}); await p.waitForTimeout(150);
    const sent = await p.evaluate(() => { try { return JSON.parse(window.__sent); } catch (e) { return null; } });
    check("Contributi: la casella «compari nei Crediti» è spenta di base; spuntata, la patch porta nickname e credit: 1", off && sent && sent.author === "Prova_e2e" && sent.credit === 1, JSON.stringify(sent || {}).slice(0, 160));
    await p.evaluate(() => { CP.closeSheet(); CP.openSettings("grp-info"); }); await p.waitForTimeout(200);
    const news = await p.evaluate(() => { const d = document.getElementById("set-news"); if (!d) return null; d.open = true; const v = d.querySelector(".news-v[open] b"); return { v: v && v.textContent, top: CHANGELOG[0].v, n: d.querySelectorAll(".news-v[open] li").length, lang: d.querySelector(".news-list").getAttribute("lang") }; });
    check("Novità: in ⚙️ → Informazioni e supporto, l'ultima versione aperta", news && news.v === news.top && news.n > 2 && news.lang === "it", JSON.stringify(news));
    await p.click("#grp-info [data-credits]").catch(() => p.evaluate(() => CP.credits())); await p.waitForTimeout(150);
    check("Crediti: la parte «Chi ha contribuito» c'è anche quando l'elenco è vuoto", await p.evaluate(() => /Chi ha contribuito/.test(document.getElementById("fam").textContent)));
    await p.evaluate(() => { localStorage.setItem("cp-lang", "zh"); }); await p.reload(); await p.waitForTimeout(500);
    await p.evaluate(() => CP.openSettings("grp-info")); await p.waitForTimeout(200);
    const zh = await p.evaluate(() => { const d = document.getElementById("set-news"); return d && d.querySelector("summary").textContent + "|" + d.querySelector(".news-list").getAttribute("lang"); });
    check("Novità in cinese: titolo e righe in cinese", /更新内容/.test(zh || "") && /zh-CN$/.test(zh || ""), zh);
    const pv = await p.evaluate(() => { const d = document.getElementById("set-privacy"); return d ? d.closest("#grp-data") && d.querySelector("summary").textContent + "|" + d.querySelectorAll("li").length : ""; });
    check("Privacy: voce in ⚙️ → Dati e privacy, in cinese, sei punti", /隐私\|6$/.test(pv || ""), pv);
    check("Contributi e Novità: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 5. corso di italiano per chi parla cinese */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(pathToFileURL(file).href); await p.waitForTimeout(700);
    /* il benvenuto (ui/welcome.js): intro di qualche secondo, poi le porte; in piccolo, l'altro corso */
    const btn = await p.waitForSelector('#onb [data-course-set="it"]', { timeout: 8000 }).catch(() => null);
    check("Benvenuto: intro, porte e «我是中国人，我想学意大利语»", !!btn && (await p.$$("#onb [data-onb-door]")).length === 3);
    if (btn) { await Promise.all([p.waitForNavigation(), btn.click()]); await p.waitForTimeout(700); }
    /* il corso di italiano ha lo stesso benvenuto, in cinese (l'intro non si ripete nella stessa sessione) */
    const later = await p.waitForSelector("#onb [data-onb-later]", { timeout: 8000 }).catch(() => null);
    check("Corso di italiano: benvenuto in cinese con le tre porte", !!later && /从零开始/.test(await p.textContent("#onb")));
    if (later) { await later.click(); await p.waitForTimeout(200); }
    check("Corso di italiano: all'inizio solo 课程 e 复习 nella barra (rivelazione progressiva)", await p.evaluate(() => [...document.querySelectorAll(".dock-it .dtab")].filter((b) => !b.hidden).map((b) => b.getAttribute("data-it-tab")).join(",") === "lessons,review"));
    check("Corso di italiano: interfaccia cinese e schede proprie", await p.evaluate(() => CP.course() === "it" && LANG === "zh" && document.body.classList.contains("course-it") && document.querySelectorAll(".dock-it [data-it-tab]").length === 5));
    const res = await p.evaluate(() => {
      const out = [], click = (sel) => { const e = document.querySelector(sel); if (!e) throw new Error("manca " + sel); e.click(); };
      try { document.getElementById("fam").hidden = true; } catch (e) {}
      for (const l of ITLESSONS) {
        CP.itShow("lessons"); if (document.querySelector("[data-itl-back]")) click("[data-itl-back]");
        click('[data-itl-open="' + l.id + '"]'); click("[data-itl-quiz]");
        for (const q of l.quiz) {
          if (q.k === "order") { for (const w of q.it.replace(/[.,!?]/g, "").split(/\s+/)) { const t = [...document.querySelectorAll("[data-itl-pick]:not([disabled])")].find((x) => x.textContent === w); if (!t) return ["tessera " + w]; t.click(); } click("[data-itl-check]"); }
          else click('[data-itl-opt="' + q.a + '"]');
          if (!document.querySelector(".verdict.ok")) return [l.id + ": risposta giusta segnata sbagliata"];
          click("[data-itl-next]");
        }
        out.push(l.id);
      }
      return out;
    }).catch((e) => ["ERR " + e.message]);
    check("Corso di italiano: le " + res.length + " lezioni si superano con le risposte giuste", res.length >= 10 && res.every((x) => !/ /.test(x)), res.join(" "));
    await p.evaluate(() => CP.itShow("review")); await p.click("[data-itr-show]"); await p.click('[data-itr-grade="3"]');
    check("Corso di italiano: ripasso FSRS in cp-it-srs-v1", await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("cp-it-srs-v1") || "{}"); return Object.keys(s).filter((k) => k !== "__meta").length === 1; }));
    /* superate le 30 lezioni: 变位 si apre (lezione sul presente); 句子 aspetta anche i giorni di studio */
    check("Corso di italiano: dopo le lezioni si apre 变位, 句子 aspetta i giorni di studio", await p.evaluate(() => { CP.unlock.check(true); return CP.unlock.ok("conj") && !CP.unlock.ok("phrases"); }));
    /* correttore di frasi (it/checker.js): nessuna segnalazione sulle frasi giuste dell'app, gli errori tipici trovati */
    const itc = await p.evaluate(() => {
      CP.unlock.unlockAll();
      const S = [];
      ITLESSONS.forEach((l) => { l.ex.forEach((e) => S.push(e[0])); l.traps.forEach((t) => S.push(t[1])); });
      Object.values(EXAMPLES).forEach((x) => S.push(x[1])); PHRASES.forEach((g) => g.items.forEach((i) => S.push(i[2]))); DIALOGS.forEach((d) => d.lines.forEach((l) => S.push(l[3])));
      const fp = S.filter((s) => CP.itCheck(s).issues.length).map((s) => s + " ⇒ " + CP.itCheck(s).fixed);
      const BAD = [["La libro è rosso.", "Il libro è rosso."], ["Il ragazza è alto.", "La ragazza è alta."], ["Io parla italiano.", "Io parlo italiano."], ["I ragazzi parla molto.", "I ragazzi parlano molto."],
        ["il studente", "lo studente"], ["la acqua", "l'acqua"], ["Un amica", "Un'amica"], ["due libri nuovo", "due libri nuovi"], ["Vado a il ristorante.", "Vado al ristorante."], ["In la borsa.", "Nella borsa."],
        ["Ho andato.", "Sono andato."], ["Lei è andato.", "Lei è andata."], ["Mi ho alzato.", "Mi sono alzato."], ["Sono fame.", "Ho fame."], ["Io piace il tè.", "Mi piace il tè."], ["Mi piace i cani.", "Mi piacciono i cani."],
        ["Il suo casa.", "La sua casa."], ["Quello libro.", "Quel libro."], ["La mia madre.", "Mia madre."], ["Io sono Cinese.", "Io sono cinese."], ["citta", "città"], ["Io parlare cinese.", "Io parlo cinese."]];
      const miss = BAD.filter(([w, r]) => CP.itCheck(w).fixed !== r).map(([w, r]) => w + " → " + CP.itCheck(w).fixed + " (atteso " + r + ")");
      CP.itShow("phrases"); const inp = document.getElementById("itc-in"); inp.value = "La casa bianco"; inp.form.requestSubmit();
      return { n: S.length, fp, miss, ui: /bianca/.test(document.getElementById("itc-out").textContent) && !!document.querySelector("#itc-out mark") };
    });
    check("Corso di italiano: il correttore non segnala nessuna delle " + itc.n + " frasi giuste dell'app", !itc.fp.length, itc.fp.slice(0, 3).join(" · "));
    check("Corso di italiano: il correttore trova e corregge gli errori tipici", !itc.miss.length && itc.ui, itc.miss.slice(0, 3).join(" · ") + (itc.ui ? "" : " · pannello"));
    check("Corso di italiano: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 6. lezioni di grammatica del corso di cinese: ognuna si supera con le risposte giuste (tessere e scelte) */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.addInitScript(() => { try { localStorage.setItem("cp-ux-v1", JSON.stringify({ onboarded: 1 })); } catch (e) {} });
    await p.goto(pathToFileURL(file).href); await p.waitForTimeout(700);
    const res = await p.evaluate(() => {
      const out = [], click = (sel) => { const e = document.querySelector(sel); if (!e) throw new Error("manca " + sel); e.click(); };
      CP.show("build", true);
      for (const l of CP.lessons.list()) {
        CP.build.openLesson(l.id); click("[data-ls-quiz]");
        for (const q of l.quiz) {
          if (q.k === "order") {
            for (const s of CP.segment(q.zh).filter((x) => x.w)) {
              const t = [...document.querySelectorAll("[data-ls-pick]:not([disabled])")].find((x) => x.querySelector(".th").textContent === s.w.hz);
              if (!t) return [l.id + ": tessera " + s.w.hz]; t.click();
            }
            click("[data-ls-check]");
          } else click('[data-ls-opt="' + q.a + '"]');
          if (!document.querySelector("#ls-root .verdict.ok")) return [l.id + ": risposta giusta segnata sbagliata"];
          click("[data-ls-next]");
        }
        out.push(l.id);
      }
      return out;
    }).catch((e) => ["ERR " + e.message]);
    check("Lezioni di cinese: le " + res.length + " lezioni si superano con le risposte giuste", res.length >= 30 && res.every((x) => !/ /.test(x)), res.join(" "));
    check("Lezioni di cinese: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 5a. aprire l'app su un'azione (scorciatoie di Android, widget, manifesto della PWA) e la card del giorno */
  {
    const ctx = await browser.newContext(); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base + "?go=ear"); await p.waitForTimeout(1500);
    check("?go=ear apre l'orecchio ai toni (e toglie il parametro dall'indirizzo)", await p.evaluate(() => CP.mode.active() === "ear" && !/go=/.test(location.search)));
    await p.evaluate(() => { CP.mode.active() && document.getElementById("m-quit") && document.getElementById("m-quit").click(); CP.shareCard(); });
    await p.waitForTimeout(1200);
    check("Card del giorno: immagine 1080×1350 disegnata", await p.evaluate(() => { const c = document.querySelector(".card-cv"); return !!c && c.width === 1080 && c.height === 1350; }));
    check("Scorciatoie e card: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 5c. musica: brani a flusso (niente decodifica in memoria), nomi con impronta, Media Session */
  {
    const ctx = await browser.newContext(); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); localStorage.setItem("cp-track", "alba"); }); await p.reload();
    await p.click("#music-btn"); await p.waitForTimeout(3500);
    const m = await p.evaluate(() => ({ st: CP.audioFile.state("alba"), url: CP.audioFile.url("alba"), run: CP.musicState().running, ms: navigator.mediaSession && navigator.mediaSession.metadata ? navigator.mediaSession.metadata.title : "", mb: Math.round(CP.audioFile.mb()) }));
    check("Musica: il brano suona a flusso dal file con l'impronta, con titolo per il sistema", m.st === "ok" && /alba\.[0-9a-f]{8}\.ogg$/.test(m.url) && m.run && !!m.ms && m.mb > 10, JSON.stringify(m));
    check("Musica: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 5d. musica: il loop dei brani senza buchi (Task 10.1). Ogni brano suona dal riproduttore vero dell'app (elemento <audio>
     in loop dentro il grafo Web Audio); a 0,35 s dalla fine si salta, e dopo il giro un AnalyserNode prende gli ultimi
     32768 campioni (circa 0,7 s), che contengono la cucitura. Buco = la sequenza più lunga sotto −60 dB: deve stare sotto
     LOOP_GAP_MS. I file non hanno silenzi ai bordi (al massimo 3 ms sotto −60 dB attorno alla cucitura), quindi un buco
     lungo viene dal riproduttore. Un caso con un buco finto di 60 ms prova che la misura lo vede. Se un brano supera la
     soglia, si riprova una volta (un intoppo del runner non è un buco del loop); due volte sopra = il loop ha un buco. */
  {
    const LOOP_GAP_MS = 20;
    const ctx = await browser.newContext(); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(() => localStorage.setItem("cp-ux-v1", '{"onboarded":1}'));
    await p.goto(base); await p.waitForTimeout(400);
    const seam = (id, glitch) => p.evaluate(([id, glitch]) => new Promise((res) => {
      const c = new AudioContext(), an = c.createAnalyser(); an.fftSize = 32768; an.connect(c.destination);
      const pl = CP.audioFile.player(c, an, id), el = pl.el, t0 = performance.now();
      const end = (r) => { res(r); pl.stop(); setTimeout(() => c.close(), 800); };
      const wait = (f, then) => { const iv = setInterval(() => { if (f()) { clearInterval(iv); then(); } else if (performance.now() - t0 > 15000) { clearInterval(iv); end({ err: CP.audioFile.state(id) || "timeout" }); } }, 5); };
      wait(() => el.duration > 0 && el.currentTime > 1.6, () => {   /* dopo la salita del volume (1,5 s) */
        el.currentTime = el.duration - 0.35;
        if (glitch) setTimeout(() => { el.pause(); setTimeout(() => el.play(), glitch); }, 300);
        wait(() => el.currentTime > 0.3 && el.currentTime < 2, () => {
          const buf = new Float32Array(an.fftSize); an.getFloatTimeDomainData(buf);
          let best = 0, cur = 0, q = 0; for (const x of buf) { q += x * x; if (Math.abs(x) < 1e-3) { cur++; if (cur > best) best = cur; } else cur = 0; }
          end({ gap: Math.round(best / c.sampleRate * 10000) / 10, rms: Math.sqrt(q / buf.length) });
        });
      });
    }), [id, glitch]);
    const ids = await p.evaluate(() => Object.keys(window.MUSIC_FILES || {})), out = {}, bad = [];
    for (const id of ids) {
      let r = await seam(id, 0); if (!r.err && r.gap > LOOP_GAP_MS) r = await seam(id, 0);
      out[id] = r.err || r.gap; if (r.err || r.gap > LOOP_GAP_MS || !(r.rms > 0.002)) bad.push(id + ":" + (r.err || r.gap + " ms"));
    }
    const worst = Math.max(...Object.values(out).filter((x) => typeof x === "number"));
    check("Musica: loop senza buchi in tutti i " + ids.length + " brani (soglia " + LOOP_GAP_MS + " ms; il peggiore " + worst + " ms)", ids.length >= 20 && !bad.length, bad.join(", "));
    const fake = await seam(ids[0], 60);
    check("Musica: la misura del loop vede un buco finto di 60 ms", fake.gap >= 50, JSON.stringify(fake));
    check("Loop della musica: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 5b. Lettore: nomi e termini da Wikidata (file a parte, scaricato al primo uso) */
  {
    const ctx = await browser.newContext(); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); }); await p.reload();
    await p.click("#tab-build"); await p.evaluate(() => CP.build.setSub("reader"));
    await p.fill("#xr-in", "我想去太平洋，也想学光合作用。我想学中文。"); await p.waitForTimeout(400);
    await p.click("[data-xr-wiki]"); await p.waitForSelector(".xr-wiki li", { timeout: 15000 }).catch(() => {});
    const w = await p.evaluate(() => [...document.querySelectorAll(".xr-wiki li")].map((li) => li.textContent.trim()));
    check("Lettore: nomi e termini da Wikipedia (太平洋, 光合作用), niente titoli a cavallo delle parole", w.some((x) => /太平洋.*Pacifico/.test(x)) && w.some((x) => /光合作用/.test(x)) && !w.some((x) => /^学中/.test(x)), w.join(" | "));
    check("Lettore: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 6. sincronizzazione (file nel cloud, qui simulato) e passaggio con i QR */
  {
    let FILE = "";
    const dev = async () => {
      const ctx = await browser.newContext(); const p = await ctx.newPage(); p.errs = []; p.on("pageerror", (e) => p.errs.push(e.message));
      await p.exposeFunction("__rd", () => FILE); await p.exposeFunction("__wr", (t) => { FILE = t; });
      await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); localStorage.setItem("md-sync", '{"kind":"test","name":"x"}'); }); await p.reload();
      await p.waitForFunction(() => window.CP && CP.sync);
      await p.evaluate(() => { CP.sync._P.test = { ok: () => Promise.resolve(true), read: () => window.__rd(), write: (c, t) => window.__wr(t) }; });
      p.ctx = ctx; return p;
    };
    const A = await dev(), B = await dev();
    const study = (p, from, n, xp) => p.evaluate(([from, n, xp]) => { const S = CP.S(); CP.ORDER.slice(from, from + n).forEach((k, i) => { S[k] = { n: 1, lr: Date.now() + i, st: 2, sd: 2, df: 5, due: Date.now() + 86400000 }; }); CP.save(); CP.game.xp(xp); return Store.flush(); }, [from, n, xp]);
    const st = (p) => p.evaluate(() => ({ srs: Object.keys(JSON.parse(localStorage.getItem("cp-srs-v1") || "{}")).length, xp: JSON.parse(localStorage.getItem("cp-game-v1") || "{}").xp }));
    await study(A, 0, 50, 100); await A.evaluate(() => CP.sync.full());
    await study(B, 40, 30, 70); const rb = await B.evaluate(() => CP.sync.full()), sb = await st(B);
    check("Sincronizzazione: il secondo dispositivo riceve e unisce (parole 50 + 30 con 10 in comune, punti per dispositivo)", rb.changed && sb.srs === 70 && sb.xp === 170, JSON.stringify(sb));
    const ra = await A.evaluate(() => CP.sync.full()), sa = await st(A), again = await A.evaluate(() => CP.sync.full());
    check("Sincronizzazione: il primo dispositivo riceve; rifarla non cambia niente (nessun riavvio a vuoto)", ra.changed && sa.srs === 70 && sa.xp === 170 && !again.changed, JSON.stringify([sa, again]));
    /* QR: A prepara i codici come li mostra, li si legge con jsQR dal disegno, C li ricompone e li unisce */
    const fr = await A.evaluate(async () => {
      const bytes = await CP.qrTransfer.pack(), sid = CP.qrTransfer.crc32(bytes), s = CP.qr.b45enc(bytes), C = CP.qrTransfer.CHUNK, n = Math.ceil(s.length / C), out = [], cv = document.createElement("canvas");
      for (let i = 0; i < n; i++) { const q = CP.qr.encode("M1:" + sid + ":" + (i + 1) + "/" + n + ":" + s.slice(i * C, (i + 1) * C), "M"); CP.qr.draw(cv, q, 3); const img = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height), r = window.jsQR(img.data, cv.width, cv.height); out.push(r ? r.data : ""); }
      return out;
    });
    const C = await (await browser.newContext()).newPage(); await C.goto(base); await C.waitForFunction(() => window.CP && CP.qrTransfer);
    const rc = await C.evaluate(async (fr) => {
      const parts = {}; let sid = "", tot = 0;
      for (const t of fr) { const m = /^M1:([0-9A-F]{8}):(\d+)\/(\d+):(.*)$/.exec(t); if (!m) return "illeggibile"; sid = m[1]; tot = +m[3]; parts[m[2]] = m[4]; }
      let s = ""; for (let i = 1; i <= tot; i++) s += parts[i];
      const bytes = CP.qr.b45dec(s); if (CP.qrTransfer.crc32(bytes) !== sid) return "crc";
      await Store.importObj(await CP.qrTransfer.unpack(bytes), "merge");
      return Object.keys(JSON.parse(localStorage.getItem("cp-srs-v1") || "{}")).length;
    }, fr);
    check("Passaggio con i QR: " + fr.length + " codici scritti dall'app, letti e ricomposti sull'altro telefono", rc === 70, String(rc));
    check("Sincronizzazione e QR: nessun errore JavaScript", !A.errs.length && !B.errs.length, A.errs.concat(B.errs)[0]);
    await A.ctx.close(); await B.ctx.close(); await C.context().close();
  }
  /* 7. interfaccia in cinese: nessun testo dell'interfaccia rimasto in italiano. Regola: ogni testo latino visibile è
     pinyin, un nome proprio noto, oppure sta dentro un elemento lang="it" (contenuto di studio: traduzioni, titoli, lezioni). */
  {
    const ctx = await browser.newContext({ viewport: { width: 400, height: 900 }, permissions: ["microphone"] });
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); localStorage.setItem("cp-lang", "zh"); }); await p.reload();
    await p.waitForFunction(() => window.CP && CP.build);
    await p.evaluate(() => {
      const SYL = new Set(); CP.ORDER.forEach((k) => CP.syllables(CP.WORDS[k].py).forEach((x) => SYL.add(x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-zü]/g, ""))));
      const OK = new Set("eros zanchetta marco baroni notice third party notices playwright lgpl sa by md strumstick unlicense màndarínō mandarino licenze license claudio longhitano claude code anthropic iphone wikidict wikidata wikipedia dict data drive onedrive dropbox icloud jsqr cozmo apache pages public complete vocabulary javascript hsk xp fsrs pwa github chrome google wechat whatsapp email json cloudflare google pinyin android https http apk wifi sim qr ok mb kb app arphic mit makemeahanzi kishore shaunak zafirópulos yanis drkameleon py open spaced repetition cc cedict mdbg morph bologna hunspell libreoffice license kaitim ukai gb pl skishore com org".split(" "));
      const isPy = (w) => { w = w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ü/g, "u").replace(/'/g, ""); if (SYL.has(w)) return true;
        const ok = [true]; for (let i = 1; i <= w.length; i++) { ok[i] = false; for (let j = Math.max(0, i - 6); j < i; j++) if (ok[j] && SYL.has(w.slice(j, i))) { ok[i] = true; break; } } return ok[w.length]; };
      window.__leaks = function () {
        const out = [], tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
        while ((n = tw.nextNode())) {
          const s = n.nodeValue.replace(/\s+/g, " ").trim(); if (!s) continue;
          const el = n.parentElement; if (!el || el.closest("script,style,[hidden],.lp,.tp,.py,.bp,.sp,.xp,.cd-py,.g-py,kbd,code,pre,[data-noi18n]") || !el.getClientRects().length) continue;
          const l = el.closest("[lang]"); if (l && /^(it|en)/.test(l.getAttribute("lang"))) continue;
          if ((s.match(/[A-Za-zÀ-ÿĀ-ž']{3,}/g) || []).some((w) => !OK.has(w.toLowerCase()) && !isPy(w))) out.push(s.slice(0, 70));
        }
        return [...new Set(out)];
      };
    });
    const areas = [
      ["Percorso", () => document.getElementById("tab-path").click()],
      ["Parole", () => document.getElementById("tab-words").click()],
      ["Studia", () => document.getElementById("tab-study").click()],
      ["Esercizi", () => { document.getElementById("tab-build").click(); CP.build.setSub("ex"); }],
      ["Laboratorio", () => CP.build.labLoad(CP.segment("我是学生").map((x) => x.w.key), ".")],
      ["Slot", () => CP.build.setSlot()],
      ["Modelli", () => CP.build.setSub("pat")],
      ["Lezione", () => CP.build.openLesson(CP.lessons.list()[0].id)],
      ["Esercizi della lezione", () => document.querySelector("[data-ls-quiz]").click()],
      ["Dialogo", () => { CP.immerse.leave(); CP.build.setSub("dlg"); document.querySelector("[data-dlg]").click(); }],
      ["Pensiero", () => CP.build.setSub("thought")],
      ["Lettore", () => CP.build.setSub("reader")],
      ["Impostazioni", () => document.getElementById("settings-btn").click()],
      ["Cerca ovunque", () => { CP.closeSheet(); document.getElementById("settings").hidden = true; CP.finder(); }],
      ["Scheda della parola", () => { CP.closeSheet(); CP.openFamily("好"); }],
      ["Contributi", () => { CP.closeSheet(); CP.contribOpen({ op: "tr", target: "你好", old: "ciao" }); }],
      ["Crediti", () => { CP.closeSheet(); CP.credits(); }],
      ["Guida", () => { CP.closeSheet(); CP.guide.open(); }],
      ["Orecchio", () => { CP.guide.close(); document.getElementById("tab-study").click(); CP.mode.ear(); }],
      ["Pannello Parla", () => { const h = document.createElement("div"); document.getElementById("study-root").appendChild(h); CP.voicePanel(h, "你好", { auto: false }); }]
    ];
    const bad = [];
    for (const [name, fn] of areas) {
      try { await p.evaluate(fn); } catch (e) { bad.push(name + ": " + e.message.split("\n")[0]); continue; }
      await p.waitForTimeout(120);
      const L = await p.evaluate(() => window.__leaks());
      if (L.length) bad.push(name + ": " + L.slice(0, 3).join(" | "));
    }
    check("Interfaccia in cinese: nessun testo rimasto in italiano in " + areas.length + " schermate", !bad.length, bad.slice(0, 4).join(" ‖ "));
    check("Interfaccia in cinese: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
} finally {
  await browser.close(); server.close();
}
const ko = results.filter((r) => !r.ok);
console.log("\n" + (results.length - ko.length) + "/" + results.length + " prove superate.");
process.exit(ko.length ? 1 : 0);
