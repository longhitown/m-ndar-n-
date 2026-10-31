/* ===== màndarínō · «l'app cresce con te»: il pop-up quando si apre una scheda nuova (CP.unlockPop, chiamato da ui/unlock.js)
   e la scheda «Il tuo studio cresce con te» in cima al Percorso e alle Lezioni (CP.growCard, chiamato da path/path.js e it/course.js).
   Il pop-up fa tre cose, in questo ordine: riconosce il lavoro di chi studia, dice a che cosa serve la scheda appena aperta e mostra
   la prossima sorpresa con la strada già fatta (effetto del progresso già iniziato). Mai colpe, mai scadenze, mai contatori che
   spaventano; si chiude con un tocco e dice dove rivedere tutto. La scheda mostra la stessa strada, il bonus d'inizio e, a parte,
   Pleco, Anki e i widget, perché chi non legge le impostazioni sappia che ci sono. Testi: i18n/grow.js. Si carica al primo uso
   (tools/build.mjs, LAZYMOD). ===== */
(function () {
  var CP = window.CP, T = CP.t, esc = CP.esc, IT = false;
  try { IT = localStorage.getItem("cp-course") === "it"; } catch (e) {}
  var HIDE = "md-grow-hide";
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  (function css() {
    if (document.getElementById("grow-css")) return;
    var s = document.createElement("style"); s.id = "grow-css";
    s.textContent =
      ".grow-pop{display:grid;gap:12px;text-align:center;justify-items:center}.gp-ico{font-size:54px;line-height:1;animation:gp-pop .7s cubic-bezier(.2,1.4,.4,1) both}" +
      ".gp-t{margin:0;font-size:22px;color:var(--accent)}.gp-s,.gp-w,.gp-more{margin:0}.gp-w{font-weight:700}" +
      ".gp-next{width:100%;display:grid;gap:6px;text-align:left;background:var(--chip);border-radius:14px;padding:12px 14px}" +
      ".gp-bar{height:8px;border-radius:99px;background:var(--line);overflow:hidden}.gp-bar i{display:block;height:100%;background:var(--accent);border-radius:99px;transition:width .9s ease}" +
      ".grow-pop .acts{width:100%;display:grid;gap:8px}.grow-pop .acts .btn-main{width:100%}" +
      "@keyframes gp-pop{0%{transform:scale(.3) rotate(-14deg);opacity:0}100%{transform:none;opacity:1}}" +
      "@media (prefers-reduced-motion:reduce){.gp-ico{animation:none}.gp-bar i{transition:none}}" +
      ".grow-card{display:grid;gap:8px;position:relative}.grow-card h3{margin:0;font-size:17px;color:var(--accent);padding-right:36px}" +
      ".gc-x{position:absolute;top:6px;right:6px;min-width:36px;min-height:36px}.gc-steps{display:flex;flex-wrap:wrap;gap:6px}" +
      ".gc-pill{padding:4px 11px;border-radius:99px;background:var(--chip);font-size:14px;font-weight:700}.gc-pill.on{background:var(--accent);color:var(--bg)}" +
      ".gc-ex{display:flex;flex-wrap:wrap;gap:8px}.gc-ex button{display:grid;text-align:left;gap:0;padding:8px 12px;border-radius:12px;font-weight:700}.gc-ex small{font-weight:400;color:var(--muted)}";
    document.head.appendChild(s);
  })();
  function nameOf(k) { return CP.unlock && CP.unlock.name ? CP.unlock.name(k) : k; }
  function closeFx() { try { CP.closeSheet(); } catch (e) {} }
  function go(tab) { closeFx(); if (!tab) return; if (IT && CP.itShow) CP.itShow(tab); else CP.show(tab); }

  /* ---- il pop-up. Restituisce true se l'ha mostrato; onClose() viene chiamato una volta sola, comunque si chiuda ---- */
  CP.unlockPop = function (k, info, onClose) {
    if (!CP.openSheet) return false;
    info = info || {};
    var nx = info.next, nxt;
    if (nx && nx.xp) nxt = T("grow.popNext", { n: esc(nameOf(nx.k)), xp: nx.xp, m: Math.max(1, nx.xp - nx.have) });
    else if (nx && nx.ls) nxt = T("grow.popNextLs", { n: esc(nameOf(nx.k)), ls: nx.ls, have: nx.haveLs });
    else nxt = T("grow.popDone");
    var html = '<div class="fam-head"><span></span><button type="button" class="fam-x btn-s" data-famclose>' + esc(T("common.close")) + "</button></div>" +
      '<div class="grow-pop"><div class="gp-ico" aria-hidden="true">✨</div><h3 class="gp-t">' + T("grow.popT", { n: esc(nameOf(k)) }) + "</h3>" +
      '<p class="gp-s">' + T("grow.popSub", { xp: info.xp || 0 }) + '</p><p class="gp-w">' + esc(T("unl." + k.replace(":", "_"))) + "</p>" +
      '<div class="gp-next"><span class="small">' + nxt + '</span><div class="gp-bar" role="img" aria-label="' + CP.attr(String(nx ? nx.pct : 100) + "%") + '"><i style="width:' + (nx ? nx.pct : 100) + '%"></i></div></div>' +
      '<p class="gp-more small muted">' + T("grow.popMore") + "</p>" +
      '<div class="acts">' + (info.tab ? '<button type="button" class="btn-main" data-grow-go="' + CP.attr(info.tab) + '">' + esc(T("grow.popGo")) + "</button>" : "") +
      '<button type="button" class="btn-s" data-famclose>' + esc(T("grow.popLater")) + '</button></div><p class="small muted" style="margin:0">' + T("grow.popWhere") + "</p></div>";
    CP.openSheet(html);
    try { CP.sfx("level"); if (CP.haptic) CP.haptic(18); } catch (e) {}
    var fam = document.getElementById("fam"), done = false;
    function fire() { if (done) return; done = true; if (mo) mo.disconnect(); if (onClose) onClose(); }
    var mo = null;
    if (fam && window.MutationObserver) { mo = new MutationObserver(function () { if (fam.hidden) fire(); }); mo.observe(fam, { attributes: true, attributeFilter: ["hidden"] }); }
    else setTimeout(fire, 0);
    return true;
  };

  /* ---- la scheda in cima al Percorso e alle Lezioni ---- */
  CP.growCard = function () {
    if (lsGet(HIDE) === "1" || !CP.unlock) return "";
    var U = CP.unlock, nx = U.next && U.next(), steps = IT ? ["words", "conj", "phrases"] : ["words", "build"], rank = CP.game ? CP.game.rank().xp : 0;
    var pills = steps.map(function (t) {
      var on = U.ok(t), key = IT ? "it:" + t : t;
      return '<span class="gc-pill' + (on ? " on" : "") + '">' + (on ? "✓ " : "🔒 ") + esc(nameOf(key)) + '<span class="sr"> — ' + esc(T(on ? "grow.open" : "grow.locked")) + "</span></span>";
    }).join("");
    var bar = "";
    if (nx) {
      var line = nx.xp ? T("grow.pts", { have: Math.min(nx.have, nx.xp), xp: nx.xp }) : T("grow.ls", { have: nx.haveLs, ls: nx.ls });
      bar = '<div class="small"><b>' + T("grow.next", { n: esc(nameOf(nx.k)) }) + '</b> · <span class="muted">' + line + '</span></div><div class="gp-bar" role="img" aria-label="' + CP.attr(nx.pct + "%") + '"><i style="width:' + nx.pct + '%"></i></div>';
    }
    var boost = rank < 300 ? '<div class="small muted">🚀 ' + T("grow.boost") + "</div>" : "";
    var ex = '<div class="small muted">' + T("grow.x") + '</div><div class="gc-ex">' +
      [["pleco", "set-pleco"], ["anki", "set-export"], ["widget", "set-widgets"]].map(function (x) {
        return '<button type="button" class="btn-s" data-grow-set="' + x[1] + '"><span>' + esc(T("grow." + x[0])) + "</span><small>" + esc(T("grow." + x[0] + "D")) + "</small></button>";
      }).join("") + "</div>";
    return '<div class="panel grow-card"><h3>🌱 ' + T("grow.t") + '</h3><button type="button" class="btn-s gc-x" data-grow-hide aria-label="' + CP.attr(T("grow.hide")) + '">✕</button>' +
      '<p class="small muted" style="margin:0">' + T("grow.lede") + '</p><div class="gc-steps">' + pills + "</div>" + bar + boost + ex + "</div>";
  };

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-grow-go], [data-grow-set], [data-grow-hide]") : null; if (!t) return;
    CP.sfx("tap");
    if (t.hasAttribute("data-grow-go")) { go(t.getAttribute("data-grow-go")); return; }
    if (t.hasAttribute("data-grow-set")) { if (CP.openSettings) CP.openSettings(t.getAttribute("data-grow-set")); return; }
    lsSet(HIDE, "1"); var c = t.closest(".grow-card"); if (c && c.parentNode) c.parentNode.removeChild(c);
  });
})();
