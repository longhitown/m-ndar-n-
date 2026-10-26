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
  /* 5. corso di italiano per chi parla cinese */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(pathToFileURL(file).href); await p.waitForTimeout(700);
    const btn = await p.$('#fam [data-course-set="it"]');
    check("Benvenuto: «我是中国人，我想学意大利语»", !!btn);
    if (btn) { await Promise.all([p.waitForNavigation(), btn.click()]); await p.waitForTimeout(700); }
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
      const OK = new Set("strumstick unlicense màndarínō mandarino licenze license claudio longhitano claude code anthropic iphone wikidict wikidata wikipedia dict data drive onedrive dropbox icloud jsqr cozmo apache pages public complete vocabulary javascript hsk xp fsrs pwa github wechat whatsapp email json cloudflare google pinyin android https http apk wifi sim qr ok mb kb app arphic mit makemeahanzi kishore shaunak zafirópulos yanis drkameleon py open spaced repetition cc cedict mdbg morph bologna hunspell libreoffice license kaitim ukai gb pl skishore com org".split(" "));
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
