/* màndarínō · riproduttore dei brani registrati (audio/music/<id>.ogg, Opus): li scarica, li decodifica con Web Audio e li
   suona in loop senza interruzioni. Interfaccia come ogni traccia: CP.audioFile.player(c, bus, id) → { step, stop }.
   In memoria resta decodificato un solo brano alla volta (circa 90 MB per 4 minuti stereo).
   I file non stanno dentro index.html: li serve lo stesso posto dell'app (sito, APK). Il service worker li tiene in una cache
   a parte (mandarino-music), che sopravvive agli aggiornamenti dell'app; da file:// il browser non li lascia leggere. */
(function () {
  var CP = window.CP, BASE = "audio/music/", MCACHE = "mandarino-music";
  var CACHE = {}, STATE = {}, listeners = [];
  function set(id, s) { STATE[id] = s; listeners.forEach(function (f) { try { f(id, s); } catch (e) {} }); }
  function url(id) { return BASE + id + ".ogg"; }
  var fileProto = location.protocol === "file:";
  function bytes(id) {
    if (fileProto) return Promise.reject(new Error("file"));
    return fetch(url(id)).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); });
  }
  function decode(c, ab) { return new Promise(function (ok, ko) { var p = c.decodeAudioData(ab, ok, ko); if (p && p.then) p.then(ok, ko); }); }
  function load(c, id) {
    Object.keys(CACHE).forEach(function (k) { if (k !== id) delete CACHE[k]; });
    if (!CACHE[id]) {
      set(id, "loading");
      CACHE[id] = bytes(id).then(function (ab) { return decode(c, ab); });
      CACHE[id].then(function () { set(id, "ok"); }, function (e) { delete CACHE[id]; set(id, fileProto || (e && e.message === "file") ? "file" : "err"); });
    }
    return CACHE[id];
  }
  CP.audioFile = {
    state: function (id) { return STATE[id] || ""; },
    onState: function (f) { listeners.push(f); },
    fileProto: fileProto,
    player: function (c, bus, id) {
      var stopped = false, src = null, g = c.createGain();
      g.gain.value = 0; g.connect(bus);
      load(c, id).then(function (buf) {
        if (stopped) return;
        src = c.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(g);
        var t = c.currentTime + 0.05; src.start(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 1.5);
      }).catch(function () {});
      return {
        step: function () {},
        stop: function () {
          if (stopped) return; stopped = true;
          var t = c.currentTime;
          try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.6); } catch (e) {}
          setTimeout(function () { try { if (src) src.stop(); } catch (e) {} try { g.disconnect(); } catch (e) {} src = null; }, 700);
        }
      };
    },
    /* offline: quali brani sono già nella cache del telefono, e lo scaricamento di tutti (il service worker li mette da parte) */
    offline: function () {
      if (fileProto || !window.caches) return Promise.resolve(null);
      return caches.open(MCACHE).then(function (ch) { return ch.keys(); }).then(function (ks) {
        var have = {}; ks.forEach(function (r) { var m = /\/audio\/music\/([\w-]+)\.ogg$/.exec(r.url); if (m) have[m[1]] = 1; }); return have;
      }).catch(function () { return null; });
    },
    downloadAll: function (ids, progress) {
      var done = 0, fail = 0;
      if (fileProto || !window.caches) return Promise.reject(new Error("file"));
      return caches.open(MCACHE).then(function (ch) {
        return ids.reduce(function (p, id) {
          return p.then(function () {
            return ch.match(url(id)).then(function (m) {
              if (m) return;
              return fetch(url(id)).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return ch.put(url(id), r); });
            }).then(function () { done++; }, function () { fail++; }).then(function () { if (progress) progress(done, fail, ids.length); });
          });
        }, Promise.resolve());
      }).then(function () { return { done: done, fail: fail }; });
    }
  };
})();
