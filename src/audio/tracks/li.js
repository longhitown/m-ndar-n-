/* Traccia «Notte sul Fiume Li» · brano registrato (audio/music/li.ogg, 4:10 in loop). */
CP.audioTracks.add({ id: "li", ico: "🏮", name: "Notte sul Fiume Li", desc: "Barcarola per violoncello e voci umane", mood: "calm",
  zh: ["漓江之夜","大提琴与人声的船歌"], file: true, sec: 250, make: function (c, bus) { return CP.audioFile.player(c, bus, "li"); } });
