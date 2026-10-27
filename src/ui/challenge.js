/* ===== màndarínō · sfida a un amico, senza server (Task 9.1).
   Dieci parole e un seme diventano un codice (MDC1-…, base64url di «1|corso|seme|chiavi»): chi lo apre fa la stessa sfida,
   con le stesse domande nello stesso ordine e le stesse risposte tra cui scegliere, perché tutto viene dal seme e dalle
   dieci parole (le risposte sbagliate sono le altre parole della sfida: niente dipende dalla versione del vocabolario).
   Il codice viaggia come link (…#sfida=MDC1-…: il frammento non arriva a nessun server), come testo da incollare o come QR
   (pwa/qr.js) da inquadrare nell'app. Dentro ci sono solo le parole e il seme: nessun nome, nessun punteggio, nessun
   identificativo. La sfida non tocca i ripassi né i punti: è un gioco tra amici.
   Corso di cinese: carattere e pinyin → significato in italiano. Corso di italiano: parola italiana → caratteri.
   Modulo caricato al primo uso di CP.challenge (tools/build.mjs, LAZYMOD); l'avvio passa da ui/together.js. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, C = window.MD_CONFIG || {};
  var N = 10, PREFIX = "MDC1-", HASH = "#sfida=", NEXT_MS = 900;
  var IT = CP.course && CP.course() === "it";

  /* ---- codice ---- */
  function b64u(s) { var b = new TextEncoder().encode(s), bin = ""; for (var i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]); return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64u(s) { var bin = atob(s.replace(/-/g, "+").replace(/_/g, "/")), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); }
  function encode(c) { return PREFIX + b64u(["1", c.c === "it" ? "i" : "z", (c.seed >>> 0).toString(36), c.keys.join(",")].join("|")); }
  /* da un testo qualsiasi (link, messaggio incollato, QR) il primo codice valido, oppure null */
  function decode(text) {
    var m = /MDC1-([A-Za-z0-9_-]{8,})/.exec(String(text || "")); if (!m) return null;
    try {
      var p = unb64u(m[1]).split("|"); if (p[0] !== "1" || p.length !== 4) return null;
      var keys = p[3].split(",").filter(Boolean).slice(0, 20);
      return keys.length >= 4 ? { c: p[1] === "i" ? "it" : "zh", seed: parseInt(p[2], 36) >>> 0, keys: keys, code: PREFIX + m[1] } : null;
    } catch (e) { return null; }
  }
  function base() {
    var app = !!window.MandarinoAndroid || location.hostname === "appassets.androidplatform.net";
    if (!app && /^https?:$/.test(location.protocol)) return location.origin + location.pathname;
    return C.SITE_URL ? C.SITE_URL.replace(/\/?$/, "/").replace(/app\/$/, "") + "app/" : "";
  }
  function link(code) { var b = base(); return b ? b + HASH + code : ""; }

  /* ---- parole: chiave → { k, q (domanda), py, a (risposta) } ---- */
  var LEXI = null;
  function itLex() { if (!LEXI) { LEXI = {}; (CP.itLexicon ? CP.itLexicon() : []).forEach(function (e) { LEXI[e.id.slice(3)] = e; }); } return LEXI; }
  function item(c, k) {
    if (c === "it") { var e = itLex()[k]; return e ? { k: k, q: e.it, a: e.zh, py: e.py, say: e.say } : null; }
    var w = CP.WORDS[k]; return w ? { k: k, q: w.hz, py: w.py, a: CP.gloss(w) } : null;
  }
  /* parole per una sfida nuova: tra quelle già studiate, a caso; se sono poche, le prime del corso */
  function pick() {
    var pool = [], fill = [];
    if (IT) {
      var S = {}; try { S = JSON.parse(localStorage.getItem("cp-it-srs-v1") || "{}") || {}; } catch (e) {}
      pool = Object.keys(S).filter(function (id) { return /^it:/.test(id); }).map(function (id) { return id.slice(3); });
      fill = Object.keys(itLex()).slice(0, 80);
    } else {
      pool = CP.ORDER.filter(function (k) { return CP.state(k) >= 1; });
      fill = CP.ORDER.slice(0, 80);
    }
    var out = [], seenA = {}, add = function (k) { var x = item(IT ? "it" : "zh", k); if (!x || seenA[x.a] || out.indexOf(k) >= 0) return; seenA[x.a] = 1; out.push(k); };
    shuffle(pool, Math.random).forEach(function (k) { if (out.length < N) add(k); });
    shuffle(fill, Math.random).forEach(function (k) { if (out.length < N) add(k); });
    return { c: IT ? "it" : "zh", seed: (Math.random() * 4294967296) >>> 0, keys: out };
  }

  /* ---- generatore con seme (mulberry32): le stesse domande su ogni telefono ---- */
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  /* le domande: ordine e risposte da scegliere vengono solo dal seme e dalle parole */
  function build(ch) {
    var items = ch.keys.map(function (k) { return item(ch.c, k); }).filter(Boolean), r = rng(ch.seed);
    if (items.length < 4) return null;
    return shuffle(items, r).map(function (x) {
      var others = shuffle(items.filter(function (y) { return y.a !== x.a; }), r).slice(0, 3).map(function (y) { return y.a; });
      return { x: x, opts: shuffle(others.concat([x.a]), r) };
    });
  }

  /* ---- foglio ---- */
  var G = null;
  function head(title) { return '<div class="fam-head"><div class="meta"><b>🎯 ' + esc(title) + '</b></div><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>"; }
  function qText(x, big) {
    if (G && G.c === "it") return '<div class="chal-q' + (big ? "" : " sm") + '" lang="it">' + esc(x.q) + "</div>";
    return '<div class="chal-q' + (big ? "" : " sm") + '" lang="zh-CN">' + CP.hanziHTML(x.q, x.py) + '</div><div class="chal-py">' + CP.pinyinHTML(x.py) + "</div>";
  }
  function aLang() { return G && G.c === "it" ? "zh-CN" : "it"; }
  function intro(ch, mine) {
    var Q = build(ch);
    if (!Q) { CP.openSheet(head(T("chal.title")) + '<p role="alert">' + esc(T("chal.old")) + "</p>"); return; }
    G = { ch: ch, c: ch.c, Q: Q, i: 0, ok: 0, wrong: [], t0: 0, lock: false };
    if (mine) { ready(ch); return; }
    CP.openSheet(head(T("chal.title")) + '<p class="chal-lead">' + esc(T("chal.received", { n: Q.length })) + '</p><p class="small muted">' + esc(T("chal.privacy")) + "</p>" +
      '<div class="acts"><button type="button" class="btn-main" data-chal-start style="margin:0">' + esc(T("chal.start")) + "</button></div>");
  }
  function ready(ch) {
    var code = ch.code || encode(ch), url = link(code);
    CP.openSheet(head(T("chal.ready")) + '<p class="small">' + esc(T("chal.howTo")) + "</p>" +
      '<canvas class="chal-qr" role="img" aria-label="' + CP.attr(T("chal.code")) + '"></canvas>' +
      '<label class="small" style="display:grid;gap:4px">' + esc(T("chal.code")) + '<input type="text" class="chal-code" readonly value="' + CP.attr(url || code) + '" data-noi18n></label>' +
      '<p class="small muted">' + esc(T("chal.privacy")) + "</p>" +
      '<div class="acts"><button type="button" class="btn-main" data-chal-send style="margin:0">' + esc(T("chal.share")) + '</button><button type="button" class="btn-s" data-chal-copy>' + esc(T("chal.copy")) + '</button><button type="button" class="btn-s" data-chal-start>' + esc(T("chal.try")) + "</button></div>");
    var cv = document.querySelector(".chal-qr"); if (cv && CP.qr) try { CP.qr.draw(cv, CP.qr.encode(url || code, "M")); } catch (e) {}
  }
  function question() {
    var q = G.Q[G.i];
    CP.openSheet(head(T("chal.title")) + '<div class="chal-n small muted" aria-live="polite">' + esc(T("chal.n", { i: G.i + 1, n: G.Q.length })) + '</div><div class="chal-bar" aria-hidden="true"><i style="width:' + Math.round(G.i / G.Q.length * 100) + '%"></i></div>' +
      '<p class="small muted" style="margin:0">' + esc(T("chal.q")) + "</p>" + qText(q.x, true) +
      (G.c === "zh" && CP.sayBtn ? '<div class="chal-say">' + CP.sayBtn(q.x.q) + "</div>" : "") +
      '<div class="chal-opts" role="group" aria-label="' + CP.attr(T("chal.q")) + '">' + q.opts.map(function (a, i) { return '<button type="button" class="chal-opt" data-chal-a="' + i + '" lang="' + aLang() + '">' + esc(a) + "</button>"; }).join("") + "</div>" +
      '<div class="chal-fb small" aria-live="assertive"></div>');
    G.lock = false;
  }
  function answer(i) {
    if (!G || G.lock) return; G.lock = true;
    var q = G.Q[G.i], right = q.opts[i] === q.x.a, btns = document.querySelectorAll("[data-chal-a]"), fb = document.querySelector(".chal-fb");
    Array.prototype.forEach.call(btns, function (b, j) {
      b.disabled = true;
      if (q.opts[j] === q.x.a) { b.classList.add("ok"); b.insertAdjacentHTML("afterbegin", '<span aria-hidden="true">✓ </span>'); }
      else if (j === i) { b.classList.add("ko"); b.insertAdjacentHTML("afterbegin", '<span aria-hidden="true">✗ </span>'); }
    });
    if (right) G.ok++; else G.wrong.push(q.x);
    if (fb) fb.textContent = right ? T("chal.right") : T("chal.wrong", { a: q.x.a });
    CP.sfx(right ? "ok" : "ko"); if (CP.haptic) CP.haptic(right ? 12 : [20, 40, 20]);
    setTimeout(function () { G.i++; if (G.i < G.Q.length) question(); else result(); }, right ? NEXT_MS : NEXT_MS * 2);
  }
  function result() {
    var s = Math.max(1, Math.round((Date.now() - G.t0) / 1000));
    G.score = G.ok;
    CP.openSheet(head(T("chal.title")) + '<div class="chal-res"><b>' + esc(T("chal.result", { ok: G.ok, n: G.Q.length, s: s })) + "</b>" + (G.ok === G.Q.length ? "<div>" + esc(T("chal.perfect")) + "</div>" : "") + "</div>" +
      (G.wrong.length ? '<h3 class="itd-h3">' + esc(T("chal.review")) + '</h3><ul class="chal-wrong">' + G.wrong.map(function (x) { return "<li>" + qText(x, false) + ' <span lang="' + aLang() + '">' + esc(x.a) + "</span></li>"; }).join("") + "</ul>" : "") +
      '<div class="acts"><button type="button" class="btn-main" data-chal-send style="margin:0">' + esc(T("chal.again")) + '</button><button type="button" class="btn-s" data-chal-new>' + esc(T("chal.new")) + "</button></div>");
    if (CP.sfx) CP.sfx(G.ok === G.Q.length ? "level" : "tap");
  }
  function send() {
    if (!G) return;
    var code = G.ch.code || encode(G.ch), url = link(code), parts = [T("chal.msg", { n: G.Q.length })];
    if (G.score != null) parts.push(T("chal.msgScore", { ok: G.score, n: G.Q.length }));
    parts.push(url || code);
    var text = parts.join("\n");
    if (navigator.share) navigator.share({ title: "màndarínō", text: text }).catch(function () {});
    else copy(url || code);
  }
  function copy(s) {
    var done = function () { CP.toast(T("chal.copied")); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, function () { fallback(); });
    else fallback();
    function fallback() { var i = document.querySelector(".chal-code"); if (i) { i.select(); try { document.execCommand("copy"); done(); } catch (e) {} } }
  }

  /* apre un codice ricevuto: dello stesso corso → la sfida; dell'altro → l'invito a cambiare corso (il codice resta nel link) */
  function openCode(text) {
    var ch = decode(text);
    if (!ch) { CP.toast(T("chal.bad")); return false; }
    var cur = IT ? "it" : "zh";
    if (ch.c !== cur) {
      CP.openSheet(head(T("chal.title")) + "<p>" + esc(T(ch.c === "it" ? "chal.otherIt" : "chal.otherZh")) + '</p><div class="acts"><button type="button" class="btn-s" data-chal-switch="' + ch.c + '" data-code="' + CP.attr(ch.code) + '">' + esc(T("chal.switch")) + "</button></div>");
      return true;
    }
    intro(ch, false); return true;
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-chal-start], [data-chal-a], [data-chal-send], [data-chal-copy], [data-chal-new], [data-chal-switch]") : null; if (!b) return;
    if (b.hasAttribute("data-chal-a")) answer(+b.getAttribute("data-chal-a"));
    else if (b.hasAttribute("data-chal-start") && G) { G.i = 0; G.ok = 0; G.wrong = []; G.score = null; G.t0 = Date.now(); CP.sfx("tap"); question(); }
    else if (b.hasAttribute("data-chal-send")) send();
    else if (b.hasAttribute("data-chal-copy")) { var i = document.querySelector(".chal-code"); copy(i ? i.value : ""); }
    else if (b.hasAttribute("data-chal-new")) CP.challenge.create();
    else if (b.hasAttribute("data-chal-switch")) { try { history.replaceState(null, "", location.pathname + location.search + HASH + b.getAttribute("data-code")); } catch (x) {} CP.setCourse(b.getAttribute("data-chal-switch")); }
  });

  CP.challenge = {
    N: N, HASH: HASH,
    create: function () { var ch = pick(); intro(ch, true); },
    open: openCode, encode: encode, decode: decode, build: build, link: link, base: base,
    state: function () { return G ? { i: G.i, ok: G.ok, n: G.Q.length } : null; }
  };
})();
