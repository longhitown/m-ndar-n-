#!/usr/bin/env node
/* màndarínō · prove end-to-end in Chromium (Playwright), §8 del prompt V6.7.
   1. #selftest tutto verde (da file:// e da http://).
   2. PWA su un server http locale: manifest senza errori, installabile, funziona offline, l'avviso
      «Nuova versione disponibile · Aggiorna» compare quando cambia APP_VERSION e rinnova la cache.
   3. Backup → ripristino su un secondo profilo: cp-community-contribs unito per id, cp-srs-v1 dell'altro profilo
      intatto, registro dei ripassi sommato.
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
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
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
    check("Senza riconoscimento vocale il 🎤 resta: «Registra e confronta»", lbl === "Registra e confronta", lbl);
    await p.waitForTimeout(500);
    check("Indicatore 🎙️ col microfono aperto", await p.evaluate(() => !document.getElementById("mic-live").hidden));
    await p.waitForTimeout(4200);
    check("Dopo 3 s la registrazione si riascolta", await p.evaluate(() => { const b = document.querySelector("[data-rec-me]"); return !!b && !b.disabled; }));
    await p.click("#mic-live", { force: true });
    check("Un tocco sull'indicatore chiude il microfono", await p.evaluate(() => !CP.micInfo().live && document.getElementById("mic-live").hidden));
    check("Registra e confronta: nessun errore JavaScript", !errs.length, errs[0]);
    await ctx.close();
  }
} finally {
  await browser.close(); server.close();
}
const ko = results.filter((r) => !r.ok);
console.log("\n" + (results.length - ko.length) + "/" + results.length + " prove superate.");
process.exit(ko.length ? 1 : 0);
