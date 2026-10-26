/* Lezioni di grammatica (Frasi → 📘 Impara → Lezioni): spiegazione, schema, esempi con audio, errori tipici
   ed esercizi corretti subito. I contenuti stanno in src/data/lessons/ (un file per lezione).
   Progressi: cp-lessons-v1 = { id: { best: 0-100, done: ts della prima volta superata, seen: ts } }. */
(function () {
  var CP = window.CP, esc = CP.esc, W = CP.WORDS, root = document.getElementById("build-root");
  var KEY = "cp-lessons-v1", PASS = 80;
  var view = "list", cur = null, quiz = null;
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function prog(id) { return load()[id] || {}; }
  function mark(id, patch) { var o = load(), p = o[id] || {}; Object.keys(patch).forEach(function (k) { p[k] = patch[k]; }); o[id] = p; save(o); }
  function byId(id) { return LESSONS.filter(function (l) { return l.id === id; })[0] || null; }
  function sorted() { return LESSONS.slice().sort(function (a, b) { return (a.n || 0) - (b.n || 0); }); }

  /* una frase cinese con pinyin e toni a colori, presa dal vocabolario */
  var PUNCT = { "。": ".", "？": "?", "！": "!", "，": ",", "、": "," };
  function toks(z) { return CP.segment(z).filter(function (s) { return s.w; }).map(function (s) { return s.w.key; }); }
  function pyOf(z) {
    var out = [];
    CP.segment(z).forEach(function (s) { if (s.w) out.push(s.w.py); else if (PUNCT[s.raw]) { if (out.length) out[out.length - 1] += PUNCT[s.raw]; } });
    var py = out.join(" "); return py ? py.charAt(0).toUpperCase() + py.slice(1) : "";
  }
  function zhHTML(z, cls) { var py = pyOf(z); return '<div class="' + (cls || "ls-zh") + '"><div class="lp">' + CP.pinyinHTML(py) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(z, py) + "</div></div>"; }
  /* testo della spiegazione: **grassetto**, caratteri cinesi in evidenza */
  function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/([㐀-鿿，。？！、]+)/g, '<span class="han" lang="zh-CN">$1</span>'); }
  function isZh(o) { return /[㐀-鿿]/.test(o) && !/[a-zàèéìòù]{3}/i.test(o); }

  /* ---- elenco ---- */
  function listHTML() {
    var P = load(), done = 0;
    var cards = sorted().map(function (l) {
      var p = P[l.id] || {}, ok = (p.best || 0) >= PASS; if (ok) done++;
      return '<button type="button" class="ls-card' + (ok ? " done" : "") + '" data-ls-open="' + CP.attr(l.id) + '">' +
        '<span class="ls-n" aria-hidden="true">' + (ok ? "✓" : l.n) + "</span>" +
        '<span class="ls-t"><b>' + rich(l.title) + "</b><span class=\"small muted\">" + esc(l.goal) + "</span></span>" +
        '<span class="ls-st small">' + (p.best != null ? p.best + "%" : p.seen ? "letta" : "") + "</span></button>";
    }).join("");
    return '<p class="lede" style="margin:14px 0 4px">Studia la grammatica una regola alla volta: leggi la spiegazione, ascolta gli esempi, guarda gli errori tipici e mettiti alla prova. ' +
      "Una lezione è superata con almeno " + PASS + "% di risposte giuste.</p>" +
      '<p class="small muted" style="margin:0 0 10px">' + done + " lezioni superate su " + LESSONS.length + ".</p>" +
      '<div class="ls-list">' + cards + "</div>";
  }

  /* ---- lezione ---- */
  function lessonHTML(l) {
    var p = prog(l.id), qn = (l.quiz || []).length;
    return '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-ls-back>← Lezioni</button></div>' +
      '<article class="panel ls-lesson"><span class="tag muted small">Lezione ' + l.n + (p.best != null ? " · migliore: " + p.best + "%" : "") + "</span>" +
      "<h3>" + rich(l.title) + "</h3>" +
      '<p class="ls-goal">🎯 ' + esc(l.goal) + "</p>" +
      l.body.map(function (b) { return "<p>" + rich(b) + "</p>"; }).join("") +
      (l.pattern ? '<div class="ls-pat" aria-label="Schema">' + l.pattern.map(function (f, j) { return (j ? '<span class="ls-plus">+</span>' : "") + '<span class="fx">' + (isZh(f) ? '<span class="han" lang="zh-CN">' + esc(f) + "</span>" : esc(f)) + "</span>"; }).join("") + "</div>" : "") +
      "<h4>Esempi</h4>" + (l.ex || []).map(function (e) {
        return '<div class="ls-ex">' + zhHTML(e[0]) + '<div class="small muted" lang="it">' + esc(e[1]) + "</div>" + CP.audioBtns(e[0].replace(/[。？！，]/g, "")) + "</div>";
      }).join("") +
      ((l.traps || []).length ? "<h4>Errori tipici</h4>" + l.traps.map(function (t) {
        return '<div class="ls-trap"><div class="ls-bad">❌ <span class="han" lang="zh-CN">' + esc(t[0]) + '</span></div><div class="ls-good">✅ <span class="han" lang="zh-CN">' + esc(t[1]) + '</span></div><div class="small">' + rich(t[2]) + "</div></div>";
      }).join("") : "") +
      '<div class="acts">' + (qn ? '<button type="button" class="btn-main" data-ls-quiz style="margin:0">✏️ Esercitati (' + qn + " domande)</button>" : "") +
      ((l.ex || []).length ? '<button type="button" class="btn-s" data-ls-lab>🧪 Prova nel laboratorio</button>' : "") + "</div></article>";
  }

  /* ---- esercizi ---- */
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startQuiz(l) {
    quiz = { l: l, i: 0, score: 0, state: "play", choice: null, order: null };
    prepare();
  }
  function prepare() {
    var q = quiz.l.quiz[quiz.i]; quiz.state = "play"; quiz.choice = null; quiz.order = null;
    if (q.k === "order") {
      var t = toks(q.zh), bank = t.map(function (k, i) { return { id: i, k: k }; }), sh;
      for (var n = 0; n < 6; n++) { sh = shuffle(bank); if (sh.map(function (b) { return b.k; }).join("|") !== t.join("|")) break; }
      quiz.order = { bank: sh, pick: [] };
    }
  }
  function tileHTML(b, attr, used) { var w = W[b.k]; return '<button type="button" class="tile' + (used ? " used" : "") + '" ' + attr + (used ? " disabled" : "") + '><span class="tp">' + CP.pinyinHTML(w.py) + '</span><span class="th">' + CP.hanziHTML(w.hz, w.py) + "</span></button>"; }
  function quizHTML() {
    var l = quiz.l, q = l.quiz[quiz.i], n = l.quiz.length, h = "";
    h += '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-ls-open="' + CP.attr(l.id) + '">← ' + rich(l.title) + "</button></div>";
    h += '<div class="panel ls-quiz"><div class="ls-prog" aria-hidden="true"><i style="width:' + Math.round(quiz.i * 100 / n) + '%"></i></div>' +
      '<span class="tag muted small">Domanda ' + (quiz.i + 1) + " di " + n + " · giuste: " + quiz.score + "</span>";
    if (q.k === "order") {
      var o = quiz.order, byId = {};
      o.bank.forEach(function (b) { byId[b.id] = b; });
      h += '<p class="ask">Metti in ordine: «' + esc(q.it) + "»</p>" +
        '<div class="slot" aria-live="polite" data-empty="Tocca le tessere nell\'ordine giusto">' + o.pick.map(function (id) { return tileHTML(byId[id], 'data-ls-un="' + id + '"' + (quiz.state !== "play" ? " disabled" : "")); }).join("") + "</div>";
      if (quiz.state === "play") {
        h += '<div class="bank">' + o.bank.map(function (b) { return tileHTML(b, 'data-ls-pick="' + b.id + '"', o.pick.indexOf(b.id) >= 0); }).join("") + "</div>" +
          '<div class="acts"><button type="button" data-ls-undo' + (o.pick.length ? "" : " disabled") + '>Cancella</button><button type="button" class="btn-main" data-ls-check style="margin:0"' + (o.pick.length === o.bank.length ? "" : " disabled") + ">Controlla</button></div>";
      } else {
        h += quiz.state === "ok" ? '<p class="verdict ok">Giusto!</p>' : '<p class="verdict ko">Non ancora. La frase giusta è:</p>' + zhHTML(q.zh.replace(/[。？！]$/, "")) ;
        h += '<div class="acts">' + CP.audioBtns(q.zh) + '<button type="button" class="btn-main" data-ls-next style="margin:0">' + (quiz.i + 1 < n ? "Avanti" : "Risultato") + "</button></div>";
      }
    } else {
      h += '<p class="ask">' + rich(q.q) + "</p>" + (q.zh ? zhHTML(q.zh) : "");
      h += '<div class="ls-opts" role="group" aria-label="Risposte">' + q.opts.map(function (op, j) {
        var cls = quiz.state === "play" ? "" : j === q.a ? " right" : j === quiz.choice ? " wrong" : " off";
        return '<button type="button" class="ls-opt' + cls + '" data-ls-opt="' + j + '"' + (quiz.state !== "play" ? " disabled" : "") + ">" + (isZh(op) ? zhHTML(op, "ls-zh in") : '<span lang="it">' + rich(op) + "</span>") + "</button>";
      }).join("") + "</div>";
      if (quiz.state !== "play") {
        h += (quiz.state === "ok" ? '<p class="verdict ok">Giusto!' : '<p class="verdict ko">Non è questa.') + (q.why ? " " + rich(q.why) : "") + "</p>" +
          '<div class="acts"><button type="button" class="btn-main" data-ls-next style="margin:0">' + (quiz.i + 1 < n ? "Avanti" : "Risultato") + "</button></div>";
      }
    }
    return h + "</div>";
  }
  function resultHTML() {
    var l = quiz.l, n = l.quiz.length, pct = Math.round(quiz.score * 100 / n), ok = pct >= PASS;
    return '<div class="panel ls-quiz" style="margin-top:14px"><h3>' + (ok ? "🎉 Lezione superata!" : "Quasi!") + "</h3>" +
      "<p>" + quiz.score + " risposte giuste su " + n + " (" + pct + "%)." + (ok ? "" : " Per superare la lezione ne servono almeno " + PASS + "%: rileggi la spiegazione e riprova.") + "</p>" +
      '<div class="acts"><button type="button" class="btn-main" data-ls-quiz style="margin:0">🔁 Rifai gli esercizi</button><button type="button" class="btn-s" data-ls-open="' + CP.attr(l.id) + '">📘 Rileggi la lezione</button>' +
      '<button type="button" class="btn-s" data-ls-back>Tutte le lezioni</button>' + (ok && nextOf(l) ? '<button type="button" class="btn-s" data-ls-open="' + CP.attr(nextOf(l).id) + '">Lezione dopo →</button>' : "") + "</div></div>";
  }
  function nextOf(l) { var s = sorted(), i = s.indexOf(l); return s[i + 1] || null; }
  function finish() {
    var l = quiz.l, pct = Math.round(quiz.score * 100 / l.quiz.length), p = prog(l.id), patch = { best: Math.max(p.best || 0, pct) };
    if (pct >= PASS && !p.done) patch.done = Date.now();
    mark(l.id, patch); view = "result";
    CP.sfx(pct >= PASS ? "ok" : "tap");
  }

  function html() {
    if (view === "lesson" && cur) return lessonHTML(cur);
    if (view === "quiz" && quiz) return quizHTML();
    if (view === "result" && quiz) return resultHTML();
    return listHTML();
  }
  function paint(top) {
    var box = document.getElementById("ls-root"); if (!box) return;
    box.innerHTML = html();
    if (top) { try { box.scrollIntoView({ block: "start" }); } catch (e) {} }
  }
  function open(id) { var l = byId(id); if (!l) return; cur = l; view = "lesson"; quiz = null; mark(l.id, { seen: Date.now() }); }

  CP.subs = CP.subs || {};
  CP.subs.lessons = { render: function () { return '<div id="ls-root">' + html() + "</div>"; }, after: function () {} };
  CP.lessons = {
    list: sorted,
    open: open,
    forPath: function (secId) { return sorted().filter(function (l) { return l.path === secId; }); },
    progress: function (id) { return prog(id); }
  };

  root.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("button") : null; if (!t || !document.getElementById("ls-root") || !document.getElementById("ls-root").contains(t)) return;
    var a = function (n) { return t.getAttribute(n); };
    if (a("data-ls-open") !== null) { open(a("data-ls-open")); CP.sfx("tap"); paint(true); return; }
    if (t.hasAttribute("data-ls-back")) { view = "list"; cur = null; quiz = null; paint(true); return; }
    if (t.hasAttribute("data-ls-quiz")) { startQuiz(cur || quiz.l); cur = quiz.l; view = "quiz"; CP.sfx("tap"); paint(true); return; }
    if (t.hasAttribute("data-ls-lab")) { var ex0 = cur.ex[0][0]; if (CP.build && CP.build.labLoad) CP.build.labLoad(toks(ex0), /？$/.test(ex0) ? "?" : /！$/.test(ex0) ? "!" : "."); return; }
    if (!quiz) return;
    var q = quiz.l.quiz[quiz.i];
    if (a("data-ls-pick") !== null && quiz.state === "play") { quiz.order.pick.push(+a("data-ls-pick")); CP.sfx("tap"); paint(); return; }
    if (a("data-ls-un") !== null && quiz.state === "play") { var u = +a("data-ls-un"); quiz.order.pick = quiz.order.pick.filter(function (x) { return x !== u; }); CP.sfx("tap"); paint(); return; }
    if (t.hasAttribute("data-ls-undo")) { quiz.order.pick.pop(); paint(); return; }
    if (t.hasAttribute("data-ls-check")) {
      var by = {}; quiz.order.bank.forEach(function (b) { by[b.id] = b; });
      var got = quiz.order.pick.map(function (id) { return W[by[id].k].hz; }).join(""), want = [q.zh].concat(q.alt || []).map(CP.lab.strip);
      quiz.state = want.indexOf(got) >= 0 ? "ok" : "ko"; if (quiz.state === "ok") quiz.score++;
      CP.sfx(quiz.state === "ok" ? "ok" : "ko"); paint(); return;
    }
    if (a("data-ls-opt") !== null && quiz.state === "play") {
      quiz.choice = +a("data-ls-opt"); quiz.state = quiz.choice === q.a ? "ok" : "ko"; if (quiz.state === "ok") quiz.score++;
      CP.sfx(quiz.state === "ok" ? "ok" : "ko"); paint(); return;
    }
    if (t.hasAttribute("data-ls-next")) { if (quiz.i + 1 < quiz.l.quiz.length) { quiz.i++; prepare(); } else finish(); paint(true); return; }
  });
})();
