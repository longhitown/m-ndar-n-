/* Traccia «Linea 2 all'ora di punta» · brano registrato (audio/music/metro.ogg, 3:15 in loop). */
CP.audioTracks.add({ id: "metro", ico: "🚇", name: "Linea 2 all'ora di punta", desc: "House e drum 'n' bass in metro: vocio, ruote e pianoforte", mood: "energy",
  zh: ["高峰时的二号线","地铁里的 House 与鼓打贝斯：人声、车轮和钢琴"], file: true, sec: 195, make: function (c, bus) { return CP.audioFile.player(c, bus, "metro"); } });
