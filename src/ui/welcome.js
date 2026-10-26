/* ===== V6.7 · U8: benvenuto, una volta sola (cp-ux-v1.onboarded) ===== */
(function () {
  var CP = window.CP, goal = 5;
  function html() {
    var w = CP.WORDS["我"], T = CP.t;
    return '<div class="welcome-card"><div class="fam-head"><h2 style="margin:0">' + T("wel.title") + '</h2><button type="button" class="fam-x btn-s" data-famclose id="w-later">' + T("common.later") + "</button></div>" +
      '<p style="margin:0">' + CP.esc(T("wel.intro", { n: CP.ORDER.length })) + "</p>" +
      '<div class="fc"><div class="order"><span>' + T("wel.read") + "</span><span>" + T("wel.write") + "</span><span>" + T("wel.mean") + "</span></div>" +
      '<div class="order" style="align-items:center;color:var(--ink)"><span class="cd-py" style="font-size:26px">' + CP.pinyinHTML(w.py) + '</span><span class="cd-hz han" style="font-size:48px">' + CP.hanziHTML(w.hz, w.py) + '</span><span style="font-size:18px;font-weight:600">' + CP.esc(CP.gloss(w)) + "</span></div>" +
      '<p class="small muted" style="margin:0">' + T("wel.tones") + "</p></div>" +
      "<div><b>" + T("wel.goal") + '</b><div class="welcome-goal" role="group" aria-label="' + CP.attr(T("wel.goal")) + '" style="margin-top:8px">' +
      [5, 10, 20].map(function (n) { return '<button type="button" data-wgoal="' + n + '"' + (n === goal ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + n + "</button>"; }).join("") + "</div>" +
      '<p class="small muted" style="margin:6px 0 0">' + T("wel.goalHint") + "</p></div>" +
      '<button type="button" class="btn-main" id="w-start" style="margin-top:0">' + T("wel.start", { n: goal }) + "</button>" +
      '<button type="button" class="btn-s" data-course-set="it" lang="zh-CN">🇨🇳 我是中国人，我想学意大利语</button></div>';
  }
  CP.welcome = function (force) {
    if (!force && CP.ux.get("onboarded")) return;
    CP.openSheet(html());
  };
  var fam = document.getElementById("fam");
  fam.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-wgoal], #w-start, #w-later") : null; if (!b) return;
    if (b.hasAttribute("data-wgoal")) { goal = parseInt(b.getAttribute("data-wgoal"), 10); var card = fam.querySelector(".welcome-card"); if (card) { CP.openSheet(html()); } return; }
    CP.ux.set("onboarded", 1);
    if (b.id === "w-start") {
      if (CP.studyCfg) CP.studyCfg({ n: goal }); if (CP.game && CP.game.setGoal) CP.game.setGoal(goal === 20 ? 20 : goal);
      CP.closeSheet(); CP.show("study"); if (CP.studyStart) CP.studyStart();
    }
  });
  /* chi ha già dei progressi non è nuovo */
  if (!CP.ux.get("onboarded")) {
    if (Object.keys(CP.S()).length) CP.ux.set("onboarded", 1);
    else setTimeout(function () { if (!CP.topSheet() && location.hash !== "#selftest") CP.welcome(); }, 400);
  }
})();
