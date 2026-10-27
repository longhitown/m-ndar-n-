/* ===== màndarínō · lettura graduata (Task 12, §12.7), corso di cinese: Frasi → 📖 Leggi → Testi.
   - Elenco per livello (TESTI_ZH, da tools/lettura.mjs), con «giusto per te» quando conosci almeno il 90% delle parole
     del testo (parole già avviate nel ripasso) e il segno «letto».
   - Il testo frase per frase: un tocco su una parola apre il suo foglio (significato e famiglia, CP.openFamily);
     pinyin (acceso fino al livello 2) e traduzione si accendono e spengono; ogni frase si ascolta.
   - Alla fine le domande di comprensione (le risposte si mescolano con un seme), le parole nuove con un tocco per metterle
     nel ripasso, 5 punti la prima volta e il segno «letto» in cp-ex-v1.read. Gruppo ESERCIZI (al primo uso). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, D = CP.distract, ENG = CP.exEngine, XP = 5, FIT = 0.9;
  var R = { view: "list", t: null, py: null, tr: false, ans: {} };
  function texts() { try { return typeof TESTI_ZH !== "undefined" ? TESTI_ZH : []; } catch (e) { return []; } }
  function segs(z) { return CP.segment(z); }
  function wordsOf(t) { var seen = {}, out = []; t.frasi.forEach(function (f) { segs(f.zh).forEach(function (s) { if (s.w && !seen[s.w.key]) { seen[s.w.key] = 1; out.push(s.w); } }); }); return out; }
  function knownPct(t) { var w = wordsOf(t); return w.length ? w.filter(function (x) { return CP.state(x.key) >= 1; }).length / w.length : 0; }
  function readMap() { return ENG.load().read || {}; }

  function listHTML() {
    var L = texts(), rd = readMap(), lv = {};
    L.forEach(function (t) { (lv[t.livello] = lv[t.livello] || []).push(t); });
    return '<p class="intro" style="margin-top:14px">' + esc(T("rdg.lede")) + "</p>" + Object.keys(lv).sort().map(function (l) {
      return '<h3 class="rdg-h">' + esc(T("rdg.level", { n: l })) + '</h3><div class="rdg-list">' + lv[l].map(function (t) {
        var fit = knownPct(t) >= FIT;
        return '<button type="button" class="rdg-item" data-rdg="' + CP.attr(t.id) + '"><span class="rdg-zh" lang="zh-CN">' + esc(t.titolo.zh) + '</span><span class="rdg-it" lang="it">' + esc(t.titolo.it) + "</span>" +
          '<span class="rdg-tags">' + (rd[t.id] ? '<span class="tag">✓ ' + esc(T("rdg.read")) + "</span>" : "") + (fit ? '<span class="tag rdg-fit">★ ' + esc(T("rdg.fit")) + "</span>" : "") + "</span></button>";
      }).join("") + "</div>";
    }).join("");
  }
  function sentHTML(f, i) {
    var w = segs(f.zh).map(function (s) {
      if (!s.w) return '<span class="rdg-p">' + esc(s.raw) + "</span>";
      return '<button type="button" class="rdg-w" data-rdg-w="' + CP.attr(s.w.key) + '">' + (R.py ? '<span class="rdg-py">' + CP.pinyinHTML(s.w.py) + "</span>" : "") + '<span class="rdg-hz" lang="zh-CN">' + CP.hanziHTML(s.w.hz, s.w.py) + "</span></button>";
    }).join("");
    return '<div class="rdg-s"><div class="rdg-line">' + w + "</div>" + '<div class="rdg-tools">' + CP.sayBtn(f.zh) + (R.tr ? '<span class="cd-note" lang="it">' + esc(f.it) + "</span>" : "") + "</div></div>";
  }
  function textHTML(t) {
    var tog = function (k, on, label) { return '<button type="button" data-rdg-tog="' + k + '" aria-pressed="' + on + '"' + (on ? ' class="on"' : "") + ">" + esc(label) + "</button>"; };
    return '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-rdg-back>← ' + esc(T("rdg.all")) + "</button></div>" +
      '<article class="panel rdg-text"><span class="tag muted small">' + esc(T("rdg.level", { n: t.livello })) + '</span><h3 lang="zh-CN">' + esc(t.titolo.zh) + '</h3><p class="small muted" lang="it" style="margin:0">' + esc(t.titolo.it) + "</p>" +
      '<div class="seg rdg-togs" role="group" aria-label="' + CP.attr(T("rdg.show")) + '">' + tog("py", R.py, T("rdg.py")) + tog("tr", R.tr, T("rdg.tr")) + "</div>" +
      t.frasi.map(sentHTML).join("") + '<p class="small muted">' + esc(T("rdg.tap")) + '</p><div class="acts"><button type="button" class="btn-main" data-rdg-q style="margin:0">' + esc(T("rdg.questions", { n: (t.domande || []).length })) + "</button></div></article>";
  }
  /* le domande: risposte mescolate con un seme (nei dati la giusta è sempre la prima) */
  function shuffled(t, i, d) { var r = D.rng(D.seed(t.id + "|" + i)); return D.options(d.scelte_it[d.giusta], d.scelte_it.filter(function (x, j) { return j !== d.giusta; }), r); }
  function questionsHTML(t) {
    var all = (t.domande || []).length, done = Object.keys(R.ans).length, ok = 0;
    var h = '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-rdg-open="' + CP.attr(t.id) + '">← ' + esc(t.titolo.zh) + '</button></div><div class="panel rdg-qs">';
    (t.domande || []).forEach(function (d, i) {
      var o = shuffled(t, i, d), a = R.ans[i];
      if (a != null && a === o.right) ok++;
      h += '<div class="rdg-q"><p class="ask" lang="it">' + esc(d.domanda_it) + '</p><div class="ex-opts wide">' + o.opts.map(function (x, j) {
        var cls = a == null ? "" : j === o.right ? " ok" : j === a ? " ko" : "";
        return '<button type="button" class="ex-opt' + cls + '" data-rdg-a="' + i + ":" + j + '"' + (a != null ? " disabled" : "") + ' lang="it"><span class="ex-n" aria-hidden="true">' + (j + 1) + '</span><span class="ex-t">' + esc(x) + "</span>" + (a != null && j === o.right ? '<span class="ex-mark" aria-hidden="true">✓</span>' : a === j ? '<span class="ex-mark" aria-hidden="true">✗</span>' : "") + "</button>";
      }).join("") + "</div>" + (a != null && a !== o.right ? '<p class="small muted" lang="zh-CN">' + esc(t.frasi[d.frase].zh) + "</p>" : "") + "</div>";
    });
    if (done === all) h += endHTML(t, ok, all);
    return h + "</div>";
  }
  function endHTML(t, ok, all) {
    var nw = wordsOf(t).filter(function (w) { return CP.state(w.key) < 1; });
    return '<div class="rdg-end"><p class="gd-score"><b>' + esc(T("rdg.score", { ok: ok, n: all })) + "</b></p>" + (R.gotXp ? '<p class="small okline">' + esc(T("rdg.xp", { n: XP })) + "</p>" : "") +
      (nw.length ? "<h4>" + esc(T("rdg.new", { n: nw.length })) + '</h4><div class="rdg-new">' + nw.map(function (w) { return '<button type="button" class="rdg-add" data-rdg-add="' + CP.attr(w.key) + '"><span lang="zh-CN">' + esc(w.hz) + "</span> " + CP.pinyinHTML(w.py) + ' <small lang="it">' + esc(D.gloss(w.it)) + "</small> <b>+</b></button>"; }).join("") + "</div>" : "") +
      '<div class="acts"><button type="button" class="btn-main" data-rdg-back style="margin:0">' + esc(T("rdg.all")) + "</button></div></div>";
  }
  function render() {
    var t = R.t;
    if (R.view === "text" && t) return textHTML(t);
    if (R.view === "q" && t) return questionsHTML(t);
    return listHTML();
  }
  function paint() { var root = document.getElementById("build-root"), host = root && root.querySelector(".rdg-host"); if (host) host.innerHTML = render(); }
  function open(id) { var t = texts().filter(function (x) { return x.id === id; })[0]; if (!t) return; R.t = t; R.view = "text"; R.ans = {}; R.gotXp = false; if (R.py === null || R.lastLv !== t.livello) R.py = t.livello <= 2; R.lastLv = t.livello; paint(); window.scrollTo(0, 0); }
  function finish(t) {
    var o = ENG.load(); o.read = o.read || {};
    if (!o.read[t.id]) { o.read[t.id] = Date.now(); ENG.save(o); if (CP.game && CP.game.xp) CP.game.xp(XP); R.gotXp = true; if (window.Store && Store.flush) Store.flush(); }
  }
  document.addEventListener("click", function (e) {
    var root = document.getElementById("build-root"); if (!root || !root.querySelector(".rdg-host")) return;
    var b = e.target.closest ? e.target.closest("[data-rdg], [data-rdg-open], [data-rdg-back], [data-rdg-tog], [data-rdg-w], [data-rdg-q], [data-rdg-a], [data-rdg-add]") : null; if (!b || !root.contains(b)) return;
    CP.sfx("tap");
    if (b.hasAttribute("data-rdg")) open(b.getAttribute("data-rdg"));
    else if (b.hasAttribute("data-rdg-open")) { R.view = "text"; paint(); }
    else if (b.hasAttribute("data-rdg-back")) { R.view = "list"; R.t = null; paint(); }
    else if (b.hasAttribute("data-rdg-tog")) { var k = b.getAttribute("data-rdg-tog"); R[k] = !R[k]; paint(); }
    else if (b.hasAttribute("data-rdg-w")) { var w = CP.WORDS[b.getAttribute("data-rdg-w")]; if (w) CP.openFamily(w.hz); }
    else if (b.hasAttribute("data-rdg-q")) { R.view = "q"; paint(); window.scrollTo(0, 0); }
    else if (b.hasAttribute("data-rdg-a")) {
      var p = b.getAttribute("data-rdg-a").split(":"), i = +p[0], t = R.t; if (R.ans[i] != null) return;
      R.ans[i] = +p[1]; var right = shuffled(t, i, t.domande[i]).right; CP.sfx(R.ans[i] === right ? "ok" : "ko");
      if (Object.keys(R.ans).length === (t.domande || []).length) finish(t);
      paint();
    }
    else if (b.hasAttribute("data-rdg-add")) {
      /* nel ripasso: la parola entra come «da imparare» e torna presto */
      var k2 = b.getAttribute("data-rdg-add"); if (CP.state(k2) < 1) CP.grade(k2, 0, false, { ms: 0, type: "lettura" });
      b.disabled = true; b.classList.add("ok"); b.querySelector("b").textContent = "✓"; CP.toast(T("rdg.added"));
    }
  });
  CP.reading = {
    render: function () { return '<div class="rdg-host">' + render() + "</div>"; }, open: open, texts: texts, knownPct: knownPct,
    state: function () { return R; }
  };
})();
