/* Traccia «Pioggia a Shanghai (lo-fi)» · 🎯 concentrazione. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, rnd = kit.rnd, pick = kit.pick, partials = kit.partials, bed = kit.bed, space = kit.space;
  CP.audioTracks.add({ id: "shanghai", ico: "🌆", name: "Pioggia a Shanghai (lo-fi)", desc: "Rhodes caldo, accordi pentatonici, pioggia", mood: "focus", make: function (c, bus) {
      var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1700; lp.connect(bus);
      var sp = space(c, lp, 0.38, 0.3, 0.3, 1500), rain = bed(c, bus, "highpass", 1400, 0.5, 0.05, 0.12, 0.012), rain2 = bed(c, bus, "lowpass", 380, 0.5, 0.05, 0, 0);
      var CH = [[48, 55, 64, 67, 71], [45, 52, 60, 64, 67], [53, 60, 67, 69, 72], [55, 62, 69, 71, 76], [50, 57, 62, 64, 69]], PE = [72, 74, 76, 79, 81], t = 0, ci = 0, tm = 0;
      return { step: function (until, now) {
        if (t < now) t = now + 0.1; if (tm < now) tm = now + 2;
        while (t < until) { var ch = CH[ci++ % CH.length]; ch.forEach(function (m, k) { partials(c, sp.in, hz(m), t + k * 0.045, 0.16, 2.8, [[1, 1, 1], [2, 0.35, 0.5], [3.01, 0.1, 0.3], [7, 0.05, 0.1]], 0.012); }); t += rnd(4.2, 6); }
        while (tm < until) { if (Math.random() < 0.7) partials(c, sp.in, hz(pick(PE)), tm, 0.12, 1.6, [[1, 1, 1], [2, 0.3, 0.4]], 0.01); tm += rnd(1.6, 3.4); } },
        stop: function () { rain.stop(); rain2.stop(); sp.stop(); setTimeout(function () { try { lp.disconnect(); } catch (e) {} }, 500); } };
    } });
})(CP.synth);
