/* ===== màndarínō · stato per il widget «Oggi» dell'app Android (android/…/TodayWidget.java).
   Il widget non vede il localStorage della WebView: ogni volta che lo stato cambia (un ripasso, punti, chiusura dell'app)
   gli si manda un piccolo JSON con MandarinoAndroid.setWidgetState. Perché il numero dei ripassi resti vero anche ad app
   chiusa, non si manda «N adesso» ma le scadenze delle prossime 168 ore, ora per ora: il widget somma da solo quelle
   già passate. La parola del giorno la sceglie il widget dalla lista (giorno dell'anno modulo lunghezza). ===== */
(function () {
  var CP = window.CP, A = window.MandarinoAndroid;
  /* la parola del giorno: la stessa nel widget e nella carta da condividere (ui/share-card.js) */
  CP.wotdPool = function () {
    var seen = [], next = [];
    CP.ORDER.forEach(function (k) { (CP.state(k) ? seen : next).push(CP.WORDS[k]); });
    return (seen.length >= 30 ? seen : seen.concat(next.slice(0, 366 - seen.length))).slice(0, 366);
  };
  CP.wordOfDay = function () {
    var p = CP.wotdPool(), d = new Date(), y = d.getFullYear(), doy = Math.round((Date.UTC(y, d.getMonth(), d.getDate()) - Date.UTC(y, 0, 0)) / 864e5);
    return p.length ? p[(y * 366 + doy) % p.length] : null;
  };
  if (!A || !A.setWidgetState) return;
  var H = 3600000, timer = 0;
  function words() { return (CP.wotdPool ? CP.wotdPool() : []).map(function (w) { return [w.hz, w.py.replace(/\./g, ""), CP.gloss(w)]; }); }
  function state() {
    var S = CP.S(), now = Date.now(), t0 = Math.floor(now / H) * H, hist = new Array(168).fill(0), over = 0;
    Object.keys(S).forEach(function (k) {
      var r = S[k]; if (!r || !r.n || !CP.WORDS[k] || !r.d) return;
      if (r.d <= now) over++;
      else { var i = Math.floor((r.d - t0) / H); if (i < 168) hist[i]++; }
    });
    var c = CP.studyCounts ? CP.studyCounts() : { nw: 0 }, d = new Date(now);
    return { v: 1, t: now, t0: t0, over: over, hist: hist, nw: c.nw || 0,
      day: d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(),
      streak: CP.game ? CP.game.streak() : 0, today: CP.game && CP.game.activeToday ? CP.game.activeToday() : false,
      goal: CP.game ? CP.game.goal() : 10, lang: LANG, words: words() };
  }
  function push() { clearTimeout(timer); timer = 0; try { A.setWidgetState(JSON.stringify(state())); } catch (e) {} }
  function soon() { if (!timer) timer = setTimeout(push, 1500); }
  CP.widgetPush = push;
  window.__mdWidget = push;   /* MainActivity.onPause */
  var mark = CP.mark; CP.mark = function () { var r = mark.apply(this, arguments); soon(); return r; };
  if (CP.game) ["addWord", "sentence", "ear", "xp", "setGoal"].forEach(function (f) { var o = CP.game[f]; if (typeof o === "function") CP.game[f] = function () { var r = o.apply(this, arguments); soon(); return r; }; });
  document.addEventListener("visibilitychange", function () { if (document.hidden) push(); });
  setTimeout(push, 2500);
})();
