/* Traccia «Casa da Tè nel Sichuan» · ⚡ energia. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, rnd = kit.rnd, pick = kit.pick, pluck = kit.pluck, flute = kit.flute, space = kit.space, walker = kit.walker;
  CP.audioTracks.add({ id: "sichuan", ico: "🍵", name: "Casa da Tè nel Sichuan", desc: "Pipa vivace e flauto dizi, sol maggiore", mood: "energy", make: function (c, bus) {
      var sp = space(c, bus, 0.3, 0.22, 0.25, 3000), S = [67, 69, 71, 74, 76, 79, 81, 83], nx = walker(S.length, 3), t = 0, tf = 0;
      return { step: function (until, now) {
        if (t < now) t = now + 0.05; if (tf < now) tf = now + 1.5;
        while (t < until) {
          if (Math.random() < 0.35) { var i = nx(), f = hz(S[i]), n = 6 + Math.floor(Math.random() * 5); for (var k = 0; k < n; k++) pluck(c, sp.in, f, t + k * 0.075, 0.45 + (k === 0 ? 0.2 : 0), { coef: 0.4975, len: 0.9 }); t += n * 0.075 + 0.6; }
          else { var j = nx(); pluck(c, sp.in, hz(S[j]), t, rnd(0.55, 0.85), { coef: 0.4978, len: 1.3 }); t += pick([0.25, 0.25, 0.5, 0.5, 0.75]); if (Math.random() < 0.2) t += 0.9; }
        }
        while (tf < until) { var m = nx(); flute(c, sp.in, hz(S[m] + 12 > 91 ? S[m] : S[m] + 12), tf, rnd(1.2, 2.4), 0.2); tf += rnd(3.5, 7); } }, stop: function () { sp.stop(); } };
    } });
})(CP.synth);
