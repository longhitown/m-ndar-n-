/* ===== màndarínō · pannello «Parla»: un solo posto per dire una parola o una frase e vedere il proprio tono.
   Prende il posto di «Registra e confronta» e dell'oscilloscopio 〰️ (prima erano due pannelli diversi, con due logiche).
   Funziona offline: tocchi il microfono, parli, si ferma da solo quando smetti. Poi mostra la tua curva sopra la forma
   dei toni, sillaba per sillaba, con l'aderenza (giudizio indicativo), e fa riascoltare te e la voce guida.
   Il cerchio intorno al microfono si allarga con il volume: si vede subito se il microfono ti sente. ===== */
(function () {
  var CP = window.CP, esc = CP.esc, T = CP.t;
  var CJK = /[㐀-鿿]/;

  /* sillabe e toni di un testo, dalle parole del vocabolario */
  function sylOf(hz) {
    var out = [];
    (CP.segment ? CP.segment(hz) : []).forEach(function (t) {
      if (t.p) return;
      if (t.w) CP.syllables(t.w.py).forEach(function (s) { out.push({ py: s, t: CP.tone(s) }); });
      else Array.from(t.raw).forEach(function (ch) { if (CJK.test(ch)) { var r = CP.readings(ch)[0]; out.push({ py: r || "?", t: r ? CP.tone(r) : 5 }); } });
    });
    return out;
  }
  /* letture di un carattere, ricavate dal vocabolario (都 → dōu, dū) */
  var RD = null;
  CP.readings = function (ch) {
    if (!RD) {
      RD = {};
      CP.ORDER.forEach(function (k) {
        var w = CP.WORDS[k], cs = Array.from(w.hz).filter(function (c) { return CJK.test(c); }), sy = CP.syllables(w.py);
        if (cs.length !== sy.length) return;
        cs.forEach(function (c, i) { var s = sy[i].toLowerCase().replace(/[^a-zǜ-ͯāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, ""); var a = RD[c] || (RD[c] = []); if (s && a.indexOf(s) < 0) a.push(s); });
      });
    }
    return RD[ch] || [];
  };
  function bare(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ü/g, "v"); }

  /* confronto del riconoscimento vocale per suono, non per carattere: 他/她/它 sono la stessa pronuncia.
     2 = stesso carattere o stessa sillaba con lo stesso tono, 1 = stessa sillaba con un altro tono, 0 = diverso */
  CP.soundMatch = function (goal, heard) {
    var g = Array.from(goal).filter(function (c) { return CJK.test(c); }), h = Array.from(heard).filter(function (c) { return CJK.test(c); });
    if (!g.length || h.length < g.length) return { level: 0 };
    var best = null;
    for (var o = 0; o + g.length <= h.length; o++) {
      var per = g.map(function (c, i) {
        var d = h[o + i]; if (c === d) return 2;
        var a = CP.readings(c), b = CP.readings(d);
        if (a.some(function (x) { return b.indexOf(x) >= 0; })) return 2;
        if (a.some(function (x) { return b.some(function (y) { return bare(x) === bare(y); }); })) return 1;
        return 0;
      });
      var sum = per.reduce(function (x, y) { return x + y; }, 0);
      if (!best || sum > best.sum) best = { sum: sum, per: per, text: h.slice(o, o + g.length).join("") };
    }
    var min = Math.min.apply(null, best.per);
    return { level: min, exact: best.text === g.join(""), text: best.text };
  };

  function css(v, fb) { return (getComputedStyle(document.documentElement).getPropertyValue(v) || fb).trim() || fb; }
  var ease = function (x) { return 1 - Math.pow(1 - x, 3); };

  /* disegno: sillabe in colonne, forma ideale come nastro (±2,5 semitoni), la tua voce sopra */
  function paint(cv, syl, live, res, prog) {
    var dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect(), W = Math.max(220, r.width), H = Math.max(120, r.height), x = cv.getContext("2d");
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    var top = 22, ph = H - top - 6, span = 15, yOf = function (s) { return top + ph / 2 - (s / span) * ph; }, n = syl.length || 1, tones = syl.map(function (s) { return s.t; }), i;
    /* colonne delle sillabe, con il pinyin colorato per tono */
    x.font = "600 13px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "top";
    for (i = 0; i < n; i++) {
      if (i % 2) { x.fillStyle = "rgba(128,128,128,0.07)"; x.fillRect(i / n * W, top, W / n, ph); }
      if (syl[i]) { x.fillStyle = css("--t" + syl[i].t, "#888"); x.fillText(syl[i].py, (i + 0.5) / n * W, 3); }
    }
    if (tones.length) {
      var band = function (lw, col) {
        x.strokeStyle = col; x.lineWidth = lw; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath();
        for (var j = 0; j <= 80; j++) { var y = yOf(CP._idealAt(tones, Math.min(0.999, j / 80))); if (j) x.lineTo(j / 80 * W, y); else x.moveTo(0, y); }
        x.stroke();
      };
      band(Math.max(6, (5 / span) * ph), "rgba(128,128,128,0.16)");
      x.setLineDash([5, 6]); band(1.5, css("--muted", "#888")); x.setLineDash([]);
    }
    var okC = css("--t2", "#1F7A3E"), koC = css("--warn", "#C77700");
    if (res && res.pts.length) {
      var last = Math.max(1, Math.floor(res.pts.length * (prog == null ? 1 : ease(prog))));
      x.lineWidth = 4; x.lineCap = "round";
      for (i = 1; i < last; i++) {
        var a = res.pts[i - 1], b = res.pts[i]; if (b.gap) continue;
        x.strokeStyle = tones.length && !b.ok ? koC : okC; x.beginPath();
        x.moveTo(a.x * W, Math.max(top, Math.min(H - 4, yOf(a.s)))); x.lineTo(b.x * W, Math.max(top, Math.min(H - 4, yOf(b.s)))); x.stroke();
      }
    } else if (live && live.length) {
      /* in diretta: la voce scorre nel tempo, attorno alla sua mediana */
      var fs = live.map(function (p) { return p.f; }).sort(function (p, q) { return p - q; }), med = fs[fs.length >> 1], dur = Math.max(1.6, live[live.length - 1].t + 0.2);
      x.strokeStyle = okC; x.lineWidth = 4; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath();
      live.forEach(function (p, k) { var px = p.t / dur * W, py = Math.max(top, Math.min(H - 4, yOf(CP._semis(p.f, med)))); if (k && p.t - live[k - 1].t < 0.12) x.lineTo(px, py); else x.moveTo(px, py); });
      x.stroke();
      var e = live[live.length - 1]; x.fillStyle = okC; x.beginPath(); x.arc(e.t / dur * W, Math.max(top, Math.min(H - 4, yOf(CP._semis(e.f, med)))), 6, 0, 7); x.fill();
    }
  }

  var NAMES = { 1: "alto e piatto (1°)", 2: "che sale (2°)", 3: "che scende e risale (3°)", 4: "che cade (4°)" };
  var MIC_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';

  /* host: dove appendere il pannello; hz: la parola o la frase; o.note: una riga sopra (es. perché non c'è il riconoscimento) */
  CP.voicePanel = function (host, hz, o) {
    o = o || {};
    var old = host.querySelector(".vp");
    if (old) { if (old._close) old._close(); return null; }
    var clean = String(hz).replace(/[^㐀-鿿]/g, ""), w = o.w || CP.homographs(hz)[0] || null, say = w ? CP.sayHz(w) : hz;
    var syl = w ? CP.syllables(w.py).map(function (s) { return { py: s, t: CP.tone(s) }; }) : sylOf(hz);
    var d = document.createElement("div"); d.className = "vp"; d.setAttribute("data-heard-host", "");
    d.innerHTML = '<div class="vp-top"><span class="han" lang="zh-CN">' + esc(clean) + "</span>" + (o.note ? '<span class="vp-note small">' + esc(o.note) + "</span>" : "") +
      '<button type="button" class="vp-x" data-vp-x aria-label="' + CP.attr(T("common.close")) + '">✕</button></div>' +
      '<canvas class="vp-cv" aria-label="Curva dell\'altezza della tua voce, sopra la forma dei toni"></canvas>' +
      '<div class="vp-ctl"><button type="button" class="vp-mic" data-vp-go aria-label="Parla">' + MIC_SVG + '</button>' +
      '<div class="vp-side"><p class="vp-st" aria-live="polite"></p><div class="vp-meter" aria-hidden="true"><i></i></div></div></div>' +
      '<div class="acts vp-acts"><button type="button" class="btn-s" data-vp-me disabled>▶ La tua voce</button><button type="button" class="btn-s" data-vp-tts>🔊 Voce guida</button><button type="button" class="btn-s" data-vp-both disabled>⇄ Una dopo l\'altra</button></div>';
    host.appendChild(d);
    var cv = d.querySelector("canvas"), st = d.querySelector(".vp-st"), go = d.querySelector("[data-vp-go]"), meter = d.querySelector(".vp-meter i");
    var me = d.querySelector("[data-vp-me]"), both = d.querySelector("[data-vp-both]"), ses = null, url = "", audio = null, res = null, anim = 0;
    function status(t, cls) { st.className = "vp-st" + (cls ? " " + cls : ""); st.innerHTML = t; }
    status("Tocca il microfono e di' <b lang=\"zh-CN\">" + esc(clean) + "</b>. Mi fermo da solo quando smetti.");
    paint(cv, syl, null, null);
    function level(v) { go.style.setProperty("--lv", v.toFixed(3)); meter.style.transform = "scaleX(" + v.toFixed(3) + ")"; }
    function playMe(then) {
      if (!url) { if (then) then(); return; }
      CP.stopSpeak(); try { if (audio) audio.pause(); } catch (e) {}
      audio = new Audio(url); var done = function () { audio.onended = audio.onerror = null; if (then) then(); };
      audio.onended = done; audio.onerror = done;
      try { var pr = audio.play(); if (pr && pr.catch) pr.catch(done); } catch (e) { done(); }
    }
    function verdict(r) {
      if (r.voiced < 6) { status("Ho sentito poca voce. Avvicina il telefono alla bocca e parla un po' più forte.", "ko"); CP.sfx("ko"); return; }
      var tag = r.score >= 70 ? "ok" : r.score >= 45 ? "mid" : "ko", h = '<span class="vp-score ' + tag + '">' + r.score + "%</span> ";
      if (syl.length === 1 && r.tone && NAMES[r.tone]) {
        var good = r.tone === syl[0].t || (syl[0].t === 5 && r.tone === 1) || r.score >= 85;   /* la curva sta nel nastro: vale più della regola */
        h += (good ? "È il tono giusto: " + (NAMES[syl[0].t] || "neutro") + "." : "La tua voce sembra " + NAMES[r.tone] + ". " + "Qui serve " + (NAMES[syl[0].t] || "un tono neutro") + ": segui il nastro grigio.");
        if (good && tag === "ko") tag = "mid";
      } else h += tag === "ok" ? "La forma combacia bene con i toni." : tag === "mid" ? "Ci sei quasi: guarda dove la linea esce dal nastro (in arancione)." : "La forma è lontana dai toni: ascolta la voce guida e riprova con calma.";
      status(h + ' <span class="muted">Giudizio indicativo.</span>', tag);
      CP.sfx(tag === "ok" ? "ok" : tag === "mid" ? "tap" : "ko");
      if (tag === "ok") { CP.haptic && CP.haptic(18); if (CP.game && CP.game.xp) CP.game.xp(1); }
    }
    function start() {
      if (ses) { ses.stop(); return; }
      CP.stopSpeak(); try { if (audio) audio.pause(); } catch (e) {}
      cancelAnimationFrame(anim); res = null;
      d.classList.add("on"); go.classList.add("listening"); go.setAttribute("aria-label", "Ferma");
      status("Un attimo: ascolto il silenzio della stanza…");
      ses = CP.pitchSession({
        maxSec: Math.min(8, 1.2 + 0.45 * syl.length),
        onFrame: function (f) {
          level(f.level);
          if (f.state === "wait") status("🔴 Ti ascolto: parla pure.");
          else if (f.state === "voice") status("🔴 Ti sento…");
          paint(cv, syl, f.pts, null);
        },
        onEnd: function (e) {
          ses = null; level(0); d.classList.remove("on"); go.classList.remove("listening"); go.setAttribute("aria-label", "Parla di nuovo");
          if (e.blob) { if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(e.blob); me.disabled = false; both.disabled = false; }
          if (e.error && e.error !== "silence") {
            var n = e.error;
            status(n === "NotAllowedError" || n === "SecurityError" ? "Il microfono è bloccato per questa pagina. Consentilo nelle impostazioni del browser (o dell'app). " + CP.frameBtn() : n === "NotFoundError" ? "Non trovo nessun microfono su questo dispositivo." : "Non riesco a usare il microfono (" + esc(n) + ").", "ko");
            if (CP.micBlocked && (n === "NotAllowedError" || n === "SecurityError")) CP.micBlocked();
            CP.sfx("ko"); return;
          }
          if (e.error === "silence") { status("Non ho sentito la voce. Controlla che il microfono non sia coperto e riprova: il cerchio si muove quando ti sente.", "ko"); return; }
          res = CP.pitchAnalyze(e.pts, syl.map(function (s) { return s.t; }));
          var t0 = performance.now();
          (function grow() { var p = Math.min(1, (performance.now() - t0) / 450); paint(cv, syl, null, res, p); if (p < 1) anim = requestAnimationFrame(grow); })();
          verdict(res);
        }
      });
    }
    d._close = function () { if (ses) ses.stop(true); ses = null; cancelAnimationFrame(anim); try { if (audio) audio.pause(); } catch (e) {} if (url) URL.revokeObjectURL(url); if (d.parentNode) d.parentNode.removeChild(d); };
    d.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
      if (b.hasAttribute("data-vp-go")) { CP.sfx("tap"); start(); }
      else if (b.hasAttribute("data-vp-x")) d._close();
      else if (b.hasAttribute("data-vp-me")) playMe(null);
      else if (b.hasAttribute("data-vp-tts")) CP.say(say, b);
      else if (b.hasAttribute("data-vp-both")) playMe(function () { setTimeout(function () { CP.speak(say, {}); }, 250); });
    });
    window.addEventListener("resize", function rs() { if (!d.parentNode) { window.removeEventListener("resize", rs); return; } if (!ses) paint(cv, syl, null, res, 1); });
    if (d.scrollIntoView) d.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (o.auto !== false) start();
    return d;
  };
  /* i nomi di prima restano, così i pulsanti esistenti aprono tutti lo stesso pannello */
  CP.recordCompare = function (host, hz, note) { return CP.voicePanel(host, hz, { note: note }); };
  CP.scopePanel = function (host, w) { return CP.voicePanel(host, w.hz, { w: w }); };
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-scope]") : null; if (!b) return;
    var w = CP.WORDS[b.getAttribute("data-scope")]; if (!w) return;
    CP.scopePanel(b.closest(".fc") || b.parentNode, w);
  });
})();
