/* màndarínō · avvio finale: gira per ultimo, quando tutti i moduli esistono.
   Copia pulita del file (CP.snapshot), avviso se la pagina sta in un riquadro, primo disegno di Frasi e Percorso. */
/* ===== V4e: avvio finale, avviso per l'iframe, copia pulita del file ===== */
(function () {
  var CP = window.CP;
  /* copia scaricabile: la pagina com'era prima che il codice la riempisse */
  var P = window.__PRISTINE;
  if (P) {
    /* calcolata al momento dell'uso: i moduli successivi (V5/V6) non sono ancora nel DOM quando parte questo script */
    Object.defineProperty(CP, "snapshot", { configurable: true, get: function () {
      var scripts = [], seen = false;
      Array.prototype.forEach.call(document.body.querySelectorAll("script"), function (s) {
        if (s.id === "data") seen = true;
        if (seen && !s.src) scripts.push(s.outerHTML);
      });
      return '<html lang="' + P.lang + '"><head>' + P.head.replace(/<script(?![^>]*id="theme-boot")[\s\S]*?<\/script>/gi, "") + "</head><body>" + P.body + scripts.join("\n") + "</body></html>";
    } });
  }
  /* avviso in cima, solo se la pagina sta dentro un riquadro */
  var n = document.getElementById("frame-notice");
  if (n && CP.inFrame) {
    var dismissed = false; try { dismissed = sessionStorage.getItem("cp-nf") === "1"; } catch (e) {}
    if (!dismissed) {
      n.innerHTML = '<p><b>Microfono e audio funzionano meglio fuori da questo riquadro.</b> Scarica il file e aprilo con il browser: è una pagina a sé, funziona anche senza internet.</p><div style="display:flex;gap:8px;flex-wrap:wrap">' + CP.frameBtn() + '<button type="button" class="btn-s" data-nf-hide>Più tardi</button></div>';
      n.hidden = false;
      n.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest("[data-nf-hide]")) { n.hidden = true; try { sessionStorage.setItem("cp-nf", "1"); } catch (er) {} }
      });
    }
  }
  if (CP.build && CP.build.render) CP.build.render();
  var vp = document.getElementById("view-path");
  if (vp && !vp.hidden && CP.onPath) CP.onPath();
})();
/* via la schermata d'avvio (index.html, styles/splash.css): l'app è pronta */
(function () {
  var s = document.getElementById("splash"); if (!s) return;
  clearTimeout(window.__spT); clearInterval(window.__spI); clearTimeout(window.__spX);
  /* l'apertura è sempre presente (non solo la prima volta) e dura almeno 1,7 s, così l'animazione si vede per intero; chi arriva da un
     collegamento (widget, scorciatoia) o ha il movimento ridotto aspetta meno, e i test automatici (navigator.webdriver) niente */
  var reduce = false; try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var min = typeof window.__MD_SPLASH_MIN === "number" ? window.__MD_SPLASH_MIN : navigator.webdriver ? 0 : window.__mdGoing ? 700 : reduce ? 500 : 1700;
  var wait = Math.max(0, min - (window.performance && performance.now ? performance.now() : 0));
  setTimeout(function () {
    requestAnimationFrame(function () {
      s.classList.add("gone"); document.body.classList.add("app-reveal");
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); document.body.classList.remove("app-reveal"); }, 900);
    });
  }, wait);
})();
