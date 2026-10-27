/* ===== màndarínō · attrezzi sonori del jukebox (tutto sintetizzato sul momento: zero file, zero rete) =====
   Ogni traccia (audio/tracks/*.js) li prende da CP.synth. Qui sta anche il registro delle tracce: CP.audioTracks.add({...}).
   Contratto di una traccia: { id, ico, name, desc, mood: "calm" | "focus" | "energy", make(c, bus) },
   dove make riceve l'AudioContext e il nodo d'uscita e restituisce { step(until, now), stop() }:
   step programma le note da «now» fino a «until» (secondi del contesto); stop ferma letti e code. */
(function () {
  var CP = window.CP;
  var S = { noise: null, bufs: {}, live: 0 };
  var MAXV = 40;                          /* tetto di oscillatori in coda: sotto il 15% di CPU su un telefono medio */
  function track(o) { S.live++; o.onended = function () { S.live = Math.max(0, S.live - 1); try { o.disconnect(); } catch (e) {} }; return o; }
  function room(n) { return S.live + (n || 1) <= MAXV; }
  /* ---------- attrezzi sonori ---------- */
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function noiseLoop(c) {
    if (S.noise && S.noise.sampleRate === c.sampleRate) return S.noise;
    var n = c.sampleRate * 3, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), i;
    for (i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (S.noise = b);
  }
  /* corda pizzicata (Karplus-Strong). coef: piu' vicino a .5 = spegne prima; len = secondi */
  function pluckBuf(c, f, coef, len) {
    var key = Math.round(f * 10) + "|" + coef + "|" + len;
    if (S.bufs[key]) return S.bufs[key];
    var sr = c.sampleRate, n = Math.floor(sr * len), N = Math.max(2, Math.round(sr / f)), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0), i;
    var ring = new Float32Array(N); for (i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    for (i = 0; i < n; i++) { var j = i % N, k = (i + 1) % N; d[i] = ring[j]; ring[j] = coef * (ring[j] + ring[k]); }
    var env = Math.floor(sr * 0.004); for (i = 0; i < env; i++) d[i] *= i / env;
    return (S.bufs[key] = buf);
  }
  function pluck(c, out, f, t, vel, o) {
    o = o || {};
    var src = c.createBufferSource(), g = c.createGain(), lp = null;
    src.buffer = pluckBuf(c, f, o.coef || 0.4985, o.len || 2.2); g.gain.value = vel;
    src.connect(g);
    if (o.lp) { lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = o.lp; g.connect(lp); lp.connect(out); } else g.connect(out);
    src.start(t); src.onended = function () { try { g.disconnect(); if (lp) lp.disconnect(); } catch (e) {} };
  }
  /* parziali sinusoidali con inviluppo (campane, giada, Rhodes) */
  function partials(c, out, f, t, peak, dec, list, att) {
    list.forEach(function (p) {
      var o = track(c.createOscillator()), g = c.createGain(), d = dec * (p[2] || 1), a = att || 0.004;
      o.type = "sine"; o.frequency.value = f * p[0];
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak * p[1], t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + a + d + 0.05);
    });
  }
  /* flauto (dizi): onda quasi pura + vibrato lento + fiato */
  function flute(c, out, f, t, dur, vel) {
    var o = track(c.createOscillator()), lfo = track(c.createOscillator()), lg = c.createGain(), g = c.createGain(), o2 = track(c.createOscillator()), g2 = c.createGain();
    o.type = "triangle"; o.frequency.value = f; o2.type = "sine"; o2.frequency.value = f * 2; g2.gain.value = 0.18;
    lfo.frequency.value = 5.2; lg.gain.value = f * 0.007; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + 0.09); g.gain.setValueAtTime(vel * 0.85, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(out);
    var br = c.createBufferSource(), bp = c.createBiquadFilter(), bg = c.createGain();
    br.buffer = noiseLoop(c); br.loop = true; bp.type = "bandpass"; bp.frequency.value = f * 2; bp.Q.value = 3;
    bg.gain.setValueAtTime(0.0001, t); bg.gain.linearRampToValueAtTime(vel * 0.1, t + 0.05); bg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    br.connect(bp); bp.connect(bg); bg.connect(out);
    o.start(t); o2.start(t); lfo.start(t); br.start(t); var e = t + dur + 0.05; o.stop(e); o2.stop(e); lfo.stop(e); br.stop(e);
  }
  function drop(c, out, t, vel) {
    var o = c.createOscillator(), g = c.createGain(), f = rnd(900, 2000);
    o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.9, t + 0.06);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2);
  }
  function chirp(c, out, t, vel) {
    var n = 2 + Math.floor(Math.random() * 3), f = rnd(2800, 4200), i;
    for (i = 0; i < n; i++) {
      var o = c.createOscillator(), g = c.createGain(), tt = t + i * 0.11;
      o.type = "sine"; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(f * rnd(0.8, 1.3), tt + 0.08);
      g.gain.setValueAtTime(0.0001, tt); g.gain.linearRampToValueAtTime(vel, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.1);
      o.connect(g); g.connect(out); o.start(tt); o.stop(tt + 0.12);
    }
  }
  /* rumore filtrato continuo (brezza, pioggia). Ritorna il nodo da fermare. */
  function bed(c, out, type, freq, q, gain, lfoHz, lfoDepth) {
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), nodes = [s, f, g];
    s.buffer = noiseLoop(c); s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
    s.connect(f); f.connect(g); g.connect(out);
    var l = null;
    if (lfoHz) { l = c.createOscillator(); var lg = c.createGain(); l.frequency.value = lfoHz; lg.gain.value = lfoDepth; l.connect(lg); lg.connect(g.gain); l.start(); nodes.push(l, lg); }
    s.start();
    return { stop: function () { try { s.stop(); if (l) l.stop(); } catch (e) {} setTimeout(function () { nodes.forEach(function (n) { try { n.disconnect(); } catch (e) {} }); }, 300); } };
  }
  /* eco morbido (un po' di "stanza") */
  function space(c, out, time, fb, wet, damp) {
    var inp = c.createGain(), d = c.createDelay(1.5), f = c.createGain(), lp = c.createBiquadFilter(), w = c.createGain();
    d.delayTime.value = time; f.gain.value = fb; lp.type = "lowpass"; lp.frequency.value = damp; w.gain.value = wet;
    inp.connect(out); inp.connect(d); d.connect(lp); lp.connect(f); f.connect(d); lp.connect(w); w.connect(out);
    return { in: inp, stop: function () { setTimeout(function () { [inp, d, f, lp, w].forEach(function (n) { try { n.disconnect(); } catch (e) {} }); }, 400); } };
  }
  function walker(len, start) {
    var i = start;
    return function () { var r = Math.random(), st = r < 0.32 ? 0 : r < 0.62 ? 1 : r < 0.84 ? -1 : (Math.random() < 0.5 ? 2 : -2); i = Math.max(0, Math.min(len - 1, i + st)); return i; };
  }


  /* ---------- batteria sintetica e motore a sequencer (tutto da oscillatori e dal buffer di rumore, zero file) ---------- */
  function kick(c, out, t, v, f0, f1) { var o = track(c.createOscillator()), g = c.createGain(); o.frequency.setValueAtTime(f0 || 150, t); o.frequency.exponentialRampToValueAtTime(f1 || 45, t + 0.12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3); }
  function snare(c, out, t, v, f) { var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseLoop(c); fl.type = "bandpass"; fl.frequency.value = f || 1800; fl.Q.value = 0.8; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * 2); s.stop(t + 0.18); }
  function hat(c, out, t, v, open, brush) {
    var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), d = brush ? (open ? 0.22 : 0.09) : (open ? 0.18 : 0.04);
    s.buffer = noiseLoop(c); fl.type = brush ? "bandpass" : "highpass"; fl.frequency.value = brush ? 2600 : 7000; if (brush) fl.Q.value = 0.6;
    g.gain.setValueAtTime(brush ? 0.0001 : v, t); if (brush) g.gain.linearRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * 2); s.stop(t + d + 0.02);
  }
  /* tamburo a cornice / tamburo grave: colpo sinusoidale + pelle (rumore passa-banda basso) */
  function tom(c, out, t, v, f) { kick(c, out, t, v, f || 180, (f || 180) * 0.6); var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseLoop(c); fl.type = "bandpass"; fl.frequency.value = (f || 180) * 1.6; fl.Q.value = 1.4; g.gain.setValueAtTime(v * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * 2); s.stop(t + 0.14); }
  function bassNote(c, out, f, t, d, v, type) { var o = track(c.createOscillator()), lp = c.createBiquadFilter(), g = c.createGain(); o.type = type || "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(220, t + d); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05); }
  /* onda quadra con inviluppo secco (chiptune) */
  function square(c, out, f, t, d, v) { var o = track(c.createOscillator()), g = c.createGain(); o.type = "square"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.setValueAtTime(v * 0.7, t + d * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.02); }
  function binaural(c, bus, fl, fr, v) {
    var ns = [];
    [[fl, -1], [fr, 1]].forEach(function (p) {
      var o = c.createOscillator(), g = c.createGain(), pn = c.createStereoPanner ? c.createStereoPanner() : null;
      o.type = "sine"; o.frequency.value = p[0]; g.gain.value = v; o.connect(g);
      if (pn) { pn.pan.value = p[1]; g.connect(pn); pn.connect(bus); ns.push(pn); } else g.connect(bus);
      o.start(); ns.push(o, g);
    });
    return { stop: function () { ns.forEach(function (n) { try { if (n.stop) n.stop(); } catch (e) {} }); setTimeout(function () { ns.forEach(function (n) { try { n.disconnect(); } catch (e) {} }); }, 300); } };
  }
  var BELL = [[1, 1, 1], [2.76, 0.4, 0.6], [5.4, 0.18, 0.35]], JADE = [[1, 1, 1], [2, 0.3, 0.5], [3, 0.08, 0.3]];
  /* una traccia descritta come dati: 16 passi per battuta, swing, progressione (una fondamentale o [fondamentale, intervalli] per battuta),
     melodia a passeggiata sulla scala. bpm 0 = solo letti di rumore ed eventi sparsi (ev). */
  function groove(spec) {
    return function (c, bus) {
      var sp = space(c, bus, spec.delay || 0.3, spec.fb || 0.25, spec.wet || 0.25, spec.damp || 2800);
      var beds = (spec.beds || []).map(function (b) { return bed(c, bus, b[0], b[1], b[2], b[3], b[4], b[5]); });
      var bin = spec.binaural ? binaural(c, bus, spec.binaural[0], spec.binaural[1], spec.binaural[2] || 0.05) : null;
      var stopAll = function () { beds.forEach(function (b) { b.stop(); }); if (bin) bin.stop(); sp.stop(); };
      var te = 0;
      function events(until, now) { if (!spec.ev) return; if (te < now) te = now + rnd(0.3, 1.5); while (te < until) { if (room(4)) spec.ev(c, sp.in, te, bus); te += rnd(spec.evMin || 2, spec.evMax || 6); } }
      if (!spec.bpm) return { step: events, stop: stopAll };
      var step = 60 / spec.bpm / 4, t = 0, n = 0, bar = 0, nx = walker(spec.scale ? spec.scale.length : 1, 2);
      return {
        step: function (until, now) {
          if (t < now) t = now + 0.05;
          events(until, now);
          while (t < until) {
            var s = n % 16, sw = (s % 2) ? step * (spec.swing || 0) : 0, tt = t + sw, pr = spec.prog ? spec.prog[bar % spec.prog.length] : 48;
            var root = Array.isArray(pr) ? pr[0] : pr, chordIv = Array.isArray(pr) ? pr[1] : spec.chord;
            if (spec.kick && spec.kick[s] === "x") kick(c, bus, tt, spec.kv || 0.5, spec.kf0, spec.kf1);
            if (spec.snare && spec.snare[s] === "x") snare(c, bus, tt, spec.sv || 0.25, spec.sf);
            if (spec.tom && spec.tom[s] === "x") tom(c, bus, tt, spec.tv || 0.35, spec.tf);
            if (spec.hat && spec.hat[s] !== ".") hat(c, bus, tt, spec.hv || 0.06, spec.hat[s] === "o", spec.brush);
            if (spec.bass && spec.bass[s] === "x") { var bw = spec.walk ? spec.walk[Math.floor(s / 4) % spec.walk.length] : 0; bassNote(c, bus, hz(root - 12 + bw), tt, step * (spec.blen || 1.8), spec.bv || 0.22, spec.btype); }
            var chordHere = chordIv && (spec.stab ? spec.stab[s] === "x" : (s === 0 && bar % (spec.chordEvery || 1) === 0));
            if (chordHere && room(chordIv.length * (spec.ctype === "square" ? 1 : 3))) chordIv.forEach(function (iv, k) {
              if (spec.ctype === "square") square(c, sp.in, hz(root + iv), tt, spec.stab ? step * 1.5 : step * 8, (spec.cv || 0.05));
              else partials(c, sp.in, hz(root + iv), tt + k * (spec.stab ? 0 : 0.03), spec.cv || 0.1, spec.stab ? 0.22 : (spec.cdec || 2.2), JADE, 0.01);
            });
            var L = spec.lead;
            if (L && Math.random() < L.p && s % (L.every || 2) === 0 && room(3)) {
              var f = hz(spec.scale[nx()]);
              if (L.inst === "pluck") pluck(c, sp.in, f, tt, L.v || 0.5, { coef: 0.4985, len: 1.4 });
              else if (L.inst === "flute") flute(c, sp.in, f, tt, step * 4, L.v || 0.18);
              else if (L.inst === "square") square(c, sp.in, f, tt, step * 1.6, L.v || 0.05);
              else if (L.inst === "vibe") partials(c, sp.in, f, tt, L.v || 0.12, 1.2, [[1, 1, 1], [4, 0.2, 0.3]], 0.004);
              else partials(c, sp.in, f, tt, L.v || 0.14, 0.9, [[1, 1, 1], [2, 0.25, 0.4]], 0.005);
            }
            n++; t += step; if (s === 15) bar++;
          }
        },
        stop: stopAll
      };
    };
  }


  CP.synth = { hz: hz, rnd: rnd, pick: pick, noiseLoop: noiseLoop, pluck: pluck, partials: partials, flute: flute, drop: drop, chirp: chirp, bed: bed, space: space, walker: walker, kick: kick, snare: snare, hat: hat, tom: tom, bassNote: bassNote, square: square, binaural: binaural, groove: groove, track: track, room: room, BELL: BELL, JADE: JADE, MAXV: MAXV,
    live: function () { return S.live; }, reset: function () { S.bufs = {}; } };
  var MOOD = { calm: 1, focus: 1, energy: 1 };
  CP.audioTracks = {
    list: [],
    add: function (t) {
      if (!t || !t.id || typeof t.make !== "function" || !MOOD[t.mood]) { if (window.console) console.warn("Traccia non valida:", t && t.id); return; }
      if (this.list.some(function (x) { return x.id === t.id; })) { if (window.console) console.warn("Traccia doppia:", t.id); return; }
      this.list.push(t);
    }
  };
})();
