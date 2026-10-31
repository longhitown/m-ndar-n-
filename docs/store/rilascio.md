# Rilasciare una versione: una sola azione, la stessa per tutti i canali

Per chi gestisce il progetto. L'app esce in quattro modi: **APK diretto** (GitHub Releases), **sito e app web** (PWA), **Google Play** e
**F-Droid**. Una release stabile dà **la stessa versione, con la stessa firma**, a tutti: chi passa da un canale all'altro (o da un APK a
uno store) aggiorna sopra l'installazione e non perde i progressi.

**La regola: un tag stabile = una versione in tutti gli store.** Il tag è `r<x.y.z>` (per esempio `r0.9.1`). Non si riusa, non si sposta e non
si cancella mai: F-Droid e Google lo hanno già letto. Se una versione è sbagliata se ne fa una nuova, con il numero successivo.

## Come si fa

1. Da `main` aggiornato, con l'albero pulito: `node tools/release.mjs 0.9.1`. Prima, se vuoi vedere cosa farebbe senza scrivere niente:
   `node tools/release.mjs 0.9.1 --prova`.
   - controlla formato `x.y.z` e che la versione sia maggiore della precedente;
   - calcola il `versionCode` (il numero che Android confronta): il più alto tra «precedente + 1» e «numero di commit + 50», così sta sempre
     sopra a qualunque APK costruito dalla CI per push;
   - scrive `android/version.properties` e crea `changelogs/<versionCode>.txt` in ogni lingua (copia di `default.txt`);
   - lancia `node tools/build.mjs` e `node tools/unit.mjs` (prima di scrivere, così se falliscono non resta niente a metà).
   Non fa commit, non fa push, non usa la rete.
2. **Rivedi le note di versione** (`fastlane/metadata/android/<lingua>/changelogs/<versionCode>.txt`): massimo 500 caratteri, è il limite di
   Google Play. Si possono rigenerare dalla prima voce di `src/data/changelog.js` con `node tools/store-assets.mjs --notes <versionCode>`.
3. Ramo `release/x.y.z`, commit, pull request, controlli verdi, merge in `main`.
4. Il tag sul commit di `main`: `git switch main && git pull && git tag r0.9.1 && git push origin r0.9.1`. In alternativa
   `gh release create r0.9.1 --target main`: la corsa completa la Release.
5. Parte il workflow **release** (Actions). Se il tag non coincide con `versionName` di `android/version.properties`, o non sta su `main`,
   o mancano le note, o mancano i segreti della chiave, **si ferma subito con un messaggio chiaro** e non pubblica niente.
6. Alla fine della corsa, nel riepilogo: l'impronta SHA-256 del certificato e il promemoria **«Carica `mandarino-store.aab` nella Play Console»**.

**Prima release.** `android/version.properties` parte da `versionCode=1000` e `versionName=0.9.0`: sono valori provvisori. Scegli il numero
vero per il primo rilascio: se è diverso da 0.9.0, `node tools/release.mjs 1.0.0` lo scrive. Se vuoi proprio 0.9.0, non serve lo strumento:
crea a mano `changelogs/1000.txt` nelle due lingue e metti il tag `r0.9.0`.

## Che cosa succede in ciascun canale

| Canale | Che cosa fa la corsa «release» | Ritardo atteso |
|---|---|---|
| APK diretto (GitHub) | pubblica `mandarino.apk`, `mandarino-store.apk`, `mandarino-store.aab`, `SHA256SUMS.txt` | minuti (la durata della corsa si vede alla prima volta) |
| Sito | rilancia «pages», che scarica l'ultimo `mandarino.apk` | pochi minuti dopo la Release |
| App con APK diretto | niente: controlla da sola l'ultima Release, una volta al giorno, e propone «Scarica» | fino a un giorno |
| Google Play | niente (passo automatico spento): **si carica a mano** `mandarino-store.aab` | caricamento subito; revisione di Google da ore a giorni |
| F-Droid | niente: segue da solo i tag `r<x.y.z>` leggendo `android/version.properties` | giorni: i suoi server compilano a lotti |
| App web (PWA) | niente: ha la sua pubblicazione a ogni modifica di `main` | minuti |

Per Google Play, quando avrai un account di servizio, nel file `.github/workflows/release.yml` c'è un passo già pronto, commentato, che
carica l'`.aab` (traccia `internal`, come bozza). Il segreto previsto si chiama `PLAY_SERVICE_ACCOUNT_JSON`. Finché non c'è, l'`.aab` si
carica a mano nella Play Console.

## La firma: una sola chiave

- **Una sola chiave** firma l'APK diretto, l'APK store e il pacchetto `.aab`. Sta nei segreti del repository (`MD_KEYSTORE_B64`,
  `MD_KEYSTORE_PASSWORD`, facoltativi `MD_KEY_ALIAS` e `MD_KEY_PASSWORD`). Il workflow **release** si ferma se mancano: una release stabile
  non si firma mai con la chiave di prova. Conserva una copia della chiave fuori da GitHub.
- Il workflow controlla che i due APK abbiano **lo stesso certificato** e ne scrive l'impronta nel riepilogo. Quella è l'impronta da
  mettere nella ricetta di F-Droid (`AllowedAPKSigningKeys`), vedi [f-droid.md](f-droid.md).
- **Google Play** ha la «firma delle app di Play»: Google custodisce la chiave che firma gli APK distribuiti. Perché l'utente passi da un
  canale all'altro senza disinstallare, quella chiave deve essere **la stessa** degli altri canali, cioè va importata la nostra chiave
  quando si crea l'app nella Play Console (poi non si cambia). La *chiave di caricamento*, quella con cui si firma il file che si carica, può
  invece essere diversa, purché la firma di app sia la nostra.
- Decidi **prima della prima release** se usare la chiave attuale o una nuova. Cambiarla dopo spezza gli aggiornamenti: chi ha già
  installato dovrebbe disinstallare (dopo il backup dei progressi).

## Le build per ogni push e la prerelease «nightly»

Oggi ogni push su `main` che cambia l'app crea una Release «latest» con tag `v6.7.<commit>` (decine di release). Con le release stabili va
cambiato, ma **nell'ordine giusto**, altrimenti il link di download del sito (`releases/latest/download/mandarino.apk`) smette di
funzionare:

1. **Prima** crea la prima release stabile (workflow «release» concluso, `mandarino.apk` presente nella Release).
2. **Poi** imposta la variabile del repository `MD_NIGHTLY` a `prerelease` (Settings → Secrets and variables → Actions → Variables).
   Da quel momento ogni push non crea più una release nuova: c'è **una sola prerelease** con tag `nightly`, ricreata a ogni push, con
   `mandarino-nightly.apk`. Le prerelease non contano come «latest»: sito e app continuano a puntare all'ultima release stabile.
   Per tornare al comportamento di prima, cancella la variabile.

Tra il passo 1 e il passo 2 non fare push su `main`: una build per push diventerebbe la «latest» al posto della stabile. Se succede,
`gh release edit r<x.y.z> --latest` rimette a posto la stabile e `gh workflow run pages.yml` aggiorna il sito.

**Numeri.** Le build per push hanno `versionCode` = numero di commit e `versionName` `6.7.<commit>`. Le stabili hanno il `versionCode` di
`android/version.properties` (sempre almeno 50 sopra al numero di commit del momento) e il `versionName` scelto. Conseguenza: chi ha
installato una stabile non può installarci sopra una build «nightly» con `versionCode` più basso (Android non permette di scendere); finché
i commit non superano il numero, chi vuole provarla deve disinstallare. Il controllo degli aggiornamenti dell'APK diretto toglie il prefisso
`v` o `r` dal tag e confronta i numeri con il `versionName` installato: una stabile `r0.9.1` è più nuova di `0.9.0` e uguale a `0.9.1`;
una build «nightly» `6.7.N` non riceve avvisi di stabili con numero più basso.

## Rollback

Android non installa un `versionCode` più basso di quello presente, quindi **non si torna indietro: si va avanti** con una versione nuova.

1. Ripristina il codice buono su `main` (`git revert` del difetto) e fai una release con il numero successivo (`node tools/release.mjs 0.9.2`).
2. Nel frattempo, per non offrire la versione difettosa: `gh release edit r0.9.1 --prerelease` (esce dalla «latest»; la «latest» torna alla
   stabile precedente), poi `gh workflow run pages.yml` perché il sito offra quella. Chi ha già installato la difettosa riceve la correzione
   appena esiste, non prima.
3. **Google Play**: in Play Console si può fermare l'implementazione di una versione in corso; la correzione è un `.aab` nuovo con `versionCode`
   più alto.
4. **F-Droid**: non si ritira da soli; si apre una richiesta nel loro repository `fdroiddata`. Non cancellare né spostare il tag.

## Una correzione urgente

Stesso flusso, senza scorciatoie: ramo dalla `main` aggiornata, correzione, pull request, merge, `node tools/release.mjs 0.9.2`, tag. La
corsa dura qualche decina di minuti. L'APK diretto e il sito sono subito; Google Play dipende dalla revisione; F-Droid non si può accelerare
(compila a lotti): per un difetto grave, quindi, conta l'APK diretto e un avviso sul sito. Non fare il tag da un ramo diverso da `main`: il
workflow lo rifiuta.

## Cosa serve nel repository

- Segreti (Actions): `MD_KEYSTORE_B64`, `MD_KEYSTORE_PASSWORD`; facoltativi `MD_KEY_ALIAS`, `MD_KEY_PASSWORD`; più avanti
  `PLAY_SERVICE_ACCOUNT_JSON`.
- Variabile (Actions): `MD_NIGHTLY` (vedi sopra). Facoltativa.
- In Settings → Pages: sorgente «GitHub Actions» (come già oggi).
- Le azioni di terzi nei workflow `release` sono fissate a uno SHA di commit, con la versione in commento: per aggiornarle si cambia lo SHA
  dopo aver letto le novità, non il numero di versione.
