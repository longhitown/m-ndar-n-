/* ===== màndarínō · pacchetto classe per chi insegna, senza server (Task 9.2), in tutti e due i corsi.
   - Chi insegna sceglie un tratto del Percorso (tappe del corso di cinese, lezioni del corso di italiano), un obiettivo
     (la percentuale da completare) e una data: ne esce un codice MDK1-… (base64url del JSON), un file .json con lo stesso
     contenuto e un foglio da stampare (PNG A4) con due QR, uno verso l'app (lo stesso della carta da condividere) e uno con
     il pacchetto da inquadrare nell'app.
   - Chi studia lo importa (file, codice incollato o QR) e vede a che punto è. I pacchetti stanno in cp-class-v1
     ({ p: { id: pacchetto }, x: { id: quando è stato tolto } }; nell'unione tra dispositivi si sommano, chi è tolto resta tolto).
   - Il riepilogo per l'insegnante: solo conteggi (parole o lezioni del pacchetto fatte, obiettivo raggiunto sì/no, giorni di
     studio negli ultimi 30, data), nessun registro dei ripassi. Si crea solo dopo una spunta esplicita; il nome è facoltativo
     e finisce soltanto nel file. Chi insegna li legge tutti insieme in una tabella (i file non vengono salvati).
   Modulo caricato al primo uso di CP.classroom (tools/build.mjs, LAZYMOD); l'avvio passa da ui/together.js. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, attr = CP.attr;
  var K = "cp-class-v1", PREFIX = "MDK1-", GOALS = [50, 80, 100], GOAL_DEFAULT = 80, SHOW_PAST_DAYS = 14, TITLE_MAX = 40;
  var IT = CP.course && CP.course() === "it";

  /* ---- unità del Percorso del corso aperto: [{ id, n, title }] ---- */
  function units(c) {
    if (c === "it") return CP.itApi ? CP.itApi.lessons().map(function (l) { return { id: l.id, n: l.n, title: l.title }; }) : [];
    return CP.SEC.map(function (s, i) { return { id: s.id, n: i + 1, title: s.title.replace(/^\d+\.\s*/, "") }; });
  }
  function slice(p) {
    var U = units(p.c), a = -1, b = -1;
    U.forEach(function (u, i) { if (u.id === p.s) a = i; if (u.id === p.e) b = i; });
    if (a < 0 && b < 0) return [];
    if (a < 0) a = b; if (b < 0) b = a; if (a > b) { var t = a; a = b; b = t; }
    return U.slice(a, b + 1);
  }
  function progress(p) {
    var U = slice(p), n = 0, done = 0, known = 0;
    if (p.c === "it") {
      var P = CP.itApi ? CP.itApi.progress() : {}, PASS = CP.itApi ? CP.itApi.PASS : 80;
      U.forEach(function (u) { n++; var x = P[u.id] || {}; if (x.done || (x.best || 0) >= PASS) done++; });
    } else {
      var ids = {}; U.forEach(function (u) { ids[u.id] = 1; });
      CP.ORDER.forEach(function (k) { if (!ids[CP.WORDS[k].sec]) return; n++; var s = CP.state(k); if (s >= 1) done++; if (s === 2) known++; });
    }
    var pct = n ? Math.round(done / n * 100) : 0;
    return { units: U, n: n, done: done, known: known, pct: pct, met: n > 0 && pct >= (p.g || GOAL_DEFAULT) };
  }
  function days30() {
    var D = CP.game && CP.game.days ? CP.game.days() : {}, lim = new Date(); lim.setDate(lim.getDate() - 30);
    var from = lim.getFullYear() + "-" + ("0" + (lim.getMonth() + 1)).slice(-2) + "-" + ("0" + lim.getDate()).slice(-2);
    return Object.keys(D).filter(function (d) { var r = D[d] || {}; return d > from && ((r.w && r.w.length) || r.s || r.e); }).length;
  }
  function todayISO() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function daysLeft(iso) { if (!iso) return null; var a = new Date(iso + "T00:00:00"), b = new Date(todayISO() + "T00:00:00"); return Math.round((a - b) / 86400000); }
  function fmtDate(iso) { try { return new Date(iso + "T12:00:00").toLocaleDateString(IT ? "zh-CN" : "it-IT", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return iso; } }

  /* ---- codice e file ---- */
  function b64u(s) { var b = new TextEncoder().encode(s), bin = ""; for (var i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]); return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64u(s) { var bin = atob(s.replace(/-/g, "+").replace(/_/g, "/")), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); }
  function clean(o) {
    if (!o || typeof o !== "object") return null;
    var p = { id: String(o.id || "").slice(0, 16), c: o.c === "it" ? "it" : "zh", t: String(o.t || "").slice(0, TITLE_MAX), s: String(o.s || ""), e: String(o.e || ""), g: GOALS.indexOf(+o.g) >= 0 ? +o.g : GOAL_DEFAULT, d: /^\d{4}-\d{2}-\d{2}$/.test(o.d || "") ? o.d : "" };
    return p.id && p.t && (p.s || p.e) ? p : null;
  }
  function encode(p) { return PREFIX + b64u(JSON.stringify({ id: p.id, c: p.c, t: p.t, s: p.s, e: p.e, g: p.g, d: p.d })); }
  /* da un testo qualsiasi (codice, messaggio, QR, contenuto del file .json) il pacchetto, oppure null */
  function decode(text) {
    text = String(text || "");
    var m = /MDK1-([A-Za-z0-9_-]{8,})/.exec(text);
    try { if (m) return clean(JSON.parse(unb64u(m[1]))); } catch (e) {}
    try { var o = JSON.parse(text); if (o && o.app === "mandarino" && o.kind === "class") return clean(o); } catch (e) {}
    return null;
  }
  /* il link …#classe=MDK1-… dove c'è un indirizzo web dell'app, altrimenti il codice da solo */
  function linkOf(p) { var b = CP.challenge && CP.challenge.base ? CP.challenge.base() : ""; return b ? b + "#classe=" + encode(p) : encode(p); }
  function fileJSON(p) { return JSON.stringify({ app: "mandarino", kind: "class", v: 1, id: p.id, c: p.c, t: p.t, s: p.s, e: p.e, g: p.g, d: p.d, code: encode(p) }, null, 2); }
  function fileName(base) { return "mandarino-" + String(base).toLowerCase().replace(/[^a-z0-9一-鿿]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) + ".json"; }

  /* ---- dati sul dispositivo ---- */
  function load() { try { var o = JSON.parse(localStorage.getItem(K) || "null"); return o && typeof o === "object" ? { p: o.p || {}, x: o.x || {} } : { p: {}, x: {} }; } catch (e) { return { p: {}, x: {} }; } }
  function save(o) { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} if (window.Store && Store.flush) Store.flush(); }
  function list() { var o = load(); return Object.keys(o.p).filter(function (id) { return !o.x[id] && o.p[id].c === (IT ? "it" : "zh"); }).map(function (id) { return o.p[id]; }).sort(function (a, b) { return (a.d || "9") < (b.d || "9") ? -1 : 1; }); }
  function add(p) {
    var o = load();
    if (p.c !== (IT ? "it" : "zh")) { CP.toast(T("cls.other")); return false; }
    if (o.p[p.id] && !o.x[p.id]) { CP.toast(T("cls.dup")); return true; }
    p.at = Date.now(); o.p[p.id] = p; delete o.x[p.id]; save(o);
    CP.toast(T("cls.imported", { t: p.t })); repaint(); return true;
  }
  function remove(id) { var o = load(); o.x[id] = Date.now(); save(o); CP.toast(T("cls.removed")); repaint(); }
  function repaint() { if (CP.repaintSettings && document.getElementById("set-together")) CP.repaintSettings(); }

  /* ---- vista per chi studia ---- */
  function rangeText(p, U) {
    U = U || slice(p); if (!U.length) return "";
    var a = U[0], b = U[U.length - 1];
    return T(p.c === "it" ? "cls.rangeIt" : "cls.rangeZh", { a: a.n, b: b.n }) + " · " + a.title + (U.length > 1 ? " → " + b.title : "");
  }
  function dueText(p) { var n = daysLeft(p.d); return n == null ? "" : n > 0 ? T("cls.left", { n: n }) : n === 0 ? T("cls.today") : T("cls.past"); }
  function cardHTML(p) {
    var g = progress(p);
    return '<div class="cls-card"><b>' + esc(p.t) + '</b><div class="small muted">' + esc(rangeText(p, g.units)) + "</div>" +
      '<div class="small">' + esc(p.d ? T("cls.goal", { p: p.g, d: fmtDate(p.d) }) : T("cls.goalNo", { p: p.g })) + (p.d ? " · " + esc(dueText(p)) : "") + "</div>" +
      '<div class="mini" role="progressbar" aria-valuenow="' + g.pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + attr(p.t) + '"><i style="width:' + g.pct + '%"></i></div>' +
      '<div class="small">' + esc(T(p.c === "it" ? "cls.progIt" : "cls.progZh", { s: g.done, n: g.n, p: g.pct })) + (g.met ? ' <span class="okline">' + esc(T("cls.met")) + "</span>" : "") + "</div>" +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-cls-go="' + attr(p.id) + '">' + esc(T("cls.go")) + '</button><button type="button" class="btn-s" data-cls-report="' + attr(p.id) + '">' + esc(T("cls.report")) + '</button><button type="button" class="btn-s" data-cls-rm="' + attr(p.id) + '">' + esc(T("cls.remove")) + "</button></div></div>";
  }
  /* il primo pacchetto ancora in corso, in cima al Percorso (o alle lezioni del corso di italiano) */
  function banner() {
    var l = list().filter(function (p) { var n = daysLeft(p.d); return n == null || n >= -SHOW_PAST_DAYS; });
    if (!l.length) return "";
    var p = l[0], g = progress(p);
    return '<button type="button" class="panel cls-banner" data-cls-settings><span aria-hidden="true">👩‍🏫</span><span><b>' + esc(T("cls.banner", { t: p.t })) + "</b><small>" + esc(T(p.c === "it" ? "cls.progIt" : "cls.progZh", { s: g.done, n: g.n, p: g.pct })) + (p.d ? " · " + esc(dueText(p)) : "") + "</small></span></button>";
  }
  function goTo(p) {
    var g = progress(p), U = g.units; if (!U.length) return;
    var target = U[0];
    if (p.c === "it") {
      var P = CP.itApi.progress(), PASS = CP.itApi.PASS;
      target = U.filter(function (u) { var x = P[u.id] || {}; return !(x.done || (x.best || 0) >= PASS); })[0] || U[0];
      if (CP.closeSheet) CP.closeSheet(); var s = document.getElementById("settings"); if (s && CP.untrap) CP.untrap(s);
      CP.itApi.open(target.id); window.scrollTo(0, 0); return;
    }
    var ids = {}; U.forEach(function (u) { ids[u.id] = 1; });
    var first = CP.ORDER.filter(function (k) { return ids[CP.WORDS[k].sec] && CP.state(k) < 1; })[0];
    if (first) target = U.filter(function (u) { return u.id === CP.WORDS[first].sec; })[0] || U[0];
    var st = document.getElementById("settings"); if (st && CP.untrap) CP.untrap(st);
    if (CP.pathOpen) CP.pathOpen(target.id);
  }

  /* ---- riepilogo per l'insegnante (con consenso) ---- */
  var repFor = null;
  function reportSheet(p) {
    repFor = p; var g = progress(p);
    CP.openSheet('<div class="fam-head"><div class="meta"><b>' + esc(T("cls.repHead")) + '</b><div class="small muted">' + esc(p.t) + '</div></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" +
      '<p class="small">' + esc(T("cls.repWhat")) + "</p>" +
      '<div class="cls-card small"><div>' + esc(T(p.c === "it" ? "cls.progIt" : "cls.progZh", { s: g.done, n: g.n, p: g.pct })) + "</div><div>" + esc(T("cls.colDays")) + ": " + days30() + "</div></div>" +
      '<label class="small" style="display:grid;gap:4px">' + esc(T("cls.repName")) + '<input type="text" id="cls-rep-name" maxlength="40" autocomplete="off"></label>' +
      '<label class="chk"><input type="checkbox" id="cls-consent"> ' + esc(T("cls.consent")) + "</label>" +
      '<div class="acts"><button type="button" class="btn-main" data-cls-rep-dl disabled style="margin:0">' + esc(T("cls.repDl")) + '</button><button type="button" class="btn-s" data-cls-rep-share disabled>' + esc(T("cls.repShare")) + "</button></div>");
  }
  function report(p, name) {
    var g = progress(p);
    return { app: "mandarino", kind: "class-report", v: 1, pkg: { id: p.id, c: p.c, t: p.t, s: p.s, e: p.e, g: p.g, d: p.d }, name: String(name || "").trim().slice(0, 40), date: todayISO(), n: g.n, done: g.done, pct: g.pct, met: g.met, days30: days30(), version: CP.VERSION || "" };
  }
  function reportText(r) {
    return T("cls.repText", { t: r.pkg.t, done: T(r.pkg.c === "it" ? "cls.progIt" : "cls.progZh", { s: r.done, n: r.n, p: r.pct }), g: T(r.met ? "cls.yes" : "cls.no"), d: r.days30, date: r.date }) + (r.name ? " — " + r.name : "");
  }
  function readReports(files) {
    var rows = [], left = files.length;
    if (!left) return;
    Array.prototype.forEach.call(files, function (f) {
      var rd = new FileReader();
      rd.onload = function () { try { var o = JSON.parse(rd.result); if (o && o.app === "mandarino" && o.kind === "class-report" && o.pkg) rows.push(o); } catch (e) {} if (!--left) table(rows); };
      rd.onerror = function () { if (!--left) table(rows); };
      rd.readAsText(f);
    });
  }
  function table(rows) {
    rows.sort(function (a, b) { return String(a.name || "").localeCompare(String(b.name || "")); });
    var h = rows.length ? '<div class="cls-table-w"><table class="cls-table"><thead><tr><th>' + esc(T("cls.colName")) + "</th><th>" + esc(T("cls.title")) + "</th><th>" + esc(T("cls.colDone")) + "</th><th>" + esc(T("cls.goalL")) + "</th><th>" + esc(T("cls.colDays")) + "</th><th>" + esc(T("cls.colDate")) + "</th></tr></thead><tbody>" +
      rows.map(function (r) { return "<tr><td>" + esc(r.name || T("cls.anon")) + "</td><td>" + esc(r.pkg.t) + "</td><td>" + (+r.done || 0) + "/" + (+r.n || 0) + " (" + (+r.pct || 0) + "%)</td><td>" + (r.met ? "✓ " : "· ") + esc(T(r.met ? "cls.yes" : "cls.no")) + "</td><td>" + (+r.days30 || 0) + "</td><td>" + esc(String(r.date || "")) + "</td></tr>"; }).join("") + "</tbody></table></div>"
      : '<p role="alert">' + esc(T("cls.repNone")) + "</p>";
    CP.openSheet('<div class="fam-head"><div class="meta"><b>' + esc(T("cls.repTitle")) + '</b></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" + h);
  }

  /* ---- per chi insegna: il modulo ---- */
  function formValues() {
    var v = function (id) { var el = document.getElementById(id); return el ? el.value : ""; };
    var p = clean({ id: Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 6), c: IT ? "it" : "zh", t: v("cls-t").trim() || T("cls.namePh"), s: v("cls-s"), e: v("cls-e"), g: +v("cls-g"), d: v("cls-d") });
    return p;
  }
  function teachHTML() {
    var U = units(IT ? "it" : "zh"), opts = function (sel) { return U.map(function (u, i) { return '<option value="' + attr(u.id) + '"' + (i === sel ? " selected" : "") + ">" + u.n + ". " + esc(u.title) + "</option>"; }).join(""); };
    return '<details class="cls-teach"><summary>' + esc(T("cls.teach")) + "</summary>" +
      '<p class="small muted">' + esc(T("cls.intro")) + "</p>" +
      '<label class="small" style="display:grid;gap:4px">' + esc(T("cls.name")) + '<input type="text" id="cls-t" maxlength="' + TITLE_MAX + '" placeholder="' + attr(T("cls.namePh")) + '"></label>' +
      '<div class="cls-row"><label class="small">' + esc(T("cls.from")) + '<select id="cls-s">' + opts(0) + '</select></label><label class="small">' + esc(T("cls.to")) + '<select id="cls-e">' + opts(Math.min(4, U.length - 1)) + "</select></label></div>" +
      '<div class="cls-row"><label class="small">' + esc(T("cls.goalL")) + '<select id="cls-g">' + GOALS.map(function (g) { return '<option value="' + g + '"' + (g === GOAL_DEFAULT ? " selected" : "") + ">" + g + "%</option>"; }).join("") + '</select></label><label class="small">' + esc(T("cls.due")) + '<input type="date" id="cls-d"></label></div>' +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-cls-dl>' + esc(T("cls.dl")) + '</button><button type="button" class="btn-s" data-cls-print>' + esc(T("cls.print")) + '</button><button type="button" class="btn-s" data-cls-send>' + esc(T("cls.shareCode")) + "</button></div>" +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-cls-reports>' + esc(T("cls.reports")) + '</button><input type="file" id="cls-reports" accept="application/json,.json" multiple hidden></div></details>';
  }
  function section() {
    var l = list();
    return '<details class="set-sec" id="set-together"><summary>' + esc(T("tog.title")) + '</summary><div class="vbody">' +
      '<h4 class="cls-h">' + esc(T("chal.title")) + '</h4><p class="small muted" style="margin:0">' + esc(T("chal.intro")) + "</p>" +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-chal-open>' + esc(T("chal.new")) + "</button></div>" +
      '<label class="small" style="display:grid;gap:4px">' + esc(T("chal.paste")) + '<input type="text" id="tog-code" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="MDC1-… / MDK1-…" data-noi18n></label>' +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-tog-try>' + esc(T("chal.go")) + '</button><button type="button" class="btn-s" data-tog-scan>📷 ' + esc(T("chal.scan")) + "</button></div>" +
      '<h4 class="cls-h" id="set-class">' + esc(T("cls.title")) + "</h4>" +
      (l.length ? l.map(cardHTML).join("") : '<p class="small muted" style="margin:0">' + esc(T("cls.empty")) + "</p>") +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-cls-import>' + esc(T("cls.import")) + '</button><input type="file" id="cls-file" accept="application/json,.json,.txt" hidden></div>' +
      teachHTML() + "</div></details>";
  }

  /* ---- foglio da stampare: PNG A4 (150 dpi), con il QR dell'app e quello del pacchetto ---- */
  var W = 1240, H = 1754, SANS = "system-ui, -apple-system, 'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', 'Segoe UI', Roboto, sans-serif";
  function wrapLines(x, text, w) {
    var toks = /[一-鿿]/.test(text) ? Array.from(text) : String(text).split(/(\s+)/), out = [], line = "";
    toks.forEach(function (t) { var n = line + t; if (x.measureText(n).width > w && line.trim()) { out.push(line.trim()); line = t.trim() ? t : ""; } else line = n; });
    if (line.trim()) out.push(line.trim());
    return out;
  }
  function qrAt(x, text, X, Y, S) {
    var q = CP.qr.encode(text, "M"), n = q.size + 8, s = S / n;
    x.fillStyle = "#fff"; x.fillRect(X, Y, S, S); x.fillStyle = "#000";
    for (var yy = 0; yy < q.size; yy++) for (var xx = 0; xx < q.size; xx++) if (q.get(xx, yy)) x.fillRect(Math.floor(X + (xx + 4) * s), Math.floor(Y + (yy + 4) * s), Math.ceil(s), Math.ceil(s));
  }
  function sheet(cv, p) {
    cv.width = W; cv.height = H; var x = cv.getContext("2d"), y = 120, M = 110;
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#B8322A"; x.fillRect(0, 0, W, 18);
    x.textBaseline = "alphabetic"; x.fillStyle = "#6b5d4a"; x.font = "600 34px " + SANS; x.fillText("màndarínō", M, y);
    y += 90; x.fillStyle = "#1d1a16"; x.font = "800 68px " + SANS;
    wrapLines(x, p.t, W - 2 * M).slice(0, 2).forEach(function (l) { x.fillText(l, M, y); y += 84; });
    x.font = "500 34px " + SANS; x.fillStyle = "#3d352b";
    wrapLines(x, rangeText(p), W - 2 * M).slice(0, 3).forEach(function (l) { x.fillText(l, M, y); y += 48; });
    y += 6; x.fillText(p.d ? T("cls.goal", { p: p.g, d: fmtDate(p.d) }) : T("cls.goalNo", { p: p.g }), M, y);
    var S = 460, top = y + 100, gap = W - 2 * M - 2 * S;
    [[CP.shareCard ? CP.shareCard.url() : "", T("cls.sh1")], [linkOf(p), T("cls.sh2")]].forEach(function (c, i) {
      var X = M + i * (S + gap);
      if (c[0]) qrAt(x, c[0], X, top, S);
      x.fillStyle = "#1d1a16"; x.font = "700 32px " + SANS;
      wrapLines(x, c[1], S).slice(0, 3).forEach(function (l, j) { x.fillText(l, X, top + S + 56 + j * 42); });
    });
    x.fillStyle = "#6b5d4a"; x.font = "400 28px " + SANS; var fy = top + S + 56 + 3 * 42 + 50;
    wrapLines(x, T("cls.shFoot"), W - 2 * M).slice(0, 3).forEach(function (l) { x.fillText(l, M, fy); fy += 40; });
    x.font = "400 20px ui-monospace, Menlo, Consolas, monospace"; x.fillStyle = "#8a7d6a";
    var code = encode(p), per = 80; for (var i = 0, cy = H - 70; i < code.length && cy < H - 10; i += per, cy += 26) x.fillText(code.slice(i, i + per), M, cy);
    return cv;
  }

  /* ---- eventi ---- */
  function byId(id) { return load().p[id]; }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-cls-go], [data-cls-report], [data-cls-rm], [data-cls-import], [data-cls-dl], [data-cls-print], [data-cls-send], [data-cls-reports], [data-cls-rep-dl], [data-cls-rep-share]") : null; if (!b) return;
    CP.sfx("tap");
    if (b.hasAttribute("data-cls-go")) { var p = byId(b.getAttribute("data-cls-go")); if (p) goTo(p); }
    else if (b.hasAttribute("data-cls-report")) { var q = byId(b.getAttribute("data-cls-report")); if (q) { var st = document.getElementById("settings"); if (st && CP.untrap) CP.untrap(st); reportSheet(q); } }
    else if (b.hasAttribute("data-cls-rm")) remove(b.getAttribute("data-cls-rm"));
    else if (b.hasAttribute("data-cls-import")) { var f = document.getElementById("cls-file"); if (f) f.click(); }
    else if (b.hasAttribute("data-cls-reports")) { var r = document.getElementById("cls-reports"); if (r) r.click(); }
    else if (b.hasAttribute("data-cls-dl")) { var p1 = formValues(); if (p1) Store.download(fileName(p1.t), fileJSON(p1), "application/json"); }
    else if (b.hasAttribute("data-cls-print")) { var p2 = formValues(); if (p2 && CP.shareCard && CP.shareCard.sharePNG) CP.shareCard.sharePNG(sheet(document.createElement("canvas"), p2), fileName(p2.t).replace(/\.json$/, ".png")); }
    else if (b.hasAttribute("data-cls-send")) { var p3 = formValues(); if (p3) { var txt = T("cls.msg", { t: p3.t }) + "\n" + linkOf(p3); if (navigator.share) navigator.share({ title: "màndarínō", text: txt }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { CP.toast(T("chal.copied")); }, function () {}); } }
    else if (b.hasAttribute("data-cls-rep-dl") && repFor) { var nm = (document.getElementById("cls-rep-name") || {}).value || "", rep = report(repFor, nm); Store.download(fileName("riepilogo-" + (rep.name || "") + "-" + repFor.t), JSON.stringify(rep, null, 2), "application/json"); }
    else if (b.hasAttribute("data-cls-rep-share") && repFor) { var r2 = report(repFor, (document.getElementById("cls-rep-name") || {}).value || ""), t2 = reportText(r2); if (navigator.share) navigator.share({ title: "màndarínō", text: t2 }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(t2).then(function () { CP.toast(T("chal.copied")); }, function () {}); }
  });
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t) return;
    if (t.id === "cls-consent") Array.prototype.forEach.call(document.querySelectorAll("[data-cls-rep-dl], [data-cls-rep-share]"), function (b) { b.disabled = !t.checked; });
    else if (t.id === "cls-file" && t.files && t.files[0]) { var rd = new FileReader(); rd.onload = function () { var p = decode(rd.result); if (p) add(p); else CP.toast(T("cls.bad")); t.value = ""; }; rd.readAsText(t.files[0]); }
    else if (t.id === "cls-reports" && t.files && t.files.length) { var st = document.getElementById("settings"); if (st && CP.untrap) CP.untrap(st); readReports(t.files); t.value = ""; }
  });

  CP.classroom = {
    section: section, banner: banner, list: list, add: add, remove: remove, progress: progress, report: report, reportText: reportText,
    encode: encode, decode: decode, link: linkOf, fileJSON: fileJSON, sheet: sheet, units: units, table: table, PREFIX: PREFIX
  };
})();
