/* Traccia «Biblioteca di Hangzhou» · brano registrato (audio/music/biblioteca.ogg, 4:22 in loop). */
CP.audioTracks.add({ id: "biblioteca", ico: "📚", name: "Biblioteca di Hangzhou", desc: "Organo da chiesa e sheng: sale silenziose, pagine che scorrono", mood: "focus",
  zh: ["杭州图书馆","教堂管风琴与笙：安静的大厅，翻动的书页"], file: true, sec: 262, make: function (c, bus) { return CP.audioFile.player(c, bus, "biblioteca"); } });
