#!/usr/bin/env node
/* màndarínō · audit UX (prompt V6.7, §4-bis.9)
   Apre l'app in Chromium (Playwright) a 320×568, 360×740 e 390×844, nei temi chiaro, Carta di Riso e notte,
   e fallisce se trova uno di questi difetti:
     1. overflow orizzontale (scrollWidth > innerWidth);
     2. in sessione, #reveal / #next / .grades non stanno interi dentro lo schermo;
     3. in sessione si vedono .hd, .bar, .vset o .dock;
     4. il primo contenuto utile di Percorso o Studia sta sotto y = 300 a 360×740;
     5. elementi interattivi visibili più piccoli di 44×44 (esclusi .sr e le parole toccabili dentro una frase, .wd:
        per WCAG 2.5.8 i bersagli in linea nel testo sono esenti);
     6. testo visibile sotto i 13 px;
     7. body.in-session ancora attivo dopo #quit, dopo la fine della sessione o dopo il cambio di scheda;
     8. contrasto testo/sfondo sotto 4.5:1 (3:1 per il testo grande, >= 24 px o >= 18.66 px in grassetto, come WCAG);
        esclusi i controlli disattivati e il testo sfocato apposta (modalità ripasso);
     9. un profilo di prova perde o cambia chiavi in localStorage / IndexedDB, oppure #selftest non è tutto verde.
   Stampa anche la tabella delle misure (4-bis.0), per confrontare prima e dopo.

   Uso:  node tools/ux-audit.mjs [file.html ...]      (senza argomenti: index.html)
         con più file stampa le misure di ciascuno; il codice d'uscita dipende dall'ultimo.  --quick: solo 360×740 e tema chiaro. */
import { createRequire } from "module";
import path from "path";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch (e) { console.error("Serve Playwright (npm i -D playwright)."); process.exit(2); }

const args = process.argv.slice(2);
const quick = args.includes("--quick");
const files = args.filter((a) => !a.startsWith("--")).map((f) => path.resolve(f));
if (!files.length) files.push(path.resolve("index.html"));
const VIEWS = quick ? [[360, 740]] : [[320, 568], [360, 740], [390, 844]];
const THEMES = quick ? ["light"] : ["light", "sepia", "dark"];

/* ---------- funzioni che girano nella pagina ---------- */
const PAGE_LIB = () => {
  const vis = (el) => {
    if (!el || !el.isConnected) return false;
    if (el.closest(".sr")) return false;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const parse = (c) => {
    let m = /rgba?\(([^)]+)\)/.exec(c);
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; }
    m = /color\(srgb\s+([^)]+)\)/.exec(c);
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] === undefined ? 1 : p[3]]; }
    return null;
  };
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    let base = [255, 255, 255, 1];
    const root = parse(getComputedStyle(document.body).backgroundColor); if (root && root[3] >= 1) base = root;
    for (let i = layers.length - 1; i >= 0; i--) base = layers[i][3] >= 1 ? layers[i] : over(layers[i], base);
    return base;
  };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const desc = (el) => { const id = el.id ? "#" + el.id : ""; const cl = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""; return el.tagName.toLowerCase() + id + cl + " «" + (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 24) + "»"; };
  const textEls = () => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
      if (el.closest("script,style,noscript,#selftest,option")) continue;
      if (!vis(el)) continue;
      out.push(el);
    }
    return out;
  };
  window.__ux = {
    overflow: () => document.documentElement.scrollWidth > window.innerWidth,
    small: () => {
      const sel = 'button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="radio"]';
      const out = [];
      document.querySelectorAll(sel).forEach((el) => {
        if (!vis(el) || el.closest(".wd")) return;
        let r = el.getBoundingClientRect();
        if (el.tagName === "INPUT" && /checkbox|radio/.test(el.type) && el.closest("label")) r = el.closest("label").getBoundingClientRect();
        if (r.width < 43.5 || r.height < 43.5) out.push(desc(el) + " " + Math.round(r.width) + "×" + Math.round(r.height));
      });
      return out;
    },
    tiny: () => textEls().filter((el) => parseFloat(getComputedStyle(el).fontSize) < 13).map((el) => desc(el) + " " + getComputedStyle(el).fontSize),
    contrast: () => {
      const out = [];
      textEls().forEach((el) => {
        if (el.closest("[disabled], [aria-disabled='true'], .tile.used, svg, .stamp")) return;   /* .stamp: testo sopra il disegno del mandarino */
        if (el.closest(".m") && el.closest(".m").matches("body.hide-it .m-it:not(.shown), body.hide-py .m-py:not(.shown), body.hide-hz .m-hz:not(.shown)")) return;
        for (let e = el; e; e = e.parentElement) if (parseFloat(getComputedStyle(e).opacity) < 1) return;
        const cs = getComputedStyle(el), fg = parse(cs.color); if (!fg) return;
        const bg = bgOf(el), col = fg[3] < 1 ? over(fg, bg) : fg, r = ratio(col, bg);
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700, large = size >= 24 || (bold && size >= 18.66);
        if (r < (large ? 3 : 4.5)) out.push(desc(el) + " " + r.toFixed(2) + ":1");
      });
      return out;
    },
    shown: (sel) => Array.from(document.querySelectorAll(sel)).some(vis),
    inView: (sel) => { const els = Array.from(document.querySelectorAll(sel)).filter(vis); if (!els.length) return null; return els.every((el) => { const r = el.getBoundingClientRect(); return r.top >= -0.5 && r.bottom <= window.innerHeight + 0.5; }); },
    bottom: (sel) => { const el = Array.from(document.querySelectorAll(sel)).find(vis); return el ? Math.round(el.getBoundingClientRect().bottom + window.scrollY) : null; },
    /* il primo contenuto utile: la scheda o il pulsante principale della schermata (non il titolo) */
    firstTop: (sel) => { const els = Array.from(document.querySelectorAll(sel)).filter(vis); if (!els.length) return null; return Math.round(Math.min.apply(null, els.map((e) => e.getBoundingClientRect().top)) + window.scrollY); },
    padBottom: () => parseFloat(getComputedStyle(document.body).paddingBottom),
    wordsBefore: () => {
      const v = document.getElementById("view-words"), sec = document.getElementById("sections"); if (!v || !sec) return [];
      return Array.from(v.children).filter((c) => c !== sec && !c.contains(sec) && vis(c)).map((c) => c.id || c.className || c.tagName);
    },
    firstRowTop: () => { const r = Array.from(document.querySelectorAll("#sections tbody tr")).find(vis); return r ? Math.round(r.getBoundingClientRect().top + window.scrollY) : null; }
  };
};

async function openPage(browser, file, vw, vh, theme, seed) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, colorScheme: theme === "dark" ? "dark" : "light" });
  await ctx.addInitScript(([t, sd]) => {
    try {
      if (!sessionStorage.getItem("ux-seeded")) {
        sessionStorage.setItem("ux-seeded", "1");
        localStorage.clear();
        if (t) localStorage.setItem("cp-theme", t);
        /* niente musica né voce durante l'audit; il benvenuto (se c'è) si considera già visto */
        localStorage.setItem("cp-music", "0"); localStorage.setItem("cp-auto", "0");
        localStorage.setItem("cp-ux-v1", JSON.stringify({ onboarded: 1, legendSeen: 1, swipeHints: 9 }));
        if (sd) Object.keys(sd).forEach((k) => localStorage.setItem(k, sd[k]));
      }
    } catch (e) {}
  }, [theme, seed || null]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(PAGE_LIB);
  return { ctx, page, errors };
}
const tab = async (page, name) => { await page.click("#tab-" + name); await page.waitForTimeout(250); await page.evaluate(() => window.scrollTo(0, 0)); await page.evaluate(PAGE_LIB); };

async function auditView(browser, file, vw, vh, theme) {
  const fails = [], m = {};
  const { ctx, page, errors } = await openPage(browser, file, vw, vh, theme);
  const ux = (fn, ...a) => page.evaluate(([f, a2]) => window.__ux[f](...a2), [fn, a]);
  const screen = async (label) => {
    if (await ux("overflow")) fails.push(`[1] ${label}: overflow orizzontale`);
    const sm = await ux("small"); if (sm.length) fails.push(`[5] ${label}: ${sm.length} bersagli < 44 px: ` + sm.slice(0, 4).join(" · "));
    const tn = await ux("tiny"); m["testo<13 " + label] = tn.length; if (tn.length) fails.push(`[6] ${label}: ${tn.length} testi < 13 px: ` + tn.slice(0, 3).join(" · "));
    const ct = await ux("contrast"); if (ct.length) fails.push(`[8] ${label}: ${ct.length} contrasti bassi: ` + ct.slice(0, 3).join(" · "));
  };
  /* Percorso */
  await tab(page, "path");
  m.percorso = await ux("firstTop", "#path-go, #path-root .panel");
  m.padBottom = await ux("padBottom");
  await screen("Percorso");
  if (vw === 360 && m.percorso > 300) fails.push(`[4] Percorso: primo contenuto a y=${m.percorso} (> 300)`);
  /* Parole */
  await tab(page, "words");
  m.paroleBlocchi = (await ux("wordsBefore")).length;
  m.parolePrimaRiga = await ux("firstRowTop");
  await screen("Parole");
  /* Studia */
  await tab(page, "study");
  m.studia = await ux("firstTop", "#go, #study-root .panel");
  if (vw === 360 && m.studia > 300) fails.push(`[4] Studia: primo contenuto a y=${m.studia} (> 300)`);
  await screen("Studia");
  /* Frasi */
  await tab(page, "build");
  await screen("Frasi");
  /* sessione */
  await tab(page, "study");
  const go = await page.$("#go");
  if (go) {
    await go.click(); await page.waitForTimeout(250); await page.evaluate(PAGE_LIB);
    const hidden = async (when) => { for (const s of [".hd", ".bar", ".vset", ".dock"]) if (await ux("shown", s)) fails.push(`[3] sessione (${when}): ${s} è visibile`); };
    await hidden("carta nuova");
    let ok = await ux("inView", "#next"); m.sessNext = await ux("bottom", "#next");
    if (ok === false) fails.push(`[2] sessione: #next fuori schermo (fondo a y=${m.sessNext}, schermo ${vh})`);
    await screen("Sessione");
    for (let i = 0; i < 12 && (await page.$("#next")); i++) { await page.click("#next"); await page.waitForTimeout(80); }
    if (await page.$("#reveal")) {
      ok = await ux("inView", "#reveal"); m.sessReveal = await ux("bottom", "#reveal");
      if (ok === false) fails.push(`[2] sessione: #reveal fuori schermo (fondo a y=${m.sessReveal})`);
      await page.click("#reveal"); await page.waitForTimeout(150);
      ok = await ux("inView", ".grades"); m.sessGrades = await ux("bottom", ".grades");
      if (ok === false) fails.push(`[2] sessione: .grades fuori schermo (fondo a y=${m.sessGrades})`);
      await hidden("voti");
      await screen("Sessione · voti");
    }
    /* [7] uscita con #quit */
    if (await page.$("#quit")) { await page.click("#quit"); await page.waitForTimeout(150); if (await page.evaluate(() => document.body.classList.contains("in-session"))) fails.push("[7] in-session resta dopo #quit"); }
    /* [7] cambio di scheda */
    if (await page.$("#go")) { await page.click("#go"); await page.waitForTimeout(150); await page.click("#tab-words", { force: true }).catch(() => page.evaluate(() => document.getElementById("tab-words").click())); await page.waitForTimeout(150); if (await page.evaluate(() => document.body.classList.contains("in-session"))) fails.push("[7] in-session resta dopo il cambio di scheda"); await tab(page, "study"); }
    /* [7] fine della sessione */
    if (await page.$("#go")) {
      await page.click("#go"); await page.waitForTimeout(150);
      for (let i = 0; i < 300; i++) {
        if (await page.$("#next")) await page.click("#next");
        else if (await page.$("#reveal")) await page.click("#reveal");
        else if (await page.$('[data-g="3"]')) await page.click('[data-g="3"]');
        else break;
        await page.waitForTimeout(20);
      }
      if (await page.evaluate(() => document.body.classList.contains("in-session"))) fails.push("[7] in-session resta dopo la fine della sessione");
    }
  } else fails.push("[2] sessione: non trovo #go per iniziare");
  if (errors.length) fails.push("errori JavaScript: " + errors.slice(0, 2).join(" | "));
  await ctx.close();
  return { fails, m };
}

async function auditStore(browser, file) {
  const fails = [];
  const now = Date.now();
  const seed = {
    "cp-srs-v1": JSON.stringify({ "我": { n: 3, d: now + 86400000, b: 2, st: 3.2, df: 5, sd: 2, sp: null, lr: now - 3600000, rp: 3, lp: 0 }, "你": { n: 1, d: now - 1000, b: 0, st: 0.5, df: 6, sd: 3, sp: 0, lr: now - 7200000, rp: 1, lp: 0 } }),
    "cp-fav-v1": JSON.stringify({ "我": 1 }),
    "cp-game-v1": JSON.stringify({ xp: 120, goal: 10, days: {}, best: 40 }),
    "cp-study-cfg": JSON.stringify({ n: 5, sec: "" })
  };
  const { ctx, page, errors } = await openPage(browser, file, 360, 740, "light", seed);
  await page.evaluate(() => Store.ready);
  await page.evaluate(() => new Promise((r) => { Store.log([Date.now(), "我", 3, 1200, "pi", 0.9, 0]); setTimeout(r, 300); }));
  const before = await page.evaluate(() => Store.logAll().then((l) => ({ kv: Store.snapshot(), log: l.length })));
  for (const t of ["words", "study", "build", "path"]) await tab(page, t);
  await tab(page, "study");
  if (await page.$("#go")) { await page.click("#go"); await page.waitForTimeout(150); if (await page.$("#quit")) await page.click("#quit"); }
  await page.reload(); await page.evaluate(PAGE_LIB);
  const after = await page.evaluate(() => Store.ready.then(() => Store.logAll()).then((l) => ({ kv: Store.snapshot(), log: l.length })));
  Object.keys(before.kv).forEach((k) => { if (!(k in after.kv)) fails.push("[9] chiave persa: " + k); });
  ["cp-srs-v1", "cp-fav-v1", "cp-game-v1", "cp-study-cfg"].forEach((k) => { if (before.kv[k] !== after.kv[k]) fails.push("[9] chiave cambiata senza studiare: " + k); });
  if (after.log < before.log) fails.push(`[9] registro dei ripassi accorciato: ${before.log} → ${after.log}`);
  await page.goto(pathToFileURL(file).href + "#selftest");
  await page.waitForFunction(() => window.__SELFTEST, null, { timeout: 30000 });
  const st = await page.evaluate(() => window.__SELFTEST);
  if (st.pass !== st.total) fails.push(`[9] #selftest: ${st.pass}/${st.total} — ` + st.results.filter((r) => !r.ok).map((r) => r.name).join(", "));
  if (errors.length) fails.push("errori JavaScript: " + errors.slice(0, 2).join(" | "));
  await ctx.close();
  return { fails, selftest: st.pass + "/" + st.total };
}

const browser = await chromium.launch();
let last = [];
for (const file of files) {
  console.log("\n=== " + path.basename(file) + " ===");
  const all = [], table = {};
  for (const [vw, vh] of VIEWS) for (const th of THEMES) {
    const r = await auditView(browser, file, vw, vh, th);
    if (th === "light") table[vw + "×" + vh] = r.m;
    r.fails.forEach((f) => all.push(`${vw}×${vh} ${th}: ${f}`));
  }
  const st = await auditStore(browser, file);
  st.fails.forEach((f) => all.push("profilo di prova: " + f));
  /* tabella delle misure (tema chiaro) */
  const rows = [["Primo contenuto, Percorso (y)", "percorso"], ["Primo contenuto, Studia (y)", "studia"], ["Parole: blocchi prima della prima parola", "paroleBlocchi"],
    ["Parole: prima riga della tabella (y)", "parolePrimaRiga"], ["Testi < 13 px · Percorso", "testo<13 Percorso"], ["Testi < 13 px · Parole", "testo<13 Parole"], ["Testi < 13 px · Studia", "testo<13 Studia"],
    ["Sessione: fondo di «Avanti» (y)", "sessNext"], ["Sessione: fondo di «Mostra la risposta» (y)", "sessReveal"], ["Sessione: fondo dei voti (y)", "sessGrades"], ["Margine sotto la dock (padding-bottom)", "padBottom"]];
  const cols = Object.keys(table);
  console.log("\n| Misura | " + cols.join(" | ") + " |\n|---|" + cols.map(() => "---").join("|") + "|");
  rows.forEach(([lbl, k]) => console.log("| " + lbl + " | " + cols.map((c) => table[c][k] ?? "—").join(" | ") + " |"));
  console.log("\n#selftest: " + st.selftest);
  console.log(all.length ? `\n${all.length} problemi:\n` + all.map((x) => " ✗ " + x).join("\n") : "\nNessun problema: tutti i controlli superati.");
  last = all;
}
await browser.close();
process.exit(last.length ? 1 : 0);
