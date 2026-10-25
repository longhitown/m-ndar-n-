/* Traccia «Tempio tra le Nuvole» · 🧘 calma. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, rnd = kit.rnd, pick = kit.pick, partials = kit.partials, space = kit.space;
  CP.audioTracks.add({ id: "tempio", ico: "🏯", name: "Tempio tra le Nuvole", desc: "Campane tibetane, bordone caldo, re pentatonico", mood: "calm", make: function (c, bus) {
      var sp = space(c, bus, 0.62, 0.45, 0.5, 1600), S = [50, 52, 54, 57, 59, 62, 64, 66], t = 0, dr = [];
      [hz(38), hz(45)].forEach(function (f, n) {
        var o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), lf = c.createOscillator(), lg = c.createGain();
        o.type = "sawtooth"; o2.type = "sawtooth"; o.frequency.value = f; o2.frequency.value = f * 1.004; lp.type = "lowpass"; lp.frequency.value = 340;
        g.gain.value = 0.07; lf.frequency.value = 0.05 + n * 0.03; lg.gain.value = 0.03; lf.connect(lg); lg.connect(g.gain);
        o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(bus); o.start(); o2.start(); lf.start(); dr.push(o, o2, lf, g, lg, lp);
      });
      return { step: function (until, now) {
        if (t < now) t = now + 0.3;
        while (t < until) { var f = hz(pick(S)); partials(c, sp.in, f, t, 0.3, 5.5, [[1, 1, 1], [2.76, 0.45, 0.6], [5.4, 0.2, 0.35], [8.93, 0.1, 0.2]], 0.006); t += rnd(3.5, 8); } },
        stop: function () { dr.forEach(function (n) { try { if (n.stop) n.stop(); } catch (e) {} }); setTimeout(function () { dr.forEach(function (n) { try { n.disconnect(); } catch (e) {} }); }, 300); sp.stop(); } };
    } });
})(CP.synth);
