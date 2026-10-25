/* Traccia «Onde Alfa · studio profondo» · 🎯 concentrazione. Contratto e attrezzi (kit = CP.synth): vedi audio/synth.js. */
(function (kit) {
  var hz = kit.hz, rnd = kit.rnd, pick = kit.pick, partials = kit.partials, space = kit.space;
  CP.audioTracks.add({ id: "alfa", ico: "🧠", name: "Onde Alfa · studio profondo", desc: "Battimento binaurale 10 Hz (meglio con cuffie), note di giada", mood: "focus", make: function (c, bus) {
      var sp = space(c, bus, 0.55, 0.4, 0.45, 2200), S = [72, 74, 76, 79, 81, 84], t = 0, ns = [];
      [[196, -1], [206, 1]].forEach(function (p) {
        var o = c.createOscillator(), g = c.createGain(), pn = c.createStereoPanner ? c.createStereoPanner() : null;
        o.type = "sine"; o.frequency.value = p[0]; g.gain.value = 0.05; o.connect(g);
        if (pn) { pn.pan.value = p[1]; g.connect(pn); pn.connect(bus); ns.push(pn); } else g.connect(bus);
        o.start(); ns.push(o, g);
      });
      return { step: function (until, now) {
        if (t < now) t = now + 0.5;
        while (t < until) { partials(c, sp.in, hz(pick(S)), t, 0.1, 3.2, [[1, 1, 1], [2, 0.18, 0.5], [3, 0.06, 0.3]], 0.02); t += rnd(3.2, 6.5); } },
        stop: function () { ns.forEach(function (n) { try { if (n.stop) n.stop(); } catch (e) {} }); setTimeout(function () { ns.forEach(function (n) { try { n.disconnect(); } catch (e) {} }); }, 300); sp.stop(); } };
    } });
})(CP.synth);
