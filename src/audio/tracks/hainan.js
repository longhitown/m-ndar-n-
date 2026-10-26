/* Traccia «Onde a Hainan» · brano registrato (audio/music/hainan.ogg, 4:44 in loop). */
CP.audioTracks.add({ id: "hainan", ico: "🌊", name: "Onde a Hainan", desc: "Ambient marina: onde lente, vetri, vibrafono e steel drum", mood: "calm",
  zh: ["海南的浪","海洋氛围：缓慢的海浪、玻璃、颤音琴和钢鼓"], file: true, sec: 284, make: function (c, bus) { return CP.audioFile.player(c, bus, "hainan"); } });
