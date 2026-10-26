/* Renderer V5: tabella VIRTUALIZZATA. Le righe non sono nel DOM finche' non servono:
   solo le sezioni vicine alla finestra vengono materializzate; le altre sono segnaposto con altezza nota. */
(function () {
  var CJK = /[㐀-鿿]/;
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  /* testo dentro un attributo HTML: protegge anche le virgolette (i dati della community non sono fidati) */
  function attr(s) { return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function tone(s) {
    var d = s.normalize("NFD");
    if (/̄/.test(d)) return 1;
    if (/́/.test(d)) return 2;
    if (/̌/.test(d)) return 3;
    if (/̀/.test(d)) return 4;
    return 5;
  }
  function syllables(py) {
    var out = [];
    py.split(" ").forEach(function (w) { w.split(/\.(?=[^\s.])/).forEach(function (s) { out.push(s); }); });
    return out;
  }
  function pinyinHTML(py) {
    return py.split(" ").map(function (w) {
      return w.split(/\.(?=[^\s.])/).map(function (s, i) {
        var lead = (i > 0 && /^[aoeAOE]/.test(s.normalize("NFD"))) ? "'" : "";
        return '<span class="t' + tone(s) + '">' + lead + esc(s) + "</span>";
      }).join("");
    }).join(" ");
  }
  function hanziHTML(hz, py) {
    var tones = syllables(py).map(tone), k = 0;
    return Array.from(hz).map(function (ch) {
      if (CJK.test(ch)) { var t = tones[k] || 5; k++; return '<span class="t' + t + '">' + ch + "</span>"; }
      return '<span class="p">' + esc(ch) + "</span>";
    }).join("");
  }
  var CP = window.CP = { esc: esc, attr: attr, tone: tone, syllables: syllables, pinyinHTML: pinyinHTML, hanziHTML: hanziHTML, t: t };
  if (LANG !== "it") applyI18n();

  /* ---- modello dati: chiave = il carattere; doppioni -> carattere#pinyin ---- */
  var WORDS = {}, ORDER = [], SEC = [];
  SECTIONS.forEach(function (s) {
    var i0 = ORDER.length;
    s.words.forEach(function (w) {
      var k = w[1];
      if (WORDS[k]) { k = w[1] + "#" + w[0]; while (WORDS[k]) k += "'"; }
      WORDS[k] = { key: k, py: w[0], hz: w[1], it: w[2], note: w[3] || "", sec: s.id, secTitle: s.title, i: ORDER.length, s: SEC.length };
      ORDER.push(k);
    });
    SEC.push({ id: s.id, title: s.title, i0: i0, i1: ORDER.length, shown: ORDER.length - i0, m: false, h: 0, sig: "" });
  });
  CP.WORDS = WORDS; CP.ORDER = ORDER; CP.SEC = SEC;
  CP.VERSION = "6.7"; CP.DATASET = "2026-10-25";

  /* ---- V6.7 · contributi della community (cp-community-contribs: un array di voci con id univoco).
     Formato della patch: { schema: "mandarino-contrib/1", app, dataset, created, author, items: [...] }.
     - fix: cambia py, it o note di una parola (target = chiave), di una frase (phr:<gruppo>:<riga>) o di una battuta (dlg:<id>:<riga>).
       Mai hz: è la chiave dei progressi in cp-srs-v1. Per un carattere sbagliato si usa flag.
     - add: una parola nuova (section, py, hz, it).   - flag: una segnalazione (target, why).
     - tr: la traduzione giusta di una frase del laboratorio (target = i caratteri della frase, new = l'italiano, old = quello
       che diceva il laboratorio): vale subito nel laboratorio di chi la scrive, con l'etichetta «✏️ tua traduzione».
     Le correzioni dell'utente si applicano subito alla sua copia, con l'etichetta «✏️ tua correzione», e si possono annullare. ---- */
  var CKEY = "cp-community-contribs", CJKONLY = /^[㐀-鿿]+$/;
  function clean(py) { var c = String(py).replace(/[!?,;:…"“”«»()（），。？！、]/g, " ").replace(/\.(?=\s|$)/g, " ").trim(); return c ? syllables(c.replace(/\s+/g, " ")) : []; }
  function cjkCount(h) { return Array.from(String(h)).filter(function (c) { return CJK.test(c); }).length; }
  function hasTone(py) { return /[̄́̌̀]/.test(String(py).normalize("NFD")); }
  function lineOf(target) {
    var m = /^(phr|dlg):([^:]+):(\d+)$/.exec(target || ""); if (!m) return null;
    if (m[1] === "phr") { var g = PHRASES[+m[2]], it = g && g.items[+m[3]]; return it ? { py: it[0], hz: it[1], it: it[2] } : null; }
    var d = (typeof DIALOGS !== "undefined" ? DIALOGS : []).filter(function (x) { return x.id === m[2]; })[0], l = d && d.lines[+m[3]];
    return l ? { py: l[1], hz: l[2], it: l[3] } : null;
  }
  function validate(it) {
    var e = [];
    if (!it || typeof it !== "object") return ["voce non valida"];
    ["target", "field", "old", "new", "why", "section", "py", "hz", "it", "author"].forEach(function (f) {
      var v = it[f]; if (v == null) return; v = String(v);
      if (/[<>]/.test(v)) e.push("«" + f + "»: niente < o > (niente HTML)");
      if (v.length > 200) e.push("«" + f + "»: al massimo 200 caratteri");
    });
    var pyOk = function (py, hz) {
      if (!String(py).trim()) return "il pinyin è vuoto";
      if (!hasTone(py)) return "il pinyin non ha segni di tono (ā á ǎ à)";
      var a = clean(py).length, b = cjkCount(hz);
      return a !== b ? "il pinyin ha " + a + " sillabe ma i caratteri sono " + b : "";
    };
    if (it.op === "fix") {
      var w = WORDS[it.target], ln = w ? null : lineOf(it.target);
      if (!w && !ln) e.push("non trovo «" + it.target + "»");
      else if (["py", "it", "note"].indexOf(it.field) < 0 || (!w && it.field === "note")) e.push("si possono correggere solo pinyin, italiano" + (w ? " e nota" : "") + " (mai i caratteri: per quelli usa «Segnala»)");
      else if (it.field === "py") { var m1 = pyOk(it.new, (w || ln).hz); if (m1) e.push(m1); }
      else if (it.field === "it" && !String(it.new || "").trim()) e.push("l'italiano è vuoto");
      if (w && it.field && String(it.new) === String((w.orig || w)[it.field] || "")) e.push("il testo nuovo è uguale a quello di adesso");
    } else if (it.op === "add") {
      if (!SEC.some(function (S) { return S.id === it.section; })) e.push("scegli una sezione");
      if (!CJKONLY.test(it.hz || "") || cjkCount(it.hz) > 8) e.push("i caratteri devono essere solo cinesi (da 1 a 8)");
      else if (WORDS[it.hz]) e.push(it.hz + " è già nel dizionario: usa «Correggi»");
      var m2 = pyOk(it.py || "", it.hz || ""); if (m2) e.push(m2);
      if (!String(it.it || "").trim()) e.push("manca l'italiano");
    } else if (it.op === "tr") {
      var z = String(it.target || "").replace(/[\s，。？！、,.!?]/g, "");
      if (!CJKONLY.test(z) || Array.from(z).length > 40) e.push("la frase deve essere in caratteri cinesi (al massimo 40)");
      if (!String(it.new || "").trim()) e.push("scrivi la traduzione italiana");
      else if (String(it.new).trim() === String(it.old || "").trim()) e.push("la traduzione è uguale a quella di adesso");
    } else if (it.op === "flag") {
      if (!it.target || (!WORDS[it.target] && !lineOf(it.target))) e.push("non trovo «" + (it.target || "") + "»");
      if (String(it.why || "").trim().length < 3) e.push("scrivi in breve che cosa non va");
    } else e.push("tipo di contributo sconosciuto");
    return e;
  }
  function cLoad() { try { var a = JSON.parse(localStorage.getItem(CKEY) || "[]"); return Array.isArray(a) ? a.filter(function (x) { return x && x.id; }) : []; } catch (e) { return []; } }
  function overlay(list) {
    /* riporta tutto all'originale, poi applica le correzioni locali in ordine di tempo */
    Object.keys(WORDS).forEach(function (k) { var w = WORDS[k]; if (w.orig) { w.py = w.orig.py; w.it = w.orig.it; w.note = w.orig.note; delete w.orig; } w.mine = false; });
    list.slice().sort(function (a, b) { return (a.t || 0) - (b.t || 0); }).forEach(function (it) {
      if (it.op !== "fix" || it.undone) return;
      var w = WORDS[it.target]; if (!w || ["py", "it", "note"].indexOf(it.field) < 0) return;
      if (!w.orig) w.orig = { py: w.py, it: w.it, note: w.note };
      w[it.field] = String(it.new); w.mine = true;
    });
  }
  CP.contrib = {
    KEY: CKEY, validate: validate, lineOf: lineOf,
    list: cLoad,
    save: function (list) { try { localStorage.setItem(CKEY, JSON.stringify(list)); } catch (e) {} overlay(list); },
    id: function () { return "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    overlay: function () { overlay(cLoad()); }
  };
  overlay(cLoad());
  var N = ORDER.length, OK = CP.OK = new Uint8Array(N); OK.fill(1);

  var STAR = '<button type="button" class="fav%ON%" aria-pressed="%PR%" aria-label="' + attr(t("w.fav")) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6L3.3 9.8l6.1-.7z"/></svg></button>';
  function rowHTML(i) {
    var k = ORDER[i], w = WORDS[k], st = CP.state ? CP.state(k) : 0, fav = !!(CP.favs && CP.favs.has(k));
    var note = (w.note ? '<span class="note">' + esc(w.note) + "</span>" : "") + (w.mine ? '<span class="note mine-tag">✏️ ' + t("w.mine") + '</span>' : "");
    return '<tr data-k="' + attr(k) + '"' + (st ? ' class="st-' + st + '"' : "") + ">" +
      '<td class="py"><span class="m m-py">' + pinyinHTML(w.py) + "</span></td>" +
      '<td class="hz" lang="zh-CN"><span class="m m-hz" lang="zh-CN">' + hanziHTML(w.hz, w.py) + "</span></td>" +
      '<td class="it"><div class="itw"><span class="m m-it" lang="it">' + esc(w.it) + note + "</span>" +
      STAR.replace("%ON%", fav ? " on" : "").replace("%PR%", fav ? "true" : "false") + "</div></td></tr>";
  }

  /* ---- scheletro delle sezioni ---- */
  var THEAD = 41, ROWH = 56, MARG = 1500, FAR = 4500;
  /* sotto i 420 px la riga va su due righe (carattere e pinyin sopra, italiano sotto): la stima iniziale decide i salti di scorrimento */
  function narrow() { return window.matchMedia && window.matchMedia("(max-width: 420px)").matches; }
  if (narrow()) { THEAD = 0; ROWH = 84; }
  var chips = "", html = "", total = N;
  SEC.forEach(function (S, si) {
    chips += '<a href="#' + S.id + '" lang="it">' + esc(S.title) + "</a>";
    html += '<section id="' + S.id + '" data-si="' + si + '"><h2><button type="button" class="sech" aria-expanded="true"><span lang="it">' + esc(S.title) + '</span> <span class="n">' + S.shown + '</span><span class="chev" aria-hidden="true"></span></button></h2>' +
      '<div class="tw" style="min-height:' + (THEAD + S.shown * ROWH) + 'px"><table><thead><tr><th>Pinyin</th><th>汉字</th><th>' + t("w.colIt") + '</th></tr></thead><tbody></tbody></table></div></section>';
  });
  chips += '<a href="#frasi">' + t("w.phrases") + "</a>";

  var ph = '<section id="frasi"><h2><button type="button" class="sech" aria-expanded="true"><span>' + t("w.phrases") + '</span><span class="chev" aria-hidden="true"></span></button></h2><p class="intro">' + t("w.phrasesIntro") + "</p>";
  PHRASES.forEach(function (g) {
    ph += '<div class="ph"><h3 lang="it">' + esc(g.title) + "</h3>" + g.items.map(function (p) {
      return '<div class="ln">' +
        '<div class="lp"><span class="m m-py">' + pinyinHTML(p[0]) + "</span></div>" +
        '<div class="lh" lang="zh-CN"><span class="m m-hz" lang="zh-CN">' + hanziHTML(p[1], p[0]) + "</span></div>" +
        '<div class="li"><span class="m m-it" lang="it">' + esc(p[2]) + "</span></div></div>";
    }).join("") + "</div>";
  });
  ph += "</section>";

  var secsEl = document.getElementById("sections");
  document.getElementById("chips").innerHTML = chips;
  secsEl.innerHTML = html + ph;
  var aboutEl = document.getElementById("about-lede"); if (aboutEl) aboutEl.innerHTML = t("set.aboutLede", { n: total });
  document.title = "màndarínō · " + total + " parole di cinese";
  SEC.forEach(function (S) { S.el = document.getElementById(S.id); S.tw = S.el.querySelector(".tw"); S.tb = S.el.querySelector("tbody"); S.nEl = S.el.querySelector("h2 .n"); });
  secsEl.style.overflowAnchor = "none";

  /* ---- materializzazione ---- */
  var searching = false;
  function wordsVisible() { var v = document.getElementById("view-words"); return !!v && !v.hidden; }
  function fill(S) {
    var out = [], i; for (i = S.i0; i < S.i1; i++) if (OK[i]) out.push(rowHTML(i));
    S.tb.innerHTML = out.join(""); S.m = true;
  }
  function estimate(S) { S.tw.style.minHeight = (THEAD + S.shown * ROWH) + "px"; }
  function mat(S) {
    if (S.m || S.el.hidden) return 0;
    if (S.el.classList.contains("closed") && !searching) return 0;
    var before = S.tw.offsetHeight;
    fill(S); S.tw.style.minHeight = "0px";
    var h = S.tw.offsetHeight; S.h = h;
    if (S.shown > 2) { var per = (h - THEAD) / S.shown; if (per > 24 && per < 220) ROWH = ROWH * 0.6 + per * 0.4; }
    return h - before;
  }
  function unmat(S) {
    if (!S.m) return;
    var h = S.tw.offsetHeight; S.tb.innerHTML = ""; S.m = false; S.tw.style.minHeight = h + "px";
  }
  var busy = false;
  function kick() {
    if (busy || !wordsVisible()) return; busy = true;
    try {
      for (var pass = 0; pass < 3; pass++) {
        var vh = window.innerHeight || 700, changed = 0, work = [];
        for (var si = 0; si < SEC.length; si++) {
          var S = SEC[si]; if (S.el.hidden) continue;
          var r = S.el.getBoundingClientRect();
          if (r.bottom > -MARG && r.top < vh + MARG) { if (!S.m) work.push([S, r, 1]); }
          else if (S.m && (r.bottom < -FAR || r.top > vh + FAR)) work.push([S, r, 0]);
        }
        /* tre fasi per passata, non una per sezione: prima si leggono tutte le altezze, poi si scrive il DOM, poi si rilegge
           una volta sola. Così il browser ricalcola l'impaginazione 2 volte per passata invece di 2 per ogni sezione. */
        work = work.filter(function (it) { return !it[2] || (!it[0].m && !(it[0].el.classList.contains("closed") && !searching)); });
        work.forEach(function (it) { it[3] = it[0].tw.offsetHeight; });
        work.forEach(function (it) {
          var S = it[0];
          if (it[2]) { fill(S); S.tw.style.minHeight = "0px"; }
          else { S.tb.innerHTML = ""; S.m = false; S.tw.style.minHeight = it[3] + "px"; }
          changed++;
        });
        var shift = 0;
        work.forEach(function (it) {
          if (!it[2]) return;
          var S = it[0], h = S.tw.offsetHeight; S.h = h;
          if (S.shown > 2) { var per = (h - THEAD) / S.shown; if (per > 24 && per < 220) ROWH = ROWH * 0.6 + per * 0.4; }
          if (it[1].bottom < 0) shift += h - it[3];     /* sezioni sopra lo schermo: si compensa lo scorrimento, una volta */
        });
        if (shift) window.scrollBy(0, shift);
        if (!changed) break;
      }
    } finally { busy = false; }
  }
  var tick = 0;
  function onScroll() { if (tick) return; tick = requestAnimationFrame(function () { tick = 0; kick(); }); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { SEC.forEach(function (S) { if (!S.m) estimate(S); }); onScroll(); });
  CP.kick = kick;
  CP.mat = function (el) { var S = el && SEC[+el.getAttribute("data-si")]; if (S) { var d = mat(S); return d; } return 0; };
  CP.matAll = function () { SEC.forEach(function (S) { if (!S.m && !S.el.hidden) { var was = S.el.classList.contains("closed"); fill(S); S.tw.style.minHeight = "0px"; } }); };
  CP.setSearching = function (v) { searching = !!v; };
  CP.invalidateHeights = function () { SEC.forEach(function (S) { if (!S.m) estimate(S); }); kick(); };
  /* stato righe: usato da refilter. Ri-renderizza solo le sezioni materializzate la cui lista di righe e' cambiata. */
  CP.applyFilter = function (secShown) {
    SEC.forEach(function (S, si) {
      var n = secShown[si], sig = "";
      var a = 0, b = 0; for (var i = S.i0; i < S.i1; i++) if (OK[i]) { a = (a * 31 + i) | 0; b = (b + i) | 0; }
      sig = n + ":" + a + ":" + b;
      var changed = sig !== S.sig; S.sig = sig; S.shown = n;
      if (S.m && changed) { fill(S); }
      else if (!S.m) estimate(S);
    });
  };
  CP.rowHTML = rowHTML;
  CP.refreshRows = function () { SEC.forEach(function (S) { if (S.m) fill(S); }); };
  /* porta in vista la riga di una parola (apre la sezione, la materializza, ci scorre) */
  CP.reveal = function (k) {
    var w = WORDS[k]; if (!w) return null;
    var S = SEC[w.s]; if (S.el.hidden) return null;
    if (S.el.classList.contains("closed")) { S.el.classList.remove("closed"); var b = S.el.querySelector(".sech"); if (b) b.setAttribute("aria-expanded", "true"); }
    mat(S);
    var tr = null; Array.prototype.some.call(S.tb.children, function (r) { if (r.getAttribute("data-k") === k) { tr = r; return true; } });
    if (tr) { tr.scrollIntoView({ block: "center" }); setTimeout(kick, 20); }
    return tr;
  };
  window.addEventListener("beforeprint", function () { CP.matAll(); });
  window.addEventListener("afterprint", function () { setTimeout(function () { SEC.forEach(function (S) { S.m = S.tb.children.length > 0; }); kick(); }, 50); });

  /* ---- controlli ---- */
  var root = document.documentElement, size = 26, mode = "";
  var valEl = document.getElementById("hz-val"), modeEl = document.getElementById("mode"), hintEl = document.getElementById("hint");
  function store(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function applySize() {
    root.style.setProperty("--hz", size + "px");
    valEl.innerHTML = '<span class="han" lang="zh-CN">字</span> ' + size;
    if (CP.invalidateHeights) { SEC.forEach(function (S) { if (S.m) S.h = 0; }); setTimeout(function () { ROWH = narrow() ? 60 + size * 0.95 : 40 + size * 0.6; CP.invalidateHeights(); }, 60); }
  }
  function applyMode() {
    document.body.classList.remove("hide-it", "hide-py", "hide-hz");
    Array.prototype.forEach.call(document.querySelectorAll(".m.shown"), function (el) { el.classList.remove("shown"); });
    if (mode) document.body.classList.add("hide-" + mode);
    hintEl.hidden = !mode;
    modeEl.value = mode;
  }
  var savedSize = parseInt(load("cp-size"), 10);
  if (savedSize >= 20 && savedSize <= 44) size = savedSize;
  var savedMode = load("cp-mode");
  if (savedMode === "it" || savedMode === "py" || savedMode === "hz") mode = savedMode;
  applySize(); applyMode();
  document.getElementById("hz-minus").addEventListener("click", function () { if (size > 20) { size -= 2; applySize(); store("cp-size", size); } });
  document.getElementById("hz-plus").addEventListener("click", function () { if (size < 44) { size += 2; applySize(); store("cp-size", size); } });
  modeEl.addEventListener("change", function () { mode = modeEl.value; applyMode(); store("cp-mode", mode); });
  document.addEventListener("click", function (e) {
    var m = e.target.closest ? e.target.closest(".m") : null;
    if (!m || !mode) return;
    if (m.classList.contains("m-" + mode)) m.classList.toggle("shown");
  });
})();

