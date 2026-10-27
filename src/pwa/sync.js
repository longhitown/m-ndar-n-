/* ===== màndarínō · sincronizzazione senza server: un file nel cloud di chi studia (Google Drive, OneDrive, Dropbox, iCloud…).
   L'app non ha account né server: si sceglie una volta un file (o una cartella sincronizzata dal cloud) e l'app ci
   scrive i progressi; sugli altri dispositivi si sceglie lo stesso file. Ogni sincronizzazione legge il file, lo UNISCE ai
   dati locali con le stesse regole del ripristino (per ogni parola il ripasso più recente, punti per dispositivo, registro
   senza doppioni) e lo riscrive. Nessuno perde niente, anche se due dispositivi studiano lo stesso giorno.
   Tre modi, scelti da soli:
   - app Android: il selettore di file di sistema (vede Drive, OneDrive, Dropbox), permesso persistente (MainActivity/Bridge);
   - Chrome/Edge sul computer: File System Access, il file sta in una cartella sincronizzata (OneDrive, Dropbox, Drive);
   - altrove (iPhone, Firefox): «manuale», cioè salva il file e uniscilo a mano sull'altro dispositivo.
   Quando si sincronizza: all'avvio (lettura + unione + scrittura; se arriva qualcosa di nuovo l'app si ricarica) e quando
   l'app va in secondo piano (solo scrittura). Mai durante una sessione: i dati in memoria resterebbero vecchi. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, A = window.MandarinoAndroid;
  var KEY = "md-sync";   /* fuori dal prefisso cp-: non si esporta e non si sincronizza */
  function cfg() { try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch (e) { return {}; } }
  function setCfg(o) { try { if (o) localStorage.setItem(KEY, JSON.stringify(o)); else localStorage.removeItem(KEY); } catch (e) {} }
  var FSA = !A && typeof window.showSaveFilePicker === "function" && typeof window.showOpenFilePicker === "function";
  var KIND = A && A.syncPick ? "android" : FSA ? "fsa" : "manual";
  var busy = false, lastHash = "";

  /* ---- ponte Android: le chiamate tornano come eventi window.__mdEvt (pwa/android.js) ---- */
  var waits = {}, seq = 0;
  function aCall(fn, args, type) {
    return new Promise(function (res) {
      var id = "s" + (++seq); waits[id] = { type: type, res: res };
      try { A[fn].apply(A, [id].concat(args)); } catch (e) { delete waits[id]; res(null); }
    });
  }
  var prevEvt = window.__mdEvt;
  window.__mdEvt = function (type, id, data) {
    var w = waits[id];
    if (w && w.type === type) { delete waits[id]; w.res(data); return; }
    if (prevEvt) prevEvt(type, id, data);
  };

  /* ---- i tre modi: link (scegli o crea il file), read, write, ok (il permesso c'è ancora) ---- */
  var P = {
    android: {
      link: function (create) { return aCall("syncPick", [!!create], "sync-pick").then(function (d) { if (!d) return null; var p = d.split("\n"); return { uri: p[0], name: p[1] || "mandarino-sync.json" }; }); },
      ok: function (c) { try { return Promise.resolve(!!A.syncHas(c.uri)); } catch (e) { return Promise.resolve(false); } },
      read: function (c) { return aCall("syncRead", [c.uri], "sync-read").then(function (d) { if (d && d.charAt(0) === "1") return d.slice(1); throw new Error((d || "0").slice(1) || "read"); }); },
      write: function (c, text) { return aCall("syncWrite", [c.uri, text], "sync-write").then(function (d) { if (d !== "1") throw new Error((d || "0").slice(1) || "write"); }); }
    },
    fsa: {
      link: function (create) {
        var opt = { types: [{ description: "màndarínō", accept: { "application/json": [".json"] } }] };
        var pick = create ? window.showSaveFilePicker(Object.assign({ suggestedName: "mandarino-sync.json" }, opt)) : window.showOpenFilePicker(opt).then(function (a) { return a[0]; });
        return pick.then(function (h) { return Store.idbSet("sync-handle", h).then(function () { return { name: h.name }; }); }, function () { return null; });
      },
      handle: function () { return Store.idbGet("sync-handle"); },
      ok: function (c, ask) {
        return P.fsa.handle().then(function (h) {
          if (!h || !h.queryPermission) return false;
          return h.queryPermission({ mode: "readwrite" }).then(function (s) {
            if (s === "granted") return true;
            return ask ? h.requestPermission({ mode: "readwrite" }).then(function (r) { return r === "granted"; }) : false;
          });
        }).catch(function () { return false; });
      },
      read: function () { return P.fsa.handle().then(function (h) { return h.getFile(); }).then(function (f) { return f.text(); }); },
      write: function (c, text) { return P.fsa.handle().then(function (h) { return h.createWritable(); }).then(function (w) { return w.write(text).then(function () { return w.close(); }); }); }
    }
  };
  function prov() { var c = cfg(); return c.kind && P[c.kind] ? P[c.kind] : null; }

  function hashLocal() { var s = JSON.stringify(Store.snapshot()), h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ":" + s.length; }
  function fileText() { return Store.exportObj(true).then(function (o) { o.sync = 1; return JSON.stringify(o); }); }

  /* lettura + unione + scrittura. Ritorna { changed, n } oppure lancia un errore */
  function full(ask) {
    var c = cfg(), p = prov(); if (!p) return Promise.reject(new Error("nolink"));
    return p.ok(c, ask).then(function (ok) {
      if (!ok) throw new Error("perm");
      return p.read(c).catch(function () { return ""; }).then(function (text) {
        var o = null; if (text && text.trim()) { try { o = JSON.parse(text); } catch (e) { throw new Error("bad"); } if (!o || o.app !== "mandarino") throw new Error("bad"); }
        return (o ? Store.importObj(o, "merge") : Promise.resolve({ ok: true, n: 0 })).then(function (r) {
          var changed = !!(r && r.changed);
          return fileText().then(function (txt) { return p.write(c, txt); }).then(function () {
            c.last = Date.now(); setCfg(c); lastHash = hashLocal();
            return { changed: changed };
          });
        });
      });
    });
  }
  function writeOnly() {
    var c = cfg(), p = prov(); if (!p || busy) return Promise.resolve();
    var h = hashLocal(); if (h === lastHash) return Promise.resolve();
    return p.ok(c, false).then(function (ok) {
      if (!ok) return;
      busy = true;
      return fileText().then(function (txt) { return p.write(c, txt); }).then(function () { c.last = Date.now(); setCfg(c); lastHash = h; }).catch(function () {}).then(function () { busy = false; });
    });
  }
  function msgOf(e) { var m = e && e.message; return T(m === "perm" ? "sy.perm" : m === "bad" ? "sy.bad" : m === "nolink" ? "sy.none" : "sy.err"); }
  /* «Sincronizza ora» (con un gesto: può chiedere il permesso al browser) */
  CP.syncNow = function () {
    if (busy) return Promise.resolve();
    if (CP.studyActive && CP.studyActive()) { CP.toast(T("sy.later")); return Promise.resolve(); }
    busy = true; paint(T("sy.running"));
    return full(true).then(function (r) {
      busy = false;
      if (r.changed) { CP.toast(T("sy.updated")); setTimeout(function () { location.reload(); }, 700); }
      else { CP.toast(T("sy.done")); paint(); }
    }, function (e) { busy = false; paint(msgOf(e)); CP.toast(msgOf(e)); });
  };
  function link(create) {
    var p = P[KIND]; if (!p) return;
    p.link(create).then(function (r) {
      if (!r) return;
      setCfg({ kind: KIND, uri: r.uri || "", name: r.name, last: 0 });
      CP.syncNow();
    });
  }

  /* ---- automatico: all'avvio (solo se il permesso c'è già) e quando l'app va in secondo piano ---- */
  function auto() {
    var c = cfg(); if (!c.kind || !prov()) return;
    full(false).then(function (r) {
      if (r.changed) { if (CP.toast) CP.toast(T("sy.updated")); setTimeout(function () { location.reload(); }, 900); }
    }, function () {});
  }
  (Store.ready || Promise.resolve()).then(function () { setTimeout(auto, 1200); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) writeOnly(); });
  window.addEventListener("pagehide", function () { writeOnly(); });

  /* ---- ⚙️ → Dati e sincronizzazione → Sincronizzazione ---- */
  function when(ts) { if (!ts) return T("sy.never"); var d = new Date(ts); return d.toLocaleDateString(LANG === "zh" ? "zh-CN" : "it-IT") + " " + d.toLocaleTimeString(LANG === "zh" ? "zh-CN" : "it-IT", { hour: "2-digit", minute: "2-digit" }); }
  function bodyHTML(note) {
    var c = cfg(), h = '<p class="small muted" style="margin:0">' + T("sy.lede") + "</p>";
    if (KIND === "manual") {
      h += '<p class="small" style="margin:0">' + T("sy.manual") + "</p>" +
        '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-sy-save>⬇ ' + T("sy.saveFile") + '</button><button type="button" class="btn-s" data-sy-merge>⬆ ' + T("sy.mergeFile") + "</button></div>";
    } else if (!c.kind) {
      h += '<div class="acts" style="margin:0"><button type="button" class="btn-main" data-sy-new style="margin:0">☁️ ' + T("sy.new") + '</button><button type="button" class="btn-s" data-sy-open>📂 ' + T("sy.open") + "</button></div>" +
        '<p class="small muted" style="margin:0">' + T(KIND === "android" ? "sy.hintA" : "sy.hintF") + "</p>";
    } else {
      h += '<div class="sy-file"><b>☁️ ' + esc(c.name || "mandarino-sync.json") + '</b><span class="small muted">' + T("sy.last", { t: when(c.last) }) + "</span></div>" +
        '<div class="acts" style="margin:0"><button type="button" class="btn-main" data-sy-now style="margin:0">🔄 ' + T("sy.now") + '</button><button type="button" class="btn-s" data-sy-unlink>' + T("sy.unlink") + "</button></div>";
    }
    if (note) h += '<p class="small" role="status" style="margin:0">' + esc(note) + "</p>";
    h += '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-qr-send>📱→ ' + T("qr.send") + '</button><button type="button" class="btn-s" data-qr-recv>📷 ' + T("qr.recv") + "</button></div>";
    return h;
  }
  function paint(note) { var b = document.getElementById("sy-body"); if (b) b.innerHTML = bodyHTML(note); }
  (CP.settingsExtras = CP.settingsExtras || []).unshift({ group: "data", html: function () {
    return '<details class="set-sec" id="set-sync"><summary>🔄 ' + T("sy.title") + '</summary><div class="vbody" id="sy-body">' + bodyHTML() + "</div></details>";
 } });
  var merging = document.createElement("input"); merging.type = "file"; merging.accept = "application/json,.json"; merging.hidden = true; document.body.appendChild(merging);
  merging.addEventListener("change", function () { var f = merging.files && merging.files[0]; if (f && CP.restoreFile) CP.restoreFile(f); merging.value = ""; });
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b || !b.closest("#sy-body")) return;
    if (b.hasAttribute("data-sy-new")) link(true);
    else if (b.hasAttribute("data-sy-open")) link(false);
    else if (b.hasAttribute("data-sy-now")) CP.syncNow();
    else if (b.hasAttribute("data-sy-unlink")) { setCfg(null); Store.idbSet("sync-handle", null); paint(T("sy.unlinked")); }
    else if (b.hasAttribute("data-sy-save")) fileText().then(function (t) { return Store.download("mandarino-sync.json", t); });
    else if (b.hasAttribute("data-sy-merge")) merging.click();
    else if (b.hasAttribute("data-qr-send") && CP.qrSend) CP.qrSend();
    else if (b.hasAttribute("data-qr-recv") && CP.qrReceive) CP.qrReceive();
  });
  CP.sync = { kind: KIND, cfg: cfg, full: full, writeOnly: writeOnly, _P: P };
})();
