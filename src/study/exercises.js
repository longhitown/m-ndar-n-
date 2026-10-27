/* ===== màndarínō · il motore degli esercizi (Task 12, §12.2-12.3). Non è un ripasso parallelo: la coda, i tempi, «Esci»,
   la barra di avanzamento e il voto restano quelli di study/study.js (CP.studyKit); qui si sceglie e si disegna la carta di
   prova quando lo stile è Misto o Guidato, e il voto passa sempre da CP.grade (con meta.type = tipo di esercizio).
   - Registro: CP.exEngine.register({ id, famiglia (0 riconosci, 1 misto, 2 produci), corso, q (testo della domanda),
     richiede(parola, ctx), crea(parola, ctx, rng) → item | null, risposta?(item, scelta) }). L'item dice come si disegna
     (kind: "mc" scelta multipla; gli altri tipi aggiungono i loro disegnatori in CP.exEngine.renderers).
   - Scelta del tipo dalla stabilità FSRS della parola: nuova o sotto 3 giorni → riconoscimento; 3-21 → misto; oltre →
     produzione. Mai lo stesso tipo più di due volte di fila; dopo un errore la parola torna a +3 e a +8 posizioni con un
     tipo diverso. Sotto il 60% di risposte giuste nelle ultime 10 si scende di un gradino, sopra il 90% si sale.
   - Voti: sbagliata → Di nuovo (0); scelta multipla giusta → Bene (2), mai Facile; giusta ma «Non ero sicuro» → Difficile (1).
   - Statistiche locali in cp-ex-v1.ex[parola][tipo] = { n, ok, ultimo } (unione: core/store.js). I tempi restano sul telefono.
   Gruppo ESERCIZI (al primo uso). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, D = CP.distract, KEY = "cp-ex-v1";
  var REG = {}, FAM = [[], [], []], R = {}, LAD = { hist: [], last: [] }, SESS = null, cur = null, FORCE = null;
  function register(def) { REG[def.id] = def; if (FAM[def.famiglia].indexOf(def.id) < 0) FAM[def.famiglia].push(def.id); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

  /* ---- cp-ex-v1 ---- */
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "null"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function stat(k, type, ok) {
    var o = load(), a, s; o.ex = o.ex || {}; a = o.ex[k] = o.ex[k] || {}; s = a[type] = a[type] || { n: 0, ok: 0, ultimo: 0 };
    s.n++; if (ok) s.ok++; s.ultimo = Date.now(); save(o);
  }

  /* ---- contesto: il vocabolario come pool dei distrattori ---- */
  var POOL = null;
  function pool() { if (!POOL) POOL = CP.ORDER.map(function (k) { return CP.WORDS[k]; }); return POOL; }
  function levelOf(w) { return CP.hsk(w.hz) || (typeof SECTION_CHAPTER !== "undefined" && SECTION_CHAPTER[w.sec]) || 6; }
  var CTX = { levelOf: levelOf, poly: function (hz) { return !!(CP.POLY && CP.POLY.has(hz)); }, pool: pool };
  /* una voce cinese per l'ascolto: quella del telefono, il motore di Android o la voce online permessa in ⚙️ */
  function hasVoice() {
    var A = window.MandarinoAndroid;
    try { if (A && A.ttsHasLang && A.ttsHasLang("zh-CN")) return true; } catch (e) {}
    return !!((CP.voices && CP.voices().length) || (CP.pref && CP.pref.alt));
  }
  CTX.hasVoice = function () { return ENG.hasVoice(); };
  function rngFor(w, type, n) { return D.rng(D.seed(w.key + "|" + today() + "|" + type + "|" + (n || 0))); }

  /* ---- regole (funzioni pure, provate in tools/unit.mjs) ---- */
  /* famiglia dalla scheda FSRS: nuova o stabilità sotto 3 giorni → 0 riconosci; 3-21 → 1 misto; oltre → 2 produci */
  function famiglia(rec) { rec = rec || {}; if (!rec.n || rec.st == null || rec.st < 3) return 0; return rec.st <= 21 ? 1 : 2; }
  /* gradino dalle ultime 10 risposte (almeno 5): sotto il 60% giuste −1, sopra il 90% +1 */
  function gradino(hist) { var h = (hist || []).slice(-10); if (h.length < 5) return 0; var acc = h.filter(Boolean).length / h.length; return acc < 0.6 ? -1 : acc > 0.9 ? 1 : 0; }
  /* voto FSRS (0 Di nuovo, 1 Difficile, 2 Bene, 3 Facile) da una risposta:
     r = { kind: "mc" | "type", ok, unsure, esito ("esatto" | "senza-toni" | "toni-sbagliati" | "accento" | "quasi" | "sbagliato"), ms, st, primo } */
  var QUASI = { "senza-toni": 1, accento: 1, quasi: 1 };
  function voto(r) {
    if (r.kind === "mc") return r.ok ? (r.unsure ? 1 : 2) : 0;   /* mai Facile da una scelta multipla: si indovina 1 volta su 4 */
    if (QUASI[r.esito]) return 1;
    if (!r.ok) return 0;
    return r.primo !== false && r.ms < 6000 && r.st > 21 ? 3 : 2;
  }
  function familyOf(w) { return famiglia(CP.S()[w.key]); }
  function ladder() { return gradino(LAD.hist); }
  function choose(e, w) {
    var lvl = Math.max(0, Math.min(2, familyOf(w) + ladder())), last = LAD.last;
    var ok = function (id) {
      var d = REG[id];
      if (!d || d.corso !== "zh" || id === e.lastType) return false;
      if (last.length >= 2 && last[last.length - 1] === id && last[last.length - 2] === id) return false;
      return !d.richiede || d.richiede(w, CTX) !== false;
    };
    if (FORCE && REG[FORCE] && ok(FORCE)) { var fi = REG[FORCE].crea(w, CTX, rngFor(w, FORCE)); if (fi) return { id: FORCE, item: fi }; }
    for (var f = lvl; f >= 0; f--) {
      var c = FAM[f].filter(ok);
      while (c.length) {
        var id = c.splice(Math.floor(Math.random() * c.length), 1)[0], item = REG[id].crea(w, CTX, rngFor(w, id, e.retry ? 1 : 0));
        if (item) return { id: id, item: item };
      }
    }
    return null;
  }

  /* ---- disegno ---- */
  function bar(html) { var b = cur && cur.kit.root.querySelector(".ex-bar"); if (b) b.innerHTML = html; }
  R.mc = {
    html: function (it) {
      return '<div class="ex-opts' + (it.wide ? " wide" : "") + '" role="group" aria-label="' + CP.attr(T("exm.choose")) + '">' + it.opts.map(function (o, i) {
        return '<button type="button" class="ex-opt" data-exa="' + i + '"><span class="ex-n" aria-hidden="true">' + (i + 1) + '</span><span class="ex-t"' + (it.lang ? ' lang="' + it.lang + '"' : "") + ">" + o + "</span></button>";
      }).join("") + "</div>";
    },
    pick: function (i) {
      var it = cur.item, ok = i === it.right;
      Array.prototype.forEach.call(cur.kit.root.querySelectorAll("[data-exa]"), function (b, j) {
        b.disabled = true;
        if (j === it.right) { b.classList.add("ok"); b.insertAdjacentHTML("beforeend", '<span class="ex-mark" aria-hidden="true">✓</span>'); }
        else if (j === i) { b.classList.add("ko"); b.insertAdjacentHTML("beforeend", '<span class="ex-mark" aria-hidden="true">✗</span>'); }
      });
      return { ok: ok, g: voto({ kind: "mc", ok: ok }), picked: i };
    }
  };
  function render(e, kit) {
    if (SESS !== kit.sess()) { SESS = kit.sess(); LAD = { hist: [], last: [] }; }
    var w = CP.WORDS[e.k]; if (!w) return false;
    if (!e.item) { var c = choose(e, w); if (!c) return false; e.exType = c.id; e.item = c.item; }
    var it = e.item, def = REG[e.exType];
    cur = { e: e, kit: kit, item: it, def: def, w: w, t0: Date.now(), done: false, g: 0 };
    kit.root.innerHTML = kit.head() + '<div class="panel fc ex-card enter" data-k="' + CP.attr(w.key) + '" data-ex="' + CP.attr(e.exType) + '"><span class="tag">' + esc(T(def.q)) + "</span>" + it.prompt +
      R[it.kind].html(it) + '<div class="ex-fb" aria-live="polite"></div></div><div class="actbar ex-bar"><p class="kbd-hint">' + esc(T(it.kind === "mc" ? "exm.kbd" : "exm.kbdType")) + "</p></div>";
    kit.root.classList.add("is-card");
    if (R[it.kind].bind) R[it.kind].bind(it, kit.root);
    if (it.say && it.autoSay) setTimeout(function () { if (cur && cur.item === it) CP.say(it.say, kit.root.querySelector(".ex-card .say")); }, 250);
    return true;
  }
  /* dopo la risposta: esito con il segno oltre al colore, la parola completa, la frase d'esempio e un solo «Continua» */
  function after(res) {
    if (!cur || cur.done) return;
    var w = cur.w, kit = cur.kit, ex = kit.example(w.key);
    cur.done = true; cur.g = res.g; cur.ms = Date.now() - cur.t0;
    stat(w.key, cur.e.exType, res.ok); LAD.hist.push(!!res.ok); LAD.last.push(cur.e.exType); if (LAD.last.length > 4) LAD.last.shift();
    if (cur.def.risposta) cur.def.risposta(cur.item, res, w);
    if (CP.pref.sfx) CP.sfx(res.ok ? "ok" : "ko"); CP.haptic(res.ok ? 8 : [20, 40, 20]);
    var fb = kit.root.querySelector(".ex-fb");
    if (fb) fb.innerHTML = '<p class="ex-verdict ' + (res.ok ? "ok" : "ko") + '"><span aria-hidden="true">' + (res.ok ? "✓ " : "✗ ") + "</span>" + esc(res.msg || T(res.ok ? "exm.right" : "exm.wrong")) + "</p>" +
      '<div class="ex-rev">' + kit.parts(w, { py: 1, hz: 1, it: 1 }) + (ex ? '<div class="cd-ex"><div class="lp">' + CP.pinyinHTML(ex[0]) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(ex[1], ex[0]) + '</div><div class="cd-note" lang="it">' + esc(ex[2]) + "</div></div>" : "") + kit.tools(w) + "</div>";
    bar('<button type="button" class="btn-main" data-exc>' + esc(T("exm.cont")) + "</button>" + (res.ok && res.g === 2 && cur.item.kind === "mc" ? '<button type="button" class="btn-quiet ex-unsure" data-exu>' + esc(T("exm.unsure")) + "</button>" : "") + '<p class="kbd-hint">' + esc(T("exm.kbdNext")) + "</p>");
    var c = kit.root.querySelector("[data-exc]"); if (c) c.focus({ preventScroll: true });
    if (CP.pref.auto) CP.say(CP.sayHz(w), kit.root.querySelector(".ex-rev .say"));
  }
  function next(g) {
    if (!cur || !cur.done) return;
    var c = cur; cur = null;
    c.kit.answer(g == null ? c.g : g, { ms: Math.min(60000, c.ms || 0), type: c.e.exType, quiet: true });
  }
  /* dopo un errore la parola torna a +3 con un altro tipo, e una copia di rinforzo a +8 */
  function requeue(e, q) {
    e.retry = true; e.lastType = e.exType; e.exType = null; e.item = null;
    q.splice(Math.min(q.length, 3), 0, e);
    if (!e.bonusDone) { e.bonusDone = 1; q.splice(Math.min(q.length, 8), 0, { k: e.k, kind: "test", ex: 1, bonus: true, retry: true, lastType: e.lastType }); }
  }

  /* ---- eventi ---- */
  document.addEventListener("click", function (ev) {
    if (!cur) return;
    var b = ev.target.closest ? ev.target.closest("[data-exa], [data-exc], [data-exu]") : null; if (!b || !cur.kit.root.contains(b)) return;
    if (b.hasAttribute("data-exa") && !cur.done) after(R.mc.pick(+b.getAttribute("data-exa")));
    else if (b.hasAttribute("data-exc")) next();
    else if (b.hasAttribute("data-exu")) next(voto({ kind: "mc", ok: true, unsure: true }));
  });
  document.addEventListener("keydown", function (ev) {
    if (!cur || ev.ctrlKey || ev.metaKey || ev.altKey || (CP.topSheet && CP.topSheet()) || !cur.kit.root.querySelector(".ex-card")) return;
    var v = document.getElementById("view-study"); if (v && v.hidden) return;
    var a = document.activeElement, typing = a && /^(INPUT|TEXTAREA)$/.test(a.tagName);
    if (!cur.done && cur.item.kind === "mc" && /^[1-9]$/.test(ev.key) && +ev.key <= cur.item.opts.length) { ev.preventDefault(); after(R.mc.pick(+ev.key - 1)); }
    else if (cur.done && ev.key === "Enter") { ev.preventDefault(); next(); }
    else if (!typing && (ev.key === " " || ev.code === "Space") && cur.item.say) { ev.preventDefault(); CP.say(cur.item.say, cur.kit.root.querySelector(".say")); }
  });

  /* ---- gli esercizi di T1 (corso di cinese) ---- */
  function hzpy(w) { return '<div class="cd-py">' + CP.pinyinHTML(w.py) + '</div><div class="cd-hz" lang="zh-CN">' + CP.hanziHTML(w.hz, w.py) + "</div>"; }
  function sylls(py) { return String(py).split(/[.\s']+/).filter(Boolean); }
  function listenBtn(text) { return '<div class="ex-listen">' + CP.sayBtn(text).replace('class="say"', 'class="say big"') + "</div>"; }
  function mc(right, wrong, r, extra) { var o = D.options(right, wrong, r); return Object.assign({ kind: "mc", opts: o.opts, right: o.right }, extra || {}); }
  register({ id: "mc-significato", famiglia: 0, corso: "zh", q: "exm.q.meaning",
    crea: function (w, ctx, r) { var x = D.meaning(w, ctx.pool(), ctx, r); return x && mc(esc(D.gloss(w.it)), x.map(function (y) { return esc(D.gloss(y.it)); }), r, { prompt: hzpy(w), lang: "it", wide: true, say: CP.sayHz(w) }); } });
  register({ id: "mc-parola", famiglia: 0, corso: "zh", q: "exm.q.word",
    crea: function (w, ctx, r) { var x = D.word(w, ctx.pool(), ctx, r); return x && mc('<span class="ex-han">' + esc(w.hz) + "</span>", x.map(function (y) { return '<span class="ex-han">' + esc(y.hz) + "</span>"; }), r, { prompt: '<div class="cd-it" lang="it">' + esc(w.it) + "</div>", lang: "zh-CN" }); } });
  register({ id: "mc-pinyin", famiglia: 0, corso: "zh", q: "exm.q.pinyin",
    crea: function (w, ctx, r) { var x = D.pinyin(w, ctx.pool(), ctx, r); return x && mc(CP.pinyinHTML(sylls(w.py).join(" ")), x.map(function (p) { return CP.pinyinHTML(p); }), r, { prompt: '<div class="cd-hz" lang="zh-CN">' + esc(w.hz) + "</div>" }); } });
  register({ id: "mc-ascolto", famiglia: 1, corso: "zh", q: "exm.q.listen",
    richiede: function (w, ctx) { return ctx.hasVoice() && !ctx.poly(w.hz); },
    crea: function (w, ctx, r) { var x = D.listen(w, ctx.pool(), ctx, r); return x && mc('<span class="ex-han">' + esc(w.hz) + "</span>", x.map(function (y) { return '<span class="ex-han">' + esc(y.hz) + "</span>"; }), r, { prompt: listenBtn(CP.sayHz(w)), lang: "zh-CN", say: CP.sayHz(w), autoSay: true }); } });
  /* il tono di una parola di una sillaba: dal pinyin senza accento (e dalla voce, se c'è) alla curva giusta */
  var CURVES = ["mā", "má", "mǎ", "mà"];
  register({ id: "tono", famiglia: 1, corso: "zh", q: "exm.q.tone",
    richiede: function (w, ctx) { return Array.from(w.hz).length === 1 && sylls(w.py).length === 1 && CP.tone(w.py) >= 1 && CP.tone(w.py) <= 4 && !ctx.poly(w.hz); },
    crea: function (w, ctx) {
      var t = CP.tone(w.py), plain = CP.typing.syllableInfo(w.py).plain, v = ctx.hasVoice();
      return { kind: "mc", wide: true, right: t - 1, tone: t, say: v ? CP.sayHz(w) : "", autoSay: v,
        prompt: '<div class="cd-hz" lang="zh-CN">' + esc(w.hz) + '</div><div class="cd-py ex-plain">' + esc(plain) + "</div>" + (v ? listenBtn(CP.sayHz(w)) : ""),
        opts: CURVES.map(function (s, i) { return CP.toneCurveHTML(s) + "<span>" + esc(T("exm.toneN", { n: i + 1 })) + " · " + esc(T("tone." + (i + 1))) + "</span>"; }) };
    },
    /* gli errori sui toni alimentano il Dottore dei Toni (cp-ear-v1) */
    risposta: function (it, res, w) { if (CP.confuse) CP.confuse(it.tone, res.picked + 1, w.key); } });

  var ENG = CP.exEngine = {
    register: register, render: render, requeue: requeue, renderers: R, after: after, next: next, REG: REG, FAM: FAM, ctx: CTX,
    hasVoice: hasVoice, choose: choose, voto: voto, famiglia: famiglia, gradino: gradino, familyOf: familyOf, stat: stat, load: load, save: save, bar: bar,
    current: function () { return cur; },
    /* per le prove: forza un tipo di esercizio (null = scelta normale) */
    force: function (id) { FORCE = id || null; }
  };
  (CP.exPending || []).forEach(function (f) { try { f(ENG); } catch (e) {} });   /* esercizi registrati da altri moduli (corso di italiano) */
})();
