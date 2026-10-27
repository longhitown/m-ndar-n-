/* ===== màndarínō · la scelta del corso, in tutti e due i corsi (⚙️ → Corso): cp-course = "zh" (cinese per italiani,
   predefinito) | "it" (italiano per cinesi). Il corso di italiano (it/today.js, it/course.js, i18n/it-course.js) nel file
   unico si esegue solo quando serve (tools/build.mjs, COURSE_IT): chi studia cinese non lo paga all'avvio. ===== */
(function () {
  var CP = window.CP, KEY = "cp-course";
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
    return '<details class="set-sec" id="set-course"><summary data-noi18n>🎓 Corso · 课程</summary><div class="vbody">' +
      '<div class="seg" role="group" aria-label="Corso · 课程" data-noi18n><button type="button" data-course-set="zh"' + (course === "zh" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🇮🇹 Impara il cinese · 学中文</button>" +
      '<button type="button" data-course-set="it"' + (course === "it" ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">🇨🇳 学意大利语</button></div>" +
      '<p class="small muted" style="margin:0" data-noi18n>Due corsi, progressi separati: passare dall\'uno all\'altro non cancella niente. · 两个课程的学习记录分开保存，切换不会丢失任何内容。</p></div></details>';
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-course-set]") : null;
    if (b && b.getAttribute("data-course-set") !== course) CP.setCourse(b.getAttribute("data-course-set"));
  });
})();
