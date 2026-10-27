# F-Droid

La cartella `fastlane/metadata/android/<lingua>/` (titolo, descrizioni, immagini, note di versione in
`changelogs/<versionCode>.txt`) è quella che F-Droid legge dal repository; è anche la fonte unica dei testi per gli altri
store (`node tools/store-assets.mjs` genera da lì le schede in docs/store/).

**Build.** F-Droid costruisce da sé, dal codice: serve `node tools/build.mjs` prima di Gradle (il pacchetto contiene
`dist/`). Nella ricetta di F-Droid: `prebuild: node tools/build.mjs`, `gradle: [store]`. Le note di versione per un
`versionCode` si generano con `node tools/store-assets.mjs --notes <versionCode>`.

**Anti-caratteristiche che F-Droid potrebbe segnalare** (da dichiarare in modo onesto):

- **NonFreeNet**: il controllo delle release su GitHub (solo nella versione diretta; spento nella versione store, che è
  quella da usare per F-Droid) e la **voce online** facoltativa, che usa un servizio di Google. Con la versione store
  resta solo la voce online, spenta di base.
- Il riconoscimento vocale usa il servizio di sistema del telefono (su molti telefoni è di Google): non è nel nostro
  codice, ma può essere menzionato.

Nessuna libreria proprietaria, nessun tracciamento, nessuna pubblicità: il codice usa solo l'SDK di Android.
