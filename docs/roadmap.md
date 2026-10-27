# Roadmap e debito noto

Che cosa resta da fare, in ordine di importanza. Si aggiorna a ogni task. Le cose qui **non** sono in lavorazione:
per ognuna c'è il motivo per cui aspetta.

## Da provare su un telefono vero (prima di tutto il resto)

La lista completa, da spuntare, è in [checklist-dispositivo.md](checklist-dispositivo.md). I punti che bloccano scelte:

- **Livello della musica.** Il guadagno è 0,6. Va ascoltato con la voce che parla sopra e il volume di sistema al 50%;
  se è troppo alto o troppo basso si cambia `G0` in `src/audio/player.js`.
- **Giro dei brani.** In Chromium la CI misura 3-16 ms di vuoto, sotto il limite di 20 ms. Nella WebView di Android
  va ascoltato. Se si sente, la soluzione pronta è la dissolvenza tra due elementi `<audio>` (Task 10.1).
- **Pleco, WeChat, raggiungibilità dalla Cina** ([cina.md](cina.md)): nessuna prova è possibile senza un telefono e una
  rete in Cina.

## Corso di italiano (debito segnalato)

- **Correttore di frasi italiane.** Copre solo gli accordi: articolo-nome-aggettivo, soggetto-verbo, participio con
  essere. Trova 26 degli 88 «errori tipici» delle lezioni. Mancano tempi verbali, ordine delle parole, preposizioni con
  città e paesi, scelta delle parole: servono più che regole d'accordo.
- **Gerundio e tempi diversi dal presente.** Nel lessico del corso ci sono solo presente e passato prossimo.
  L'imperfetto, il futuro e il gerundio («sto mangiando») sono da aggiungere a `tools/itlex.mjs` e alle lezioni 31 e
  seguenti, con la verifica su Morph-it!.
- **Testi cinesi del corso.** La rilettura da parte di madrelingua non è ancora coperta dal modulo di
  `review-sample.mjs` ([rilettura.md](rilettura.md)).

## Voce

- **Riconoscimento vocale offline (Vosk) e pacchetti voce (sherpa-onnx).** Valutati e non implementati: **non si fanno
  finché non c'è una prova su un telefono vero** (peso, velocità, qualità in cinese). Oggi la voce è quella del
  telefono; quella online parte solo se l'hai permessa.
- **Voci di madrelingua** (scambio linguistico): progetto in [scambio-linguistico.md](scambio-linguistico.md), in attesa
  dell'approvazione dell'autore.

## Distribuzione

- **Google Play.** Tutto pronto ([store/README.md](store/README.md)) tranne l'account, il test chiuso (12 tester per
  14 giorni) e il primo caricamento del `.aab`, mai fatto.
- **F-Droid.** Le «anti-caratteristiche» sono segnalate in [store/f-droid.md](store/f-droid.md); la richiesta va fatta
  dall'autore.
- **Ramo predefinito `main`.** Da rinominare a mano ([rilascio.md](rilascio.md#ramo-predefinito-main)).
- **`SITE_URL` e `SHARE_URL`.** Restano vuoti finché GitHub Pages non è attivo. Poi danno un link anche alle sfide
  dall'APK e un QR che porta alla pagina cinese.

## Contenuti

- **Radicali** (`src/data/radicals.js`): i nomi e i significati sono scritti da noi e sono da rileggere.
- **有一些** è l'unica parola senza frase d'esempio.
