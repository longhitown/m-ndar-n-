/* ===== màndarínō · stile di ripasso (Task 12, §12.9), la parte sempre presente: ⚙️ → Avanzate → «Stile di ripasso»
   (Guidato, Misto, Classico) e CP.ex.carica(), che esegue al primo uso il gruppo ESERCIZI (tools/build.mjs, GROUPS: il
   motore degli esercizi, i distrattori, la digitazione, il percorso guidato, la lettura). Con lo stile Classico non si
   carica nulla e il ripasso è quello di sempre. Preferenza del dispositivo: cp-ex-style. ===== */
(function () {
  var CP = window.CP, K = "cp-ex-style", STYLES = ["guided", "mixed", "classic"];
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  /* EX_DEFAULT_STYLE: chi comincia ora → Guidato; chi ha già progressi → Misto. Si fissa la prima volta che serve. */
  function EX_DEFAULT_STYLE() { var s = lsGet(lsGet("cp-course") === "it" ? "cp-it-srs-v1" : "cp-srs-v1"); return s && s.length > 2 ? "mixed" : "guided"; }
  function stile() { var v = lsGet(K); if (STYLES.indexOf(v) < 0) { v = EX_DEFAULT_STYLE(); lsSet(K, v); } return v; }
  function carica(cb) { if (!CP.exEngine && window.__mdLoad && window.__mdLoad.ESERCIZI) window.__mdLoad.ESERCIZI(); if (cb) cb(CP.exEngine); return CP.exEngine; }
  CP.ex = { stile: stile, set: function (v) { if (STYLES.indexOf(v) >= 0) lsSet(K, v); }, carica: carica, STYLES: STYLES };

  /* ---- percorso guidato (Task 12, §12.6): il passo successivo, calcolato qui senza caricare il gruppo ---- */
  var DURS = [5, 10, 15], DK = "cp-ex-dur";
  function exData() { try { var o = JSON.parse(lsGet("cp-ex-v1") || "null"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function unit(id) { return (exData().units || {})[id] || null; }
  function keysOf(id) { return CP.ORDER.filter(function (k) { return CP.WORDS[k].sec === id; }); }
  function started(id) { var ks = keysOf(id), n = 0; ks.forEach(function (k) { if (CP.state(k) >= 1) n++; }); return { n: ks.length, s: n }; }
  function dlgOf(id) { return (typeof DIALOGS !== "undefined" ? DIALOGS : []).filter(function (d) { return d.sec === id; })[0] || null; }
  function dur() { var d = +lsGet(DK); return DURS.indexOf(d) >= 0 ? d : 10; }
  /* passo: «verifica» per una tappa cominciata nel percorso guidato con l'80% delle parole avviate e non ancora verificata;
     «leggi» il dialogo dopo la verifica; «impara» le parole nuove della tappa corrente; altrimenti «ripassa» */
  function prossimo(cur) {
    var S = typeof SECTIONS !== "undefined" ? SECTIONS : [], i, id, u, st;
    for (i = 0; i <= cur && i < S.length; i++) {
      id = S[i].id; u = unit(id); if (!u) continue;
      st = started(id);
      if (!(u.verifica && u.verifica.ok) && st.n && st.s / st.n >= 0.8) return { sec: id, i: i, passo: "verifica" };
      if (u.verifica && u.verifica.ok && !u.letto && dlgOf(id)) return { sec: id, i: i, passo: "leggi", dlg: dlgOf(id).id };
    }
    var c = CP.studyCounts ? CP.studyCounts() : { due: 0, room: 0 }, sec = S[cur] ? S[cur].id : "", nw = 0;
    if (sec) keysOf(sec).forEach(function (k) { if (CP.state(k) < 1) nw++; });
    var room = c.room != null ? c.room : 5;
    return { sec: sec, i: cur, passo: nw && room ? "impara" : "ripassa", nuove: Math.min(5, nw, room), ripassi: Math.min(c.due, Math.max(0, dur() * 3 - Math.min(5, nw, room) * 3)), noNew: !!nw && !room };
  }
  function guidaHTML(cur) {
    if (stile() !== "guided") return "";
    var T = CP.t, p = prossimo(cur), d = dur(), plan = [];
    if (p.passo === "impara" || p.passo === "ripassa") { if (p.ripassi) plan.push(T("gd.pR", { n: p.ripassi })); if (p.nuove) plan.push(T("gd.pN", { n: p.nuove })); }
    if (p.passo === "verifica") plan.push(T("gd.pV"));
    if (p.passo === "leggi") plan.push(T("gd.pT"));
    if (p.passo === "ripassa" && !p.ripassi) return "";   /* niente da fare: resta la carta di sempre */
    var label = T("gd." + p.passo, { n: p.nuove });
    return '<div class="panel resume gd-card"><div class="small muted">' + T("path.stage", { n: p.i + 1 }) + ' · <span lang="it">' + CP.esc(((typeof SECTIONS !== "undefined" && SECTIONS[p.i]) || { title: "" }).title.replace(/^\d+\.\s*/, "")) + "</span></div>" +
      (p.passo === "impara" || p.passo === "ripassa" ? '<div class="seg gd-dur" role="group" aria-label="' + CP.attr(T("gd.durAria")) + '">' + DURS.map(function (x) { return '<button type="button" data-gd-dur="' + x + '" aria-pressed="' + (x === d) + '"' + (x === d ? ' class="on"' : "") + ">" + T("gd.dur", { n: x }) + "</button>"; }).join("") + "</div>" : "") +
      '<button type="button" class="btn-main" data-gd-go>' + label + "</button>" +
      '<div class="small muted">' + plan.join(" · ") + (p.noNew ? " · " + T("gd.noNew") : "") + '</div><button type="button" class="linklike small" data-gd-free>' + T("gd.free") + "</button></div>";
  }
  CP.ex.prossimo = prossimo; CP.ex.guidaHTML = guidaHTML; CP.ex.unit = unit; CP.ex.dur = dur;
  CP.ex.verificata = function (id) { var u = unit(id); return !!(u && u.verifica && u.verifica.ok); };
  /* Frasi → Leggi → Testi (lettura graduata, phrases/reading.js): il gruppo si carica quando si apre */
  CP.subs = CP.subs || {};
  CP.subs.testi = { render: function () { carica(); return CP.reading ? CP.reading.render() : ""; } };
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-gd-go], [data-gd-dur], [data-gd-free]") : null; if (!b) return;
    CP.sfx("tap");
    if (b.hasAttribute("data-gd-dur")) { lsSet(DK, b.getAttribute("data-gd-dur")); if (CP.onPath) CP.onPath(); return; }
    if (b.hasAttribute("data-gd-free")) { CP.show("study"); return; }
    var cur = CP.pathCurrent ? CP.pathCurrent() : 0;
    carica(function (E) { if (E && CP.guided) CP.guided.go(prossimo(cur), dur()); });
  });
  (CP.settingsExtras = CP.settingsExtras || []).push(function () {
    var cur = stile(), T = CP.t;
    return '<details class="set-sec" id="set-exstyle"><summary>' + T("exs.title") + '</summary><div class="vbody"><div class="exs" role="radiogroup" aria-label="' + CP.attr(T("exs.title")) + '">' +
      STYLES.map(function (s) { return '<button type="button" role="radio" data-exs="' + s + '" aria-checked="' + (s === cur) + '"' + (s === cur ? ' class="on"' : "") + "><b>" + T("exs." + s) + "</b><small>" + T("exs." + s + "D") + "</small></button>"; }).join("") + "</div></div></details>";
  });
  document.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-exs]") : null; if (!b) return; CP.ex.set(b.getAttribute("data-exs")); CP.sfx("tap"); if (CP.repaintSettings) CP.repaintSettings(); });
})();
