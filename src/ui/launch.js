/* ===== màndarínō · aprire l'app su un'azione precisa: «?go=study» (scorciatoie di Android con pressione prolungata
   sull'icona, widget, promemoria, scorciatoie del manifesto della PWA). Azioni: study, ear, sprint, music, words, frasi,
   path. Se l'app è già aperta, il lato Android chiama window.__mdGo("study"). ===== */
(function () {
  var CP = window.CP;
  function later(f) { setTimeout(f, 300); }
  var ACT = {
    /* prima la scheda, poi (finito il suo primo disegno) l'attività */
    study: function () { CP.show("study"); later(function () { if (CP.studyStart) CP.studyStart(); }); },
    ear: function () { CP.show("study"); later(function () { if (CP.mode) CP.mode.ear(); }); },
    sprint: function () { CP.show("study"); later(function () { if (CP.mode) CP.mode.sprint(); }); },
    music: function () { if (CP.jukeboxOpen) CP.jukeboxOpen(); },
    words: function () { CP.show("words"); },
    frasi: function () { CP.show("build"); },
    path: function () { CP.show("path"); }
  };
  CP.go = function (a) {
    var f = ACT[a]; if (!f) return false;
    if (document.body.classList.contains("course-it")) return false;   /* le azioni sono del corso di cinese */
    if (CP.topSheet && CP.topSheet() && CP.closeSheet) CP.closeSheet();
    if (CP.immerse && CP.immerse.active()) CP.immerse.leave();
    try { f(); } catch (e) {}
    return true;
  };
  window.__mdGo = function (a) { setTimeout(function () { CP.go(a); }, 0); };
  var q = null; try { q = new URLSearchParams(location.search).get("go"); } catch (e) {}
  if (q) {
    window.__mdGoing = true;   /* niente benvenuto sopra l'azione scelta */
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
    /* dopo il primo disegno (main.js) e dopo il benvenuto */
    setTimeout(function () { CP.go(q); }, 350);
  }
})();
