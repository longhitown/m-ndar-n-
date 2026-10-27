/* ===== V5: audio chiaro. Tre stati (tutto / effetti / muto), musica generativa, sblocco audio, microfono, voce A/B ===== */
(function () {
  var CP = window.CP, pref = CP.pref, esc = CP.esc;
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---- 1. pulsanti nella barra ---- */
  var grp = document.querySelector(".bar .grp"), first = document.getElementById("guide-btn");
  /* nella barra resta solo 🎵; i tre stati dell'audio stanno in ⚙️ (CP.audioMode / CP.setAudioMode) */
  var vol = document.createElement("button"); vol.type = "button"; vol.id = "vol-btn"; vol.className = "iconbtn emo";
  var mus = document.createElement("button"); mus.type = "button"; mus.id = "music-btn"; mus.className = "iconbtn emo";
  grp.insertBefore(mus, document.getElementById("settings-btn"));
  function mode() { return !pref.sfx ? "mute" : (pref.auto ? "all" : "fx"); }
  var MODES = { all: ["🔊", "Audio: voce ed effetti", "Voce ed effetti attivi."], fx: ["🔉", "Audio: solo effetti", "Solo effetti: la voce parte solo se tocchi 🔊 sulla parola."], mute: ["🔇", "Audio: muto", "Muto: nessun effetto né musica. La voce parte solo se tocchi 🔊 sulla parola."] };
  function paintVol() {
    var m = mode(), st = CP.audioState(), pend = m !== "mute" && (st === "suspended" || st === "interrupted");
    vol.textContent = MODES[m][0]; vol.setAttribute("aria-label", MODES[m][1] + (pend ? ". L'audio è in pausa: tocca per sbloccarlo" : ". Tocca per cambiare"));
    vol.classList.toggle("pending", pend); vol.title = MODES[m][1];
    Array.prototype.forEach.call(document.querySelectorAll("[data-audio-set]"), function (b) { var on = b.getAttribute("data-audio-set") === m; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
  }
  CP.audioMode = mode;
  CP.setAudioMode = function (next) {
    if (!MODES[next]) return;
    CP.audioUnlock();
    CP.setPref("sfx", next !== "mute"); CP.setPref("auto", next === "all");
    paintVol(); applyMusic();
    CP.toast(MODES[next][2]); if (next !== "mute") CP.sfx("tap");
  };
  vol.addEventListener("click", function () {
    var st = CP.audioState();
    if (mode() !== "mute" && (st === "suspended" || st === "interrupted")) {
      CP.audioUnlock().then(function (s) { paintVol(); CP.sfx("ok"); CP.toast(s === "running" ? "Audio sbloccato." : "Il browser non sblocca l'audio: tocca di nuovo."); });
      return;
    }
    var next = { all: "fx", fx: "mute", mute: "all" }[mode()];
    CP.setPref("sfx", next !== "mute"); CP.setPref("auto", next === "all");
    paintVol(); applyMusic();
    CP.toast(MODES[next][2]); if (next !== "mute") CP.sfx("tap");
  });
  setInterval(paintVol, 1500);
  document.addEventListener("visibilitychange", paintVol);

  /* ---- 2. musica: vedi 77_jukebox.js (CP.musicApply / CP.musicHold) ---- */
  function applyMusic() { if (CP.musicApply) CP.musicApply(); }

  /* ---- 3. microfono bloccato: un solo messaggio chiaro ---- */
  var mn = document.getElementById("mic-notice");
  function micNotice(show) {
    if (!show) { mn.hidden = true; return; }
    var msg = CP.inFrame ?
      "<p><b>Qui dentro il microfono è bloccato.</b> Scarica il file e aprilo con il browser: è una pagina a sé e il microfono si può consentire.</p>" + CP.frameBtn() :
      "<p><b>Il microfono è bloccato per questa pagina.</b> Tocca il lucchetto (o l'icona accanto all'indirizzo), scegli «Microfono» → «Consenti», poi ricarica.</p><div><button type=\"button\" class=\"btn-s\" id=\"mic-reload\">Ricarica la pagina</button></div>";
    mn.innerHTML = msg; mn.hidden = false;
  }
  CP.micBlocked = function () { micNotice(true); };
  mn.addEventListener("click", function (e) { if (e.target.id === "mic-reload") location.reload(); });
  CP.micState = function () {
    try { if (navigator.permissions && navigator.permissions.query) return navigator.permissions.query({ name: "microphone" }).then(function (r) { return r.state; }, function () { return "unknown"; }); } catch (e) {}
    return Promise.resolve("unknown");
  };
  try {
    if (navigator.permissions && navigator.permissions.query) navigator.permissions.query({ name: "microphone" }).then(function (r) {
      var f = function () { if (r.state === "denied") micNotice(true); else if (!CP.inFrame || r.state === "granted") micNotice(false); };
      f(); r.onchange = f;
    }, function () {});
  } catch (e) {}

  /* ---- 4. pannello voce: prova suono, A/B tra due voci ---- */
  var AB = { a: "", b: "" };
  var PHR = "你好，我是你的新朋友。今天天气很好。";
  /* strumenti per chi sviluppa o pubblica l'app (il pacchetto PWA): nascosti, si accendono con #dev nell'indirizzo */
  CP.dev = function () { try { if (location.hash === "#dev") localStorage.setItem("md-dev", "1"); if (location.hash === "#nodev") localStorage.removeItem("md-dev"); return localStorage.getItem("md-dev") === "1"; } catch (e) { return false; } };
  CP.voiceExtra = function () {
    var itc = CP.course && CP.course() === "it", vs = itc ? [] : CP.voices(), st = CP.audioState(), h = (!itc && window.__mdVoiceHelp ? window.__mdVoiceHelp("zh-CN") : "") + (CP.voiceClip && CP.voiceClip.langs().length ? CP.voiceDl.html() : "") + (CP.jukeboxUI ? CP.jukeboxUI() : "") + '<div class="vab" id="vab"><div class="small" style="font-weight:700">' + CP.t("snd.title") + '</div>' +
      '<p class="small muted" style="margin:2px 0 6px" id="aud-state">' + CP.t("snd.state", { s: st === "running" ? CP.t("snd.running") : st === "none" ? CP.t("snd.none") : st === "suspended" ? CP.t("snd.susp") : esc(st) }) + "</p>" +
      '<button type="button" class="btn-s" id="snd-test">' + CP.t("snd.test") + "</button>";
    if (vs.length >= 2) {
      if (!AB.a || !vs.some(function (v) { return v.voiceURI === AB.a; })) AB.a = vs[0].voiceURI;
      if (!AB.b || !vs.some(function (v) { return v.voiceURI === AB.b; }) || AB.b === AB.a) AB.b = (vs.filter(function (v) { return v.voiceURI !== AB.a; })[0] || vs[1]).voiceURI;
      var opt = function (cur) { return vs.map(function (v) { return '<option value="' + CP.attr(v.voiceURI) + '"' + (v.voiceURI === cur ? " selected" : "") + ">" + esc(v.name) + " (" + esc(v.lang) + ")</option>"; }).join(""); };
      h += '<div class="small" style="font-weight:700;margin-top:12px">' + CP.t("vo.ab") + "</div>" +
        '<div class="ab"><label>A<select id="ab-a">' + opt(AB.a) + '</select></label><label>B<select id="ab-b">' + opt(AB.b) + "</select></label></div>" +
        '<div class="acts"><button type="button" class="btn-s" data-ab="a">▶ ' + CP.t("vo.play", { x: "A" }) + '</button><button type="button" class="btn-s" data-ab="b">▶ ' + CP.t("vo.play", { x: "B" }) + "</button></div>" +
        '<div class="acts"><button type="button" class="btn-s" data-abpick="a">' + CP.t("vo.use", { x: "A" }) + '</button><button type="button" class="btn-s" data-abpick="b">' + CP.t("vo.use", { x: "B" }) + "</button></div>";
    } else if (!itc) h += '<p class="small muted" style="margin:10px 0 0">' + CP.t("vo.one") + "</p>";
    h += "</div>";
    var ps = CP.pwaState ? CP.pwaState() : null;
    if (ps && ps.apk) { h += '<div class="vab" id="apk-box"><div class="small" style="font-weight:700">' + CP.t("apk.title") + '</div><p class="small muted" style="margin:2px 0 0">' + CP.t("apk.ver", { v: esc(String(ps.apk)) }) + " · " + CP.t(window.MD_CONFIG && MD_CONFIG.FLAVOR === "store" ? "apk.fStore" : "apk.fDirect") + "</p>" + (CP.apkUpdates ? '<label class="chk small"><input type="checkbox" id="opt-apkcheck"' + (CP.apkUpdates.on() ? " checked" : "") + "> " + CP.t("upd.check") + "</label>" : "") + "</div>"; return h; }
    if (itc) return h;   /* corso di italiano: il pacchetto per pubblicare l'app non serve a chi studia */
    h += '<div class="vab" id="pwa-box"><div class="small" style="font-weight:700">' + CP.t("pwa.title") + "</div>" +
      '<p class="small muted" style="margin:2px 0 6px">' + CP.t(ps && ps.standalone ? "pwa.installed" : ps && ps.http ? "pwa.https" : "pwa.need") + "</p>" +
      (CP.dev() ? '<button type="button" class="btn-s" id="pwa-dl">📦 ' + CP.t("pwa.dl") + "</button>" : "") + "</div>";
    return h;
  };
  function playVoice(uri) {
    var s = window.speechSynthesis; if (!s) return;
    var v = (s.getVoices() || []).filter(function (x) { return x.voiceURI === uri; })[0]; if (!v) return;
    CP.stopSpeak(); var u = new SpeechSynthesisUtterance(PHR); u.voice = v; u.lang = v.lang; u.rate = pref.rate; s.speak(u);
  }
  var body = document.getElementById("vset-body");
  body.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    if (b.id === "snd-test") {
      CP.audioUnlock().then(function (s) {
        var el = document.getElementById("aud-state");
        if (mode() === "mute") { CP.toast(CP.t("snd.mute")); return; }
        CP.sfx("ok"); paintVol();
        if (el) el.textContent = CP.t("snd.state", { s: s === "running" ? CP.t("snd.ok") : s }).replace(/。。|\.\.$/, ".");
      });
    }
    if (b.id === "pwa-dl") {
      b.disabled = true; CP.pwaDownload().then(function (r) { b.disabled = false; CP.toast("Scaricato mandarino-pwa.zip" + (r.withIndex ? "" : " (aggiungi tu index.html)") + ". Dentro c'è LEGGIMI.txt con i passi."); }, function () { b.disabled = false; CP.toast("Non sono riuscito a creare il pacchetto."); });
    }
    if (b.hasAttribute("data-ab")) playVoice(AB[b.getAttribute("data-ab")]);
    if (b.hasAttribute("data-abpick")) { CP.setPref("uri", AB[b.getAttribute("data-abpick")]); CP.toast("Voce scelta."); }
  });
  body.addEventListener("change", function (e) { if (e.target.id === "ab-a") AB.a = e.target.value; if (e.target.id === "ab-b") AB.b = e.target.value; });

  paintVol(); applyMusic();
})();

