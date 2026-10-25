/* Traccia «Giardino di Suzhou» · 🧘 calma. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, rnd = kit.rnd, pluck = kit.pluck, bed = kit.bed, space = kit.space, walker = kit.walker;
  CP.audioTracks.add({ id: "suzhou", ico: "🎋", name: "Giardino di Suzhou", desc: "Guzheng lento, scala di do pentatonica, brezza", mood: "calm", make: function (c, bus) {
      var sp = space(c, bus, 0.42, 0.28, 0.35, 2600), br = bed(c, sp.in, "bandpass", 700, 0.7, 0.025, 0.07, 0.015), S = [60, 62, 64, 67, 69, 72, 74, 76], nx = walker(S.length, 3), t = 0, idx = 3;
      return { step: function (until, now) {
        if (t < now) t = now + 0.05;
        while (t < until) {
          if (Math.random() < 0.18) { var d = Math.random() < 0.5 ? 1 : -1, k = idx; for (var i = 0; i < 5; i++) { k = Math.max(0, Math.min(S.length - 1, k + d)); pluck(c, sp.in, hz(S[k]), t + i * 0.13, 0.4 + i * 0.03, { coef: 0.4992, len: 2.6 }); } idx = k; t += 1.9 + rnd(0, 0.8); }
          else { idx = nx(); pluck(c, sp.in, hz(S[idx]), t, rnd(0.5, 0.8), { coef: 0.4992, len: 2.6 }); if (Math.random() < 0.15) pluck(c, sp.in, hz(S[idx]) / 2, t, 0.3, { coef: 0.4988 }); t += rnd(0.75, 1.7); }
        } }, stop: function () { br.stop(); sp.stop(); } };
    } });
})(CP.synth);
