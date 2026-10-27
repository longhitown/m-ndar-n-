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
  function mergeItSrs(a, b) {
    var out = {}; a = a || {}; b = b || {};
    Object.keys(a).concat(Object.keys(b)).forEach(function (id) {
      var x = a[id], y = b[id];
      if (id === "__meta") { out[id] = !x ? y : !y ? x : x.d !== y.d ? (x.d > y.d ? x : y) : { d: x.d, nw: Math.max(x.nw || 0, y.nw || 0) }; return; }
      out[id] = !x ? y : !y ? x : ((y.lr || 0) > (x.lr || 0) ? y : x);
    });
    return out;
  }
  /* gioco: base comune al massimo, punti di ogni dispositivo al massimo (contatori che crescono soltanto), giorni uniti */
  function mergeGame(a, b) {
    a = a || {}; b = b || {};
    var norm = function (o) { return { base: o.xpBy ? (o.base | 0) : (o.xp | 0), by: o.xpBy || {} }; }, A = norm(a), B = norm(b);
    var by = {}; Object.keys(A.by).concat(Object.keys(B.by)).forEach(function (k) { by[k] = Math.max(A.by[k] | 0, B.by[k] | 0); });
    var base = Math.max(A.base, B.base), xp = base; Object.keys(by).forEach(function (k) { xp += by[k]; });
    var days = {}, da = a.days || {}, db = b.days || {};
    Object.keys(da).concat(Object.keys(db)).forEach(function (d) {
      var x = da[d] || {}, y = db[d] || {}, w = (x.w || []).slice();
      (y.w || []).forEach(function (k) { if (w.indexOf(k) < 0) w.push(k); });
      var o = { w: w }; ["s", "e", "nw", "nx"].forEach(function (f) { var v = Math.max(x[f] | 0, y[f] | 0); if (v) o[f] = v; });
      days[d] = o;
    });
    /* punti del test di livello: per ogni test vale il valore più alto, ma «annullato» (−1) vince; nel totale conta il più alto */
    var pl = {}, pa = a.pl || {}, pb = b.pl || {}, bonus = 0;
    Object.keys(pa).concat(Object.keys(pb)).forEach(function (k) { pl[k] = pa[k] === -1 || pb[k] === -1 ? -1 : Math.max(pa[k] | 0, pb[k] | 0); if (pl[k] > bonus) bonus = pl[k]; });
    var out = { xp: xp + bonus, base: base, xpBy: by, goal: a.goal || b.goal || 10, days: days, best: Math.max(a.best | 0, b.best | 0) };
    if (Object.keys(pl).length) out.pl = pl;
    return out;
  }
  /* preferenze dell'interfaccia: si aggiungono le voci mancanti, a parità vince questo dispositivo; ma gli sblocchi (unl) e
     «mostra tutto» si uniscono con «basta uno»: una scheda sbloccata su un dispositivo è sbloccata anche sull'altro */
  function mergeUx(a, b) {
    a = a || {}; b = b || {};
    var o = Object.assign({}, b, a), u = Object.assign({}, b.unl || {}, a.unl || {});
    if (Object.keys(u).length) o.unl = u;
    if (a.showAll || b.showAll) o.showAll = 1;
    return o;
  }
  /* sigilli di gratitudine: i codici si uniscono (basta che un dispositivo ce l'abbia), le preferenze (titolo, nome,
     condivisione) vengono dal dispositivo che le ha cambiate per ultimo */
  function mergeSeal(a, b) {
    a = a || {}; b = b || {};
    var newer = (b.t || 0) > (a.t || 0) ? b : a, codes = Object.assign({}, b.codes || {}, a.codes || {});
    return { codes: codes, gram: newer.gram || "n", name: newer.name || "", share: newer.share ? 1 : 0, t: Math.max(a.t || 0, b.t || 0) };
  }
  /* orecchio: matrice di confusione dei toni, cella per cella il valore più alto */
  function mergeEar(a, b) {
    if (!a || !a.m) return b; if (!b || !b.m) return a;
    var m = a.m.map(function (r, i) { return r.map(function (v, j) { return Math.max(v | 0, (b.m[i] || [])[j] | 0); }); }), n = 0;
    m.forEach(function (r) { r.forEach(function (v) { n += v; }); });
    return { m: m, n: n };
  }
  /* frasi salvate nel laboratorio: unione, senza doppioni */
  function mergeEx(a, b) {
    a = a || {}; b = b || {};
    var U = {}, E = {}, RD = {};
    [a.units || {}, b.units || {}].forEach(function (u) { Object.keys(u).forEach(function (id) {
      var x = U[id], y = u[id] || {}; if (!x) { U[id] = JSON.parse(JSON.stringify(y)); return; }
      var m = { passo: Math.max(x.passo || 0, y.passo || 0) }, vx = x.verifica, vy = y.verifica;
      if (vx || vy) m.verifica = !vx ? vy : !vy ? vx : ((vy.data || 0) > (vx.data || 0) ? vy : vx);
      Object.keys(y).concat(Object.keys(x)).forEach(function (f) { if (m[f] === undefined && f !== "passo" && f !== "verifica") m[f] = x[f] !== undefined ? x[f] : y[f]; });
      U[id] = m;
    }); });
    [a.ex || {}, b.ex || {}].forEach(function (ex) { Object.keys(ex).forEach(function (k) {
      var t = E[k] = E[k] || {}; Object.keys(ex[k] || {}).forEach(function (ty) { var y = ex[k][ty], x = t[ty]; if (!x || (y && (y.n || 0) > (x.n || 0)) || (y && (y.n || 0) === (x.n || 0) && (y.ultimo || 0) > (x.ultimo || 0))) t[ty] = y; });
    }); });
    [a.read || {}, b.read || {}].forEach(function (r) { Object.keys(r).forEach(function (id) { RD[id] = Math.max(RD[id] || 0, r[id] || 0); }); });
    /* coppie scambiate (Taccuino del viaggiatore): per ogni coppia la voce con n più alto, la prima tappa più bassa, l'ultima volta più recente */
    var CF = {};
    [a.conf || {}, b.conf || {}].forEach(function (cf) { Object.keys(cf).forEach(function (k) {
      var y = cf[k] || {}, x = CF[k]; if (!x) { CF[k] = JSON.parse(JSON.stringify(y)); return; }
      CF[k] = { n: Math.max(x.n || 0, y.n || 0), ultimo: Math.max(x.ultimo || 0, y.ultimo || 0), d: Math.min(x.d || 0, y.d || 0) }; if (x.t || y.t) CF[k].t = x.t || y.t;
    }); });
    var out = { units: U, ex: E, read: RD };
    if (Object.keys(CF).length) out.conf = CF;
    Object.keys(b).concat(Object.keys(a)).forEach(function (f) { if (!(f in out)) out[f] = a[f] !== undefined ? a[f] : b[f]; });
    return out;
  }
  function mergeMine(a, b) {
    var out = [], seen = {};
    [].concat(Array.isArray(a) ? a : [], Array.isArray(b) ? b : []).forEach(function (x) { var k = JSON.stringify([x && x.t, x && x.p]); if (x && !seen[k]) { seen[k] = 1; out.push(x); } });
    return out.slice(0, 40);
  }
  /* unione di una chiave: il valore unito, oppure null = resta quello di questo dispositivo */
  var KEEP = ["cp-haptics", "cp-sfxvol", "cp-jkmood", "cp-jkauto", "cp-jkbg", "cp-toneshapes", "cp-contrib-nick", "cp-contrib-credit-v1", "cp-pleco-v1", "cp-card-v1", "cp-lang", "cp-ex-style", "cp-ex-dur"];
  function favObj(x) { if (Array.isArray(x)) { var t = {}; x.forEach(function (k) { t[k] = 1; }); return t; } return x || {}; }
  function mergeKey(k, a, b) {
    if (k === "cp-srs-v1") return mergeSrs(a, b);
    if (k === "cp-fav-v1") return Object.assign({}, favObj(b), favObj(a));
    if (k === "cp-community-contribs") return mergeContribs(a, b);
    /* lezioni di grammatica: per ogni lezione il punteggio migliore, la prima volta superata, l'ultima letta */
    if (k === "cp-lessons-v1" || k === "cp-it-lessons-v1") return mergeLessons(a, b);
    /* corso di italiano: per ogni parola vince la scheda ripassata più di recente; il conteggio dei nuovi del giorno, il più alto */
    if (k === "cp-it-srs-v1") return mergeItSrs(a, b);
    if (k === "cp-game-v1" || k === "cp-it-game-v1") return mergeGame(a, b);
    if (k === "cp-ear-v1") return mergeEar(a, b);
    if (k === "cp-mine") return mergeMine(a, b);
    /* preferenze dell'interfaccia: si aggiungono le voci mancanti, a parità vince questo dispositivo */
    if (k === "cp-ux-v1") return mergeUx(a, b);
    if (k === "cp-seal-v1") return mergeSeal(a, b);
    /* traguardi del corso di italiano: unione, per ognuno la data più vecchia */
    if (k === "cp-it-cards-v1") { var m = {}, A = (a && a.m) || {}, B = (b && b.m) || {}; Object.keys(A).concat(Object.keys(B)).forEach(function (id) { var x = A[id], y = B[id]; m[id] = x && y ? Math.min(x, y) : x || y; }); return { m: m }; }
    /* pacchetti classe: unione per id; chi è stato tolto su un dispositivo resta tolto (la data più recente) */
    if (k === "cp-class-v1") { var P = {}, X = {}; [a, b].forEach(function (o) { o = o || {}; Object.keys(o.p || {}).forEach(function (id) { if (!P[id] || (o.p[id].at || 0) < (P[id].at || 0)) P[id] = o.p[id]; }); Object.keys(o.x || {}).forEach(function (id) { X[id] = Math.max(X[id] || 0, o.x[id]); }); }); return { p: P, x: X }; }
    /* esercizi: per ogni unità il passo più avanzato e la verifica più recente; per ogni parola e tipo la voce con n
       più alto (mai la somma: un backup ripristinato non conta due volte); i testi letti si sommano */
    if (k === "cp-ex-v1") return mergeEx(a, b);
    return null;   /* preferenze del dispositivo (KEEP) e le altre chiavi: vince il dispositivo corrente */
  }
  /* JSON con le chiavi in ordine: due valori uguali danno lo stesso testo, qualunque sia l'ordine in cui sono stati costruiti */
  function canon(x) {
    if (Array.isArray(x)) return "[" + x.map(canon).join(",") + "]";
    if (x && typeof x === "object") return "{" + Object.keys(x).sort().map(function (k) { return JSON.stringify(k) + ":" + canon(x[k]); }).join(",") + "}";
    return JSON.stringify(x);
  }
  /* changed: è arrivato qualcosa di nuovo? Si confronta l'unione con l'unione di questo dispositivo con sé stesso, così le
     differenze di forma (campi a zero, ordine delle chiavi) non contano: sincronizzare due volte la stessa cosa non cambia niente */
  function importObj(o, mode) {
    if (!o || o.app !== "mandarino" || !o.kv) return { ok: false, msg: "File non riconosciuto." };
    var n = 0, changed = false;
    Object.keys(o.kv).forEach(function (k) {
      if (k.indexOf(PREFIX) !== 0 || k === LSLOG) return;
      var cur = lget(k), inc = o.kv[k];
      if (mode === "merge" && cur != null) {
        if (KEEP.indexOf(k) >= 0) inc = cur;
        else {
          try {
            var a = JSON.parse(cur), m = mergeKey(k, a, JSON.parse(inc));
            if (m === null) inc = cur;
            else { inc = JSON.stringify(m); if (canon(m) !== canon(mergeKey(k, a, a))) changed = true; }
          } catch (e) { inc = cur; }
        }
      } else if (cur !== inc) changed = true;
      lset(k, inc); n++;
    });
    var pr = Promise.resolve();
    if (o.log && o.log.length) {
      /* registro dei ripassi: in unione si aggiungono solo le voci che mancano (stesso istante, stessa parola = stessa voce),
         così sincronizzare più volte non duplica niente */
      pr = (mode === "merge" ? logAll() : Promise.resolve([])).then(function (have) {
        var seen = {}; (have || []).forEach(function (e) { if (e) seen[e[0] + "|" + e[1]] = 1; });
        var add = o.log.filter(function (e) { return e && !seen[e[0] + "|" + e[1]]; });
        if (!add.length) return;
        return openDB().then(function (db) { if (db) return tx(db, "log", "readwrite", function (s) { add.forEach(function (e) { s.add(e); }); }); else { lsLog = lsLog.concat(add); } });
      });
    }
    return pr.then(function () { return flush(); }).then(function () { return { ok: true, msg: n + " voci importate.", n: n, changed: changed }; });
  }
  /* «Azzera»: progressi del corso di cinese (carte, punti e serie, lezioni, gara d'ascolto) e registro dei ripassi.
     Con personal anche preferiti e frasi salvate. Le impostazioni e i contributi restano. La copia interna in IndexedDB
     viene riscritta subito, così il ripristino automatico non riporta indietro ciò che si è appena cancellato. */
  var PROGRESS = ["cp-game-v1", "cp-lessons-v1", "cp-ear-v1"], PERSONAL = ["cp-fav-v1", "cp-mine"];
  function resetProgress(personal) {
    lset("cp-srs-v1", "{}");
    PROGRESS.concat(personal ? PERSONAL : []).forEach(function (k) { try { if (LS) LS.removeItem(k); } catch (e) {} });
    return logClear().then(function () { return flush(); });
  }
  /* mime: il tipo del file (di base JSON: backup, contributi); l'esportazione per Anki usa text/tab-separated-values */
  function download(name, text, mime) {
    var cl = window.claude;
    var fb = function () { try { var u = URL.createObjectURL(new Blob([text], { type: mime || "application/json" })), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(u); }, 1500); } catch (e) {} };
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

  /* valori qualsiasi (anche un FileSystemFileHandle) nella copia interna, fuori dai dati esportati */
  function idbGet(k) { return openDB().then(function (db) { return db ? tx(db, "kv", "readonly", function (s) { return s.get("x:" + k); }) : null; }); }
  function idbSet(k, v) { return openDB().then(function (db) { return db ? tx(db, "kv", "readwrite", function (s) { if (v == null) s.delete("x:" + k); else s.put(v, "x:" + k); }) : null; }); }
  window.Store = { status: function () { return { ls: st.ls, idb: st.idb, restored: st.restored }; }, get: lget, set: lset, snapshot: snapshot, flush: flush,
    log: logAdd, logAll: logAll, logClear: logClear, recent: function () { return buf; },
    exportObj: exportObj, importObj: importObj, idbGet: idbGet, idbSet: idbSet, mergeGame: mergeGame, resetProgress: resetProgress, backup: backup, backupDue: backupDue, download: download, mergeSrs: mergeSrs, mergeContribs: mergeContribs, ready: openDB().then(function (db) { return maybeRestore().then(function (r) { if (r) { try { location.reload(); } catch (e) {} } logTrim(); return !!db; }); }) };
})();

