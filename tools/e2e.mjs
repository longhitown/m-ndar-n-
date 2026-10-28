#!/usr/bin/env node
/* màndarínō · prove end-to-end in Chromium (Playwright).
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
import { pathToFileURL, fileURLToPath as fileURLToPathSafe } from "url";

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
/* le prove scritte prima del motore degli esercizi descrivono il ripasso «Classico»: ogni contesto parte da lì,
   a meno che la prova scelga un altro stile (il suo addInitScript viene dopo e lo sovrascrive) */
{ const nc = browser.newContext.bind(browser); browser.newContext = async (o) => { const c = await nc(o); await c.addInitScript(() => { try { if (!localStorage.getItem("cp-ex-style")) localStorage.setItem("cp-ex-style", "classic"); } catch (e) {} }); return c; }; }
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
  /* 4c. benvenuto, test di livello, rivelazione progressiva */
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
      await p.evaluate(() => CP.go("frasi")); await p.waitForFunction(() => !document.getElementById("view-path").hidden && document.getElementById("view-build").hidden, null, { timeout: 4000 }).catch(() => {});
      const g1 = await p.evaluate(() => ({ path: !document.getElementById("view-path").hidden, build: !document.getElementById("view-build").hidden, cls: document.body.className, errs: 0 }));
      check("?go=frasi con Frasi ancora chiusa porta alla scheda aperta più vicina, senza errori", g1.path && !g1.build, JSON.stringify(g1));
      await p.evaluate(() => CP.unlock.peek("build", () => CP.build.openLesson(CP.lessons.list()[0].id), "Frasi")); await p.waitForTimeout(250);
      check("Lezione dal Percorso con Frasi chiusa: si apre in immersione, senza la scheda Frasi", await p.evaluate(() => document.body.classList.contains("in-focus") && getComputedStyle(document.querySelector("nav.dock")).display === "none" && document.getElementById("tab-build").hidden));
      await p.keyboard.press("Escape"); await p.waitForFunction(() => !document.body.classList.contains("in-focus") && !document.getElementById("view-path").hidden, null, { timeout: 4000 }).catch(() => {});
      const g2 = await p.evaluate(() => ({ focus: document.body.classList.contains("in-focus"), path: !document.getElementById("view-path").hidden, cls: document.body.className }));
      check("…e all'uscita si torna al Percorso", !g2.focus && g2.path, JSON.stringify(g2));
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
  /* 4d. sostegno e sigilli di gratitudine: chiavi usa-e-getta, nessuna richiesta di rete */
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
    await p.evaluate(() => { CP.closeSheet(); CP.openSettings("info"); }); await p.waitForTimeout(200);
    const news = await p.evaluate(() => { const d = document.getElementById("set-news"); if (!d) return null; d.open = true; const v = d.querySelector(".news-v[open] b"); return { v: v && v.textContent, top: CHANGELOG[0].v, n: d.querySelectorAll(".news-v[open] li").length, lang: d.querySelector(".news-list").getAttribute("lang") }; });
    check("Novità: in ⚙️ → Informazioni, l'ultima versione aperta", news && news.v === news.top && news.n > 2 && news.lang === "it", JSON.stringify(news));
    await p.click("#set-about [data-credits]").catch(() => p.evaluate(() => CP.credits())); await p.waitForTimeout(150);
    check("Crediti: la parte «Chi ha contribuito» c'è anche quando l'elenco è vuoto", await p.evaluate(() => /Chi ha contribuito/.test(document.getElementById("fam").textContent)));
    await p.evaluate(() => { localStorage.setItem("cp-lang", "zh"); }); await p.reload(); await p.waitForTimeout(500);
    await p.evaluate(() => CP.openSettings("info")); await p.waitForTimeout(200);
    const zh = await p.evaluate(() => { const d = document.getElementById("set-news"); return d && d.querySelector(".set-h").textContent + "|" + d.querySelector(".news-list").getAttribute("lang"); });
    check("Novità in cinese: titolo e righe in cinese", /更新内容/.test(zh || "") && /zh-CN$/.test(zh || ""), zh);
    const pv = await p.evaluate(() => { const d = document.getElementById("set-privacy"); return d ? d.closest("[data-set-page=info]") && d.querySelector(".set-h").textContent + "|" + d.querySelectorAll("li").length : ""; });
    check("Privacy: voce in ⚙️ → Informazioni, in cinese, otto punti (anche il backup di Android e le sfide)", /隐私\|8$/.test(pv || ""), pv);
    check("Contributi e Novità: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4c. Pleco: solo su telefono, spento di base, doppia conferma; sotto i 2 s niente cambia, a 2 s compare «Apri in Pleco»,
     si esce solo toccandolo (dopo la pagina con il logo); la parola intera; nel menu «⋯» della carta; niente sul computer */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); });
    await p.goto(base); await p.waitForTimeout(500);
    await p.evaluate(() => CP.openSettings("set-pleco")); await p.waitForTimeout(150);
    const offOk = await p.evaluate(() => !CP.pleco.on() && !!document.getElementById("set-pleco") && CP.pleco.available());
    await p.click("#opt-pleco"); await p.waitForSelector("[data-pleco-ok1]");
    const notYet = await p.evaluate(() => !CP.pleco.on());
    await p.click("[data-pleco-ok1]"); await p.waitForSelector("[data-pleco-ok2]"); await p.click("[data-pleco-ok2]"); await p.waitForTimeout(200);
    check("Pleco: c'è sul telefono, spento di base, si accende solo dopo due conferme", offOk && notYet && await p.evaluate(() => CP.pleco.on() && localStorage.getItem("cp-pleco-v1") === "1"));
    await p.evaluate(() => { CP.closeSheet(); const se = document.getElementById("settings"); if (se && !se.hidden) CP.untrap(se); window.__pl = []; window.__open = CP.pleco.open; CP.pleco.open = (q) => { window.__pl.push(q); return true; }; CP.show("words", true, true); }); await p.waitForTimeout(300);
    /* una parola di almeno due caratteri in una riga di Parole */
    const box = await p.evaluate(() => { const el = [...document.querySelectorAll("#view-words .m-hz > span")].find((x) => x.getClientRects().length && CP.charTarget(x) && x.closest(".m-hz").textContent.trim().length >= 2); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: el.closest(".m-hz").textContent.trim() }; });
    const press = async (ms) => { await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up(); await p.waitForTimeout(150); };
    if (box) await press(700);
    const short = await p.evaluate(() => ({ chip: !!document.querySelector(".pl-chip"), fam: !document.getElementById("fam").hidden }));
    await p.evaluate(() => CP.closeSheet()); await p.waitForTimeout(100);
    if (box) await press(2300);
    const chip = await p.evaluate(() => { const b = document.querySelector(".pl-chip [data-pleco]"); return b ? b.getAttribute("data-pleco") : null; });
    const opened0 = await p.evaluate(() => window.__pl.length);
    if (chip) { await p.click(".pl-chip [data-pleco]"); await p.waitForTimeout(100); }
    const opened = await p.evaluate(() => window.__pl.join());
    check("Pleco: sotto i 2 s solo il foglio del carattere; a 2 s compare «Apri in Pleco» con la parola intera; si apre solo toccandolo", !!box && !short.chip && short.fam && chip === box.w && opened0 === 0 && opened === box.w, JSON.stringify({ box, short, chip, opened }));
    const row = await p.evaluate(() => ({ ok: /data-pleco="你好"/.test(CP.plecoRow("你好")), latin: CP.plecoRow("ciao"), long: CP.pleco.valid("一二三四五六七八九十一二三四五六七") }));
    check("Pleco: riga nel menu «⋯» della carta; solo caratteri cinesi, al massimo 16", row.ok && row.latin === "" && row.long === "", JSON.stringify(row));
    /* la pagina d'uscita con logo e wordmark, prima di lasciare l'app */
    const skel = await p.evaluate(() => { CP.pleco.open = window.__open; history.replaceState(null, "", location.href); const before = location.href; CP.pleco.open("你好"); const s = document.querySelector(".pl-skel"); return { s: !!s && /màndarínō/.test(s.textContent) && !!s.querySelector("use"), before }; });
    check("Pleco: prima di uscire, la pagina con il logo e il wordmark", skel.s, JSON.stringify(skel));
    check("Pleco: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
    /* sul computer l'opzione non c'è, anche se la preferenza è accesa */
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const p2 = await c2.newPage();
    await c2.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); localStorage.setItem("cp-pleco-v1", "1"); });
    await p2.goto(base); await p2.waitForTimeout(400); await p2.evaluate(() => CP.openSettings("grp-adv")); await p2.waitForTimeout(150);
    check("Pleco: sul computer niente opzione né pulsante", await p2.evaluate(() => !CP.pleco.available() && !CP.pleco.on() && !document.getElementById("set-pleco") && CP.plecoRow("你好") === ""));
    await c2.close();
  }
  /* 4d. Anki: solo per chi ha studiato molto, due conferme, file a tabulazioni con guid stabili */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); });
    await p.goto(base); await p.waitForTimeout(500);
    const hidden = await p.evaluate(() => { CP.openSettings("grp-data"); const h = !document.getElementById("set-export"); CP.untrap(document.getElementById("settings")); return h; });
    const a = await p.evaluate(() => {
      CP.grade("你", 3, false, { ms: 900, type: "pi" }); CP.grade("银行", 3, false, { ms: 900, type: "pi" });
      const mine = CP.anki.build({ which: "mine" }), all = CP.anki.build({ which: "all" }), sec = CP.anki.build({ which: "sec", sec: CP.WORDS["银行"].sec });
      const lines = all.text.split("\n"), rows = lines.filter((l) => l && l[0] !== "#"), g = rows.map((l) => l.split("\t")[0]), bank = rows.find((l) => l.split("\t")[1] === "银行") || "";
      return { mine: mine.n, all: all.n, sec: sec.n, secOk: sec.text.split("\n").filter((l) => l && l[0] !== "#").every((l) => / tappa::luoghi /.test(l)), words: CP.ORDER.length, uniq: new Set(g).size,
        head: lines.slice(0, 4).join("|"), comment: /^# màndarínō 6\.\d+ · contenuti CC BY 4\.0/.test(lines[6]), cols: rows.every((l) => l.split("\t").length === 7), stable: CP.anki.guid("zh", "银行") === bank.split("\t")[0], bank };
    });
    check("Anki: guid unici e stabili, 7 colonne, intestazioni e commento, pinyin senza punti, tag di livello, tappa e stato", a.mine === 2 && a.all === a.words && a.uniq === a.all && a.cols && a.stable && a.comment && a.sec > 2 && a.secOk &&
      a.head === "#separator:tab|#html:true|#guid column:1|#tags column:7" && /\tyínháng\t/.test(a.bank) && /\tmandarino hsk2 tappa::luoghi (sicura|in-corso)$/.test(a.bank), JSON.stringify(a).slice(0, 400));
    /* sopra la soglia la voce compare; due conferme prima di salvare */
    await p.evaluate(() => { const S = CP.S(); Object.keys(S).forEach((k) => {}); localStorage.setItem("cp-srs-v1", JSON.stringify(Object.assign(JSON.parse(localStorage.getItem("cp-srs-v1") || "{}"), Object.fromEntries(CP.ORDER.slice(0, 450).map((k) => [k, { n: 1, sd: 2, st: 1, df: 5, lr: Date.now(), d: Date.now() + 864e5 }]))))); });
    await p.reload(); await p.waitForTimeout(500);
    await p.evaluate(() => { window.__dl = null; Store.download = (n, t, m) => { window.__dl = { n, m, len: t.length }; return Promise.resolve(); }; CP.openSettings("set-export"); }); await p.waitForTimeout(150);
    const shown = await p.evaluate(() => !!document.getElementById("set-export") && CP.anki.allowed());
    await p.click("[data-anki-go]"); await p.waitForSelector("[data-anki-ok1]"); const before = await p.evaluate(() => window.__dl);
    await p.click("[data-anki-ok1]"); await p.waitForSelector("[data-anki-ok2]"); await p.click("[data-anki-ok2]"); await p.waitForTimeout(200);
    const dl = await p.evaluate(() => window.__dl);
    check("Anki: nascosto sotto la soglia (" + 400 + "), poi in ⚙️ → Dati e sincronizzazione → Altre opzioni di esportazione, salva solo dopo due conferme (.txt, text/tab-separated-values)", hidden && shown && !before && dl && /^mandarino-anki-mine-\d{8}\.txt$/.test(dl.n) && dl.m === "text/tab-separated-values", JSON.stringify({ hidden, shown, dl }));
    check("Anki: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4e. ritorno quotidiano: giorno di riposo, gradi oltre i 10.000 punti, racconto dei progressi */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); });
    await p.goto(base); await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
      const day = { w: ["x"], s: 0, e: 0 }, mk = (offs) => Object.fromEntries(offs.map((o) => [k(o), day]));
      CP.game.load({ base: 0, xpBy: {}, goal: 10, days: mk([0, 2, 3, 4, 5]), best: 0 }); const a = CP.game.streak(), restA = Object.keys(CP.game.rest());
      CP.game.load({ base: 0, xpBy: {}, goal: 10, days: mk([0, 3, 4, 5]), best: 0 }); const b = CP.game.streak();
      CP.game.load({ base: 45000, xpBy: {}, goal: 10, days: {}, best: 0 }); const r1 = CP.game.rank();
      CP.game.load({ base: 55000, xpBy: {}, goal: 10, days: {}, best: 0 }); const r2 = CP.game.rank();
      CP.game.load({ base: 16000, xpBy: {}, goal: 10, days: {}, best: 0 }); const r3 = CP.game.rank();
      return { a, restA, yest: k(1), b, r1: [r1.name, r1.next, r1.season], r2: [r2.name, r2.next, r2.pct], r3: [r3.name, r3.next] };
    });
    check("Giorno di riposo: un giorno saltato non spezza la serie (5 giorni), due di fila sì (1)", r.a === 5 && r.restA.join() === r.yest && r.b === 1, JSON.stringify(r));
    check("Gradi oltre i 10.000 punti, poi stagioni ogni 10.000", r.r3[0] === "Calligrafo d'Inchiostro" && r.r3[1] === 22000 && r.r1[0] === "Maestro dei Quattro Mari" && r.r1[1] === 50000 && r.r2[0] === "Maestro dei Quattro Mari · stagione 2" && r.r2[1] === 60000 && r.r2[2] === 50, JSON.stringify(r));
    await p.evaluate(() => { CP.game.load({ base: 0, xpBy: {}, goal: 10, days: {}, best: 0 }); CP.grade("你", 3, false, { ms: 900, type: "pi" }); CP.show("study", true, true); }); await p.waitForTimeout(700);
    const st = await p.evaluate(() => { const s = document.getElementById("st-story"); return s && !s.closest("details") ? { sum: (s.querySelector(".st-sum") || {}).textContent, cols: s.querySelectorAll(".st-col").length } : null; });
    check("Progressi in evidenza in Studia: riepilogo della settimana e sei settimane", st && st.cols === 6 && /settimana/.test(st.sum || ""), JSON.stringify(st));
    check("Ritorno quotidiano: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4f. anatomia del carattere: foglio del carattere, componenti cliccabili, interruttore, lavagna */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); });
    await p.goto(base); await p.waitForTimeout(600);
    await p.evaluate(() => CP.openFamily("请")); await p.waitForTimeout(300);
    const a = await p.evaluate(() => { const s = document.querySelector("#fam .anat"); return s ? { parts: [...s.querySelectorAll(".anat-part .anat-ch")].map((x) => x.textContent).join(""), roles: [...s.querySelectorAll(".anat-role")].map((x) => x.textContent).join(","), svg: s.querySelectorAll(".anat-svg polyline").length, txt: s.textContent } : null; });
    check("Anatomia: 请 si smonta in 讠 (significato) e 青 (suono), disegnato in SVG tratto per tratto", a && a.parts === "讠青" && a.roles === "significato,suono" && a.svg === 10 && /fonetico-semantico/.test(a.txt), JSON.stringify(a));
    await p.click('#fam [data-anat="青"]'); await p.waitForTimeout(300);
    const fam = await p.evaluate(() => ({ big: (document.querySelector("#fam .fam-head .big") || {}).textContent, others: document.querySelectorAll("#fam .fw").length }));
    check("Anatomia: un componente apre le altre parole che lo contengono (foglio della famiglia)", fam.big === "青" && fam.others > 2, JSON.stringify(fam));
    await p.evaluate(() => { CP.closeSheet(); CP.anatomy.set(false); CP.openFamily("好"); }); await p.waitForTimeout(200);
    check("Anatomia: si spegne in ⚙️ (e non c'è sul fronte della carta di studio)", await p.evaluate(() => !document.querySelector("#fam .anat") && !document.querySelector(".fc .anat")));
    await p.evaluate(() => { CP.closeSheet(); CP.anatomy.set(true); });
    check("Anatomia: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4g. sfida a un amico e pacchetto classe: stesso codice → stesse domande su due «telefoni», QR leggibile,
     link che si apre e si toglie dall'indirizzo, pacchetto importato con riquadro nel Percorso, riepilogo solo con consenso */
  {
    const mk = async (init) => { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); await ctx.addInitScript(init || (() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); })); return { ctx, p, errs }; };
    const A = await mk(); await A.p.goto(base); await A.p.waitForTimeout(600);
    check("Sfida: i moduli si caricano solo al primo uso (non all'avvio)", await A.p.evaluate(() => !!document.getElementById("lazy-mod-challenge")));
    await A.p.click("#path-root [data-chal-open]"); await A.p.waitForSelector("#fam .chal-qr", { timeout: 4000 }).catch(() => {});
    const made = await A.p.evaluate(() => { const v = (document.querySelector("#fam .chal-code") || {}).value || "", c = CP.challenge.decode(v), cv = document.querySelector("#fam .chal-qr"), img = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height), q = window.jsQR(img.data, cv.width, cv.height); return { v, n: c && c.keys.length, c: c && c.c, qr: q && q.data, Q: c && CP.challenge.build(c).map((x) => [x.x.q, x.opts.join("|")]) }; });
    check("Sfida: 10 parole in un link …#sfida=MDC1-…, e il QR (letto con jsQR) contiene esattamente quel link", made.n === 10 && made.c === "zh" && /^http:\/\/127\.0\.0\.1:\d+\/#sfida=MDC1-[A-Za-z0-9_-]+$/.test(made.v) && made.qr === made.v, JSON.stringify(made).slice(0, 300));
    const B = await mk(); await B.p.goto(made.v); await B.p.waitForTimeout(1600);
    const recv = await B.p.evaluate(() => ({ hash: location.hash, intro: !!document.querySelector("#fam [data-chal-start]"), welcome: !!document.querySelector("#onb:not([hidden])") }));
    check("Sfida: il link apre la sfida sul secondo telefono e il codice sparisce dall'indirizzo", recv.hash === "" && recv.intro && !recv.welcome, JSON.stringify(recv));
    await B.p.click("#fam [data-chal-start]"); await B.p.waitForTimeout(150);
    const q1 = await B.p.evaluate(() => [document.querySelector("#fam .chal-q").textContent, [...document.querySelectorAll("#fam [data-chal-a]")].map((b) => b.textContent).join("|")]);
    check("Sfida: stesse domande e stesse risposte da scegliere, nello stesso ordine, sui due telefoni", q1[0] === made.Q[0][0] && q1[1] === made.Q[0][1], JSON.stringify([q1, made.Q[0]]));
    for (let i = 0; i < 10; i++) {
      await B.p.evaluate((Q) => { const st = CP.challenge.state(), want = CP.challenge.build(CP.challenge.decode(Q)); const r = want[st.i]; const b = [...document.querySelectorAll("#fam [data-chal-a]")].find((x) => x.textContent === r.x.a); (st.i === 9 ? document.querySelectorAll("#fam [data-chal-a]")[[...document.querySelectorAll("#fam [data-chal-a]")].indexOf(b) === 0 ? 1 : 0] : b).click(); }, made.v);
      await B.p.waitForTimeout(i === 9 ? 2000 : 1000);
    }
    const res = await B.p.evaluate(() => ({ txt: (document.querySelector("#fam .chal-res") || {}).textContent || "", wrong: document.querySelectorAll("#fam .chal-wrong li").length, again: !!document.querySelector("#fam [data-chal-send]") }));
    check("Sfida: risultato (9 su 10), la parola sbagliata da ripassare e «Rilancia la sfida»", /^9 su 10 in \d+ s/.test(res.txt) && res.wrong === 1 && res.again, JSON.stringify(res));
    const other = await B.p.evaluate(() => { CP.closeSheet(); CP.togetherOpen(CP.challenge.encode({ c: "it", seed: 7, keys: ["n:书", "n:茶", "n:猫", "n:狗"] })); return !!document.querySelector("#fam [data-chal-switch=it]"); });
    check("Sfida: un codice dell'altro corso propone di passare a quel corso", other);
    check("Sfida: un codice rovinato non apre niente", await B.p.evaluate(() => CP.challenge.decode("MDC1-xx") === null && CP.challenge.decode("ciao") === null));
    /* pacchetto classe */
    const pk = await A.p.evaluate(() => { const p = { id: "abc12", c: "zh", t: "Classe 2B", s: CP.SEC[0].id, e: CP.SEC[1].id, g: 80, d: "2030-01-15" }; return { link: CP.classroom.link(p), p }; });
    await B.p.evaluate((l) => { CP.closeSheet(); CP.togetherOpen(l); }, pk.link); await B.p.waitForTimeout(700);
    const st = await B.p.evaluate(() => { const o = JSON.parse(localStorage.getItem("cp-class-v1")); return { ids: Object.keys(o.p), card: !!document.querySelector("#set-together .cls-card"), banner: (document.querySelector("#path-root .cls-banner") || {}).textContent || "" }; });
    check("Classe: il pacchetto si importa dal codice (cp-class-v1) e si vede in ⚙️", st.ids.join() === "abc12" && st.card, JSON.stringify(st));
    await B.p.evaluate(() => { CP.untrap(document.getElementById("settings")); CP.pathDirty(); CP.onPath(); }); await B.p.waitForTimeout(200);
    check("Classe: riquadro in cima al Percorso con titolo e avanzamento", /Classe: Classe 2B/.test(await B.p.evaluate(() => (document.querySelector("#path-root .cls-banner") || {}).textContent || "")));
    await B.p.evaluate(() => CP.openSettings("set-together")); await B.p.click("#set-together [data-cls-report]"); await B.p.waitForTimeout(200);
    const dis = await B.p.evaluate(() => [...document.querySelectorAll("#fam [data-cls-rep-dl], #fam [data-cls-rep-share]")].map((b) => b.disabled));
    await B.p.check("#cls-consent");
    const en = await B.p.evaluate(() => [...document.querySelectorAll("#fam [data-cls-rep-dl], #fam [data-cls-rep-share]")].map((b) => b.disabled));
    check("Classe: il riepilogo si consegna solo dopo la spunta del consenso", dis.join() === "true,true" && en.join() === "false,false", JSON.stringify([dis, en]));
    const rep = await B.p.evaluate(() => { const p = CP.classroom.list()[0], r = CP.classroom.report(p, "Ada"); return { keys: Object.keys(r).sort().join(","), n: r.n }; });
    check("Classe: nel riepilogo solo conteggi (nessun registro dei ripassi)", rep.keys === "app,date,days30,done,kind,met,n,name,pct,pkg,v,version" && rep.n > 10, JSON.stringify(rep));
    const tb = await B.p.evaluate(() => { const p = CP.classroom.list()[0]; CP.classroom.table([CP.classroom.report(p, "Bo"), CP.classroom.report(p, "Ada")]); return [...document.querySelectorAll("#fam .cls-table tbody tr td:first-child")].map((x) => x.textContent).join(","); });
    check("Classe: chi insegna legge i riepiloghi in una tabella", tb === "Ada,Bo", tb);
    const sh = await A.p.evaluate((p) => { const cv = CP.classroom.sheet(document.createElement("canvas"), p), x = cv.getContext("2d"), img = x.getImageData(640, 380, 600, 700), q = window.jsQR(img.data, 600, 700); return { w: cv.width, h: cv.height, q: q && q.data }; }, pk.p);
    check("Classe: foglio da stampare A4 con il QR del pacchetto (letto con jsQR)", sh.w === 1240 && sh.h === 1754 && sh.q === pk.link, JSON.stringify(sh));
    check("Sfida e classe: nessun errore JavaScript", !A.errs.length && !B.errs.length, A.errs[0] || B.errs[0]);
    await A.ctx.close(); await B.ctx.close();
    /* corso di italiano: la domanda è la parola italiana, le risposte sono in caratteri */
    const I = await mk(() => { localStorage.setItem("cp-course", "it"); localStorage.setItem("cp-lang", "zh"); localStorage.setItem("cp-it-welcome", "1"); localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); });
    await I.p.goto(base); await I.p.waitForTimeout(800);
    const it = await I.p.evaluate(() => { CP.challenge.create(); const c = CP.challenge.decode(document.querySelector("#fam .chal-code").value), Q = CP.challenge.build(c); return { c: c.c, n: c.keys.length, q: Q[0].x.q, a: Q[0].opts }; });
    check("Sfida, corso di italiano: parola italiana → caratteri", it.c === "it" && it.n === 10 && !/[\u4e00-\u9fff]/.test(it.q) && it.a.every((x) => /[一-鿿]/.test(x)), JSON.stringify(it));
    check("Sfida, corso di italiano: nessun errore JavaScript", !I.errs.length, I.errs[0]);
    await I.ctx.close();
  }
  /* 4h. golden: con lo stile «Classico» la sessione di ripasso è identica alla copia fissa di study.js di prima
     ora (tools/fixtures/study-classic-v1.js): stessa coda, stesse carte pi / ip / hp, stessi voti. Profilo e seme fissi. */
  {
    const init = () => {
      const now = Date.now(), S = {};
      ["你好", "谢谢", "再见", "早上好", "晚上好", "晚安", "对不起", "没关系", "请", "不客气", "欢迎", "朋友"].forEach((k, i) => { S[k] = { n: 3, d: now - 86400000 * (1 + i), b: i % 4 }; });
      localStorage.setItem("cp-srs-v1", JSON.stringify(S)); localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}');
      localStorage.setItem("cp-study-cfg", '{"n":3,"sec":""}'); localStorage.setItem("cp-ex-style", "classic");
      window.__seed = (n) => { let s = n >>> 0; Math.random = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; }; };
    };
    const run = async (fixture) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
      await ctx.addInitScript(init); await p.goto(base); await p.waitForTimeout(700);
      if (fixture) await p.evaluate((code) => { const r = document.getElementById("study-root"); r.replaceWith(r.cloneNode(false)); (0, eval)(code); }, fs.readFileSync(path.join(path.dirname(fileURLToPathSafe(import.meta.url)), "fixtures/study-classic-v1.js"), "utf8"));
      const seq = await p.evaluate(() => {
        __seed(20261027); CP.show("study", true); CP.studyStart();
        const out = [], root = document.getElementById("study-root"), clean = (h) => h.replace(/ enter"/g, '"');
        for (let i = 0; i < 40; i++) {
          out.push(clean(root.innerHTML));
          const b = root.querySelector("#next") || root.querySelector("#reveal") || root.querySelector('[data-g="' + (i % 7 === 3 ? 0 : i % 5 === 1 ? 1 : 2) + '"]');
          if (!b) break; b.click();
        }
        return out;
      });
      await ctx.close(); return { seq, errs };
    };
    const now = await run(false), old = await run(true);
    const firstDiff = now.seq.findIndex((h, i) => h !== old.seq[i]);
    check("Golden «Classico»: la sessione di ripasso è identica a quella di prima ora (" + now.seq.length + " schermate)", now.seq.length > 20 && now.seq.length === old.seq.length && firstDiff < 0, firstDiff >= 0 ? "schermata " + firstDiff + ": " + now.seq[firstDiff].slice(0, 200) + " ≠ " + (old.seq[firstDiff] || "").slice(0, 200) : "");
    const tags = await (async () => { const all = now.seq.join(""); return ["Che cosa significa?", "Come si dice?", "Leggi il carattere", 'class="grades"'].map((x) => all.includes(x)); })();
    check("Golden «Classico»: nella sessione ci sono le tre carte (pi, ip, hp) e i quattro voti", tags.every(Boolean), JSON.stringify(tags));
    check("Golden «Classico»: nessun errore JavaScript", !now.errs.length && !old.errs.length, now.errs[0] || old.errs[0]);
  }
  /* 4i. motore degli esercizi: stile Misto, ogni tipo di scelta multipla e il tono, tasti 1-4, «Non ero
     sicuro», errore che torna a +3 e +8 con un altro tipo, statistiche in cp-ex-v1, intervalli FSRS identici al Classico */
  {
    const prof = (style) => { const now = Date.now(), S = {}; ["妈", "马", "你好", "谢谢", "再见", "早上好", "晚上好", "晚安", "对不起", "没关系"].forEach((k, i) => { S[k] = { n: 3, d: now - 86400000 * (1 + i), b: i % 4 }; }); localStorage.setItem("cp-srs-v1", JSON.stringify(S)); localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}'); localStorage.setItem("cp-study-cfg", '{"n":0,"sec":""}'); localStorage.setItem("cp-ex-style", style); };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(prof, "mixed"); await p.goto(base); await p.waitForTimeout(700);
    check("Esercizi: con lo stile Classico o prima di una sessione il motore non si carica", await p.evaluate(() => !CP.exEngine));
    const seen = {};
    for (const t of ["mc-significato", "mc-parola", "mc-pinyin", "mc-ascolto", "tono"]) {
      /* senza rispondere: si fa girare la coda finché il tipo vale per la parola in testa (il tono solo per 妈 e 马) */
      const r = await p.evaluate((t) => {
        CP.ex.carica(); CP.exEngine.hasVoice = () => true; CP.exEngine.force(t); CP.show("study", true); CP.studyStart(); const s = CP.studyKit.sess();
        for (let i = 0; i < s.q.length + 1; i++) {
          const c = document.querySelector("#study-root .ex-card"); if (c && c.dataset.ex === t) return { t: c.dataset.ex, k: c.dataset.k, n: document.querySelectorAll("[data-exa]").length };
          const e = s.q.shift(); e.item = e.exType = null; s.q.push(e); s.q[0].item = s.q[0].exType = null; CP.studyRefresh();
        }
        return null;
      }, t);
      const right = await p.evaluate(() => { const cur = CP.exEngine.current(); return cur ? cur.item.right : -1; });
      await p.keyboard.press(String(right + 1)); await p.waitForTimeout(80);
      const fb = await p.evaluate(() => ({ ok: !!document.querySelector(".ex-opt.ok .ex-mark"), verdict: (document.querySelector(".ex-verdict") || {}).textContent || "", cont: !!document.querySelector(".actbar [data-exc].btn-main"), primaries: document.querySelectorAll("#study-root .btn-main").length, unsure: !!document.querySelector("[data-exu]") }));
      seen[t] = r && r.t === t && r.n === 4 && fb.ok && /✓/.test(fb.verdict) && fb.cont && fb.primaries === 1 && fb.unsure;
      await p.keyboard.press("Enter"); await p.waitForTimeout(60);
      await p.evaluate(() => { CP.exEngine.force(null); CP.studyHome(); });
    }
    check("Esercizi: significato, parola, pinyin, ascolto e tono con quattro risposte, tasti 1-4, segno ✓ oltre al colore, un solo «Continua»", Object.values(seen).every(Boolean) && Object.keys(seen).length === 5, JSON.stringify(seen));
    /* «Non ero sicuro» = Difficile; un errore torna a +3 con un altro tipo e una copia a +8 */
    const flow = await p.evaluate(async () => {
      CP.exEngine.force("mc-significato"); CP.studyStart();
      const k0 = document.querySelector(".ex-card").dataset.k, cur = CP.exEngine.current(), wrong = (cur.item.right + 1) % 4;
      document.querySelectorAll("[data-exa]")[wrong].click(); document.querySelector("[data-exc]").click();
      CP.exEngine.force(null);
      const q = CP.studyKit.sess().q.map((e) => e.k + (e.bonus ? "+" : "") + ":" + (e.lastType || ""));
      const st = JSON.parse(localStorage.getItem("cp-ex-v1")).ex[k0]["mc-significato"];
      /* «Non ero sicuro» sulla carta che segue */
      const c2 = CP.exEngine.current(), k2 = document.querySelector(".ex-card").dataset.k;
      document.querySelectorAll("[data-exa]")[c2.item.right].click(); document.querySelector("[data-exu]").click();
      await new Promise((r) => setTimeout(r, 400));
      const log = (await Store.exportObj(true)).log; const last = log[log.length - 1], prev = log[log.length - 2];
      return { k0, q: q.slice(0, 9), st, last: [last[1], last[2], last[4]], prev: [prev[1], prev[2], prev[4]], k2 };
    });
    const i3 = flow.q.findIndex((x) => x.startsWith(flow.k0 + ":")), i8 = flow.q.findIndex((x) => x.startsWith(flow.k0 + "+:"));
    check("Esercizi: dopo un errore la parola torna a +3 (con un altro tipo) e una copia di rinforzo a +8", i3 === 3 && i8 === 8 && /:mc-significato$/.test(flow.q[i3]), JSON.stringify(flow.q));
    check("Esercizi: nel registro dei ripassi il tipo di esercizio; sbagliata = Di nuovo, «Non ero sicuro» = Difficile; statistiche in cp-ex-v1", flow.prev[0] === flow.k0 && flow.prev[1] === 1 && flow.prev[2] === "mc-significato" && flow.last[0] === flow.k2 && flow.last[1] === 2 && flow.st.n === 1 && flow.st.ok === 0, JSON.stringify(flow));
    /* intervalli FSRS: la stessa risposta «Bene» dà la stessa scheda nei due stili */
    /* la scadenza ha il «fuzz» casuale di FSRS (lo scheduler tiene il suo generatore): si confrontano stabilità, difficoltà, stato e ripetizioni */
    const fsrs = await p.evaluate(() => {
      const S = CP.S(), k = "晚安", before = JSON.stringify(S[k]); CP.grade(k, 2, false, { ms: 1000, type: "mc-pinyin" }); const a = S[k]; const r = { st: a.st, df: a.df, sd: a.sd, rp: a.rp }; S[k] = JSON.parse(before); CP.grade(k, 2, false, { ms: 1000, type: "pi" }); const b = S[k]; return [r, { st: b.st, df: b.df, sd: b.sd, rp: b.rp }]; });
    check("Esercizi: la scheda FSRS dopo un voto è identica a prima (stabilità, difficoltà, stato; il tipo finisce solo nel registro)", JSON.stringify(fsrs[0]) === JSON.stringify(fsrs[1]), JSON.stringify(fsrs));
    check("Esercizi: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4j. esercizi con le frasi: frase a buco, buco grammaticale, ordina, digitazione del pinyin e del significato,
     buco digitato, abbina, componente; voti della digitazione (senza toni = Difficile) */
  {
    const prof = (style) => { const now = Date.now(), S = {}; ["妈", "好", "你好", "谢谢", "我", "是", "学生", "老师", "朋友", "吃", "喝", "茶", "书", "请"].forEach((k, i) => { S[k] = { n: 9, d: now - 86400000 * (1 + i), b: 6 }; }); localStorage.setItem("cp-srs-v1", JSON.stringify(S)); localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}'); localStorage.setItem("cp-ex-style", style); };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(prof, "mixed"); await p.goto(base); await p.waitForTimeout(700);
    /* porta in testa una carta del tipo voluto, scorrendo la coda con risposte giuste */
    const open = (t) => p.evaluate((t) => {
      CP.ex.carica(); CP.exEngine.force(t); CP.show("study", true); CP.studyStart();
      const s = CP.studyKit.sess(); if (!s) return null;
      /* senza rispondere: si fa girare la coda finché il tipo voluto vale per la parola in testa */
      for (let i = 0; i < s.q.length + 1; i++) {
        const c = document.querySelector("#study-root .ex-card"); if (c && c.dataset.ex === t) return CP.exEngine.current().item;
        const e = s.q.shift(); e.item = e.exType = null; s.q.push(e); s.q[0].item = s.q[0].exType = null; CP.studyRefresh();
      }
      return null;
    }, t);
    const res = {};
    for (const t of ["buco", "buco-gram", "componente"]) {
      const it = await open(t);
      if (!it) { res[t] = "nessuna carta"; continue; }
      await p.keyboard.press(String(it.right + 1)); await p.waitForTimeout(60);
      res[t] = await p.evaluate(() => !!document.querySelector(".ex-opt.ok") && /✓/.test(document.querySelector(".ex-verdict").textContent) && (!document.querySelector(".ex-hole") || true));
      await p.evaluate(() => { CP.exEngine.force(null); CP.studyHome(); });
    }
    check("Esercizi con le frasi: frase a buco, buco grammaticale (con la nota) e componente si risolvono con 1-4", Object.values(res).every((x) => x === true), JSON.stringify(res));
    const hole = await p.evaluate(() => { const s = CP.exSent.forWord(CP.WORDS["学生"]); return { n: s.length, okSeg: s.every((x) => x.toks.some((t) => t.w && t.w.key === "学生")) }; });
    check("Frasi a buco: le frasi di una parola la contengono come parola (taglio dell'app)", hole.n > 0 && hole.okSeg, JSON.stringify(hole));
    /* ordina */
    let it = await open("ordina");
    const ord = it && await p.evaluate(() => { const it = CP.exEngine.current().item; it.tiles.forEach((t) => document.querySelector('[data-exo="' + t.id + '"]').click()); document.querySelector("[data-exo-check]").click(); return { ok: /✓/.test(document.querySelector(".ex-verdict").textContent), primaries: document.querySelectorAll("#study-root .btn-main").length }; });
    check("Esercizi con le frasi: rimetti in ordine la frase (tessere, «Controlla», poi un solo «Continua»)", ord && ord.ok && ord.primaries === 1, JSON.stringify(ord));
    await p.evaluate(() => { CP.exEngine.force(null); CP.studyHome(); });
    /* digitazione: pinyin con i numeri (esatto), senza toni (Difficile), significato con l'accento sbagliato (Difficile) */
    const typ = [];
    for (const [t, val] of [["scrivi-pinyin", (it) => it.answer.split(/[.\s']+/).map((s) => CP.typing.syllableInfo(s).plain + (CP.typing.syllableInfo(s).tone || 5)).join("")], ["scrivi-pinyin", (it) => it.answer.split(/[.\s']+/).map((s) => CP.typing.syllableInfo(s).plain).join(" ")], ["scrivi-significato", (it) => it.accept[0]], ["buco-scrivi", (it) => it.answer]]) {
      it = await open(t); if (!it) { typ.push(t + ": nessuna carta"); continue; }
      const attrs = await p.evaluate(() => { const i = document.querySelector("#ex-in"); return [i.getAttribute("autocapitalize"), i.getAttribute("autocorrect"), i.getAttribute("spellcheck"), !!document.querySelector("[data-ext='3']") || !!document.querySelector("#ex-in[lang=it]")].join(); });
      await p.fill("#ex-in", await p.evaluate(`(${val.toString()})(CP.exEngine.current().item)`)); await p.keyboard.press("Enter"); await p.waitForTimeout(60);
      const g = await p.evaluate(() => { const c = CP.exEngine.current(); return c.g; });
      typ.push(t + ":" + g + ":" + attrs);
      await p.evaluate(() => { CP.exEngine.force(null); CP.studyHome(); });
    }
    check("Digitazione: numeri dei toni = giusto, senza toni = Difficile con la spiegazione, campo senza correttore né maiuscole, tasti dei toni", /^scrivi-pinyin:[23]:off,off,false,true$/.test(typ[0]) && /^scrivi-pinyin:1:/.test(typ[1]) && /^scrivi-significato:[23]:/.test(typ[2]) && /^buco-scrivi:[23]:/.test(typ[3]), typ.join(" | "));
    /* abbina */
    it = await open("abbina");
    const mt = it && await p.evaluate(() => { const it = CP.exEngine.current().item; it.words.forEach((w, i) => { document.querySelector('[data-exm="l:' + i + '"]').click(); document.querySelector('[data-exm="r:' + i + '"]').click(); }); return { n: it.words.length, ok: /✓/.test(document.querySelector(".ex-verdict").textContent) }; });
    check("Esercizi con le frasi: abbina (almeno quattro coppie)", mt && mt.n >= 4 && mt.ok, JSON.stringify(mt));
    /* quiz delle lezioni: «buco» e «scrivi» (un quiz inventato, messo solo nella pagina) */
    const lq = await p.evaluate(async () => {
      CP.studyHome(); const L = CP.lessons.list()[0]; L.quiz = [{ k: "buco", zh: "我＿学生。", opts: ["在", "是"], a: 1 }, { k: "scrivi", py: true, a: "shì" }];
      CP.show("build", true); CP.build.openLesson(L.id); document.querySelector("[data-ls-quiz]").click();
      const hole = !!document.querySelector(".ls-opt"); document.querySelectorAll("[data-ls-opt]")[1].click(); const ok1 = !!document.querySelector(".verdict.ok"); document.querySelector("[data-ls-next]").click();
      const inp = document.getElementById("ls-in"); inp.value = "shi4"; document.querySelector("[data-ls-type]").click();
      return { hole, ok1, ok2: !!document.querySelector(".verdict.ok") };
    });
    check("Lezioni: i quiz accettano «buco» e «scrivi» (pinyin con i numeri dei toni)", lq.hole && lq.ok1 && lq.ok2, JSON.stringify(lq));
    /* un ripasso ogni cinque lezioni (domande prese dalle lezioni) e il mini-dialogo con l'audio */
    const rz = await p.evaluate(() => {
      CP.studyHome(); CP.show("build", true); CP.build.openLesson(CP.lessons.list()[0].id);
      const dl = document.querySelectorAll(".ls-dl").length, au = document.querySelectorAll(".ls-dl button").length;
      const nRev = CP.lessons.reviews().length, nList = CP.lessons.list().length;
      CP.build.openLesson("rip-1");
      const page = !!document.querySelector("[data-ls-quiz]") && /1–5/.test((document.querySelector(".ls-lesson h3") || {}).textContent || "") && !document.querySelector(".ls-ex");
      document.querySelector("[data-ls-quiz]").click();
      const play = !!document.querySelector(".ls-quiz .ls-prog") && !!document.querySelector(".ls-quiz .ask");
      return { dl, au, nRev, nList, page, play };
    });
    check("Lezioni: mini-dialogo con audio, un ripasso ogni cinque lezioni, le lezioni aggiuntive si caricano all'apertura dell'elenco, il ripasso si fa come un quiz", rz.dl >= 3 && rz.au >= rz.dl && rz.nRev === Math.floor(rz.nList / 5) && rz.nList >= 35 && rz.page && rz.play, JSON.stringify(rz));
    check("Esercizi con le frasi: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4k. percorso guidato: carta «Continua» con il passo successivo, impara + esercitati, verifica superata
     (tappa verificata, +20 una volta sola) e fallita (le cinque parti, «Rinforza»), «I tuoi errori» e mini-verifica nelle lezioni */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}'); localStorage.setItem("cp-ex-style", "guided"); });
    await p.goto(base); await p.waitForTimeout(700);
    /* risponde all'esercizio aperto: giusto (ok) o sbagliato */
    const answer = (ok) => p.evaluate((ok) => {
      const cur = CP.exEngine.current(); if (!cur) return "nessuno"; const it = cur.item;
      if (it.kind === "mc") document.querySelectorAll("[data-exa]")[ok ? it.right : (it.right + 1) % it.opts.length].click();
      else if (it.kind === "type") { document.getElementById("ex-in").value = ok ? (it.mode === "pinyin" ? it.answer : it.accept[0]) : "xyz"; document.querySelector("[data-ex-submit]").click(); }
      else if (it.kind === "order") { (ok ? it.tiles : it.tiles.slice().reverse()).forEach((t) => document.querySelector('[data-exo="' + t.id + '"]').click()); document.querySelector("[data-exo-check]").click(); }
      else if (it.kind === "match") { it.words.forEach((w, i) => { document.querySelector('[data-exm="l:' + i + '"]').click(); document.querySelector('[data-exm="r:' + (ok ? i : (i + 1) % it.words.length) + '"]').click(); if (!ok) document.querySelector('[data-exm="r:' + i + '"]').click(); }); }
      else if (it.kind === "trace") { return "trace"; }
      const c = document.querySelector("[data-exc]"); if (c) c.click(); return it.kind;
    }, ok);
    await p.evaluate(() => CP.show("path", true)); await p.waitForTimeout(200);
    const card = await p.evaluate(() => { const c = document.querySelector("#path-root .gd-card"); return c ? { go: c.querySelector("[data-gd-go]").textContent, dur: c.querySelectorAll("[data-gd-dur]").length, primaries: c.querySelectorAll(".btn-main").length } : null; });
    check("Guidato: la carta «Continua» dice il passo successivo (impara 5 parole nuove), con la durata 5/10/15 e un solo pulsante primario", card && /Impara 5 parole nuove/.test(card.go) && card.dur === 3 && card.primaries === 1, JSON.stringify(card));
    await p.click("#path-root [data-gd-go]"); await p.waitForTimeout(300);
    let kinds = [];
    for (let i = 0; i < 40; i++) {
      const st = await p.evaluate(() => { if (document.querySelector("#study-root #next")) { document.querySelector("#study-root #next").click(); return "intro"; } if (document.querySelector("#study-root .done")) return "done"; return document.querySelector("#study-root .ex-card") ? "ex" : "?"; });
      if (st === "done" || st === "?") { kinds.push(st); break; }
      if (st === "ex") { const k = await answer(true); kinds.push(k); if (k === "trace") await p.evaluate(() => { CP.exEngine.after({ ok: true, g: 2 }); document.querySelector("[data-exc]").click(); }); } else kinds.push(st);
      await p.waitForTimeout(30);
    }
    const u1 = await p.evaluate(() => JSON.parse(localStorage.getItem("cp-ex-v1") || "{}").units);
    check("Guidato: impara (5 carte nuove) ed esercitati (esercizi sulle stesse parole) fino alla fine della sessione", kinds.filter((x) => x === "intro").length === 5 && kinds.filter((x) => !["intro", "done", "?"].includes(x)).length >= 8 && kinds[kinds.length - 1] === "done" && u1 && u1.persone && u1.persone.passo >= 1, kinds.join(","));
    /* la tappa è quasi tutta avviata: il passo successivo è la verifica */
    await p.evaluate(() => { const S = CP.S(); CP.ORDER.filter((k) => CP.WORDS[k].sec === "persone").forEach((k) => { if (!S[k] || !S[k].n) CP.grade(k, 2, false, { ms: 1, type: "pi" }); }); CP.studyHome(); CP.show("path", true); });
    await p.waitForTimeout(200);
    const vgo = await p.evaluate(() => (document.querySelector("#path-root [data-gd-go]") || {}).textContent);
    check("Guidato: con l'80% delle parole avviate il passo successivo è «Verifica la tappa»", /Verifica la tappa/.test(vgo || ""), vgo);
    const xp0 = await p.evaluate(() => CP.game.rank().xp);
    await p.click("#path-root [data-gd-go]"); await p.waitForTimeout(200);
    const vq = [];
    for (let i = 0; i < 14; i++) { const k = await answer(true); if (k === "nessuno") break; if (k === "trace") await p.evaluate(() => { CP.exEngine.after({ ok: true, g: 2 }); document.querySelector("[data-exc]").click(); }); vq.push(k); }
    const pass = await p.evaluate(() => ({ title: (document.querySelector(".gd-res h2") || {}).textContent, parts: document.querySelectorAll(".gd-part").length, u: JSON.parse(localStorage.getItem("cp-ex-v1")).units.persone, xp: CP.game.rank().xp, noHint: true }));
    check("Guidato: verifica di 12 domande di tipi diversi, superata: «Tappa verificata», le parti del test di livello, +20 punti", vq.length === 12 && new Set(vq).size >= 3 && /Tappa verificata/.test(pass.title) && pass.parts >= 3 && pass.u.verifica.ok && pass.u.verifica.pct === 100 && pass.xp - xp0 === 20, JSON.stringify({ vq, pass, xp0 }));
    /* fallita: nessun punto in più, «Rinforza» con le parole sbagliate */
    await p.evaluate(() => CP.guided.verifica("persone")); await p.waitForTimeout(100);
    for (let i = 0; i < 14; i++) { const k = await answer(false); if (k === "nessuno") break; if (k === "trace") await p.evaluate(() => { CP.exEngine.after({ ok: false, g: 0 }); document.querySelector("[data-exc]").click(); }); }
    const fail = await p.evaluate(() => ({ title: (document.querySelector(".gd-res h2") || {}).textContent, weak: (document.querySelector(".gd-weak") || {}).textContent, rinf: !!document.querySelector("[data-gd-rinforza]"), xp: CP.game.rank().xp, ok: JSON.parse(localStorage.getItem("cp-ex-v1")).units.persone.verifica.ok }));
    await p.click("[data-gd-rinforza]"); await p.waitForTimeout(200);
    const rq = await p.evaluate(() => { const s = CP.studyKit.sess(); return s ? s.q.length : 0; });
    check("Guidato: verifica non superata: frase gentile sul punto debole, «Rinforza» apre un ripasso delle parole sbagliate, nessun punto in più, la tappa resta verificata", /Ancora/.test(fail.title) && /rinforzare/.test(fail.weak || "") && fail.rinf && fail.xp === pass.xp && fail.ok === true && rq >= 4, JSON.stringify({ fail, rq }));
    await p.evaluate(() => { CP.studyHome(); CP.show("path", true); }); await p.waitForTimeout(200);
    const badge = await p.evaluate(() => { const el = document.getElementById("stop-persone"); return !!(el && /Tappa verificata/.test(el.textContent)); });
    check("Guidato: nel Percorso la tappa ha il segno «Tappa verificata» (la regola dell'80% non cambia)", badge);
    /* lezioni: «I tuoi errori» e la mini-verifica */
    const ls = await p.evaluate(() => {
      const L = CP.lessons.list()[0]; CP.show("build", true); CP.build.openLesson(L.id); document.querySelector("[data-ls-quiz]").click();
      for (let i = 0; i < L.quiz.length; i++) { const o = document.querySelectorAll("[data-ls-opt]"); if (o.length) o[(L.quiz[i].a + 1) % o.length].click(); else { for (let j = 0; j < 20; j++) { const b = document.querySelector("[data-ls-pick]:not([disabled])"); if (!b) break; b.click(); } const ch = document.querySelector("[data-ls-check]"); if (ch) ch.click(); } document.querySelector("[data-ls-next]").click(); }
      const best = CP.lessons.progress(L.id).best, errs = document.querySelector("[data-ls-errs]"), mini = document.querySelector("[data-ls-mini]");
      mini.click(); const n = document.querySelectorAll("[data-ls-opt]").length;
      document.querySelectorAll("[data-ls-opt]")[0].click(); document.querySelector("[data-ls-next]").click(); document.querySelectorAll("[data-ls-opt]")[0].click(); document.querySelector("[data-ls-next]").click();
      return { errs: !!errs, n, best, best2: CP.lessons.progress(L.id).best, res: !!document.querySelector("[data-ls-back]") };
    });
    check("Lezioni: dopo il quiz «Rifai i tuoi errori» e la mini-verifica con 2 domande nuove a buco, che non cambiano il risultato della lezione", ls.errs && ls.n >= 2 && ls.best === ls.best2 && ls.res, JSON.stringify(ls));
    check("Guidato: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4l. lettura graduata: Frasi → Leggi → Testi, elenco per livello, parole che aprono il foglio, pinyin e
     traduzione a richiesta, domande con le risposte mescolate, letto + punti una volta sola, parole nuove nel ripasso */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}'); });
    await p.goto(base); await p.waitForTimeout(700);
    const r1 = await p.evaluate(() => { CP.show("build", true); CP.build.setSub("testi"); const items = document.querySelectorAll("[data-rdg]"); return { n: items.length, lv: document.querySelectorAll(".rdg-h").length, loaded: !!CP.reading }; });
    check("Lettura: in Frasi → Leggi → Testi i 15 testi per livello (il gruppo si carica all'apertura)", r1.n === 15 && r1.lv >= 4 && r1.loaded, JSON.stringify(r1));
    await p.click('[data-rdg="zh-t01-la-mia-giornata"]'); await p.waitForTimeout(150);
    const r2 = await p.evaluate(() => ({ s: document.querySelectorAll(".rdg-s").length, py: document.querySelectorAll(".rdg-py").length > 0, tr: document.querySelectorAll(".rdg-s .cd-note").length, say: document.querySelectorAll(".rdg-s .say").length }));
    await p.click('[data-rdg-tog="tr"]'); await p.waitForTimeout(80);
    const tr = await p.evaluate(() => document.querySelectorAll(".rdg-s .cd-note").length);
    await p.click(".rdg-w"); await p.waitForTimeout(250);
    const fam = await p.evaluate(() => !document.getElementById("fam").hidden);
    await p.evaluate(() => CP.closeSheet());
    check("Lettura: frase per frase con ascolto, pinyin acceso al livello 1, traduzione a richiesta, una parola apre il suo foglio", r2.s === 9 && r2.py && r2.tr === 0 && r2.say === 9 && tr === 9 && fam, JSON.stringify({ r2, tr, fam }));
    const xp0 = await p.evaluate(() => CP.game.rank().xp);
    const q = await p.evaluate(() => {
      document.querySelector("[data-rdg-q]").click();
      const t = CP.reading.texts()[0], rights = [];
      t.domande.forEach((d, i) => { const btns = [...document.querySelectorAll('[data-rdg-a^="' + i + ':"]')]; const j = btns.findIndex((b) => b.textContent.includes(d.scelte_it[d.giusta])); rights.push(j); btns[j].click(); });
      return { rights, score: (document.querySelector(".rdg-end .gd-score") || {}).textContent, read: !!JSON.parse(localStorage.getItem("cp-ex-v1")).read["zh-t01-la-mia-giornata"], add: document.querySelectorAll("[data-rdg-add]").length };
    });
    const xp1 = await p.evaluate(() => CP.game.rank().xp);
    check("Lettura: domande con la giusta in posti diversi (non sempre la prima), testo segnato «letto» e +5 punti", new Set(q.rights).size > 1 && /3 risposte giuste su 3/.test(q.score) && q.read && xp1 - xp0 === 5, JSON.stringify({ q, xp0, xp1 }));
    const add = await p.evaluate(() => { const b = document.querySelector("[data-rdg-add]"); if (!b) return "nessuna"; const k = b.getAttribute("data-rdg-add"); b.click(); return CP.state(k) >= 1 ? "ok" : "no"; });
    check("Lettura: una parola nuova del testo entra nel ripasso con un tocco", add === "ok", add);
    /* riletto: niente punti la seconda volta */
    await p.evaluate(() => { CP.reading.open("zh-t01-la-mia-giornata"); document.querySelector("[data-rdg-q]").click(); const t = CP.reading.texts()[0]; t.domande.forEach((d, i) => document.querySelector('[data-rdg-a^="' + i + ':"]').click()); });
    check("Lettura: i punti arrivano una volta sola per testo", (await p.evaluate(() => CP.game.rank().xp)) === xp1);
    check("Lettura: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4m. corso di italiano alla pari: stesso motore e stessi stili, voto da CP.itApi.grade nel formato di
     sempre di cp-it-srs-v1, ogni tipo di esercizio italiano, il dettato con una voce reale (solo se è sul telefono: prima
     nessuna richiesta), il passo successivo nella carta «今天» (Guidato), la lettura con le domande in cinese */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    const voce = []; p.on("request", (r) => { if (/\/audio\/voce\//.test(r.url())) voce.push(r.url()); });
    await ctx.addInitScript(() => { if (!localStorage.getItem("cp-course")) { localStorage.setItem("cp-course", "it"); localStorage.setItem("cp-lang", "zh"); localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); localStorage.setItem("cp-it-welcome", "1"); localStorage.setItem("cp-ex-style", "mixed"); } });
    await p.goto(base); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__itRight = function () {
      const cur = CP.exEngine.current(); if (!cur) return "nessuna carta"; const it = cur.item, root = document.getElementById("it-ex-root");
      if (it.kind === "mc") root.querySelectorAll("[data-exa]")[it.right].click();
      else if (it.kind === "type") { root.querySelector("#ex-in").value = it.accept[0]; root.querySelector("[data-ex-submit]").click(); }
      else if (it.kind === "order") { it.tiles.forEach((t) => root.querySelector('[data-exo="' + t.id + '"]').click()); root.querySelector("[data-exo-check]").click(); }
      const ok = !!root.querySelector(".ex-verdict.ok"), type = cur.e.exType; root.querySelector("[data-exc]").click(); return type + (ok ? "" : ":sbagliata");
    }; });
    const r1 = await p.evaluate(async () => {
      CP.unlock.unlockAll(); CP.itShow("review"); await new Promise((r) => setTimeout(r, 200));
      const intro = !!document.querySelector("[data-itx-learn]"); document.querySelector("[data-itx-learn]").click(); await new Promise((r) => setTimeout(r, 200));
      const card = document.querySelector("#it-ex-root .ex-card"), t = card && card.getAttribute("data-ex"), a = window.__itRight();
      return { intro, t, a };
    });
    check("Corso di italiano, stile Misto: la parola nuova si presenta, poi un esercizio di riconoscimento al posto della carta da girare", r1.intro && /^it-(significato|parola)$/.test(r1.t) && r1.a === r1.t, JSON.stringify(r1));
    const TYPES = ["it-significato", "it-parola", "it-buco", "it-ordina", "it-scrivi", "it-buco-gram", "it-verbo"];
    const r2 = await p.evaluate(async (TYPES) => {
      const E = CP.exEngine, K = CP.itEx.kit, L = CP.itApi.lex(), out = {};
      for (const T of TYPES) {
        const w = L.find((e) => { e.key = e.id; const d = E.REG[T]; return (!d.richiede || d.richiede(e, K.ctx) !== false) && d.crea(e, K.ctx, CP.distract.rng(7)); });
        if (!w) { out[T] = "nessuna parola"; continue; }
        E.force(T); CP.itEx.only(w.id); await new Promise((r) => setTimeout(r, 60));
        const shown = (document.querySelector("#it-ex-root .ex-card") || {}).getAttribute && document.querySelector("#it-ex-root .ex-card").getAttribute("data-ex");
        out[T] = shown === T ? window.__itRight() : "mostrato " + shown;
      }
      E.force(null);
      const S = JSON.parse(localStorage.getItem("cp-it-srs-v1")), recs = Object.keys(S).filter((k) => k !== "__meta").map((k) => S[k]);
      return { out, fmt: recs.length >= 2 && recs.every((r) => Object.keys(r).sort().join() === "c,lr,n" && r.c.due > 0), n: recs.length };
    }, TYPES);
    check("Corso di italiano: ogni tipo di esercizio si risolve con la risposta giusta (" + TYPES.length + " tipi)", TYPES.every((t) => r2.out[t] === t), JSON.stringify(r2.out));
    check("Corso di italiano: il voto passa da CP.itApi.grade, cp-it-srs-v1 resta { c, n, lr } per parola", r2.fmt, JSON.stringify(r2));
    check("Corso di italiano: senza voci scaricate nessuna richiesta di clip (si usa la voce del telefono)", !voce.length, voce[0]);
    /* il dettato con una voce reale: le clip sono sul telefono (qui come dopo «Scarica le voci») */
    const r3 = await p.evaluate(async () => {
      localStorage.setItem("cp-voice-dl", "1");
      const E = CP.exEngine, K = CP.itEx.kit, L = CP.itApi.lex(), w = L.find((e) => E.REG["it-dettato"].richiede(e, K.ctx));
      if (!w) return { w: null };
      E.force("it-dettato"); CP.itEx.only(w.id); await new Promise((r) => setTimeout(r, 700));
      const cur = E.current(), real = !!document.querySelector("#it-ex-root .ex-listen .tag"), url = CP.voiceClip.url(cur.item.say, "it");
      const a = window.__itRight(); E.force(null);
      return { w: w.id, s: cur.item.say, real, url, a };
    });
    await p.waitForTimeout(200);
    check("Corso di italiano: dettato con la voce reale (la clip parte da sola, la frase scritta giusta passa)", r3.w && r3.real && /audio\/voce\/it\/\d+\.[0-9a-f]{8}\.ogg$/.test(r3.url) && voce.some((u) => u.endsWith(r3.url)) && r3.a === "it-dettato", JSON.stringify({ r3, voce: voce.slice(0, 2) }));
    /* stile Guidato: la carta «今天» dice il passo (qui: un testo, dopo 3 lezioni superate); la lettura con le domande in cinese */
    const r4 = await p.evaluate(async () => {
      localStorage.setItem("cp-ex-style", "guided");
      const P = {}; CP.itApi.lessons().slice(0, 3).forEach((l) => { P[l.id] = { done: Date.now(), best: 100 }; }); localStorage.setItem("cp-it-lessons-v1", JSON.stringify(P));
      CP.itShow("lessons"); await new Promise((r) => setTimeout(r, 100));
      const b = document.querySelector(".it-today [data-itg-go]"), label = b && b.textContent, xp0 = CP.game.rank().xp; if (!b) return { label: null };
      b.click(); await new Promise((r) => setTimeout(r, 150));
      const text = !!document.querySelector(".rdg-text"), t = CP.itRead.state().t;
      document.querySelector("[data-itq-q]").click(); await new Promise((r) => setTimeout(r, 50));
      t.domande.forEach((d, i) => { const bs = [...document.querySelectorAll('[data-itq-a^="' + i + ':"]')]; bs.find((x) => x.textContent.includes(d.scelte_it[d.giusta])).click(); });
      const q = (document.querySelector(".rdg-qs .ask") || {}).textContent, score = (document.querySelector(".rdg-end .gd-score") || {}).textContent;
      CP.itRead.close(); CP.itShow("lessons"); await new Promise((r) => setTimeout(r, 50));
      const next = (document.querySelector(".it-today [data-itg-go]") || {}).textContent;
      return { label, text, id: t.id, q, score, read: !!JSON.parse(localStorage.getItem("cp-ex-v1")).read[t.id], xp: CP.game.rank().xp - xp0, next };
    });
    check("Corso di italiano, Guidato: «今天» dice il passo (un testo), la lettura ha domande in cinese, «已读» e +5 una volta, poi la lezione successiva", /短文/.test(r4.label) && r4.text && /[一-鿿]/.test(r4.q) && /3 \/ 3/.test(r4.score) && r4.read && r4.xp === 5 && /第 4 课/.test(r4.next), JSON.stringify(r4));
    /* Classico: le carte di prima */
    const r5 = await p.evaluate(async () => { localStorage.setItem("cp-ex-style", "classic"); CP.itApi.nextCard(); CP.itShow("review"); await new Promise((r) => setTimeout(r, 100)); return { classic: !!document.querySelector("[data-itr-show]"), ex: !!document.querySelector("#it-ex-root") }; });
    check("Corso di italiano, Classico: il ripasso di prima (carta da girare, quattro voti)", r5.classic && !r5.ex, JSON.stringify(r5));
    check("Corso di italiano, esercizi: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 4n. voci reali: prima di «Scarica le voci» nessuna richiesta di clip; il pulsante le mette nella cache
     mandarino-voice; poi «ascolta la frase» con la voce vera; in modalità aereo le clip arrivano dalla cache; senza le voci
     cinesi (materiali/audio/zh assente) nessun errore e l'esercizio non si propone */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    const voce = [], ext = []; p.on("request", (r) => { const u = r.url(); if (/\/audio\/voce\//.test(u)) voce.push(u); if (!u.startsWith(base) && !/^(data|blob):/.test(u)) ext.push(u); });
    await ctx.addInitScript(() => { if (!localStorage.getItem("cp-ux-v1")) { localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}'); localStorage.setItem("cp-ex-style", "mixed"); } });
    await p.goto(base); await p.waitForTimeout(800);
    const r0 = await p.evaluate(() => { CP.ex.carica(); const E = CP.exEngine, any = CP.ORDER.some((k) => E.REG["ascolto-frase"].richiede(CP.WORDS[k], E.ctx)); CP.say("还有很多时间"); return { any, url: CP.voiceClip.url("还有很多时间", "zh") }; });
    await p.waitForTimeout(150);
    check("Voci reali: prima di scaricarle nessuna clip, nessuna richiesta, «ascolta la frase» non si propone", !r0.any && !r0.url && !voce.length, JSON.stringify({ r0, voce: voce.length }));
    /* ⚙️ → Suoni e musica → Voce → «Voci reali» → «Scarica le voci» */
    const label = await p.evaluate(() => { CP.show("settings"); const d = document.getElementById("set-voice") || document.querySelector("#vset-body"); const b = document.querySelector("[data-vc-dl]"); return b ? b.textContent : (document.getElementById("vc-box") || {}).textContent || null; });
    check("Voci reali: in ⚙️ → Suoni e musica → Voce il pulsante «Scarica le voci» con i MB", /Scarica le voci \(\d+,\d MB\)/.test(label || ""), label);
    await p.evaluate(() => document.querySelector("[data-vc-dl]").click());
    await p.waitForFunction(() => localStorage.getItem("cp-voice-dl") === "1", null, { timeout: 120000 }).catch(() => {});
    const r1 = await p.evaluate(async () => { const c = await caches.open("mandarino-voice"), ks = await c.keys(), F = VOICE_FILES; return { dl: localStorage.getItem("cp-voice-dl"), n: ks.length, want: Object.keys(F.zh).length + Object.keys(F.it).length, box: (document.getElementById("vc-box") || {}).textContent }; });
    check("Voci reali: «Scarica le voci» mette tutte le clip nella cache mandarino-voice", r1.dl === "1" && r1.n === r1.want && r1.want > 1000 && /✓/.test(r1.box), JSON.stringify(r1));
    voce.length = 0;
    const r2 = await p.evaluate(async () => {
      const E = CP.exEngine, k = CP.ORDER.find((k) => E.ctx.levelOf(CP.WORDS[k]) >= 2 && E.REG["ascolto-frase"].richiede(CP.WORDS[k], E.ctx)); if (!k) return { k: null };
      E.force("ascolto-frase"); CP.show("study", true); CP.studyKit.start([{ k: k, kind: "test", ex: 1, retry: false }]);
      await new Promise((r) => setTimeout(r, 700));
      const cur = E.current(), card = document.querySelector("#study-root .ex-card");
      const out = { k, type: card && card.dataset.ex, real: !!document.querySelector("#study-root .ex-listen .tag"), url: CP.voiceClip.url(cur.item.say, "zh"), opts: cur.item.opts.length, right: cur.item.right };
      document.querySelectorAll("#study-root [data-exa]")[cur.item.right].click();
      out.ok = /✓/.test(document.querySelector(".ex-verdict").textContent); E.force(null); CP.studyHome();
      return out;
    });
    check("Voci reali: «ascolta la frase» con la voce vera (la clip parte da sola), quattro frasi scritte, la giusta passa", r2.k && r2.type === "ascolto-frase" && r2.real && r2.opts === 4 && r2.ok && voce.some((u) => u.endsWith(r2.url)), JSON.stringify({ r2, voce: voce.slice(0, 1) }));
    const lv = await p.evaluate(() => { const E = CP.exEngine, hi = CP.ORDER.map((k) => CP.WORDS[k]).find((w) => E.ctx.levelOf(w) >= 3 && E.REG["ascolto-frase"].richiede(w, E.ctx)); return hi ? E.REG["mc-ascolto"].richiede(hi, Object.assign({}, E.ctx, { hasVoice: () => true })) : "nessuna"; });
    check("Voci reali: dal livello 3 l'ascolto usa la frase vera al posto della parola sintetica", lv === false, String(lv));
    /* modalità aereo: la clip arriva dalla cache del service worker */
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 8000 }).catch(() => {});
    await ctx.setOffline(true);
    const off = await p.evaluate(async () => { const u = CP.voiceClip.url("还有很多时间", "zh"); try { const r = await fetch(u); return { u, ok: r.ok, n: (await r.arrayBuffer()).byteLength, sw: !!navigator.serviceWorker.controller }; } catch (e) { return { u, err: e.message, sw: !!navigator.serviceWorker.controller }; } });
    await ctx.setOffline(false);
    check("Voci reali: in modalità aereo le clip scaricate arrivano dalla cache", off.ok && off.n > 1000, JSON.stringify(off));
    /* senza le voci cinesi (materiali/audio/zh mancante): niente clip cinesi, nessun errore, l'esercizio non si propone */
    const nz = await p.evaluate(async () => {
      const F = VOICE_FILES; Object.defineProperty(window, "VOICE_FILES", { configurable: true, value: { byte: { it: F.byte.it }, it: F.it } });
      const E = CP.exEngine, any = CP.ORDER.slice(0, 600).some((k) => E.REG["ascolto-frase"].richiede(CP.WORDS[k], E.ctx));
      CP.say("还有很多时间"); CP.show("study", true); CP.studyStart(); await new Promise((r) => setTimeout(r, 300));
      const card = !!document.querySelector("#study-root .ex-card, #study-root .fc"); CP.studyHome();
      return { any, url: CP.voiceClip.url("还有很多时间", "zh"), langs: CP.voiceClip.langs().join(), card };
    });
    check("Voci reali: senza le voci cinesi nessun errore, nessuna clip cinese, «ascolta la frase» non si propone", !nz.any && !nz.url && nz.langs === "it" && nz.card, JSON.stringify(nz));
    check("Voci reali: nessuna richiesta fuori dall'app, nessun errore JavaScript", !ext.length && !errs.length, ext[0] || errs[0]);
    await ctx.close();
  }
  /* 5. corso di italiano per chi parla cinese */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    /* da http, non da file://: con le pagine file:// Chromium a volte perde tutto il localStorage al ricaricamento */
    await p.goto(base); await p.waitForTimeout(700);
    /* il benvenuto (ui/welcome.js): intro di qualche secondo, poi le porte; in piccolo, l'altro corso */
    const btn = await p.waitForSelector('#onb [data-course-set="it"]', { timeout: 8000 }).catch(() => null);
    check("Benvenuto: intro, porte e «我是中国人，我想学意大利语»", !!btn && (await p.$$("#onb [data-onb-door]")).length === 3);
    if (btn) { await Promise.all([p.waitForNavigation(), btn.click()]); await p.waitForTimeout(700); }
    /* il corso di italiano ha lo stesso benvenuto, in cinese (l'intro non si ripete nella stessa sessione) */
    const later = await p.waitForSelector("#onb [data-onb-later]", { timeout: 8000 }).catch(() => null);
    check("Corso di italiano: benvenuto in cinese con le tre porte", !!later && /从零开始/.test(await p.textContent("#onb")), JSON.stringify(await p.evaluate(() => ({ url: location.href, course: localStorage.getItem("cp-course"), lang: localStorage.getItem("cp-lang"), welcome: localStorage.getItem("cp-it-welcome"), onb: (document.getElementById("onb") || {}).className, body: document.body.className })).catch((e) => String(e))));
    if (later) { await later.click(); await p.waitForTimeout(200); }
    check("Corso di italiano: all'inizio solo 课程 e 复习 nella barra (rivelazione progressiva)", await p.evaluate(() => [...document.querySelectorAll(".dock-it .dtab")].filter((b) => !b.hidden).map((b) => b.getAttribute("data-it-tab")).join(",") === "lessons,review"));
    const ak = await p.evaluate(() => { const r = CP.anki.build({ which: "all" }), rows = r.text.split("\n").filter((l) => l && l[0] !== "#"), g = new Set(rows.map((l) => l.split("\t")[0])), v = rows.find((l) => /\tmandarino-it verb /.test(l)) || ""; return { n: r.n, uniq: g.size, cols: rows.every((l) => l.split("\t").length === 7), deck: /#deck:màndarínō::意大利语/.test(r.text), morph: /Morph-it!/.test(r.text.split("\n")[6]), conj: /io [^,<]+, tu [^,<]+,/.test(v), dots: rows.some((l) => /\.[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(l.split("\t")[2])) }; });
    check("Pleco: nel corso di italiano l'opzione non c'è", await p.evaluate(() => !CP.pleco.available()));
    check("Anki, corso di italiano: tutto il lessico, guid unici, 7 colonne, presente dei verbi dalle regole, Morph-it! citato", ak.n > 4000 && ak.uniq === ak.n && ak.cols && ak.deck && ak.morph && ak.conj && !ak.dots, JSON.stringify(ak));
    check("Corso di italiano: interfaccia cinese e schede proprie", await p.evaluate(() => CP.course() === "it" && LANG === "zh" && document.body.classList.contains("course-it") && document.querySelectorAll(".dock-it [data-it-tab]").length === 5));
    const ri = await p.evaluate(() => {
      CP.itShow("lessons"); if (document.querySelector("[data-itl-back]")) document.querySelector("[data-itl-back]").click();
      const nodes = document.querySelectorAll(".itp-node.rev").length, real = document.querySelectorAll(".itp-node:not(.rev)").length;
      document.querySelector('[data-itl-open="rip-1"]').click();
      const page = !!document.querySelector("[data-itl-quiz]") && /1–5/.test((document.querySelector(".ls-lesson h3") || {}).textContent || "");
      document.querySelector("[data-itl-quiz]").click();
      const play = !!document.querySelector(".ls-quiz .ls-prog");
      CP.itApi.open("pronuncia");
      return { nodes, real, page, play, dl: document.querySelectorAll(".ls-dl").length, say: document.querySelectorAll(".ls-dl [data-it-say]").length };
    });
    check("Corso di italiano: mini-dialogo con audio e un ripasso ogni cinque lezioni (oltre alle lezioni)", ri.nodes === Math.floor(ri.real / 5) && ri.real >= 38 && ri.page && ri.play && ri.dl >= 3 && ri.say >= ri.dl, JSON.stringify(ri));
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
  /* 5e. punteggio, carta «今天», percorso, traguardi e carte da condividere del corso di italiano */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    const net = []; await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => { net.push(r.request().url()); r.abort(); });
    /* un profilo che studiava già: 2 lezioni superate e 5 parole ripassate, senza il conteggio dei punti del corso */
    await ctx.addInitScript(() => { if (sessionStorage.getItem("init")) return; sessionStorage.setItem("init", 1);
      localStorage.setItem("cp-course", "it"); localStorage.setItem("cp-lang", "zh"); localStorage.setItem("cp-it-welcome", "1"); localStorage.setItem("cp-ux-v1", JSON.stringify({ onboarded: 1, unlv: 1, showAll: 1 }));
      localStorage.setItem("cp-it-lessons-v1", JSON.stringify({ pronuncia: { best: 90, done: Date.now() - 5 * 864e5 }, genere: { best: 85, done: Date.now() - 3 * 864e5 } }));
      const S = {}; ["a", "b", "c", "d", "e"].forEach((k) => { S["it:x:" + k] = { n: 1, lr: Date.now() - 864e5, c: { state: 2, st: 3, df: 5, due: Date.now() + 864e5, last: Date.now() - 864e5, step: 0 } }; }); localStorage.setItem("cp-it-srs-v1", JSON.stringify(S)); });
    await p.goto(base); await p.waitForTimeout(900);
    const xp1 = await p.evaluate(() => CP.game.rank().xp); await p.reload(); await p.waitForTimeout(700); const xp2 = await p.evaluate(() => CP.game.rank().xp);
    check("Corso di italiano: chi aveva già studiato parte dai punti che vale (2 lezioni e 5 parole = 110), senza contarli due volte", xp1 === 110 && xp2 === 110, xp1 + " " + xp2);
    const today = await p.evaluate(() => { const c = document.querySelector("#view-it .it-today"); return c ? { primary: document.querySelectorAll("#view-it .btn-main").length, go: (c.querySelector("[data-itd-go]") || {}).textContent, nodes: document.querySelectorAll(".itp-node:not(.rev)").length, done: document.querySelectorAll(".itp-node.done:not(.rev)").length, now: (document.querySelector(".itp-node.now [data-itl-open]") || {}).getAttribute && document.querySelector(".itp-node.now [data-itl-open]").getAttribute("data-itl-open"), phrase: !!c.querySelector(".itd-phrase .itd-it"), ring: !!c.querySelector(".ring") } : null; });
    check("Carta «今天»: un solo pulsante primario «继续：第 3 课», anello, frase del giorno; sotto il percorso di tutte le lezioni con 2 superate e la terza evidenziata", today && today.primary === 1 && /第 3 课/.test(today.go) && today.nodes >= 38 && today.done === 2 && today.now === "articoli" && today.phrase && today.ring, JSON.stringify(today));
    const ph = await p.evaluate(() => { const d = new Date(2026, 9, 27), a = CP.itToday.phraseOfDay(d), b = CP.itToday.phraseOfDay(new Date(2026, 9, 27)), pool = CP.itToday.pool(); return { same: a.it === b.it, inPool: pool.some((x) => x.it === a.it), fromPassed: pool.every((x) => x.n <= 2) }; });
    check("Frase del giorno: scelta in modo deterministico tra gli esempi delle lezioni superate", ph.same && ph.inPool && ph.fromPassed, JSON.stringify(ph));
    /* si avvia la lezione corrente e la si supera: anello, serie, «+30 分» e il traguardo con «分享纪念卡» nel messaggio */
    await p.click("[data-itd-go]"); await p.waitForTimeout(200);
    const opened = await p.evaluate(() => /第 3 课/.test((document.querySelector("#view-it .ls-lesson .tag") || {}).textContent || ""));
    const passed = await p.evaluate(() => {
      const l = ITLESSONS.filter((x) => x.id === "articoli")[0], click = (sel) => document.querySelector(sel).click();
      click("[data-itl-quiz]");
      for (const q of l.quiz) {
        if (q.k === "order") { for (const w of q.it.replace(/[.,!?]/g, "").split(/\s+/)) { const t = [...document.querySelectorAll("[data-itl-pick]:not([disabled])")].find((x) => x.textContent === w); t.click(); } click("[data-itl-check]"); }
        else click('[data-itl-opt="' + q.a + '"]');
        click("[data-itl-next]");
      }
      return { stamp: !!document.querySelector(".ls-quiz .it-stamp"), share: !!document.querySelector("#view-it [data-itd-share]"), gain: (document.querySelector(".it-gain") || {}).textContent || "", streak: CP.game.streak(), toast: document.getElementById("toast").textContent, act: !!document.querySelector("#toast .toast-act") };
    });
    check("Lezione corrente avviata dalla carta e superata: sigillo «通过», «+30 分», serie aggiornata, «分享» a fine lezione", opened && passed.stamp && passed.share && /\+30/.test(passed.gain) && passed.streak >= 1, JSON.stringify(passed));
    await p.waitForTimeout(150);
    const leafIt = await p.evaluate(() => { const els = document.querySelectorAll('.brand [data-tone="3"]'); if (!els.length) return { n: 0, toast: "" }; els[0].dispatchEvent(new MouseEvent("click", { bubbles: true })); return { n: els.length, toast: (document.getElementById("toast") || {}).textContent || "" }; });
    check("Logo: le due foglie suonano il terzo tono (avviso «3° tono» o «第三声», secondo la lingua)", leafIt.n === 2 && /3° tono|第三声/.test(leafIt.toast), JSON.stringify(leafIt));
    const mile = await p.evaluate(() => { const sheets = document.querySelectorAll("[role=dialog]:not([hidden]), .sheet:not([hidden])").length; CP.onRankUp({ name: "声调学徒" }); const b = document.querySelector("#toast .toast-act"); const m = JSON.parse(localStorage.getItem("cp-it-cards-v1") || "{}").m || {}; return { act: b ? b.textContent : "", toast: document.getElementById("toast").textContent, sheets: document.querySelectorAll("[role=dialog]:not([hidden]), .sheet:not([hidden])").length - sheets, rec: !!m["rank:声调学徒"] && !!m.first }; });
    check("Traguardo: «分享纪念卡» dentro il messaggio di congratulazioni, nessuna finestra in più, ricordato in cp-it-cards-v1", mile.act === "分享纪念卡" && /恭喜/.test(mile.toast) && mile.sheets === 0 && mile.rec, JSON.stringify(mile));
    await p.evaluate(() => { CP.itShow("lessons"); document.querySelector("[data-itl-back]") && document.querySelector("[data-itl-back]").click(); }); await p.waitForTimeout(200);
    const ring = await p.evaluate(() => (document.querySelector(".it-today .itd-streak") || {}).textContent || "");
    check("Carta «今天» dopo la lezione: serie aggiornata", /连续 [1-9]/.test(ring), ring);
    /* carte: 3 colori × 3 formati, senza testo tagliato; il QR si rilegge e dà esattamente l'indirizzo */
    const cards = await p.evaluate(async () => {
      const out = [], d = CP.itCardData();
      for (const tpl of ["it-day", "it-milestone", "it-week"]) for (const f of Object.keys(CP.shareCard.FORMATS)) for (const th of ["light", "sepia", "dark"]) {
        const cv = document.createElement("canvas"); await CP.shareCard.render(cv, tpl, Object.assign({}, d, { milestone: "连续学习 30 天", name: "小明" }), { format: f, theme: th });
        const img = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height), q = window.jsQR(img.data, cv.width, cv.height);
        out.push({ k: tpl + " " + f + " " + th, w: cv.width, h: cv.height, cut: cv.__cut.length, qr: q ? q.data : null });
      }
      return { out, url: CP.shareCard.url() };
    });
    const badCard = cards.out.filter((c) => c.cut || c.qr !== cards.url || c.w !== 1080);
    check("Carte del corso di italiano: 3 modelli × 3 formati × 3 colori, nessun testo tagliato, il QR rende esattamente l'indirizzo", cards.out.length === 27 && !badCard.length && cards.out.some((c) => c.h === 1440) && cards.out.some((c) => c.h === 1920), JSON.stringify(badCard.slice(0, 2)) + " " + cards.url);
    /* condivisione: nel browser senza condivisione di file si scarica l'immagine; il nome è spento di base */
    await p.evaluate(() => CP.shareCard.open("it-day")); await p.waitForTimeout(500);
    const signOff = await p.evaluate(() => !document.getElementById("card-sign").checked && document.getElementById("card-name").hidden);
    const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 4000 }).catch(() => null), p.click("[data-card-share]")]);
    check("Carta: anteprima con testo alternativo, «署名» spento di base, condivisione con ripiego sullo scaricamento", signOff && !!dl && /\.png$/.test(dl.suggestedFilename()) && await p.evaluate(() => /今日意大利语/.test(document.querySelector(".card-cv").getAttribute("aria-label"))), dl ? dl.suggestedFilename() : "nessuno");
    await p.evaluate(() => CP.closeSheet());
    /* «我的进步»: racconto della settimana e raccolta delle carte ricordo */
    await p.evaluate(() => CP.itProgress()); await p.waitForTimeout(400);
    const pr = await p.evaluate(() => ({ story: !!document.querySelector("#itp-story .st-sum"), cards: document.querySelectorAll(".itd-card").length, share: !!document.querySelector("[data-itd-week]") }));
    check("«我的进步»: racconto della settimana, raccolta «纪念卡», «分享»", pr.story && pr.cards >= 1 && pr.share, JSON.stringify(pr));
    await p.evaluate(() => CP.closeSheet());
    /* modalità aereo: tutto continua a funzionare */
    await ctx.setOffline(true);
    const off = await p.evaluate(async () => { CP.itShow("review"); CP.itShow("lessons"); const c = document.createElement("canvas"); await CP.shareCard.render(c, "it-day", CP.itCardData(), {}); return !!document.querySelector(".it-today") && c.width === 1080; });
    await ctx.setOffline(false);
    check("Corso di italiano in modalità aereo: carta «今天» e carta da condividere", off);
    check("nessuna richiesta di rete, nessun errore JavaScript", !net.length && !errs.length, net[0] || errs[0]);
    await ctx.close();
  }
  /* 5f. la carta del corso di cinese è identica a prima ora (stessa pagina, vecchio modulo contro modelli nuovi) */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); });
    await p.goto(base); await p.waitForTimeout(600);
    const grab = () => p.evaluate(() => new Promise((res) => { CP.shareCard(); setTimeout(() => { const c = document.querySelector(".card-cv"); res(c.getContext("2d").getImageData(0, 0, c.width, c.height).data.join(",").length + ":" + c.toDataURL()); CP.closeSheet(); }, 600); }));
    const now = await grab();
    await p.evaluate((code) => { (0, eval)(code); }, fs.readFileSync(path.join(path.dirname(fileURLToPathSafe(import.meta.url)), "fixtures/share-card-v1.js"), "utf8"));
    const old = await grab();
    const diff = await p.evaluate(async ([a, b]) => {
      const load = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
      const [A, B] = await Promise.all([load(a.split(":").slice(1).join(":")), load(b.split(":").slice(1).join(":"))]);
      if (A.width !== B.width || A.height !== B.height) return 1;
      const c = document.createElement("canvas"); c.width = A.width; c.height = A.height; const x = c.getContext("2d");
      x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data; x.clearRect(0, 0, c.width, c.height); x.drawImage(B, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
      let n = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 30) n++;
      return n / (da.length / 4);
    }, [now, old]);
    check("Carta del corso di cinese identica a prima ora (pixel diversi: " + (diff * 100).toFixed(3) + "%)", diff < 0.001, String(diff));
    check("Carta del cinese: nessun errore JavaScript", !errs.length, errs[0]);
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
  /* 5e. musica: i brani dell'utente (⚙️ → Suoni e musica → Voce → «I tuoi brani»). Un WAV vero, un file rotto con estensione .mp3 e uno troppo grande;
     copia nella memoria dell'app (IndexedDB), elenco, riascolto dopo il ricaricamento, «Solo i miei brani», «Rimuovi». */
  {
    const wav = (sec) => { const rate = 8000, n = rate * sec, b = Buffer.alloc(44 + n * 2); b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(i / 8 * Math.PI) * 6000), 44 + i * 2); return b; };
    const ctx = await browser.newContext(); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); }); await p.reload();
    await p.evaluate(() => { CP.openSettings("vset"); }); await p.waitForSelector("#ub-box");
    check("Brani tuoi: il pannello dice che restano sul dispositivo e non entrano nel backup", await p.evaluate(() => /backup/.test(document.getElementById("ub-box").textContent) && !!document.querySelector("[data-ub-add]")));
    const pick = p.waitForEvent("filechooser"); await p.click("[data-ub-add]");
    const fc = await pick;
    check("Brani tuoi: il selettore accetta più file", fc.isMultiple());
    await fc.setFiles([{ name: "Il_mio_brano.wav", mimeType: "audio/wav", buffer: wav(6) }, { name: "rotto.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("non sono audio") }]);
    await p.waitForFunction(() => /Aggiunti|已添加/.test(document.getElementById("ub-msg").textContent), null, { timeout: 20000 });
    const r = await p.evaluate(() => ({ list: document.querySelector(".ub-list").textContent, msg: document.getElementById("ub-msg").textContent, ls: JSON.parse(localStorage.getItem("md-ubl")), tr: CP.audioTracks.list.filter((t) => t.user).length, bk: Object.keys(localStorage).filter((k) => k.indexOf("cp-") === 0 && /md-ubl/.test(k)).length }));
    check("Brani tuoi: il file buono è in elenco col nome del file, quello rotto è rifiutato con il suo nome", /Il mio brano/.test(r.list) && /rotto\.mp3/.test(r.msg) && r.ls.length === 1 && r.ls[0].sec === 6 && r.tr === 1 && !r.bk, JSON.stringify(r));
    const id = await p.evaluate(() => JSON.parse(localStorage.getItem("md-ubl"))[0].id);
    await p.evaluate((id) => CP.jukebox.play(id), id); await p.waitForFunction((id) => CP.audioFile.state(id) === "ok" && CP.musicState().track === id, id, { timeout: 15000 });
    check("Brani tuoi: il brano suona dalla memoria dell'app, senza rete", true);
    await p.reload(); await p.evaluate(() => { CP.openSettings("vset"); }); await p.waitForSelector("#ub-box .ub-list");
    check("Brani tuoi: dopo il ricaricamento l'elenco c'è ancora", await p.evaluate(() => /Il mio brano/.test(document.querySelector(".ub-list").textContent) && CP.audioTracks.list.some((t) => t.user)));
    await p.click("[data-ub-mode=only]");
    check("Brani tuoi: «Solo i miei brani» lascia nel mescolamento solo i tuoi", await p.evaluate(() => CP.audioTracks.list.filter((t) => t.user).length === 1 && localStorage.getItem("cp-ubmode") === "only"));
    await p.click("[data-ub-rm]"); await p.waitForFunction(() => !document.querySelector(".ub-list"));
    const left = await p.evaluate(() => new Promise((res) => { const rq = indexedDB.open("mandarino-user-music", 1); rq.onsuccess = () => { const q = rq.result.transaction("tracks").objectStore("tracks").count(); q.onsuccess = () => res(q.result); }; }));
    check("Brani tuoi: «Rimuovi» toglie il brano dall'elenco e dalla memoria dell'app", left === 0 && await p.evaluate(() => !CP.audioTracks.list.some((t) => t.user)));
    check("Brani tuoi: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 5d. musica: il loop dei brani senza buchi. Ogni brano suona dal riproduttore vero dell'app (elemento <audio>
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
      const OK = new Set("pdf jspdf parallax eros zanchetta marco baroni notice third party notices playwright lgpl sa by md strumstick unlicense màndarínō mandarino licenze license claudio longhitano claude code anthropic iphone wikidict wikidata wikipedia dict data drive onedrive dropbox icloud jsqr cozmo apache pages public complete vocabulary javascript hsk xp fsrs pwa github chrome google pleco anki wechat whatsapp email json cloudflare google pinyin android https http apk wifi sim qr ok mb kb app arphic mit makemeahanzi kishore shaunak zafirópulos yanis drkameleon py open spaced repetition cc cedict mdbg morph bologna hunspell libreoffice license kaitim ukai gb pl skishore com org unihan cjklib tatoeba fr materiali crediti autori frasi tsv m ndar n longhitown nm mozilla common voice ogg opus".split(" "));
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
    /* si legge l'avviso subito dopo il tocco: senza una voce cinese (come in CI) l'app, una volta sola, lo sostituisce con «la voce non risponde» */
    const leafZh = await p.evaluate(() => { const el = document.querySelector('.brand [data-tone="3"]'); if (!el) return ""; el.dispatchEvent(new MouseEvent("click", { bubbles: true })); return (document.getElementById("toast") || {}).textContent || ""; });
    check("Logo, interfaccia in cinese: toccando una foglia l'avviso dice «第三声»", /第三声/.test(leafZh), leafZh);
    await ctx.close();
  }
  /* Taccuino del viaggiatore (corso di cinese): senza errori è bello lo stesso; con una coppia davvero scambiata compare l'aneddoto;
     una pagina diventa un'immagine solo se la persona lo sceglie; nessuna richiesta di rete */
  for (const lang of ["it", "zh"]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await ctx.addInitScript((l) => { try { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); localStorage.setItem("cp-lang", l); } catch (e) {} }, lang);
    const p = await ctx.newPage(); const errs = [], ext = []; p.on("pageerror", (e) => errs.push(e.message));
    p.on("request", (r) => { const u = r.url(); if (!/^(http:\/\/127\.0\.0\.1|data:|blob:|file:)/.test(u)) ext.push(u); });
    await p.goto(base); await p.waitForTimeout(700);
    const L = lang.toUpperCase() + " · ";
    /* mille parole iniziate: arrivo a Xi'an (città 7) */
    await p.evaluate(() => { SECTIONS.slice(0, 46).forEach((s) => CP.ORDER.forEach((k) => { if (CP.WORDS[k].sec === s.id) CP.S()[k] = { n: 3, sd: 2, st: 6, d: 1 }; })); CP.save(); CP.show("study", true, true); });
    await p.waitForTimeout(800);
    const c0 = await p.evaluate(() => ({ card: !!document.querySelector("#st-story .dy-card"), btn: !!document.querySelector("#st-story [data-diary-open]"), strip: !!document.querySelector("#st-story .dy-strip"), main: document.querySelectorAll("#st-story .btn-main").length }));
    check(L + "Taccuino: la carta compare tra i progressi, con un solo pulsante secondario", c0.card && c0.btn && c0.strip && c0.main === 0, JSON.stringify(c0));
    await p.click("[data-diary-open]"); await p.waitForTimeout(500);
    const t0 = await p.evaluate(() => ({ map: !!document.querySelector(".dy-map"), aria: (document.querySelector(".dy-map") || { getAttribute: () => "" }).getAttribute("aria-label"), stops: document.querySelectorAll(".dy-city").length, off: document.querySelectorAll(".dy-city.off").length, pages: document.querySelectorAll(".dy-page").length, anec: document.querySelectorAll(".dy-note .dy-hand").length, empty: !!document.querySelector(".dy-empty"), over: document.documentElement.scrollWidth > innerWidth + 1 }));
    check(L + "Taccuino senza errori: mappa con 11 città (4 ancora da raggiungere), 7 pagine di diario, nessun aneddoto, nessun «punto perso»", t0.map && /7/.test(t0.aria) && t0.stops === 11 && t0.off === 4 && t0.pages === 7 && t0.anec === 0 && t0.empty && !t0.over, JSON.stringify(t0));
    /* una coppia nota: 妈/马 scambiate in una scelta multipla, 买/卖 nel tono (Dottore dei Toni) */
    await p.evaluate(() => { CP.closeSheet(); CP.exConf("马", "妈", "mc-parola"); CP.confuse(3, 4, "买"); CP.show("study", true, true); }); await p.waitForTimeout(500);
    await p.click("[data-diary-open]"); await p.waitForTimeout(500);
    const t1 = await p.evaluate(() => { const ns = [...document.querySelectorAll(".dy-note .dy-hand")].map((e) => e.textContent); return { ns, lang: (document.querySelector(".dy-note .dy-hand") || { lang: "" }).lang, pair: [...document.querySelectorAll(".dy-pair .dy-hz")].map((e) => e.textContent).join(""), empty: !!document.querySelector(".dy-empty") }; });
    const want = lang === "it" ? /cavallo/ : /马/;
    check(L + "Taccuino con errori veri: compaiono solo gli aneddoti delle coppie scambiate (妈/马 e 买/卖), nella lingua dell'interfaccia, con la città al posto di {c}", t1.ns.length === 2 && t1.ns.some((x) => want.test(x)) && t1.ns.every((x) => !/\{c\}/.test(x) && /Xi'an|西安/.test(x)) && /妈马|马妈/.test(t1.pair) && /买卖|卖买/.test(t1.pair) && !t1.empty && t1.lang === (lang === "it" ? "it" : "zh-CN"), JSON.stringify(t1));
    const never = await p.evaluate(() => CP.diary.earned().map((e) => e.note.id).sort().join());
    check(L + "Taccuino: un aneddoto compare solo per le coppie davvero scambiate", never === "ma-mamma-cavallo,mai-comprare-vendere", never);
    /* la scelta multipla registra la coppia: le opzioni ricordano la parola dietro ognuna */
    const keys = await p.evaluate(() => { if (CP.ex && CP.ex.carica) CP.ex.carica(); const E = CP.exEngine, w = CP.WORDS["马"], r = () => 0.3, out = []; ["mc-parola", "mc-significato", "mc-ascolto"].forEach((id) => { const it = E.REG[id] && E.REG[id].crea(w, E.ctx, r); if (it) out.push({ id, ok: !!it.keys && it.keys.length === it.opts.length && it.keys[it.right] === "马" && new Set(it.keys).size === it.keys.length }); }); return out; });
    check(L + "Esercizi a scelta multipla: ogni opzione ricorda la sua parola (per il Taccuino), la giusta è quella del quesito", keys.length >= 2 && keys.every((k) => k.ok), JSON.stringify(keys));
    /* condivisione: solo se si sceglie, 3 formati × 3 colori, il QR rende l'indirizzo */
    const reqBefore = ext.length;
    const cards = await p.evaluate(async () => {
      const out = [], pg = CP.diary.build().pages[0], d = CP.diary.shareData(pg.notes[0].note.id, pg.i);
      for (const f of Object.keys(CP.shareCard.FORMATS)) for (const th of ["light", "sepia", "dark"]) {
        const cv = document.createElement("canvas"); await CP.shareCard.render(cv, "zh-diary", Object.assign({}, d, { name: "小明" }), { format: f, theme: th });
        const img = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height), q = window.jsQR(img.data, cv.width, cv.height);
        out.push({ k: f + " " + th, w: cv.width, h: cv.height, cut: cv.__cut.length, qr: q ? q.data : null });
      }
      const e = CP.diary.shareData("", 0), cv2 = document.createElement("canvas"); await CP.shareCard.render(cv2, "zh-diary", e, { format: "4:5", theme: "light" }); out.push({ k: "senza aneddoto", w: cv2.width, h: cv2.height, cut: cv2.__cut.length, qr: "x" });
      return { out, url: CP.shareCard.url() };
    });
    const badC = cards.out.filter((c) => c.cut || (c.qr !== cards.url && c.qr !== "x") || c.w !== 1080);
    check(L + "Pagina del taccuino come immagine: 3 formati × 3 colori (e una pagina senza aneddoto), nessun testo tagliato, il QR rende esattamente l'indirizzo", cards.out.length === 10 && !badC.length && cards.out.some((c) => c.h === 1920), JSON.stringify(badC.slice(0, 2)));
    await p.click("[data-diary-share]"); await p.waitForTimeout(700);
    const sh = await p.evaluate(() => ({ cv: !!document.querySelector(".card-cv"), alt: (document.querySelector(".card-cv") || { getAttribute: () => "" }).getAttribute("aria-label"), signOff: !document.getElementById("card-sign").checked && document.getElementById("card-name").hidden, main: document.querySelector("[data-famclose]").parentElement.parentElement.querySelectorAll(".btn-main").length }));
    const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 4000 }).catch(() => null), p.click("[data-card-share]")]);
    check(L + "Taccuino: la carta si apre solo dal tocco su «Condividi questa pagina», con testo alternativo, «firma» spenta e un solo pulsante principale; senza condivisione di file si scarica il PNG", sh.cv && /Xi'an|西安/.test(sh.alt) && sh.signOff && sh.main === 1 && !!dl && /zh-diary\.png$/.test(dl.suggestedFilename()), JSON.stringify(sh) + " " + (dl ? dl.suggestedFilename() : "nessun download"));
    check(L + "Taccuino: nessuna richiesta di rete e nessun errore JavaScript", !errs.length && !ext.length && ext.length === reqBefore, (errs[0] || "") + ext.slice(0, 2).join(" "));
    await ctx.close();
  }
  /* Laboratorio dei radicali (Frasi → Impara → Radicali): apertura, una reazione riuscita, una a vuoto, il trascinamento, il
     movimento ridotto e la carta da condividere; nessuna richiesta di rete */
  {
    const open = async (p) => { await p.click("#tab-build"); await p.click('[data-group="learn"]'); await p.click('[data-sub="rad"]'); await p.waitForSelector("#lr-root"); };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}'); localStorage.setItem("cp-music", "0"); });
    const p = await ctx.newPage(); const errs = [], net = []; p.on("pageerror", (e) => errs.push(e.message));
    p.on("request", (r) => { if (/^https?:/.test(r.url())) net.push(r.url()); });
    await p.goto(pathToFileURL(file).href); await p.waitForTimeout(600);
    const before = await p.evaluate(() => !!(window.CP && CP.labRad));
    await open(p);
    const o = await p.evaluate(() => ({ el: document.querySelectorAll(".lr-el").length, slots: document.querySelectorAll(".lr-slot").length, cnt: CP.labRad.count(), tot: CP.labRad.total(), main: Array.from(document.querySelectorAll(".btn-main")).filter((e) => e.offsetParent).length }));
    check("Laboratorio dei radicali: si apre da Frasi → Impara → Radicali (gruppo caricato solo ora), mensola con 18 elementi, due posti, contatore a zero, nessun pulsante primario", !before && o.el === 18 && o.slots === 2 && o.cnt === 0 && o.tot > 1000 && o.main === 0, JSON.stringify(o));
    /* una reazione riuscita: 女 + 子 = 好 */
    await p.click('[data-lr-el="女"]'); await p.click('[data-lr-el="子"]'); await p.waitForSelector("#lr-out.ok", { timeout: 4000 });
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => { const t = document.getElementById("lr-outwrap").innerText; return { t, strokes: document.querySelectorAll("#lr-out .lr-svg path").length, cnt: CP.labRad.count(), saved: JSON.parse(localStorage.getItem("cp-labrad-v1") || "{}").f, main: Array.from(document.querySelectorAll(".btn-main")).filter((e) => e.offsetParent).length }; });
    check("Laboratorio dei radicali: 女 + 子 reagiscono: compare 好 con pinyin, significato, i suoi 6 tratti, la lettura simpatica dichiarata «non etimologia», contatore a 1 e scoperta salvata, un solo pulsante primario", /好/.test(r.t) && /hǎo/.test(r.t) && /bene/.test(r.t) && /non etimologia/.test(r.t) && r.strokes === 6 && r.cnt === 1 && r.saved && r.saved["好"] > 0 && r.main === 1, JSON.stringify(r).slice(0, 300));
    /* una reazione a vuoto: 火 + 心, una battuta gentile e nessuna penalità */
    await p.click("[data-lr-clear]"); await p.click('[data-lr-el="火"]'); await p.click('[data-lr-el="心"]'); await p.waitForSelector("#lr-out.no", { timeout: 4000 });
    const n = await p.evaluate(() => ({ t: document.getElementById("lr-outwrap").innerText, cnt: CP.labRad.count(), xp: CP.game.rank().xp, main: Array.from(document.querySelectorAll(".btn-main")).filter((e) => e.offsetParent).length }));
    check("Laboratorio dei radicali: 火 + 心 non reagiscono: una battuta gentile, contatore e punti invariati, niente pulsante primario", /Nessuna reazione/.test(n.t) && n.cnt === 1 && n.xp === 0 && n.main === 0, JSON.stringify(n).slice(0, 240));
    /* trascinamento con il mouse: 日 sul primo posto, 月 sul secondo */
    await p.click("[data-lr-clear]"); await p.evaluate(() => window.scrollTo(0, 300)); await p.waitForTimeout(100);
    const drag = async (sel, tsel) => { const a = await (await p.$(sel)).boundingBox(), t = await (await p.$(tsel)).boundingBox(); await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down(); await p.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 - 40, { steps: 4 }); await p.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 8 }); await p.mouse.up(); };
    await drag('[data-lr-el="日"]', '[data-lr-slot="0"]'); await drag('[data-lr-el="月"]', '[data-lr-slot="1"]'); await p.waitForSelector("#lr-out.ok", { timeout: 4000 });
    const d = await p.evaluate(() => ({ t: document.getElementById("lr-outwrap").innerText, cnt: CP.labRad.count(), ghost: document.querySelectorAll(".lr-ghost").length }));
    check("Laboratorio dei radicali: trascinando 日 e 月 sul banco nasce 明 (contatore a 2, nessun fantasma del trascinamento rimasto)", /明/.test(d.t) && /a domani/.test(d.t) && d.cnt === 2 && d.ghost === 0, JSON.stringify(d).slice(0, 240));
    /* i composti scoperti tornano sulla mensola: 木 + 木 = 林, poi 木 + 林 = 森 */
    await p.click("[data-lr-clear]"); await p.click('[data-lr-el="木"]'); await p.click('[data-lr-el="木"]'); await p.waitForSelector("#lr-out.ok", { timeout: 4000 });
    await p.click("[data-lr-clear]"); await p.click('[data-lr-el="木"]'); await p.click('#lr-comp [data-lr-el="林"]'); await p.waitForFunction(() => /森/.test(document.getElementById("lr-outwrap").innerText), null, { timeout: 4000 });
    check("Laboratorio dei radicali: 林 scoperto torna sulla mensola come composto e con 木 dà 森 (contatore a 4)", await p.evaluate(() => CP.labRad.count() === 4));
    /* la carta da condividere */
    await p.click("[data-lr-share]"); await p.waitForSelector(".card-cv", { timeout: 4000 }); await p.waitForTimeout(600);
    const cd = await p.evaluate(() => { const c = document.querySelector(".card-cv"), x = c.getContext("2d"), px = x.getImageData(0, 0, c.width, c.height).data; let ink = 0; for (let i = 0; i < px.length; i += 4 * 97) if (px[i] < 120 && px[i + 1] < 120) ink++; return { w: c.width, h: c.height, ink, alt: c.getAttribute("aria-label"), cut: (c.__cut || []).length, qr: !!c.__qr }; });
    check("Laboratorio dei radicali: la carta della scoperta (motore di ui/share-card.js, 3:4) è disegnata, senza testo tagliato e con il QR", cd.w === 1080 && cd.h === 1440 && cd.ink > 300 && cd.cut === 0 && cd.qr && /森/.test(cd.alt), JSON.stringify(cd));
    /* si ricorda dopo il ricaricamento */
    await p.reload(); await p.waitForTimeout(500); await open(p);
    check("Laboratorio dei radicali: le scoperte restano dopo il ricaricamento e compaiono nella collezione", await p.evaluate(() => CP.labRad.count() === 4 && document.querySelectorAll(".lr-fc").length === 4));
    check("Laboratorio dei radicali: nessuna richiesta di rete, nessun errore JavaScript", !net.length && !errs.length, (net[0] || "") + (errs[0] || ""));
    await ctx.close();
    /* movimento ridotto: la reazione compare subito, senza classi d'animazione, e i tratti sono già disegnati */
    const rc = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await rc.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}'); localStorage.setItem("cp-music", "0"); });
    const q = await rc.newPage(); await q.goto(pathToFileURL(file).href); await q.waitForTimeout(500); await open(q);
    await q.click('[data-lr-el="人"]'); await q.click('[data-lr-el="木"]'); await q.waitForSelector("#lr-out.ok", { timeout: 2000 });
    const rm = await q.evaluate(() => ({ fresh: !!document.querySelector("#lr-out.fresh"), go: !!document.querySelector("#lr-out .lr-svg.go"), merge: !!document.querySelector(".lr-bench.merge"), off: getComputedStyle(document.querySelector("#lr-out .lr-svg path")).strokeDashoffset, t: document.getElementById("lr-outwrap").innerText }));
    check("Laboratorio dei radicali: con il movimento ridotto 人 + 木 = 休 compare subito, senza animazioni, con i tratti già disegnati", /休/.test(rm.t) && !rm.fresh && !rm.go && !rm.merge && parseFloat(rm.off) === 0, JSON.stringify(rm).slice(0, 240));
    await rc.close();
    /* interfaccia in cinese: stesse chiavi, nessuna chiave nuda */
    const zc = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await zc.addInitScript(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}'); localStorage.setItem("cp-music", "0"); localStorage.setItem("cp-lang", "zh"); });
    const z = await zc.newPage(); await z.goto(pathToFileURL(file).href); await z.waitForTimeout(500); await open(z);
    await z.click('[data-lr-el="女"]'); await z.click('[data-lr-el="子"]'); await z.waitForSelector("#lr-out.ok", { timeout: 4000 }); await z.waitForTimeout(600);
    const zt = await z.evaluate(() => document.getElementById("lr-root").innerText);
    check("Laboratorio dei radicali: in cinese compaiono titolo, lettura e dicitura «不是字源», nessuna chiave senza traduzione", /部件实验室/.test(zt) && /不是字源/.test(zt) && /好/.test(zt) && !/\blr\.[a-z]/i.test(zt), zt.slice(0, 160).replace(/\n/g, " "));
    await zc.close();
  }
  /* Foglio di lavoro in PDF: da Studia (cinese) e da «我的进步» (italiano). Si prova con un profilo con errori, con un profilo nuovo
     (foglio di benvenuto) e con il corso di italiano: anteprima, PDF di 2 pagine sotto 1 MB, struttura del PDF (immagini, quadrati
     con griglia tratteggiata, QR in vettoriale), QR riletto con jsQR, nessuna richiesta di rete, collegamento profondo #dettato=. */
  {
    const pdfStats = (b64) => {
      const s = Buffer.from(b64, "base64").toString("latin1");
      return { pages: (s.match(/\/Type\s*\/Page(?![s\w])/g) || []).length, images: (s.match(/\/Subtype\s*\/Image/g) || []).length, filled: (s.match(/\bre\nf\b/g) || []).length, stroked: (s.match(/\bre\nS\b/g) || []).length,
        dashed: (s.match(/\[[\d. ]+\] [\d.]+ d\b/g) || []).length, head: s.slice(0, 5) };
    };
    const profile = {
      errors: () => {
        const S = CP.S(), ks = CP.ORDER.slice(0, 120);
        ks.forEach((k, i) => { S[k] = { n: 3 + i % 4, rp: 3, lp: i % 7 === 0 ? 3 : i % 5 === 0 ? 1 : 0, sd: 2, st: 5 }; });
        localStorage.setItem("cp-srs-v1", JSON.stringify(S));
        const ex = { ex: {} }; ks.slice(10, 30).forEach((k, i) => { ex.ex[k] = { mc: { n: 5, ok: 5 - (1 + i % 3), ultimo: Date.now() } }; });
        localStorage.setItem("cp-ex-v1", JSON.stringify(ex));
        localStorage.setItem("cp-ear-v1", JSON.stringify({ m: [[4, 2, 0, 0], [3, 2, 5, 0], [0, 4, 3, 5], [0, 0, 4, 6]], n: 38 }));
        const days = {}, d = new Date(); ks.slice(60, 75).forEach((k, i) => { const dd = new Date(d - (i % 5) * 864e5), key = dd.getFullYear() + "-" + (dd.getMonth() + 1) + "-" + dd.getDate(); (days[key] = days[key] || { w: [] }).w.push(k); });
        localStorage.setItem("cp-game-v1", JSON.stringify({ xp: 500, base: 0, xpBy: {}, goal: 10, days, best: 0, pl: {} }));
      },
      fresh: () => {},
      it: () => {
        localStorage.setItem("cp-course", "it"); localStorage.setItem("cp-lang", "zh");
      }
    };
    for (const kind of ["errors", "fresh", "it"]) {
      const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
      const p = await ctx.newPage(), errs = [], ext = [];
      p.on("pageerror", (e) => errs.push(e.message)); p.on("request", (r) => { const u = r.url(); if (!u.startsWith(base) && !/^(data|blob):/.test(u)) ext.push(u); });
      await p.goto(base); await p.evaluate(() => localStorage.setItem("cp-ux-v1", '{"onboarded":1,"unlocked":1}')); await p.evaluate(profile[kind]); await p.reload();
      await p.waitForFunction(() => window.CP && CP.build);
      if (kind === "it") {
        await p.waitForFunction(() => window.CP && CP.itApi); await p.waitForTimeout(500);
        await p.evaluate(() => {
          const lex = CP.itApi.lex(), S = {}, ex = { ex: {} };
          lex.slice(0, 60).forEach((e) => { S[e.id] = { c: { state: 3, step: 0, st: 3, df: 8, due: Date.now(), last: Date.now() }, n: 3, lr: Date.now() }; });
          lex.slice(0, 40).forEach((e, i) => { if (i % 3 === 0) ex.ex[e.id] = { mc: { n: 4, ok: 2, ultimo: Date.now() } }; });
          localStorage.setItem("cp-it-srs-v1", JSON.stringify(S)); localStorage.setItem("cp-ex-v1", JSON.stringify(ex));
        });
        await p.reload(); await p.waitForFunction(() => window.CP && CP.itApi); await p.waitForTimeout(500);
        await p.click("text=我的进步"); await p.waitForTimeout(300);
      } else { await p.evaluate(() => document.getElementById("tab-study").click()); await p.waitForTimeout(300); }
      const btn = await p.$("[data-ws-open]"), primary = await p.evaluate(() => { const sh = document.querySelector(".fam-head"), root = sh ? sh.parentElement : document; return Array.from(root.querySelectorAll(".btn-main")).filter((b) => b.offsetParent).length; });
      check("Foglio di lavoro (" + kind + "): il pulsante «Crea il foglio di lavoro» c'è ed è secondario (un solo pulsante pieno per schermata)", !!btn && primary <= 1, "pieni visibili: " + primary);
      const bootHasLib = await p.evaluate(() => !!window.jspdf);
      check("Foglio di lavoro (" + kind + "): la libreria PDF non è caricata all'avvio", !bootHasLib);
      await btn.click(); await p.waitForSelector("[data-ws-page]", { timeout: 30000 });
      const prev = await p.evaluate(() => ({ n: document.querySelectorAll("[data-ws-page]").length, info: (document.getElementById("ws-info") || {}).textContent || "", save: !!document.querySelector("[data-ws-save]"), lib: !!window.jspdf }));
      check("Foglio di lavoro (" + kind + "): l'anteprima mostra le pagine, la dimensione e «Salva il PDF»; la libreria si è caricata al primo uso", prev.n >= 1 && prev.n <= 2 && /KB/.test(prev.info) && prev.save && prev.lib, JSON.stringify(prev));
      const r = await p.evaluate(async () => {
        const o = await CP.worksheetUI.build({ compress: false }), c = await CP.worksheetUI.build({ ppm: 12 });
        let s = ""; for (let i = 0; i < o.bytes.length; i += 32768) s += String.fromCharCode.apply(null, o.bytes.subarray(i, i + 32768));
        let z = ""; const real = await CP.worksheetUI.build(); for (let i = 0; i < real.bytes.length; i += 32768) z += String.fromCharCode.apply(null, real.bytes.subarray(i, i + 32768));
        const cv = c.pages[0], im = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height), q = window.jsQR(im.data, cv.width, cv.height, { inversionAttempts: "dontInvert" });
        return { raw: btoa(s), size: real.bytes.length, pages: real.pages.length, cells: real.cells, boxes: real.boxes, items: real.items.map((x) => x.id), fresh: real.meta.fresh, text: real.meta.qrText, read: q ? q.data : null, dec: q ? CP.worksheetUI.decode(q.data) : null, course: real.meta.course, hard: real.items.filter((x) => (CP.S()[x.id] || {}).lp === 3).length };
      });
      const st = pdfStats(r.raw);
      check("Foglio di lavoro (" + kind + "): PDF di " + r.pages + " pagine sotto 1 MB", st.head === "%PDF-" && st.pages === r.pages && r.pages >= (kind === "fresh" ? 1 : 2) && r.size < 1024 * 1024, st.pages + " pagine, " + Math.round(r.size / 1024) + " KB");
      check("Foglio di lavoro (" + kind + "): nel PDF ci sono le immagini dei testi, i quadrati" + (kind === "it" ? " dei quadretti" : " con griglia tratteggiata") + " e il QR in vettoriale",
        st.images > 5 && st.stroked >= (kind === "it" ? r.boxes : r.cells) && st.filled >= 40 && (kind === "it" || (r.cells >= 100 && st.dashed >= r.cells)), JSON.stringify(st) + " celle " + r.cells + " quadretti " + r.boxes);
      check("Foglio di lavoro (" + kind + "): il QR, riletto con jsQR, è il collegamento #dettato= con le parole del foglio", r.read === r.text && /#dettato=MDD1-/.test(r.read) && r.dec && r.dec.c === (kind === "it" ? "it" : "zh") && r.dec.ids.length === r.items.length && r.dec.ids.every((x, i) => x === r.items[i]), String(r.read).slice(0, 80));
      if (kind === "errors") check("Foglio di lavoro (errori): ci sono le parole con più lapsus e quelle delle ultime lezioni", r.fresh === false && r.hard >= 3, r.items.slice(0, 6).join(","));
      if (kind === "fresh") check("Foglio di lavoro (profilo nuovo): foglio di benvenuto con i primi caratteri", r.fresh === true && r.items.length >= 6, r.items.slice(0, 8).join(","));
      /* collegamento profondo: il frammento si toglie dall'indirizzo e si apre il dettato */
      const code = r.text.split("#dettato=")[1];
      await p.goto(base + "#dettato=" + code); await p.reload(); await p.waitForSelector("[data-ws-d=start]", { timeout: 15000 });
      const dd = await p.evaluate(() => ({ hash: location.hash, title: (document.querySelector(".fam-head b") || {}).textContent || "" }));
      check("Foglio di lavoro (" + kind + "): il link #dettato= apre il dettato e toglie il frammento dall'indirizzo", dd.hash === "" && /听写|Dettato/.test(dd.title), JSON.stringify(dd));
      await p.click("[data-ws-d=start]"); await p.waitForTimeout(200);
      const dn = await p.evaluate(() => ({ n: (document.querySelector(".chal-n") || {}).textContent || "", play: !!document.querySelector("[data-ws-d=play]"), show: !!document.querySelector("[data-ws-d=show]") }));
      check("Foglio di lavoro (" + kind + "): il dettato parte dalla prima parola, con «Ascolta» e «Mostra»", /1/.test(dn.n) && dn.play && dn.show, JSON.stringify(dn));
      check("Foglio di lavoro (" + kind + "): nessuna richiesta di rete e nessun errore JavaScript", !ext.length && !errs.length, ext.concat(errs)[0]);
      await ctx.close();
    }
  }
  /* microfono: un errore passeggero del riconoscitore (servizio occupato) si ritenta una volta, in silenzio, e non spegne il riconoscimento */
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, permissions: ["microphone"] });
    await ctx.addInitScript(() => {
      window.__srStarts = 0;
      function FakeSR() { this.onresult = this.onerror = this.onend = null; }
      FakeSR.prototype.start = function () {
        const me = this, n = ++window.__srStarts;
        setTimeout(() => {
          if (n === 1) { me.onerror && me.onerror({ error: "service-not-allowed" }); me.onend && me.onend(); }
          else { me.onresult && me.onresult({ results: [[{ transcript: "我" }]] }); me.onend && me.onend(); }
        }, 30);
      };
      FakeSR.prototype.stop = FakeSR.prototype.abort = function () {};
      window.SpeechRecognition = window.webkitSpeechRecognition = FakeSR;
    });
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); }); await p.reload(); await p.waitForTimeout(600);
    const r = await p.evaluate(() => new Promise((ok) => { CP.listen("我", (o) => ok({ o, starts: window.__srStarts, down: CP._srDown || null })); }));
    check("Microfono: un errore passeggero del riconoscitore si ritenta e il risultato arriva", r.o.ok === true && r.starts === 2 && !r.down, JSON.stringify(r));
    check("Microfono: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* voce online accesa ma muta (limite del servizio, rete assente): si legge con la voce del telefono e per 5 minuti non si riprova */
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
    await ctx.addInitScript(() => {
      window.__said = []; window.__audioTries = 0;
      const fake = { speaking: false, pending: false, cancel() {}, getVoices() { return []; }, addEventListener() {}, onvoiceschanged: null,
        speak(u) { window.__said.push(u.text); setTimeout(() => u.onstart && u.onstart(), 5); setTimeout(() => u.onend && u.onend(), 20); } };
      Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
      window.Audio = function () { window.__audioTries++; const a = { play() { setTimeout(() => a.onerror && a.onerror(), 5); return Promise.resolve(); }, pause() {} }; return a; };
    });
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(base); await p.evaluate(() => { localStorage.setItem("cp-ux-v1", '{"onboarded":1}'); }); await p.reload(); await p.waitForTimeout(600);
    const r = await p.evaluate(async () => {
      CP.setPref("alt", true);
      const one = () => new Promise((ok) => CP.speak("你好", { noClip: true, onEnd: ok }));
      await one(); const afterFirst = { said: window.__said.length, tries: window.__audioTries };
      await one(); return { afterFirst, said: window.__said.length, tries: window.__audioTries };
    });
    check("Voce online muta: si passa alla voce del telefono e per 5 minuti non si riprova", r.afterFirst.tries === 1 && r.afterFirst.said === 1 && r.tries === 1 && r.said === 2, JSON.stringify(r));
    check("Voce online muta: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
  /* 8. Impostazioni a pagine: cinque carte, ogni voce di prima raggiungibile, due livelli, ricerca, Esc e «Indietro» di Android, in tutti e due i corsi e le due lingue */
  {
    /* l'elenco di prima (quattro gruppi con sezioni annidate), voce per voce: id della sezione, pagina in cui sta ora, un comando che deve esserci */
    const VOCI = [
      ["set-look", "look", "[data-theme-set=sepia]"], ["set-look", "look", "#hz-plus"], ["set-look", "look", "#opt-toneshapes"], ["set-lang", "look", "[data-lang-set=zh]"],
      ["set-sound", "sound", "[data-audio-set=fx]"], ["set-sound", "sound", "#set-sfxvol"], ["set-sound", "sound", "#set-music"], ["vset", "sound", "#vset-body"], ["set-mic-box", "sound", "#set-mic-close"],
      ["set-course", "study", "[data-course-set=it]"], ["set-exstyle", "study", "[data-exs=guided]"], ["set-level", "study", "[data-unl-redo]"], ["set-level", "study", "#opt-showall"], ["set-reminder", "study", "#rm-body"], ["set-together", "study", "[data-chal-open]"],
      ["set-data", "data", "#set-bk-down"], ["set-data", "data", "#set-bk-up"], ["set-sync", "data", "#sy-body"], ["set-contrib", "data", "[data-ct-find]"],
      ["set-about", "info", "#set-welcome"], ["set-about", "info", "#set-selftest"], ["set-about", "info", "[data-credits]"], ["set-news", "info", ".news-list"], ["set-privacy", "info", ".pv-list"], ["set-support", "info", "#set-support .vbody"]
    ];
    for (const [course, lang] of [["zh", "it"], ["zh", "zh"], ["it", "it"], ["it", "zh"]]) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
      await ctx.addInitScript(([c, l]) => { localStorage.setItem("cp-ux-v1", '{"onboarded":1,"showAll":1}'); localStorage.setItem("cp-it-welcome", "1"); localStorage.setItem("cp-course", c); localStorage.setItem("cp-lang", l); }, [course, lang]);
      await p.goto(base); await p.waitForTimeout(700);
      const tag = " (" + course + "/" + lang + ")";
      await p.evaluate(() => CP.openSettings()); await p.waitForTimeout(150);
      const home = await p.evaluate(() => ({ tiles: document.querySelectorAll("#set-tiles .set-tile").length, pagesShown: [...document.querySelectorAll("[data-set-page]")].filter((x) => !x.hidden).length, details: document.querySelectorAll("#settings details.set-sec, #settings details.set-grp").length, raw: /set\.p\./.test(document.getElementById("settings").innerText), title: document.getElementById("set-title").textContent, back: document.querySelector("[data-set-back]").hidden }));
      check("Impostazioni: la pagina iniziale ha cinque carte e la ricerca, nessuna pagina aperta, nessuna sezione a cascata, testi nella lingua scelta" + tag, home.tiles === 5 && !home.pagesShown && !home.details && !home.raw && home.back && (lang === "zh" ? /设置/.test(home.title) : /Impostazioni/.test(home.title)), JSON.stringify(home));
      const missing = [];
      for (const [id, page, sel] of VOCI) {
        if (course === "it" && (id === "set-contrib")) continue;   /* nel corso di italiano i contributi non ci sono (come prima) */
        const r = await p.evaluate(([i, pg, s]) => {
          CP.openSettings(i); const sec = document.getElementById(i); if (!sec) return "manca la sezione";
          const hostPage = sec.closest("[data-set-page]"); if (!hostPage || hostPage.getAttribute("data-set-page") !== pg) return "pagina " + (hostPage && hostPage.getAttribute("data-set-page"));
          if (hostPage.hidden) return "pagina nascosta"; if (!document.getElementById("set-home").hidden) return "la pagina iniziale resta visibile";
          const c = sec.querySelector(s) || (sec.matches(s) ? sec : null); if (!c) return "manca il comando " + s;
          if (c.closest("details:not([open])")) return "dentro un riquadro chiuso"; return "";
        }, [id, page, sel]);
        if (r) missing.push(id + " " + sel + ": " + r);
      }
      check("Impostazioni: ogni voce di prima è raggiungibile con un solo passo dalla pagina iniziale (" + VOCI.length + " voci controllate)" + tag, !missing.length, missing.slice(0, 4).join(" | "));
      /* vecchi nomi dei gruppi e sezioni assenti: aprono la pagina giusta */
      const al = await p.evaluate(() => ["grp-ess", "grp-data", "grp-adv", "grp-info", "set-export", "page-sound"].map((g) => { CP.openSettings(g); const v = [...document.querySelectorAll("[data-set-page]")].filter((x) => !x.hidden).map((x) => x.getAttribute("data-set-page")); return g + ":" + v.join(","); }).join(" "));
      check("Impostazioni: i vecchi collegamenti (grp-ess, grp-data, grp-adv, grp-info, set-export) aprono la pagina giusta" + tag, al === "grp-ess:look grp-data:data grp-adv:study grp-info:info set-export:data page-sound:sound", al);
      /* un solo pulsante primario in ogni pagina */
      const prim = await p.evaluate(() => ["look", "sound", "study", "data", "info"].map((g) => { CP.openSettings(g); return g + ":" + [...document.querySelectorAll("#settings .btn-main")].filter((b) => b.offsetParent && b.getBoundingClientRect().height > 0).length; }).join(" "));
      check("Impostazioni: al massimo un pulsante primario per pagina" + tag, prim.split(" ").every((x) => +x.split(":")[1] <= 1), prim);
      /* ricerca */
      await p.evaluate(() => CP.openSettings()); await p.fill("#set-q", lang === "zh" ? "备份" : "Backup"); await p.waitForTimeout(100);
      const hit = await p.evaluate(() => ({ tilesHidden: document.getElementById("set-tiles").hidden, ids: [...document.querySelectorAll("#set-hits [data-set-goto]")].map((b) => b.getAttribute("data-set-goto")) }));
      await p.click('#set-hits [data-set-goto="set-data"]'); await p.waitForTimeout(150);
      const after = await p.evaluate(() => ({ page: [...document.querySelectorAll("[data-set-page]")].filter((x) => !x.hidden).map((x) => x.getAttribute("data-set-page")).join(), q: document.getElementById("set-q").value, focus: document.activeElement && document.activeElement.hasAttribute("data-set-back") }));
      check("Impostazioni: la ricerca trova «Backup» (anche in cinese), il risultato apre la pagina giusta" + tag, hit.tilesHidden && hit.ids.includes("set-data") && after.page === "data" && after.q === "" && after.focus, JSON.stringify({ hit, after }));
      const none = await p.evaluate(() => { CP.openSettings(); const q = document.getElementById("set-q"); q.value = "zzzqqq"; q.dispatchEvent(new Event("input", { bubbles: true })); return document.getElementById("set-hits").textContent.trim().length > 5 && !document.querySelector("#set-hits [data-set-goto]"); });
      check("Impostazioni: una ricerca senza risultati lo dice" + tag, none);
      /* Esc e Indietro di Android: pagina → pagina iniziale → chiusa */
      await p.evaluate(() => CP.openSettings("data")); await p.keyboard.press("Escape"); await p.waitForTimeout(80);
      const e1 = await p.evaluate(() => ({ open: !document.getElementById("settings").hidden, home: !document.getElementById("set-home").hidden }));
      await p.keyboard.press("Escape"); await p.waitForTimeout(80);
      const e2 = await p.evaluate(() => !document.getElementById("settings").hidden);
      await p.evaluate(() => CP.openSettings("sound")); const b1 = await p.evaluate(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); return !document.getElementById("settings").hidden && !document.getElementById("set-home").hidden; });
      const b2 = await p.evaluate(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); return !document.getElementById("settings").hidden; });
      await p.evaluate(() => { CP.openSettings("sound"); document.querySelector("[data-set-back]").click(); }); const bk = await p.evaluate(() => !document.getElementById("set-home").hidden && document.getElementById("set-title").textContent);
      check("Impostazioni: Esc e il tasto Indietro di Android (che per l'app è lo stesso Esc, android.js) tornano dalla pagina alla pagina iniziale e poi chiudono; «Indietro» a schermo torna alla pagina iniziale" + tag, e1.open && e1.home && !e2 && b1 && !b2 && bk, JSON.stringify({ e1, e2, b1, b2, bk }));
      check("Impostazioni: nessun errore JavaScript" + tag, !errs.length, errs[0]);
      await ctx.close();
    }
  }
} finally {
  await browser.close(); server.close();
}
const ko = results.filter((r) => !r.ok);
console.log("\n" + (results.length - ko.length) + "/" + results.length + " prove superate.");
process.exit(ko.length ? 1 : 0);
