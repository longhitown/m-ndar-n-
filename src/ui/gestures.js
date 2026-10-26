/* ===== màndarínō · gesti: uno scorrimento orizzontale deciso sulla pagina passa alla scheda accanto (come le app di
   sistema). Non scatta dove lo scorrimento ha già un altro senso: carte da girare, lavagna, cursori, campi di testo, righe
   che scorrono di lato, fogli aperti, sessione di studio, corso di italiano. ===== */
(function () {
  var CP = window.CP, TABS = ["path", "words", "study", "build"], x0 = 0, y0 = 0, t0 = 0, ok = false;
  function scrollsX(el) {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 4) { var o = getComputedStyle(el).overflowX; if (o === "auto" || o === "scroll") return true; }
    }
    return false;
  }
  function blocked(t) {
    if (document.body.classList.contains("course-it") || document.body.classList.contains("in-session") || document.body.classList.contains("in-focus")) return true;
    if (CP.studyActive && CP.studyActive()) return true;
    if (CP.mode && CP.mode.active && CP.mode.active()) return true;
    var fam = document.getElementById("fam"), jk = document.getElementById("jk-pop"), set = document.getElementById("settings");
    if ((fam && !fam.hidden) || (jk && !jk.hidden) || (set && !set.hidden)) return true;
    if (!t.closest || t.closest("input, textarea, select, canvas, .fc, .pad, [data-noswipe], .dock, .bar")) return true;
    return scrollsX(t);
  }
  document.addEventListener("touchstart", function (e) {
    ok = false; if (e.touches.length !== 1 || blocked(e.target)) return;
    ok = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (!ok) return; ok = false;
    var p = e.changedTouches[0], dx = p.clientX - x0, dy = p.clientY - y0, dt = Date.now() - t0;
    if (dt > 700 || Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2.2) return;
    /* dal bordo sinistro è il gesto «indietro» del sistema: non lo si contende */
    if (x0 < 24 && dx > 0) return;
    var cur = TABS.filter(function (t) { var v = document.getElementById("view-" + t); return v && !v.hidden; })[0], i = TABS.indexOf(cur), j = i + (dx < 0 ? 1 : -1);
    if (i < 0 || j < 0 || j >= TABS.length) { if (CP.haptic) CP.haptic(6); return; }
    CP.show(TABS[j]); if (CP.haptic) CP.haptic(10);
  }, { passive: true });
})();
