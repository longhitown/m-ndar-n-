/* ===== ⚙️ Impostazioni: una schermata con cinque carte (Aspetto, Suoni e musica, Studio, Dati e sincronizzazione, Informazioni),
   ognuna apre una pagina propria con «Indietro»: due livelli, mai sezioni annidate (docs/ux-architettura.md). In cima c'è la ricerca.
   I moduli aggiungono le loro sezioni con CP.settingsExtras: una funzione che rende HTML (pagina «Studio») oppure
   { group: "data"|"adv"|"info", html }. La sezione finisce nella pagina del suo id (PAGE_OF) o, se non lo conosce, in quella del gruppo.
   CP.openSettings(id) accetta l'id di una sezione (set-sync, set-pleco…), di una pagina (look, sound, study, data, info)
   o i vecchi nomi dei gruppi (grp-ess, grp-data, grp-adv, grp-info).
   Si carica al primo uso di CP.openSettings o CP.repaintSettings, insieme a i18n/settings.js (tools/build.mjs, LAZYMOD);
   il pulsante ⚙️ e la lingua dei menu stanno in ui/settings.js. ===== */
(function () {
  var CP = window.CP, el = document.getElementById("settings");
  if (!el) return;
  var PAGES = ["look", "sound", "study", "data", "info"];
  /* la pagina di ogni sezione nota e l'ordine in cui compare: le sezioni dei moduli arrivano in ordine di caricamento, qui si mettono a posto */
  var ORDER = {
    look: ["set-look", "set-lang"],
    sound: ["set-sound", "vset", "set-mic-box", "set-scambio"],
    study: ["set-course", "set-exstyle", "set-level", "set-anat", "set-pleco", "set-reminder", "set-together"],
    data: ["set-sync", "set-data", "set-export", "set-contrib"],
    info: ["set-about", "set-support", "set-news", "set-privacy"]
  };
  var PAGE_OF = {}; PAGES.forEach(function (p) { ORDER[p].forEach(function (id) { PAGE_OF[id] = p; }); });
  var GROUP_PAGE = { data: "data", adv: "study", info: "info", sound: "sound" };
  /* i nomi vecchi dei gruppi e delle pagine continuano ad aprire la pagina giusta */
  var ALIAS = { "grp-ess": "look", "grp-data": "data", "grp-adv": "study", "grp-info": "info" };
  PAGES.forEach(function (p) { ALIAS[p] = p; ALIAS["page-" + p] = p; });
  /* parole in più per la ricerca, per le sezioni fisse (il resto si cerca nel testo della sezione) */
  var KW = { "set-look": "set.kwLook", "set-sound": "set.kwSound" };
  var cur = "", lastTile = null, q = document.getElementById("set-q"), tiles = document.getElementById("set-tiles"), hits = document.getElementById("set-hits"),
    back = el.querySelector("[data-set-back]"), head = document.getElementById("set-title"), card = el.querySelector(".set-card");
  function pageEl(p) { return el.querySelector('[data-set-page="' + p + '"]'); }
  function rank(p, n) { var i = ORDER[p].indexOf(n.id); return i < 0 ? 99 : i; }
  /* una sezione dei moduli arriva come <details class="set-sec"><summary>: nelle pagine è una sezione sempre aperta, con il titolo */
  function flatten(root) {
    Array.prototype.slice.call(root.querySelectorAll("details.set-sec")).forEach(function (d) {
      var s = document.createElement("section"), h = document.createElement("h3"), sum = null, i;
      for (i = 0; i < d.children.length; i++) if (d.children[i].tagName === "SUMMARY") { sum = d.children[i]; break; }
      s.className = d.className; if (d.id) s.id = d.id;
      h.className = "set-h"; h.id = (d.id || "set-x") + "-h"; if (sum) { h.innerHTML = sum.innerHTML; if (sum.hasAttribute("data-noi18n")) h.setAttribute("data-noi18n", ""); }
      s.setAttribute("aria-labelledby", h.id); s.appendChild(h);
      Array.prototype.slice.call(d.childNodes).forEach(function (n) { if (n !== sum) s.appendChild(n); });
      d.parentNode.replaceChild(s, d);
    });
  }
  /* dopo un nuovo disegno il focus torna sull'elemento che l'aveva (per id, o per il primo attributo data-) */
  function focusKey(a) {
    if (!a || !el.contains(a) || a === document.body) return "";
    if (a.id) return "#" + a.id;
    for (var i = 0; i < a.attributes.length; i++) if (a.attributes[i].name.indexOf("data-") === 0) return "[" + a.attributes[i].name + '="' + a.attributes[i].value.replace(/"/g, "") + '"]';
    return "";
  }
  function paintMic() {
    var p = document.getElementById("set-mic"), b = document.getElementById("set-mic-close"); if (!p) return;
    var info = CP.micInfo ? CP.micInfo() : { live: false };
    CP.micState().then(function (st) {
      var perm = CP.t({ granted: "mic.granted", denied: "mic.denied", prompt: "mic.prompt" }[st] || "mic.unknown");
      p.textContent = CP.t("mic.line", { p: perm, o: CP.t(info.live ? "mic.open" : "mic.closed") }) + CP.t(CP.canListen() ? "mic.sr" : "mic.nosr");
      if (b) b.disabled = !info.live;
    });
  }
  function paint() {
    var v = document.getElementById("set-sfxvol"); if (v && CP.bus) v.value = CP.bus.sfxVol();
    var ts = document.getElementById("opt-toneshapes"); if (ts) ts.checked = document.body.classList.contains("tone-shapes");
    if (CP.audioMode) Array.prototype.forEach.call(el.querySelectorAll("[data-audio-set]"), function (b) { var on = b.getAttribute("data-audio-set") === CP.audioMode(); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    /* le sezioni dei moduli si rifanno da capo a ogni disegno, ognuna al suo posto */
    var fk = focusKey(document.activeElement);
    Array.prototype.forEach.call(el.querySelectorAll("[data-extra]"), function (n) { n.parentNode.removeChild(n); });
    (CP.settingsExtras || []).forEach(function (f) {
      var g = typeof f === "function" ? "adv" : (GROUP_PAGE[f.group] ? f.group : "adv"), html = "", box = document.createElement("div");
      try { html = typeof f === "function" ? f() : f.html(); } catch (e) {}
      if (!html) return;
      box.innerHTML = html; flatten(box);
      Array.prototype.slice.call(box.children).forEach(function (n) {
        var p = PAGE_OF[n.id] || GROUP_PAGE[g], l = pageEl(p).querySelector(".set-list"), r = rank(p, n), at = null, i;
        n.setAttribute("data-extra", "");
        for (i = 0; i < l.children.length; i++) if (rank(p, l.children[i]) > r) { at = l.children[i]; break; }
        l.insertBefore(n, at);
      });
    });
    if (fk && (!document.activeElement || document.activeElement === document.body)) { var nf = el.querySelector(fk); if (nf && nf.focus) nf.focus({ preventScroll: true }); }
    paintMic();
    if (q && q.value) search();
  }
  /* ---- le pagine ---- */
  function pageName(p) { return CP.t("set.p." + p); }
  function go(page, target) {
    cur = page || "";
    document.getElementById("set-home").hidden = !!cur;
    PAGES.forEach(function (p) { pageEl(p).hidden = p !== cur; });
    back.hidden = !cur; head.textContent = cur ? pageName(cur) : CP.t("set.title");
    card.scrollTop = 0;
    if (target) {
      target.scrollIntoView({ block: "start" });
      target.classList.add("set-flash"); setTimeout(function () { target.classList.remove("set-flash"); }, 1700);
    }
  }
  /* ---- ricerca: cerca nel titolo e nel testo di ogni sezione, senza badare agli accenti ---- */
  function norm(s) { s = String(s || "").toLowerCase(); try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) {} return s; }
  function search() {
    var words = norm(q.value).split(/\s+/).filter(Boolean), out = [];
    tiles.hidden = !!words.length; hits.hidden = !words.length;
    if (!words.length) { hits.innerHTML = ""; return; }
    PAGES.forEach(function (p) {
      Array.prototype.forEach.call(pageEl(p).querySelectorAll(".set-sec"), function (s) {
        var h = s.querySelector(".set-h"), txt = norm(s.textContent + " " + (KW[s.id] ? CP.t(KW[s.id]) : ""));
        if (!s.id || !words.every(function (w) { return txt.indexOf(w) >= 0; })) return;
        out.push('<button type="button" class="set-hit" data-set-goto="' + CP.attr(s.id) + '"><b>' + CP.esc(h ? h.textContent.trim() : s.id) + "</b><small>" + CP.esc(pageName(p)) + "</small></button>");
      });
    });
    hits.innerHTML = out.length ? out.join("") : '<p class="small muted" style="margin:0">' + CP.esc(CP.t("set.noRes")) + "</p>";
  }
  function goHome(focusTile) {
    go("");
    if (focusTile && lastTile && lastTile.isConnected) lastTile.focus({ preventScroll: true });
  }
  function close() { CP.untrap(el); }
  /* Esc e il tasto Indietro di Android: prima si torna indietro di un livello, poi si chiude */
  function onEsc() {
    if (cur) goHome(true);
    else if (q && q.value) { q.value = ""; search(); q.focus({ preventScroll: true }); }
    else close();
  }
  CP.repaintSettings = paint;
  function paintLang() { Array.prototype.forEach.call(el.querySelectorAll("[data-lang-set]"), function (b) { var on = b.getAttribute("data-lang-set") === LANG; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); }); }
  CP.settingsPage = function () { return cur; };
  CP.settingsGo = function (p) { if (PAGES.indexOf(p) >= 0) go(p); };
  CP.openSettings = function (sec) {
    paint(); paintLang(); CP.trap(el, onEsc);
    var page = "", tgt = null, d = sec ? document.getElementById(sec) : null;
    if (sec && ALIAS[sec]) page = ALIAS[sec];
    else if (d && el.contains(d)) { var pg = d.closest("[data-set-page]"); if (pg) { page = pg.getAttribute("data-set-page"); tgt = d.closest(".set-sec") || d; } }
    else if (sec && PAGE_OF[sec]) page = PAGE_OF[sec];   /* la sezione non c'è (per esempio l'esportazione, prima della soglia): si apre la sua pagina */
    if (q) { q.value = ""; search(); }
    go(page, tgt);
    var x = page ? back : el.querySelector("[data-set-close]"); if (x) x.focus({ preventScroll: true });
    CP.sfx("tap");
  };
  el.addEventListener("click", function (e) {
    if (e.target === el) { close(); return; }
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    if (b.hasAttribute("data-set-close")) close();
    else if (b.hasAttribute("data-set-open")) { lastTile = b; CP.sfx("tap"); go(b.getAttribute("data-set-open")); back.focus({ preventScroll: true }); }
    else if (b.hasAttribute("data-set-back")) { CP.sfx("tap"); goHome(true); }
    else if (b.hasAttribute("data-set-goto")) {
      var sx = document.getElementById(b.getAttribute("data-set-goto")), px = sx && sx.closest("[data-set-page]");
      if (px) { lastTile = el.querySelector('[data-set-open="' + px.getAttribute("data-set-page") + '"]'); q.value = ""; search(); go(px.getAttribute("data-set-page"), sx); back.focus({ preventScroll: true }); CP.sfx("tap"); }
    }
    else if (b.hasAttribute("data-audio-set")) { CP.setAudioMode(b.getAttribute("data-audio-set")); paint(); }
    else if (b.id === "set-music") { close(); if (CP.jukeboxOpen) CP.jukeboxOpen(); }
    else if (b.id === "set-mic-close") { if (CP.micClose) CP.micClose(); CP.toast(CP.t("mic.closedToast")); paintMic(); }
    else if (b.id === "set-bk-down") { Store.backup().then(function (n) { document.getElementById("set-bk-msg").textContent = CP.t("bk.done", { n: n }); }); }
    else if (b.id === "set-bk-up") document.getElementById("set-bk-file").click();
    else if (b.id === "set-welcome") { close(); if (CP.welcome) CP.welcome(true); }
    else if (b.id === "set-selftest") { close(); location.hash = "#selftest"; }
    else if (b.hasAttribute("data-lang-set")) CP.setLang(b.getAttribute("data-lang-set"));
  });
  el.addEventListener("input", function (e) { if (e.target.id === "set-q") search(); else if (e.target.id === "set-sfxvol" && CP.bus) CP.bus.setSfxVol(parseFloat(e.target.value)); });
  el.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "set-sfxvol") CP.sfx("tap");
    else if (t.id === "set-bk-file" && t.files && t.files[0]) CP.restoreFile(t.files[0], document.getElementById("set-bk-msg"));
    else if (t.id === "opt-toneshapes") { document.body.classList.toggle("tone-shapes", t.checked); try { localStorage.setItem("cp-toneshapes", t.checked ? "1" : "0"); } catch (er) {} }
  });
  /* i testi fissi della pagina: all'avvio i nuovi testi non c'erano ancora (questo file si carica al primo uso), in cinese si ritraducono adesso */
  if (LANG !== "it") applyI18n(el);
})();
