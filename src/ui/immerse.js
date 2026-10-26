/* ===== màndarínō · «Immersione»: gli esercizi di Frasi a schermo pieno.
   Spariscono intestazione, barra degli strumenti, schede in basso e menu di Frasi: resta l'esercizio, con una barra
   sottile in alto (✕, titolo, avanzamento, serie di risposte giuste di fila). Si esce con ✕, Esc o il tasto Indietro.
   Dove il browser lo permette si chiede anche il vero schermo intero (Android, computer); su iPhone e nell'app basta il
   layout. Le risposte giuste fanno partire un piccolo sbuffo di particelle (niente librerie: una decina di <i> in CSS). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, body = document.body;
  var S = { on: false, onExit: null, hist: false };
  var bar = document.createElement("div");
  bar.id = "fx-bar"; bar.hidden = true;
  bar.innerHTML = '<button type="button" class="fx-x" data-fx-x aria-label="' + CP.attr(T("fx.exit")) + '">✕</button><b class="fx-t"></b>' +
    '<span class="fx-combo" aria-live="polite" hidden></span><span class="fx-n small"></span><div class="fx-prog" aria-hidden="true"><i></i></div>';
  body.appendChild(bar);
  var reduce = function () { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; };
  function realFull(on) {
    if (window.MandarinoAndroid) return;   /* nella WebView dell'app lo schermo intero vero non serve e non è supportato */
    try {
      if (on && !document.fullscreenElement && document.fullscreenEnabled && CP.pref.immerseFull !== false) {
        var p = document.documentElement.requestFullscreen({ navigationUI: "hide" }); if (p && p.catch) p.catch(function () {});
      } else if (!on && document.fullscreenElement) { var q = document.exitFullscreen(); if (q && q.catch) q.catch(function () {}); }
    } catch (e) {}
  }
  function enter(o) {
    o = o || {};
    bar.querySelector(".fx-t").textContent = o.title || "";
    S.onExit = o.onExit || null;
    if (!S.on) {
      S.on = true; body.classList.add("in-focus"); bar.hidden = false;
      try { history.pushState({ mdFocus: 1 }, ""); S.hist = true; } catch (e) { S.hist = false; }
      realFull(true); window.scrollTo(0, 0);
    }
    progress(null); combo(0);
  }
  function leave(fromPop) {
    if (!S.on) return;
    S.on = false; body.classList.remove("in-focus"); bar.hidden = true; realFull(false);
    if (S.hist && !fromPop) { S.hist = false; try { history.back(); } catch (e) {} }
    S.hist = false;
    var cb = S.onExit; S.onExit = null; if (cb) cb();
  }
  function progress(done, total) {
    var p = bar.querySelector(".fx-prog i"), n = bar.querySelector(".fx-n");
    if (done == null) { p.style.transform = "scaleX(0)"; n.textContent = ""; return; }
    p.style.transform = "scaleX(" + Math.max(0, Math.min(1, done / (total || 1))).toFixed(3) + ")"; n.textContent = done + "/" + total;
  }
  function combo(k) {
    var c = bar.querySelector(".fx-combo");
    if (k < 2) { c.hidden = true; return; }
    c.hidden = false; c.textContent = "🔥 " + k;
    c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop");
  }
  /* sbuffo di particelle dal centro di un elemento */
  function burst(el, big) {
    if (!el || reduce() || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect(), box = document.createElement("div"), n = big ? 22 : 12, cols = ["--t1", "--t2", "--t3", "--t4", "--accent"];
    box.className = "fx-burst"; box.style.left = (r.left + r.width / 2) + "px"; box.style.top = (r.top + Math.min(r.height / 2, 40)) + "px";
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + Math.random() * 0.5, d = (big ? 70 : 44) + Math.random() * (big ? 60 : 30), p = document.createElement("i");
      p.style.setProperty("--dx", (Math.cos(a) * d).toFixed(1) + "px"); p.style.setProperty("--dy", (Math.sin(a) * d - 10).toFixed(1) + "px");
      p.style.background = "var(" + cols[i % cols.length] + ")"; p.style.animationDelay = (Math.random() * 60) + "ms";
      box.appendChild(p);
    }
    body.appendChild(box); setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 900);
  }
  bar.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-fx-x]")) { CP.sfx("tap"); leave(false); } });
  window.addEventListener("popstate", function () { if (S.on) leave(true); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && S.on && !(CP.topSheet && CP.topSheet())) { e.preventDefault(); leave(false); }
  });
  /* uscendo dallo schermo intero con il gesto di sistema si resta nell'immersione: è solo il layout */

  /* ogni risposta giusta che compare dentro Frasi o nel corso di italiano fa il suo sbuffo, senza toccare i moduli */
  var seen = typeof WeakSet === "function" ? new WeakSet() : null;
  function watch(root) {
    if (!root || !window.MutationObserver || !seen) return;
    new MutationObserver(function () {
      var v = root.querySelector(".verdict.ok, .ls-opt.right, .bub.ok");
      if (v && !seen.has(v)) { seen.add(v); burst(v, /superata|🎉/.test(v.textContent || "")); if (CP.haptic) CP.haptic(12); }
      var w = root.querySelector(".ls-quiz h3");
      if (w && !seen.has(w) && /🎉/.test(w.textContent)) { seen.add(w); burst(w, true); }
    }).observe(root, { childList: true, subtree: true });
  }
  watch(document.getElementById("build-root"));

  /* cambiare scheda (dal «Cerca ovunque», da un collegamento) chiude l'immersione */
  var show0 = CP.show;
  if (show0) CP.show = function () { if (S.on) leave(false); return show0.apply(this, arguments); };

  CP.immerse = { watch: watch, enter: enter, leave: function () { leave(false); }, active: function () { return S.on; }, progress: progress, combo: combo, burst: burst };
})();
