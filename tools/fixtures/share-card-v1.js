/* COPIA FISSA di src/ui/share-card.js prima del Task 11 (commit fbbbe3a): serve solo a tools/e2e.mjs per controllare che la
   carta del corso di cinese resti identica dopo il passaggio ai modelli (CP.shareCard.templates). Non va nell'app. */
/* ===== màndarínō · la card del giorno: un'immagine (canvas, 1080×1350) con il sigillo del grado, la serie di giorni,
   le parole imparate e la parola del giorno, da condividere (WeChat, WhatsApp, Instagram…). Nessun server: l'immagine
   nasce sul telefono. Parola del giorno: la stessa del widget Android (lista delle parole viste, giorno dell'anno). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  CP.wotdPool = function () {
    var seen = [], next = [];
    CP.ORDER.forEach(function (k) { (CP.state(k) ? seen : next).push(CP.WORDS[k]); });
    return (seen.length >= 30 ? seen : seen.concat(next.slice(0, 366 - seen.length))).slice(0, 366);
  };
  CP.wordOfDay = function () {
    var p = CP.wotdPool(), d = new Date(), y = d.getFullYear(), doy = Math.round((Date.UTC(y, d.getMonth(), d.getDate()) - Date.UTC(y, 0, 0)) / 864e5);
    return p.length ? p[(y * 366 + doy) % p.length] : null;
  };
  function css(v, fb) { return (getComputedStyle(document.documentElement).getPropertyValue(v) || fb).trim() || fb; }
  /* il mandarino del logo, dalla pagina (defs + simbolo), come immagine */
  function logoImg() {
    var svg = document.querySelector("h1.brand svg"); if (!svg) return Promise.resolve(null);
    var defs = svg.querySelector("defs"), sym = svg.querySelector("#mandarin-symbol"); if (!defs || !sym) return Promise.resolve(null);
    var src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="300 10 200 210" width="400" height="420">' + defs.outerHTML + sym.outerHTML.replace(/class="[^"]*"/g, "") + "</svg>";
    return new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src); });
  }
  function draw(cv) {
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
  function share(cv) {
    var name = "mandarino-oggi.png", A = window.MandarinoAndroid;
    if (A && A.shareFile) { A.shareFile(name, "image/png", cv.toDataURL("image/png").split(",")[1]); return; }
    cv.toBlob(function (b) {
      var f = typeof File === "function" ? new File([b], name, { type: "image/png" }) : null;
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: "màndarínō" }).catch(function () {}); return; }
      var u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 1500);
    }, "image/png");
  }
  CP.shareCard = function () {
    CP.openSheet('<div class="fam-head"><div class="meta"><b>' + esc(T("card.title")) + '</b></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + '</button></div>' +
      '<canvas class="card-cv" aria-label="' + CP.attr(T("card.title")) + '"></canvas><div class="acts"><button type="button" class="btn-main" data-card-share style="margin:0">📤 ' + esc(T("card.share")) + "</button></div>");
    var cv = document.querySelector(".card-cv"); draw(cv);
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-card-share], [data-card-open]") : null; if (!b) return;
    if (b.hasAttribute("data-card-open")) { CP.sfx("tap"); CP.shareCard(); return; }
    var cv = document.querySelector(".card-cv"); if (cv) share(cv);
  });
})();
