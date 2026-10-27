# La chiave di firma e Google Play

Oggi l'APK diretto (GitHub Releases) è firmato con la chiave del repository: i segreti `MD_KEYSTORE_B64` e
`MD_KEYSTORE_PASSWORD` (vedi LEGGIMI, «L'APK per Android»). Google Play usa **Play App Signing**: Google conserva la
chiave che firma l'app installata dagli utenti, e l'autore carica i pacchetti con una seconda chiave, la *upload key*.

## Perché importare la chiave esistente

Se la chiave di firma dell'app su Google Play è **la stessa** dell'APK diretto, chi ha installato l'APK da GitHub riceverà
gli aggiornamenti dallo store senza disinstallare e senza perdere i progressi. Il nome del pacchetto è lo stesso
(`it.mandarino.app`) nelle due versioni.

## Procedura (da verificare nella guida della Play Console al momento del primo caricamento)

1. Crea l'app nella Play Console con il pacchetto `it.mandarino.app`.
2. In «Integrità dell'app» → «Firma dell'app», scegli di **usare una chiave esistente** invece di farla generare a Google.
   La Console dà uno strumento (PEPK) che cifra la chiave privata per Google: si lancia **sul tuo computer**, con la
   chiave che hai già, e si carica il file che produce. Claude Code non la vede mai e non la mette in nessun commit.
3. Crea una *upload key* nuova (`keytool -genkeypair …`), registrala nella Console e usala per firmare il `.aab`:
   `MD_KEYSTORE=upload.jks gradle -p android bundleStoreRelease`. Se la perdi, Google la può sostituire; la chiave
   dell'app no.
4. Carica `mandarino-store.aab` (artefatto della corsa «APK Android» o build locale) in un **test chiuso** (vedi tester.md).

## Dove conservare le chiavi

- **Mai** nel repository. La build si ferma se trova un file `.jks`, `.keystore`, `.pem` o `.key`.
- Una copia della chiave dell'app e della upload key, con le password, **fuori da GitHub**: una chiavetta in un posto
  sicuro e un gestore di password. I segreti di GitHub non si possono rileggere: non sono una copia di sicurezza.
- Se la chiave dell'app andasse persa prima di importarla in Play, non si potrebbe più aggiornare l'APK diretto sopra la
  versione installata: questa è la ragione principale per farne subito una copia.
