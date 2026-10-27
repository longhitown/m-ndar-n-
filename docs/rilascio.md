# Checklist di rilascio

Per pubblicare una versione. Tempo: 20-30 minuti più le prove sul telefono.

## 1. Versione

- **Numeri.** Il **numero di versione dell'APK** è automatico: `versionCode` = numero di commit del ramo,
  `versionName` = `6.7.<versionCode>` (`android/app/build.gradle`). La **versione dell'app** («6.7») sta in
  `src/words/table.js` (`CP.VERSION`), insieme a `CP.DATASET` (data dei dati). Si cambiano solo per una versione nuova
  dell'app, non per ogni APK.
- **Novità.** Una voce nuova in cima a `src/data/changelog.js`, in italiano e cinese, con lo stesso numero di righe
  (la build lo controlla). Righe brevi, scritte per chi studia.

## 2. Prove in locale

```
npm install
npm test                 # prove unitarie, build, e2e (con #selftest), ux-audit
```

- Tutto verde. Se cambia `src/`, `dist/` va rigenerato (`node tools/build.mjs`) e messo nel commit: la CI controlla
  che sia aggiornato.
- Se sono cambiati testi o immagini dello store: `node tools/store-assets.mjs`; per le note di versione
  `node tools/store-assets.mjs --notes <versionCode>`.

## 3. CI

Dopo il push, su GitHub → Actions, le corse devono essere verdi:

- **web**: prove, `dist/` aggiornato, e2e, ux-audit;
- **APK Android**: lint, APK `direct`, `.apk` e `.aab` `store`, e il lavoro **dispositivo** (emulatori Android 14 e 16).

Se una prova è rossa non si pubblica: si apre una issue o si corregge.

## 4. Firma

- **APK diretto.** Lo firma la CI con la chiave del repository (segreti `MD_KEYSTORE_B64` e `MD_KEYSTORE_PASSWORD`).
  Senza segreti l'APK è firmato con una chiave di prova e **non** si installa sopra la versione precedente: in quel
  caso non si pubblica.
- **La chiave.** Non sta mai nel repository né nei log. Una copia sicura è fuori da GitHub
  ([store/firma.md](store/firma.md)).

## 5. Pubblicazione

- **APK diretto.** È automatico: un push sul **ramo predefinito**, con i segreti, crea la Release `v6.7.<versionCode>`
  con `mandarino.apk`. Il link `…/releases/latest/download/mandarino.apk` scarica sempre l'ultima.
- **Sito (GitHub Pages).** `pages.yml` pubblica `docs/`, l'app e l'ultimo APK a ogni push su `main` che li riguarda e a ogni nuova Release; serve che in
  Settings → Pages la fonte sia «GitHub Actions».
- **Google Play** (quando ci sarà l'account):
  - scarica l'artefatto `mandarino-store-<versione>` della corsa (`.aab` e note);
  - caricalo in Play Console, nel test chiuso o in produzione;
  - le note di versione stanno in `fastlane/metadata/android/<lingua>/changelogs/<versionCode>.txt`;
  - [store/README.md](store/README.md) ha i passi e [store/moduli.md](store/moduli.md) le risposte ai moduli.
- **Dopo.** Prova l'aggiornamento sopra la versione precedente su un telefono vero
  ([checklist-dispositivo.md](checklist-dispositivo.md), ultima riga).

## Ramo predefinito

Il ramo predefinito è `main`. La Release dell'APK si pubblica quando `github.ref_name == github.event.repository.default_branch`, quindi non dipende dal nome del ramo.
Se il repository cambia nome, basta aggiornare `REPO` in `src/config.js` (e i link in `README.md`): la build e i workflow leggono il nome da lì o da GitHub.

## Dominio e sito

Il sito è su `https://mandarinoapp.org` (GitHub Pages, pubblicato da `pages.yml`).

- **GitHub:** Settings → Pages → Source «GitHub Actions»; Custom domain `mandarinoapp.org`; «Enforce HTTPS» appena diventa selezionabile (il certificato arriva da solo,
  anche un'ora dopo che il DNS è corretto). Con la pubblicazione tramite Actions un file `CNAME` nel repository non serve.
- **Namecheap** (Domain List → Manage → Advanced DNS): quattro record **A** per `@` verso `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`, e un solo record
  **CNAME** per `www` verso `longhitown.github.io` (un nome può avere un solo CNAME). Nessun record di parcheggio.
- **Controlli:** `https://mandarinoapp.org/`, `…/privacy.html`, `…/app/`, `…/zh/` e `…/mandarino.apk`.
