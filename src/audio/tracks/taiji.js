/* Traccia «Mattino di Taiji» · 🧘 calma. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var groove = kit.groove;
  CP.audioTracks.add({ id: "taiji", ico: "☯️", name: "Mattino di Taiji", desc: "Lenta, senza batteria: accordi aperti e un flauto ogni tanto", mood: "calm", make: groove({
      bpm: 60, prog: [50, 55, 57, 52], chord: [0, 7, 14, 19], chordEvery: 2, cv: 0.09, cdec: 5, scale: [74, 76, 78, 81, 83, 86], lead: { p: 0.06, every: 4, inst: "flute", v: 0.14 }, delay: 0.55, fb: 0.4, wet: 0.45, damp: 2000 }) });
})(CP.synth);
