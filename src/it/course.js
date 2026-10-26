/* ===== Corso di italiano per chi parla cinese (意大利语课程) — la direzione «al contrario» dell'app.
   Si sceglie dal benvenuto o da ⚙️ → Corso (cp-course = "zh" cinese per italiani, predefinito | "it" italiano per cinesi).
   In modalità "it" l'interfaccia è in cinese e le quattro schede diventano: 课程 (lezioni), 单词 (parole), 复习 (ripasso),
   变位 (coniugazioni), 句子 (frasi e dialoghi). Le parole italiane non sono scritte a mano qui: nascono dalle schede
   grammaticali di data/grammar.js (genere, plurale, ausiliare) e dalla morfologia di phrases/italian.js, controllate con
   tools/morphit-check.mjs (Morph-it + Hunspell). I progressi stanno in chiavi proprie: cp-it-srs-v1, cp-it-lessons-v1. ===== */
(function () {
  var CP = window.CP, esc = CP.esc, W = CP.WORDS, G = GRAM, I = CP.ita;
  var KEY = "cp-course", SRSKEY = "cp-it-srs-v1", LKEY = "cp-it-lessons-v1", NEW_PER_DAY = 10, PASS = 80;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var course = lsGet(KEY) === "it" ? "it" : "zh";
  CP.course = function () { return course; };
  CP.setCourse = function (c) {
    lsSet(KEY, c === "it" ? "it" : "zh");
    lsSet("cp-lang", c === "it" ? "zh" : "it");
    if (window.Store && Store.flush) Store.flush();
    location.reload();
  };
  /* ⚙️ → Corso: in tutte e due le lingue, perché lo deve capire chi non legge l'altra */
  (CP.settingsExtras = CP.settingsExtras || []).unshift(function () {
    return '<details class="set-sec" id="set-course"><summary>🎓 Corso · 课程</summary><div class="vbody">' +
      '<div class="seg" role="group" aria-label="Corso · 课程"><button type="button" data-course-set="zh"' + (course === "zh" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🇮🇹 Impara il cinese · 学中文</button>" +
      '<button type="button" data-course-set="it"' + (course === "it" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🇨🇳 学意大利语</button></div>" +
      '<p class="small muted" style="margin:0">Due corsi, progressi separati: passare dall\'uno all\'altro non cancella niente. · 两个课程的学习记录分开保存，切换不会丢失任何内容。</p></div></details>';
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-course-set]") : null;
    if (b && b.getAttribute("data-course-set") !== course) CP.setCourse(b.getAttribute("data-course-set"));
  });
  if (course !== "it") return;

  /* ================= da qui: modalità corso di italiano ================= */
  /* ⚙️ → 语音: la voce italiana (velocità, scelta della voce, prova), poi musica e suono */
  var IVK = "cp-it-voice";
  function itVoices() { var s = window.speechSynthesis; return s && s.getVoices ? (s.getVoices() || []).filter(function (v) { return /^it/i.test(v.lang || ""); }) : []; }
  CP.itVoiceURI = function () { var u = lsGet(IVK) || "", vs = itVoices(); return vs.some(function (v) { return v.voiceURI === u; }) ? u : (vs[0] ? vs[0].voiceURI : ""); };
  CP.voiceUIOverride = function (body, sum) {
    var vs = itVoices(), cur = CP.itVoiceURI(), slow = CP.pref.rate !== 1;
    var h = '<div class="seg" role="group" aria-label="语速"><button type="button" data-rate="0.8"' + (slow ? ' class="on"' : "") + '>🐢 慢</button><button type="button" data-rate="1"' + (!slow ? ' class="on"' : "") + ">🐇 正常</button></div>";
    if (vs.length > 1) h += '<label class="small muted" for="it-voice-sel" style="display:grid;gap:4px;font-weight:600">意大利语语音<select id="it-voice-sel">' + vs.map(function (v) { return '<option value="' + CP.attr(v.voiceURI) + '"' + (v.voiceURI === cur ? " selected" : "") + ">" + esc(v.name) + " (" + esc(v.lang) + ")</option>"; }).join("") + "</select></label>";
    else h += '<p class="small muted" style="margin:0">' + (vs.length ? "意大利语语音：" + esc(vs[0].name) + "。" : "设备没有列出意大利语语音：会尝试用默认语音朗读（it-IT）。如果听不到，请在手机设置的「文字转语音」里安装意大利语。") + "</p>";
    h += (window.__mdVoiceHelp ? window.__mdVoiceHelp("it-IT") : "") +
      '<label class="chk"><input type="checkbox" id="opt-sfx"' + (CP.pref.sfx ? " checked" : "") + '> 点击音效</label>' +
      '<label class="chk"><input type="checkbox" id="opt-haptics"' + (CP.pref.haptics ? " checked" : "") + '> 振动</label>' +
      (CP.voiceExtra ? CP.voiceExtra() : "") +
      '<button type="button" class="btn-main" id="it-voice-test" style="margin-top:4px">试听：Ciao! Come stai?</button>';
    body.innerHTML = h;
    if (sum) sum.textContent = slow ? "🐢 慢" : "🐇 正常";
    return true;
  };
  (function () { var vb = document.getElementById("vset-body"); if (vb) CP.voiceUIOverride(vb, document.getElementById("vsum")); })();
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "it-voice-sel") { lsSet(IVK, e.target.value); CP.sfx("tap"); } });
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("#it-voice-test") : null;
    if (b) CP.speak("Ciao! Come stai?", { lang: "it-IT", el: b, voiceURI: CP.itVoiceURI() });
  });
  /* il «cammino» in alto porterebbe al Percorso del corso di cinese: qui porta al ripasso */
  var pillEl = document.getElementById("game-pill");
  if (pillEl) pillEl.addEventListener("click", function (e) { e.stopImmediatePropagation(); CP.itShow("review"); }, true);
  /* ⚙️ → 使用说明 */
  var about = document.querySelector("#set-about .lede");
  if (about) about.innerHTML = "给说中文的人学意大利语：" + "<b>" + ITLESSONS.length + " 课语法</b>、常用词、动词变位和中意对照的句子。每个意大利语词都可以听发音，复习间隔由 FSRS 算法安排。所有内容都可以离线使用。";
  var Z = {
    lessons: "课程", words: "单词", review: "复习", conj: "变位", phrases: "句子",
    listen: "听", back: "← 返回", start: "开始", next: "下一题", result: "看结果", right: "答对了！", wrong: "不对。", answerIs: "正确答案：",
    order: "把词语排成正确的句子：", check: "检查", clear: "删除", showAnswer: "显示答案", again: "忘了", hard: "困难", good: "记得", easy: "简单"
  };
  var TOPIC = { persone: "人", famiglia: "家庭", saluti: "问候", risposte: "回答和连接", verbi1: "常用动词（一）", verbi2: "常用动词（二）", domande: "提问", numeri: "数字和量词", tempo: "时间", spazio: "方位", cibo: "饮食", aggettivi: "形容词", stati: "心情和状态", luoghi: "地点和国家", viaggi: "旅行和交通", casa: "家里的东西", vestiti: "衣服和颜色", corpo: "身体和健康", natura: "自然和动物", lavoro: "工作和学习", cucina: "厨房", citta: "城市", conversazione: "口语", acquisti: "购物" };
  var PHR_ZH = ["自我介绍、打开话题", "听懂、说清楚、求助", "在咖啡馆吃早饭", "在饭店点菜", "购物、价格和付款", "问路和找方向", "出租车、火车和机场", "在酒店，房间出了问题", "时间、约会和朋友", "工作、学习和日常生活", "健康、身体和紧急情况", "谈西西里、意大利和天气"];
  var DLG_ZH = { taxi: "坐出租车", dogana: "过海关", bagaglio: "行李没有到", scheda: "买电话卡", cambio: "换钱", checkin: "办理入住", wifi: "无线网连不上", aria: "房间太热", checkout: "退房", servizi: "请酒店帮忙", ristorante: "在饭店", zaofan: "中式早餐", allergia: "过敏和忌口", kafei: "在咖啡馆", chuan: "路边小吃", treno: "在火车上", metro: "坐地铁", piaoc: "买火车票", gongjiao: "坐公交车", wandian: "火车晚点了", mercato: "在市场", saoma: "扫码付款", shiyi: "试衣服", shuiguo: "在水果摊", tuihuo: "换货或退货", farmacia: "在药店", caffe: "和朋友喝咖啡", sicilia: "聊聊西西里", yisheng: "看医生", diu: "钱包丢了", ganbei: "商务晚宴", jiali: "去朋友家做客" };
  var PRON = [["io", 0], ["tu", 1], ["lui", 2], ["lei", 2], ["noi", 3], ["voi", 4], ["loro", 5]];

  /* ---------------- lessico: dalle schede grammaticali ---------------- */
  function pyOf(h) { var k = W[h] ? h : null; return k ? W[k].py : ""; }
  function wordOf(key) { return W[key] || null; }
  var LEX = [], BYID = {};
  function add(e) { if (BYID[e.id]) return; BYID[e.id] = e; LEX.push(e); }
  function art(w, g, num) { return I.join(I.def(w, g, num), w); }
  Object.keys(G.nouns).forEach(function (k) {
    var w = wordOf(k); if (!w) return;
    var n = G.nouns[k], s = n[0], g = n[1], p = n[2], fl = n[3] || "", gp = g === "f" ? "f" : (/a$/.test(p) && /o$/.test(s) ? "f" : "m");
    var only = /p/.test(fl) && s === p;
    var main = only ? art(p, gp, "p") : art(s, g, "s"), forms = only ? [main + "（只用复数）"] : [main, art(p, gp, "p")];
    if (n[4] && n[4] !== s) forms.push(art(n[4], "f", "s") + "（女）");
    add({ id: "it:n:" + k, it: main, say: main, kind: "noun", g: only ? gp : g, forms: forms, zh: w.hz, py: w.py, sec: w.sec });
  });
  Object.keys(G.places).forEach(function (k) {
    var w = wordOf(k), pl = G.places[k]; if (!w || !pl[0] || BYID["it:n:" + k]) return;
    add({ id: "it:l:" + k, it: pl[0], say: pl[0], kind: "place", forms: [pl[0], pl[1]], zh: w.hz, py: w.py, sec: w.sec });
  });
  Object.keys(G.nations).forEach(function (k) {
    var w = wordOf(k), na = G.nations[k]; if (!w || !Array.isArray(na)) return;
    add({ id: "it:a:" + k + "人", it: na[0] + ", " + na[1], say: na[0], kind: "nat", forms: na, zh: w.hz + "人", py: w.py + " rén", sec: w.sec });
  });
  Object.keys(G.verbs).forEach(function (k) {
    var w = wordOf(k), v = G.verbs[k]; if (!w) return;
    add({ id: "it:v:" + k, it: v[0], say: v[0], kind: "verb", aux: v[1], zh: w.hz, py: w.py, sec: w.sec });
  });
  Object.keys(G.adjs).forEach(function (k) {
    var w = wordOf(k), a = G.adjs[k]; if (!w) return;
    add({ id: "it:j:" + k, it: a[0] === a[1] ? a[0] : a[0] + ", " + a[1], say: a[0], kind: "adj", forms: a, zh: w.hz, py: w.py, sec: w.sec });
  });
  Object.keys(G.time).forEach(function (k) {
    var w = wordOf(k); if (!w) return;
    add({ id: "it:t:" + k, it: G.time[k][0], say: G.time[k][0], kind: "time", zh: w.hz, py: w.py, sec: w.sec });
  });
  /* il resto del vocabolario (data/it/lexicon.js, da tools/itlex.mjs: controllato con Morph-it): nomi con genere e plurale,
     aggettivi con le quattro forme, verbi all'infinito, avverbi ed espressioni */
  (typeof IT_LEXICON !== "undefined" ? IT_LEXICON : []).forEach(function (r) {
    var keys = r[0].split("|").filter(function (k) { return W[k]; }); if (!keys.length) return;
    var w = W[keys[0]], zh = w.hz, py = w.py, alt = keys.slice(1).map(function (k) { return W[k].hz; });
    if (r[1] === "n") {
      var g = r[3], one = g === "mf" ? "m" : g, main = art(r[2], one, "s"), forms = [main, art(r[4], one, "p")];
      if (g === "mf") forms = [main + " / " + art(r[2], "f", "s"), art(r[4], "m", "p") + " / " + art(r[4], "f", "p")];
      add({ id: "it:n:" + keys[0], it: main, say: main, kind: "noun", g: g, forms: forms, zh: zh, py: py, sec: w.sec, ex: keys[0], alt: alt });
    } else if (r[1] === "j") add({ id: "it:j:" + keys[0], it: r[3][0] === r[3][1] ? r[3][0] : r[3][0] + ", " + r[3][1], say: r[3][0], kind: "adj", forms: r[3], zh: zh, py: py, sec: w.sec, ex: keys[0], alt: alt });
    else if (r[1] === "v") add({ id: "it:v:" + keys[0], it: r[2], say: r[2], kind: "verb", aux: null, zh: zh, py: py, sec: w.sec, ex: keys[0], alt: alt });
    else add({ id: "it:x:" + keys[0], it: r[2], say: r[2], kind: "other", zh: zh, py: py, sec: w.sec, ex: keys[0], alt: alt });
  });
  var SECIDX = {}; CP.SEC.forEach(function (s, i) { SECIDX[s.id] = i; });
  LEX.sort(function (a, b) { return (SECIDX[a.sec] || 0) - (SECIDX[b.sec] || 0); });
  var KIND = { noun: "名词", place: "地名", nat: "国籍", verb: "动词", adj: "形容词", time: "时间词", other: "词语" };
  function gLabel(e) { return e.kind === "noun" ? (e.g === "f" ? "名词 · 阴性" : e.g === "mf" ? "名词 · 阳性/阴性" : "名词 · 阳性") : KIND[e.kind]; }
  /* frase d'esempio della parola: le stesse di data/examples, lette al contrario (italiano → cinese) */
  function exOf(e) {
    var k = e.ex || e.id.replace(/^it:\w:/, ""), x = typeof EXAMPLES !== "undefined" && EXAMPLES[k];
    if (x) return { it: x[1], zh: x[0] };
    var y = CP.exampleFor && W[k] ? CP.exampleFor(k) : null;   /* altrimenti la frase più corta dell'app che contiene la parola */
    return y ? { it: y[2], zh: y[1] } : null;
  }
  function exHTML(e) {
    var x = exOf(e); if (!x) return "";
    return '<div class="it-ex"><span class="tag muted small">例句</span><div lang="it" class="it-ex-it">' + esc(x.it) + " " + sayBtn(x.it, true) + '</div><div class="small muted" lang="zh-CN">' + esc(x.zh) + "</div></div>";
  }
  CP.itLexicon = function () { return LEX.slice(); };

  /* coniugazione in tabella: presente e passato prossimo */
  function conjTable(inf, aux) {
    var rows = PRON.filter(function (p) { return p[0] !== "lei"; }).map(function (p) {
      var pi = p[1], g = "m", num = pi >= 3 ? "p" : "s";
      return [p[0] === "lui" ? "lui / lei" : p[0], I.present(inf, pi), I.passato(inf, aux, pi, aux === "e" || /rsi(\s|$)/.test(inf) ? "x" : g, num)];
    });
    return '<table class="it-conj"><thead><tr><th></th><th>现在时</th><th>近过去时</th></tr></thead><tbody>' +
      rows.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td></tr>"; }).join("") + "</tbody></table>" +
      (aux === "e" || /rsi(\s|$)/.test(inf) ? '<p class="small muted" style="margin:4px 0 0">用 essere：分词要和主语一致（andato / andata / andati / andate）。</p>' : "");
  }
  function zhHTML(hz, py) { return '<span class="it-zh"><span class="lp">' + CP.pinyinHTML(py) + '</span> <span class="lh han" lang="zh-CN">' + CP.hanziHTML(hz, py) + "</span></span>"; }
  function sayBtn(text, small) { return '<button type="button" class="say' + (small ? " btn-s" : "") + '" data-it-say="' + CP.attr(text) + '" aria-label="' + CP.attr("听：" + text) + '">🔊</button>'; }
  function detailHTML(e) {
    var h = '<div class="fam-head"><div class="meta"><b lang="it" style="font-size:1.35rem">' + esc(e.it) + "</b><div class=\"small muted\">" + esc(gLabel(e)) + '</div></div><button type="button" class="fam-x btn-s" data-famclose>关闭</button></div>' +
      '<div class="acts" style="margin:6px 0">' + sayBtn(e.say) + "</div><p style=\"margin:6px 0\">" + zhHTML(e.zh, e.py) + (e.alt && e.alt.length ? ' <span class="small muted">也说：<span lang="zh-CN">' + esc(e.alt.join("、")) + "</span></span>" : "") + "</p>";
    if (e.kind === "noun") h += "<p>" + e.forms.map(esc).join(" · ") + '</p><p class="small muted">单数 · 复数（带定冠词）。冠词说明见第 3 课。</p>';
    else if (e.kind === "adj") h += '<p lang="it">' + esc(e.forms.join(" · ")) + '</p><p class="small muted">阳性单数 · 阴性单数 · 阳性复数 · 阴性复数（见第 5 课）。</p>';
    else if (e.kind === "nat") h += '<p lang="it">' + esc(e.forms.join(" · ")) + '</p><p class="small muted">国籍是形容词：要配合性别和单复数，而且小写。</p>';
    else if (e.kind === "place") h += '<p lang="it">' + esc(e.forms[1]) + '</p><p class="small muted">去 / 在：' + esc(e.forms[1]) + "。</p>";
    else if (e.kind === "verb" && e.aux) h += conjTable(e.it, e.aux);
    else if (e.kind === "verb") h += '<p lang="it">' + PRON.filter(function (p) { return p[0] !== "lei"; }).map(function (p) { return esc(p[0] === "lui" ? "lui/lei" : p[0]) + " " + esc(I.present(e.it, p[1])); }).join(" · ") + '</p><p class="small muted">现在时（见第 6 课）。</p>';
    return h + exHTML(e);
  }

  /* ---------------- guscio: vista e schede ---------------- */
  document.body.classList.add("course-it");
  var brand = document.querySelector("h1.brand"), sub = brand && brand.querySelector("text.font-sub");
  if (sub) sub.textContent = "给中国人的意大利语";
  if (brand) brand.setAttribute("aria-label", "màndarínō，给中国人的意大利语课程");
  document.documentElement.setAttribute("lang", "zh-CN");
  var main = document.querySelector("main") || document.body;
  var view = document.createElement("div"); view.id = "view-it"; view.setAttribute("lang", "zh-CN"); main.appendChild(view);
  if (CP.immerse) CP.immerse.watch(view);
  var TABS = [["lessons", "📘", Z.lessons], ["words", "📖", Z.words], ["review", "🎴", Z.review], ["conj", "🔁", Z.conj], ["phrases", "💬", Z.phrases]];
  var dock = document.createElement("nav"); dock.className = "dock dock-it"; dock.setAttribute("role", "tablist"); dock.setAttribute("aria-label", "意大利语课程");
  dock.innerHTML = TABS.map(function (t) { return '<button class="dtab" role="tab" type="button" data-it-tab="' + t[0] + '" aria-selected="false"><span aria-hidden="true" class="it-ico">' + t[1] + "</span><span>" + t[2] + "</span></button>"; }).join("");
  document.body.appendChild(dock);
  var tab = lsGet("cp-it-tab") || "lessons";
  if (!TABS.some(function (t) { return t[0] === tab; })) tab = "lessons";
  function show(t) {
    tab = t; lsSet("cp-it-tab", t);
    Array.prototype.forEach.call(dock.querySelectorAll("[data-it-tab]"), function (b) { var on = b.getAttribute("data-it-tab") === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    render(); window.scrollTo(0, 0);
  }
  CP.itShow = show;
  function render() {
    var h = tab === "lessons" ? lessonsView() : tab === "words" ? wordsView() : tab === "review" ? reviewView() : tab === "conj" ? conjView() : phrasesView();
    view.innerHTML = h;
  }

  /* ---------------- 课程: lezioni ---------------- */
  var ls = { view: "list", cur: null, quiz: null };
  function lprog() { try { var o = JSON.parse(lsGet(LKEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function lmark(id, p) { var o = lprog(), x = o[id] || {}; Object.keys(p).forEach(function (k) { x[k] = p[k]; }); o[id] = x; lsSet(LKEY, JSON.stringify(o)); }
  function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b lang="it">$1</b>'); }
  function lessonsView() {
    if (ls.view === "lesson" && ls.cur) return lessonHTML(ls.cur);
    if (ls.view === "quiz" && ls.quiz) return quizHTML();
    if (ls.view === "result" && ls.quiz) return resultHTML();
    var P = lprog(), done = 0;
    var cards = ITLESSONS.slice().sort(function (a, b) { return a.n - b.n; }).map(function (l) {
      var p = P[l.id] || {}, ok = (p.best || 0) >= PASS; if (ok) done++;
      return '<button type="button" class="ls-card' + (ok ? " done" : "") + '" data-itl-open="' + CP.attr(l.id) + '"><span class="ls-n" aria-hidden="true">' + (ok ? "✓" : l.n) + '</span><span class="ls-t"><b>' + esc(l.title) + '</b><span class="small muted">' + esc(l.goal) + '</span></span><span class="ls-st small">' + (p.best != null ? p.best + "%" : p.seen ? "已读" : "") + "</span></button>";
    }).join("");
    return '<h2 style="margin-top:20px">意大利语课程</h2><p class="lede" style="margin:4px 0">一课一个语法点：先读讲解，听例句，看常见错误，再做练习。答对 ' + PASS + "% 以上就算通过。</p>" +
      '<p class="small muted" style="margin:0 0 10px">已通过 ' + done + " / " + ITLESSONS.length + ' 课。</p><div class="ls-list">' + cards + "</div>";
  }
  function lessonHTML(l) {
    var p = lprog()[l.id] || {};
    return '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-itl-back>' + Z.back + '</button></div><article class="panel ls-lesson"><span class="tag muted small">第 ' + l.n + " 课" + (p.best != null ? " · 最好成绩 " + p.best + "%" : "") + "</span><h3>" + esc(l.title) + '</h3><p class="ls-goal">🎯 ' + esc(l.goal) + "</p>" +
      l.body.map(function (b) { return "<p>" + rich(b) + "</p>"; }).join("") +
      '<div class="ls-pat">' + l.pattern.map(function (f, j) { return (j ? '<span class="ls-plus">+</span>' : "") + '<span class="fx" lang="it">' + esc(f) + "</span>"; }).join("") + "</div>" +
      "<h4>例句</h4>" + l.ex.map(function (e) { return '<div class="ls-ex"><div class="it-big" lang="it">' + esc(e[0]) + '</div><div class="small muted">' + esc(e[1]) + "</div><div>" + sayBtn(e[0], true) + "</div></div>"; }).join("") +
      "<h4>常见错误</h4>" + l.traps.map(function (t) { return '<div class="ls-trap"><div class="ls-bad">❌ <span lang="it">' + esc(t[0]) + '</span></div><div class="ls-good">✅ <span lang="it">' + esc(t[1]) + '</span></div><div class="small">' + esc(t[2]) + "</div></div>"; }).join("") +
      '<div class="acts"><button type="button" class="btn-main" data-itl-quiz style="margin:0">✏️ 做练习（' + l.quiz.length + " 题）</button></div></article>";
  }
  function words(s) { return s.replace(/[.,!?¿¡]/g, "").split(/\s+/).filter(Boolean); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function prepare() {
    var q = ls.quiz.l.quiz[ls.quiz.i]; ls.quiz.state = "play"; ls.quiz.choice = null; ls.quiz.order = null;
    if (q.k === "order") {
      var t = words(q.it), bank = t.map(function (w, i) { return { id: i, w: w }; }), sh = bank;
      for (var n = 0; n < 6; n++) { sh = shuffle(bank); if (sh.map(function (b) { return b.w; }).join(" ") !== t.join(" ")) break; }
      ls.quiz.order = { bank: sh, pick: [] };
    }
  }
  function quizHTML() {
    var Q = ls.quiz, l = Q.l, q = l.quiz[Q.i], n = l.quiz.length, h;
    h = '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-itl-open="' + CP.attr(l.id) + '">' + Z.back + '</button></div><div class="panel ls-quiz"><div class="ls-prog" aria-hidden="true"><i style="width:' + Math.round(Q.i * 100 / n) + '%"></i></div><span class="tag muted small">第 ' + (Q.i + 1) + " / " + n + " 题 · 答对 " + Q.score + "</span>";
    if (q.k === "order") {
      var by = {}; Q.order.bank.forEach(function (b) { by[b.id] = b; });
      var tile = function (b, attr, used) { return '<button type="button" class="tile it-tile' + (used ? " used" : "") + '" ' + attr + (used || Q.state !== "play" ? " disabled" : "") + ' lang="it"><span class="th">' + esc(b.w) + "</span></button>"; };
      h += '<p class="ask">' + Z.order + "「" + esc(q.zh) + "」</p>" + '<div class="slot" data-empty="点下面的词">' + Q.order.pick.map(function (id) { return tile(by[id], 'data-itl-un="' + id + '"'); }).join("") + "</div>";
      if (Q.state === "play") h += '<div class="bank">' + Q.order.bank.map(function (b) { return tile(b, 'data-itl-pick="' + b.id + '"', Q.order.pick.indexOf(b.id) >= 0); }).join("") + '</div><div class="acts"><button type="button" data-itl-undo' + (Q.order.pick.length ? "" : " disabled") + ">" + Z.clear + '</button><button type="button" class="btn-main" data-itl-check style="margin:0"' + (Q.order.pick.length === Q.order.bank.length ? "" : " disabled") + ">" + Z.check + "</button></div>";
      else h += (Q.state === "ok" ? '<p class="verdict ok">' + Z.right + "</p>" : '<p class="verdict ko">' + Z.wrong + " " + Z.answerIs + '<span lang="it">' + esc(q.it) + "</span></p>") + '<div class="acts">' + sayBtn(q.it, true) + '<button type="button" class="btn-main" data-itl-next style="margin:0">' + (Q.i + 1 < n ? Z.next : Z.result) + "</button></div>";
    } else {
      h += '<p class="ask">' + esc(q.q) + "</p>" + (q.it ? '<p class="it-big" lang="it">' + esc(q.it) + "</p>" : "");
      h += '<div class="ls-opts">' + q.opts.map(function (o, j) {
        var cls = Q.state === "play" ? "" : j === q.a ? " right" : j === Q.choice ? " wrong" : " off";
        return '<button type="button" class="ls-opt' + cls + '" data-itl-opt="' + j + '"' + (Q.state !== "play" ? " disabled" : "") + ">" + esc(o) + "</button>";
      }).join("") + "</div>";
      if (Q.state !== "play") h += '<p class="verdict ' + (Q.state === "ok" ? "ok" : "ko") + '">' + (Q.state === "ok" ? Z.right : Z.wrong) + (q.why ? " " + esc(q.why) : "") + '</p><div class="acts"><button type="button" class="btn-main" data-itl-next style="margin:0">' + (Q.i + 1 < n ? Z.next : Z.result) + "</button></div>";
    }
    return h + "</div>";
  }
  function resultHTML() {
    var Q = ls.quiz, n = Q.l.quiz.length, pct = Math.round(Q.score * 100 / n), ok = pct >= PASS;
    return '<div class="panel ls-quiz" style="margin-top:14px"><h3>' + (ok ? "🎉 这一课通过了！" : "差一点！") + "</h3><p>答对 " + Q.score + " / " + n + "（" + pct + "%）。" + (ok ? "" : "需要 " + PASS + "% 才算通过：再读一遍讲解，然后再试一次。") + "</p>" +
      '<div class="acts"><button type="button" class="btn-main" data-itl-quiz style="margin:0">🔁 再做一次</button><button type="button" class="btn-s" data-itl-open="' + CP.attr(Q.l.id) + '">📘 再读一遍</button><button type="button" class="btn-s" data-itl-back>所有课程</button></div></div>';
  }

  /* ---------------- 单词: lessico ---------------- */
  var wq = "";
  function groupsFor(q) {
    var groups = {}, order = [];
    LEX.forEach(function (e) {
      if (q && (e.it + " " + e.zh + " " + e.py + " " + (e.alt || []).join(" ")).toLowerCase().indexOf(q) < 0) return;
      var ch = typeof SECTION_CHAPTER !== "undefined" ? SECTION_CHAPTER[e.sec] : 0;
      var t = TOPIC[e.sec] || (ch && ch <= 5 ? "HSK " + ch + " 词汇" : "专业词汇"); if (!groups[t]) { groups[t] = []; order.push(t); } groups[t].push(e);
    });
    return { g: groups, o: order };
  }
  function wordsView() {
    var G2 = groupsFor(wq.trim().toLowerCase()), groups = G2.g, order = G2.o;
    return '<h2 style="margin-top:20px">意大利语单词</h2><p class="small muted" style="margin:0 0 8px">共 ' + LEX.length + ' 个词。名词带定冠词，点一个词可以看全部形式和动词变位。</p>' +
      '<label for="it-q" class="sr">搜索</label><input id="it-q" type="search" placeholder="搜索：意大利语、汉字或拼音" value="' + CP.attr(wq) + '" autocomplete="off" autocapitalize="off" spellcheck="false">' +
      '<div id="it-wl">' + wordList(groups, order) + "</div>";
  }
  /* 4000 多个词不一次画完：先画 wmax 个，「显示更多」再加 */
  var wmax = 200;
  function wordList(groups, order) {
    if (!order.length) return '<p class="muted">没有找到。</p>';
    var left = wmax, total = 0; order.forEach(function (t) { total += groups[t].length; });
    var html = order.map(function (t) {
      if (left <= 0) return "";
      var g = groups[t].slice(0, left); left -= g.length;
      return '<h3 class="it-topic">' + esc(t) + "</h3>" + g.map(function (e) {
        return '<div class="it-row"><button type="button" class="it-w" data-it-word="' + CP.attr(e.id) + '"><b lang="it">' + esc(e.it) + '</b><span class="small muted">' + esc(gLabel(e)) + "</span></button>" + zhHTML(e.zh, e.py) + sayBtn(e.say) + "</div>";
      }).join("");
    }).join("");
    if (total > wmax) html += '<div class="acts"><button type="button" class="btn-s" data-it-more>显示更多（还有 ' + (total - wmax) + " 个）</button></div>";
    return html;
  }

  /* ---------------- 复习: ripasso FSRS ---------------- */
  var SCH = new FSRS.Scheduler({ retention: 0.9, fuzz: true, dayOf: FSRS.studyDay }), DAY = 86400000;
  function sload() { try { var o = JSON.parse(lsGet(SRSKEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function ssave(o) { lsSet(SRSKEY, JSON.stringify(o)); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  var rv = { cur: null, shown: false, done: 0 };
  function queue() {
    var S = sload(), now = Date.now(), due = [], fresh = [], meta = S.__meta || {}, newLeft = NEW_PER_DAY - (meta.d === today() ? meta.nw || 0 : 0);
    LEX.forEach(function (e) { var r = S[e.id]; if (r && r.c) { if (r.c.due <= now) due.push([r.c.due, e]); } else fresh.push(e); });
    due.sort(function (a, b) { return a[0] - b[0]; });
    return { due: due.map(function (x) { return x[1]; }), fresh: newLeft > 0 ? fresh.slice(0, newLeft) : [], newLeft: Math.max(0, newLeft), learned: Object.keys(S).filter(function (k) { return k !== "__meta"; }).length };
  }
  function reviewView() {
    var Q = queue();
    if (!rv.cur) rv.cur = Q.due[0] || Q.fresh[0] || null;
    var head = '<h2 style="margin-top:20px">复习单词</h2><p class="small muted" style="margin:0 0 10px">今天要复习 ' + Q.due.length + " 个 · 新词还剩 " + Q.newLeft + " 个 · 已经学过 " + Q.learned + " 个。复习间隔由 FSRS 算法安排。</p>";
    if (!rv.cur) return head + '<div class="panel"><p>🎉 今天的复习都做完了！明天再来，或者去「课程」和「变位」练习。</p></div>';
    var e = rv.cur, isNew = !sload()[e.id];
    var h = head + '<div class="panel it-card"><span class="tag muted small">' + (isNew ? "新词" : "复习") + " · " + esc(gLabel(e)) + '</span><div class="it-front" lang="it">' + esc(e.it) + "</div><div>" + sayBtn(e.say) + "</div>";
    if (!rv.shown) h += '<p class="small muted">先想一想它的中文意思，再看答案。</p><button type="button" class="btn-main" data-itr-show>' + Z.showAnswer + "</button>";
    else {
      h += '<div class="it-back">' + zhHTML(e.zh, e.py) + "</div>" + (e.kind === "noun" || e.kind === "adj" || e.kind === "nat" ? '<p class="small" lang="it">' + esc((e.forms || []).join(" · ")) + "</p>" : e.kind === "verb" ? '<p class="small" lang="it">' + esc(I.present(e.it, 0) + " · " + I.present(e.it, 1) + " · " + I.present(e.it, 2)) + "…</p>" : "") + exHTML(e) +
        '<div class="it-grades" role="group" aria-label="记得怎么样">' + [[1, Z.again], [2, Z.hard], [3, Z.good], [4, Z.easy]].map(function (g) { return '<button type="button" data-itr-grade="' + g[0] + '">' + g[1] + "</button>"; }).join("") + "</div>";
    }
    return h + "</div>";
  }
  function grade(r) {
    var S = sload(), e = rv.cur, now = Date.now(), rec = S[e.id] || {}, card = rec.c || SCH.newCard(now);
    if (!rec.c) { var m = S.__meta && S.__meta.d === today() ? S.__meta : { d: today(), nw: 0 }; m.nw = (m.nw || 0) + 1; S.__meta = m; }
    var nc = SCH.review(card, r, now);
    S[e.id] = { c: nc, n: (rec.n || 0) + 1, lr: now };
    ssave(S); rv.cur = null; rv.shown = false; rv.done++;
    if (CP.game && CP.game.sentence && r >= 3) { try { CP.game.sentence(); } catch (x) {} }
  }

  /* ---------------- 变位: coniugazioni ---------------- */
  var VERBS = (function () { var seen = {}, out = []; LEX.forEach(function (e) { if (e.kind === "verb" && e.aux && !seen[e.it]) { seen[e.it] = 1; out.push(e); } }); return out; })();
  var cj = { tense: "pres", q: null, state: "play", choice: null, score: 0, n: 0 };
  function formFor(e, p, tense) {
    var pi = p[1], num = pi >= 3 ? "p" : "s", g = p[0] === "lei" ? "f" : "m";
    return tense === "pres" ? I.present(e.it, pi) : I.passato(e.it, e.aux, pi, g, num);
  }
  function newQ() {
    var e = VERBS[Math.floor(Math.random() * VERBS.length)], p = PRON[Math.floor(Math.random() * PRON.length)], right = formFor(e, p, cj.tense), opts = [right];
    shuffle(PRON).forEach(function (o) { var f = formFor(e, o, cj.tense); if (opts.length < 4 && opts.indexOf(f) < 0) opts.push(f); });
    if (cj.tense === "past" && opts.length < 4) { var alt = (e.aux === "e" ? I.passato(e.it, "a", p[1], "m", p[1] >= 3 ? "p" : "s") : I.passato(e.it, "e", p[1], p[0] === "lei" ? "f" : "m", p[1] >= 3 ? "p" : "s")); if (opts.indexOf(alt) < 0) opts.push(alt); }
    cj.q = { e: e, p: p, right: right, opts: shuffle(opts) }; cj.state = "play"; cj.choice = null;
  }
  function conjView() {
    if (!cj.q) newQ();
    var q = cj.q, h = '<h2 style="margin-top:20px">动词变位练习</h2><div class="seg" role="group" aria-label="时态"><button type="button" data-itc-tense="pres"' + (cj.tense === "pres" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>现在时</button><button type="button" data-itc-tense="past"' + (cj.tense === "past" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">近过去时</button></div>" +
      '<div class="panel ls-quiz"><span class="tag muted small">答对 ' + cj.score + " / " + cj.n + '</span><p class="ask"><b lang="it">' + esc(q.p[0]) + "</b> + <b lang=\"it\">" + esc(q.e.it) + "</b>（" + zhHTML(q.e.zh, q.e.py) + "）</p>" +
      '<p class="small muted">' + (cj.tense === "pres" ? "现在时" : "近过去时（lei 指女性）") + "</p>" +
      '<div class="ls-opts">' + q.opts.map(function (o, j) { var cls = cj.state === "play" ? "" : o === q.right ? " right" : j === cj.choice ? " wrong" : " off"; return '<button type="button" class="ls-opt' + cls + '" data-itc-opt="' + j + '" lang="it"' + (cj.state !== "play" ? " disabled" : "") + ">" + esc(o) + "</button>"; }).join("") + "</div>";
    if (cj.state !== "play") h += '<p class="verdict ' + (cj.state === "ok" ? "ok" : "ko") + '">' + (cj.state === "ok" ? Z.right : Z.wrong + " " + Z.answerIs + '<span lang="it">' + esc(q.right) + "</span>") + "</p>" + conjTable(q.e.it, q.e.aux) + '<div class="acts"><button type="button" class="btn-main" data-itc-next style="margin:0">' + Z.next + "</button></div>";
    return h + "</div>";
  }

  /* ---------------- 句子: frasi e dialoghi ---------------- */
  var ph = { dlg: null };
  /* 句子练习: una delle 5754 frasi d'esempio (data/examples), da ricomporre in italiano partendo dal cinese */
  var px = null;
  function pxNew() {
    var E = typeof EXAMPLES !== "undefined" ? EXAMPLES : {}, ks = Object.keys(E), x = null;
    for (var n = 0; n < 40 && !x; n++) { var e = E[ks[Math.floor(Math.random() * ks.length)]]; if (e && words(e[1]).length >= 3 && words(e[1]).length <= 8) x = e; }
    if (!x) return null;
    var t = words(x[1]), bank = t.map(function (w, i) { return { id: i, w: w }; }), sh = bank;
    for (var k = 0; k < 6; k++) { sh = shuffle(bank); if (sh.map(function (b) { return b.w; }).join(" ") !== t.join(" ")) break; }
    return { zh: x[0], it: x[1], t: t, bank: sh, pick: [], state: "play" };
  }
  function pxHTML() {
    if (!px) px = pxNew(); if (!px) return "";
    var by = {}; px.bank.forEach(function (b) { by[b.id] = b; });
    var tile = function (b, attr, used) { return '<button type="button" class="tile it-tile' + (used ? " used" : "") + '" ' + attr + (used || px.state !== "play" ? " disabled" : "") + ' lang="it"><span class="th">' + esc(b.w) + "</span></button>"; };
    var h = '<div class="panel ls-quiz" id="it-px" style="margin-top:20px"><span class="tag muted small">句子练习 · 把意大利语排好</span><p class="ask" lang="zh-CN">' + esc(px.zh) + "</p>" +
      '<div class="slot" data-empty="点下面的词">' + px.pick.map(function (id) { return tile(by[id], 'data-itx-un="' + id + '"'); }).join("") + "</div>";
    if (px.state === "play") h += '<div class="bank">' + px.bank.map(function (b) { return tile(b, 'data-itx-pick="' + b.id + '"', px.pick.indexOf(b.id) >= 0); }).join("") + '</div><div class="acts"><button type="button" class="btn-main" data-itx-check' + (px.pick.length === px.t.length ? "" : " disabled") + ">" + Z.check + '</button><button type="button" class="btn-s" data-itx-next>换一句</button></div>';
    else h += (px.state === "ok" ? '<p class="verdict ok">' + Z.right + "</p>" : '<p class="verdict ko">' + Z.wrong + " " + Z.answerIs + '<span lang="it">' + esc(px.it) + "</span></p>") + '<div class="acts">' + sayBtn(px.it, true) + '<button type="button" class="btn-main" data-itx-next>' + Z.next + "</button></div>";
    return h + "</div>";
  }
  function pxPaint() { var el = document.getElementById("it-px"); if (el) el.outerHTML = pxHTML(); }
  view.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-itx-pick],[data-itx-un],[data-itx-check],[data-itx-next]") : null; if (!b || !px) return;
    if (b.hasAttribute("data-itx-pick")) px.pick.push(+b.getAttribute("data-itx-pick"));
    else if (b.hasAttribute("data-itx-un")) px.pick.splice(px.pick.indexOf(+b.getAttribute("data-itx-un")), 1);
    else if (b.hasAttribute("data-itx-check")) {
      var by = {}; px.bank.forEach(function (x) { by[x.id] = x.w; });
      var got = px.pick.map(function (id) { return by[id]; }).join(" ").toLowerCase(), ok = got === px.t.join(" ").toLowerCase();
      px.state = ok ? "ok" : "ko"; CP.sfx(ok ? "ok" : "ko"); if (ok) CP.speak(px.it, { lang: "it-IT", voiceURI: CP.itVoiceURI() });
    } else if (b.hasAttribute("data-itx-next")) px = pxNew();
    CP.sfx("tap"); pxPaint();
  });
  function phrasesView() {
    if (ph.dlg) {
      var d = DIALOGS.filter(function (x) { return x.id === ph.dlg; })[0];
      return '<div class="acts" style="margin:14px 0 0"><button type="button" class="btn-s" data-itp-back>' + Z.back + "</button></div><h2>" + esc(DLG_ZH[d.id] || d.title) + '</h2><p class="small muted" lang="it">' + esc(d.title + " — " + d.sub) + "</p>" +
        d.lines.map(function (l) { return '<div class="it-line it-' + (l[0] === "B" ? "b" : "a") + '"><div class="it-big" lang="it">' + esc(l[3]) + '</div><div class="small">' + zhHTML(l[2], l[1]) + "</div>" + sayBtn(l[3], true) + "</div>"; }).join("");
    }
    var h = pxHTML() + '<h2 style="margin-top:20px">常用句子</h2><p class="small muted" style="margin:0 0 10px">意大利语在上，中文在下。点 🔊 听意大利语。</p>';
    h += PHRASES.map(function (g, gi) {
      return '<details class="pat"><summary>' + esc(PHR_ZH[gi] || g.title) + "</summary>" + g.items.map(function (p) { return '<div class="ls-ex"><div class="it-big" lang="it">' + esc(p[2]) + '</div><div class="small">' + zhHTML(p[1], p[0]) + "</div><div>" + sayBtn(p[2], true) + "</div></div>"; }).join("") + "</details>";
    }).join("");
    h += '<h3 style="margin-top:20px">对话（中意对照）</h3><div class="ls-list">' + DIALOGS.map(function (d) { return '<button type="button" class="ls-card" data-itp-dlg="' + CP.attr(d.id) + '"><span class="ls-n" aria-hidden="true">💬</span><span class="ls-t"><b>' + esc(DLG_ZH[d.id] || d.title) + '</b><span class="small muted" lang="it">' + esc(d.title) + "</span></span><span></span></button>"; }).join("") + "</div>";
    return h;
  }

  /* ---------------- eventi ---------------- */
  dock.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-it-tab]") : null; if (b) { CP.sfx("tap"); show(b.getAttribute("data-it-tab")); } });
  function repaintWords() { var G2 = groupsFor(wq.trim().toLowerCase()); document.getElementById("it-wl").innerHTML = wordList(G2.g, G2.o); }
  view.addEventListener("input", function (e) { if (e.target.id === "it-q") { wq = e.target.value; wmax = 200; repaintWords(); } });
  view.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-it-more]")) { wmax += 300; repaintWords(); } });
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-it-say]") : null;
    if (t) { CP.speak(t.getAttribute("data-it-say"), { lang: "it-IT", el: t, voiceURI: CP.itVoiceURI() }); }
  });
  view.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b || b.hasAttribute("data-it-say")) return;
    var a = function (n) { return b.getAttribute(n); };
    /* lezioni */
    if (a("data-itl-open") !== null) { ls.cur = ITLESSONS.filter(function (l) { return l.id === a("data-itl-open"); })[0]; ls.view = "lesson"; ls.quiz = null; lmark(ls.cur.id, { seen: Date.now() }); CP.sfx("tap"); render(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute("data-itl-back")) { ls.view = "list"; ls.cur = null; ls.quiz = null; render(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute("data-itl-quiz")) { ls.quiz = { l: ls.cur || ls.quiz.l, i: 0, score: 0 }; ls.cur = ls.quiz.l; prepare(); ls.view = "quiz"; render(); window.scrollTo(0, 0); return; }
    if (ls.quiz) {
      var Q = ls.quiz, q = Q.l.quiz[Q.i];
      if (a("data-itl-pick") !== null && Q.state === "play") { Q.order.pick.push(+a("data-itl-pick")); CP.sfx("tap"); render(); return; }
      if (a("data-itl-un") !== null && Q.state === "play") { var u = +a("data-itl-un"); Q.order.pick = Q.order.pick.filter(function (x) { return x !== u; }); render(); return; }
      if (b.hasAttribute("data-itl-undo")) { Q.order.pick.pop(); render(); return; }
      if (b.hasAttribute("data-itl-check")) {
        var by = {}; Q.order.bank.forEach(function (x) { by[x.id] = x; });
        var got = Q.order.pick.map(function (id) { return by[id].w; }).join(" ").toLowerCase();
        Q.state = got === words(q.it).join(" ").toLowerCase() ? "ok" : "ko"; if (Q.state === "ok") Q.score++;
        CP.sfx(Q.state === "ok" ? "ok" : "ko"); render(); return;
      }
      if (a("data-itl-opt") !== null && Q.state === "play") { Q.choice = +a("data-itl-opt"); Q.state = Q.choice === q.a ? "ok" : "ko"; if (Q.state === "ok") Q.score++; CP.sfx(Q.state === "ok" ? "ok" : "ko"); render(); return; }
      if (b.hasAttribute("data-itl-next")) {
        if (Q.i + 1 < Q.l.quiz.length) { Q.i++; prepare(); ls.view = "quiz"; }
        else { var pct = Math.round(Q.score * 100 / Q.l.quiz.length), pr = lprog()[Q.l.id] || {}, patch = { best: Math.max(pr.best || 0, pct) }; if (pct >= PASS && !pr.done) patch.done = Date.now(); lmark(Q.l.id, patch); ls.view = "result"; CP.sfx(pct >= PASS ? "ok" : "tap"); }
        render(); window.scrollTo(0, 0); return;
      }
    }
    /* parole */
    if (a("data-it-word") !== null) { CP.openSheet(detailHTML(BYID[a("data-it-word")])); return; }
    /* ripasso */
    if (b.hasAttribute("data-itr-show")) { rv.shown = true; CP.sfx("tap"); render(); return; }
    if (a("data-itr-grade") !== null) { grade(+a("data-itr-grade")); CP.sfx("tap"); render(); return; }
    /* coniugazioni */
    if (a("data-itc-tense") !== null) { cj.tense = a("data-itc-tense"); cj.q = null; render(); return; }
    if (a("data-itc-opt") !== null && cj.state === "play") { cj.choice = +a("data-itc-opt"); cj.n++; cj.state = cj.q.opts[cj.choice] === cj.q.right ? "ok" : "ko"; if (cj.state === "ok") cj.score++; CP.sfx(cj.state === "ok" ? "ok" : "ko"); render(); return; }
    if (b.hasAttribute("data-itc-next")) { cj.q = null; render(); return; }
    /* frasi */
    if (a("data-itp-dlg") !== null) { ph.dlg = a("data-itp-dlg"); render(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute("data-itp-back")) { ph.dlg = null; render(); return; }
  });

  /* benvenuto in cinese, una volta sola */
  var welcomed = false;
  CP.welcome = function (force) {
    if (!force && (welcomed || lsGet("cp-it-welcome"))) return;
    welcomed = true;
    CP.openSheet('<div class="welcome-card"><div class="fam-head"><h2 style="margin:0">欢迎来到意大利语课程！</h2><button type="button" class="fam-x btn-s" data-famclose data-itw-ok>好的</button></div>' +
      "<p>这里有 " + ITLESSONS.length + " 课语法、" + LEX.length + " 个常用词、动词变位练习和中意对照的句子。所有内容都可以离线使用。</p>" +
      '<p class="small muted">建议从第 1 课「发音」开始。想听意大利语，手机里需要有意大利语的语音（一般在「文字转语音」设置里下载）。</p>' +
      '<button type="button" class="btn-main" data-itw-ok>开始第 1 课</button></div>');
  };
  document.getElementById("fam").addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-itw-ok]") : null; if (!b) return;
    lsSet("cp-it-welcome", "1");
    if (b.classList.contains("btn-main")) { CP.closeSheet(); ls.cur = ITLESSONS[0]; ls.view = "lesson"; show("lessons"); }
  });
  if (CP.ux) CP.ux.set("onboarded", 1);   /* il benvenuto del corso di cinese non deve comparire qui */
  show(tab);
  setTimeout(function () { if (!CP.topSheet() && location.hash !== "#selftest") CP.welcome(); }, 500);
  /* tasto Indietro dell'APK: prima i fogli (già gestiti), poi la lezione aperta, poi la prima scheda */
  var prevBack = window.__mdBack;
  window.__mdBack = function () {
    if (CP.topSheet && CP.topSheet()) return prevBack ? prevBack() : false;
    if (tab === "lessons" && ls.view !== "list") { ls.view = "list"; ls.cur = null; ls.quiz = null; render(); return true; }
    if (tab === "phrases" && ph.dlg) { ph.dlg = null; render(); return true; }
    if (tab !== "lessons") { show("lessons"); return true; }
    return false;
  };
})();
