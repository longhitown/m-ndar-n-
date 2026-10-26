/* Traccia «Calligrafia» · brano registrato (audio/music/calligrafia.ogg, 3:51 in loop). */
CP.audioTracks.add({ id: "calligrafia", ico: "🖌️", name: "Calligrafia", desc: "Archi staccati, ottoni e pianoforte: segni netti e precisi", mood: "focus",
  zh: ["书法","断奏弦乐、铜管与钢琴：干净利落的笔画"], file: true, sec: 231, make: function (c, bus) { return CP.audioFile.player(c, bus, "calligrafia"); } });
