/* ===== màndarínō · stile di ripasso (Task 12, §12.9), la parte sempre presente: ⚙️ → Avanzate → «Stile di ripasso»
   (Guidato, Misto, Classico) e CP.ex.carica(), che esegue al primo uso il gruppo ESERCIZI (tools/build.mjs, GROUPS: il
   motore degli esercizi, i distrattori, la digitazione, il percorso guidato, la lettura). Con lo stile Classico non si
   carica nulla e il ripasso è quello di sempre. Preferenza del dispositivo: cp-ex-style. ===== */
(function () {
  var CP = window.CP, K = "cp-ex-style", STYLES = ["guided", "mixed", "classic"];
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  /* EX_DEFAULT_STYLE: chi comincia ora → Guidato; chi ha già progressi → Misto. Si fissa la prima volta che serve. */
  function EX_DEFAULT_STYLE() { var s = lsGet(lsGet("cp-course") === "it" ? "cp-it-srs-v1" : "cp-srs-v1"); return s && s.length > 2 ? "mixed" : "guided"; }
  function stile() { var v = lsGet(K); if (STYLES.indexOf(v) < 0) { v = EX_DEFAULT_STYLE(); lsSet(K, v); } return v; }
  function carica(cb) { if (!CP.exEngine && window.__mdLoad && window.__mdLoad.ESERCIZI) window.__mdLoad.ESERCIZI(); if (cb) cb(CP.exEngine); return CP.exEngine; }
  CP.ex = { stile: stile, set: function (v) { if (STYLES.indexOf(v) >= 0) lsSet(K, v); }, carica: carica, STYLES: STYLES };
  (CP.settingsExtras = CP.settingsExtras || []).push(function () {
    var cur = stile(), T = CP.t;
    return '<details class="set-sec" id="set-exstyle"><summary>' + T("exs.title") + '</summary><div class="vbody"><div class="exs" role="radiogroup" aria-label="' + CP.attr(T("exs.title")) + '">' +
      STYLES.map(function (s) { return '<button type="button" role="radio" data-exs="' + s + '" aria-checked="' + (s === cur) + '"' + (s === cur ? ' class="on"' : "") + "><b>" + T("exs." + s) + "</b><small>" + T("exs." + s + "D") + "</small></button>"; }).join("") + "</div></div></details>";
  });
  document.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-exs]") : null; if (!b) return; CP.ex.set(b.getAttribute("data-exs")); CP.sfx("tap"); if (CP.repaintSettings) CP.repaintSettings(); });
})();
