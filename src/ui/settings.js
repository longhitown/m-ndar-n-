/* ===== ⚙️ Impostazioni, la parte che serve all'avvio: il pulsante, la lingua dei menu, i toni con la forma, i tocchi su «Crediti» e sulla
   carta da condividere. Le pagine, la ricerca e le sezioni dei moduli stanno in ui/settings-pages.js, che si carica la prima volta che il
   codice tocca CP.openSettings o CP.repaintSettings (tools/build.mjs, LAZYMOD). Da src/, senza build, è un normale script. ===== */
(function () {
  var CP = window.CP, el = document.getElementById("settings"), btn = document.getElementById("settings-btn");
  if (!el || !btn) return;
  /* lingua dei menu */
  function paintLang() { Array.prototype.forEach.call(el.querySelectorAll("[data-lang-set]"), function (b) { var on = b.getAttribute("data-lang-set") === LANG; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); }); }
  CP.setLang = function (l) {
    var nl = l === "zh" ? "zh" : "it"; if (nl === LANG) return;
    LANG = nl; try { localStorage.setItem("cp-lang", LANG); } catch (e) {}
    applyI18n(); paintLang(); CP.sfx("tap");
    /* molte parti si disegnano una volta sola all'avvio (tabella delle parole, filtri, voce): si riparte da capo,
       così ogni testo è nella lingua nuova. I progressi sono già salvati. */
    /* si ricarica senza ripetere l'animazione d'avvio e si riapre la stessa pagina delle impostazioni (main.js, index.html: cp-fast) */
    try { sessionStorage.setItem("cp-fast", JSON.stringify({ set: CP.settingsPage ? CP.settingsPage() : "" })); } catch (e) {}
    setTimeout(function () { location.reload(); }, 150);
  };
  btn.addEventListener("click", function () { CP.openSettings(); });
  /* «Crediti e licenze»: ui/credits.js si carica al primo uso di CP.credits */
  document.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-credits]") : null; if (b && CP.credits) CP.credits(); });
  /* la carta da condividere: ui/share-card.js si carica al primo uso di CP.shareCard */
  document.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-card-open]") : null; if (b && CP.shareCard) { CP.sfx("tap"); CP.shareCard(); } });
  /* U7: toni anche con la forma (per chi non distingue il rosso dal verde) */
  try { if (localStorage.getItem("cp-toneshapes") === "1") document.body.classList.add("tone-shapes"); } catch (e) {}
  /* pallino «Nuovo» su ⚙️: pagina Comunità o novità non ancora viste (lo stato iniziale; poi lo tiene ui/community.js) */
  try { var sv = window.__MD_APK && window.__MD_APK.version || CP.VERSION, ls = localStorage, sr = document.getElementById("set-new-sr"); if (sr && ["look", "sound", "community", "study", "data", "info"].some(function (p) { return ls.getItem("md-seen-p-" + p) !== (p === "info" ? String(sv) : "1"); })) { btn.classList.add("has-new"); btn.setAttribute("aria-describedby", "set-new-sr"); sr.textContent = LANG === "zh" ? "有新内容" : "Ci sono novità"; } } catch (e) {}
})();
