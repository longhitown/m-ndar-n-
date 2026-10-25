/* Traccia «Studio notturno (lo-fi)» · 🎯 concentrazione. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var groove = kit.groove;
  CP.audioTracks.add({ id: "lofi2", ico: "🌙", name: "Studio notturno (lo-fi)", desc: "Lo-fi hip hop con lo swing, accordi di settima, pioggia leggera", mood: "focus", make: groove({
      bpm: 78, swing: 0.18, kick: "x.....x...x.....", kv: 0.42, snare: "....x.......x...", sv: 0.18, hat: "x.x.x.x.x.x.x.x.", hv: 0.03,
      prog: [[53, [0, 4, 7, 11]], [52, [0, 3, 7, 10]], [50, [0, 3, 7, 10]], [55, [0, 4, 7, 10]]], cv: 0.08, cdec: 3.2,
      beds: [["highpass", 1400, 0.5, 0.025, 0.12, 0.008]], scale: [72, 74, 76, 79, 81], lead: { p: 0.18, every: 4, inst: "vibe", v: 0.08 }, delay: 0.4, fb: 0.3, wet: 0.3, damp: 1800 }) });
})(CP.synth);
