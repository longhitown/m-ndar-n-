/* ===== màndarínō · «Privacy» (⚙️ → Informazioni): la stessa informativa di PRIVACY.md, in breve, nella lingua
   dell'interfaccia. Nessun link che parte da solo: il testo completo sta nel repository. ===== */
(function () {
  var CP = window.CP, T = CP.t;
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "info", html: function () {
    return '<details class="set-sec" id="set-privacy"><summary>🔒 ' + T("pv.title") + '</summary><div class="vbody">' +
      '<p style="margin:0"><b>' + T("pv.lede") + "</b></p>" +
      '<ul class="small pv-list">' + ["pv.local", "pv.net", "pv.voice", "pv.mic", "pv.sync", "pv.backup", "pv.contrib", "pv.class"].map(function (k) { return "<li>" + T(k) + "</li>"; }).join("") + "</ul>" +
      '<p class="small muted" style="margin:0">' + T("pv.more") + "</p></div></details>";
  } });
})();
