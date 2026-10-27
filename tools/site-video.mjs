#!/usr/bin/env node
/* màndarínō · le clip dell'app per il sito: pochi secondi in loop, registrati sull'app vera (dist/index.html) in un telefono
   di 390×800 con un profilo nuovo. Uso, dopo node tools/build.mjs:

     node tools/site-video.mjs [nome …]      senza nomi: tutte le clip
       nomi: hero, parole, ripasso, toni, frasi, dati, itparole, itconiuga, itfrasi, itripasso, italiano

   Scrive docs/img/clip-<nome>.mp4 (H.264, 390×800, senza audio, circa 0,05-0,3 MB) e docs/img/clip-<nome>.jpg (il primo fotogramma,
   per il poster). Servono Playwright (devDependency) e ffmpeg nel PATH: sono strumenti da sviluppo, i file stanno nel
   repository, così il sito funziona senza rilanciarli. Rilanciare quando l'aspetto dell'app cambia molto. */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";
import { spawnSync } from "child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = path.join(ROOT, "docs/img");
const W = 390, H = 800;

/* ogni clip: profilo (localStorage prima dell'avvio) e i passi. h.mark() fissa il punto da cui parte il video. */
const BASE = { "cp-ux-v1": JSON.stringify({ onboarded: 1, unlv: 1, unl: { words: 1, build: 1 } }) };
const CLIPS = {
  /* il cuore dell'app: la carta «Continua», le parole nuove, la prima domanda */
  hero: { storage: BASE, steps: async (p, h) => {
    await h.wait(1500); await h.tap(".btn-main"); await h.wait(1500);
    for (let i = 0; i < 14 && (await h.has("#next")); i++) { await h.tap("#next"); await h.wait(1000); }
    await h.wait(1200); await h.tapText(".ex-opt", /w[ǒo]$/); await h.wait(2200);
  } },
  /* la tabella delle parole e il foglio di una parola */
  parole: { storage: BASE, steps: async (p, h) => {
    await h.tap("#tab-words"); await h.wait(1200); await h.scroll(300); await h.wait(900); await h.scroll(-300); await h.wait(800);
    await h.type("#q", "cha", 260); await h.wait(1700); await h.clear("#q"); await h.type("#q", "gatto", 220); await h.wait(2000);
  } },
  /* il ripasso con scelta multipla */
  ripasso: { storage: BASE, steps: async (p, h) => {
    await h.tap("#tab-study"); await h.wait(800); await h.tap("#go"); await h.wait(1200);
    for (let i = 0; i < 14 && (await h.has("#next")); i++) { await h.tap("#next"); await h.wait(450); }
    h.mark(); await h.wait(1500); await h.tapText(".ex-opt", /w[ǒo]$/); await h.wait(2000);
  } },
  /* l'orecchio ai toni */
  toni: { storage: BASE, steps: async (p, h) => {
    await h.tap("#tab-study"); await h.wait(1000); await h.tap("#ear-open"); await h.wait(1800);
    await h.tap(".btn-main"); await h.wait(1400); await h.tap(".t3"); await h.wait(2200);
  } },
  /* Frasi: le strade e un dialogo */
  frasi: { storage: BASE, steps: async (p, h) => {
    await h.tap("#tab-build"); await h.wait(1300); await h.scroll(260); await h.wait(900); await h.scroll(-260); await h.wait(500);
    await h.tapText(".fr-card", /Parla/); await h.wait(1600); await h.scroll(240); await h.wait(900); await h.tap(".dlg-card"); await h.wait(3200);
  } },
  /* i dati restano tuoi: sincronizzazione e backup nelle impostazioni */
  dati: { storage: BASE, steps: async (p, h) => {
    await h.wait(1000); await p.evaluate(() => CP.openSettings("grp-data")); await h.wait(2400); await h.scrollSheet(300); await h.wait(2200);
  } },
  /* il corso di italiano: parole, coniugazioni, frasi e ripasso (con tutte le schede aperte) */
  itparole: { storage: { ...BASE, "cp-ux-v1": JSON.stringify({ onboarded: 1, unlv: 1, showAll: 1 }), "cp-course": "it", "cp-lang": "zh", "cp-it-welcome": "1" }, steps: async (p, h) => {
    await h.wait(1200); await h.tapText(".dtab", /单词/); await h.wait(1500); await h.scroll(320); await h.wait(1300); await h.scroll(-320); await h.wait(1500);
  } },
  itconiuga: { storage: { ...BASE, "cp-ux-v1": JSON.stringify({ onboarded: 1, unlv: 1, showAll: 1 }), "cp-course": "it", "cp-lang": "zh", "cp-it-welcome": "1" }, steps: async (p, h) => {
    await h.wait(1200); await h.tapText(".dtab", /变位/); await h.wait(1800); await h.scroll(300); await h.wait(1500); await h.scroll(-300); await h.wait(1200);
  } },
  itfrasi: { storage: { ...BASE, "cp-ux-v1": JSON.stringify({ onboarded: 1, unlv: 1, showAll: 1 }), "cp-course": "it", "cp-lang": "zh", "cp-it-welcome": "1" }, steps: async (p, h) => {
    await h.wait(1200); await h.tapText(".dtab", /句子/); await h.wait(1800); await h.scroll(300); await h.wait(1500); await h.scroll(-300); await h.wait(1200);
  } },
  itripasso: { storage: { ...BASE, "cp-ux-v1": JSON.stringify({ onboarded: 1, unlv: 1, showAll: 1 }), "cp-course": "it", "cp-lang": "zh", "cp-it-welcome": "1" }, steps: async (p, h) => {
    await h.wait(1200); await h.tapText(".dtab", /复习/); await h.wait(1600); await h.tap("[data-itx-learn], .btn-main"); await h.wait(2800);
  } },
  /* il corso di italiano per chi parla cinese: la carta «今天» */
  italiano: { storage: { ...BASE, "cp-course": "it", "cp-lang": "zh", "cp-it-welcome": "1" }, steps: async (p, h) => {
    await h.wait(1500); await h.scroll(420); await h.wait(1300); await h.scroll(-420); await h.wait(900);
    await h.tap(".itd-go"); await h.wait(2800);
  } },
};

const sh = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: "utf8" }); if (r.status !== 0) throw new Error(cmd + " ha fallito: " + (r.stderr || "").slice(-300)); };

async function record(name, c, browser) {
  const tmp = fs.mkdtempSync(path.join(ROOT, "build-clip-"));
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, recordVideo: { dir: tmp, size: { width: W, height: H } } });
  await ctx.addInitScript((kv) => {
    for (const k in kv) localStorage.setItem(k, kv[k]);
    let a = 20261027; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };   /* mulberry32: stesse domande a ogni registrazione */
  }, c.storage);
  const t0 = Date.now(), p = await ctx.newPage();
  await p.goto(pathToFileURL(path.join(ROOT, "dist/index.html")).href); await p.waitForTimeout(c.storage["cp-course"] ? 4800 : 3200);
  await p.evaluate(() => { CP.toast = function () {}; });   /* senza una voce cinese comparirebbe l'avviso «la voce non risponde» */
  let start = (Date.now() - t0) / 1000;
  const visible = (x) => x.getClientRects().length && !x.closest("[hidden]");
  const h = {
    wait: (ms) => p.waitForTimeout(ms),
    mark: () => { start = (Date.now() - t0) / 1000; },
    has: (sel) => p.evaluate((s) => !![...document.querySelectorAll(s)].find((x) => x.getClientRects().length && !x.closest("[hidden]")), sel),
    tap: (sel) => p.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length && !x.closest("[hidden]")); if (el) el.click(); return !!el; }, sel),
    tapText: (sel, re) => p.evaluate(([s, r]) => { const rx = new RegExp(r[0], r[1]); const el = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length && !x.closest("[hidden]") && rx.test(x.textContent.trim())); if (el) el.click(); return !!el; }, [sel, [re.source, re.flags]]),
    type: (sel, text, delay) => p.type(sel, text, { delay }),
    clear: (sel) => p.fill(sel, ""),
    scroll: (dy) => p.evaluate((d) => document.scrollingElement.scrollBy({ top: d, behavior: "smooth" }), dy),
    scrollSheet: (dy) => p.evaluate((d) => { const el = [...document.querySelectorAll("[role=dialog], .sheet, .sheet-body, .sheet-in")].find((x) => x.scrollHeight > x.clientHeight + 20 && x.getClientRects().length); (el || document.scrollingElement).scrollBy({ top: d, behavior: "smooth" }); }, dy),
  };
  await c.steps(p, h);
  const v = p.video(); await ctx.close(); const src = await v.path();
  const mp4 = path.join(IMG, "clip-" + name + ".mp4"), jpg = path.join(IMG, "clip-" + name + ".jpg");
  sh("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(Math.max(0, start - 0.1)), "-i", src, "-an", "-vf", "fps=24", "-c:v", "libx264", "-crf", "27", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
  sh("ffmpeg", ["-loglevel", "error", "-y", "-i", mp4, "-frames:v", "1", "-q:v", "4", jpg]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("✓ docs/img/clip-" + name + ".mp4 · " + Math.round(fs.statSync(mp4).size / 1024) + " KB");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!fs.existsSync(path.join(ROOT, "dist/index.html"))) { console.error("Manca dist/: lancia prima node tools/build.mjs"); process.exit(1); }
  const { chromium } = createRequire(import.meta.url)("playwright");
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CLIPS);
  const browser = await chromium.launch();
  for (const n of names) { if (!CLIPS[n]) { console.error("clip sconosciuta: " + n); continue; } await record(n, CLIPS[n], browser); }
  await browser.close();
}
