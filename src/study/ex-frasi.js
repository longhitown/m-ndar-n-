/* ===== màndarínō · esercizi con le frasi (Task 12, T2, §12.4): frase a buco (parola), buco grammaticale, rimetti in ordine.
   Le frasi di una parola (CP.exSent.forWord), in quest'ordine: la frase d'esempio della parola (EXAMPLES), le frasi di
   Tatoeba con traduzione diretta (FRASI_ZH, livello non sopra quello della parola), gli esempi delle lezioni, le frasi
   delle voci reali (VOCE_ZH, senza traduzione: solo come ultima scelta). Ogni frase passa dal taglio dell'app (CP.segment):
   la parola deve comparire come parola, non come pezzo di un'altra (中 non vale dentro 中国).
   Buco grammaticale: gli insiemi confondibili (INSIEMI.zh: 了/过/着, 的/得/地, 在/再…) e i classificatori (CP.lab.NCLF, solo
   quando il nome che segue è nell'elenco: così la risposta giusta è sicura). Gruppo ESERCIZI (al primo uso). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, D = CP.distract, ENG = CP.exEngine;
  var IDX = null;
  /* [{ zh, it, toks: [segmenti], src }] per chiave di parola */
  function index() {
    if (IDX) return IDX;
    IDX = {};
    var add = function (zh, it, src, lv) {
      var toks = CP.segment(zh); if (toks.some(function (s) { return !s.w && !s.p; })) return;
      var seen = {};
      toks.forEach(function (s) { if (!s.w || seen[s.w.key]) return; seen[s.w.key] = 1; var w = s.w; if (lv && lv > ENG.ctx.levelOf(w)) return; (IDX[w.key] = IDX[w.key] || []).push({ zh: zh, it: it, toks: toks, src: src }); });
    };
    try { if (typeof FRASI_ZH !== "undefined") FRASI_ZH.righe.forEach(function (r) { if (r[5]) add(r[0], r[1], "tatoeba", r[2]); }); } catch (e) {}
    (typeof LESSONS !== "undefined" ? LESSONS : []).forEach(function (l) { (l.ex || []).forEach(function (e) { add(e[0], e[1], "lesson"); }); });
    try { if (typeof VOCE_ZH !== "undefined") VOCE_ZH.righe.forEach(function (r) { add(r[2], "", "voice"); }); } catch (e) {}
    return IDX;
  }
  function forWord(w) {
    var out = [], x = typeof EXAMPLES !== "undefined" && EXAMPLES[w.key];
    if (x) { var toks = CP.segment(x[0]); if (toks.some(function (s) { return s.w && s.w.key === w.key; })) out.push({ zh: x[0], it: x[1], toks: toks, src: "example" }); }
    return out.concat(index()[w.key] || []);
  }
  /* la frase con un buco al posto del segmento i: la lunghezza in caratteri resta visibile */
  function holed(toks, i) {
    return toks.map(function (s, j) { return j === i ? '<span class="ex-hole" aria-label="' + CP.attr(T("exm.hole")) + '">' + new Array(Array.from(s.raw).length + 1).join("＿") + "</span>" : esc(s.raw); }).join("");
  }
  function sentHTML(toks, i, it) { return '<div class="ex-sent" lang="zh-CN">' + holed(toks, i) + "</div>" + (it ? '<div class="cd-note" lang="it">' + esc(it) + "</div>" : ""); }
  function pick(list, r, ok) { var c = list.filter(ok || function () { return true; }); return c.length ? c[Math.floor(r() * Math.min(c.length, 4))] : null; }
  CP.exSent = { forWord: forWord, index: index, holed: holed };

  /* ---- frase a buco: la parola che manca ---- */
  ENG.register({ id: "buco", famiglia: 1, corso: "zh", q: "exm.q.hole",
    richiede: function (w) { return forWord(w).some(function (s) { return s.it; }); },
    crea: function (w, ctx, r) {
      var s = pick(forWord(w), r, function (x) { return !!x.it; }); if (!s) return null;
      var i = s.toks.findIndex(function (t) { return t.w && t.w.key === w.key; }), x = D.word(w, ctx.pool(), ctx, r); if (i < 0 || !x) return null;
      var o = D.options('<span class="ex-han">' + esc(w.hz) + "</span>", x.map(function (y) { return '<span class="ex-han">' + esc(y.hz) + "</span>"; }), r);
      return { kind: "mc", opts: o.opts, right: o.right, lang: "zh-CN", prompt: sentHTML(s.toks, i, s.it), say: s.zh, sentence: s };
    } });

  /* ---- buco grammaticale: un elemento dell'insieme al posto di un altro ---- */
  function sets() {
    var out = (typeof INSIEMI !== "undefined" && INSIEMI.zh ? INSIEMI.zh : []).map(function (s) { return { id: s.id, membri: s.membri, nota: s.nota_it || "" }; });
    var N = CP.lab && CP.lab.NCLF; if (N) { var m = {}; Object.keys(N).forEach(function (k) { m[N[k]] = 1; }); out.push({ id: "zh-clf", membri: Object.keys(m), nota: T("exm.clfNote"), clf: N }); }
    return out;
  }
  function gramSpot(w) {
    var S = sets(), res = [];
    forWord(w).forEach(function (s) {
      if (!s.it) return;
      s.toks.forEach(function (t, i) {
        if (!t.w || t.w.key === w.key) return;
        S.forEach(function (set) {
          if (set.membri.indexOf(t.w.hz) < 0) return;
          /* classificatori: solo se il nome che segue vuole proprio quello */
          if (set.clf) { var nx = s.toks[i + 1]; if (!nx || !nx.w || set.clf[nx.w.hz] !== t.w.hz) return; }
          res.push({ s: s, i: i, set: set });
        });
      });
    });
    return res;
  }
  ENG.register({ id: "buco-gram", famiglia: 2, corso: "zh", q: "exm.q.gram",
    richiede: function (w) { return gramSpot(w).length > 0; },
    crea: function (w, ctx, r) {
      var c = gramSpot(w); if (!c.length) return null;
      var g = c[Math.floor(r() * c.length)], right = g.s.toks[g.i].w.hz, wrong = D.shuffle(g.set.membri.filter(function (m) { return m !== right; }), r).slice(0, 3);
      if (wrong.length < 1) return null;
      var o = D.options('<span class="ex-han">' + esc(right) + "</span>", wrong.map(function (m) { return '<span class="ex-han">' + esc(m) + "</span>"; }), r);
      return { kind: "mc", opts: o.opts, right: o.right, lang: "zh-CN", prompt: sentHTML(g.s.toks, g.i, g.s.it), say: g.s.zh, note: g.set.nota };
    },
    risposta: function (it) { if (it.note) { var fb = document.querySelector(".ex-fb"); if (fb) fb.insertAdjacentHTML("afterbegin", '<p class="ex-note small" lang="it">💡 ' + esc(it.note) + "</p>"); } } });

  /* ---- rimetti in ordine: le tessere della frase (3-8 parole) ---- */
  ENG.register({ id: "ordina", famiglia: 1, corso: "zh", q: "exm.q.order",
    richiede: function (w) { return forWord(w).some(function (s) { var n = s.toks.filter(function (t) { return t.w; }).length; return s.it && n >= 3 && n <= 8; }); },
    crea: function (w, ctx, r) {
      var s = pick(forWord(w), r, function (x) { var n = x.toks.filter(function (t) { return t.w; }).length; return x.it && n >= 3 && n <= 8; }); if (!s) return null;
      var tiles = s.toks.filter(function (t) { return t.w; }).map(function (t, i) { return { id: i, w: t.w }; }), sh = tiles;
      for (var n = 0; n < 8; n++) { sh = D.shuffle(tiles, r); if (sh.map(function (x) { return x.id; }).join() !== tiles.map(function (x) { return x.id; }).join()) break; }
      return { kind: "order", tiles: tiles, bank: sh, pick: [], it: s.it, say: s.zh, prompt: '<div class="cd-note ex-order-it" lang="it">«' + esc(s.it) + "»</div>" };
    } });
  /* le tessere italiane (corso di italiano) portano il testo in t.txt */
  function tile(t, attr, used) { if (t.txt != null) return '<button type="button" class="tile it-tile' + (used ? " used" : "") + '" ' + attr + (used ? " disabled" : "") + ' lang="it"><span class="th">' + esc(t.txt) + "</span></button>";
    return '<button type="button" class="tile' + (used ? " used" : "") + '" ' + attr + (used ? " disabled" : "") + '><span class="tp">' + CP.pinyinHTML(t.w.py) + '</span><span class="th" lang="zh-CN">' + CP.hanziHTML(t.w.hz, t.w.py) + "</span></button>"; }
  ENG.renderers.order = {
    html: function (it) {
      var by = {}; it.bank.forEach(function (t) { by[t.id] = t; });
      return '<div class="slot ex-slot" aria-live="polite" data-empty="' + CP.attr(T("exm.slot")) + '">' + it.pick.map(function (id) { return tile(by[id], 'data-exo-un="' + id + '"'); }).join("") + "</div>" +
        '<div class="bank ex-bank">' + it.bank.map(function (t) { return tile(t, 'data-exo="' + t.id + '"', it.pick.indexOf(t.id) >= 0); }).join("") + "</div>";
    },
    bind: function (it, root) { ENG.bar('<button type="button" class="btn-main" data-exo-check disabled>' + esc(T("exm.check")) + '</button><p class="kbd-hint">' + esc(T("exm.kbdOrder")) + "</p>"); },
    redraw: function (it, root) {
      var card = root.querySelector(".ex-card"), old = card && card.querySelector(".ex-slot"), bank = card && card.querySelector(".ex-bank"); if (!old || !bank) return;
      var tmp = document.createElement("div"); tmp.innerHTML = this.html(it);
      old.replaceWith(tmp.firstChild); bank.replaceWith(tmp.lastChild);
      var c = root.querySelector("[data-exo-check]"); if (c) c.disabled = it.pick.length !== it.bank.length;
    }
  };
  document.addEventListener("click", function (ev) {
    var cur = ENG.current(); if (!cur || cur.done || cur.item.kind !== "order") return;
    var b = ev.target.closest ? ev.target.closest("[data-exo], [data-exo-un], [data-exo-check]") : null; if (!b || !cur.kit.root.contains(b)) return;
    var it = cur.item;
    if (b.hasAttribute("data-exo")) { var id = +b.getAttribute("data-exo"); if (it.pick.indexOf(id) < 0) it.pick.push(id); CP.sfx("tap"); ENG.renderers.order.redraw(it, cur.kit.root); }
    else if (b.hasAttribute("data-exo-un")) { var u = +b.getAttribute("data-exo-un"); it.pick = it.pick.filter(function (x) { return x !== u; }); ENG.renderers.order.redraw(it, cur.kit.root); }
    else {
      /* si confronta il testo: due tessere uguali («la … la») si possono scambiare */
      var by = {}, txt = function (t) { return t.txt != null ? t.txt.toLowerCase() : t.id; }; it.tiles.forEach(function (t) { by[t.id] = t; });
      var ok = it.pick.map(function (id) { return txt(by[id]); }).join("|") === it.tiles.map(txt).join("|");
      Array.prototype.forEach.call(cur.kit.root.querySelectorAll(".ex-slot .tile, .ex-bank .tile"), function (x) { x.disabled = true; });
      var slot = cur.kit.root.querySelector(".ex-slot"); if (slot) slot.classList.add(ok ? "ok" : "ko");
      ENG.after({ ok: ok, g: ENG.voto({ kind: "mc", ok: ok }), msg: ok ? T("exm.right") : T("exm.orderWas", { s: it.say }) });
    }
  });
})();
