# Scambio linguistico: voci di madrelingua (progetto)

> **Stato: progetto, in attesa di approvazione.** Nell'app non c'è ancora niente.
>
> La registrazione e il salvataggio locale si implementano solo dopo l'approvazione di chi gestisce il progetto.
> Le scelte segnate con **[da decidere]** sono le domande ancora aperte.

## L'idea

L'app ha due corsi, quindi due comunità che si completano:

- chi parla cinese e studia italiano registra frasi **cinesi** (la sua lingua);
- chi parla italiano e studia cinese registra frasi **italiane**.

L'app ottiene così ciò che le manca: voci vere di madrelingua al posto della sintesi vocale del telefono. Chi registra
studia la frase nella propria lingua accanto alla traduzione, quindi l'esercizio serve anche a lui.

## Che cosa si registra

- **Solo frasi che esistono già nell'app**, identificate come in `tools/review-sample.mjs`:
  - `ex:<parola>` per le frasi d'esempio;
  - `dlg:<id>:<riga>` per le battute dei dialoghi;
  - `phr:<gruppo>:<riga>` per le frasi di tutti i giorni;
  - per l'italiano, la frase italiana della stessa riga.

  Niente testo libero: nessun rischio di contenuti personali dentro le registrazioni.
- Una frase per volta, con il testo davanti. Si ascolta prima di tenere la registrazione e si può rifare.
- Si registra solo nella **propria** lingua, quella dell'interfaccia del corso (cinese nel corso di italiano, italiano nel
  corso di cinese). **[da decidere]** Se permettere anche la lingua che si studia, segnata come «non madrelingua» e non
  pubblicata.

## Consenso esplicito

Prima della prima registrazione, un foglio (in cinese o in italiano) dice:

1. che cosa si registra (la tua voce mentre leggi frasi dell'app) e dove resta (solo su questo telefono, finché non decidi tu);
2. che, se la mandi, sarà **pubblicata** nell'app con licenza **CC BY 4.0** (la stessa dei contenuti) o **CC0**
   **[da decidere]**, e che chiunque potrà riascoltarla e riusarla;
3. che il nome compare nei Crediti solo se lo chiedi, come per i contributi di testo;
4. che una voce si riconosce: chi non vuole essere riconosciuto non dovrebbe mandarla;
5. che si può chiedere di togliere una registrazione già pubblicata (per e-mail); resterà nelle versioni già scaricate.

Due caselle separate, non spuntate di base: «ho capito» e «ho almeno 18 anni». **[da decidere]** Per i minori si può
chiedere il consenso di un genitore, oppure escluderli del tutto; la scelta più semplice è escluderli.

## Formato e limiti

| Campo | Valore |
|---|---|
| Audio | Opus in contenitore Ogg (`MediaRecorder`, `audio/ogg;codecs=opus` dove c'è, altrimenti WebM/Opus convertito in fase di importazione), mono, 24 kbit/s |
| Durata | al massimo 8 s per frase (le frasi dell'app ne richiedono 2-5); oltre si taglia la registrazione |
| Dimensione | circa 25 KB per frase; al massimo 200 frasi per invio (≈ 5 MB) |
| Silenzi | tolti all'inizio e alla fine in fase di importazione, non sul telefono |
| Livello | normalizzato a −16 LUFS in fase di importazione |

Metadati di ogni registrazione, in un `manifest.json` accanto ai file:

```json
{ "schema": "mandarino-voice/1", "ref": "dlg:taxi:3", "lang": "zh-CN", "text": "好。多少钱？",
  "speaker": "nickname facoltativo", "native": true, "license": "CC-BY-4.0", "app": "6.7", "ms": 2140, "created": 1761550000000 }
```

Niente età, sesso, provenienza né posizione: non servono. **[da decidere]** Se chiedere la regione di provenienza (per
esempio «nord / sud / Taiwan»), utile per gli accenti; è un dato personale e la scelta più semplice è non chiederla.

## Dove resta, come si manda

- **Sul telefono.** Le registrazioni stanno in IndexedDB (come i backup), non in `localStorage`. Non entrano nella
  sincronizzazione né nel backup, perché pesano troppo; una voce in ⚙️ le elenca e le cancella. Nuova chiave
  `cp-voice-v1`, solo per l'indice (riferimento, data, già inviata sì/no); regola d'unione: si sommano per riferimento,
  vince la registrazione più recente.
- **L'invio.** Si manda un unico file `.zip` (lo stesso `zip` di `pwa/pwa.js`) con il `manifest.json` e i `.ogg`:
  - per e-mail a mandarinoapp@gmail.com, oppure con «Condividi» (WeChat, WhatsApp…);
  - come allegato a una issue GitHub, dove il limite è 25 MB.

  Nessun caricamento automatico.

## Revisione e importazione

1. `tools/merge-contrib.mjs` impara un secondo schema, `mandarino-voice/1`. Controlla che `ref` esista e che `text` sia
   ancora quello della frase (se la frase è cambiata, la registrazione è da rifare), oltre a durata, formato e licenza.
2. Un riepilogo Markdown con un link a ogni file. **Chi gestisce il progetto o un revisore madrelingua ascolta ogni registrazione**:
   pronuncia, rumore di fondo, nessuna voce di terzi.
3. Con `--apply` i file accettati vanno in `src/audio/voices/<lingua>/<ref>.<impronta>.ogg`, con normalizzazione e
   taglio dei silenzi (ffmpeg, solo sul computer di chi gestisce il progetto). Il nickname va nei Crediti se chiesto.
4. La build scrive l'indice delle voci nella pagina (come `window.MUSIC_FILES`), così l'app sa quali frasi hanno una
   voce vera.

## Nell'app: il pacchetto voci

- Come la musica (`audio/file-player.js`): un **pacchetto scaricabile a parte**, mai all'avvio. ⚙️ → Suoni e musica → «Voci di
  madrelingua (N MB)» lo scarica nella cache del service worker, dopo che l'utente lo chiede.
- Dove c'è una voce vera, 🔊 la usa al posto della sintesi vocale, con un piccolo segno «voce vera» e il nickname nei
  dettagli. Dove non c'è, resta la voce del telefono.
- Il peso dell'APK non cambia: il pacchetto si scarica come i brani della musica.

## Che cosa implementare per primo, dopo l'approvazione

Solo **registrazione e salvataggio locale**, come chiede la specifica:

- il foglio del consenso;
- il pulsante 🎙️ accanto a una frase (nel foglio della parola e nei dialoghi), solo nella propria lingua;
- l'elenco in ⚙️ con ascolto e cancellazione.

Si possono già riusare `CP.canRecord()` (`core/core.js`) e l'IndexedDB di `core/store.js`. L'invio, l'importazione e il
pacchetto voci vengono dopo, quando ci sono le prime registrazioni da provare.

## Domande aperte, riassunte

1. Licenza delle registrazioni: CC BY 4.0, come i contenuti (proposta), oppure CC0?
2. Minori: escluderli (proposta) o chiedere il consenso di un genitore?
3. Regione di provenienza: non chiederla (proposta) o chiederla per gli accenti?
4. Registrare anche la lingua che si studia, come «non madrelingua» non pubblicata?
5. Chi ascolta le registrazioni prima della pubblicazione, oltre a chi gestisce il progetto?
