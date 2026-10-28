/* ===== màndarínō · collegamento passivo a Pleco (dizionario esterno, se installato). Spento di base; si accende in
   ⚙️ → Studio («Mostra il collegamento a Pleco») con una doppia conferma. Acceso:
   - pressione di almeno 2 s (PLECO_HOLD_MS) su un carattere (righe di Parole, carta di studio, foglio del carattere):
     sotto i 2 s tutto resta com'era (a mezzo secondo si apre il foglio del carattere); a 2 s compare un piccolo pulsante
     «Apri in Pleco», con un'icona generica di dizionario (non il marchio di Pleco). Si esce verso Pleco solo toccandolo;
   - nella carta di studio, la riga «Apri in Pleco» del menu «⋯» (la via senza gesti);
   - prima di uscire, per un attimo, una pagina con il logo e il wordmark di màndarínō.
   Si passa la parola intera (solo caratteri cinesi, al massimo PLECO_MAX).
   Nell'app Android: MandarinoAndroid.openPleco(testo) → intento plecoapi://x-callback-url/s?q=… con setPackage
   («com.pleco.chinesesystem», dichiarato nelle <queries>); false = Pleco non c'è → un messaggio discreto con un tocco che
   porta allo store (plecoStore). Nel browser del telefono è un link plecoapi://: se non si apre, non succede niente.
   Sul computer e nel corso di italiano l'opzione non c'è. Nessuna rete: la parola va a Pleco, sul telefono.
   Preferenza: cp-pleco-v1 («1» = acceso, del dispositivo). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, K = "cp-pleco-v1", PLECO_HOLD_MS = 2000, PLECO_MAX = 16, A = window.MandarinoAndroid;
  var IT = (function () { try { return localStorage.getItem("cp-course") === "it"; } catch (e) { return false; } })();
  /* un telefono o un tablet: l'app Android, oppure un puntatore «grossolano» (il dito) */
  function phone() { return !!A || (window.matchMedia && matchMedia("(pointer: coarse)").matches); }
  function available() { return !IT && phone(); }
  function on() { if (!available()) return false; try { return localStorage.getItem(K) === "1"; } catch (e) { return false; } }
  function set(v) { try { if (v) localStorage.setItem(K, "1"); else localStorage.removeItem(K); } catch (e) {} }
  function valid(q) { q = String(q || "").trim(); return q && q.length <= PLECO_MAX && /^[㐀-鿿豈-﫿]+$/.test(q) ? q : ""; }
  function url(q) { return "plecoapi://x-callback-url/s?q=" + encodeURIComponent(q); }
  var ICON = '<svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5A2.5 2.5 0 0 1 4 21.5zM9 7h7M9 10.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  /* la pagina d'uscita: logo e wordmark, il tempo di un respiro */
  function skeleton(then) {
    var d = document.createElement("div"); d.className = "pl-skel"; d.setAttribute("role", "status");
    d.innerHTML = '<svg class="pl-skel-logo" viewBox="300 30 200 200" aria-hidden="true" focusable="false"><use href="#mandarin-symbol"/></svg><div class="pl-skel-wm" lang="it">màndarínō</div><div class="small">' + esc(T("plc.leaving")) + "</div>";
    document.body.appendChild(d);
    var gone = function () { if (d.parentNode) d.parentNode.removeChild(d); document.removeEventListener("visibilitychange", vis); };
    var vis = function () { if (document.hidden) setTimeout(gone, 300); };
    document.addEventListener("visibilitychange", vis);
    setTimeout(then, 450); setTimeout(gone, 2500);
  }
  function missing() {
    chipClose();
    var c = document.createElement("div"); c.className = "pl-chip pl-miss"; c.setAttribute("role", "status");
    c.innerHTML = "<span>" + esc(T("plc.missing")) + '</span><button type="button" class="btn-s" data-pleco-store>' + esc(T("plc.store")) + "</button>";
    document.body.appendChild(c); chip = c; chipT = setTimeout(chipClose, 6000);
  }
  function open(q) {
    q = valid(q); if (!q || !on()) return false;
    CP.sfx("tap"); chipClose();
    skeleton(function () {
      if (A && A.openPleco) { var ok = false; try { ok = A.openPleco(q); } catch (e) {} if (!ok) missing(); return; }
      location.href = url(q);
    });
    return true;
  }
  /* il pulsante che compare dopo 2 s */
  var chip = null, chipT = null;
  function chipClose() { clearTimeout(chipT); if (chip && chip.parentNode) chip.parentNode.removeChild(chip); chip = null; }
  function chipShow(q) {
    chipClose();
    var c = document.createElement("div"); c.className = "pl-chip";
    c.innerHTML = '<button type="button" class="btn-s" data-pleco="' + CP.attr(q) + '">' + ICON + "<span>" + esc(T("plc.open")) + '</span> <span class="han" lang="zh-CN">' + esc(q) + "</span></button>";
    document.body.appendChild(c); chip = c; chipT = setTimeout(chipClose, 6000);
    if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) {}
  }
  /* la parola intera intorno al carattere premuto: la parola della riga, della carta o del foglio; altrimenti il carattere */
  function wordAt(el, ch) {
    var w = el.closest && el.closest(".m-hz, .cd-hz, .fam-head .big"), t = w ? w.textContent.replace(/\s+/g, "") : "";
    return valid(t) || valid(ch);
  }
  CP.pleco = { on: on, available: available, set: set, url: url, valid: valid, open: open, HOLD: PLECO_HOLD_MS };

  var hold = null;
  function cancel() { if (hold) { clearTimeout(hold.t); hold = null; } }
  document.addEventListener("pointerdown", function (e) {
    cancel(); release = false; if (!on() || !CP.charTarget) return;
    var ch = CP.charTarget(e.target); if (!ch) return;
    var q = wordAt(e.target, ch); if (!q) return;
    hold = { x: e.clientX, y: e.clientY, el: e.target, t: setTimeout(function () { hold = null; release = true; chipShow(q); }, PLECO_HOLD_MS) };
  });
  /* il clic che nasce alzando il dito dopo i 2 s non deve chiudere il pulsante appena comparso né leggere la parola */
  var release = false;
  document.addEventListener("click", function (e) { if (!release) return; release = false; if (e.target.closest && e.target.closest(".pl-chip")) return; e.preventDefault(); e.stopPropagation(); }, true);
  document.addEventListener("pointerup", cancel);
  document.addEventListener("pointercancel", cancel);
  document.addEventListener("pointermove", function (e) { if (hold && Math.abs(e.clientX - hold.x) + Math.abs(e.clientY - hold.y) > 10) cancel(); });
  /* si annulla solo se scorre ciò che contiene il carattere premuto: il foglio che si apre a metà pressione scorre da sé */
  document.addEventListener("scroll", function (e) { var t = e.target; if (hold && (t === document || (t && t.contains && t.contains(hold.el)))) cancel(); }, true);
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-pleco], [data-pleco-store]") : null;
    if (!b) { if (chip && !(e.target.closest && e.target.closest(".pl-chip"))) chipClose(); return; }
    if (b.hasAttribute("data-pleco-store")) { chipClose(); if (A && A.plecoStore) try { A.plecoStore(); } catch (x) {} return; }
    CP.pleco.open(b.getAttribute("data-pleco"));
  });
  /* la riga del menu «⋯» della carta di studio (study/study.js la chiede qui) */
  CP.plecoRow = function (hz) { return on() && valid(hz) ? '<button type="button" class="sheet-row" data-pleco="' + CP.attr(hz) + '"><span class="ico" aria-hidden="true">' + ICON + "</span><span><b>" + esc(T("plc.open")) + "</b><small>" + esc(T("plc.rowSub")) + "</small></span></button>" : ""; };

  /* ⚙️ → Studio: acceso / spento, con doppia conferma per accendere; non c'è sul computer né nel corso di italiano */
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "adv", html: function () {
    if (!available()) return "";
    return '<details class="set-sec" id="set-pleco"><summary>' + ICON + " " + T("plc.title") + '</summary><div class="vbody">' +
      '<p class="small muted" style="margin:0">' + T("plc.lede") + "</p>" +
      '<label class="chk"><input type="checkbox" id="opt-pleco"' + (on() ? " checked" : "") + "> " + T("plc.toggle") + "</label>" +
      (on() ? '<p class="small muted" style="margin:0">' + T("plc.how") + "</p>" : "") + "</div></details>";
  } });
  function setClose() { var se = document.getElementById("settings"); if (se && !se.hidden) CP.untrap(se); }
  function setBack() { CP.closeSheet(); if (CP.openSettings) CP.openSettings("set-pleco"); }
  function sheet(body) { setClose(); CP.openSheet('<div class="plc-sheet"><div class="fam-head"><b>' + esc(T("plc.title")) + '</b><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" + body + "</div>"); }
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
