/* ===== V6.7 · §6 contributi della community: correggi, segnala, proponi; invia senza account ===== */
(function () {
  var CP = window.CP, esc = CP.esc, fam = document.getElementById("fam");
  /* canali configurabili dall'autore: vuoto = nascosto (l'email resta, senza destinatario precompilato).
     form = URL «viewform» di un Modulo Google con un campo testo lungo; formEntry = il suo numero (entry.<N>).
     repo = repository PUBBLICO dei contributi (es. «utente/mandarino-contributi»): su uno privato gli estranei non aprono issue. */
  var CFG = { email: "", form: "", formEntry: "", repo: "" };
  var NICK = "cp-contrib-nick";
  function nick() { try { return localStorage.getItem(NICK) || ""; } catch (e) { return ""; } }
  function list() { return CP.contrib.list(); }
  function saveList(l) {
    CP.contrib.save(l); CP.reindex(); CP.refreshRows(); if (CP.studyRefresh) CP.studyRefresh();
    if (CP.studyActive && !CP.studyActive() && CP.studyHome && !document.getElementById("view-study").hidden) CP.studyHome();
    if (CP.repaintSettings && !document.getElementById("settings").hidden) CP.repaintSettings();
  }
  function label(it) {
    var w = CP.WORDS[it.target], ln = !w && it.target ? CP.contrib.lineOf(it.target) : null, who = w ? w.hz : ln ? ln.hz : it.target || "";
    var F = { py: "pinyin", it: "italiano", note: "nota" };
    if (it.op === "fix") return "✏️ " + who + " · " + F[it.field] + ": «" + it.new + "»";
    if (it.op === "add") return "➕ " + it.hz + " " + it.py + " · " + it.it;
    if (it.op === "tr") return "🈯 " + it.target + " → «" + it.new + "»";
    return "🚩 " + who + " · " + it.why;
  }
  function patch(items) {
    return { schema: "mandarino-contrib/1", app: CP.VERSION, dataset: CP.DATASET, created: Date.now(), author: nick() || undefined,
      items: items.map(function (it) { var o = {}; ["id", "op", "target", "field", "old", "new", "section", "py", "hz", "it", "why"].forEach(function (k) { if (it[k] !== undefined && it[k] !== "") o[k] = it[k]; }); return o; }) };
  }
  function pending() { return list().filter(function (it) { return !it.undone && !it.sent; }); }

  /* ---- il modulo ---- */
  var form = null;
  function secOpts(sel) { return CP.SEC.map(function (S) { return '<option value="' + CP.attr(S.id) + '"' + (S.id === sel ? " selected" : "") + ">" + esc(S.title) + "</option>"; }).join(""); }
  function formHTML(errs) {
    var f = form, w = CP.WORDS[f.target], ln = !w && f.target ? CP.contrib.lineOf(f.target) : null, cur = w || ln, h;
    var head = f.op === "add" ? "Proponi una parola nuova" : f.op === "tr" ? esc(f.target) : (w ? "«" + esc(w.hz) + "» " + esc(w.py) : ln ? esc(ln.hz) : "");
    h = '<div class="fam-head"><div class="meta"><b>' + (f.op === "add" ? head : f.op === "tr" ? "La traduzione giusta" : "Correggi o segnala") + "</b>" + (f.op !== "add" ? '<div class="small muted han">' + head + "</div>" : "") + '</div><button type="button" class="fam-x btn-s" data-famclose>Chiudi</button></div>';
    if (f.op !== "add" && f.op !== "tr") h += '<div class="seg" role="group" aria-label="Tipo"><button type="button" data-ct-op="fix"' + (f.op === "fix" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>✏️ Correggi</button><button type="button" data-ct-op="flag"' + (f.op === "flag" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🚩 Segnala</button></div>";
    h += '<div class="ct-form">';
    if (f.op === "fix") {
      var fields = w ? [["py", "Pinyin"], ["it", "Italiano"], ["note", "Nota"]] : [["py", "Pinyin"], ["it", "Italiano"]];
      h += '<label>Che cosa<select id="ct-field">' + fields.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === f.field ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + "</select></label>" +
        '<p class="small muted" style="margin:0">Adesso: <b>' + esc((cur && cur[f.field]) || "—") + "</b></p>" +
        '<label>Diventa<input type="text" id="ct-new" maxlength="200" value="' + CP.attr(f.new != null ? f.new : (cur && cur[f.field]) || "") + '" autocomplete="off" spellcheck="false"></label>' +
        '<p class="small muted" style="margin:0">I caratteri non si correggono da qui (sono la chiave dei tuoi progressi): se sono sbagliati usa «Segnala».</p>';
    } else if (f.op === "tr") {
      h += '<p class="small muted" style="margin:0">Il laboratorio dice: <b>' + esc(f.old || CP.lab.NOPE) + "</b></p>" +
        '<label>Come si dice in italiano<input type="text" id="ct-new" maxlength="200" value="' + CP.attr(f.new != null ? f.new : f.old || "") + '" autocomplete="off"></label>' +
        '<p class="small muted" style="margin:0">La tua traduzione vale subito nel tuo laboratorio. Se la mandi all\'autore, viene riletta e poi diventa una frase verificata per tutti.</p>';
    } else if (f.op === "add") {
      h += '<label>Sezione<select id="ct-sec">' + secOpts(f.section) + "</select></label>" +
        '<label>Caratteri<input type="text" id="ct-hz" maxlength="8" value="' + CP.attr(f.hz || "") + '" autocomplete="off" lang="zh"></label>' +
        '<label>Pinyin, con i toni (sillabe separate da un punto: ni.hao)<input type="text" id="ct-py" maxlength="200" value="' + CP.attr(f.py || "") + '" autocomplete="off" spellcheck="false"></label>' +
        '<label>Italiano<input type="text" id="ct-it" maxlength="200" value="' + CP.attr(f.it || "") + '" autocomplete="off"></label>';
    }
    h += '<label>' + (f.op === "flag" ? "Che cosa non va" : "Perché (facoltativo)") + '<textarea id="ct-why" maxlength="200" rows="2">' + esc(f.why || "") + "</textarea></label>" +
      '<label>Nickname (facoltativo)<input type="text" id="ct-nick" maxlength="40" value="' + CP.attr(nick()) + '" autocomplete="nickname"></label>' +
      (errs && errs.length ? '<div class="warn" role="alert">' + errs.map(esc).join("<br>") + "</div>" : "") +
      '<p class="small muted" style="margin:0">🔒 Cosa invii: solo questa correzione e, se lo scrivi, un nickname. A chi: all\'autore dell\'app, quando scegli tu un canale (messaggio, email, modulo). Verrà pubblicata nel dizionario dell\'app. Nessun altro dato.</p>' +
      '<button type="button" class="btn-main" id="ct-save" style="margin-top:0">' + (f.op === "fix" || f.op === "tr" ? "Salva e prova nella mia copia" : "Salva") + "</button></div>";
    return h;
  }
  function read() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : undefined; };
    if (g("ct-field") !== undefined) { var nf = g("ct-field"); if (nf !== form.field) { form.field = nf; form.new = undefined; return false; } }
    if (g("ct-new") !== undefined) form.new = g("ct-new");
    if (g("ct-sec") !== undefined) form.section = g("ct-sec");
    if (g("ct-hz") !== undefined) form.hz = g("ct-hz");
    if (g("ct-py") !== undefined) form.py = g("ct-py");
    if (g("ct-it") !== undefined) form.it = g("ct-it");
    form.why = g("ct-why") || ""; var n = g("ct-nick"); if (n !== undefined) { try { localStorage.setItem(NICK, n); } catch (e) {} }
    return true;
  }
  CP.contribOpen = function (o) {
    form = { op: o.op || "fix", target: o.target || "", field: o.field || "py", section: o.section || (CP.SEC[0] && CP.SEC[0].id), old: o.old || "" };
    CP.openSheet(formHTML());
  };
  function save() {
    if (!read()) { CP.openSheet(formHTML()); return; }
    var w = CP.WORDS[form.target], ln = !w && form.target ? CP.contrib.lineOf(form.target) : null, cur = w ? (w.orig || w) : ln;
    var it = { id: CP.contrib.id(), op: form.op, t: Date.now() };
    if (form.op === "fix") { it.target = form.target; it.field = form.field; it.old = cur ? String(cur[form.field] || "") : ""; it.new = form.new; }
    else if (form.op === "flag") it.target = form.target;
    else if (form.op === "tr") { it.target = form.target; it.old = form.old || ""; it.new = form.new; }
    else { it.section = form.section; it.hz = form.hz; it.py = form.py; it.it = form.it; }
    if (form.why) it.why = form.why;
    var errs = CP.contrib.validate(it);
    if (errs.length) { CP.openSheet(formHTML(errs)); CP.sfx("ko"); return; }
    var l = list();
    if (it.op === "tr") l = l.filter(function (x) { return !(x.op === "tr" && x.target === it.target && !x.sent); });   /* una sola traduzione per frase, la più recente */
    l.push(it); saveList(l);
    if (it.op === "tr" && CP.labRefresh) CP.labRefresh();
    CP.sfx("ok");
    CP.openSheet('<div class="fam-head"><div class="meta"><b>Grazie!</b><div class="small muted">' + esc(label(it)) + '</div></div><button type="button" class="fam-x btn-s" data-famclose>Chiudi</button></div>' +
      (it.op === "fix" && w ? '<p style="margin:0">La vedi già nella tua copia, con l\'etichetta «✏️ tua correzione». La puoi annullare da ⚙️ → Contributi.</p>' : it.op === "tr" ? '<p style="margin:0">La vedi già nel laboratorio, con l\'etichetta «✏️ tua traduzione». La puoi annullare da ⚙️ → Contributi.</p>' : '<p style="margin:0">È salvata in questo dispositivo (e nel backup).</p>') +
      sendHTML());
  }

  /* ---- invio: dal più semplice al più tecnico ---- */
  function sendHTML() {
    var n = pending().length; if (!n) return "";
    return '<div class="ct-send"><b>Manda ' + (n === 1 ? "il contributo" : "i " + n + " contributi") + " all'autore</b>" +
      '<div class="acts" style="margin:0">' + (navigator.share ? '<button type="button" class="btn-s" data-ct-send="share">📤 Condividi (WeChat, WhatsApp…)</button>' : "") +
      '<button type="button" class="btn-s" data-ct-send="mail">✉️ Email</button>' +
      (CFG.form && CFG.formEntry ? '<button type="button" class="btn-s" data-ct-send="form">📝 Modulo Google</button>' : "") +
      (CFG.repo ? '<button type="button" class="btn-s" data-ct-send="gh">🐙 GitHub</button>' : "") +
      '<button type="button" class="btn-s" data-ct-send="file">⬇ Scarica .json</button></div></div>';
  }
  function send(how) {
    var items = pending(); if (!items.length) return;
    var p = patch(items), text = JSON.stringify(p), pretty = JSON.stringify(p, null, 1), subj = "màndarínō · " + items.length + (items.length === 1 ? " contributo" : " contributi");
    var done = function () { var ids = {}; items.forEach(function (x) { ids[x.id] = 1; }); var l = list(); l.forEach(function (x) { if (ids[x.id]) { x.sent = Date.now(); x.t = Date.now(); } }); saveList(l); };
    var open = function (u) { try { window.open(u, "_blank", "noopener"); } catch (e) { location.href = u; } };
    if (how === "share" && navigator.share) navigator.share({ title: subj, text: text }).then(done, function () {});
    else if (how === "mail") {
      if (pretty.length > 1800) { CP.toast("Troppo lungo per un'email: scarico il file, allegalo tu."); Store.download("mandarino-contributi.json", pretty); }
      else open("mailto:" + encodeURIComponent(CFG.email) + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(pretty));
      done();
    } else if (how === "form" && CFG.form) { open(CFG.form + (CFG.form.indexOf("?") < 0 ? "?" : "&") + "usp=pp_url&entry." + CFG.formEntry + "=" + encodeURIComponent(text)); done(); }
    else if (how === "gh" && CFG.repo) {
      var body = "```json\n" + pretty + "\n```\n";
      if (body.length > 7000) { CP.toast("Troppo lungo per GitHub: scarico il file."); Store.download("mandarino-contributi.json", pretty); }
      else open("https://github.com/" + CFG.repo + "/issues/new?labels=contributo&title=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body));
      done();
    } else if (how === "file") { Store.download("mandarino-contributi-" + Date.now() + ".json", pretty); done(); }
  }

  /* ---- ⚙️ → Contributi ---- */
  (CP.settingsExtras = CP.settingsExtras || []).push(function () {
    var l = list().slice().reverse();
    return '<details class="set-sec" id="set-contrib"><summary>✏️ Contributi' + (l.length ? " (" + l.length + ")" : "") + '</summary><div class="vbody">' +
      '<p class="small muted" style="margin:0">Hai trovato un errore? Correggilo: lo vedi subito nella tua copia e lo puoi mandare all\'autore, senza account.</p>' +
      '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-ct-find>✏️ Correggi o segnala…</button><button type="button" class="btn-s" data-ct-add>➕ Parola nuova</button></div>' +
      (l.length ? '<ul class="ct-list">' + l.map(function (it) {
        return '<li class="' + (it.undone ? "undone" : "") + '"><span>' + esc(label(it)) + (it.sent ? ' <span class="muted small">· inviato</span>' : "") + "</span>" +
          (it.op === "fix" || it.op === "tr" ? '<button type="button" class="btn-s" data-ct-undo="' + CP.attr(it.id) + '">' + (it.undone ? "Riapplica" : "Annulla") + "</button>" : "") +
          '<button type="button" class="btn-s" data-ct-del="' + CP.attr(it.id) + '" aria-label="Elimina">×</button></li>';
      }).join("") + "</ul>" : "") + sendHTML() + "</div></details>";
  });
  function finder(q) {
    q = CP.norm(q || ""); if (!q) return '<p class="small muted">Scrivi una parola in pinyin, 汉字 o italiano: cerco nel dizionario, nelle frasi e nei dialoghi.</p>';
    var out = [];
    CP.ORDER.forEach(function (k, i) { if (out.length < 25 && CP.Q[i].indexOf(q) >= 0) { var w = CP.WORDS[k]; out.push([k, w.hz + " · " + w.py + " · " + CP.gloss(w)]); } });
    PHRASES.forEach(function (g, gi) { g.items.forEach(function (p, ri) { if (out.length < 40 && (CP.norm(p[0]) + p[1] + CP.norm(p[2])).indexOf(q) >= 0) out.push(["phr:" + gi + ":" + ri, "💬 " + p[1] + " · " + p[2]]); }); });
    DIALOGS.forEach(function (d) { d.lines.forEach(function (l, li) { if (out.length < 55 && (CP.norm(l[1]) + l[2] + CP.norm(l[3])).indexOf(q) >= 0) out.push(["dlg:" + d.id + ":" + li, "🗨️ " + l[2] + " · " + l[3]]); }); });
    return out.length ? out.map(function (x) { return '<button type="button" class="goto-row ct-hit" data-ct-target="' + CP.attr(x[0]) + '"><span class="han">' + esc(x[1]) + "</span></button>"; }).join("") : '<p class="muted">Niente trovato.</p>';
  }
  CP.contribFind = function () {
    CP.openSheet('<div class="fam-head"><div class="meta"><b>Che cosa vuoi correggere?</b></div><button type="button" class="fam-x btn-s" data-famclose>Chiudi</button></div>' +
      '<label for="ct-q" class="sr">Cerca</label><input id="ct-q" type="search" placeholder="Cerca in pinyin, 汉字 o italiano" autocomplete="off" style="margin-top:10px"><div class="goto-list" id="ct-hits">' + finder("") + "</div>");
    var q = document.getElementById("ct-q"); if (q) q.focus({ preventScroll: true });
  };
  /* battute di un dialogo: si sceglie la riga */
  CP.contribDialog = function (id) {
    var d = DIALOGS.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    CP.openSheet('<div class="fam-head"><div class="meta"><b>Quale battuta?</b><div class="small muted">' + esc(d.title) + '</div></div><button type="button" class="fam-x btn-s" data-famclose>Chiudi</button></div><div class="goto-list">' +
      d.lines.map(function (l, i) { return '<button type="button" class="goto-row ct-hit" data-ct-target="dlg:' + CP.attr(d.id) + ":" + i + '"><span><span class="han">' + esc(l[2]) + '</span><br><span class="small muted">' + esc(l[1]) + "</span></span></button>"; }).join("") + "</div>");
  };

  fam.addEventListener("input", function (e) { if (e.target.id === "ct-q") document.getElementById("ct-hits").innerHTML = finder(e.target.value); });
  fam.addEventListener("change", function (e) { if (e.target.id === "ct-field" && form) { read(); CP.openSheet(formHTML()); } });
  fam.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    if (b.hasAttribute("data-ct-target")) { var tg = b.getAttribute("data-ct-target"); CP.contribOpen({ op: "fix", target: tg, field: CP.WORDS[tg] ? "it" : "py" }); }
    else if (b.hasAttribute("data-ct-op") && form) { read(); form.op = b.getAttribute("data-ct-op"); CP.openSheet(formHTML()); }
    else if (b.id === "ct-save") save();
    else if (b.hasAttribute("data-ct-send")) send(b.getAttribute("data-ct-send"));
    else if (b.hasAttribute("data-contrib")) CP.contribOpen({ op: "fix", target: b.getAttribute("data-contrib"), field: "it" });
  });
  document.getElementById("settings").addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    var l, id;
    if (b.hasAttribute("data-ct-find")) { CP.untrap(document.getElementById("settings")); CP.contribFind(); }
    else if (b.hasAttribute("data-ct-add")) { CP.untrap(document.getElementById("settings")); CP.contribOpen({ op: "add" }); }
    else if ((id = b.getAttribute("data-ct-undo"))) { l = list(); l.forEach(function (x) { if (x.id === id) { x.undone = !x.undone; x.t = Date.now(); } }); saveList(l); CP.sfx("tap"); if (CP.labRefresh) CP.labRefresh(); }
    else if ((id = b.getAttribute("data-ct-del"))) { l = list().filter(function (x) { return x.id !== id; }); saveList(l); CP.sfx("tap"); if (CP.labRefresh) CP.labRefresh(); }
    else if (b.hasAttribute("data-ct-send")) send(b.getAttribute("data-ct-send"));
  });
})();
