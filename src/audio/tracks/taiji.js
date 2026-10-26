/* Traccia «Mattino di Taiji» · brano registrato (audio/music/taiji.ogg, 4:00 in loop). */
CP.audioTracks.add({ id: "taiji", ico: "☯️", name: "Mattino di Taiji", desc: "Ocarina, flauto e quartetto d'archi: un respiro lento", mood: "calm",
  zh: ["太极之晨","陶笛、长笛和弦乐四重奏：一次缓慢的呼吸"], file: true, sec: 240, make: function (c, bus) { return CP.audioFile.player(c, bus, "taiji"); } });
