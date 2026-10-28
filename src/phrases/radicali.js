/* ===== màndarínō · Laboratorio dei radicali (Frasi → Impara → Radicali), solo nel corso di cinese.
   Un banco da laboratorio: si mettono due componenti dei caratteri (come elementi chimici) e si vede se «reagiscono».
   Se la coppia forma un carattere dell'app: il carattere compare, i suoi tratti si disegnano (colorati per componente),
   pinyin e significato, e una «lettura simpatica» (data/lab-readings.js, scritta a mano per le combinazioni più famose; mai
   un'etimologia, e lo dice sempre). Altrimenti una battuta gentile, senza penalità. Niente serie, niente punti: solo una
   collezione («elementi scoperti», cp-labrad-v1) e, per ogni scoperta, una carta da condividere (ui/share-card.js, «zh-rad»).
   Dati: le ricette si ricavano da data/anatomy.js con tools/radicali.mjs (data/lab-recipes.js); i nomi dei componenti
   vengono da data/radicals.js e dal vocabolario. Si caricano al primo uso (tools/build.mjs, GROUPS «LABRAD»).
   Trascinamento a mano con Pointer Events, nessuna libreria: con il dito serve una pressione breve (così lo scorrimento della
   pagina resta libero); il tocco semplice mette l'elemento nel primo posto libero, ed è il modo che funziona sempre
   (tastiera e lettori di schermo compresi). Movimento ridotto: nessuna animazione, il disegno dei tratti compare già fatto.
   Suoni solo dopo un tocco. Nessuna rete. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, K = "cp-labrad-v1";
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduce() { return !!(mq && mq.matches); }
  function zh() { return typeof LANG !== "undefined" && LANG === "zh"; }
  var COLORS = ["var(--accent)", "var(--stamp-red, #C8312B)"];
  var STEP = 18;                              /* quanti elementi mostra la mensola, e quanti se ne aggiungono con «Altri elementi» */

  /* ---- i dati: ricette e elementi ---- */
  var BASE = null, RES = {}, PAIR = {}, USE = {}, COUNT = 0, ORDERED = [];
  var STARTER = "女子人木日月口心手目宀火水土田力大言";   /* la mensola comincia dai pezzi dei caratteri più famosi */
  function norm(c) { return BASE[c] || c; }
  function isElement(c) { return !RES[c] || !!BASE[c]; }
  function key(a, b) { return [norm(a), norm(b)].sort().join("+"); }
  function init() {
    if (BASE) return;
    BASE = {};
    (window.RADICALS || []).forEach(function (r) { BASE[r[1]] = r[1]; Array.from(r[2] || "").forEach(function (v) { BASE[v] = r[1]; }); });
    var cur = typeof LAB_READ !== "undefined" ? LAB_READ : {}, score = {};
    LAB_RECIPES.forEach(function (r) {
      RES[r[0]] = r; COUNT++;
      (PAIR[key(r[1], r[2])] = PAIR[key(r[1], r[2])] || []).push(r);
      [r[1], r[2]].forEach(function (p) { var n = norm(p); USE[n] = (USE[n] || 0) + 1; score[n] = (score[n] || 0) + (cur[r[0]] ? 4 : 0) + 1; });
    });
    /* gli elementi sono i componenti che non si scompongono in un'altra ricetta, più i radicali Kangxi (口, 土… anche se hanno una ricetta);
       gli altri (林, 你, 买…) sono «composti»: compaiono sulla mensola quando li scopri. Ordine: prima i più comuni, poi i più utili */
    ORDERED = Object.keys(USE).filter(isElement).sort(function (a, b) { return score[b] - score[a] || USE[b] - USE[a] || (a < b ? -1 : 1); });
    var first = Array.from(STARTER).filter(function (c) { return ORDERED.indexOf(c) >= 0; });
    ORDERED = first.concat(ORDERED.filter(function (c) { return first.indexOf(c) < 0; }));
  }

  /* ---- la collezione (cp-labrad-v1: { f: { carattere: quando } }; nell'unione la data più vecchia) ---- */
  function load() { try { var o = JSON.parse(localStorage.getItem(K) || "null"); return o && o.f && typeof o.f === "object" ? o : { f: {} }; } catch (e) { return { f: {} }; } }
  function save(o) { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} }
  function found() { return load().f; }
  function foundCount() { var f = found(), n = 0; for (var c in f) if (RES[c]) n++; return n; }

  /* ---- stato del banco (non si salva: ogni volta si riparte da un banco pulito) ---- */
  var bench = [null, null], shown = STEP, last = null, token = 0, hot = {}, hintMsg = "";

  /* ---- significato dei componenti e dei caratteri ---- */
  function radical(c) {
    var n = norm(c), rs = window.RADICALS || [];
    for (var i = 0; i < rs.length; i++) if (rs[i][1] === n) return rs[i];
    return null;
  }
  function elMeaning(c) {
    var r = radical(c); if (r) return { t: zh() ? r[4] : r[3], lang: zh() ? "zh-CN" : "it" };
    var w = CP.WORDS && CP.WORDS[c]; if (w) return { t: CP.gloss(w), lang: "it" };
    return null;
  }
  function wordOf(rec) {
    var k = rec[7] || rec[0], w = CP.WORDS && CP.WORDS[k]; return w ? { k: k, py: String(w.py).replace(/\./g, ""), m: CP.gloss(w), single: !rec[7] } : null;
  }
  function readOf(ch) {
    var x = typeof LAB_READ !== "undefined" ? LAB_READ[ch] : null; return x ? (zh() ? x[2] : x[1]) : "";
  }

  /* ---- i tratti, disegnati uno dopo l'altro e colorati per componente (la stessa via di words/anatomy.js) ---- */
  function strokes(ch, animate) {
    var M = CP.strokeData ? CP.strokeData(ch) : null; if (!M) return "";
    var g = CP.anatomy && CP.anatomy.groups ? CP.anatomy.groups(ch) : "";
    return '<svg class="lr-svg' + (animate ? " go" : "") + '" viewBox="-6 -6 112 112" role="img" aria-label="' + CP.attr(T("lr.svgAria", { c: ch })) + '">' + M.map(function (st, i) {
      var k = g && g[i] && g[i] !== "-" ? +g[i] : -1, col = k >= 0 ? COLORS[k % 2] : "var(--muted)";
      return '<path d="M' + st.map(function (p) { return (p.x * 100).toFixed(1) + "," + (p.y * 100).toFixed(1); }).join(" L") + '" pathLength="1" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"' +
        (animate ? ' style="animation-delay:' + (0.35 + i * 0.28).toFixed(2) + 's"' : "") + "/>";
    }).join("") + "</svg>";
  }

  /* ---- disegno ---- */
  function tile(c) {
    var m = elMeaning(c);
    return '<button type="button" class="lr-el' + (hot[c] ? " hot" : "") + '" data-lr-el="' + CP.attr(c) + '" aria-label="' + CP.attr(T("lr.elAria", { c: c, m: m ? m.t : "" })) + '"><span class="lr-g" lang="zh-CN">' + esc(c) + "</span>" +
      (m ? '<small lang="' + m.lang + '">' + esc(String(m.t).split(/[,;]/)[0]) + "</small>" : "") + (hot[c] ? '<i class="lr-dot" aria-hidden="true">•</i>' : "") + "</button>";
  }
  function slotHTML(i) {
    var c = bench[i], col = COLORS[i];
    return '<button type="button" class="lr-slot' + (c ? " full" : "") + '" data-lr-slot="' + i + '" style="--c:' + col + '" aria-label="' + CP.attr(c ? T("lr.slotAria", { c: c }) : T("lr.slotEmptyAria", { n: i + 1 })) + '">' +
      (c ? '<span class="lr-g" lang="zh-CN">' + esc(c) + "</span>" : '<span class="lr-ph" aria-hidden="true">' + (i + 1) + "</span>") + "</button>";
  }
  function benchHTML() {
    return '<div class="lr-bench" id="lr-bench" role="group" aria-label="' + CP.attr(T("lr.bench")) + '">' + slotHTML(0) + '<span class="lr-op" aria-hidden="true">+</span>' + slotHTML(1) + '<span class="lr-op" aria-hidden="true">=</span><div class="lr-prod" aria-hidden="true"><span>?</span></div></div>';
  }
  function shelfHTML() {
    var f = found(), comp = [], els = ORDERED.slice(0, shown);
    /* i caratteri già scoperti che sono, a loro volta, componenti di altre ricette: «composti», da riusare */
    Object.keys(f).forEach(function (c) { if (RES[c] && USE[c] && !isElement(c)) comp.push(c); });
    var h = '<h4 class="lr-h">' + esc(T("lr.shelf")) + '</h4><div class="lr-shelf" id="lr-shelf">' + els.map(tile).join("") + "</div>";
    if (shown < ORDERED.length) h += '<button type="button" class="btn-s lr-more" data-lr-more>' + esc(T("lr.more")) + " · " + esc(T("lr.moreN", { n: ORDERED.length - shown })) + "</button>";
    if (comp.length) h += '<h4 class="lr-h">' + esc(T("lr.compounds")) + '</h4><div class="lr-shelf" id="lr-comp">' + comp.map(tile).join("") + "</div>";
    return h;
  }
  function foundHTML() {
    var f = found(), list = Object.keys(f).filter(function (c) { return RES[c]; }).sort(function (a, b) { return f[a] - f[b]; });
    var h = '<h4 class="lr-h">' + esc(T("lr.found")) + "</h4>";
    if (!list.length) return h + '<p class="small muted lr-empty">' + esc(T("lr.foundEmpty")) + "</p>";
    return h + '<div class="lr-found">' + list.map(function (c) {
      return '<button type="button" class="lr-fc" data-lr-found="' + CP.attr(c) + '" aria-label="' + CP.attr(T("lr.foundAria", { c: c, p: RES[c][6] })) + '"><span lang="zh-CN">' + esc(c) + "</span><small>" + esc(RES[c][6]) + "</small></button>";
    }).join("") + "</div>";
  }
  function countHTML() {
    return '<p class="lr-count" id="lr-count" aria-live="polite"><span>⚗️ ' + esc(T("lr.count")) + "</span> <b>" + foundCount() + "</b> <small>" + esc(T("lr.of", { t: COUNT })) + "</small></p>";
  }
  function layoutLine(rec) {
    var v = [];
    [rec[1], rec[2]].forEach(function (p) { if (norm(p) !== p) v.push(T("lr.variant", { v: p, b: norm(p) })); });
    return T("lr.layout." + (rec[3] === "⿱" ? "v" : "h")) + (v.length ? " " + v.join(" ") : "");
  }
  function structLine(rec) {
    if (rec[4] === "s" && rec[5] >= 0) {
      var p = rec[1 + rec[5]], s = rec[2 - rec[5]];
      var pw = CP.WORDS && CP.WORDS[p], py = pw ? String(pw.py).replace(/\./g, "") : "";
      return T("anat.ps", { s: s, p: p, py: py ? (zh() ? "（" + py + "）" : " (" + py + ")") : "" });
    }
    return T(rec[4] === "i" ? "anat.ideo" : "anat.parts");
  }
  /* il risultato di una reazione riuscita */
  function outHTML(rec, o) {
    o = o || {};
    var ch = rec[0], w = wordOf(rec), joke = readOf(ch), more = (PAIR[key(rec[1], rec[2])] || []).filter(function (r) { return r[0] !== ch; });
    var meaning = w ? (w.single ? '<span lang="it">' + esc(w.m) + "</span>" : esc(T("lr.inApp", { w: w.k, p: w.py })) + ' <span lang="it">«' + esc(w.m) + "»</span>") : "";
    return '<div class="lr-out ok' + (o.animate ? " fresh" : "") + '" id="lr-out"><p class="lr-badge" role="status">' + esc(T(o.isNew ? "lr.new" : "lr.again")) + "</p>" +
      '<div class="lr-fig">' + strokes(ch, o.animate) + '<div class="lr-info"><div class="lr-big" lang="zh-CN">' + esc(ch) + '</div><div class="lr-py">' + CP.pinyinHTML(rec[6]) + "</div>" + CP.audioBtns(ch, true) + "</div></div>" +
      '<p class="lr-mean">' + meaning + "</p>" +
      '<p class="lr-read"><span class="lr-tag">' + esc(T("lr.readTag")) + '</span> <span lang="' + (zh() ? "zh-CN" : "it") + '">' + (joke ? esc(joke) : "") + (joke ? "" : esc(T("lr.noRead"))) + "</span></p>" +
      '<p class="small muted lr-struct">' + esc(layoutLine(rec)) + " " + esc(structLine(rec)) + "</p>" +
      (more.length ? '<p class="small muted">' + esc(T("lr.alsoMakes", { c: more.map(function (r) { return r[0]; }).join(" ") })) + "</p>" : "") +
      '<button type="button" class="btn-main lr-share" data-lr-share="' + CP.attr(ch) + '">' + esc(T("lr.share")) + "</button></div>";
  }
  function noHTML(a, b) {
    var n = 8, i = (a.codePointAt(0) + b.codePointAt(0) * 7) % n;
    var txt = a === b ? T("lr.same", { a: a }) : T("lr.no" + i, { a: a, b: b });
    return '<div class="lr-out no" id="lr-out"><p class="lr-badge muted" role="status">' + esc(T("lr.noT")) + '</p><p class="lr-nomsg">' + esc(txt) + "</p></div>";
  }
  function emptyOut() {
    return '<div class="lr-out idle" id="lr-out"><p class="small muted">' + esc(hintMsg || T("lr.shelfHint")) + "</p></div>";
  }
  function outNow() {
    if (!last) return emptyOut();
    if (last.rec) return outHTML(last.rec, { isNew: false, animate: false });
    return noHTML(last.a, last.b);
  }
  function render() {
    init();
    return '<div class="lr" id="lr-root"><h3>' + esc(T("lr.title")) + '</h3><p class="small muted lr-lede">' + esc(T("lr.lede")) + "</p>" + countHTML() + benchHTML() +
      '<div class="lr-acts"><button type="button" class="btn-s" data-lr-hint>' + esc(T("lr.hint")) + '</button><button type="button" class="btn-s" data-lr-clear>' + esc(T("lr.clear")) + "</button></div>" +
      '<div id="lr-outwrap" aria-live="polite">' + outNow() + "</div>" + '<div id="lr-shelfwrap">' + shelfHTML() + '</div><div id="lr-foundwrap">' + foundHTML() + "</div>" +
      '<p class="small muted lr-note">' + esc(T("lr.note")) + "</p></div>";
  }
  function paintBench() {
    var b = document.getElementById("lr-bench"); if (!b) return;
    var s = b.querySelectorAll(".lr-slot"); [0, 1].forEach(function (i) { var d = document.createElement("div"); d.innerHTML = slotHTML(i); s[i].replaceWith(d.firstChild); });
    b.classList.remove("merge", "boom");
  }
  function paintShelf() { var w = document.getElementById("lr-shelfwrap"); if (w) w.innerHTML = shelfHTML(); }
  function paintFound() { var w = document.getElementById("lr-foundwrap"); if (w) w.innerHTML = foundHTML(); var c = document.getElementById("lr-count"); if (c) c.outerHTML = countHTML(); }
  function setOut(h) { var w = document.getElementById("lr-outwrap"); if (w) w.innerHTML = h; }
  function clearOut() { last = null; setOut(emptyOut()); }

  /* ---- la reazione ---- */
  function pick(list) {
    var f = found(); for (var i = 0; i < list.length; i++) if (!f[list[i][0]]) return list[i];
    return list[0];
  }
  function react() {
    if (!bench[0] || !bench[1]) return;
    var a = bench[0], b = bench[1], list = PAIR[key(a, b)], t = ++token;
    hot = {}; hintMsg = "";
    if (!list) {
      last = { a: a, b: b }; setOut(noHTML(a, b)); CP.sfx("tap"); paintShelf(); return;
    }
    var rec = pick(list), o = load(), isNew = !o.f[rec[0]];
    if (isNew) { o.f[rec[0]] = Date.now(); save(o); }
    last = { rec: rec, a: a, b: b };
    var bn = document.getElementById("lr-bench"), anim = !reduce();
    if (bn && anim) {
      bn.classList.add("merge");
      setTimeout(function () {
        if (t !== token) return;
        bn.classList.remove("merge"); bn.classList.add("boom");
        setOut(outHTML(rec, { isNew: isNew, animate: true })); CP.sfx("ok"); paintFound(); paintShelf();
      }, 420);
    } else { setOut(outHTML(rec, { isNew: isNew, animate: false })); CP.sfx("ok"); paintFound(); paintShelf(); }
  }

  /* ---- i gesti sul banco ---- */
  function place(c, idx) {
    if (bench[0] && bench[1] && idx == null) { bench = [null, null]; }
    var i = idx != null ? idx : (bench[0] ? 1 : 0);
    bench[i] = c; token++; hot = {}; if (last) clearOut();
    paintBench();
    if (bench[0] && bench[1]) setTimeout(function () { if (bench[0] && bench[1]) react(); }, reduce() ? 0 : 240);
    else paintShelf();
  }
  function clearBench() { bench = [null, null]; token++; hot = {}; hintMsg = ""; clearOut(); paintBench(); paintShelf(); }
  /* gli elementi che reagiscono con c */
  function partners(c) {
    var out = {}, n = norm(c);
    Object.keys(PAIR).forEach(function (k) { var p = k.split("+"); if (p[0] === n) out[p[1]] = 1; else if (p[1] === n) out[p[0]] = 1; });
    return out;
  }
  function visibleEls() { var v = {}; ORDERED.slice(0, shown).forEach(function (c) { v[c] = 1; }); Object.keys(found()).forEach(function (c) { if (RES[c] && USE[c] && !isElement(c)) v[c] = 1; }); return v; }
  function hint() {
    var f = found(), a = bench[0] || bench[1], vis = visibleEls();
    if (!a) {
      /* nessun elemento sul banco: se ne propone uno che ha ancora combinazioni da scoprire tra quelli in mensola */
      var cands = Object.keys(vis).filter(function (c) {
        var p = partners(c); return Object.keys(p).some(function (q) { return vis[q] && (PAIR[key(c, q)] || []).some(function (r) { return !f[r[0]]; }); });
      });
      if (!cands.length) { hintMsg = T("lr.hintMore"); shown += STEP; hot = {}; paintShelf(); setOut(emptyOut()); return; }
      a = cands[Math.floor(Math.random() * cands.length)]; bench = [a, null]; paintBench();
    }
    var p = partners(a), n = 0; hot = {};
    Object.keys(vis).forEach(function (c) { if (p[norm(c)] || p[c]) { hot[c] = 1; n++; } });
    hintMsg = n ? T("lr.hintOne", { a: a, n: n }) : T("lr.hintNone", { a: a });
    if (!n) shown += STEP;
    last = null; paintShelf(); setOut(emptyOut());
  }
  function replay(ch) {
    var rec = RES[ch]; if (!rec) return;
    bench = [rec[1], rec[2]]; token++; hot = {}; last = { rec: rec, a: rec[1], b: rec[2] };
    paintBench(); setOut(outHTML(rec, { isNew: false, animate: !reduce() })); CP.sfx("tap");
    var o = document.getElementById("lr-outwrap"); if (o && o.scrollIntoView) o.scrollIntoView({ block: "nearest", behavior: reduce() ? "auto" : "smooth" });
  }
  function share(ch) {
    var rec = RES[ch], w = rec && wordOf(rec); if (!rec || !CP.shareCard || !CP.shareCard.open) return;
    CP.shareCard.open("zh-rad", { ch: ch, py: rec[6], a: rec[1], b: rec[2], op: rec[3], meaning: w ? (w.single ? w.m : w.k + " · " + w.m) : "", joke: readOf(ch), date: new Date() });
  }

  /* ---- trascinamento con Pointer Events ---- */
  var drag = null, skipClick = 0;
  function cancelDrag() { if (!drag) return; clearTimeout(drag.timer); if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost); document.body.classList.remove("lr-dragging"); var o = document.querySelector(".lr-over"); if (o) o.classList.remove("lr-over"); drag = null; }
  function begin() {
    if (!drag || drag.on) return;
    drag.on = true; document.body.classList.add("lr-dragging");
    var g = document.createElement("div"); g.className = "lr-ghost"; g.setAttribute("aria-hidden", "true"); g.lang = "zh-CN"; g.textContent = drag.c; document.body.appendChild(g); drag.ghost = g;
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
    moveTo(drag.x, drag.y);
  }
  function moveTo(x, y) {
    if (!drag || !drag.ghost) return;
    drag.ghost.style.transform = "translate(" + Math.round(x - 32) + "px," + Math.round(y - 52) + "px)";
    var el = document.elementFromPoint(x, y), tgt = el && el.closest ? el.closest("[data-lr-slot], .lr-bench") : null, old = document.querySelector(".lr-over");
    if (old && old !== tgt) old.classList.remove("lr-over");
    if (tgt) tgt.classList.add("lr-over");
  }
  document.addEventListener("pointerdown", function (e) {
    var t = e.target.closest ? e.target.closest("[data-lr-el]") : null; if (!t || (e.pointerType === "mouse" && e.button !== 0)) return;
    cancelDrag();
    drag = { c: t.getAttribute("data-lr-el"), id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, on: false, touch: e.pointerType === "touch" || e.pointerType === "pen", timer: 0, ghost: null };
    if (drag.touch) drag.timer = setTimeout(function () { begin(); }, 280);
  });
  document.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.x = e.clientX; drag.y = e.clientY;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8) return;
      if (drag.touch) { cancelDrag(); return; }   /* il dito scorre prima della pressione: è lo scorrimento della pagina */
      begin();
    }
    moveTo(e.clientX, e.clientY);
  });
  function endDrag(e, drop) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag, was = d.on; cancelDrag();
    if (!was || !drop) return;
    skipClick = Date.now();
    var el = document.elementFromPoint(e.clientX, e.clientY), s = el && el.closest ? el.closest("[data-lr-slot]") : null;
    if (s) place(d.c, +s.getAttribute("data-lr-slot"));
    else if (el && el.closest && el.closest(".lr-bench")) place(d.c);
  }
  document.addEventListener("pointerup", function (e) { endDrag(e, true); });
  document.addEventListener("pointercancel", function (e) { endDrag(e, false); });
  /* con il dito, dopo la pressione breve, la pagina non deve scorrere sotto il trascinamento */
  document.addEventListener("touchmove", function (e) { if (drag && drag.on && e.cancelable) e.preventDefault(); }, { passive: false });
  document.addEventListener("contextmenu", function (e) { if (e.target.closest && e.target.closest("[data-lr-el]")) e.preventDefault(); });

  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-lr-el], [data-lr-slot], [data-lr-more], [data-lr-hint], [data-lr-clear], [data-lr-found], [data-lr-share]") : null; if (!b || !document.getElementById("lr-root")) return;
    if (b.hasAttribute("data-lr-el")) { if (Date.now() - skipClick < 400) return; CP.sfx("tap"); place(b.getAttribute("data-lr-el")); return; }
    CP.sfx("tap");
    if (b.hasAttribute("data-lr-slot")) { var i = +b.getAttribute("data-lr-slot"); bench[i] = null; token++; hot = {}; hintMsg = ""; clearOut(); paintBench(); paintShelf(); return; }
    if (b.hasAttribute("data-lr-more")) { shown += STEP; paintShelf(); return; }
    if (b.hasAttribute("data-lr-hint")) { hint(); return; }
    if (b.hasAttribute("data-lr-clear")) { clearBench(); return; }
    if (b.hasAttribute("data-lr-found")) { replay(b.getAttribute("data-lr-found")); return; }
    if (b.hasAttribute("data-lr-share")) share(b.getAttribute("data-lr-share"));
  });

  CP.labRad = { render: render, count: function () { init(); return foundCount(); }, total: function () { init(); return COUNT; }, recipes: function () { init(); return { RES: RES, PAIR: PAIR, ORDERED: ORDERED, norm: norm }; } };
})();
