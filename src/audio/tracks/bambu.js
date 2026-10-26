/* Traccia «Pioggia sul bambù» · brano registrato (audio/music/bambu.ogg, 5:20 in loop). */
CP.audioTracks.add({ id: "bambu", ico: "🎍", name: "Pioggia sul bambù", desc: "Pianoforte, archi e arpa in melodia: gocce sulle canne di bambù", mood: "focus",
  zh: ["竹林听雨","钢琴、弦乐与竖琴：雨滴落在竹子上"], file: true, sec: 320, make: function (c, bus) { return CP.audioFile.player(c, bus, "bambu"); } });
