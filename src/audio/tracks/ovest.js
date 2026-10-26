/* Traccia «Alba sul Lago Ovest» · brano registrato (audio/music/ovest.ogg, 4:22 in loop). */
CP.audioTracks.add({ id: "ovest", ico: "🌸", name: "Alba sul Lago Ovest", desc: "Flauto, arpa e voci: la luce sul lago all'alba", mood: "calm",
  zh: ["西湖晨光","长笛、竖琴与人声：湖上的晨光"], file: true, sec: 262, make: function (c, bus) { return CP.audioFile.player(c, bus, "ovest"); } });
