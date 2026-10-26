/* Traccia «L'Ascesa del Maestro» · brano registrato (audio/music/ascesa.ogg, 3:42 in loop). */
CP.audioTracks.add({ id: "ascesa", ico: "🌄", name: "L'Ascesa del Maestro", desc: "Ostinato di pianoforte, erhu e un crescendo epico", mood: "focus",
  zh: ["大师之路","钢琴固定音型、二胡和史诗般的渐强"], file: true, sec: 222, make: function (c, bus) { return CP.audioFile.player(c, bus, "ascesa"); } });
