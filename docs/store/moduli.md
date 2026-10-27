# Moduli della Play Console: risposte pronte

**Indirizzo della privacy:** `https://longhitown.github.io/mandarino/privacy.html` (pubblicata da GitHub Pages, ricavata da
PRIVACY.md; controlla che si apra prima di inviare).

## Sicurezza dei dati (Data safety)

| Domanda | Risposta | Perché |
|---|---|---|
| L'app raccoglie o condivide dati degli utenti? | **No** | tutto resta sul dispositivo; nessun server, nessun account, nessuna statistica |
| I dati sono cifrati in transito? | non applicabile | l'app non trasmette dati personali |
| Si può chiedere la cancellazione dei dati? | sì, sul dispositivo | ⚙️ → Dati e privacy, o disinstallando |
| Microfono | non raccolto | serve solo durante gli esercizi di pronuncia; nessuna registrazione salvata o inviata |
| Fotocamera | non raccolta | solo per leggere un QR; nessuna immagine salvata |

Nota: «raccolta» per Google significa dati che lasciano il dispositivo verso lo sviluppatore o terzi. La voce online
(spenta di base) manda il testo cinese da leggere a un servizio di Google: è un'azione scelta dall'utente, senza dati
personali. Il riconoscimento vocale usa il riconoscitore di sistema del telefono.

## Classificazione dei contenuti

Questionario IARC: categoria **Istruzione / Riferimento**. Nessuna violenza, sesso, linguaggio volgare, droghe, gioco
d'azzardo, acquisti, interazione tra utenti, condivisione di posizione. Risultato atteso: PEGI 3 / Everyone.

## Pubblico

Non è rivolta in modo specifico ai bambini (13+ come fascia principale), ma non contiene niente di inadatto.

## Autorizzazioni da dichiarare

| Autorizzazione | Dichiarazione |
|---|---|
| `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | servizio in primo piano di tipo *mediaPlayback*: la musica per studiare continua a schermo spento solo se l'utente sceglie «in secondo piano» nel pannello 🎵, con notifica e comandi. Video dimostrativo: apri 🎵, scegli un brano, attiva «in secondo piano», blocca lo schermo |
| `CAMERA` | solo per leggere i QR (passaggio a un altro telefono, sigilli) |
| `RECORD_AUDIO` | esercizi di pronuncia e riconoscimento vocale |
| `POST_NOTIFICATIONS` | promemoria facoltativo e notifica della musica |
| `RECEIVE_BOOT_COMPLETED` | per rimettere il promemoria dopo il riavvio, solo se l'utente l'ha acceso |

Allarme del promemoria: `setAndAllowWhileIdle` (non esatto): non serve dichiarare `SCHEDULE_EXACT_ALARM`.

## Annunci, acquisti

Nessun annuncio, nessun acquisto in-app. Nella versione store il sostegno è spento.
