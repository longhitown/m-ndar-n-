/* ===== màndarínō · i voti dati dal widget «Ripasso rapido» (android/…/ReviewBigWidget.java).
   Il widget non ha il motore FSRS: ogni voto lo mette in una coda sul telefono (id, carta, voto 0-3, ora in millisecondi) e
   l'app li applica la prossima volta che si apre o torna in primo piano, con il suo motore e l'ORA ORIGINALE del voto, così
   l'intervallo è quello giusto. Questo modulo si carica al primo uso di CP.wq (tools/build.mjs, LAZYMOD): pwa/widget.js lo
   tocca solo se il ponte dice che in coda c'è qualcosa.
   Regole:
   - esattamente una volta: gli id applicati si scrivono in "md-wq-done" PRIMA di dirlo al widget (widgetAck); se l'app si chiude
     a metà, al giro dopo gli id già scritti si tolgono dalla coda senza riapplicarli;
   - un voto si scarta se la carta nel frattempo è stata ripassata nell'app DOPO l'ora del voto, o se la carta non esiste più;
   - i voti si applicano in ordine di ora; i punti del giorno (CP.onGrade) solo per i voti di oggi, e nel corso in uso;
   - una riga discreta («Ripassi fatti dal widget: N») una volta sola, mai una finestra. ===== */
(function () {
  var CP = window.CP, DONE = "md-wq-done", IK = "cp-it-srs-v1", KEEP = 400;
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function jget(k, d) { try { var v = JSON.parse(lget(k)); return v == null ? d : v; } catch (e) { return d; } }
  function today(t) { var d = new Date(t); return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }

  /* la coda, come la dà il ponte: [{ id, k, g, t, c }] — c è il corso della carta ("zh" o "it"), g il voto 0-3 */
  function parse(json) {
    var a; try { a = JSON.parse(json || "[]"); } catch (e) { return []; }
    if (!Array.isArray(a)) return [];
    return a.filter(function (v) { return v && typeof v.id === "string" && typeof v.k === "string" && v.g >= 0 && v.g <= 3 && v.t > 0; })
      .sort(function (x, y) { return x.t - y.t; });
  }

  /* corso di cinese: il motore dell'app (CP.grade) con l'ora del voto. Vero se il voto è stato applicato. */
  function applyZh(v, credit) {
    var r = CP.S()[v.k];
    if (!CP.WORDS[v.k] || !r || !r.n || (r.lr || 0) > v.t) return false;
    CP.grade(v.k, v.g, false, { at: v.t, type: "widget", quiet: !credit });
    return true;
  }
  /* corso di italiano: stesso formato di it/course.js ({ c, n, lr }), stesso FSRS (ritenzione 0,9). Si salva una volta sola, a fine giro. */
  function applyIt(v, credit, st) {
    var S = st.S || (st.S = jget(IK, {})), rec = S[v.k];
    if (v.k === "__meta" || !rec || !rec.c || (rec.lr || 0) > v.t) return false;
    var sch = new FSRS.Scheduler({ retention: 0.9, fuzz: true, dayOf: FSRS.studyDay });
    S[v.k] = { c: sch.review(rec.c, v.g + 1, v.t), n: (rec.n || 0) + 1, lr: v.t };
    st.dirty = true;
    if (credit && v.g >= 1 && CP.game && CP.game.addWord) { try { CP.game.addWord(v.k); } catch (e) {} }
    return true;
  }

  /* applica la coda; ritorna { n: voti applicati, ids: tutti gli id da togliere dalla coda del widget } */
  function apply(list, now) {
    var done = jget(DONE, []), seen = {}, ids = [], n = 0, st = {}, cur = CP.course ? CP.course() : "zh";
    if (!Array.isArray(done)) done = [];
    done.forEach(function (id) { seen[id] = 1; });
    list.forEach(function (v) {
      ids.push(v.id);
      if (seen[v.id]) return;
      seen[v.id] = 1;
      var it = v.c === "it", credit = (v.c || "zh") === cur && today(v.t) === today(now), ok = false;
      try { ok = it ? applyIt(v, credit, st) : applyZh(v, credit); } catch (e) { ok = false; }
      if (ok) n++;
      done.push(v.id);
    });
    if (st.dirty) lset(IK, JSON.stringify(st.S));
    /* prima gli id applicati, poi (nel chiamante) l'ack: se qui la scrittura fallisce, niente ack e si riprova */
    return { n: n, ids: ids, saved: lset(DONE, JSON.stringify(done.slice(-KEEP))) };
  }

  function run() {
    var A = window.MandarinoAndroid;
    if (!A || !A.widgetPending || !A.widgetAck) return 0;
    var list; try { list = parse(A.widgetPending()); } catch (e) { return 0; }
    if (!list.length) return 0;
    var r = apply(list, Date.now());
    if (r.saved) { try { A.widgetAck(JSON.stringify(r.ids)); } catch (e) {} }
    if (r.n && CP.toast) setTimeout(function () { CP.toast(CP.t("wq.done", { n: r.n })); }, 400);   /* dopo gli eventuali avvisi dei punti */
    return r.n;
  }

  CP.wq = { run: run, apply: apply, parse: parse };
})();
