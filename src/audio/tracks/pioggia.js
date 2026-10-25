/* Traccia «Pioggia sul bambù» · 🎯 concentrazione. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var rnd = kit.rnd, drop = kit.drop, groove = kit.groove;
  CP.audioTracks.add({ id: "pioggia", ico: "🌧️", name: "Pioggia sul bambù", desc: "Solo pioggia e gocce: concentrazione pura", mood: "focus", make: groove({
      bpm: 0, beds: [["lowpass", 900, 0.4, 0.08, 0.05, 0.015], ["highpass", 2400, 0.5, 0.05, 0.11, 0.015]], evMin: 0.4, evMax: 1.8,
      ev: function (c, out, t) { drop(c, out, t, rnd(0.03, 0.07)); } }) });
})(CP.synth);
