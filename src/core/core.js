
/* Stato condiviso: progressi, voce, schede, ricerca. */
(function () {
  var CP = window.CP;
  var WORDS = CP.WORDS, ORDER = CP.ORDER;
  /* omografi: stessi caratteri, più voci (花 fiore e 花 spendere: la seconda ha la chiave 花#huā). WORDS[hz] è la prima;
     alts le elenca tutte, così chi mostra la parola può dare ogni significato */
  var HOMO = {};
  ORDER.forEach(function (k) { var h = WORDS[k].hz; if (k !== h) (HOMO[h] = HOMO[h] || [WORDS[h]]).push(WORDS[k]); });
  CP.homographs = function (hz) { return HOMO[hz] || (WORDS[hz] ? [WORDS[hz]] : []); };
  /* Taglia un testo cinese nelle parole del vocabolario (la più lunga che combacia). */
  /* Taglia un testo cinese nelle parole del vocabolario (src/core/segment.js: la divisione più probabile). Qui si
     aggiungono gli omografi (alts) e, per i caratteri fuori dal vocabolario, il rimando alle parole dove compaiono (part). */
  var seg0 = MDSegment.make(WORDS, typeof WORD_FREQ === "string" ? WORD_FREQ : "");
  CP.wordRank = seg0.rank;
  CP.segmentText = CP.segment = function (raw) {
    return seg0(raw).map(function (t) {
      if (t.p) return t;
      if (t.w) return HOMO[t.w.hz] ? { w: t.w, raw: t.raw, alts: HOMO[t.w.hz] } : t;
      return { w: null, raw: t.raw, part: CP.charHint ? CP.charHint(t.raw) : null };
    });
  };
  CP.gloss = function (w) { return String(w.it).split(/[;,(:]/)[0].trim(); };
  CP.inFrame = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  CP.snapshot = "";
  CP.openOutside = function () {
    var html = "<!doctype html>\n" + (CP.snapshot || document.documentElement.outerHTML), name = "mandarino.html";
    var fallback = function () {
      try {
        var url = URL.createObjectURL(new Blob([html], { type: "text/html" })), a = document.createElement("a");
        a.href = url; a.download = name; document.body.appendChild(a); a.click();
        setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
      } catch (e) {}
    };
    var cl = window.claude;
    if (cl && cl.use) {
      cl.use("downloads").then(function (d) { if (!d) { fallback(); return; } return d.save({ filename: name, data: html }).then(function () { if (CP.toast) CP.toast("File salvato. Aprilo con il browser: lì microfono e audio funzionano."); }); })
        .catch(function (e) { if (e && e.code === "declined") return; fallback(); });
    } else fallback();
  };
  CP.frameBtn = function () {
    return CP.inFrame ? '<button type="button" class="btn-s" data-outside>🚀 Scarica e apri nel browser (sblocca Microfono e Audio)</button>' : "";
  };

  function norm(s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\s'’.,;:!?…·()\-？。！，]/g, "");
  }
  CP.norm = norm;

  /* ---- progressi: FSRS (migrazione automatica dal Leitner a 6 scatole della V4) ---- */
  var KEY = "cp-srs-v1", DAY = 86400000, INTERVALS = [0, 1, 2, 4, 8, 16, 32];
  var S = {};
  try { S = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { S = {}; }
  var RETKEY = "cp-ret", ret = parseFloat((function () { try { return localStorage.getItem(RETKEY); } catch (e) { return null; } })());
  if (!(ret >= 0.7 && ret <= 0.97)) ret = 0.9;
  var SCH = new FSRS.Scheduler({ retention: ret, fuzz: true, dayOf: FSRS.studyDay });
  CP.srs = {
    scheduler: SCH,
    retention: function () { return ret; },
    setRetention: function (x) { ret = x; SCH = new FSRS.Scheduler({ retention: ret, fuzz: true, dayOf: FSRS.studyDay }); CP.srs.scheduler = SCH; try { localStorage.setItem(RETKEY, String(x)); } catch (e) {} },
    version: FSRS.VERSION
  };
  /* V4 {b,d,n} -> record FSRS plausibile: S dalla scatola, D neutra, nulla va perso */
  function migrate(r) {
    if (!r || r.st != null || !r.n) return r;
    var b = r.b || 0;
    if (b >= 1) { r.st = INTERVALS[Math.min(b, 6)]; r.df = 5; r.sd = FSRS.REVIEW; r.sp = null; r.lr = Math.max(0, (r.d || Date.now()) - r.st * DAY); }
    else { r.st = 0.5; r.df = 6; r.sd = FSRS.RELEARNING; r.sp = 0; r.lr = Math.max(0, (r.d || Date.now()) - 10 * 60000); }
    r.rp = r.n; r.lp = r.lp || 0; r.mig = 1;
    return r;
  }
  Object.keys(S).forEach(function (k) { migrate(S[k]); });
  function boxOf(r) {
    if (!r || !r.n) return 0;
    if (r.sd !== FSRS.REVIEW) return 0;
    return Math.max(1, Math.min(6, Math.floor(Math.log2(Math.max(1, r.st)) + 1)));
  }
  function toCard(r) { return { state: r.sd, step: r.sp, st: r.st, df: r.df, due: r.d, last: r.lr }; }
  CP.S = function () { return S; };
  CP.setS = function (obj) { S = obj || {}; Object.keys(S).forEach(function (k) { migrate(S[k]); }); CP.save(); CP.mark(); };
  CP.save = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  CP.INTERVALS = INTERVALS;
  CP.state = function (k) { var r = S[k]; if (!r || !r.n) return 0; return (r.sd === FSRS.REVIEW && r.st >= 4) ? 2 : 1; };
  CP.counts = function () {
    var c = [0, 0, 0];
    ORDER.forEach(function (k) { c[CP.state(k)]++; });
    return c;
  };
  /* probabilita' di ricordare adesso (0 se la carta non e' mai stata vista) */
  CP.retr = function (k, now) { var r = S[k]; if (!r || !r.n || r.st == null) return 0; return SCH.rAt(toCard(r), now || Date.now()); };
  CP.dueList = function (keys, now) {
    now = now || Date.now();
    return keys.filter(function (k) { return S[k] && S[k].n && S[k].d <= now; })
      .sort(function (a, b) { return CP.retr(a, now) - CP.retr(b, now); });
  };
  /* g: 0 non la so, 1 quasi, 2 la so, 3 facile (come V4) -> voto FSRS 1-4. retry = la carta e' stata richiesta di nuovo nella stessa sessione. */
  CP.grade = function (k, g, retry, meta) {
    var r = S[k] || { n: 0, d: 0, b: 0 }, now = Date.now(), pred = null, wasReview = false;
    migrate(r);
    if (r.st != null) pred = CP.retr(k, now);
    r.n = (r.n || 0) + 1;
    /* la ripetizione nella stessa sessione è esercizio: aggiorna la carta solo se chiude un riapprendimento (dopo «Non la so»).
       Dopo «Quasi» la carta è già stata valutata: un secondo ripasso a pochi secondi gonfierebbe la stabilità */
    var apply = !retry || (g >= 2 && r.sd != null && r.sd !== FSRS.REVIEW);
    if (apply) {
      var card = r.st == null ? SCH.newCard(now) : toCard(r);
      wasReview = card.state === FSRS.REVIEW;
      var nc = SCH.review(card, g + 1, now);
      r.st = nc.st; r.df = nc.df; r.sd = nc.state; r.sp = nc.step; r.lr = now; r.d = nc.due;
      r.rp = (r.rp || 0) + 1; if (g === 0 && wasReview) r.lp = (r.lp || 0) + 1;
    }
    r.b = boxOf(r);
    S[k] = r;
    CP.save(); CP.mark();
    if (window.Store) Store.log([now, k, g + 1, (meta && meta.ms) || 0, (meta && meta.type) || "", pred == null ? null : Math.round(pred * 1000) / 1000, retry ? 1 : 0]);
    if (CP.onGrade) CP.onGrade(k, g, !!retry);
  };
  CP.mark = function () {
    Array.prototype.forEach.call(document.querySelectorAll("#sections tbody tr"), function (tr) {
      var k = tr.getAttribute("data-k");
      tr.classList.remove("st-1", "st-2");
      var s = CP.state(k);
      if (s) tr.classList.add("st-" + s);
    });
    if (CP.refilter) CP.refilter();
    badge();
  };
  /* U9: sul tab Studia il numero di ripassi già in scadenza (letto dai progressi, nessun contatore a parte) */
  function badge() {
    var tab = document.getElementById("tab-study"); if (!tab) return;
    var b = tab.querySelector(".dbadge"); if (!b) { b = document.createElement("span"); b.className = "dbadge"; b.setAttribute("aria-hidden", "true"); tab.appendChild(b); }
    var now = Date.now(), n = 0; Object.keys(S).forEach(function (k) { var r = S[k]; if (r && r.n && r.d <= now && WORDS[k]) n++; });
    b.hidden = !n; b.textContent = n > 99 ? "99+" : n;
    tab.setAttribute("aria-label", n ? CP.t("tab.studyDue", { n: n }) : CP.t("nav.study"));
  }
  CP.badge = badge;
  setInterval(badge, 60000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) badge(); });

  var CJK = /[㐀-鿿]/;

  /* ---- impostazioni salvate ---- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  var PK = { rate: "cp-rate", uri: "cp-voice", auto: "cp-auto", sfx: "cp-sfx", alt: "cp-alt", haptics: "cp-haptics" };
  var pref = { rate: lsGet("cp-rate") === "1" ? 1 : 0.8, uri: lsGet("cp-voice") || "", auto: lsGet("cp-auto") !== "0", sfx: lsGet("cp-sfx") !== "0", alt: lsGet("cp-alt") === "1", haptics: lsGet("cp-haptics") !== "0" };
  CP.pref = pref;
  CP.setPref = function (k, v) {
    pref[k] = v;
    lsSet(PK[k], typeof v === "boolean" ? (v ? 1 : 0) : v);
    if (k === "uri") pickVoice(); else buildVoiceUI();
  };

  /* ---- voce: parte sempre, anche se il browser non elenca voci cinesi ---- */
  var synth = window.speechSynthesis || null, voices = [], voice = null, live = [], liveTimer = 0;
  function vscore(v) {
    var n = (v.name || "") + " " + (v.lang || ""), s = 0;
    if (/natural|online|premium|enhanced/i.test(n)) s += 10;
    if (/zh[-_]?(CN|Hans)|cmn/i.test(v.lang || "")) s += 4;
    if (/zh[-_]?HK|yue|cantonese|sin-?ji/i.test(n)) s -= 6;
    if (/zh[-_]?(TW|Hant)/i.test(v.lang || "")) s -= 1;
    return s;
  }
  function pickVoice() {
    if (!synth) return;
    var vs = (synth.getVoices && synth.getVoices()) || [];
    voices = vs.filter(function (v) { return /^zh|cmn|yue/i.test(v.lang || ""); }).sort(function (a, b) { return vscore(b) - vscore(a); });
    voice = voices.filter(function (v) { return v.voiceURI === pref.uri; })[0] || voices[0] || null;
    buildVoiceUI();
  }
  function buildVoiceUI() {
    var body = document.getElementById("vset-body"), sum = document.getElementById("vsum");
    if (!body) return;
    if (CP.voiceUIOverride && CP.voiceUIOverride(body, sum)) return;   /* corso di italiano: la voce italiana, in cinese */
    if (!synth) {
      body.innerHTML = '<p class="muted small" style="margin:0">Questo browser non ha la sintesi vocale: i pulsanti audio non sono disponibili.</p>';
      if (sum) sum.textContent = "non disponibile";
      return;
    }
    var h = '<div class="seg" role="group" aria-label="' + CP.attr(t("vo.rate")) + '">' +
      '<button type="button" data-rate="0.8"' + (pref.rate === 0.8 ? ' class="on"' : "") + ">🐢 " + t("vo.slow") + "</button>" +
      '<button type="button" data-rate="1"' + (pref.rate === 1 ? ' class="on"' : "") + ">🐇 " + t("vo.normal") + "</button></div>";
    if (voices.length > 1) {
      h += '<label class="small muted" for="voice-sel" style="display:grid;gap:4px;font-weight:600">' + t("set.voice") + '<select id="voice-sel">' + voices.map(function (v) {
        return '<option value="' + CP.attr(v.voiceURI) + '"' + (voice && v.voiceURI === voice.voiceURI ? " selected" : "") + ">" + (vscore(v) >= 10 ? "★ " : "") + CP.esc(v.name) + " (" + CP.esc(v.lang) + ")</option>";
      }).join("") + "</select></label>";
    } else {
      h += '<p class="small muted" style="margin:0">' + (voice ? t("vo.cur", { v: CP.esc(voice.name) }) : t("vo.none")) + "</p>";
    }
    h += '<label class="chk"><input type="checkbox" id="opt-auto"' + (pref.auto ? " checked" : "") + "> " + t("vo.auto") + "</label>" +
      '<label class="chk"><input type="checkbox" id="opt-sfx"' + (pref.sfx ? " checked" : "") + "> " + t("vo.sfx") + "</label>" +
      '<label class="chk"><input type="checkbox" id="opt-haptics"' + (pref.haptics ? " checked" : "") + "> " + t("vo.haptics") + "</label>" +
      '<label class="chk"><input type="checkbox" id="opt-alt"' + (pref.alt ? " checked" : "") + "> " + t("vo.alt") + "</label>" +
      '<p class="small muted" style="margin:0">' + t("vo.altHint") + "</p>" +
      (CP.inFrame ? '<div class="notice"><p>' + t("vo.frame") + "</p>" + CP.frameBtn() + "</div>" : "") +
      (CP.voiceExtra ? CP.voiceExtra() : "") +
      '<button type="button" class="btn-main" id="voice-test" style="margin-top:4px">' + t("vo.test") + "</button>";
    body.innerHTML = h;
    if (sum) sum.textContent = pref.rate === 1 ? "🐇 " + t("vo.normal") : "🐢 " + t("vo.slow");
  }
  document.getElementById("vset-body").addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null;
    if (!b) return;
    if (b.hasAttribute("data-rate")) CP.setPref("rate", parseFloat(b.getAttribute("data-rate")));
    else if (b.id === "voice-test") CP.say("你好", b);
  });
  document.getElementById("vset-body").addEventListener("change", function (e) {
    if (e.target.id === "voice-sel") CP.setPref("uri", e.target.value);
    else if (e.target.id === "opt-auto") CP.setPref("auto", e.target.checked);
    else if (e.target.id === "opt-sfx") CP.setPref("sfx", e.target.checked);
    else if (e.target.id === "opt-haptics") CP.setPref("haptics", e.target.checked);
    else if (e.target.id === "opt-alt") CP.setPref("alt", e.target.checked);
  });

  function clearLive() { live.forEach(function (el) { el.classList.remove("speaking"); }); live = []; clearTimeout(liveTimer); }
  var token = 0, curAudio = null, curChain = null, curStop = null, spoken = 0;
  function stopAudio() { curChain = null; if (curAudio) { try { curAudio.onended = curAudio.onerror = null; curAudio.pause(); } catch (e) {} curAudio = null; } }
  /* Voce online di riserva (servizio non ufficiale: può smettere di funzionare). Accetta circa 200 caratteri per richiesta:
     un testo lungo (il lettore «Leggi tutto») si divide in frasi, e le frasi troppo lunghe alle virgole, poi si leggono in fila. */
  var TTSMAX = 180;
  function ttsChunks(text) {
    var out = [];
    String(text).replace(/([。！？!?；;\n])/g, "$1\u0000").split("\u0000").forEach(function (sen) {
      sen = sen.trim(); if (!sen) return;
      while (sen.length > TTSMAX) {
        var cut = Math.max(sen.lastIndexOf("，", TTSMAX), sen.lastIndexOf(",", TTSMAX), sen.lastIndexOf("、", TTSMAX), sen.lastIndexOf(" ", TTSMAX));
        if (cut < 20) cut = TTSMAX - 1;
        out.push(sen.slice(0, cut + 1)); sen = sen.slice(cut + 1).trim();
      }
      if (sen) out.push(sen);
    });
    /* frasi corte vicine si rimettono insieme (meno richieste, intonazione più naturale) */
    return out.reduce(function (a, x) { if (a.length && (a[a.length - 1] + x).length <= TTSMAX) a[a.length - 1] += x; else a.push(x); return a; }, []);
  }
  CP.ttsChunks = ttsChunks;
  function fallbackAudioTTS(text, rate, onEnd) {
    stopAudio();
    var parts = ttsChunks(text), i = 0, done = false, chain = {};
    curChain = chain;
    var fin = function () { if (done) return; done = true; if (curChain === chain) curChain = null; onEnd(); };
    (function next() {
      if (done || curChain !== chain) return;
      if (i >= parts.length) { fin(); return; }
      var a;
      try { a = new Audio("https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&ttsspeed=" + (rate < 1 ? "0.24" : "1") + "&q=" + encodeURIComponent(parts[i++])); }
      catch (e) { fin(); return; }
      curAudio = a;
      var step = function (ok) { a.onended = a.onerror = null; if (curAudio === a) curAudio = null; if (ok) next(); else fin(); };
      a.onended = function () { step(true); }; a.onerror = function () { step(false); };
      try { var p = a.play(); if (p && p.catch) p.catch(function () { step(false); }); } catch (e) { step(false); }
    })();
  }
  CP.fallbackAudioTTS = fallbackAudioTTS;
  var muteHinted = false;
  CP.canSay = function () { return true; };
  CP.stopSpeak = function () {
    token++; stopAudio(); clearLive();
    try { if (synth) synth.cancel(); } catch (e) {}
    if (curStop) { var f = curStop; curStop = null; f(); }
  };
  /* o: { el, rate, lang, pitch, onEnd, onStop }.  onEnd = finito; onStop = interrotto da un'altra voce. */
  CP.speak = function (text, o) {
    o = o || {};
    if (!text) { if (o.onEnd) o.onEnd(); return; }
    var mine = ++token, zh = !o.lang || /^zh/i.test(o.lang), rate = o.rate || pref.rate;
    stopAudio();
    if (curStop) { var prevStop = curStop; curStop = null; prevStop(); }
    curStop = o.onStop || null;
    clearLive();
    var els = Array.prototype.filter.call(document.querySelectorAll(".say"), function (b) { return b.getAttribute("data-say") === text; });
    if (o.el && els.indexOf(o.el) < 0) els.push(o.el);
    els.forEach(function (x) { x.classList.add("speaking"); });
    live = els;
    var finished = false, failTimer = 0, startTimer = 0;
    if (CP.bus) CP.bus.duck(true);      /* la musica scende di 10 dB mentre parla la voce */
    var finish = function () {
      if (finished) return; finished = true; clearTimeout(failTimer); clearTimeout(startTimer);
      if (CP.bus) CP.bus.duck(false);
      if (live === els) clearLive(); else els.forEach(function (x) { x.classList.remove("speaking"); });
      if (token !== mine) return;
      curStop = null;
      if (o.onEnd) o.onEnd();
    };
    liveTimer = setTimeout(function () { if (live === els) clearLive(); }, 1500 + text.length * 700);
    failTimer = setTimeout(finish, 6500 + text.length * 900);
    /* V6.8: la voce online (un servizio esterno, non ufficiale: riceve il testo da leggere) si usa solo se la si è
       accesa in ⚙️ → Voce. Altrimenti, se la voce del telefono tace, lo si dice una volta e si spiega come fare. */
    var cloud = function () {
      if (finished || token !== mine) return;
      clearTimeout(startTimer);
      try { if (synth) synth.cancel(); } catch (e) {}
      if (!pref.alt) { if (!muteHinted && CP.toast) { muteHinted = true; CP.toast(t("vo.mute")); } finish(); return; }
      fallbackAudioTTS(text, rate, finish);
    };
    if (zh && (!synth || pref.alt)) { cloud(); return; }
    if (!synth) { finish(); return; }
    try {
      var busy = synth.speaking || synth.pending, started = false;
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = o.lang || (voice ? voice.lang : "zh-CN");
      if (zh && voice) u.voice = voice;
      else if (!zh && o.voiceURI) { var ov = (synth.getVoices() || []).filter(function (v) { return v.voiceURI === o.voiceURI; })[0]; if (ov) u.voice = ov; }
      u.rate = rate;
      if (o.pitch) u.pitch = o.pitch;
      u.onstart = function () { started = true; clearTimeout(startTimer); };
      u.onend = finish;
      u.onerror = function (ev) {
        var err = ev && ev.error;
        if (err === "canceled" || err === "interrupted") { finish(); return; }
        if (zh && !started) cloud(); else finish();
      };
      /* se la voce del dispositivo non parte, si passa a quella online. La prima lettura aspetta di più: su Android il motore
         vocale può metterci 3-4 secondi a svegliarsi. Nell'APK il ponte nativo segnala sempre gli errori: niente timer. */
      if (zh && !window.__MD_APK) startTimer = setTimeout(function () { if (!started && !finished) cloud(); }, spoken ? 3000 : 6000);
      spoken++;
      if (busy) setTimeout(function () { if (token === mine) synth.speak(u); }, 60); else synth.speak(u);
    } catch (e) { if (zh) cloud(); else finish(); }
  };
  CP.say = function (text, el) { CP.speak(text, { el: el }); };

  /* ---- caratteri con più letture (V6.7). La sintesi vocale legge il carattere, non il pinyin:
     per 还 huán direbbe «hái». Per questi caratteri si fa leggere una parola d'esempio con la stessa lettura. ---- */
  function sylList(py) {
    var clean = String(py).replace(/[!?,;:…"“”«»()（），。？！、]/g, " ").replace(/\.(?=\s|$)/g, " ").trim();
    return clean ? CP.syllables(clean.replace(/\s+/g, " ")).map(function (x) { return x.replace(/['’]/g, "").toLowerCase(); }) : [];
  }
  function alignHz(hz, py) {
    var ch = Array.from(String(hz)).filter(function (c) { return CJK.test(c); }), sy = sylList(py);
    return ch.length && ch.length === sy.length ? ch.map(function (c, i) { return [c, sy[i]]; }) : null;
  }
  function bsyl(s) { return String(s).normalize("NFD").replace(/[̀́̄̌]/g, "").normalize("NFC").toLowerCase().replace(/[^a-zü]/g, ""); }
  function rkey(s) { return bsyl(s) + CP.tone(s); }
  /* letture note, oltre a quelle del dizionario (alcune non compaiono nelle parole) */
  var POLY_MANUAL = { "了": ["le", "liǎo"], "着": ["zhe", "zháo", "zhuó"], "行": ["xíng", "háng"], "长": ["cháng", "zhǎng"], "得": ["de", "dé", "děi"], "地": ["de", "dì"], "都": ["dōu", "dū"], "重": ["zhòng", "chóng"], "便": ["biàn", "pián"], "乐": ["lè", "yuè"], "觉": ["jué", "jiào"], "空": ["kōng", "kòng"] };
  /* 一 e 不 cambiano tono per sandhi, non per significato: le spiega già «Come si dice davvero» */
  var POLY_SANDHI = { "一": 1, "不": 1 };
  /* esempi brevi scelti a mano, quando il dizionario non ne ha uno corto */
  var POLY_EX = { "还huán": "还书", "看kān": "看门", "只zhī": "一只猫", "只zhǐ": "只有", "教jiāo": "教书", "更gēng": "更新", "脏zāng": "脏衣服", "炸zhá": "炸鸡", "炸zhà": "爆炸", "都dōu": "都是", "更gèng": "更好" };
  var READ = {}, POLY = new Set(), polyCache = {};
  ORDER.forEach(function (k) {
    var w = WORDS[k], al = alignHz(w.hz, w.py); if (!al) return;
    al.forEach(function (p) { var r = READ[p[0]] = READ[p[0]] || {}; (r[p[1]] = r[p[1]] || []).push(k); });
  });
  Object.keys(READ).forEach(function (c) {
    if (POLY_SANDHI[c]) return;
    var sy = Object.keys(READ[c]), bases = {}, toned = {};
    sy.forEach(function (s) { bases[bsyl(s)] = 1; if (CP.tone(s) !== 5) toned[rkey(s)] = 1; });
    if (Object.keys(bases).length > 1 || Object.keys(toned).length > 1) POLY.add(c);
  });
  Object.keys(POLY_MANUAL).forEach(function (c) { POLY.add(c); });
  /* un carattere che da solo non è nel vocabolario ma sta dentro parole note (泳 in 游泳): la sua lettura, se è una sola,
     e le parole dove compare. Serve al lettore per non dire «non so» davanti a 泳池. */
  CP.charHint = function (ch) {
    var r = READ[ch]; if (!r) return null;
    var sy = Object.keys(r), keys = [];
    sy.forEach(function (x) { r[x].forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
    return { py: sy.length === 1 && !POLY.has(ch) ? sy[0] : null, words: keys.slice(0, 3).map(function (k) { return WORDS[k]; }) };
  };
  CP.POLY = POLY;
  function readingsOf(c) {
    var out = [], seen = {};
    Object.keys(READ[c] || {}).concat(POLY_MANUAL[c] || []).forEach(function (s) { var k = rkey(s); if (!seen[k]) { seen[k] = 1; out.push(s); } });
    /* il tono neutro non è un'altra lettura se la stessa sillaba esiste con un tono pieno */
    return out.filter(function (s) { return CP.tone(s) !== 5 || !out.some(function (o) { return o !== s && CP.tone(o) !== 5 && bsyl(o) === bsyl(s); }); });
  }
  function polyOf(w) {
    if (!w || polyCache[w.key] !== undefined) return w ? polyCache[w.key] : null;
    var ch = Array.from(w.hz), info = null;
    if (ch.length === 1 && POLY.has(ch[0])) {
      var own = sylList(w.py)[0] || "", ok = rkey(own), c = ch[0], ex = POLY_EX[c + own] ? { hz: POLY_EX[c + own] } : null, best = ex ? -1 : 1e9;
      var others = readingsOf(c).filter(function (s) { return rkey(s) !== ok && !(CP.tone(own) === 5 && bsyl(s) === bsyl(own) && CP.tone(s) === 5); });
      /* esempio: la parola più corta (meglio di due caratteri) dove il carattere ha la stessa lettura */
      (READ[c] && READ[c][own] || []).forEach(function (k) {
        if (k === w.key) return; var o = WORDS[k], n = Array.from(o.hz).length; if (n < 2) return;
        var sc = Math.abs(n - 2) * 10 + Array.from(o.hz).filter(function (x) { return x !== c && POLY.has(x); }).length;
        if (sc < best) { best = sc; ex = { hz: o.hz, py: o.py }; }
      });
      if (!ex) PHRASES.some(function (g) { return g.items.some(function (p) {
        var al = alignHz(p[1], p[0]); if (!al) return false;
        if (al.some(function (x) { return x[0] === c && x[1] === own; })) { ex = { hz: p[1], py: p[0] }; return true; } return false;
      }); });
      info = { others: others, ex: ex };
    }
    return (polyCache[w.key] = info);
  }
  CP.polyInfo = polyOf;
  /* testo da far leggere alla voce per una parola del dizionario */
  CP.sayHz = function (w) { var p = polyOf(w); return p && p.ex ? p.ex.hz : (w ? w.hz : ""); };
  CP.polyNote = function (w) {
    var p = polyOf(w); if (!p || (!p.others.length && !p.ex)) return "";
    return '<div class="cd-note poly-note">⚠️ ' + (p.others.length ? t("fam.alsoRead", { p: p.others.map(function (s) { return "<b>" + CP.pinyinHTML(s) + "</b>"; }).join(", ") }) + " " : "") +
      (p.ex ? "🔊 " + t("fam.readIn", { w: '<span class="han" lang="zh-CN">' + CP.esc(p.ex.hz) + "</span>" }) : "") + "</div>";
  };
  CP.sayBtn = function (text) {
    return '<button class="say" type="button" data-say="' + CP.attr(text) + '" aria-label="' + CP.attr(t("fam.listen")) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg></button>';
  };
  document.body.classList.add("can-say");
  var sh = document.getElementById("sayhint"); if (sh) sh.hidden = false;
  if (synth) {
    pickVoice();
    if (synth.addEventListener) synth.addEventListener("voiceschanged", pickVoice);
    setTimeout(pickVoice, 600);
  } else buildVoiceUI();

  /* ---- suoni procedurali e vibrazione (zero file esterni) ---- */
  var actx = null;
  function getCtx() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    if (!actx) { try { actx = new AC(); } catch (e) { return null; } }
    return actx;
  }
  /* i browser sbloccano l'audio solo dopo un gesto: il primo tocco in assoluto lo sveglia */
  document.addEventListener("pointerdown", function () {
    var c = getCtx(); if (c && c.state === "suspended" && c.resume) { try { c.resume(); } catch (e) {} }
  }, { once: true, passive: true, capture: true });
  CP.getCtx = getCtx;
  CP.audioState = function () { return actx ? actx.state : "none"; };
  CP.audioUnlock = function () {
    var c = getCtx(); if (!c) return Promise.resolve("unsupported");
    if (c.state === "running") return Promise.resolve("running");
    return (c.resume ? c.resume() : Promise.resolve()).then(function () { return c.state; }, function () { return c.state; });
  };
  /* V6: bus master unico (effetti + musica sullo stesso AudioContext). Compressore per non distorcere mai. */
  var master = null;
  CP.master = function () {
    var c = getCtx(); if (!c) return null;
    if (!master) {
      master = c.createGain(); master.gain.value = 0.9;
      var cm = c.createDynamicsCompressor(); cm.threshold.value = -14; cm.knee.value = 18; cm.ratio.value = 5; cm.attack.value = 0.004; cm.release.value = 0.2;
      master.connect(cm); cm.connect(c.destination);
    }
    return master;
  };
  /* V6.7: tre bus sotto il master. sfx (volume regolabile, cp-sfxvol), music (il jukebox ci si collega),
     e il ducking: quando parla la voce la musica scende di 10 dB e poi risale. */
  CP.bus = (function () {
    var B = {}, duckN = 0;
    function mk(name, v) { var c = getCtx(); if (!c) return null; if (!B[name]) { B[name] = c.createGain(); B[name].gain.value = v; B[name].connect(CP.master()); } return B[name]; }
    function sfxVol() { var v = parseFloat(lsGet("cp-sfxvol")); return v >= 0 && v <= 1 ? v : 0.7; }
    return {
      sfx: function () { return mk("sfx", sfxVol()); },
      music: function () { return mk("music", duckN ? 0.3 : 1); },
      sfxVol: sfxVol,
      setSfxVol: function (v) { v = Math.max(0, Math.min(1, +v || 0)); lsSet("cp-sfxvol", v); var c = getCtx(); if (B.sfx && c) B.sfx.gain.setTargetAtTime(v, c.currentTime, 0.02); },
      duck: function (on) {
        duckN = on ? 1 : 0;
        var m = B.music, c = getCtx(); if (!m || !c) return;
        m.gain.cancelScheduledValues(c.currentTime); m.gain.setTargetAtTime(on ? 0.3 : 1, c.currentTime, on ? 0.05 : 0.4);
      }
    };
  })();
  /* scala pentatonica (do re mi sol la) per la "vittoria": sale con la serie di risposte giuste */
  var PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
  var NOISE = null;
  function noiseBuf(c) {
    if (NOISE && NOISE.sampleRate === c.sampleRate) return NOISE;
    var n = Math.floor(c.sampleRate * 0.05), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), i;
    for (i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    return (NOISE = b);
  }
  /* un colpo percussivo: parziali sinusoidali [rapporto, ampiezza, decadimento relativo] + micro-click iniziale */
  function strike(c, out, f, t, peak, dec, parts, click, f2) {
    parts.forEach(function (p) {
      var o = c.createOscillator(), g = c.createGain(), d = dec * (p[2] || 1);
      o.type = "sine"; o.frequency.setValueAtTime(f * p[0], t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2 * p[0], t + d * 0.9);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak * p[1], t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.02);
    });
    if (click) {
      var s = c.createBufferSource(), bp = c.createBiquadFilter(), g2 = c.createGain();
      s.buffer = noiseBuf(c); bp.type = "bandpass"; bp.frequency.value = Math.min(6000, f * 5); bp.Q.value = 1.2; g2.gain.value = click;
      s.connect(bp); bp.connect(g2); g2.connect(out); s.start(t);
    }
  }
  CP.strike = strike;
  /* effetti calibrati per gli altoparlanti dei telefoni (sotto i 500-600 Hz rendono poco):
     tap = blocco di legno 820 Hz, ok = giada do-mi-sol (sale con la serie), ko = gong piccolo 330 Hz, level = campana + arpeggio */
  var lastTap = 0;
  CP.sfx = function (type, step) {
    if (!pref.sfx) return;
    try {
      if (type === "tap") { var tn = Date.now(); if (tn - lastTap < 60) return; lastTap = tn; }   /* al massimo un tap ogni 60 ms */
      CP.haptic(type === "ok" ? [8, 40, 12] : type === "ko" ? 35 : type === "level" ? [10, 50, 10, 50, 20] : 5);
      var c = getCtx(); if (!c) return;
      var play = function () {
        var now = c.currentTime + 0.005, out = CP.bus.sfx() || CP.master();
        if (type === "tap") {
          strike(c, out, 820, now, 0.38, 0.11, [[1, 1, 1], [2.7, 0.35, 0.5], [5.1, 0.1, 0.25]], 0.25, 760);
        } else if (type === "ok") {
          var s0 = Math.max(0, Math.min(PENTA.length - 4, step || 0));
          [0, 2, 3].forEach(function (k, i) { strike(c, out, PENTA[s0 + k], now + i * 0.08, 0.28, 0.42, [[1, 1, 1], [2, 0.25, 0.6], [3, 0.08, 0.4]], 0.08); });
        } else if (type === "ko") {
          strike(c, out, 330, now, 0.42, 0.26, [[1, 1, 1], [1.48, 0.4, 0.8], [2.3, 0.2, 0.5]], 0.15, 250);
        } else if (type === "level") {
          strike(c, out, 392, now, 0.3, 0.9, [[1, 1, 1], [2.76, 0.35, 0.6], [5.4, 0.12, 0.35]], 0.1);
          [0, 1, 2, 3, 5].forEach(function (k, i) { strike(c, out, PENTA[k], now + 0.12 + i * 0.09, 0.22, 0.5, [[1, 1, 1], [2, 0.25, 0.6], [3, 0.08, 0.4]], 0.05); });
        }
      };
      if (c.state === "running") play();
      else if (c.resume) c.resume().then(play, function () {});
      else play();
    } catch (e) {}
  };

  /* ---- riconoscimento vocale (zh-CN) ---- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  CP.voices = function () { return voices.slice(); };
  CP.canListen = function () { return !!SR; };
  CP.listen = function (targetHz, onResult) {
    if (!SR) return null;
    var rec, done = false;
    var finish = function (o) { if (done) return; done = true; onResult(o); };
    /* in Chrome il riconoscimento manda l'audio ai server: senza rete non ci si prova nemmeno (nell'app Android sì: il
       riconoscitore di sistema può avere la lingua scaricata sul telefono) */
    if (navigator.onLine === false && !window.MandarinoAndroid) { finish({ ok: false, heard: "", error: "offline" }); return null; }
    /* su molti Android, se il flusso dell'oscilloscopio è ancora aperto, il riconoscimento fallisce (audio-capture / no-speech) */
    if (CP.micInfo && CP.micInfo().live && !CP.micInfo().users && CP.micClose) CP.micClose();
    try {
      rec = new SR();
      rec.lang = "zh-CN"; rec.interimResults = false; rec.maxAlternatives = 3; rec.continuous = false;
      rec.onresult = function (ev) {
        /* si confronta il suono, non il carattere: 他/她/它 o 在/再 sono la stessa pronuncia, e il riconoscitore sceglie a caso */
        var alts = [], best = { level: -1 }, heard = "";
        for (var i = 0; i < ev.results[0].length; i++) {
          var tr = ev.results[0][i].transcript, m = CP.soundMatch ? CP.soundMatch(targetHz, tr) : { level: tr.indexOf(targetHz) >= 0 ? 2 : 0 };
          alts.push(tr);
          if (m.level > best.level || (m.level === best.level && m.exact && !best.exact)) { best = m; heard = tr; }
        }
        finish({ ok: best.level === 2, near: best.level === 1, homophone: best.level === 2 && !best.exact, heard: heard || alts[0] || "", alts: alts, goal: targetHz });
      };
      rec.onerror = function (ev) { finish({ ok: false, heard: "", error: (ev && ev.error) || "error" }); };
      rec.onnomatch = function () { finish({ ok: false, heard: "", error: "no-speech" }); };
      rec.onend = function () { finish({ ok: false, heard: "", error: "no-speech" }); };
      rec.start();
    } catch (e) { finish({ ok: false, heard: "", error: "start" }); return null; }
    return rec;
  };
  /* ripiego universale: senza riconoscimento vocale (Firefox, iOS installata, offline) si registra e si confronta */
  CP.canRecord = function () { return !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); };
  CP.micBtn = function (hz) {
    if (!SR && !CP.canRecord()) return "";
    return '<button class="mic" type="button" data-mic="' + CP.attr(hz) + '" aria-label="' + CP.attr(t(SR ? "mic.check" : "mic.rec")) + '" title="' + CP.attr(t(SR ? "mic.check" : "mic.rec")) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg></button>';
  };
  CP.audioBtns = function (hz, noMic) { return '<span class="btns">' + CP.sayBtn(hz) + (noMic ? "" : CP.micBtn(hz)) + "</span>"; };
  /* messaggi per i codici d'errore del riconoscimento vocale (chiavi mic.e.*) */
  var MIC_ERR = {}; ["not-allowed", "service-not-allowed", "audio-capture", "network", "offline", "language-not-supported", "no-speech", "start"].forEach(function (c) { MIC_ERR[c] = t("mic.e." + c); });
  var SR_DOWN = /^(network|offline|language-not-supported|service-not-allowed|audio-capture|start)$/;
  window.addEventListener("online", function () { if (CP._srDown === "network" || CP._srDown === "offline") CP._srDown = null; });
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-vp-open]") : null; if (!b || !CP.voicePanel) return;
    var h = b.closest(".heard"), host = h ? h.parentNode : b.parentNode; if (h) h.parentNode.removeChild(h);
    CP.voicePanel(host, b.getAttribute("data-vp-open"), {});
  });
  CP.micErrText = function (code) { return MIC_ERR[code] || t("mic.e.other"); };
  function micClick(b) {
    if (b._rec) { b._abort = true; try { b._rec.abort(); } catch (e) {} b._rec = null; b.classList.remove("listening"); return; }
    CP.stopSpeak();
    var goal = b.getAttribute("data-mic"), host = b.closest("[data-heard-host], .ln, .fc, .fw") || (b.closest(".acts") ? b.closest(".acts").parentNode : b.parentNode);
    /* senza riconoscimento (o se qui non funziona) si apre il pannello «Parla», che va anche offline */
    var down = !SR ? "" : CP._srDown ? MIC_ERR[CP._srDown] || "" : navigator.onLine === false && !window.MandarinoAndroid ? MIC_ERR.offline : null;
    if (down !== null && CP.canScope && CP.canScope() && CP.voicePanel) { CP.voicePanel(host, goal, { note: down }); return; }
    var out = host.querySelector(".heard");
    if (!out) { out = document.createElement("div"); out.setAttribute("aria-live", "polite"); host.appendChild(out); }
    out.className = "heard"; out.textContent = "🎤 " + t("mic.listen", { w: goal.replace(/[^㐀-鿿]/g, "") });
    b.classList.add("listening"); b._abort = false;
    CP.sfx("tap");
    b._rec = CP.listen(goal, function (r) {
      b.classList.remove("listening"); b._rec = null;
      if (b._abort) { b._abort = false; if (out.parentNode) out.parentNode.removeChild(out); return; }
      if (r.error && SR_DOWN.test(r.error) && CP.canScope && CP.canScope() && CP.voicePanel) {
        /* il riconoscimento qui non va (rete, lingua non installata, servizio assente): per questa sessione si usa il pannello */
        CP._srDown = r.error; if (out.parentNode) out.parentNode.removeChild(out);
        CP.voicePanel(host, goal, { note: CP.micErrText(r.error) }); return;
      }
      if (r.error) {
        out.className = "heard ko"; out.textContent = "🎤 " + CP.micErrText(r.error); CP.sfx("ko");
        if (CP.micBlocked && r.error === "not-allowed") CP.micBlocked();
        if (CP.inFrame && (r.error === "not-allowed" || r.error === "start")) out.insertAdjacentHTML("beforeend", '<div style="margin-top:8px">' + CP.frameBtn() + "</div>");
        return;
      }
      var said = "🎤 " + t("mic.said", { w: '<span class="han" lang="zh-CN">' + CP.esc(r.heard || "…") + "</span>" }) + " — ";
      if (r.ok) { out.className = "heard ok"; out.innerHTML = said + t(r.homophone ? "mic.homophone" : "mic.perfect"); CP.sfx("ok"); if (CP.game && CP.game.xp) CP.game.xp(1); }
      else if (r.near) { out.className = "heard ko"; out.innerHTML = said + t("mic.near"); CP.sfx("tap"); }
      else { out.className = "heard ko"; out.innerHTML = said + t("mic.wrong"); CP.sfx("ko"); }
      if (!r.ok && CP.canScope && CP.canScope() && CP.voicePanel) out.insertAdjacentHTML("beforeend", ' <button type="button" class="btn-s" data-vp-open="' + CP.attr(goal) + '">〰️ ' + t("mic.myTone") + "</button>");
    });
    if (!b._rec) b.classList.remove("listening");
  }

  /* ---- curve dei toni ---- */
  var TONE_PATHS = {
    1: "M2,3 L22,3",
    2: "M2,10 L22,2",
    3: "M2,4 Q12,12 22,6",
    4: "M2,2 L22,10",
    5: "M10,6 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0"
  };
  CP.toneCurveHTML = function (py) {
    return '<div class="t-curves" aria-hidden="true">' + CP.syllables(py).map(function (s) {
      var t = CP.tone(s);
      return '<svg class="tc t' + t + '" viewBox="0 0 24 12"><path d="' + TONE_PATHS[t] + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
    }).join("") + "</div>";
  };

  /* ---- lavagna per tracciare i caratteri ---- */
  CP.initPad = function (canvas, ghostHz, initSegs) {
    var ctx = canvas.getContext("2d"), S = 220, drawing = false, last = null, segs = (initSegs || []).slice(), ghost = ghostHz || "";
    var dpr = window.devicePixelRatio || 1;
    canvas.width = S * dpr; canvas.height = S * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    function paint() {
      ctx.clearRect(0, 0, S, S);
      ctx.strokeStyle = "rgba(128,128,128,0.28)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(S / 2, 0); ctx.lineTo(S / 2, S); ctx.moveTo(0, S / 2); ctx.lineTo(S, S / 2); ctx.stroke();
      ctx.setLineDash([]);
      if (ghost) {
        var n = Array.from(ghost).length, fs = Math.max(48, Math.min(130, Math.floor(200 / n)));
        ctx.font = "500 " + fs + "px 'PingFang SC', 'Noto Sans CJK SC', 'Noto Sans SC', sans-serif";
        ctx.fillStyle = "rgba(128,128,128,0.16)";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(ghost, S / 2, S / 2 + 5);
      }
      var ink = (getComputedStyle(document.documentElement).getPropertyValue("--ink") || "#000").trim();
      ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round";
      segs.forEach(function (g) { ctx.lineWidth = g[4]; ctx.beginPath(); ctx.moveTo(g[0], g[1]); ctx.lineTo(g[2], g[3]); ctx.stroke(); });
    }
    paint();
    canvas.addEventListener("pointerdown", function (e) {
      drawing = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
      var r = canvas.getBoundingClientRect();
      last = { x: (e.clientX - r.left) * S / r.width, y: (e.clientY - r.top) * S / r.height };
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * S / r.width, y = (e.clientY - r.top) * S / r.height;
      var p = e.pressure && e.pressure > 0 && e.pressure !== 0.5 ? e.pressure : 0.6;
      var w = Math.max(3, Math.min(12, p * 14));
      segs.push([last.x, last.y, x, y, w]);
      ctx.strokeStyle = (getComputedStyle(document.documentElement).getPropertyValue("--ink") || "#000").trim();
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(x, y); ctx.stroke();
      last = { x: x, y: y };
    });
    var up = function () { drawing = false; };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    return {
      clear: function () { segs = []; paint(); },
      setGhost: function (g) { ghost = g || ""; paint(); },
      hasGhost: function () { return !!ghost; },
      segs: function () { return segs.slice(); }
    };
  };

  /* ---- V6.7: preferenze dell'interfaccia (cp-ux-v1: benvenuto, legenda, suggerimenti, logo grande) ---- */
  CP.ux = (function () {
    var K = "cp-ux-v1", o = {};
    try { o = JSON.parse(lsGet(K) || "{}") || {}; } catch (e) { o = {}; }
    function save() { lsSet(K, JSON.stringify(o)); }
    return { get: function (k) { return o[k]; }, set: function (k, v) { o[k] = v; save(); }, bump: function (k) { o[k] = (o[k] || 0) + 1; save(); return o[k]; } };
  })();
  CP.haptic = function (p) { if (pref.haptics && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } };
  /* U1: modalità sessione a schermo pieno. Restano solo intestazione della sessione, carta e barra delle azioni. */
  CP.focusMode = function (on) {
    var was = document.body.classList.contains("in-session");
    document.body.classList.toggle("in-session", !!on);
    if (on && !was) window.scrollTo(0, 0);
  };
  window.addEventListener("pagehide", function () { CP.focusMode(false); });
  document.addEventListener("visibilitychange", function () { if (CP.studyActive && !CP.studyActive() && !(CP.mode && CP.mode.active())) CP.focusMode(false); });

  /* ---- fogli e finestre modali (V6.7): il focus resta dentro (Tab / Maiusc+Tab ciclano), Esc chiude,
     alla chiusura il focus torna all'elemento da cui si era partiti. Vale per #fam, #guide, #jk-pop, #selftest e i fogli nuovi. ---- */
  var traps = [], FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  function focusables(el) { return Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), function (x) { return x.getClientRects().length > 0 && !x.closest("[hidden]"); }); }
  function trapIdx(el) { for (var i = 0; i < traps.length; i++) if (traps[i].el === el) return i; return -1; }
  CP.trap = function (el, onClose) {
    if (trapIdx(el) >= 0) return;
    traps.push({ el: el, back: document.activeElement, onClose: onClose || null });
    el.hidden = false; el.setAttribute("aria-modal", "true"); document.body.style.overflow = "hidden";
  };
  CP.untrap = function (el) {
    var i = trapIdx(el); el.hidden = true; if (i < 0) return;
    var t = traps.splice(i, 1)[0];
    if (!traps.length) document.body.style.overflow = "";
    if (t.back && t.back.focus && t.back.isConnected) { try { t.back.focus({ preventScroll: true }); } catch (e) {} }
  };
  CP.focusFirst = function (el) { var f = focusables(el); if (f.length) { try { f[0].focus({ preventScroll: true }); } catch (e) {} } };
  CP.topSheet = function () { var t = traps[traps.length - 1]; return t && !t.el.hidden ? t.el : null; };
  document.addEventListener("keydown", function (e) {
    var t = traps[traps.length - 1]; if (!t || t.el.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (t.onClose) t.onClose(); else CP.untrap(t.el); return; }
    if (e.key !== "Tab") return;
    var f = focusables(t.el); if (!f.length) { e.preventDefault(); return; }
    var a = document.activeElement, first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (a === first || !t.el.contains(a))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !t.el.contains(a))) { e.preventDefault(); first.focus(); }
  }, true);

  /* ---- livello HSK 3.0 di una parola (data/levels.js): 1-6, 0 = oltre l'HSK. Vale per ogni parola, anche dei temi ---- */
  var HSKMAP = null;
  CP.hsk = function (hz) {
    if (!HSKMAP) { HSKMAP = {}; if (typeof HSK_LEVEL !== "undefined") Object.keys(HSK_LEVEL).forEach(function (l) { HSK_LEVEL[l].split("|").forEach(function (w) { if (w) HSKMAP[w] = +l; }); }); }
    return HSKMAP[hz] || 0;
  };
  CP.hskBadge = function (hz) { var l = CP.hsk(hz); return '<span class="hsk-b' + (l ? "" : " out") + '" title="' + CP.attr(l ? t("hsk.in", { n: l }) : t("hsk.out")) + '">' + (l ? "HSK " + l : "HSK+") + "</span>"; };

  /* ---- famiglia del carattere ---- */
  CP.familyOf = function (ch) {
    return ORDER.filter(function (k) { var h = WORDS[k].hz; return h.indexOf(ch) >= 0 && h !== ch; }).map(function (k) { return WORDS[k]; });
  };
  var famEl = document.getElementById("fam"), famCard = document.getElementById("fam-card"), fam = null;
  function famRender() {
    var ch = fam.cur, selves = CP.homographs(ch), selfW = selves[0];
    var list = CP.familyOf(ch), h;
    h = '<div class="fam-head"><div class="big" lang="zh-CN">' + CP.esc(ch) + '</div><div class="meta">' +
      (selfW ? selves.map(function (w) { return '<div class="lp">' + CP.pinyinHTML(w.py) + " " + CP.hskBadge(w.hz) + '</div><div class="small muted" lang="it">' + CP.esc(w.it) + "</div>"; }).join("")
             : '<div class="small muted">' + t("fam.part") + "</div>") +
      "</div>" + (selfW ? CP.audioBtns(CP.sayHz(selfW), true) : "") + '<button type="button" class="fam-x btn-s" data-famclose>' + CP.t("common.close") + '</button></div>' + (selfW ? CP.polyNote(selfW) : "") +
      (selfW && CP.contribOpen ? '<div class="acts" style="margin:6px 0 0"><button type="button" class="btn-s" data-contrib="' + CP.attr(selfW.key) + '">✏️ ' + t("fam.fix") + "</button></div>" : "");
    if (fam.chars.length > 1) {
      h += '<div class="fam-chars" role="group" aria-label="' + CP.attr(t("fam.chars")) + '">' + fam.chars.map(function (c) {
        return '<button type="button" data-fc="' + CP.attr(c) + '"' + (c === ch ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + CP.esc(c) + "</button>";
      }).join("") + "</div>";
    }
    var ex = selfW && CP.exampleFor && CP.exampleFor(selfW.key);
    if (ex) h += '<div class="cd-ex"><span class="tag">' + CP.t("sess.example") + '</span><div class="lp">' + CP.pinyinHTML(ex[0]) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(ex[1], ex[0]) + '</div><div class="cd-note" lang="it">' + CP.esc(ex[2]) + "</div>" + CP.audioBtns(ex[1], true) + "</div>";
    if (selfW && CP.phonBlock) h += CP.phonBlock(selfW.py);
    h += "<h4>" + t("fam.contain", { c: CP.esc(ch) }) + "</h4>";
    if (!list.length) h += '<p class="muted small">' + t("fam.noOther") + "</p>";
    list.slice(0, 14).forEach(function (w) {
      h += '<div class="fw"><div class="lp">' + CP.pinyinHTML(w.py) + '</div><div class="lh" lang="zh-CN">' + CP.hanziHTML(w.hz, w.py) + '</div><div class="small muted" lang="it">' + CP.esc(w.it) + "</div>" + CP.audioBtns(w.hz, true) + "</div>";
    });
    if (list.length > 14) h += '<p class="small muted">' + t("fam.more", { n: list.length - 14 }) + "</p>";
    famCard.innerHTML = h;
  }
  CP.openFamily = function (text) {
    var chars = [], seen = {};
    Array.from(String(text)).forEach(function (c) { if (CJK.test(c) && !seen[c]) { seen[c] = 1; chars.push(c); } });
    if (!chars.length) return;
    if (!famEl.hidden && chars.length === 1 && fam && fam.chars.indexOf(chars[0]) >= 0) fam.cur = chars[0];
    else fam = { chars: chars, cur: chars[0] };
    if (famEl.hidden) CP.trap(famEl, famClose);
    famRender();
    var x = famCard.querySelector("[data-famclose]"); if (x) x.focus({ preventScroll: true });
    CP.sfx("tap");
  };
  function famClose() { CP.untrap(famEl); }
  CP.openSheet = function (h) {
    if (famEl.hidden) CP.trap(famEl, famClose);
    fam = null; famCard.innerHTML = h; famCard.scrollTop = 0;
    var x = famCard.querySelector("[data-famclose]"); if (x) x.focus({ preventScroll: true }); else CP.focusFirst(famCard);
    CP.sfx("tap");
  };
  CP.closeSheet = function () { famClose(); };
  famEl.addEventListener("click", function (e) {
    if (e.target === famEl || (e.target.closest && e.target.closest("[data-famclose]"))) { famClose(); return; }
    var c = e.target.closest ? e.target.closest("[data-fc]") : null;
    if (c) { fam.cur = c.getAttribute("data-fc"); famRender(); }
  });

  /* ---- tocchi: ascolta, tieni premuto per la famiglia, microfono ---- */
  function charTarget(t) {
    if (!t || !t.closest) return "";
    var sp = t.closest("td.hz .m-hz > span, .cd-hz > span, .lh > span, .fam-head .big");
    if (!sp) return "";
    var m = sp.closest(".m-hz");
    if (m && document.body.classList.contains("hide-hz") && !m.classList.contains("shown")) return "";
    if (sp.classList.contains("big")) return sp.textContent;
    return /^t[1-5]$/.test(sp.className) ? sp.textContent : "";
  }
  var suppress = 0, pressHandled = false, lastPT = "mouse", lp = null;
  function lpCancel() { if (lp) { clearTimeout(lp.t); lp = null; } }
  /* il click che segue una pressione lunga non deve né leggere la parola né chiudere il pannello appena aperto */
  document.addEventListener("click", function (e) {
    if (suppress && Date.now() - suppress < 700) { suppress = 0; e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener("pointerdown", function (e) {
    pressHandled = false; lastPT = e.pointerType || "mouse";
    var ch = charTarget(e.target); if (!ch) return;
    lpCancel();
    lp = { x: e.clientX, y: e.clientY, t: setTimeout(function () {
      lp = null;
      if (pressHandled) return;
      pressHandled = true; suppress = Date.now(); CP.openFamily(ch);
    }, 480) };
  });
  document.addEventListener("pointerup", lpCancel);
  document.addEventListener("pointercancel", lpCancel);
  document.addEventListener("pointermove", function (e) { if (lp && Math.abs(e.clientX - lp.x) + Math.abs(e.clientY - lp.y) > 10) lpCancel(); });
  document.addEventListener("scroll", lpCancel, true);
  document.addEventListener("contextmenu", function (e) {
    var ch = charTarget(e.target);
    if (!ch) return;
    e.preventDefault();
    if (pressHandled) return;
    pressHandled = true; lpCancel();
    if (lastPT === "touch" || lastPT === "pen") suppress = Date.now();
    CP.openFamily(ch);
  });
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var ob = t.closest("[data-outside]");
    if (ob) { CP.openOutside(); return; }
    var mic = t.closest("[data-mic]");
    if (mic) { micClick(mic); return; }
    var b = t.closest("[data-say]");
    if (b) { CP.say(b.getAttribute("data-say"), b); return; }
    var fb = t.closest("[data-fam]");
    if (fb) { CP.openFamily(fb.getAttribute("data-fam")); return; }
    var m = t.closest("td.hz .m-hz, .cd-hz");
    if (m && !(document.body.classList.contains("hide-hz") && !m.classList.contains("shown"))) {
      var ch = charTarget(t);
      var hk = m.closest("[data-k]"), hw = hk ? WORDS[hk.getAttribute("data-k")] : null;
      if (ch && (e.shiftKey || e.altKey)) CP.openFamily(ch); else CP.say(hw && hw.hz === m.textContent ? CP.sayHz(hw) : m.textContent, m);
    }
  });

  /* ---- indice di ricerca (sui dati, non sul DOM) ---- */
  /* Ogni voce: il pinyin attaccato (si cerca «nihao» o «ni hao») con le posizioni d'inizio delle sillabe, i caratteri, e le
     parole italiane separate da spazi. Il pinyin combacia solo dall'inizio di una sillaba, l'italiano solo dall'inizio di una
     parola: «re» trova «regalo» ma non «studente», «rea» non nasce più da «andare a». rank: 0 uguale, 1 inizio, 2 dentro. */
  function words(s) { return " " + String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9㐀-鿿]+/g, " ").trim() + " "; }
  function sKey(py, hz, it, note) {
    var syl = String(py).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-zü]+/).filter(Boolean), st = [], p = "";
    syl.forEach(function (x) { st.push(p.length); p += x; });
    return { py: p, st: st, hz: String(hz), it: words(it), note: words(note || ""), g: words(String(it).split(/[;,(:]/)[0]) };
  }
  function sQuery(raw) {
    var r = String(raw).replace(/[0-9|]/g, "");
    return { c: norm(r).replace(/[^a-zü㐀-鿿]/g, ""), w: words(r).trim(), raw: r.trim() };
  }
  function sRank(e, q) {
    if (!q.c && !q.w) return 0;
    if (/[㐀-鿿]/.test(q.raw)) { var hq = q.raw.replace(/[^㐀-鿿]/g, ""); return e.hz === hq ? 0 : e.hz.indexOf(hq) === 0 ? 1 : e.hz.indexOf(hq) >= 0 ? 2 : -1; }
    var best = -1;
    if (q.c && e.py) {
      if (e.py === q.c) return 0;
      for (var i = 0; i < e.st.length; i++) if (e.py.indexOf(q.c, e.st[i]) === e.st[i]) { best = i === 0 ? 1 : 2; break; }
    }
    if (q.w) {
      var w = " " + q.w;
      if (e.g === w + " ") return 0;
      if (e.it.indexOf(w + " ") >= 0) best = best < 0 ? 1 : Math.min(best, 1);
      else if (e.it.indexOf(w) >= 0 || e.note.indexOf(w) >= 0) best = best < 0 ? 2 : best;
    }
    return best;
  }
  CP.search = { key: sKey, query: sQuery, rank: sRank };
  var Q = CP.Q = new Array(ORDER.length);
  /* l'indice si costruisce alla prima ricerca o appena il telefono è libero dopo l'avvio, non durante l'avvio */
  var qDirty = true;
  CP.reindex = function () { qDirty = true; };
  CP.ensureQ = function () { if (!qDirty) return Q; qDirty = false; ORDER.forEach(function (k, i) { var w = WORDS[k]; Q[i] = sKey(w.py, w.hz, w.it, w.note); }); return Q; };
  (window.requestIdleCallback || function (f) { return setTimeout(f, 1500); })(function () { CP.ensureQ(); });
  var lines = document.querySelectorAll("#sections .ln");
  Array.prototype.forEach.call(lines, function (ln) {
    ln._q = sKey(ln.querySelector(".lp").textContent, ln.querySelector(".lh").textContent, ln.querySelector(".li").textContent);
    ln.insertAdjacentHTML("beforeend", CP.audioBtns(ln.querySelector(".lh").textContent));
  });

  /* ---- ricerca e filtro per stato ---- */
  var qEl = document.getElementById("q"), stEl = document.getElementById("state"), info = document.getElementById("qinfo");
  var secsEl0 = document.getElementById("sections"), chipOf = {};
  Array.prototype.forEach.call(document.querySelectorAll("#chips a"), function (a) { chipOf[(a.getAttribute("href") || "").slice(1)] = a; });
  function refilter() {
    var raw = qEl.value, sq = sQuery(raw), q = sq.c || sq.w, st = stEl.value, total = 0, topic = CP.topic || null, best = [];
    var active = !!q || st !== "" || !!topic;
    secsEl0.classList.toggle("searching", active);
    CP.setSearching(active);
    var OK = CP.OK, SEC = CP.SEC, shownBy = new Array(SEC.length), favs = CP.favs;
    if (q) CP.ensureQ();
    SEC.forEach(function (S, si) {
      var secOk = !topic || topic.indexOf(S.id) >= 0, n = 0;
      for (var i = S.i0; i < S.i1; i++) {
        var kk = CP.ORDER[i];
        var rk = q ? sRank(Q[i], sq) : 0;
        var ok = secOk && rk >= 0 && (st === "" || (st === "fav" ? !!(favs && favs.has(kk)) : String(CP.state(kk)) === st));
        if (ok && q && rk === 0) best.push(kk);
        OK[i] = ok ? 1 : 0; if (ok) n++;
      }
      shownBy[si] = n; total += n;
      S.el.hidden = active && !n;
      if (S.nEl) S.nEl.textContent = active ? n + " / " + (S.i1 - S.i0) : (S.i1 - S.i0);
      var chip = chipOf[S.id]; if (chip) chip.hidden = S.el.hidden;
    });
    CP.applyFilter(shownBy);
    var fr = document.getElementById("frasi");
    if (fr) {
      var shown = 0;
      Array.prototype.forEach.call(fr.querySelectorAll(".ln"), function (ln) {
        var ok = !q || sRank(ln._q, sq) >= 0;
        if (st !== "" || topic) ok = false;
        ln.hidden = !ok; if (ok) shown++;
      });
      Array.prototype.forEach.call(fr.querySelectorAll(".ph"), function (ph) { ph.hidden = !ph.querySelector(".ln:not([hidden])"); });
      var intro = fr.querySelector(".intro"); if (intro) intro.hidden = active;
      fr.hidden = active && !shown; total += shown;
      var fchip = chipOf.frasi; if (fchip) fchip.hidden = fr.hidden;
    }
    if (active) {
      info.hidden = false;
      info.textContent = total ? (total === 1 ? "1 risultato" : total + " risultati") :
        "Nessun risultato. Prova senza toni (es. ni hao), con un carattere o con una parola italiana.";
      /* le corrispondenze esatte prima di tutto: la tabella resta nell'ordine delle sezioni, queste si toccano per arrivarci */
      if (best.length && total > best.length) info.insertAdjacentHTML("beforeend", ' · <span class="muted">proprio questa:</span> ' + best.slice(0, 6).map(function (k) {
        var w = WORDS[k]; return '<button type="button" class="chip-best" data-best="' + CP.attr(k) + '"><span class="han" lang="zh-CN">' + CP.esc(w.hz) + "</span> " + CP.esc(CP.gloss(w)) + "</button>";
      }).join(" "));
    } else info.hidden = true;
    CP.kick();
  }
  CP.refilter = refilter;
  info.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-best]"); if (!b) return;
    var tr = CP.reveal(b.getAttribute("data-best"));
    if (tr) { tr.classList.add("flash"); setTimeout(function () { tr.classList.remove("flash"); }, 1600); }
  });
  var qTimer = 0;
  qEl.addEventListener("input", function () { clearTimeout(qTimer); qTimer = setTimeout(refilter, 70); });
  stEl.addEventListener("change", refilter);

  /* ---- schede ---- */
  var TABS = ["path", "words", "study", "build"];
  function show(name, instant) {
    /* la pagina nuova entra dal lato della scheda: da destra se è più avanti nel dock, da sinistra se è prima */
    var from = TABS.filter(function (t) { return !document.getElementById("view-" + t).hidden; })[0], di = TABS.indexOf(name) - TABS.indexOf(from);
    if (from && di) document.documentElement.setAttribute("data-dir", di > 0 ? "next" : "prev");
    var run = function () {
      if (name !== "study") CP.focusMode(false);
      TABS.forEach(function (t) {
        var on = t === name;
        document.getElementById("view-" + t).hidden = !on;
        var b = document.getElementById("tab-" + t);
        b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false");
      });
      window.scrollTo(0, 0);
      if (name === "words") requestAnimationFrame(function () { CP.kick(); });
      if (name === "path" && CP.onPath) CP.onPath();
      if (name === "study" && CP.onStudy) CP.onStudy();
      if (name === "build" && CP.onBuild) CP.onBuild();
      CP.topVis();
      try { localStorage.setItem("cp-tab", name); } catch (e) {}
    };
    if (!instant && document.startViewTransition && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      try { var vt = document.startViewTransition(run); if (vt) [vt.ready, vt.updateCallbackDone].forEach(function (pr) { if (pr && pr.catch) pr.catch(function () {}); });   /* se la finestra cambia misura la transizione si annulla: non è un errore */
      if (vt && vt.finished) vt.finished.then(function () { document.documentElement.removeAttribute("data-dir"); }, function () {}); } catch (e) { run(); }
    } else run();
  }
  CP.show = show;
  TABS.forEach(function (t) { document.getElementById("tab-" + t).addEventListener("click", function () { show(t); }); });
  /* ---- sezioni comprimibili, "torna su", scorciatoie ---- */
  var secsEl = document.getElementById("sections"), allBtn = document.getElementById("toggle-all");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ci = document.getElementById("chipinfo"); if (ci) ci.textContent = SECTIONS.length + " argomenti";
  function setOpen(sec, open) {
    sec.classList.toggle("closed", !open);
    var b = sec.querySelector(".sech"); if (b) b.setAttribute("aria-expanded", open ? "true" : "false");
    if (open && sec.hasAttribute("data-si")) CP.mat(sec);
  }
  CP.setOpen = setOpen;
  /* apre una sezione e ci porta il lettore, anche se e' ancora un segnaposto */
  CP.gotoSection = function (id, smooth) {
    var sec = document.getElementById(id); if (!sec) return;
    setOpen(sec, true); syncAll();
    sec.scrollIntoView({ block: "start", behavior: smooth && !reduced ? "smooth" : "auto" });
    setTimeout(CP.kick, 30);
  };
  function anyOpen() { return Array.prototype.some.call(secsEl.querySelectorAll("section"), function (s) { return !s.classList.contains("closed"); }); }
  function syncAll() { allBtn.textContent = anyOpen() ? "Chiudi tutte" : "Apri tutte"; }
  secsEl.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".sech") : null;
    if (!b) return;
    var sec = b.closest("section");
    setOpen(sec, sec.classList.contains("closed")); syncAll();
  });
  allBtn.addEventListener("click", function () {
    var open = anyOpen();
    Array.prototype.forEach.call(secsEl.querySelectorAll("section"), function (s) { s.classList.toggle("closed", open); var b = s.querySelector(".sech"); if (b) b.setAttribute("aria-expanded", open ? "false" : "true"); });
    syncAll(); CP.kick();
    if (open) window.scrollTo(0, 0);
  });
  document.getElementById("chips").addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var id = (a.getAttribute("href") || "").slice(1), sec = document.getElementById(id);
    if (sec && sec.tagName === "SECTION") { e.preventDefault(); CP.gotoSection(id, false); }
  });
  var topBtn = document.getElementById("totop");
  function topVis() { topBtn.hidden = !(window.scrollY > 600 && !document.getElementById("view-words").hidden); }
  CP.topVis = topVis;
  window.addEventListener("scroll", topVis, { passive: true });
  topBtn.addEventListener("click", function () {
    document.querySelector(".tools").scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var a = document.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
    if (e.key === "/" && !typing && famEl.hidden && !document.getElementById("view-words").hidden) {
      e.preventDefault(); qEl.focus(); qEl.select();
    }
  });
  CP.mark();
  var savedTab = lsGet("cp-tab");
  show(TABS.indexOf(savedTab) >= 0 ? savedTab : "path", true);
})();

