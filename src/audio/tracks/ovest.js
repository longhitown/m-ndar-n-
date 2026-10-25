/* Traccia «Alba sul Lago Ovest» · 🧘 calma. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, rnd = kit.rnd, pluck = kit.pluck, flute = kit.flute, chirp = kit.chirp, space = kit.space, walker = kit.walker;
  CP.audioTracks.add({ id: "ovest", ico: "🌸", name: "Alba sul Lago Ovest", desc: "Flauto lungo, arpeggi lenti, uccellini (mi pentatonico)", mood: "calm", make: function (c, bus) {
      var sp = space(c, bus, 0.45, 0.33, 0.4, 2800), S = [64, 66, 68, 71, 73, 76, 78, 80], nx = walker(S.length, 2), t = 0, tf = 0, tb = 0;
      return { step: function (until, now) {
        if (t < now) t = now + 0.1; if (tf < now) tf = now + 0.6; if (tb < now) tb = now + 3;
        while (t < until) { var k = nx(); for (var i = 0; i < 4; i++) pluck(c, sp.in, hz(S[Math.max(0, Math.min(S.length - 1, k + i))]), t + i * 0.32, 0.62, { coef: 0.4992, len: 2.6 }); t += rnd(2.6, 4); }
        while (tf < until) { flute(c, sp.in, hz(S[nx()]), tf, rnd(2, 3.4), 0.24); tf += rnd(3.5, 6.5); }
        while (tb < until) { chirp(c, bus, tb, 0.025); tb += rnd(4, 11); } }, stop: function () { sp.stop(); } };
    } });
})(CP.synth);
