#!/usr/bin/env node
/* màndarínō · misura dell'avvio in Chromium con la CPU rallentata (4×, come un telefono lento).
   Per ogni apertura a freddo (profilo nuovo, file://) misura quanto passa prima che la schermata d'avvio sparisca; poi, a
   interfaccia ferma, quanto costa eseguire ogni gruppo caricato al primo uso (ESERCIZI e i moduli di LAZYMOD).
   È il tempo di compilazione ed esecuzione del JavaScript che conta, non i byte (il file è già tutto in locale):
   «avvio: … KB» in tools/unit.mjs ne è solo il sostituto che si controlla ad ogni prova.
   Uso: node tools/misura-avvio.mjs [dist/index.html] [aperture=5] [rallentamento=4] */
import { createRequire } from "module";
import path from "path";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const url = pathToFileURL(path.resolve(process.argv[2] || "dist/index.html")).href, N = +process.argv[3] || 5, rate = +process.argv[4] || 4;
const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
const browser = await chromium.launch(), pronto = [], gruppi = {};
for (let i = 0; i < N; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(), cdp = await ctx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  await p.goto(url, { waitUntil: "commit" });
  pronto.push(await (await p.waitForFunction(() => document.body && !document.getElementById("splash") && performance.now(), null, { timeout: 60000, polling: 20 })).jsonValue());
  await p.waitForTimeout(3000);
  const costi = await p.evaluate(() => {
    const out = {}, t = (n, f) => { const a = performance.now(); try { f(); } catch (e) {} out[n] = performance.now() - a; };
    if (window.__mdLoad) Object.keys(window.__mdLoad).forEach((g) => t(g, () => window.__mdLoad[g]()));
    ["placement", "itCheck", "challenge", "credits", "shareCard", "voiceDl"].forEach((k) => t(k, () => CP[k]));
    return out;
  });
  for (const [k, v] of Object.entries(costi)) (gruppi[k] = gruppi[k] || []).push(v);
  await ctx.close();
}
await browser.close();
console.log(`avvio a freddo (CPU ${rate}×, ${N} aperture): mediana ${Math.round(med(pronto))} ms, min ${Math.round(Math.min(...pronto))}, max ${Math.round(Math.max(...pronto))}`);
for (const [k, v] of Object.entries(gruppi)) console.log(`  primo uso di ${k}: mediana ${med(v).toFixed(1)} ms`);
