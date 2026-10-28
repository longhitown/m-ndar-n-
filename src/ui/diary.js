/* ===== màndarínō · Taccuino del viaggiatore (corso di cinese; per il corso di italiano il viaggio al contrario, Guilin → Roma, con le lezioni superate).
   Un viaggio immaginario Roma → Guilin: le città (DIARY.stops, data/diary.js) si «sbloccano» con le tappe del Percorso
   finite (CP.pathDoneCount). Gli sbagli non sono penalità: se la persona ha davvero scambiato una coppia di parole simili
   (cp-ex-v1.conf, scritto da CP.exConf in study/memory.js), sulla pagina della città compare l'aneddoto scritto a mano.
   Senza sbagli il taccuino è bello lo stesso: le tappe e le parole raccolte lungo la strada.
   La mappa è un SVG disegnato qui, con un tremolio dell'inchiostro fisso (nessuna libreria, nessuna rete). Ogni pagina si può
   trasformare in un'immagine (CP.shareCard, modello «zh-diary») solo se la persona lo sceglie. Caricato al primo uso (LAZYMOD). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, S = DIARY.stops, N = DIARY.notes, ZH = typeof LANG !== "undefined" && LANG === "zh";
  function lget(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  /* il corso di italiano (per chi parla cinese) fa lo stesso viaggio al contrario: le stesse città, soglie in lezioni superate */
  var ITS = S.slice().reverse().map(function (s, j) { var o = {}; Object.keys(s).forEach(function (k) { o[k] = s[k]; }); o.th = DIARY.itTh[j]; return o; });
  function stopsOf(c) { return c === "it" ? ITS : S; }
  function city(i, st) { st = st || S; return ZH ? st[i].zh : st[i].it; }

  /* ---- dove si è arrivati ---- */
  function stopAt(n, st) { var i = 0; (st || S).forEach(function (s, j) { if (n >= s.th) i = j; }); return i; }
  function itLessons() { return typeof ITLESSONS === "undefined" ? [] : ITLESSONS.slice().sort(function (a, b) { return a.n - b.n; }); }
  function doneCount(c) {
    if (c !== "it") return CP.pathDoneCount ? CP.pathDoneCount() : 0;
    var P = lget("cp-it-lessons-v1") || {};
    return itLessons().filter(function (l) { var p = P[l.id] || {}; return p.done || (p.best || 0) >= 80; }).length;
  }
  /* le frasi della lezione che ha aperto la città (corso di italiano): fino a tre esempi, italiano + cinese */
  function examplesOfStop(i, st) {
    var L = itLessons(), l = i > 0 ? L[Math.min(L.length, st[i].th) - 1] : null;
    return l && l.ex ? l.ex.slice(0, 3).map(function (e) { return { it: e[0], zh: e[1] }; }) : [];
  }

  /* ---- gli aneddoti guadagnati: coppie scambiate nei dati, membri dell'insieme ---- */
  function member(m) { var p = m.split(" "); return { hz: p[0], py: p[1] }; }
  function plain(py) { return String(py).normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function toneOf(py) { var t = String(py).normalize("NFD"); return /̄/.test(t) ? 1 : /́/.test(t) ? 2 : /̌/.test(t) ? 3 : /̀/.test(t) ? 4 : 0; }
  /* la prova che questa persona ha scambiato i membri della nota: { n, ultimo, d } o null */
  function evidence(note, conf) {
    var ms = note.m.map(member), ev = null;
    Object.keys(conf || {}).forEach(function (k) {
      var p = k.split("|"), a = p[0], b = p[1], c = conf[k], hit = false;
      var ia = ms.filter(function (x) { return x.hz === a; })[0];
      if (!ia) return;
      if (b && b.charAt(0) === "~") {
        var tn = +b.slice(1);
        hit = Array.from(ia.hz).length === 1 && ms.some(function (y) { return y !== ia && Array.from(y.hz).length === 1 && plain(y.py) === plain(ia.py) && toneOf(y.py) === tn; });
      } else hit = ms.some(function (y) { return y.hz === b; });
      if (!hit) return;
      if (!ev) ev = { n: 0, ultimo: 0, d: 1e9 };
      ev.n += c.n || 1; ev.ultimo = Math.max(ev.ultimo, c.ultimo || 0); ev.d = Math.min(ev.d, c.d || 0);
    });
    return ev;
  }
  function earned() {
    var o = lget("cp-ex-v1") || {}, cf = o.conf || {}, out = [];
    N.forEach(function (n) { var ev = evidence(n, cf); if (ev) out.push({ note: n, ev: ev }); });
    return out;
  }

  /* ---- parole raccolte: le prime parole iniziate della tappa che ha aperto la città ---- */
  var SECK = null;
  function wordsOfSection(sec) {
    if (!SECK) { SECK = {}; CP.ORDER.forEach(function (k) { var w = CP.WORDS[k]; if (w) (SECK[w.sec] = SECK[w.sec] || []).push(k); }); }
    var ks = SECK[sec] || [], got = ks.filter(function (k) { return CP.state(k) >= 1; });
    return (got.length ? got : ks).slice(0, 5).map(function (k) { return CP.WORDS[k]; });
  }
  function wordsOfStop(i) {
    if (i < 1 || typeof SECTIONS === "undefined") return [];
    var sec = SECTIONS[Math.min(SECTIONS.length - 1, S[i].th - 1)];
    return sec ? wordsOfSection(sec.id) : [];
  }

  /* ---- le pagine: dalla più recente ---- */
  function build(c) {
    var st = stopsOf(c), n = doneCount(c), cur = stopAt(n, st), pages = [], i;
    if (c === "it") {
      for (i = 0; i <= cur; i++) pages.push({ i: i, st: st, course: "it", notes: [], words: [], ex: examplesOfStop(i, st) });
      return { n: n, cur: cur, st: st, course: "it", pages: pages.reverse() };
    }
    for (i = 0; i <= cur; i++) pages.push({ i: i, st: st, notes: [], words: wordsOfStop(i) });
    earned().forEach(function (e) { var p = pages[Math.min(cur, stopAt(e.ev.d === 1e9 ? n : e.ev.d))]; p.notes.push(e); });
    pages.forEach(function (p) { p.notes.sort(function (a, b) { return b.ev.ultimo - a.ev.ultimo; }); });
    return { n: n, cur: cur, st: st, pages: pages.reverse() };
  }
  function noteText(note, i) { return String(ZH ? note.zh : note.it).replace(/\{c\}/g, city(i)); }

  /* ---- l'inchiostro: tremolio fisso, sempre uguale ---- */
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function f1(p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }
  function smooth(pts, closed) {
    var d = "M" + f1(pts[0]), i;
    for (i = 1; i < pts.length - 1; i++) d += " Q" + f1(pts[i]) + " " + f1([(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]);
    return d + " L" + f1(pts[pts.length - 1]) + (closed ? "Z" : "");
  }
  function jit(pts, r, j) { return pts.map(function (p, k) { return k && k < pts.length - 1 ? [p[0] + (r() - 0.5) * 2 * j, p[1] + (r() - 0.5) * 2 * j] : p; }); }
  function poly(pts, r, j) { return smooth(jit(pts, r, j)); }
  function leg(a, b, i, r) {
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1, bow = (i % 2 ? 1 : -1) * len * 0.16, cx = (a.x + b.x) / 2 - dy / len * bow, cy = (a.y + b.y) / 2 + dx / len * bow, n = Math.max(4, Math.round(len / 12)), pts = [], k, t, u;
    for (k = 0; k <= n; k++) { t = k / n; u = 1 - t; pts.push([u * u * a.x + 2 * u * t * cx + t * t * b.x, u * u * a.y + 2 * u * t * cy + t * t * b.y]); }
    return smooth(jit(pts, r, 1.6));
  }
  function ring(cx, cy, rad, r) {
    var pts = [], k, a, q = 12; for (k = 0; k <= q; k++) { a = k / q * Math.PI * 2 + 0.3; pts.push([cx + Math.cos(a) * rad * (1 + (r() - 0.5) * 0.14), cy + Math.sin(a) * rad * (1 + (r() - 0.5) * 0.14)]); }
    return smooth(pts);
  }
  function mapSVG(cur, S) {
    S = S || stopsOf();
    var r = rng(20260), h = "", i, s, a, b;
    var ink = function (d, w, extra) { return '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (extra || "") + "/>"; };
    /* il foglio e il suo bordo: i quattro lati, a tratti, con l'inchiostro che trema un poco */
    var edge = [], q;
    for (q = 0; q <= 18; q++) edge.push([12 + 336 * q / 18, 10]);
    for (q = 1; q <= 30; q++) edge.push([348, 10 + 600 * q / 30]);
    for (q = 1; q <= 18; q++) edge.push([348 - 336 * q / 18, 610]);
    for (q = 1; q <= 29; q++) edge.push([12, 610 - 600 * q / 30]);
    edge.push(edge[0]);
    h += '<rect x="3" y="3" width="354" height="614" rx="10" class="dy-sheet"/><path d="' + smooth(jit(edge, r, 1.3)) + '" fill="none" class="dy-edge" stroke-width="2" stroke-linejoin="round"/>';
    h += '<g class="dy-deco">';
    /* bussola */
    h += ink(ring(42, 54, 20, r), 1.6) + ink(poly([[42, 28], [42, 80]], r, 0.8), 1.4) + ink(poly([[16, 54], [68, 54]], r, 0.8), 1.4) + ink(poly([[42, 30], [47, 54], [42, 78], [37, 54], [42, 30]], r, 0.6), 1.2) + '<text x="42" y="22" text-anchor="middle" class="dy-n">N</text>';
    /* onde tra Roma e Istanbul */
    for (i = 0; i < 4; i++) h += ink(poly([[140 + i * 6, 548 + i * 9], [150 + i * 6, 543 + i * 9], [160 + i * 6, 549 + i * 9], [170 + i * 6, 543 + i * 9], [180 + i * 6, 549 + i * 9]], r, 0.9), 1.5);
    /* monti dell'Asia centrale */
    [[304, 384], [324, 350], [334, 392]].forEach(function (m) { h += ink(poly([[m[0] - 20, m[1]], [m[0] - 6, m[1] - 24], [m[0], m[1] - 14], [m[0] + 8, m[1] - 30], [m[0] + 24, m[1]]], r, 1), 1.6); });
    /* dune di Dunhuang */
    for (i = 0; i < 3; i++) h += ink(poly([[20, 338 + i * 11], [36, 330 + i * 11], [54, 336 + i * 11], [70, 329 + i * 11]], r, 0.9), 1.4);
    /* la Muraglia */
    h += ink(poly([[296, 214], [304, 204], [312, 214], [320, 204], [328, 214], [336, 204], [344, 212]], r, 0.7), 1.8);
    /* colline di Guilin */
    [[262, 76], [290, 70], [318, 78]].forEach(function (m) { h += ink(poly([[m[0] - 12, m[1]], [m[0] - 8, m[1] - 18], [m[0], m[1] - 24], [m[0] + 8, m[1] - 16], [m[0] + 12, m[1]]], r, 0.8), 1.5); });
    h += "</g>";
    /* la strada */
    for (i = 0; i < S.length - 1; i++) {
      a = S[i]; b = S[i + 1];
      h += i < cur ? ink(leg(a, b, i, r), 2.6, ' class="dy-road"') : ink(leg(a, b, i, r), 2, ' class="dy-road-off" stroke-dasharray="2 8"');
    }
    /* le città */
    S.forEach(function (st, j) {
      var side = st.side === "r" ? 1 : -1, tx = st.x + side * (j === cur ? 20 : 15), ty = st.y + 5 + (st.dy || 0), lbl = ZH ? st.zh : st.it;
      if (j < cur) h += '<circle cx="' + st.x + '" cy="' + st.y + '" r="8" class="dy-seal"/><path d="M' + (st.x - 3.6) + " " + (st.y + 0.2) + " l2.6 2.8 l5 -6" + '" class="dy-tick" fill="none"/>';
      else if (j === cur) h += '<circle cx="' + st.x + '" cy="' + st.y + '" r="9.5" class="dy-seal"/>' + ink(ring(st.x, st.y, 15, r), 2, ' class="dy-here"') + '<path d="M' + (st.x - 3.6) + " " + (st.y + 0.2) + " l2.6 2.8 l5 -6" + '" class="dy-tick" fill="none"/>';
      else h += ink(ring(st.x, st.y, 7.5, r), 1.8, ' class="dy-off" stroke-dasharray="2 3"');
      h += '<text x="' + tx + '" y="' + ty + '" text-anchor="' + (side > 0 ? "start" : "end") + '" class="dy-city' + (j > cur ? " off" : "") + (j === cur ? " cur" : "") + '"' + (ZH ? ' lang="zh-CN"' : "") + ">" + esc(lbl) + "</text>";
    });
    return '<svg class="dy-map" viewBox="0 0 360 620" role="img" aria-label="' + CP.attr(T("dy.mapAria", { n: cur + 1, m: S.length })) + '" focusable="false">' + h + "</svg>";
  }
  /* la strisciolina della carta in Studia */
  function strip(cur, S) {
    S = S || stopsOf();
    var r = rng(77), w = 300, pts = S.map(function (s, i) { return [10 + i * (w - 20) / (S.length - 1), 14 + (i % 2 ? 3 : -3)]; }), h = "";
    h += '<path d="' + smooth(jit(pts, r, 0.8)) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="dy-road-off" stroke-dasharray="2 5"/>';
    if (cur > 0) h += '<path d="' + smooth(jit(pts.slice(0, cur + 1), r, 0.8)) + '" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" class="dy-road"/>';
    pts.forEach(function (p, i) { h += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1] + '" r="' + (i === cur ? 6.5 : 4.5) + '" class="' + (i <= cur ? "dy-seal" : "dy-off-dot") + '"/>'; });
    return '<svg class="dy-strip" viewBox="0 0 ' + w + ' 28" aria-hidden="true" focusable="false">' + h + "</svg>";
  }

  /* ---- la carta in Studia ---- */
  function card(c) {
    var d = build(c), it = c === "it";
    return '<div class="dy-card">' + strip(d.cur, d.st) + '<div class="dy-card-t"><b>' + esc(T("dy.title")) + '</b><span class="small muted">' + esc(T("dy.at", { c: city(d.cur, d.st), n: d.cur + 1, m: d.st.length })) + "</span></div>" +
      '<p class="small muted" style="margin:0">' + esc(T(it ? "dyi.cardSub" : "dy.cardSub")) + '</p><button type="button" class="btn-s" data-diary-open="' + (it ? "it" : "zh") + '">' + esc(T("dy.open")) + "</button></div>";
  }

  /* ---- il foglio ---- */
  function wordChips(ws) {
    if (!ws.length) return "";
    return '<div class="dy-words"><p class="small muted">' + esc(T("dy.words")) + '</p><ul>' + ws.map(function (w) {
      return '<li><span class="dy-hz" lang="zh-CN">' + esc(w.hz) + '</span><span class="dy-py">' + CP.pinyinHTML(w.py) + '</span><span class="dy-gl" lang="it">' + esc(CP.gloss(w)) + "</span></li>";
    }).join("") + "</ul></div>";
  }
  function pairChips(note) {
    return '<ul class="dy-pair">' + note.m.map(function (m) {
      var x = member(m), w = CP.WORDS[x.hz];
      return '<li><span class="dy-hz" lang="zh-CN">' + esc(x.hz) + '</span><span class="dy-py">' + CP.pinyinHTML(x.py) + "</span>" + (w ? '<span class="dy-gl" lang="it">' + esc(CP.gloss(w)) + "</span>" : "") + "</li>";
    }).join("") + "</ul>";
  }
  function exChips(ex) {
    if (!ex.length) return "";
    return '<div class="dy-words"><p class="small muted">' + esc(T("dyi.words")) + '</p><ul>' + ex.map(function (e) {
      return '<li><span class="dy-gl" lang="it">' + esc(e.it) + '</span><span class="dy-gl"' + (ZH ? ' lang="zh-CN"' : "") + ">" + esc(ZH ? e.zh : "") + "</span></li>";
    }).join("") + "</ul></div>";
  }
  function page(p, open) {
    var st = p.st, h = '<article class="dy-page" aria-label="' + CP.attr(T("dy.page", { n: p.i + 1 }) + " · " + city(p.i, st)) + '">' +
      '<h4><small>' + esc(T("dy.page", { n: p.i + 1 })) + "</small> <span" + (ZH ? ' lang="zh-CN"' : "") + ">" + esc(city(p.i, st)) + "</span></h4>";
    if (p.course === "it") {
      var ln = DIARY.itLines[st[p.i].id], tx = ln ? String(ZH ? ln.zh : ln.it).replace(/\{c\}/g, city(p.i, st)) : "";
      return h + '<p class="dy-hand"' + (ZH ? ' lang="zh-CN"' : ' lang="it"') + ">" + esc(tx) + "</p>" + exChips(p.ex) + "</article>";
    }
    if (p.i === 0) h += '<p class="dy-hand"' + (ZH ? ' lang="zh-CN"' : ' lang="it"') + ">" + esc(T("dy.start")) + "</p>";
    h += wordChips(p.words);
    p.notes.forEach(function (e) {
      h += '<div class="dy-note"><p class="dy-hand"' + (ZH ? ' lang="zh-CN"' : ' lang="it"') + ">" + esc(noteText(e.note, p.i)) + "</p>" + pairChips(e.note) +
        '<button type="button" class="btn-s" data-diary-share="' + CP.attr(e.note.id + "|" + p.i) + '">' + esc(T("dy.share")) + "</button></div>";
    });
    if (!p.notes.length) h += '<div class="dy-note"><button type="button" class="btn-s" data-diary-share="' + CP.attr("|" + p.i) + '">' + esc(T("dy.share")) + "</button></div>";
    return h + "</article>";
  }
  function open(c) {
    var d = build(c), it = c === "it", St = d.st, total = d.pages.reduce(function (n, p) { return n + p.notes.length; }, 0), next = St[d.cur + 1];
    var h = '<div class="fam-head"><div class="meta"><b>' + esc(T("dy.title")) + '</b><div class="small muted">' + esc(T("dy.at", { c: city(d.cur, St), n: d.cur + 1, m: St.length })) + '</div></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" +
      '<div class="dy-wrap">' + mapSVG(d.cur, St) + "</div>" +
      '<p class="small muted dy-next">' + esc(next ? T(it ? "dyi.next" : "dy.next", { c: city(d.cur + 1, St), n: d.n, k: next.th }) : T(it ? "dyi.end" : "dy.end")) + "</p>";
    h += page(d.pages[0]);
    if (!total && !it) h += '<p class="dy-empty small muted">' + esc(T("dy.none")) + "</p>";
    if (d.pages.length > 1) h += '<details class="dy-older"><summary>' + esc(T("dy.older", { n: d.pages.length - 1 })) + "</summary>" + d.pages.slice(1).map(function (p) { return page(p); }).join("") + "</details>";
    h += '<p class="small muted dy-priv">' + esc(T("dy.privacy")) + "</p>";
    CP.openSheet(h);
  }

  /* ---- una pagina da condividere ---- */
  function shareData(noteId, stopIdx) {
    var d = build(), p = d.pages.filter(function (x) { return x.i === stopIdx; })[0] || d.pages[0], e = noteId ? p.notes.filter(function (x) { return x.note.id === noteId; })[0] : null;
    return { stop: { n: p.i + 1, m: S.length, city: city(p.i) }, route: S.map(function (s, i) { return i <= d.cur; }),
      text: e ? noteText(e.note, p.i) : T("dy.cardEmpty", { c: city(p.i) }), pair: e ? e.note.m.map(member) : [], words: p.words.slice(0, 4).map(function (w) { return { hz: w.hz, py: String(w.py).replace(/\./g, ""), it: CP.gloss(w) }; }),
      date: new Date(e ? e.ev.ultimo || Date.now() : Date.now()), name: "" };
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("[data-diary-open], [data-diary-share]") : null; if (!b) return;
    if (b.hasAttribute("data-diary-open")) { open(b.getAttribute("data-diary-open") === "it" ? "it" : "zh"); return; }
    var v = b.getAttribute("data-diary-share").split("|");
    CP.shareCard.open("zh-diary", shareData(v[0], +v[1]));
  });

  CP.diary = { card: card, open: open, build: build, earned: earned, evidence: evidence, stopAt: stopAt, shareData: shareData, stops: S, notes: N, mapSVG: mapSVG };
})();
