/* Traccia «Alba Imperiale» · brano registrato (audio/music/alba.ogg, 4:27 in loop). */
CP.audioTracks.add({ id: "alba", ico: "🌅", name: "Alba Imperiale", desc: "Orchestra, coro e campane: un'alba gigantesca", mood: "focus",
  zh: ["皇家黎明","管弦乐、合唱与钟声：壮丽的黎明"], file: true, sec: 267, make: function (c, bus) { return CP.audioFile.player(c, bus, "alba"); } });
