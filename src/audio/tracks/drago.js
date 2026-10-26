/* Traccia «Danza del Drago» · brano registrato (audio/music/drago.ogg, 2:45 in loop). */
CP.audioTracks.add({ id: "drago", ico: "🐉", name: "Danza del Drago", desc: "Sheng, friscalettu e archi in volo: una danza veloce", mood: "energy",
  zh: ["龙之舞","笙、西西里笛与弦乐齐飞：一支快舞"], file: true, sec: 165, make: function (c, bus) { return CP.audioFile.player(c, bus, "drago"); } });
