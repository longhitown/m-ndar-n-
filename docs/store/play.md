# Google Play: risposte per la Console

Bozza delle risposte ai moduli della Play Console, ricavate dal codice di questa versione (`android/app/src/main/AndroidManifest.xml`,
[PRIVACY.md](../../PRIVACY.md)). **Prima di inviare ogni modulo, rileggi le domande della Console: Google le cambia nel tempo.**
Le voci segnate «DA DECIDERE» non hanno una risposta ovvia e vanno confermate da chi gestisce il progetto.

## Scheda
- **Nome:** `màndarínō: impara il cinese` (27/30). Il marchio resta màndarínō; il resto aiuta chi cerca «app per imparare il cinese».
- **Descrizione breve e lunga:** [it-IT.md](it-IT.md) e [zh-CN.md](zh-CN.md) (fonte: `fastlane/metadata/android/`).
- **Categoria:** Istruzione. **Contatto pubblico:** `mandarinoapp@gmail.com`. **Sito:** `https://mandarinoapp.org/`.
- **Informativa sulla privacy (indirizzo pubblico):** `https://mandarinoapp.org/privacy.html` (si genera da `PRIVACY.md`, in italiano e in cinese).
- **Parole chiave:** Play non ha un campo apposito: la ricerca legge titolo, descrizione breve e descrizione lunga. Usare i termini
  veri (cinese mandarino, HSK, pinyin, hanzi, flashcard) una volta o due, senza elenchi di parole: Google lo considera spam.

## Sicurezza dei dati (Data safety)
Principio: **lo sviluppatore non riceve dati personali.** Sul telefono restano progressi, impostazioni e contributi.

| Domanda | Risposta proposta |
|---|---|
| L'app raccoglie o condivide dati degli utenti? | No per i dati che lasciano il telefono verso lo sviluppatore. Vedi sotto i due punti «DA DECIDERE» |
| Dati criptati in transito | Sì: le poche richieste usano HTTPS |
| Si può chiedere la cancellazione | I dati sono solo sul telefono: si cancellano da ⚙️ → Dati e sincronizzazione o disinstallando |
| Pubblicità, acquisti, account | Nessuna pubblicità, nessun acquisto, nessun account |

- **DA DECIDERE · voce online (facoltativa, spenta di base):** se la persona la accende, il testo cinese da leggere va a un servizio di sintesi
  vocale di Google. Non è un dato personale, ma esce dal telefono su richiesta della persona. La scelta prudente è dichiararlo come
  «altri contenuti / condiviso con terzi, facoltativo».
- **DA DECIDERE · riconoscimento vocale degli esercizi:** usa il servizio di sistema del telefono (che può essere di Google). L'app non riceve
  né salva l'audio. Controlla nelle istruzioni di Google se un servizio di sistema richiamato dall'app conta come «condivisione»; nel
  dubbio, dichiaralo come audio elaborato in modo facoltativo e non conservato.
- **Scambio linguistico (facoltativo, spento di base, solo adulti):** le registrazioni restano sul telefono e le manda la persona stessa, fuori
  dall'app, con un file `.zip`: l'app non le carica da sola.

## Autorizzazioni e dichiarazioni
| Permesso | A che cosa serve |
|---|---|
| `RECORD_AUDIO` | esercizi di pronuncia, oscilloscopio dei toni, scambio linguistico (facoltativo) |
| `CAMERA` | leggere un QR (cambio telefono, sigilli); `uses-feature camera` non obbligatoria |
| `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED` | promemoria facoltativo e ripristino dopo il riavvio |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | musica per studiare in secondo piano. **La Console chiede una dichiarazione per il servizio in primo piano e può chiedere un breve video:** prepara una registrazione dello schermo mentre parte la musica |
| `MODIFY_AUDIO_SETTINGS`, `VIBRATE`, `INTERNET` | gestione audio, vibrazione, le richieste elencate in `PRIVACY.md` |

## Altri moduli
- **Pubblico di destinazione:** non per bambini. Proposta: 13 anni e oltre (lo scambio linguistico è solo per maggiorenni e resta spento di base). DA DECIDERE.
- **Classificazione dei contenuti (IARC):** nessuna violenza, nessun contenuto per adulti, nessun gioco d'azzardo, nessuna interazione fra utenti, nessuna posizione. DA RIPASSARE nel questionario.
- **Annunci:** no. **App governativa / finanziaria / sulla salute:** no.
- **Account personale:** prima del primo rilascio in produzione servono un test chiuso con **almeno 12 tester per 14 giorni** (regola Google per gli account personali creati dopo novembre 2023; verificala nella Console).
- **Firma:** dai la **stessa chiave** di F-Droid e dell'APK diretto, caricandola con lo strumento PEPK **prima** del primo caricamento. Non lasciare che Google ne generi una nuova. Vedi [rilascio.md](rilascio.md).
