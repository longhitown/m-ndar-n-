# F-Droid

La cartella `fastlane/metadata/android/<lingua>/` (titolo, descrizioni, immagini, note di versione in
`changelogs/<versionCode>.txt`) è quella che F-Droid legge dal repository; è anche la fonte unica dei testi per gli altri
store (`node tools/store-assets.mjs` genera da lì le schede in docs/store/).

**La ricetta.** La bozza per il repository `fdroiddata` (GitLab) è [fdroiddata/it.mandarino.app.yml](fdroiddata/it.mandarino.app.yml).
Prima di proporla va provata con gli strumenti di F-Droid (`fdroid lint`, `fdroid build`): qui non è stato possibile. Come si rilascia
e che cosa succede in F-Droid dopo un tag: [rilascio.md](rilascio.md).

**Build.** F-Droid costruisce da sé, dal codice: serve `node tools/build.mjs` prima di Gradle (il pacchetto contiene `dist/`).
`tools/build.mjs` usa solo moduli integrati di Node (nessun pacchetto npm, niente `node_modules`) e non fa richieste di rete; produce
lo stesso `dist/` a ogni esecuzione, anche lanciato da `android/app`. Richiede Node 20 o più recente, quindi la ricetta installa
`nodejs` con `sudo` (e va controllato quale versione dà la buildserver). Nella ricetta: `subdir: android/app`,
`prebuild: node ../../tools/build.mjs`, `gradle: [store]`. Le note di versione per un `versionCode` si generano con
`node tools/store-assets.mjs --notes <versionCode>`.

**Come F-Droid trova le versioni.** Segue i tag `r<x.y.z>` (non i tag `v6.7.N` delle build per push) e legge il numero da
`android/version.properties`, due righe semplici (`versionCode=…`, `versionName=…`): niente calcoli di Gradle, che F-Droid non può
eseguire. La regola è nella ricetta: `UpdateCheckData: android/version.properties|versionCode=(\d+)|.|versionName=(.*)`. Nelle release
stabili il `versionName` dell'APK store è esattamente quello del file (il suffisso `-store` c'è solo nelle build per push): F-Droid
confronta i due valori e se non coincidono la build fallisce.

## Perché la stessa firma ovunque, e le build riproducibili

Se l'APK diretto, quello di Google Play e quello di F-Droid sono firmati con chiavi diverse, Android non li considera la stessa app: chi
passa da un canale all'altro dovrebbe disinstallare, e perderebbe i progressi (che stanno solo sul telefono). Di solito F-Droid firma con la
**propria** chiave. Con le **build riproducibili** no: F-Droid costruisce l'APK dal codice, lo confronta con quello che pubblichiamo noi e,
se sono identici, distribuisce **il nostro, firmato da noi**. Così la firma è una sola e gli aggiornamenti si installano sopra in qualunque
direzione. Nella ricetta, a questo servono due campi, ora commentati:

- `Binaries`: dove F-Droid scarica il nostro APK (`mandarino-store.apk` della Release `r%v`);
- `AllowedAPKSigningKeys`: l'impronta SHA-256 del certificato, che la persona che gestisce il progetto inserirà **dopo** aver creato la
  chiave nuova e aver fatto la prima release con quella (il workflow «release» la scrive nel riepilogo di ogni corsa).

**Che cosa è già a posto per la riproducibilità**

- `dependenciesInfo { includeInApk = false; includeInBundle = false }` in `android/app/build.gradle`: il blocco di firma di Google con i
  metadati delle dipendenze è cifrato e non è deterministico.
- Nessun orario né dato di git nel pacchetto: `versionCode` e `versionName` vengono dal file (la CI delle release non imposta
  `MD_VERSION_CODE`); `dist/` non contiene date (la «versione» del service worker è l'impronta del contenuto; i file sono letti in ordine
  alfabetico, e due esecuzioni di `node tools/build.mjs` danno gli stessi byte, provato).
- Versioni degli strumenti fissate: Android Gradle Plugin 8.11.1 (`android/build.gradle`), Java 17 (`compileOptions`; JDK 17 nella CI),
  Gradle 8.14.3 nella CI, `compileSdk`/`targetSdk` 36.
- Le release stabili hanno lo stesso `versionName` in APK diretto, APK store, `.aab` e ricetta (nessun suffisso).

**Che cosa NON è stato verificato e può ancora impedire il confronto byte a byte**

- Nessuna build vera è stata eseguita (qui non ci sono JDK né Gradle): la riproducibilità va provata con `fdroid build` e confrontando l'APK
  con `mandarino-store.apk` della Release (per esempio con `apksigcopier` e `diffoscope`).
- **Manca il wrapper di Gradle** (`gradlew` e `gradle/wrapper/`): la CI usa Gradle 8.14.3 installato dall'azione, F-Droid userebbe la
  propria versione. Va creato una volta, da un computer con Gradle, con `gradle wrapper --gradle-version 8.14.3` dentro `android/`, e
  committato (F-Droid verifica anche il file `gradle-wrapper.jar`).
- La versione di Node e quella del JDK sulla buildserver di F-Droid.
- Lo scanner di F-Droid sui file minificati di `src/vendor/` (jsQR, jsPDF), che sono librerie libere con la loro licenza in
  THIRD-PARTY-NOTICES.md: potrebbe chiedere di costruirle dal sorgente.
- Il confronto richiede che F-Droid e la CI producano la stessa `dist/`: l'unico ingresso è `src/`, ma non è provato con due versioni di
  Node diverse.

## Anti-caratteristiche (da dichiarare in modo onesto)

La ricetta dichiara **solo `NonFreeNet`**:

- La **voce online** per il cinese usa il servizio di sintesi vocale di Google (`translate.googleapis.com`). È **facoltativa e spenta di base**:
  parte solo se la persona la accende in ⚙️ → Suoni e musica → Voce (opzione `cp-alt`); senza, non esce nessuna richiesta (se la voce del
  telefono tace, l'app lo dice una volta e spiega come accenderla). La funzione esiste nel codice e F-Droid chiede di dichiarare i servizi non
  liberi anche quando sono facoltativi: per questo si dichiara. Se in futuro la versione store la togliesse, `NonFreeNet` sparirebbe.
- Il **controllo delle release su GitHub** esiste solo nella versione diretta; nella versione store, quella per F-Droid, è spento.

Non si dichiarano, perché non ci sono: `NonFreeDep` (nessuna libreria di Google o di terzi nel pacchetto: solo l'SDK di Android),
`Tracking`, `Ads`, `NonFreeAdd` (nessun sostegno né sigillo nella versione store), `UpstreamNonFree` (codice MIT, contenuti CC BY 4.0).
Il **riconoscimento vocale** usa il servizio di sistema del telefono (su molti telefoni è di Google): non è nel nostro codice, ma può
essere menzionato. L'elenco delle voci della community si scarica dal nostro sito solo al tocco, senza dati: non è un servizio non libero.
