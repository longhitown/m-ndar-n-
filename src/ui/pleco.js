/* ===== màndarínō · collegamento a Pleco (dizionario esterno, se installato). Spento di base: lo accende chi studia in
   ⚙️ → Avanzate, con una doppia conferma, perché apre un'altra app. Acceso:
   - pressione di 2 s (PLECO_HOLD_MS) su un carattere: dopo la pressione lunga che apre la famiglia del carattere, tenendo
     premuto ancora si passa a Pleco;
   - un pulsante «📖 Pleco» nel foglio del carattere (la via accessibile, senza gesti).
   Nell'app Android: MandarinoAndroid.openPleco(testo) → intento plecoapi:// (pacchetto com.pleco.chinesesystem, dichiarato
   nelle <queries> del manifest); false = Pleco non c'è. Nel browser: un link plecoapi:// aperto solo dal tocco.
   L'app non manda niente a nessuno: è Pleco, sul telefono, a ricevere la parola. Preferenza: cp-pleco-v1 («1» = acceso,
   del dispositivo). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, K = "cp-pleco-v1", PLECO_HOLD_MS = 2000, A = window.MandarinoAndroid;
  function on() { try { return localStorage.getItem(K) === "1"; } catch (e) { return false; } }
  function set(v) { try { if (v) localStorage.setItem(K, "1"); else localStorage.removeItem(K); } catch (e) {} }
  function url(q) { return "plecoapi://x-callback-url/s?q=" + encodeURIComponent(q); }
  function open(q) {
    q = String(q || "").trim(); if (!q || !on()) return false;
    CP.sfx("tap");
    if (A && A.openPleco) { var ok = false; try { ok = A.openPleco(q); } catch (e) {} if (!ok) CP.toast(T("plc.missing")); return ok; }
    location.href = url(q); return true;
  }
  CP.pleco = { on: on, set: set, url: url, open: open, HOLD: PLECO_HOLD_MS };
  CP.plecoBtn = function (q) { return on() && q ? '<button type="button" class="btn-s" data-pleco="' + CP.attr(q) + '">📖 Pleco</button>' : ""; };

  /* la pressione di 2 s: un timer a parte, che si annulla come quello della pressione lunga (dito alzato o spostato) */
  var hold = null;
  function cancel() { if (hold) { clearTimeout(hold.t); hold = null; } }
  document.addEventListener("pointerdown", function (e) {
    cancel(); if (!on() || !CP.charTarget) return;
    var ch = CP.charTarget(e.target); if (!ch) return;
    hold = { x: e.clientX, y: e.clientY, el: e.target, t: setTimeout(function () { hold = null; CP.pleco.open(ch); }, PLECO_HOLD_MS) };
  });
  document.addEventListener("pointerup", cancel);
  document.addEventListener("pointercancel", cancel);
  document.addEventListener("pointermove", function (e) { if (hold && Math.abs(e.clientX - hold.x) + Math.abs(e.clientY - hold.y) > 10) cancel(); });
  /* si annulla solo se scorre ciò che contiene il carattere premuto: il foglio che si apre a metà pressione scorre da sé */
  document.addEventListener("scroll", function (e) { var t = e.target; if (hold && (t === document || (t && t.contains && t.contains(hold.el)))) cancel(); }, true);
  document.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-pleco]") : null; if (b) CP.pleco.open(b.getAttribute("data-pleco")); });

  /* ⚙️ → Avanzate: acceso / spento, con doppia conferma per accendere */
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "adv", html: function () {
    return '<details class="set-sec" id="set-pleco"><summary>📖 ' + T("plc.title") + '</summary><div class="vbody">' +
      '<p class="small muted" style="margin:0">' + T("plc.lede") + "</p>" +
      '<label class="chk"><input type="checkbox" id="opt-pleco"' + (on() ? " checked" : "") + "> " + T("plc.toggle") + "</label>" +
      (on() ? '<p class="small muted" style="margin:0">' + T("plc.how") + "</p>" : "") + "</div></details>";
  } });
  function setClose() { var se = document.getElementById("settings"); if (se && !se.hidden) CP.untrap(se); }
  function setBack() { CP.closeSheet(); if (CP.openSettings) CP.openSettings("set-pleco"); }
  function sheet(body) { setClose(); CP.openSheet('<div class="pl-sheet"><div class="fam-head"><b>📖 ' + esc(T("plc.title")) + '</b><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" + body + "</div>"); }
  document.addEventListener("change", function (e) {
    if (!e.target || e.target.id !== "opt-pleco") return;
    if (!e.target.checked) { set(false); if (CP.repaintSettings) CP.repaintSettings(); return; }
    e.target.checked = false;   /* si accende solo dopo le due conferme */
    sheet("<p>" + T("plc.q1") + '</p><button type="button" class="btn-main" data-pleco-ok1>' + esc(T("plc.yes1")) + "</button>");
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-pleco-ok1], [data-pleco-ok2]") : null; if (!b) return;
    if (b.hasAttribute("data-pleco-ok1")) { sheet("<p><b>" + T("plc.q2") + '</b></p><button type="button" class="btn-main" data-pleco-ok2>' + esc(T("plc.yes2")) + "</button>"); return; }
    set(true); setBack(); CP.toast(T("plc.done"));
  });
})();
