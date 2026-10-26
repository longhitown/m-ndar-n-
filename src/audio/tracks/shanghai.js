/* Traccia «Pioggia a Shanghai» · brano registrato (audio/music/shanghai.ogg, 3:09 in loop). */
CP.audioTracks.add({ id: "shanghai", ico: "🌆", name: "Pioggia a Shanghai", desc: "Lo-fi: piano elettrico, pioggia e vinile", mood: "focus",
  zh: ["上海的雨","Lo-fi：电钢琴、雨声和黑胶"], file: true, sec: 189, make: function (c, bus) { return CP.audioFile.player(c, bus, "shanghai"); } });
