#!/usr/bin/env node
/* màndarínō · le carte del Manifesto (docs/img/manifesto-it.png e manifesto-zh.png, 1080×1350).
   node tools/manifesto-card.mjs
   Stessi colori e stessa impostazione delle carte dell'app (src/ui/share-card.js): sfondo verde, icona, frase grande, firma, indirizzo.
   I PNG stanno nel repository; si rigenerano solo se cambia il testo qui sotto. Serve Playwright (devDependency). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(import.meta.url)("playwright");
const icon = "data:image/svg+xml;base64," + fs.readFileSync(path.join(ROOT, "docs/icon.svg")).toString("base64");

const CARDS = {
  it: { lang: "it", kicker: "Il Manifesto di màndarínō", big: "Gratuita, offline,<br>privata e senza<br>stronzate.", small: "Gratis era, è e sarà l’unica via.", sign: "— Claudio Longhitano", url: "mandarinoapp.org/manifesto.html" },
  zh: { lang: "zh-CN", kicker: "màndarínō 宣言", big: "免费、离线、<br>保护隐私，<br>不整虚的。", small: "免费，过去是、现在是、将来也是唯一的路。", sign: "— Claudio Longhitano", url: "mandarinoapp.org/manifesto.html#中文" }
};
const html = (c) => `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;background:linear-gradient(160deg,#14594A 0%,#0E3F34 100%);color:#F5F7F5;font-family:system-ui,"Segoe UI","PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif;display:flex;flex-direction:column;justify-content:space-between;padding:96px 88px}
img{width:140px;height:140px}
.k{font-size:40px;letter-spacing:.04em;opacity:.8;margin-top:28px}
.big{font-size:${c.lang === "it" ? 104 : 112}px;line-height:1.14;font-weight:800}
.small{text-wrap:balance;font-size:46px;line-height:1.35;margin-top:48px;opacity:.9}
.f span{white-space:nowrap}.f{display:flex;gap:24px;justify-content:space-between;align-items:flex-end;font-size:34px;opacity:.85}
</style><body lang="${c.lang}"><div><img src="${icon}" alt=""><div class="k">${c.kicker}</div></div>
<div><div class="big">${c.big}</div><div class="small">${c.small}</div></div>
<div class="f"><span>${c.sign}</span><span>${c.url.replace(/#.*/, "")}</span></div></body>`;

const browser = await chromium.launch();
try {
  for (const [k, c] of Object.entries(CARDS)) {
    const p = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await p.setContent(html(c)); await p.waitForTimeout(200);
    const out = path.join(ROOT, "docs/img/manifesto-" + k + ".png");
    await p.screenshot({ path: out }); await p.close();
    console.log("✓", path.relative(ROOT, out), fs.statSync(out).size + " byte");
  }
} finally { await browser.close(); }
