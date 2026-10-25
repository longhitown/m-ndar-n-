/* Traccia «Linea 2 all'ora di punta» · ⚡ energia. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var groove = kit.groove;
  CP.audioTracks.add({ id: "metro", ico: "🚇", name: "Linea 2 all'ora di punta", desc: "House leggera, quattro in battuta, accordi stab", mood: "energy", make: groove({
      bpm: 128, kick: "x...x...x...x...", snare: "....x.......x...", sv: 0.16, hat: ".x.o.x.o.x.o.x.o", hv: 0.045, bass: "..x...x...x...x.", bv: 0.2,
      prog: [[48, [12, 16, 19]], [53, [12, 16, 19]], [55, [12, 16, 19]], [53, [12, 15, 19]]], stab: "..x.....x.x.....", cv: 0.07, delay: 0.23, fb: 0.2, wet: 0.2 }) });
})(CP.synth);
