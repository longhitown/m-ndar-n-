# Scambio linguistico: voci di madrelingua

> **Stato (ottobre 2026): attivo, parti 1 e 2.** Nell'app ci sono il foglio del consenso (tre autorizzazioni), la registrazione di una
> serie a caso di frasi e parole, l'elenco con ascolto e cancellazione, e un solo tasto «Invia per e-mail» che prepara il `.zip` da sé.
> **Non ci sono ancora** l'importazione (`tools/merge-contrib.mjs` per `mandarino-voice/1`) e il pacchetto voci scaricabile: arrivano
> quando ci sono le prime registrazioni da provare. Le decisioni qui sotto sono di chi gestisce il progetto.

## L'idea

L'app ha due corsi, quindi due comunità che si completano:

- chi parla cinese e studia italiano registra frasi **cinesi** (la sua lingua);
- chi parla italiano e studia cinese registra frasi **italiane**.

L'app ottiene così ciò che le manca: voci vere di madrelingua al posto della sintesi vocale del telefono. Chi registra
studia la frase nella propria lingua accanto alla traduzione, quindi l'esercizio serve anche a lui.

## Le decisioni (ottobre 2026)

1. **Licenza**: CC BY 4.0, come i contenuti.
2. **Minori**: esclusi. L'app non ha account e non può verificare l'età: il foglio dice chiaramente che confermando si dichiara di
   avere almeno 18 anni (casella separata «Ho almeno 18 anni»). Una certezza al 100 % non c'è e il testo non la promette.
3. **Regione di provenienza** (facoltativa, per gli accenti) e **nome o nickname** (facoltativo): il nome compare nei Crediti solo se
   la persona lo scrive e spunta «Può comparire nei Crediti».
4. **Lingua che si studia**: non si registra come madrelingua. Si può registrare solo se la persona lo attiva (casella nella schermata
   principale); quelle voci sono segnate `native: false` / «non madrelingua» e chi le usa nell'app deve mostrare un avviso.
5. **Chi ascolta**: soltanto Claudio Longhitano, che gestisce il progetto e le può usare nell'app a propria discrezione. Non c'è
   un secondo revisore.

## Che cosa si registra

- **Solo frasi e parole che esistono già nell'app**, con i riferimenti di `tools/review-sample.mjs`: `phr:<gruppo>:<riga>` (frasi di tutti i
  giorni), `dlg:<id>:<riga>` (battute dei dialoghi), `ex:<parola>` (frasi d'esempio) e `w:<parola>` (singole parole con il significato
  breve). Niente testo libero: nessun rischio di contenuti personali dentro le registrazioni.
- **Si registra solo dal foglio dello scambio**, che pesca a caso: una *serie* di 10 elementi (7 frasi e 3 parole) non ancora registrati né
  saltati, senza doppioni; finita la serie, «Un'altra serie». Non ci sono pulsanti 🎙️ in altri punti dell'app.
- Una voce per volta, con il testo grande, il contatore («3 / 10») e la traduzione sotto. Si può riascoltare, tenere o rifare; «Un'altra frase» salta.
- Si registra nella **propria** lingua: cinese nel corso di italiano (interfaccia in cinese), italiano nel corso di cinese.

## Il foglio del consenso

Nell'app: ⚙️ → Suoni e musica → **Scambio linguistico: la tua voce** → *Partecipa*. Otto punti (che cosa si registra e dove resta,
CC BY 4.0, la voce si riconosce, chi ascolta, nome e regione, come chiedere di togliere una registrazione, solo maggiorenni, lingua
madre), nome o nickname e regione facoltativi, tre caselle non spuntate di base («Ho letto e capito», «Ho almeno 18 anni», «Autorizzo la pubblicazione con licenza CC BY 4.0 se le invio») e il
pulsante «Accetto e continuo», spento finché non sono spuntate tutte. Il consenso resta sul telefono in `md-voice-consent`
(chiave senza il prefisso `cp-`: non entra nei backup né nella sincronizzazione). *Ritira il consenso e cancella tutto* toglie
registrazioni e consenso dal telefono.

**Pagina del consenso sul sito**: `docs/partecipa-voci.html` → <https://mandarinoapp.org/partecipa-voci.html?da=app>. Non è collegata dal
sito, non è nella sitemap, `robots.txt` la esclude, ha `noindex` e senza `?da=app` mostra solo «Questa pagina si apre dall'app». Il
link compare nell'app solo dopo la conferma. È nascosta, non segreta (un sito statico non può chiudere una pagina davvero). Non c'è un
server: il modulo non invia nulla, prepara un'e-mail a mandarinoapp@gmail.com con le risposte, che la persona invia da sé, e si può
stampare o salvare in PDF. Per registrare basta il foglio dell'app; il modulo è facoltativo.

## Formato e limiti

| Campo | Valore |
|---|---|
| Audio | quello che offre `MediaRecorder` (di solito `audio/webm;codecs=opus`, altrove `audio/ogg;codecs=opus` o `audio/mp4`), mono, 24 kbit/s; si converte in fase di importazione |
| Durata | al massimo 8 s per frase; oltre si ferma da sola |
| Dimensione | circa 25 KB per frase; al massimo 200 frasi per invio |
| Silenzi e livello | si trattano in fase di importazione (ffmpeg, sul computer di chi gestisce il progetto), non sul telefono |

`manifest.json` nello `.zip` (schema `mandarino-voice/1`): `license`, `speaker` (solo se la persona ha dato il permesso), `region`
(numero della scelta fatta; vuoto se «preferisco non dirlo»), `adult: true` e, per ogni registrazione, `ref`, `lang`, `native`, `text`
(il testo letto), `ms`, `created`, `file` e, se il controllo nell'app ha funzionato, `checked`, `heard`, `match`. Nessuna età, nessun sesso, nessuna posizione.

## Dove resta, come si manda

- **Sul telefono**: IndexedDB `mandarino-voices-v1`, fuori dal backup e dalla sincronizzazione (pesano e sono personali). Un elenco
  nel foglio mostra le registrazioni con ascolto (▶) e cancellazione (×). Gli errori di memoria (lettura, salvataggio o cancellazione) vengono mostrati all'utente e non nascosti.
- **L'invio**: il file `.zip` lo crea l'app da sé, in anticipo, appena si apre il foglio. Un solo tasto principale, **«Invia per e-mail»**:
  dove il telefono lo permette apre la condivisione con il file già allegato e il testo del consenso pronto per mandarinoapp@gmail.com;
  altrimenti scarica il file e apre la bozza dell'e-mail (da allegare a mano). Parte solo se le tre autorizzazioni sono firmate
  (senza, riappare il foglio). Un secondo tasto, «Scarica il file», salva solo il `.zip`. Le registrazioni incluse si segnano «inviata».
  Il tasto prepara l'invio, l'invio lo fa la persona: **nessun caricamento automatico, nessuna richiesta di rete.**

## Il filtro: che cosa impedisce che una voce dica altro

Il testo che compare nel `manifest.json` è quello **mostrato**, non quello **detto**: il file audio potrebbe contenere qualunque cosa. Tre livelli, dal più debole al più forte; solo l'ultimo è una garanzia.

1. **Frasi fisse** (già così): nessun testo libero, si registra solo ciò che l'app mostra. Non impedisce di dire altro.
2. **Controllo nell'app** (APK, Android 13+): mentre si registra, il riconoscimento vocale di sistema ascolta la **stessa** cattura (`RecognizerIntent.EXTRA_AUDIO_SOURCE`). Se il testo sentito non somiglia alla frase mostrata (soglia 0,6, per suono nel cinese, per lettere nell'italiano; le frasi con aggiunte estranee scendono sotto soglia), la registrazione **non si tiene** e si riprova. Nel manifest ogni voce porta `checked` (true/false), `heard` (il testo sentito) e `match` (0–1, -1 se non verificata). Se il riconoscimento non c'è, non risponde o non sente nulla, la voce resta `checked: false`: non si può dire che sia sbagliata. È un filtro contro scherzi ed errori, **non** contro chi vuole davvero aggirarlo: lo .zip si può costruire a mano e `checked` si può scrivere a mano.
3. **Revisione prima di pubblicare** (obbligatoria, nell'importazione): nulla entra nell'app senza essere passato da chi gestisce il progetto.
   - `tools/merge-contrib.mjs` non pubblica mai da solo: senza `--apply` produce solo il riepilogo; con `--apply` porta nell'app **soltanto** le voci che la persona ha approvato una per una nel riepilogo.
   - Ogni voce, anche `checked: true`, si **ascolta** prima di approvarla. `checked` e `heard` servono a ordinare il lavoro (prima le voci non verificate o con `match` basso), non a saltarlo.
   - Prima dell'ascolto si trascrive ogni voce **sul computer di chi gestisce il progetto**, con un riconoscitore locale (per esempio Whisper): se la trascrizione non somiglia a `text`, o contiene parole di un elenco di insulti (cinese e italiano, tenuto fuori dal repository pubblico), la voce è scartata senza ascolto. Nessun audio lascia il computer.
   - Il file `manifest.json` e i nomi dei file non vengono mai eseguiti né usati come percorsi senza controllo (niente `..`, niente nomi fuori dall'elenco).

## Da fare dopo, quando ci sono le prime registrazioni

1. `tools/merge-contrib.mjs` impara `mandarino-voice/1`: controlla che `ref` esista e che `text` sia ancora quello della frase,
   oltre a durata, formato e licenza; riepilogo Markdown con un link a ogni file. Le ascolta solo chi gestisce il progetto.
2. Con `--apply`, i file accettati vanno in `src/audio/voices/<lingua>/<ref>.<impronta>.ogg` (ffmpeg: taglio dei silenzi,
   −16 LUFS, Opus/Ogg). Il nickname va nei Crediti solo se permesso. Le registrazioni `native: false` non si pubblicano come madrelingua.
3. Il **pacchetto voci** scaricabile a parte, come la musica (⚙️ → Suoni e musica → «Voci di madrelingua (N MB)»), mai all'avvio; dove
   c'è una voce vera 🔊 la usa al posto della sintesi, con il segno «voce vera» e il nickname nei dettagli. Il peso dell'APK non cambia.
