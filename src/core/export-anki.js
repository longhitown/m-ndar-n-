/* ===== màndarínō · esportazione per Anki (sovranità dei dati). Un file a parte da store.js perché è solo formattazione
   in sola lettura (non tocca né unisce dati) e serve a pochi: così store.js resta il posto delle regole d'unione.
   File: testo UTF-8 separato da tabulazioni (.txt, tipo text/tab-separated-values), con le intestazioni che Anki legge da
   solo (#separator:tab, #html:true, #guid column:1, #tags column:7, #columns:…, #deck:…) e una riga di commento con app,
   versione e licenza dei dati. Colonne: guid · Vocabolo · Pinyin · Traduzione · Frase d'esempio · Traduzione della frase ·
   tag (livello HSK, tappa, «sicura» / «in-corso»).
   - guid: un'impronta di corso + chiave della parola, uguale su ogni dispositivo: reimportando, Anki aggiorna le note.
   - Il file porta le carte, non il calendario FSRS: in Anki le parole ripartono dall'inizio (i tag aiutano a filtrare).
     Un .apkg con il calendario è fuori portata.
   - Corso di italiano: le parole di CP.itLexicon; per i verbi il presente prodotto dalle regole dell'app (CP.ita), non da
     Morph-it! (che a runtime non c'è). Genere e articolo vengono dal lessico (Morph-it!, LGPL): l'intestazione lo cita.
   Chi lo vede: solo chi ha studiato molto (ANKI_MIN parole iniziate o ripassi), in ⚙️ → Dati e privacy → «Altre opzioni di
   esportazione», con due conferme. Il file si salva con Store.download, come il backup: nessuna rete. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc;
  var ANKI_MIN = 400;   /* parole iniziate o ripassi: sotto, la voce non compare */
  var IT = (function () { try { return localStorage.getItem("cp-course") === "it"; } catch (e) { return false; } })();
  /* FNV-1a a 32 bit con due semi: un guid corto e stabile */
  function fnv(s, h) { for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function guid(course, key) { var s = course + ":" + key; return "md" + fnv(s, 2166136261).toString(36) + fnv(s, 84696351).toString(36); }
  /* un campo: testo semplice → HTML sicuro su una riga (il file dice #html:true) */
  function cell(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\t\r\n]+/g, " ").trim(); }
  /* il pinyin come lo mostra l'app (words/table.js): sillabe unite, apostrofo davanti a a/o/e (xī'ān) */
  function py(p) { return String(p || "").split(" ").map(function (w) { return w.split(/\.(?=[^\s.])/).map(function (x, i) { return (i > 0 && /^[aoeAOE]/.test(x.normalize("NFD")) ? "'" : "") + x; }).join(""); }).join(" "); }
  function tag(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase(); }
  function itSrs() { try { var o = JSON.parse(localStorage.getItem("cp-it-srs-v1") || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function itSure(r) { return !!(r && r.c && r.c.state === FSRS.REVIEW && r.c.st >= 4); }
  /* quanto si è studiato: { words, reviews } */
  function studied() {
    var w = 0, n = 0;
    if (IT) { var S = itSrs(); Object.keys(S).forEach(function (k) { if (k !== "__meta" && S[k] && S[k].n) { w++; n += S[k].n; } }); }
    else { var Z = CP.S(); Object.keys(Z).forEach(function (k) { if (Z[k] && Z[k].n) { w++; n += Z[k].n; } }); }
    return { words: w, reviews: n };
  }
  function allowed() { var s = studied(); return s.words >= ANKI_MIN || s.reviews >= ANKI_MIN; }
  var COLS = ["guid", "Vocabolo", "Pinyin", "Traduzione", "Frase", "Traduzione frase", "tags"];
  function head(deck, extra) {
    return ["#separator:tab", "#html:true", "#guid column:1", "#tags column:7", "#columns:" + COLS.join("\t"), "#deck:" + deck,
      "# màndarínō " + CP.VERSION + " · contenuti CC BY 4.0, Claudio Longhitano" + (extra || "")].join("\n");
  }
  /* o = { which: "mine" | "all" | "sure" | "sec", sec } */
  function rowsZh(o) {
    var out = [];
    CP.ORDER.forEach(function (k) {
      var w = CP.WORDS[k]; if (!w) return;
      var st = CP.state(k);
      if (o.which === "mine" && !st) return;
      if (o.which === "sure" && st !== 2) return;
      if (o.which === "sec" && w.sec !== o.sec) return;
      var ex = CP.exampleFor ? CP.exampleFor(k) : null, lv = CP.hsk(w.hz);
      out.push([guid("zh", k), cell(w.hz), cell(py(w.py)), cell(w.it) + (w.note ? "<br><small>" + cell(w.note) + "</small>" : ""),
        ex ? cell(ex[1]) + "<br>" + cell(py(ex[0])) : "", ex ? cell(ex[2]) : "",
        ["mandarino", lv ? "hsk" + lv : "hsk_plus", "tappa::" + tag(w.sec), st === 2 ? "sicura" : st ? "in-corso" : "nuova"].join(" ")].join("\t"));
    });
    return out;
  }
  function itExample(e) { var k = e.ex || String(e.id).replace(/^it:\w:/, ""), x = typeof EXAMPLES !== "undefined" && EXAMPLES[k]; return x ? { it: x[1], zh: x[0] } : null; }
  function rowsIt(o) {
    var S = itSrs(), L = CP.itLexicon ? CP.itLexicon() : [], out = [], P = ["io", "tu", "lui/lei", "noi", "voi", "loro"];
    L.forEach(function (e) {
      var r = S[e.id], st = r && r.n ? (itSure(r) ? 2 : 1) : 0;
      if (o.which === "mine" && !st) return;
      if (o.which === "sure" && st !== 2) return;
      var word = cell(e.it);
      if (e.kind === "verb" && CP.ita) { try { word += "<br><small>" + P.map(function (p, i) { return cell(p + " " + CP.ita.present(e.it, i)); }).join(", ") + "</small>"; } catch (x) {} }
      var ex = itExample(e);
      out.push([guid("it", e.id), word, cell(py(e.py)), cell(e.zh), ex ? cell(ex.it) : "", ex ? cell(ex.zh) : "",
        ["mandarino-it", tag(e.kind) || "parola", st === 2 ? "sicura" : st ? "in-corso" : "nuova"].join(" ")].join("\t"));
    });
    return out;
  }
  /* il testo del file: { text, n } */
  function build(o, course) {
    o = o || { which: "mine" };
    var it = course ? course === "it" : IT, rows = it ? rowsIt(o) : rowsZh(o);
    var deck = it ? "màndarínō::意大利语" : "màndarínō::cinese";
    return { text: head(deck, it ? " · genere e articolo da Morph-it! (Zanchetta e Baroni, LGPL)" : "") + "\n" + rows.join("\n") + "\n", n: rows.length };
  }
  function fileName(o) {
    var d = new Date();
    return "mandarino-anki-" + (IT ? "it-" : "") + (o.which === "sec" ? tag(o.sec) : o.which) + "-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + ".txt";
  }
  function save(o) {
    var r = build(o);
    if (!r.n) { CP.toast(T("anki.none")); return Promise.resolve(0); }
    return Store.download(fileName(o), r.text, "text/tab-separated-values").then(function () { CP.toast(T("anki.done", { n: r.n })); return r.n; });
  }
  CP.anki = { build: build, guid: guid, save: save, allowed: allowed, studied: studied, MIN: ANKI_MIN };

  /* ⚙️ → Dati e privacy, accanto alla sincronizzazione: un blocco chiuso, solo per chi ha studiato molto */
  var pick = { which: "mine", sec: "" };
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "data", html: function () {
    if (!allowed()) return "";
    var opts = [["mine", T("anki.mine")], ["sure", T("anki.sure")], ["all", T("anki.all")]].concat(IT ? [] : [["sec", T("anki.sec")]]);
    return '<details class="set-sec" id="set-export"><summary>📤 ' + T("anki.more") + '</summary><div class="vbody">' +
      '<p class="small muted" style="margin:0">' + T("anki.diff") + "</p>" +
      '<fieldset class="anki-pick"><legend class="small">' + T(IT ? "anki.ledeIt" : "anki.lede") + "</legend>" + opts.map(function (x) {
        return '<label class="chk"><input type="radio" name="anki-which" value="' + x[0] + '"' + (pick.which === x[0] ? " checked" : "") + "> " + x[1] + "</label>";
      }).join("") +
      (IT ? "" : '<label class="sr" for="anki-sec">' + T("anki.sec") + '</label><select id="anki-sec"' + (pick.which === "sec" ? "" : " disabled") + ">" + CP.SEC.map(function (S) { return '<option value="' + CP.attr(S.id) + '"' + (S.id === pick.sec ? " selected" : "") + ' lang="it">' + esc(S.title) + "</option>"; }).join("") + "</select>") +
      '</fieldset><button type="button" class="btn-s" data-anki-go>🗂️ ' + T("anki.title") + "</button></div></details>";
  } });
  function setClose() { var se = document.getElementById("settings"); if (se && !se.hidden) CP.untrap(se); }
  function setBack() { CP.closeSheet(); if (CP.openSettings) CP.openSettings("set-export"); }
  function sheet(body) { setClose(); CP.openSheet('<div class="anki-sheet"><div class="fam-head"><b>🗂️ ' + esc(T("anki.title")) + '</b><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" + body + "</div>"); }
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t) return;
    if (t.name === "anki-which") { pick.which = t.value; var s = document.getElementById("anki-sec"); if (s) { s.disabled = t.value !== "sec"; if (!pick.sec) pick.sec = s.value; } }
    else if (t.id === "anki-sec") pick.sec = t.value;
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-anki-go], [data-anki-ok1], [data-anki-ok2]") : null; if (!b) return;
    if (b.hasAttribute("data-anki-go")) {
      if (pick.which === "sec" && !pick.sec) { var s = document.getElementById("anki-sec"); pick.sec = s ? s.value : ""; }
      var n = build(pick).n;
      sheet('<p style="margin:0">' + T("anki.does", { n: n }) + '</p><ul class="small pv-list"><li>' + T("anki.not1") + "</li><li>" + T("anki.not2") + "</li><li>" + T("anki.not3") + "</li></ul>" +
        '<button type="button" class="btn-main" data-anki-ok1' + (n ? "" : " disabled") + ">" + esc(T("anki.ok1")) + "</button>");
      return;
    }
    if (b.hasAttribute("data-anki-ok1")) { sheet("<p><b>" + T("anki.q2") + '</b></p><button type="button" class="btn-main" data-anki-ok2>' + esc(T("anki.ok2")) + "</button>"); return; }
    CP.sfx("tap"); save(pick).then(function () { setBack(); });
  });
})();
