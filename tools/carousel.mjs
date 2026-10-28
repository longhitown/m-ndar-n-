/* màndarínō · caroselli e immagini per i social, dai dati dell'app (nessun testo scritto due volte: parole, pinyin e significati vengono da
   src/data, quindi sono gli stessi che l'app ha già controllato). Si disegnano come pagine HTML e si salvano in PNG con Playwright.
     node tools/carousel.mjs --serie bar --lingua it            carosello in italiano (per chi studia il cinese)
     node tools/carousel.mjs --serie ciao --lingua zh           carosello in cinese (per chi studia l'italiano)
     node tools/carousel.mjs --serie toni --formato storia      formati: post (1080×1350, 4:5), quadrato (1080×1080), storia (1080×1920)
     node tools/carousel.mjs --elenco                           le serie disponibili
   Le serie stanno in SERIE qui sotto: aggiungerne una vuol dire elencare le parole (carattere cinese) o le righe. Regole di tono: niente
   mascotte, niente urgenza finta, niente promesse; «gratis · offline · senza pubblicità» e l'indirizzo, mai «scarica ora». */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";
import { load } from "./lib/data.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FORMATI = { post: [1080, 1350], quadrato: [1080, 1080], storia: [1080, 1920] };
const D = load(path.join(ROOT, "src"));
const W = {}; D.SECTIONS.forEach((s) => s.words.forEach((w) => { if (!W[w[1]]) W[w[1]] = { py: w[0].replace(/\./g, ""), it: w[2], hz: w[1] }; }));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---- le serie ---- */
const SERIE = {
  bar: { lingua: "it", titolo: "Al bar, in cinese", sotto: "Cinque parole per ordinare senza paura", parole: ["咖啡", "茶", "水", "牛奶", "谢谢"] },
  saluti: { lingua: "it", titolo: "Saluti in cinese", sotto: "Le prime quattro parole da dire", parole: ["你好", "谢谢", "再见", "对不起"] },
  ciao: { lingua: "zh", titolo: "意大利语：每天用得到的五个词", sotto: "先学会这些，就能开口了", righe: [["ciao", "你好 / 再见（熟人之间）", "Ciao! Come stai?", "你好！你好吗？"], ["buongiorno", "早上好 / 你好（白天）", "Buongiorno, signora.", "您好，女士。"], ["grazie", "谢谢", "Grazie mille!", "非常感谢！"], ["prego", "不客气 / 请", "Prego, si accomodi.", "请进，请坐。"], ["scusi", "对不起 / 打扰一下", "Scusi, dov'è la stazione?", "请问，车站在哪里？"]] },
  toni: { lingua: "it", titolo: "I quattro toni", sotto: "Una sillaba, quattro significati", toni: [["mā", "妈", "mamma", "piatto e alto"], ["má", "麻", "canapa", "sale"], ["mǎ", "马", "cavallo", "scende e risale"], ["mà", "骂", "rimproverare", "cade secco"]] },
};

/* ---- le pagine ---- */
const CSS = `*{box-sizing:border-box;margin:0}body{font-family:system-ui,-apple-system,"Segoe UI","PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif;background:#F5F7F5;color:#16201B;overflow:hidden}
.p{position:relative;display:flex;flex-direction:column;justify-content:center;padding:96px 90px;background:radial-gradient(circle at 10% 8%,#E4EFE9 0,transparent 40%),radial-gradient(circle at 92% 94%,#FBE7D2 0,transparent 38%),#F5F7F5}
.top{position:absolute;top:64px;left:90px;right:90px;display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:34px;letter-spacing:.02em}
.top i{font-style:normal;font-weight:700;font-size:28px;color:#4A5A52}
.foot{position:absolute;left:90px;right:90px;bottom:64px;display:flex;justify-content:space-between;font-size:28px;font-weight:700;color:#14594A}
.foot span:last-child{color:#4A5A52;font-weight:600}
.kick{font-size:30px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#14594A}
h1{font-size:118px;line-height:1.08;font-weight:800;margin:22px 0}
.sub{font-size:48px;line-height:1.3;color:#4A5A52}
.hz{font-size:360px;line-height:1.05;font-family:"Kaiti SC","STKaiti","KaiTi","Noto Serif SC","Noto Sans CJK SC",serif}
.py{font-size:110px;font-weight:800;color:#14594A;margin-top:10px}
.gl{font-size:84px;font-weight:700;margin-top:16px}
.ex{margin-top:56px;padding:30px 36px;border-radius:28px;background:#fff;border:2px solid #D5DED9;font-size:40px;line-height:1.45}
.ex b{display:block;font-size:52px;margin-bottom:6px}
.it{font-size:170px;font-weight:800;line-height:1.05}
.tone{display:grid;grid-template-columns:repeat(2,1fr);gap:26px;margin-top:56px}
.tone div{background:#fff;border:2px solid #D5DED9;border-radius:28px;padding:26px 30px}
.tone b{display:block;font-size:84px;font-weight:800;color:#14594A}.tone span{font-size:44px;display:block}.tone small{font-size:30px;color:#4A5A52}
.orange{width:120px;height:120px;border-radius:60px;background:radial-gradient(circle at 35% 30%,#FFB23A,#F37905 60%,#B24A00);margin-bottom:30px}
.cta h1{font-size:104px}.cta .url{font-size:64px;font-weight:800;color:#14594A;margin-top:36px}
.pt{color:#C8312B}`;
function page(w, h, body, n, tot, nome) {
  return `<!doctype html><meta charset="utf-8"><style>${CSS}</style><body><div class="p" style="width:${w}px;height:${h}px"><div class="top"><span>màndarínō</span><i>${n}/${tot}</i></div>${body}<div class="foot"><span>${esc(nome)}</span><span>mandarinoapp.org</span></div></div></body>`;
}
function slides(key, S) {
  const zh = S.lingua === "zh", out = [];
  out.push(`<div class="orange"></div><div class="kick">${zh ? "màndarínō · 意大利语" : "màndarínō · cinese"}</div><h1>${esc(S.titolo)}</h1><div class="sub">${esc(S.sotto)}</div><div class="sub" style="margin-top:50px;font-size:38px">${zh ? "向右滑动 →" : "scorri →"}</div>`);
  if (S.parole) for (const hz of S.parole) {
    const w = W[hz]; if (!w) throw new Error("parola non trovata nel vocabolario: " + hz);
    const e = (D.EXAMPLES || {})[hz];
    out.push(`<div class="hz" lang="zh-CN">${esc(w.hz)}</div><div class="py">${esc(w.py)}</div><div class="gl">${esc(w.it)}</div>${e ? `<div class="ex" lang="zh-CN"><b>${esc(e[0])}</b><span lang="it">${esc(e[1])}</span></div>` : ""}`);
  }
  if (S.righe) for (const r of S.righe) out.push(`<div class="it" lang="it">${esc(r[0])}</div><div class="gl" lang="zh-CN">${esc(r[1])}</div><div class="ex"><b lang="it">${esc(r[2])}</b><span lang="zh-CN">${esc(r[3])}</span></div>`);
  if (S.toni) out.push(`<div class="kick" style="text-transform:none;font-size:56px;letter-spacing:0">ma</div><div class="tone">${S.toni.map((t) => `<div><b>${esc(t[0])}</b><span lang="zh-CN">${esc(t[1])} · ${esc(t[2])}</span><small>${esc(t[3])}</small></div>`).join("")}</div>`);
  out.push(`<div class="cta"><div class="orange"></div><h1>${zh ? "免费 · 离线<br>无广告" : "Gratis · offline<br>senza pubblicità"}</h1><div class="sub">${zh ? "不需要注册，也不收集数据。" : "Niente account, niente dati raccolti."}</div><div class="url">mandarinoapp.org</div></div>`);
  return out;
}

if (process.argv.includes("--elenco")) { for (const [k, s] of Object.entries(SERIE)) console.log(k.padEnd(8), s.lingua, s.titolo); process.exit(0); }
const key = arg("--serie", "bar"), S = SERIE[key], fmt = FORMATI[arg("--formato", "post")], out = path.resolve(ROOT, arg("--out", "_carousel/" + key));
if (!S || !fmt) { console.error("serie o formato sconosciuto: usa --elenco"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const { chromium } = createRequire(import.meta.url)("playwright");
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: fmt[0], height: fmt[1] } }), sl = slides(key, S);
for (let i = 0; i < sl.length; i++) {
  await p.setContent(page(fmt[0], fmt[1], sl[i], i + 1, sl.length, S.titolo));
  const f = path.join(out, key + "-" + String(i + 1).padStart(2, "0") + ".png"); await p.screenshot({ path: f }); console.log("✓ " + path.relative(ROOT, f));
}
await b.close();
