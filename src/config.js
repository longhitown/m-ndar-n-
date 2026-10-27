/* ===== màndarínō · configurazione: l'identità del progetto in un solo punto.
   Il primo script dopo boot.js: tutti gli altri moduli leggono da qui (window.MD_CONFIG), nessuno scrive indirizzi a mano.
   Se il repository cambia nome, se cambia la pagina di sostegno o l'indirizzo di contatto, si cambia solo questo file.
   Gli interruttori FEATURE_* li può sovrascrivere la build (versione «store», vedi tools/build.mjs --flavor store). ===== */
var MD_CONFIG = {
  REPO: "longhitown/mandarino",                       /* GitHub: issue dei contributi, controllo delle release dell'APK */
  CONTACT_EMAIL: "mandarinoapp@gmail.com",            /* canale secondario dei contributi */
  SUPPORT_URL: "https://ko-fi.com/mandarinoapp",      /* sostegno volontario (link aperto solo da un tocco) */
  STORE_URLS: { play: "", fdroid: "" },               /* indirizzi degli store, quando ci saranno */
  SITE_URL: "",                                       /* sito pubblico (GitHub Pages), quando ci sarà */
  FLAVOR: "direct",                                   /* "direct" (sito, APK da GitHub) | "store" */
  FEATURE_DONATE: true,
  FEATURE_SEALS: true,
  SEAL_PUBKEYS: []                                    /* chiavi pubbliche dei sigilli: [{ kid, jwk }]; vuoto = niente «riscatta» */
};
