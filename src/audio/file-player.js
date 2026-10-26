/* màndarínō · riproduttore dei brani registrati (audio/music/<id>.<impronta>.ogg, Opus).
   V6.8: non si decodifica più tutto il brano in memoria (circa 90 MB per 4 minuti stereo): il file compresso (3-5 MB)
   diventa la sorgente di un elemento <audio> in loop, collegato al grafo Web Audio dell'app (MediaElementSource), così
   volume, abbassamento sotto la voce e silenzio col microfono restano gli stessi. Il loop è quello del lettore del
   browser, senza stacchi. Interfaccia come ogni traccia: CP.audioFile.player(c, bus, id) → { step, stop }.
   I nomi dei file e le dimensioni li scrive la build in window.MUSIC_FILES; il service worker li tiene in una cache a
   parte (mandarino-music), che sopravvive agli aggiornamenti. Da file:// il browser non li lascia leggere. */
(function () {
  var CP = window.CP, BASE = "audio/music/", MCACHE = "mandarino-music";
  var STATE = {}, listeners = [];
  function set(id, s) { STATE[id] = s; listeners.forEach(function (f) { try { f(id, s); } catch (e) {} }); }
  function info(id) { return (window.MUSIC_FILES || {})[id] || null; }
  function url(id) { var m = info(id); return BASE + (m ? m[0] : id + ".ogg"); }
  var fileProto = location.protocol === "file:";
  /* il file intero come Blob (dalla cache del service worker quando c'è): sorgente locale, si può riavvolgere senza rete */
  function blob(id) {
    if (fileProto) return Promise.reject(new Error("file"));
    return fetch(url(id)).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.blob(); });
  }
  CP.audioFile = {
    state: function (id) { return STATE[id] || ""; },
    onState: function (f) { listeners.push(f); },
    fileProto: fileProto,
    url: url,
    /* MB dei brani, dal catalogo della build (prima era un numero fisso) */
    mb: function (ids) { var b = 0; (ids || Object.keys(window.MUSIC_FILES || {})).forEach(function (id) { var m = info(id); if (m) b += m[1]; }); return b / 1048576; },
    player: function (c, bus, id) {
      var stopped = false, g = c.createGain(), el = new Audio(), src = null, obj = "";
      g.gain.value = 0; g.connect(bus);
      el.loop = true; el.preload = "auto";
      set(id, "loading");
      blob(id).then(function (b) {
        if (stopped) return;
        obj = URL.createObjectURL(b); el.src = obj;
        src = c.createMediaElementSource(el); src.connect(g);
        el.addEventListener("playing", function () { set(id, "ok"); }, { once: true });
        return el.play().then(function () {
          var t = c.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 1.5);
        });
      }).catch(function (e) { if (!stopped) set(id, fileProto || (e && e.message === "file") ? "file" : "err"); });
      return {
        step: function () {},
        el: el,
        pause: function (on) { try { if (on) el.pause(); else el.play(); } catch (e) {} },
        stop: function () {
          if (stopped) return; stopped = true;
          var t = c.currentTime;
          try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.6); } catch (e) {}
          setTimeout(function () { try { el.pause(); el.removeAttribute("src"); el.load(); } catch (e) {} try { if (src) src.disconnect(); g.disconnect(); } catch (e) {} if (obj) URL.revokeObjectURL(obj); }, 700);
        }
      };
    },
    /* offline: quali brani (con il nome di adesso) sono già nella cache del telefono; via quelli vecchi */
    offline: function () {
      if (fileProto || !window.caches) return Promise.resolve(null);
      var cur = {}; Object.keys(window.MUSIC_FILES || {}).forEach(function (id) { cur[url(id)] = id; });
      return caches.open(MCACHE).then(function (ch) {
        return ch.keys().then(function (ks) {
          var have = {};
          ks.forEach(function (r) {
            var p = new URL(r.url).pathname, m = /audio\/music\/[^/]+$/.exec(p); if (!m) return;
            var id = cur[m[0]]; if (id) have[id] = 1; else ch.delete(r);   /* un brano sostituito: la copia vecchia se ne va */
          });
          return have;
        });
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
