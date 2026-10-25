/* Traccia «Pechino 8-bit» · ⚡ energia. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var groove = kit.groove;
  CP.audioTracks.add({ id: "pechino8bit", ico: "👾", name: "Pechino 8-bit", desc: "Chiptune: onde quadre, arpeggi veloci", mood: "energy", make: groove({
      bpm: 140, kick: "x...x...x...x...", kv: 0.4, snare: "....x.......x...", sv: 0.15, sf: 3000, hat: "x.x.x.x.x.x.x.x.", hv: 0.03, bass: "x.x.x.x.x.x.x.x.", btype: "square", bv: 0.07, blen: 1.4,
      prog: [48, 57, 53, 55], chord: [12, 16, 19], ctype: "square", cv: 0.025, scale: [72, 74, 76, 79, 81, 84], lead: { p: 0.85, every: 2, inst: "square", v: 0.035 }, wet: 0.08 }) });
})(CP.synth);
