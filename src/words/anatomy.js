/* ===== màndarínō · anatomia del carattere (Task 5), solo nel corso di cinese, nel foglio del carattere (non sul fronte
   della carta di studio). Il carattere si «smonta» nei componenti del primo livello, disegnati in SVG con le linee centrali
   dei tratti (data/strokes.js) colorate per componente (il campo matches di Make Me a Hanzi, data/anatomy.js). Ogni
   componente è un pulsante: apre il foglio della sua famiglia (le altre parole che lo contengono), con il suo significato
   quando lo sappiamo: dal vocabolario dell'app o dai 214 radicali (data/radicals.js, scritti da noi).
   Solo struttura: per i caratteri fonetico-semantici si dice quale parte dà il suono e quale il significato; nessuna
   «storia» o etimologia popolare (i dati non hanno una fonte affidabile per raccontarle).
   Interruttore: ⚙️ → Avanzate → «Anatomia dei caratteri» (cp-anatomy, acceso di base). I dati pesanti (ANATOMY, STROKES)
   si leggono solo al primo uso. Nella lavagna (voice/pad.js) evidenzia il componente del tratto da scrivere. ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, K = "cp-anatomy";
  var IT = (function () { try { return localStorage.getItem("cp-course") === "it"; } catch (e) { return false; } })();
  function on() { if (IT) return false; try { return localStorage.getItem(K) !== "0"; } catch (e) { return true; } }
  function set(v) { try { localStorage.setItem(K, v ? "1" : "0"); } catch (e) {} }
  var RAD = null;
  function radical(ch) {
    if (!RAD) { RAD = {}; (window.RADICALS || []).forEach(function (r) { RAD[r[1]] = r; Array.from(r[2] || "").forEach(function (v) { RAD[v] = r; }); }); }
    return RAD[ch] || null;
  }
  /* { ch, op, parts: [..], rad, type: "p"|"i"|"s"|"", phon, sem, groups: "0011…" } oppure null */
  function get(ch) {
    var A = typeof ANATOMY !== "undefined" ? ANATOMY : null, x = A && A[ch]; if (!x) return null;
    var d = x[0] || "";
    return { ch: ch, op: d ? Array.from(d)[0] : "", parts: d ? Array.from(d).slice(1).join("").split("|").filter(Boolean) : [], rad: x[1] || "", type: x[2] || "", phon: x[3] || "", sem: x[4] || "", groups: x[5] || "" };
  }
  /* il significato di un componente: dal vocabolario (prima la parola d'una sola sillaba), poi dai radicali */
  function meaning(c) {
    var w = CP.WORDS && CP.WORDS[c], r = radical(c);
    if (w) return { py: w.py.replace(/\./g, ""), it: CP.gloss ? CP.gloss(w) : w.it, rad: r };
    if (r) return { py: "", it: LANG === "zh" ? r[4] : r[3], rad: r };
    return null;
  }
  var COLORS = ["var(--accent)", "var(--stamp-red, #C8312B)", "#C77800", "#6C4AB6"];
  /* il carattere in SVG: le linee centrali dei tratti, colorate per componente */
  function svg(ch, a) {
    var M = CP.strokeData ? CP.strokeData(ch) : null; if (!M) return "";
    var g = a && a.groups;
    return '<svg class="anat-svg" viewBox="-6 -6 112 112" role="img" aria-label="' + CP.attr(T("anat.svgAria", { c: ch })) + '">' +
      M.map(function (st, i) {
        var k = g && g[i] && g[i] !== "-" ? +g[i] : -1, col = k >= 0 ? COLORS[k % COLORS.length] : "var(--muted)";
        return '<polyline points="' + st.map(function (p) { return (p.x * 100).toFixed(1) + "," + (p.y * 100).toFixed(1); }).join(" ") + '" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>';
      }).join("") + "</svg>";
  }
  function roleOf(a, c) { return a.type === "s" ? (c === a.phon ? "phon" : c === a.sem ? "sem" : "") : ""; }
  function html(ch) {
    if (!on() || !/^[㐀-鿿]$/.test(ch || "")) return "";
    var a = get(ch); if (!a) return "";
    var r = radical(ch) || (a.rad && radical(a.rad)), parts = a.parts, h = '<section class="anat" aria-label="' + CP.attr(T("anat.title")) + '"><h4>' + esc(T("anat.title")) + "</h4>";
    if (!parts.length) {
      h += '<div class="anat-row">' + svg(ch, a) + '<p class="small" style="margin:0">' + esc(T(a.type === "p" ? "anat.picto" : "anat.simple")) + (r ? " " + esc(T("anat.isRad", { n: r[0], m: LANG === "zh" ? r[4] : r[3] })) : "") + "</p></div>";
      return h + "</section>";
    }
    h += '<div class="anat-row">' + svg(ch, a) + '<div class="anat-parts">' + parts.map(function (c, i) {
      var m = Array.from(c).length === 1 ? meaning(c) : null, role = roleOf(a, c);
      return '<button type="button" class="anat-part" data-anat="' + CP.attr(Array.from(c)[0]) + '" style="--c:' + COLORS[i % COLORS.length] + '"><span class="anat-ch" lang="zh-CN">' + esc(c) + "</span>" +
        "<span>" + (role ? '<b class="anat-role">' + esc(T("anat." + role)) + "</b>" : "") + (m ? '<small>' + (m.py ? esc(m.py) + " · " : "") + '<span lang="' + (LANG === "zh" && !CP.WORDS[c] ? "zh-CN" : "it") + '">' + esc(m.it) + "</span></small>" : "") + "</span></button>";
    }).join("") + "</div></div>";
    var why = a.type === "s" && a.phon && a.sem ? T("anat.ps", { s: a.sem, p: a.phon, py: (meaning(a.phon) || {}).py ? (LANG === "zh" ? "（" + meaning(a.phon).py + "）" : " (" + meaning(a.phon).py + ")") : "" }) : a.type === "i" ? T("anat.ideo") : a.type === "p" ? T("anat.picto") : T("anat.parts");
    h += '<p class="small" style="margin:6px 0 0">' + esc(why) + "</p>";
    if (r) h += '<p class="small muted" style="margin:2px 0 0">' + esc(T("anat.rad", { r: r[1], n: r[0], m: LANG === "zh" ? r[4] : r[3] })) + "</p>";
    return h + '<p class="small muted" style="margin:2px 0 0">' + esc(T("anat.note")) + "</p></section>";
  }
  CP.anatomy = { on: on, set: set, get: get, html: html, svg: svg, radical: radical, groups: function (ch) { var a = get(ch); return a && a.groups ? a.groups : ""; } };
  CP.anatomyHTML = html;
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-anat]") : null; if (!b) return;
    CP.sfx("tap"); CP.openFamily(b.getAttribute("data-anat"));
  });
  /* ⚙️ → Avanzate */
  (CP.settingsExtras = CP.settingsExtras || []).push({ group: "adv", html: function () {
    if (IT) return "";
    return '<details class="set-sec" id="set-anat"><summary>🧩 ' + T("anat.set") + '</summary><div class="vbody"><p class="small muted" style="margin:0">' + T("anat.setLede") + "</p>" +
      '<label class="chk"><input type="checkbox" id="opt-anat"' + (on() ? " checked" : "") + "> " + T("anat.setToggle") + "</label></div></details>";
  } });
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "opt-anat") { set(e.target.checked); CP.sfx("tap"); } });
})();
