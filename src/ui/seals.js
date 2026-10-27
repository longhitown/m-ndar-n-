/* ===== màndarínō · sostegno volontario e sigilli di gratitudine (印章).
   - ⚙️ → Informazioni → «Sostieni il progetto»: il perché, un link (aperto solo da un tocco) alla pagina di
     sostegno (MD_CONFIG.SUPPORT_URL), la riga sui sigilli, la trasparenza. Nessun importo, nessun contatore, nessun
     invito che si ripete: l'app non sa chi ha donato né quanto, e non manda niente a nessuno.
   - I sigilli sono solo estetici: non aprono nulla. Tre livelli, disegnati qui in SVG («ispirati alla scrittura a sigillo»,
     non forme storiche): 支 Sostegno (quadrato), 交 Cultura (rotondo, consumato), 永 Custodire (rettangolo imperiale dentro
     il mandarino, bordo a circuito). Arrivano come codice firmato dall'autore (core/seal-code.js): da un link (#seal=…),
     incollando il codice o inquadrando il QR. Prima di salvarlo l'app chiede conferma; poi chiede, se si vuole, come
     essere chiamati (in italiano: al maschile, al femminile o senza titolo, predefinito) e se mostrare il sigillo nelle
     immagini condivise. Dati: cp-seal-v1 (codici uniti tra dispositivi, preferenze del più recente).
   - Interruttori: MD_CONFIG.FEATURE_DONATE, FEATURE_SEALS (spenti nella versione per gli store: allora qui non c'è niente).
     Con SEAL_PUBKEYS vuoto la parte «riscatta» non compare. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, C = window.MD_CONFIG || {};
  CP.tg = window.tg;
  var DON = !!C.FEATURE_DONATE, SEALS = !!C.FEATURE_SEALS, KEYS = C.SEAL_PUBKEYS || [], K = "cp-seal-v1";   /* KEYS: [{ kid, jwk }] */
  var IT = (function () { try { return localStorage.getItem("cp-course") === "it"; } catch (e) { return false; } })();
  if (!SEALS) { if (/^#seal=/.test(location.hash)) try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
  if (!DON && !SEALS) return;

  /* ---- dati ---- */
  function load() { try { var o = JSON.parse(localStorage.getItem(K) || "null"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function save(o) { o.t = Date.now(); try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} }
  function codes() { var o = load(); return Object.keys(o.codes || {}).map(function (id) { var x = o.codes[id], p = MDSeal.parse(x.code); return p.err ? null : { id: id, ok: x.ok !== false, lvl: p.lvl, year: p.year, num: p.num, code: x.code }; }).filter(function (x) { return x && x.ok; }).sort(function (a, b) { return b.lvl - a.lvl || a.year - b.year; }); }
  function best() { return SEALS ? codes()[0] || null : null; }

  /* ---- disegno: tre sigilli, glifi tracciati a mano su 100×100 ---- */
  var GLYPH = {
    1: ["M24 30H76", "M50 14V48", "M28 54H70Q62 74 30 88", "M40 64Q56 80 78 88"],                                   /* 支 */
    2: ["M50 12L53 20", "M18 28H82", "M38 36L28 48", "M62 36L74 48", "M34 54Q52 78 80 88", "M68 52Q50 78 20 88"],     /* 交 */
    3: ["M47 10L54 17", "M34 25H56V84Q56 90 48 86", "M22 46H42Q36 62 18 76", "M58 52L76 38", "M58 54Q68 70 84 84"]  /* 永 */
  };
  var CH = { 1: "支", 2: "交", 3: "永" }, PY = { 1: "zhī", 2: "jiāo", 3: "yǒng" }, uid = 0;
  function glyph(lvl, color, w, tf) { return '<g transform="' + (tf || "") + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round">' + GLYPH[lvl].map(function (d) { return '<path d="' + d + '"/>'; }).join("") + "</g>"; }
  function svg(lvl, px, label) {
    var id = "sl" + (++uid), red = "var(--seal-red, #B8322A)", paper = "var(--seal-paper, #F6EEDD)";
    var filt = '<filter id="' + id + '" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="' + (lvl === 2 ? 0.08 : 0.12) + '" numOctaves="3" seed="' + (lvl * 7) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="' + (lvl === 2 ? 3 : 1.6) + '" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ' + (lvl === 2 ? -9 : -12) + " " + (lvl === 2 ? 6.2 : 8.6) + '" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>';
    var body;
    if (lvl === 1) body = '<g filter="url(#' + id + ')"><rect x="6" y="6" width="88" height="88" rx="9" fill="' + red + '"/><g opacity=".14"><svg x="18" y="18" width="64" height="64" viewBox="300 30 200 200"><use href="#mandarin-symbol"/></svg></g>' + glyph(1, paper, 8, "translate(10 10) scale(.8)") + "</g>";
    else if (lvl === 2) body = '<g filter="url(#' + id + ')"><circle cx="50" cy="50" r="44" fill="none" stroke="' + red + '" stroke-width="6"/><circle cx="50" cy="50" r="37" fill="none" stroke="' + red + '" stroke-width="1.5"/>' + glyph(2, red, 7, "translate(17 17) scale(.66)") + "</g>";
    else {
      var circuit = "";
      for (var i = 0; i < 10; i++) { var y = 30 + i * 4.6; circuit += '<path d="M28 ' + y.toFixed(1) + 'h-4" /><circle cx="23" cy="' + y.toFixed(1) + '" r=".9"/><path d="M72 ' + y.toFixed(1) + 'h4"/><circle cx="77" cy="' + y.toFixed(1) + '" r=".9"/>'; }
      body = '<path d="M50 14C78 14 94 34 94 56C94 80 74 94 50 94C26 94 6 80 6 56C6 34 22 14 50 14Z" fill="none" stroke="' + red + '" stroke-width="3"/>' +
        '<path d="M50 14C46 7 40 5 33 7M50 14C56 6 64 5 70 8" fill="none" stroke="' + red + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<g fill="' + red + '" stroke="' + red + '" stroke-width=".9">' + circuit + "</g>" +
        '<g filter="url(#' + id + ')"><rect x="28" y="26" width="44" height="50" rx="3" fill="' + red + '"/>' + glyph(3, paper, 7, "translate(32 31) scale(.36 .4)") + "</g>";
    }
    return '<svg class="seal-svg seal-l' + lvl + '" width="' + px + '" height="' + px + '" viewBox="0 0 100 100" role="img" aria-label="' + CP.attr(label || T("seal.n" + lvl)) + '" focusable="false"><defs>' + filt + "</defs>" + body + "</svg>";
  }
  /* lo stesso sigillo sulla carta da condividere (canvas): i tracciati SVG passano da Path2D */
  function paint(x, lvl, X, Y, S) {
    /* impresso come un timbro: leggermente ruotato, un filo trasparente */
    x.save(); x.translate(X + S / 2, Y + S / 2); x.rotate(-0.1); x.translate(-S / 2, -S / 2); x.scale(S / 100, S / 100); x.globalAlpha = 0.92;
    var red = "#B8322A", paper = "#F6EEDD", stroke = function (col, w, tx, ty, sx, sy) { x.save(); x.translate(tx, ty); x.scale(sx, sy); x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round"; x.lineJoin = "round"; GLYPH[lvl].forEach(function (d) { x.stroke(new Path2D(d)); }); x.restore(); };
    if (lvl === 1) { x.fillStyle = red; x.fill(new Path2D("M15 6H85Q94 6 94 15V85Q94 94 85 94H15Q6 94 6 85V15Q6 6 15 6Z")); stroke(paper, 8 / 0.8, 10, 10, 0.8, 0.8); }
    else if (lvl === 2) { x.strokeStyle = red; x.lineWidth = 6; x.beginPath(); x.arc(50, 50, 44, 0, 7); x.stroke(); x.lineWidth = 1.5; x.beginPath(); x.arc(50, 50, 37, 0, 7); x.stroke(); stroke(red, 7 / 0.66, 17, 17, 0.66, 0.66); }
    else { x.strokeStyle = red; x.lineWidth = 3; x.stroke(new Path2D("M50 14C78 14 94 34 94 56C94 80 74 94 50 94C26 94 6 80 6 56C6 34 22 14 50 14Z")); x.fillStyle = red; x.fillRect(28, 26, 44, 50); stroke(paper, 6 / 0.38, 32, 31, 0.36, 0.4); }
    x.restore();
  }

  /* ---- titolo facoltativo: tre forme in i18n/titles.js, «senza titolo» se manca ---- */
  function title(lvl, o) { o = o || load(); return LANG === "zh" ? CP.tg("seal.t" + lvl + (lvl === 2 && IT ? "it" : ""), "x") : CP.tg("seal.t" + lvl + (lvl === 2 && IT ? "it" : ""), o.gram || "n"); }

  /* ---- verifica in sottofondo: si mostra subito l'ultimo esito salvato, poi si ricontrolla ---- */
  function recheck() {
    if (!SEALS || !KEYS.length || !window.crypto || !crypto.subtle) return;
    var o = load(), ids = Object.keys(o.codes || {}); if (!ids.length) return;
    Promise.all(ids.map(function (id) { return MDSeal.verify(o.codes[id].code, KEYS).then(function (r) { return [id, r]; }); })).then(function (rs) {
      var cur = load(), ch = false;
      rs.forEach(function (x) {
        var id = x[0], r = x[1]; if (!cur.codes || !cur.codes[id]) return;
        if (r.ok && cur.codes[id].ok === false) { cur.codes[id].ok = true; ch = true; }
        if (!r.ok && (r.err === "sig" || r.err === "kid" || r.err === "format")) { delete cur.codes[id]; ch = true; }   /* una firma non più valida lo toglie */
      });
      if (ch) { try { localStorage.setItem(K, JSON.stringify(cur)); } catch (e) {} if (CP.repaintSettings) CP.repaintSettings(); }
    });
  }

  /* ---- riscatto ---- */
  var ERR = { format: "seal.eFormat", level: "seal.eFormat", sig: "seal.eSig", kid: "seal.eKid", nocrypto: "seal.eCrypto" };
  function sheet(body) { var se = document.getElementById("settings"); if (se && !se.hidden) CP.untrap(se); CP.openSheet('<div class="seal-sheet"><div class="fam-head"><b>' + esc(T("seal.title")) + '</b><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" + body + "</div>"); }
  var pending = null;
  function offer(code) {
    var p = MDSeal.parse(code); if (p.err) { sheet('<p class="verdict ko">' + esc(T(ERR[p.err] || "seal.eFormat")) + "</p>"); return; }
    if (codes().some(function (x) { return x.id === p.id; })) { sheet("<p>" + esc(T("seal.have")) + "</p>"); return; }
    pending = p.code;
    sheet('<div class="seal-big">' + svg(p.lvl, 120) + '</div><p style="margin:0"><b>' + esc(T("seal.got", { n: T("seal.n" + p.lvl) })) + '</b></p><p class="small muted" style="margin:0">' + esc(T("seal.ed", { y: p.year, n: p.num })) + "</p>" +
      '<button type="button" class="btn-main" data-seal-add>' + esc(T("seal.add")) + "</button>");
  }
  function add() {
    var code = pending; if (!code) return;
    MDSeal.verify(code, KEYS).then(function (r) {
      if (!r.ok) { sheet('<p class="verdict ko">' + esc(T(ERR[r.err] || "seal.eSig")) + "</p>"); return; }
      var o = load(); o.codes = o.codes || {}; o.codes[r.seal.id] = { code: r.seal.code, ok: true, at: Date.now() }; if (!o.gram) o.gram = "n"; save(o);
      pending = null; CP.sfx("level"); prefs(r.seal.lvl, true);
    });
  }
  /* preferenze: come essere chiamati (solo in italiano), nome facoltativo, condivisione nelle immagini */
  function prefs(lvl, fresh) {
    var o = load(), g = o.gram || "n";
    var gram = LANG === "zh" ? "" : '<fieldset class="seal-gram"><legend><b>' + esc(T("seal.gramQ")) + "</b></legend>" +
      [["n", T("seal.gramN")], ["m", T("seal.gramM", { t: CP.tg("seal.t" + lvl + (lvl === 2 && IT ? "it" : ""), "m") || T("seal.n" + lvl) })], ["f", T("seal.gramF", { t: CP.tg("seal.t" + lvl + (lvl === 2 && IT ? "it" : ""), "f") || T("seal.n" + lvl) })]].map(function (x) {
        return '<label class="chk"><input type="radio" name="seal-gram" value="' + x[0] + '"' + (g === x[0] ? " checked" : "") + "> " + esc(x[1]) + "</label>";
      }).join("") + "</fieldset>";
    sheet((fresh ? '<div class="seal-big">' + svg(lvl, 120) + '</div><p class="verdict ok" style="margin:0">' + esc(T("seal.thanks")) + "</p>" : "") + gram +
      '<label class="small" style="display:grid;gap:4px;font-weight:600">' + esc(T("seal.name")) + '<input id="seal-name" type="text" maxlength="40" autocomplete="off" value="' + CP.attr(o.name || "") + '"></label>' +
      '<label class="chk"><input type="checkbox" id="seal-share"' + (o.share ? " checked" : "") + "> " + esc(T("seal.share")) + '</label><p class="small muted" style="margin:0">' + esc(T("seal.shareHint")) + "</p>" +
      '<button type="button" class="btn-main" data-seal-prefs>' + esc(T("seal.save")) + "</button>");
  }
  function savePrefs() {
    var o = load(), r = document.querySelector('input[name="seal-gram"]:checked'), n = document.getElementById("seal-name"), sh = document.getElementById("seal-share");
    if (r) o.gram = r.value; if (n) o.name = n.value.trim().slice(0, 40); if (sh) o.share = sh.checked ? 1 : 0;
    save(o); CP.closeSheet(); if (CP.openSettings) CP.openSettings("set-support");
  }

  /* ---- ⚙️ → Informazioni → Sostieni il progetto ---- */
  var CUP = '<svg class="cup" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 3.5c-.8 1 .8 2-.1 3M11.5 3.5c-.8 1 .8 2-.1 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  function lingua() { return T(IT ? "sup.lIt" : "sup.lZh"); }
  function sectionHTML() {
    var h = '<details class="set-sec" id="set-support"><summary>' + CUP + " " + esc(T("sup.title")) + '</summary><div class="vbody">';
    var list = codes();
    if (SEALS && list.length) {
      var b = list[0], o = load(), tt = title(b.lvl, o);
      h += '<div class="seal-main">' + svg(b.lvl, 132) + '<div class="seal-card"><b>' + esc(T("seal.n" + b.lvl)) + "</b>" + (tt ? '<span class="small">' + esc(tt) + (o.name ? " · " + esc(o.name) : "") + "</span>" : o.name ? '<span class="small">' + esc(o.name) + "</span>" : "") +
        '<span class="small muted">' + esc(T("seal.ed", { y: b.year, n: b.num })) + " · " + esc(T("seal.auth")) + '</span><span class="small"><span class="han" lang="zh-CN">' + CH[b.lvl] + "</span> " + esc(PY[b.lvl]) + " — " + esc(T("seal.m" + b.lvl)) + "</span></div></div>";
      if (list.length > 1) h += '<div class="seal-coll" aria-label="' + CP.attr(T("seal.coll")) + '">' + list.slice(1).map(function (x) { return '<span title="' + CP.attr(T("seal.n" + x.lvl) + " · " + T("seal.ed", { y: x.year, n: x.num })) + '">' + svg(x.lvl, 56) + "</span>"; }).join("") + "</div>";
      h += '<button type="button" class="btn-s" data-seal-prefs-open>' + esc(T("seal.prefs")) + "</button>";
    }
    if (DON) {
      h += '<p style="margin:0">' + esc(T("sup.text", { l: lingua() })) + "</p>" +
        '<a class="btn-s sup-go" href="' + CP.attr(C.SUPPORT_URL) + '" target="_blank" rel="noopener noreferrer">' + esc(T("sup.go")) + "</a>";
      if (SEALS) h += '<p class="small" style="margin:0">' + esc(T("sup.seals")) + "</p>";
      h += '<p class="small muted" style="margin:0">' + esc(T("sup.privacy")) + "</p>";
    }
    if (SEALS && KEYS.length) {
      h += '<details class="seal-redeem"><summary class="small"><b>' + esc(T("seal.redeem")) + '</b></summary><div class="vbody">' +
        '<label class="small" style="display:grid;gap:4px">' + esc(T("seal.paste")) + '<input id="seal-code" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="MDS1…"></label>' +
        '<div class="acts" style="margin:0"><button type="button" class="btn-s" data-seal-try>' + esc(T("seal.check")) + '</button><button type="button" class="btn-s" data-seal-scan>📷 ' + esc(T("seal.scan")) + "</button></div></div></details>";
    }
    return h + "</div></details>";
  }
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "info", html: sectionHTML });
  /* una riga nella schermata «Come funziona» */
  var about = document.getElementById("about-support");
  if (about && DON) { about.hidden = false; about.innerHTML = esc(T("sup.aboutLine")) + ' <button type="button" class="linklike" data-sup-open>' + esc(T("sup.title")) + "</button>"; }

  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-seal-add], [data-seal-prefs], [data-seal-prefs-open], [data-seal-try], [data-seal-scan], [data-sup-open]") : null; if (!b) return;
    if (b.hasAttribute("data-seal-add")) add();
    else if (b.hasAttribute("data-seal-prefs")) savePrefs();
    else if (b.hasAttribute("data-seal-prefs-open")) { var l = codes(); if (l.length) prefs(l[0].lvl, false); }
    else if (b.hasAttribute("data-seal-try")) { var v = (document.getElementById("seal-code") || {}).value || ""; offer(v); }
    else if (b.hasAttribute("data-seal-scan")) { if (CP.qrScan) CP.qrScan(T("seal.scan"), T("seal.scanHint"), function (t) { if (/MDS1\./.test(t)) { setTimeout(function () { offer(t); }, 300); return true; } return false; }); }
    else if (b.hasAttribute("data-sup-open")) CP.openSettings("set-support");
  });

  /* ---- il link …/#seal=<codice>: il frammento non arriva a nessun server; si toglie subito dall'indirizzo e si chiede ---- */
  if (SEALS && /^#seal=/.test(location.hash)) {
    var code = decodeURIComponent(location.hash.slice(6));
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    if (KEYS.length) setTimeout(function () { offer(code); }, 900);
  }

  /* ---- schermata d'avvio: chi ha un sigillo vede il suo carattere aprirsi dietro il frutto (ultimo esito salvato) ---- */
  var top = best(), sp = document.getElementById("splash");
  if (top && sp && !sp.classList.contains("gone")) { var ch = document.createElement("span"); ch.className = "sp-seal"; ch.setAttribute("aria-hidden", "true"); ch.textContent = CH[top.lvl]; sp.insertBefore(ch, sp.firstChild); }

  CP.seals = {
    svg: svg, paint: paint, best: best, list: codes, title: title, offer: offer, recheck: recheck,
    /* per la carta da condividere: il sigillo solo se la persona l'ha scelto */
    forShare: function () { var b = best(), o = load(); return b && o.share ? { lvl: b.lvl, year: b.year, num: b.num } : null; }
  };
  setTimeout(recheck, 2500);
})();
