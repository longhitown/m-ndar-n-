/* ===== V4d: slot machine di frasi + situazione casuale a tempo ===== */
(function () {
  var CP = window.CP, esc = CP.esc, U = CP.u, T = CP.t;
  var mi = 0, pick = [], sit = null, tick = 0, t0 = 0, LIMIT = 15, result = null, spinning = false;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function M() { return SLOTS[mi]; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function randomize(all) { pick = M().cols.map(function (c, i) { return all || pick[i] === undefined ? rnd(c.o.length) : pick[i]; }); }
  randomize(true);

  var ZP = { ",": "，", ".": "。", "?": "？", "!": "！" };
  function opt(i) { return M().cols[i].o[pick[i]]; }
  /* le opzioni vuote (["", "", ""]) si saltano; il segno finale si attacca all'ultima colonna non vuota */
  function compose(mx, pk) {
    var m = mx || M(), pk2 = pk || pick, py = [], hz = "", it = [];
    var cols = m.cols.map(function (c, i) { return { c: c, o: c.o[pk2[i]], i: i }; }).filter(function (x) { return x.o[1]; });
    cols.forEach(function (x, j) {
      var last = j === cols.length - 1, sep = x.c.sep || "";
      if (last) { var fin = m.cols[m.cols.length - 1], fo = fin.o[pk2[m.cols.length - 1]]; sep = (fo[3] !== undefined ? fo[3] : fin.end) || ""; }
      py.push(x.o[0] + sep); hz += x.o[1] + (ZP[sep] || ""); it.push(x.o[2]);
    });
    var p = py.join(" ");
    return { py: p.charAt(0).toUpperCase() + p.slice(1), hz: hz, it: it.join(" · ") };
  }
  CP.slotCompose = compose;
  /* tre toni 3 di fila: tutti tranne l'ultimo diventano 2° (semplificato) */
  function sandhi(py) {
    var words = py.split(" "), flat = [];
    words.forEach(function (w, wi) { w.split(/\.(?=[^\s.])/).forEach(function (s, si) { flat.push({ s: s, wi: wi, si: si }); }); });
    var changed = false;
    for (var i = 0; i < flat.length - 1; i++) {
      if (CP.tone(flat[i].s) === 3 && CP.tone(flat[i + 1].s) === 3) {
        flat[i].s = flat[i].s.normalize("NFD").replace("̌", "́").normalize("NFC"); changed = true;
      }
    }
    if (!changed) return null;
    return words.map(function (_, wi) { return flat.filter(function (x) { return x.wi === wi; }).map(function (x) { return x.s; }).join("."); }).join(" ");
  }
  function needOk(col, want) {
    var ws = [].concat(want); return ws.indexOf(pick[col]) >= 0;
  }
  function solved() {
    if (!sit) return false;
    return Object.keys(sit.need).every(function (c) { return needOk(+c, sit.need[c]); });
  }

  function reelHTML(ci) {
    var c = M().cols[ci], o = c.o[pick[ci]];
    var okc = sit && sit.need[ci] !== undefined && needOk(ci, sit.need[ci]);
    return '<div class="reel' + (okc ? " ok" : "") + '" data-col="' + ci + '"><span class="rl"><span lang="it">' + esc(c.label) + '</span> <span class="hintc">· ' + (pick[ci] + 1) + "/" + c.o.length + '</span></span>' +
      '<button type="button" class="rc" data-next="' + ci + '" aria-label="' + CP.attr(c.label + ": " + o[2] + ". " + T("slot.next")) + '"><span class="bp">' + CP.pinyinHTML(o[0]) + '</span><span class="bh" lang="zh-CN">' + CP.hanziHTML(o[1], o[0]) + '</span><span class="bi" lang="it">' + esc(o[2]) + "</span></button>" +
      '<button type="button" data-spin="' + ci + '" aria-label="' + CP.attr(T("slot.spin1", { c: c.label })) + '">🎲</button></div>';
  }
  function outHTML() {
    var cmp = compose(), sd = sandhi(cmp.py);
    return '<div class="lp">' + CP.pinyinHTML(cmp.py) + "</div>" + CP.toneCurveHTML(cmp.py) + '<div class="lh" lang="zh-CN">' + CP.hanziHTML(cmp.hz, cmp.py) + "</div>" +
      '<div class="li">' + T("slot.blocks") + ' <span lang="it">' + esc(cmp.it) + "</span></div>" +
      (sd ? '<div class="spoken" style="margin-top:4px"><span class="tag">' + T("ex.spoken") + '</span><div class="sp">' + CP.pinyinHTML(sd) + '</div><div class="snote">' + T("slot.sandhi") + "</div></div>" : "") +
      '<div class="acts">' + CP.audioBtns(cmp.hz) + "</div>";
  }
  function sitHTML() {
    if (!sit && !result) return '<div class="sitbox"><span class="stx">' + T("slot.sitAsk", { n: LIMIT }) + '</span><div class="acts" style="margin:0"><button type="button" class="btn-main" data-sit style="margin:0">🎯 ' + T("slot.sitGo") + "</button></div></div>";
    if (result) return '<div class="sitbox"><span class="stx">' + result.html + '</span><div class="acts" style="margin:0"><button type="button" class="btn-main" data-sit style="margin:0">🎯 ' + T("slot.sitAgain") + "</button></div></div>";
    return '<div class="sitbox"><span class="small muted" style="font-weight:700">' + T("slot.sitHead", { n: LIMIT }) + '</span><span class="stx" lang="it">' + esc(sit.t) + '</span><div class="timebar"><i id="sit-bar"></i></div><div class="acts" style="margin:0"><button type="button" class="btn-s" data-sit-give>' + T("slot.give") + "</button></div></div>";
  }
  function boxHTML() {
    var m = M();
    return '<div class="mpick" role="group" aria-label="' + CP.attr(T("slot.matrices")) + '">' + SLOTS.map(function (s, i) { return '<button type="button" data-matrix="' + i + '"' + (i === mi ? ' class="on"' : "") + ">" + s.icon + ' <span lang="it">' + esc(s.title) + "</span></button>"; }).join("") + "</div>" +
      '<p class="small muted" style="margin:10px 0 0">' + T("slot.howto") + "</p>" +
      sitHTML() +
      '<div class="reels">' + m.cols.map(function (_, i) { return reelHTML(i); }).join("") + "</div>" +
      '<div class="sbox" id="slot-out">' + outHTML() + "</div>" +
      '<div class="dlg-bar"><button type="button" class="btn-s" data-spin-all style="margin:0">🎰 ' + T("slot.spinAll") + "</button></div>";
  }
  function paint() {
    var b = document.getElementById("slot-box"); if (!b) return;
    var sc = window.scrollY; b.innerHTML = boxHTML(); if (Math.abs(window.scrollY - sc) > 1) window.scrollTo(0, sc);
    if (sit) animBar();
  }
  function paintParts() {
    var out = document.getElementById("slot-out"); if (out) out.innerHTML = outHTML();
    Array.prototype.forEach.call(document.querySelectorAll("#slot-box .reel"), function (r) {
      var ci = +r.getAttribute("data-col"), c = M().cols[ci], o = c.o[pick[ci]];
      r.querySelector(".hintc").textContent = "· " + (pick[ci] + 1) + "/" + c.o.length;
      var rc = r.querySelector(".rc"); rc.setAttribute("aria-label", c.label + ": " + o[2] + ". " + T("slot.next"));
      rc.innerHTML = '<span class="bp">' + CP.pinyinHTML(o[0]) + '</span><span class="bh" lang="zh-CN">' + CP.hanziHTML(o[1], o[0]) + '</span><span class="bi" lang="it">' + esc(o[2]) + "</span>";
      r.classList.toggle("ok", !!(sit && sit.need[ci] !== undefined && needOk(ci, sit.need[ci])));
    });
  }
  function animBar() {
    clearInterval(tick);
    tick = setInterval(function () {
      var bar = document.getElementById("sit-bar");
      if (!bar || !sit) { clearInterval(tick); return; }
      var el = (performance.now() - t0) / 1000;
      bar.style.transform = "scaleX(" + Math.max(0, 1 - el / LIMIT) + ")";
      if (el >= LIMIT) timeUp();
    }, 80);
  }
  function solution() {
    var parts = Object.keys(sit.need).map(function (c) { var w = [].concat(sit.need[c])[0]; var o = M().cols[+c].o[w]; return "«" + o[0] + "» (" + o[2] + ")"; });
    return parts.join(" + ");
  }
  function timeUp(give) {
    clearInterval(tick); if (!sit) return;
    result = { html: (give ? "" : T("slot.timeUp") + " ") + T("slot.needed", { s: '<span lang="it">' + esc(solution()) + "</span>" }) }; sit = null; CP.sfx("ko"); paint();
  }
  function win() {
    clearInterval(tick);
    var el = ((performance.now() - t0) / 1000).toFixed(1);
    result = { html: T("slot.win", { s: el }) }; sit = null;
    if (CP.game) CP.game.sentence();
    CP.sfx("ok", 4); paintParts();
    var cmp = compose(); CP.speak(cmp.hz, {});
    var box = document.querySelector("#slot-box .sitbox"); if (box) box.outerHTML = sitHTML();
  }
  function start() {
    var cand = SITUATIONS, s = cand[rnd(cand.length)], tries = 0;
    sit = s; result = null; mi = SLOTS.findIndex(function (m) { return m.id === s.m; }); if (mi < 0) mi = 0;
    do { randomize(true); tries++; } while (solved() && tries < 30);
    t0 = performance.now(); paint(); CP.sfx("tap");
    var sb = document.querySelector("#slot-box .sitbox"); if (sb && sb.scrollIntoView) sb.scrollIntoView({ block: "nearest" });
  }
  function spinCol(ci, done) {
    var r = document.querySelector('#slot-box .reel[data-col="' + ci + '"]'), c = M().cols[ci], final = rnd(c.o.length);
    if (c.o.length > 1) while (final === pick[ci]) final = rnd(c.o.length);
    if (reduce || !r) { pick[ci] = final; paintParts(); afterChange(); if (done) done(); return; }
    var n = 0, rc = r.querySelector(".rc"); r.classList.add("spin");
    var iv = setInterval(function () {
      n++;
      var o = c.o[rnd(c.o.length)];
      rc.innerHTML = '<span class="bp">' + CP.pinyinHTML(o[0]) + '</span><span class="bh" lang="zh-CN">' + CP.hanziHTML(o[1], o[0]) + '</span><span class="bi" lang="it">' + esc(o[2]) + "</span>";
      if (n % 2 === 0) CP.sfx("tap");      /* un tap ogni due giri: sei in 420 ms erano troppi */
      if (n >= 6) { clearInterval(iv); r.classList.remove("spin"); pick[ci] = final; paintParts(); afterChange(); if (done) done(); }
    }, 70);
  }
  function afterChange() { if (sit && solved()) win(); }
  CP.subs = CP.subs || {};
  CP.subs.slot = { render: function () { return '<div id="slot-box">' + boxHTML() + "</div>"; }, after: function () { if (sit) { animBar(); } } };

  var root = document.getElementById("build-root");
  root.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest || !t.closest("#slot-box")) return;
    var b;
    if ((b = t.closest("[data-matrix]"))) { mi = +b.getAttribute("data-matrix"); sit = null; result = null; clearInterval(tick); randomize(true); paint(); CP.sfx("tap"); return; }
    if ((b = t.closest("[data-next]"))) {
      var ci = +b.getAttribute("data-next"); pick[ci] = (pick[ci] + 1) % M().cols[ci].o.length; CP.sfx("tap"); paintParts(); afterChange(); return;
    }
    if ((b = t.closest("[data-spin]"))) { spinCol(+b.getAttribute("data-spin")); return; }
    if (t.closest("[data-spin-all]")) {
      if (spinning) return; spinning = true;
      var n = M().cols.length, left = n;
      M().cols.forEach(function (_, i) { setTimeout(function () { spinCol(i, function () { if (--left === 0) spinning = false; }); }, i * 120); });
      return;
    }
    if (t.closest("[data-sit]")) { start(); return; }
    if (t.closest("[data-sit-give]")) { timeUp(true); return; }
  });
})();
