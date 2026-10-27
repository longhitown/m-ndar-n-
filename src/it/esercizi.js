/* ===== màndarínō · corso di italiano: gli esercizi del ripasso (Task 12, T5, parità con il corso di cinese).
   Stesso motore (CP.exEngine, gruppo ESERCIZI, caricato al primo uso), stessi stili (⚙️: Guidato, Misto, Classico = le
   carte di prima), stesse regole del voto (mai Facile da una scelta multipla); il voto passa da CP.itApi.grade(voce, g,
   meta), che scrive cp-it-srs-v1 nel formato di sempre. Le parole nuove si presentano prima (parola, cinese, forme, frase).
   Tipi (prefisso «it-», distinti da quelli del cinese nel registro del motore):
     riconoscimento: it-significato (italiano → cinese), it-parola (cinese → italiano);
     misto: it-ascolto (la parola, con la voce italiana del telefono), it-ascolto-frase (una frase, con la voce reale se è
       sul telefono), it-buco (la parola nella frase), it-ordina (le tessere della frase);
     produzione: it-scrivi (dal cinese, confronto CP.typing.compareIt e, se sbagliata, il correttore it/checker.js),
       it-dettato (solo con una voce reale), it-buco-gram (articoli, preposizioni, avere/essere: INSIEMI.it), it-verbo
       (la forma del presente da CP.ita).
   Distrattori: CP.distract.itWords (stessa specie e, per i nomi, stesso genere; livello ±1 dal capitolo della tappa;
   nessun carattere cinese in comune). Frasi: l'esempio della parola, le frasi Tatoeba (FRASI_IT, con traduzione) e gli
   esempi delle lezioni, con un livello non oltre quello della parola. Dopo un errore la parola torna dopo 3 carte con un
   altro tipo. Percorso guidato: il passo successivo nella carta «今天» (CP.itEx.step). Testi in i18n/it-course.js. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  var IT = (function () { try { return localStorage.getItem("cp-course") === "it"; } catch (e) { return false; } })();
  if (!IT) return;
  function A() { return CP.itApi; }
  function D() { return CP.distract; }
  function on() { return !!(CP.ex && CP.ex.stile() !== "classic"); }
  var E = null, KEYED = false;
  function eng() { if (E) return E; if (!CP.ex) return null; E = CP.ex.carica(); if (E && !E.REG["it-significato"]) register(E); return E; }
  function pool() { var L = A().lex(); if (!KEYED) { L.forEach(function (e) { e.key = e.id; }); KEYED = true; } return L; }
  function word(id) { pool(); return A().entry(id); }

  /* ---- contesto ---- */
  var CEFR = { A1: 1, A2: 2, B1: 3, "B2+": 4 };
  function levelOf(e) { var ch = typeof SECTION_CHAPTER !== "undefined" ? SECTION_CHAPTER[e.sec] : 0; return ch || 6; }
  function ttsIt() {
    var An = window.MandarinoAndroid; try { if (An && An.ttsHasLang && An.ttsHasLang("it-IT")) return true; } catch (e) {}
    var s = window.speechSynthesis; return !!(s && s.getVoices && (s.getVoices() || []).some(function (v) { return /^it/i.test(v.lang || ""); }));
  }
  function clip(text) { return CP.voiceClip ? CP.voiceClip.url(text, "it") : ""; }
  var CTX = { levelOf: levelOf, pool: pool, hasVoice: ttsIt, poly: function () { return false; } };

  /* ---- forme e frasi ---- */
  var WRE = /[A-Za-zÀ-ÖØ-öø-ÿ]+['’]?/g;
  function bare(s) { return String(s).replace(/[（(].*$/, "").replace(/^(il|lo|la|i|gli|le|un|uno|una)\s+/i, "").replace(/^(l|un|dell|dall|nell|all|sull)['’]\s*/i, "").trim(); }
  function forms(e) {
    var out = [];
    if (e.kind === "noun") (e.forms || [e.it]).forEach(function (f) { String(f).split(" / ").forEach(function (x) { out.push(bare(x)); }); });
    else if (e.kind === "adj" || e.kind === "nat") (e.forms || []).forEach(function (f) { out.push(f); });
    else if (e.kind === "verb") { out.push(e.it); if (e.aux && CP.ita) for (var p = 0; p < 6; p++) { try { out.push(CP.ita.present(e.it, p)); } catch (x) {} } }
    else out.push(e.say || e.it);
    var seen = {}; return out.map(function (x) { return String(x).toLowerCase(); }).filter(function (x) { if (!x || /\s/.test(x) || seen[x]) return false; seen[x] = 1; return true; });
  }
  var SI = null;
  function sindex() {
    if (SI) return SI;
    SI = {};
    var add = function (it, zh, lv, src) {
      if (!it || !zh) return; var seen = {};
      (String(it).match(WRE) || []).forEach(function (t) { t = t.toLowerCase(); if (seen[t]) return; seen[t] = 1; (SI[t] = SI[t] || []).push({ it: it, zh: zh, lv: lv, src: src }); });
    };
    try { if (typeof FRASI_IT !== "undefined") FRASI_IT.righe.forEach(function (r) { add(r[0], r[1], CEFR[r[2]] || 4, "tatoeba"); }); } catch (e) {}
    (typeof ITLESSONS !== "undefined" ? ITLESSONS : []).forEach(function (l) { (l.ex || []).forEach(function (x) { add(x[0], x[1], 1, "lesson"); }); });
    return SI;
  }
  /* le frasi di una parola: l'esempio, poi Tatoeba e le lezioni, con livello non oltre quello della parola */
  function sentences(e) {
    var F = forms(e), out = [], seen = {}, max = Math.max(2, levelOf(e) - 1), x = A().example(e);
    var push = function (s, form) { if (seen[s.it]) return; seen[s.it] = 1; out.push({ it: s.it, zh: s.zh, form: form, src: s.src }); };
    if (x) { var tk = (x.it.match(WRE) || []).map(function (t) { return t.toLowerCase(); }); F.some(function (f) { if (tk.indexOf(f) >= 0) { push({ it: x.it, zh: x.zh, src: "example" }, f); return true; } return false; }); }
    var I = sindex();
    F.forEach(function (f) { (I[f] || []).forEach(function (s) { if (s.lv <= max) push(s, f); }); });
    return out;
  }
  /* la frase con un buco al posto della forma (la prima volta che compare come parola) */
  function holed(s, form) {
    var done = false;
    return esc(s.it).replace(WRE, function (t) { if (done || t.toLowerCase() !== form) return t; done = true; return '<span class="ex-hole" aria-label="' + CP.attr(T("exm.hole")) + '">' + new Array(Math.max(3, t.length) + 1).join("＿") + "</span>"; });
  }
  function pick(list, r, ok) { var c = list.filter(ok || function () { return true; }); return c.length ? c[Math.floor(r() * Math.min(c.length, 4))] : null; }
  function words(s) { return String(s).replace(/[.,!?¿¡;:«»"]/g, "").split(/\s+/).filter(Boolean); }

  /* ---- disegno ---- */
  function sayIt(text, big) { return '<div class="ex-listen"><button type="button" class="say' + (big ? " big" : "") + '" data-it-say="' + CP.attr(text) + '" aria-label="' + CP.attr(T("itx.listen")) + '">🔊</button>' + (clip(text) ? '<span class="tag small">' + esc(T("itx.real")) + "</span>" : "") + "</div>"; }
  function itBig(e) { return '<div class="it-front" lang="it">' + esc(e.it) + "</div>"; }
  function zhBig(e) { return '<div class="ex-zhq">' + A().zhHTML(e.zh, e.py) + "</div>"; }
  function mc(right, wrong, r, extra) { var o = D().options(right, wrong, r); return Object.assign({ kind: "mc", opts: o.opts, right: o.right }, extra || {}); }
  function formAt(x, e, form) {
    /* la forma della risposta sbagliata che corrisponde a quella giusta (stesso posto tra le forme, o la stessa persona del verbo) */
    var Fe = forms(e), Fx = forms(x), i = Fe.indexOf(form);
    return Fx[i] || Fx[0] || "";
  }
  function register(ENG) {
    var reg = function (d) { d.corso = "it"; ENG.register(d); };
    reg({ id: "it-significato", famiglia: 0, q: "itx.q.sig",
      crea: function (e, ctx, r) { var x = D().itWords(e, ctx.pool(), ctx, r); return x && mc(esc(e.zh), x.map(function (y) { return esc(y.zh); }), r, { prompt: itBig(e) + sayIt(e.say), lang: "zh-CN", say: e.say }); } });
    reg({ id: "it-parola", famiglia: 0, q: "itx.q.par",
      crea: function (e, ctx, r) { var x = D().itWords(e, ctx.pool(), ctx, r); return x && mc(esc(e.it), x.map(function (y) { return esc(y.it); }), r, { prompt: zhBig(e), lang: "it", wide: true }); } });
    reg({ id: "it-ascolto", famiglia: 1, q: "itx.q.asc",
      richiede: function (e, ctx) { return ctx.hasVoice() || !!clip(e.say); },
      crea: function (e, ctx, r) { var x = D().itWords(e, ctx.pool(), ctx, r); return x && mc(esc(e.it), x.map(function (y) { return esc(y.it); }), r, { prompt: sayIt(e.say, true), lang: "it", wide: true, say: e.say, autoSay: true }); } });
    reg({ id: "it-ascolto-frase", famiglia: 1, q: "itx.q.ascF",
      richiede: function (e, ctx) { return sentences(e).some(function (s) { return clip(s.it) || ctx.hasVoice(); }); },
      crea: function (e, ctx, r) {
        var S = sentences(e), s = pick(S, r, function (x) { return !!clip(x.it); }) || (ctx.hasVoice() ? pick(S, r) : null); if (!s) return null;
        var I = sindex(), other = [], seen = {}; seen[s.zh] = 1;
        D().shuffle(Object.keys(I), r).some(function (k) { var c = I[k][0]; if (c && !seen[c.zh] && Math.abs(words(c.it).length - words(s.it).length) <= 3) { seen[c.zh] = 1; other.push(esc(c.zh)); } return other.length >= 3; });
        return other.length >= 3 && mc(esc(s.zh), other, r, { prompt: sayIt(s.it, true), lang: "zh-CN", wide: true, say: s.it, autoSay: true, sentence: s });
      } });
    reg({ id: "it-buco", famiglia: 1, q: "itx.q.buco",
      richiede: function (e) { return sentences(e).length > 0; },
      crea: function (e, ctx, r) {
        var s = pick(sentences(e), r), x = D().itWords(e, ctx.pool(), ctx, r); if (!s || !x) return null;
        var wrong = x.map(function (y) { return formAt(y, e, s.form); }).filter(function (f, i, a) { return f && f !== s.form && a.indexOf(f) === i; });
        if (wrong.length < 2) return null;
        return mc(esc(s.form), wrong.map(esc), r, { prompt: '<div class="ex-sent" lang="it">' + holed(s, s.form) + '</div><div class="cd-note" lang="zh-CN">' + esc(s.zh) + "</div>", lang: "it", say: s.it, sentence: s });
      } });
    /* buco grammaticale: articoli, preposizioni (anche articolate), avere ed essere */
    var SETS = function () { return (typeof INSIEMI !== "undefined" && INSIEMI.it) || []; };
    var gramSpot = function (e) {
      var res = [];
      sentences(e).forEach(function (s) {
        (s.it.match(WRE) || []).forEach(function (t) {
          var lt = t.toLowerCase().replace("’", "'"); if (lt === s.form) return;
          SETS().forEach(function (set) { if (set.membri.indexOf(lt) >= 0) res.push({ s: s, t: lt, set: set }); });
        });
      });
      return res;
    };
    reg({ id: "it-buco-gram", famiglia: 2, q: "itx.q.gram",
      richiede: function (e) { return gramSpot(e).length > 0; },
      crea: function (e, ctx, r) {
        var c = gramSpot(e); if (!c.length) return null;
        var g = c[Math.floor(r() * c.length)], wrong = D().shuffle(g.set.membri.filter(function (m) { return m !== g.t; }), r).slice(0, 3); if (!wrong.length) return null;
        return mc(esc(g.t), wrong.map(esc), r, { prompt: '<div class="ex-sent" lang="it">' + holed(g.s, g.t) + '</div><div class="cd-note" lang="zh-CN">' + esc(g.s.zh) + "</div>", lang: "it", say: g.s.it, sentence: g.s, note: g.set.nota_zh });
      },
      risposta: function (it) { if (it.note) { var fb = document.querySelector("#it-ex-root .ex-fb"); if (fb) fb.insertAdjacentHTML("afterbegin", '<p class="ex-note small" lang="zh-CN">💡 ' + esc(it.note) + "</p>"); } } });
    reg({ id: "it-ordina", famiglia: 1, q: "itx.q.ord",
      richiede: function (e) { return sentences(e).some(function (s) { var n = words(s.it).length; return n >= 3 && n <= 8; }); },
      crea: function (e, ctx, r) {
        var s = pick(sentences(e), r, function (x) { var n = words(x.it).length; return n >= 3 && n <= 8; }); if (!s) return null;
        var tiles = words(s.it).map(function (w, i) { return { id: i, txt: w }; }), sh = tiles;
        for (var n = 0; n < 8; n++) { sh = D().shuffle(tiles, r); if (sh.map(function (x) { return x.txt.toLowerCase(); }).join() !== tiles.map(function (x) { return x.txt.toLowerCase(); }).join()) break; }
        return { kind: "order", tiles: tiles, bank: sh, pick: [], it: s.zh, say: s.it, sentence: s, prompt: '<div class="cd-note ex-order-it" lang="zh-CN">「' + esc(s.zh) + "」</div>" };
      } });
    /* risposte accettate: per i nomi con o senza articolo */
    var accept = function (e) { var a = [e.say || e.it]; if (e.kind === "noun") a.push(bare(e.say || e.it)); if (e.kind === "adj" || e.kind === "nat") a.push((e.forms || [])[0]); return a.filter(Boolean); };
    var checkNote = function (it, res) {
      if (!res.typed || res.ok || !CP.itCheck) return;
      var c = CP.itCheck(res.typed), fb = document.querySelector("#it-ex-root .ex-fb");
      if (fb && c && c.issues && c.issues.length) fb.insertAdjacentHTML("afterbegin", '<p class="ex-note small" lang="zh-CN">💡 ' + c.issues.map(function (x) { return esc(x.zh) + (x.fix ? ' → <b lang="it">' + esc(x.fix) + "</b>" : ""); }).join("<br>") + "</p>");
    };
    reg({ id: "it-scrivi", famiglia: 2, q: "itx.q.scrivi",
      richiede: function (e) { return String(e.say || e.it).length <= 28; },
      crea: function (e) { return { kind: "type", mode: "it", accept: accept(e), say: e.say, prompt: zhBig(e) }; },
      risposta: checkNote });
    reg({ id: "it-dettato", famiglia: 2, q: "itx.q.dett",
      richiede: function (e) { return sentences(e).some(function (s) { return clip(s.it) && words(s.it).length <= 7; }); },
      crea: function (e, ctx, r) {
        var s = pick(sentences(e), r, function (x) { return clip(x.it) && words(x.it).length <= 7; }); if (!s) return null;
        return { kind: "type", mode: "it", accept: [s.it], say: s.it, autoSay: true, sentence: s, prompt: sayIt(s.it, true) };
      },
      risposta: checkNote });
    reg({ id: "it-verbo", famiglia: 2, q: "itx.q.verbo",
      richiede: function (e) { return e.kind === "verb" && !!e.aux && !!CP.ita; },
      crea: function (e, ctx, r) {
        var P = A().PRON, p = P[Math.floor(r() * P.length)], right = CP.ita.present(e.it, p[1]), opts = [];
        D().shuffle(P, r).forEach(function (o) { var f = CP.ita.present(e.it, o[1]); if (f !== right && opts.indexOf(f) < 0 && opts.length < 3) opts.push(f); });
        if (opts.length < 2) return null;
        return mc(esc(right), opts.map(esc), r, { prompt: '<p class="ask"><b lang="it">' + esc(p[0]) + '</b> + <b lang="it">' + esc(e.it) + "</b></p>" + zhBig(e), lang: "it", say: p[0] + " " + right });
      } });
  }

  /* ---- la carta del ripasso ---- */
  var SESS = { n: 0 }, RETRY = [], INTRO = {}, CUR = null, FALLBACK = {}, BUDGET = 0;
  function speak(text, el) { CP.speak(text, { lang: "it-IT", el: el, voiceURI: CP.itVoiceURI ? CP.itVoiceURI() : "" }); }
  function reveal(e, item) {
    var s = item && item.sentence, x = s || A().example(e);
    return '<div class="ex-rev it-rev">' + itBig(e) + '<div class="acts" style="margin:4px 0">' + A().sayBtn(e.say) + "</div><p>" + A().zhHTML(e.zh, e.py) + "</p>" +
      (e.forms && e.kind !== "verb" ? '<p class="small" lang="it">' + esc(e.forms.join(" · ")) + "</p>" : "") +
      (x ? '<div class="cd-ex"><div lang="it">' + esc(x.it) + " " + A().sayBtn(x.it, true) + '</div><div class="cd-note" lang="zh-CN">' + esc(x.zh) + "</div></div>" : "") + "</div>";
  }
  var KIT = {
    root: null, corso: "it", ctx: CTX, word: word, speak: speak, reveal: reveal,
    rec: function (id) { var r = A().rec(id); return r && r.c ? { n: r.n, st: r.c.st } : null; },
    view: function () { return document.getElementById("view-it"); },
    head: function () { return ""; },
    sess: function () { return SESS; },
    answer: function (g, m) {
      var c = CUR; if (!c) return;
      A().grade(c.e.k, g, { retry: !!c.e.retry, type: m && m.type });
      SESS.n++;
      /* dopo un errore la parola torna dopo 3 carte, con un altro tipo */
      if (g < 2 && !c.e.retry) RETRY.push({ k: c.e.k, at: SESS.n + 3, lastType: c.e.exType });
      CUR = null; A().nextCard(); A().rerender();
    }
  };
  var FORCED = null;   /* per le prove: la prossima carta (CP.itEx.only) */
  function pickNext(Q) {
    if (FORCED) { var f = FORCED; FORCED = null; INTRO[f] = 1; CUR = { e: { k: f, kind: "test", ex: 1 } }; return A().entry(f); }
    if (BUDGET && SESS.n >= BUDGET) return null;
    for (var i = 0; i < RETRY.length; i++) if (RETRY[i].at <= SESS.n || (!Q.due.length && !Q.fresh.length)) { var r = RETRY.splice(i, 1)[0]; CUR = { e: { k: r.k, kind: "test", ex: 1, retry: true, lastType: r.lastType } }; return A().entry(r.k); }
    return null;
  }
  function card(e, isNew) {
    if (!eng() || FALLBACK[e.id]) return null;
    if (BUDGET && SESS.n >= BUDGET) return doneHTML();
    if (isNew && !INTRO[e.id] && !(CUR && CUR.e.k === e.id && CUR.e.retry)) {
      var x = A().example(e);
      return '<div class="panel it-card it-intro"><span class="tag">' + esc(T("itx.intro")) + " · " + esc(A().gLabel(e)) + "</span>" + itBig(e) + '<div class="acts" style="margin:4px 0">' + A().sayBtn(e.say) + "</div><p>" + A().zhHTML(e.zh, e.py) + "</p>" +
        (e.forms && e.kind !== "verb" ? '<p class="small" lang="it">' + esc(e.forms.join(" · ")) + "</p>" : "") +
        (x ? '<div class="cd-ex"><div lang="it">' + esc(x.it) + " " + A().sayBtn(x.it, true) + '</div><div class="cd-note" lang="zh-CN">' + esc(x.zh) + "</div></div>" : "") +
        '<button type="button" class="btn-main" data-itx-learn="' + CP.attr(e.id) + '">' + esc(T("itx.learn")) + "</button></div>";
    }
    if (!CUR || CUR.e.k !== e.id) CUR = { e: { k: e.id, kind: "test", ex: 1 } };
    return '<div id="it-ex-root" class="it-ex"></div>';
  }
  function doneHTML() {
    return '<div class="panel done it-ex-done"><h3>' + esc(T("itx.done")) + '</h3><p class="small muted">' + esc(T("itx.doneSub", { n: SESS.n })) + '</p><button type="button" class="btn-main" data-itx-home>' + esc(T("itx.back")) + '</button><button type="button" class="btn-quiet" data-itx-more>' + esc(T("itx.more")) + "</button></div>";
  }
  function mount(view) {
    var root = view.querySelector("#it-ex-root"); if (!root || !CUR) return;
    KIT.root = root;
    var ok = false; try { ok = E.render(CUR.e, KIT); } catch (x) { ok = false; }
    if (!ok) { FALLBACK[CUR.e.k] = 1; CUR = null; A().rerender(); }
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("[data-itx-learn], [data-itx-home], [data-itx-more], [data-itg-go], [data-itg-dur]") : null; if (!b) return;
    CP.sfx("tap");
    if (b.hasAttribute("data-itx-learn")) { INTRO[b.getAttribute("data-itx-learn")] = 1; A().rerender(); }
    else if (b.hasAttribute("data-itx-home")) { BUDGET = 0; SESS.n = 0; A().show("lessons"); }
    else if (b.hasAttribute("data-itx-more")) { BUDGET = 0; A().rerender(); }
    else if (b.hasAttribute("data-itg-dur")) { try { localStorage.setItem("cp-ex-dur", b.getAttribute("data-itg-dur")); } catch (x) {} A().rerender(); }
    else if (b.hasAttribute("data-itg-go")) go(step());
  });

  /* ---- percorso guidato: il passo successivo nella carta «今天» ---- */
  /* testi: A1 dopo 3 lezioni superate, A2 dopo 10, B1 dopo 20; e al massimo un testo ogni 3 lezioni, così la lettura non
     ferma le lezioni */
  var UNLOCK = { A1: 3, A2: 10, B1: 20 };
  function passed() { var P = A().progress(); return A().lessons().filter(function (l) { var p = P[l.id] || {}; return p.done || (p.best || 0) >= A().PASS; }).length; }
  function readText() {
    var L = CP.itRead ? CP.itRead.texts() : [], rd = CP.itRead ? CP.itRead.readMap() : {}, n = passed();
    if (n < 3 * (Object.keys(rd).length + 1)) return null;
    return L.filter(function (t) { return !rd[t.id] && n >= (UNLOCK[t.livello] || 30); })[0] || null;
  }
  function step() {
    var q = A().queue(), due = q.due.length, d = CP.ex.dur(), cur = A().current(), t = readText();
    if (due >= 10) return { kind: "practice", n: Math.min(due, d * 3), d: d };
    if (t) return { kind: "read", t: t };
    if (cur) return { kind: "lesson", l: A().lessons().filter(function (l) { return l.id === cur; })[0] };
    if (due || q.fresh.length) return { kind: "practice", n: Math.min(due + q.fresh.length, d * 3), d: d };
    return { kind: "done" };
  }
  function go(s) {
    if (s.kind === "practice") { eng(); BUDGET = s.n; SESS.n = 0; A().show("review"); }
    else if (s.kind === "read" && CP.itRead) { CP.itRead.open(s.t.id); A().show("phrases"); }
    else if (s.kind === "lesson" && s.l) A().open(s.l.id);
    window.scrollTo(0, 0);
  }
  /* il pulsante primario della carta «今天» nello stile Guidato ("" = quello di sempre) */
  function stepHTML() {
    if (!CP.ex || CP.ex.stile() !== "guided") return "";
    var s = step(); if (s.kind === "done") return "";
    var label = s.kind === "practice" ? T("itx.stepPractice", { n: s.n, m: s.d }) : s.kind === "read" ? T("itx.stepRead", { t: s.t.titolo.zh }) : T("itx.stepLesson", { n: s.l.n, t: s.l.title }),
      sub = s.kind === "read" ? '<small lang="it">' + esc(s.t.titolo.it) + "</small>" : s.kind === "lesson" ? "<small>" + esc(s.l.title) + "</small>" : "";
    var d = CP.ex.dur();
    return (s.kind === "practice" ? '<div class="seg gd-dur" role="group" aria-label="' + CP.attr(T("gd.durAria")) + '">' + [5, 10, 15].map(function (x) { return '<button type="button" data-itg-dur="' + x + '" aria-pressed="' + (x === d) + '"' + (x === d ? ' class="on"' : "") + ">" + esc(T("gd.dur", { n: x })) + "</button>"; }).join("") + "</div>" : "") +
      '<button type="button" class="btn-main itd-go" data-itg-go>' + esc(label) + sub + "</button>";
  }
  CP.itEx = { on: on, pick: pickNext, card: card, mount: mount, step: step, stepHTML: stepHTML, forms: forms, sentences: sentences, engine: eng, kit: KIT, session: function () { return SESS; },
    only: function (id) { FORCED = id; CUR = null; A().nextCard(); A().rerender(); } };
  /* il corso è già disegnato (it/course.js gira prima): se si è sul ripasso, lo si ridisegna con gli esercizi */
  if (A() && on()) A().rerender();
})();
