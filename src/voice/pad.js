/* ===== V6: lavagna "prima il dito". Quadrato con 米字格, un carattere gigante alla volta, tratto morbido a velocità,
   annulla, ricalco assistito, valutazione (immagine + direzione + ordine) ===== */
(function () {
  var CP = window.CP, esc = CP.esc;
  var L = 260;              /* coordinate logiche della lavagna */
  var SC = 220;             /* risoluzione di confronto (CP.scorePad) */
  var FONT = "'PingFang SC','Hiragino Sans GB','Noto Sans CJK SC','Noto Sans SC','Microsoft YaHei',sans-serif";
  function css(v, fb) { return (getComputedStyle(document.documentElement).getPropertyValue(v) || fb).trim() || fb; }

  /* ---------- maschere bitmap del carattere e dell'inchiostro ---------- */
  var maskCache = {};
  function glyphMask(ch) {
    if (maskCache[ch]) return maskCache[ch];
    var c = document.createElement("canvas"); c.width = c.height = SC; var x = c.getContext("2d");
    if ("lang" in x) x.lang = "zh-CN"; x.font = "500 " + Math.round(SC * 0.86) + "px " + FONT; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#000";
    x.fillText(ch, SC / 2, SC / 2 + SC * 0.04);
    var d = x.getImageData(0, 0, SC, SC).data, m = new Uint8Array(SC * SC), i, n = 0;
    for (i = 0; i < SC * SC; i++) if (d[i * 4 + 3] > 80) { m[i] = 1; n++; }
    return (maskCache[ch] = { m: m, n: n });
  }
  function inkMask(canvas, box) {
    /* ricampiona l'inchiostro (o una sua porzione `box`) su SC x SC */
    var c = document.createElement("canvas"); c.width = c.height = SC; var x = c.getContext("2d");
    var b = box || { x: 0, y: 0, w: canvas.width, h: canvas.height };
    x.drawImage(canvas, b.x, b.y, b.w, b.h, 0, 0, SC, SC);
    var d = x.getImageData(0, 0, SC, SC).data, m = new Uint8Array(SC * SC), i, n = 0;
    for (i = 0; i < SC * SC; i++) if (d[i * 4 + 3] > 80) { m[i] = 1; n++; }
    return { m: m, n: n };
  }
  function dilate(m, r) {
    var N = SC, t = new Uint8Array(N * N), o = new Uint8Array(N * N), x, y, k, v;
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) { v = 0; for (k = Math.max(0, x - r); k <= Math.min(N - 1, x + r); k++) if (m[y * N + k]) { v = 1; break; } t[y * N + x] = v; }
    for (x = 0; x < N; x++) for (y = 0; y < N; y++) { v = 0; for (k = Math.max(0, y - r); k <= Math.min(N - 1, y + r); k++) if (t[k * N + x]) { v = 1; break; } o[y * N + x] = v; }
    return o;
  }
  /* confronto per intersezione di pixel con tolleranza (il pennello è più spesso del tratto del font) */
  function compare(U, T) {
    var R = 8, Ud = dilate(U.m, R), Td = dilate(T.m, R), i, cov = 0, pre = 0;
    for (i = 0; i < SC * SC; i++) { if (T.m[i] && Ud[i]) cov++; if (U.m[i] && Td[i]) pre++; }
    var coverage = T.n ? cov / T.n : 0, precision = U.n ? pre / U.n : 0;
    return { coverage: coverage, precision: precision, score: Math.round((coverage * 0.55 + precision * 0.45) * 100), Ud: Ud, Td: Td };
  }
  CP.scorePad = function (userCanvas, targetChar, box) {
    var U = inkMask(userCanvas, box), T = glyphMask(targetChar);
    if (U.n < 30) return { score: 0, coverage: 0, precision: 0, empty: true };
    var r = compare(U, T); return { score: r.score, coverage: r.coverage, precision: r.precision };
  };
  CP._glyphMask = glyphMask;

  /* ---------- analisi: struttura del carattere (dalla proiezione dei pixel) ---------- */
  function structure(T) {
    var N = SC, col = new Int32Array(N), row = new Int32Array(N), x, y, x0 = N, x1 = -1, y0 = N, y1 = -1;
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (T.m[y * N + x]) { col[x]++; row[y]++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { kind: "?", bb: [0, 0, N, N] };
    var bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    function gap(p, a, b) { /* intervallo vuoto piu' lungo tra il 25% e il 75% */
      var best = 0, bs = -1, run = 0, st = 0, i, lo = a + Math.floor((b - a) * 0.22), hi = a + Math.floor((b - a) * 0.78);
      for (i = lo; i <= hi; i++) { if (p[i] === 0) { if (!run) st = i; run++; if (run > best) { best = run; bs = st; } } else run = 0; }
      return { len: best, at: bs < 0 ? 0 : (bs + best / 2 - a) / (b - a) };
    }
    var gx = gap(col, x0, x1), gy = gap(row, y0, y1), kind = "compatto";
    var edge = function (arr, a, b, line, horiz) { var i, c = 0, t = 0; for (i = a + Math.floor((b - a) * 0.15); i <= b - Math.floor((b - a) * 0.15); i++) { t++; if (horiz ? T.m[line * N + i] : T.m[i * N + line]) c++; } return t ? c / t : 0; };
    var ring = 0; [[y0 + 2, 1], [y1 - 2, 1], [x0 + 2, 0], [x1 - 2, 0]].forEach(function (e) { ring += edge(null, e[1] ? x0 : y0, e[1] ? x1 : y1, e[0], e[1]) > 0.7 ? 1 : 0; });
    var ring2 = 0; for (y = y0; y <= y1; y++) if (T.m[y * N + x0 + 1] || T.m[y * N + x0 + 2] || T.m[y * N + x0 + 3]) ring2++;
    if (ring >= 3 && ring2 / bh > 0.8 && bw > SC * 0.35 && bh > SC * 0.35) kind = "recinto";
    else if (gx.len >= Math.max(3, bw * 0.03) && gx.len >= gy.len) kind = "sinistra-destra";
    else if (gy.len >= Math.max(3, bh * 0.03)) kind = "alto-basso";
    return { kind: kind, bb: [x0, y0, x1, y1], gapX: gx.at, gapY: gy.at };
  }

  /* ---------- analisi dei tratti: direzione e ordine ---------- */
  function strokeVec(s) { var a = s[0], b = s[s.length - 1]; return { dx: b.x - a.x, dy: b.y - a.y, len: Math.hypot(b.x - a.x, b.y - a.y) }; }
  function analyze(strokes) {
    var bad = { h: 0, v: 0, up: 0 }, tot = strokes.length, i, big = L * 0.16, ord = 0, cs = [];
    strokes.forEach(function (s) {
      if (s.length < 3) return; var v = strokeVec(s); if (v.len < L * 0.1) return;
      var ax = Math.abs(v.dx), ay = Math.abs(v.dy);
      if (ax > 2 * ay && v.dx < -big) bad.h++;
      else if (ay > 2 * ax && v.dy < -big) bad.v++;
      else if (v.dx < -big * 0.6 && v.dy < -big * 0.6) bad.up++;
    });
    strokes.forEach(function (s) { var sx = 0, sy = 0; s.forEach(function (p) { sx += p.x; sy += p.y; }); cs.push({ x: sx / s.length, y: sy / s.length }); });
    for (i = 1; i < cs.length; i++) if (cs[i].y < cs[i - 1].y - L * 0.26 && Math.abs(cs[i].x - cs[i - 1].x) < L * 0.4) ord++;
    return { strokes: tot, bad: bad, order: ord };
  }

  function bboxOf(U) {
    var x0 = SC, x1 = -1, y0 = SC, y1 = -1, x, y;
    for (y = 0; y < SC; y++) for (x = 0; x < SC; x++) if (U.m[y * SC + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : [x0, y0, x1, y1];
  }

  function tips(ch, U, T, cmp, an) {
    var out = [], st = structure(T), ub = bboxOf(U), tb = st.bb;
    /* 1. direzione */
    if (an.bad.h) out.push("<b>Direzione:</b> " + an.bad.h + (an.bad.h > 1 ? " tratti orizzontali sono" : " tratto orizzontale è") + " scritt" + (an.bad.h > 1 ? "i" : "o") + " da destra a sinistra. In cinese i tratti orizzontali vanno sempre da sinistra a destra.");
    if (an.bad.v) out.push("<b>Direzione:</b> " + an.bad.v + (an.bad.v > 1 ? " tratti verticali partono" : " tratto verticale parte") + " dal basso. I verticali si scrivono dall'alto verso il basso.");
    if (an.bad.up) out.push("<b>Direzione:</b> " + an.bad.up + (an.bad.up > 1 ? " tratti vanno" : " tratto va") + " in alto verso sinistra. Le diagonali scendono: verso sinistra (撇) o verso destra (捺).");
    if (an.order) out.push("<b>Ordine:</b> hai scritto un tratto più in alto dopo uno più in basso. La regola base è dall'alto al basso (con poche eccezioni, come il fondo dei recinti).");
    /* 2. dimensione e posizione */
    if (ub && tb) {
      var uw = ub[2] - ub[0] + 1, uh = ub[3] - ub[1] + 1, tw = tb[2] - tb[0] + 1, th = tb[3] - tb[1] + 1, k = Math.sqrt((uw * uh) / (tw * th));
      if (k < 0.72) out.push("<b>Dimensione:</b> il tuo carattere è circa " + Math.round((1 - k) * 100) + "% più piccolo del modello. Riempi tutto il quadrato: i caratteri hanno sempre la stessa grandezza.");
      else if (k > 1.3) out.push("<b>Dimensione:</b> il tuo carattere è più grande del modello e rischia di uscire dal quadrato.");
      var dx = ((ub[0] + ub[2]) - (tb[0] + tb[2])) / 2, dy = ((ub[1] + ub[3]) - (tb[1] + tb[3])) / 2;
      if (Math.abs(dx) > SC * 0.1 || Math.abs(dy) > SC * 0.1) out.push("<b>Posizione:</b> il carattere è spostato " + (Math.abs(dx) > SC * 0.1 ? (dx < 0 ? "a sinistra" : "a destra") : "") + (Math.abs(dx) > SC * 0.1 && Math.abs(dy) > SC * 0.1 ? " e " : "") + (Math.abs(dy) > SC * 0.1 ? (dy < 0 ? "in alto" : "in basso") : "") + ". Usa la croce al centro come riferimento.");
    }
    /* 3. dove manca / dove eccede */
    var q = [[0, 0, 0, 0], [0, 0, 0, 0]], i, x, y, nm = ["in alto a sinistra", "in alto a destra", "in basso a sinistra", "in basso a destra"], qi;
    for (y = 0; y < SC; y++) for (x = 0; x < SC; x++) { i = y * SC + x; qi = (y >= SC / 2 ? 2 : 0) + (x >= SC / 2 ? 1 : 0); if (T.m[i]) q[0][qi]++; if (T.m[i] && !cmp.Ud[i]) q[1][qi]++; }
    var worst = -1, wr = 0.38; for (qi = 0; qi < 4; qi++) if (q[0][qi] > 200 && q[1][qi] / q[0][qi] > wr) { wr = q[1][qi] / q[0][qi]; worst = qi; }
    if (worst >= 0) out.push("<b>Manca qualcosa:</b> la zona " + nm[worst] + " è poco coperta. Controlla di aver scritto tutti i tratti lì.");
    /* 4. struttura */
    var s = st.kind;
    if (s === "sinistra-destra") out.push("<b>Struttura:</b> parte sinistra + parte destra. Scrivi prima la sinistra, poi la destra; la sinistra di solito è più stretta (qui il confine cade verso il " + Math.round(st.gapX * 100) + "% della larghezza).");
    else if (s === "alto-basso") out.push("<b>Struttura:</b> parte alta + parte bassa. Scrivi prima l'alto, poi il basso, e tieni le due parti sullo stesso asse verticale.");
    else if (s === "recinto") out.push("<b>Struttura:</b> un recinto. Scrivi prima il lato sinistro e quello in alto, poi l'interno, e chiudi il fondo per ultimo.");
    else out.push("<b>Struttura:</b> corpo unico. Parti dal tratto in alto o più a sinistra e procedi verso il basso e verso destra.");
    out.push("<b>Regola da ricordare:</b> orizzontali prima delle verticali che le incrociano; la parte centrale prima dei lati.");
    return out.slice(0, 6);
  }

  /* ---------- la lavagna ---------- */
  CP.pad = function (hz, o) {
    o = o || {};
    var chars = Array.from(hz), n = chars.length, st = o.state || {};
    var S = { cur: st.cur != null ? st.cur : 0, strokes: st.strokes || chars.map(function () { return []; }), guide: st.guide != null ? st.guide : !!o.ghost, assist: !!st.assist, awarded: st.awarded || {} };
    if (S.cur >= n && n > 1) S.cur = "all"; if (S.cur !== "all" && S.cur >= n) S.cur = 0;
    var el = document.createElement("div"); el.className = "pad pad2";
    var h = "";
    if (n > 1) {
      h += '<div class="pad-chars" role="group" aria-label="Scegli il carattere da scrivere">' + chars.map(function (c, i) { return '<button type="button" class="han" lang="zh-CN" data-pc="' + i + '" aria-label="Carattere ' + (i + 1) + ': ' + CP.attr(c) + '">' + esc(c) + "</button>"; }).join("") + '<button type="button" data-pc="all">Tutti</button></div>';
    }
    h += '<div class="pad-stage"><canvas class="pad-bg" aria-hidden="true"></canvas><canvas class="pad-ink" role="img" aria-label="Lavagna per scrivere il carattere con il dito"></canvas><i class="pad-dot" hidden></i></div>' +
      '<p class="pad-info small muted" aria-live="polite"></p>' +
      '<div class="padbtns"><button type="button" data-pa="undo">↩ Annulla tratto</button><button type="button" data-pa="clear">🧽 Pulisci</button><button type="button" data-pa="guide"></button><button type="button" data-pa="assist"></button></div>' +
      '<button type="button" class="btn-main pad-eval" data-pa="eval">✓ Valuta tratto</button><div class="pad-res" hidden aria-live="polite"></div>';
    el.innerHTML = h;
    var bg = el.querySelector(".pad-bg"), ink = el.querySelector(".pad-ink"), dot = el.querySelector(".pad-dot"), info = el.querySelector(".pad-info"), res = el.querySelector(".pad-res");
    var bx = bg.getContext("2d"), ix = ink.getContext("2d"), dpr = Math.min(3, window.devicePixelRatio || 1), px = 1;
    var drawing = null, destroyed = false;

    function cells() { return S.cur === "all" ? n : 1; }
    function cellChar(k) { return S.cur === "all" ? chars[k] : chars[S.cur]; }
    function strokesFor() { return S.cur === "all" ? S.strokes[0] : S.strokes[S.cur]; }   /* in "Tutti" si scrive su un unico livello */
    function setSize() {
      var w = ink.getBoundingClientRect().width || 300; px = Math.max(1, Math.round(w * dpr));
      bg.width = ink.width = px; bg.height = ink.height = px;
    }
    function k() { return px / L; }
    function paintBg() {
      var K = k(), c = cells(), i; bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, px, px); bx.setTransform(K, 0, 0, K, 0, 0);
      var line = css("--line", "#ccc"), acc = css("--accent", "#14594A");
      bx.strokeStyle = line; bx.lineWidth = 1.2; bx.setLineDash([5, 5]);
      bx.strokeRect(0.6, 0.6, L - 1.2, L - 1.2);
      bx.beginPath(); bx.moveTo(L / 2, 0); bx.lineTo(L / 2, L); bx.moveTo(0, L / 2); bx.lineTo(L, L / 2);
      bx.moveTo(0, 0); bx.lineTo(L, L); bx.moveTo(L, 0); bx.lineTo(0, L); bx.stroke(); bx.setLineDash([]);
      if (c > 1) { bx.strokeStyle = acc; bx.globalAlpha = 0.35; for (i = 1; i < c; i++) { bx.beginPath(); bx.moveTo(L * i / c, 0); bx.lineTo(L * i / c, L); bx.stroke(); } bx.globalAlpha = 1; }
      if (S.guide) {
        var fs = c > 1 ? Math.min(L * 0.8 / 1, L / c * 0.86) : L * 0.86;
        if ("lang" in bx) bx.lang = "zh-CN"; bx.font = "500 " + Math.round(fs) + "px " + FONT; bx.textAlign = "center"; bx.textBaseline = "middle";
        bx.fillStyle = css("--ink", "#222"); bx.globalAlpha = S.assist ? 0.3 : 0.12;
        for (i = 0; i < c; i++) bx.fillText(cellChar(i), L * (i + 0.5) / c, L / 2 + fs * 0.04);
        bx.globalAlpha = 1;
      }
    }
    /* un tratto: spezzate raccordate con curve di Bezier; lo spessore segue la velocità (lento = piu' spesso) */
    function drawStroke(s) {
      if (!s.length) return;
      var K = k(); ix.setTransform(K, 0, 0, K, 0, 0); ix.lineCap = "round"; ix.lineJoin = "round"; ix.strokeStyle = css("--ink", "#222"); ix.fillStyle = ix.strokeStyle;
      if (s.length === 1) { ix.beginPath(); ix.arc(s[0].x, s[0].y, s[0].w / 2, 0, 6.2832); ix.fill(); return; }
      var i, a, b, mx0 = s[0].x, my0 = s[0].y;
      ix.beginPath(); ix.arc(s[0].x, s[0].y, s[0].w / 2, 0, 6.2832); ix.fill();
      for (i = 1; i < s.length; i++) {
        a = s[i - 1]; b = s[i]; var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ix.lineWidth = (a.w + b.w) / 2; ix.beginPath(); ix.moveTo(mx0, my0); ix.quadraticCurveTo(a.x, a.y, mx, my); ix.stroke(); mx0 = mx; my0 = my;
      }
      var z = s[s.length - 1]; ix.lineWidth = z.w; ix.beginPath(); ix.moveTo(mx0, my0); ix.lineTo(z.x, z.y); ix.stroke();
    }
    function paintInk() { ix.setTransform(1, 0, 0, 1, 0, 0); ix.clearRect(0, 0, px, px); strokesFor().forEach(drawStroke); }
    function counts() { var m = strokesFor().length; return m + (m === 1 ? " tratto" : " tratti"); }
    function refreshInfo() {
      var lead = S.cur === "all" ? "Tutto il termine" : (n > 1 ? "Carattere " + (S.cur + 1) + " di " + n : "Carattere");
      info.textContent = lead + " · " + counts() + (S.assist ? " · il punto verde indica dove iniziare (alto-sinistra di ciò che manca)" : "");
      el.querySelector('[data-pa="guide"]').textContent = S.guide ? "👁 Al buio" : "👁 Guida";
      var ab = el.querySelector('[data-pa="assist"]'); ab.textContent = "✨ Ricalco assistito"; ab.setAttribute("aria-pressed", S.assist ? "true" : "false"); ab.classList.toggle("on", S.assist);
      el.querySelectorAll("[data-pc]").forEach(function (b) { var on = b.getAttribute("data-pc") === String(S.cur); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      el.querySelector('[data-pa="undo"]').disabled = !strokesFor().length;
    }
    /* punto verde: il primo punto "ancora da tracciare" in alto a sinistra (euristica: i tratti partono in alto/sinistra) */
    function assistDot() {
      dot.hidden = true; if (!S.assist || S.cur === "all") return;
      var T = glyphMask(chars[S.cur]), Ud = null, U = null;
      if (strokesFor().length) { U = inkMask(ink); Ud = dilate(U.m, 12); }
      var best = 1e9, bx0 = -1, by0 = -1, left = 0, i, x, y;
      for (y = 0; y < SC; y++) for (x = 0; x < SC; x++) { i = y * SC + x; if (T.m[i] && !(Ud && Ud[i])) { left++; var sc = y + 0.55 * x; if (sc < best) { best = sc; bx0 = x; by0 = y; } } }
      if (bx0 < 0 || left < T.n * 0.05) return;
      dot.style.left = (bx0 / SC * 100) + "%"; dot.style.top = (by0 / SC * 100) + "%"; dot.hidden = false;
    }
    function refreshAll() { paintBg(); paintInk(); refreshInfo(); assistDot(); }
    function pos(e) { var r = ink.getBoundingClientRect(); return { x: (e.clientX - r.left) * L / r.width, y: (e.clientY - r.top) * L / r.height }; }
    function width(p, prev, e) {
      var v = prev ? Math.hypot(p.x - prev.x, p.y - prev.y) / Math.max(1, p.t - prev.t) : 0;      /* unità logiche per ms */
      var target = 18 - 11 * Math.min(1, v / 1.3);                                                    /* lento = 18, veloce = 7 */
      var pen = e && e.pointerType === "pen" && e.pressure > 0 && e.pressure !== 0.5 ? 0.6 + e.pressure * 0.8 : 1;
      var w = prev ? prev.w * 0.72 + target * 0.28 : 13; return Math.max(5, Math.min(20, w * pen));
    }
    ink.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return; try { ink.setPointerCapture(e.pointerId); } catch (x) {}
      var p = pos(e); p.t = e.timeStamp; p.w = width(p, null, e); drawing = [p]; strokesFor().push(drawing); drawStroke(drawing); dot.hidden = true; res.hidden = true; e.preventDefault();
    });
    ink.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if (!evs.length) evs = [e];
      evs.forEach(function (ev) {
        var prev = drawing[drawing.length - 1], p = pos(ev); p.t = ev.timeStamp || e.timeStamp;
        if (Math.hypot(p.x - prev.x, p.y - prev.y) < 0.8) return;
        p.w = width(p, prev, ev); drawing.push(p);
        /* disegno solo l'ultimo pezzo (incrementale) */
        var K = k(); ix.setTransform(K, 0, 0, K, 0, 0); ix.lineCap = "round"; ix.lineJoin = "round"; ix.strokeStyle = css("--ink", "#222");
        var n2 = drawing.length, a = drawing[n2 - 2], b = drawing[n2 - 1];
        var m0 = n2 > 2 ? { x: (drawing[n2 - 3].x + a.x) / 2, y: (drawing[n2 - 3].y + a.y) / 2 } : { x: a.x, y: a.y };
        ix.lineWidth = (a.w + b.w) / 2; ix.beginPath(); ix.moveTo(m0.x, m0.y); ix.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2); ix.stroke();
      });
      e.preventDefault();
    });
    var up = function () { if (!drawing) return; drawing = null; refreshInfo(); assistDot(); };
    ink.addEventListener("pointerup", up); ink.addEventListener("pointercancel", up); ink.addEventListener("lostpointercapture", up);
    ink.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    function evaluate() {
      var list = S.cur === "all" ? chars.map(function (c, i) { return i; }) : [S.cur], parts = [], total = 0, cnt = 0, html = "";
      list.forEach(function (ci) {
        var box = S.cur === "all" ? { x: px * ci / n, y: 0, w: px / n, h: px } : null, ch = chars[ci], U;
        var strokes = S.cur === "all" ? S.strokes[0].filter(function (s) { var cx = s.reduce(function (a, p) { return a + p.x; }, 0) / s.length; return Math.floor(cx / (L / n)) === ci; }) : S.strokes[ci];
        if (!strokes.length) { parts.push({ ch: ch, empty: true }); return; }
        U = inkMask(ink, box);
        /* in "Tutti" ogni carattere vive in una cella: per confrontarlo lo si porta alla stessa scala del modello */
        var T = glyphMask(ch), cmp = compare(U, T), an = analyze(strokes);
        parts.push({ ch: ch, cmp: cmp, an: an, U: U, T: T }); total += cmp.score; cnt++;
      });
      if (!cnt) { res.hidden = false; res.className = "pad-res"; res.innerHTML = "<p>Scrivi qualcosa prima: poi ti dico come è andata.</p>"; return; }
      var avg = Math.round(total / cnt), lab = avg >= 85 ? "Ottimo tratto!" : avg >= 70 ? "Buono, ci sei quasi." : avg >= 50 ? "Si riconosce, ma si può migliorare." : "Ancora lontano: riprova con la guida attiva.";
      html += '<div class="pad-score ' + (avg >= 70 ? "ok" : "ko") + '"><b>Precisione: ' + avg + "%</b> — " + lab + "</div>";
      parts.forEach(function (p) {
        if (p.empty) { html += '<p class="small muted"><span class="han" lang="zh-CN">' + esc(p.ch) + "</span>: non scritto.</p>"; return; }
        if (parts.length > 1) html += '<p class="small"><span class="han" lang="zh-CN">' + esc(p.ch) + "</span> · " + p.cmp.score + "% (copertura " + Math.round(p.cmp.coverage * 100) + "%, pulizia " + Math.round(p.cmp.precision * 100) + "%)</p>";
      });
      var one = parts.filter(function (p) { return !p.empty; })[0];
      if (one) {
        var tp = tips(one.ch, one.U, one.T, one.cmp, one.an);
        html += (S.cur !== "all" ? '<p class="small muted" style="margin:6px 0 2px">Copertura ' + Math.round(one.cmp.coverage * 100) + "% · pulizia " + Math.round(one.cmp.precision * 100) + "% · " + one.an.strokes + " tratti</p>" : "") +
          '<ul class="pad-tips">' + tp.map(function (t) { return "<li>" + t + "</li>"; }).join("") + '</ul><p class="small muted">La direzione e l\'ordine sono controlli di buon senso sulle regole generali (non su un dizionario di tratti): le eccezioni esistono.</p>';
      }
      if (avg > 70) {
        var key = S.cur === "all" ? "*" : chars[S.cur];
        if (!S.awarded[key]) { S.awarded[key] = 1; if (CP.game && CP.game.xp) { CP.game.xp(5); html += '<p class="small" style="color:var(--accent)">+5 XP</p>'; } CP.sfx("ok"); }
      } else CP.sfx("tap");
      res.className = "pad-res"; res.innerHTML = html; res.hidden = false;
      if (res.scrollIntoView) res.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    el.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
      var pc = b.getAttribute("data-pc"), pa = b.getAttribute("data-pa");
      if (pc !== null) { S.cur = pc === "all" ? "all" : parseInt(pc, 10); res.hidden = true; CP.sfx("tap"); refreshAll(); }
      else if (pa === "undo") { strokesFor().pop(); paintInk(); refreshInfo(); assistDot(); res.hidden = true; CP.sfx("tap"); }
      else if (pa === "clear") { if (S.cur === "all") S.strokes[0] = []; else S.strokes[S.cur] = []; paintInk(); refreshInfo(); assistDot(); res.hidden = true; CP.sfx("tap"); }
      else if (pa === "guide") { S.guide = !S.guide; if (!S.guide) S.assist = false; CP.sfx("tap"); refreshAll(); }
      else if (pa === "assist") { S.assist = !S.assist; if (S.assist) S.guide = true; CP.sfx("tap"); refreshAll(); }
      else if (pa === "eval") evaluate();
    });
    /* il quadrato segue la larghezza: se cambia (rotazione, tastiera) ridisegno */
    var ro = window.ResizeObserver ? new ResizeObserver(function () { if (destroyed || !el.isConnected) return; var w = ink.getBoundingClientRect().width; if (w && Math.round(w * dpr) !== px) { setSize(); refreshAll(); } }) : null;
    function mount() { setSize(); refreshAll(); if (ro) ro.observe(ink); }
    return {
      el: el, mount: mount, score: evaluate,
      state: function () { return { cur: S.cur, strokes: S.strokes, guide: S.guide, assist: S.assist, awarded: S.awarded }; },
      setGuide: function (on) { S.guide = !!on; refreshAll(); },
      destroy: function () { destroyed = true; if (ro) ro.disconnect(); }
    };
  };
  /* compatibilità col vecchio nome */
  CP.initPad = null;
})();

