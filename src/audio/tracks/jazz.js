/* Traccia «Jazz a Shanghai 1930» · ⚡ energia. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var groove = kit.groove;
  CP.audioTracks.add({ id: "jazz", ico: "🎷", name: "Jazz a Shanghai 1930", desc: "Swing, spazzole, accordi di sesta e nona", mood: "energy", make: groove({
      bpm: 112, swing: 0.25, brush: true, hat: "x.xx..xx..x.x.xx", hv: 0.05, kick: "x.......x.......", kv: 0.25, snare: "....x.......x...", sv: 0.08, sf: 2200,
      bass: "x...x...x...x...", walk: [0, 7, 12, 9], btype: "triangle", bv: 0.3, blen: 3.6,
      prog: [[53, [0, 4, 9, 14]], [50, [0, 3, 9, 14]], [55, [0, 4, 9, 14]], [48, [0, 4, 9, 14]]], cv: 0.07, cdec: 2.6, scale: [72, 74, 77, 79, 81, 84], lead: { p: 0.35, every: 2, inst: "vibe", v: 0.1 }, delay: 0.3, wet: 0.22 }) });
})(CP.synth);
