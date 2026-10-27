/* ===== màndarínō · «Novità» (⚙️ → Informazioni e supporto): l'elenco dei cambiamenti da data/changelog.js, nella lingua
   dell'interfaccia. La versione più recente è aperta, le altre chiuse. Nessun avviso che compare da solo. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  function entry(e, open) {
    var rows = (LANG === "zh" && e.zh && e.zh.length ? e.zh : e.it) || [], lg = rows === e.it ? "it" : "zh-CN";
    return '<details class="news-v"' + (open ? " open" : "") + "><summary><b>" + esc(e.v) + '</b> <span class="small muted">' + esc(e.d) + "</span></summary>" +
      '<ul class="small news-list" lang="' + lg + '">' + rows.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></details>";
  }
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "info", html: function () {
    var L = window.CHANGELOG || []; if (!L.length) return "";
    return '<details class="set-sec" id="set-news"><summary>🆕 ' + T("news.title") + '</summary><div class="vbody">' +
      '<p class="small muted" style="margin:0">' + T("news.lede", { v: esc(CP.VERSION) }) + "</p>" +
      L.map(function (e, i) { return entry(e, i === 0); }).join("") + "</div></details>";
  } });
})();
