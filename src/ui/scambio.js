/* ===== màndarínō · Scambio linguistico: le voci di madrelingua (docs/scambio-linguistico.md).
   Chi studia l'italiano (corso «it», interfaccia in cinese) registra frasi CINESI; chi studia il cinese registra frasi ITALIANE:
   la propria lingua, una frase dell'app per volta, con il testo davanti e la traduzione accanto. Prima c'è il foglio del consenso
   (CC BY 4.0, maggiorenni, nome e regione facoltativi). Le registrazioni restano sul telefono, in IndexedDB (mandarino-voices-v1,
   fuori dal backup e dalla sincronizzazione: pesano troppo e sono personali); il consenso sta in md-voice-consent (senza il prefisso
   «cp-», quindi neppure lui entra nei backup). Niente parte da sola: l'invio è un .zip (manifest.json + audio) che la persona manda
   come vuole (Condividi o e-mail). Nessuna rete. Si carica al primo uso di CP.scambio. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, LIM = 8000, MAXSEND = 200, SITE = "https://mandarinoapp.org/partecipa-voci.html?da=app", MAIL = "mandarinoapp@gmail.com";
  var DB = null, PRE = null, REV = 0, SES = 0, S = { queue: null, qi: 0, cur: null, skip: {}, rec: null, blob: null, ms: 0, busy: false, mime: "", err: "", sentFile: null, lease: null };

  /* ---- consenso (localStorage, chiave senza «cp-»: non entra nei backup) ---- */
  function consent() { try { var o = JSON.parse(localStorage.getItem("md-voice-consent") || "null"); return o && o.age && o.ok && o.pub ? o : null; } catch (e) { return null; } }
  function setConsent(o) { try { if (o) localStorage.setItem("md-voice-consent", JSON.stringify(o)); else localStorage.removeItem("md-voice-consent"); } catch (e) {} }
  function opt(k, v) { var o = consent() || {}; o[k] = v; setConsent(o); }

  /* ---- le registrazioni (IndexedDB) ---- */
  function db() {
    if (DB) return DB;
    DB = new Promise(function (res) {
      try {
        if (!window.indexedDB) return res(null);
        var rq = indexedDB.open("mandarino-voices-v1", 1);
        rq.onupgradeneeded = function () { if (!rq.result.objectStoreNames.contains("rec")) rq.result.createObjectStore("rec", { keyPath: "id" }); };
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = rq.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
    return DB;
  }
  function idbErr(code) { var e = new Error("idb"); e.code = code; return e; }
  function tx(mode, fn) {
    return db().then(function (d) {
      if (!d) throw idbErr("unavailable");
      return new Promise(function (res, rej) {
        try { var t = d.transaction("rec", mode), r = fn(t.objectStore("rec")); t.oncomplete = function () { res(r && "result" in r ? r.result : true); }; t.onerror = t.onabort = function () { rej(idbErr("failed")); }; } catch (e) { rej(idbErr("failed")); }
      });
    });
  }
  function all() { return tx("readonly", function (s) { return s.getAll(); }).then(function (a) { return Array.isArray(a) ? a.sort(function (x, y) { return y.created - x.created; }) : []; }); }
  function put(r) { return tx("readwrite", function (s) { return s.put(r); }).then(function (x) { REV++; return x; }); }
  function del(id) { return tx("readwrite", function (s) { return s.delete(id); }).then(function (x) { REV++; return x; }); }
  function clear() { return tx("readwrite", function (s) { return s.clear(); }).then(function (x) { REV++; return x; }); }

  /* ---- lingue: si registra la propria; a richiesta anche quella che si studia (non madrelingua) ---- */
  function ownLang() { return CP.course && CP.course() === "it" ? "zh-CN" : "it-IT"; }
  function otherLang() { return ownLang() === "zh-CN" ? "it-IT" : "zh-CN"; }
  function wantOther() { return !!(consent() || {}).other; }
  function curLang() { return S.useOther ? otherLang() : ownLang(); }
  function native() { return !S.useOther; }

  /* ---- le frasi: solo quelle che esistono già nell'app, con i riferimenti di tools/review-sample.mjs ---- */
  var POOL = null;
  function pool() {
    if (POOL) return POOL;
    POOL = [];
    function add(ref, zh, it) { if (zh && it && zh.length >= 2 && zh.length <= 60 && it.length <= 120) POOL.push({ ref: ref, zh: zh, it: it }); }
    if (typeof PHRASES !== "undefined") PHRASES.forEach(function (g, gi) { g.items.forEach(function (p, ri) { add("phr:" + gi + ":" + ri, p[1], p[2]); }); });
    if (typeof DIALOGS !== "undefined") DIALOGS.forEach(function (d) { d.lines.forEach(function (l, li) { add("dlg:" + d.id + ":" + li, l[2], l[3]); }); });
    if (typeof EXAMPLES !== "undefined") Object.keys(EXAMPLES).slice(0, 1500).forEach(function (w) { var e = EXAMPLES[w]; if (e) add("ex:" + w, e[0], e[1]); });
    return POOL;
  }
  function textOf(p, lang) { return lang === "zh-CN" ? p.zh : p.it; }
  function recId(ref, lang, nat) { return ref + "|" + lang + "|" + (nat ? "n" : "x"); }
  /* le parole: il carattere e il suo significato breve (riferimento w:<parola>) */
  var WPOOL = null;
  function words() {
    if (WPOOL) return WPOOL;
    WPOOL = [];
    (CP.ORDER || []).forEach(function (k) {
      var w = CP.WORDS[k]; if (!w) return;
      var g = String(CP.gloss ? CP.gloss(w) : ""), hz = w.hz;
      if (hz && Array.from(hz).length <= 4 && g && g.length <= 24 && !/[;(\/]/.test(g)) WPOOL.push({ ref: "w:" + hz, zh: hz, it: g, word: true });
    });
    return WPOOL;
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var SERIES = 10, WORDS_PER = 3;
  /* una serie a caso di frasi (7) e parole (3) non ancora registrate né saltate, mescolate */
  function makeQueue(recs) {
    var lang = curLang(), nat = native(), have = {};
    recs.forEach(function (r) { have[r.id] = 1; });
    function free(p) { var id = recId(p.ref, lang, nat); return !have[id] && !S.skip[id]; }
    var sen = shuffle(pool().filter(free)).slice(0, SERIES - WORDS_PER), wd = shuffle(words().filter(free)).slice(0, WORDS_PER);
    if (sen.length < SERIES - WORDS_PER) wd = shuffle(words().filter(free)).slice(0, SERIES - sen.length);
    return shuffle(sen.concat(wd));
  }

  /* ---- la registrazione ---- */
  function pickMime() {
    if (!window.MediaRecorder) return "";
    var c = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    for (var i = 0; i < c.length; i++) { try { if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c[i])) return c[i]; } catch (e) {} }
    return "";
  }
  /* ogni avvio ha un proprio contratto (lease) e un numero di sessione (SES): se la persona torna indietro mentre il permesso è in attesa
     o se il registratore fallisce, il microfono si rilascia una sola volta e non parte a vuoto */
  var timer = 0;
  function release(l) { l = l || S.lease; if (l && l.on) { l.on = false; if (CP.micRelease) CP.micRelease(); } }
  function start() {
    if (S.busy || !CP.canRecord()) { S.err = T("sc.r.err"); return render(); }
    var ses = ++SES, lease = { on: true }; S.lease = lease;
    S.busy = true; S.err = ""; S.blob = null; S.ms = 0; render();
    var gs = CP.micStream();
    gs.then(function (stream) {
      if (ses !== SES || view !== "rec") { release(lease); return; }
      try {
        var chunks = [], mime = pickMime(), rec;
        try { rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 }); } catch (e) { rec = new MediaRecorder(stream); }
        S.mime = rec.mimeType || mime || "audio/webm";
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        var t0 = Date.now(), fired = false;
        function fin() {
          if (fired) return; fired = true; clearTimeout(timer); release(lease);
          if (ses !== SES) return;
          S.ms = Math.min(LIM, Date.now() - t0); S.busy = false; S.rec = null;
          S.blob = chunks.length ? new Blob(chunks, { type: S.mime }) : null;
          if (!S.blob) S.err = T("sc.r.err");
          render();
        }
        rec.onstop = function () { if (CP.micLog) CP.micLog("scambio-stop", (Date.now() - t0) + " ms, " + chunks.length + " pezzi"); fin(); };
        rec.onerror = function (ev) { if (CP.micLog) CP.micLog("scambio-errore-registratore", (ev && ev.error) || "errore"); fin(); };
        S.rec = { stop: function () { clearTimeout(timer); try { if (rec.state !== "inactive") rec.stop(); } catch (e) {} setTimeout(fin, 700); } };
        rec.start();
        timer = setTimeout(function () { if (S.rec) S.rec.stop(); }, LIM);
      } catch (e) { if (CP.micLog) CP.micLog("scambio-avvio-fallito", e); release(lease); S.busy = false; S.rec = null; S.err = T("sc.r.err"); render(); }
    }, function (e) { if (CP.micLog) CP.micLog("scambio-microfono-negato", e); lease.on = false; S.busy = false; S.err = T("sc.r.err"); render(); });
  }
  function ext(m) { return /ogg/.test(m) ? "ogg" : /mp4/.test(m) ? "m4a" : "webm"; }
  function keep() {
    var p = S.cur; if (!p || !S.blob) return Promise.resolve();
    var lang = curLang(), nat = native();
    var r = { id: recId(p.ref, lang, nat), ref: p.ref, lang: lang, native: nat, text: textOf(p, lang), ms: S.ms, mime: S.mime, blob: S.blob, created: Date.now(), sent: 0 };
    return put(r).then(function () { S.blob = null; S.cur = null; if (CP.toast) CP.toast(T("sc.r.saved")); });
  }

  /* ---- l'invio: un .zip con manifest.json e gli audio, che la persona manda come vuole ---- */
  function manifest(rs) {
    var c = consent() || {};
    return { schema: "mandarino-voice/1", license: "CC-BY-4.0", app: (CP.version || ""), created: Date.now(),
      speaker: c.show && c.nick ? c.nick : "", region: c.region || "", adult: true,
      items: rs.map(function (r, i) { return { ref: r.ref, lang: r.lang, native: r.native, text: r.text, ms: r.ms, created: r.created, file: names(rs)[i] }; }) };
  }
  /* i caratteri cinesi non entrano nel nome del file: la sigla del riferimento completo tiene distinti w:你 e w:好 */
  function sig(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
  function fname(r) { return r.ref.replace(/[^\w.-]+/g, "_") + "-" + sig(r.ref) + "." + r.lang + "." + (r.native ? "n" : "x") + "." + ext(r.mime); }
  /* nomi unici nello .zip e nel manifest: se due coincidessero comunque, si numera il secondo */
  function names(rs) { var seen = {}; return rs.map(function (r) { var n = fname(r), k = n, i = 1; while (seen[k]) k = n.replace(/(\.[^.]+)$/, "-" + (++i) + "$1"); seen[k] = 1; return k; }); }
  function buildZip(rs) {
    rs = rs.slice(0, MAXSEND); var nm = names(rs);
    return Promise.all(rs.map(function (r, i) { return r.blob.arrayBuffer().then(function (b) { return { name: nm[i], data: new Uint8Array(b) }; }); })).then(function (files) {
      files.unshift({ name: "manifest.json", data: JSON.stringify(manifest(rs), null, 1) });
      return { blob: CP._zip(files), n: rs.length, ids: rs.map(function (r) { return r.id; }) };
    });
  }
  function markSent(ids) { return all().then(function (rs) { return Promise.all(rs.filter(function (r) { return ids.indexOf(r.id) >= 0; }).map(function (r) { r.sent = Date.now(); return put(r); })); }).then(function (x) { REV++; return x; }); }
  /* il file si prepara in anticipo, appena si apre il foglio: così il tocco su «Invia» condivide subito (il telefono vuole che
     Condividi parta da un tocco). REV invalida uno .zip preparato su dati poi cambiati o cancellati */
  function prepare(rs) {
    var rev = REV; PRE = null;
    var todo = rs.filter(function (r) { return !r.sent; });
    if (!todo.length || !CP._zip) return;
    buildZip(todo).then(function (z) {
      if (rev !== REV) return;
      var name = "mandarino-voci-" + new Date().toISOString().slice(0, 10) + ".zip", file = null;
      try { file = new File([z.blob], name, { type: "application/zip" }); } catch (e) {}
      PRE = { z: z, name: name, file: file, rev: rev };
    });
  }
  function body(name) {
    var c = consent() || {};
    return T("sc.s.body", { f: name, n: c.show && c.nick ? c.nick : "" });
  }
  function toB64(blob) {
    return new Promise(function (ok, no) { var fr = new FileReader(); fr.onload = function () { var s = String(fr.result); ok(s.slice(s.indexOf(",") + 1)); }; fr.onerror = no; fr.readAsDataURL(blob); });
  }
  function download(z, name) {
    var u = URL.createObjectURL(z.blob), a = document.createElement("a");
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.parentNode.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  /* «mail»: con Condividi (dove c'è) il telefono apre la scelta dell'e-mail con il file già allegato; altrimenti scarica il file e apre
     la bozza dell'e-mail. «file»: solo il file. Si parte solo se le tre autorizzazioni sono firmate. */
  function send(how) {
    if (!consent()) { consentSheet(); return; }
    var onErr = function () { S.err = T("sc.e.send"); render(); };
    var go = function (pre) {
      if (!pre || pre.rev !== REV) return;
      var done = function () { PRE = null; return markSent(pre.z.ids).then(function () { S.sentFile = pre.name; render(); }, onErr); };
      var subject = T("sc.s.subject"), A = window.MandarinoAndroid;
      S.needAttach = false;
      /* APK: l'e-mail si apre con il file davvero allegato (il «mailto:» non può allegare nulla) */
      if (how === "mail" && A && typeof A.sendMail === "function") {
        return toB64(pre.z.blob).then(function (b64) {
          var sent = false; try { sent = A.sendMail(MAIL, subject, body(pre.name), pre.name, "application/zip", b64); } catch (e) {}
          if (sent) return done();
          return viaDownload();
        }, onErr);
      }
      function viaDownload() {
        download(pre.z, pre.name);
        if (how === "mail") {
          S.needAttach = true;   /* il mailto: non porta il file: l'avviso dice di allegarlo a mano */
          if (CP.toast) CP.toast(T("sc.s.attach", { f: pre.name }));
          location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body(pre.name));
        }
        return done();
      }
      if (how === "mail" && pre.file && navigator.canShare && navigator.canShare({ files: [pre.file] })) {
        return navigator.share({ files: [pre.file], title: subject, text: body(pre.name) }).then(done, function () {});
      }
      return viaDownload();
    };
    if (PRE && PRE.rev === REV) return go(PRE);
    all().then(function (rs) { prepare(rs); var t = setInterval(function () { if (PRE && PRE.rev === REV) { clearInterval(t); go(PRE); } }, 80); setTimeout(function () { clearInterval(t); }, 4000); }, onErr);
  }

  /* ---- i fogli ---- */
  function regions() { return T(ownLang() === "zh-CN" ? "sc.reg.zh" : "sc.reg.it").split("|"); }
  function consentSheet() {
    var c = consent() || {}, rg = regions(), h = '<div class="fam-head"><div class="meta"><b>' + esc(T("sc.title")) + '</b><div class="small muted">' + esc(T("sc.c.h")) + '</div></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" +
      '<ol class="sc-terms small">' + [1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return "<li>" + esc(T("sc.c." + i)) + "</li>"; }).join("") + "</ol>" +
      '<label class="sc-f small"><span>' + esc(T("sc.c.nick")) + '</span><input id="sc-nick" type="text" maxlength="30" autocomplete="off" value="' + CP.attr(c.nick || "") + '"></label>' +
      '<label class="sc-chk small"><input id="sc-show" type="checkbox"' + (c.show ? " checked" : "") + "> " + esc(T("sc.c.show")) + "</label>" +
      '<label class="sc-f small"><span>' + esc(T("sc.c.region")) + '</span><select id="sc-region"><option value="">' + esc(T("sc.c.none")) + "</option>" + rg.map(function (x, i) { return '<option value="' + (i + 1) + '"' + (String(c.region) === String(i + 1) ? " selected" : "") + ">" + esc(x) + "</option>"; }).join("") + "</select></label>" +
      '<label class="sc-chk"><input id="sc-ok" type="checkbox" data-sc-chk> ' + esc(T("sc.c.ok1")) + "</label>" +
      '<label class="sc-chk"><input id="sc-age" type="checkbox" data-sc-chk> ' + esc(T("sc.c.ok2")) + "</label>" +
      '<label class="sc-chk"><input id="sc-pub" type="checkbox" data-sc-chk> ' + esc(T("sc.c.ok3")) + "</label>" +
      '<div class="acts"><button type="button" class="btn-main" id="sc-go" data-sc-go disabled>' + esc(T("sc.c.go")) + "</button></div>" +
      '<p class="small muted">' + esc(T("sc.priv")) + "</p>";
    CP.openSheet(h);
  }
  function mainSheet(recs) {
    var c = consent() || {}, sent = recs.filter(function (r) { return r.sent; }).length, todo = recs.length - sent, h;
    prepare(recs);
    h = '<div class="fam-head"><div class="meta"><b>' + esc(T("sc.title")) + '</b><div class="small muted">' + esc(T("sc.have", { n: recs.length, s: sent })) + '</div></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>";
    if (S.err) h += '<p class="small" role="alert">' + esc(S.err) + "</p>";
    h += '<div class="acts"><button type="button" class="btn-main" data-sc-rec="own">🎙️ ' + esc(T("sc.m.rec")) + "</button>" + (c.other ? '<button type="button" class="btn-s" data-sc-rec="other">🎙️ ' + esc(T("sc.m.recOther")) + "</button>" : "") + "</div>";
    h += '<label class="sc-chk small"><input id="sc-other" type="checkbox" data-sc-other' + (c.other ? " checked" : "") + "> " + esc(T("sc.m.other")) + '</label><p class="small muted" style="margin:0 0 8px">' + esc(T("sc.m.otherNote")) + "</p>";
    if (todo) {
      h += '<p class="small muted">' + esc(T("sc.s.help")) + '</p><div class="acts"><button type="button" class="btn-main" data-sc-send="mail">📧 ' + esc(T("sc.s.mail")) + " (" + todo + ')</button>' +
        '<button type="button" class="btn-s" data-sc-send="file">⬇️ ' + esc(T("sc.s.file")) + "</button></div>";
    }
    if (S.sentFile) h += '<p class="small okline" role="status">' + esc(T("sc.s.done", { f: S.sentFile })) + ' <a href="mailto:' + MAIL + "?subject=" + encodeURIComponent(T("sc.s.subject")) + '">' + esc(MAIL) + "</a></p>" + (S.needAttach ? '<p class="small" role="alert">⚠️ ' + esc(T("sc.s.attach", { f: S.sentFile })) + "</p>" : "");
    h += '<p class="small"><a href="' + SITE + '" target="_blank" rel="noopener">' + esc(T("sc.c.site")) + "</a> · " + esc(T("sc.c.siteNote")) + "</p>";
    if (recs.length) {
      h += '<h4 class="set-h">' + esc(T("sc.m.list")) + '</h4><ul class="sc-list">' + recs.map(function (r) {
        return '<li><span class="sc-t" lang="' + r.lang + '">' + esc(r.text) + '</span><span class="muted small">' + (r.native ? "" : esc(T("sc.m.nn")) + " · ") + (r.sent ? esc(T("sc.m.sent")) : "") + "</span>" +
          '<button type="button" class="btn-s" data-sc-play="' + CP.attr(r.id) + '" aria-label="' + CP.attr(T("sc.m.play")) + '">▶</button>' +
          '<button type="button" class="btn-s" data-sc-del="' + CP.attr(r.id) + '" aria-label="' + CP.attr(T("sc.m.del")) + '">×</button></li>';
      }).join("") + "</ul>";
    }
    h += '<div class="acts"><button type="button" class="btn-s" data-sc-revoke>' + esc(T("sc.m.revoke")) + "</button></div>";
    CP.openSheet(h);
  }
  function recSheet(recs) {
    if (!S.queue) { S.queue = makeQueue(recs); S.qi = 0; }
    var p = S.cur = S.queue[S.qi] || null, lang = curLang();
    var h = '<div class="fam-head"><div class="meta"><b>🎙️ ' + esc(T("sc.m.rec")) + '</b>' + (native() ? "" : '<div class="small muted">' + esc(T("sc.m.nn")) + "</div>") + '</div><button type="button" class="fam-x btn-s" data-sc-back>' + esc(T("sc.r.back")) + "</button></div>";
    if (!p) { CP.openSheet(h + '<p>' + esc(T(S.queue.length ? "sc.r.done" : "sc.r.none")) + '</p><div class="acts">' + (S.queue.length ? '<button type="button" class="btn-main" data-sc-more>' + esc(T("sc.r.more")) + "</button>" : "") + '<button type="button" class="btn-s" data-sc-back>' + esc(T("sc.r.back")) + "</button></div>"); return; }
    h += '<p class="small muted" style="margin:0">' + esc(T("sc.r.prompt")) + " · " + (S.qi + 1) + " / " + S.queue.length + (p.word ? " · " + esc(T("sc.r.word")) : "") + '</p><p class="sc-big" lang="' + lang + '">' + esc(textOf(p, lang)) + '</p><p class="small muted" lang="' + (lang === "zh-CN" ? "it-IT" : "zh-CN") + '">' + esc(textOf(p, lang === "zh-CN" ? "it-IT" : "zh-CN")) + "</p>";
    if (S.err) h += '<p class="small" role="alert">' + esc(S.err) + "</p>";
    if (S.busy) h += '<div class="acts"><button type="button" class="btn-main" data-sc-stop>⏹ ' + esc(T("sc.r.stop")) + '</button></div><p class="small muted" role="status">' + esc(T("sc.r.limit")) + "</p>";
    else if (S.blob) h += '<div class="acts"><button type="button" class="btn-s" data-sc-prev>▶ ' + esc(T("sc.m.play")) + '</button><button type="button" class="btn-main" data-sc-keep>' + esc(T("sc.r.keep")) + '</button><button type="button" class="btn-s" data-sc-redo>' + esc(T("sc.r.redo")) + "</button></div>";
    else h += '<div class="acts"><button type="button" class="btn-main" data-sc-start>🎙️ ' + esc(T("sc.r.start")) + '</button><button type="button" class="btn-s" data-sc-skip>' + esc(T("sc.r.skip")) + "</button></div>";
    CP.openSheet(h);
  }
  /* le tre autorizzazioni, tutte spuntate: ho capito, ho 18 anni, autorizzo la pubblicazione CC BY 4.0 */
  function allSigned() { return ["sc-ok", "sc-age", "sc-pub"].every(function (i) { var e = document.getElementById(i); return e && e.checked; }); }
  var view = "main";
  function render() {
    stopAudio();
    all().then(function (recs) { if (view === "rec") recSheet(recs); else mainSheet(recs); }, function (e) {
      var nodb = e && e.code === "unavailable", msg = nodb ? T("sc.e.nodb") : T("sc.e.mem");
      CP.openSheet('<div class="fam-head"><div class="meta"><b>' + esc(T("sc.title")) + '</b></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + '</button></div><p class="small" role="alert">' + esc(msg) + "</p>" + (nodb ? "" : '<div class="acts"><button type="button" class="btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>"));
    });
  }
  function open() { if (!consent()) { consentSheet(); return; } view = "main"; S.useOther = false; S.err = ""; render(); }

  /* ---- tocchi ---- */
  /* un solo audio alla volta e un solo URL vivo: si libera prima di sostituire, a fine o errore, a ogni nuovo foglio e alla revoca */
  var audio = null, aurl = "";
  function stopAudio() {
    var a = audio, u = aurl; audio = null; aurl = "";
    if (a) { try { a.onended = a.onerror = null; a.pause(); } catch (e) {} }
    if (u) { try { URL.revokeObjectURL(u); } catch (e) {} }
  }
  function playBlob(b) { try { stopAudio(); aurl = URL.createObjectURL(b); audio = new Audio(aurl); audio.onended = audio.onerror = stopAudio; var p = audio.play(); if (p && p.catch) p.catch(stopAudio); } catch (e) { stopAudio(); } }
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.id === "sc-ok" || t.id === "sc-age" || t.id === "sc-pub") { var go = document.getElementById("sc-go"); if (go) go.disabled = !allSigned(); }
    if (t.hasAttribute && t.hasAttribute("data-sc-other")) opt("other", t.checked);
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-sc-go],[data-sc-rec],[data-sc-back],[data-sc-start],[data-sc-stop],[data-sc-prev],[data-sc-keep],[data-sc-redo],[data-sc-skip],[data-sc-play],[data-sc-del],[data-sc-send],[data-sc-revoke],[data-sc-more]") : null; if (!b) return;
    if (b.hasAttribute("data-sc-go")) {
      if (!allSigned()) return;
      setConsent({ v: 2, t: Date.now(), ok: true, age: true, pub: true, nick: document.getElementById("sc-nick").value.trim(), show: document.getElementById("sc-show").checked, region: document.getElementById("sc-region").value, other: false, lang: ownLang() });
      CP.sfx("tap"); open();
    } else if (b.hasAttribute("data-sc-rec")) { view = "rec"; S.useOther = b.getAttribute("data-sc-rec") === "other"; S.queue = null; S.cur = null; S.blob = null; S.err = ""; render(); }
    else if (b.hasAttribute("data-sc-back")) { SES++; clearTimeout(timer); if (S.rec) S.rec.stop(); release(); view = "main"; S.queue = null; S.cur = null; S.blob = null; S.busy = false; S.err = ""; render(); }
    else if (b.hasAttribute("data-sc-start")) start();
    else if (b.hasAttribute("data-sc-stop")) { if (S.rec) S.rec.stop(); }
    else if (b.hasAttribute("data-sc-prev")) { if (S.blob) playBlob(S.blob); }
    else if (b.hasAttribute("data-sc-keep")) { keep().then(function () { S.qi++; render(); }, function () { S.err = T("sc.e.save"); render(); }); }
    else if (b.hasAttribute("data-sc-more")) { S.queue = null; S.skip = {}; render(); }
    else if (b.hasAttribute("data-sc-redo")) { S.blob = null; S.err = ""; render(); }
    else if (b.hasAttribute("data-sc-skip")) { if (S.cur) S.skip[recId(S.cur.ref, curLang(), native())] = 1; S.qi++; S.cur = null; S.blob = null; render(); }
    else if (b.hasAttribute("data-sc-play")) { var id = b.getAttribute("data-sc-play"); all().then(function (rs) { var r = rs.filter(function (x) { return x.id === id; })[0]; if (r) playBlob(r.blob); }, function () {}); }
    else if (b.hasAttribute("data-sc-del")) { S.err = ""; del(b.getAttribute("data-sc-del")).then(function () { CP.sfx("tap"); render(); }, function () { S.err = T("sc.e.del"); render(); }); }
    else if (b.hasAttribute("data-sc-send")) send(b.getAttribute("data-sc-send"));
    else if (b.hasAttribute("data-sc-revoke")) { PRE = null; REV++; stopAudio(); clear().then(function () { setConsent(null); S.sentFile = null; CP.closeSheet(); if (CP.toast) CP.toast(T("sc.m.revoked")); }, function () { S.err = T("sc.e.clear"); render(); }); }
  });
  CP.scambio = { makeQueue: makeQueue, words: words, send: send, open: open, consent: consent, all: all, put: put, del: del, clear: clear, pool: pool, ownLang: ownLang, manifest: manifest, buildZip: buildZip, SITE: SITE };
})();
