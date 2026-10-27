/* màndarínō · comportamenti della pagina di presentazione. Nessuna libreria, nessuna richiesta a servizi esterni,
   nessun cookie e nessun dato salvato. Se questo file non carica, la pagina resta completa e leggibile.
   Si carica nell'<head> con <script src="assets/sito.js"></script>: la prima riga serve a evitare lampi di contenuto. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.add("js");
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };


  /* ---------- toni sintetici (WebAudio), avviso, lettere e foglie, radio ---------- */
  var AC, toastT;
  /* 5 livelli ≈ un'ottava, come nella notazione dei toni: 1 alto e piatto, 2 sale, 3 scende e risale, 4 cade */
  var LV = { 1: [4.4, 4.4, 4.4], 2: [2.6, 3.4, 4.8], 3: [2.4, 1, 1.2, 3.9], 4: [4.9, 3, 1.1] };
  function tone(n) {
    var C = window.AudioContext || window.webkitAudioContext; if (!C || !LV[n]) return 0;
    AC = AC || new C(); if (AC.state === "suspended") AC.resume();
    var t0 = AC.currentTime + .02, dur = .62;
    var f = new Float32Array(LV[n].map(function (l) { return 150 * Math.pow(2, (l - 3) / 5); }));
    var o = AC.createOscillator(), g = AC.createGain(), lp = AC.createBiquadFilter(), a = AC.createBiquadFilter(), b = AC.createBiquadFilter();
    o.type = "sawtooth"; o.frequency.setValueCurveAtTime(f, t0, dur);
    lp.type = "lowpass"; lp.frequency.value = 3200;
    a.type = "bandpass"; a.frequency.value = 760; a.Q.value = 4; b.type = "bandpass"; b.frequency.value = 1180; b.Q.value = 5;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.55, t0 + .05); g.gain.setValueAtTime(.55, t0 + dur - .14); g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(lp); lp.connect(a); lp.connect(b); a.connect(g); b.connect(g); g.connect(AC.destination);
    o.start(t0); o.stop(t0 + dur + .05);
    return dur;
  }
  function toast(msg) {
    var t = $(".toast"); if (!t) return;
    t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 2800);
  }
  window.MDS = { tone: tone, toast: toast, calm: calm };
  var EX = { 1: "1° tono: alto e piatto, «gāo»", 2: "2° tono: sale, «lái»", 3: "3° tono: scende e risale, «hǎo»", 4: "4° tono: cade secco, «dà»" };

  function start2() {
    function hit(el) {
      var n = +el.getAttribute("data-tone"); if (!EX[n]) return;
      tone(n); toast(EX[n]);
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
      el.classList.remove("wig"); void el.getBoundingClientRect(); el.classList.add("wig");
      setTimeout(function () { el.classList.remove("wig"); }, 800);
    }
    $$(".mark [data-tone]").forEach(function (el) {
      el.addEventListener("click", function () { hit(el); });
      el.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && el.tagName !== "BUTTON") { e.preventDefault(); hit(el); } });
    });

    /* radio: parte solo dopo un tocco, dissolvenza in entrata e in uscita, nessun file scaricato prima */
    var R = $(".radio");
    if (R) {
      var T = [["biblioteca", "Biblioteca di Hangzhou", "杭州图书馆"], ["calligrafia", "Calligrafia", "书法"], ["bambu", "Pioggia sul bambù", "竹林听雨"]], k = 0, au = null, fade;
      var name = $(".r-name", R), btn = $(".r-play", R), nxt = $(".r-next", R);
      function src(id) { var t = document.createElement("audio"); return (t.canPlayType && t.canPlayType('audio/ogg; codecs="vorbis"')) ? "audio/" + id + ".ogg" : "audio/" + id + ".m4a"; }
      function ramp(to, ms, done) {
        clearInterval(fade); var from = au.volume, t0 = performance.now();
        fade = setInterval(function () { var p = Math.min(1, (performance.now() - t0) / ms); au.volume = from + (to - from) * p; if (p >= 1) { clearInterval(fade); if (done) done(); } }, 40);
      }
      function load(i) {
        k = (i + T.length) % T.length; name.textContent = T[k][1]; name.setAttribute("title", T[k][2]);
        if (!au) {
          au = new Audio(); au.preload = "none";
          au.addEventListener("ended", function () { load(k + 1); play(); });
          au.addEventListener("pause", function () { R.classList.remove("playing"); btn.setAttribute("aria-label", "Ascolta la musica"); btn.setAttribute("aria-pressed", "false"); });
          au.addEventListener("play", function () { R.classList.add("playing"); btn.setAttribute("aria-label", "Metti in pausa"); btn.setAttribute("aria-pressed", "true"); });
        }
        au.src = src(T[k][0]);
        if ("mediaSession" in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({ title: T[k][1], artist: "màndarínō", album: "Musica del sito" });
      }
      function play() { au.volume = 0; var p = au.play(); if (p && p.catch) p.catch(function () {}); ramp(.7, 1400); }
      function pause() { ramp(0, 700, function () { au.pause(); }); }
      btn.addEventListener("click", function () { if (!au) load(0); if (au.paused) play(); else pause(); });
      nxt.addEventListener("click", function () { var was = !au || !au.paused; load(k + 1); if (was) play(); });
      if ("mediaSession" in navigator) try { navigator.mediaSession.setActionHandler("play", function () { play(); }); navigator.mediaSession.setActionHandler("pause", pause); navigator.mediaSession.setActionHandler("nexttrack", function () { load(k + 1); play(); }); } catch (e) {}
      R.hidden = false;
    }

    /* microprove: script e dati si scaricano solo quando la sezione sta per comparire */
    var pr = $("#prova");
    if (pr) {
      var loaded = false;
      var inject = function (u, cb) { var s = d.createElement("script"); s.src = u; s.onload = cb; s.onerror = function () { pr.classList.add("offline"); }; d.head.appendChild(s); };
      var loadAll = function () {
        if (loaded) return; loaded = true;
        inject("assets/vendor/confetti.browser.js");
        inject("assets/vendor/hanzi-writer.min.js", function () { inject("assets/prova.js"); });
      };
      if ("IntersectionObserver" in window) { var lo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { lo.disconnect(); loadAll(); } }, { rootMargin: "400px 0px" }); lo.observe(pr); }
      else loadAll();
    }
  }

  function start() {
    /* barra in alto: bordo e ombra dopo qualche pixel; pulsante «torna su» */
    var top = $(".top"), up = $(".to-top"), ticking = false;
    function onScroll() {
      var y = window.scrollY || 0;
      if (top) top.classList.toggle("scrolled", y > 8);
      if (up) up.classList.toggle("on", y > 700);
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    if (up) up.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" }); });

    /* comparsa al passaggio (con ritardo a scalini dentro lo stesso gruppo) */
    var rv = $$(".rv");
    if (!("IntersectionObserver" in window) || calm) rv.forEach(function (e) { e.classList.add("in"); });
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
      $$(".rv").forEach(function (e) {
        var sib = e.parentNode ? $$(".rv", e.parentNode).filter(function (x) { return x.parentNode === e.parentNode; }) : [];
        e.style.setProperty("--d", Math.min(sib.indexOf(e), 6) * 0.07 + "s");
        io.observe(e);
      });
    }

    /* voce del menu che corrisponde alla sezione visibile */
    var links = $$(".nav a[href^='#']");
    if ("IntersectionObserver" in window && links.length) {
      var map = {};
      links.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) map[s.id] = a; });
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove("on"); }); if (map[e.target.id]) map[e.target.id].classList.add("on"); } });
      }, { rootMargin: "-35% 0px -60% 0px" });
      Object.keys(map).forEach(function (id) { spy.observe($("#" + id)); });
    }

    /* numeri che salgono la prima volta che si vedono */
    $$("[data-count]").forEach(function (el) {
      var to = parseInt(el.getAttribute("data-count"), 10), fmt = function (n) { return n.toLocaleString("it-IT"); };
      if (calm || !("IntersectionObserver" in window)) { el.textContent = fmt(to); return; }
      var o = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; o.disconnect();
        var t0 = performance.now(), dur = 900;
        (function step(t) { var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(Math.round(to * e)); if (p < 1) requestAnimationFrame(step); })(t0);
      }, { threshold: .6 });
      o.observe(el);
    });

    /* parole che si alternano sotto il titolo */
    var tk = $(".ticker");
    if (tk && !calm) {
      var words = [["你好", "nǐ hǎo", "ciao"], ["谢谢", "xièxie", "grazie"], ["再见", "zàijiàn", "arrivederci"], ["好吃", "hǎochī", "buono (da mangiare)"], ["加油", "jiāyóu", "forza!"]], k = 0;
      var cells = $$("span", tk);
      setInterval(function () {
        if (d.hidden) return;
        tk.classList.add("out");
        setTimeout(function () { k = (k + 1) % words.length; cells.forEach(function (c, i) { c.textContent = words[k][i]; }); tk.classList.remove("out"); }, 360);
      }, 3200);
    }

    /* telefono: inclinazione leggera col puntatore (non su schermi tattili) e video solo quando si vede */
    var ph = $(".phone");
    if (ph && !calm && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var h = ph.closest(".hero") || ph;
      h.addEventListener("pointermove", function (e) {
        var r = ph.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        ph.style.transform = "perspective(900px) rotateY(" + (x * 10).toFixed(1) + "deg) rotateX(" + (-y * 8).toFixed(1) + "deg)";
      });
      h.addEventListener("pointerleave", function () { ph.style.transform = ""; });
    }
    var v = $(".phone video");
    if (v && !calm && "IntersectionObserver" in window && !(navigator.connection && navigator.connection.saveData)) {
      v.preload = "metadata";
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
      }, { threshold: .4 }).observe(v);
    }

    /* installazione: schede con indicatore che scorre, scelta iniziale in base al dispositivo, frecce da tastiera */
    $$("[role=tablist]").forEach(function (tl) {
      var tabs = $$("[role=tab]", tl), pill = $(".pill", tl);
      var ua = navigator.userAgent || "", guess = /Android/i.test(ua) ? "android" : /iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : "pc";
      var sel = function (t, focus) {
        tabs.forEach(function (x) {
          var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
          var p = d.getElementById(x.getAttribute("aria-controls")); if (p) p.hidden = !on;
        });
        if (pill) { pill.style.width = t.offsetWidth + "px"; pill.style.transform = "translateX(" + (t.offsetLeft - 4) + "px)"; }
        if (focus) t.focus();
      };
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { sel(t); });
        t.addEventListener("keydown", function (e) {
          var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
          if (j >= 0) { e.preventDefault(); sel(tabs[(j + tabs.length) % tabs.length], true); }
        });
      });
      var first = tabs.filter(function (t) { return t.getAttribute("data-os") === guess; })[0] || tabs[0];
      sel(first);
      var again = function () { sel($("[aria-selected=true]", tl) || first); };
      window.addEventListener("resize", again);
      if (d.fonts && d.fonts.ready) d.fonts.ready.then(again);
    });

    /* APK: l'href di partenza è la Release di GitHub (funziona sempre, anche senza JavaScript). Se il file è anche sul
       sito (data-apk="mandarino.apk"), il pulsante passa a quello e mostra la dimensione. */
    var apks = $$("a[data-apk]");
    if (apks.length && window.fetch && location.protocol !== "file:") {
      var own = apks[0].getAttribute("data-apk");
      fetch(own, { method: "HEAD" }).then(function (r) {
        if (!r.ok) return;
        apks.forEach(function (a) { a.setAttribute("href", own); });
        var n = parseInt(r.headers.get("content-length") || "0", 10);
        $$("[data-apk-size]").forEach(function (i) { if (n) i.textContent = "circa " + Math.round(n / 1048576) + " MB"; });
      }).catch(function () {});
    }

    /* condividere la pagina: foglio di sistema se c'è, altrimenti copia l'indirizzo */
    var sh = $("[data-share]");
    if (sh) sh.addEventListener("click", function () {
      var url = location.href.split("#")[0], label = sh.textContent;
      if (navigator.share) { navigator.share({ title: d.title, url: url }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { sh.textContent = sh.getAttribute("data-done") || "Copiato"; setTimeout(function () { sh.textContent = label; }, 1800); }).catch(function () {});
    });
  }
  function all() { start(); start2(); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", all); else all();
})();
