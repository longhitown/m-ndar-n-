/* Traccia «Danza del Drago» · ⚡ energia. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var groove = kit.groove;
  CP.audioTracks.add({ id: "drago", ico: "🐉", name: "Danza del Drago", desc: "Percussioni da festa: tamburo grave e piatti, per gli sprint", mood: "energy", make: groove({
      bpm: 132, tom: "x..x..x.x.x..x..", tf: 95, tv: 0.5, hat: "..o...o...o.o.o.", hv: 0.07, snare: "....x..x....x..x", sv: 0.12, sf: 900 }) });
})(CP.synth);
