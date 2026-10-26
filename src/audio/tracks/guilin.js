/* Traccia «Montagne di Guilin» · brano registrato (audio/music/guilin.ogg, 4:16 in loop). */
CP.audioTracks.add({ id: "guilin", ico: "⛰️", name: "Montagne di Guilin", desc: "Organo, archi e clavicembalo: la roccia nella nebbia", mood: "calm",
  zh: ["桂林山水","管风琴、弦乐与羽管键琴：雾中的山石"], file: true, sec: 256, make: function (c, bus) { return CP.audioFile.player(c, bus, "guilin"); } });
