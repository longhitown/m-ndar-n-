/* Strato Store: tutto cio' che l'app salva sta in localStorage (chiavi cp-*), con
   (1) copia di sicurezza in IndexedDB (ripristino automatico se localStorage viene svuotato),
   (2) registro dei ripassi (log) in IndexedDB, con ripiego in localStorage,
   (3) backup/ripristino JSON con unione (merge) e promemoria settimanale,
   (4) avviso se il browser non permette di salvare. */
(function () {
  "use strict";
  var PREFIX = "cp-", DB = "mandarino-v5", LOGMAX = 60000, LSLOG = "cp-log-v1", LSLOGMAX = 1500;
  var st = { ls: true, idb: false, restored: false };
  var LS = null;
  try { LS = window.localStorage; LS.setItem("cp-probe", "1"); LS.removeItem("cp-probe"); } catch (e) { LS = null; st.ls = false; }
  function lget(k) { try { return LS ? LS.getItem(k) : null; } catch (e) { return null; } }
  function lset(k, v) { try { if (LS) LS.setItem(k, v); } catch (e) { st.ls = false; } }
  var mem = {};   /* ripiego in memoria se localStorage e' bloccato */

  /* ---- IndexedDB (promesse minime) ---- */
  var dbp = null;
  function openDB() {
    if (dbp) return dbp;
    dbp = new Promise(function (res) {
      try {
        if (!window.indexedDB) return res(null);
        var rq = indexedDB.open(DB, 1);
        rq.onupgradeneeded = function () { var d = rq.result; if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv"); if (!d.objectStoreNames.contains("log")) d.createObjectStore("log", { autoIncrement: true }); };
        rq.onsuccess = function () { st.idb = true; res(rq.result); };
        rq.onerror = rq.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
    return dbp;
  }
  function tx(db, store, mode, fn) {
    return new Promise(function (res) {
      try { var t = db.transaction(store, mode), s = t.objectStore(store), out = fn(s); t.oncomplete = function () { res(out && out.result !== undefined ? out.result : true); }; t.onerror = t.onabort = function () { res(null); }; } catch (e) { res(null); }
    });
  }

  function cpKeys() { var ks = []; try { if (LS) for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (k && k.indexOf(PREFIX) === 0 && k !== "cp-probe" && k !== LSLOG) ks.push(k); } } catch (e) {} return ks; }
  function snapshot() { var o = {}; cpKeys().forEach(function (k) { o[k] = lget(k); }); return o; }

  /* ---- copia in IDB, con ritardo ---- */
  var flushT = 0;
  function scheduleFlush() { clearTimeout(flushT); flushT = setTimeout(flush, 1500); }
  function flush() {
    return openDB().then(function (db) {
      if (!db) return;
      var snap = snapshot();
      return tx(db, "kv", "readwrite", function (s) { s.put({ t: Date.now(), kv: snap }, "snapshot"); });
    });
  }
  /* intercetta le scritture su chiavi cp-* per aggiornare la copia */
  try {
    var P = Storage.prototype, orig = P.setItem, origR = P.removeItem;
    P.setItem = function (k, v) { var r = orig.apply(this, arguments); if (this === LS && typeof k === "string" && k.indexOf(PREFIX) === 0 && k !== LSLOG) scheduleFlush(); return r; };
    P.removeItem = function (k) { var r = origR.apply(this, arguments); if (this === LS && typeof k === "string" && k.indexOf(PREFIX) === 0) scheduleFlush(); return r; };
  } catch (e) {}

  /* ---- ripristino automatico se localStorage e' vuoto ma IDB no ---- */
  function maybeRestore() {
    if (!st.ls) return Promise.resolve(false);
    var hasProgress = !!lget("cp-srs-v1") || !!lget("cp-game-v1");
    if (hasProgress) return Promise.resolve(false);
    return openDB().then(function (db) {
      if (!db) return false;
      return tx(db, "kv", "readonly", function (s) { return s.get("snapshot"); }).then(function (snap) {
        if (!snap || !snap.kv || !snap.kv["cp-srs-v1"]) return false;
        var guard = false; try { guard = sessionStorage.getItem("cp-restored") === "1"; } catch (e) {}
        if (guard) return false;
        Object.keys(snap.kv).forEach(function (k) { lset(k, snap.kv[k]); });
        st.restored = true; try { sessionStorage.setItem("cp-restored", "1"); } catch (e) {}
        return true;
      });
    });
  }

  /* ---- registro dei ripassi ---- */
  var buf = [];         /* ultime voci in memoria (per grafici rapidi) */
  var lsLog = []; try { lsLog = JSON.parse(lget(LSLOG) || "[]") || []; } catch (e) { lsLog = []; }
  function logAdd(e) {
    /* e = [t, chiave, voto(1-4), ms, tipo, R_prevista|null] */
    buf.push(e); if (buf.length > 3000) buf.shift();
    openDB().then(function (db) {
      if (db) { tx(db, "log", "readwrite", function (s) { s.add(e); }); }
      else { lsLog.push(e); if (lsLog.length > LSLOGMAX) lsLog.splice(0, lsLog.length - LSLOGMAX); try { LS && LS.setItem(LSLOG, JSON.stringify(lsLog)); } catch (er) {} }
    });
  }
  function logAll() {
    return openDB().then(function (db) {
      if (!db) return lsLog.slice();
      return tx(db, "log", "readonly", function (s) { return s.getAll(); }).then(function (a) { return Array.isArray(a) ? a : lsLog.slice(); });
    });
  }
  function logClear() { lsLog = []; try { LS && LS.removeItem(LSLOG); } catch (e) {} buf = []; return openDB().then(function (db) { if (db) return tx(db, "log", "readwrite", function (s) { s.clear(); }); }); }
  function logTrim() { /* oltre LOGMAX: tiene le piu' recenti */
    return openDB().then(function (db) { if (!db) return; return tx(db, "log", "readonly", function (s) { return s.count(); }).then(function (n) {
      if (typeof n === "number" && n > LOGMAX) { var del = n - LOGMAX; return tx(db, "log", "readwrite", function (s) { var c = s.openCursor(), k = 0; c.onsuccess = function () { var cur = c.result; if (cur && k < del) { cur.delete(); k++; cur.continue(); } }; }); } }); });
  }

  /* ---- backup / ripristino ---- */
  function exportObj(withLog) {
    return (withLog ? logAll() : Promise.resolve([])).then(function (lg) {
      return { app: "mandarino", v: 5, t: Date.now(), kv: snapshot(), log: lg };
    });
  }
  function mergeSrs(a, b) {
    var out = {}; var ka = Object.keys(a || {}), kb = Object.keys(b || {});
    ka.concat(kb).forEach(function (k) {
      var x = (a || {})[k], y = (b || {})[k];
      if (!x) out[k] = y; else if (!y) out[k] = x;
      else out[k] = ((y.lr || 0) > (x.lr || 0) || ((y.lr || 0) === (x.lr || 0) && (y.n || 0) > (x.n || 0))) ? y : x;
    });
    return out;
  }
  /* contributi: unione per id, vince la voce modificata più di recente (t) */
  function mergeContribs(a, b) {
    var by = {};
    [].concat(Array.isArray(a) ? a : [], Array.isArray(b) ? b : []).forEach(function (x) {
      if (!x || !x.id) return; var o = by[x.id]; if (!o || (x.t || 0) > (o.t || 0)) by[x.id] = x;
    });
    return Object.keys(by).map(function (k) { return by[k]; }).sort(function (x, y) { return (x.t || 0) - (y.t || 0); });
  }
  function mergeLessons(a, b) {
    var out = {}; a = a || {}; b = b || {};
    Object.keys(a).concat(Object.keys(b)).forEach(function (id) {
      var x = a[id] || {}, y = b[id] || {}, o = {};
      if (x.best != null || y.best != null) o.best = Math.max(x.best || 0, y.best || 0);
      if (x.done || y.done) o.done = Math.min(x.done || Infinity, y.done || Infinity);
      if (x.seen || y.seen) o.seen = Math.max(x.seen || 0, y.seen || 0);
      out[id] = o;
    });
    return out;
  }
  function importObj(o, mode) {
    if (!o || o.app !== "mandarino" || !o.kv) return { ok: false, msg: "File non riconosciuto." };
    var n = 0;
    Object.keys(o.kv).forEach(function (k) {
      if (k.indexOf(PREFIX) !== 0 || k === LSLOG) return;
      var cur = lget(k), inc = o.kv[k];
      if (mode === "merge" && cur != null) {
        try {
          if (k === "cp-srs-v1") inc = JSON.stringify(mergeSrs(JSON.parse(cur), JSON.parse(inc)));
          else if (k === "cp-fav-v1") { var u = JSON.parse(cur); var v = JSON.parse(inc); if (Array.isArray(u)) { var t = {}; u.forEach(function (x) { t[x] = 1; }); u = t; } if (Array.isArray(v)) { var t2 = {}; v.forEach(function (x) { t2[x] = 1; }); v = t2; } inc = JSON.stringify(Object.assign({}, v, u)); }
          else if (k === "cp-community-contribs") inc = JSON.stringify(mergeContribs(JSON.parse(cur), JSON.parse(inc)));
          /* lezioni di grammatica: per ogni lezione il punteggio migliore, la prima volta superata, l'ultima letta */
          else if (k === "cp-lessons-v1") inc = JSON.stringify(mergeLessons(JSON.parse(cur), JSON.parse(inc)));
          /* V6.7: preferenze dell'interfaccia; si aggiungono le voci mancanti, a parità vince questo dispositivo */
          else if (k === "cp-ux-v1") inc = JSON.stringify(Object.assign({}, JSON.parse(inc) || {}, JSON.parse(cur) || {}));
          /* V6.7: preferenze del dispositivo (vibrazione, volumi, musica, toni con segno, nickname): vince il dispositivo corrente */
          else if (["cp-haptics", "cp-sfxvol", "cp-jkmood", "cp-jkauto", "cp-toneshapes", "cp-contrib-nick", "cp-lang"].indexOf(k) >= 0) inc = cur;
          else inc = cur;   /* le altre chiavi (impostazioni, gioco): vince il dispositivo corrente */
        } catch (e) { inc = cur; }
      }
      lset(k, inc); n++;
    });
    var pr = Promise.resolve();
    if (o.log && o.log.length) {
      pr = openDB().then(function (db) { if (db) return tx(db, "log", "readwrite", function (s) { o.log.forEach(function (e) { s.add(e); }); }); });
    }
    return pr.then(function () { return flush(); }).then(function () { return { ok: true, msg: n + " voci importate.", n: n }; });
  }
  function download(name, text) {
    var cl = window.claude;
    var fb = function () { try { var u = URL.createObjectURL(new Blob([text], { type: "application/json" })), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(u); }, 1500); } catch (e) {} };
    if (cl && cl.use) { return cl.use("downloads").then(function (d) { if (!d) { fb(); return; } return d.save({ filename: name, data: text }); }).catch(function (e) { if (!(e && e.code === "declined")) fb(); }); }
    fb(); return Promise.resolve();
  }
  function backup() {
    return exportObj(true).then(function (o) {
      var d = new Date(), name = "mandarino-backup-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + ".json";
      lset("cp-backup-ts", String(Date.now()));
      return download(name, JSON.stringify(o)).then(function () { return name; });
    });
  }
  function backupDue(reviews) {
    var ts = parseInt(lget("cp-backup-ts"), 10) || 0, now = Date.now();
    return reviews >= 30 && (now - ts) > 7 * 86400000;
  }

  window.Store = { status: function () { return { ls: st.ls, idb: st.idb, restored: st.restored }; }, get: lget, set: lset, snapshot: snapshot, flush: flush,
    log: logAdd, logAll: logAll, logClear: logClear, recent: function () { return buf; },
    exportObj: exportObj, importObj: importObj, backup: backup, backupDue: backupDue, download: download, mergeSrs: mergeSrs, mergeContribs: mergeContribs, ready: openDB().then(function (db) { return maybeRestore().then(function (r) { if (r) { try { location.reload(); } catch (e) {} } logTrim(); return !!db; }); }) };
})();

