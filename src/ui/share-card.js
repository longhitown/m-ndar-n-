/* ===== màndarínō · le carte da condividere: un'immagine (canvas) che nasce sul telefono, senza server.
   Motore e modelli: CP.shareCard.templates, alimentati da un oggetto dati per corso.
   - «zh-day»: la carta del giorno del corso di cinese (1080×1350), identica a prima;
   - «zh-diary»: una pagina del Taccuino del viaggiatore (ui/diary.js), negli stessi tre formati e colori;
   - «it-day», «it-milestone», «it-week»: le carte del corso di italiano (testo in cinese), in tre formati (FORMATS) e tre
     colori (i temi dell'app), con il QR della pagina dell'app (MD_CONFIG.SHARE_URL, senza parametri), un nome facoltativo
     («署名», spento di base, solo sul telefono: cp-card-v1) e, se la persona l'ha scelto, il sigillo di gratitudine.
   Parola del giorno del cinese: la stessa del widget Android (lista delle parole viste, giorno dell'anno). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  /* CP.wotdPool e CP.wordOfDay (la parola del giorno, condivisa con il widget) stanno in pwa/widget.js: questo modulo si
     carica al primo uso di CP.shareCard (tools/build.mjs, LAZYMOD), e il tocco su [data-card-open] lo ascolta ui/settings.js */
  function css(v, fb) { return (getComputedStyle(document.documentElement).getPropertyValue(v) || fb).trim() || fb; }
  /* il mandarino del logo, dalla pagina (defs + simbolo), come immagine */
  function logoImg() {
    var svg = document.querySelector("h1.brand svg"); if (!svg) return Promise.resolve(null);
    var defs = svg.querySelector("defs"), sym = svg.querySelector("#mandarin-symbol"); if (!defs || !sym) return Promise.resolve(null);
    var src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="300 10 200 210" width="400" height="420">' + defs.outerHTML + sym.outerHTML.replace(/class="[^"]*"/g, "") + "</svg>";
    return new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src); });
  }
  /* il modello del corso di cinese: lo stesso disegno di prima ora, riga per riga (tools/e2e.mjs lo confronta con
     la copia fissa in tools/fixtures/share-card-v1.js) */
  function drawZh(cv) {
    var x = cv.getContext("2d"), W = 1080, H = 1350, r = CP.game.rank(), s = CP.game.streak(), c = CP.counts(), w = CP.wordOfDay();
    cv.width = W; cv.height = H;
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#FBF6EC"); g.addColorStop(1, "#EFE4D0"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", HAN = "'Noto Serif SC', 'Songti SC', 'SimSun', serif";
    return logoImg().then(function (logo) {
      if (logo) x.drawImage(logo, W / 2 - 110, 70, 220, 231);
      x.textAlign = "center"; x.fillStyle = "#1E2420"; x.font = "700 64px " + SANS; x.fillText("màndarínō", W / 2, 360);
      x.fillStyle = "#5E6A64"; x.font = "600 26px " + SANS; x.fillText(T("card.sub"), W / 2, 404);
      /* sigillo del grado */
      x.save(); x.translate(W / 2 - 300, 470); x.fillStyle = "#C8312B"; x.beginPath(); x.roundRect ? x.roundRect(0, 0, 150, 150, 22) : x.rect(0, 0, 150, 150); x.fill();
      x.fillStyle = "#FFF6EA"; x.font = "700 104px " + HAN; x.textBaseline = "middle"; x.fillText(r.ch, 75, 80); x.restore();
      x.textAlign = "left"; x.textBaseline = "alphabetic";
      x.fillStyle = "#5E6A64"; x.font = "600 26px " + SANS; x.fillText(T("path.rank").toUpperCase(), W / 2 - 120, 510);
      x.fillStyle = "#1E2420"; x.font = "700 44px " + SANS; x.fillText(r.name, W / 2 - 120, 565);
      x.fillStyle = "#14594A"; x.font = "600 30px " + SANS; x.fillText(r.xp + " XP", W / 2 - 120, 610);
      /* tre numeri */
      var stats = [["🔥 " + s, T(s === 1 ? "done.streak1" : "done.streakN")], [String(c[1] + c[2]), T("card.words")], [String(c[2]), T("study.known")]];
      stats.forEach(function (st, i) {
        var cx = 200 + i * 340; x.textAlign = "center";
        x.fillStyle = "#1E2420"; x.font = "800 72px " + SANS; x.fillText(st[0], cx, 770);
        x.fillStyle = "#5E6A64"; x.font = "600 26px " + SANS; x.fillText(st[1], cx, 812);
      });
      /* parola del giorno */
      x.fillStyle = "rgba(20,89,74,.08)"; x.beginPath(); x.roundRect ? x.roundRect(90, 870, W - 180, 360, 36) : x.rect(90, 870, W - 180, 360); x.fill();
      x.textAlign = "center"; x.fillStyle = "#14594A"; x.font = "700 26px " + SANS; x.fillText(T("card.wotd").toUpperCase(), W / 2, 920);
      if (w) {
        x.fillStyle = "#1E2420"; x.font = "500 136px " + HAN; x.fillText(w.hz, W / 2, 1058);
        x.fillStyle = "#14594A"; x.font = "600 44px " + SANS; x.fillText(w.py.replace(/\./g, ""), W / 2, 1140);
        x.fillStyle = "#5E6A64"; x.font = "500 34px " + SANS; x.fillText(CP.gloss(w).slice(0, 40), W / 2, 1192);
      }
      x.fillStyle = "#8A948F"; x.font = "500 24px " + SANS; x.fillText(T("card.foot"), W / 2, 1300);
      /* il sigillo di gratitudine, solo se la persona ha scelto di mostrarlo (ui/seals.js): rivela che ha sostenuto il
         progetto. Nessun «verificato»: da un'immagine nessuno può controllarlo */
      var sl = CP.seals && CP.seals.forShare && CP.seals.forShare();
      if (sl) { CP.seals.paint(x, sl.lvl, W - 196, H - 214, 150); x.textAlign = "center"; x.fillStyle = "#8A948F"; x.font = "600 20px " + SANS; x.fillText(T("seal.ed", { y: sl.year, n: sl.num }), W - 121, H - 40); }
      return cv;
    });
  }
  /* ---------------- corso di italiano ---------------- */
  /* formati: larghezza fissa, altezza dal rapporto. 3:4 è il predefinito per WeChat e 小红书; il rapporto è una costante
     da ricontrollare con le indicazioni delle piattaforme prima di fissarlo */
  var FORMATS = { "3:4": [1080, 1440], "4:5": [1080, 1350], "9:16": [1080, 1920] }, FORMAT_DEFAULT = "3:4";
  var THEMES = {
    light: { bg: ["#F7F9F7", "#E8EFEA"], ink: "#16201B", mute: "#4F5E56", accent: "#14594A", box: "rgba(20,89,74,.08)", seal: "#C8312B" },
    dark: { bg: ["#16201B", "#0C110F"], ink: "#EEF3EF", mute: "#A9B8B0", accent: "#5CC4A5", box: "rgba(92,196,165,.12)", seal: "#D2453C" },
    sepia: { bg: ["#FBF6EC", "#EFE4D0"], ink: "#1E2420", mute: "#5E6A64", accent: "#14594A", box: "rgba(20,89,74,.08)", seal: "#C8312B" }
  };
  var FALLBACK_URL = "https://github.com/longhitown/m-ndar-n-/releases/latest/download/mandarino.apk";
  function shareURL() { var u = window.MD_CONFIG && MD_CONFIG.SHARE_URL; return u || FALLBACK_URL; }
  var SANS = "system-ui, -apple-system, 'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', 'Segoe UI', Roboto, sans-serif";
  var SERIF = "'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif";
  var IT_SERIF = "'Iowan Old Style', Georgia, 'Noto Serif', 'Times New Roman', serif";
  /* testo che va a capo entro w; restituisce le righe. Se una parola sola non entra, si segna come «taglio» */
  function wrap(x, text, w, cut) {
    var cjk = (String(text).match(/[㐀-鿿]/g) || []).length, out = [], line = "", toks = cjk && cjk > String(text).replace(/\s/g, "").length * 0.4 ? Array.from(text) : String(text).split(/(\s+)/);
    toks.forEach(function (t) { var tryL = line + t; if (x.measureText(tryL.trim()).width > w && line.trim()) { out.push(line.trim()); line = t.trimStart ? t.trimStart() : t; } else line = tryL; });
    if (line.trim()) out.push(line.trim());
    out.forEach(function (l) { if (x.measureText(l).width > w + 1) cut.push(l); });
    return out;
  }
  function fit(x, text, w, cut) { if (x.measureText(text).width > w + 1) cut.push(text); }
  function roundRect(x, X, Y, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); }
  function qrPaint(x, text, X, Y, size) {
    var q = null; try { q = CP.qr && CP.qr.encode(text, "M"); } catch (e) { q = null; }
    if (!q) return false;
    var n = q.size + 8, s = Math.floor(size / n), real = s * n;
    x.fillStyle = "#FFFFFF"; roundRect(x, X - 10, Y - 10, real + 20, real + 20, 18); x.fill();
    x.fillStyle = "#000000";
    for (var yy = 0; yy < q.size; yy++) for (var xx = 0; xx < q.size; xx++) if (q.get(xx, yy)) x.fillRect(X + (xx + 4) * s, Y + (yy + 4) * s, s, s);
    return real;
  }
  function zhDate(d) { return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日"; }
  /* il piede della carta: data, nome facoltativo, QR a sinistra, sigillo di gratitudine a destra (solo se scelto) */
  function footer(x, cv, W, H, M, C, opt, data, cut, foot, scan) {
    var gap = function (n) { return Math.round(n * H / 1440); };
    var fy = H - gap(300), qs = Math.round(W * 0.22);
    var qr = qrPaint(x, shareURL(), M, fy + 10, qs);
    var tx = qr ? M + qr + 46 : M; x.textAlign = "left";
    x.fillStyle = C.ink; x.font = "700 34px " + SANS; x.fillText(zhDate(data.date || new Date()), tx, fy + 52);
    if (data.name) { x.fillStyle = C.ink; x.font = "600 32px " + SANS; x.fillText("—— " + data.name, tx, fy + 100); fit(x, "—— " + data.name, W - tx - 200, cut); }
    x.fillStyle = C.mute; x.font = "600 26px " + SANS; x.fillText("màndarínō", tx, fy + 160);
    x.font = "500 24px " + SANS; x.fillText(foot, tx, fy + 196); fit(x, foot, W - tx - (opt.seal ? 190 : 30), cut);
    if (qr) { x.font = "500 22px " + SANS; x.fillText(scan, tx, fy + 232); }
    var sl = opt.seal && CP.seals && CP.seals.forShare && CP.seals.forShare();
    if (sl) { CP.seals.paint(x, sl.lvl, W - 196, H - 214, 150); x.textAlign = "center"; x.fillStyle = C.mute; x.font = "600 20px " + SANS; x.fillText(T("seal.ed", { y: sl.year, n: sl.num }), W - 121, H - 40); }
    cv.__qr = !!qr;
  }
  /* dati: { rank, streak, words, lessons, total, phrase: { it, zh }, date, name?, milestone?, week? } (it/today.js) */
  function drawIt(cv, tpl, data, opt) {
    var F = FORMATS[opt.format] || FORMATS[FORMAT_DEFAULT], W = F[0], H = F[1], C = THEMES[opt.theme] || THEMES.light, x = cv.getContext("2d"), cut = [];
    cv.width = W; cv.height = H; cv.__cut = cut;
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.bg[0]); g.addColorStop(1, C.bg[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var k = H / 1440, M = 84, gap = function (n) { return Math.round(n * k); };
    return logoImg().then(function (logo) {
      var y = gap(64);
      if (logo) { x.drawImage(logo, W / 2 - 80, y, 160, 168); } y += 176;
      x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillStyle = C.ink; x.font = "700 60px " + SANS; x.fillText("màndarínō", W / 2, y + 44); y += 70;
      x.fillStyle = C.mute; x.font = "600 30px " + SANS; x.fillText(T("itcard.sub"), W / 2, y + 22); fit(x, T("itcard.sub"), W - 2 * M, cut); y += gap(66);
      /* titolo del modello: traguardo o settimana */
      var head = tpl === "it-milestone" && data.milestone ? data.milestone : tpl === "it-week" ? T("itcard.weekT") : "";
      if (head) { x.fillStyle = C.accent; x.font = "800 50px " + SANS; wrap(x, head, W - 2 * M, cut).slice(0, 2).forEach(function (l) { x.fillText(l, W / 2, y + 40); y += 62; }); y += gap(14); }
      /* sigillo e grado */
      var r = data.rank, sx = W / 2 - 300;
      x.save(); x.translate(sx, y); x.fillStyle = C.seal; roundRect(x, 0, 0, 140, 140, 22); x.fill();
      x.fillStyle = "#FFF6EA"; x.font = "700 96px " + SERIF; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(r.ch, 70, 76); x.restore();
      x.textAlign = "left"; x.textBaseline = "alphabetic";
      x.fillStyle = C.mute; x.font = "600 28px " + SANS; x.fillText(T("itcard.rank"), sx + 170, y + 38);
      x.fillStyle = C.ink; x.font = "700 46px " + SANS; x.fillText(r.name, sx + 170, y + 92); fit(x, r.name, W - sx - 170 - M, cut);
      x.fillStyle = C.accent; x.font = "600 30px " + SANS; x.fillText(T("itcard.points", { n: r.xp }), sx + 170, y + 132);
      y += 140 + gap(56);
      /* tre numeri */
      var nums = tpl === "it-week" && data.week
        ? [[String(data.week.days), T("itcard.wDays")], [String(data.week.words), T("itcard.wWords")], [String(data.week.lessons), T("itcard.wLessons")]]
        : [["🔥 " + data.streak, T("itcard.streak")], [String(data.words), T("itcard.words")], [data.lessons + "/" + data.total, T("itcard.lessons")]];
      nums.forEach(function (st, i) {
        var cx = W / 6 + i * W / 3; x.textAlign = "center";
        x.fillStyle = C.ink; x.font = "800 70px " + SANS; x.fillText(st[0], cx, y + 60); fit(x, st[0], W / 3 - 20, cut);
        x.fillStyle = C.mute; x.font = "600 28px " + SANS; x.fillText(st[1], cx, y + 104); fit(x, st[1], W / 3 - 20, cut);
      });
      y += 104 + gap(54);
      /* 今日意大利语: l'italiano in grande, la traduzione sotto */
      var bottom = H - gap(330), boxH = Math.max(260, bottom - y - gap(30));
      x.fillStyle = C.box; roundRect(x, M - 20, y, W - 2 * M + 40, boxH, 36); x.fill();
      x.textAlign = "center"; x.fillStyle = C.accent; x.font = "700 30px " + SANS; x.fillText(T("itcard.phrase"), W / 2, y + 54);
      var ph = data.phrase || { it: "", zh: "" }, size = 64, lines;
      for (; size >= 40; size -= 4) { x.font = "600 " + size + "px " + IT_SERIF; var c2 = []; lines = wrap(x, ph.it, W - 2 * M - 20, c2); if (lines.length <= 3 && !c2.length && lines.length * size * 1.25 + 120 < boxH - 70) break; }
      x.font = "600 " + size + "px " + IT_SERIF; lines = wrap(x, ph.it, W - 2 * M - 20, cut).slice(0, 3);
      var ty = y + 70 + Math.max(0, (boxH - 70 - lines.length * size * 1.25 - 70) / 2);
      x.fillStyle = C.ink; lines.forEach(function (l) { ty += size * 1.25; x.fillText(l, W / 2, ty - size * 0.25); });
      x.fillStyle = C.mute; x.font = "500 36px " + SANS; wrap(x, ph.zh, W - 2 * M - 20, cut).slice(0, 2).forEach(function (l) { ty += 54; x.fillText(l, W / 2, ty); });
      footer(x, cv, W, H, M, C, opt, data, cut, T("itcard.foot"), T("itcard.scan"));
      return cv;
    });
  }
  /* Taccuino del viaggiatore (corso di cinese): una pagina scritta a mano. Dati (ui/diary.js, shareData):
     { stop: { n, m, city }, route: [bool], text, pair: [{ hz, py }], words: [{ hz, py, it }], date, name } */
  var HAND = "'Bradley Hand', 'Segoe Print', 'Chalkboard SE', 'Noto Sans Handwriting', 'Comic Sans MS', 'Marker Felt', cursive";
  var KAI = "'Kaiti SC', 'STKaiti', 'KaiTi', 'Noto Serif SC', 'Songti SC', serif";
  function drawDiary(cv, data, opt) {
    var F = FORMATS[opt.format] || FORMATS[FORMAT_DEFAULT], W = F[0], H = F[1], C = THEMES[opt.theme] || THEMES.light, x = cv.getContext("2d"), cut = [];
    cv.width = W; cv.height = H; cv.__cut = cut;
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.bg[0]); g.addColorStop(1, C.bg[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var k = H / 1440, M = 84, gap = function (n) { return Math.round(n * k); }, zh = typeof LANG !== "undefined" && LANG === "zh";
    /* un bordo di carta, tratteggiato come una pagina di taccuino */
    x.save(); x.strokeStyle = C.mute; x.lineWidth = 3; x.setLineDash([2, 14]); x.lineCap = "round"; roundRect(x, 30, 30, W - 60, H - 60, 28); x.stroke(); x.restore();
    return logoImg().then(function (logo) {
      var y = gap(70);
      if (logo) x.drawImage(logo, W / 2 - 60, y, 120, 126); y += 132;
      x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillStyle = C.mute; x.font = "600 28px " + SANS; x.fillText("màndarínō", W / 2, y + 28); y += gap(56);
      x.fillStyle = C.accent; x.font = "700 62px " + (zh ? KAI : HAND); x.fillText(T("dcard.head"), W / 2, y + 52); fit(x, T("dcard.head"), W - 2 * M, cut); y += gap(84);
      x.fillStyle = C.ink; x.font = "700 40px " + (zh ? KAI : HAND); var pg = T("dcard.page", { n: data.stop.n, m: data.stop.m, c: data.stop.city }); x.fillText(pg, W / 2, y + 36); fit(x, pg, W - 2 * M, cut); y += gap(70);
      /* la strada: una città per punto, piena se raggiunta */
      var rt = data.route || [], n = rt.length, x0 = M + 20, x1 = W - M - 20, i, px = function (j) { return x0 + (x1 - x0) * j / Math.max(1, n - 1); };
      x.strokeStyle = C.mute; x.lineWidth = 3; x.lineCap = "round"; x.setLineDash([2, 10]);
      x.beginPath(); for (i = 0; i < n; i++) { var yy = y + (i % 2 ? 6 : -6); if (i) x.lineTo(px(i), yy); else x.moveTo(px(i), yy); } x.stroke(); x.setLineDash([]);
      for (i = 0; i < n; i++) { x.beginPath(); x.arc(px(i), y + (i % 2 ? 6 : -6), rt[i] ? 11 : 8, 0, Math.PI * 2); if (rt[i]) { x.fillStyle = C.seal; x.fill(); } else { x.lineWidth = 2.5; x.stroke(); } }
      y += gap(46);
      /* l'aneddoto */
      var wordsH = (data.words || []).length ? gap(150) : 0, pairH = (data.pair || []).length ? gap(190) : 0, bottom = H - gap(330), boxH = Math.max(300, bottom - y - wordsH - gap(20));
      x.fillStyle = C.box; roundRect(x, M - 20, y, W - 2 * M + 40, boxH, 36); x.fill();
      var size = 60, lines, fnt = zh ? KAI : HAND, inner = boxH - pairH - 60;
      for (; size >= 34; size -= 3) { x.font = "600 " + size + "px " + fnt; var c2 = []; lines = wrap(x, data.text || "", W - 2 * M - 40, c2); if (!c2.length && lines.length * size * 1.35 < inner) break; }
      x.font = "600 " + size + "px " + fnt; lines = wrap(x, data.text || "", W - 2 * M - 40, cut);
      var ty = y + 36 + Math.max(0, (inner - lines.length * size * 1.35) / 2); x.fillStyle = C.ink; x.textAlign = "center";
      lines.forEach(function (l) { ty += size * 1.35; x.fillText(l, W / 2, ty - size * 0.3); });
      /* la coppia scambiata */
      var pr = data.pair || [];
      if (pr.length) {
        var cw = Math.min(260, (W - 2 * M - 40) / pr.length), cx0 = W / 2 - cw * pr.length / 2, py0 = y + boxH - pairH + 10;
        pr.forEach(function (p, j) {
          var cx = cx0 + cw * (j + 0.5); x.textAlign = "center";
          x.fillStyle = C.ink; x.font = "500 78px " + SERIF; x.fillText(p.hz, cx, py0 + 74); fit(x, p.hz, cw, cut);
          x.fillStyle = C.accent; x.font = "600 34px " + SANS; x.fillText(p.py, cx, py0 + 122); fit(x, p.py, cw, cut);
        });
      }
      y += boxH + gap(24);
      /* le parole raccolte */
      if (wordsH) {
        x.textAlign = "center"; x.fillStyle = C.mute; x.font = "600 26px " + SANS; x.fillText(T("dcard.words"), W / 2, y + 20);
        var wl = data.words.map(function (w) { return w.hz + " " + w.py; }).join("  ·  "), fs = 36;
        for (; fs >= 24; fs -= 2) { x.font = "500 " + fs + "px " + SANS; if (x.measureText(wl).width <= W - 2 * M) break; }
        x.fillStyle = C.ink; x.fillText(wl, W / 2, y + 74); fit(x, wl, W - 2 * M, cut);
      }
      footer(x, cv, W, H, M, C, opt, data, cut, T("dcard.foot"), T("dcard.scan"));
      return cv;
    });
  }
  var TEMPLATES = {
    "zh-day": { course: "zh", draw: function (cv) { return drawZh(cv); } },
    "it-day": { course: "it", draw: function (cv, d, o) { return drawIt(cv, "it-day", d, o); } },
    "it-milestone": { course: "it", draw: function (cv, d, o) { return drawIt(cv, "it-milestone", d, o); } },
    "it-week": { course: "it", draw: function (cv, d, o) { return drawIt(cv, "it-week", d, o); } },
    "zh-diary": { course: "zh", ns: "dcard", draw: function (cv, d, o) { return drawDiary(cv, d, o); } }
  };
  function render(cv, tpl, data, opt) { var t = TEMPLATES[tpl] || TEMPLATES["zh-day"]; return t.draw(cv, data || {}, opt || {}); }

  function share(cv, name) {
    name = name || "mandarino-oggi.png"; var A = window.MandarinoAndroid;
    if (A && A.shareFile) { A.shareFile(name, "image/png", cv.toDataURL("image/png").split(",")[1]); return; }
    cv.toBlob(function (b) {
      var f = typeof File === "function" ? new File([b], name, { type: "image/png" }) : null;
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: "màndarínō" }).catch(function () {}); return; }
      var u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 1500);
    }, "image/png");
  }
  /* preferenze della carta (solo su questo telefono): formato, colore, nome facoltativo */
  var PK = "cp-card-v1";
  function prefs() { var o = {}; try { o = JSON.parse(localStorage.getItem(PK) || "{}") || {}; } catch (e) {} return { format: FORMATS[o.format] ? o.format : FORMAT_DEFAULT, theme: THEMES[o.theme] ? o.theme : "light", sign: !!o.sign, name: String(o.name || "").slice(0, 24) }; }
  function savePrefs(p) { try { localStorage.setItem(PK, JSON.stringify(p)); } catch (e) {} }
  var cur = null;   /* { tpl, data } della carta aperta nel foglio */
  function paintSheet() {
    var cv = document.querySelector(".card-cv"); if (!cv || !cur) return;
    var p = prefs(), d = Object.assign({}, cur.data, { name: p.sign && p.name ? p.name : "" });
    render(cv, cur.tpl, d, { format: p.format, theme: p.theme, seal: true }).then(function () { cv.setAttribute("aria-label", cur.ns === "dcard" ? T("dcard.alt", { n: (d.stop || {}).n, c: (d.stop || {}).city, p: d.text || "" }) : T("itcard.alt", { p: (d.phrase || {}).it || "", r: (d.rank || {}).name || "" })); });
  }
  function itSheet(tpl, data, ns) {
    ns = ns || "itcard"; cur = { tpl: tpl, data: data, ns: ns }; var p = prefs();
    var chip = function (attr, val, label, on) { return '<button type="button" data-' + attr + '="' + val + '" aria-pressed="' + (on ? "true" : "false") + '"' + (on ? ' class="on"' : "") + ">" + label + "</button>"; };
    CP.openSheet('<div class="fam-head"><div class="meta"><b>' + esc(T(ns + ".title")) + '</b><div class="small muted">' + esc(T(ns + ".privacy")) + '</div></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" +
      '<canvas class="card-cv it-card-cv" role="img" aria-label="' + CP.attr(T(ns + ".title")) + '"></canvas>' +
      '<div class="seg card-seg" role="group" aria-label="' + CP.attr(T(ns + ".format")) + '">' + Object.keys(FORMATS).map(function (f) { return chip("card-format", f, f, f === p.format); }).join("") + "</div>" +
      '<div class="seg card-seg" role="group" aria-label="' + CP.attr(T(ns + ".theme")) + '">' + ["light", "sepia", "dark"].map(function (t) { return chip("card-theme", t, T(ns + ".th." + t), t === p.theme); }).join("") + "</div>" +
      '<label class="chk"><input type="checkbox" id="card-sign"' + (p.sign ? " checked" : "") + "> " + esc(T(ns + ".sign")) + "</label>" +
      '<input type="text" id="card-name" maxlength="24" value="' + CP.attr(p.name) + '" placeholder="' + CP.attr(T(ns + ".namePh")) + '" aria-label="' + CP.attr(T(ns + ".sign")) + '"' + (p.sign ? "" : " hidden") + ">" +
      '<div class="acts"><button type="button" class="btn-main" data-card-share style="margin:0">' + esc(T(ns + ".share")) + "</button></div>");
    paintSheet();
  }
  function zhSheet() {
    cur = null;
    CP.openSheet('<div class="fam-head"><div class="meta"><b>' + esc(T("card.title")) + '</b></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + '</button></div>' +
      '<canvas class="card-cv" aria-label="' + CP.attr(T("card.title")) + '"></canvas><div class="acts"><button type="button" class="btn-main" data-card-share style="margin:0">📤 ' + esc(T("card.share")) + "</button></div>");
    var cv = document.querySelector(".card-cv"); drawZh(cv);
  }
  /* CP.shareCard(): la carta del giorno del corso aperto; CP.shareCard.open(modello, dati) per le altre */
  CP.shareCard = function () { if (CP.course && CP.course() === "it" && CP.itCardData) itSheet("it-day", CP.itCardData()); else zhSheet(); };
  CP.shareCard.open = function (tpl, data) {
    if (TEMPLATES[tpl] && TEMPLATES[tpl].ns) itSheet(tpl, data, TEMPLATES[tpl].ns);
    else if (TEMPLATES[tpl] && TEMPLATES[tpl].course === "it") itSheet(tpl, data || (CP.itCardData && CP.itCardData())); else zhSheet();
  };
  CP.shareCard.templates = TEMPLATES;
  CP.shareCard.render = render;
  CP.shareCard.FORMATS = FORMATS; CP.shareCard.THEMES = THEMES; CP.shareCard.url = shareURL; CP.shareCard.sharePNG = share;
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-card-share], [data-card-format], [data-card-theme]") : null; if (!b) return;
    if (b.hasAttribute("data-card-format") || b.hasAttribute("data-card-theme")) {
      var p = prefs(); if (b.hasAttribute("data-card-format")) p.format = b.getAttribute("data-card-format"); else p.theme = b.getAttribute("data-card-theme");
      savePrefs(p); Array.prototype.forEach.call(b.parentNode.children, function (c) { var on = c === b; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      CP.sfx("tap"); paintSheet(); return;
    }
    var cv = document.querySelector(".card-cv"); if (cv) share(cv, cur ? "mandarino-" + cur.tpl + ".png" : null);
  });
  document.addEventListener("change", function (e) {
    if (!e.target || e.target.id !== "card-sign") return;
    var p = prefs(); p.sign = e.target.checked; savePrefs(p);
    var n = document.getElementById("card-name"); if (n) { n.hidden = !p.sign; if (p.sign) n.focus(); }
    paintSheet();
  });
  document.addEventListener("input", function (e) {
    if (!e.target || e.target.id !== "card-name") return;
    var p = prefs(); p.name = e.target.value.slice(0, 24); savePrefs(p); paintSheet();
  });
})();
