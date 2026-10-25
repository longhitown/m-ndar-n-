/* màndarínō · il traduttore del laboratorio (src/phrases/grammar.js) eseguito in Node, senza browser.
   Usato da tools/grammar.mjs e da tools/build.mjs per provare le frasi verificate a ogni build. */
import fs from "fs";
import path from "path";
import vm from "vm";
import { load, keysOf } from "./data.mjs";

export function lab(srcDir) {
  const D = load(srcDir), W = {}, ORDER = [];
  const K = keysOf(D.SECTIONS);
  for (const k of Object.keys(K)) { const w = K[k].w; W[k] = { key: k, py: w[0], hz: w[1], it: w[2], note: w[3] || "", sec: K[k].sec }; ORDER.push(k); }
  let MAXL = 1; ORDER.forEach((k) => { MAXL = Math.max(MAXL, Array.from(W[k].hz).length); });
  /* stessa regola di CP.segment in src/core/core.js: la parola più lunga del vocabolario che combacia */
  const segment = (raw) => {
    const s = Array.from(String(raw)), out = [], cjk = /[㐀-鿿]/; let i = 0;
    while (i < s.length) {
      if (!cjk.test(s[i])) { let j = i; while (j < s.length && !cjk.test(s[j])) j++; out.push({ w: null, raw: s.slice(i, j).join(""), p: true }); i = j; continue; }
      let m = null, L;
      for (L = Math.min(MAXL, s.length - i); L >= 1; L--) { const sub = s.slice(i, i + L).join(""); if (Object.prototype.hasOwnProperty.call(W, sub)) { m = W[sub]; break; } }
      if (m) { out.push({ w: m, raw: m.hz }); i += L; } else { out.push({ w: null, raw: s[i] }); i++; }
    }
    return out;
  };
  const CP = { WORDS: W, ORDER, esc: (s) => String(s), segment, gloss: (w) => String(w.it).split(/[;,(:]/)[0].trim() };
  const ctx = vm.createContext({ CP, console });
  ctx.window = ctx;
  for (const [k, v] of Object.entries(D)) if (v !== undefined && k !== "files") ctx[k] = v;
  for (const f of ["phrases/grammar.js", "phrases/italian.js", "phrases/translate.js"]) {
    const p = path.join(srcDir, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
  }
  const tokens = (zh) => segment(zh).filter((x) => x.w).map((x) => x.w.key);
  const unknown = (zh) => segment(zh).filter((x) => !x.w && !x.p).map((x) => x.raw);
  const punct = (zh) => /[?？]\s*$/.test(zh) ? "?" : /[!！]\s*$/.test(zh) ? "!" : ".";
  return { CP: ctx.CP, D, W, tokens, unknown, punct, translate: (zh, opt) => {
    /* un carattere fuori dal vocabolario: nel laboratorio non si può nemmeno comporre, qui la frase non si traduce */
    const unk = unknown(zh);
    if (unk.length) return { zh, it: ctx.CP.lab.NOPE, notes: [], sure: false, src: "", reason: "caratteri fuori dal vocabolario: " + unk.join("") };
    return ctx.CP.lab.translate(tokens(zh), punct(zh), opt);
  } };
}

/* le frasi verificate: le regole devono arrivare da sole alla stessa traduzione (tranne quelle segnate "memoria") */
export function verify(L) {
  const bad = [], memo = [], fixable = [];
  for (const v of L.D.VERIFIED || []) {
    const [zh, it, flag] = v, r = L.translate(zh, { rulesOnly: true });
    if (flag === "memoria") { memo.push(v); if (r.sure && r.it === it) fixable.push(v); continue; }
    if (!r.sure || r.it !== it) bad.push({ zh, want: it, got: r.it, why: r.reason || "" });
  }
  return { bad, memo, fixable, total: (L.D.VERIFIED || []).length };
}

/* lezioni: id unici, ogni frase cinese fatta di parole del vocabolario, esercizi coerenti */
export function checkLessons(L) {
  const err = [], ids = new Set(), CJK = /[㐀-鿿]/;
  const zhOk = (where, z) => { const u = L.unknown(z); if (u.length) err.push(`${where}: «${z}» usa caratteri fuori dal vocabolario (${u.join("")})`); };
  (L.D.LESSONS || []).forEach((l, i) => {
    const w = "lezione " + (l.id || i);
    if (!l.id || ids.has(l.id)) err.push(w + ": id mancante o doppio"); ids.add(l.id);
    ["title", "goal"].forEach((f) => { if (!l[f]) err.push(w + ": manca " + f); });
    if (!Array.isArray(l.body) || !l.body.length) err.push(w + ": manca la spiegazione (body)");
    if (l.path && !L.D.SECTIONS.some((s) => s.id === l.path)) err.push(w + ": la tappa «" + l.path + "» non esiste");
    (l.ex || []).forEach((e, j) => { if (!Array.isArray(e) || e.length < 2) err.push(w + ` ex[${j}]: deve essere [cinese, italiano]`); else zhOk(w + ` ex[${j}]`, e[0]); });
    (l.traps || []).forEach((t, j) => { if (!Array.isArray(t) || t.length !== 3) err.push(w + ` traps[${j}]: deve essere [sbagliata, giusta, perché]`); else { zhOk(w + ` traps[${j}]`, t[0]); zhOk(w + ` traps[${j}]`, t[1]); } });
    (l.quiz || []).forEach((q, j) => {
      const at = w + ` quiz[${j}]`;
      if (q.k === "order") { zhOk(at, q.zh); if (L.tokens(q.zh).length < 2) err.push(at + ": servono almeno due tessere"); if (!q.it) err.push(at + ": manca l'italiano"); }
      else if (q.k === "pick") {
        if (!q.q || !Array.isArray(q.opts) || q.opts.length < 2 || !(q.a >= 0 && q.a < q.opts.length)) err.push(at + ": servono q, opts (almeno 2) e a (l'indice giusto)");
        else q.opts.forEach((o) => { if (CJK.test(o) && !/[a-zàèéìòù]{3}/i.test(o)) zhOk(at, o); });
        if (q.zh) zhOk(at, q.zh);
      } else err.push(at + ": tipo «" + q.k + "» sconosciuto (order o pick)");
    });
  });
  return err;
}
