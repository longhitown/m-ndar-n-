/* Traccia «Pu'er Tea» · brano registrato (audio/music/puer.ogg, 4:22 in loop). */
CP.audioTracks.add({ id: "puer", ico: "🍵", name: "Pu'er Tea", desc: "Kalimba, marimba, vibrafono e clarinetto: armonia e pulsazione calma", mood: "focus",
  zh: ["普洱茶","卡林巴、马林巴、颤音琴和单簧管：平和的律动"], file: true, sec: 262, make: function (c, bus) { return CP.audioFile.player(c, bus, "puer"); } });
