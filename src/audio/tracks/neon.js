/* Traccia «Neon a Chongqing» · brano registrato (audio/music/neon.ogg, 2:42 in loop). */
CP.audioTracks.add({ id: "neon", ico: "🌃", name: "Neon a Chongqing", desc: "Taiko e tarantella: energia travolgente", mood: "energy",
  zh: ["重庆霓虹","太鼓与塔兰泰拉：活力十足"], file: true, sec: 162, make: function (c, bus) { return CP.audioFile.player(c, bus, "neon"); } });
