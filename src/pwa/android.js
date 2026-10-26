/* Dentro l'APK (android/): la WebView di Android non ha voce, riconoscimento vocale, download e condivisione come un
   browser. Qui li ricostruiamo con le API web standard (speechSynthesis, SpeechRecognition, <a download>, navigator.share)
   sopra il ponte nativo window.MandarinoAndroid (android/app/src/main/java/it/mandarino/app/Bridge.java).
   Così il resto dell'app non cambia. Fuori dall'APK questo file non fa nulla.
   Gira subito dopo boot.js: prima che core.js legga window.speechSynthesis. */
(function () {
  var A = window.MandarinoAndroid;
  if (!A) return;
  window.__MD_APK = { version: (function () { try { return A.version(); } catch (e) { return ""; } })() };
  var seq = 0, wait = {};
  function nid(p) { return p + (++seq) + "_" + Date.now().toString(36); }
  function later(f) { setTimeout(f, 0); }
  function fire(obj, type, ev) {
    ev = ev || {}; ev.type = type;
    var h = obj["on" + type]; if (typeof h === "function") { try { h.call(obj, ev); } catch (e) { setTimeout(function () { throw e; }); } }
    (obj._l && obj._l[type] || []).slice().forEach(function (f) { try { f.call(obj, ev); } catch (e) { setTimeout(function () { throw e; }); } });
  }
  function listenable(o) {
    o._l = {};
    o.addEventListener = function (t, f) { (o._l[t] = o._l[t] || []).push(f); };
    o.removeEventListener = function (t, f) { o._l[t] = (o._l[t] || []).filter(function (x) { return x !== f; }); };
    return o;
  }
  /* eventi dal lato nativo */
  window.__mdEvt = function (type, id, data) {
    if (type === "voices") { loadVoices(); fire(synth, "voiceschanged"); return; }
    var w = wait[id]; if (w) w(type, data);
  };

  /* ---------------- speechSynthesis ---------------- */
  var voices = [];
  function loadVoices() {
    try {
      voices = JSON.parse(A.ttsVoices() || "[]").map(function (v) {
        return { name: v.name, lang: v.lang, voiceURI: v.name, localService: !!v.local, "default": false };
      });
    } catch (e) { voices = []; }
  }
  function Utterance(text) {
    this.text = text == null ? "" : String(text);
    this.lang = ""; this.voice = null; this.rate = 1; this.pitch = 1; this.volume = 1;
    this.onstart = this.onend = this.onerror = this.onboundary = this.onpause = this.onresume = this.onmark = null;
    listenable(this);
  }
  var queue = [], cur = null;
  function next() {
    if (cur || !queue.length) { synth.speaking = !!cur; synth.pending = queue.length > 0; return; }
    var u = queue.shift(), id = nid("t"), done = false;
    cur = { u: u, id: id }; synth.speaking = true; synth.pending = queue.length > 0;
    var end = function (type, err) {
      if (done) return; done = true; delete wait[id];
      if (cur && cur.id === id) cur = null;
      if (type === "end") fire(u, "end", { utterance: u, elapsedTime: 0, charIndex: u.text.length });
      else fire(u, "error", { utterance: u, error: err || "synthesis-failed" });
      next();
    };
    cur.end = end;
    wait[id] = function (type, data) {
      if (type === "tts-start") fire(u, "start", { utterance: u, elapsedTime: 0, charIndex: 0 });
      else if (type === "tts-end") end("end");
      else if (type === "tts-error") end("error", data);
    };
    var lang = u.lang || (u.voice && u.voice.lang) || "zh-CN", ok = false;
    try { ok = A.ttsSpeak(id, u.text, lang, u.voice ? u.voice.voiceURI : "", +u.rate || 1, +u.pitch || 1); } catch (e) { ok = false; }
    if (!ok) later(function () { end("error", A.ttsReady() ? "language-unavailable" : "synthesis-unavailable"); });
  }
  var synth = listenable({
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices: function () { if (!voices.length) loadVoices(); return voices.slice(); },
    speak: function (u) { if (!(u instanceof Utterance)) throw new TypeError("SpeechSynthesisUtterance richiesto"); queue.push(u); next(); },
    cancel: function () {
      var q = queue; queue = [];
      q.forEach(function (u) { later(function () { fire(u, "error", { utterance: u, error: "canceled" }); }); });
      try { A.ttsCancel(); } catch (e) {}
      if (cur && cur.end) { var c = cur; later(function () { c.end("error", "interrupted"); }); }
      synth.pending = false;
    },
    pause: function () {}, resume: function () {}
  });
  try { Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true, writable: true }); } catch (e) { window.speechSynthesis = synth; }
  window.SpeechSynthesisUtterance = Utterance;
  loadVoices();

  /* ---------------- SpeechRecognition ---------------- */
  var srOk = false; try { srOk = A.srAvailable(); } catch (e) {}
  if (srOk) {
    var Rec = function () {
      this.lang = "zh-CN"; this.interimResults = false; this.maxAlternatives = 1; this.continuous = false;
      this.onresult = this.onerror = this.onend = this.onstart = this.onnomatch = this.onaudiostart = this.onspeechstart = null;
      this._id = null; listenable(this);
    };
    Rec.prototype.start = function () {
      if (this._id) throw new Error("InvalidStateError: già in ascolto");
      var self = this, id = nid("r"), ended = false; this._id = id;
      wait[id] = function (type, data) {
        if (ended) return;
        if (type === "sr-start") { fire(self, "start"); fire(self, "audiostart"); }
        else if (type === "sr-result") {
          var alts = []; try { alts = JSON.parse(data); } catch (e) {}
          var res = alts.map(function (a) { return { transcript: a.t, confidence: a.c }; });
          res.isFinal = true; res.item = function (i) { return res[i]; };
          var list = [res]; list.item = function (i) { return list[i]; };
          fire(self, "result", { results: list, resultIndex: 0 });
        } else if (type === "sr-error") fire(self, "error", { error: data || "error", message: "" });
        else if (type === "sr-end") { ended = true; delete wait[id]; self._id = null; fire(self, "end"); }
      };
      A.srStart(id, this.lang || "zh-CN", Math.max(1, this.maxAlternatives | 0));
    };
    Rec.prototype.stop = function () { if (this._id) A.srStop(this._id); };
    Rec.prototype.abort = function () { if (this._id) A.srAbort(this._id); };
    window.SpeechRecognition = window.webkitSpeechRecognition = Rec;
  } else {
    try { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; } catch (e) {}
  }

  /* ---------------- download (<a download> con blob: o data:) ---------------- */
  function saveHref(href, name) {
    return fetch(href).then(function (r) { return r.blob(); }).then(function (b) {
      return new Promise(function (ok) {
        var fr = new FileReader();
        fr.onload = function () { var s = String(fr.result), i = s.indexOf(","); ok(A.saveFile(name || "mandarino", b.type || "application/octet-stream", s.slice(i + 1))); };
        fr.onerror = function () { ok(""); };
        fr.readAsDataURL(b);
      });
    });
  }
  var nativeClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute("download") && /^(blob|data):/.test(this.href)) { saveHref(this.href, this.getAttribute("download")); return; }
    return nativeClick.apply(this, arguments);
  };
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[download]") : null;
    if (a && /^(blob|data):/.test(a.href)) { e.preventDefault(); saveHref(a.href, a.getAttribute("download")); }
  }, true);

  /* ---------------- navigator.share ---------------- */
  try {
    Object.defineProperty(navigator, "share", { configurable: true, value: function (d) {
      d = d || {}; A.share(d.title || "", [d.text, d.url].filter(Boolean).join("\n")); return Promise.resolve();
    } });
  } catch (e) {}

  /* ---------------- barre di sistema del colore della pagina ---------------- */
  function hex(c) {
    var m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || ""); if (!m) return /^#[0-9a-f]{6}$/i.test(c || "") ? c : null;
    return "#" + [m[1], m[2], m[3]].map(function (x) { return ("0" + (+x).toString(16)).slice(-2); }).join("");
  }
  var lastBar = "";
  function bars() {
    if (!document.body) return;
    var c = hex(getComputedStyle(document.body).backgroundColor);
    if (c && c !== lastBar) { lastBar = c; try { A.setBars(c); } catch (e) {} }
  }
  document.addEventListener("DOMContentLoaded", function () {
    bars();
    new MutationObserver(function () { setTimeout(bars, 50); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { setTimeout(bars, 50); }); } catch (e) {}
  });

  /* ---------------- tasto Indietro di Android ---------------- */
  window.__mdBack = function () {
    var CP = window.CP; if (!CP) return false;
    if (CP.topSheet && CP.topSheet()) { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); return true; }
    var quit = Array.prototype.filter.call(document.querySelectorAll("#quit, #m-quit"), function (b) { return b.getClientRects().length > 0; })[0];
    if (quit) { quit.click(); return true; }
    var path = document.getElementById("view-path");
    if (path && path.hidden && CP.show) { CP.show("path", true); return true; }
    return false;
  };

  /* ---------------- voce mancante: link all'installazione delle voci del telefono ---------------- */
  window.__mdVoiceHelp = function (lang) {
    var has = false; try { has = A.ttsHasLang(lang || "zh-CN"); } catch (e) {}
    if (has) return "";
    var it = /^it/.test(lang || ""), zh = typeof LANG !== "undefined" && LANG === "zh";
    return zh ? '<p class="small muted" style="margin:0">手机还没有' + (it ? "意大利语" : "中文") + '语音。可以在手机的文字转语音引擎里免费下载（通常是「Google 语音服务」）。</p><button type="button" class="btn-s" data-md-tts-install>⬇ 安装语音</button>'
      : '<p class="small muted" style="margin:0">Il telefono non ha ancora la voce ' + (it ? "italiana" : "cinese") + '. Si scarica gratis dal motore di sintesi vocale (di solito «Servizi di sintesi vocale di Google»).</p>' +
      '<button type="button" class="btn-s" data-md-tts-install>⬇ Installa la voce</button>';
  };
  document.addEventListener("click", function (e) {
    if (e.target && e.target.closest && e.target.closest("[data-md-tts-install]")) { try { A.ttsInstall(); } catch (x) {} }
  });
})();
