# Scambio linguistico: voci di madrelingua

> **Stato (ottobre 2026): attivo, parti 1 e 2.** Nell'app ci sono il foglio del consenso (tre autorizzazioni), la registrazione di una
> serie a caso di frasi e parole, l'elenco con ascolto e cancellazione, e un solo tasto «Invia per e-mail» che prepara il `.zip` da sé.
> L'**importazione** c'è (`tools/voice-import.mjs`, vedi «Come si importa»). **Non c'è ancora** il pacchetto voci scaricabile
> dall'app: arriva quando ci sono le prime registrazioni da provare. Le decisioni qui sotto sono di chi gestisce il progetto.

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

Nell'app: ⚙️ → Comunità e voci → **Scambio linguistico: la tua voce** → *Partecipa*. Otto punti (che cosa si registra e dove resta,
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
   - `tools/voice-import.mjs` non pubblica mai da solo: la prima fase prepara soltanto (riepilogo e `review.json`); la seconda, `--apply`, porta nell'app **soltanto** le voci che la persona ha approvato una per una in `review.json`. Non esiste un'opzione per approvare in blocco.
   - Ogni voce, anche `checked: true`, si **ascolta** prima di approvarla. `checked` e `heard` servono a ordinare il lavoro (prima le voci non verificate o con `match` basso), non a saltarlo.
   - Prima dell'ascolto si trascrive ogni voce **sul computer di chi gestisce il progetto**, con un riconoscitore locale (per esempio Whisper): se la trascrizione non somiglia a `text`, o contiene parole di un elenco di insulti (cinese e italiano, tenuto fuori dal repository pubblico), la voce è scartata senza ascolto. Nessun audio lascia il computer.
   - Il file `manifest.json` e i nomi dei file non vengono mai eseguiti né usati come percorsi senza controllo (niente `..`, niente nomi fuori dall'elenco).

## Come si importa

Lo strumento è `tools/voice-import.mjs` (Node, nessuna dipendenza, nessuna rete; librerie in `tools/lib/`). Serve ffmpeg solo nella seconda
fase; per la trascrizione serve un riconoscitore locale a scelta (per esempio Whisper) con il modello già scaricato: lo strumento non scarica nulla.

**1. Prepara** (non scrive nulla in `src/`, solo nella cartella di revisione):

```
node tools/voice-import.mjs pacchetto1.zip [pacchetto2.zip …] --review-dir revisione/ [--stt "<comando>"] [--blocklist elenco.txt] [--min 0.6] [--out riepilogo.md]
```

- **Pacchetto**: lo `.zip` si legge con un lettore proprio (nessun `unzip`) e si rifiuta intero alla prima anomalia: nomi con `..`, `/` iniziale, barra
  rovesciata, lettera di unità o byte nulli, nomi doppi, più di 201 file, un file oltre 300 KB, oltre 30 MB in tutto, rapporto di compressione sospetto
  (zip bomb), CRC errato, file non elencati nel manifest. Si accettano i metodi «store» e «deflate». Nulla viene mai eseguito.
- **Manifest**: `schema` `mandarino-voice/1`, `license` `CC-BY-4.0`, `adult: true`, da 1 a 200 voci. Per ogni voce: `ref` esistente nei dati
  di oggi, `lang` `zh-CN` o `it-IT`, `text` **uguale** al testo attuale di quel riferimento (altrimenti «testo cambiato»), `ms` tra 1 e 8500,
  estensione `.ogg`/`.webm`/`.m4a`/`.mp4` con i primi byte coerenti (`OggS`, `1A45DFA3`, `ftyp`), `native` vero o falso. Il nickname (`speaker`) è
  sanificato come in `merge-contrib.mjs`. `checked`, `heard` e `match` si ignorano: si ricalcola tutto.
- **Trascrizione** (`--stt`): il comando riceve ogni voce con `{file}` (un nome generato dallo strumento, mai testo del manifest), `{lang}` (`zh` o `it`) e
  `{locale}` (`zh-CN` o `it-IT`) e stampa il testo su stdout (i tempi tipo `[00:00.000 --> 00:02.000]` si tolgono). Nessuna shell: il comando si divide
  in parole (le virgolette servono per i percorsi con spazi) e parte con `execFileSync`, 60 s per voce. Se ffmpeg è nel PATH l'audio passa prima in wav
  16 kHz mono. Senza `--stt` ogni voce resta «da ascoltare» (priorità alta) e il riepilogo lo scrive in cima, con il comando proposto se nel PATH c'è
  `faster-whisper`, `whisper-ctranslate2` o `whisper` (proposto, mai eseguito). Su Windows il comando deve essere un eseguibile vero (`.exe`) o `node script.mjs`,
  non un file `.cmd`.
- **Punteggio**: la stessa logica del filtro dell'app (`tools/lib/voice-score.mjs`, con la prova di parità in `tools/unit.mjs`). Sotto `--min` la voce è scartata.
- **Parole vietate** (`--blocklist`): una voce per riga, `#` per i commenti, confronto su testo minuscolo senza accenti (sottostringa; per il cinese sui
  soli caratteri). **Il file sta fuori dal repository** (contiene insulti): lo strumento rifiuta un elenco dentro il repository. Senza, il riepilogo avverte che il controllo non è stato fatto.
- **Esito**: ogni voce è `scartata` (con il motivo) oppure `da-ascoltare`, con priorità `alta` se non trascritta, con punteggio sotto 0,8 o non madrelingua.
  In `--review-dir` finiscono i file audio validi con nomi generati (`<indice>-<sha256 primi 8>.<estensione>`), `review.json` (ogni voce con `approved: false`
  e una `note` vuota) e il riepilogo Markdown con un link all'audio di ogni voce. Lo strumento non scrive altrove e non sovrascrive un `review.json` già presente.

**2. Ascolta e approva, a mano.** Si ascolta ogni voce dal riepilogo, anche quelle con punteggio 1 (la trascrizione ordina il lavoro, non lo salta). Sulle sole
voci giuste, in `review.json`, si cambia `"approved": false` in `"approved": true`. È l'unico modo per far entrare una voce.

**3. Applica** (scrive in `src/` solo le voci approvate):

```
node tools/voice-import.mjs --apply revisione/review.json [--src src] [--pack-out cartella/]
```

- Conta solo `approved: true` con stato `da-ascoltare` e con il file ancora uguale all'impronta sha256 registrata (se è cambiato dopo la preparazione la voce
  è rifiutata e lo strumento lo dice). Il resto di `review.json` si ricontrolla (riferimento, testo, nome del file): un file ritoccato a mano non inganna.
  Se per lo stesso riferimento sono approvate due voci, si tiene la prima.
- ffmpeg converte in Ogg/Opus mono (silenzi tagliati ai bordi, −16 LUFS, 24 kbit/s, senza metadati) e il file va in
  `src/audio/voices/<lingua>/<riferimento>-<sigla>.<impronta8>.ogg`. Se ffmpeg manca, errore chiaro e nessuna scrittura; anche se una conversione fallisce non resta niente a metà.
- `src/audio/voices/index.json` è un array ordinato di `{ ref, lang, file, bytes, sha256, native, ms }` (`file` è relativo a `src/audio/voices/`, `sha256` e `bytes` sono
  del file convertito). Le voci `native: false` ci stanno segnate come tali e non si usano come madrelingua. Una nuova voce per lo stesso riferimento, lingua e
  `native` sostituisce la precedente.
- Il nickname va in `src/data/contributors.js` e `CONTRIBUTORS.md` solo se il manifest aveva uno `speaker` valido (il permesso) e almeno una sua voce è entrata:
  le regole sono quelle di `merge-contrib.mjs`, in `tools/lib/credits.mjs`, usate da tutti e due.
- Riapplicare lo stesso `review.json` non cambia nulla.
- `--pack-out` scrive anche il pacchetto da pubblicare: i file `.ogg` (`<lingua>/<nome>.ogg`) e un `index.json` che elenca tutte le voci madrelingua di `src/audio/voices/index.json`
  (quelle `native: false` non ci sono):

```json
{ "v": 1, "updated": "YYYY-MM-DD", "count": 1, "bytes": 8849,
  "files": [ { "ref": "phr:0:1", "lang": "zh-CN", "file": "zh-CN/phr_0_1-e03a4b72.eafb6db1.ogg", "bytes": 8849, "sha256": "…" } ] }
```

Dopo l'applicazione: `node tools/build.mjs`. Codice d'uscita: 0 tutto bene, 1 se un pacchetto è rifiutato o una voce approvata non ha retto ai controlli, 2 per un uso sbagliato.

## Da fare dopo

1. Il **pacchetto voci** scaricabile a parte, come la musica (⚙️ → Suoni e musica → «Voci di madrelingua (N MB)»), mai all'avvio; dove
   c'è una voce vera 🔊 la usa al posto della sintesi, con il segno «voce vera» e il nickname nei dettagli. Il peso dell'APK non cambia.
