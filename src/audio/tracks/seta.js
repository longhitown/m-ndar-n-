/* Traccia «Via della Seta» · brano registrato (audio/music/seta.ogg, 4:48 in loop). */
CP.audioTracks.add({ id: "seta", ico: "🐫", name: "Via della Seta", desc: "Da Venezia a Chang'an: ocarina, violino e đàn tranh", mood: "focus",
  zh: ["丝绸之路","从威尼斯到长安：陶笛、小提琴和筝"], file: true, sec: 288, make: function (c, bus) { return CP.audioFile.player(c, bus, "seta"); } });
