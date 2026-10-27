#!/usr/bin/env node
/* màndarínō · materiali per gli store (Google Play, F-Droid) dalla fonte unica fastlane/metadata/android/<lingua>/.

   node tools/store-assets.mjs            immagini (Playwright, devDependency) e schede docs/store/<lingua>.md:
                                          images/icon.png (512), images/featureGraphic.png (1024×500),
                                          images/phoneScreenshots/1-4.png (1080×1920), per it-IT e zh-CN
   node tools/store-assets.mjs --notes N  note di versione changelogs/N.txt (e default.txt) dalla prima voce di
                                          src/data/changelog.js, in tutte e due le lingue (massimo 500 caratteri)
   Prima: node tools/build.mjs (le schermate vengono da dist/index.html). Nessun dato vero: un profilo inventato. */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const META = path.join(ROOT, "fastlane/metadata/android");
const LANGS = { "it-IT": { ui: "it", course: "zh", log: "it" }, "zh-CN": { ui: "zh", course: "it", log: "zh" } };
const args = process.argv.slice(2);

function changelog() { const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, "src/data/changelog.js"), "utf8") + ";this.C=CHANGELOG;", ctx); return ctx.C; }
export function notesFor(lang) {
  const e = changelog()[0], rows = e[LANGS[lang].log] || e.it;
  let out = ""; for (const r of rows) { const line = "• " + r + "\n"; if ((out + line).length > 500) break; out += line; }
  return out.trim();
}
function writeNotes(code) {
  for (const L of Object.keys(LANGS)) {
    const dir = path.join(META, L, "changelogs"); fs.mkdirSync(dir, { recursive: true });
    const t = notesFor(L) + "\n"; fs.writeFileSync(path.join(dir, "default.txt"), t); if (code) fs.writeFileSync(path.join(dir, code + ".txt"), t);
  }
  console.log("✓ note di versione" + (code ? " " + code : "") + " (it-IT, zh-CN)");
}
function sheets() {
  const out = path.join(ROOT, "docs/store"); fs.mkdirSync(out, { recursive: true });
  for (const L of Object.keys(LANGS)) {
    const r = (f) => fs.readFileSync(path.join(META, L, f), "utf8").trim();
    fs.writeFileSync(path.join(out, L + ".md"), `# Scheda dello store · ${L}\n\n_Generata da tools/store-assets.mjs a partire da fastlane/metadata/android/${L}/: modifica lì, non qui._\n\n` +
      `**Titolo** (${r("title.txt").length}/30): ${r("title.txt")}\n\n**Descrizione breve** (${r("short_description.txt").length}/80): ${r("short_description.txt")}\n\n` +
      `**Descrizione lunga** (${r("full_description.txt").length}/4000):\n\n${r("full_description.txt").replace(/<\/?b>/g, "**")}\n\n**Note di versione** (ultima):\n\n${notesFor(L)}\n\n` +
      `**Immagini:** \`images/icon.png\` (512×512), \`images/featureGraphic.png\` (1024×500), \`images/phoneScreenshots/1-4.png\` (1080×1920).\n`);
  }
  console.log("✓ docs/store/it-IT.md, docs/store/zh-CN.md");
}
async function images() {
  const { chromium } = createRequire(import.meta.url)("playwright");
  const b = await chromium.launch(), icon = fs.readFileSync(path.join(ROOT, "docs/icon.svg"), "utf8");
  for (const [L, o] of Object.entries(LANGS)) {
    const img = path.join(META, L, "images"); fs.mkdirSync(path.join(img, "phoneScreenshots"), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "dist/icon-512.png"), path.join(img, "icon.png"));
    const zh = o.ui === "zh", p = await b.newPage({ viewport: { width: 1024, height: 500 } });
    await p.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;width:1024px;height:500px;display:flex;align-items:center;gap:44px;padding:0 64px;box-sizing:border-box;background:#F5F7F5;color:#16201B;font-family:system-ui,'Noto Sans CJK SC',sans-serif">
      <div style="width:240px;height:240px;flex:none">${icon.replace("<svg", '<svg width="240" height="240"')}</div>
      <div><div style="font-size:84px;font-weight:800">màndarínō</div>
      <div style="font-size:34px;margin-top:10px">${zh ? "为中文使用者学意大利语" : "Il cinese per italiani"}</div>
      <div style="font-size:26px;margin-top:18px;color:#14594A;font-weight:700">${zh ? "免费 · 离线 · 无广告 · 无需注册" : "Gratis · offline · senza pubblicità"}</div></div></body>`);
    await p.screenshot({ path: path.join(img, "featureGraphic.png") }); await p.close();
    /* schermate: un profilo inventato con qualche giorno di studio, nella lingua e nel corso giusti */
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await ctx.addInitScript(([ui, course]) => { localStorage.setItem("cp-lang", ui); localStorage.setItem("cp-course", course); localStorage.setItem("cp-ux-v1", JSON.stringify({ onboarded: 1, unlv: 1, showAll: 1 })); localStorage.setItem("cp-it-welcome", "1"); }, [o.ui, o.course]);
    const d = await ctx.newPage(); await d.goto(pathToFileURL(path.join(ROOT, "dist/index.html")).href); await d.waitForTimeout(2600);
    await d.evaluate(() => { CP.toast = function () {}; });
    const shots = o.course === "zh"
      ? [async () => {}, async () => { await d.evaluate(() => CP.show("words", true, true)); }, async () => { await d.evaluate(() => CP.show("study", true, true)); }, async () => { await d.evaluate(() => CP.show("build", true, true)); }]
      : [async () => {}, async () => { await d.evaluate(() => CP.itShow && CP.itShow("words")); }, async () => { await d.evaluate(() => CP.itShow && CP.itShow("review")); }, async () => { await d.evaluate(() => CP.itShow && CP.itShow("conj")); }];
    let i = 1;
    for (const go of shots) { await go(); await d.waitForTimeout(900); await d.evaluate(() => scrollTo(0, 0)); await d.screenshot({ path: path.join(img, "phoneScreenshots", i++ + ".png") }); }
    await ctx.close();
    console.log("✓ " + L + ": icon.png, featureGraphic.png, phoneScreenshots/1-" + (i - 1) + ".png");
  }
  await b.close();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const n = args.indexOf("--notes");
  if (n >= 0) writeNotes(args[n + 1]);
  else { await images(); writeNotes(); sheets(); }
}
