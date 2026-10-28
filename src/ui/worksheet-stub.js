/* ===== màndarínō · «Foglio di lavoro», la parte sempre presente: il pulsante «Crea il foglio di lavoro» (nei Progressi di
   Studia, per i due corsi) e il collegamento profondo …/app/#dettato=<codice> (il frammento non arriva a nessun server: si
   toglie subito dall'indirizzo, come #sfida= e #seal=). Il resto (ui/worksheet.js, i suoi testi in i18n/worksheet.js e la
   libreria PDF jsPDF, vendor/jspdf.umd.min.js) è il gruppo FOGLIO, eseguito al primo uso (tools/build.mjs, GROUPS). ===== */
(function () {
  var CP = window.CP, HASH = "#dettato=", OPEN_DELAY_MS = 900;
  function load() { if (!CP.worksheetUI && window.__mdLoad && window.__mdLoad.FOGLIO) window.__mdLoad.FOGLIO(); return CP.worksheetUI || null; }
  CP.worksheet = {
    HASH: HASH,
    open: function () { var u = load(); if (u) u.open(); },
    dictation: function (code) { var u = load(); return u ? u.dictation(code) : false; }
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-ws-open]") : null; if (!b) return;
    CP.sfx("tap"); CP.worksheet.open();
  });
  var m = /^#dettato=(.+)$/.exec(location.hash);
  if (m) {
    var code = decodeURIComponent(m[1]);
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    window.__mdGoing = true;
    setTimeout(function () { CP.worksheet.dictation(code); }, OPEN_DELAY_MS);
  }
})();
