/* ===== cattura nativa del microfono (Android) — piano B di getUserMedia e strumenti di prova. Nel file unico si carica al primo uso di CP.nativeMic
   (tools/build.mjs, LAZYMOD): non pesa sull'avvio. Gli eventi arrivano dal ponte (src/pwa/android.js) tramite window.__mdAnd. ===== */
(function () {
  var CP = window.CP, A = window.MandarinoAndroid, AND = window.__mdAnd;
  if (!A || !AND || typeof A.nativeMicStart !== "function") return;
  {
    CP.nativeMic = function () {
      return new Promise(function (ok, no) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) { no({ name: "NotSupportedError" }); return; }
        var c = (CP.getCtx && CP.getCtx()) || new Ctx();
        if (c.state !== "running" && c.resume) { try { c.resume(); } catch (e) {} }
        var dest = c.createMediaStreamDestination(), id = AND.nid("m"), next = 0, stopped = false, srWait = null, srPre = null;
        function stop() {
          if (stopped) return; stopped = true; delete AND.wait[id];
          try { A.nativeMicStop(); } catch (e) {}
          dest.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
        }
        AND.wait[id] = function (type, data) {
          if (stopped) return;
          if (type === "mic-pcm") {
            var bin = atob(data), n = bin.length >> 1, buf = c.createBuffer(1, n, 16000), ch = buf.getChannelData(0);
            for (var i = 0; i < n; i++) { var v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); if (v & 0x8000) v -= 0x10000; ch[i] = v / 32768; }
            var s = c.createBufferSource(); s.buffer = buf; s.connect(dest);
            var t = c.currentTime; if (next < t + 0.02) next = t + 0.06;   /* un piccolo anticipo assorbe i ritardi dei messaggi */
            s.start(next); next += buf.duration;
          } else if (type === "sr-result" || type === "sr-error") {
            /* testo riconosciuto dalla STESSA voce che si sta registrando (vedi nativeSrAttach in Bridge.java) */
            var alts = []; if (type === "sr-result") { try { alts = JSON.parse(data).map(function (a) { return a.t; }); } catch (e) {} }
            var res = type === "sr-result" ? { alts: alts } : { error: data || "error" };
            if (srWait) { var w = srWait; srWait = null; w(res); } else srPre = res;
          } else if (type === "mic-end") { stopped = true; delete AND.wait[id]; dest.stream.getTracks().forEach(function (t) { try { t.stop(); t.dispatchEvent(new Event("ended")); } catch (e) {} }); }
        };
        var used = ""; try { used = A.nativeMicStart(id); } catch (e) { used = ""; }
        if (!used) { delete AND.wait[id]; no({ name: "NotReadableError", message: "cattura nativa non avviata" }); return; }
        var piped = false; try { piped = !!(A.srPipedSupported && A.srPipedSupported() && A.nativeSrAttach); } catch (e) {}
        dest.stream._mdNative = { id: id, source: used, stop: stop, sr: !piped ? null : {
          /* attach(lang): il riconoscimento vocale di sistema ascolta la cattura in corso. finish(): chiude e restituisce {alts:[testi]} o {error} */
          attach: function (lang) { srWait = null; srPre = null; try { return !!A.nativeSrAttach(lang, 3); } catch (e) { return false; } },
          finish: function () {
            return new Promise(function (ok) {
              if (srPre) { var r = srPre; srPre = null; ok(r); return; }
              srWait = ok; try { A.nativeSrFinish(); } catch (e) {}
              setTimeout(function () { if (srWait === ok) { srWait = null; ok({ error: "timeout" }); } }, 6000);
            });
          } } };
                ok(dest.stream);
      });
    };
  }


  /* Prova del riconoscimento vocale per l'autodiagnosi: avvia UNA sessione, sul percorso scelto (classic = microfono del servizio,
     piped = audio della nostra cattura), e restituisce tutti gli eventi con i tempi. Non decide niente: racconta. */
  CP.srTest = function (route, lang) {
    return new Promise(function (ok) {
      var id = AND.nid("t"), t0 = Date.now(), ev = [], done = false;
      function fin(why) { if (done) return; done = true; delete AND.wait[id]; ok({ route: route, ms: Date.now() - t0, events: ev, why: why }); }
      AND.wait[id] = function (type, data) {
        ev.push({ t: Date.now() - t0, type: type, data: type === "sr-result" ? (function () { try { return JSON.parse(data).map(function (a) { return a.t; }).join(" | "); } catch (e) { return data; } })() : data });
        if (type === "sr-end") fin("fine");
      };
      try {
        if (route === "piped") { if (!A.srStartPiped) { ev.push({ t: 0, type: "manca", data: "srStartPiped" }); fin("non supportato"); return; } A.srStartPiped(id, lang || "zh-CN", 3); }
        else A.srStart(id, lang || "zh-CN", 3);
      } catch (e) { ev.push({ t: 0, type: "eccezione", data: String(e) }); fin("eccezione"); return; }
      setTimeout(function () { try { A.srAbort(id); } catch (e) {} fin("tempo scaduto"); }, 14000);
    });
  };
})();
