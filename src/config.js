/* ===== màndarínō · configurazione: l'identità del progetto in un solo punto.
   Il primo script dopo boot.js: tutti gli altri moduli leggono da qui (window.MD_CONFIG), nessuno scrive indirizzi a mano.
   Se il repository cambia nome, se cambia la pagina di sostegno o l'indirizzo di contatto, si cambia solo questo file.
   Versione «store» (Task 7D): nell'APK la sceglie la build Android (productFlavors, MandarinoAndroid.flavor()); qui sotto
   si spengono il controllo degli aggiornamenti dell'APK, il sostegno e i sigilli. Il codice web resta identico. ===== */
var MD_CONFIG = {
  REPO: "longhitown/mandarino",                       /* GitHub: issue dei contributi, controllo delle release dell'APK */
  CONTACT_EMAIL: "mandarinoapp@gmail.com",            /* canale secondario dei contributi */
  SUPPORT_URL: "https://ko-fi.com/mandarinoapp",      /* sostegno volontario (link aperto solo da un tocco) */
  STORE_URLS: { play: "", fdroid: "" },               /* indirizzi degli store, quando ci saranno */
  SITE_URL: "https://mandarinoapp.org/",              /* sito pubblico (GitHub Pages): l'app è in app/, la pagina cinese in zh/ */
  /* il QR delle carte da condividere: l'indirizzo semplice della pagina cinese, senza parametri né codici.
     Vuoto = il link all'ultimo APK (ui/share-card.js). */
  SHARE_URL: "https://mandarinoapp.org/zh/",
  FLAVOR: "direct",                                   /* "direct" (sito, APK da GitHub) | "store" */
  APK_UPDATES: true,                                  /* controllo delle release su GitHub (solo APK diretto) */
  FEATURE_DONATE: true,
  FEATURE_SEALS: true,
  SEAL_PUBKEYS: []                                    /* chiavi pubbliche dei sigilli: [{ kid, jwk }]; vuoto = niente «riscatta» */
};
(function () {
  var A = typeof window !== "undefined" && window.MandarinoAndroid, f = "";
  try { f = A && A.flavor ? String(A.flavor()) : ""; } catch (e) {}
  if (f === "store") { MD_CONFIG.FLAVOR = "store"; MD_CONFIG.APK_UPDATES = false; MD_CONFIG.FEATURE_DONATE = false; MD_CONFIG.FEATURE_SEALS = false; }
})();
/* solo per le prove automatiche (tools/e2e.mjs, tools/unit.mjs): chiavi usa-e-getta e interruttori della versione store */
if (typeof window !== "undefined" && window.__mdConfigTest) Object.assign(MD_CONFIG, window.__mdConfigTest);
