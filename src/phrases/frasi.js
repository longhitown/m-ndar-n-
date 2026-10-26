
/* Scheda "Frasi": esercizi, laboratorio libero, modelli. */
(function () {
  var CP = window.CP, root = document.getElementById("build-root"), esc = CP.esc, W = CP.WORDS, T = CP.t;
  var TIME = ["今天", "明天", "昨天", "现在"], QW = ["什么", "谁", "哪里", "为什么", "多少", "几", "怎么"];
  var ADJ = ["大", "小", "多", "少", "贵", "便宜", "热", "冷", "漂亮", "好吃", "好喝", "好"];
  var FW = { ".": "。", "?": "？", "!": "！" };
  var sub = "ex", ex = null, queue = [], score = 0, tries = 0, exFilter = "", labMode = "build";
  /* un giro = 10 frasi: avanzamento, serie di risposte giuste al primo colpo, riepilogo alla fine */
  var ROUND = 10, round = { n: 0, ok: 0, run: 0, best: 0, done: false };
  function newRound() { round = { n: 0, ok: 0, run: 0, best: 0, done: false }; }
  var lab = { t: [], p: "auto", q: "", sec: "", view: "fluid", fixLog: null }, showIt = true, mine = [];
  try { mine = JSON.parse(localStorage.getItem("cp-mine") || "[]") || []; } catch (e) { mine = []; }
  mine = mine.filter(function (m) { return m && m.t && m.t.length && m.t.every(function (k) { return W[k]; }); });
  function saveMine() { try { localStorage.setItem("cp-mine", JSON.stringify(mine.slice(0, 40))); } catch (e) {} }

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function hz(k) { return W[k] ? W[k].hz : k; }
  function gloss(k) { return W[k].it.split(/[;,(:]/)[0].trim(); }
  function cap(x) { return x ? x.charAt(0).toUpperCase() + x.slice(1) : x; }
  function autoP(t) { return t.some(function (k) { return k === "吗" || QW.indexOf(k) >= 0; }) ? "?" : "."; }
  function pyOf(t, p) {
    var s = t.map(function (k) { return W[k].py; }).join(" ");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) + (p || "") : "";
  }
  function hzOf(t, p) { return t.map(hz).join("") + (FW[p] || ""); }
  function full(t, p, noGloss) {
    return '<div class="full"><div class="lp">' + CP.pinyinHTML(pyOf(t, p)) + "</div>" + CP.toneCurveHTML(pyOf(t, "")) + '<div class="lh" lang="zh-CN">' + CP.hanziHTML(hzOf(t, p), pyOf(t, p)) +
      "</div>" + (noGloss ? "" : '<div class="gloss" lang="it">' + esc(t.map(gloss).join(" · ")) + "</div>") + "</div>";
  }

  /* ---- sandhi tonale: il pinyin come si pronuncia davvero ---- */
  function retone(syl, from, to) { return syl.normalize("NFD").replace(from, to).normalize("NFC"); }
  function spokenPinyin(tokens) {
    var sy = [], notes = [];
    tokens.forEach(function (k, ti) {
      var w = W[k], chars = Array.from(w.hz).filter(function (c) { return /[㐀-鿿]/.test(c); });
      CP.syllables(w.py).forEach(function (s, si) { sy.push({ s: s, t: CP.tone(s), hz: w.hz, ch: chars[si] || w.hz, ti: ti, one: chars.length === 1 }); });
    });
    var note = function (m) { if (notes.indexOf(m) < 0) notes.push(m); };
    for (var i = 0; i < sy.length - 1; i++) {
      var c = sy[i], n = sy[i + 1], nt = (n.t === 5 && n.ch === "个") ? 4 : n.t;
      if (c.one && c.hz === "不" && c.s === "bù" && nt === 4) {
        c.s = "bú"; note("不 (bù) diventa «bú» davanti al 4° tono di " + n.hz + ".");
      } else if (c.one && c.hz === "一" && c.s === "yī" && !(i > 0 && "零一二两三四五六七八九十百千万第".indexOf(sy[i - 1].ch) >= 0) && "月号日点".indexOf(n.ch) < 0) {
        /* 一 resta yī nei numeri e nelle date: 十一, 第一, 一月, 一号 */
        if (nt === 4) { c.s = "yí"; note("一 (yī) diventa «yí» davanti al 4° tono di " + n.hz + "."); }
        else if (nt >= 1 && nt <= 3) { c.s = "yì"; note("一 (yī) diventa «yì» davanti a " + n.hz + "."); }
      } else if (c.t === 3 && n.t === 3) {
        c.s = retone(c.s, "̌", "́");
        note("Due 3° toni vicini (" + c.ch + " + " + n.ch + "): il primo si pronuncia come un 2° tono che sale, «" + c.s + "».");
      }
    }
    var py = tokens.map(function (_, ti) { return sy.filter(function (x) { return x.ti === ti; }).map(function (x) { return x.s; }).join("."); }).join(" ");
    return { py: py, notes: notes };
  }
  function spokenBlock(t, p) {
    if (!t.length) return "";
    var sp = spokenPinyin(t), orig = t.map(function (k) { return W[k].py; }).join(" ");
    if (sp.py === orig) return "";
    return '<div class="spoken"><span class="tag">' + T("ex.spoken") + '</span><div class="sp">' + CP.pinyinHTML(cap(sp.py) + (p || "")) + "</div>" + CP.toneCurveHTML(sp.py) +
      sp.notes.map(function (m) { return '<div class="snote">' + esc(m) + "</div>"; }).join("") + "</div>";
  }
  function tile(k, attr, extra) {
    var w = W[k];
    return '<button type="button" class="tile' + (extra || "") + '" ' + attr + '><span class="tp">' + CP.pinyinHTML(w.py) + '</span><span class="th">' + CP.hanziHTML(w.hz, w.py) + "</span>" +
      (showIt ? '<span class="ti" lang="it">' + esc(gloss(k)) + "</span>" : "") + "</button>";
  }
  var NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "两", "几"], DEM = ["这", "那"];
  var CLF = ["个", "本", "杯", "张", "件", "条", "块", "次", "岁", "点", "天", "年"];
  var CLF2 = ["个", "本", "杯", "张", "件", "条", "块", "天", "年", "次", "岁", "瓶", "碗", "盘", "双", "位", "只", "辆"];
  var NOUN_SECS = { persone: 1, famiglia: 1, cibo: 1, casa: 1, vestiti: 1, corpo: 1, natura: 1, luoghi: 1, viaggi: 1, lavoro: 1 };
  var NOT_NOUN = ["我", "你", "您", "他", "她", "它", "我们", "咱们", "你们", "他们", "大家", "自己", "别人", "结婚", "好吃", "好喝", "甜", "咸", "辣", "酸", "苦", "饿", "渴", "饱", "买单", "打包", "生病", "发烧", "疼", "健康", "下雨", "下雪", "旅游", "出发", "到达", "迷路", "游泳", "洗手间"];
  var ACTV = ["吃", "喝", "学", "看", "买", "工作", "睡觉"];
  function isNoun(k) { var w = W[k]; return !!w && !!NOUN_SECS[w.sec] && NOT_NOUN.indexOf(w.hz) < 0 && CLF.indexOf(w.hz) < 0; }
  function lint(t) {
    var m = [], h = t.map(hz), has = function (k) { return h.indexOf(k) >= 0; };
    var i0;
    if (has("吗") && QW.some(has)) m.push("吗 e una parola come 什么 o 哪里 non vanno insieme: per fare la domanda scegli un solo modo.");
    if (has("吗") && t[t.length - 1] !== "吗") m.push("吗 va sempre alla fine della frase.");
    var i = h.indexOf("是");
    if (i >= 0 && h[i + 1] && ADJ.indexOf(h[i + 1]) >= 0) m.push("Con un aggettivo di solito non si usa 是: si dice 我很好, non 我是好.");
    if (h.indexOf("不") >= 0 && h.indexOf("不") + 1 === h.indexOf("有")) m.push("Per «non avere» si dice 没有, non 不有.");
    var hn = h.indexOf("很");
    if (hn >= 0 && h[hn + 1] && ADJ.indexOf(h[hn + 1]) < 0 && ["喜欢", "想", "会", "懂", "有"].indexOf(h[hn + 1]) < 0) m.push("很 va davanti a un aggettivo (大, 热, 好吃…).");
    /* classificatore: numero o 这/那 subito davanti a un nome */
    for (i0 = 0; i0 < t.length - 1; i0++) {
      if ((NUM.indexOf(h[i0]) >= 0 || DEM.indexOf(h[i0]) >= 0) && isNoun(t[i0 + 1])) {
        m.push("Ricorda il classificatore! Tra un numero (o 这/那) e un nome serve quasi sempre un classificatore (es. 一个人, 一杯水, 这个人).");
        break;
      }
    }
    /* 二 / 两 davanti a un classificatore */
    for (i0 = 0; i0 < h.length - 1; i0++) {
      if (h[i0] === "二" && CLF2.indexOf(h[i0 + 1]) >= 0 && !(i0 > 0 && (NUM.indexOf(h[i0 - 1]) >= 0 || ["百", "千", "万"].indexOf(h[i0 - 1]) >= 0))) {
        m.push("Davanti a un classificatore o per contare le cose si usa 两 (liǎng), non 二 (èr): es. 两个人, 两杯茶.");
        break;
      }
    }
    /* 在 + luogo prima del verbo d'azione */
    var zi = h.indexOf("在");
    if (zi >= 0 && h[zi + 1] && ACTV.some(function (v) { var vi = h.indexOf(v); return vi >= 0 && vi < zi; })) {
      m.push("In cinese dove fai l'azione viene PRIMA del verbo: 我在家吃饭 (Io a-casa mangio).");
    }
    return m;
  }

  /* ---- esercizi ---- */
  var POOL = null;
  function pool() {
    if (POOL) return POOL;
    POOL = EX.map(function (e) { return { t: e[0], p: e[1], it: e[2] }; });
    var seen = {}; POOL.forEach(function (e) { seen[e.t.join("")] = 1; });
    PHRASES.forEach(function (g) {
      g.items.forEach(function (p) {
        var segs = CP.segment(p[1]), toks = [], ok = true;
        segs.forEach(function (s) { if (s.p) return; if (s.w) toks.push(s.w.key); else ok = false; });
        if (!ok || toks.length < 2 || toks.length > 8) return;
        var joined = toks.map(hz).join("");
        if (seen[joined]) return; seen[joined] = 1;
        var last = p[1].charAt(p[1].length - 1);
        POOL.push({ t: toks, p: last === "？" ? "?" : last === "！" ? "!" : last === "。" ? "." : "", it: p[2], disp: { py: p[0], hz: p[1] } });
      });
    });
    return POOL;
  }
  function exPoolFor(f) {
    return pool().filter(function (e) { return !f || e.t.some(function (k) { return W[k] && W[k].sec === f; }); });
  }
  function nextEx() {
    var P = exPoolFor(exFilter);
    if (!P.length) { exFilter = ""; P = exPoolFor(""); }
    if (!queue.length) queue = shuffle(P.map(function (_, i) { return i; }));
    var e = P[queue.pop()], toks = e.t.slice();
    var pool = shuffle(CP.ORDER.filter(function (k) { return toks.indexOf(k) < 0 && W[k].sec !== "numeri"; })).slice(0, 3);
    var alts = [toks.map(hz).join("")];
    for (var i = 1; i < toks.length; i++) if (TIME.indexOf(toks[i]) >= 0) {
      alts.push([toks[i]].concat(toks.filter(function (_, j) { return j !== i; })).map(hz).join(""));
    }
    ex = { t: toks, p: e.p, it: e.it, disp: e.disp || null, alts: alts, bank: shuffle(toks.concat(pool)).map(function (k, j) { return { id: j, k: k }; }), pick: [], tries: 0, state: "play" };
  }
  function exFull(e) {
    if (e.disp) {
      return '<div class="full"><div class="lp">' + CP.pinyinHTML(e.disp.py) + "</div>" + CP.toneCurveHTML(e.disp.py.replace(/[!?,.]/g, "")) + '<div class="lh" lang="zh-CN">' + CP.hanziHTML(e.disp.hz, e.disp.py.replace(/[!?,.]/g, "")) +
        '</div><div class="gloss" lang="it">' + esc(e.t.map(gloss).join(" · ")) + "</div></div>";
    }
    return full(e.t, e.p) + spokenBlock(e.t, e.p);
  }
  function roundHTML() {
    var pct = Math.round(round.ok * 100 / ROUND), msg = pct >= 90 ? T("ex.r90") : pct >= 70 ? T("ex.r70") : pct >= 40 ? T("ex.r40") : T("ex.r0");
    return '<div class="panel fx-sum"><div class="fx-sum-n">' + round.ok + "<small>/" + ROUND + '</small></div><p class="ask" style="margin:4px 0">' + esc(msg) + "</p>" +
      '<p class="muted small" style="margin:0">' + T("ex.rBest", { n: round.best }) + "</p>" +
      '<div class="acts"><button type="button" class="btn-main" id="ex-again" style="margin:0">🔁 ' + T("ex.again") + "</button>" + (CP.immerse && CP.immerse.active() ? '<button type="button" class="btn-s" data-fx-leave>' + T("fx.leave") + "</button>" : "") + "</div></div>";
  }
  function renderEx() {
    if (round.done) return roundHTML();
    if (!ex) nextEx();
    var byId = {}; ex.bank.forEach(function (b) { byId[b.id] = b; });
    var slot = ex.pick.map(function (id) { return tile(byId[id].k, 'data-un="' + id + '"'); }).join("");
    var bank = ex.bank.map(function (b) {
      var used = ex.pick.indexOf(b.id) >= 0;
      return tile(b.k, 'data-pick="' + b.id + '"' + (used || ex.state !== "play" ? " disabled" : ""), used ? " used" : "");
    }).join("");
    var fl = exFilter ? SECTIONS.filter(function (s) { return s.id === exFilter; })[0] : null;
    var h = '<div class="panel">' + (fl ? '<div class="acts" style="margin:0 0 10px"><span class="gpl">' + T("ex.stage") + " " + esc(fl.title.replace(/^\d+\.\s*/, "")) + '</span><button type="button" class="btn-s" id="exf-clear">' + T("ex.allPhrases") + '</button></div>' : "") +
      '<div class="ls-prog" aria-hidden="true"><i style="width:' + Math.round(round.n * 100 / ROUND) + '%"></i></div>' +
      '<span class="tag muted small">' + T("ex.count", { n: Math.min(ROUND, round.n + 1), tot: ROUND }) + (round.run >= 2 ? " · " + T("ex.run", { n: round.run }) : "") + "</span>" +
      '<p class="ask" lang="it">' + esc(ex.it) + "</p>" +
      '<div class="slot" aria-live="polite" data-empty="' + CP.attr(T("ex.slotEmpty")) + '">' + slot + "</div>";
    var spk = function () { return CP.audioBtns(ex.disp ? ex.disp.hz : hzOf(ex.t, ex.p)); };
    if (ex.state === "ok") h += '<p class="verdict ok">' + T("ex.right") + "</p>" + exFull(ex) + '<div class="acts">' + spk() + '<button type="button" class="btn-main" id="ex-next" style="margin-top:0">' + T("common.next") + '</button></div>';
    else if (ex.state === "show") h += '<p class="verdict ko">' + T("ex.shown") + "</p>" + exFull(ex) + '<div class="acts">' + spk() + '<button type="button" class="btn-main" id="ex-next" style="margin-top:0">' + T("common.next") + '</button></div>';
    else {
      h += '<div class="bank">' + bank + "</div>";
      if (ex.tries) h += '<p class="verdict ko">' + T("ex.notYet") + "</p>";
      h += '<div class="acts"><button type="button" id="ex-back">' + T("ex.undo") + "</button>" +
        (ex.tries >= 2 ? '<button type="button" id="ex-show">' + T("ex.solution") + "</button>" : "") +
        '<button type="button" id="ex-check"' + (ex.pick.length ? "" : " disabled") + ">" + T("ex.check") + "</button></div>";
    }
    h += '<div class="ex-foot"><label class="small muted"><input type="checkbox" id="opt-it"' + (showIt ? " checked" : "") + "> " + T("ex.showIt") + "</label>" +
      (CP.immerse && !CP.immerse.active() ? '<button type="button" class="btn-s" data-fx-go>⛶ ' + esc(CP.t("fx.enter")) + "</button>" : "") + "</div></div>";
    return h;
  }
  function checkEx() {
    var byId = {}; ex.bank.forEach(function (b) { byId[b.id] = b; });
    var got = ex.pick.map(function (id) { return hz(byId[id].k); }).join("");
    if (ex.alts.indexOf(got) >= 0) {
      ex.state = "ok"; score++;
      if (!ex.tries) { round.ok++; round.run++; round.best = Math.max(round.best, round.run); } ex.t = ex.pick.map(function (id) { return byId[id].k; }); if (ex.disp && ex.alts[0] !== got) ex.disp = null; if (CP.game) CP.game.sentence(); }
    else { ex.tries++; round.run = 0; }
  }

  /* ---- laboratorio ---- */
  function labPunct() { return lab.p === "auto" ? autoP(lab.t) : lab.p === "none" ? "" : lab.p; }
  function labToggle() {
    return '<div class="seg inner lab-view" role="group" aria-label="' + CP.attr(T("lab.viewAria")) + '"><button type="button" data-labview="fluid"' + (lab.view === "fluid" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🇮🇹 " + T("lab.fluid") + '</button><button type="button" data-labview="word"' + (lab.view === "word" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🧱 " + T("lab.word") + "</button></div>";
  }
  function fixBox(chk, p) {
    if (!chk || chk.ok) return "";
    var bad = hzOf(lab.t, p), good = hzOf(chk.fixed, p), fl = CP.lab.translate(chk.fixed, p === "?" ? "?" : p === "!" ? "!" : "."), why = chk.issues[0] === "Ordine non valido." ? T("lab.badOrder") : chk.issues[0].replace(/\.$/, "");
    return '<div class="fixbox" role="group" aria-label="' + CP.attr(T("lab.fixAria")) + '"><div class="fx-bad">⚠️ <b>' + T("lab.asWritten") + '</b> <span class="han" lang="zh-CN">' + esc(bad) + '</span> <span class="muted small">(' + esc(why) + ")</span></div>" +
      '<div class="fx-ok">✅ <b>' + T("lab.suggested") + '</b> <span class="han" lang="zh-CN">' + esc(good) + '</span> <span class="muted small">(' + esc(pyOf(chk.fixed, "").toLowerCase()) + (fl.sure ? " — «" + esc(fl.it.replace(/[.!?]$/, "")) + "»" : "") + ")</span></div>" +
      '<button type="button" class="btn-main" data-labfix>✨ ' + T("lab.autofix") + '</button></div>';
  }
  function fixLogBox() {
    if (!lab.fixLog || !lab.fixLog.length) return "";
    return '<div class="fixlog"><b>' + T("lab.fixed") + '</b><ol>' + lab.fixLog.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div>";
  }
  function labOut() {
    if (!lab.t.length) return labToggle() + '<p class="muted">' + T("lab.empty") + "</p>";
    var p = labPunct(), w = lint(lab.t).map(function (m) { return '<div class="warn">' + esc(m) + "</div>"; }).join("");
    var chk = CP.lab ? CP.lab.check(lab.t) : null, body;
    if (lab.view === "fluid" && CP.lab) {
      var src = chk && !chk.ok ? chk.fixed : lab.t, fl = CP.lab.translate(src, p === "?" ? "?" : p === "!" ? "!" : "."), ct = "";
      lab.tr = { zh: src.map(hz).join(""), it: fl.sure ? fl.it : "", id: fl.contribId || "" };
      var badge = fl.src === "mine" ? '<span class="tag mine-tag">✏️ ' + T("lab.mine") + '</span>' : fl.src === "verified" || fl.src === "data" ? '<span class="tag ok-tag">✓ ' + T("lab.verified") + '</span>' : "";
      if (fl.sure) ct = '<div class="fluid"><div class="fl-it" lang="it">' + esc(fl.it) + "</div>" + badge + (chk && !chk.ok ? '<div class="small muted">' + T("lab.ofFixed") + '</div>' : "") +
        fl.notes.map(function (n) { return '<div class="snote">' + esc(n) + "</div>"; }).join("") + "</div>";
      else ct = '<div class="fluid unsure"><div class="fl-it" lang="it">' + esc(CP.lab.NOPE) + "</div>" +
        '<div class="fl-words"><span class="small muted">' + T("lab.word") + ':</span> ' + fl.words.map(function (w) { return '<span class="flw"><span class="han" lang="zh-CN">' + esc(w[0]) + "</span> " + esc(w[1]) + "</span>"; }).join(" · ") + "</div>" +
        (fl.reason ? '<div class="snote">' + T("lab.why") + " " + esc(fl.reason) + ".</div>" : "") + "</div>";
      ct += CP.contribOpen ? '<div class="acts" style="margin:6px 0 0"><button type="button" class="btn-s" data-labtr>' + "✏️ " + (fl.sure ? T("lab.wrongTr") : T("lab.proposeTr")) + "</button></div>" : "";
      body = full(lab.t, p, true) + ct;
    } else body = full(lab.t, p);
    return labToggle() + body + fixBox(chk, p) + fixLogBox() + spokenBlock(lab.t, p) + w + '<div class="acts">' + CP.audioBtns(hzOf(lab.t, p)) +
      '<button type="button" id="lab-copy">' + T("lab.copy") + '</button><button type="button" id="lab-save">' + T("lab.save") + '</button><button type="button" id="lab-clear">' + T("lab.clear") + '</button></div><p class="small muted" id="lab-msg" aria-live="polite"></p>';
  }
  function labResults() {
    var q = CP.norm(lab.q.replace(/[0-9]/g, "")), list = CP.ORDER.filter(function (k) {
      var w = W[k];
      if (lab.sec && w.sec !== lab.sec) return false;
      return !q || (CP.norm(w.py) + "|" + w.hz + "|" + CP.norm(w.it)).indexOf(q) >= 0;
    });
    if (q) {
      var rank = function (k) {
        var w = W[k], g = CP.norm(gloss(k));
        return (g === q || CP.norm(w.py) === q || w.hz === q) ? 0 : (g.indexOf(q) === 0 || CP.norm(w.py).indexOf(q) === 0) ? 1 : 2;
      };
      list = list.map(function (k, i) { return { k: k, r: rank(k), i: i }; })
        .sort(function (a, b) { return a.r - b.r || a.i - b.i; }).map(function (o) { return o.k; });
    }
    var shown = list.slice(0, 36);
    return (shown.length ? '<div class="bank">' + shown.map(function (k) { return tile(k, 'data-add="' + CP.attr(k) + '"'); }).join("") + "</div>" : '<p class="muted">' + T("lab.none") + "</p>") +
      (list.length > shown.length ? '<p class="small muted">' + T("lab.more", { n: list.length - shown.length }) + "</p>" : "");
  }
  function labSlot() { return lab.t.map(function (k, i) { return tile(k, 'data-rm="' + i + '"'); }).join(""); }
  function mineHTML() {
    if (!mine.length) return "";
    return '<div class="panel mine"><h3>' + T("lab.myList") + '</h3>' + mine.map(function (m, i) {
      return '<div class="it2"><div><div class="lp">' + CP.pinyinHTML(pyOf(m.t, m.p)) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(hzOf(m.t, m.p), pyOf(m.t, m.p)) + '</div><div class="small muted" lang="it">' + esc(m.t.map(gloss).join(" · ")) + "</div></div>" +
        '<button type="button" data-load="' + i + '" aria-label="' + CP.attr(T("lab.reopen")) + '">' + T("lab.open") + '</button><button type="button" data-del="' + i + '" aria-label="' + CP.attr(T("lab.del")) + '">×</button></div>';
    }).join("") + "</div>";
  }
  function renderLab() {
    var secs = '<option value="">' + T("lab.allTopics") + '</option>' + SECTIONS.map(function (s) { return '<option value="' + s.id + '"' + (lab.sec === s.id ? " selected" : "") + " lang=\"it\">" + esc(s.title) + "</option>"; }).join("");
    var ps = [["auto", T("lab.pAuto")], [".", T("lab.pDot") + " ."], ["?", T("lab.pQ") + " ?"], ["!", T("lab.pEx") + " !"], ["none", T("lab.pNone")]].map(function (o) {
      return '<option value="' + o[0] + '"' + (lab.p === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
    }).join("");
    return '<div class="panel"><h3>' + T("lab.yours") + '</h3><div class="slot" id="lab-slot" data-empty="' + CP.attr(T("lab.slotEmpty")) + '">' + labSlot() + "</div>" +
      '<div id="lab-out" style="margin-top:12px">' + labOut() + "</div>" +
      '<div class="row2"><label for="lab-p">' + T("lab.punct") + '<select id="lab-p">' + ps + "</select></label></div></div>" +
      '<div class="panel"><h3>' + T("lab.words") + '</h3><div class="tools" style="margin-top:0"><div class="search"><label for="lab-q" class="sr">' + T("lab.search") + "</label>" +
      '<input id="lab-q" type="search" placeholder="' + CP.attr(T("lab.searchPh")) + '" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + CP.attr(lab.q) + '"></div>' +
      '<div style="grid-column:1/-1"><label for="lab-sec" class="sr">' + T("lab.topic") + '</label><select id="lab-sec">' + secs + "</select></div></div>" +
      '<div id="lab-res">' + labResults() + "</div></div>" + '<div id="lab-mine">' + mineHTML() + "</div>";
  }
  function updLab() {
    var s = document.getElementById("lab-slot"), o = document.getElementById("lab-out");
    if (s) s.innerHTML = labSlot();
    if (o) o.innerHTML = labOut();
  }

  /* ---- modelli ---- */
  function renderPat() {
    return '<p class="lede" style="margin:14px 0 0">' + T("pat.lede", { n: PATTERNS.length }) + "</p>" +
      PATTERNS.map(function (p, i) {
        return '<details class="pat" id="pat-' + i + '" lang="it"><summary>' + esc(p.t) + "</summary>" +
          '<p style="margin:0 0 10px">' + p.f.map(function (f, j) { return (j ? "+ " : "") + '<span class="fx">' + (/[一-鿿]/.test(f) && !/[a-zàèéìòù]{3}/i.test(f) ? '<span class="han" lang="zh-CN">' + esc(f) + "</span>" : esc(f)) + "</span>"; }).join(" ") + "</p>" +
          '<p class="muted" style="margin:0 0 8px">' + esc(p.n) + "</p>" +
          p.ex.map(function (e) {
            if (typeof e[0] === "string") e = [CP.segment(e[0]).filter(function (s) { return s.w; }).map(function (s) { return s.w.key; }), e[1], e[2]];
            return '<div class="ex"><div class="lp">' + CP.pinyinHTML(pyOf(e[0], e[1])) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(hzOf(e[0], e[1]), pyOf(e[0], e[1])) + '</div><div class="small muted">' + esc(e[2]) + "</div></div>";
          }).join("") +
          '<div class="acts" lang="' + uiLang() + '"><button type="button" data-pat="' + i + '">' + T("pat.try") + '</button></div></details>';
      }).join("");
  }

  /* ---- struttura ---- */
  /* §4.3: tre gruppi invece di sei pillole scorrevoli */
  var GROUPS = [["learn", "grp.learn", [["lessons", "sub.lessons"], ["pat", "sub.pat"]]], ["build", "grp.build", [["ex", "sub.ex"], ["lab", "sub.lab"], ["slot", "sub.slot"]]], ["talk", "grp.talk", [["dlg", "sub.dlg"], ["thought", "sub.thought"]]], ["read", "grp.read", [["reader", "sub.reader"]]]];
  function subList() { var l = []; GROUPS.forEach(function (g) { l = l.concat(g[2]); }); return l; }
  function curSub() { return sub === "lab" && labMode === "slot" ? "slot" : sub; }
  function groupOf(x) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i][2].some(function (s) { return s[0] === x; })) return GROUPS[i]; return GROUPS[0]; }
  function render() {
    var cs = curSub(), g = groupOf(cs);
    var segs = GROUPS.map(function (x) {
      return '<button type="button" role="tab" data-group="' + x[0] + '"' + (x === g ? ' class="on" aria-selected="true"' : ' aria-selected="false"') + ">" + CP.t(x[1]) + "</button>";
    }).join("");
    var inner = '<div class="fx-row"><div class="seg inner" role="group" aria-label="' + CP.attr(CP.t(g[1])) + '">' + g[2].map(function (s) {
      return '<button type="button" data-sub="' + s[0] + '"' + (cs === s[0] ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + CP.t(s[1]) + "</button>";
    }).join("") + '</div><button type="button" class="fx-go" data-fx-go title="' + CP.attr(CP.t("fx.enter")) + '" aria-label="' + CP.attr(CP.t("fx.enter")) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>';
    var body;
    if (sub === "ex") body = renderEx();
    else if (sub === "lab") body = labMode === "slot" && CP.subs && CP.subs.slot ? CP.subs.slot.render() : renderLab();
    else if (sub === "pat") body = renderPat();
    else body = (CP.subs && CP.subs[sub]) ? CP.subs[sub].render() : "";
    root.innerHTML = '<h2 style="margin-top:20px">' + CP.t("build.title") + '</h2><div class="pills groups" role="tablist" aria-label="' + CP.attr(CP.t("build.tools")) + '">' + segs + "</div>" + inner + body;
    if (CP.subs && CP.subs[sub] && CP.subs[sub].after) CP.subs[sub].after(root);
    if (sub === "lab" && labMode === "slot" && CP.subs && CP.subs.slot && CP.subs.slot.after) CP.subs.slot.after(root);
    if (CP.immerse && CP.immerse.active()) {
      if (sub === "ex") { CP.immerse.progress(round.n, ROUND); CP.immerse.combo(round.run); }
    }
    var on = root.querySelector(".pills .on"); if (on && on.scrollIntoView) { try { on.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {} }
  }

  root.addEventListener("click", function (ev) {
    var t = ev.target.closest ? ev.target.closest("button") : null;
    if (!t) return;
    var a = function (n) { return t.getAttribute(n); };
    if (a("data-group")) { var gg = GROUPS.filter(function (x) { return x[0] === a("data-group"); })[0]; if (gg && groupOf(curSub()) !== gg) { var f = gg[2][0][0]; if (f === "slot") { sub = "lab"; labMode = "slot"; } else { sub = f; if (f === "lab") labMode = "build"; } } render(); return; }
    if (a("data-sub")) { var sv = a("data-sub"); if (sv === "slot") { sub = "lab"; labMode = "slot"; } else { sub = sv; if (sv === "lab") labMode = "build"; } render(); return; }
    if (a("data-labmode")) { labMode = a("data-labmode"); render(); return; }
    if (t.id === "exf-clear") { exFilter = ""; ex = null; queue = []; render(); return; }
    if (a("data-pick") !== null && sub === "ex") { if (ex.state === "play") { CP.sfx("tap"); ex.pick.push(parseInt(a("data-pick"), 10)); render(); } return; }
    if (a("data-un") !== null && sub === "ex") { if (ex.state === "play") { CP.sfx("tap"); ex.pick = ex.pick.filter(function (id) { return id !== parseInt(a("data-un"), 10); }); render(); } return; }
    if (t.id === "ex-back") { CP.sfx("tap"); ex.pick.pop(); render(); return; }
    if (t.id === "ex-check") { checkEx(); CP.sfx(ex.state === "ok" ? "ok" : "ko"); render(); return; }
    if (t.id === "ex-show") { ex.state = "show"; round.run = 0; render(); return; }
    if (t.id === "ex-next") {
      ex = null; round.n++;
      if (round.n >= ROUND) { round.done = true; CP.sfx("ok", 5); if (CP.game && CP.game.xp) CP.game.xp(Math.max(1, Math.round(round.ok / 2))); }
      render(); return;
    }
    if (t.id === "ex-again") { newRound(); ex = null; CP.sfx("tap"); render(); return; }
    if (t.hasAttribute("data-fx-leave")) { if (CP.immerse) CP.immerse.leave(); return; }
    if (t.hasAttribute("data-fx-go")) { CP.sfx("tap"); immerse(); return; }
    if (a("data-labtr") !== null && lab.tr) { CP.contribOpen({ op: "tr", target: lab.tr.zh, old: lab.tr.it, fromId: lab.tr.id }); return; }
    if (a("data-labview")) { lab.view = a("data-labview"); CP.sfx("tap"); updLab(); return; }
    if (a("data-labfix") !== null) {
      var ck = CP.lab.check(lab.t); if (!ck.ok) { lab.fixLog = ck.steps.slice(); lab.t = ck.fixed.slice(); CP.sfx("ok"); updLab(); var fb = document.querySelector(".fixlog"); if (fb && fb.scrollIntoView) fb.scrollIntoView({ block: "nearest" }); }
      return;
    }
    if (a("data-add") !== null) { CP.sfx("tap"); lab.t.push(a("data-add")); lab.fixLog = null; updLab(); return; }
    if (a("data-rm") !== null) { CP.sfx("tap"); lab.t.splice(parseInt(a("data-rm"), 10), 1); lab.fixLog = null; updLab(); return; }
    if (t.id === "lab-clear") { lab.t = []; lab.fixLog = null; updLab(); return; }
    if (t.id === "lab-copy") {
      var txt = hzOf(lab.t, labPunct()), msg = document.getElementById("lab-msg");
      var ok = function () { if (msg) msg.textContent = T("lab.copied", { t: txt }); }, bad = function () { if (msg) msg.textContent = T("lab.noCopy", { t: txt }); };
      try { navigator.clipboard.writeText(txt).then(ok, bad); } catch (x) { bad(); }
      return;
    }
    if (t.id === "lab-save") {
      mine.unshift({ t: lab.t.slice(), p: labPunct() }); saveMine();
      document.getElementById("lab-mine").innerHTML = mineHTML();
      var m2 = document.getElementById("lab-msg"); if (m2) m2.textContent = T("lab.saved");
      return;
    }
    if (a("data-load") !== null) { var m = mine[parseInt(a("data-load"), 10)]; lab.t = m.t.slice(); lab.p = m.p || "auto"; render(); window.scrollTo(0, 0); return; }
    if (a("data-del") !== null) { mine.splice(parseInt(a("data-del"), 10), 1); saveMine(); document.getElementById("lab-mine").innerHTML = mineHTML(); return; }
    if (a("data-pat") !== null) {
      var p = PATTERNS[parseInt(a("data-pat"), 10)], e = p.ex[0];
      if (typeof e[0] === "string") e = [CP.segment(e[0]).filter(function (s) { return s.w; }).map(function (s) { return s.w.key; }), e[1], e[2]];
      lab.t = e[0].slice(); labMode = "build"; lab.p = e[1] || "none"; sub = "lab"; render(); window.scrollTo(0, 0);
    }
  });
  root.addEventListener("input", function (ev) {
    if (ev.target.id === "lab-q") { lab.q = ev.target.value; document.getElementById("lab-res").innerHTML = labResults(); }
  });
  root.addEventListener("change", function (ev) {
    var id = ev.target.id;
    if (id === "lab-sec") { lab.sec = ev.target.value; document.getElementById("lab-res").innerHTML = labResults(); }
    else if (id === "lab-p") { lab.p = ev.target.value; updLab(); }
    else if (id === "opt-it") { showIt = ev.target.checked; render(); }
  });
  /* ⛶: l'attività aperta a schermo pieno; all'uscita Frasi torna com'era */
  function immerse() {
    if (!CP.immerse) return;
    var cs = curSub(), name = ""; subList().forEach(function (x) { if (x[0] === cs) name = CP.t(x[1]); });
    if (sub === "ex" && round.done) newRound();
    CP.immerse.enter({ title: name, onExit: function () { render(); } });
    render();
  }
  CP.lint = lint; CP.spoken = spokenPinyin; CP._lab = lab;
  CP.labRefresh = function () { if (sub === "lab" && labMode !== "slot") updLab(); };
  CP.build = {
    render: function () { render(); },
    immerse: immerse,
    setSub: function (s) { sub = s; render(); },
    practice: function (secId) {
      exFilter = secId || ""; ex = null; queue = []; sub = "ex";
      if (!exPoolFor(exFilter).length) { exFilter = ""; lab.sec = secId; sub = "lab"; labMode = "build"; }
      render();
    },
    exCount: function (secId) { return exPoolFor(secId).length; },
    openPattern: function (i) {
      sub = "pat"; render();
      var d = document.getElementById("pat-" + i);
      if (d) { d.open = true; setTimeout(function () { d.scrollIntoView({ block: "center" }); }, 30); }
    },
    setSlot: function () { sub = "lab"; labMode = "slot"; render(); },
    labSection: function (id) { lab.sec = id; sub = "lab"; labMode = "build"; render(); },
    labLoad: function (t, p) { lab.t = t.slice(); lab.p = p || "auto"; lab.fixLog = null; sub = "lab"; labMode = "build"; render(); window.scrollTo(0, 0); },
    openLesson: function (id) { sub = "lessons"; if (CP.lessons) CP.lessons.open(id); render(); window.scrollTo(0, 0); }
  };
  CP.subs = CP.subs || {};
  CP.onBuild = function () { if (!root.innerHTML) render(); };
  CP.onVoice = function () { if (root.innerHTML) { /* i pulsanti .say vengono mostrati da pickVoice */ } };
  render();
})();

