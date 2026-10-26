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
      '<div class="acts"><button type="button" class="btn-main" data-xr-play style="margin:0">▶️ ' + T("rd.play") + "</button></div>";
  }
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
    if (t.closest("[data-xr-play]")) { CP.speak(U.chars(text) ? text.replace(/\s+/g, "，") : "", {}); return; }
  });
})();
