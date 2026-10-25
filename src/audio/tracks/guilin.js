/* Traccia «Montagne di Guilin» · 🧘 calma. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, rnd = kit.rnd, pluck = kit.pluck, flute = kit.flute, drop = kit.drop, bed = kit.bed, space = kit.space, walker = kit.walker;
  CP.audioTracks.add({ id: "guilin", ico: "⛰️", name: "Montagne di Guilin", desc: "Guqin scuro, flauto lontano, nebbia e acqua (mi minore)", mood: "calm", make: function (c, bus) {
      var sp = space(c, bus, 0.58, 0.42, 0.5, 1700), br = bed(c, bus, "bandpass", 420, 0.6, 0.03, 0.05, 0.02), S = [40, 43, 45, 47, 50, 52, 55, 57], nx = walker(S.length, 3), t = 0, tf = 0, td = 0;
      return { step: function (until, now) {
        if (t < now) t = now + 0.1; if (tf < now) tf = now + 4; if (td < now) td = now + 1;
        while (t < until) { var i = nx(); pluck(c, sp.in, hz(S[i]), t, rnd(0.65, 0.95), { coef: 0.4996, len: 3.8, lp: 900 }); t += rnd(2, 4.2); }
        while (tf < until) { flute(c, sp.in, hz(S[nx()] + 24), tf, rnd(2.4, 3.6), 0.12); tf += rnd(7, 13); }
        while (td < until) { drop(c, sp.in, td, rnd(0.025, 0.06)); td += rnd(1.2, 3.6); } }, stop: function () { br.stop(); sp.stop(); } };
    } });
})(CP.synth);
