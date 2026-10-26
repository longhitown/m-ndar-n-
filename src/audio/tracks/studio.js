/* Traccia «Studio notturno» · brano registrato (audio/music/studio.ogg, 3:24 in loop). */
CP.audioTracks.add({ id: "studio", ico: "🌙", name: "Studio notturno", desc: "Pianoforte e archi veri: minimalismo per concentrarsi", mood: "focus",
  zh: ["夜读","真实的钢琴与弦乐：专注的极简音乐"], file: true, sec: 204, make: function (c, bus) { return CP.audioFile.player(c, bus, "studio"); } });
