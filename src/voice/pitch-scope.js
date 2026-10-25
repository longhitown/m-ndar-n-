/* ===== V4c: oscilloscopio dei toni (microfono + autocorrelazione, funziona offline) ===== */
(function () {
  var CP = window.CP, esc = CP.esc;
  CP.canScope = function () { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); };

  /* altezza della voce con la funzione NSDF (McLeod): evita la maggior parte degli errori d'ottava */
  function detect(buf, sr) {
    var n = buf.length, W = n >> 1, i, sum = 0;
    for (i = 0; i < n; i++) sum += buf[i] * buf[i];
    var rms = Math.sqrt(sum / n);
    if (rms < 0.015) return { f: 0, c: 0, rms: rms };
    var minLag = Math.floor(sr / 420), maxLag = Math.min(Math.floor(sr / 60), W - 1), nsdf = new Float32Array(maxLag + 2), tau;
    for (tau = minLag - 1; tau <= maxLag + 1; tau++) {
      var acf = 0, m = 0;
      for (i = 0; i < W; i++) { var a = buf[i], b = buf[i + tau]; acf += a * b; m += a * a + b * b; }
      nsdf[tau] = m > 0 ? 2 * acf / m : 0;
    }
    var peaks = [], best = 0;
    for (tau = minLag; tau <= maxLag; tau++) {
      if (nsdf[tau] > 0 && nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1]) { peaks.push(tau); if (nsdf[tau] > best) best = nsdf[tau]; }
    }
    if (!peaks.length || best < 0.55) return { f: 0, c: best, rms: rms };
    var pk = peaks[0];
    for (i = 0; i < peaks.length; i++) if (nsdf[peaks[i]] >= 0.9 * best) { pk = peaks[i]; break; }
    var y0 = nsdf[pk - 1], y1 = nsdf[pk], y2 = nsdf[pk + 1], den = y0 - 2 * y1 + y2, shift = den ? 0.5 * (y0 - y2) / den : 0;
    return { f: sr / (pk + shift), c: y1, rms: rms };
  }
  CP._detect = detect;
  function semis(f, ref) { return 12 * Math.log(f / ref) / Math.LN2; }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b.length ? b[b.length >> 1] : 0; }

  /* forma ideale di ogni tono, in semitoni attorno alla voce di chi parla */
  var IDEAL = { 1: [[0, 2], [1, 2]], 2: [[0, -2], [1, 3]], 3: [[0, -2.5], [0.4, -5], [1, 1]], 4: [[0, 4], [1, -4]], 5: [[0, 0], [1, -0.5]] };
  function idealAt(tones, x) {
    var n = tones.length, seg = Math.min(n - 1, Math.floor(x * n)), lx = x * n - seg, pts = IDEAL[tones[seg]] || IDEAL[5], i;
    for (i = 0; i < pts.length - 1; i++) if (lx <= pts[i + 1][0]) {
      var t = (lx - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1); return pts[i][1] + t * (pts[i + 1][1] - pts[i][1]);
    }
    return pts[pts.length - 1][1];
  }

  /* classifica il tono di una sillaba isolata: giudizio indicativo, mai una certezza */
  function classify(track) {
    if (track.length < 8) return null;
    var v = track.map(function (p) { return p.s; });
    var k = Math.max(2, Math.floor(v.length / 3)), avg = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
    var a = avg(v.slice(0, k)), m = avg(v.slice(k, v.length - k)), z = avg(v.slice(v.length - k));
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), range = mx - mn, rise = z - a;
    if (range < 2.6) return 1;
    /* 3° tono: una discesa iniziale seguita da una risalita, con il punto più basso verso l'interno della sillaba */
    var sm = v.map(function (x, i) { var p = v[Math.max(0, i - 1)], q = v[Math.min(v.length - 1, i + 1)]; return (p + x + q) / 3; });
    var smn = Math.min.apply(null, sm), mi = sm.indexOf(smn), pos = mi / (sm.length - 1), k0 = Math.max(2, Math.floor(v.length / 6));
    var head = avg(sm.slice(0, k0)), tail = avg(sm.slice(sm.length - k0));
    if (pos > 0.12 && pos < 0.75 && head - smn >= 1.5 && tail - smn >= 2.0) return 3;
    var dipMid = Math.min(a, z) - m;
    if (dipMid >= 1.3 && z - m >= 1.3) return 3;
    if (rise >= 2.4) return 2;
    if (rise <= -3.6) return 4;
    if (rise <= -1.5) return 3;
    return rise > 0 ? 2 : (range > 4 ? 4 : 1);
  }
  CP._classify = classify;
  CP._idealAt = idealAt;

  CP.startPitchScope = function (canvas, targetTone, onStop) {
    var tones = [].concat(targetTone || [5]), ctx2 = canvas.getContext("2d"), dpr = window.devicePixelRatio || 1;
    var stream = null, src0 = null, ac = null, an = null, raf = 0, stopped = false, buf, pts = [], t0 = 0, lastVoiced = 0, tStart = 0, prev = 0, hist = [];
    function size() {
      var r = canvas.getBoundingClientRect(), w = Math.max(200, r.width), h = Math.max(120, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h };
    }
    function css(v, fb) { return (getComputedStyle(document.documentElement).getPropertyValue(v) || fb).trim() || fb; }
    function draw(final) {
      var d = size(), W = d.w, H = d.h, voiced = pts.filter(function (p) { return p.s !== null; });
      ctx2.clearRect(0, 0, W, H);
      ctx2.strokeStyle = "rgba(128,128,128,0.25)"; ctx2.lineWidth = 1; ctx2.beginPath(); ctx2.moveTo(0, H / 2); ctx2.lineTo(W, H / 2); ctx2.stroke();
      var dur = final ? Math.max(0.35, (pts.length ? pts[pts.length - 1].t : 0.35)) : 1.5, span = 14;
      var yOf = function (s) { return H / 2 - (s / span) * H; };
      /* curva ideale tratteggiata */
      ctx2.setLineDash([6, 6]); ctx2.strokeStyle = css("--muted", "#888"); ctx2.lineWidth = 2.5; ctx2.beginPath();
      for (var i = 0; i <= 60; i++) { var x = i / 60, y = yOf(idealAt(tones, x)); if (i) ctx2.lineTo(x * W, y); else ctx2.moveTo(x * W, y); }
      ctx2.stroke(); ctx2.setLineDash([]);
      /* la tua voce */
      ctx2.strokeStyle = css("--t2", "#1F7A3E"); ctx2.lineWidth = 4; ctx2.lineJoin = "round"; ctx2.lineCap = "round";
      var open = false; ctx2.beginPath();
      pts.forEach(function (p) {
        if (p.s === null) { open = false; return; }
        var x = Math.min(1, p.t / dur) * W, y = Math.max(4, Math.min(H - 4, yOf(p.s)));
        if (open) ctx2.lineTo(x, y); else { ctx2.moveTo(x, y); open = true; }
      });
      ctx2.stroke();
      ctx2.fillStyle = css("--muted", "#888"); ctx2.font = "13px sans-serif"; ctx2.fillText("tratteggio = forma del tono; verde = la tua voce", 8, H - 8);
    }
    function frame() {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      an.getFloatTimeDomainData(buf);
      var now = performance.now() / 1000, r = detect(buf, ac.sampleRate);
      if (r.f > 0) {
        var f = r.f;
        if (prev) {
          var cands = [f, f * 2, f / 2], bestC = f, bd = 99;
          cands.forEach(function (c) { var dd = Math.abs(semis(c, prev)); if (dd < bd) { bd = dd; bestC = c; } });
          f = bestC; if (bd > 5) { f = 0; }
        }
        if (f > 0) {
          hist.push(f); if (hist.length > 3) hist.shift();
          var fm = median(hist); prev = fm;
          if (!t0) { t0 = now; }
          pts.push({ t: now - t0, f: fm, s: null }); lastVoiced = now;
        }
      }
      if (t0 && now - lastVoiced > 0.45 && now - t0 > 0.2) { finish(); return; }
      if (t0 && now - t0 > 3.2) { finish(); return; }
      if (!t0 && now - tStart > 8) { finish(); return; }
      if (pts.length) {
        var med = median(pts.map(function (p) { return p.f; }));
        pts.forEach(function (p) { p.s = semis(p.f, med); });
      }
      draw(false);
    }
    var held = false;
    function cleanup() {
      stopped = true; cancelAnimationFrame(raf);
      /* V6: il flusso del microfono NON si chiude (niente nuovo permesso a ogni parola): si rilascia in modo morbido */
      if (held) { held = false; if (CP.micRelease) CP.micRelease(); if (CP.musicHold) CP.musicHold(false); }
      try { if (src0) src0.disconnect(); } catch (e) {}
      try { if (ac && ac.close) ac.close(); } catch (e) {}
    }
    function finish() {
      if (stopped) return; cleanup();
      var med = median(pts.map(function (p) { return p.f; }));
      pts.forEach(function (p) { p.s = semis(p.f, med); });
      draw(true);
      var res = { pts: pts, tone: tones.length === 1 ? classify(pts) : null, voiced: pts.length, median: med };
      onStop(res);
    }
    var api = { stop: function () { if (!stopped) { if (pts.length) finish(); else { cleanup(); onStop({ pts: [], tone: null, voiced: 0, median: 0 }); } } } };
    var getS = CP.micStream ? CP.micStream() : navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    held = !!CP.micStream; if (held && CP.musicHold) CP.musicHold(true);
    getS.then(function (s) {
      if (stopped) { if (held) { held = false; CP.micRelease(); if (CP.musicHold) CP.musicHold(false); } return; }
      stream = s;
      var AC = window.AudioContext || window.webkitAudioContext; ac = new AC();
      if (ac.resume) ac.resume();
      src0 = ac.createMediaStreamSource(s); an = ac.createAnalyser(); an.fftSize = 2048; src0.connect(an);
      buf = new Float32Array(an.fftSize); tStart = performance.now() / 1000; draw(false); raf = requestAnimationFrame(frame);
    }).catch(function (err) {
      if (held) { held = false; if (CP.musicHold) CP.musicHold(false); }
      stopped = true; onStop({ error: (err && err.name) || "error", pts: [] });
    });
    return api;
  };

  /* pannello dentro una scheda */
  var NAMES = { 1: "alto e piatto (1°)", 2: "che sale (2°)", 3: "che scende e risale (3°)", 4: "che cade (4°)" };
  CP.scopePanel = function (host, w) {
    var old = host.querySelector(".scope");
    if (old) { if (old._api) old._api.stop(); old.parentNode.removeChild(old); return; }
    var tones = CP.syllables(w.py).map(CP.tone), d = document.createElement("div"); d.className = "scope"; d.setAttribute("data-heard-host", "");
    d.innerHTML = '<canvas aria-label="Curva dell\'altezza della tua voce"></canvas><div class="acts" style="margin-top:0"><button type="button" data-sgo>🎙️ Parla ora: ' + CP.pinyinHTML(w.py) + '</button></div><div class="sverdict" aria-live="polite"></div>';
    host.appendChild(d);
    var cv = d.querySelector("canvas"), vd = d.querySelector(".sverdict"), btn = d.querySelector("[data-sgo]"), running = false;
    var idle = cv.getContext("2d"); cv.width = 600; cv.height = 340;
    function run() {
      if (running) { if (d._api) d._api.stop(); return; }
      running = true; btn.textContent = "⏹ Ferma"; vd.className = "sverdict"; vd.textContent = "Ti ascolto… di' la parola.";
      CP.stopSpeak();
      d._api = CP.startPitchScope(cv, tones, function (r) {
        running = false; btn.innerHTML = "🎙️ Riprova";
        if (r.error) {
          vd.className = "sverdict heard ko";
          if (CP.micBlocked && (r.error === "NotAllowedError" || r.error === "SecurityError")) CP.micBlocked();
          vd.innerHTML = r.error === "NotAllowedError" || r.error === "SecurityError" ? "Il microfono è bloccato in questa pagina. " + CP.frameBtn() : "Non riesco a usare il microfono (" + esc(r.error) + ").";
          return;
        }
        if (!r.voiced || r.voiced < 6) { vd.className = "sverdict heard ko"; vd.textContent = "Non ho sentito abbastanza voce. Avvicinati al microfono e dì la parola con calma."; return; }
        if (tones.length === 1) {
          var ok = r.tone === tones[0];
          vd.className = "sverdict heard " + (ok ? "ok" : "ko");
          vd.innerHTML = r.tone ? ("La tua voce sembra " + NAMES[r.tone] + ". " + (ok ? "È il tono giusto." : "Il tono giusto è " + NAMES[tones[0]] + ": segui il tratteggio.") + ' <span class="muted">Giudizio indicativo: dipende da microfono e rumore.</span>') : "Curva poco chiara: riprova.";
          CP.sfx(ok ? "ok" : "ko");
        } else {
          vd.className = "sverdict heard"; vd.innerHTML = 'Confronta la linea verde con il tratteggio, sillaba per sillaba. <span class="muted">Il giudizio automatico vale solo per una sillaba.</span>';
        }
      });
    }
    btn.addEventListener("click", run);
    d.scrollIntoView({ block: "nearest" });
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-scope]") : null; if (!b) return;
    var w = CP.WORDS[b.getAttribute("data-scope")]; if (!w) return;
    var host = b.closest(".fc") || b.parentNode; CP.scopePanel(host, w);
  });
})();
