/* ===== màndarínō · altri esercizi del corso di cinese (Task 12, T2, §12.2 e §12.5): digitazione del pinyin e del
   significato (anche nella frase a buco), abbina cinque coppie, traccia il carattere, componente (suono o significato).
   Digitazione: CP.typing confronta; pinyin senza toni o italiano con l'accento sbagliato = Difficile con la spiegazione;
   giusta al primo colpo = Bene, Facile solo se veloce e con la parola già stabile (CP.exEngine.voto). Sotto il campo i
   tasti dei toni «1 2 3 4 5» e «ü»; il campo non corregge, non mette maiuscole, Invio conferma. Gruppo ESERCIZI. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, D = CP.distract, ENG = CP.exEngine, TY = CP.typing;
  function sylls(py) { return String(py).split(/[.\s']+/).filter(Boolean); }

  /* ---- campo di digitazione ---- */
  ENG.renderers.type = {
    html: function (it) {
      var chips = it.mode === "pinyin" ? '<div class="ex-chips" role="group" aria-label="' + CP.attr(T("exm.toneKeys")) + '">' + ["1", "2", "3", "4", "5", "ü"].map(function (c) { return '<button type="button" class="ex-chip" data-ext="' + c + '">' + c + "</button>"; }).join("") + "</div>" : "";
      return '<form class="ex-type" data-ex-form autocomplete="off"><label class="sr" for="ex-in">' + esc(T(it.mode === "pinyin" ? "exm.typePy" : "exm.typeIt")) + "</label>" +
        '<input id="ex-in" type="text" inputmode="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" lang="' + (it.mode === "pinyin" ? "zh-Latn" : "it") + '" placeholder="' + CP.attr(T(it.mode === "pinyin" ? "exm.phPy" : "exm.phIt")) + '">' + chips + "</form>";
    },
    bind: function (it, root) {
      ENG.bar('<button type="button" class="btn-main" data-ex-submit>' + esc(T("exm.check")) + '</button><p class="kbd-hint">' + esc(T("exm.kbdType")) + "</p>");
      var i = root.querySelector("#ex-in"); if (i) setTimeout(function () { try { i.focus({ preventScroll: true }); } catch (e) {} }, 60);
    }
  };
  function submit() {
    var cur = ENG.current(); if (!cur || cur.done || cur.item.kind !== "type") return;
    var inp = cur.kit.root.querySelector("#ex-in"), v = inp ? inp.value : ""; if (!String(v).trim()) { if (inp) inp.focus(); return; }
    var it = cur.item, esito = it.mode === "pinyin" ? TY.comparePinyin(v, it.answer) : TY.compareIt(v, it.accept);
    var rec = CP.S()[cur.w.key] || {}, g = ENG.voto({ kind: "type", ok: esito === "esatto", esito: esito, ms: Date.now() - cur.t0, st: rec.st || 0 });
    if (inp) { inp.disabled = true; inp.classList.add(g >= 2 ? "ok" : g === 1 ? "mid" : "ko"); }
    Array.prototype.forEach.call(cur.kit.root.querySelectorAll(".ex-chip"), function (b) { b.disabled = true; });
    var shown = it.mode === "pinyin" ? sylls(it.answer).join(" ") : it.accept[0];
    var msg = esito === "esatto" ? T("exm.right") : esito === "senza-toni" ? T("exm.noTones", { a: shown }) : esito === "toni-sbagliati" ? T("exm.badTones", { a: shown }) : esito === "accento" ? T("exm.accent", { a: shown }) : esito === "quasi" ? T("exm.typo", { a: shown }) : T("exm.was", { a: shown });
    ENG.after({ ok: g >= 1, g: g, msg: msg, esito: esito });
  }
  document.addEventListener("submit", function (ev) { if (ev.target && ev.target.hasAttribute && ev.target.hasAttribute("data-ex-form")) { ev.preventDefault(); submit(); } });
  document.addEventListener("click", function (ev) {
    var cur = ENG.current(); if (!cur) return;
    var b = ev.target.closest ? ev.target.closest("[data-ex-submit], [data-ext]") : null; if (!b || !cur.kit.root.contains(b)) return;
    if (b.hasAttribute("data-ex-submit")) { submit(); return; }
    /* tasti dei toni e ü: si inseriscono dove sta il cursore, senza far sparire la tastiera */
    var inp = cur.kit.root.querySelector("#ex-in"); if (!inp || inp.disabled) return;
    ev.preventDefault();
    var s = inp.selectionStart != null ? inp.selectionStart : inp.value.length, e = inp.selectionEnd != null ? inp.selectionEnd : s, c = b.getAttribute("data-ext");
    inp.value = inp.value.slice(0, s) + c + inp.value.slice(e); try { inp.setSelectionRange(s + c.length, s + c.length); } catch (x) {}
    inp.focus({ preventScroll: true });
  });
  document.addEventListener("mousedown", function (ev) { if (ev.target.closest && ev.target.closest("[data-ext]")) ev.preventDefault(); });   /* il campo resta attivo */

  /* le alternative accettate di una glossa: «io, me», «buongiorno / salve»; le parentesi sono note, non risposta */
  function accepted(it) { return String(it).replace(/\([^)]*\)/g, " ").split(/\s*[;,/]\s*/).map(function (x) { return x.trim(); }).filter(Boolean); }
  ENG.register({ id: "scrivi-pinyin", famiglia: 2, corso: "zh", q: "exm.q.typePy",
    crea: function (w, ctx, r) {
      var listen = ctx.hasVoice() && !ctx.poly(w.hz) && r() < 0.35;
      return { kind: "type", mode: "pinyin", answer: w.py, say: CP.sayHz(w), autoSay: listen,
        prompt: listen ? '<div class="ex-listen">' + CP.sayBtn(CP.sayHz(w)).replace('class="say"', 'class="say big"') + "</div>" : '<div class="cd-hz" lang="zh-CN">' + esc(w.hz) + '</div><div class="cd-it" lang="it">' + esc(D.gloss(w.it)) + "</div>" };
    } });
  ENG.register({ id: "scrivi-significato", famiglia: 2, corso: "zh", q: "exm.q.typeIt",
    richiede: function (w) { return accepted(w.it).length > 0 && accepted(w.it)[0].length <= 24; },
    crea: function (w) { return { kind: "type", mode: "it", accept: accepted(w.it), say: CP.sayHz(w), prompt: '<div class="cd-py">' + CP.pinyinHTML(w.py) + '</div><div class="cd-hz" lang="zh-CN">' + CP.hanziHTML(w.hz, w.py) + "</div>" }; } });
  /* la frase a buco digitata: il pinyin della parola che manca */
  ENG.register({ id: "buco-scrivi", famiglia: 2, corso: "zh", q: "exm.q.holeType",
    richiede: function (w) { return !!CP.exSent && CP.exSent.forWord(w).some(function (s) { return s.it; }); },
    crea: function (w, ctx, r) {
      var L = CP.exSent.forWord(w).filter(function (s) { return s.it; }); if (!L.length) return null;
      var s = L[Math.floor(r() * Math.min(L.length, 4))], i = s.toks.findIndex(function (t) { return t.w && t.w.key === w.key; }); if (i < 0) return null;
      return { kind: "type", mode: "pinyin", answer: w.py, say: s.zh, prompt: '<div class="ex-sent" lang="zh-CN">' + CP.exSent.holed(s.toks, i) + '</div><div class="cd-note" lang="it">' + esc(s.it) + "</div>" };
    } });

  /* ---- abbina: cinque coppie caratteri ↔ significato (riscaldamento) ---- */
  ENG.register({ id: "abbina", famiglia: 0, corso: "zh", q: "exm.q.match",
    crea: function (w, ctx, r) {
      var x = D.meaning(w, ctx.pool(), ctx, r), more = x && D.meaning(x[0], ctx.pool(), ctx, r); if (!x || !more) return null;
      var seen = {}, list = [w].concat(x, more).filter(function (y) { var k = D.gloss(y.it).toLowerCase(); if (seen[y.hz] || seen[k]) return false; seen[y.hz] = seen[k] = 1; return true; }).slice(0, 5);
      if (list.length < 4) return null;
      return { kind: "match", words: list, left: D.shuffle(list.map(function (y, i) { return i; }), r), right: D.shuffle(list.map(function (y, i) { return i; }), r), done: {}, sel: null, miss: 0, mine: false, say: CP.sayHz(w), prompt: "" };
    } });
  ENG.renderers.match = {
    html: function (it) {
      var col = function (side, order) { return '<div class="ex-col">' + order.map(function (i) { var y = it.words[i], ok = it.done[i]; return '<button type="button" class="ex-m' + (ok ? " ok" : "") + (it.sel && it.sel.side === side && it.sel.i === i ? " sel" : "") + '" data-exm="' + side + ":" + i + '"' + (ok ? " disabled" : "") + (side === "l" ? ' lang="zh-CN"' : ' lang="it"') + ">" + (side === "l" ? '<span class="ex-han">' + esc(y.hz) + "</span>" : esc(D.gloss(y.it))) + (ok ? ' <span aria-hidden="true">✓</span>' : "") + "</button>"; }).join("") + "</div>"; };
      return '<div class="ex-match" role="group" aria-label="' + CP.attr(T("exm.q.match")) + '">' + col("l", it.left) + col("r", it.right) + "</div>";
    },
    redraw: function (it, root) { var m = root.querySelector(".ex-match"); if (m) { var tmp = document.createElement("div"); tmp.innerHTML = this.html(it); m.replaceWith(tmp.firstChild); } }
  };
  document.addEventListener("click", function (ev) {
    var cur = ENG.current(); if (!cur || cur.done || cur.item.kind !== "match") return;
    var b = ev.target.closest ? ev.target.closest("[data-exm]") : null; if (!b || !cur.kit.root.contains(b)) return;
    var it = cur.item, p = b.getAttribute("data-exm").split(":"), side = p[0], i = +p[1];
    if (!it.sel || it.sel.side === side) { it.sel = { side: side, i: i }; CP.sfx("tap"); }
    else {
      if (it.sel.i === i) { it.done[i] = 1; CP.sfx("ok"); }
      else { it.miss++; if (i === 0 || it.sel.i === 0) it.mine = true; b.classList.add("ko"); CP.sfx("ko"); CP.haptic([20, 40, 20]); }
      it.sel = null;
    }
    ENG.renderers.match.redraw(it, cur.kit.root);
    if (Object.keys(it.done).length === it.words.length) ENG.after({ ok: !it.mine, g: it.mine ? 0 : 2, msg: it.miss ? T("exm.matchMiss", { n: it.miss }) : T("exm.right") });
  });

  /* ---- traccia: le parole di un solo carattere, sulla lavagna dei tratti senza guida ---- */
  ENG.register({ id: "traccia", famiglia: 1, corso: "zh", q: "exm.q.trace",
    richiede: function (w) { return Array.from(w.hz).length === 1 && !!CP.pad && (!CP.strokeData || !!CP.strokeData(w.hz)); },
    crea: function (w) { return { kind: "trace", hz: w.hz, say: CP.sayHz(w), prompt: '<div class="cd-py">' + CP.pinyinHTML(w.py) + '</div><div class="cd-it" lang="it">' + esc(D.gloss(w.it)) + "</div>" }; } });
  ENG.renderers.trace = {
    html: function () { return '<div class="ex-pad"></div>'; },
    bind: function (it, root) {
      var host = root.querySelector(".ex-pad"), pad = CP.pad(it.hz, { ghost: false }); it.pad = pad;
      host.appendChild(pad.el); pad.mount();
      ENG.bar('<p class="kbd-hint">' + esc(T("exm.traceHint")) + "</p>");
      /* la lavagna ha il suo «Valuta»: quando compare il punteggio, l'esercizio si chiude e il pulsante sparisce */
      var res = pad.el.querySelector(".pad-res"), mo = new MutationObserver(function () {
        var sc = res.querySelector(".pad-score"); if (!sc) return;
        mo.disconnect(); var n = parseInt((/(\d+)%/.exec(sc.textContent) || [0, 0])[1], 10), ev = pad.el.querySelector(".pad-eval"); if (ev) ev.hidden = true;
        ENG.after({ ok: n >= 70, g: n >= 70 ? 2 : n >= 50 ? 1 : 0, msg: T("exm.traceScore", { n: n }) });
      });
      if (res) mo.observe(res, { childList: true, subtree: true });
    }
  };

  /* ---- componente: quale parte dà il suono (o il significato) di un carattere fonetico-semantico (in data/anatomy.js il
     tipo «s», con parte fonetica e semantica tra le parti del primo livello) ---- */
  function anat(w) { if (!CP.anatomy || !CP.anatomy.on() || Array.from(w.hz).length !== 1) return null; var a = CP.anatomy.get(w.hz); return a && a.type === "s" && a.phon && a.sem && a.phon !== a.sem && a.parts.indexOf(a.phon) >= 0 && a.parts.indexOf(a.sem) >= 0 ? a : null; }
  ENG.register({ id: "componente", famiglia: 1, corso: "zh", q: "exm.q.part",
    richiede: function (w) { return !!anat(w); },
    crea: function (w, ctx, r) {
      var a = anat(w); if (!a) return null;
      var sound = r() < 0.5, right = sound ? a.phon : a.sem, opts = a.parts.filter(function (p) { return p !== right; }).slice(0, 2);
      /* un intruso da un altro carattere fonetico-semantico dello stesso livello */
      var other = ctx.pool().filter(function (x) { return Array.from(x.hz).length === 1 && x.hz !== w.hz; });
      for (var n = 0; n < 40 && opts.length < 3; n++) { var y = other[Math.floor(r() * other.length)], b = y && CP.anatomy.get(y.hz); if (b && b.type === "s" && b.phon && b.phon !== right && opts.indexOf(b.phon) < 0 && a.parts.indexOf(b.phon) < 0) opts.push(b.phon); }
      if (opts.length < 2) return null;
      var o = D.options('<span class="ex-han">' + esc(right) + "</span>", opts.map(function (p) { return '<span class="ex-han">' + esc(p) + "</span>"; }), r);
      return { kind: "mc", opts: o.opts, right: o.right, lang: "zh-CN", say: CP.sayHz(w), prompt: '<div class="cd-hz" lang="zh-CN">' + esc(w.hz) + '</div><p class="ex-ask">' + esc(T(sound ? "exm.partSound" : "exm.partMeaning")) + "</p>" };
    } });
})();
