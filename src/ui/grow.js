/* ===== màndarínō · «l'app cresce con te»: il pop-up quando si apre una scheda nuova (CP.unlockPop, chiamato da ui/unlock.js).
   Pochi, rari e mai di fretta (docs/ux-architettura.md): al massimo uno al giorno, solo fuori dalle sessioni di studio e mai sopra
   un'altra finestra (lo garantisce unlock.js), chiudibile con un tocco, e ogni scoperta resta ripetibile da ⚙️ → Informazioni → Novità.
   Dice tre cose, in quest'ordine: riconosce il lavoro fatto, spiega a che cosa serve la scheda nuova e mostra la prossima con la
   strada già percorsa (progresso reale, mai barre riempite per finta). Mai colpe, mai scadenze. Pleco, Anki e i widget si
   nominano solo nell'ultimo pop-up della serie. Testi: i18n/grow.js. Si carica al primo uso (tools/build.mjs, LAZYMOD). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, IT = false;
  try { IT = localStorage.getItem("cp-course") === "it"; } catch (e) {}
  var DAY = "md-pop-day";
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  (function css() {
    if (document.getElementById("grow-css")) return;
    var s = document.createElement("style"); s.id = "grow-css";
    s.textContent =
      ".grow-pop{display:grid;gap:12px;text-align:center;justify-items:center}.gp-t{margin:0;font-size:22px;color:var(--accent)}" +
      ".gp-s,.gp-w,.gp-more{margin:0}.gp-w{font-weight:700}" +
      ".gp-next{width:100%;display:grid;gap:6px;text-align:left;background:var(--chip);border-radius:14px;padding:12px 14px}" +
      ".gp-bar{height:6px;border-radius:99px;background:var(--line);overflow:hidden}.gp-bar i{display:block;height:100%;background:var(--accent);border-radius:99px;transition:width .9s ease}" +
      ".grow-pop .acts{width:100%;display:grid;gap:8px}.grow-pop .acts .btn-main{width:100%}.grow-pop p{text-align:left}.grow-guide{display:grid;gap:8px}.grow-guide ol{margin:0;padding-left:20px}.grow-guide li{margin:4px 0}.grow-guide h4{margin:0;font-size:16px}" +
      "@media (prefers-reduced-motion:reduce){.gp-bar i{transition:none}}";
    document.head.appendChild(s);
  })();
  function nameOf(k) { return CP.unlock && CP.unlock.name ? CP.unlock.name(k) : k; }
  function go(tab) { try { CP.closeSheet(); } catch (e) {} if (!tab) return; if (IT && CP.itShow) CP.itShow(tab); else CP.show(tab); }

  /* Restituisce true se l'ha mostrato; onClose() viene chiamato una volta sola, comunque si chiuda */
  CP.unlockPop = function (k, info, onClose) {
    if (!CP.openSheet || lsGet(DAY) === today()) return false;
    info = info || {};
    if (/^x:/.test(k)) return extraPop(k, onClose);
    var nx = info.next, nxt;
    if (nx && nx.xp) nxt = T("grow.popNext", { n: esc(nameOf(nx.k)), xp: nx.xp, m: Math.max(1, nx.xp - nx.have) });
    else if (nx && nx.ls) nxt = T("grow.popNextLs", { n: esc(nameOf(nx.k)), ls: nx.ls, have: nx.haveLs });
    else nxt = T("grow.popDone");
    var html = '<div class="fam-head"><span></span><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" +
      '<div class="grow-pop"><h3 class="gp-t">' + T("grow.popT", { n: esc(nameOf(k)) }) + "</h3>" +
      '<p class="gp-s">' + T("grow.popSub", { xp: info.xp || 0 }) + '</p><p class="gp-w">' + esc(T("unl." + k.replace(":", "_"))) + "</p>" +
      '<div class="gp-next"><span class="small">' + nxt + '</span><div class="gp-bar" role="img" aria-label="' + CP.attr(String(nx ? nx.pct : 100) + "%") + '"><i style="width:' + (nx ? nx.pct : 100) + '%"></i></div></div>' +
      (k === "build" || k === "it:phrases" ? '<p class="gp-more small muted">' + T("grow.popMore") + "</p>" : "") +
      '<div class="acts">' + (info.tab ? '<button type="button" class="btn-main" data-grow-go="' + CP.attr(info.tab) + '">' + esc(T("grow.popGo")) + "</button>" : "") +
      '<button type="button" class="btn-s" data-famclose>' + esc(T("grow.popLater")) + '</button></div><p class="small muted" style="margin:0">' + T("grow.popWhere") + "</p></div>";
    CP.openSheet(html); lsSet(DAY, today());
    try { CP.sfx("level"); } catch (e) {}
    var fam = document.getElementById("fam"), done = false, mo = null;
    function fire() { if (done) return; done = true; if (mo) mo.disconnect(); if (onClose) onClose(); }
    if (fam && window.MutationObserver) { mo = new MutationObserver(function () { if (fam.hidden) fire(); }); mo.observe(fam, { attributes: true, attributeFilter: ["hidden"] }); }
    else setTimeout(fire, 0);
    return true;
  };

  /* Pleco e Anki: spiegano che cosa sono e perché c'è il collegamento; le istruzioni restano per sempre nelle Impostazioni */
  function watchClose(onClose) {
    var fam = document.getElementById("fam"), done = false, mo = null;
    function fire() { if (done) return; done = true; if (mo) mo.disconnect(); if (onClose) onClose(); }
    if (fam && window.MutationObserver) { mo = new MutationObserver(function () { if (fam.hidden) fire(); }); mo.observe(fam, { attributes: true, attributeFilter: ["hidden"] }); }
    else setTimeout(fire, 0);
  }
  function extraPop(k, onClose) {
    var pl = k === "x:pleco", p = pl ? "pl" : "an";
    CP.openSheet('<div class="fam-head"><span></span><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" +
      '<div class="grow-pop"><h3 class="gp-t">' + T("grow." + p + "T") + "</h3><p>" + T("grow." + p + "What") + "</p><p>" + T("grow." + p + "Why") + "</p>" +
      (pl ? "<p>" + T("grow.plHow") + "</p>" : "") + '<p class="small muted">' + T("grow." + p + "Stay") + "</p>" +
      '<div class="acts"><button type="button" class="btn-main" data-grow-set="' + (pl ? "set-pleco" : "set-export") + '">' + esc(T("grow.popOpen")) + "</button>" +
      '<button type="button" class="btn-s" data-famclose>' + esc(T("grow.popLater")) + "</button></div></div>");
    lsSet(DAY, today()); try { CP.sfx("level"); } catch (e) {}
    watchClose(onClose);
    return true;
  }
  /* le guide che stanno dentro le sezioni Pleco e Anki delle Impostazioni (le chiamano ui/pleco.js e core/export-anki.js) */
  CP.plecoGuide = function () { return '<div class="grow-guide"><h4>' + T("grow.plH") + "</h4><p class=\"small\">" + T("grow.plWhat") + "</p><p class=\"small\">" + T("grow.plWhy") + "</p></div>"; };
  CP.ankiGuide = function () {
    return '<div class="grow-guide"><p class="small" style="margin:0">' + T("grow.anWhat") + '</p><p class="small" style="margin:0">' + T("grow.anWhy") + "</p><h4>" + T("grow.anH") + "</h4><ol class=\"small\">" +
      [T("grow.anS1"), T("grow.anS2"), T("grow.anS3"), T("grow.anS4"), T("grow.anS5")].map(function (x) { return "<li>" + x + "</li>"; }).join("") + '</ol><p class="small muted" style="margin:0">' + T("grow.anNot") + "</p></div>";
  };

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-grow-go], [data-grow-set]") : null; if (!t) return;
    CP.sfx("tap");
    if (t.hasAttribute("data-grow-set")) { try { CP.closeSheet(); } catch (er) {} if (CP.openSettings) CP.openSettings(t.getAttribute("data-grow-set")); return; }
    go(t.getAttribute("data-grow-go"));
  });
})();
