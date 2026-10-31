/* ===== màndarínō · «Scarica le voci»: ⚙️ → Suoni e musica → Voce → «Voci reali». Sul sito le clip si scaricano solo da qui, una
   volta, nella cache mandarino-voice (il service worker la tiene tra un aggiornamento e l'altro); poi cp-voice-dl = "1" e
   CP.speak le usa (core/voice-clip.js). Nell'APK sono già dentro. Si carica al primo uso di CP.voiceDl. ===== */
(function () {
  var CP = window.CP, V = CP.voiceClip, DL = null, DLK = V.DLK, VCACHE = V.VCACHE;
  function lsSet(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
  function cat() { return V.cat(); } function langs() { return V.langs(); } function apk() { return V.apk(); } function local() { return V.local(); } function fileUrl(l, id) { return V.fileUrl(l, id); }
  function mb() { var F = cat() || {}, b = 0; langs().forEach(function (l) { b += (F.byte || {})[l] || 0; }); return b / 1e6; }
  /* scarica tutte le clip nella cache del telefono, quattro alla volta; onStep(fatti, totale) */
  function download(onStep) {
    if (!window.caches) return Promise.reject(new Error("cache"));
    var F = cat() || {}, list = [];
    langs().forEach(function (l) { Object.keys(F[l]).forEach(function (id) { list.push(fileUrl(l, id)); }); });
    var done = 0, fail = 0, i = 0;
    return caches.open(VCACHE).then(function (c) {
      function one() {
        if (i >= list.length) return Promise.resolve();
        var u = list[i++];
        return c.match(u).then(function (m) { return m || c.add(u); }).then(function () { done++; }, function () { fail++; }).then(function () { if (onStep) onStep(done + fail, list.length); return one(); });
      }
      return Promise.all([one(), one(), one(), one()]);
    }).then(function () { if (!fail) lsSet(DLK, "1"); return { done: done, fail: fail, tot: list.length }; });
  }
  function remove() { lsSet(DLK, ""); return window.caches ? caches.delete(VCACHE) : Promise.resolve(); }
  /* ⚙️ → Suoni e musica → Voce: «Voci reali», con il pulsante per scaricarle (sul sito) */
  function html() {
    var T = CP.t; if (!langs().length) return "";
    var h = '<div class="vab vc-box" id="vc-box"><div class="small" style="font-weight:700">' + T("vc.title") + '</div><p class="small muted" style="margin:2px 0 6px">' + T("vc.desc") + "</p>";
    if (apk()) h += '<p class="small okline" style="margin:0">' + T("vc.apk") + "</p>";
    else if (DL) h += '<p class="small" style="margin:0" role="status">' + T("vc.dling", DL) + "</p>";
    else if (local()) h += '<p class="small okline" style="margin:0">✓ ' + T("vc.ok") + '</p><button type="button" class="btn-s" data-vc-del>' + T("vc.del") + "</button>";
    else if (window.caches && location.protocol !== "file:") h += '<button type="button" class="btn-s" data-vc-dl>' + T("vc.dl", { mb: mb().toFixed(1).replace(".", T("vc.dec")) }) + "</button>";
    return h + CP.voiceTag.setting() + "</div>";
  }
  function repaint() { var b = document.getElementById("vc-box"); if (b) b.outerHTML = html(); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-vc-dl], [data-vc-del]") : null; if (!b) return;
    CP.sfx("tap");
    if (b.hasAttribute("data-vc-del")) { remove().then(repaint); return; }
    DL = { n: 0, tot: 0 }; repaint();
    download(function (n, tot) { DL = { n: n, tot: tot }; repaint(); }).then(function (r) {
      DL = null; repaint(); if (r.fail && CP.toast) CP.toast(CP.t("vc.fail", { n: r.fail }));
    }, function () { DL = null; repaint(); if (CP.toast) CP.toast(CP.t("vc.fail", { n: "" })); });
  });
  CP.voiceDl = { html: html, download: download, remove: remove, mb: mb };
})();
