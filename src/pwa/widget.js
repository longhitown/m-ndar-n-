/* ===== màndarínō · stato per il widget «Oggi» dell'app Android (android/…/TodayWidget.java).
   Il widget non vede il localStorage della WebView: ogni volta che lo stato cambia (un ripasso, punti, chiusura dell'app)
   gli si manda un piccolo JSON con MandarinoAndroid.setWidgetState. Perché il numero dei ripassi resti vero anche ad app
   chiusa, non si manda «N adesso» ma le scadenze delle prossime 168 ore, ora per ora: il widget somma da solo quelle
   già passate. La parola del giorno la sceglie il widget dalla lista (giorno dell'anno modulo lunghezza).
   Per il widget «Ripasso rapido» (4×4, ReviewBigWidget.java) lo stato porta anche un piccolo mazzo (`deck`, fino a 20 carte
   scadute, le più dimenticate prima, come nella sessione dell'app) e il corso (`dc`). I voti dati nel widget tornano come coda
   (MandarinoAndroid.widgetPending) e li applica pwa/wq.js: prima di ogni invio dello stato, perché il mazzo non riproponga
   carte già votate, e quando l'app torna in primo piano. ===== */
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
  var H = 3600000, timer = 0, DECK = 20;
  /* la coda dei voti del widget: se il ponte dice che c'è qualcosa, si carica pwa/wq.js (CP.wq) e si applica */
  function drain() { try { if (A.widgetPending && A.widgetPending()) CP.wq.run(); } catch (e) {} }
  /* il mazzo: { k chiave, hz cinese, py pinyin, it significato }. Corso di italiano: k è l'id della voce, it la parola italiana, hz il cinese */
  function itSrs() { try { return JSON.parse(localStorage.getItem("cp-it-srs-v1") || "{}") || {}; } catch (e) { return {}; } }
  /* le scadenze di tutte le carte che hanno già un ripasso, nel corso in uso (corso di italiano: cp-it-srs-v1, { c: { due } }) */
  function dues() {
    var out = [], S;
    if (CP.course && CP.course() === "it") { S = itSrs(); Object.keys(S).forEach(function (k) { var r = S[k]; if (k !== "__meta" && r && r.c && r.c.due) out.push(r.c.due); }); }
    else { S = CP.S(); Object.keys(S).forEach(function (k) { var r = S[k]; if (r && r.n && CP.WORDS[k] && r.d) out.push(r.d); }); }
    return out;
  }
  function deck(now) {
    var out = [];
    if (CP.course && CP.course() === "it") {
      var S = itSrs();
      (CP.itLexicon ? CP.itLexicon() : []).filter(function (e) { return S[e.id] && S[e.id].c && S[e.id].c.due <= now; })
        .sort(function (a, b) { return S[a.id].c.due - S[b.id].c.due; }).slice(0, DECK)
        .forEach(function (e) { out.push({ k: e.id, hz: e.zh, py: String(e.py || "").replace(/[.]/g, ""), it: e.it }); });
    } else CP.dueList(CP.ORDER, now).slice(0, DECK).forEach(function (k) { var w = CP.WORDS[k]; out.push({ k: k, hz: w.hz, py: w.py.replace(/[.]/g, ""), it: CP.gloss(w) }); });
    return out;
  }
  function words() { return (CP.wotdPool ? CP.wotdPool() : []).map(function (w) { return [w.hz, w.py.replace(/\./g, ""), CP.gloss(w)]; }); }
  function state() {
    var now = Date.now(), t0 = Math.floor(now / H) * H, hist = new Array(168).fill(0), over = 0;
    dues().forEach(function (d) {
      if (d <= now) over++;
      else { var i = Math.floor((d - t0) / H); if (i < 168) hist[i]++; }
    });
    var c = CP.studyCounts ? CP.studyCounts() : { nw: 0 }, d = new Date(now);
    return { v: 1, t: now, t0: t0, over: over, hist: hist, nw: c.nw || 0,
      day: d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(),
      streak: CP.game ? CP.game.streak() : 0, today: CP.game && CP.game.activeToday ? CP.game.activeToday() : false,
      goal: CP.game ? CP.game.goal() : 10, wt: CP.game && CP.game.wordsToday ? CP.game.wordsToday() : 0,
      rank: CP.game && CP.game.rank ? CP.game.rank().ch : "", lang: LANG, words: words(),
      dc: CP.course ? CP.course() : "zh", deck: deck(now) };
  }
  function push() { clearTimeout(timer); timer = 0; drain(); try { A.setWidgetState(JSON.stringify(state())); } catch (e) {} }
  function soon() { if (!timer) timer = setTimeout(push, 1500); }
  CP.widgetPush = push;
  window.__mdWidget = push;   /* MainActivity.onPause */
  var mark = CP.mark; CP.mark = function () { var r = mark.apply(this, arguments); soon(); return r; };
  if (CP.game) ["addWord", "sentence", "ear", "xp", "setGoal"].forEach(function (f) { var o = CP.game[f]; if (typeof o === "function") CP.game[f] = function () { var r = o.apply(this, arguments); soon(); return r; }; });
  document.addEventListener("visibilitychange", function () { if (document.hidden) push(); else drain(); });
  setTimeout(drain, 800);
  setTimeout(push, 2500);
})();
