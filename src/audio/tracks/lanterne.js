/* Traccia «Lanterne sui canali» · brano registrato (audio/music/lanterne.ogg, 4:09 in loop). */
CP.audioTracks.add({ id: "lanterne", ico: "🏮", name: "Lanterne sui canali", desc: "Corde pizzicate, legni e timpani: Venezia e Suzhou allo specchio", mood: "calm",
  zh: ["运河灯笼","拨弦、木管和定音鼓：威尼斯与苏州相互映照"], file: true, sec: 249, make: function (c, bus) { return CP.audioFile.player(c, bus, "lanterne"); } });
