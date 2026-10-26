/* Traccia «Pechino a 8bit» · brano registrato (audio/music/pechino8bit.ogg, 2:38 in loop). */
CP.audioTracks.add({ id: "pechino8bit", ico: "👾", name: "Pechino a 8bit", desc: "Chiptune allegro con salti di tonalità", mood: "energy",
  zh: ["8 位北京","欢快的芯片音乐，不断转调"], file: true, sec: 158, make: function (c, bus) { return CP.audioFile.player(c, bus, "pechino8bit"); } });
