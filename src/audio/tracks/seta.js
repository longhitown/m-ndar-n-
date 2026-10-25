/* Traccia «Via della Seta» · 🎯 concentrazione. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var groove = kit.groove;
  CP.audioTracks.add({ id: "seta", ico: "🐫", name: "Via della Seta", desc: "Modale, mi frigio pentatonico, tamburo a cornice, pipa", mood: "focus", make: groove({
      bpm: 96, tom: "x..x..x.x..x.x..", tf: 150, tv: 0.3, bass: "x...............", blen: 12, bv: 0.12,
      prog: [52], scale: [64, 65, 69, 71, 72, 76, 77], lead: { p: 0.55, every: 2, inst: "pluck", v: 0.5 }, delay: 0.32, fb: 0.28, wet: 0.3 }) });
})(CP.synth);
