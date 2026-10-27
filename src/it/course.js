/* ===== Corso di italiano per chi parla cinese (意大利语课程) — la direzione «al contrario» dell'app.
   Si sceglie dal benvenuto o da ⚙️ → Corso (cp-course = "zh" cinese per italiani, predefinito | "it" italiano per cinesi).
   In modalità "it" l'interfaccia è in cinese e le quattro schede diventano: 课程 (lezioni), 单词 (parole), 复习 (ripasso),
   变位 (coniugazioni), 句子 (frasi e dialoghi). Le parole italiane non sono scritte a mano qui: nascono dalle schede
   grammaticali di data/grammar.js (genere, plurale, ausiliare) e dalla morfologia di phrases/italian.js, controllate con
   tools/morphit-check.mjs (Morph-it + Hunspell). I progressi stanno in chiavi proprie: cp-it-srs-v1, cp-it-lessons-v1. ===== */
(function () {
  var CP = window.CP, tt = CP.t, esc = CP.esc, W = CP.WORDS, G = GRAM, I = CP.ita;
  var KEY = "cp-course", SRSKEY = "cp-it-srs-v1", LKEY = "cp-it-lessons-v1", NEW_PER_DAY = 10, PASS = 80;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var course = CP.course();
  if (course !== "it") return;

  /* ================= da qui: modalità corso di italiano ================= */
  /* ⚙️ → 语音: la voce italiana (velocità, scelta della voce, prova), poi musica e suono */
  var IVK = "cp-it-voice";
  function itVoices() { var s = window.speechSynthesis; return s && s.getVoices ? (s.getVoices() || []).filter(function (v) { return /^it/i.test(v.lang || ""); }) : []; }
  CP.itVoiceURI = function () { var u = lsGet(IVK) || "", vs = itVoices(); return vs.some(function (v) { return v.voiceURI === u; }) ? u : (vs[0] ? vs[0].voiceURI : ""); };
  CP.voiceUIOverride = function (body, sum) {
    var vs = itVoices(), cur = CP.itVoiceURI(), slow = CP.pref.rate !== 1;
    var h = tt("itc.005") + (slow ? ' class="on"' : "") + tt("itc.006") + (!slow ? ' class="on"' : "") + tt("itc.007");
    if (vs.length > 1) h += tt("itc.008") + vs.map(function (v) { return '<option value="' + CP.attr(v.voiceURI) + '"' + (v.voiceURI === cur ? " selected" : "") + ">" + esc(v.name) + " (" + esc(v.lang) + ")</option>"; }).join("") + "</select></label>";
    else h += '<p class="small muted" style="margin:0">' + (vs.length ? tt("itc.009") + esc(vs[0].name) + "。" : tt("itc.010")) + "</p>";
    h += (window.__mdVoiceHelp ? window.__mdVoiceHelp("it-IT") : "") +
      '<label class="chk"><input type="checkbox" id="opt-sfx"' + (CP.pref.sfx ? " checked" : "") + tt("itc.011") +
      '<label class="chk"><input type="checkbox" id="opt-haptics"' + (CP.pref.haptics ? " checked" : "") + tt("itc.012") +
      (CP.voiceExtra ? CP.voiceExtra() : "") +
      tt("itc.013");
    body.innerHTML = h;
    if (sum) sum.textContent = slow ? tt("itc.014") : tt("itc.015");
    return true;
  };
  (function () { var vb = document.getElementById("vset-body"); if (vb) CP.voiceUIOverride(vb, document.getElementById("vsum")); })();
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "it-voice-sel") { lsSet(IVK, e.target.value); CP.sfx("tap"); } });
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("#it-voice-test") : null;
    if (b) CP.speak("Ciao! Come stai?", { lang: "it-IT", el: b, voiceURI: CP.itVoiceURI() });
  });
  /* il «cammino» in alto porterebbe al Percorso del corso di cinese: qui porta al ripasso */
  var pillEl = document.getElementById("game-pill");
  if (pillEl) pillEl.addEventListener("click", function (e) { e.stopImmediatePropagation(); CP.itShow("review"); }, true);
  /* ⚙️ → 使用说明 */
  var about = document.querySelector("#set-about .lede");
  if (about) about.innerHTML = tt("itc.016") + "<b>" + ITLESSONS.length + tt("itc.017");
  var Z = {
    lessons: tt("itc.018"), words: tt("itc.019"), review: tt("itc.020"), conj: tt("itc.021"), phrases: tt("itc.022"),
    listen: tt("itc.023"), back: tt("itc.024"), start: tt("itc.025"), next: tt("itc.026"), result: tt("itc.027"), right: tt("itc.028"), wrong: tt("itc.029"), answerIs: tt("itc.030"),
    order: tt("itc.031"), check: tt("itc.032"), clear: tt("itc.033"), showAnswer: tt("itc.034"), again: tt("itc.035"), hard: tt("itc.036"), good: tt("itc.037"), easy: tt("itc.038")
  };
  var TOPIC = { persone: tt("itc.039"), famiglia: tt("itc.040"), saluti: tt("itc.041"), risposte: tt("itc.042"), verbi1: tt("itc.043"), verbi2: tt("itc.044"), domande: tt("itc.045"), numeri: tt("itc.046"), tempo: tt("itc.047"), spazio: tt("itc.048"), cibo: tt("itc.049"), aggettivi: tt("itc.050"), stati: tt("itc.051"), luoghi: tt("itc.052"), viaggi: tt("itc.053"), casa: tt("itc.054"), vestiti: tt("itc.055"), corpo: tt("itc.056"), natura: tt("itc.057"), lavoro: tt("itc.058"), cucina: tt("itc.059"), citta: tt("itc.060"), conversazione: tt("itc.061"), acquisti: tt("itc.062") };
  var PHR_ZH = [tt("itc.063"), tt("itc.064"), tt("itc.065"), tt("itc.066"), tt("itc.067"), tt("itc.068"), tt("itc.069"), tt("itc.070"), tt("itc.071"), tt("itc.072"), tt("itc.073"), tt("itc.074")];
  var DLG_ZH = { taxi: tt("itc.075"), dogana: tt("itc.076"), bagaglio: tt("itc.077"), scheda: tt("itc.078"), cambio: tt("itc.079"), checkin: tt("itc.080"), wifi: tt("itc.081"), aria: tt("itc.082"), checkout: tt("itc.083"), servizi: tt("itc.084"), ristorante: tt("itc.085"), zaofan: tt("itc.086"), allergia: tt("itc.087"), kafei: tt("itc.088"), chuan: tt("itc.089"), treno: tt("itc.090"), metro: tt("itc.091"), piaoc: tt("itc.092"), gongjiao: tt("itc.093"), wandian: tt("itc.094"), mercato: tt("itc.095"), saoma: tt("itc.096"), shiyi: tt("itc.097"), shuiguo: tt("itc.098"), tuihuo: tt("itc.099"), farmacia: tt("itc.100"), caffe: tt("itc.101"), sicilia: tt("itc.102"), yisheng: tt("itc.103"), diu: tt("itc.104"), ganbei: tt("itc.105"), jiali: tt("itc.106") };
  var PRON = [["io", 0], ["tu", 1], ["lui", 2], ["lei", 2], ["noi", 3], ["voi", 4], ["loro", 5]];

  /* ---------------- lessico: dalle schede grammaticali ---------------- */
  function pyOf(h) { var k = W[h] ? h : null; return k ? W[k].py : ""; }
  function wordOf(key) { return W[key] || null; }
  var LEX = [], BYID = {};
  function add(e) { if (BYID[e.id]) return; BYID[e.id] = e; LEX.push(e); }
  function art(w, g, num) { return I.join(I.def(w, g, num), w); }
  Object.keys(G.nouns).forEach(function (k) {
    var w = wordOf(k); if (!w) return;
    var n = G.nouns[k], s = n[0], g = n[1], p = n[2], fl = n[3] || "", gp = g === "f" ? "f" : (/a$/.test(p) && /o$/.test(s) ? "f" : "m");
    var only = /p/.test(fl) && s === p;
    var main = only ? art(p, gp, "p") : art(s, g, "s"), forms = only ? [main + tt("itc.107")] : [main, art(p, gp, "p")];
    if (n[4] && n[4] !== s) forms.push(art(n[4], "f", "s") + tt("itc.108"));
    add({ id: "it:n:" + k, it: main, say: main, kind: "noun", g: only ? gp : g, forms: forms, zh: w.hz, py: w.py, sec: w.sec });
  });
  Object.keys(G.places).forEach(function (k) {
    var w = wordOf(k), pl = G.places[k]; if (!w || !pl[0] || BYID["it:n:" + k]) return;
    add({ id: "it:l:" + k, it: pl[0], say: pl[0], kind: "place", forms: [pl[0], pl[1]], zh: w.hz, py: w.py, sec: w.sec });
  });
  Object.keys(G.nations).forEach(function (k) {
    var w = wordOf(k), na = G.nations[k]; if (!w || !Array.isArray(na)) return;
    add({ id: "it:a:" + k + tt("itc.039"), it: na[0] + ", " + na[1], say: na[0], kind: "nat", forms: na, zh: w.hz + tt("itc.039"), py: w.py + " rén", sec: w.sec });
  });
  Object.keys(G.verbs).forEach(function (k) {
    var w = wordOf(k), v = G.verbs[k]; if (!w) return;
    add({ id: "it:v:" + k, it: v[0], say: v[0], kind: "verb", aux: v[1], zh: w.hz, py: w.py, sec: w.sec });
  });
  Object.keys(G.adjs).forEach(function (k) {
    var w = wordOf(k), a = G.adjs[k]; if (!w) return;
    add({ id: "it:j:" + k, it: a[0] === a[1] ? a[0] : a[0] + ", " + a[1], say: a[0], kind: "adj", forms: a, zh: w.hz, py: w.py, sec: w.sec });
  });
  Object.keys(G.time).forEach(function (k) {
    var w = wordOf(k); if (!w) return;
    add({ id: "it:t:" + k, it: G.time[k][0], say: G.time[k][0], kind: "time", zh: w.hz, py: w.py, sec: w.sec });
  });
  /* il resto del vocabolario (data/it/lexicon.js, da tools/itlex.mjs: controllato con Morph-it): nomi con genere e plurale,
     aggettivi con le quattro forme, verbi all'infinito, avverbi ed espressioni */
  (typeof IT_LEXICON !== "undefined" ? IT_LEXICON : []).forEach(function (r) {
    var keys = r[0].split("|").filter(function (k) { return W[k]; }); if (!keys.length) return;
    var w = W[keys[0]], zh = w.hz, py = w.py, alt = keys.slice(1).map(function (k) { return W[k].hz; });
    if (r[1] === "n") {
      var g = r[3], one = g === "mf" ? "m" : g, main = art(r[2], one, "s"), forms = [main, art(r[4], one, "p")];
      if (g === "mf") forms = [main + " / " + art(r[2], "f", "s"), art(r[4], "m", "p") + " / " + art(r[4], "f", "p")];
      add({ id: "it:n:" + keys[0], it: main, say: main, kind: "noun", g: g, forms: forms, zh: zh, py: py, sec: w.sec, ex: keys[0], alt: alt });
    } else if (r[1] === "j") add({ id: "it:j:" + keys[0], it: r[3][0] === r[3][1] ? r[3][0] : r[3][0] + ", " + r[3][1], say: r[3][0], kind: "adj", forms: r[3], zh: zh, py: py, sec: w.sec, ex: keys[0], alt: alt });
    else if (r[1] === "v") add({ id: "it:v:" + keys[0], it: r[2], say: r[2], kind: "verb", aux: null, zh: zh, py: py, sec: w.sec, ex: keys[0], alt: alt });
    else add({ id: "it:x:" + keys[0], it: r[2], say: r[2], kind: "other", zh: zh, py: py, sec: w.sec, ex: keys[0], alt: alt });
  });
  var SECIDX = {}; CP.SEC.forEach(function (s, i) { SECIDX[s.id] = i; });
  LEX.sort(function (a, b) { return (SECIDX[a.sec] || 0) - (SECIDX[b.sec] || 0); });
  var KIND = { noun: tt("itc.109"), place: tt("itc.110"), nat: tt("itc.111"), verb: tt("itc.112"), adj: tt("itc.050"), time: tt("itc.113"), other: tt("itc.114") };
  function gLabel(e) { return e.kind === "noun" ? (e.g === "f" ? tt("itc.115") : e.g === "mf" ? tt("itc.116") : tt("itc.117")) : KIND[e.kind]; }
  /* frase d'esempio della parola: le stesse di data/examples, lette al contrario (italiano → cinese) */
  function exOf(e) {
    var k = e.ex || e.id.replace(/^it:\w:/, ""), x = typeof EXAMPLES !== "undefined" && EXAMPLES[k];
    if (x) return { it: x[1], zh: x[0] };
    var y = CP.exampleFor && W[k] ? CP.exampleFor(k) : null;   /* altrimenti la frase più corta dell'app che contiene la parola */
    return y ? { it: y[2], zh: y[1] } : null;
  }
  function exHTML(e) {
    var x = exOf(e); if (!x) return "";
    return tt("itc.118") + esc(x.it) + " " + sayBtn(x.it, true) + '</div><div class="small muted" lang="zh-CN">' + esc(x.zh) + "</div></div>";
  }
  CP.itLexicon = function () { return LEX.slice(); };

  /* coniugazione in tabella: presente e passato prossimo */
  function conjTable(inf, aux) {
    var rows = PRON.filter(function (p) { return p[0] !== "lei"; }).map(function (p) {
      var pi = p[1], g = "m", num = pi >= 3 ? "p" : "s";
      return [p[0] === "lui" ? "lui / lei" : p[0], I.present(inf, pi), I.passato(inf, aux, pi, aux === "e" || /rsi(\s|$)/.test(inf) ? "x" : g, num)];
    });
    return tt("itc.119") +
      rows.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td></tr>"; }).join("") + "</tbody></table>" +
      (aux === "e" || /rsi(\s|$)/.test(inf) ? tt("itc.120") : "");
  }
  function zhHTML(hz, py) { return '<span class="it-zh"><span class="lp">' + CP.pinyinHTML(py) + '</span> <span class="lh han" lang="zh-CN">' + CP.hanziHTML(hz, py) + "</span></span>"; }
  function sayBtn(text, small) { return '<button type="button" class="say' + (small ? " btn-s" : "") + '" data-it-say="' + CP.attr(text) + '" aria-label="' + CP.attr(tt("itc.121") + text) + '">🔊</button>'; }
  function detailHTML(e) {
    var h = '<div class="fam-head"><div class="meta"><b lang="it" style="font-size:1.35rem">' + esc(e.it) + "</b><div class=\"small muted\">" + esc(gLabel(e)) + tt("itc.122") +
      '<div class="acts" style="margin:6px 0">' + sayBtn(e.say) + "</div><p style=\"margin:6px 0\">" + zhHTML(e.zh, e.py) + (e.alt && e.alt.length ? tt("itc.123") + esc(e.alt.join("、")) + "</span></span>" : "") + "</p>";
    if (e.kind === "noun") h += "<p>" + e.forms.map(esc).join(" · ") + tt("itc.124");
    else if (e.kind === "adj") h += '<p lang="it">' + esc(e.forms.join(" · ")) + tt("itc.125");
    else if (e.kind === "nat") h += '<p lang="it">' + esc(e.forms.join(" · ")) + tt("itc.126");
    else if (e.kind === "place") h += '<p lang="it">' + esc(e.forms[1]) + tt("itc.127") + esc(e.forms[1]) + "。</p>";
    else if (e.kind === "verb" && e.aux) h += conjTable(e.it, e.aux);
    else if (e.kind === "verb") h += '<p lang="it">' + PRON.filter(function (p) { return p[0] !== "lei"; }).map(function (p) { return esc(p[0] === "lui" ? "lui/lei" : p[0]) + " " + esc(I.present(e.it, p[1])); }).join(" · ") + tt("itc.128");
    return h + exHTML(e);
  }

  /* ---------------- guscio: vista e schede ---------------- */
  document.body.classList.add("course-it");
  var brand = document.querySelector("h1.brand"), sub = brand && brand.querySelector("text.font-sub");
  if (sub) sub.textContent = tt("itc.129");
  if (brand) brand.setAttribute("aria-label", tt("itc.130"));
  document.documentElement.setAttribute("lang", "zh-CN");
  var main = document.querySelector("main") || document.body;
  var view = document.createElement("div"); view.id = "view-it"; view.setAttribute("lang", "zh-CN"); main.appendChild(view);
  if (CP.immerse) CP.immerse.watch(view);
  /* l'ordine è quello in cui le schede si aprono (ui/unlock.js, docs/ux-architettura.md) */
  /* le icone sono le stesse SVG della barra del corso di cinese (src/index.html), più una per le coniugazioni */
  var ICO = {
    lessons: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
    review: '<rect x="3.5" y="8" width="13" height="12" rx="2"/><path d="M7.5 4.5H19a1.5 1.5 0 0 1 1.5 1.5v10"/>',
    words: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 1h13v-3"/><path d="M9 8h6"/>',
    conj: '<path d="M4 9a7 7 0 0 1 12.5-4.3L19 7"/><path d="M19 3v4h-4"/><path d="M20 15a7 7 0 0 1-12.5 4.3L5 17"/><path d="M5 21v-4h4"/>',
    phrases: '<path d="M4 5h16v11H9.5L5 20v-4H4z"/><path d="M8 9.5h8"/>'
  };
  var TABS = [["lessons", ICO.lessons, Z.lessons], ["review", ICO.review, Z.review], ["words", ICO.words, Z.words], ["conj", ICO.conj, Z.conj], ["phrases", ICO.phrases, Z.phrases]];
  var dock = document.createElement("nav"); dock.className = "dock dock-it"; dock.setAttribute("role", "tablist"); dock.setAttribute("aria-label", tt("itc.131"));
  dock.innerHTML = TABS.map(function (t) { return '<button class="dtab" role="tab" type="button" data-it-tab="' + t[0] + '" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true">' + t[1] + "</svg><span>" + t[2] + "</span></button>"; }).join("");
  document.body.appendChild(dock);
  var tab = lsGet("cp-it-tab") || "lessons";
  if (!TABS.some(function (t) { return t[0] === tab; })) tab = "lessons";
  if (CP.unlock) { CP.unlock.paint(); tab = CP.unlock.nearest(tab); }
  function show(t) {
    if (CP.unlock) { t = CP.unlock.nearest(t); CP.unlock.seen(t); }
    tab = t; lsSet("cp-it-tab", t);
    Array.prototype.forEach.call(dock.querySelectorAll("[data-it-tab]"), function (b) { var on = b.getAttribute("data-it-tab") === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    render(); window.scrollTo(0, 0);
  }
  CP.itShow = show;
  /* per it/today.js (carta «今天», progressi, carte da condividere): i dati del corso, senza duplicarli */
  /* «scrivi» nei quiz delle lezioni: il confronto sta nel gruppo ESERCIZI; giusta anche senza un accento o con un refuso */
  function itTyped(Q, q) {
    var i = document.getElementById("itl-in"), v = i ? i.value : ""; if (!String(v).trim()) return;
    if (CP.ex) CP.ex.carica(); var r = CP.typing ? CP.typing.compareIt(v, q.a) : (v.trim().toLowerCase() === String(q.a).toLowerCase() ? "esatto" : "sbagliato");
    Q.typed = v; Q.state = /^(esatto|accento|quasi)$/.test(r) ? "ok" : "ko"; if (Q.state === "ok") Q.score++;
    CP.sfx(Q.state === "ok" ? "ok" : "ko"); render();
  }
  document.addEventListener("submit", function (e) { if (e.target && e.target.hasAttribute && e.target.hasAttribute("data-itl-form")) { e.preventDefault(); if (ls.quiz && ls.quiz.state === "play") itTyped(ls.quiz, ls.quiz.l.quiz[ls.quiz.i]); } });
  CP.itApi = {
    lessons: function () { return ITLESSONS.slice().sort(function (a, b) { return a.n - b.n; }); },
    progress: lprog, PASS: PASS, current: currentLesson, queue: function () { return queue(); }, lexSize: function () { return LEX.length; },
    open: function (id) { ls.cur = ITLESSONS.filter(function (l) { return l.id === id; })[0]; if (!ls.cur) return; ls.view = "lesson"; ls.quiz = null; lmark(id, { seen: Date.now() }); show("lessons"); },
    show: show, rerender: function () { render(); },
    /* Task 12: gli esercizi, la lettura e la carta «今天» usano gli stessi dati, senza copiarli */
    grade: function (v, g, meta) { var e = typeof v === "string" ? BYID[v] : v; if (e) gradeOf(e, g + 1, !!(meta && meta.retry)); },
    entry: function (id) { return BYID[id] || null; }, lex: function () { return LEX; }, rec: function (id) { return sload()[id] || null; },
    example: exOf, sayBtn: sayBtn, zhHTML: zhHTML, gLabel: gLabel, PRON: PRON, detail: detailHTML,
    nextCard: function () { rv.cur = null; rv.shown = false; rv.done++; }
  };
  function render() {
    var h = tab === "lessons" ? lessonsView() : tab === "words" ? wordsView() : tab === "review" ? reviewView() : tab === "conj" ? conjView() : phrasesView();
    view.innerHTML = h;
    if (tab === "review" && CP.itEx) CP.itEx.mount(view);
  }

  /* ---------------- 课程: lezioni ---------------- */
  var ls = { view: "list", cur: null, quiz: null };
  function lprog() { try { var o = JSON.parse(lsGet(LKEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function lmark(id, p) { var o = lprog(), x = o[id] || {}; Object.keys(p).forEach(function (k) { x[k] = p[k]; }); o[id] = x; lsSet(LKEY, JSON.stringify(o)); }
  function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b lang="it">$1</b>'); }
  function lessonsView() {
    if (ls.view === "lesson" && ls.cur) return lessonHTML(ls.cur);
    if (ls.view === "quiz" && ls.quiz) return quizHTML();
    if (ls.view === "result" && ls.quiz) return resultHTML();
    /* Task 11.2: in cima la carta «今天» (it/today.js), sotto le lezioni come percorso: nodi collegati, la lezione corrente
       in evidenza, quelle superate con il sigillo «通过» */
    var P = lprog(), L = ITLESSONS.slice().sort(function (a, b) { return a.n - b.n; }), curId = currentLesson(), done = 0;
    var nodes = L.map(function (l) {
      var p = P[l.id] || {}, ok = !!p.done || (p.best || 0) >= PASS, now = l.id === curId; if (ok) done++;
      return '<li class="itp-node' + (ok ? " done" : "") + (now ? " now" : "") + '"><button type="button" data-itl-open="' + CP.attr(l.id) + '"' + (now ? ' aria-current="step"' : "") + ">" +
        '<span class="itp-dot" aria-hidden="true">' + (ok ? '<span class="itp-seal">' + esc(tt("itd.passed")) + "</span>" : l.n) + "</span>" +
        '<span class="itp-t"><small>' + esc(tt("itd.lessonN", { n: l.n })) + "</small><b>" + esc(l.title) + "</b>" + (p.best != null ? '<small class="muted">' + esc(tt("itd.best", { p: p.best })) + "</small>" : "") + "</span></button></li>";
    }).join("");
    return (CP.classBanner ? CP.classBanner() : "") + (CP.itToday ? CP.itToday.html() : "") +
      '<h2 class="itp-h">' + esc(tt("itd.pathT")) + '</h2><p class="small muted" style="margin:0 0 10px">' + esc(tt("itd.pathSub", { d: done, n: L.length, p: PASS })) + "</p>" +
      '<ol class="itp" aria-label="' + CP.attr(tt("itd.pathT")) + '">' + nodes + "</ol>";
  }
  /* la lezione da fare adesso: la prima non superata (in ordine); tutte superate → null */
  function currentLesson() {
    var P = lprog(), L = ITLESSONS.slice().sort(function (a, b) { return a.n - b.n; });
    for (var i = 0; i < L.length; i++) { var p = P[L[i].id] || {}; if (!p.done && (p.best || 0) < PASS) return L[i].id; }
    return null;
  }
  function lessonHTML(l) {
    var p = lprog()[l.id] || {};
    return '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-itl-back>' + Z.back + tt("itc.137") + l.n + tt("itc.138") + (p.best != null ? tt("itc.139") + p.best + "%" : "") + "</span><h3>" + esc(l.title) + '</h3><p class="ls-goal">🎯 ' + esc(l.goal) + "</p>" +
      l.body.map(function (b) { return "<p>" + rich(b) + "</p>"; }).join("") +
      '<div class="ls-pat">' + l.pattern.map(function (f, j) { return (j ? '<span class="ls-plus">+</span>' : "") + '<span class="fx" lang="it">' + esc(f) + "</span>"; }).join("") + "</div>" +
      tt("itc.140") + l.ex.map(function (e) { return '<div class="ls-ex"><div class="it-big" lang="it">' + esc(e[0]) + '</div><div class="small muted">' + esc(e[1]) + "</div><div>" + sayBtn(e[0], true) + "</div></div>"; }).join("") +
      tt("itc.141") + l.traps.map(function (t) { return '<div class="ls-trap"><div class="ls-bad">❌ <span lang="it">' + esc(t[0]) + '</span></div><div class="ls-good">✅ <span lang="it">' + esc(t[1]) + '</span></div><div class="small">' + esc(t[2]) + "</div></div>"; }).join("") +
      tt("itc.142") + l.quiz.length + tt("itc.143");
  }
  function words(s) { return s.replace(/[.,!?¿¡]/g, "").split(/\s+/).filter(Boolean); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function prepare() {
    var q = ls.quiz.l.quiz[ls.quiz.i]; ls.quiz.state = "play"; ls.quiz.choice = null; ls.quiz.order = null; ls.quiz.typed = "";
    if (q.k === "order") {
      var t = words(q.it), bank = t.map(function (w, i) { return { id: i, w: w }; }), sh = bank;
      for (var n = 0; n < 6; n++) { sh = shuffle(bank); if (sh.map(function (b) { return b.w; }).join(" ") !== t.join(" ")) break; }
      ls.quiz.order = { bank: sh, pick: [] };
    }
  }
  function quizHTML() {
    var Q = ls.quiz, l = Q.l, q = l.quiz[Q.i], n = l.quiz.length, h;
    h = '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-itl-open="' + CP.attr(l.id) + '">' + Z.back + '</button></div><div class="panel ls-quiz"><div class="ls-prog" aria-hidden="true"><i style="width:' + Math.round(Q.i * 100 / n) + tt("itc.144") + (Q.i + 1) + " / " + n + tt("itc.145") + Q.score + "</span>";
    if (q.k === "order") {
      var by = {}; Q.order.bank.forEach(function (b) { by[b.id] = b; });
      var tile = function (b, attr, used) { return '<button type="button" class="tile it-tile' + (used ? " used" : "") + '" ' + attr + (used || Q.state !== "play" ? " disabled" : "") + ' lang="it"><span class="th">' + esc(b.w) + "</span></button>"; };
      h += '<p class="ask">' + Z.order + "「" + esc(q.zh) + "」</p>" + tt("itc.146") + Q.order.pick.map(function (id) { return tile(by[id], 'data-itl-un="' + id + '"'); }).join("") + "</div>";
      if (Q.state === "play") h += '<div class="bank">' + Q.order.bank.map(function (b) { return tile(b, 'data-itl-pick="' + b.id + '"', Q.order.pick.indexOf(b.id) >= 0); }).join("") + '</div><div class="acts"><button type="button" data-itl-undo' + (Q.order.pick.length ? "" : " disabled") + ">" + Z.clear + '</button><button type="button" class="btn-main" data-itl-check style="margin:0"' + (Q.order.pick.length === Q.order.bank.length ? "" : " disabled") + ">" + Z.check + "</button></div>";
      else h += (Q.state === "ok" ? '<p class="verdict ok">' + Z.right + "</p>" : '<p class="verdict ko">' + Z.wrong + " " + Z.answerIs + '<span lang="it">' + esc(q.it) + "</span></p>") + '<div class="acts">' + sayBtn(q.it, true) + '<button type="button" class="btn-main" data-itl-next style="margin:0">' + (Q.i + 1 < n ? Z.next : Z.result) + "</button></div>";
    } else if (q.k === "scrivi") {
      /* Task 12: risposta da scrivere in italiano, confrontata come nel ripasso (CP.typing.compareIt) */
      h += '<p class="ask">' + esc(q.q) + '</p><form class="ex-type" data-itl-form><input id="itl-in" type="text" inputmode="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" lang="it" aria-label="' + CP.attr(q.q) + '"' + (Q.state !== "play" ? ' disabled value="' + CP.attr(Q.typed || "") + '"' : "") + "></form>";
      h += Q.state === "play" ? '<div class="acts"><button type="button" class="btn-main" data-itl-type style="margin:0">' + Z.check + "</button></div>" : '<p class="verdict ' + (Q.state === "ok" ? "ok" : "ko") + '">' + (Q.state === "ok" ? Z.right : Z.wrong + " " + Z.answerIs) + ' <b lang="it">' + esc(q.a) + "</b>" + (q.why ? " " + esc(q.why) : "") + '</p><div class="acts"><button type="button" class="btn-main" data-itl-next style="margin:0">' + (Q.i + 1 < n ? Z.next : Z.result) + "</button></div>";
    } else {
      /* «pick» e, dal Task 12, «buco» (la frase italiana con ___; la domanda è facoltativa) */
      h += '<p class="ask">' + esc(q.q || tt("itm.holeQ")) + "</p>" + (q.it ? '<p class="it-big" lang="it">' + esc(q.it) + "</p>" : "");
      h += '<div class="ls-opts">' + q.opts.map(function (o, j) {
        var cls = Q.state === "play" ? "" : j === q.a ? " right" : j === Q.choice ? " wrong" : " off";
        return '<button type="button" class="ls-opt' + cls + '" data-itl-opt="' + j + '"' + (Q.state !== "play" ? " disabled" : "") + ">" + esc(o) + "</button>";
      }).join("") + "</div>";
      if (Q.state !== "play") h += '<p class="verdict ' + (Q.state === "ok" ? "ok" : "ko") + '">' + (Q.state === "ok" ? Z.right : Z.wrong) + (q.why ? " " + esc(q.why) : "") + '</p><div class="acts"><button type="button" class="btn-main" data-itl-next style="margin:0">' + (Q.i + 1 < n ? Z.next : Z.result) + "</button></div>";
    }
    return h + "</div>";
  }
  function resultHTML() {
    var Q = ls.quiz, n = Q.l.quiz.length, pct = Math.round(Q.score * 100 / n), ok = pct >= PASS;
    return '<div class="panel ls-quiz" style="margin-top:14px">' + (ok ? '<span class="it-stamp" aria-hidden="true">' + esc(tt("itd.passed")) + "</span>" : "") + "<h3>" + (ok ? tt("itc.147") : tt("itc.148")) + tt("itc.149") + Q.score + " / " + n + "（" + pct + "%）。" + (ok ? "" : tt("itc.150") + PASS + tt("itc.151")) + "</p>" +
      tt("itc.152") + CP.attr(Q.l.id) + tt("itc.153") + (ok ? '<div class="acts"><button type="button" class="btn-s" data-itd-share>' + esc(tt("itd.share")) + "</button></div>" : "");
  }

  /* ---------------- 单词: lessico ---------------- */
  var wq = "";
  function groupsFor(q) {
    var groups = {}, order = [];
    LEX.forEach(function (e) {
      if (q && (e.it + " " + e.zh + " " + e.py + " " + (e.alt || []).join(" ")).toLowerCase().indexOf(q) < 0) return;
      var ch = typeof SECTION_CHAPTER !== "undefined" ? SECTION_CHAPTER[e.sec] : 0;
      var t = TOPIC[e.sec] || (ch && ch <= 5 ? "HSK " + ch + tt("itc.154") : tt("itc.155")); if (!groups[t]) { groups[t] = []; order.push(t); } groups[t].push(e);
    });
    return { g: groups, o: order };
  }
  function wordsView() {
    var G2 = groupsFor(wq.trim().toLowerCase()), groups = G2.g, order = G2.o;
    return tt("itc.156") + LEX.length + tt("itc.157") +
      tt("itc.158") + CP.attr(wq) + '" autocomplete="off" autocapitalize="off" spellcheck="false">' +
      '<div id="it-wl">' + wordList(groups, order) + "</div>";
  }
  /* 4000 多个词不一次画完：先画 wmax 个，「显示更多」再加 */
  var wmax = 200;
  function wordList(groups, order) {
    if (!order.length) return tt("itc.159");
    var left = wmax, total = 0; order.forEach(function (t) { total += groups[t].length; });
    var html = order.map(function (t) {
      if (left <= 0) return "";
      var g = groups[t].slice(0, left); left -= g.length;
      return '<h3 class="it-topic">' + esc(t) + "</h3>" + g.map(function (e) {
        return '<div class="it-row"><button type="button" class="it-w" data-it-word="' + CP.attr(e.id) + '"><b lang="it">' + esc(e.it) + '</b><span class="small muted">' + esc(gLabel(e)) + "</span></button>" + zhHTML(e.zh, e.py) + sayBtn(e.say) + "</div>";
      }).join("");
    }).join("");
    if (total > wmax) html += tt("itc.160") + (total - wmax) + tt("itc.161");
    return html;
  }

  /* ---------------- 复习: ripasso FSRS ---------------- */
  var SCH = new FSRS.Scheduler({ retention: 0.9, fuzz: true, dayOf: FSRS.studyDay }), DAY = 86400000;
  function sload() { try { var o = JSON.parse(lsGet(SRSKEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function ssave(o) { lsSet(SRSKEY, JSON.stringify(o)); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  var rv = { cur: null, shown: false, done: 0 };
  function queue() {
    var S = sload(), now = Date.now(), due = [], fresh = [], meta = S.__meta || {}, newLeft = NEW_PER_DAY - (meta.d === today() ? meta.nw || 0 : 0);
    LEX.forEach(function (e) { var r = S[e.id]; if (r && r.c) { if (r.c.due <= now) due.push([r.c.due, e]); } else fresh.push(e); });
    due.sort(function (a, b) { return a[0] - b[0]; });
    return { due: due.map(function (x) { return x[1]; }), fresh: newLeft > 0 ? fresh.slice(0, newLeft) : [], newLeft: Math.max(0, newLeft), learned: Object.keys(S).filter(function (k) { return k !== "__meta"; }).length };
  }
  function reviewView() {
    var Q = queue();
    /* Task 12: negli stili Misto e Guidato la carta la disegnano gli esercizi (it/esercizi.js), che possono riproporre una parola sbagliata */
    var EX = CP.itEx && CP.itEx.on();
    if (!rv.cur) rv.cur = (EX && CP.itEx.pick(Q)) || Q.due[0] || Q.fresh[0] || null;
    var head = tt("itc.162") + Q.due.length + tt("itc.163") + Q.newLeft + tt("itc.164") + Q.learned + tt("itc.165");
    if (!rv.cur) return head + tt("itc.166") + '<div class="acts"><button type="button" class="btn-s" data-itd-share>' + esc(tt("itd.share")) + "</button></div>";
    var e = rv.cur, isNew = !sload()[e.id];
    var exh = EX ? CP.itEx.card(e, isNew) : null; if (exh) return head + exh;
    var h = head + '<div class="panel it-card"><span class="tag muted small">' + (isNew ? tt("itc.167") : tt("itc.020")) + " · " + esc(gLabel(e)) + '</span><div class="it-front" lang="it">' + esc(e.it) + "</div><div>" + sayBtn(e.say) + "</div>";
    if (!rv.shown) h += tt("itc.168") + Z.showAnswer + "</button>";
    else {
      h += '<div class="it-back">' + zhHTML(e.zh, e.py) + "</div>" + (e.kind === "noun" || e.kind === "adj" || e.kind === "nat" ? '<p class="small" lang="it">' + esc((e.forms || []).join(" · ")) + "</p>" : e.kind === "verb" ? '<p class="small" lang="it">' + esc(I.present(e.it, 0) + " · " + I.present(e.it, 1) + " · " + I.present(e.it, 2)) + "…</p>" : "") + exHTML(e) +
        tt("itc.169") + [[1, Z.again], [2, Z.hard], [3, Z.good], [4, Z.easy]].map(function (g) { return '<button type="button" data-itr-grade="' + g[0] + '">' + g[1] + "</button>"; }).join("") + "</div>";
    }
    return h + "</div>";
  }
  /* r: voto FSRS 1-4. retry (Task 12, dagli esercizi): la ripetizione nella stessa sessione aggiorna la carta solo se chiude
     un riapprendimento, come CP.grade nel corso di cinese. Stesso formato di cp-it-srs-v1 di sempre: { c, n, lr } */
  function gradeOf(e, r, retry) {
    var S = sload(), now = Date.now(), rec = S[e.id] || {}, card = rec.c || SCH.newCard(now), apply = !retry || !rec.c || (r >= 3 && rec.c.state !== FSRS.REVIEW);
    if (!rec.c) { var m = S.__meta && S.__meta.d === today() ? S.__meta : { d: today(), nw: 0 }; m.nw = (m.nw || 0) + 1; S.__meta = m; }
    var nc = apply ? SCH.review(card, r, now) : card;
    S[e.id] = { c: nc, n: (rec.n || 0) + 1, lr: apply ? now : (rec.lr || now) };
    ssave(S);
    if (CP.game && CP.game.addWord && r >= 2) { try { CP.game.addWord(e.id); } catch (x) {} }   /* 10 punti, una volta al giorno per parola, come nel corso di cinese */
  }
  function grade(r) { gradeOf(rv.cur, r); rv.cur = null; rv.shown = false; rv.done++; }

  /* ---------------- 变位: coniugazioni ---------------- */
  var VERBS = (function () { var seen = {}, out = []; LEX.forEach(function (e) { if (e.kind === "verb" && e.aux && !seen[e.it]) { seen[e.it] = 1; out.push(e); } }); return out; })();
  var cj = { tense: "pres", q: null, state: "play", choice: null, score: 0, n: 0 };
  function formFor(e, p, tense) {
    var pi = p[1], num = pi >= 3 ? "p" : "s", g = p[0] === "lei" ? "f" : "m";
    return tense === "pres" ? I.present(e.it, pi) : I.passato(e.it, e.aux, pi, g, num);
  }
  function newQ() {
    var e = VERBS[Math.floor(Math.random() * VERBS.length)], p = PRON[Math.floor(Math.random() * PRON.length)], right = formFor(e, p, cj.tense), opts = [right];
    shuffle(PRON).forEach(function (o) { var f = formFor(e, o, cj.tense); if (opts.length < 4 && opts.indexOf(f) < 0) opts.push(f); });
    if (cj.tense === "past" && opts.length < 4) { var alt = (e.aux === "e" ? I.passato(e.it, "a", p[1], "m", p[1] >= 3 ? "p" : "s") : I.passato(e.it, "e", p[1], p[0] === "lei" ? "f" : "m", p[1] >= 3 ? "p" : "s")); if (opts.indexOf(alt) < 0) opts.push(alt); }
    cj.q = { e: e, p: p, right: right, opts: shuffle(opts) }; cj.state = "play"; cj.choice = null;
  }
  function conjView() {
    if (!cj.q) newQ();
    var q = cj.q, h = tt("itc.170") + (cj.tense === "pres" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + tt("itc.171") + (cj.tense === "past" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + tt("itc.172") +
      tt("itc.173") + cj.score + " / " + cj.n + '</span><p class="ask"><b lang="it">' + esc(q.p[0]) + "</b> + <b lang=\"it\">" + esc(q.e.it) + "</b>（" + zhHTML(q.e.zh, q.e.py) + "）</p>" +
      '<p class="small muted">' + (cj.tense === "pres" ? tt("itc.174") : tt("itc.175")) + "</p>" +
      '<div class="ls-opts">' + q.opts.map(function (o, j) { var cls = cj.state === "play" ? "" : o === q.right ? " right" : j === cj.choice ? " wrong" : " off"; return '<button type="button" class="ls-opt' + cls + '" data-itc-opt="' + j + '" lang="it"' + (cj.state !== "play" ? " disabled" : "") + ">" + esc(o) + "</button>"; }).join("") + "</div>";
    if (cj.state !== "play") h += '<p class="verdict ' + (cj.state === "ok" ? "ok" : "ko") + '">' + (cj.state === "ok" ? Z.right : Z.wrong + " " + Z.answerIs + '<span lang="it">' + esc(q.right) + "</span>") + "</p>" + conjTable(q.e.it, q.e.aux) + '<div class="acts"><button type="button" class="btn-main" data-itc-next style="margin:0">' + Z.next + "</button></div>";
    return h + "</div>";
  }

  /* ---------------- 句子: frasi e dialoghi ---------------- */
  var ph = { dlg: null };
  /* 句子练习: una delle 5754 frasi d'esempio (data/examples), da ricomporre in italiano partendo dal cinese */
  var px = null;
  function pxNew() {
    var E = typeof EXAMPLES !== "undefined" ? EXAMPLES : {}, ks = Object.keys(E), x = null;
    for (var n = 0; n < 40 && !x; n++) { var e = E[ks[Math.floor(Math.random() * ks.length)]]; if (e && words(e[1]).length >= 3 && words(e[1]).length <= 8) x = e; }
    if (!x) return null;
    var t = words(x[1]), bank = t.map(function (w, i) { return { id: i, w: w }; }), sh = bank;
    for (var k = 0; k < 6; k++) { sh = shuffle(bank); if (sh.map(function (b) { return b.w; }).join(" ") !== t.join(" ")) break; }
    return { zh: x[0], it: x[1], t: t, bank: sh, pick: [], state: "play" };
  }
  function pxHTML() {
    if (!px) px = pxNew(); if (!px) return "";
    var by = {}; px.bank.forEach(function (b) { by[b.id] = b; });
    var tile = function (b, attr, used) { return '<button type="button" class="tile it-tile' + (used ? " used" : "") + '" ' + attr + (used || px.state !== "play" ? " disabled" : "") + ' lang="it"><span class="th">' + esc(b.w) + "</span></button>"; };
    var h = tt("itc.176") + esc(px.zh) + "</p>" +
      tt("itc.146") + px.pick.map(function (id) { return tile(by[id], 'data-itx-un="' + id + '"'); }).join("") + "</div>";
    if (px.state === "play") h += '<div class="bank">' + px.bank.map(function (b) { return tile(b, 'data-itx-pick="' + b.id + '"', px.pick.indexOf(b.id) >= 0); }).join("") + '</div><div class="acts"><button type="button" class="btn-main" data-itx-check' + (px.pick.length === px.t.length ? "" : " disabled") + ">" + Z.check + tt("itc.177");
    else h += (px.state === "ok" ? '<p class="verdict ok">' + Z.right + "</p>" : '<p class="verdict ko">' + Z.wrong + " " + Z.answerIs + '<span lang="it">' + esc(px.it) + "</span></p>") + '<div class="acts">' + sayBtn(px.it, true) + '<button type="button" class="btn-main" data-itx-next>' + Z.next + "</button></div>";
    return h + "</div>";
  }
  function pxPaint() { var el = document.getElementById("it-px"); if (el) el.outerHTML = pxHTML(); }
  view.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-itx-pick],[data-itx-un],[data-itx-check],[data-itx-next]") : null; if (!b || !px) return;
    if (b.hasAttribute("data-itx-pick")) px.pick.push(+b.getAttribute("data-itx-pick"));
    else if (b.hasAttribute("data-itx-un")) px.pick.splice(px.pick.indexOf(+b.getAttribute("data-itx-un")), 1);
    else if (b.hasAttribute("data-itx-check")) {
      var by = {}; px.bank.forEach(function (x) { by[x.id] = x.w; });
      var got = px.pick.map(function (id) { return by[id]; }).join(" ").toLowerCase(), ok = got === px.t.join(" ").toLowerCase();
      px.state = ok ? "ok" : "ko"; CP.sfx(ok ? "ok" : "ko"); if (ok && CP.game && CP.game.sentence) CP.game.sentence(); if (ok) CP.speak(px.it, { lang: "it-IT", voiceURI: CP.itVoiceURI() });
    } else if (b.hasAttribute("data-itx-next")) px = pxNew();
    CP.sfx("tap"); pxPaint();
  });
  function phrasesView() {
    if (CP.itRead && CP.itRead.active()) return CP.itRead.html();
    if (ph.dlg) {
      var d = DIALOGS.filter(function (x) { return x.id === ph.dlg; })[0];
      return '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-itp-back>' + Z.back + "</button></div><h2>" + esc(DLG_ZH[d.id] || d.title) + '</h2><p class="small muted" lang="it">' + esc(d.title + " — " + d.sub) + "</p>" +
        d.lines.map(function (l) { return '<div class="it-line it-' + (l[0] === "B" ? "b" : "a") + '"><div class="it-big" lang="it">' + esc(l[3]) + '</div><div class="small">' + zhHTML(l[2], l[1]) + "</div>" + sayBtn(l[3], true) + "</div>"; }).join("");
    }
    var h = pxHTML() + (CP.itRead ? CP.itRead.listHTML() : "") + (CP.itCheckHTML ? CP.itCheckHTML() : "") + tt("itc.178");
    h += PHRASES.map(function (g, gi) {
      return '<details class="pat"><summary>' + esc(PHR_ZH[gi] || g.title) + "</summary>" + g.items.map(function (p) { return '<div class="ls-ex"><div class="it-big" lang="it">' + esc(p[2]) + '</div><div class="small">' + zhHTML(p[1], p[0]) + "</div><div>" + sayBtn(p[2], true) + "</div></div>"; }).join("") + "</details>";
    }).join("");
    h += tt("itc.179") + DIALOGS.map(function (d) { return '<button type="button" class="ls-card" data-itp-dlg="' + CP.attr(d.id) + '"><span class="ls-n" aria-hidden="true">💬</span><span class="ls-t"><b>' + esc(DLG_ZH[d.id] || d.title) + '</b><span class="small muted" lang="it">' + esc(d.title) + "</span></span><span></span></button>"; }).join("") + "</div>";
    return h;
  }

  /* ---------------- eventi ---------------- */
  dock.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-it-tab]") : null; if (b) { CP.sfx("tap"); show(b.getAttribute("data-it-tab")); } });
  function repaintWords() { var G2 = groupsFor(wq.trim().toLowerCase()); document.getElementById("it-wl").innerHTML = wordList(G2.g, G2.o); }
  view.addEventListener("input", function (e) { if (e.target.id === "it-q") { wq = e.target.value; wmax = 200; repaintWords(); } });
  view.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-it-more]")) { wmax += 300; repaintWords(); } });
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-it-say]") : null;
    if (t) { CP.speak(t.getAttribute("data-it-say"), { lang: "it-IT", el: t, voiceURI: CP.itVoiceURI() }); }
  });
  view.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b || b.hasAttribute("data-it-say")) return;
    var a = function (n) { return b.getAttribute(n); };
    /* lezioni */
    if (a("data-itl-open") !== null) { ls.cur = ITLESSONS.filter(function (l) { return l.id === a("data-itl-open"); })[0]; ls.view = "lesson"; ls.quiz = null; lmark(ls.cur.id, { seen: Date.now() }); CP.sfx("tap"); render(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute("data-itl-back")) { ls.view = "list"; ls.cur = null; ls.quiz = null; render(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute("data-itl-quiz")) { ls.quiz = { l: ls.cur || ls.quiz.l, i: 0, score: 0 }; ls.cur = ls.quiz.l; prepare(); ls.view = "quiz"; render(); window.scrollTo(0, 0); return; }
    if (ls.quiz) {
      var Q = ls.quiz, q = Q.l.quiz[Q.i];
      if (a("data-itl-pick") !== null && Q.state === "play") { Q.order.pick.push(+a("data-itl-pick")); CP.sfx("tap"); render(); return; }
      if (a("data-itl-un") !== null && Q.state === "play") { var u = +a("data-itl-un"); Q.order.pick = Q.order.pick.filter(function (x) { return x !== u; }); render(); return; }
      if (b.hasAttribute("data-itl-undo")) { Q.order.pick.pop(); render(); return; }
      if (b.hasAttribute("data-itl-check")) {
        var by = {}; Q.order.bank.forEach(function (x) { by[x.id] = x; });
        var got = Q.order.pick.map(function (id) { return by[id].w; }).join(" ").toLowerCase();
        Q.state = got === words(q.it).join(" ").toLowerCase() ? "ok" : "ko"; if (Q.state === "ok") Q.score++;
        CP.sfx(Q.state === "ok" ? "ok" : "ko"); render(); return;
      }
      if (a("data-itl-opt") !== null && Q.state === "play") { Q.choice = +a("data-itl-opt"); Q.state = Q.choice === q.a ? "ok" : "ko"; if (Q.state === "ok") Q.score++; CP.sfx(Q.state === "ok" ? "ok" : "ko"); render(); return; }
      if (b.hasAttribute("data-itl-type") && Q.state === "play") { itTyped(Q, q); return; }
      if (b.hasAttribute("data-itl-next")) {
        if (Q.i + 1 < Q.l.quiz.length) { Q.i++; prepare(); ls.view = "quiz"; }
        else { var pct = Math.round(Q.score * 100 / Q.l.quiz.length), pr = lprog()[Q.l.id] || {}, patch = { best: Math.max(pr.best || 0, pct) }; if (pct >= PASS && !pr.done) { patch.done = Date.now(); if (CP.game && CP.game.xp) CP.game.xp(30); CP.sfx("level"); } lmark(Q.l.id, patch); if (CP.unlock) CP.unlock.check(); ls.view = "result"; CP.sfx(pct >= PASS ? "ok" : "tap"); }
        render(); window.scrollTo(0, 0); return;
      }
    }
    /* parole */
    if (a("data-it-word") !== null) { CP.openSheet(detailHTML(BYID[a("data-it-word")])); return; }
    /* ripasso */
    if (b.hasAttribute("data-itr-show")) { rv.shown = true; CP.sfx("tap"); render(); return; }
    if (a("data-itr-grade") !== null) { grade(+a("data-itr-grade")); CP.sfx("tap"); render(); return; }
    /* coniugazioni */
    if (a("data-itc-tense") !== null) { cj.tense = a("data-itc-tense"); cj.q = null; render(); return; }
    if (a("data-itc-opt") !== null && cj.state === "play") { cj.choice = +a("data-itc-opt"); cj.n++; cj.state = cj.q.opts[cj.choice] === cj.q.right ? "ok" : "ko"; if (cj.state === "ok") { cj.score++; if (CP.game && CP.game.xp) CP.game.xp(3); } CP.sfx(cj.state === "ok" ? "ok" : "ko"); render(); return; }
    if (b.hasAttribute("data-itc-next")) { cj.q = null; render(); return; }
    /* frasi */
    if (a("data-itp-dlg") !== null) { ph.dlg = a("data-itp-dlg"); render(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute("data-itp-back")) { ph.dlg = null; render(); return; }
  });

  /* il benvenuto (in cinese) è quello comune, ui/welcome.js: intro, porte, test di livello sulle 30 lezioni */
  show(tab);
  /* tasto Indietro dell'APK: prima i fogli (già gestiti), poi la lezione aperta, poi la prima scheda */
  var prevBack = window.__mdBack;
  window.__mdBack = function () {
    if (CP.topSheet && CP.topSheet()) return prevBack ? prevBack() : false;
    if (tab === "lessons" && ls.view !== "list") { ls.view = "list"; ls.cur = null; ls.quiz = null; render(); return true; }
    if (tab === "phrases" && CP.itRead && CP.itRead.active()) { CP.itRead.close(); render(); return true; }
    if (tab === "phrases" && ph.dlg) { ph.dlg = null; render(); return true; }
    if (tab !== "lessons") { show("lessons"); return true; }
    return false;
  };
})();
