/* ===== V6: microfono con flusso persistente + PWA (manifest, service worker, pacchetto per GitHub/Cloudflare) ===== */
(function () {
  var CP = window.CP, esc = CP.esc;
  var IDLE_MS = 45 * 1000;      /* V6.7: era 5 minuti, con l'indicatore del microfono del telefono sempre acceso */

  /* ---- 1. microfono: un solo permesso per sessione. Il flusso resta aperto finche' la scheda e' viva ---- */
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
    M.pending = navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (s) {
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

  /* ---- 1b. «Registra e confronta»: funziona ovunque ci sia getUserMedia, anche offline.
     Registra 3 secondi, poi fa sentire la tua voce e subito dopo quella sintetica, con la curva del tono.
     Il giudizio lo dai tu (Simile / Da rifare): niente valutazioni automatiche finte. ---- */
  var REC_MS = 3000;
  function wordOf(hz) { for (var i = 0; i < CP.ORDER.length; i++) { var w = CP.WORDS[CP.ORDER[i]]; if (w.hz === hz) return w; } return null; }
  function trackOf(buf, sr) {
    var win = 1024, hop = 256, out = [], t, prev = 0;
    for (t = 0; t + win <= buf.length; t += hop) {
      var r = CP._detect(buf.subarray(t, t + win), sr), f = r.f;
      if (f > 0 && prev) { var c = [f, f * 2, f / 2].sort(function (a, b) { return Math.abs(Math.log(a / prev)) - Math.abs(Math.log(b / prev)); })[0]; f = Math.abs(12 * Math.log(c / prev) / Math.LN2) > 5 ? 0 : c; }
      if (f > 0) prev = f;
      out.push(f);
    }
    var i0 = 0, i1 = out.length - 1; while (i0 < out.length && !out[i0]) i0++; while (i1 > i0 && !out[i1]) i1--;
    var seg = out.slice(i0, i1 + 1), voiced = seg.filter(Boolean).sort(function (a, b) { return a - b; }), med = voiced.length ? voiced[voiced.length >> 1] : 0;
    return { pts: seg.map(function (f, i) { return { x: seg.length > 1 ? i / (seg.length - 1) : 0, s: f && med ? 12 * Math.log(f / med) / Math.LN2 : null }; }), voiced: voiced.length };
  }
  function drawRec(cv, tones, tr) {
    var dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), W = Math.max(200, r.width), H = Math.max(110, r.height), x = cv.getContext("2d");
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    var css = function (v, fb) { return (getComputedStyle(document.documentElement).getPropertyValue(v) || fb).trim() || fb; }, yOf = function (s) { return H / 2 - (s / 14) * H; }, i;
    x.strokeStyle = "rgba(128,128,128,0.25)"; x.lineWidth = 1; x.beginPath(); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
    if (tones && tones.length && CP._idealAt) {
      x.setLineDash([6, 6]); x.strokeStyle = css("--muted", "#888"); x.lineWidth = 2.5; x.beginPath();
      for (i = 0; i <= 60; i++) { var y = yOf(CP._idealAt(tones, i / 60)); if (i) x.lineTo(i / 60 * W, y); else x.moveTo(0, y); }
      x.stroke(); x.setLineDash([]);
    }
    if (tr) {
      x.strokeStyle = css("--t2", "#1F7A3E"); x.lineWidth = 4; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath(); var open = false;
      tr.pts.forEach(function (p) { if (p.s === null) { open = false; return; } var px = p.x * W, py = Math.max(4, Math.min(H - 4, yOf(p.s))); if (open) x.lineTo(px, py); else { x.moveTo(px, py); open = true; } });
      x.stroke();
    }
    x.fillStyle = css("--muted", "#888"); x.font = "13px sans-serif"; x.fillText(tones && tones.length ? "tratteggio = forma del tono; verde = la tua voce" : "verde = la tua voce", 8, H - 8);
  }
  CP.recordCompare = function (host, hz, note) {
    var old = host.querySelector(".rec");
    if (old) { if (old._stop) old._stop(); old.parentNode.removeChild(old); return; }
    var w = wordOf(hz), tones = w ? CP.syllables(w.py).map(CP.tone) : null, say = w ? CP.sayHz(w) : hz;
    var d = document.createElement("div"); d.className = "rec"; d.setAttribute("data-heard-host", "");
    d.innerHTML = '<div class="rec-h">🎙️ Registra e confronta</div>' + (note ? '<p class="small muted" style="margin:0">' + esc(note) + "</p>" : "") +
      '<canvas aria-label="Curva dell\'altezza della tua voce"></canvas><p class="rec-st small" aria-live="polite">Tocca «Registra», di\' <span class="han">' + esc(hz.replace(/[^㐀-鿿]/g, "")) + "</span> e ascolta il confronto.</p>" +
      '<div class="acts" style="margin-top:0"><button type="button" class="btn-s" data-rec-go>🎙️ Registra 3 s</button><button type="button" class="btn-s" data-rec-me disabled>▶ La tua voce</button><button type="button" class="btn-s" data-rec-tts>🔊 La voce guida</button></div>' +
      '<div class="acts rec-judge" style="margin-top:0" hidden><button type="button" class="btn-s" data-rec-ok>👍 Simile</button><button type="button" class="btn-s" data-rec-ko>🔁 Da rifare</button></div>';
    host.appendChild(d);
    var cv = d.querySelector("canvas"), st = d.querySelector(".rec-st"), go = d.querySelector("[data-rec-go]"), me = d.querySelector("[data-rec-me]"), judge = d.querySelector(".rec-judge");
    var url = "", audio = null, recd = null, timer = 0, busy = false;
    drawRec(cv, tones, null);
    function playMe(then) {
      if (!url) return; CP.stopSpeak(); try { if (audio) audio.pause(); } catch (e) {}
      audio = new Audio(url); audio.onended = function () { if (then) then(); }; audio.onerror = function () { if (then) then(); };
      try { var pr = audio.play(); if (pr && pr.catch) pr.catch(function () { if (then) then(); }); } catch (e) { if (then) then(); }
    }
    function stopAll() { clearTimeout(timer); try { if (recd && recd.state !== "inactive") recd.stop(); } catch (e) {} try { if (audio) audio.pause(); } catch (e) {} }
    d._stop = function () { stopAll(); if (url) URL.revokeObjectURL(url); };
    function record() {
      if (busy) return; busy = true; stopAll(); CP.stopSpeak(); judge.hidden = true;
      go.disabled = true; st.textContent = "Chiedo il microfono…";
      if (CP.musicHold) CP.musicHold(true);
      CP.micStream().then(function (stream) {
        var chunks = [], t0 = Date.now();
        try { recd = new MediaRecorder(stream); } catch (e) { throw { name: "NotSupportedError" }; }
        recd.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        recd.onstop = function () {
          CP.micRelease(); if (CP.musicHold) CP.musicHold(false); busy = false; go.disabled = false; go.textContent = "🎙️ Registra di nuovo";
          var blob = new Blob(chunks, { type: (chunks[0] && chunks[0].type) || recd.mimeType || "audio/webm" });
          if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob); me.disabled = false;
          st.textContent = "Ascolta: prima tu, poi la voce guida. Poi decidi tu.";
          var c = CP.getCtx();
          blob.arrayBuffer().then(function (ab) { return c ? new Promise(function (res, rej) { c.decodeAudioData(ab, res, rej); }) : null; }).then(function (buf) {
            if (!buf) return; var tr = trackOf(buf.getChannelData(0), buf.sampleRate); drawRec(cv, tones, tr);
            if (tr.voiced < 6) st.textContent = "Ho sentito poca voce: avvicinati al microfono. Puoi comunque ascoltarti.";
          }).catch(function () { drawRec(cv, tones, null); });
          playMe(function () { CP.speak(say, { onEnd: function () { judge.hidden = false; } }); });
          judge.hidden = false;
        };
        recd.start();
        var tick = function () { var left = Math.max(0, REC_MS - (Date.now() - t0)); st.textContent = "🔴 Registro… " + Math.ceil(left / 1000) + " s"; if (left > 0) timer = setTimeout(tick, 200); else { try { recd.stop(); } catch (e) {} } };
        tick();
      }).catch(function (err) {
        busy = false; go.disabled = false; if (CP.musicHold) CP.musicHold(false);
        var n = err && err.name;
        st.className = "rec-st small heard ko";
        st.innerHTML = n === "NotAllowedError" || n === "SecurityError" ? "Il microfono è bloccato in questa pagina. " + CP.frameBtn() : "Non riesco a registrare qui (" + esc(n || "errore") + ").";
        if (CP.micBlocked && (n === "NotAllowedError" || n === "SecurityError")) CP.micBlocked();
      });
    }
    d.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
      if (b.hasAttribute("data-rec-go") || b.hasAttribute("data-rec-ko")) { CP.sfx("tap"); record(); }
      else if (b.hasAttribute("data-rec-me")) playMe(null);
      else if (b.hasAttribute("data-rec-tts")) CP.say(say, b);
      else if (b.hasAttribute("data-rec-ok")) { CP.sfx("ok"); if (CP.game && CP.game.xp) CP.game.xp(1); judge.hidden = true; st.className = "rec-st small"; st.textContent = "👍 Bene. Se vuoi, prova con 〰️ Tono per vedere la curva dal vivo."; }
    });
    if (d.scrollIntoView) d.scrollIntoView({ block: "nearest" });
    record();
  };
})();
