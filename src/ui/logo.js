/* ===== V5: logo interattivo (diapason fonetico), mini-logo, nessun colore hard-coded ===== */
(function () {
  var CP = window.CP, brand = document.querySelector(".brand"), mini = document.getElementById("mini-logo");
  if (!brand) return;
  /* le lettere con l'accento e le due foglie (la forma del terzo tono, ˇ) fanno sentire il loro tono e lo spiegano */
  var EX = { 4: ["大", "logo.t4"], 3: ["好", "logo.t3"], 2: ["来", "logo.t2"], 1: ["高", "logo.t1"] };
  function pulse() { brand.classList.remove("pulse"); void brand.offsetWidth; brand.classList.add("pulse"); setTimeout(function () { brand.classList.remove("pulse"); }, 700); }
  brand.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-tone]") : null;
    if (t) {
      var n = +t.getAttribute("data-tone"), ex = EX[n];
      CP.speak(ex[0], { rate: 0.8 }); CP.toast(CP.t(ex[1]));
      if (n === 3) pulse();
      return;
    }
    if (e.target.closest && e.target.closest("#mandarin-symbol")) { CP.sfx("tap"); pulse(); }
  });
  var shown = false;
  function upd() {
    var s = window.scrollY > 300;
    if (s !== shown) { shown = s; mini.hidden = !s; document.body.classList.toggle("scrolled", s); }
  }
  window.addEventListener("scroll", upd, { passive: true });
  mini.addEventListener("click", function () {
    var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });
  upd();
})();

