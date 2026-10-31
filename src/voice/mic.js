/* ===== V6: microfono con flusso persistente + PWA (manifest, service worker, pacchetto per GitHub/Cloudflare) ===== */
(function () {
  var CP = window.CP, esc = CP.esc;
  var IDLE_MS = 4 * 1000;       /* era 5 minuti, poi 45 secondi: il microfono si chiude da solo pochi secondi dopo l'ultimo uso (basta per due prove di fila) */
  var STUCK_MS = 25 * 1000;     /* nessuna sessione dura tanto: se qualcuno non ha rilasciato, si rilascia per lui */

  /* ---- 1. microfono: un solo permesso per sessione. Il flusso resta aperto finche' la scheda e' viva ---- */
  /* guadagno automatico ACCESO. Spento, su molti telefoni la voce arrivava 5-10 volte più bassa e l'altezza non si
     trovava quasi mai. La cancellazione dell'eco resta spenta: su Android la accende passando in «modalità chiamata»,
     e la voce guida e la musica finiscono nell'altoparlante del telefono, bassissime. */
  var AUDIO = { echoCancellation: false, noiseSuppression: false, autoGainControl: true, channelCount: 1 };
  var M = { stream: null, pending: null, users: 0, idle: 0, opened: 0, at: 0 };
  /* diario del microfono (ultimi 24 eventi, solo in memoria): lo legge l'autodiagnosi per dire PERCHÉ una registrazione si è fermata */
  var LOG = [], T0 = Date.now();
  CP.micLog = function (tag, detail) {
    var d = detail;
    if (d && typeof d === "object") d = (d.name || "") + (d.message ? ": " + d.message : "") + (d.name || d.message ? "" : String(d));
    LOG.push({ ms: Date.now() - T0, tag: String(tag), detail: d == null ? "" : String(d).slice(0, 160) });
    if (LOG.length > 24) LOG.shift();
  };
  CP.micLogList = function () { return LOG.slice(); };
  function live(s) { return !!(s && s.getAudioTracks && s.getAudioTracks().some(function (t) { return t.readyState === "live"; })); }
  /* 🎙️ nella barra finché il flusso è aperto: un tocco lo chiude */
  var liveBtn = document.createElement("button");
  liveBtn.type = "button"; liveBtn.id = "mic-live"; liveBtn.className = "iconbtn emo"; liveBtn.hidden = true; liveBtn.textContent = "🎙️";
  liveBtn.setAttribute("aria-label", "Microfono aperto: tocca per chiuderlo"); liveBtn.title = "Microfono aperto: tocca per chiuderlo";
  var barGrp = document.querySelector(".bar .grp"); if (barGrp) barGrp.insertBefore(liveBtn, barGrp.firstChild);
  function paintLive() { liveBtn.hidden = !live(M.stream); }
  liveBtn.addEventListener("click", function () { M.users = 0; drop(); if (CP.toast) CP.toast("Microfono chiuso."); });
  function drop() {
    if (M.stream) CP.micLog("chiuso", "utenti " + M.users);
    clearTimeout(M.idle); M.idle = 0; M.users = 0;
    var s = M.stream; M.stream = null; CP._micStream = null;
    try { if (s && s._mdNative) s._mdNative.stop(); } catch (e) {}   /* flusso nativo (APK): ferma anche la registrazione di Android */
    try { if (s) s.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    paintLive();
  }
  function armIdle() { clearTimeout(M.idle); M.idle = setTimeout(function () { if (!M.users || Date.now() - M.at > STUCK_MS) drop(); else armIdle(); }, IDLE_MS); }
  CP.micStream = function () {
    clearTimeout(M.idle); M.at = Date.now();
    if (live(M.stream)) { M.users++; return Promise.resolve(M.stream); }
    if (M.pending) { M.users++; return M.pending; }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return Promise.reject({ name: "NotSupportedError" });
    M.users++;
    /* su Android il riconoscimento vocale e l'oscilloscopio non possono usare il microfono insieme: si chiude prima il primo,
       poi si prova ad aprire il flusso; se il telefono non l'ha ancora liberato (NotReadableError) si riprova, fino a 4 volte */
    var freed = CP.listenRelease ? CP.listenRelease() : false;
    function wait(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
    function open(n) {
      return navigator.mediaDevices.getUserMedia({ audio: AUDIO }).catch(function (e) {
        var busy = e && (e.name === "NotReadableError" || e.name === "AbortError" || e.name === "TrackStartError");
        if (busy && n < 4) return wait(260).then(function () { return open(n + 1); });
        /* ultimo ripiego: alcuni telefoni rifiutano i vincoli audio personalizzati; col microfono «semplice» si apre */
        if (busy && n === 4) {
          /* ripiego a catena, dal meno al più invasivo: tutto spento (flusso «grezzo»), microfono semplice, e infine la cattura nativa di
             Android (APK): se la WebView non riesce ad aprire la sorgente audio, la apre Android e la pagina riceve i campioni */
          CP.micLog("ripiego-vincoli", e);
          var steps = [["grezzo", function () { return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }],
            ["semplice", function () { return navigator.mediaDevices.getUserMedia({ audio: true }); }],
            ["nativo", function () { if (!CP.nativeMic) return Promise.reject(e); return CP.nativeMic(); }]];
          return steps.reduce(function (p, st) {
            return p.catch(function () { return st[1]().then(function (s) { CP.micLog("ripiego-riuscito", st[0] + (s && s._mdNative ? " · " + s._mdNative.source : "")); return s; }); });
          }, Promise.reject(e)).catch(function () { throw e; });
        }
        throw e;
      });
    }
    M.pending = (freed ? wait(220) : Promise.resolve()).then(function () { return open(0); }).then(function (s) {
      M.pending = null; M.stream = s; M.opened++; CP._micStream = s;
      var born = Date.now();
      CP.micLog("aperto", s.getAudioTracks().map(function (t) { return t.readyState + (t.muted ? "/muto" : ""); }).join(","));
      s.getTracks().forEach(function (t) {
        t.addEventListener("ended", function () { CP.micLog("traccia-finita", (Date.now() - born) + " ms dopo l'apertura, utenti " + M.users); if (M.stream === s) { M.stream = null; CP._micStream = null; paintLive(); } });
        t.addEventListener("mute", function () { CP.micLog("traccia-muta", (Date.now() - born) + " ms dopo l'apertura"); });
        t.addEventListener("unmute", function () { CP.micLog("traccia-torna", (Date.now() - born) + " ms dopo l'apertura"); });
      });
      paintLive();
      return s;
    }, function (e) { M.pending = null; M.users = Math.max(0, M.users - 1); CP.micLog("apertura-fallita", e); throw e; });
    return M.pending;
  };
  /* rilascio "morbido": il flusso resta aperto ancora qualche secondo (niente nuovo permesso a ogni parola) */
  CP.micRelease = function () { M.users = Math.max(0, M.users - 1); if (!M.users) armIdle(); };
  CP.micInfo = function () { return { live: live(M.stream), opened: M.opened, users: M.users, idle: !!M.idle }; };
  CP.micClose = drop;
  window.addEventListener("pagehide", drop);
  document.addEventListener("visibilitychange", function () { if (document.hidden && !M.users) drop(); });

})();
