/* ===== V4d: lettore universale "Raggi X" (qualunque testo cinese, pinyin sopra ogni parola) ===== */
(function () {
  var CP = window.CP, esc = CP.esc, U = CP.u, text = "", timer = 0;
  var SAMPLES = [
    ["Presentazione", "你好！我是意大利人，我想学中文。"],
    ["Al ristorante", "服务员，我要饺子和茶，谢谢。"],
    ["Chiedere la strada", "请问，火车站怎么走？远吗？"],
    ["Un invito", "明天晚上我想请你吃饭，好吗？"],
    ["Fa caldo", "今天很热，我想喝冰水。"]
  ];
  function analyse(raw) {
    var segs = CP.segment(raw), chars = 0, known = 0, unk = {}, parts = [];
    raw.split("\n").forEach(function () {});
    segs.forEach(function (s) {
      if (s.w) { var n = Array.from(s.w.hz).length; chars += n; known += n; return; }
      if (s.p) return;
      chars++; unk[s.raw] = 1;
    });
    return { segs: segs, chars: chars, known: known, unk: Object.keys(unk) };
  }
  function outHTML(raw) {
    if (!raw.trim()) return '<p class="xr-stat">Incolla o scrivi qui sopra un testo in cinese. Per ogni parola che conosco vedi pinyin, carattere e significato.</p>';
    var a = analyse(raw), h = "";
    a.segs.forEach(function (s) {
      if (s.w) {
        h += '<button type="button" class="xw" data-fam="' + CP.attr(s.w.hz) + '"><span class="xp">' + CP.pinyinHTML(s.w.py) + '</span><span class="xh">' + CP.hanziHTML(s.w.hz, s.w.py) + '</span><span class="xi">' + esc(CP.gloss(s.w)) + "</span></button>";
      } else if (s.p) {
        s.raw.split(/(\n)/).forEach(function (part) {
          if (part === "\n") h += '<span class="xr-break"></span>';
          else if (part.trim()) h += '<span class="xp-punct">' + esc(part.replace(/ +/g, " ")) + "</span>";
        });
      } else {
        h += '<span class="xw unk" title="Non è nel vocabolario"><span class="xp">?</span><span class="xh">' + esc(s.raw) + '</span><span class="xi">non ancora</span></span>';
      }
    });
    var pct = a.chars ? Math.round(a.known / a.chars * 100) : 0;
    return '<div class="xr-out">' + h + '</div><p class="xr-stat">Riconosco <b>' + a.known + " caratteri su " + a.chars + "</b> (" + pct + "%)." +
      (a.unk.length ? " Non ancora nel vocabolario: <span class=\"han\">" + esc(a.unk.slice(0, 20).join(" ")) + "</span>." : "") + "</p>" +
      '<div class="acts"><button type="button" class="btn-main" data-xr-play style="margin:0">▶️ Leggi tutto il testo</button></div>';
  }
  CP.subs = CP.subs || {};
  CP.subs.reader = {
    render: function () {
      return '<p class="intro" style="margin-top:14px">Incolla una frase, un messaggio o un menù in cinese. Io lo taglio in parole e ti dico come si legge.</p>' +
        '<label for="xr-in" class="sr">Testo cinese</label><textarea id="xr-in" class="xr-in" rows="4" placeholder="Scrivi o incolla qui, per esempio: 你好，我想学中文。" spellcheck="false" autocapitalize="off" autocomplete="off" style="width:100%">' + esc(text) + "</textarea>" +
        '<div class="xr-sample" role="group" aria-label="Testi di prova">' + SAMPLES.map(function (s, i) { return '<button type="button" data-xr-sample="' + i + '">' + esc(s[0]) + "</button>"; }).join("") + '<button type="button" data-xr-clear>Svuota</button></div>' +
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
