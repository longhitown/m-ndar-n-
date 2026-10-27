/* ===== màndarínō · «Foglio di lavoro»: un PDF A4 personale, da stampare o portare su un tablet, per scrivere a mano.
   Dentro ci sono i caratteri (o le parole italiane) che per chi studia risultano più difficili, più quelli delle ultime
   lezioni. Difficili = schede con più lapsus in cp-srs-v1, errori ricorrenti negli esercizi (cp-ex-v1) e, per il cinese, i toni
   più sbagliati secondo il Dottore dei Toni (CP.confusion). Chi comincia ora riceve un foglio di benvenuto con i primi caratteri.
   - Cinese: righe di quadrati con griglia (tianzige 田字格) vuoti; il primo ha il carattere in tenue e l'ordine dei tratti in
     tratteggio (le linee centrali di data/strokes.js), il secondo una traccia più chiara; pinyin con toni, significato, una frase.
   - Italiano per chi parla cinese: parole italiane con genere, plurale e coniugazioni in quadretti da riempire, testi in cinese.
   - In un angolo c'è un QR con il collegamento profondo …/app/#dettato=MDD1-<codice> (le parole del foglio): inquadrato, l'app
     si apre sul dettato audio di quelle parole. Il frammento non arriva a nessun server e contiene solo le parole.
   - Tutto in locale: la pagina si disegna come elenco di segni (linee, quadrati, immagini di testo, QR dal modulo pwa/qr.js)
     che serve all'anteprima (canvas) e al PDF (jsPDF, vendor/jspdf.umd.min.js). I testi non sono font incorporati: sono
     immagini JPEG ad alta risoluzione dal font di sistema, così il PDF resta sotto 1 MB e i caratteri cinesi non pesano.
   - Salvataggio: sul web un download; su Android dal ponte nativo (saveFile, cartella Download) e poi «Condividi».
   Gruppo FOGLIO (al primo uso): libreria, testi e questo file. Interfaccia: ui/worksheet-stub.js. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  var PW = 210, PH = 297, M = 12, CW = PW - 2 * M, COLS = 12, CELL = CW / COLS, K = 10, PT = 0.3528, MAXPAGES = 2;
  var INK = "#1f1f1f", SOFT = "#767676", GRID = "#8c8c8c", GRIDL = "#bdbdbd", TRACE = "#c4c4c4", TRACE2 = "#e2e2e2", DASH = "#5b5b5b";
  var HAN = '"Noto Sans SC","PingFang SC","Microsoft YaHei","Hiragino Sans GB","Noto Sans CJK SC","Source Han Sans SC",sans-serif';
  var LAT = '"Segoe UI","Helvetica Neue","Noto Sans",Arial,sans-serif';
  var PREFIX = "MDD1-", HASH = "#dettato=";

  function lsJSON(k) { try { var o = JSON.parse(localStorage.getItem(k) || "null"); return o && typeof o === "object" ? o : null; } catch (e) { return null; } }
  function course() { return CP.course && CP.course() === "it" ? "it" : "zh"; }
  function isHan(c) { return /[㐀-鿿豈-﫿]/.test(c); }
  function hasHan(s) { return /[㐀-鿿]/.test(s); }
  function toneList(py) {
    var out = []; String(py).normalize("NFD").split(/[\s.·]+/).forEach(function (syl) { var t = /̄/.test(syl) ? 1 : /́/.test(syl) ? 2 : /̌/.test(syl) ? 3 : /̀/.test(syl) ? 4 : 0; if (t) out.push(t); });
    return out;
  }
  function parseDay(k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).getTime(); }

  /* ================= che cosa metterci ================= */
  function errorsOf(o) { var n = 0; if (o) Object.keys(o).forEach(function (t) { var s = o[t]; if (s && typeof s === "object") n += Math.max(0, (s.n || 0) - (s.ok || 0)); }); return n; }
  /* il tono con più errori nel Dottore dei Toni (matrice di confusione dell'«Orecchio ai toni»), o 0 */
  function weakTone() {
    var c = CP.confusion ? CP.confusion() : null; if (!c || !c.m || c.n < 10) return 0;
    var best = 0, rate = 0;
    for (var t = 1; t <= 4; t++) { var row = c.m[t - 1], tot = row.reduce(function (a, b) { return a + b; }, 0); if (tot < 4) continue; var r = (tot - row[t - 1]) / tot; if (r >= 0.25 && r > rate) { rate = r; best = t; } }
    return best;
  }
  /* le parole degli ultimi giorni di studio, dalla più recente (CP.game.days) */
  function recentKeys() {
    var D = CP.game && CP.game.days ? CP.game.days() : {}, seen = {}, out = [];
    Object.keys(D).sort(function (a, b) { return parseDay(b) - parseDay(a); }).forEach(function (d) { ((D[d] && D[d].w) || []).slice().reverse().forEach(function (k) { if (!seen[k]) { seen[k] = 1; out.push(k); } }); });
    return out;
  }
  /* alterna: due difficili, una delle ultime lezioni; poi il resto */
  function interleave(hard, recent) {
    var out = [], seen = {}, h = 0, r = 0;
    function add(x) { if (x && !seen[x.id]) { seen[x.id] = 1; out.push(x); } }
    while (h < hard.length || r < recent.length) { add(hard[h++]); add(hard[h++]); add(recent[r++]); }
    return out;
  }

  function zhItem(k, why, tone) {
    var w = CP.WORDS[k]; if (!w) return null;
    var chars = Array.from(w.hz); if (chars.length < 1 || chars.length > 3 || !chars.every(isHan)) return null;
    var ex = CP.exampleFor ? CP.exampleFor(k) : null;
    return { id: k, c: "zh", hz: w.hz, chars: chars, py: w.py, gloss: CP.gloss(w), ex: ex ? { zh: ex[1], it: ex[2] } : null, why: why, tone: tone || 0 };
  }
  function collectZh() {
    var S = CP.S(), exs = (lsJSON("cp-ex-v1") || {}).ex || {}, wt = weakTone(), pool = {}, scored = [], order = {};
    CP.ORDER.forEach(function (k, i) { order[k] = i; });
    Object.keys(S).forEach(function (k) { if (CP.WORDS[k] && S[k] && S[k].n) pool[k] = 1; });
    Object.keys(exs).forEach(function (k) { if (CP.WORDS[k]) pool[k] = 1; });
    Object.keys(pool).forEach(function (k) {
      var w = CP.WORDS[k], s = S[k] || {}, sc = (s.lp || 0) * 3 + errorsOf(exs[k]) * 2, why = sc > 0 ? "err" : "", tn = 0;
      if (wt && CP.state(k) >= 1 && toneList(w.py).indexOf(wt) >= 0) { sc += 2; tn = wt; if (!why) why = "tone"; }
      if (sc > 0) scored.push({ k: k, sc: sc, why: why, tn: tn });
    });
    scored.sort(function (a, b) { return b.sc - a.sc || order[a.k] - order[b.k]; });
    var hard = scored.map(function (x) { return zhItem(x.k, x.why, x.tn); }).filter(Boolean);
    var recent = recentKeys().map(function (k) { return zhItem(k, "recent"); }).filter(Boolean);
    var list = interleave(hard.slice(0, 40), recent.slice(0, 20));
    if (list.length < 8) CP.ORDER.slice(0, 80).forEach(function (k) { var x = zhItem(k, "start"); if (x && x.chars.length <= 2 && list.length < 16 && !list.some(function (y) { return y.id === k; })) list.push(x); });
    return { items: list, fresh: !hard.length && !recent.length };
  }

  function itItem(e, why) {
    if (!e) return null;
    var ex = CP.itApi.example ? CP.itApi.example(e) : null;
    return { id: e.id.slice(3), c: "it", e: e, it: e.it, say: e.say, zh: e.zh, py: e.py, kind: e.kind, g: e.g, forms: e.forms || null, ex: ex ? { it: ex.it, zh: ex.zh } : null, why: why };
  }
  function collectIt() {
    var A = CP.itApi, ex = (lsJSON("cp-ex-v1") || {}).ex || {}, lex = A.lex(), scored = [], byId = {}, studied = 0;
    lex.forEach(function (e) { byId[e.id] = e; });
    lex.forEach(function (e) {
      var r = A.rec(e.id); if (r) studied++;
      var sc = errorsOf(ex[e.id]) * 2 + (r && r.c && typeof FSRS !== "undefined" && r.c.state === FSRS.RELEARNING ? 3 : 0) + (r && r.c && r.c.df >= 7.5 ? 1 : 0);
      if (sc > 0) scored.push({ e: e, sc: sc });
    });
    scored.sort(function (a, b) { return b.sc - a.sc; });
    var hard = scored.map(function (x) { return itItem(x.e, "err"); });
    var recent = recentKeys().map(function (id) { return itItem(byId[id], "recent"); }).filter(Boolean);
    var list = interleave(hard.slice(0, 30), recent.slice(0, 20));
    if (list.length < 8) {
      var want = { noun: 6, verb: 3, adj: 3, other: 2 }, got = {};
      lex.forEach(function (e) { var k = want[e.kind] ? e.kind : (e.kind === "place" || e.kind === "nat" ? "noun" : "other"); if ((got[k] || 0) < want[k] && itItem(e) && !list.some(function (y) { return y.id === e.id.slice(3); })) { got[k] = (got[k] || 0) + 1; list.push(itItem(e, "start")); } });
    }
    return { items: list.filter(Boolean), fresh: !scored.length && !recent.length };
  }

  /* ================= immagini di testo ================= */
  function cvs(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * K)); c.height = Math.max(1, Math.round(h * K)); return c; }
  var MC = null;
  /* il testo come immagine (font di sistema), alta circa quanto serve; si rimpicciolisce o si accorcia per stare in maxW (mm) */
  function tImg(text, o) {
    text = String(text); var fam = hasHan(text) ? HAN : LAT, size = o.size, min = size * 0.7, px, w, ctx = MC || (MC = document.createElement("canvas").getContext("2d"));
    function meas() { px = size * PT * K; ctx.font = (o.bold ? "700 " : "400 ") + px + "px " + fam; w = ctx.measureText(text).width / K; }
    meas();
    while (o.maxW && w > o.maxW && size > min) { size -= 0.25; meas(); }
    if (o.maxW && w > o.maxW) { var a = Array.from(text); while (a.length > 2 && w > o.maxW) { a.pop(); text = a.join("") + "…"; meas(); } }
    var h = size * PT * 1.4, c = cvs(w + 0.6, h), g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = o.color || INK; g.font = (o.bold ? "700 " : "400 ") + px + "px " + fam; g.textBaseline = "middle"; g.fillText(text, 0.3 * K, c.height / 2 + px * 0.04);
    return { c: c, w: c.width / K, h: c.height / K };
  }
  /* il carattere in tenue in un quadrato di side mm, con i numeri dei tratti. Le linee centrali di data/strokes.js (stile Kai)
     si adattano al riquadro reale del carattere nel font di sistema, così il tratteggio cade sopra i tratti; map() porta un
     punto 0..1 dei dati in mm dentro l'immagine (le linee tratteggiate sono vettoriali, a parte). */
  function glyphImg(ch, side, color, numbers) {
    var c = cvs(side, side), g = c.getContext("2d"), W = c.width, st = CP.strokeData ? CP.strokeData(ch) : null, px = W * 0.8, m, iw, ih, tf = null;
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, W); g.fillStyle = color; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.font = "400 " + px + "px " + HAN; m = g.measureText(ch);
    if (m.actualBoundingBoxAscent != null) {
      iw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight; ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      var k = Math.min(1, W * 0.84 / Math.max(iw, ih, 1)); px *= k; g.font = "400 " + px + "px " + HAN; m = g.measureText(ch);
      iw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight; ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      var x0 = (W - iw) / 2 + m.actualBoundingBoxLeft, y0 = (W - ih) / 2 + m.actualBoundingBoxAscent;
      g.fillText(ch, x0, y0);
      if (st) {
        var bx0 = 1, by0 = 1, bx1 = 0, by1 = 0; st.forEach(function (s) { s.forEach(function (p) { bx0 = Math.min(bx0, p.x); by0 = Math.min(by0, p.y); bx1 = Math.max(bx1, p.x); by1 = Math.max(by1, p.y); }); });
        var L = (W - iw) / 2, Tp = (W - ih) / 2, sx = iw / Math.max(bx1 - bx0, 0.05), sy = ih / Math.max(by1 - by0, 0.05);
        tf = function (p) { return { x: (L + (p.x - bx0) * sx) / K, y: (Tp + (p.y - by0) * sy) / K }; };
      }
    } else {
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, W / 2, W / 2 + px * 0.06);
      if (st) tf = function (p) { return { x: (BOX + SPAN * p.x) * side, y: (BOX + SPAN * p.y) * side }; };
    }
    if (numbers && st && tf) {
      g.fillStyle = DASH; g.font = "700 " + Math.round(4.2 * PT * K) + "px " + LAT; g.textAlign = "center"; g.textBaseline = "middle";
      st.forEach(function (s, i) { var q = tf(s[0]); g.fillText(String(i + 1), q.x * K - 1.2 * K, q.y * K - 1.2 * K); });
    }
    return { c: c, w: side, h: side, map: tf };
  }
  /* una riga di quadretti per lettere (spazio = mezzo quadretto); con trace le lettere sono scritte in tenue */
  function rowWidth(text, b) { var w = 0; Array.from(text).forEach(function (ch) { w += ch === " " ? b * 0.5 : b; }); return w; }

  /* ================= la pagina come elenco di segni ================= */
  function Page() { return { ops: [], cells: 0, boxes: 0 }; }
  function img(pg, x, y, t) { pg.ops.push({ t: "img", x: x, y: y, w: t.w, h: t.h, c: t.c }); }
  function line(pg, x1, y1, x2, y2, lw, color, dash) { pg.ops.push({ t: "line", x1: x1, y1: y1, x2: x2, y2: y2, lw: lw, c: color, dash: dash || null }); }
  function rect(pg, x, y, w, h, lw, color) { pg.ops.push({ t: "rect", x: x, y: y, w: w, h: h, lw: lw, c: color }); }
  function poly(pg, pts, lw, color, dash) { pg.ops.push({ t: "poly", pts: pts, lw: lw, c: color, dash: dash || null }); }

  /* un quadrato con la griglia 田字格: bordo pieno, croce tratteggiata */
  function tianzige(pg, x, y, s) {
    rect(pg, x, y, s, s, 0.35, GRID);
    line(pg, x + s / 2, y, x + s / 2, y + s, 0.18, GRIDL, [1.2, 1.2]); line(pg, x, y + s / 2, x + s, y + s / 2, 0.18, GRIDL, [1.2, 1.2]);
    pg.cells++;
  }
  /* una riga di quadrati per un carattere: modello con tratti numerati, traccia chiara, poi vuoti */
  function writeRow(pg, y, ch) {
    var i, s = CELL, inner = s - 0.8, g1 = glyphImg(ch, inner, TRACE, true), st = CP.strokeData ? CP.strokeData(ch) : null;
    img(pg, M + 0.4, y + 0.4, g1);
    img(pg, M + s + 0.4, y + 0.4, glyphImg(ch, inner, TRACE2, false));
    for (i = 0; i < COLS; i++) tianzige(pg, M + i * s, y, s);
    if (st && g1.map) st.forEach(function (stroke) {
      poly(pg, stroke.map(function (p) { var q = g1.map(p); return { x: M + 0.4 + q.x, y: y + 0.4 + q.y }; }), 0.25, DASH, [1.0, 0.8]);
    });
  }

  function pyShow(py) { return String(py).replace(/\./g, " "); }
  function chip(pg, y, text) { var t = tImg(text, { size: 7.5, color: SOFT, maxW: 60 }); img(pg, M + CW - t.w, y + 1, t); }
  function whyText(it) { return it.why === "err" ? T("ws.r.err") : it.why === "tone" ? T("ws.r.tone", { n: it.tone }) : it.why === "recent" ? T("ws.r.recent") : it.why === "start" ? T("ws.r.start") : ""; }
  var HDR = 8.5, EXR = 5.5, GAP = 3.2;

  /* ---- una voce del foglio di cinese ---- */
  function zhEntry(it) {
    var h = HDR + (it.ex ? EXR : 0) + it.chars.length * CELL + GAP;
    return { it: it, h: h, draw: function (pg, y) {
      var py = tImg(pyShow(it.py), { size: 12.5, bold: true, maxW: 60 }), gl = tImg(it.gloss, { size: 10.5, maxW: CW - py.w - 36 });
      img(pg, M, y, py); img(pg, M + py.w + 3, y + 0.9, gl); chip(pg, y, whyText(it)); y += HDR;
      if (it.ex) {
        var z = tImg(it.ex.zh, { size: 9.5, color: "#444", maxW: CW * 0.5 }); img(pg, M, y - 0.5, z);
        img(pg, M + z.w + 3, y - 0.2, tImg(it.ex.it, { size: 8, color: SOFT, maxW: CW - z.w - 3 })); y += EXR;
      }
      it.chars.forEach(function (ch) { writeRow(pg, y, ch); y += CELL; });
    } };
  }

  /* ---- una voce del foglio di italiano (per chi parla cinese): quadretti per le lettere ---- */
  var LBL = 17;
  function itRows(it) {
    var rows = [], f = it.forms || [];
    function copyRow() { rows.push({ label: T("ws.f.copy"), text: it.it, trace: true, b: 8 }); }
    if (it.kind === "noun") {
      copyRow(); rows.push({ label: T("ws.f.sg"), text: f[0] || it.it, b: 8 }); rows.push({ label: T("ws.f.pl"), text: f[1] || "", b: 8, key: true });
    } else if (it.kind === "adj") {
      copyRow(); [[T("ws.f.fs"), f[1]], [T("ws.f.mp"), f[2]], [T("ws.f.fp"), f[3]]].forEach(function (r) { rows.push({ label: r[0], text: r[1] || "", b: 8, key: true }); });
    } else if (it.kind === "verb") {
      copyRow(); rows.push({ conj: true, b: 6.4 });
    } else { copyRow(); rows.push({ label: "", text: it.it, b: 8 }); }
    return rows.filter(function (r) { return r.conj || (r.text && Array.from(r.text.replace(/ \/ .*$/, "")).length * r.b <= CW - LBL); });
  }
  var PRON = [["io", 0], ["tu", 1], ["lui/lei", 2], ["noi", 3], ["voi", 4], ["loro", 5]];
  function itForms(it) { return PRON.map(function (p) { return CP.ita.present(it.it, p[1]); }); }
  function itEntry(it) {
    var rows = itRows(it); if (!rows.length || !rows.some(function (r) { return !r.trace; }) && it.kind !== "other") return null;
    var forms = it.kind === "verb" ? itForms(it) : null;
    if (forms && forms.some(function (s) { return !s || Array.from(s).length > 12; })) return null;
    var keys = rows.filter(function (r) { return r.key; }).map(function (r) { return r.text; });
    if (forms) keys = forms;
    var h = HDR + (it.ex ? EXR : 0) + GAP;
    rows.forEach(function (r) { h += r.conj ? 3 * (r.b + 1.6) : r.b + 1.6; });
    if (keys.length) h += 4.5;
    return { it: it, h: h, draw: function (pg, y) {
      var zh = tImg(it.zh, { size: 12.5, bold: true, maxW: 50 }), p = tImg(it.py, { size: 8.5, color: SOFT, maxW: 50 });
      img(pg, M, y, zh); img(pg, M + zh.w + 2, y + 2.4, p);
      var tag = it.kind === "noun" ? T(it.g === "f" ? "ws.g.f" : it.g === "mf" ? "ws.g.mf" : "ws.g.m") : it.kind === "verb" ? T("ws.k.verb") : it.kind === "adj" ? T("ws.k.adj") : T("ws.k.other");
      chip(pg, y, [tag, whyText(it)].filter(Boolean).join(" · ")); y += HDR;
      if (it.ex) {
        var s = tImg(it.ex.it, { size: 9, color: "#444", maxW: CW * 0.55 }); img(pg, M, y - 0.5, s);
        img(pg, M + s.w + 3, y - 0.2, tImg(it.ex.zh, { size: 8, color: SOFT, maxW: CW - s.w - 3 })); y += EXR;
      }
      rows.forEach(function (r) {
        if (r.conj) {
          for (var i = 0; i < 6; i++) {
            var cx = M + (i < 3 ? 0 : CW / 2), cy = y + (i % 3) * (r.b + 1.6);
            img(pg, cx, cy + 1.2, tImg(PRON[i][0], { size: 8, color: SOFT, maxW: 14 })); boxRow(pg, cx + 14.5, cy, "", r.b, forms[i].length);
          }
          y += 3 * (r.b + 1.6);
        } else {
          if (r.label) img(pg, M, y + (r.b - 3) / 2, tImg(r.label, { size: 7.5, color: SOFT, maxW: LBL - 1 }));
          boxRow(pg, M + LBL, y, r.trace ? r.text : "", r.b, 0, r.trace ? null : r.text); y += r.b + 1.6;
        }
      });
      if (keys.length) img(pg, M, y, tImg(T("ws.key") + ": " + keys.join(" · "), { size: 7, color: "#9a9a9a", maxW: CW }));
    } };
  }
  /* quadretti: text = lettere da disegnare in tenue; n = quanti quadretti vuoti; shape = parola di cui contare solo le lettere */
  function boxRow(pg, x, y, text, b, n, shape) {
    var src = text || shape || "", chars = Array.from(text ? text : (n ? new Array(n + 1).join("x") : src)), i, cx = x, pos = [];
    chars.forEach(function (ch) { if (ch === " ") { cx += b * 0.5; return; } pos.push({ x: cx, ch: ch }); cx += b; });
    if (text) {
      var c = cvs(cx - x, b), g = c.getContext("2d"), px = b * K * 0.7;
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = TRACE; g.font = "400 " + px + "px " + LAT; g.textAlign = "center"; g.textBaseline = "middle";
      pos.forEach(function (p) { g.fillText(p.ch, (p.x - x + b / 2) * K, c.height / 2 + px * 0.04); });
      img(pg, x, y, { c: c, w: c.width / K, h: b });
    }
    for (i = 0; i < pos.length; i++) { rect(pg, pos[i].x, y, b, b, 0.3, GRID); pg.boxes++; }
  }

  /* ================= impaginazione, intestazione, QR ================= */
  var QRS = 26, TOP1 = 44, TOP2 = 20, BOT = 280;
  function head(pg, n, total, meta) {
    img(pg, PW - M - 80, PH - 9.5, tImg(T("ws.foot"), { size: 7, color: SOFT, maxW: 80 }));
    var pgT = tImg(T("ws.page", { n: n, m: total }), { size: 7, color: SOFT, maxW: 30 }); img(pg, M, PH - 9.5, pgT);
    if (n > 1) { img(pg, M, 11, tImg(T("ws.pdfTitle") + " · màndarínō", { size: 10, bold: true, maxW: CW })); return; }
    img(pg, M, 11, tImg(T("ws.pdfTitle"), { size: 20, bold: true, maxW: 110 }));
    img(pg, M, 21, tImg(meta.sub, { size: 9, color: SOFT, maxW: CW - QRS - 6 }));
    [[T("ws.name"), 70], [T("ws.date"), 32]].reduce(function (x, f) {
      var l = tImg(f[0], { size: 8, color: SOFT, maxW: 20 }); img(pg, x, 29.5, l); line(pg, x + l.w + 1, 33.4, x + l.w + 1 + f[1], 33.4, 0.25, GRID); return x + l.w + f[1] + 8;
    }, M);
    var q = meta.qr, mod = QRS / (q.size + 8), x0 = PW - M - QRS, y0 = 8.5;
    pg.ops.push({ t: "qr", x: x0, y: y0, s: QRS, q: q, mod: mod, text: meta.qrText });
    img(pg, x0, y0 + QRS + 0.4, tImg(T("ws.qrCap"), { size: 7, color: SOFT, maxW: QRS }));
  }

  function link(code) {
    var app = !!window.MandarinoAndroid || location.hostname === "appassets.androidplatform.net", C = window.MD_CONFIG || {};
    var base = !app && /^https?:$/.test(location.protocol) ? location.origin + location.pathname : (C.SITE_URL ? C.SITE_URL.replace(/\/?$/, "/").replace(/app\/$/, "") + "app/" : "");
    return base + HASH + code;
  }
  function b64u(s) { var b = new TextEncoder().encode(s), bin = ""; for (var i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]); return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64u(s) { var bin = atob(s.replace(/-/g, "+").replace(/_/g, "/")), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); }
  function encodeCode(c, ids) { return PREFIX + b64u(["1", c === "it" ? "i" : "z", ids.join(",")].join("|")); }
  function decodeCode(text) {
    var m = /MDD1-([A-Za-z0-9_-]{6,})/.exec(String(text || "")); if (!m) return null;
    try { var p = unb64u(m[1]).split("|"); if (p[0] !== "1" || p.length !== 3) return null; var ids = p[2].split(",").filter(Boolean).slice(0, 40); return ids.length ? { c: p[1] === "i" ? "it" : "zh", ids: ids } : null; } catch (e) { return null; }
  }

  /* costruisce le pagine: { pages, items, qrText, ... }. La scelta delle voci riempie al massimo due pagine. */
  function layout() {
    var c = course(), col = c === "it" ? collectIt() : collectZh(), ents = col.items.map(c === "it" ? itEntry : zhEntry).filter(Boolean);
    var pages = [Page()], tops = [TOP1, TOP2], y = TOP1, chosen = [], PL = [[]];
    ents.forEach(function (e) {
      if (chosen.length >= 18) return;
      var pi = pages.length - 1;
      if (y + e.h > BOT) { if (pages.length >= MAXPAGES) return; pages.push(Page()); PL.push([]); pi++; y = TOP2; if (y + e.h > BOT) return; }
      PL[pi].push([e, y]); y += e.h; chosen.push(e);
    });
    if (!chosen.length) return null;
    var ids = chosen.map(function (e) { return c === "it" ? e.it.e.id.slice(3) : e.it.id; }), code = encodeCode(c, ids), qrText = link(code);
    var meta = { sub: T(c === "it" ? (col.fresh ? "ws.pdfSubItNew" : "ws.pdfSubIt") : (col.fresh ? "ws.pdfSubNew" : "ws.pdfSub")), qrText: qrText, code: code, ids: ids, course: c, fresh: col.fresh, qr: CP.qr.encode(qrText, "M") };
    pages.forEach(function (pg, i) { head(pg, i + 1, pages.length, meta); PL[i].forEach(function (p) { p[0].draw(pg, p[1]); }); });
    return { pages: pages, meta: meta, items: chosen.map(function (e) { return e.it; }) };
  }

  /* ================= anteprima (canvas) e PDF (jsPDF) ================= */
  function rgb(hex) { return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)]; }
  function paint(pg, ppm) {
    var c = document.createElement("canvas"); c.width = Math.round(PW * ppm); c.height = Math.round(PH * ppm);
    var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.lineCap = "butt";
    pg.ops.forEach(function (o) {
      if (o.t === "img") { g.drawImage(o.c, o.x * ppm, o.y * ppm, o.w * ppm, o.h * ppm); return; }
      if (o.t === "qr") {
        g.fillStyle = "#000"; for (var yy = 0; yy < o.q.size; yy++) { var xx = 0; while (xx < o.q.size) { if (!o.q.get(xx, yy)) { xx++; continue; } var x1 = xx; while (xx < o.q.size && o.q.get(xx, yy)) xx++; g.fillRect((o.x + (x1 + 4) * o.mod) * ppm, (o.y + (yy + 4) * o.mod) * ppm, (xx - x1) * o.mod * ppm + 0.4, o.mod * ppm + 0.4); } }
        return;
      }
      g.strokeStyle = o.c; g.lineWidth = Math.max(0.6, o.lw * ppm); g.setLineDash(o.dash ? o.dash.map(function (d) { return d * ppm; }) : []);
      g.beginPath();
      if (o.t === "line") { g.moveTo(o.x1 * ppm, o.y1 * ppm); g.lineTo(o.x2 * ppm, o.y2 * ppm); }
      else if (o.t === "rect") g.rect(o.x * ppm, o.y * ppm, o.w * ppm, o.h * ppm);
      else { o.pts.forEach(function (p, i) { if (i) g.lineTo(p.x * ppm, p.y * ppm); else g.moveTo(p.x * ppm, p.y * ppm); }); }
      g.stroke();
    });
    return c;
  }
  function makePdf(L, opts) {
    var J = window.jspdf && window.jspdf.jsPDF; if (!J) throw new Error("jsPDF");
    var doc = new J({ unit: "mm", format: "a4", compress: !(opts && opts.compress === false) }), cache = [];
    doc.setProperties({ title: T("ws.pdfTitle") + " · màndarínō", subject: L.meta.qrText, creator: "màndarínō" });
    L.pages.forEach(function (pg, i) {
      if (i) doc.addPage();
      pg.ops.forEach(function (o) {
        if (o.t === "img") { doc.addImage(o.c.toDataURL("image/jpeg", 0.8), "JPEG", o.x, o.y, o.w, o.h, undefined, "FAST"); return; }
        if (o.t === "qr") {
          doc.setFillColor(0, 0, 0);
          for (var yy = 0; yy < o.q.size; yy++) { var xx = 0; while (xx < o.q.size) { if (!o.q.get(xx, yy)) { xx++; continue; } var x1 = xx; while (xx < o.q.size && o.q.get(xx, yy)) xx++; doc.rect(o.x + (x1 + 4) * o.mod, o.y + (yy + 4) * o.mod, (xx - x1) * o.mod, o.mod, "F"); } }
          return;
        }
        var cc = rgb(o.c); doc.setDrawColor(cc[0], cc[1], cc[2]); doc.setLineWidth(o.lw); doc.setLineDashPattern(o.dash || [], 0);
        if (o.t === "line") doc.line(o.x1, o.y1, o.x2, o.y2);
        else if (o.t === "rect") doc.rect(o.x, o.y, o.w, o.h, "S");
        else { var p0 = o.pts[0]; doc.lines(o.pts.slice(1).map(function (p, j) { return [p.x - o.pts[j].x, p.y - o.pts[j].y]; }), p0.x, p0.y, [1, 1], "S", false); }
      });
    });
    doc.setLineDashPattern([], 0);
    return new Uint8Array(doc.output("arraybuffer"));
  }
  /* il foglio completo: Promise → { bytes, pages (canvas), meta, items, cells, boxes } */
  function build(opts) {
    return new Promise(function (ok, ko) {
      try {
        var L = layout(); if (!L) { ko(new Error("vuoto")); return; }
        var bytes = makePdf(L, opts), cells = 0, boxes = 0; L.pages.forEach(function (p) { cells += p.cells; boxes += p.boxes; });
        ok({ bytes: bytes, pages: L.pages.map(function (p) { return paint(p, (opts && opts.ppm) || 4); }), meta: L.meta, items: L.items, cells: cells, boxes: boxes, qrModules: L.meta.qr.size });
      } catch (e) { ko(e); }
    });
  }

  /* ================= salvataggio ================= */
  function b64(bytes) { var s = "", i, n = 0x8000; for (i = 0; i < bytes.length; i += n) s += String.fromCharCode.apply(null, bytes.subarray(i, i + n)); return btoa(s); }
  function fileName() { var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; }; return "mandarino-foglio-" + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + ".pdf"; }
  function save(bytes) {
    var A = window.MandarinoAndroid, name = fileName();
    if (A && A.saveFile) { var r = ""; try { r = A.saveFile(name, "application/pdf", b64(bytes)); } catch (e) {} if (r) { if (r === "download") CP.toast(T("ws.saved")); } else CP.toast(T("ws.fail")); return; }
    var a = document.createElement("a"), u = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    a.href = u; a.download = name; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000); CP.toast(T("ws.savedWeb"));
  }
  function canShare(bytes) {
    var A = window.MandarinoAndroid; if (A && A.shareFile) return true;
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File([bytes], fileName(), { type: "application/pdf" })] })); } catch (e) { return false; }
  }
  function share(bytes) {
    var A = window.MandarinoAndroid, name = fileName();
    if (A && A.shareFile) { try { A.shareFile(name, "application/pdf", b64(bytes)); } catch (e) { CP.toast(T("ws.fail")); } return; }
    try { navigator.share({ files: [new File([bytes], name, { type: "application/pdf" })], title: "màndarínō" }).catch(function () {}); } catch (e) { CP.toast(T("ws.fail")); }
  }

  /* ================= foglio di anteprima ================= */
  var R = null;
  function sheetHead(title) { return '<div class="fam-head"><div class="meta"><b>📝 ' + esc(title) + '</b></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>"; }
  function open() {
    CP.openSheet(sheetHead(T("ws.title")) + '<p class="small" role="status" aria-live="polite">' + esc(T("ws.preparing")) + "</p>");
    setTimeout(function () {
      build().then(function (r) {
        R = r;
        var kb = Math.max(1, Math.round(r.bytes.length / 1024)), n = r.pages.length;
        CP.openSheet(sheetHead(T("ws.title")) + '<p class="small">' + esc(T("ws.how")) + '</p><div class="ws-pages">' + r.pages.map(function (p, i) {
          return '<figure class="ws-page"><canvas data-ws-page="' + i + '" role="img" aria-label="' + CP.attr(T("ws.pageAlt", { n: i + 1 })) + '"></canvas><figcaption class="small muted">' + esc(T("ws.page", { n: i + 1, m: n })) + "</figcaption></figure>";
        }).join("") + '</div><p class="small muted" id="ws-info">' + esc(T("ws.info", { m: n, kb: kb })) + '</p><div class="acts"><button type="button" class="btn-main" data-ws-save style="margin:0">' + esc(T("ws.save")) + "</button>" +
          (canShare(r.bytes) ? '<button type="button" class="btn-s" data-ws-share>' + esc(T("ws.share")) + "</button>" : "") + "</div>");
        r.pages.forEach(function (p, i) { var cv = document.querySelector('[data-ws-page="' + i + '"]'); if (cv) { cv.width = p.width; cv.height = p.height; cv.getContext("2d").drawImage(p, 0, 0); } });
      }, function () { CP.openSheet(sheetHead(T("ws.title")) + '<p role="alert">' + esc(T("ws.fail")) + "</p>"); });
    }, 40);
  }

  /* ================= dettato (si apre dal QR) ================= */
  var D = null;
  function resolve(c, id) {
    if (c === "zh") { var w = CP.WORDS[id]; return w ? { say: w.hz, lang: "zh", hz: w.hz, py: w.py, gloss: CP.gloss(w) } : null; }
    var e = CP.itApi && CP.itApi.entry ? CP.itApi.entry("it:" + id) : null; return e ? { say: e.say, lang: "it", it: e.it, zh: e.zh, py: e.py } : null;
  }
  function dHead() { return sheetHead(T("ws.d.title")); }
  function dictation(text) {
    var d = decodeCode(text); if (!d) { CP.toast(T("ws.d.bad")); return false; }
    if (d.c !== course()) {
      CP.openSheet(dHead() + "<p>" + esc(T(d.c === "it" ? "ws.d.otherIt" : "ws.d.otherZh")) + '</p><div class="acts"><button type="button" class="btn-s" data-ws-switch="' + d.c + '" data-code="' + CP.attr(encodeCode(d.c, d.ids)) + '">' + esc(T("ws.d.switch")) + "</button></div>");
      return true;
    }
    var items = d.ids.map(function (id) { return resolve(d.c, id); }).filter(Boolean);
    if (!items.length) { CP.toast(T("ws.d.bad")); return false; }
    D = { c: d.c, items: items, i: 0, shown: false };
    CP.openSheet(dHead() + '<p class="chal-lead">' + esc(T("ws.d.lead")) + '</p><p class="small muted">' + esc(T("ws.d.privacy")) + '</p><div class="acts"><button type="button" class="btn-main" data-ws-d="start" style="margin:0">' + esc(T("ws.d.start")) + "</button></div>");
    return true;
  }
  function say() {
    var it = D && D.items[D.i]; if (!it) return;
    if (it.lang === "it") CP.speak(it.say, { lang: "it-IT", voiceURI: CP.itVoiceURI ? CP.itVoiceURI() : undefined }); else CP.speak(it.say);
  }
  function dStep() {
    var it = D.items[D.i], n = D.items.length;
    if (D.i >= n) {
      CP.openSheet(dHead() + '<p class="chal-lead" role="status">' + esc(T("ws.d.done")) + '</p><div class="acts"><button type="button" class="btn-main" data-ws-d="restart" style="margin:0">' + esc(T("ws.d.restart")) + "</button></div>"); return;
    }
    var reveal = D.shown ? '<div class="chal-res" lang="' + (D.c === "it" ? "it" : "zh-CN") + '">' + (D.c === "it"
      ? "<b>" + esc(it.it) + '</b><div class="small muted" lang="zh-CN">' + esc(it.zh) + " · " + esc(it.py) + "</div>"
      : '<b style="font-size:2rem">' + esc(it.hz) + '</b><div class="small">' + esc(it.py) + '</div><div class="small muted" lang="it">' + esc(it.gloss) + "</div>") + "</div>" : "";
    CP.openSheet(dHead() + '<div class="chal-n small muted" aria-live="polite">' + esc(T("ws.d.n", { i: D.i + 1, n: n })) + '</div><div class="chal-bar" aria-hidden="true"><i style="width:' + Math.round(D.i / n * 100) + '%"></i></div>' + reveal +
      '<div class="acts"><button type="button" class="btn-main" data-ws-d="play" style="margin:0">🔊 ' + esc(T(D.played ? "ws.d.again" : "ws.d.play")) + '</button>' +
      (D.shown ? "" : '<button type="button" class="btn-s" data-ws-d="show">' + esc(T("ws.d.show")) + "</button>") + '<button type="button" class="btn-s" data-ws-d="next">' + esc(T("ws.d.next")) + "</button></div>");
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-ws-save], [data-ws-share], [data-ws-d], [data-ws-switch]") : null; if (!b) return;
    if (b.hasAttribute("data-ws-save")) { if (R) save(R.bytes); }
    else if (b.hasAttribute("data-ws-share")) { if (R) share(R.bytes); }
    else if (b.hasAttribute("data-ws-switch")) { try { history.replaceState(null, "", location.pathname + location.search + HASH + b.getAttribute("data-code")); } catch (x) {} CP.setCourse(b.getAttribute("data-ws-switch")); }
    else if (D) {
      var a = b.getAttribute("data-ws-d");
      if (a === "start" || a === "restart") { D.i = 0; D.shown = false; D.played = false; dStep(); say(); D.played = true; }
      else if (a === "play") { say(); D.played = true; var pb = document.querySelector('[data-ws-d="play"]'); if (pb) pb.textContent = "🔊 " + T("ws.d.again"); }
      else if (a === "show") { D.shown = true; dStep(); }
      else if (a === "next") { D.i++; D.shown = false; D.played = false; dStep(); if (D.i < D.items.length) { say(); D.played = true; } }
    }
  });

  CP.worksheetUI = { open: open, build: build, dictation: dictation, encode: encodeCode, decode: decodeCode, link: link, HASH: HASH, size: { w: PW, h: PH } };
})();
