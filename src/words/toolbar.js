/* ===== U6: scheda Parole. Prima le parole, poi gli strumenti ===== */
(function () {
  var CP = window.CP, flt = document.getElementById("flt"), leg = document.getElementById("legend");
  var fb = document.getElementById("flt-btn"), lb = document.getElementById("legend-btn"), gb = document.getElementById("goto-btn"), cur = document.getElementById("cur-sec");
  if (!flt || !fb) return;
  [flt, leg].forEach(function (sh) {
    sh.addEventListener("click", function (e) { if (e.target === sh || (e.target.closest && e.target.closest("[data-sheet-close]"))) CP.untrap(sh); });
  });
  function openSheetEl(sh) { CP.trap(sh, function () { CP.untrap(sh); }); var x = sh.querySelector("[data-sheet-close]"); if (x) x.focus({ preventScroll: true }); CP.sfx("tap"); }
  fb.addEventListener("click", function () { openSheetEl(flt); });
  lb.addEventListener("click", function () { CP.ux.set("legendSeen", 1); lb.classList.remove("pulse"); openSheetEl(leg); });
  document.getElementById("flt-reset").addEventListener("click", function () {
    CP.resetFilters(); var m = document.getElementById("mode"); if (m.value) { m.value = ""; m.dispatchEvent(new Event("change")); } badge(); CP.sfx("tap");
  });
  /* quanti filtri sono attivi: il numero sta sul pulsante */
  function badge() {
    var n = (document.getElementById("state").value ? 1 : 0) + (document.getElementById("mode").value ? 1 : 0) + (CP.topic ? 1 : 0), el = document.getElementById("flt-n");
    el.hidden = !n; el.textContent = n; fb.setAttribute("aria-label", n ? CP.t("words.filtersN", { n: n }) : CP.t("words.filters"));
  }
  var rf = CP.refilter; CP.refilter = function () { var r = rf.apply(this, arguments); badge(); return r; };
  document.getElementById("mode").addEventListener("change", badge);
  badge();
  /* «Vai a…»: elenco con ricerca e percentuale di parole già iniziate per sezione (155 chip in riga non si navigano) */
  function pct(S) { var n = 0; for (var i = S.i0; i < S.i1; i++) if (CP.state(CP.ORDER[i]) >= 1) n++; return Math.round(n / Math.max(1, S.i1 - S.i0) * 100); }
  function gotoList(q) {
    q = CP.norm(q || "");
    return CP.SEC.filter(function (S) { return !q || CP.norm(S.title).indexOf(q) >= 0; }).map(function (S) {
      var p = pct(S);
      return '<button type="button" class="goto-row" data-goto="' + CP.attr(S.id) + '"><span>' + CP.esc(S.title) + '</span><span class="goto-pc"><i style="width:' + p + '%"></i><b>' + p + "%</b></span></button>";
    }).join("") || '<p class="muted">Nessuna sezione con questo nome.</p>';
  }
  gb.addEventListener("click", function () {
    CP.openSheet('<div class="fam-head"><div class="meta"><b>Vai a…</b><div class="small muted">' + CP.SEC.length + ' sezioni · % di parole già iniziate</div></div><button type="button" class="fam-x btn-s" data-famclose>' + CP.t("common.close") + '</button></div>' +
      '<label for="goto-q" class="sr">Cerca una sezione</label><input id="goto-q" type="search" placeholder="Cerca una sezione" autocomplete="off" style="margin-top:10px"><div class="goto-list" id="goto-list">' + gotoList("") + "</div>");
    var gq = document.getElementById("goto-q"); if (gq) gq.focus({ preventScroll: true });
  });
  var fam = document.getElementById("fam");
  fam.addEventListener("input", function (e) { if (e.target.id === "goto-q") document.getElementById("goto-list").innerHTML = gotoList(e.target.value); });
  fam.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-goto]") : null; if (!b) return;
    var id = b.getAttribute("data-goto"), sec = document.getElementById(id);
    CP.closeSheet();
    if (sec && sec.hidden) CP.resetFilters();
    setTimeout(function () { CP.gotoSection(id, false); }, 30);
  });
  /* la barra di ricerca resta appiccicata sotto la barra in alto; accanto, il nome della sezione che stai guardando */
  var bar = document.querySelector(".bar"), root = document.documentElement;
  function barH() { if (bar) root.style.setProperty("--bar-h", bar.offsetHeight + "px"); }
  barH(); window.addEventListener("resize", barH);
  var wbar = document.querySelector(".wbar"), tick = 0, last = "";
  function spy() {
    tick = 0; if (document.getElementById("view-words").hidden) return;
    var y = (wbar ? wbar.getBoundingClientRect().bottom : 120) + 8, name = "";
    for (var i = 0; i < CP.SEC.length; i++) { var S = CP.SEC[i]; if (S.el.hidden) continue; if (S.el.getBoundingClientRect().top <= y) name = S.title; else break; }
    if (name !== last) { last = name; cur.textContent = name; }
  }
  window.addEventListener("scroll", function () { if (!tick) tick = requestAnimationFrame(spy); }, { passive: true });
  /* al primo ingresso nella scheda il «?» pulsa una volta */
  document.getElementById("tab-words").addEventListener("click", function () {
    barH(); setTimeout(spy, 60);
    if (!CP.ux.get("legendSeen")) { lb.classList.remove("pulse"); void lb.offsetWidth; lb.classList.add("pulse"); }
  });
})();
