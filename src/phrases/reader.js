/* ===== V4d: lettore universale "Raggi X" (qualunque testo cinese, pinyin sopra ogni parola) ===== */
(function () {
  var CP = window.CP, esc = CP.esc, U = CP.u, T = CP.t, text = "", timer = 0;
  var SAMPLES = [
    ["rd.s1", "你好！我是意大利人，我想学中文。"],
    ["rd.s2", "服务员，我要饺子和茶，谢谢。"],
    ["rd.s3", "请问，火车站怎么走？远吗？"],
    ["rd.s4", "明天晚上我想请你吃饭，好吗？"],
    ["rd.s5", "今天很热，我想喝冰水。"]
  ];
  function analyse(raw) {
    var segs = CP.segment(raw), chars = 0, known = 0, inside = 0, unk = {};
    segs.forEach(function (s) {
      if (s.w) { var n = Array.from(s.w.hz).length; chars += n; known += n; return; }
      if (s.p) return;
      chars++; if (s.part) inside++; else unk[s.raw] = 1;
    });
    return { segs: segs, chars: chars, known: known, inside: inside, unk: Object.keys(unk) };
  }
  /* ---- «nomi e termini» (data/wiki/zh-it.txt, da Wikidata, CC0): città, persone, termini tecnici fuori dal vocabolario.
     Il file (~2,5 MB) si scarica solo la prima volta e poi resta offline; nell'app Android è già dentro. Un titolo conta solo
     se comincia e finisce dove comincia e finisce una parola del taglio (学|中文 non diventa «学中»). ---- */
  var WK = { map: null, p: null, err: false };
  function wikiOK() { try { return !!window.MandarinoAndroid || localStorage.getItem("md-wiki") === "1"; } catch (e) { return false; } }
  function wikiLoad() {
    if (WK.p) return WK.p;
    if (location.protocol === "file:") { WK.err = true; return Promise.resolve(null); }
    WK.err = false;
    return (WK.p = fetch("data/wiki/zh-it.txt").then(function (r) { if (!r.ok) throw new Error("http"); return r.text(); }).then(function (t) {
      var m = new Map(); t.split("\n").forEach(function (l) { var i = l.indexOf("\t"); if (i > 0) m.set(l.slice(0, i), l.slice(i + 1)); });
      WK.map = m; try { localStorage.setItem("md-wiki", "1"); } catch (e) {} return m;
    }).catch(function () { WK.err = true; WK.p = null; return null; }));
  }
  function wikiHits(segs) {
    var text = "", cuts = { 0: 1 };
    segs.forEach(function (s) { text += s.raw; cuts[text.length] = 1; });
    var out = [], seen = {};
    for (var i = 0; i < text.length; i++) {
      if (!cuts[i]) continue;
      for (var n = 6; n >= 2; n--) {
        var w = text.substr(i, n); if (w.length < n || !cuts[i + n] || !WK.map.has(w)) continue;
        if (!seen[w]) { seen[w] = 1; out.push([w, WK.map.get(w)]); }
        i += n - 1; break;
      }
    }
    return out.slice(0, 30);
  }
  function wikiHTML(segs) {
    if (location.protocol === "file:") return "";
    if (!WK.map) {
      if (wikiOK() && !WK.err) { wikiLoad().then(paint); return ""; }
      return '<div class="xr-wiki"><button type="button" class="btn-s" data-xr-wiki>📚 ' + T("rd.wikiGet") + "</button>" + (WK.err ? ' <span class="small muted">' + T("rd.wikiErr") + "</span>" : "") + "</div>";
    }
    var h = wikiHits(segs); if (!h.length) return "";
    return '<div class="xr-wiki"><b>📚 ' + T("rd.wikiTitle") + '</b><span class="small muted"> · Wikipedia</span><ul>' + h.map(function (x) {
      return '<li><button type="button" class="xw-w" data-fam="' + CP.attr(x[0]) + '"><span class="han" lang="zh-CN">' + esc(x[0]) + '</span></button> <span lang="it">' + esc(x[1]) + "</span></li>";
    }).join("") + "</ul></div>";
  }
  function outHTML(raw) {
    if (!raw.trim()) return '<p class="xr-stat">' + T("rd.empty") + "</p>";
    var a = analyse(raw), h = "";
    a.segs.forEach(function (s) {
      if (s.w) {
        /* omografi (花 fiore / spendere): tutti i significati, il contesto lo sceglie chi legge */
        var all = s.alts || [s.w], pys = [];
        all.forEach(function (w) { if (pys.indexOf(w.py) < 0) pys.push(w.py); });
        h += '<button type="button" class="xw" data-fam="' + CP.attr(s.w.hz) + '"' + (s.alts ? ' title="' + CP.attr(all.map(function (w) { return w.py + " " + w.it; }).join(" · ")) + '"' : "") + '><span class="xp">' + pys.map(CP.pinyinHTML).join(" / ") + '</span><span class="xh" lang="zh-CN">' + CP.hanziHTML(s.w.hz, s.w.py) + '</span><span class="xi" lang="it">' + esc(all.map(CP.gloss).join(" / ")) + "</span></button>";
      } else if (s.p) {
        s.raw.split(/(\n)/).forEach(function (part) {
          if (part === "\n") h += '<span class="xr-break"></span>';
          else if (part.trim()) h += '<span class="xp-punct">' + esc(part.replace(/ +/g, " ")) + "</span>";
        });
      } else if (s.part) {
        /* da solo non è nel vocabolario, ma compare dentro parole note: lettura (se è una sola) e dove l'hai già visto */
        var pw = s.part.words[0];
        h += '<button type="button" class="xw part" data-fam="' + CP.attr(s.raw) + '" title="' + CP.attr(T("rd.inside") + " " + s.part.words.map(function (w) { return w.hz + " " + CP.gloss(w); }).join(", ")) + '"><span class="xp">' + (s.part.py ? CP.pinyinHTML(s.part.py) : "?") + '</span><span class="xh" lang="zh-CN">' + esc(s.raw) + '</span><span class="xi">' + T("rd.in") + " " + esc(pw.hz) + "</span></button>";
      } else {
        h += '<span class="xw unk" title="' + CP.attr(T("rd.unkT")) + '"><span class="xp">?</span><span class="xh" lang="zh-CN">' + esc(s.raw) + '</span><span class="xi">' + T("rd.unk") + "</span></span>";
      }
    });
    var pct = a.chars ? Math.round(a.known / a.chars * 100) : 0;
    return '<div class="xr-out">' + h + '</div><p class="xr-stat">' + T("rd.known", { n: "<b>" + a.known, tot: a.chars + "</b>", p: pct }) +
      (a.inside ? " " + T("rd.insideN", { n: a.inside }) : "") +
      (a.unk.length ? " " + T("rd.unkList", { l: "<span class=\"han\" lang=\"zh-CN\">" + esc(a.unk.slice(0, 20).join(" ")) + "</span>" }) : "") + "</p>" +
      wikiHTML(a.segs) + '<div class="acts"><button type="button" class="btn-main" data-xr-play style="margin:0">▶️ ' + T("rd.play") + "</button></div>";
  }
  CP.wiki = { load: wikiLoad, hits: function (raw) { return WK.map ? wikiHits(CP.segment(raw)) : []; } };
  CP.subs = CP.subs || {};
  CP.subs.reader = {
    render: function () {
      return '<p class="intro" style="margin-top:14px">' + T("rd.lede") + "</p>" +
        '<label for="xr-in" class="sr">' + T("rd.label") + '</label><textarea id="xr-in" class="xr-in" rows="4" placeholder="' + CP.attr(T("rd.ph")) + '" spellcheck="false" autocapitalize="off" autocomplete="off" style="width:100%">' + esc(text) + "</textarea>" +
        '<div class="xr-sample" role="group" aria-label="' + CP.attr(T("rd.samples")) + '">' + SAMPLES.map(function (s, i) { return '<button type="button" data-xr-sample="' + i + '">' + esc(T(s[0])) + "</button>"; }).join("") + '<button type="button" data-xr-clear>' + T("lab.clear") + "</button></div>" +
        '<div id="xr-res">' + outHTML(text) + "</div>";
    },
    after: function () {}
  };
  function paint() { var r = document.getElementById("xr-res"); if (r) r.innerHTML = outHTML(text); }
  var root = document.getElementById("build-root");
  root.addEventListener("input", function (e) {
    if (e.target.id !== "xr-in") return;
    text = e.target.value; clearTimeout(timer); timer = setTimeout(paint, 220);
  });
  root.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest) return;
    var b = t.closest("[data-xr-sample]");
    if (b) { text = SAMPLES[+b.getAttribute("data-xr-sample")][1]; var ta = document.getElementById("xr-in"); if (ta) ta.value = text; paint(); CP.sfx("tap"); return; }
    if (t.closest("[data-xr-clear]")) { text = ""; var ta2 = document.getElementById("xr-in"); if (ta2) { ta2.value = ""; ta2.focus(); } paint(); return; }
    if (t.closest("[data-xr-wiki]")) { var wb = t.closest("[data-xr-wiki]"); wb.disabled = true; wb.textContent = "📚 " + T("rd.wikiLoading"); wikiLoad().then(paint); return; }
    if (t.closest("[data-xr-play]")) { CP.speak(U.chars(text) ? text.replace(/\s+/g, "，") : "", {}); return; }
  });
})();
