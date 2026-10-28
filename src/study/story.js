/* ===== màndarínō · il racconto dei progressi, per i due corsi, dai dati che ci sono già:
   - giorni attivi e parole studiate per settimana: i giorni del cammino (cp-game-v1 / cp-it-game-v1, CP.game.days);
   - corso di cinese: ripassi riusciti dal registro (Store.logAll: [ora, chiave, voto 1-4, ms, tipo, previsione, ripetizione]),
     parole sicure (CP.state = 2) e il tono più sbagliato nelle parole mancate negli ultimi 60 giorni;
   - corso di italiano: lezioni superate per settimana (cp-it-lessons-v1, done = prima volta) e parole sicure (FSRS).
   Un riepilogo gentile della settimana, mai colpevolizzante. Niente esce dal telefono. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, DAY = 86400000, WEEKS = 6;
  function lget(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function monday(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); }
  function parseDay(k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).getTime(); }
  /* le ultime WEEKS settimane, dalla più vecchia: { t, days, words, good, lessons } */
  function weeks(course, log) {
    var now = monday(Date.now()), out = [];
    for (var i = WEEKS - 1; i >= 0; i--) { var t = new Date(now); t.setDate(t.getDate() - 7 * i); out.push({ t: t.getTime(), days: 0, words: 0, good: 0, lessons: 0 }); }
    function slot(t) { var m = monday(t); for (var j = 0; j < out.length; j++) if (out[j].t === m) return out[j]; return null; }
    var D = CP.game ? CP.game.days() : {};
    Object.keys(D).forEach(function (k) { var r = D[k], w = slot(parseDay(k)); if (!w || !r) return; if ((r.w && r.w.length) || r.s || r.e) w.days++; w.words += r.w ? r.w.length : 0; });
    if (course === "it") { var L = lget("cp-it-lessons-v1") || {}; Object.keys(L).forEach(function (id) { var d = L[id] && L[id].done; if (d > 1e12) { var w = slot(d); if (w) w.lessons++; } }); }
    (log || []).forEach(function (e) { if (e && !e[6] && e[2] >= 3) { var w = slot(e[0]); if (w) w.good++; } });
    return out;
  }
  function sureCount(course) {
    if (course === "it") { var S = lget("cp-it-srs-v1") || {}, n = 0; Object.keys(S).forEach(function (k) { var c = S[k] && S[k].c; if (c && c.state === FSRS.REVIEW && c.st >= 4) n++; }); return n; }
    var Z = CP.S(), m = 0; Object.keys(Z).forEach(function (k) { if (CP.state(k) === 2) m++; }); return m;
  }
  function lessonsDone() { var L = lget("cp-it-lessons-v1") || {}; return Object.keys(L).filter(function (id) { return L[id] && L[id].done; }).length; }
  /* il tono più sbagliato nelle parole mancate (corso di cinese): { tone, n } o null */
  function hardTone(log) {
    var since = Date.now() - 60 * DAY, c = [0, 0, 0, 0, 0], tot = 0;
    (log || []).forEach(function (e) {
      if (!e || e[6] || e[2] !== 1 || e[0] < since) return; var w = CP.WORDS[e[1]]; if (!w) return;
      String(w.py).normalize("NFD").split(/[\s.]+/).forEach(function (syl) { var t = /̄/.test(syl) ? 1 : /́/.test(syl) ? 2 : /̌/.test(syl) ? 3 : /̀/.test(syl) ? 4 : 0; if (t) { c[t]++; tot++; } });
    });
    var best = 0; for (var t = 1; t <= 4; t++) if (c[t] > c[best]) best = t;
    return tot >= 6 && best ? { tone: best, n: c[best], tot: tot } : null;
  }
  function summary(course, W, tone) {
    var w = W[W.length - 1], k = course === "it" ? "itst." : "st.";
    if (!w.days) return T(k + "fresh");
    var s = T(k + "week", { d: w.days, w: w.words, l: w.lessons, g: w.good });
    if (W.length > 1 && w.words > W[W.length - 2].words && W[W.length - 2].words) s += " " + T(k + "up");
    if (tone) s += " " + T("st.tone", { t: tone.tone, name: T("tone." + tone.tone) });
    return s;
  }
  function bars(W, course) {
    var key = course === "it" ? "words" : "good", max = 1; W.forEach(function (w) { if (w[key] > max) max = w[key]; });
    var lbl = T(course === "it" ? "itst.barsIt" : "st.bars"), loc = LANG === "zh" ? "zh-CN" : "it-IT";
    return '<figure class="st-bars" aria-label="' + CP.attr(lbl + ": " + W.map(function (w) { return w[key]; }).join(", ")) + '"><figcaption class="small muted">' + esc(lbl) + "</figcaption><div class=\"st-cols\">" +
      W.map(function (w, i) {
        var h = Math.round(w[key] / max * 100), d = new Date(w.t);
        return '<div class="st-col' + (i === W.length - 1 ? " now" : "") + '"><b>' + w[key] + '</b><span class="st-bar"><i style="height:' + h + '%"></i></span><small>' + esc(d.toLocaleDateString(loc, { day: "numeric", month: "numeric" })) + "</small></div>";
      }).join("") + "</div></figure>";
  }
  /* il riquadro: Promise<html> (il registro dei ripassi si legge da IndexedDB) */
  function html(course) {
    var get = course === "it" || !window.Store ? Promise.resolve([]) : Store.logAll().catch(function () { return []; });
    return get.then(function (log) {
      var W = weeks(course, log), tone = course === "it" ? null : hardTone(log), sure = sureCount(course);
      var nums = course === "it"
        ? [[sure, T("itst.sure")], [lessonsDone() + "/30", T("itst.lessons")], [CP.game ? CP.game.activeDays() : 0, T("st.days")]]
        : [[sure, T("st.sure")], [W[W.length - 1].good, T("st.goodWeek")], [CP.game ? CP.game.activeDays() : 0, T("st.days")]];
      return '<p class="st-sum">' + summary(course, W, tone) + "</p>" +
        '<div class="stats">' + nums.map(function (x) { return '<div class="stat"><b>' + x[0] + "</b><span>" + esc(x[1]) + "</span></div>"; }).join("") + "</div>" + bars(W, course) +
        /* il foglio di lavoro in PDF (ui/worksheet-stub.js): pulsante secondario, il pulsante pieno di Studia resta «Inizia» */
        '<div class="ws-cta"><button type="button" class="btn-s" data-ws-open>📝 ' + esc(T("ws.btn")) + '</button><p class="small muted">' + esc(T("ws.btnSub")) + "</p></div>";
    });
  }
  CP.story = { weeks: weeks, html: html, hardTone: hardTone, sureCount: sureCount };
})();
