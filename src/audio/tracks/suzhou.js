/* Traccia «Giardino di Suzhou» · brano registrato (audio/music/suzhou.ogg, 3:24 in loop). */
CP.audioTracks.add({ id: "suzhou", ico: "🎋", name: "Giardino di Suzhou", desc: "Pentatonica lenta: pianoforte, archi, đàn tranh e un filo di brezza", mood: "calm",
  zh: ["苏州园林","慢板五声音阶：钢琴、弦乐、筝和微风"], file: true, sec: 204, make: function (c, bus) { return CP.audioFile.player(c, bus, "suzhou"); } });
