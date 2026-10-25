/* V6.7 · §5 fase 1: livello di traduzione dell'interfaccia. Cambia la lingua dei menu, non la direzione di studio:
   il corso resta «cinese per italiani». Ogni stringa nuova passa da qui: t("chiave", { variabile: valore }).
   I testi dei moduli più vecchi (esercizi, dialoghi, lettore…) migrano un po' alla volta; le chiavi mancanti in zh
   ricadono sull'italiano. Lingua scelta in ⚙️, salvata in cp-lang. */
var I18N = {};
var LANG = (function () { try { var l = localStorage.getItem("cp-lang"); return l === "zh" ? "zh" : "it"; } catch (e) { return "it"; } })();
function t(key, vars) {
  var s = (I18N[LANG] && I18N[LANG][key] != null) ? I18N[LANG][key] : (I18N.it[key] != null ? I18N.it[key] : key);
  return vars ? String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : s;
}
/* gli elementi statici: data-i18n = testo, data-i18n-ph = placeholder, data-i18n-aria = aria-label (e title) */
function applyI18n(root) {
  root = root || document;
  Array.prototype.forEach.call(root.querySelectorAll("[data-i18n]"), function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
  Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-ph]"), function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
  Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-aria]"), function (el) { var v = t(el.getAttribute("data-i18n-aria")); el.setAttribute("aria-label", v); if (el.hasAttribute("title")) el.title = v; });
  document.documentElement.setAttribute("lang", LANG === "zh" ? "zh-CN" : "it");
}
