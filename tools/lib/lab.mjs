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
  /* lo stesso taglio in parole della pagina (src/core/segment.js) */
  const sctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(srcDir, "core/segment.js"), "utf8"), sctx, { filename: "core/segment.js" });
  const segment = vm.runInContext("MDSegment", sctx).make(W, D.WORD_FREQ);
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
/* le frasi d'esempio delle parole (src/data/examples): solo parole del vocabolario, e la parola deve uscire dal taglio
   come parola (中 non vale dentro 中国), altrimenti la scheda la mostrerebbe a vuoto */
export function checkExamples(L) {
  const err = [];
  for (const [k, e] of Object.entries(L.D.EXAMPLES || {})) {
    if (!L.W[k]) { err.push(`esempio per una parola che non esiste: ${k}`); continue; }
    if (!Array.isArray(e) || e.length !== 2 || !e[0] || !e[1]) { err.push(`esempio di ${k}: deve essere [cinese, italiano]`); continue; }
    const u = L.unknown(e[0]); if (u.length) { err.push(`esempio di ${k}: «${e[0]}» usa caratteri fuori dal vocabolario (${u.join("")})`); continue; }
    if (!L.CP.segment(e[0]).some((s) => s.w && s.w.hz === L.W[k].hz)) err.push(`esempio di ${k}: in «${e[0]}» la parola non risulta come parola (${L.tokens(e[0]).join("|")})`);
  }
  return err;
}

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
      } else if (q.k === "buco") {
        /* Task 12: la frase con il buco (＿ o ___) e le risposte; la frase completa con la risposta giusta deve essere fatta di parole del vocabolario */
        if (!q.zh || !/＿|___/.test(q.zh) || !Array.isArray(q.opts) || q.opts.length < 2 || !(q.a >= 0 && q.a < q.opts.length) || new Set(q.opts).size !== q.opts.length) err.push(at + ": servono zh con il buco (＿), opts diverse e a");
        else zhOk(at, q.zh.replace(/＿+|_{3,}/, q.opts[q.a]));
      } else if (q.k === "scrivi") {
        if (!q.a) err.push(at + ": manca la risposta (a)");
        if (q.py && !/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(q.a)) err.push(at + ": con py la risposta è pinyin con i toni");
        if (q.zh) zhOk(at, q.zh);
      } else err.push(at + ": tipo «" + q.k + "» sconosciuto (order, pick, buco o scrivi)");
    });
  });
  /* corso di italiano: le frasi da ricomporre devono avere almeno due parole; le risposte giuste devono esistere */
  const itIds = new Set();
  (L.D.ITLESSONS || []).forEach((l, i) => {
    const w = "corso it " + (l.id || i);
    if (!l.id || itIds.has(l.id)) err.push(w + ": id mancante o doppio"); itIds.add(l.id);
    ["title", "goal"].forEach((f) => { if (!l[f]) err.push(w + ": manca " + f); });
    (l.ex || []).forEach((e, j) => { if (!Array.isArray(e) || e.length !== 2 || !e[0] || !e[1]) err.push(w + ` ex[${j}]: deve essere [italiano, cinese]`); });
    (l.traps || []).forEach((t, j) => { if (!Array.isArray(t) || t.length !== 3) err.push(w + ` traps[${j}]: deve essere [sbagliato, giusto, perché]`); else if (t[0] === t[1]) err.push(w + ` traps[${j}]: sbagliato = giusto`); });
    (l.quiz || []).forEach((q, j) => {
      const at = w + ` quiz[${j}]`;
      if (q.k === "order") { if (String(q.it || "").split(/\s+/).filter(Boolean).length < 2 || !q.zh) err.push(at + ": servono it (almeno due parole) e zh"); }
      else if (q.k === "pick") { if (!q.q || !Array.isArray(q.opts) || q.opts.length < 2 || !(q.a >= 0 && q.a < q.opts.length) || new Set(q.opts).size !== q.opts.length) err.push(at + ": servono q, opts diverse (almeno 2) e a"); }
      else if (q.k === "buco") { if (!/___|＿/.test(q.it || "") || !Array.isArray(q.opts) || q.opts.length < 2 || !(q.a >= 0 && q.a < q.opts.length) || new Set(q.opts).size !== q.opts.length) err.push(at + ": servono it con il buco (___), opts diverse e a"); }
      else if (q.k === "scrivi") { if (!q.q || !q.a) err.push(at + ": servono q e a"); }
      else err.push(at + ": tipo «" + q.k + "» sconosciuto");
    });
  });
  return err;
}
