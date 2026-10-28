/* ===== màndarínō · Laboratorio dei radicali, la parte sempre presente: registra lo strumento «Radicali» in Frasi → Impara
   (CP.subs.rad) e, la prima volta che si apre, esegue il gruppo LABRAD (tools/build.mjs, GROUPS: i testi, le ricette, le
   letture simpatiche e il laboratorio vero e proprio, phrases/radicali.js). Chi non lo apre non paga nulla all'avvio. ===== */
(function () {
  var CP = window.CP;
  function carica() { if (!CP.labRad && window.__mdLoad && window.__mdLoad.LABRAD) window.__mdLoad.LABRAD(); return CP.labRad; }
  CP.subs = CP.subs || {};
  CP.subs.rad = { render: function () { var L = carica(); return L ? L.render() : ""; } };
  CP.labRadLoad = carica;
})();
