/* ===== màndarínō · sfide e classe, la parte sempre presente: la sezione in ⚙️ (Studio), i link
   …#sfida=MDC1-… e …#classe=MDK1-… (il frammento non arriva a nessun server: si toglie subito dall'indirizzo), i pulsanti
   «🎯» e il riquadro del pacchetto classe in cima al Percorso. Il resto (ui/challenge.js, ui/classroom.js e i loro testi in
   i18n/together.js) si carica al primo uso di CP.challenge o CP.classroom (tools/build.mjs, LAZYMOD): all'avvio pesa poco. ===== */
(function () {
  var CP = window.CP, T = CP.t, OPEN_DELAY_MS = 900;
  function closeSettings() { var s = document.getElementById("settings"); if (s && !s.hidden && CP.untrap) CP.untrap(s); }
  /* un testo qualsiasi (codice incollato, QR, link): sfida o pacchetto classe */
  function lazy() { return !!(CP.challenge && CP.classroom); }   /* carica i moduli e i loro testi */
  function openAny(text) {
    text = String(text || ""); lazy();
    if (/MDC1-/.test(text)) { closeSettings(); return CP.challenge.open(text); }
    if (/MDK1-|"kind"\s*:\s*"class"/.test(text)) { var p = CP.classroom.decode(text); if (p) { if (CP.classroom.add(p)) setTimeout(function () { CP.openSettings("set-together"); }, 300); return true; } CP.toast(T("cls.bad")); return false; }
    CP.toast(T("chal.bad")); return false;
  }
  CP.togetherOpen = openAny;
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "data", html: function () { return CP.classroom.section(); } });
  /* il riquadro in cima al Percorso e alle lezioni di italiano: solo se c'è almeno un pacchetto (il modulo non si carica per niente) */
  CP.classBanner = function () { try { var o = JSON.parse(localStorage.getItem("cp-class-v1") || "null"); if (!o || !o.p || !Object.keys(o.p).length) return ""; } catch (e) { return ""; } return CP.classroom.banner(); };

  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-chal-open], [data-tog-try], [data-tog-scan], [data-cls-settings]") : null; if (!b) return;
    CP.sfx("tap");
    if (b.hasAttribute("data-chal-open")) { closeSettings(); CP.challenge.create(); }
    else if (b.hasAttribute("data-tog-try")) { var i = document.getElementById("tog-code"); openAny(i ? i.value : ""); }
    else if (b.hasAttribute("data-tog-scan") && CP.qrScan) { closeSettings(); lazy(); CP.qrScan(T("chal.scan"), T("chal.scanHint"), function (t) { if (/MDC1-|MDK1-/.test(t)) { setTimeout(function () { openAny(t); }, 300); return true; } return false; }); }
    else if (b.hasAttribute("data-cls-settings")) CP.openSettings("set-together");
  });

  /* i link: si toglie il frammento dall'indirizzo e si apre dopo l'avvio, senza il benvenuto sopra */
  var m = /^#(sfida|classe)=(.+)$/.exec(location.hash);
  if (m) {
    var code = decodeURIComponent(m[2]);
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    window.__mdGoing = true;
    setTimeout(function () { openAny(code); }, OPEN_DELAY_MS);
  }
})();
