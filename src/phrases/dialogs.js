/* ===== V4d: dialoghi di sopravvivenza (ascolto, tocco sulle parole, recita la parte di B) ===== */
(function () {
  var CP = window.CP, esc = CP.esc, W = CP.WORDS;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var CJK = /[㐀-鿿]/;
  var U = CP.u = {
    chars: function (hz) { return String(hz).replace(/[^㐀-鿿]/g, ""); },
    shuffle: shuffle,
    /* somiglianza 0..1 tra due frasi, sulla sottosequenza comune più lunga */
    sim: function (a, b) {
      a = U.chars(a); b = U.chars(b);
      if (!a || !b) return 0;
      var n = a.length, m = b.length, dp = [], i, j;
      for (i = 0; i <= n; i++) { dp.push(new Array(m + 1).fill(0)); }
      for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      return dp[n][m] / Math.max(n, m);
    },
    /* caratteri colorati dal tono della riga; ogni parola del vocabolario si può toccare */
    lineHTML: function (hz, py) {
      var tones = CP.syllables(py).map(CP.tone), k = 0, out = "";
      CP.segment(hz).forEach(function (s) {
        var inner = Array.from(s.raw).map(function (ch) {
          if (CJK.test(ch)) { var t = tones[k] || 5; k++; return '<span class="t' + t + '">' + ch + "</span>"; }
          return '<span class="p">' + esc(ch) + "</span>";
        }).join("");
        out += s.w ? '<span class="wd" role="button" tabindex="0" data-fam="' + CP.attr(s.w.hz) + '">' + inner + "</span>" : inner;
      });
      return out;
    }
  };

  var D = {};
  DIALOGS.forEach(function (d) { D[d.id] = d; });
  var cur = null, showIt = true, runId = 0, rp = null;

  function chatBox() { return document.getElementById("dlg-chat"); }
  function bubble(d, i, extra) {
    var l = d.lines[i], who = l[0] === "A" ? "a" : "b";
    return '<div class="bub ' + who + (extra || "") + '" data-i="' + i + '"><div class="who">' + (who === "a" ? "A · l'altra persona" : "B · tu") + "</div>" +
      '<div class="lp">' + CP.pinyinHTML(l[1]) + "</div>" +
      '<div class="lh">' + U.lineHTML(l[2], l[1]) + "</div>" +
      '<div class="li">' + esc(l[3]) + "</div>" +
      '<span class="btns">' + CP.sayBtn(l[2]) + "</span></div>";
  }
  var dcat = "";
  try { dcat = localStorage.getItem("cp-dcat") || ""; } catch (e) {}
  if (dcat && !DIALOG_CATS.some(function (c) { return c[0] === dcat; })) dcat = "";
  function pillsHTML(cats, cur, attr, items, label) {
    var all = '<button type="button" ' + attr + '=""' + (!cur ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">Tutti · " + items.length + "</button>";
    return '<div class="cpills" role="group" aria-label="' + label + '">' + all + cats.map(function (c) {
      var n = items.filter(function (x) { return x.cat === c[0]; }).length;
      return '<button type="button" ' + attr + '="' + c[0] + '"' + (cur === c[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '><span aria-hidden="true">' + c[1] + "</span> " + esc(c[2]) + " · " + n + "</button>";
    }).join("") + "</div>";
  }
  function listHTML() {
    var items = DIALOGS.filter(function (d) { return !dcat || d.cat === dcat; });
    return '<p class="intro" style="margin-top:14px">' + DIALOGS.length + ' situazioni in cui devi cavartela, dall\'aeroporto alla farmacia. Ascoltale come un audio, poi recita la parte di B.</p>' +
      pillsHTML(DIALOG_CATS, dcat, "data-dcat", DIALOGS, "Categorie di dialoghi") +
      '<div class="dlgs">' + items.map(function (d, i) {
        return '<button type="button" class="dlg-card" data-dlg="' + d.id + '"><span class="n">' + (i + 1) + '</span><span class="tx"><b>' + esc(d.title) + "</b><small>" + esc(d.sub) + " · " + d.lines.length + " battute</small></span><span aria-hidden=\"true\">›</span></button>";
      }).join("") + "</div>";
  }
  function backBtn() {
    return '<button type="button" class="back" data-dlg-back><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>Dialoghi</button>';
  }
  function dlgHTML() {
    var d = D[cur];
    return '<div class="hbar">' + backBtn() + '<span class="grow"></span><label class="chk" style="margin:0"><input type="checkbox" id="dlg-it"' + (showIt ? " checked" : "") + "> Italiano</label></div>" +
      '<div class="dlg-head"><h3>' + esc(d.title) + "</h3><p>" + esc(d.sub) + "</p></div>" +
      '<div class="dlg-bar"><button type="button" class="btn-main" data-dlg-play style="margin:0">▶️ Ascolta tutto il dialogo</button><button type="button" data-dlg-role>🎭 Fai tu la parte di B</button></div>' +
      '<div class="chat' + (showIt ? "" : " noit") + '" id="dlg-chat">' + d.lines.map(function (_, i) { return bubble(d, i); }).join("") + "</div>" +
      '<p class="small muted" style="margin-top:12px">Tocca una parola per vederla da vicino. Il numero di battute e le frasi sono scritti per essere detti ad alta voce.</p>' +
      '<div class="acts"><button type="button" class="btn-s" data-dlg-flag>✏️ Segnala un errore in questo dialogo</button></div>';
  }
  CP.subs = CP.subs || {};
  CP.subs.dlg = {
    render: function () { return cur ? dlgHTML() : listHTML(); },
    after: function () {}
  };
  function refresh() { if (CP.build) CP.build.render(); }

  /* ---------- ascolto continuo ---------- */
  function stopAll() { runId++; rp = null; CP.stopSpeak(); var b = chatBox(); if (b) Array.prototype.forEach.call(b.querySelectorAll(".bub.playing"), function (x) { x.classList.remove("playing"); }); setPlayBtn(false); }
  function setPlayBtn(on) { var p = document.querySelector("[data-dlg-play]"); if (p) p.innerHTML = on ? "⏹ Ferma l'ascolto" : "▶️ Ascolta tutto il dialogo"; }
  function playAll() {
    var d = D[cur], me = ++runId, i = 0;
    CP.stopSpeak(); setPlayBtn(true);
    function step() {
      if (me !== runId || !chatBox()) return;
      if (i >= d.lines.length) { stopAll(); return; }
      var el = chatBox().querySelector('.bub[data-i="' + i + '"]'), l = d.lines[i];
      Array.prototype.forEach.call(chatBox().querySelectorAll(".bub.playing"), function (x) { x.classList.remove("playing"); });
      if (el) { el.classList.add("playing"); try { el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } catch (e) {} }
      CP.speak(l[2], { pitch: l[0] === "B" ? 1.25 : 1, onEnd: function () { if (me !== runId) return; i++; setTimeout(step, 420); }, onStop: function () { } });
    }
    step();
  }

  /* ---------- recita la parte di B ---------- */
  function otherB(d, l) {
    var pool = [];
    d.lines.forEach(function (x) { if (x[0] === "B" && x[2] !== l[2]) pool.push(x); });
    if (pool.length < 2) DIALOGS.forEach(function (o) { if (o !== d) o.lines.forEach(function (x) { if (x[0] === "B" && x[2] !== l[2]) pool.push(x); }); });
    var far = pool.filter(function (x) { return U.sim(x[2], l[2]) < 0.6; });
    far = far.length ? far : pool;
    return far[Math.floor(Math.random() * far.length)];
  }
  function roleStart() {
    var d = D[cur]; stopAll();
    rp = { i: 0, ok: 0, nb: d.lines.filter(function (l) { return l[0] === "B"; }).length, miss: false, shown: -1, opts: null, token: ++runId, done: false };
    document.querySelector(".dlg-bar").hidden = true;
    roleStep();
  }
  function roleStep() {
    var d = D[cur], me = rp && rp.token; if (!rp || !chatBox()) return;
    var box = chatBox(), h = "", i;
    if (rp.i >= d.lines.length) return roleEnd();
    for (i = 0; i < rp.i; i++) h += bubble(d, i);
    var l = d.lines[rp.i];
    if (l[0] === "A") {
      box.innerHTML = h + bubble(d, rp.i, " playing");
      scrollLast(box);
      CP.speak(l[2], { onEnd: function () { if (!rp || rp.token !== me) return; rp.i++; setTimeout(roleStep, 350); }, onStop: function () {} });
      return;
    }
    if (!rp.opts || rp.optI !== rp.i) {
      var other = otherB(d, l);
      rp.opts = shuffle([{ l: l, right: true }, { l: other, right: false }]); rp.optI = rp.i; rp.miss = false;
    }
    var mic = CP.canListen() ? '<button type="button" data-rp-mic class="mic-btn">🎤 Dillo tu, a voce</button>' : "";
    box.innerHTML = h + '<div class="choice-card" id="rp-card"><div class="small muted" style="font-weight:700">Tocca ciò che diresti tu (' + (rp.ok + 1) + "/" + rp.nb + ")</div>" +
      rp.opts.map(function (o, k) {
        return '<button type="button" class="opt" data-rp-opt="' + k + '"><span class="lp">' + CP.pinyinHTML(o.l[1]) + '</span><span class="lh">' + U.lineHTML(o.l[2], o.l[1]).replace(/ data-fam="[^"]*"/g, "").replace(/role="button" tabindex="0"/g, "") + '</span><span class="li">' + esc(o.l[3]) + "</span></button>";
      }).join("") + '<div class="acts" style="margin:0">' + mic + '<button type="button" class="btn-s" data-rp-show>Non lo so: mostrami</button><button type="button" class="btn-s" data-rp-exit>Esci</button></div><div class="heard" id="rp-heard" aria-live="polite"></div></div>';
    scrollLast(box);
  }
  function scrollLast(box) {
    var last = box.lastElementChild; if (last && last.scrollIntoView) { try { last.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } catch (e) {} }
  }
  function rolePass(first) {
    var d = D[cur], l = d.lines[rp.i], me = rp.token;
    if (first && !rp.miss) rp.ok++;
    CP.sfx("ok", Math.min(5, rp.ok));
    CP.speak(l[2], { pitch: 1.25, onEnd: function () { if (!rp || rp.token !== me) return; rp.i++; setTimeout(roleStep, 250); }, onStop: function () {} });
    var box = chatBox(), card = document.getElementById("rp-card");
    if (card) { var tmp = document.createElement("div"); tmp.innerHTML = bubble(d, rp.i, " playing"); card.replaceWith(tmp.firstChild); scrollLast(box); }
  }
  function roleEnd() {
    var d = D[cur], box = chatBox(), h = "", i; if (!box) return;
    for (i = 0; i < d.lines.length; i++) h += bubble(d, i);
    var perfect = rp.ok === rp.nb;
    box.innerHTML = h + '<div class="done-card" id="rp-done"><b>Dialogo finito: ' + rp.ok + " su " + rp.nb + " battute di B al primo colpo.</b><span>" + (perfect ? "Nessuna esitazione. Ora prova ad ascoltarlo senza leggere." : "Riascolta le battute che hai mancato e rifai il dialogo: la seconda volta va meglio.") + '</span><div class="acts" style="margin:0"><button type="button" class="btn-main" data-rp-again style="margin:0">🎭 Rifai</button><button type="button" data-dlg-back>Altri dialoghi</button></div></div>';
    if (CP.game) CP.game.sentence();
    CP.sfx("ok", 5);
    rp.done = true; document.querySelector(".dlg-bar").hidden = false;
    var dn = document.getElementById("rp-done"); if (dn) dn.scrollIntoView({ block: "nearest" });
  }
  function roleExit() { stopAll(); var d = D[cur]; var b = chatBox(); if (b) b.innerHTML = d.lines.map(function (_, i) { return bubble(d, i); }).join(""); var bar = document.querySelector(".dlg-bar"); if (bar) bar.hidden = false; }

  CP.dlg = { open: function (id) { if (!D[id]) return; stopAll(); cur = id; CP.build.setSub("dlg"); window.scrollTo(0, 0); } };
  var root = document.getElementById("build-root");
  root.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest) return;
    var b;
    if ((b = t.closest("[data-dcat]"))) { dcat = b.getAttribute("data-dcat"); try { localStorage.setItem("cp-dcat", dcat); } catch (er) {} CP.sfx("tap"); refresh(); return; }
    if ((b = t.closest("[data-dlg]"))) { cur = b.getAttribute("data-dlg"); rp = null; refresh(); window.scrollTo(0, 0); CP.sfx("tap"); return; }
    if (t.closest("[data-dlg-back]")) { stopAll(); cur = null; refresh(); CP.sfx("tap"); return; }
    if (t.closest("[data-dlg-play]")) { var pb = t.closest("[data-dlg-play]"); if (pb.textContent.indexOf("Ferma") >= 0) stopAll(); else playAll(); return; }
    if (t.closest("[data-dlg-role]")) { roleStart(); return; }
    if (t.closest("[data-dlg-flag]")) { if (CP.contribDialog) CP.contribDialog(cur); return; }
    if (t.closest("[data-rp-exit]")) { roleExit(); return; }
    if (t.closest("[data-rp-again]")) { roleStart(); return; }
    if ((b = t.closest("[data-rp-opt]")) && rp) {
      var o = rp.opts[parseInt(b.getAttribute("data-rp-opt"), 10)];
      if (o.right) rolePass(true);
      else { rp.miss = true; b.classList.add("wrong"); b.disabled = true; b.style.opacity = "0.5"; CP.sfx("ko"); var c = document.getElementById("rp-card"); if (c) { c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); } }
      return;
    }
    if (t.closest("[data-rp-show]") && rp) { rp.miss = true; rolePass(false); return; }
    if (t.closest("[data-rp-mic]") && rp) {
      var btn = t.closest("[data-rp-mic]"), d = D[cur], l = d.lines[rp.i], out = document.getElementById("rp-heard");
      if (btn._rec) { try { btn._rec.abort(); } catch (er) {} btn._rec = null; btn.classList.remove("listening"); return; }
      CP.stopSpeak(); btn.classList.add("listening"); out.className = "heard"; out.textContent = "🎤 Ti ascolto… di' la tua battuta.";
      btn._rec = CP.listen(l[2], function (r) {
        btn.classList.remove("listening"); btn._rec = null;
        if (!rp) return;
        if (r.error) { out.className = "heard ko"; out.textContent = "🎤 " + (r.error === "no-speech" ? "Non ho sentito niente. Riprova." : r.error === "offline" || r.error === "network" ? CP.micErrText(r.error) : "Il microfono non risponde da qui.") ; if (CP.inFrame && r.error !== "no-speech") out.insertAdjacentHTML("beforeend", "<div style='margin-top:8px'>" + CP.frameBtn() + "</div>"); CP.sfx("ko"); return; }
        var best = 0; (r.alts && r.alts.length ? r.alts : [r.heard]).forEach(function (a) { best = Math.max(best, U.sim(a, l[2])); });
        if (r.ok || best >= 0.6) rolePass(true);
        else { rp.miss = true; out.className = "heard ko"; out.innerHTML = '🎤 Ho sentito «<span class="han">' + esc(r.heard || "…") + "</span>». Riprova, o scegli tra le due frasi."; CP.sfx("ko"); }
      });
      if (!btn._rec) btn.classList.remove("listening");
      return;
    }
  });
  root.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("wd")) { e.preventDefault(); CP.openFamily(e.target.getAttribute("data-fam")); }
  });
  root.addEventListener("change", function (e) {
    if (e.target.id === "dlg-it") { showIt = e.target.checked; var b = chatBox(); if (b) b.classList.toggle("noit", !showIt); }
  });
  /* uscendo dalla scheda Frasi o dai Dialoghi, l'audio si ferma */
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest) return;
    if (t.closest(".dtab") || t.closest("[data-sub]") || t.closest("[data-group]")) { if (runId) stopAll(); }
  }, true);
})();
