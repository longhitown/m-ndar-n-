/* ===== V6.6: temi (chiaro · carta di riso · notte), filtro per livello, intestazione compatta ===== */
(function () {
  var CP = window.CP, root = document.documentElement;
  /* ---- temi ---- */
  var ORDER = ["light", "sepia", "dark"], ICON = { light: "☀️", sepia: "📜", dark: "🌙" };
  var NAME = { light: "Chiaro", sepia: "Carta di Riso (Seppia)", dark: "Notte Giada" };
  var META = { light: "#14594A", sepia: "#F4EFE6", dark: "#0F1412" };
  function system() { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
  function current() { var t = root.getAttribute("data-theme"); return ORDER.indexOf(t) >= 0 ? t : system(); }
  function paint() {
    var t = current(), b = document.getElementById("theme-btn");
    if (b) { b.textContent = ICON[t]; b.setAttribute("aria-label", "Tema: " + NAME[t] + ". Tocca per cambiare."); b.title = "Tema: " + NAME[t]; }
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-set]"), function (x) { var on = x.getAttribute("data-theme-set") === t; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", META[t]);
  }
  CP.theme = function () { return current(); };
  CP.setTheme = function (t) {
    if (ORDER.indexOf(t) < 0) return;
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("cp-theme", t); } catch (e) {}
    paint();
  };
  CP.cycleTheme = function () {
    var next = ORDER[(ORDER.indexOf(current()) + 1) % ORDER.length];
    CP.setTheme(next);
    if (CP.toast) CP.toast("Tema: " + (next === "sepia" ? "Carta di Riso (Seppia)" : next === "dark" ? "Notte Giada" : "Chiaro"));
    if (CP.sfx) CP.sfx("tap");
  };
  var tb = document.getElementById("theme-btn");
  if (tb) tb.addEventListener("click", CP.cycleTheme);
  document.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-theme-set]") : null; if (b) { CP.setTheme(b.getAttribute("data-theme-set")); if (CP.sfx) CP.sfx("tap"); } });
  paint();

  /* ---- filtro per livello (scheda Parole) ---- */
  /* i livelli seguono le sezioni (per id, non per posizione): le sezioni HSK stanno in fondo al livello giusto */
  function at(id) { for (var i = 0; i < CP.SEC.length; i++) if (CP.SEC[i].id === id) return i; return -1; }
  var B1 = at("opinioni"), B2 = at("pensiero_critico"), B3 = at("finanza_valute_oro"), END = CP.SEC.length - 1;
  var TIERS = [
    { k: "all", t: "🗂️ Tutte" },
    { k: 0, t: "🌱 Base + HSK 1–2", a: 0, b: B1 - 1 },
    { k: 1, t: "🌿 Intermedio + HSK 3", a: B1, b: B2 - 1 },
    { k: 2, t: "🌳 Avanzato + HSK 4", a: B2, b: B3 - 1 },
    { k: 3, t: "🏔️ Maestro + HSK 5", a: B3, b: END }
  ];
  var tierEl = document.getElementById("tiers"), tier = "all";
  function paintTiers() {
    if (!tierEl) return;
    tierEl.innerHTML = TIERS.map(function (x) {
      var on = String(x.k) === String(tier);
      return '<button type="button" data-tier="' + x.k + '"' + (on ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + x.t + "</button>";
    }).join("");
  }
  function applyTier(k) {
    tier = k; paintTiers();
    var x = TIERS.filter(function (t) { return String(t.k) === String(k); })[0];
    if (!x || x.k === "all") { CP.topic = null; }
    else CP.topic = SECTIONS.slice(x.a, x.b + 1).map(function (s) { return s.id; });
    if (CP.refilter) CP.refilter();
    if (x && x.k !== "all") {
      var first = SECTIONS[x.a].id;
      requestAnimationFrame(function () { if (CP.gotoSection) CP.gotoSection(first, true); });
    } else {
      var tools = document.querySelector(".tools"); if (tools && tools.scrollIntoView) tools.scrollIntoView({ block: "start" });
    }
  }
  CP.tier = function (k) { if (k === undefined) return tier; applyTier(k); };
  if (tierEl) {
    paintTiers();
    tierEl.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-tier]") : null; if (!b) return;
      if (CP.sfx) CP.sfx("tap"); var k = b.getAttribute("data-tier"); applyTier(k === "all" ? "all" : parseInt(k, 10));
    });
    /* se si usa un altro filtro (argomenti rapidi), il livello torna su «Tutte» */
    var tg = document.getElementById("tags");
    if (tg) tg.addEventListener("click", function () { if (tier !== "all") { tier = "all"; paintTiers(); } }, true);
    var rf = CP.resetFilters;
    if (rf) CP.resetFilters = function () { tier = "all"; paintTiers(); return rf.apply(this, arguments); };
  }

  /* ---- U2: intestazione compatta come stato normale. Il logo grande compare solo sul Percorso, alla prima apertura del giorno ---- */
  var vp = document.getElementById("view-path"), bigShown = false;
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function compact() {
    var big = false;
    if (vp && !vp.hidden && (bigShown || CP.ux.get("bigLogoDay") !== today())) { big = true; if (!bigShown) { bigShown = true; CP.ux.set("bigLogoDay", today()); } }
    else if (bigShown && vp && vp.hidden) bigShown = false;
    document.body.classList.toggle("compact", !big);
  }
  if (vp && window.MutationObserver) new MutationObserver(compact).observe(vp, { attributes: true, attributeFilter: ["hidden"] });
  compact();
})();

