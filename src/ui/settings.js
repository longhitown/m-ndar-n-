/* ===== V6.7: ⚙️ Impostazioni (foglio dal basso). Tema, caratteri, audio, voce, microfono, backup, e i riquadri
   che altri moduli aggiungono in #set-extra (lingua, contributi). ===== */
(function () {
  var CP = window.CP, el = document.getElementById("settings"), btn = document.getElementById("settings-btn");
  if (!el || !btn) return;
  function paintMic() {
    var p = document.getElementById("set-mic"), b = document.getElementById("set-mic-close"); if (!p) return;
    var info = CP.micInfo ? CP.micInfo() : { live: false };
    CP.micState().then(function (st) {
      var perm = CP.t({ granted: "mic.granted", denied: "mic.denied", prompt: "mic.prompt" }[st] || "mic.unknown");
      p.textContent = CP.t("mic.line", { p: perm, o: CP.t(info.live ? "mic.open" : "mic.closed") }) + CP.t(CP.canListen() ? "mic.sr" : "mic.nosr");
      if (b) b.disabled = !info.live;
    });
  }
  function paint() {
    var v = document.getElementById("set-sfxvol"); if (v && CP.bus) v.value = CP.bus.sfxVol();
    var ts = document.getElementById("opt-toneshapes"); if (ts) ts.checked = document.body.classList.contains("tone-shapes");
    if (CP.audioMode) Array.prototype.forEach.call(el.querySelectorAll("[data-audio-set]"), function (b) { var on = b.getAttribute("data-audio-set") === CP.audioMode(); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    var ex = document.getElementById("set-extra");
    if (ex && CP.settingsExtras) { var open = {}; Array.prototype.forEach.call(ex.querySelectorAll("details[id]"), function (d) { open[d.id] = d.open; }); ex.innerHTML = CP.settingsExtras.map(function (f) { return f(); }).join(""); Object.keys(open).forEach(function (id) { var d = document.getElementById(id); if (d) d.open = open[id]; }); }
    paintMic();
  }
  function close() { CP.untrap(el); }
  CP.repaintSettings = paint;
  /* §5 fase 1: lingua dei menu */
  function paintLang() { Array.prototype.forEach.call(el.querySelectorAll("[data-lang-set]"), function (b) { var on = b.getAttribute("data-lang-set") === LANG; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); }); }
  CP.setLang = function (l) {
    LANG = l === "zh" ? "zh" : "it"; try { localStorage.setItem("cp-lang", LANG); } catch (e) {}
    applyI18n(); paintLang(); CP.sfx("tap");
    if (CP.studyActive && CP.studyActive()) CP.studyRefresh(); else if (CP.studyHome) CP.studyHome();
    if (CP.pathDirty) CP.pathDirty(); if (CP.onPath && !document.getElementById("view-path").hidden) CP.onPath();
    if (CP.build) CP.build.render(); if (CP.badge) CP.badge(); if (CP.refilter) CP.refilter();
  };
  paintLang();
  CP.openSettings = function (sec) {
    paint(); CP.trap(el, close);
    var x = el.querySelector("[data-set-close]"); if (x) x.focus({ preventScroll: true });
    if (sec) { var d = document.getElementById(sec); if (d) { if (d.tagName === "DETAILS") d.open = true; d.scrollIntoView({ block: "start" }); } }
    CP.sfx("tap");
  };
  btn.addEventListener("click", function () { CP.openSettings(); });
  el.addEventListener("click", function (e) {
    if (e.target === el) { close(); return; }
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    if (b.hasAttribute("data-set-close")) close();
    else if (b.hasAttribute("data-audio-set")) { CP.setAudioMode(b.getAttribute("data-audio-set")); paint(); }
    else if (b.id === "set-music") { close(); if (CP.jukeboxOpen) CP.jukeboxOpen(); }
    else if (b.id === "set-mic-close") { if (CP.micClose) CP.micClose(); CP.toast(CP.t("mic.closedToast")); paintMic(); }
    else if (b.id === "set-bk-down") { Store.backup().then(function (n) { document.getElementById("set-bk-msg").textContent = CP.t("bk.done", { n: n }); }); }
    else if (b.id === "set-bk-up") document.getElementById("set-bk-file").click();
    else if (b.id === "set-welcome") { close(); if (CP.welcome) CP.welcome(true); }
    else if (b.id === "set-selftest") { close(); location.hash = "#selftest"; }
    else if (b.hasAttribute("data-lang-set")) CP.setLang(b.getAttribute("data-lang-set"));
  });
  el.addEventListener("input", function (e) { if (e.target.id === "set-sfxvol" && CP.bus) CP.bus.setSfxVol(parseFloat(e.target.value)); });
  el.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "set-sfxvol") CP.sfx("tap");
    else if (t.id === "set-bk-file" && t.files && t.files[0]) CP.restoreFile(t.files[0], document.getElementById("set-bk-msg"));
    else if (t.id === "opt-toneshapes") { document.body.classList.toggle("tone-shapes", t.checked); try { localStorage.setItem("cp-toneshapes", t.checked ? "1" : "0"); } catch (er) {} }
  });
  /* U7: toni anche con la forma (per chi non distingue il rosso dal verde) */
  try { if (localStorage.getItem("cp-toneshapes") === "1") document.body.classList.add("tone-shapes"); } catch (e) {}
})();
