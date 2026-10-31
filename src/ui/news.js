/* ===== màndarínō · «Novità» (⚙️ → Informazioni): l'elenco dei cambiamenti da data/changelog.js, nella lingua
   dell'interfaccia, dal più recente: in cima una riga che dice quanto l'app è cresciuta, poi una scheda per ogni tappa
   (la più recente aperta, le altre chiuse). Nessun avviso che compare da solo. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  function when(d) {   /* "2026-10-31" → "31/10/2026" (it) o "2026年10月31日" (zh) */
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ""); if (!m) return d || "";
    return LANG === "zh" ? m[1] + "年" + +m[2] + "月" + +m[3] + "日" : m[3] + "/" + m[2] + "/" + m[1];
  }
  function entry(e, open) {
    var zh = LANG === "zh" && e.zh && e.zh.length, rows = (zh ? e.zh : e.it) || [], lg = zh ? "zh-CN" : "it";
    return '<details class="news-v"' + (open ? " open" : "") + "><summary><b>" + esc(zh && e.vz ? e.vz : e.v) + '</b> <span class="small muted">' + esc(when(e.d)) + "</span></summary>" +
      '<ul class="small news-list" lang="' + lg + '">' + rows.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></details>";
  }
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "info", html: function () {
    var L = window.CHANGELOG || []; if (!L.length) return "";
    return '<details class="set-sec" id="set-news"><summary>🆕 ' + T("news.title") + '</summary><div class="vbody">' +
      '<p class="small muted" style="margin:0">' + T("news.lede", { v: esc(CP.VERSION) }) + "</p>" +
      '<p class="small news-sum" style="margin:0"><b>' + T("news.sum", { n: L.length, d: when(L[L.length - 1].d) }) + "</b></p>" +
      L.map(function (e, i) { return entry(e, i === 0); }).join("") + "</div></details>";
  } });
})();
