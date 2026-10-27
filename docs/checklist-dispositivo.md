# Prove su un telefono vero (a cura dell'autore)

Le prove automatiche girano in browser e in emulatori Android 14 e 16 (CI). Queste cose si possono vedere solo su un
telefono vero. Dieci minuti, prima di ogni release importante. Segna data, telefono e versione di Android.

| | Prova | Che cosa deve succedere |
|---|---|---|
| ☐ | **Musica e voce**: musica accesa, poi tocca una parola | la musica si abbassa mentre parla la voce e risale dopo; il volume degli effetti resta gradevole |
| ☐ | **Loop della musica**: lascia finire un brano (o salta vicino alla fine) | il giro è senza un vuoto udibile (la prova in CI misura 3-16 ms in Chromium; sul telefono va ascoltato) |
| ☐ | **Musica in secondo piano**: 🎵 → «in secondo piano», poi blocca lo schermo | la musica continua, la notifica ha pausa, avanti, stop; stop la chiude davvero |
| ☐ | **Modalità aereo**: attivala e apri l'app | tutto funziona: studio, parole, frasi, lezioni, musica già scaricata; nessun errore |
| ☐ | **Widget «Oggi»** (piccolo e grande): aggiungili alla schermata Home | serie, ripassi e parola del giorno giusti; un tocco apre l'app nel punto giusto |
| ☐ | **Scorciatoie** (pressione lunga sull'icona) | «Studia ora», «Orecchio», «Musica» aprono la cosa giusta |
| ☐ | **Promemoria**: accendilo per tra due minuti | arriva la notifica (e chiede il permesso la prima volta, Android 13+) |
| ☐ | **Indietro** (gesto e tasto, Android 13+ e 16) | chiude prima il foglio aperto, poi la sessione, poi torna al Percorso; solo alla fine esce |
| ☐ | **Bordi dello schermo** (Android 15+) | niente sotto la barra di stato, la barra di navigazione o il ritaglio della fotocamera; la tastiera non copre i campi |
| ☐ | **Fotocamera e QR**: ⚙️ → Sincronizzazione → passa a un altro telefono | il QR si legge; nessuna immagine salvata |
| ☐ | **Pleco** (se installato): accendi l'opzione, tieni premuto un carattere 2 s, tocca «Apri in Pleco» | si apre Pleco sulla parola giusta. Senza Pleco: messaggio «Pleco non è installato» e «Scarica Pleco» |
| ☐ | **Carta da condividere** (corso di italiano): 分享, poi in WeChat pressione lunga sul QR | WeChat riconosce il QR e apre la pagina (vedi docs/cina.md) |
| ☐ | **Aggiornamento sopra la versione precedente** | i progressi restano |

Se qualcosa non va: una issue con telefono, versione di Android e che cosa hai visto.
