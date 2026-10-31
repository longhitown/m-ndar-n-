
/* ===== V4a: gioco, preferiti, tag, avvisi, fonetica ===== */
(function () {
  var CP = window.CP, esc = CP.esc;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---- avviso breve ---- */
  var toastEl = document.getElementById("toast"), toastT = 0;
  /* act (facoltativo): { label, run } → un pulsante dentro lo stesso messaggio, che resta qualche secondo in più.
     Mai una finestra in più. Senza act è il messaggio di sempre. */
  CP.toast = function (msg, act) {
    toastEl.textContent = msg; toastEl.title = msg; toastEl.classList.toggle("act", !!act);
    if (act) { var b = document.createElement("button"); b.type = "button"; b.className = "btn-s toast-act"; b.textContent = act.label; b.onclick = function () { toastEl.classList.remove("on"); act.run(); }; toastEl.appendChild(b); }
    toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("on"); }, act ? 6000 : 2000);   /* U9: una riga, al massimo 2 s */
  };

  /* ---- cammino: serie di giorni, obiettivo, gradi ---- */
  /* il corso di italiano ha il suo conteggio (cp-it-game-v1), con la stessa struttura e la stessa regola d'unione */
  var IT = lsGet("cp-course") === "it", GK = IT ? "cp-it-game-v1" : "cp-game-v1";
  var RANKS = [
    { n: "Viaggiatore Curioso", z: "好奇的旅人", x: 0, c: "游" }, { n: "Apprendista dei Toni", z: "声调学徒", x: 200, c: "调" }, { n: "Custode di Caratteri", z: "汉字守护者", x: 600, c: "字" },
    { n: "Mercante di Seta", z: "丝绸商人", x: 1500, c: "丝" }, { n: "Poeta del Bambù", z: "竹林诗人", x: 3000, c: "竹" }, { n: "Maestro di Giada", z: "玉石大师", x: 6000, c: "玉" }, { n: "Saggio Mandarino", z: "柑橘智者", x: 10000, c: "贤" },
    /* oltre i 10.000 punti la strada continua; dopo l'ultimo grado, una «stagione» ogni SEASON punti */
    { n: "Calligrafo d'Inchiostro", z: "墨韵书家", x: 15000, c: "墨" }, { n: "Viandante dei Classici", z: "经典行者", x: 22000, c: "经" },
    { n: "Saggio del Fiume Giallo", z: "黄河贤者", x: 30000, c: "河" }, { n: "Maestro dei Quattro Mari", z: "四海宗师", x: 40000, c: "海" }
  ];
  var SEASON = 10000;
  function rankName(r) { return LANG === "zh" ? r.z : r.n; }
  /* la stagione oltre l'ultimo grado: 0 sotto, poi 1, 2, 3… */
  function season(xp) { var top = RANKS[RANKS.length - 1].x; return xp < top ? 0 : 1 + Math.floor((xp - top) / SEASON); }
  /* i punti sono contati per dispositivo (xpBy) sopra una base comune (base = i punti di prima della divisione):
     unendo due dispositivi (sincronizzazione, backup) per ognuno vale il conteggio più alto e la somma non conta mai due
     volte la stessa cosa. L'identità del dispositivo sta in «md-device», fuori dai dati che si esportano. */
  var DEV = (function () { var d = lsGet("md-device"); if (!d) { d = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); lsSet("md-device", d); } return d; })();
  /* pl: i punti iniziali del test di livello, { id: punti } (−1 = annullato). Non si sommano: vale il più alto, così due
     dispositivi che uniscono i dati non li contano mai due volte; un «annulla» vince sempre sull'unione */
  var G = { xp: 0, base: 0, xpBy: {}, goal: 10, days: {}, best: 0, pl: {} };
  function plBonus(pl) { var m = 0; Object.keys(pl || {}).forEach(function (k) { if (pl[k] > m) m = pl[k]; }); return m; }
  function adopt(o) {
    if (!o || typeof o !== "object") return;
    G.xpBy = (o.xpBy && typeof o.xpBy === "object") ? o.xpBy : {};
    G.base = Math.max(0, (o.xpBy ? o.base : o.xp) | 0);
    G.pl = (o.pl && typeof o.pl === "object") ? o.pl : {};
    G.xp = G.base + plBonus(G.pl); Object.keys(G.xpBy).forEach(function (k) { G.xp += Math.max(0, G.xpBy[k] | 0); });
    G.goal = [5, 10, 15, 20].indexOf(o.goal) >= 0 ? o.goal : 10;
    G.days = (o.days && typeof o.days === "object") ? o.days : {}; G.best = Math.max(0, o.best | 0);
  }
  try { adopt(JSON.parse(lsGet(GK) || "null")); } catch (e) {}
  /* primo avvio del conteggio del corso di italiano: chi aveva già studiato parte dai punti che quei progressi valgono
     (10 per parola, 30 per lezione superata) e tiene i giorni di studio già fatti (prima stavano in cp-game-v1) */
  if (IT && !lsGet(GK)) {
    try {
      var srs0 = JSON.parse(lsGet("cp-it-srs-v1") || "{}") || {}, ls0 = JSON.parse(lsGet("cp-it-lessons-v1") || "{}") || {}, old = JSON.parse(lsGet("cp-game-v1") || "null") || {};
      var nw = Object.keys(srs0).filter(function (k) { return k !== "__meta"; }).length, nl = Object.keys(ls0).filter(function (k) { return ls0[k] && ls0[k].done; }).length;
      if (nw || nl) adopt({ base: nw * 10 + nl * 30, xpBy: {}, goal: old.goal, days: old.days || {}, best: 0 });
    } catch (e) {}
  }
  function save() { lsSet(GK, JSON.stringify(G)); }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function dkey(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function rec(create) {
    var t = dkey(new Date());
    if (!G.days[t] && create) G.days[t] = { w: [], s: 0, e: 0 };
    return G.days[t] || null;
  }
  function active(r) { return !!r && !!((r.w && r.w.length) || r.s || r.e); }
  function rankIdx(xp) { var i = 0; RANKS.forEach(function (r, j) { if (xp >= r.x) i = j; }); return i; }
  /* la serie conta i giorni attivi; un giorno di riposo a settimana (da lunedì a domenica) non la spezza, purché
     non siano due di fila. Gratuito, automatico, calcolato solo dai giorni attivi: unendo due dispositivi si unisce anche lui.
     rest() dice quali giorni della serie attuale sono stati di riposo. */
  function weekKey(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7); return dkey(x); }
  function walk() {
    var d = new Date(), n = 0, rest = {}, used = {}, prevRest = false;
    if (!active(G.days[dkey(d)])) d.setDate(d.getDate() - 1);
    for (var guard = 0; guard < 4000; guard++) {
      if (active(G.days[dkey(d)])) { n++; prevRest = false; }
      else {
        var wk = weekKey(d);
        if (prevRest || used[wk] || !n && !active(G.days[dkey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))])) break;
        used[wk] = 1; rest[dkey(d)] = 1; prevRest = true;
      }
      d.setDate(d.getDate() - 1);
    }
    /* un riposo in fondo alla serie (prima del primo giorno attivo) non conta */
    var k = dkey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)); if (prevRest) delete rest[k];
    return { n: n, rest: rest };
  }
  function streak() { return walk().n; }
  function weekDots() {
    var d = new Date(), dow = (d.getDay() + 6) % 7, out = [], R = walk().rest;
    for (var i = 0; i < 7; i++) {
      var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow + i);
      out.push({ on: active(G.days[dkey(x)]), td: i === dow, rest: !!R[dkey(x)] });
    }
    return out;
  }
  function wordsToday() { var r = rec(false); return r && r.w ? r.w.length : 0; }
  /* la prima fase corre il doppio: a 200 e 300 punti si aprono Parole e Costruisci (ui/unlock.js) e chi comincia deve vederlo presto */
  var EARLY = 300;
  function award(n) {
    if (G.xp < EARLY) n *= 2;
    var b = rankIdx(G.xp), sb = season(G.xp); G.xp += n; G.xpBy[DEV] = (G.xpBy[DEV] | 0) + n; var a = rankIdx(G.xp), sa = season(G.xp);
    if (CP.onAward) try { CP.onAward(n); } catch (e) {}
    if (a > b || sa > sb) { var r = rankInfo(); CP.toast(CP.t("rank.toast", { r: r.name })); CP.sfx("level"); if (CP.onRankUp) try { CP.onRankUp(r); } catch (e) {} }
    return n;
  }
  function rankInfo() {
    var i = rankIdx(G.xp), r = RANKS[i], nx = RANKS[i + 1] || null, se = season(G.xp);
    if (!nx) {   /* oltre l'ultimo grado: la prossima stagione */
      var from = r.x + (se - 1) * SEASON, to = from + SEASON;
      return { i: i, name: rankName(r) + (se > 1 ? " · " + CP.t("rank.season", { n: se }) : ""), ch: r.c, xp: G.xp, next: to, nextName: rankName(r) + " · " + CP.t("rank.season", { n: se + 1 }), season: se, pct: Math.round((G.xp - from) / SEASON * 100) };
    }
    return { i: i, name: rankName(r), ch: r.c, xp: G.xp, next: nx.x, nextName: rankName(nx), season: 0, pct: Math.round((G.xp - r.x) / (nx.x - r.x) * 100) };
  }
  CP.stamp = function (r, lg) {
    return '<span class="seal stamp' + (lg ? " lg" : "") + (r.i === RANKS.length - 1 ? " max" : "") + '" aria-hidden="true"><svg viewBox="300 30 200 200" focusable="false"><use href="#mandarin-symbol"/></svg><b>' + r.ch + "</b></span>";
  };
  CP.game = {
    RANKS: RANKS,
    addWord: function (k) {
      var r = rec(true); if (r.w.indexOf(k) >= 0) return;
      var was = r.w.length; r.w.push(k); award(10); save();
      if (was < G.goal && r.w.length >= G.goal) { CP.toast(CP.t("goal.toast", { n: G.goal })); CP.sfx("level"); }
      ui();
    },
    sentence: function () { var r = rec(true); r.s = (r.s || 0) + 1; award(15); save(); ui(); },
    ear: function (ok) { var r = rec(true); r.e = (r.e || 0) + 1; if (ok) award(3); save(); ui(); },
    xp: function (n) { var r = rec(true); r.e = (r.e || 0) + 1; var got = award(n); save(); ui(); return got; },
    /* parole nuove introdotte oggi (nw) e permesso extra chiesto dall'utente (nx) */
    newToday: function () { var r = rec(false); return r && r.nw ? r.nw : 0; },
    addNew: function (n) { var r = rec(true); r.nw = (r.nw || 0) + n; save(); },
    newExtra: function () { var r = rec(false); return r && r.nx ? r.nx : 0; },
    addExtra: function (n) { var r = rec(true); r.nx = (r.nx || 0) + n; save(); },
    best: function () { return G.best; },
    setBest: function (v) { if (v > G.best) { G.best = v; save(); return true; } return false; },
    setGoal: function (n) { G.goal = n; save(); ui(); },
    goal: function () { return G.goal; },
    streak: streak, rest: function () { return walk().rest; }, weekDots: weekDots, days: function () { return G.days; }, wordsToday: wordsToday, rank: rankInfo,
    activeToday: function () { return active(G.days[dkey(new Date())]); },
    activeDays: function () { return Object.keys(G.days).filter(function (d) { return active(G.days[d]); }).length; },
    /* punti iniziali del test di livello: non segnano il giorno come attivo (la serie non cambia) e sostituiscono quelli di
       un test precedente */
    grant: function (n) {
      Object.keys(G.pl).forEach(function (k) { if (G.pl[k] > 0) G.pl[k] = -1; });
      if (n > 0) G.pl[DEV + "-" + Date.now().toString(36)] = n | 0;
      adopt(G); save(); ui();
    },
    granted: function () { return plBonus(G.pl); },
    ungrant: function () { Object.keys(G.pl).forEach(function (k) { G.pl[k] = -1; }); adopt(G); save(); ui(); },
    dump: function () { return JSON.parse(JSON.stringify(G)); },
    load: function (o) { adopt(o); save(); ui(); }
  };
  CP.onGrade = function (k, g) { if (g >= 1) CP.game.addWord(k); };

  var pill = document.getElementById("game-pill");
  function ui() {
    var r = rankInfo(), s = streak();
    pill.innerHTML = CP.stamp(r) + "<span>🔥 <b>" + s + "</b></span><span class=\"muted\">" + r.xp + " XP</span>";
    pill.setAttribute("aria-label", CP.t("pill.aria", { r: r.name, s: s, x: r.xp }));
    if (CP.pathDirty) CP.pathDirty();
    if (CP.unlock) CP.unlock.check();
  }
  pill.addEventListener("click", function () { CP.show("path"); });
  ui();

  /* ---- parole preferite o difficili ---- */
  var FK = "cp-fav-v1", F = {};
  try { F = JSON.parse(lsGet(FK) || "{}") || {}; } catch (e) { F = {}; }
  if (Array.isArray(F)) { var t0 = {}; F.forEach(function (k) { t0[k] = 1; }); F = t0; }
  Object.keys(F).forEach(function (k) { if (!CP.WORDS[k]) delete F[k]; });
  function saveF() { lsSet(FK, JSON.stringify(F)); }
  function paintRow(tr) {
    var b = tr.querySelector(".fav"); if (!b) return;
    var on = !!F[tr.getAttribute("data-k")];
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function paintAll() { Array.prototype.forEach.call(document.querySelectorAll("#sections tbody tr"), paintRow); }
  CP.favs = {
    has: function (k) { return !!F[k]; },
    count: function () { return Object.keys(F).length; },
    toggle: function (k) { if (F[k]) delete F[k]; else F[k] = 1; saveF(); return !!F[k]; },
    dump: function () { return Object.keys(F); },
    load: function (arr) { F = {}; (arr || []).forEach(function (k) { if (CP.WORDS[k]) F[k] = 1; }); saveF(); paintAll(); }
  };
  paintAll();
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest) return;
    var b = t.closest(".fav");
    if (b) {
      var tr = b.closest("tr"), k = tr && tr.getAttribute("data-k"); if (!k) return;
      var on = CP.favs.toggle(k); paintRow(tr); CP.sfx("tap");
      if (document.getElementById("state").value === "fav") CP.refilter();
      CP.toast(on ? "Parola segnata. La trovi in «Preferite / difficili»." : "Parola tolta dai preferiti.");
      return;
    }
    var c = t.closest("[data-fav-k]");
    if (c) {
      var kk = c.getAttribute("data-fav-k"), on2 = CP.favs.toggle(kk);
      c.classList.toggle("on", on2); c.setAttribute("aria-pressed", on2 ? "true" : "false"); if (!c.classList.contains("fav-c")) c.textContent = on2 ? "★ Segnata" : "☆ Segna";
      if (c.classList.contains("fav-c")) CP.toast(on2 ? "Parola segnata." : "Parola tolta dai preferiti.");
      CP.sfx("tap"); paintAll();
    }
  });

  /* ---- tag rapidi per argomento ---- */
  var TAGS = [
    ["🍜 Cibo", ["cibo", "cucina"]], ["🚆 Viaggi", ["viaggi", "citta", "spazio", "luoghi"]], ["🛍️ Acquisti", ["acquisti", "vestiti", "numeri"]],
    ["🏨 Hotel", ["hotel", "casa"]], ["💬 Conversazione", ["conversazione", "saluti", "risposte", "domande"]], ["📱 Digitale", ["social"]],
    ["❤️ Persone", ["persone", "famiglia", "relazioni", "stati"]], ["🕒 Tempo e meteo", ["tempo", "natura"]], ["💼 Lavoro", ["lavoro", "lavoro2", "verbi2"]],
    ["🏥 Salute", ["corpo"]], ["🎎 Cultura", ["cultura"]]
  ];
  var tagsEl = document.getElementById("tags"), tagOn = -1;
  /* lo scopo scelto nel benvenuto (cp-ux-v1.purpose) mette in evidenza i temi che gli servono */
  var SUGG = { travel: [1, 3], work: [8], family: [6, 4], curious: [10] }[CP.ux.get("purpose")] || [];
  tagsEl.innerHTML = TAGS.map(function (t, i) { return '<button type="button" data-tag="' + i + '" aria-pressed="false"' + (SUGG.indexOf(i) >= 0 ? ' class="sugg"' : "") + ">" + (SUGG.indexOf(i) >= 0 ? "⭐ " : "") + t[0] + "</button>"; }).join("");
  function paintTags() {
    Array.prototype.forEach.call(tagsEl.querySelectorAll("button"), function (b, i) { b.classList.toggle("on", i === tagOn); b.setAttribute("aria-pressed", i === tagOn ? "true" : "false"); });
  }
  tagsEl.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-tag]") : null; if (!b) return;
    var i = parseInt(b.getAttribute("data-tag"), 10);
    tagOn = (tagOn === i) ? -1 : i;
    CP.topic = tagOn >= 0 ? TAGS[tagOn][1] : null;
    paintTags(); CP.sfx("tap"); CP.refilter();
  });
  CP.resetFilters = function () {
    var q = document.getElementById("q"), st = document.getElementById("state");
    q.value = ""; st.value = ""; tagOn = -1; CP.topic = null; paintTags(); CP.refilter();
  };

  /* ---- stampa ---- */
  document.getElementById("print-btn").addEventListener("click", function () {
    /* nell'app Android window.print() non fa niente: si passa dal servizio di stampa del sistema (anche «Salva come PDF»), dopo aver disegnato tutte le righe */
    var A = window.MandarinoAndroid;
    if (A && A.print) { try { CP.matAll(); setTimeout(function () { A.print(); }, 350); } catch (e) { CP.toast("La stampa non è disponibile qui."); } return; }
    try { window.print(); } catch (e) { CP.toast("La stampa non è disponibile qui: scarica la pagina e aprila a sé."); }
  });

  /* ---- radiologia fonetica: dove l'orecchio italiano sbaglia ---- */
  var IT_PHONETICS = [
    [/^q/, "«q» non è la q di «quadro»", "Si dice come «ci» di «ciao», ma con un soffio d'aria deciso e la punta della lingua dietro i denti in basso."],
    [/^x/, "«x» non è la x di «taxi»", "Un «sc» di «sciarpa» più sottile: lingua bassa, labbra tese come in un sorriso. Nessun «ks»."],
    [/^j/, "«j» non è la j inglese", "Tra «gi» di «giro» e «ci» di «ciao», senza soffio d'aria e con la punta della lingua dietro i denti in basso."],
    [/^zh/, "«zh» non è «z»", "Come «g» di «giorno», ma con la punta della lingua piegata all'indietro verso il palato e nessun soffio d'aria."],
    [/^ch/, "«ch» non è «c» di «ciao»", "Come «c» di «cena», con la punta della lingua piegata all'indietro e un forte soffio d'aria."],
    [/^sh/, "«sh» è più scuro di «sc»", "Come «sc» di «scena», con la punta della lingua piegata all'indietro."],
    [/^r/, "«r» non è vibrata", "Non è la r italiana: lingua piegata all'indietro, come la r morbida americana, a metà con una «j» francese."],
    [/^c(?!h)/, "«c» non è «c» di «cane» né di «ciao»", "È la «zz» di «tazza» ([ts]) con un forte soffio d'aria."],
    [/^z(?!h)/, "«z» non è la z di «zero»", "È la «zz» di «pizza» ([ts]), secca e senza soffio d'aria."],
    [/^[ptk]/, "«p / t / k» soffiano", "Hanno un soffio d'aria esplosivo molto più forte dell'italiano: davanti alla bocca, un foglietto di carta deve muoversi."],
    [/^[bdg]/, "«b / d / g» non vibrano", "Non sono sonore come in «bello», «dado», «gatto»: sono «p / t / k» leggere, senza soffio d'aria."],
    [/^h/, "«h» non è muta", "Un soffio che sfrega in gola, come la «ch» tedesca di «Bach» o la «j» spagnola. L'italiano la salta, il cinese no."],
    [/^(zh|ch|sh|r|z|c|s)i$/, "La «i» qui non si dice", "È solo il suono della consonante prolungato, come un ronzio: «shi» non è «sci-i»."],
    [/ian$/, "«ian» si dice «ièn»", "La «a» è aperta come la «e» di «ieri»: «tiān» suona «tièn», non «tian»."],
    [/(ü|^[jqxy]u)/, "Qui la «u» è una «ü»", "Labbra a bacio come per dire «u», ma con la lingua nella posizione della «i»."],
    [/^[^aeiouüy]*e$/, "«e» non è la e italiana", "Suono scuro, tipo «uh»: bocca rilassata, labbra non arrotondate."],
    [/ui$/, "«ui» si dice «uei»", "«guì» suona «guèi»."],
    [/iu$/, "«iu» si dice «iou»", "«liú» suona «liòu»."],
    [/[aeiouü]ng$/, "«ng» finale", "Come la «n» di «lungo»: la lingua non tocca i denti, il suono resta nel naso."],
    [/[aeiouü]n$/, "«n» finale", "Come la «n» di «pane»: la punta della lingua tocca i denti dietro e chiude il suono."]
  ];
  var TONE_TXT = {
    1: "1° tono: alto e piatto, come una nota tenuta.", 2: "2° tono: sale, come quando dici «eh?» sorpreso.",
    3: "3° tono: scende e risale. Dentro una frase resta solo la discesa, bassa.", 4: "4° tono: cade secco, come un ordine («Basta!»).", 5: "Tono neutro: leggero e breve, senza accento."
  };
  function baseSyl(s) { return String(s).normalize("NFD").replace(/[̀́̄̌]/g, "").normalize("NFC").toLowerCase().replace(/[^a-zü]/g, ""); }
  CP.baseSyl = baseSyl;
  function matches(b) { return IT_PHONETICS.filter(function (r) { return r[0].test(b); }); }
  function trapHTML(list) {
    return list.map(function (r) { return '<div class="trap" lang="it"><b>⚠️ ' + esc(r[1]) + "</b>" + esc(r[2]) + "</div>"; }).join("");
  }
  CP.phonBlock = function (py) {
    var seen = {}, all = [];
    CP.syllables(py).forEach(function (s) {
      var b = baseSyl(s); if (seen[b]) return; seen[b] = 1;
      matches(b).forEach(function (r) { if (all.indexOf(r) < 0) all.push(r); });
    });
    if (!all.length) return "";
    return "<h4>" + CP.t("ph.traps") + "</h4>" + trapHTML(all.slice(0, 4)) +
      (all.length > 4 ? '<p class="small muted">' + CP.t("ph.more") + "</p>" : "");
  };
  CP.openPhon = function (syl, ctxHz) {
    var b = baseSyl(syl), t = CP.tone(syl), ms = matches(b);
    var ini = (b.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?/) || ["", ""])[0], fin = b.slice(ini.length);
    var h = '<div class="phon"><div class="fam-head"><div class="meta"><h3>' + CP.pinyinHTML(syl) + "</h3>" +
      '<div class="small muted">' + (ini ? CP.t("ph.ini") + " <b>" + esc(ini) + "</b> + " : "") + CP.t("ph.fin") + " <b>" + esc(fin || "—") + "</b></div></div>" +
      (ctxHz ? CP.audioBtns(ctxHz, true) : "") + '<button type="button" class="fam-x btn-s" data-famclose>' + CP.t("common.close") + '</button></div>' +
      CP.toneCurveHTML(syl) + '<p style="margin:6px 0 0" lang="it">' + esc(TONE_TXT[t]) + "</p>";
    h += ms.length ? "<h4>" + CP.t("ph.xray") + "</h4>" + trapHTML(ms) : '<div class="trap soft"><b>' + CP.t("ph.none") + "</b>" + CP.t("ph.noneSub") + "</div>";
    h += "</div>";
    CP.openSheet(h);
  };
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest) return;
    var sp = t.closest(".t1, .t2, .t3, .t4, .t5");
    if (!sp) return;
    var host = sp.closest("td.py, .cd-py, .lp, .xp, .sp");
    if (!host || sp.closest("button.tile, .tone, .tonebtns") || sp.closest(".lh, .bh, td.hz")) return;
    var m = sp.closest(".m-py");
    if (m && document.body.classList.contains("hide-py") && !m.classList.contains("shown")) return;
    var syl = sp.textContent.replace(/['’]/g, "").replace(/[!?,.]/g, "");
    if (!/[a-zA-Zü]/.test(syl)) return;
    var ctx = "", par = host.closest("tr");
    if (par) { var hh = par.querySelector(".m-hz"); ctx = hh ? hh.textContent : ""; }
    else if (host.classList.contains("cd-py")) { var c = host.closest(".fc"); var cz = c && c.querySelector(".cd-hz"); ctx = cz ? cz.textContent : ""; }
    else { var pp = host.parentNode, lh = pp && (pp.querySelector(".lh") || pp.querySelector(".bh") || pp.querySelector(".xh")); ctx = lh ? lh.textContent : ""; }
    e.preventDefault(); e.stopPropagation();
    CP.openPhon(syl, ctx.length <= 12 ? ctx : "");
  }, true);
})();


