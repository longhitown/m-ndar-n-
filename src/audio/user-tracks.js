/* ===== màndarínō · i brani dell'utente: copia dei file scelti nella memoria privata dell'app (IndexedDB), nessuna rete.
   Gruppo MIEIBRANI (tools/build.mjs, GROUPS): si esegue al primo uso, cioè quando si aggiunge o si toglie un brano o
   quando ne suona uno. L'elenco (nome, durata, peso) sta anche in localStorage (md-ubl, fuori dal backup) ed è gestito
   da CP.jukebox.userSet in player.js; qui stanno solo i file. Interfaccia: CP.ub = { add, remove, blob, sync }. ===== */
(function () {
  var CP = window.CP, DB = "mandarino-user-music", ST = "tracks", MB = 1048576;
  var LIM = CP.ubLimits || { n: 40, mb: 80, min: 30, totalMb: 600 };
  var db = null;
  function open() {
    if (db) return db;
    return (db = new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error("idb"));
      var rq = indexedDB.open(DB, 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore(ST, { keyPath: "id" }); };
      rq.onsuccess = function () { res(rq.result); };
      rq.onerror = function () { db = null; rej(rq.error || new Error("idb")); };
    }));
  }
  function tx(mode, fn) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(ST, mode), rq = fn(t.objectStore(ST));
        t.oncomplete = function () { res(rq && rq.result); };
        t.onerror = t.onabort = function () { rej(t.error || new Error("idb")); };
      });
    });
  }
  function metas() {
    return tx("readonly", function (s) { return s.getAll(); }).then(function (a) {
      return (a || []).sort(function (x, y) { return x.at - y.at; }).map(function (r) { return { id: r.id, name: r.name, sec: r.sec, size: r.size }; });
    });
  }
  function publish(ms) { CP.jukebox.userSet(ms); return ms; }
  /* la durata dice anche se la WebView sa leggere il formato (flac, ogg, m4a… dipendono dal telefono) */
  function probe(file) {
    return new Promise(function (res) {
      var a = new Audio(), u = URL.createObjectURL(file), done = false, tm;
      function end(v) { if (done) return; done = true; clearTimeout(tm); try { a.removeAttribute("src"); a.load(); } catch (e) {} URL.revokeObjectURL(u); res(v); }
      a.preload = "metadata";
      a.onloadedmetadata = function () { end(isFinite(a.duration) && a.duration >= 3 ? a.duration : 0); };
      a.onerror = function () { end(0); };
      tm = setTimeout(function () { end(0); }, 15000);
      a.src = u;
    });
  }
  function title(f) { return f.name.replace(/\.[A-Za-z0-9]{2,5}$/, "").replace(/_+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || CP.t("ub.mine"); }
  function free() {
    try { if (navigator.storage && navigator.storage.estimate) return navigator.storage.estimate().then(function (e) { return e && e.quota ? Math.max(0, e.quota - (e.usage || 0)) : Infinity; }, function () { return Infinity; }); } catch (e) {}
    return Promise.resolve(Infinity);
  }
  function add(files, progress) {
    var r = { added: 0, bad: [] }, have, left, used, k = 0;
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    return Promise.all([metas(), free()]).then(function (a) {
      have = a[0]; left = a[1]; used = have.reduce(function (s, m) { return s + m.size; }, 0);
      return files.reduce(function (p, f) {
        return p.then(function () {
          if (progress) progress(++k);
          var n = f.name, room = Math.min(LIM.totalMb * MB - used, left);
          if (have.length >= LIM.n) { r.bad.push(CP.t("ub.max", { f: n, n: LIM.n })); return; }
          if (have.some(function (m) { return m.size === f.size && m.name === title(f); })) { r.bad.push(CP.t("ub.dup", { f: n })); return; }
          if (f.size > LIM.mb * MB) { r.bad.push(CP.t("ub.big", { f: n, mb: LIM.mb })); return; }
          if (f.size > room) { r.bad.push(CP.t("ub.space", { f: n, mb: Math.max(0, Math.floor(room / MB)) })); return; }
          return probe(f).then(function (sec) {
            if (!sec) { r.bad.push(CP.t("ub.bad", { f: n })); return; }
            if (sec > LIM.min * 60) { r.bad.push(CP.t("ub.long", { f: n, min: LIM.min })); return; }
            var m = { id: "u-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: title(f), sec: Math.round(sec), size: f.size };
            return tx("readwrite", function (s) { return s.put({ id: m.id, name: m.name, sec: m.sec, size: m.size, type: f.type, at: Date.now() + k, blob: f }); }).then(function () {
              have.push(m); used += f.size; left -= f.size; r.added++;
            }, function () { r.bad.push(CP.t("ub.space", { f: n, mb: Math.max(0, Math.floor(room / MB)) })); });
          });
        });
      }, Promise.resolve());
    }).then(function () { return metas(); }).then(publish).then(function () { return r; });
  }
  function remove(id) {
    return tx("readwrite", function (s) { return s.delete(id); }).then(metas).then(publish);
  }
  function blob(id) {
    return tx("readonly", function (s) { return s.get(id); }).then(function (r) {
      if (!r || !r.blob) { sync(); throw new Error("manca"); }
      return r.blob;
    });
  }
  /* allinea l'elenco in localStorage a quello che c'è davvero nella memoria dell'app */
  function sync() { return metas().then(publish, function () {}); }
  CP.ub = { add: add, remove: remove, blob: blob, sync: sync };
  sync();
})();
