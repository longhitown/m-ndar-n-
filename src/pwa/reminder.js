/* ===== màndarínō · ⚙️ → Promemoria: un avviso al giorno all'ora scelta, spento finché non lo accendi.
   Solo nell'app Android (Reminder.java): il permesso delle notifiche si chiede quando lo accendi, non all'avvio.
   L'avviso si calcola sul telefono dallo stato del widget e non arriva se oggi hai già studiato. ===== */
(function () {
  var CP = window.CP, T = CP.t, A = window.MandarinoAndroid;
  var APK = !!(A && A.setReminder);
  function cur() { try { return JSON.parse(A.getReminder()); } catch (e) { return { on: false, h: 20, m: 0, perm: "prompt" }; } }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function body(note) {
    if (!APK) return '<p class="small muted" style="margin:0">' + T("rm.webOnly") + "</p>";
    var r = cur();
    return '<label class="chk"><input type="checkbox" id="rm-on"' + (r.on ? " checked" : "") + "> " + T("rm.on") + "</label>" +
      '<label class="small" style="display:grid;gap:4px;font-weight:600">' + T("rm.time") + '<input type="time" id="rm-time" value="' + pad(r.h) + ":" + pad(r.m) + '"' + (r.on ? "" : " disabled") + "></label>" +
      '<p class="small muted" style="margin:0">' + T("rm.hint") + "</p>" +
      (r.on && r.perm === "denied" ? '<p class="small" style="margin:0">⚠️ ' + T("rm.denied") + "</p>" : "") +
      (note ? '<p class="small" role="status" style="margin:0">' + CP.esc(note) + "</p>" : "");
  }
  function paint(note) { var b = document.getElementById("rm-body"); if (b) b.innerHTML = body(note); }
  (CP.settingsExtras = CP.settingsExtras || []).push(function () {
    return '<details class="set-sec" id="set-reminder"><summary>🔔 ' + T("rm.title") + '</summary><div class="vbody" id="rm-body">' + body() + "</div></details>";
  });
  if (!APK) return;
  var waits = {}, n = 0, prev = window.__mdEvt;
  window.__mdEvt = function (type, id, data) { if (type === "notif-perm" && waits[id]) { var f = waits[id]; delete waits[id]; f(data === "1"); return; } if (prev) prev(type, id, data); };
  function ask(cb) { var id = "n" + (++n); waits[id] = cb; A.requestNotif(id); }
  function save(on) {
    var v = (document.getElementById("rm-time") || {}).value || "20:00", p = v.split(":");
    A.setReminder(on, +p[0] || 0, +p[1] || 0);
    if (CP.widgetPush) CP.widgetPush();   /* il promemoria legge lo stato del widget: che sia fresco */
  }
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "rm-on") {
      if (!t.checked) { save(false); paint(T("rm.offDone")); return; }
      ask(function (ok) {
        if (!ok) { A.setReminder(false, 20, 0); paint(T("rm.needPerm")); return; }
        save(true); paint(T("rm.onDone", { t: (document.getElementById("rm-time") || {}).value || "20:00" }));
      });
    } else if (t.id === "rm-time" && cur().on) { save(true); paint(T("rm.onDone", { t: t.value })); }
  });
})();
