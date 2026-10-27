
/* Scheda "Studia": ripasso a intervalli con sessioni brevi.
   V6.7: una scheda «Oggi» con un solo pulsante; sessione a schermo pieno (CP.focusMode); carta con due soli
   controlli principali (Ascolta, Parla) e il resto in «⋯»; voti con l'intervallo vero calcolato da FSRS;
   limite giornaliero di parole nuove; fine sessione con un solo gesto. */
(function () {
  var CP = window.CP, root = document.getElementById("study-root"), esc = CP.esc;
  var cfg = { n: 10, sec: "" }, sess = null, padObj = null;
  try { var c = JSON.parse(localStorage.getItem("cp-study-cfg") || "null"); if (c) cfg = { n: c.n || 10, sec: c.sec || "" }; } catch (e) {}
  function saveCfg() { try { localStorage.setItem("cp-study-cfg", JSON.stringify(cfg)); } catch (e) {} }

  function keysOf() {
    if (cfg.sec === "__fav") return CP.ORDER.filter(function (k) { return CP.favs && CP.favs.has(k); });
    return CP.ORDER.filter(function (k) { return !cfg.sec || CP.WORDS[k].sec === cfg.sec; });
  }
  function dueKeys() {
    return CP.dueList(keysOf(), Date.now()).slice(0, 25);   /* prima le carte con la probabilita' di ricordo piu' bassa */
  }
  /* §4.2: cfg.n parole nuove AL GIORNO (non a sessione). Quante ne sono già passate oggi sta in cp-game-v1.days[oggi].nw */
  function newSeen() { return CP.game && CP.game.newToday ? CP.game.newToday() : 0; }
  function newRoom() { return Math.max(0, cfg.n + (CP.game && CP.game.newExtra ? CP.game.newExtra() : 0) - newSeen()); }
  function newKeys() { var S = CP.S(), room = newRoom(); return room ? keysOf().filter(function (k) { return !S[k] || !S[k].n; }).slice(0, room) : []; }
  function pickType(k, prev) {
    var b = (CP.S()[k] || {}).b || 0, pool = b >= 2 ? ["pi", "ip", "hp"] : ["pi", "ip"], t;
    do { t = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && t === prev);
    return t;
  }
  /* frase d'esempio per una parola nuova: la più corta tra tutte le frasi dell'app (frasi, dialoghi, lezioni, frasi
     verificate) in cui la parola compare davvero come parola (taglio in parole, non ricerca di caratteri: 中 non
     prende 中国). L'indice si costruisce una volta sola, alla prima carta. */
  var EXIDX = null;
  function exIndex() {
    if (EXIDX) return EXIDX;
    EXIDX = {};
    var add = function (py, hz, it) {
      if (!hz || !it || Array.from(hz).length > 24) return;
      var seen = {};
      CP.segment(hz).forEach(function (s) {
        if (!s.w || seen[s.w.key]) return; seen[s.w.key] = 1;
        var cur = EXIDX[s.w.key];
        if (!cur || hz.length < cur[1].length) EXIDX[s.w.key] = [py, hz, it];
      });
    };
    PHRASES.forEach(function (g) { g.items.forEach(function (x) { add(x[0], x[1], x[2]); }); });
    (typeof DIALOGS !== "undefined" ? DIALOGS : []).forEach(function (d) { d.lines.forEach(function (l) { add(l[1], l[2], l[3]); }); });
    (typeof LESSONS !== "undefined" ? LESSONS : []).forEach(function (l) { (l.ex || []).forEach(function (e) { add(null, e[0], e[1]); }); });
    (typeof VERIFIED !== "undefined" ? VERIFIED : []).forEach(function (v) { add(null, v[0], v[1]); });
    return EXIDX;
  }
  /* k: la parola della carta; se nella frase compare un suo omografo (只 zhǐ / 只 zhī) vale la lettura della carta */
  function pyOf(z, k) {
    var P = { "，": ",", "。": ".", "？": "?", "！": "!" }, out = [], me = k && CP.WORDS[k];
    CP.segment(z).forEach(function (s) { if (s.w) out.push(me && s.w.hz === me.hz ? me.py : s.w.py); else if (P[s.raw] && out.length) out[out.length - 1] += P[s.raw]; });
    var py = out.join(" "); return py ? py.charAt(0).toUpperCase() + py.slice(1) : "";
  }
  /* prima la frase scritta apposta per la parola (src/data/examples), poi quella trovata nel resto dell'app */
  function example(k) {
    var x = typeof EXAMPLES !== "undefined" && EXAMPLES[k];
    if (x) return [pyOf(x[0], k), x[0], x[1]];
    var e = exIndex()[k]; if (!e) return null;
    return e[0] ? e : [pyOf(e[1]), e[1], e[2]];
  }
  CP.exampleFor = example;
  function minutes(n) { return Math.max(1, Math.round(n * 20 / 60)); }

  /* §4.1: l'intervallo che FSRS darebbe a ogni voto, calcolato senza salvarlo (e senza il «fuzz» casuale) */
  function fmt(ms) { var d = ms / 86400000, T = CP.t; return ms < 3600000 ? T("u.min", { n: Math.max(1, Math.round(ms / 60000)) }) : d < 1 ? T("u.h", { n: Math.round(ms / 3600000) }) : d < 30 ? T("u.d", { n: Math.round(d) }) : d < 365 ? T("u.mo", { n: Math.round(d / 30) }) : T("u.y", { n: Math.round(d / 36.5) / 10 }); }
  function previewIntervals(k) {
    var S = CP.S(), r = S[k], now = Date.now(), sch = CP.srs.scheduler;
    var card = r && r.st != null ? { state: r.sd, step: r.sp, st: r.st, df: r.df, due: r.d, last: r.lr } : sch.newCard(now);
    return [1, 2, 3, 4].map(function (g) {
      var fz = sch.fuzz; sch.fuzz = false;
      var nc; try { nc = sch.review(card, g, now); } finally { sch.fuzz = fz; }
      return fmt(nc.due - now);
    });
  }
  CP.previewIntervals = previewIntervals;

  /* ---- home ---- */
  function home() {
    sess = null; CP.focusMode(false); root.classList.remove("is-card");
    var c = CP.counts(), tot = c[0] + c[1] + c[2], due = dueKeys().length, nw = newKeys().length, seen = newSeen(), n = due + nw;
    var T = CP.t, opts = '<option value="">' + T("study.allTopics") + '</option><option value="__fav"' + (cfg.sec === "__fav" ? " selected" : "") + ">" + T("study.favs") + "</option>" + SECTIONS.map(function (s) {
      return '<option value="' + s.id + '"' + (cfg.sec === s.id ? " selected" : "") + ">" + esc(s.title) + "</option>";
    }).join("");
    var ns = [5, 10, 15, 20].map(function (x) { return '<option value="' + x + '"' + (cfg.n === x ? " selected" : "") + ">" + T("study.perDay", { n: x }) + "</option>"; }).join("");
    var secName = cfg.sec === "__fav" ? T("study.favs") : cfg.sec ? (SECTIONS.filter(function (s) { return s.id === cfg.sec; })[0] || { title: "" }).title.replace(/^\d+\.\s*/, "") : "";
    root.innerHTML =
      '<div class="panel today"><div class="today-h"><h2>' + T("study.today") + "</h2>" + (secName ? '<span class="gpl">' + esc(secName) + "</span>" : "") + "</div>" +
      '<div class="today-n"><div><b>' + due + "</b><span>" + T("study.due") + "</span></div><div><b>" + nw + "</b><span>" + T(nw === 1 ? "study.new1" : "study.newN") + "</span></div></div>" +
      '<p class="small muted" style="margin:0">' + T("study.seen", { seen: Math.min(seen, cfg.n) + (seen > cfg.n ? " (+" + (seen - cfg.n) + ")" : ""), n: cfg.n }) + "</p>" +
      '<button type="button" class="btn-main" id="go"' + (n ? "" : " disabled") + ">" + (n ? T("study.start", { min: minutes(n) }) : T("study.nothing")) + "</button>" +
      '<details class="today-cfg"><summary>' + T("study.customize") + '</summary><div class="row2" style="margin-top:0"><label for="cfg-n">' + T("study.newPerDay") + '<select id="cfg-n">' + ns + "</select></label>" +
      '<label for="cfg-sec">' + T("study.topic") + '<select id="cfg-sec">' + opts + "</select></label></div>" +
      '<label class="chk"><input type="checkbox" id="cfg-auto"' + (CP.pref.auto ? " checked" : "") + "> " + T("study.auto") + "</label>" +
      (!nw && seen >= cfg.n ? '<button type="button" class="btn-s" id="more5">' + T("study.more5today") + "</button>" : "") + "</details></div>" +
      '<div class="modes"><button type="button" id="ear-open">' + T("study.ear") + "<small>" + T("study.earSub") + '</small></button><button type="button" id="sprint-open">' + T("study.sprint") + "<small>" + ((CP.game && CP.game.best()) ? T("study.record", { n: CP.game.best() }) : T("study.sprintSub")) + "</small></button></div>" +
      (CP.homeNotice ? CP.homeNotice() : "") +
      /* Task 6.3: i progressi in evidenza, con il racconto della settimana; i numeri tecnici restano sotto, in un riquadro */
      '<section class="panel progress" id="st-story"><h3>' + T("study.progress") + '</h3><div id="st-body" aria-live="polite"></div>' +
      '<div class="stats"><div class="stat"><b>' + c[0] + "</b><span>" + T("study.toLearn") + '</span></div><div class="stat"><b>' + c[1] + "</b><span>" + T("study.learning") + '</span></div><div class="stat"><b>' + c[2] + "</b><span>" + T("study.known") + "</span></div></div>" +
      '<div class="meter" aria-hidden="true"><i class="k" style="width:' + (c[2] / tot * 100) + '%"></i><i class="l" style="width:' + (c[1] / tot * 100) + '%"></i></div>' +
      '<details class="st-more"><summary>' + T("st.more") + '</summary><p class="muted small" style="margin:0">' + T("study.how", { p: Math.round(CP.srs.retention() * 100) }) + "</p>" +
      (CP.homeProgress ? CP.homeProgress() : "") + "</details></section>" +
      (CP.homeBackup ? CP.homeBackup() : "");
    if (CP.story) CP.story.html("zh").then(function (h) { var b = document.getElementById("st-body"); if (b) b.innerHTML = h; });
  }

  /* ---- sessione ---- */
  function start() {
    var q = [];
    dueKeys().forEach(function (k) { q.push({ k: k, kind: "test", type: pickType(k), retry: false }); });
    newKeys().forEach(function (k) { q.push({ k: k, kind: "intro", retry: false }); });
    if (!q.length) { home(); return; }
    sess = { q: q, words: q.length, finished: 0, revealed: false, miss: {}, first: 0, good: 0, seen: {}, hint: CP.ux.bump("swipeHints") <= 3 };
    if (CP.musicMood) CP.musicMood("focus");
    CP.focusMode(true);
    render();
  }
  function parts(w, set) {
    var h = "";
    if (set.py) h += '<div class="cd-py">' + CP.pinyinHTML(w.py) + "</div>" + CP.toneCurveHTML(w.py);
    if (set.hz) h += '<div class="cd-hz" lang="zh-CN">' + CP.hanziHTML(w.hz, w.py) + "</div>";
    if (set.it) h += '<div class="cd-it" lang="it">' + esc(w.it) + "</div>" + (w.note ? '<div class="cd-note" lang="it">' + esc(w.note) + "</div>" : "") + (w.mine ? '<div class="cd-note mine-tag">✏️ ' + T("w.mine") + "</div>" : "") + (set.py ? CP.polyNote(w) : "");
    return h;
  }
  var TAGS = { pi: "sess.qPi", ip: "sess.qIp", hp: "sess.qHp" };
  var PROMPT = { pi: { py: 1, hz: 1 }, ip: { it: 1 }, hp: { hz: 1 } };
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6L3.3 9.8l6.1-.7z"/></svg>';
  function head() {
    var pct = sess.words ? Math.round(sess.finished / sess.words * 100) : 100;
    return '<div class="sess"><button type="button" id="quit" class="btn-quiet" aria-label="' + CP.attr(CP.t("sess.quitLabel")) + '">' + CP.t("sess.quit") + "</button>" +
      '<div class="meter" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Avanzamento"><i class="k" style="width:' + pct + '%"></i></div>' +
      '<span class="cnt">' + sess.finished + " / " + sess.words + "</span>" +
      '<button type="button" id="auto-t" class="btn-quiet" aria-pressed="' + (CP.pref.auto ? "true" : "false") + '" aria-label="' + CP.attr(CP.t("sess.auto")) + '">' + (CP.pref.auto ? "🔊" : "🔇") + "</button></div>";
  }
  /* U4: in cima a destra la stella; sotto il carattere solo Ascolta e Parla; Traccia, Famiglia e Tono nel foglio «⋯» */
  function star(w) {
    var fv = CP.favs && CP.favs.has(w.key);
    return '<button type="button" class="fav-c favb' + (fv ? " on" : "") + '" data-fav-k="' + CP.attr(w.key) + '" aria-pressed="' + (fv ? "true" : "false") + '" aria-label="' + CP.attr(CP.t("sess.star")) + '">' + STAR + "</button>";
  }
  function cardTools(w, full) {
    var more = '<button type="button" class="card-more" data-more aria-label="' + CP.attr(CP.t("sess.more")) + '">⋯</button>';
    if (!full) return '<div class="card-acts">' + more + "</div>";
    var mic = CP.micBtn(w.hz).replace('class="mic"', 'class="mic big"');
    return '<div class="card-acts">' + CP.sayBtn(CP.sayHz(w)).replace('class="say"', 'class="say big"') + mic + more + "</div>";
  }
  function moreSheet() {
    if (!sess || !sess.q.length) return;
    var e = sess.q[0], w = CP.WORDS[e.k], full = e.kind === "intro" || sess.revealed;
    var row = function (act, ico, t, d) { return '<button type="button" class="sheet-row" data-card-act="' + act + '"><span class="ico" aria-hidden="true">' + ico + "</span><span><b>" + t + "</b><small>" + d + "</small></span></button>"; };
    var T = CP.t;
    CP.openSheet('<div class="fam-head"><div class="meta"><b>' + T("more.title") + '</b><div class="small muted">' + (full ? esc(w.hz) + " · " + esc(w.py) : T("more.card")) + '</div></div><button type="button" class="fam-x btn-s" data-famclose>' + T("common.close") + "</button></div>" +
      '<div class="sheet-rows">' + row("pad", "✍️", T("more.pad"), full ? T("more.padFull") : T("more.padBlind")) +
      (full ? row("fam", "🔍", T("more.fam"), T("more.famSub")) : "") +
      (full && CP.canScope && CP.canScope() ? row("scope", "〰️", T("more.tone"), T("more.toneSub")) : "") +
      (full && CP.contribOpen ? row("contrib", "✏️", T("more.contrib"), T("more.contribSub")) : "") + (full && CP.plecoRow ? CP.plecoRow(w.hz) : "") + "</div>");
  }
  function kbd() { return '<p class="kbd-hint">' + CP.t("sess.kbd") + "</p>"; }
  function togglePad(keep) {
    var fc = root.querySelector(".fc"), old = root.querySelector(".pad");
    if (old) { if (padObj) padObj.destroy(); old.parentNode.removeChild(old); padObj = null; return; }
    if (!fc || !sess.q.length) return;
    var e = sess.q[0], w = CP.WORDS[e.k];
    var ghost = (e.kind === "intro" || sess.revealed || e.type !== "ip");
    if (keep && sess.revealed) keep.guide = true;
    padObj = CP.pad(w.hz, { ghost: ghost, state: keep });
    fc.appendChild(padObj.el); padObj.mount();
    if (!keep && padObj.el.scrollIntoView) padObj.el.scrollIntoView({ block: "nearest" });
  }
  function next() {
    var e = sess.q.shift();
    if (e.kind === "intro" && !sess.seen[e.k]) { sess.seen[e.k] = 1; if (CP.game && CP.game.addNew) CP.game.addNew(1); }
    e.kind = "test"; e.type = "pi";
    sess.q.splice(Math.min(sess.q.length, 3), 0, e); render();
  }
  /* Carta trascinabile: tocco = mostra; trascina a destra = «La so», a sinistra = «Non la so». */
  CP.bindCardSwipe = function (cardEl, onReveal, onGrade, isRevealed) {
    if (!cardEl || cardEl._swipe) return; cardEl._swipe = true;
    cardEl.style.touchAction = "pan-y"; cardEl.style.cursor = "grab"; cardEl.style.userSelect = "none";
    var sx = 0, sy = 0, dx = 0, drag = false, down = false, pid = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function ignore(t) { return !!(t && t.closest && t.closest("button, canvas, .pad, .vp, a, input, select, textarea, .say, .wd, [role=\"button\"], [data-fam]")); }
    /* l'esito si vede prima del rilascio: etichetta «La so» / «Non la so» che compare con il trascinamento */
    function paint(x) {
      var k = Math.max(-1, Math.min(1, x / 140)), col = x > 0 ? "var(--accent)" : "var(--seal)";
      cardEl.style.transform = "translateX(" + x + "px) rotate(" + (x / 22) + "deg)";
      cardEl.style.borderColor = Math.abs(x) < 12 ? "" : col;
      cardEl.style.boxShadow = Math.abs(x) < 12 ? "" : "0 0 0 " + Math.round(2 + 3 * Math.abs(k)) + "px color-mix(in srgb, " + col + " " + Math.round(18 + 20 * Math.abs(k)) + "%, transparent)";
      cardEl.style.setProperty("--swipe", Math.min(1, Math.abs(x) / 75).toFixed(2));
      cardEl.style.color = "";
      cardEl.dataset.label = x > 0 ? "La so" : "Non la so";
      cardEl.classList.toggle("swipe-ko", x < 0);
    }
    function reset(animate) {
      if (animate && !reduce) { cardEl.style.transition = "transform .22s ease, box-shadow .22s ease, border-color .22s ease"; setTimeout(function () { cardEl.style.transition = ""; }, 260); }
      cardEl.style.transform = ""; cardEl.style.borderColor = ""; cardEl.style.boxShadow = ""; cardEl.style.willChange = "";
      cardEl.style.removeProperty("--swipe"); delete cardEl.dataset.label; cardEl.classList.remove("swipe-ko");
    }
    cardEl.addEventListener("pointerdown", function (e) {
      if (e.button > 0 || ignore(e.target)) return;
      down = true; drag = false; sx = e.clientX; sy = e.clientY; dx = 0; pid = e.pointerId; cardEl.style.transition = "";
    });
    cardEl.addEventListener("pointermove", function (e) {
      if (!down || e.pointerId !== pid) return;
      var mx = e.clientX - sx, my = e.clientY - sy;
      if (!drag) {
        if (Math.abs(mx) < 8) return;
        if (Math.abs(my) > Math.abs(mx) * 1.2) { down = false; return; }       /* e' uno scroll verticale */
        if (!isRevealed()) return;                                               /* si trascina solo dopo aver visto la risposta */
        drag = true; cardEl.style.willChange = "transform"; try { cardEl.setPointerCapture(pid); } catch (er) {}
      }
      dx = mx; paint(dx);
    });
    function end(e) {
      if (!down || (e && e.pointerId !== pid)) return;
      down = false;
      if (drag) {
        drag = false;
        if (Math.abs(dx) > 75) {
          var g = dx > 0 ? 2 : 0;
          if (!reduce) { cardEl.style.transition = "transform .18s ease-in, opacity .18s"; cardEl.style.transform = "translateX(" + (dx > 0 ? 420 : -420) + "px) rotate(" + (dx > 0 ? 18 : -18) + "deg)"; cardEl.style.opacity = "0"; setTimeout(function () { onGrade(g); }, 170); }
          else onGrade(g);
        } else reset(true);
        dx = 0; return;
      }
      if (e && e.type === "pointerup" && !isRevealed() && Math.abs((e.clientX || 0) - sx) < 8 && Math.abs((e.clientY || 0) - sy) < 8) onReveal();
    }
    cardEl.addEventListener("pointerup", end);
    cardEl.addEventListener("pointercancel", function () { if (drag) reset(true); drag = false; down = false; });
  };
  function gradesHTML(e) {
    var iv = previewIntervals(e.k), soon = CP.t("grade.soon"), G = function (g) { return CP.t("grade." + g); };
    /* con retry i voti 0-1 non vengono applicati: la carta torna nella sessione */
    var sub = function (g) { return e.retry && g < 2 ? soon : iv[g]; };
    return '<div class="grades">' +
      '<button type="button" data-g="0" class="g-again">' + G(0) + '<span class="sub">' + sub(0) + "</span></button>" +
      '<button type="button" data-g="1">' + G(1) + '<span class="sub">' + sub(1) + "</span></button>" +
      '<button type="button" data-g="2" class="g-good">' + G(2) + '<span class="sub">' + sub(2) + "</span></button>" +
      '<button type="button" data-g="3">' + G(3) + '<span class="sub">' + sub(3) + "</span></button></div>";
  }
  /* carte ambigue: 322 gruppi di parole hanno lo stesso italiano (爸爸/爸 = papà, 但是/但 = ma, però). Nella carta
     italiano → cinese un indizio dice quale si chiede (quanti caratteri, da che tappa); dopo la risposta compaiono
     anche le altre, così chi ha pensato al sinonimo impara la coppia invece di sentirsi in errore. */
  var SAME = null;
  function sameAs(w) {
    if (!SAME) { SAME = {}; CP.ORDER.forEach(function (k) { var x = CP.WORDS[k], f = String(x.it).trim().toLowerCase(); (SAME[f] = SAME[f] || []).push(x); }); }
    return (SAME[String(w.it).trim().toLowerCase()] || []).filter(function (x) { return x !== w && x.hz !== w.hz; });
  }
  CP.sameMeaning = sameAs;
  function ambigHint(w) {
    var o = sameAs(w), T = CP.t, esc = CP.esc; if (!o.length) return "";
    var n = Array.from(w.hz).length, same = o.filter(function (x) { return Array.from(x.hz).length === n; }).length;
    var t = T("amb.len", { n: n }) + (same ? " · " + T("amb.sec", { s: '<span lang="it">' + esc(w.secTitle.replace(/^\d+\.\s*/, "")) + "</span>" }) : "");
    return '<p class="amb-hint small">💡 ' + T("amb.hint") + " " + t + "</p>";
  }
  function ambigAlso(w) {
    var o = sameAs(w), T = CP.t, esc = CP.esc; if (!o.length) return "";
    return '<p class="amb-hint small">' + T("amb.also") + " " + o.slice(0, 4).map(function (x) { return '<span class="han" lang="zh-CN">' + esc(x.hz) + "</span> " + CP.pinyinHTML(x.py); }).join(" · ") + "</p>";
  }
  function render() {
    if (!sess.q.length) return done();
    var e = sess.q[0], w = CP.WORDS[e.k], h = head(), T = CP.t, hint = sess.hint ? '<p class="swipe-hint small muted">' + T("sess.swipe") + "</p>" : "";
    var open = '<div class="panel fc enter' + (e.kind === "intro" ? " is-new" : "") + '" data-k="' + CP.attr(w.key) + '">' + star(w);
    if (e.kind === "intro") {
      var ex = example(w.key);
      h += open + '<span class="seal new-seal" aria-hidden="true">新</span><span class="tag">' + T("sess.newWord") + ' · <span lang="it">' + esc(w.secTitle.replace(/^\d+\.\s*/, "")) + "</span></span>" + CP.hskBadge(w.hz) + parts(w, { py: 1, hz: 1, it: 1 }) + cardTools(w, true) +
        (ex ? '<div class="cd-ex"><span class="tag">' + T("sess.example") + '</span><div class="lp">' + CP.pinyinHTML(ex[0]) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(ex[1], ex[0]) + '</div><div class="cd-note" lang="it">' + esc(ex[2]) + "</div></div>" : "") +
        '</div><div class="actbar"><button type="button" class="btn-main" id="next">' + T("sess.next") + "</button>" + kbd() + "</div>";
    } else if (!sess.revealed) {
      sess.t0 = Date.now();
      h += open + '<span class="tag">' + T(TAGS[e.type]) + "</span>" + parts(w, PROMPT[e.type]) + (e.type === "ip" ? ambigHint(w) : "") + cardTools(w, false) + "</div>" +
        '<div class="actbar"><button type="button" class="btn-main" id="reveal">' + T("sess.reveal") + "</button>" + kbd() + "</div>";
    } else {
      h += open + '<span class="tag">' + T(TAGS[e.type]) + "</span>" + parts(w, { py: 1, hz: 1, it: 1 }) + (e.type === "ip" ? ambigAlso(w) : "") + cardTools(w, true) + "</div>" +
        '<div class="actbar">' + gradesHTML(e) + hint + kbd() + "</div>";
    }
    root.innerHTML = h; root.classList.add("is-card");
    padObj = null;
    var fcEl = root.querySelector(".fc");
    if (fcEl && e.kind === "test") CP.bindCardSwipe(fcEl, function () { var rv = document.getElementById("reveal"); if (rv) rv.click(); }, function (g) { answer(g); }, function () { return !!sess.revealed; });
    if (CP.pref.auto && (e.kind === "intro" || sess.revealed)) CP.say(CP.sayHz(w), root.querySelector(".say"));
  }
  function answer(g) {
    if (CP.pref.sfx) CP.sfx(g >= 2 ? "ok" : g === 1 ? "tap" : "ko"); else CP.haptic(8);
    var e = sess.q.shift();
    CP.grade(e.k, g, e.retry, { ms: Math.min(60000, Date.now() - (sess.t0 || Date.now())), type: e.type });
    if (g >= 2) sess.good++;
    if (g < 2) {
      sess.miss[e.k] = 1;
      e.retry = true; e.type = pickType(e.k, e.type);
      sess.q.splice(Math.min(sess.q.length, g === 0 ? 3 : 5), 0, e);
    } else {
      sess.finished++;
      if (!e.retry) sess.first++;
    }
    sess.revealed = false;
    render();
  }
  /* U8: fine sessione. Cosa è successo, cosa torna domani, la serie; un pulsante pieno e uno secondario. */
  function done() {
    var s = sess; sess = null; CP.focusMode(false); root.classList.remove("is-card");
    var S = CP.S(), d = new Date(), endTomorrow = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 2).getTime();
    var tomorrow = CP.ORDER.filter(function (k) { return S[k] && S[k].n && S[k].d > Date.now() && S[k].d < endTomorrow; }).length;
    var streak = CP.game ? CP.game.streak() : 0, miss = Object.keys(s.miss), T = CP.t;
    var moreNew = keysOf().some(function (k) { return !S[k] || !S[k].n; }), moreDue = dueKeys().length > 0;
    var list = miss.slice(0, 12).map(function (k) {
      var w = CP.WORDS[k];
      return '<div class="it2"><div><div class="lp">' + CP.pinyinHTML(w.py) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(w.hz, w.py) + '</div><div class="muted small">' + esc(w.it) + "</div></div></div>";
    }).join("");
    root.innerHTML = '<div class="panel done">' + (CP.stamp && CP.game ? CP.stamp(CP.game.rank(), true).replace('class="seal stamp', 'class="seal stamp done-seal') : "") +
      "<h2>" + T("done.title") + "</h2>" +
      '<div class="stats"><div class="stat"><b>' + s.words + "</b><span>" + T("done.words") + '</span></div><div class="stat"><b>' + s.good + "</b><span>" + T("done.good") + '</span></div><div class="stat"><b>🔥 ' + streak + "</b><span>" + T(streak === 1 ? "done.streak1" : "done.streakN") + "</span></div></div>" +
      '<p style="margin:0">' + (tomorrow ? T(tomorrow === 1 ? "done.tomorrow1" : "done.tomorrowN", { n: tomorrow }) : T("done.tomorrow0")) + "</p>" +
      (moreNew ? '<button type="button" class="btn-main" id="more5">' + T("done.more") + "</button>" : moreDue ? '<button type="button" class="btn-main" id="go">' + T("done.again") + "</button>" : "") +
      '<button type="button" class="btn-main btn-quiet" id="home">' + T("done.end") + "</button></div>" +
      (miss.length ? '<details class="panel mine"><summary>' + T("done.review", { n: miss.length }) + "</summary>" + list + "</details>" : "");
    window.scrollTo(0, 0);
  }

  /* ---- eventi ---- */
  root.addEventListener("click", function (ev) {
    var t = ev.target.closest ? ev.target.closest("button") : null;
    if (!t) return;
    var id = t.id;
    if (id === "go") start();
    else if (id === "home" || id === "quit") home();
    else if (id === "more5") { if (CP.game && CP.game.addExtra) CP.game.addExtra(5); start(); }
    else if (id === "next") { CP.sfx("tap"); next(); }
    else if (id === "reveal") { CP.sfx("tap"); var keep = padObj ? padObj.state() : null; sess.revealed = true; render(); if (keep) togglePad(keep); }
    else if (t.hasAttribute("data-more")) moreSheet();
    else if (id === "auto-t") {
      CP.setPref("auto", !CP.pref.auto);
      t.textContent = CP.pref.auto ? "🔊" : "🔇"; t.setAttribute("aria-pressed", CP.pref.auto ? "true" : "false");
    }
    else if (t.hasAttribute("data-g")) answer(parseInt(t.getAttribute("data-g"), 10));
  });
  /* le righe del foglio «⋯» */
  document.getElementById("fam").addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("[data-card-act]") : null; if (!b || !sess || !sess.q.length) return;
    var act = b.getAttribute("data-card-act"), w = CP.WORDS[sess.q[0].k], fc = root.querySelector(".fc");
    CP.closeSheet();
    if (act === "pad") togglePad();
    else if (act === "fam") CP.openFamily(w.hz);
    else if (act === "scope" && fc && CP.scopePanel) CP.scopePanel(fc, w);
    else if (act === "contrib" && CP.contribOpen) CP.contribOpen({ op: "fix", target: w.key, field: "it" });
  });
  root.addEventListener("change", function (ev) {
    if (ev.target.id === "cfg-n") { cfg.n = parseInt(ev.target.value, 10); saveCfg(); home(); var d = root.querySelector(".today-cfg"); if (d) d.open = true; }
    if (ev.target.id === "cfg-sec") { cfg.sec = ev.target.value; saveCfg(); home(); var d2 = root.querySelector(".today-cfg"); if (d2) d2.open = true; }
    if (ev.target.id === "cfg-auto") CP.setPref("auto", ev.target.checked);
  });
  document.addEventListener("keydown", function (ev) {
    if (!sess || !sess.q.length || document.getElementById("view-study").hidden) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey || CP.topSheet()) return;
    var a = document.activeElement, tag = a ? a.tagName : "";
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    /* un pulsante fuori dalla scheda tiene il suo comportamento; quelli della scheda cedono il passo alle scorciatoie */
    var inCard = !!(a && a.closest && a.closest("#study-root")), isTab = !!(a && a.classList && a.classList.contains("dtab"));
    if (tag === "BUTTON" && !inCard && !isTab) return;
    var e = sess.q[0], w = CP.WORDS[e.k], isSpace = ev.key === " " || ev.code === "Space", act = null;
    if (isSpace) act = (e.kind === "test" && !sess.revealed) ? "reveal" : "say";
    else if (ev.key === "Enter" && e.kind === "intro") act = "next";
    else if (e.kind === "test" && sess.revealed && /^[1-4]$/.test(ev.key)) act = "grade";
    if (!act) return;
    ev.preventDefault();
    if (a && a.blur && (inCard || isTab) && tag === "BUTTON") a.blur();
    if (act === "reveal") { CP.sfx("tap"); sess.revealed = true; render(); }
    else if (act === "say") CP.say(CP.sayHz(w), root.querySelector(".say"));
    else if (act === "next") { CP.sfx("tap"); next(); }
    else answer(parseInt(ev.key, 10) - 1);
  });
  /* tornando sulla scheda con una sessione aperta si torna a schermo pieno */
  CP.onStudy = function () { if (!sess) home(); else CP.focusMode(true); };
  CP.studyHome = function () { sess = null; home(); };
  CP.studyActive = function () { return !!sess; };
  CP.studyRefresh = function () { if (sess && sess.q.length) render(); };
  CP.studyStart = function () { sess = null; home(); start(); };
  CP.studyCounts = function () { return { due: dueKeys().length, nw: newKeys().length, n: cfg.n, seen: newSeen() }; };
  CP.studySection = function (id) {
    cfg.sec = id; saveCfg(); sess = null; home();
    if (dueKeys().length + newKeys().length) start();
  };
  CP.studyCfg = function (o) { if (o) { if (o.n) cfg.n = o.n; if (o.sec !== undefined) cfg.sec = o.sec; saveCfg(); if (!sess) home(); } return { n: cfg.n, sec: cfg.sec }; };
  CP.studyRoot = root;
  home();
})();

