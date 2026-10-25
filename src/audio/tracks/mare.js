/* Traccia «Onde a Hainan» · 🧘 calma. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, pick = kit.pick, partials = kit.partials, groove = kit.groove, BELL = kit.BELL;
  CP.audioTracks.add({ id: "mare", ico: "🌊", name: "Onde a Hainan", desc: "Ambient marina: risacca lenta e campane lontane", mood: "calm", make: groove({
      bpm: 0, beds: [["lowpass", 520, 0.5, 0.1, 0.08, 0.08], ["highpass", 3000, 0.4, 0.03, 0.08, 0.025]], evMin: 4, evMax: 9, delay: 0.6, fb: 0.4, wet: 0.5, damp: 1600,
      ev: function (c, out, t) { partials(c, out, hz(pick([62, 64, 67, 69, 71, 74])), t, 0.09, 4, BELL, 0.006); } }) });
})(CP.synth);
