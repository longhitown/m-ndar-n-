/* ===== màndarínō · passare i progressi a un altro telefono con i QR, senza rete e senza cloud.
   Il telefono vecchio mostra una sequenza di QR che si ripete; il nuovo la inquadra con la fotocamera finché non ha tutti i
   pezzi (si può perdere qualche fotogramma: torna al giro dopo). Poi unisce i dati con le regole di sempre e si riavvia.
   Formato di un fotogramma: «M1:<crc32>:<n>/<tot>:<base45>». I dati: lo stato dell'app (Store.exportObj, senza il registro
   dei ripassi, che non serve a ripassare) compresso con deflate e scritto in base45 (pwa/qr.js), il crc32 li controlla.
   Lettura: BarcodeDetector dove c'è (Chrome su Android), altrimenti jsQR (vendor/, Apache 2.0). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  var CHUNK = 760, FPS = 5;   /* ~760 caratteri: QR versione ≤ 20 (si legge bene da uno schermo, e jsQR sbaglia la 23) */

  function crc32(b) { var c, t = crc32.t; if (!t) { t = crc32.t = []; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } }
    c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8); return ((c ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, "0"); }
  function pipe(bytes, Stream, kind) { return new Response(new Blob([bytes]).stream().pipeThrough(new Stream(kind))).arrayBuffer().then(function (ab) { return new Uint8Array(ab); }); }
  var Z = typeof CompressionStream === "function" && typeof DecompressionStream === "function";
  function pack() {
    return Store.exportObj(false).then(function (o) {
      var raw = new TextEncoder().encode(JSON.stringify(o));
      return (Z ? pipe(raw, CompressionStream, "deflate-raw") : Promise.resolve(raw)).then(function (b) {
        var out = new Uint8Array(b.length + 1); out[0] = Z ? 1 : 0; out.set(b, 1); return out;
      });
    });
  }
  function unpack(bytes) {
    var body = bytes.subarray(1);
    return (bytes[0] === 1 ? pipe(body, DecompressionStream, "deflate-raw") : Promise.resolve(body)).then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
  }

  /* ---- un pannello a tutto schermo per entrambi i lati ---- */
  var box = null, stopFns = [];
  function overlay(html) {
    close();
    box = document.createElement("div"); box.className = "qr-ov"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
    box.innerHTML = '<div class="qr-in">' + html + '<button type="button" class="btn-s qr-x" data-qr-x>' + esc(T("common.close")) + "</button></div>";
    document.body.appendChild(box);
    box.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-qr-x]")) close(); });
    if (CP.trap) CP.trap(box, close);
    return box;
  }
  function close() {
    stopFns.splice(0).forEach(function (f) { try { f(); } catch (e) {} });
    if (box) { if (CP.untrap) CP.untrap(box); if (box.parentNode) box.parentNode.removeChild(box); box = null; }
  }
  function wake() {
    var wl = null;
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (l) { wl = l; }, function () {}); } catch (e) {}
    stopFns.push(function () { if (wl) wl.release(); });
  }

  /* ---- invio: il telefono vecchio ---- */
  CP.qrSend = function () {
    if (CP.closeSheet) CP.closeSheet();
    var o = overlay('<h3 style="margin:0">📱→ ' + esc(T("qr.send")) + '</h3><p class="small muted" style="margin:0">' + esc(T("qr.sendHint")) + "</p>" +
      '<canvas class="qr-cv" aria-label="' + CP.attr(T("qr.cvAria")) + '"></canvas><div class="qr-st small" aria-live="polite">' + esc(T("qr.preparing")) + "</div>");
    var cv = o.querySelector("canvas"), st = o.querySelector(".qr-st");
    pack().then(function (bytes) {
      if (!box || box !== o) return;
      var sid = crc32(bytes), s = CP.qr.b45enc(bytes), n = Math.max(1, Math.ceil(s.length / CHUNK)), frames = [];
      for (var i = 0; i < n; i++) frames.push(CP.qr.encode("M1:" + sid + ":" + (i + 1) + "/" + n + ":" + s.slice(i * CHUNK, (i + 1) * CHUNK), "M"));
      var k = 0, px = 0;
      var tick = function () {
        if (!box || box !== o) return;
        var q = frames[k % n];
        if (!px) px = Math.max(2, Math.floor(Math.min(cv.parentNode.clientWidth - 8, window.innerHeight * 0.62) * (window.devicePixelRatio || 1) / (q.size + 8)));
        CP.qr.draw(cv, q, px);
        st.textContent = T("qr.frame", { n: k % n + 1, tot: n, kb: Math.max(1, Math.ceil(bytes.length / 1024)) });
        k++;
      };
      tick(); var iv = setInterval(tick, 1000 / FPS); stopFns.push(function () { clearInterval(iv); });
      wake();
    }, function () { st.textContent = T("qr.err"); });
  };

  /* ---- ricezione: il telefono nuovo ---- */
  CP.qrReceive = function () {
    if (CP.closeSheet) CP.closeSheet();
    var o = overlay('<h3 style="margin:0">📷 ' + esc(T("qr.recv")) + '</h3><p class="small muted" style="margin:0">' + esc(T("qr.recvHint")) + "</p>" +
      '<div class="qr-cam"><video playsinline muted autoplay></video><span class="qr-aim" aria-hidden="true"></span></div><div class="qr-grid" aria-hidden="true"></div><div class="qr-st small" aria-live="polite">' + esc(T("qr.camOpen")) + "</div>");
    var video = o.querySelector("video"), st = o.querySelector(".qr-st"), grid = o.querySelector(".qr-grid");
    var got = {}, sid = "", tot = 0, done = false, det = null, cv = document.createElement("canvas"), ctx = cv.getContext("2d", { willReadFrequently: true });
    function paintGrid() {
      var h = ""; for (var i = 1; i <= tot; i++) h += '<i class="' + (got[i] ? "on" : "") + '"></i>';
      grid.innerHTML = h; var c = Object.keys(got).length;
      st.textContent = T("qr.progress", { n: c, tot: tot });
    }
    function onText(t) {
      var m = /^M1:([0-9A-F]{8}):(\d+)\/(\d+):([0-9A-Z $%*+\-.\/:]*)$/.exec(t || ""); if (!m || done) return;
      if (m[1] !== sid) { sid = m[1]; tot = +m[3]; got = {}; }
      if (got[m[2]]) return;
      got[m[2]] = m[4]; if (CP.haptic) CP.haptic(8); paintGrid();
      if (Object.keys(got).length === tot) finish();
    }
    function finish() {
      done = true; st.textContent = T("qr.joining");
      var s = ""; for (var i = 1; i <= tot; i++) s += got[i];
      var bytes; try { bytes = CP.qr.b45dec(s); } catch (e) { bytes = null; }
      if (!bytes || crc32(bytes) !== sid) { done = false; got = {}; sid = ""; st.textContent = T("qr.bad"); return; }
      unpack(bytes).then(function (obj) { return Store.importObj(obj, "merge"); }).then(function (r) {
        if (!r || !r.ok) throw new Error("bad");
        stopCam(); st.textContent = "✅ " + T("qr.ok"); CP.sfx("ok");
        setTimeout(function () { location.reload(); }, 1200);
      }).catch(function () { done = false; st.textContent = T("qr.bad"); });
    }
    var stream = null, raf = 0, last = 0, busy = false;
    function stopCam() { cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(function (tr) { tr.stop(); }); stream = null; }
    stopFns.push(stopCam);
    function scan(now) {
      raf = requestAnimationFrame(scan);
      if (busy || done || now - last < 90 || video.readyState < 2) return;
      last = now; busy = true;
      if (det) { det.detect(video).then(function (r) { r.forEach(function (c) { onText(c.rawValue); }); }, function () {}).then(function () { busy = false; }); return; }
      var w = video.videoWidth, h = video.videoHeight, k = Math.min(1, 800 / Math.max(w, h)); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      ctx.drawImage(video, 0, 0, cv.width, cv.height);
      var img = ctx.getImageData(0, 0, cv.width, cv.height), r = window.jsQR ? window.jsQR(img.data, cv.width, cv.height, { inversionAttempts: "dontInvert" }) : null;
      if (r) onText(r.data);
      busy = false;
    }
    var ready = ("BarcodeDetector" in window && BarcodeDetector.getSupportedFormats) ? BarcodeDetector.getSupportedFormats().then(function (f) { if (f.indexOf("qr_code") >= 0) det = new BarcodeDetector({ formats: ["qr_code"] }); }, function () {}) : Promise.resolve();
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { st.textContent = T("qr.noCam"); return; }
    ready.then(function () {
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    }).then(function (s) {
      if (!box || box !== o) { s.getTracks().forEach(function (tr) { tr.stop(); }); return; }
      stream = s; video.srcObject = s; var p = video.play(); if (p && p.catch) p.catch(function () {});
      st.textContent = T("qr.aim"); raf = requestAnimationFrame(scan);
    }, function (e) {
      st.textContent = (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) ? T("qr.camBlocked") : T("qr.noCam");
    });
  };
  CP.qrTransfer = { crc32: crc32, pack: pack, unpack: unpack, CHUNK: CHUNK };
})();
