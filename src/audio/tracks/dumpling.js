/* Traccia «Dumpling Funk» · ⚡ energia. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var groove = kit.groove;
  CP.audioTracks.add({ id: "dumpling", ico: "🥟", name: "Dumpling Funk", desc: "Funk con lo swing, basso sincopato, pipa pizzicata", mood: "energy", make: groove({
      bpm: 104, swing: 0.12, kick: "x..x..x...x.....", snare: "....x.......x...", sv: 0.24, hat: "x.x.x.x.x.x.x.x.", hv: 0.05, bass: "x..x..x.x..x.x..", blen: 1.2, bv: 0.24,
      prog: [52, 52, 57, 59], scale: [64, 67, 69, 71, 74, 76], lead: { p: 0.5, every: 2, inst: "pluck", v: 0.45 }, delay: 0.29, fb: 0.2, wet: 0.2 }) });
})(CP.synth);
