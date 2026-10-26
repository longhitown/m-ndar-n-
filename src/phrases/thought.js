/* ===== V6: Ordine del Pensiero (30 esempi in 6 categorie, animazione dei blocchi, modalità Puzzle) ===== */
(function () {
  var CP = window.CP, esc = CP.esc, U = CP.u;
  var TAGN = { chi: "Chi", when: "Quando", with: "Con chi", where: "Dove", do: "Fai", what: "Cosa", mod: "Com'è / di chi", qty: "Quanti", ba: "Oggetto (把)", ask: "Richiesta", how: "Come / con cosa", dur: "Quanto dura / volte", cause: "Causa", cond: "Se…", res: "Risultato" };
  var idx = 0, mode = "zh", tcat = "", tview = "study";   /* mode: ordine mostrato; tview: studia / puzzle */
  try { tcat = localStorage.getItem("cp-tcat") || ""; tview = localStorage.getItem("cp-tview") || "study"; } catch (e) {}
  if (tcat && !THINK_CATS.some(function (c) { return c[0] === tcat; })) tcat = "";
  if (tview !== "puzzle") tview = "study";
  var pz = null, pzScore = { ok: 0, tot: 0 };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function list() { var r = []; THINK.forEach(function (e, i) { if (!tcat || e.cat === tcat) r.push(i); }); return r; }
  function fixIdx() { var l = list(); if (l.indexOf(idx) < 0) idx = l[0]; }
  function ex() { return THINK[idx]; }
  function seq(m) { var e = ex(); return m === "it" ? e.order : e.blocks.map(function (_, i) { return i; }); }
  function blockHTML(i, tag, extra) {
    var b = ex().blocks[i];
    var inner = (tag === false ? "" : '<span class="tg ' + b[0] + '">' + (TAGN[b[0]] || b[0]) + "</span>") + '<span class="bp">' + CP.pinyinHTML(b[1]) + '</span><span class="bh" lang="zh-CN">' + CP.hanziHTML(b[2], b[1]) + '</span><span class="bi">' + esc(b[3]) + "</span>";
    return '<div class="tb ' + b[0] + '" data-b="' + i + '">' + inner + "</div>";
  }
  function zhLine(e) { return { py: e.blocks.map(function (b) { return b[1]; }).join(" "), hz: e.blocks.map(function (b) { return b[2]; }).join("") }; }
  function pills() {
    var all = '<button type="button" data-tcat=""' + (!tcat ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">Tutti · " + THINK.length + "</button>";
    return '<div class="cpills" role="group" aria-label="Categorie di Pensiero">' + all + THINK_CATS.map(function (c) {
      var n = THINK.filter(function (x) { return x.cat === c[0]; }).length;
      return '<button type="button" data-tcat="' + c[0] + '"' + (tcat === c[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '><span aria-hidden="true">' + c[1] + "</span> " + esc(c[2]) + " · " + n + "</button>";
    }).join("") + "</div>";
  }
  function viewSwitch() {
    return '<div class="seg inner" role="group" aria-label="Modalità"><button type="button" data-tview="study"' + (tview === "study" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>👁 Studia</button><button type="button" data-tview="puzzle"' + (tview === "puzzle" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🧩 Puzzle</button></div>";
  }
  function dots() {
    var l = list();
    return '<div class="mpick" role="group" aria-label="Esempi">' + l.map(function (g, i) { return '<button type="button" data-tk="' + g + '"' + (g === idx ? ' class="on"' : "") + ' aria-label="Esempio ' + (i + 1) + '">' + (i + 1) + "</button>"; }).join("") + "</div>";
  }
  function legend(e) {
    var seen = []; e.blocks.forEach(function (b) { if (seen.indexOf(b[0]) < 0) seen.push(b[0]); });
    return '<div class="tlegend">' + seen.map(function (k) { return '<span class="tg ' + k + '">' + (TAGN[k] || k) + "</span>"; }).join("") + "</div>";
  }
  function renderStudy() {
    var e = ex(), z = zhLine(e);
    return '<p class="intro" style="margin-top:12px">In italiano la frase parte da chi agisce e si chiude con i dettagli. In cinese si va per cornici: prima chi e quando, poi dove, per ultima l\'azione.</p>' + legend(e) + dots() +
      '<div class="sitbox"><span class="small muted" style="font-weight:700">PENSI COSÌ, IN ITALIANO</span><span class="stx">' + esc(e.it) + "</span></div>" +
      '<div class="tdir"><span class="badge' + (mode === "it" ? " on" : "") + '" id="td-it">🇮🇹 ordine italiano</span><span aria-hidden="true">⇄</span><span class="badge' + (mode === "zh" ? " on" : "") + '" id="td-zh">🇨🇳 ordine cinese</span></div>' +
      '<div class="tbox" id="tbox" aria-live="polite">' + seq(mode).map(function (i) { return blockHTML(i); }).join("") + "</div>" +
      '<div class="dlg-bar"><button type="button" class="btn-main" id="tk-flip" style="margin:0">🔄 Inverti Pensiero (IT ⇄ ZH)</button></div>' +
      '<div class="sbox"><div class="lp">' + CP.pinyinHTML(z.py) + "</div>" + CP.toneCurveHTML(z.py) + '<div class="lh" lang="zh-CN">' + CP.hanziHTML(z.hz, z.py) + '</div><div class="li">' + esc(e.zh) + '</div><div class="acts">' + CP.audioBtns(z.hz) + "</div></div>" +
      (e.note ? '<p class="tnote"><b>Nota.</b> ' + esc(e.note) + "</p>" : "") +
      (e.q ? '<p class="tnote">Le domande non spostano nulla: la parola interrogativa va dove andrebbe la risposta.</p>' : "") + nextBar();
  }
  function nextBar() {
    var l = list(), p = l.indexOf(idx);
    return '<div class="acts tk-nav"><button type="button" data-tnav="-1"' + (p <= 0 ? " disabled" : "") + '>‹ Prima</button><button type="button" data-tnav="1"' + (p >= l.length - 1 ? " disabled" : "") + '>Dopo ›</button></div>';
  }
  /* ---- puzzle ---- */
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pzStart() {
    var e = ex(), n = e.blocks.length, ids = e.blocks.map(function (_, i) { return i; }), pool = shuffle(ids), k = 0;
    while (n > 1 && pool.join() === ids.join() && k++ < 20) pool = shuffle(ids);
    pz = { idx: idx, pool: pool, ans: [], state: "play", miss: 0, hint: false, bad: [] };
  }
  function okOrders(e) {
    var base = e.blocks.map(function (_, i) { return i; }), res = [base.join()];
    if (e.blocks.length > 2 && e.blocks[0][0] === "chi" && e.blocks[1][0] === "when") { var a = base.slice(); a[0] = 1; a[1] = 0; res.push(a.join()); }
    for (var i = 0; i < e.blocks.length - 1; i++) {
      var t1 = e.blocks[i][0], t2 = e.blocks[i + 1][0];
      if ((t1 === "with" && t2 === "where") || (t1 === "where" && t2 === "with")) { var b = base.slice(); b[i] = i + 1; b[i + 1] = i; res.push(b.join()); }
    }
    return res;
  }
  function renderPuzzle() {
    if (!pz || pz.idx !== idx) pzStart();
    var e = ex(), n = e.blocks.length, z = zhLine(e);
    var ans = pz.ans.map(function (b, pos) {
      var cls = pz.state === "ko" && pz.bad.indexOf(pos) >= 0 ? " wrong" : (pz.state === "ok" ? " right" : "");
      return '<button type="button" class="tb pzb' + cls + '" data-pzun="' + pos + '"' + (pz.state === "ok" ? " disabled" : "") + ' aria-label="Togli ' + CP.attr(e.blocks[b][2]) + '">' + inner(b, pz.hint || pz.state !== "play") + "</button>";
    }).join("");
    var slots = ""; for (var k = pz.ans.length; k < n; k++) slots += '<span class="pz-slot" aria-hidden="true">' + (k + 1) + "</span>";
    var pool = pz.pool.filter(function (b) { return pz.ans.indexOf(b) < 0; }).map(function (b) {
      return '<button type="button" class="tb pzb" data-pzpick="' + b + '">' + inner(b, false) + "</button>";
    }).join("");
    var msg = "";
    if (pz.state === "ok") msg = '<div class="done-card" id="pz-done"><b>' + (pz.miss ? "Giusto, al tentativo " + (pz.miss + 1) + "." : "Giusto al primo colpo.") + "</b><span>" + esc(e.zh) + '</span><div class="lp">' + CP.pinyinHTML(z.py) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(z.hz, z.py) + '</div><div class="acts">' + CP.audioBtns(z.hz) + "</div>" + (e.note ? '<p class="tnote" style="margin:8px 0 0"><b>Nota.</b> ' + esc(e.note) + "</p>" : "") + '<div class="acts" style="margin:8px 0 0"><button type="button" class="btn-main" data-pznext style="margin:0">Prossimo ›</button></div></div>';
    else if (pz.state === "ko") {
      var w = pz.bad[0], want = e.blocks[w][0];
      msg = '<div class="warn" role="alert">Non ancora. Al posto n° ' + (w + 1) + ' il blocco non va bene: lì dovrebbe esserci «' + esc(TAGN[want] || want) + '». Tocca un blocco per toglierlo, oppure usa «Aiuto».</div>';
    }
    return '<p class="intro" style="margin-top:12px">Ti do la frase in italiano. Tocca i blocchi nell\'<b>ordine cinese</b>: quando e dove prima, l\'azione dopo.</p>' + dots() +
      '<div class="sitbox"><span class="small muted" style="font-weight:700">COSTRUISCI IN CINESE</span><span class="stx">' + esc(e.it) + "</span></div>" +
      '<div class="tbox pz-ans" id="pz-ans" aria-live="polite" aria-label="La tua frase">' + ans + slots + "</div>" +
      (pz.state === "ok" ? "" : '<div class="tbox pz-pool" id="pz-pool" aria-label="Blocchi da mettere in ordine">' + pool + "</div>") + msg +
      (pz.state === "ok" ? "" : '<div class="acts"><button type="button" data-pzundo' + (pz.ans.length ? "" : " disabled") + '>↩ Annulla</button><button type="button" data-pzhint' + (pz.hint ? " disabled" : "") + '>💡 Aiuto</button><button type="button" data-pzreset>🔀 Rimescola</button></div>') +
      '<p class="small muted" style="margin-top:10px">Puzzle risolti: <b>' + pzScore.ok + "</b> su " + pzScore.tot + " provati in questa sessione.</p>";
    function inner(b, withTag) {
      var bl = e.blocks[b];
      return (withTag ? '<span class="tg ' + bl[0] + '">' + (TAGN[bl[0]] || bl[0]) + "</span>" : "") + '<span class="bp">' + CP.pinyinHTML(bl[1]) + '</span><span class="bh" lang="zh-CN">' + CP.hanziHTML(bl[2], bl[1]) + '</span><span class="bi">' + esc(bl[3]) + "</span>";
    }
  }
  function pzCheck() {
    var e = ex(), n = e.blocks.length;
    if (pz.ans.length < n) return;
    pzScore.tot += pz.miss ? 0 : 1;
    if (okOrders(e).indexOf(pz.ans.join()) >= 0) {
      pz.state = "ok"; if (!pz.miss) pzScore.ok++;
      CP.sfx("ok"); if (CP.game && CP.game.xp) CP.game.xp(pz.miss ? 1 : 3);
    } else {
      pz.miss++; pz.state = "ko"; pz.bad = [];
      var good = e.blocks.map(function (_, i) { return i; });
      pz.ans.forEach(function (b, pos) { if (b !== good[pos]) pz.bad.push(pos); });
      if (!pz.bad.length) pz.bad = [0];
      CP.sfx("ko");
    }
  }
  function render() {
    fixIdx();
    return pills() + viewSwitch() + (tview === "puzzle" ? renderPuzzle() : renderStudy());
  }
  CP.subs = CP.subs || {};
  CP.subs.thought = { render: render, after: function () {} };

  function flip() {
    var box = document.getElementById("tbox"); if (!box) return;
    var items = Array.prototype.slice.call(box.children), first = {};
    items.forEach(function (n) { first[n.getAttribute("data-b")] = n.getBoundingClientRect(); });
    mode = mode === "zh" ? "it" : "zh";
    var order = seq(mode), byB = {};
    items.forEach(function (n) { byB[n.getAttribute("data-b")] = n; });
    order.forEach(function (b) { box.appendChild(byB[b]); });
    document.getElementById("td-it").classList.toggle("on", mode === "it");
    document.getElementById("td-zh").classList.toggle("on", mode === "zh");
    CP.sfx("tap");
    if (reduce || !box.animate) return;
    items.forEach(function (n, k) {
      var f = first[n.getAttribute("data-b")], l = n.getBoundingClientRect();
      var dx = f.left - l.left, dy = f.top - l.top;
      if (!dx && !dy) return;
      n.animate([{ transform: "translate(" + dx + "px," + dy + "px)", zIndex: 2 }, { transform: "translate(0,0)", zIndex: 2 }], { duration: 560, delay: k * 24, easing: "cubic-bezier(0.3, 0.9, 0.3, 1)", fill: "backwards" });
    });
  }
  function go(i) { idx = i; mode = "zh"; pz = null; CP.build.render(); CP.sfx("tap"); }
  var root = document.getElementById("build-root");
  root.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest) return;
    var b;
    if (t.closest("#tk-flip")) { flip(); return; }
    if ((b = t.closest("[data-tcat]"))) { tcat = b.getAttribute("data-tcat"); try { localStorage.setItem("cp-tcat", tcat); } catch (er) {} fixIdx(); mode = "zh"; pz = null; CP.sfx("tap"); CP.build.render(); return; }
    if ((b = t.closest("[data-tview]"))) { tview = b.getAttribute("data-tview"); try { localStorage.setItem("cp-tview", tview); } catch (er) {} pz = null; CP.sfx("tap"); CP.build.render(); return; }
    if ((b = t.closest("[data-tk]"))) { go(parseInt(b.getAttribute("data-tk"), 10)); return; }
    if ((b = t.closest("[data-tnav]"))) { var l = list(), p = l.indexOf(idx) + parseInt(b.getAttribute("data-tnav"), 10); if (p >= 0 && p < l.length) go(l[p]); return; }
    if ((b = t.closest("[data-pzpick]")) && pz && pz.state !== "ok") { if (pz.state === "ko") { pz.state = "play"; pz.bad = []; } pz.ans.push(parseInt(b.getAttribute("data-pzpick"), 10)); CP.sfx("tap"); pzCheck(); CP.build.render(); return; }
    if ((b = t.closest("[data-pzun]")) && pz && pz.state !== "ok") { var pos = parseInt(b.getAttribute("data-pzun"), 10); pz.ans.splice(pos, pz.ans.length - pos); pz.state = "play"; pz.bad = []; CP.sfx("tap"); CP.build.render(); return; }
    if (t.closest("[data-pzundo]") && pz) { pz.ans.pop(); pz.state = "play"; pz.bad = []; CP.sfx("tap"); CP.build.render(); return; }
    if (t.closest("[data-pzhint]") && pz) { pz.hint = true; pz.miss += pz.miss ? 0 : 0; CP.sfx("tap"); CP.build.render(); return; }
    if (t.closest("[data-pzreset]")) { pzStart(); CP.sfx("tap"); CP.build.render(); return; }
    if (t.closest("[data-pznext]")) { var l2 = list(), p2 = l2.indexOf(idx); go(l2[(p2 + 1) % l2.length]); return; }
    var tb = t.closest(".tb");
    if (tb && !tb.classList.contains("pzb") && document.getElementById("tbox") && document.getElementById("tbox").contains(tb)) {
      var bl = ex().blocks[parseInt(tb.getAttribute("data-b"), 10)];
      CP.say(U.chars(bl[2]) ? bl[2] : "", null);
    }
  });
  CP.think = { list: list, state: function () { return { idx: idx, tcat: tcat, tview: tview, pz: pz }; }, okOrders: function (i) { return okOrders(THINK[i]); } };
})();
