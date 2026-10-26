/* Traccia «Tempio tra le Nuvole» · brano registrato (audio/music/tempio.ogg, 4:20 in loop). */
CP.audioTracks.add({ id: "tempio", ico: "🏯", name: "Tempio tra le Nuvole", desc: "Campane, ciotole e bordoni cinematici", mood: "calm",
  zh: ["云中寺","钟、颂钵与电影感的持续音"], file: true, sec: 260, make: function (c, bus) { return CP.audioFile.player(c, bus, "tempio"); } });
