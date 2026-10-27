/* ===== màndarínō · corso di italiano: lettura graduata (Task 12, T5; la stessa del corso di cinese, phrases/reading.js).
   In 句子, sopra le frasi: i testi italiani A1-B1 (TESTI_IT, da tools/lettura.mjs, letti al primo uso), per livello, con
   «适合你» quando almeno il 90% delle parole è già nel ripasso e il segno «已读». Nel testo: ogni frase si ascolta (con la
   voce reale, se è sul telefono), la traduzione cinese si accende e spegne, un tocco su una parola apre il suo foglio.
   In fondo le domande in cinese (risposte in italiano, mescolate con un seme), le parole nuove con un tocco per metterle
   nel ripasso (CP.itApi.grade, voto 0), 5 punti la prima volta e il segno in cp-ex-v1.read. Testi in i18n/it-course.js. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  var IT = (function () { try { return localStorage.getItem("cp-course") === "it"; } catch (e) { return false; } })();
  if (!IT) return;
  var XP = 5, FIT = 0.9, KEY = "cp-ex-v1", WRE = /[A-Za-zÀ-ÖØ-öø-ÿ]+['’]?/g;
  var R = { view: "list", t: null, tr: true, ans: {} };
  function A() { return CP.itApi; }
  function texts() { try { return typeof TESTI_IT !== "undefined" ? TESTI_IT : []; } catch (e) { return []; } }
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "null"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function readMap() { return load().read || {}; }
  /* forma → voce del lessico (le forme di it/esercizi.js: nomi senza articolo, aggettivi, verbi con il presente) */
  var FI = null;
  function formIndex() {
    if (FI) return FI; FI = {};
    if (!CP.itEx) return FI;
    A().lex().forEach(function (e) { CP.itEx.forms(e).forEach(function (f) { if (!FI[f]) FI[f] = e; }); });
    return FI;
  }
  function entriesOf(t) { var I = formIndex(), seen = {}, out = []; t.frasi.forEach(function (f) { (f.it.match(WRE) || []).forEach(function (w) { var e = I[w.toLowerCase()]; if (e && !seen[e.id]) { seen[e.id] = 1; out.push(e); } }); }); return out; }
  function known(e) { var r = A().rec(e.id); return !!(r && r.c); }
  function knownPct(t) { var es = entriesOf(t); return es.length ? es.filter(known).length / es.length : 0; }
  /* un generatore con seme (lo stesso del gruppo ESERCIZI, qui per non caricarlo solo per mescolare tre risposte) */
  function rng(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } var a = h >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function shuffled(t, i, d) {
    var r = rng(t.id + "|" + i), a = d.scelte_it.slice();
    for (var j = a.length - 1; j > 0; j--) { var k = Math.floor(r() * (j + 1)), x = a[j]; a[j] = a[k]; a[k] = x; }
    return { opts: a, right: a.indexOf(d.scelte_it[d.giusta]) };
  }

  function listHTML() {
    var L = texts(); if (!L.length) return "";
    var rd = readMap(), lv = {};
    L.forEach(function (t) { (lv[t.livello] = lv[t.livello] || []).push(t); });
    return '<section class="itr-read"><h2 class="it-topic">' + esc(T("itq.title")) + '</h2><p class="small muted" style="margin:0 0 8px">' + esc(T("itq.lede")) + "</p>" + Object.keys(lv).sort().map(function (l) {
      return '<h3 class="rdg-h">' + esc(l) + '</h3><div class="rdg-list">' + lv[l].map(function (t) {
        var fit = knownPct(t) >= FIT;
        return '<button type="button" class="rdg-item" data-itq="' + CP.attr(t.id) + '"><span class="rdg-zh" lang="it">' + esc(t.titolo.it) + '</span><span class="rdg-it" lang="zh-CN">' + esc(t.titolo.zh) + "</span>" +
          '<span class="rdg-tags">' + (rd[t.id] ? '<span class="tag">✓ ' + esc(T("itq.read")) + "</span>" : "") + (fit ? '<span class="tag rdg-fit">★ ' + esc(T("itq.fit")) + "</span>" : "") + "</span></button>";
      }).join("") + "</div>";
    }).join("") + "</section>";
  }
  function sentHTML(f) {
    var I = formIndex(), line = esc(f.it).replace(WRE, function (w) { var e = I[w.toLowerCase()]; return e ? '<button type="button" class="itq-w" data-itq-w="' + CP.attr(e.id) + '">' + w + "</button>" : w; });
    return '<div class="rdg-s"><div class="itq-line it-big" lang="it">' + line + '</div><div class="rdg-tools">' + A().sayBtn(f.it, true) + (R.tr ? '<span class="cd-note" lang="zh-CN">' + esc(f.zh) + "</span>" : "") + "</div></div>";
  }
  function textHTML(t) {
    return '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-itq-back>← ' + esc(T("itq.all")) + "</button></div>" +
      '<article class="panel rdg-text"><span class="tag muted small">' + esc(t.livello) + '</span><h3 lang="it">' + esc(t.titolo.it) + '</h3><p class="small muted" lang="zh-CN" style="margin:0">' + esc(t.titolo.zh) + "</p>" +
      '<div class="seg rdg-togs" role="group" aria-label="' + CP.attr(T("itq.show")) + '"><button type="button" data-itq-tr aria-pressed="' + R.tr + '"' + (R.tr ? ' class="on"' : "") + ">" + esc(T("itq.tr")) + "</button></div>" +
      t.frasi.map(sentHTML).join("") + '<p class="small muted">' + esc(T("itq.tap")) + '</p><div class="acts"><button type="button" class="btn-main" data-itq-q style="margin:0">' + esc(T("itq.questions", { n: (t.domande || []).length })) + "</button></div></article>";
  }
  function questionsHTML(t) {
    var all = (t.domande || []).length, ok = 0;
    var h = '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-itq-text>← ' + esc(t.titolo.it) + '</button></div><div class="panel rdg-qs">';
    (t.domande || []).forEach(function (d, i) {
      var o = shuffled(t, i, d), a = R.ans[i];
      if (a != null && a === o.right) ok++;
      h += '<div class="rdg-q"><p class="ask" lang="zh-CN">' + esc(d.domanda_zh) + '</p><div class="ex-opts wide">' + o.opts.map(function (x, j) {
        var cls = a == null ? "" : j === o.right ? " ok" : j === a ? " ko" : "";
        return '<button type="button" class="ex-opt' + cls + '" data-itq-a="' + i + ":" + j + '"' + (a != null ? " disabled" : "") + ' lang="it"><span class="ex-n" aria-hidden="true">' + (j + 1) + '</span><span class="ex-t">' + esc(x) + "</span>" + (a != null && j === o.right ? '<span class="ex-mark" aria-hidden="true">✓</span>' : a === j ? '<span class="ex-mark" aria-hidden="true">✗</span>' : "") + "</button>";
      }).join("") + "</div>" + (a != null && a !== o.right ? '<p class="small muted" lang="it">' + esc(t.frasi[d.frase].it) + "</p>" : "") + "</div>";
    });
    if (Object.keys(R.ans).length === all) {
      var nw = entriesOf(t).filter(function (e) { return !known(e); });
      h += '<div class="rdg-end"><p class="gd-score"><b>' + esc(T("itq.score", { ok: ok, n: all })) + "</b></p>" + (R.gotXp ? '<p class="small okline">' + esc(T("itq.xp", { n: XP })) + "</p>" : "") +
        (nw.length ? "<h4>" + esc(T("itq.new", { n: nw.length })) + '</h4><div class="rdg-new">' + nw.map(function (e) { return '<button type="button" class="rdg-add" data-itq-add="' + CP.attr(e.id) + '"><span lang="it">' + esc(e.it) + '</span> <small lang="zh-CN">' + esc(e.zh) + "</small> <b>+</b></button>"; }).join("") + "</div>" : "") +
        '<div class="acts"><button type="button" class="btn-main" data-itq-back style="margin:0">' + esc(T("itq.all")) + "</button></div></div>";
    }
    return h + "</div>";
  }
  function html() { return R.view === "q" && R.t ? questionsHTML(R.t) : R.t ? textHTML(R.t) : ""; }
  function open(id) { var t = texts().filter(function (x) { return x.id === id; })[0]; if (!t) return; R.t = t; R.view = "text"; R.ans = {}; R.gotXp = false; }
  function finish(t) {
    var o = load(); o.read = o.read || {};
    if (!o.read[t.id]) { o.read[t.id] = Date.now(); save(o); if (CP.game && CP.game.xp) CP.game.xp(XP); R.gotXp = true; if (window.Store && Store.flush) Store.flush(); }
  }
  function paint() { A().rerender(); window.scrollTo(0, 0); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-itq], [data-itq-back], [data-itq-text], [data-itq-tr], [data-itq-w], [data-itq-q], [data-itq-a], [data-itq-add]") : null; if (!b) return;
    CP.sfx("tap");
    if (b.hasAttribute("data-itq")) { open(b.getAttribute("data-itq")); paint(); }
    else if (b.hasAttribute("data-itq-back")) { R.t = null; R.view = "list"; paint(); }
    else if (b.hasAttribute("data-itq-text")) { R.view = "text"; paint(); }
    else if (b.hasAttribute("data-itq-tr")) { R.tr = !R.tr; A().rerender(); }
    else if (b.hasAttribute("data-itq-w")) { var w = A().entry(b.getAttribute("data-itq-w")); if (w && A().detail) CP.openSheet(A().detail(w)); }
    else if (b.hasAttribute("data-itq-q")) { R.view = "q"; paint(); }
    else if (b.hasAttribute("data-itq-a")) {
      var p = b.getAttribute("data-itq-a").split(":"), i = +p[0], t = R.t; if (!t || R.ans[i] != null) return;
      R.ans[i] = +p[1]; CP.sfx(R.ans[i] === shuffled(t, i, t.domande[i]).right ? "ok" : "ko");
      if (Object.keys(R.ans).length === (t.domande || []).length) finish(t);
      A().rerender();
    }
    else if (b.hasAttribute("data-itq-add")) {
      var id = b.getAttribute("data-itq-add"), en = A().entry(id); if (en && !known(en)) A().grade(en, 0, { type: "lettura" });
      b.disabled = true; b.classList.add("ok"); b.querySelector("b").textContent = "✓"; CP.toast(T("itq.added"));
    }
  });
  CP.itRead = { texts: texts, readMap: readMap, open: open, active: function () { return !!R.t; }, html: html, listHTML: listHTML, knownPct: knownPct, state: function () { return R; }, close: function () { R.t = null; R.view = "list"; } };
})();
