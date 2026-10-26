/* màndarínō · rigenera le icone dell'app (PWA e Android) da un solo disegno: il mandarino di src/pwa/icon.svg con sotto il
   wordmark «màndarínō» (vocali nei colori dei toni, come nel logo). Serve Playwright (npm install) e un carattere senza
   grazie in grassetto: «Inter» se c'è, altrimenti quello di sistema. Le PNG si committano; la build non le rigenera.
     node tools/icons.mjs
   Il disegno sta in un quadrato di 108 unità (le dp dell'icona adattiva di Android): la zona sempre visibile è il cerchio
   di raggio 36 al centro, e mandarino e wordmark ci stanno dentro. Ogni icona è un ritaglio quadrato di quel disegno. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)("playwright");

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = fs.readFileSync(path.join(ROOT, "src/pwa/icon.svg"), "utf8");
const defs = svg.match(/<defs>[\s\S]*<\/defs>/)[0];
const fruit = svg.match(/<g id="mandarin-symbol"[^>]*>([\s\S]*?)<\/g><\/svg>/)[1];
const PAPER = "#F4EFE6", INK = "#16201B", T4 = "#8438BC", T2 = "#1F7A3E", T1 = "#C8312B";
const RES = "android/app/src/main/res";
const DPI = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

/* crop = lato del ritaglio (in unità), bg = sfondo: null, "square", "round" (angoli arrotondati); mono = sagoma bianca */
function page(px, crop, bg, mono) {
  const o = (108 - crop) / 2, r = crop * 0.22;
  const back = bg === "square" ? `<rect x="${o}" y="${o}" width="${crop}" height="${crop}" fill="${PAPER}"/>`
    : bg === "round" ? `<rect x="${o + crop * 0.04}" y="${o + crop * 0.04}" width="${crop * 0.92}" height="${crop * 0.92}" rx="${r}" fill="${PAPER}"/>` : "";
  const f = mono ? fruit.replace(/fill="[^"]*"/g, 'fill="#fff"').replace(/stroke="[^"]*"/g, 'stroke="none"').replace(/<ellipse cx="0" cy="88"[^>]*\/>/, "") : fruit;
  const c = (col) => (mono ? "#fff" : col);
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}</style>
<svg id="s" xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${o} ${o} ${crop} ${crop}">${defs}${back}
<g transform="translate(54 42) scale(0.18)">${f}</g>
<text id="w" x="54" y="74" text-anchor="middle" font-family="Inter, 'Inter Display', system-ui, sans-serif" font-weight="800" font-size="14" letter-spacing="-0.2">
<tspan fill="${c(INK)}">m</tspan><tspan fill="${c(T4)}">à</tspan><tspan fill="${c(INK)}">ndar</tspan><tspan fill="${c(T2)}">í</tspan><tspan fill="${c(INK)}">n</tspan><tspan fill="${c(T1)}">ō</tspan></text></svg>
<script>{
  /* il wordmark si rimpicciolisce finché il suo riquadro non sta nel cerchio visibile (raggio 35, un filo di margine) */
  const w = document.getElementById("w");
  for (let fs = 14; fs > 6; fs -= 0.25) {
    w.setAttribute("font-size", fs); const b = w.getBBox();
    const far = Math.max(...[[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => Math.hypot(x - 54, y - 54)));
    if (far <= 35) break;
  }
  document.title = "ok";
}</script>`;
}

const jobs = [];
for (const [d, k] of Object.entries(DPI)) {
  jobs.push([`${RES}/mipmap-${d}/ic_launcher.png`, 48 * k, 72, "round", false]);
  jobs.push([`${RES}/mipmap-${d}/ic_launcher_foreground.png`, 108 * k, 108, null, false]);
  jobs.push([`${RES}/mipmap-${d}/ic_launcher_monochrome.png`, 108 * k, 108, null, true]);
}
jobs.push(["src/pwa/icon-192.png", 192, 76, "round", false]);
jobs.push(["src/pwa/icon-512.png", 512, 76, "round", false]);
jobs.push(["src/pwa/icon-maskable-512.png", 512, 90, "square", false]);   /* zona sicura delle maskable: cerchio di raggio 40% */
jobs.push(["src/pwa/icon-180.png", 180, 80, "square", false]);           /* iPhone: quadrato pieno, gli angoli li arrotonda iOS */

const browser = await chromium.launch();
const pg = await browser.newPage();
pg.on("pageerror", (e) => console.error("errore nella pagina:", e.message));
for (const [file, px, crop, bg, mono] of jobs) {
  await pg.setContent(page(px, crop, bg, mono));
  await pg.waitForFunction(() => document.title === "ok");
  await pg.locator("#s").screenshot({ path: path.join(ROOT, file), omitBackground: true });
  console.log("✓ " + file + " · " + px + "px");
}
await browser.close();
