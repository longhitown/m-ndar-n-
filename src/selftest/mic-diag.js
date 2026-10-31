/* ===== diagnosi del microfono per l'autodiagnosi (selftest.js). Nel file unico si carica al primo uso di CP.micDiag ===== */
(function () {
  var CP = window.CP, esc = CP.esc;
  /* ---- diagnosi del microfono: stato (sempre) e prova vera (a richiesta, 3 secondi parlando) ----
     Ogni riga è [nome, ok, dettaglio]. La prova passa dalla stessa via di toni e scambio linguistico (CP.micStream, AudioContext, MediaRecorder)
     e, nell'APK, chiede ad Android com'è messo il microfono mentre la prova è in corso. */
  function nativeMic() {
    var A = window.MandarinoAndroid;
    if (!A || typeof A.micDiag !== "function") return null;
    try { return JSON.parse(A.micDiag()); } catch (e) { return { error: String(e) }; }
  }
  function recList(d) {
    var r = d && d.recordings;
    if (!r) return "non disponibile";
    return r.length + (r.length ? " (" + r.map(function (x) { return "sorgente " + x.source + (x.silenced === undefined ? "" : x.silenced ? ", SILENZIATA da Android" : ", udibile"); }).join("; ") + ")" : "");
  }
  CP.micDiag = function micReport(active) {
    var rows = [], A = window.MandarinoAndroid, nav = navigator;
    function row(n, ok, d) { rows.push([n, ok, d == null ? "" : String(d)]); }
    function errTxt(e) { return e ? (e.name || "errore") + (e.message ? " — " + e.message : "") : "errore"; }
    row("Ambiente", window.isSecureContext !== false, (A ? "APK " + (function () { try { return A.version() + " " + A.flavor(); } catch (e) { return "?"; } })() : "browser") + " · origine " + location.origin + " · sicuro: " + window.isSecureContext + " · riquadro: " + (CP.inFrame ? "sì" : "no"));
    row("Browser", true, (nav.userAgent || "").slice(0, 140));
    row("Funzioni del browser", CP.canScope() && CP.canRecord(), "getUserMedia " + !!(nav.mediaDevices && nav.mediaDevices.getUserMedia) + " · MediaRecorder " + !!window.MediaRecorder + " · AudioContext " + !!(window.AudioContext || window.webkitAudioContext) + " · SpeechRecognition " + CP.canListen());
    if (window.MediaRecorder && MediaRecorder.isTypeSupported) {
      var mt = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"].filter(function (m) { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } });
      row("Formati di registrazione", mt.length > 0, mt.length ? mt.join(", ") : "nessuno dei quattro che usa lo scambio linguistico");
    }
    var nat0 = nativeMic();
    if (A && !nat0) row("Ponte Android", false, "questa versione dell'APK non ha la diagnosi nativa del microfono: installa l'ultima release");
    else if (nat0) {
      row("Telefono", true, (nat0.model || "?") + " · Android " + (nat0.android || "?"));
      row("Permesso Android (RECORD_AUDIO)", !!nat0.permission, nat0.permission ? "concesso" : "NEGATO: Impostazioni → App → màndarínō → Permessi → Microfono");
      if (nat0.micMuted !== undefined) row("Microfono di sistema", !nat0.micMuted, nat0.micMuted ? "SILENZIATO nelle impostazioni di Android" : "attivo");
      if (nat0.mode !== undefined) row("Modalità audio di Android", nat0.mode === 0, ["normale", "suoneria", "telefonata", "chiamata in app"][nat0.mode] || nat0.mode);
      row("Riconoscimento vocale nativo", !nat0.recognizerBusy, (nat0.recognizerBusy ? "IN USO ora (tiene occupato il microfono)" : "fermo") + " · servizio " + (nat0.recognizerAvailable ? "presente" : "assente"));
      row("Altre registrazioni attive prima della prova", !(nat0.recordings && nat0.recordings.length), recList(nat0));
      if (nat0.events && nat0.events.length) row("Diario dei permessi (Android)", true, nat0.events.join(" | "));
    }
    var P = CP.micState().then(function (m) { row("Permesso della pagina", m !== "denied", m); });
    P = P.then(function () {
      if (!(nav.mediaDevices && nav.mediaDevices.enumerateDevices)) return;
      return nav.mediaDevices.enumerateDevices().then(function (l) { var n = l.filter(function (d) { return d.kind === "audioinput"; }).length; row("Ingressi audio", n > 0, n + " (le etichette compaiono dopo il primo permesso)"); }, function (e) { row("Ingressi audio", false, errTxt(e)); });
    });
    if (active) P = P.then(function () {
      var t0 = Date.now(), held = false;
      /* approfondimento (si esegue sempre, a flusso chiuso): ogni variante di vincoli direttamente sulla WebView e la prova nativa di Android */
      function deep() {
        var V = [["tutto spento (eco, rumore, guadagno)", { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }],
          ["eco spento con exact", { audio: { echoCancellation: { exact: false } } }],
          ["audio: true", { audio: true }], ["solo guadagno automatico", { audio: { autoGainControl: true } }], ["mono a 16 kHz", { audio: { channelCount: 1, sampleRate: 16000 } }]];
        return V.reduce(function (p, v) {
          return p.then(function () {
            return nav.mediaDevices.getUserMedia(v[1]).then(function (s) { s.getTracks().forEach(function (t) { t.stop(); }); row("WebView diretta, " + v[0], true, "SI APRE"); }, function (er) { row("WebView diretta, " + v[0], false, errTxt(er)); });
          });
        }, Promise.resolve());
      }
      return CP.micStream().then(function (stream) {
        held = true;
        row("Apertura del microfono (via di toni e scambio)", true, (Date.now() - t0) + " ms");
        var tr = stream.getAudioTracks()[0], born = Date.now(), endedAt = 0, muteAt = 0;
        if (!tr) { row("Traccia audio", false, "il flusso non ha tracce audio"); return; }
        tr.addEventListener("ended", function () { if (!endedAt) endedAt = Date.now() - born; });
        tr.addEventListener("mute", function () { if (!muteAt) muteAt = Date.now() - born; });
        var st = {}; try { st = tr.getSettings ? tr.getSettings() : {}; } catch (e) {}
        row("Traccia all'apertura", tr.readyState === "live" && !tr.muted && tr.enabled, tr.readyState + " · " + (tr.muted ? "MUTA" : "non muta") + " · " + (tr.enabled ? "abilitata" : "disabilitata") + " · " + (tr.label || "senza etichetta") + " · " + (st.sampleRate || "?") + " Hz, " + (st.channelCount || "?") + " canale");
        var c = CP.getCtx ? CP.getCtx() : null, an = null, src = null, buf = null, peak = 0, sum = 0, nbuf = 0, zero = 0;
        if (c) {
          if (c.state !== "running" && c.resume) { try { c.resume(); } catch (e) {} }
          try { src = c.createMediaStreamSource(stream); an = c.createAnalyser(); an.fftSize = 2048; src.connect(an); buf = new Float32Array(an.fftSize); } catch (e) { row("Analisi del suono (come i toni)", false, errTxt(e)); an = null; }
        } else row("Analisi del suono (come i toni)", false, "AudioContext non disponibile");
        var chunks = [], rec = null, recEnd = 0, recErr = "", recMime = "";
        if (window.MediaRecorder) {
          try {
            var m = (["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"].filter(function (x) { try { return MediaRecorder.isTypeSupported(x); } catch (e) { return false; } }))[0];
            try { rec = new MediaRecorder(stream, m ? { mimeType: m, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 }); } catch (e) { rec = new MediaRecorder(stream); }
            recMime = rec.mimeType || m || "";
            rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
            rec.onerror = function (e) { recErr = (e && e.error && (e.error.name || e.error.message)) || "errore"; };
            rec.onstop = function () { if (!recEnd) recEnd = Date.now() - born; };
            rec.start();
          } catch (e) { row("Registratore (come lo scambio linguistico)", false, "non parte: " + errTxt(e)); rec = null; }
        }
        var natMid = null;
        return new Promise(function (done) {
          var n = 0, iv = setInterval(function () {
            n++;
            if (an) { an.getFloatTimeDomainData(buf); var s = 0, z = true; for (var i = 0; i < buf.length; i++) { var a = Math.abs(buf[i]); if (a > peak) peak = a; s += buf[i] * buf[i]; if (buf[i] !== 0) z = false; } sum += s / buf.length; nbuf++; if (z) zero++; }
            if (n === 20) natMid = nativeMic();
            if (n >= 60) { clearInterval(iv); done(); }
          }, 50);
        }).then(function () {
          try { if (src) src.disconnect(); } catch (e) {}
          var recState = rec ? rec.state : "";
          return new Promise(function (fin) {
            if (rec && rec.state !== "inactive") { rec.addEventListener("stop", function () { fin(); }); try { rec.stop(); } catch (e) { fin(); } setTimeout(fin, 900); } else fin();
          }).then(function () {
            var rms = nbuf ? Math.sqrt(sum / nbuf) : 0, bytes = chunks.reduce(function (a, b) { return a + b.size; }, 0);
            if (an) row("Livello del suono (come i toni)", peak > 0.01, "picco " + peak.toFixed(4) + " · medio " + rms.toFixed(4) + " · " + zero + " pacchetti su " + nbuf + " esattamente a zero" + (zero === nbuf && nbuf ? " → SILENZIO ASSOLUTO: l'ingresso non manda suono (microfono muto o bloccato dal sistema, microfono virtuale, privacy)" : peak <= 0.01 ? " → quasi niente: hai parlato?" : ""));
            row("Traccia dopo 3 secondi", tr.readyState === "live" && !endedAt, tr.readyState + (endedAt ? " · FINITA da sola dopo " + endedAt + " ms" : " · mai interrotta") + (muteAt ? " · diventata MUTA dopo " + muteAt + " ms" : ""));
            if (rec) row("Registratore (come lo scambio linguistico)", !recErr && recState !== "inactive" && bytes > 0, "stato prima dello stop: " + recState + " · " + chunks.length + " pezzi, " + bytes + " byte" + (recMime ? " · " + recMime : "") + (recErr ? " · ERRORE " + recErr : "") + (recState === "inactive" && recEnd ? " · si è fermato da solo dopo " + recEnd + " ms" : ""));
            if (natMid) {
              row("Registrazioni attive durante la prova (Android)", !!(natMid.recordings && natMid.recordings.length), recList(natMid) + (natMid.recordings && !natMid.recordings.length ? " → Android non vede la nostra registrazione" : ""));
              row("Riconoscimento vocale nativo durante la prova", !natMid.recognizerBusy, natMid.recognizerBusy ? "IN USO: contende il microfono" : "fermo");
            }
          });
        });
      }, function (e) {
        row("Apertura del microfono (via di toni e scambio)", false, errTxt(e) + " · dopo " + (Date.now() - t0) + " ms");
        var nm = nativeMic(); if (nm) { row("Android dopo il fallimento", !!nm.permission, "permesso " + (nm.permission ? "concesso" : "NEGATO") + " · riconoscimento " + (nm.recognizerBusy ? "IN USO" : "fermo") + " · registrazioni altrui " + recList(nm) + (nm.events && nm.events.length ? " · diario: " + nm.events.slice(-3).join(" | ") : "")); }
      }).then(function () { if (held) CP.micRelease(); }, function (e) { if (held) CP.micRelease(); row("Prova interrotta", false, errTxt(e)); })
        .then(function () { CP.micClose(); return deep(); });
    });
    return P.then(function () {
      var lg = CP.micLogList ? CP.micLogList() : [];
      row("Diario del microfono (app)", true, lg.length ? lg.map(function (x) { return "+" + x.ms + "ms " + x.tag + (x.detail ? " (" + x.detail + ")" : ""); }).join(" | ") : "vuoto: nessun uso del microfono da quando l'app è aperta");
      return rows;
    });
  };

  /* Prova del riconoscimento vocale (quello delle carte): chi lo fa su questo telefono e cosa succede con due percorsi, uno dopo l'altro.
     Si dice «你好» (poi una parola a scelta) a ogni prova. Il codice di errore grezzo di Android distingue il silenzio (6) dal «sentito ma non capito» (7). */
  /* una sessione di riconoscimento sul ponte: restituisce tutti gli eventi con i tempi (compreso sr-code, il codice grezzo di Android). Non decide niente: racconta. */
  CP.srTest = function (route, lang) {
    var A = window.MandarinoAndroid, AND = window.__mdAnd;
    return new Promise(function (ok) {
      var id = AND.nid("t"), t0 = Date.now(), ev = [], done = false;
      function fin(why) { if (done) return; done = true; delete AND.wait[id]; ok({ route: route, ms: Date.now() - t0, events: ev, why: why }); }
      AND.wait[id] = function (type, data) {
        ev.push({ t: Date.now() - t0, type: type, data: type === "sr-result" ? (function () { try { return JSON.parse(data).map(function (a) { return a.t; }).join(" | "); } catch (e) { return data; } })() : data });
        if (type === "sr-end") fin("fine");
      };
      try { A.srStart(id, lang || "zh-CN", 5); } catch (e) { ev.push({ t: 0, type: "eccezione", data: String(e) }); fin("eccezione"); return; }
      setTimeout(function () { try { A.srAbort(id); } catch (e) {} fin("tempo scaduto"); }, 14000);
    });
  };
  CP.srDiag = function () {
    var A = window.MandarinoAndroid, rows = [];
    function row(n, ok, t) { rows.push([n, ok, String(t == null ? "" : t)]); }
    if (!A || !window.__mdAnd) return Promise.resolve([["Riconoscimento vocale", true, "la prova esiste solo nell'APK"]]);
    var info = null; try { info = JSON.parse(A.srInfo()); } catch (e) { row("Servizio vocale", false, "srInfo non disponibile: " + e); }
    if (info) {
      row("Servizio vocale predefinito", !!info.available, (info.default || "(non impostato)") + " · riconoscimento disponibile " + !!info.available + (info.onDevice !== undefined ? " · sul telefono " + !!info.onDevice : ""));
      row("Servizi di riconoscimento installati", (info.services || []).length > 0, (info.services || []).join(" ; ") || "nessuno");
      row("Versioni app vocali", true, Object.keys(info.versions || {}).map(function (k) { return k + " " + info.versions[k]; }).join(" · ") || "nessuna visibile");
    }
    function show(r, label) {
      var ev = r.events.map(function (x) { return x.type.replace("sr-", "") + "@" + x.t + (x.data ? "(" + x.data + ")" : ""); }).join(" ");
      var res = r.events.filter(function (x) { return x.type === "sr-result"; })[0], err = r.events.filter(function (x) { return x.type === "sr-error"; })[0];
      row(label, !!res, (res ? "HA SENTITO: " + res.data : err ? "errore " + err.data : "nessuna risposta") + " · " + r.ms + " ms · " + ev);
    }
    function pause(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
    return CP.srTest("classic", "zh-CN").then(function (r) { show(r, "Riconoscimento: prova 1"); return pause(900); })
      .then(function () { return CP.srTest("classic", "zh-CN"); }).then(function (r) { show(r, "Riconoscimento: prova 2"); })
      .then(function () { return rows; }, function (e) { row("Prova interrotta", false, String(e)); return rows; });
  };
})();
