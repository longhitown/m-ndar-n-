/* ===== màndarínō · benvenuto: l'innesco. Il flusso (intro, porte, test di livello) sta in ui/onboarding.js e nel file
   unico si carica solo quando serve (tools/build.mjs, LAZYMOD): chi ha già fatto il benvenuto non lo paga all'avvio.
   Corso di cinese: cp-ux-v1.onboarded; corso di italiano: cp-it-welcome. ===== */
(function () {
  var CP = window.CP;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var IT = lsGet("cp-course") === "it";
  function done() { return IT ? !!lsGet("cp-it-welcome") : !!CP.ux.get("onboarded"); }
  function markDone() { if (IT) { try { localStorage.setItem("cp-it-welcome", "1"); } catch (e) {} } else CP.ux.set("onboarded", 1); }
  CP.welcome = function (force) { if (!force && done()) return; CP.onboarding.open(); };
  /* chi ha già dei progressi non è nuovo */
  if (!done()) {
    var progress = IT ? (function () { try { var o = JSON.parse(lsGet("cp-it-srs-v1") || "{}"); return Object.keys(o).some(function (k) { return k !== "__meta"; }); } catch (e) { return false; } })() : Object.keys(CP.S()).length > 0;
    if (progress) markDone();
    else setTimeout(function () { if (!CP.topSheet() && location.hash !== "#selftest" && !window.__mdGoing) CP.welcome(); }, 400);
  }
})();
