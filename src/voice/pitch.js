/* ===== màndarínō · altezza della voce, offline: il motore sotto il pannello «Parla» (voice-panel.js).
   Microfono → AnalyserNode del contesto audio dell'app → NSDF (McLeod) su un segnale ridotto a ~12 kHz.
   Robusto per i telefoni veri: soglia del rumore misurata all'inizio (niente soglia fissa: con il guadagno automatico
   spento molti microfoni danno una voce 5-10 volte più bassa), inizio solo dopo qualche fotogramma di voce di fila
   (un colpo di tosse non avvia niente), fine dopo una pausa vera, errori d'ottava corretti sulla mediana recente. ===== */
(function () {
  var CP = window.CP;
  CP.canScope = function () { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext)); };

  /* frequenza fondamentale di un blocco di campioni; gate = livello minimo (RMS) per considerarlo voce */
  function detect(buf, sr, gate) {
    var k = Math.max(1, Math.round(sr / 12000)), n = Math.floor(buf.length / k), x = new Float32Array(n), i, j, mean = 0, sum = 0;
    for (i = 0; i < n; i++) { var s = 0; for (j = 0; j < k; j++) s += buf[i * k + j]; x[i] = s / k; mean += x[i]; }
    mean /= n || 1;
    for (i = 0; i < n; i++) { x[i] -= mean; sum += x[i] * x[i]; }
    var rms = Math.sqrt(sum / (n || 1)), r = sr / k;
    if (rms < (gate == null ? 0.004 : gate)) return { f: 0, c: 0, rms: rms };
    var W = n >> 1, minLag = Math.max(2, Math.floor(r / 500)), maxLag = Math.min(Math.floor(r / 65), W - 2), nsdf = new Float32Array(maxLag + 2), tau;
    for (tau = minLag - 1; tau <= maxLag + 1; tau++) {
      var acf = 0, m = 0;
      for (i = 0; i < W; i++) { var a = x[i], b = x[i + tau]; acf += a * b; m += a * a + b * b; }
      nsdf[tau] = m > 0 ? 2 * acf / m : 0;
    }
    var peaks = [], best = 0;
    for (tau = minLag; tau <= maxLag; tau++) if (nsdf[tau] > 0 && nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1]) { peaks.push(tau); if (nsdf[tau] > best) best = nsdf[tau]; }
    if (!peaks.length || best < 0.5) return { f: 0, c: best, rms: rms };
    var pk = peaks[0];
    for (i = 0; i < peaks.length; i++) if (nsdf[peaks[i]] >= 0.88 * best) { pk = peaks[i]; break; }
    var y0 = nsdf[pk - 1], y1 = nsdf[pk], y2 = nsdf[pk + 1], den = y0 - 2 * y1 + y2, sh = den ? 0.5 * (y0 - y2) / den : 0;
    return { f: r / (pk + sh), c: y1, rms: rms };
  }
  CP._detect = detect;
  function semis(f, ref) { return 12 * Math.log(f / ref) / Math.LN2; }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b.length ? b[b.length >> 1] : 0; }
  CP._semis = semis;

  /* forma ideale di ogni tono, in semitoni attorno alla voce di chi parla */
  var IDEAL = { 1: [[0, 2], [1, 2]], 2: [[0, -2], [1, 3]], 3: [[0, -2.5], [0.4, -5], [1, 1]], 4: [[0, 4], [1, -4]], 5: [[0, 0], [1, -0.5]] };
  function idealAt(tones, x) {
    var n = tones.length, seg = Math.min(n - 1, Math.floor(x * n)), lx = x * n - seg, pts = IDEAL[tones[seg]] || IDEAL[5], i;
    for (i = 0; i < pts.length - 1; i++) if (lx <= pts[i + 1][0]) {
      var t = (lx - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1); return pts[i][1] + t * (pts[i + 1][1] - pts[i][1]);
    }
    return pts[pts.length - 1][1];
  }
  CP._idealAt = idealAt;

  /* tono di una sillaba isolata da una curva in semitoni: giudizio indicativo, mai una certezza */
  function classify(v) {
    if (v.length < 8) return null;
    var avg = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }, k = Math.max(2, Math.floor(v.length / 3));
    var a = avg(v.slice(0, k)), m = avg(v.slice(k, v.length - k)), z = avg(v.slice(v.length - k));
    var range = Math.max.apply(null, v) - Math.min.apply(null, v), rise = z - a;
    if (range < 2.6) return 1;
    var sm = v.map(function (x, i) { return (v[Math.max(0, i - 1)] + x + v[Math.min(v.length - 1, i + 1)]) / 3; });
    var smn = Math.min.apply(null, sm), pos = sm.indexOf(smn) / (sm.length - 1), k0 = Math.max(2, Math.floor(v.length / 6));
    if (pos > 0.12 && pos < 0.75 && avg(sm.slice(0, k0)) - smn >= 1.5 && avg(sm.slice(sm.length - k0)) - smn >= 2.0) return 3;
    if (Math.min(a, z) - m >= 1.3 && z - m >= 1.3) return 3;
    if (rise >= 2.4) return 2;
    if (rise <= -3.6) return 4;
    if (rise <= -1.5) return 3;
    return rise > 0 ? 2 : (range > 4 ? 4 : 1);
  }
  CP._classify = function (track) { return classify(track.map(function (p) { return p.s; })); };

  /* da una registrazione (punti {t, f}) alla curva da mostrare: tempo normalizzato sulla parte con voce, semitoni attorno
     alla voce di chi parla, lisciata, spostata in verticale dove combacia meglio con la forma ideale; aderenza = quota dei
     punti a meno di 2,5 semitoni dalla forma */
  function fit(pts, tones) { return { off: Math.max(-3, Math.min(3, median(pts.map(function (p) { return idealAt(tones, Math.min(0.999, p.x)) - p.s; })))) }; }
  CP.pitchAnalyze = function (pts, tones) {
    var v = pts.filter(function (p) { return p.f > 0; });
    if (v.length < 6) return { voiced: v.length, pts: [], score: 0, tone: null };
    var t0 = v[0].t, t1 = v[v.length - 1].t, dur = Math.max(0.05, t1 - t0), med = median(v.map(function (p) { return p.f; }));
    var raw = v.map(function (p) { return { x: (p.t - t0) / dur, s: semis(p.f, med), gap: false }; });
    for (var i = 1; i < raw.length; i++) if (v[i].t - v[i - 1].t > 0.12) raw[i].gap = true;   /* consonanti sorde: la linea si interrompe */
    var out = raw.map(function (p, i) {
      var w = raw.slice(Math.max(0, i - 2), i + 3).map(function (q) { return q.s; });
      return { x: p.x, s: median(w), gap: p.gap };
    });
    var tone = tones && tones.length === 1 ? classify(out.map(function (p) { return p.s; })) : null;
    var off = 0;
    if (tones && tones.length) {
      off = fit(out, tones).off;
      out.forEach(function (p) { p.s += off; p.ok = Math.abs(p.s - idealAt(tones, Math.min(0.999, p.x))) <= 2.5; });
    }
    var score = tones && tones.length ? Math.round(100 * out.filter(function (p) { return p.ok; }).length / out.length) : 0;
    return { voiced: v.length, pts: out, score: score, tone: tone, median: med, dur: dur };
  };

  /* una sessione d'ascolto. o.onFrame({level, voiced, pts, state}) a ogni fotogramma; o.onEnd({pts, blob, error}).
     Va chiamata dentro il gesto (tocco) che la avvia: lì il contesto audio si sveglia. */
  CP.pitchSession = function (o) {
    var maxSec = o.maxSec || 3.5, c = CP.getCtx ? CP.getCtx() : null, S = { stopped: false };
    if (c && c.state !== "running" && c.resume) { try { c.resume(); } catch (e) {} }
    var src = null, an = null, sink = null, raf = 0, iv = 0, buf, rec = null, chunks = [], held = false;
    var pts = [], noise = [], gate = 0.004, floor = 0, started = 0, lastV = 0, runV = 0, tStart = 0, prev = 0, hist = [], state = "wait";
    if (CP.musicHold) CP.musicHold(true);
    function release() {
      if (held) { held = false; if (CP.micRelease) CP.micRelease(); }
      if (CP.musicHold) CP.musicHold(false);
    }
    function cleanup() {
      S.stopped = true; cancelAnimationFrame(raf); clearInterval(iv);
      try { if (src) src.disconnect(); } catch (e) {}
      try { if (sink) sink.disconnect(); } catch (e) {}
    }
    function end(err) {
      if (S.stopped) return; cleanup();
      var fin = function (blob) { release(); o.onEnd({ pts: pts, blob: blob || null, error: err || null }); };
      if (rec && rec.state !== "inactive") {
        /* su alcuni Android «onstop» non arriva mai: senza il ripiego il microfono restava «in uso» per sempre e l'app andava riavviata */
        var fired = false, once = function (b) { if (fired) return; fired = true; fin(b); };
        rec.onstop = function () { once(chunks.length ? new Blob(chunks, { type: (chunks[0] && chunks[0].type) || rec.mimeType || "audio/webm" }) : null); };
        setTimeout(function () { once(null); }, 700);
        try { rec.stop(); } catch (e) { once(null); }
      } else fin(null);
    }
    function step() {
      if (S.stopped) return;
      an.getFloatTimeDomainData(buf);
      var now = performance.now() / 1000, el = now - tStart;
      if (el < 0.25) {   /* i primi 250 ms: si misura il rumore della stanza */
        var r0 = detect(buf, c.sampleRate, 1); noise.push(r0.rms);
        floor = median(noise); gate = Math.max(0.0025, Math.min(0.05, floor * 2.4));
        o.onFrame({ level: 0, voiced: false, pts: pts, state: "calib", t: el }); return;
      }
      var r = detect(buf, c.sampleRate, gate), f = r.f;
      if (f > 0 && prev) {
        var best = f, bd = 99;
        [f, f * 2, f / 2].forEach(function (cand) { var d = Math.abs(semis(cand, prev)); if (d < bd) { bd = d; best = cand; } });
        f = bd > 6 ? 0 : best;
      }
      if (f > 0) {
        hist.push(f); if (hist.length > 5) hist.shift();
        runV++; lastV = now;
        if (!started && runV >= 3) { started = now - 0.06; state = "voice"; }
        if (started) { prev = median(hist); pts.push({ t: now - started, f: prev }); }
        else prev = f;
      } else {
        runV = 0;
        if (r.rms < gate) { floor = floor * 0.97 + r.rms * 0.03; gate = Math.max(0.0025, Math.min(0.05, floor * 2.4)); }
        if (!started && now - lastV > 0.3) { prev = 0; hist = []; }
      }
      var level = Math.max(0, Math.min(1, (Math.log(Math.max(r.rms, 1e-5)) / Math.LN10 + 3.4) / 2.6));
      o.onFrame({ level: level, voiced: f > 0, pts: pts, state: state, t: started ? now - started : 0 });
      if (started) {
        var quiet = now - lastV;
        if (quiet > 0.6) {
          if (pts.length >= 8) { end(); return; }
          started = 0; pts = []; state = "wait"; hist = []; prev = 0;   /* era solo un rumore: si ricomincia ad aspettare */
        }
        if (started && now - started > maxSec) { end(); return; }
      }
      if (!started && el > (o.waitSec || 7)) end("silence");
    }
    function loop() { if (S.stopped) return; raf = requestAnimationFrame(loop); step(); }
    var gs = CP.micStream();
    held = true;
    gs.then(function (stream) {
      if (S.stopped) { release(); return; }
      if (!c) { cleanup(); release(); o.onEnd({ pts: [], error: "NotSupportedError" }); return; }
      if (c.state !== "running" && c.resume) { try { c.resume(); } catch (e) {} }
      src = c.createMediaStreamSource(stream); an = c.createAnalyser(); an.fftSize = 2048;
      sink = c.createGain(); sink.gain.value = 0;   /* il grafo resta «vivo» anche nei browser che non elaborano i nodi senza uscita */
      src.connect(an); an.connect(sink); sink.connect(c.destination);
      buf = new Float32Array(an.fftSize);
      if (window.MediaRecorder) { try { rec = new MediaRecorder(stream); rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); }; rec.start(); } catch (e) { rec = null; } }
      tStart = performance.now() / 1000;
      raf = requestAnimationFrame(loop);
      iv = setInterval(function () { if (document.hidden) step(); }, 50);   /* rAF si ferma a schermo spento: si continua comunque */
    }, function (err) {
      held = false; cleanup(); if (CP.musicHold) CP.musicHold(false);
      o.onEnd({ pts: [], error: (err && err.name) || "error" });
    });
    S.stop = function (discard) { if (S.stopped) return; if (discard) { cleanup(); try { if (rec && rec.state !== "inactive") { rec.onstop = null; rec.stop(); } } catch (e) {} release(); return; } end(pts.length >= 6 ? null : "silence"); };
    return S;
  };
})();
