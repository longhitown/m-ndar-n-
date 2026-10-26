/* Traccia «Tamburi a Chengdu» · brano registrato (audio/music/chengdu.ogg, 3:19 in loop). */
CP.audioTracks.add({ id: "chengdu", ico: "🥁", name: "Tamburi a Chengdu", desc: "Tamburi, ottoni e coro: una marcia epica che accelera", mood: "energy",
  zh: ["成都的鼓","鼓、铜管与合唱：越走越快的史诗进行曲"], file: true, sec: 199, make: function (c, bus) { return CP.audioFile.player(c, bus, "chengdu"); } });
