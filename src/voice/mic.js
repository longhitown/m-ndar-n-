/* ===== V6: microfono con flusso persistente + PWA (manifest, service worker, pacchetto per GitHub/Cloudflare) ===== */
(function () {
  var CP = window.CP, esc = CP.esc;
  var IDLE_MS = 45 * 1000;      /* era 5 minuti, con l'indicatore del microfono del telefono sempre acceso */

  /* ---- 1. microfono: un solo permesso per sessione. Il flusso resta aperto finche' la scheda e' viva ---- */
  /* guadagno automatico ACCESO. Spento, su molti telefoni la voce arrivava 5-10 volte più bassa e l'altezza non si
     trovava quasi mai. La cancellazione dell'eco resta spenta: su Android la accende passando in «modalità chiamata»,
     e la voce guida e la musica finiscono nell'altoparlante del telefono, bassissime. */
  var AUDIO = { echoCancellation: false, noiseSuppression: false, autoGainControl: true, channelCount: 1 };
  var M = { stream: null, pending: null, users: 0, idle: 0, opened: 0 };
  function live(s) { return !!(s && s.getAudioTracks && s.getAudioTracks().some(function (t) { return t.readyState === "live"; })); }
  /* 🎙️ nella barra finché il flusso è aperto: un tocco lo chiude */
  var liveBtn = document.createElement("button");
  liveBtn.type = "button"; liveBtn.id = "mic-live"; liveBtn.className = "iconbtn emo"; liveBtn.hidden = true; liveBtn.textContent = "🎙️";
  liveBtn.setAttribute("aria-label", "Microfono aperto: tocca per chiuderlo"); liveBtn.title = "Microfono aperto: tocca per chiuderlo";
  var barGrp = document.querySelector(".bar .grp"); if (barGrp) barGrp.insertBefore(liveBtn, barGrp.firstChild);
  function paintLive() { liveBtn.hidden = !live(M.stream); }
  liveBtn.addEventListener("click", function () { M.users = 0; drop(); if (CP.toast) CP.toast("Microfono chiuso."); });
  function drop() {
    clearTimeout(M.idle); M.idle = 0;
    var s = M.stream; M.stream = null; CP._micStream = null;
    try { if (s) s.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    paintLive();
  }
  function armIdle() { clearTimeout(M.idle); M.idle = setTimeout(function () { if (!M.users) drop(); else armIdle(); }, IDLE_MS); }
  CP.micStream = function () {
    clearTimeout(M.idle);
    if (live(M.stream)) { M.users++; return Promise.resolve(M.stream); }
    if (M.pending) { M.users++; return M.pending; }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return Promise.reject({ name: "NotSupportedError" });
    M.users++;
    M.pending = navigator.mediaDevices.getUserMedia({ audio: AUDIO }).then(function (s) {
      M.pending = null; M.stream = s; M.opened++; CP._micStream = s;
      s.getTracks().forEach(function (t) { t.addEventListener("ended", function () { if (M.stream === s) { M.stream = null; CP._micStream = null; paintLive(); } }); });
      paintLive();
      return s;
    }, function (e) { M.pending = null; M.users = Math.max(0, M.users - 1); throw e; });
    return M.pending;
  };
  /* rilascio "morbido": il flusso resta aperto ancora 45 secondi (niente nuovo permesso a ogni parola) */
  CP.micRelease = function () { M.users = Math.max(0, M.users - 1); if (!M.users) armIdle(); };
  CP.micInfo = function () { return { live: live(M.stream), opened: M.opened, users: M.users, idle: !!M.idle }; };
  CP.micClose = drop;
  window.addEventListener("pagehide", drop);
  document.addEventListener("visibilitychange", function () { if (document.hidden && !M.users) drop(); });

})();
