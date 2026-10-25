/* Traccia «Neon a Chongqing» · ⚡ energia. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var groove = kit.groove;
  CP.audioTracks.add({ id: "neon", ico: "🌃", name: "Neon a Chongqing", desc: "Synthwave energica, arpeggi pentatonici, basso a ottavi", mood: "energy", make: groove({
      bpm: 118, kick: "x...x...x...x...", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x.", bass: "x.x.x.x.x.x.x.x.", blen: 1.6, bv: 0.18,
      prog: [57, 53, 48, 55], chord: [0, 7, 12], cv: 0.06, cdec: 1.8, scale: [69, 72, 74, 76, 79, 81, 84], lead: { p: 0.7, every: 2, inst: "plain", v: 0.11 }, delay: 0.38, fb: 0.3, wet: 0.28 }) });
})(CP.synth);
