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
