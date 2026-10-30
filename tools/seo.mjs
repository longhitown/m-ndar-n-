#!/usr/bin/env node
/* màndarínō · SEO del sito: meta, hreflang, mappa del sito, robots, llms.txt e dati strutturati JSON-LD "a fabbrica".

   Lo usa tools/site.mjs al momento di mettere insieme il sito (le pagine in docs/ restano com'erano: niente script in più
   nel sorgente, lo vieta tools/unit.mjs). Qui non c'è rete, non c'è tracciamento e non c'è nessun servizio esterno:
   i dati strutturati sono solo testo dentro la pagina.

   Il JSON-LD nasce da una fabbrica (make): un costruttore per tipo, che controlla i campi obbligatori, e graph(), che
   mette i nodi in un solo @graph, verifica che ogni riferimento {"@id": …} punti a un nodo che esiste e che ogni
   indirizzo sia assoluto. Per aggiungere un tipo basta aggiungere un costruttore a make e usarlo in graphFor().

   node tools/seo.mjs   → stampa il grafo di ogni pagina (utile per incollarlo nel test dei risultati multimediali di Google) */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SITE = "https://mandarinoapp.org";
const REPO = "https://github.com/longhitown/mandarino";
const APK = REPO + "/releases/latest/download/mandarino.apk";
export const ID = { org: SITE + "/#organization", site: SITE + "/#website", android: SITE + "/#android", web: SITE + "/#webapp" };

/* ---------- testi per lingua (solo cose vere: le stesse della pagina) ---------- */
const TXT = {
  it: {
    org: "màndarínō è un'app gratuita, offline e senza pubblicità per imparare il cinese (per italiani) e l'italiano (per chi parla cinese).",
    app: "App gratuita, offline e senza pubblicità per imparare il cinese e l'italiano. Nessuna registrazione, nessun tracciamento.",
    features: ["Funziona offline, senza connessione", "Nessuna pubblicità e nessuna registrazione", "Ripasso a intervalli con l'algoritmo FSRS", "Analisi dei toni cinesi con il microfono", "Ordine dei tratti dei caratteri"],
    home: "Pagina di presentazione di màndarínō", crumb: "Home"
  },
  "zh-CN": {
    org: "màndarínō 是一款免费、离线、无广告的学习应用：意大利人学中文，中国人学意大利语。",
    app: "免费、离线、无广告的中文与意大利语学习应用。无需注册，不追踪用户。",
    features: ["离线使用，无需联网", "无广告，无需注册", "FSRS 间隔复习", "意大利语动词变位练习"],
    home: "màndarínō 介绍页", crumb: "首页"
  }
};

/* ---------- la fabbrica: un costruttore per tipo ---------- */
const need = (t, p, keys) => { for (const k of keys) if (p[k] == null || p[k] === "" || (Array.isArray(p[k]) && !p[k].length)) throw new Error(`JSON-LD ${t}: manca «${k}»`); };
const ref = (id) => ({ "@id": id });
const clean = (v) => {   /* toglie undefined, null, stringhe e liste vuote: i dati strutturati non devono avere campi vuoti */
  if (Array.isArray(v)) return v.map(clean).filter((x) => x !== undefined);
  if (v && typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v)) { const c = clean(x); if (c !== undefined && c !== "" && !(Array.isArray(c) && !c.length)) o[k] = c; } return Object.keys(o).length ? o : undefined; }
  return v == null ? undefined : v;
};
export const make = {
  Organization(p) {
    need("Organization", p, ["lang"]);
    return { "@type": "Organization", "@id": ID.org, name: "màndarínō", url: SITE + "/", description: TXT[p.lang].org,
      logo: { "@type": "ImageObject", url: SITE + "/app/icon-512.png", width: 512, height: 512 },
      email: "mandarinoapp@gmail.com", sameAs: [REPO] };
  },
  WebSite(p) {
    need("WebSite", p, ["lang"]);
    return { "@type": "WebSite", "@id": ID.site, url: SITE + "/", name: "màndarínō", description: TXT[p.lang].org, inLanguage: ["it", "zh-CN"], publisher: ref(ID.org) };
  },
  WebPage(p) {
    need("WebPage", p, ["url", "name", "description", "lang"]);
    const id = p.url + "#webpage";
    return { "@type": p.type || "WebPage", "@id": id, url: p.url, name: p.name, description: p.description, inLanguage: p.lang,
      isPartOf: ref(ID.site), publisher: ref(ID.org), about: p.about ? ref(p.about) : undefined, breadcrumb: p.breadcrumb ? ref(p.url + "#breadcrumb") : undefined,
      primaryImageOfPage: p.image ? { "@type": "ImageObject", url: p.image } : undefined, dateModified: p.modified };
  },
  /* due nodi per la stessa app: l'APK per Android e la versione nel browser (stessi dati, stesso nome) */
  MobileApplication(p) { return make._app("MobileApplication", ID.android, "Android", p, { downloadUrl: APK, installUrl: APK }); },
  WebApplication(p) { return make._app("WebApplication", ID.web, "Web (Chrome, Safari, Firefox, Edge)", p, { url: SITE + "/app/" }); },
  _app(type, id, os, p, extra) {
    need(type, p, ["lang"]);
    return Object.assign({ "@type": type, "@id": id, name: "màndarínō", description: TXT[p.lang].app, operatingSystem: os, applicationCategory: "EducationalApplication",
      inLanguage: ["it", "zh-CN"], isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", availability: "https://schema.org/InStock" },
      featureList: TXT[p.lang].features, image: SITE + "/img/anteprima.png", publisher: ref(ID.org), author: ref(ID.org), license: "https://opensource.org/licenses/MIT" }, extra);
  },
  FAQPage(p) {
    need("FAQPage", p, ["url", "questions"]);
    return { "@type": "FAQPage", "@id": p.url + "#faq", url: p.url, isPartOf: ref(p.url + "#webpage"),
      mainEntity: p.questions.map((q) => ({ "@type": "Question", name: q.q, inLanguage: q.lang, acceptedAnswer: { "@type": "Answer", text: q.a, inLanguage: q.lang } })) };
  },
  BreadcrumbList(p) {
    need("BreadcrumbList", p, ["url", "items"]);
    return { "@type": "BreadcrumbList", "@id": p.url + "#breadcrumb", itemListElement: p.items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })) };
  },
  Article(p) {
    need("Article", p, ["url", "headline", "description", "image", "lang"]);
    return { "@type": "Article", "@id": p.url + "#article", mainEntityOfPage: ref(p.url + "#webpage"), headline: p.headline, description: p.description,
      image: p.image, inLanguage: p.lang, author: ref(ID.org), publisher: ref(ID.org), datePublished: p.published, dateModified: p.modified };
  }
};
export function build(type, props) { if (typeof make[type] !== "function" || type.startsWith("_")) throw new Error("JSON-LD: tipo sconosciuto " + type); return clean(make[type](props || {})); }

/* @graph: un solo blocco, riferimenti verificati, indirizzi assoluti */
export function graph(nodes) {
  const ids = new Set(nodes.map((n) => n["@id"]).filter(Boolean)), bad = [];
  const walk = (v, key, root) => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, key, root));
    if (v && typeof v === "object") {
      const ks = Object.keys(v);
      if (ks.length === 1 && ks[0] === "@id" && !ids.has(v["@id"])) bad.push("riferimento senza nodo: " + v["@id"]);
      return ks.forEach((k) => walk(v[k], k, root));
    }
    if (typeof v === "string" && /^(url|item|image|logo|downloadUrl|installUrl|sameAs|license|@id)$/.test(key || "") && !/^https?:\/\//.test(v)) bad.push(`${key} non assoluto: ${v}`);
  };
  nodes.forEach((n) => walk(n, "", n));
  if (bad.length) throw new Error("JSON-LD non valido: " + bad.join("; "));
  return { "@context": "https://schema.org", "@graph": nodes };
}
/* testo sicuro dentro <script>: niente "</script>" né "<!--" */
export const ldScript = (g) => `<script type="application/ld+json">${JSON.stringify(g).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")}</script>`;

/* ---------- le pagine del sito ---------- */
export const PAGES = [
  { path: "/", src: "docs/index.html", kind: "home", lang: "it", sources: ["docs/index.html", "docs/assets", "docs/img"], prio: "1.0", freq: "weekly" },
  { path: "/zh/", src: "docs/zh/index.html", kind: "home", lang: "zh-CN", sources: ["docs/zh/index.html"], prio: "0.8", freq: "monthly" },
  { path: "/manifesto.html", kind: "article", lang: "it", sources: ["MANIFESTO.md"], prio: "0.6", freq: "yearly", crumb: "Manifesto" },
  { path: "/privacy.html", kind: "page", lang: "it", sources: ["PRIVACY.md"], prio: "0.4", freq: "yearly", crumb: "Privacy" },
  { path: "/404.html", noindex: true, sources: [] },
  { path: "/partecipa-voci.html", src: "docs/partecipa-voci.html", noindex: true, sources: [] }
];
/* le due pagine "casa" sono la stessa cosa in due lingue: si rimandano a vicenda (hreflang) */
const ALT = [["it", "/"], ["zh-CN", "/zh/"]];

/* ---------- lettura dalla pagina (titolo, descrizione, domande) ---------- */
const unesc = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ");
const text = (h) => unesc(h.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
export function readMeta(html) {
  const t = /<title>([\s\S]*?)<\/title>/i.exec(html), d = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html);
  return { title: t ? unesc(t[1]).trim() : "", description: d ? unesc(d[1]).trim() : "" };
}
export function readFaq(html, lang) {
  const out = [];
  for (const m of html.matchAll(/<details\b[^>]*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi)) {
    const q = text(m[1]), a = text(m[2]);
    if (q && a) out.push({ q, a, lang: /[\u4e00-\u9fff]/.test(q) ? "zh-CN" : lang });
  }
  return out;
}

/* ---------- date di ultima modifica, da git (se manca la storia, il campo si omette: mai una data inventata) ---------- */
export function gitDate(sources, first = false) {
  try {
    const a = ["log", ...(first ? ["--diff-filter=A", "--reverse"] : ["-1"]), "--format=%cI", "--", ...sources.filter((s) => fs.existsSync(path.join(ROOT, s)))];
    if (a.length < 5) return undefined;
    const out = execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split("\n").filter(Boolean);
    return out[0] ? out[0].slice(0, 10) : undefined;
  } catch (e) { return undefined; }
}

/* ---------- il grafo di una pagina ---------- */
export function graphFor(page, html, ctx = {}) {
  if (page.noindex) return null;
  const url = SITE + page.path, meta = readMeta(html), modified = ctx.modified || undefined, lang = page.lang;
  const nodes = [build("Organization", { lang }), build("WebSite", { lang })];
  const crumbs = page.path === "/" || page.path === "/zh/" ? null : [[TXT[lang].crumb, SITE + "/"], [page.crumb, url]];
  if (page.kind === "home") {
    nodes.push(build("WebPage", { url, name: meta.title, description: meta.description, lang, about: ID.android, image: SITE + "/img/anteprima.png", modified }));
    nodes.push(build("MobileApplication", { lang }), build("WebApplication", { lang }));
    const faq = readFaq(html, lang);
    if (faq.length) nodes.push(build("FAQPage", { url, questions: faq }));
  } else if (page.kind === "article") {
    nodes.push(build("WebPage", { url, name: meta.title, description: meta.description, lang, type: "WebPage", breadcrumb: true, modified }));
    nodes.push(build("Article", { url, headline: (meta.title.split("·")[0] || meta.title).trim(), description: meta.description, image: SITE + "/img/manifesto-og.png", lang: "it", published: ctx.published, modified }));
  } else nodes.push(build("WebPage", { url, name: meta.title, description: meta.description, lang, breadcrumb: true, modified }));
  if (crumbs) nodes.push(build("BreadcrumbList", { url, items: crumbs }));
  return graph(nodes);
}

/* ---------- aggiunge al <head> ciò che manca (mai doppioni) ---------- */
export function decorate(html, page, ctx = {}) {
  const url = SITE + page.path, meta = readMeta(html), add = [];
  const has = (re) => re.test(html);
  if (page.noindex) { if (!has(/<meta\s+name="robots"/i)) add.push('<meta name="robots" content="noindex, follow">'); }
  else {
    if (!has(/<link\s+rel="canonical"/i)) add.push(`<link rel="canonical" href="${url}">`);
    if (!has(/<meta\s+name="robots"/i)) add.push('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">');
    if (page.kind === "home") for (const [l, p] of ALT.concat([["x-default", "/"]])) if (!has(new RegExp(`hreflang="${l}"`))) add.push(`<link rel="alternate" hreflang="${l}" href="${SITE}${p}">`);
    const og = (k, v) => { if (v && !has(new RegExp(`property="${k}"`))) add.push(`<meta property="${k}" content="${v.replace(/"/g, "&quot;")}">`); };
    og("og:site_name", "màndarínō"); og("og:locale", page.lang === "zh-CN" ? "zh_CN" : "it_IT");
    if (page.kind === "home") og("og:locale:alternate", page.lang === "zh-CN" ? "it_IT" : "zh_CN");
    og("og:url", url); og("og:type", page.kind === "article" ? "article" : "website");
    if (meta.title) og("og:title", meta.title);
    if (meta.description) og("og:description", meta.description);
    og("og:image", SITE + (page.kind === "article" ? "/img/manifesto-og.png" : "/img/anteprima.png"));
    const tw = (k, v) => { if (v && !has(new RegExp(`name="${k}"`))) add.push(`<meta name="${k}" content="${v.replace(/"/g, "&quot;")}">`); };
    tw("twitter:card", "summary_large_image"); tw("twitter:title", meta.title); tw("twitter:description", meta.description);
    tw("twitter:image", SITE + (page.kind === "article" ? "/img/manifesto-og.png" : "/img/anteprima.png"));
    const g = graphFor(page, html, ctx); if (g) add.push(ldScript(g));
  }
  return add.length ? html.replace(/<\/head>/i, "  " + add.join("\n  ") + "\n</head>") : html;
}

/* ---------- sitemap, robots, llms.txt ---------- */
export function sitemapXml(ctx = {}) {
  const urls = PAGES.filter((p) => !p.noindex).map((p) => {
    const alt = p.kind === "home" ? ALT.concat([["x-default", "/"]]).map(([l, a]) => `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${a}"/>`).join("") : "";
    const lm = ctx.lastmod && ctx.lastmod[p.path];
    const img = p.path === "/" ? `\n    <image:image><image:loc>${SITE}/img/anteprima.png</image:loc></image:image>` : p.path === "/manifesto.html" ? `\n    <image:image><image:loc>${SITE}/img/manifesto-og.png</image:loc></image:image>` : "";
    return `  <url>\n    <loc>${SITE}${p.path}</loc>${lm ? `\n    <lastmod>${lm}</lastmod>` : ""}\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.prio}</priority>${alt}${img}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>\n`;
}
export function robotsTxt() {
  return `# màndarínō: tutto il sito è pubblico, tranne la pagina del consenso (si apre solo dall'app).\nUser-agent: *\nAllow: /\nDisallow: /partecipa-voci.html\n\nSitemap: ${SITE}/sitemap.xml\n`;
}
export function llmsTxt() {
  return `# màndarínō

> App gratuita, offline e senza pubblicità per imparare il cinese (per italiani) e l'italiano (per chi parla cinese). Nessuna registrazione, nessun tracciamento, nessun dato lascia il dispositivo.

## Pagine
- [Presentazione (italiano)](${SITE}/): che cos'è, funzioni, come si installa, domande frequenti
- [Presentazione (中文)](${SITE}/zh/): 给中国人的意大利语
- [Provala nel browser](${SITE}/app/): l'app completa, funziona anche senza connessione
- [Manifesto](${SITE}/manifesto.html): i princìpi del progetto, in italiano e cinese
- [Privacy](${SITE}/privacy.html): cosa non viene raccolto

## Download e codice
- [APK Android](${APK}): ultima versione
- [Codice sorgente](${REPO}): licenza MIT, aperto a contributi

## Fatti
- Prezzo: gratis, senza acquisti né abbonamenti
- Lingue: italiano e cinese semplificato (pinyin, caratteri, toni)
- Funziona offline; i progressi restano sul dispositivo
`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const p of PAGES) {
    const f = p.src && path.join(ROOT, p.src);
    if (!f || !fs.existsSync(f) || p.noindex) continue;
    console.log("== " + p.path); console.log(JSON.stringify(graphFor(p, fs.readFileSync(f, "utf8"), { modified: gitDate(p.sources) }), null, 1).slice(0, 4000));
  }
}
