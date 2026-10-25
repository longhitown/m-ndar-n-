/* Traccia «Notte sul Fiume Li» · 🧘 calma. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, rnd = kit.rnd, pluck = kit.pluck, drop = kit.drop, space = kit.space, walker = kit.walker;
  CP.audioTracks.add({ id: "li", ico: "🏮", name: "Notte sul Fiume Li", desc: "Guqin profondo, la minore pentatonica, gocce d'acqua", mood: "calm", make: function (c, bus) {
      var sp = space(c, bus, 0.5, 0.4, 0.45, 1800), S = [45, 48, 50, 52, 55, 57, 60, 62], nx = walker(S.length, 3), t = 0, td = 0;
      return { step: function (until, now) {
        if (t < now) t = now + 0.05; if (td < now) td = now + 0.2;
        while (t < until) { var i = nx(); pluck(c, sp.in, hz(S[i]), t, rnd(0.6, 0.95), { coef: 0.4996, len: 3.6, lp: 1100 }); if (Math.random() < 0.3) pluck(c, sp.in, hz(S[Math.max(0, i - 2)]) * 2, t + 0.02, 0.18, { coef: 0.499, len: 2, lp: 1500 }); t += rnd(1.5, 3.2); }
        while (td < until) { drop(c, sp.in, td, rnd(0.04, 0.09)); td += rnd(0.5, 2.6); } }, stop: function () { sp.stop(); } };
    } });
})(CP.synth);
