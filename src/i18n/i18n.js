/* V6.7 · §5: livello di traduzione dell'interfaccia. Cambia la lingua dei menu, non la direzione di studio:
   il corso resta «cinese per italiani». Ogni testo dell'interfaccia passa da qui: t("chiave", { variabile: valore }).
   Regola (V6.8, controllata dai test e2e in cinese su 20 schermate): un testo visibile è o una chiave t(), o pinyin,
   o contenuto di studio in italiano dentro un elemento lang="it" (traduzioni, titoli delle tappe, lezioni, dialoghi).
   Le chiavi mancanti in zh ricadono sull'italiano. Lingua scelta in ⚙️, salvata in cp-lang: cambiarla ricarica l'app. */
var I18N = {};
var LANG = (function () { try { var l = localStorage.getItem("cp-lang"); return l === "zh" ? "zh" : "it"; } catch (e) { return "it"; } })();
function t(key, vars) {
  var s = (I18N[LANG] && I18N[LANG][key] != null) ? I18N[LANG][key] : (I18N.it[key] != null ? I18N.it[key] : key);
  return vars ? String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : s;
}
/* la lingua dell'interfaccia come attributo lang (per i pulsanti dentro un contenuto in italiano) */
function uiLang() { return LANG === "zh" ? "zh-CN" : "it"; }
/* gli elementi statici: data-i18n = testo, data-i18n-ph = placeholder, data-i18n-aria = aria-label (e title) */
function applyI18n(root) {
  root = root || document;
  Array.prototype.forEach.call(root.querySelectorAll("[data-i18n]"), function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
  Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-ph]"), function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
  Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-aria]"), function (el) { var v = t(el.getAttribute("data-i18n-aria")); el.setAttribute("aria-label", v); if (el.hasAttribute("title")) el.title = v; });
  document.documentElement.setAttribute("lang", LANG === "zh" ? "zh-CN" : "it");
}
