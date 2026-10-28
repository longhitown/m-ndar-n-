#!/usr/bin/env node
/* màndarínō · il sito (GitHub Pages), senza dipendenze a parte Playwright per le immagini.

   node tools/site.mjs [--out _site]
     mette insieme il sito: la pagina di presentazione (docs/index.html, docs/icon.svg, docs/img/), privacy.html ricavata
     da PRIVACY.md (sempre allineata, raggiungibile da un indirizzo pubblico: la chiedono gli store) e l'app (dist/) in app/.
     Prima: node tools/build.mjs. Lo usa .github/workflows/pages.yml.

   node tools/site.mjs --assets
     rigenera con Playwright (devDependency) le immagini della pagina: docs/img/anteprima.png (1200×630, per le
     condivisioni) e docs/img/demo.webm (pochi secondi dell'app in un telefono). Da rilanciare quando l'aspetto dell'app
     cambia molto; i file stanno nel repository, così la pagina funziona anche senza questo passo.

   Nessuno script, font, immagine o servizio esterno nella pagina: lo controlla tools/unit.mjs. */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

/* ---------- Markdown minimo → HTML (titoli, paragrafi, elenchi, tabelle, grassetto, codice, link) ---------- */
const escH = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => escH(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/~~([^~]+)~~/g, "<s>$1</s>")
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u.replace(/"/g, "&quot;")}">${t}</a>`);
export function md2html(md) {
  const out = [], lines = md.replace(/\r/g, "").split("\n");
  let para = [], list = null, table = null, inZh = false;
  const flush = () => {
    if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; }
    if (list) { out.push("<ul>" + list.map((l) => "<li>" + inline(l) + "</li>").join("") + "</ul>"); list = null; }
    if (table) { const [h, , ...b] = table, cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      out.push('<div class="tw"><table><thead><tr>' + cells(h).map((c) => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>" +
        b.map((r) => "<tr>" + cells(r).map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>"); table = null; }
  };
  for (const raw of lines) {
    const l = raw.trimEnd(), h = /^(#{1,4})\s+(.*)$/.exec(l);
    if (h) {
      flush();
      const n = h[1].length, txt = h[2].trim();
      if (n === 2 && /^(中文|Italiano)$/.test(txt)) { if (inZh) out.push("</section>"); inZh = txt === "中文"; out.push(inZh ? '<section lang="zh-CN">' : '<section lang="it">'); }
      const id = n === 2 ? (txt === "中文" ? "中文" : txt.toLowerCase().replace(/[^a-z0-9]+/g, "-")) : "";
      out.push(`<h${n}${id ? ` id="${id}"` : ""}>${inline(txt)}</h${n}>`); continue;
    }
    if (/^\|/.test(l)) { if (!table) { flush(); table = []; } table.push(l); continue; }
    if (/^\s*-\s+/.test(l)) { if (para.length || table) flush(); (list = list || []).push(l.replace(/^\s*-\s+/, "")); continue; }
    if (/^\s{2,}\S/.test(l) && list) { list[list.length - 1] += " " + l.trim(); continue; }
    if (!l.trim()) { flush(); continue; }
    if (list || table) flush();
    para.push(l.trim());
  }
  flush(); if (inZh) out.push("</section>");
  return out.join("\n");
}
function privacyPage() {
  const md = fs.readFileSync(path.join(ROOT, "PRIVACY.md"), "utf8");
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy · màndarínō</title>
<meta name="description" content="Informativa sulla privacy di màndarínō: nessun dato raccolto. 隐私说明：不收集任何数据。">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<!-- generata da tools/site.mjs a partire da PRIVACY.md: non modificarla a mano -->
<style>
:root { --bg: #F5F7F5; --ink: #16201B; --mute: #4A5A52; --accent: #14594A; --line: #D5DED9; --card: #FFFFFF; }
@media (prefers-color-scheme: dark) { :root { --bg: #0F1412; --ink: #E9EFEB; --mute: #A9B8B0; --accent: #5CC4A5; --line: #2A3530; --card: #18201C; } }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
a { color: var(--accent); } a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.tw { overflow-x: auto; } table { border-collapse: collapse; width: 100%; font-size: .92rem; background: var(--card); }
th, td { border: 1px solid var(--line); padding: 6px 8px; text-align: left; vertical-align: top; }
code { font-size: .9em; } h1 { font-size: 1.8rem; } h2 { margin-top: 2em; } .back { display: inline-block; min-height: 44px; line-height: 44px; }
</style>
</head>
<body><main>
<a class="back" href="./">← màndarínō</a>
${md2html(md)}
</main></body>
</html>
`;
}
/* MANIFESTO.md → HTML: righe a capo conservate, citazioni «> », elenchi puntati e numerati (con il corpo rientrato) */
export function manifestoHtml(md) {
  const out = [], lines = md.replace(/\r/g, "").split("\n");
  let para = [], ul = null, ol = null, inSec = false;
  const flush = () => {
    if (para.length) { out.push("<p>" + para.map(inline).join("<br>\n") + "</p>"); para = []; }
    if (ul) { out.push("<ul>" + ul.map((l) => "<li>" + inline(l) + "</li>").join("") + "</ul>"); ul = null; }
    if (ol) { out.push("<ol>" + ol.map((l) => "<li>" + l.map(inline).join("<br>\n") + "</li>").join("") + "</ol>"); ol = null; }
  };
  for (const raw of lines) {
    const l = raw.trimEnd();
    const h = /^(#{1,2})\s+(.*)$/.exec(l);
    if (h) {
      flush();
      const txt = h[2].trim();
      if (h[1] === "##") { if (inSec) out.push("</section>"); inSec = true; const zh = txt === "中文"; out.push(`<section lang="${zh ? "zh-CN" : "it"}" id="${zh ? "中文" : "italiano"}">`); }
      else if (inSec) out.push(`<h1>${inline(txt)}</h1>`);
      continue;
    }
    if (!inSec) continue;
    if (!l.trim()) { flush(); continue; }
    let m;
    if ((m = /^>\s?(.*)$/.exec(l))) { flush(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if ((m = /^-\s+(.*)$/.exec(l))) { if (para.length || ol) flush(); (ul = ul || []).push(m[1]); continue; }
    if ((m = /^\d+\.\s+(.*)$/.exec(l))) { if (para.length || ul) flush(); (ol = ol || []).push([m[1]]); continue; }
    if (/^\s+\S/.test(l) && ol) { ol[ol.length - 1].push(l.trim()); continue; }
    if (ul || ol) flush();
    if (/^— /.test(l)) { flush(); out.push(`<p class="sign">${inline(l)}</p>`); continue; }
    para.push(l.trim());
  }
  flush(); if (inSec) out.push("</section>");
  return out.join("\n").replace(/href="PRIVACY[.]md/g, 'href="privacy.html');   /* nel repository il link va a PRIVACY.md, sul sito alla pagina generata */
}
function manifestoPage() {
  const md = fs.readFileSync(path.join(ROOT, "MANIFESTO.md"), "utf8");
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Il Manifesto · màndarínō</title>
<meta name="description" content="Gratuita, offline, privata e senza stronzate. 免费、离线、保护隐私，不整虚的。">
<meta property="og:title" content="Il Manifesto di màndarínō · màndarínō 宣言">
<meta property="og:description" content="Gratuita, offline, privata e senza stronzate. 免费、离线、保护隐私，不整虚的。">
<meta property="og:image" content="${SITE}/img/manifesto-og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<!-- generata da tools/site.mjs a partire da MANIFESTO.md: non modificarla a mano -->
<style>
:root { --bg: #F5F7F5; --ink: #16201B; --mute: #4A5A52; --accent: #14594A; --line: #D5DED9; --card: #FFFFFF; }
@media (prefers-color-scheme: dark) { :root { --bg: #0F1412; --ink: #E9EFEB; --mute: #A9B8B0; --accent: #5CC4A5; --line: #2A3530; --card: #18201C; } }
body { margin: 0; background: var(--bg); color: var(--ink); font: 17px/1.7 system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif; }
main { max-width: 680px; margin: 0 auto; padding: 24px 16px 56px; }
a { color: var(--accent); } a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
h1 { font-size: 2rem; line-height: 1.2; margin: .4em 0 .2em; }
section + section { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--line); }
blockquote { margin: 1.4em 0; padding: .2em 0 .2em 1em; border-left: 4px solid var(--accent); font-size: 1.1em; font-weight: 600; }
ol, ul { padding-left: 1.3em; } li { margin: .8em 0; }
.sign { font-weight: 600; margin-top: 2em; }
.nav { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.nav a { display: inline-block; min-height: 44px; line-height: 44px; }
.cards { display: flex; gap: 12px; flex-wrap: wrap; margin: 1.4em 0; }
.cards a { display: block; width: calc(50% - 6px); min-width: 140px; } .cards img { width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--line); display: block; }
.cards span { display: block; font-size: .9rem; color: var(--mute); margin-top: 4px; }
</style>
</head>
<body><main>
<p class="nav"><a href="./">← màndarínō</a> · <a href="#italiano">Italiano</a> · <a href="#中文" lang="zh-CN">中文</a></p>
${manifestoHtml(md)}
<section aria-labelledby="carte">
<h2 id="carte" style="font-size:1.1rem">Condividi · 分享</h2>
<div class="cards">
<a href="img/manifesto-it.png" download="manifesto-mandarino.png"><img src="img/manifesto-it.png" alt="La carta del Manifesto di màndarínō: Gratuita, offline, privata e senza stronzate." width="540" height="675" loading="lazy"><span>Scarica la carta · italiano</span></a>
<a href="img/manifesto-zh.png" download="manifesto-mandarino-zh.png" lang="zh-CN"><img src="img/manifesto-zh.png" alt="màndarínō 宣言的分享卡：免费、离线、保护隐私，不整虚的。" width="540" height="675" loading="lazy"><span>下载分享卡 · 中文</span></a>
</div>
</section>
</main></body>
</html>
`;
}
function copyDir(a, b, skip = new Set()) {
  fs.mkdirSync(b, { recursive: true });
  for (const e of fs.readdirSync(a, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const s = path.join(a, e.name), d = path.join(b, e.name);
    if (e.isDirectory()) copyDir(s, d, skip); else fs.copyFileSync(s, d);
  }
}
const SITE = "https://mandarinoapp.org";
function assemble(out) {
  if (!fs.existsSync(path.join(ROOT, "dist/index.html"))) throw new Error("Manca dist/: lancia prima node tools/build.mjs");
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  for (const f of ["index.html", "icon.svg", "tester.html", "partecipa-voci.html"]) fs.copyFileSync(path.join(ROOT, "docs", f), path.join(out, f));
  copyDir(path.join(ROOT, "docs/img"), path.join(out, "img"));
  for (const dir of ["assets", "audio", "licenze"]) copyDir(path.join(ROOT, "docs", dir), path.join(out, dir));   /* stile e script, musica, testi delle licenze */
  fs.copyFileSync(path.join(ROOT, "docs/404.html"), path.join(out, "404.html"));
  fs.writeFileSync(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /partecipa-voci.html\nSitemap: ${SITE}/sitemap.xml\n`);
  fs.writeFileSync(path.join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    ["/", "/zh/", "/privacy.html", "/manifesto.html"].map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join("\n") + `\n</urlset>\n`);
  copyDir(path.join(ROOT, "docs/zh"), path.join(out, "zh"));   /* la pagina cinese, quella del QR delle carte */
  fs.writeFileSync(path.join(out, "privacy.html"), privacyPage());
  fs.writeFileSync(path.join(out, "manifesto.html"), manifestoPage());
  copyDir(path.join(ROOT, "dist"), path.join(out, "app"), new Set(["_headers"]));
  fs.writeFileSync(path.join(out, ".nojekyll"), "");
  console.log("✓ sito in " + path.relative(ROOT, out) + ": index.html, 404.html, zh/, privacy.html, manifesto.html, tester.html, partecipa-voci.html, img/, assets/, audio/, licenze/, robots.txt, sitemap.xml, app/");
}

/* Anteprime del link (Open Graph) 1200×630. WhatsApp, WeChat, Telegram e i social le ritagliano in modi diversi (la striscia 1,91:1
   intera, oppure un quadrato al centro): per questo tutto ciò che conta sta nel quadrato centrale di 630 px (x da 285 a 915) e ai lati
   c'è solo decorazione. Nessun testo lungo: la descrizione la dà og:description. */
async function previews(b) {
  const img = path.join(ROOT, "docs/img"), icon = fs.readFileSync(path.join(ROOT, "docs/icon.svg"), "utf8");
  const base = `margin:0;width:1200px;height:630px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 12% 20%,#E4EFE9 0,transparent 38%),radial-gradient(circle at 90% 85%,#FBE7D2 0,transparent 36%),#F5F7F5;color:#16201B;font-family:system-ui,'Noto Sans CJK SC','PingFang SC',sans-serif;text-align:center`;
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<!doctype html><meta charset="utf-8"><body style="${base}"><div style="width:600px">
    <div style="width:230px;height:230px;margin:0 auto">${icon.replace("<svg", '<svg width="230" height="230"')}</div>
    <div style="font-size:92px;font-weight:800;letter-spacing:1px;line-height:1.1;margin-top:8px">màndarínō</div>
    <div style="font-size:42px;margin-top:10px;font-weight:600">Cinese ⇄ Italiano</div>
    <div style="font-size:30px;margin-top:10px;color:#14594A;font-weight:700">gratis · offline · 免费 · 离线</div></div></body>`);
  await p.screenshot({ path: path.join(img, "anteprima.png") });
  await p.setContent(`<!doctype html><meta charset="utf-8"><body style="${base}"><div style="width:600px">
    <div style="font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:#14594A;font-weight:800">Il Manifesto · 宣言</div>
    <div style="font-size:46px;font-weight:800;line-height:1.2;margin-top:18px">Gratuita, offline, privata.</div>
    <div style="font-size:46px;font-weight:800;line-height:1.2">E senza stronzate.</div>
    <div style="font-size:38px;line-height:1.35;margin-top:20px;color:#14594A;font-weight:700">免费、离线、保护隐私，<br>不整虚的。</div>
    <div style="font-size:30px;margin-top:22px;font-weight:700">màndarínō</div></div></body>`);
  await p.screenshot({ path: path.join(img, "manifesto-og.png") });
  await p.close();
}

async function assets() {
  const { chromium } = createRequire(import.meta.url)("playwright");
  const b = await chromium.launch(), img = path.join(ROOT, "docs/img");
  await previews(b);
  /* demo: pochi secondi dell'app in un telefono (registrazione di Playwright, webm) */
  const tmp = fs.mkdtempSync(path.join(ROOT, "build-demo-"));
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, recordVideo: { dir: tmp, size: { width: 360, height: 740 } } });
  await ctx.addInitScript(() => { localStorage.setItem("cp-ux-v1", JSON.stringify({ onboarded: 1, unlv: 1, unl: { words: 1, build: 1 } })); });
  const d = await ctx.newPage();
  await d.goto(pathToFileURL(path.join(ROOT, "dist/index.html")).href); await d.waitForTimeout(2600);
  await d.evaluate(() => { CP.toast = function () {}; });   /* nel browser senza voce comparirebbe l'avviso «la voce non risponde» */
  /* un tocco sul primo elemento visibile che corrisponde, senza aspettare se non c'è */
  const tap = async (sel, wait = 1200) => { const ok = await d.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length && !x.closest("[hidden]")); if (!el) return false; el.click(); return true; }, sel); if (ok) await d.waitForTimeout(wait); return ok; };
  await tap("#tab-study", 1000); await tap("#view-study .btn-main, #study-root .btn-main", 1400);
  for (let i = 0; i < 5; i++) { if (!(await tap("button.btn-main", 1300))) await tap("[data-grade], .grades button", 1300); }
  await d.keyboard.press("Escape"); await d.waitForTimeout(500);
  await tap("#tab-words", 1000);
  await d.evaluate(() => { const el = document.scrollingElement; el.scrollBy({ top: 420, behavior: "smooth" }); }); await d.waitForTimeout(1600);
  await tap("#tab-path", 1200);
  const v = d.video(); await ctx.close(); const vp = await v.path();
  fs.copyFileSync(vp, path.join(img, "demo.webm")); fs.rmSync(tmp, { recursive: true, force: true });
  /* il primo fotogramma come poster */
  const pp = await b.newPage({ viewport: { width: 360, height: 740 } });
  await pp.addInitScript(() => { localStorage.setItem("cp-ux-v1", JSON.stringify({ onboarded: 1, unlv: 1, unl: { words: 1, build: 1 } })); });
  await pp.goto(pathToFileURL(path.join(ROOT, "dist/index.html")).href); await pp.waitForTimeout(2600);
  await pp.screenshot({ path: path.join(img, "demo.png") });
  await b.close();
  for (const f of ["anteprima.png", "manifesto-og.png", "demo.webm", "demo.png"]) console.log("✓ docs/img/" + f + " · " + Math.round(fs.statSync(path.join(img, f)).size / 1024) + " KB");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (args.includes("--anteprime")) { const { chromium } = createRequire(import.meta.url)("playwright"), b = await chromium.launch(); await previews(b); await b.close(); console.log("✓ docs/img/anteprima.png e manifesto-og.png"); }
  else if (args.includes("--assets")) await assets();
  else assemble(path.resolve(ROOT, opt("--out", "_site")));
}
