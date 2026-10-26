/* ===== V5: Memoria (FSRS), backup e Dottore dei Toni ===== */
(function () {
  var CP = window.CP, esc = CP.esc, root = document.getElementById("study-root");
  var EARKEY = "cp-ear-v1", DAY = 86400000;
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---- matrice di confusione dei toni (orecchio) ---- */
  var M; try { M = JSON.parse(lget(EARKEY) || "null"); } catch (e) { M = null; }
  if (!M || !M.m) M = { m: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], n: 0 };
  CP.confuse = function (expected, chosen) {
    if (!(expected >= 1 && expected <= 4 && chosen >= 1 && chosen <= 4)) return;
    M.m[expected - 1][chosen - 1]++; M.n++; lset(EARKEY, JSON.stringify(M));
  };
  CP.confusion = function () { return M; };
  var NAMES = { 1: "alto e piatto", 2: "sale", 3: "scende e risale", 4: "cade secco" };
  var EXAMPLE = { 12: ["mā", "má"], 13: ["mā", "mǎ"], 14: ["mā", "mà"], 23: ["má", "mǎ"], 24: ["má", "mà"], 34: ["mǎ", "mà"] };
  function worstPair() {
    var best = null;
    for (var a = 1; a <= 4; a++) for (var b = a + 1; b <= 4; b++) {
      var n = M.m[a - 1][b - 1] + M.m[b - 1][a - 1], tot = M.m[a - 1].reduce(function (x, y) { return x + y; }, 0) + M.m[b - 1].reduce(function (x, y) { return x + y; }, 0);
      if (n >= 3 && tot >= 8 && (!best || n / tot > best.rate)) best = { a: a, b: b, n: n, tot: tot, rate: n / tot };
    }
    return best;
  }
  function matrixHTML() {
    if (M.n < 10) return '<p class="muted small" style="margin:0">Servono almeno 10 risposte nell\'allenamento dell\'orecchio (finora ' + M.n + ").</p>";
    var max = 1; M.m.forEach(function (r) { r.forEach(function (v) { if (v > max) max = v; }); });
    var h = '<table class="cm" role="table" aria-label="Matrice di confusione dei toni: righe = tono sentito, colonne = tono risposto"><thead><tr><th scope="col"></th>' + [1, 2, 3, 4].map(function (t) { return '<th scope="col" class="t' + t + '">' + t + "°</th>"; }).join("") + "</tr></thead><tbody>";
    M.m.forEach(function (r, i) {
      var tot = r.reduce(function (x, y) { return x + y; }, 0);
      h += '<tr><th scope="row" class="t' + (i + 1) + '">' + (i + 1) + "°</th>" + r.map(function (v, j) {
        var a = v / max, cls = i === j ? "d" : "x";
        return '<td class="' + cls + '" style="--a:' + a.toFixed(2) + '" title="Tono ' + (i + 1) + " sentito, risposto " + (j + 1) + ": " + v + '">' + (v || "") + "</td>";
      }).join("") + "</tr>";
    });
    return h + "</tbody></table>";
  }
  function doctorHTML() {
    var w = worstPair(), rec;
    if (M.n < 10) rec = "Fai un giro di «Allena l'orecchio» (10 domande, 2 minuti) e qui compare la tua mappa.";
    else if (!w) rec = "Nessuna confusione ricorrente per ora. Continua con l'orecchio una volta al giorno.";
    else {
      var ex = EXAMPLE[w.a * 10 + w.b];
      rec = "Scambi spesso il " + w.a + "° (" + NAMES[w.a] + ") con il " + w.b + "° (" + NAMES[w.b] + "): " + w.n + " volte su " + w.tot + ". Prova a dire ad alta voce <b>" + ex[0] + " – " + ex[1] + "</b> guardando la curva, poi rifai l'orecchio.";
    }
    return '<div class="panel" id="doctor"><h3>Dottore dei Toni</h3>' + matrixHTML() + '<p style="margin:10px 0 0"><b>Oggi:</b> ' + rec + "</p></div>";
  }

  /* ---- Memoria: numeri veri dal registro dei ripassi ---- */
  function totalReviews() { var S = CP.S(), n = 0; Object.keys(S).forEach(function (k) { n += S[k].rp || S[k].n || 0; }); return n; }
  function memHTML() {
    var ret = Math.round(CP.srs.retention() * 100);
    var opts = [80, 85, 90, 95].map(function (v) { return '<option value="' + v + '"' + (v === ret ? " selected" : "") + ">" + v + "%</option>"; }).join("");
    return '<div class="panel" id="mem"><h3>Memoria</h3>' +
      '<p class="muted small" style="margin:0 0 8px">Il ripasso usa FSRS (' + esc(CP.srs.version) + '): ogni parola torna quando la probabilità di ricordarla scende al livello scelto. Più alto = più ripassi.</p>' +
      '<label class="small" style="display:grid;gap:4px;font-weight:600">Ritenzione obiettivo<select id="ret-sel">' + opts + "</select></label>" +
      '<div id="mem-stats" class="small muted" style="margin-top:10px" aria-live="polite">Calcolo…</div></div>';
  }
  function fillMem() {
    var el = document.getElementById("mem-stats"); if (!el || !window.Store) return;
    Store.logAll().then(function (lg) {
      el = document.getElementById("mem-stats"); if (!el) return;
      var now = Date.now(), valid = lg.filter(function (e) { return e && e.length >= 7 && !e[6]; });          /* solo prime risposte, non ripetizioni */
      var rec = valid.filter(function (e) { return e[5] != null; });
      var last30 = rec.filter(function (e) { return now - e[0] < 30 * DAY; });
      var ok30 = last30.filter(function (e) { return e[2] >= 2; }).length;
      var h = "<b>" + valid.length + "</b> ripassi registrati in questo browser.";
      if (last30.length >= 20) h += " Ritenzione reale negli ultimi 30 giorni: <b>" + Math.round(ok30 / last30.length * 100) + "%</b> su " + last30.length + " parole già viste (obiettivo " + Math.round(CP.srs.retention() * 100) + "%).";
      else h += " La ritenzione reale compare dopo 20 ripassi di parole già viste.";
      if (rec.length >= 400) {
        var cal = FSRS.calibrate(rec.map(function (e) { return { r: e[5], ok: e[2] >= 2 }; }));
        h += '<div style="margin-top:10px"><b>Previsto contro reale</b> (calibrazione): ' + Math.round(cal.predicted * 100) + "% previsto, " + Math.round(cal.observed * 100) + "% osservato. " +
          "Stima grossolana, non è l'ottimizzatore ufficiale di FSRS.</div>" + calChart(cal.bins);
      } else h += "<br>La calibrazione «previsto contro reale» si attiva dopo 400 ripassi (ora " + rec.length + ").";
      el.innerHTML = h;
    });
  }
  function calChart(bins) {
    var w = 260, hh = 120, pad = 22, bw = (w - pad) / 10, out = '<svg viewBox="0 0 ' + w + " " + (hh + 16) + '" role="img" aria-label="Calibrazione: ritenzione reale per fascia di probabilità prevista" style="width:100%;max-width:320px">';
    out += '<line x1="' + pad + '" y1="' + hh + '" x2="' + w + '" y2="' + hh + '" stroke="currentColor" opacity=".3"/>';
    out += '<line x1="' + pad + '" y1="' + hh + '" x2="' + w + '" y2="6" stroke="currentColor" stroke-dasharray="3 3" opacity=".5"/>';
    bins.forEach(function (b, i) {
      if (b.n < 5) return;
      var x = pad + i * bw + bw * 0.15, bh = b.real * (hh - 6);
      out += '<rect x="' + x.toFixed(1) + '" y="' + (hh - bh).toFixed(1) + '" width="' + (bw * 0.7).toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="var(--accent)" opacity=".8"><title>Previsto ' + Math.round(b.pred * 100) + "%, reale " + Math.round(b.real * 100) + "% (" + b.n + " ripassi)</title></rect>";
    });
    out += '<text x="' + pad + '" y="' + (hh + 13) + '" font-size="11" fill="currentColor">0%</text><text x="' + (w - 26) + '" y="' + (hh + 13) + '" font-size="11" fill="currentColor">previsto 100%</text></svg>';
    return out;
  }

  /* ---- backup ---- */
  /* avvisi in evidenza nella home di Studia (il browser non salva; backup settimanale) */
  CP.homeNotice = function () {
    var st = window.Store ? Store.status() : { ls: true };
    if (!st.ls) return '<div class="notice" role="alert"><b>Il browser non permette di salvare i progressi.</b> Quando chiudi la pagina li perdi. Apri il file direttamente nel browser del telefono (non da un\'anteprima) e fai spesso «Scarica backup».</div>';
    if (window.Store && Store.backupDue(totalReviews())) return '<div class="notice" role="status"><p><b>Backup settimanale.</b> Hai studiato e l\'ultimo backup è vecchio: scarica il file e conservalo (Drive, email a te stesso).</p><button type="button" class="btn-s" id="bk-down2">⬇ Scarica backup</button></div>';
    return "";
  };
  /* il backup su file sostituisce il vecchio «Salva o sposta»; il ripristino accetta anche quel formato (v:2) */
  function backupHTML() {
    var st = window.Store ? Store.status() : { ls: true };
    var ts = parseInt(lget("cp-backup-ts"), 10);
    return '<details class="panel" id="bk"><summary>Backup e ripristino</summary>' +
      '<p class="muted small">Il file contiene progressi, preferiti, gioco e registro dei ripassi. «Ripristina» li unisce a quelli di questo dispositivo, tenendo per ogni parola il dato più recente. Accetta anche il testo salvato dalle versioni vecchie.</p>' +
      '<div class="acts"><button type="button" id="bk-down">⬇ Scarica backup</button><button type="button" id="bk-up">⬆ Ripristina da file</button></div>' +
      '<input type="file" id="bk-file" accept="application/json,.json,.txt" hidden>' +
      '<p class="small muted" id="bk-msg" aria-live="polite">' + (ts ? "Ultimo backup: " + new Date(ts).toLocaleDateString("it-IT") + "." : "Nessun backup ancora.") +
      (st.idb ? " Copia di sicurezza interna attiva." : "") + "</p>" +
      '<div class="acts"><button type="button" id="bk-reset" class="btn-quiet">Azzera tutti i progressi</button></div>' +
      '<p class="small muted" style="margin:4px 0 0">Cancella ripassi, punti e serie di giorni, lezioni e registro. Restano impostazioni e correzioni.</p>' +
      '<label class="chk small"><input type="checkbox" id="bk-reset-all"> Cancella anche preferiti e frasi salvate nel laboratorio</label></details>';
  }
  CP.homeProgress = function () { setTimeout(fillMem, 30); return memHTML() + doctorHTML(); };
  CP.homeBackup = backupHTML;
  root.addEventListener("change", function (e) {
    if (e.target.id === "ret-sel") { CP.srs.setRetention(parseInt(e.target.value, 10) / 100); fillMem(); }
    if (e.target.id === "bk-file") { var f0 = e.target.files && e.target.files[0]; if (f0) CP.restoreFile(f0, document.getElementById("bk-msg")); }
  });
  /* ripristino da file (anche dal foglio ⚙️): backup V5+ con unione, oppure il vecchio testo v:2 */
  CP.restoreFile = function (f, msg) {
    msg = msg || { set textContent(v) { CP.toast(v); } };
    {
      var rd = new FileReader();
      rd.onload = function () {
        var o; try { o = JSON.parse(rd.result); } catch (x) { msg.textContent = CP.t("bk.bad"); return; }
        if (o && o.v === 2 && o.s && typeof o.s === "object" && !o.app) {
          /* formato del vecchio «Salva o sposta»: unione, come per il backup nuovo */
          CP.setS(Store.mergeSrs(CP.S(), o.s)); if (o.f && CP.favs) CP.favs.load(CP.favs.dump().concat(o.f)); if (o.g && CP.game && !CP.game.dump().xp) CP.game.load(o.g);
          msg.textContent = CP.t("bk.old"); setTimeout(function () { location.reload(); }, 700); return;
        }
        var r = Store.importObj(o, "merge");
        Promise.resolve(r).then(function (res) {
          if (!res.ok) { msg.textContent = CP.t("bk.unknown"); return; }
          msg.textContent = CP.t("bk.imported", { n: res.n }); setTimeout(function () { location.reload(); }, 700);
        });
      };
      rd.readAsText(f);
    }
  };
  root.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("button") : null; if (!t) return;
    if (t.id === "bk-down" || t.id === "bk-down2") { var msg = document.getElementById("bk-msg"); Store.backup().then(function (n) { if (msg) msg.textContent = "Backup creato: " + n + ". Conservalo in un posto sicuro."; CP.toast("Backup creato: " + n); }); }
    if (t.id === "bk-reset") {
      if (!t._arm) { t._arm = true; t.textContent = "Tocca ancora per confermare: si perdono tutti i progressi"; setTimeout(function () { t._arm = false; t.textContent = "Azzera tutti i progressi"; }, 4000); }
      else {
        t._arm = false; t.disabled = true;
        var all = document.getElementById("bk-reset-all");
        /* si ricarica la pagina: punti, serie e preferiti in memoria ripartono dai dati appena azzerati */
        Store.resetProgress(!!(all && all.checked)).then(function () { CP.toast("Progressi azzerati."); setTimeout(function () { location.reload(); }, 600); });
      }
    }
    if (t.id === "bk-up") { var fi = document.getElementById("bk-file"); if (fi) fi.click(); }
  });
  /* la home di Studia era già stata disegnata prima che questo modulo esistesse */
  if (CP.studyActive && !CP.studyActive()) CP.studyHome();
})();

