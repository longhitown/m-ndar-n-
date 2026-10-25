/* Traccia «Focus 40 Hz» · 🎯 concentrazione. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, pick = kit.pick, partials = kit.partials, groove = kit.groove, JADE = kit.JADE;
  CP.audioTracks.add({ id: "focus", ico: "🎯", name: "Focus 40 Hz", desc: "Battimento binaurale 40 Hz (gamma), meglio con le cuffie", mood: "focus", make: groove({
      bpm: 0, binaural: [220, 260, 0.045], evMin: 5, evMax: 10, delay: 0.55, fb: 0.4, wet: 0.45, damp: 2200,
      ev: function (c, out, t) { partials(c, out, hz(pick([69, 72, 74, 76, 79])), t, 0.07, 3, JADE, 0.02); } }) });
})(CP.synth);
