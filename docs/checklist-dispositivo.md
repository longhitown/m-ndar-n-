# Prove su un telefono vero

Le prove automatiche girano in browser e in emulatori Android 14 e 16 (CI). Queste cose si possono vedere solo su un
telefono vero. Dieci minuti, prima di ogni release importante. Segna data, telefono e versione di Android.

| Prova | Che cosa deve succedere |
|---|---|
| **Musica e voce**: musica accesa, poi tocca una parola | la musica si abbassa mentre parla la voce e risale dopo; il volume degli effetti resta gradevole |
| **Livello della musica** (guadagno 0,6): volume di sistema al 50%, musica accesa, poi una frase lunga in 🔊 | la voce si capisce bene sopra la musica e la musica non copre le parole; la musica non è troppo bassa da sola. Annota «troppo alta / giusta / troppo bassa» |
| **Loop della musica**: lascia finire un brano (o salta vicino alla fine) | il giro è senza un vuoto udibile (la prova in CI misura 3-16 ms in Chromium; sul telefono va ascoltato) |
| **Musica in secondo piano**: 🎵 → «in secondo piano», poi blocca lo schermo | la musica continua, la notifica ha pausa, avanti, stop; stop la chiude davvero |
| **Modalità aereo**: attivala e apri l'app | tutto funziona: studio, parole, frasi, lezioni, musica già scaricata; nessun errore |
| **Widget «Oggi»** (piccolo e grande): aggiungili alla schermata Home | serie, ripassi e parola del giorno giusti; un tocco apre l'app nel punto giusto |
| **Scambio linguistico**: ⚙️ → Suoni e musica → Partecipa; leggi il foglio, spunta le tre caselle, registra una serie (frasi e parole a caso), riascolta, premi «Invia per e-mail» | il foglio si legge intero; il pulsante resta spento finché non spunti entrambe le caselle; la registrazione parte e si ferma da sola a 8 s; dopo «Fine» l'indicatore del microfono del telefono si spegne entro pochi secondi; si apre la scelta dell'e-mail con il file `.zip` già allegato (o, senza, si scarica il file e si apre la bozza); «Ritira il consenso» cancella tutto |
| **Anteprima del link** del sito: manda <https://mandarinoapp.org/> e <https://mandarinoapp.org/manifesto.html> a un amico su WhatsApp e WeChat | l'immagine non viene tagliata: si vedono l'arancia e il nome (WhatsApp può aver bisogno di qualche ora per aggiornare l'anteprima vecchia) |
| **Widget «Oggi» e «Pausa»**: guardali al mattino, al pomeriggio, la sera e dopo le 22 (o cambia l'ora del telefono) | sfondo e testi cambiano alle 6, 12, 17 e 22 (entro qualche minuto); mattina riflesso caldo a destra, sera arancione a sinistra, notte quasi nero con luna e senza pulsanti; la striscia di dieci segmenti segue le parole di oggi; la sera compare un proverbio; in cinese gli stessi quattro momenti |
| **Widget «Pausa»** (4×1): «Studia 25′», attendi la fine; poi «☕ 5′» | il conto alla rovescia scorre da solo (anche a schermo bloccato); a 0 passa alla pausa e arriva un avviso; «Ferma» riporta a riposo; di notte (22–6) mostra «Riposo» |
| **Scorciatoie** (pressione lunga sull'icona) | «Studia ora», «Orecchio», «Musica» aprono la cosa giusta |
| **Promemoria**: accendilo per tra due minuti | arriva la notifica (e chiede il permesso la prima volta, Android 13+) |
| **Indietro** (gesto e tasto, Android 13+ e 16) | chiude prima il foglio aperto, poi la sessione, poi torna al Percorso; solo alla fine esce |
| **Bordi dello schermo** (Android 15+) | niente sotto la barra di stato, la barra di navigazione o il ritaglio della fotocamera; la tastiera non copre i campi |
| **Fotocamera e QR**: ⚙️ → Dati e sincronizzazione → Sincronizzazione → passa a un altro telefono | il QR si legge; nessuna immagine salvata |
| **Pleco** (se installato): accendi l'opzione, tieni premuto un carattere 2 s, tocca «Apri in Pleco» | si apre Pleco sulla parola giusta. Senza Pleco: messaggio «Pleco non è installato» e «Scarica Pleco» |
| **Carta da condividere** (corso di italiano): 分享, poi in WeChat pressione lunga sul QR | WeChat riconosce il QR e apre la pagina (vedi docs/cina.md) |
| **Sfida a un amico**: Percorso → 🎯, poi inquadra il QR con un secondo telefono (⚙️ → Studio → Sfide e classe → Inquadra il QR) | sul secondo telefono le stesse domande; il link (se c'è il sito) si apre anche dalla fotocamera di sistema |
| **Foglio della classe**: ⚙️ → Studio → Sfide e classe → Prepara un pacchetto → Foglio da stampare, stampato su A4 | i due QR si leggono dalla carta; il pacchetto si importa |
| **Aggiornamento sopra la versione precedente** | i progressi restano |
| **Microfono dopo il riconoscimento**: in una carta tocca 🎤, parla, poi ••• → 〰️ Tono | l'oscilloscopio si apre senza errori (al massimo un attimo di attesa) |
| **Stampa** (Parole → Stampa) | si apre il servizio di stampa di Android; «Salva come PDF» produce la tabella |
| **Tocco lungo** su un componente in «Di che cosa è fatto» | non compare il menu «Copia / Cerca sul web»; con Pleco acceso, dopo 2 s compare «Apri in Pleco» |
| **Notifica musicale** | nessuna barra «00:00 – 00:00» (su HyperOS e sugli altri sistemi) |
| **Apertura**: le quattro note nel momento in cui i toni si disegnano | si sentono (se gli effetti sono accesi e l'audio è sbloccato), una per tono, senza scatti |
| **Cambio lingua dei menu** | niente animazione e si resta nella stessa pagina delle impostazioni |

Se qualcosa non va: una issue con telefono, versione di Android e che cosa hai visto.
