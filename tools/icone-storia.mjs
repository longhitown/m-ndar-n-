#!/usr/bin/env node
/* màndarínō · le figure di icone/DESIGN.md: l'evoluzione grafica che ha portato al set D2, disegnata, non a parole.
   Scrive icone/design/*.svg. Le forme finali (D2) si leggono da icone/svg/; le versioni precedenti (A, B, C, D) e la «emoji tipica»
   sono qui sotto, perché non fanno parte del set ma servono a raccontare come ci siamo arrivati. Nessuna dipendenza.
   node tools/icone-storia.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), ".."), DIR = path.join(ROOT, "icone"), OUT = path.join(DIR, "design");
const FONT = `font-family="system-ui, 'Noto Sans', 'Noto Sans CJK SC', 'PingFang SC', sans-serif"`;
const INK = "#2A2A26", MUTED = "#6B6A62", PAPER = "#FAF7EE", LINE = "#E4DFD0";

/* ---- le forme finali, dai file veri ---- */
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));
const inner = (id) => { const i = manifest.icone.find((x) => x.id === id); const s = fs.readFileSync(path.join(DIR, i.file), "utf8"); return s.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/\s*<title[^>]*>[\s\S]*?<\/title>/, "").trim(); };
const BASE = `fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
const at = (body, x, y, size, vars = "") => `<g transform="translate(${x} ${y}) scale(${size / 24})" ${BASE}${vars ? ` style="${vars}"` : ""}>${body}</g>`;
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" ${FONT} font-size="${o.size || 15}" fill="${o.fill || INK}"${o.bold ? ' font-weight="700"' : ""}${o.anchor ? ` text-anchor="${o.anchor}"` : ""}>${s}</text>`;
const svgDoc = (w, h, title, desc, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">\n<title id="t">${title}</title>\n<desc id="d">${desc}</desc>\n<rect width="${w}" height="${h}" fill="${PAPER}"/>\n${body}\n</svg>\n`;
const write = (f, s) => { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, f), s); console.log("✓ icone/design/" + f); };

/* ---- le versioni precedenti: solo per il racconto ---- */
const OLD = {
  flame: { m: [{ d: "M12 3c.9 3.4 5 5.4 5 9.9a5 5 0 0 1-10 0c0-2 1-3.2 2-4.1.3 1.2 1 1.8 1.8 2C10.6 8.4 11 5.5 12 3z", f: 1 }], a: [{ d: "M12 19.2a2.3 2.3 0 0 1-2.3-2.3c0-1.3 1.2-2 2.3-3.2 1.1 1.2 2.3 1.9 2.3 3.2a2.3 2.3 0 0 1-2.3 2.3z", f: 1 }] },
  book: { m: [{ d: "M4 5.6C7 4.6 10 5 12 6.8c2-1.8 5-2.2 8-1.2V18c-3-1-6-.6-8 1.3C10 17.4 7 17 4 18z", f: 1 }], a: [{ d: "M12 6.8v12.5" }] },
  bell: { m: [{ d: "M6 16.5v-5.2a6 6 0 0 1 12 0v5.2l1.5 2h-15z", f: 1 }], a: [{ d: "M10 21a2 2 0 0 0 4 0" }, { d: "M12 3.2v2" }] }
};
let uid = 0;
const sh = (p, at2) => p.c ? `<circle cx="${p.c[0]}" cy="${p.c[1]}" r="${p.c[2]}" ${at2}/>` : `<path d="${p.d}" ${at2}/>`;
const J = `stroke-linecap="round" stroke-linejoin="round"`;
const sA = (g) => g.m.map((p) => sh(p, `fill="none" stroke="#2A2A26" stroke-width="2.3" opacity=".22" transform="translate(.55 .45)" ${J}`) + sh(p, `fill="none" stroke="#2A2A26" stroke-width="1.7" ${J}`)).join("") + g.a.map((p) => sh(p, `fill="${p.f ? "#C23A31" : "none"}" stroke="#C23A31" stroke-width="1.7" ${J}`)).join("");
const sB = (g) => { const id = "b" + uid++; return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3AD8A3" stop-opacity=".55"/><stop offset="1" stop-color="#14594A" stop-opacity=".18"/></linearGradient></defs>` + g.m.map((p) => sh(p, `fill="url(#${id})" stroke="#14594A" stroke-width="1.8" ${J}`)).join("") + g.a.map((p) => sh(p, `fill="${p.f ? "#1F8A6E" : "none"}" stroke="#1F8A6E" stroke-width="1.8" ${J}`)).join(""); };
const sC = (g) => { const id = "c" + uid++; return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F58A1F"/><stop offset="1" stop-color="#D95000"/></linearGradient></defs><rect x="1" y="1" width="22" height="22" rx="6.2" fill="url(#${id})" stroke="none"/><g transform="translate(12 12) scale(.64) translate(-12 -12)">${g.m.concat(g.a).map((p) => sh(p, `fill="${p.f ? "#FAF7EE" : "none"}" fill-opacity=".95" stroke="#FAF7EE" stroke-width="1.6" ${J}`)).join("")}</g>`; };
const sD1 = (g) => g.m.map((p) => sh(p, `fill="#F58A1F" fill-opacity=".2" stroke="#D95000" stroke-width="1.8" ${J}`)).join("") + g.a.map((p) => sh(p, `fill="${p.f ? "#B8322A" : "none"}" stroke="#B8322A" stroke-width="1.8" ${J}`)).join("");
/* la «emoji tipica»: piena, ombreggiata, con il contorno scuro e la lucina, quella che ha ogni telefono */
const cartoon = {
  flame: () => { const id = "f" + uid++; return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE066"/><stop offset=".55" stop-color="#FF8A00"/><stop offset="1" stop-color="#E02A1B"/></linearGradient></defs><path d="${OLD.flame.m[0].d}" fill="url(#${id})" stroke="#7A2E00" stroke-width="2.2" ${J}/><path d="${OLD.flame.a[0].d}" fill="#FFF3B0" stroke="none"/><ellipse cx="9.2" cy="14" rx=".9" ry="1.8" fill="#fff" opacity=".7"/>`; },
  book: () => { const id = "k" + uid++; return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6EA8FF"/><stop offset="1" stop-color="#2B5FD9"/></linearGradient></defs><path d="${OLD.book.m[0].d}" fill="url(#${id})" stroke="#13306F" stroke-width="2.2" ${J}/><path d="M5.6 8.4c2-.5 4-.2 5.4.9M13 9.3c1.4-1.1 3.4-1.4 5.4-.9" stroke="#fff" stroke-width="1.2" opacity=".8" ${J}/><path d="M12 6.8v12.5" stroke="#13306F" stroke-width="1.6" ${J}/>`; },
  bell: () => { const id = "e" + uid++; return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE680"/><stop offset="1" stop-color="#E5A200"/></linearGradient></defs><path d="${OLD.bell.m[0].d}" fill="url(#${id})" stroke="#6B4600" stroke-width="2.2" ${J}/><circle cx="12" cy="20.4" r="1.9" fill="#E5A200" stroke="#6B4600" stroke-width="1.8"/><path d="M8.6 10.2c.4-1.6 1.6-2.6 3-2.8" stroke="#fff" stroke-width="1.4" opacity=".85" ${J}/><path d="M12 3.2v2" stroke="#6B4600" stroke-width="2" ${J}/>`; }
};

/* ============ figura 1: dal carattere al segno ============ */
{
  const R = [
    { hz: "火", it: "fuoco", n: "huǒ", ic: "flame", sk: ["M8.2 6.4L6.6 9.6", "M15.8 6.4L17.4 9.6", "M12 4.2C12.7 9.4 11.4 15.6 5.4 19.8", "M10.6 11C13.2 15 15.6 17.8 19.2 19.8"],
      nota: ["Quattro tratti: due scintille e due che si aprono.", "Prendiamo l'apertura: la fiamma non è una goccia", "chiusa, e la fiammella interna è un punto pieno", "a parte, in cinabro."] },
    { hz: "心", it: "cuore", n: "xīn", ic: "heart", sk: ["M6.2 8.6L8 11.2", "M10.4 7.6V14.8C10.4 17.2 11.8 18.5 14 18.5C16.2 18.5 17.8 17.8 18.5 15.4", "M13.6 7L14.4 10.2", "M17.4 8.4L19 10.8"],
      nota: ["Un gancio (钩) che frena e riparte, con tre punti.", "Prendiamo la curva asimmetrica: il cuore non è", "fatto di due semicerchi uguali; lo riempiamo di", "cinabro, come un sigillo."] },
    { hz: "门", it: "porta", n: "mén", ic: "lock", sk: ["M6.6 5.4L8.6 7.8", "M6.2 10V20", "M10 9H17.8V20.6Q17.8 21.2 16.8 21"],
      nota: ["Una porta: l'asta che scende e il tratto con il gancio.", "Prendiamo il vuoto tra battente e stipite: l'arco", "del lucchetto fluttua sopra il corpo, senza", "toccarlo."] },
    { hz: "日", it: "sole, giorno", n: "rì", ic: "calendar", sk: ["M7.4 4.6V19.6", "M7.4 4.6H16.8V19.6", "M7.4 12.1H16.8", "M7.4 19.6H16.8"],
      nota: ["Una finestra divisa in due, che vuol dire «giorno».", "Prendiamo la linea di mezzo: è l'intestazione del", "calendario, e il punto cinabro è il giorno", "che conta."] }
  ];
  const W = 980, rowH = 196, top = 108;
  let b = T(24, 40, "Dal carattere al segno", { size: 26, bold: true }) + T(24, 62, "Quattro caratteri, quattro icone: che cosa abbiamo preso da ognuno.", { fill: MUTED, size: 15 }) + T(24, 82, "Gli schizzi dei tratti sono nostri e semplificati: non sono dati di calligrafia.", { fill: MUTED, size: 13 });
  b += T(150, top - 8, "Il carattere", { fill: MUTED, size: 14, anchor: "middle" }) + T(420, top - 8, "Che cosa ci prendiamo", { fill: MUTED, size: 14 }) + T(880, top - 8, "Il segno D2", { fill: MUTED, size: 14, anchor: "middle" });
  R.forEach((r, i) => {
    const y = top + i * rowH;
    b += `<line x1="24" y1="${y}" x2="${W - 24}" y2="${y}" stroke="${LINE}"/>`;
    b += at(r.sk.map((d, k) => `<path d="${d}" style="stroke:${["#2A2A26", "#2A2A26", "#2A2A26", "#2A2A26"][k]}" opacity="${1 - k * .12}"/>`).join(""), 62, y + 12, 160);
    b += T(150, y + 188, `${r.hz}  ${r.n} · ${r.it}`, { size: 14, fill: MUTED, anchor: "middle" });
    b += `<path d="M236 ${y + 92}h46m-8 -8l8 8l-8 8" fill="none" stroke="${MUTED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    r.nota.forEach((l, k) => { b += T(310, y + 58 + k * 26, l, { size: 16, bold: k === 0 }); });
    b += `<path d="M806 ${y + 92}h-46m8 -8l-8 8l8 8" fill="none" stroke="${MUTED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    b += at(inner(r.ic), 800, y + 12, 160);
  });
  write("01-dal-carattere-al-segno.svg", svgDoc(W, top + R.length * rowH + 20, "Dal carattere al segno", "Quattro caratteri (fuoco, cuore, porta, giorno) accanto alle icone D2 che ne ricavano una proprietà del tratto.", b));
}

/* ============ figura 2: l'evoluzione ============ */
{
  const cols = [
    ["Emoji tipica", ["Piena, ombreggiata,", "contorno scuro: il", "linguaggio di tutti."], (id) => cartoon[id]()],
    ["A · Carta di riso", ["Inchiostro e velo", "di pennello. Si", "spegne a 16 px."], (id) => sA(OLD[id])],
    ["B · Giada", ["Bei corpi, tratto", "solido. Verde freddo,", "come i pulsanti."], (id) => sB(OLD[id])],
    ["C · Sigillo", ["Il colore giusto, ma", "ogni icona chiusa", "in un timbro."], (id) => sC(OLD[id])],
    ["D · Sintesi", ["Glifo libero, tutto", "arancio: velo ovunque,", "cinabro sbavato."], (id) => sD1(OLD[id])],
    ["D2 · Finale", ["Velo solo sui corpi", "pieni, cinabro solo", "in punti, aria."], (id) => inner(id)]
  ];
  const ids = ["flame", "book", "bell"], W = 1000, cw = 150, x0 = 50, y0 = 128, rh = 150;
  let b = T(24, 40, "L'evoluzione grafica", { size: 26, bold: true }) + T(24, 66, "Tre icone, sei passaggi: dall'emoji che hanno tutti al segno di màndarínō.", { fill: MUTED, size: 15 });
  cols.forEach((c, k) => {
    const x = x0 + k * (cw + 8) + cw / 2;
    b += T(x, y0 - 26, c[0], { bold: true, size: 15, anchor: "middle" }) + c[1].map((l, j) => T(x, y0 + ids.length * rh + 22 + j * 18, l, { size: 13, fill: MUTED, anchor: "middle" })).join("");
    ids.forEach((id, r) => {
      const y = y0 + r * rh;
      b += `<rect x="${x - 66}" y="${y - 12}" width="132" height="132" rx="14" fill="#fff" stroke="${k === 5 ? "#DB5F00" : LINE}" stroke-width="${k === 5 ? 2 : 1}"/>`;
      b += at(c[2](id), x - 52, y + 2, 104);
    });
  });
  write("02-evoluzione.svg", svgDoc(1000, y0 + ids.length * rh + 90, "L'evoluzione grafica delle icone", "Fiamma, libro e campana in sei versioni: emoji tipica, A carta di riso, B giada, C sigillo, D sintesi, D2 finale.", b));
}

/* ============ figura 3: la sottrazione (la campana) ============ */
{
  const BODY = OLD.bell.m[0].d;
  const steps = [
    ["1 · Tutto", "ombra, luce, bordo, battaglio, suoni", () => `<ellipse cx="12" cy="22.2" rx="6.5" ry="1" fill="#000" opacity=".18"/>` + cartoon.bell() + `<path d="M3 9a9 9 0 0 1 2-4.5M21 9a9 9 0 0 0-2-4.5" stroke="#6B4600" stroke-width="1.2" ${J}/><path d="M5.4 16.5h13.2" stroke="#6B4600" stroke-width="1.2" ${J}/>`],
    ["2 · Via ombra e luce", "resta il contorno", () => `<path d="${BODY}" fill="#F7C948" stroke="#6B4600" stroke-width="2" ${J}/><circle cx="12" cy="20.4" r="1.9" fill="#F7C948" stroke="#6B4600" stroke-width="1.8"/><path d="M12 3.2v2" stroke="#6B4600" stroke-width="2" ${J}/><path d="M3 9a9 9 0 0 1 2-4.5M21 9a9 9 0 0 0-2-4.5" stroke="#6B4600" stroke-width="1.2" ${J}/><path d="M5.4 16.5h13.2" stroke="#6B4600" stroke-width="1.2" ${J}/>`],
    ["3 · Via i suoni e il bordo", "una sola forma", () => `<path d="${BODY}" fill="none" stroke="#DB5F00" stroke-width="1.8" ${J}/><circle cx="12" cy="20.4" r="1.9" fill="none" stroke="#DB5F00" stroke-width="1.8"/><path d="M12 3.2v2" stroke="#DB5F00" stroke-width="1.8" ${J}/>`],
    ["4 · Stacco il battaglio", "uno spazio bianco (留白)", () => `<path d="M6.3 17V11.3A5.7 5.7 0 0 1 17.7 11.3V17L19.3 18.8H4.7Z" fill="none" stroke="#DB5F00" stroke-width="1.8" ${J}/><circle cx="12" cy="21" r="1.5" fill="none" stroke="#DB5F00" stroke-width="1.8"/><path d="M12 3.4V5.1" stroke="#DB5F00" stroke-width="1.8" ${J}/>`],
    ["5 · Un solo punto di colore", "il battaglio, in cinabro", () => inner("bell")]
  ];
  const W = 1000, cw = 176, x0 = 40, y0 = 120;
  let b = T(24, 40, "La sottrazione", { size: 26, bold: true }) + T(24, 66, "Come si arriva a un segno: si toglie, finché non si può togliere altro senza perdere la campana.", { fill: MUTED, size: 15 });
  steps.forEach((s, k) => {
    const x = x0 + k * (cw + 8) + cw / 2;
    b += `<rect x="${x - 80}" y="${y0 - 10}" width="160" height="160" rx="14" fill="#fff" stroke="${k === 4 ? "#DB5F00" : LINE}" stroke-width="${k === 4 ? 2 : 1}"/>` + at(s[2](), x - 64, y0 + 6, 128);
    b += T(x, y0 + 178, s[0], { bold: true, size: 14.5, anchor: "middle" }) + T(x, y0 + 198, s[1], { size: 12.5, fill: MUTED, anchor: "middle" });
  });
  b += T(24, y0 + 244, "«Complicare è facile, semplificare è difficile.» — Bruno Munari. Qui la sottrazione vale quanto il vuoto di un foglio cinese: il bianco fa parte del segno.", { size: 14, fill: MUTED });
  write("03-sottrazione.svg", svgDoc(W, y0 + 274, "La sottrazione: la campana", "Cinque passaggi dalla campana ricca di dettagli alla forma finale con un solo punto di colore.", b));
}

/* ============ figura 4: nove quadri ============ */
{
  const ids = ["book", "search", "bell", "lock"], W = 1000, y0 = 110, cw = 230;
  let b = T(24, 40, "La costruzione: nove quadri", { size: 26, bold: true }) + T(24, 66, "Il quadrato 24 × 24 con 2 px di margine, diviso in nove (la griglia dei quaderni di calligrafia). Fāngkuài (方块): ogni segno vive in un quadrato.", { fill: MUTED, size: 15 });
  ids.forEach((id, k) => {
    const x = 36 + k * (cw + 10), s = 200;
    const u = s / 24;
    b += `<rect x="${x}" y="${y0}" width="${s}" height="${s}" rx="10" fill="#fff" stroke="${LINE}"/>`;
    b += `<g stroke="#9A988C" stroke-width=".8" fill="none" opacity=".7"><rect x="${x + 2 * u}" y="${y0 + 2 * u}" width="${20 * u}" height="${20 * u}"/><path d="M${x + 8.67 * u} ${y0 + 2 * u}v${20 * u}M${x + 15.33 * u} ${y0 + 2 * u}v${20 * u}M${x + 2 * u} ${y0 + 8.67 * u}h${20 * u}M${x + 2 * u} ${y0 + 15.33 * u}h${20 * u}"/><path d="M${x + 2 * u} ${y0 + 2 * u}L${x + 22 * u} ${y0 + 22 * u}M${x + 22 * u} ${y0 + 2 * u}L${x + 2 * u} ${y0 + 22 * u}" stroke-dasharray="3 4" opacity=".6"/></g>`;
    b += at(inner(id), x, y0, s);
    b += T(x + s / 2, y0 + s + 26, manifest.icone.find((i) => i.id === id).it, { size: 15, anchor: "middle", bold: true });
  });
  [["Due pagine, uno spazio", "al posto della costola."], ["La lente è aperta", "dove nasce il manico."], ["Il battaglio sospeso", "sul nodo in basso."], ["L'arco non tocca", "il corpo."]].forEach((ls, k) => { ls.forEach((l, j) => { b += T(36 + k * (cw + 10) + 100, y0 + 262 + j * 18, l, { size: 13, fill: MUTED, anchor: "middle" }); }); });
  write("04-nove-quadri.svg", svgDoc(W, y0 + 296, "La costruzione a nove quadri", "Quattro icone sopra la griglia di nove quadri con le diagonali.", b));
}

/* ============ figura 5: dove ci siamo fermati ============ */
{
  const BODY = "M6.3 17V11.3A5.7 5.7 0 0 1 17.7 11.3V17L19.3 18.8H4.7Z";
  const oltre = () => { const id = "o" + uid++; return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB45C"/><stop offset="1" stop-color="#DB5F00"/></linearGradient></defs><path d="${BODY}" fill="url(#${id})" fill-opacity=".55" stroke="#DB5F00" stroke-width="2.7" ${J}/><path d="M7.6 17V11.3A4.4 4.4 0 0 1 16.4 11.3V17" fill="none" stroke="#fff" stroke-width="1" opacity=".7" ${J}/><path d="M9.2 11A3 3 0 0 1 12 8.4" fill="none" stroke="#C0281D" stroke-width="1.4" ${J}/><circle cx="12" cy="21" r="1.7" fill="#C0281D"/><path d="M12 3.1V5.2" stroke="#DB5F00" stroke-width="2.7" ${J}/><path d="M4.4 19.6H19.6" stroke="#C0281D" stroke-width="1" opacity=".5" ${J}/>`; };
  const sizes = [16, 20, 24, 48], W = 1000, y0 = 120;
  let b = T(24, 40, "Dove ci siamo fermati", { size: 26, bold: true }) + T(24, 62, "Un passo oltre D2 (tratti più spessi, sfumature, filetti, luci) rende l'icona più «ricca» e peggiore.", { fill: MUTED, size: 15 }) + T(24, 82, "Lo abbiamo provato, e ci siamo fermati.", { fill: MUTED, size: 15 });
  [["D2 (scelta)", () => inner("bell"), 60, "#DB5F00"], ["Un passo oltre (scartato)", oltre, 520, "#9A988C"]].forEach(([nome, fn, x, col]) => {
    b += T(x, y0 - 14, nome, { bold: true, size: 16 });
    sizes.forEach((z, k) => {
      const xx = x + [0, 60, 130, 210][k];
      b += `<rect x="${xx - 8}" y="${y0 + 6}" width="${z + 16}" height="${z + 16}" rx="8" fill="#fff" stroke="${col}" stroke-opacity=".5"/>` + at(fn(), xx, y0 + 14, z) + T(xx + z / 2, y0 + z + 44, z + " px", { size: 12.5, fill: MUTED, anchor: "middle" });
    });
  });
  b += T(24, y0 + 120, "A 16 e 20 px:", { bold: true, size: 15 });
  ["D2: la forma si legge, il battaglio stacca, il punto rosso è un punto.", "Un passo oltre: il contorno spesso chiude gli spazi (sparisce il vuoto), le sfumature impastano,", "il filetto rosso sembra una sbavatura. Più segno, meno segno leggibile."].forEach((l, k) => { b += T(24, y0 + 148 + k * 24, l, { size: 14.5, fill: k ? MUTED : INK }); });
  b += T(24, y0 + 244, "Criteri per fermarsi: (1) leggibile a 16 px; (2) un solo punto di colore pieno; (3) gli spazi bianchi", { size: 14.5, bold: true }) + T(24, y0 + 268, "restano aperti; (4) stessa massa visiva per tutte; (5) nessun dettaglio che non sopravviva alla riduzione.", { size: 14.5, bold: true });
  write("05-dove-ci-siamo-fermati.svg", svgDoc(W, y0 + 296, "Dove ci siamo fermati", "La campana D2 e una versione più ricca scartata, a 16, 20, 24 e 48 pixel.", b));
}

/* ============ figura 6: tre colori, tre fondi ============ */
{
  const ids = ["flame", "book", "mic"], W = 1000, y0 = 120;
  const panels = [["Carta di riso", "#FAF7EE", "", INK], ["Tema scuro", "#161A18", "--im:#FF9A3D;--iv:#FF9A3D;--ia:#FF5A4D", "#EDEAE0"], ["Pulsante pieno", "#14594A", "--im:#FAF7EE;--iv:#FAF7EE;--ia:#FAF7EE", "#FAF7EE"]];
  let b = T(24, 40, "Tre colori, tre fondi", { size: 26, bold: true }) + T(24, 62, "Tratto arancio mandarino #DB5F00, cinabro #C0281D solo in punti pieni, velo del tratto al 16 %.", { fill: MUTED, size: 15 }) + T(24, 82, "Sul tema scuro cambiano i valori; nei pulsanti pieni tutto diventa avorio.", { fill: MUTED, size: 15 });
  panels.forEach(([n, bg, vars, fg], k) => {
    const x = 36 + k * 316;
    b += `<rect x="${x}" y="${y0 - 12}" width="296" height="180" rx="16" fill="${bg}" stroke="${LINE}"/>` + T(x + 20, y0 + 14, n, { size: 15, bold: true, fill: fg });
    ids.forEach((id, j) => { b += at(inner(id), x + 24 + j * 92, y0 + 34, 72, vars); });
    b += [16, 20, 24].map((z, j) => at(inner("bell"), x + 28 + j * 44, y0 + 120, z, vars)).join("");
  });
  write("06-tre-colori-tre-fondi.svg", svgDoc(W, y0 + 190, "Tre colori, tre fondi", "Le stesse icone sulla carta di riso, sul tema scuro e dentro un pulsante pieno verde bosco, in avorio.", b));
}
