/* ===== màndarínō · l'etichetta «Voce reale»: dopo che una frase è stata letta da una clip vera (core/voice-clip.js, CP.speak) compare
   per qualche secondo una riga piccola in basso, «🎙️ Voce reale · Tatoeba» (italiano) o «… · Common Voice» (cinese). Un tocco apre un
   dettaglio con di chi è la voce e la licenza (le stesse parole dei Crediti) e un invito gentile allo Scambio linguistico (CP.scambio).
   - Compare solo dopo che la clip ha suonato fino in fondo, mai per la voce sintetica, mai prima. Nessun suono, nessuna animazione,
     nessun modale, nessuna rete: è un elemento fisso (position: fixed), quindi non sposta il resto della schermata.
   - Si spegne in ⚙️ → Suoni e musica → Voce («Mostra chi ha letto la frase», chiave cp-voicetag; "0" = spenta) o dal dettaglio.
   - Si carica al primo uso di CP.voiceTag (tools/build.mjs, LAZYMOD); core/core.js la chiama in una riga. ===== */
(function () {
  var CP = window.CP, K = "cp-voicetag", box = null, timer = 0, openD = false, last = null;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function on() { return lsGet(K) !== "0"; }
  /* di chi è la voce di una frase: solo se esiste la clip ed è sul telefono (altrimenti null); logica pura, provata in tools/unit.mjs */
  function info(text, lang) {
    if (lang !== "it" && lang !== "zh") return null;
    if (!CP.voiceClip || !CP.voiceClip.url(text, lang)) return null;
    return { lang: lang, src: lang === "it" ? "vt.srcIt" : "vt.srcZh", by: lang === "it" ? "vt.byIt" : "vt.byZh", lic: lang === "it" ? "CC BY 4.0" : "CC0" };
  }
  function hide() { clearTimeout(timer); openD = false; if (box) box.innerHTML = ""; last = null; }
  function arm(ms) { clearTimeout(timer); timer = setTimeout(function () { if (!openD) hide(); }, ms); }
  function paint() {
    if (!box || !last) return;
    var T = CP.t, src = T(last.src);
    box.innerHTML = '<div class="vtag-d" id="vtag-d"' + (openD ? "" : " hidden") + '><p class="vtag-h">' + T("vt.head") + '</p><p class="small">' + T(last.by) + '</p><p class="small">' + T("vt.invite") +
      '</p><div class="vtag-acts"><button type="button" class="btn-s" data-vt-go aria-label="' + CP.attr(T("vt.goAria")) + '">' + T("vt.go") + '</button><button type="button" class="btn-s" data-vt-off>' + T("vt.off") +
      '</button><button type="button" class="btn-s" data-vt-x>' + T("vt.close") + '</button></div></div>' +
      '<button type="button" class="vtag-b" data-vt-open aria-expanded="' + (openD ? "true" : "false") + '" aria-controls="vtag-d" aria-label="' + CP.attr(T("vt.aria", { src: src })) + '">🎙️ ' + T("vt.chip", { src: src }) + "</button>";
  }
  /* chiamata da CP.speak quando la clip vera ha finito di suonare */
  function show(text, lang) {
    if (!on()) return;
    var i = info(text, lang); if (!i) return;
    if (!box) {
      box = document.createElement("div"); box.id = "vtag"; box.className = "vtag"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite");
      document.body.appendChild(box);
    }
    last = i; openD = false; paint(); arm(8000);
  }
  function close(focus) { openD = false; paint(); arm(5000); if (focus) { var b = box && box.querySelector("[data-vt-open]"); if (b) b.focus(); } }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : null; if (!t) return;
    if (t.closest("[data-vt-open]")) { openD = !openD; paint(); if (openD) clearTimeout(timer); else arm(5000); var b = box.querySelector("[data-vt-open]"); if (b) b.focus(); return; }
    if (t.closest("[data-vt-go]")) { hide(); var st = document.getElementById("settings"); if (st && CP.untrap) CP.untrap(st); void CP.openSettings; /* i testi del foglio (sc.title…) stanno in i18n/settings.js, che si carica con le impostazioni */ CP.scambio.open(); return; }
    if (t.closest("[data-vt-off]")) { lsSet(K, "0"); hide(); return; }
    if (t.closest("[data-vt-x]")) { close(true); return; }
    if (openD && box && !box.contains(t)) close(false);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openD) close(true); });
  /* ⚙️ → Suoni e musica → Voce: l'interruttore (lo mette ui/voice-dl.js dentro «Voci reali») */
  function setting() { var T = CP.t; return '<label class="chk"><input type="checkbox" id="opt-vtag"' + (on() ? " checked" : "") + "> " + T("vt.set") + '</label><p class="small muted" style="margin:0">' + T("vt.setD") + "</p>"; }
  document.addEventListener("change", function (e) {
    if (!(e.target && e.target.id === "opt-vtag")) return;
    lsSet(K, e.target.checked ? "1" : "0"); if (!e.target.checked) hide();
  });
  CP.voiceTag = { show: show, info: info, on: on, setting: setting, hide: hide, K: K };
})();
