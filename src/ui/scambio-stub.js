/* ===== màndarínō · Scambio linguistico: la sezione in ⚙️ → Comunità e voci (poche righe, sempre caricate). Tutto il resto (consenso,
   registrazione, elenco, invio) sta in ui/scambio.js e si carica al primo tocco su «Partecipa» (tools/build.mjs, LAZYMOD). ===== */
(function () {
  var CP = window.CP;
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "community", html: function () {
    var T = CP.t;
    return '<details class="set-sec" id="set-scambio"><summary>🗣️ ' + T("sc.title") + '</summary><div class="vbody"><p class="small muted" style="margin:0">' + T("sc.lede") +
      '</p><div class="acts" style="margin:0"><button type="button" class="btn-s" data-sc-open>' + T("sc.open") + "</button></div></div></details>";
  } });
  document.addEventListener("click", function (e) {
    if (!(e.target.closest && e.target.closest("[data-sc-open]"))) return;
    var st = document.getElementById("settings"); if (st && CP.untrap) CP.untrap(st);
    CP.scambio.open();
  });
})();
