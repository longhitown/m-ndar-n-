# Controllo dell'infrastruttura audio (ottobre 2026)

Rilettura critica di tutto l'audio dell'app: bus, abbassamento della musica, jukebox, sintesi vocale, riconoscimento, microfono,
voci reali, effetti. Fatta sul codice, senza telefono: dove una cosa si può dimostrare dal codice o con una prova in
`tools/unit.mjs` è scritto; dove serve un telefono vero è scritto «non verificabile» con la prova che manca.

Legenda: **funziona** = letto e coerente (e, dove indicato, provato con un test); **riparato** = difetto dimostrato dal
codice, corretto qui con un test; **difettoso** = difetto dimostrato dal codice, NON corretto (motivo indicato);
**non verificabile** = dipende dal telefono o dal sistema.

## Difetti riparati

| # | Dove | Difetto | Correzione | Test |
|---|---|---|---|---|
| 1 | `core/core.js`, `CP.bus.duck` | L'abbassamento era un booleano. Quando una voce ne sostituisce un'altra, la fine della vecchia (evento di annullamento della sintesi, o timer di sicurezza della voce registrata) arriva DOPO la partenza della nuova e faceva risalire la musica sotto la voce nuova. | Il bus sa che le voci sono una alla volta: se ne parte una mentre un'altra è in corso, la prima fine che arriva entro 400 ms è della vecchia e viene ignorata. Una fine tardiva non può tenere la musica bassa. | `duck:` (9 prove) |
| 2 | `core/core.js`, `CP.stopSpeak` | Con una voce registrata, `stopSpeak` stacca i suoi eventi: la fine non arrivava mai e la musica restava bassa fino al timer di sicurezza (6,5 s + 0,9 s per carattere). Con la voce del telefono risaliva solo all'arrivo dell'evento di annullamento. | `stopSpeak` chiama anche `CP.bus.cut()`: la musica risale subito. | `duck: stopSpeak (cut)…` |
| 3 | `audio/player.js`, avvolgimento di `CP.listen` | `abort()` non chiama la risposta (è il suo contratto: lo gestiscono `micClick` e i dialoghi). La pausa della musica per l'ascolto si toglieva solo dalla risposta, quindi un secondo tocco sul microfono (annulla) o l'apertura dei toni (`CP.listenRelease`) lasciava `J.hold` a 1: musica spenta fino al riavvio dell'app. | L'avvolgimento sostituisce `abort()` con una versione che toglie la pausa (una sola volta). | `jukebox: abort()…` (4 prove) |
| 4 | `audio/player.js`, avvolgimento di `CP.listen` | Nell'APK, avviare un secondo ascolto mentre il primo è in corso fa cancellare il primo dal ponte nativo senza `sr-end` (`startRecognizer` chiama `stopRecognizer` senza emettere): il primo ascolto non riceve mai risposta e teneva la pausa per sempre. | Un nuovo ascolto toglie la pausa di quello precedente. | `jukebox: un secondo ascolto…` |
| 5 | `audio/player.js`, `start()` | `start()` aspetta `audioUnlock()` e poi parte se la musica è voluta. Se lo sblocco arriva tardi (contesto sospeso: risolve solo al tocco successivo) la musica partiva anche con un ascolto in corso, in muto o con la scheda in secondo piano. | Dopo lo sblocco si ricontrollano tutte le condizioni (`wanted()`, le stesse di `musicApply`). | `jukebox: lo sblocco arrivato durante un ascolto…` |
| 6 | `voice/pitch.js`, `release()` | Se la sessione si chiude (Parla chiuso o fermato) prima che il microfono si apra, `release()` girava due volte e toglieva due volte la pausa della musica: il conteggio scendeva sotto quello di un altro ascolto in corso. | La pausa si toglie una sola volta per sessione. | `toni: …prima che il microfono si apra` (2 prove) |
| 7 | `voice/pitch.js`, avvio | Se `createMediaStreamSource` lancia (flusso già chiuso), l'eccezione finiva nel nulla: pannello fermo su «calibrazione», musica in pausa e microfono tenuto. | `try/catch`: la sessione finisce con errore e rilascia tutto. | `toni: se il flusso non si può collegare…` |
| 8 | `voice/mic.js`, `CP.micStream` | Due richieste insieme condividono `M.pending`, ma se l'apertura falliva solo la prima restituiva il suo conto: `M.users` restava a 1 e il microfono non si chiudeva da solo (fino al timer di 25 s). | Chi si accoda restituisce il suo conto se l'apertura fallisce. | `microfono: se l'apertura fallisce…` |
| 9 | `voice/mic.js`, apertura riuscita | Se chi aspettava il permesso ha già rinunciato (ha fermato prima) il flusso si apre dopo con zero utenti e nessun timer: restava aperto, con l'indicatore del microfono acceso, finché la pagina non andava in secondo piano. | Se all'apertura non c'è nessun utente parte subito il timer di inattività. | `microfono: se chi aspettava ha già rinunciato…` |

Prova: con le correzioni tolte, `node tools/unit.mjs` boccia le prove nuove (verificato con `git stash` sulla cartella `src/`).

## Difetti trovati e NON riparati

| # | Dove | Difetto | Perché non riparato | Che cosa serve |
|---|---|---|---|---|
| A | `Bridge.java`, `beginRecognizer` / `stopRecognizer` (volume dei media) | Un secondo ascolto che parte prima del ripristino (entro 800 ms, o 220 ms dopo un `stopRecognizer`) registra `musicWasMuted = isStreamMute(...)` mentre il flusso è ancora muto per colpa del riconoscitore: ricorda «era muto» e poi non lo riaccende mai. Nei telefoni che silenziano il flusso e non lo ripristinano (il caso per cui il ripristino esiste) il volume dei media resta muto per parole, toni e musica fino al riavvio. Il percorso con audio nostro (`beginPipedRecognizer`) non aggiorna mai `musicWasMuted`: usa il valore dell'ascolto precedente (mai impostato = `false`: riaccende anche un flusso che la persona aveva silenziato apposta). | Zona del microfono/riconoscimento di `Bridge.java`, in modifica da un'altra persona; qui non c'è JDK per compilare. | La correzione sotto, da applicare dopo l'altra modifica, e la prova su telefono (riga della checklist). |
| B | `core/core.js`, `CP.speak`, ripetizione nell'APK | Dopo un errore `synthesis-*` la nuova richiesta parte da `setTimeout(…, 700)` senza ricontrollare `token`: se nel frattempo la persona ha toccato altro (o ha fermato la voce) la vecchia frase parte comunque, sopra la nuova. | Dentro `CP.speak`, in modifica da un altro agente. | Nel `setTimeout`: `if (token === mine)` prima di `CP.speak`. |
| C | `core/core.js`, `CP.speak`, voce registrata | Se il file della clip si blocca senza dare errore (rete ferma, cache sparita), il timer di sicurezza chiude la frase ma `curAudio` non viene fermato: la clip può partire dopo, sopra altro. | Come B. | Il timer di sicurezza dovrebbe chiamare `stopAudio()` prima di `finish`. |
| D | `core/core.js`, `micClick` e `CP.listenRelease` | Quando i toni (o il pannello Parla) abortiscono un ascolto altrui, il pulsante di quell'ascolto resta con la classe `listening` e il testo «ascolto…»: l'`abort` non avvisa il chiamante. | Cambierebbe il contratto di `abort()`, usato in tre punti (`micClick`, dialoghi, `listenRelease`); l'effetto è solo grafico. | Decidere il contratto: `abort()` che chiama la risposta con `error: "aborted"` e adeguare i tre punti. |
| E | `audio/file-player.js` | Nessun ascolto dell'evento `pause` dell'elemento `<audio>`: se Android sospende la clip per una chiamata o per un'altra app (perdita del focus audio che la WebView gestisce da sé), la pagina e la notifica dicono «in riproduzione» mentre non suona. `MusicService` non chiede il focus audio né ascolta `ACTION_AUDIO_BECOMING_NOISY` (cuffie staccate). | Non si può sapere dal codice che cosa fa la WebView: riprendere da soli durante una chiamata sarebbe peggio. | Prova su telefono (checklist, tre righe sotto). Se il difetto c'è: ascoltare `pause`/`play` dell'elemento e chiamare `remote("pause")`/`remote("play")`; per le cuffie, `BroadcastReceiver` su `ACTION_AUDIO_BECOMING_NOISY` che manda `pause` alla pagina. |
| F | `audio/audio-ui.js` / `core/core.js`, ripresa del contesto | Il contesto audio si risveglia solo al tocco (`pointerdown`) e al ritorno in primo piano. Non c'è un ascolto di `statechange`: se il sistema sospende il contesto mentre l'app è visibile (chiamata in arrivo, sveglia) la musica tace finché la persona non tocca; il 🔇/🔊 nella barra mostra «in pausa». | Il comportamento è voluto dal browser (serve un gesto) e la barra lo segnala. | Prova su telefono: chiamata durante la musica, poi toccare lo schermo. |
| G | `audio/audio-ui.js`, `playVoice` (prova A/B delle voci) | Parla con `speechSynthesis` diretta, fuori da `CP.speak`: non abbassa la musica e non passa dal ripiego. | Solo una prova di ascolto; non è un difetto per chi studia. | Niente. |

### Correzione proposta per A (Java, non applicata)

Vale la pena rileggerla riga per riga con il compilatore a portata di mano (API usate: `AudioManager.isStreamMute`, API 23; minSdk 26).

```java
private boolean musicWasMuted = false, muteBaseSet = false;

/** ricorda se i media erano muti PRIMA dell'ascolto: solo la prima volta, finché il ripristino non è avvenuto */
private void noteMusicMute() {
    if (muteBaseSet) return;
    AudioManager am = (AudioManager) act.getSystemService(Context.AUDIO_SERVICE);
    musicWasMuted = am != null && am.isStreamMute(AudioManager.STREAM_MUSIC);
    muteBaseSet = true;
}
```

- in `beginRecognizer` e in `beginPipedRecognizer`, al posto della riga `musicWasMuted = …`, chiamare `noteMusicMute();`
- nel `postDelayed` di `stopRecognizer`, quando `recognizer == null`: prima del controllo, `muteBaseSet = false;`, poi il controllo esistente
  `if (!musicWasMuted && am != null && am.isStreamMute(...)) am.adjustStreamVolume(..., ADJUST_UNMUTE, 0);`.
  Se `recognizer != null` (un altro ascolto è già partito) non si tocca nulla: il valore iniziale resta valido e il ripristino lo fa l'ultimo ascolto.

Se la persona ha il volume dei media a zero ma non «muto» (indice 0), `isStreamMute` risulta falso e il codice esistente non fa niente:
va bene. Se invece lo ha silenziato con la funzione «muto» prima dell'ascolto, il valore ricordato resta «muto» e non viene riacceso.

## Elemento per elemento

| Elemento | Esito | Prova |
|---|---|---|
| **1. Bus audio**: effetti e musica separati | funziona | `CP.bus.sfx()` per gli effetti (`CP.sfx`), `CP.bus.music()` per il jukebox (`ensureBus` in `player.js`), entrambi sotto `CP.master()` con compressore. Controllo in autodiagnosi (`selftest.js`, «bus separati»). |
| Volumi persistiti | funziona | Effetti: `cp-sfxvol` (`lsSet`, letto in `sfxVol`, valore fuori da 0-1 → 0,7). Musica: `cp-musicvol` (`player.js`, cursore da 0,1 a 1). Modalità: `pref.sfx`/`pref.auto` via `CP.setPref`. |
| Ripresa del contesto dopo blocco schermo / sospensione | non verificabile | `wakeCtx` su `pointerdown` e `visibilitychange` (`core.js`); `start()` ora ricontrolla le condizioni dopo lo sblocco (riparato #5). Manca la prova su telefono (F). |
| Gesto richiesto | funziona | `CP.audioUnlock()` chiamato da ogni punto che parte da un tocco (`setAudioMode`, `start`, pulsante 🔊 con «audio in pausa»). |
| **2. Abbassamento (duck)** | riparato | #1 e #2. Corrispondenza punti che abbassano/ripristinano: `CP.speak` chiama `duck(true)` una volta, e ogni uscita (`finish`, `back` della clip, ripetizione online, ripetizione APK) imposta `finished = true` e chiama `duck(false)` una sola volta; il timer di sicurezza `failTimer` garantisce che `finish` arrivi sempre. `CP.stopSpeak` ora ripristina. Nessun altro punto chiama `duck`. |
| Pausa della musica per l'ascolto (`musicHold`) | riparato | #3, #4, #6, #7. Punti che mettono la pausa: avvolgimento di `CP.listen` e `pitchSession`. Ripristino: risposta, `abort`, ascolto successivo, uscita dei toni in ogni ramo. Cambio pagina: `voice-panel` chiude la sessione con `stop(true)`. |
| **3. Musica**: avvio, pausa, passaggio al successivo | funziona | `start`/`stop`/`next`/`prev` in `player.js`; i brani registrati durano `sec` e passano al successivo da soli (`slot()`); dissolvenza di 1,8 s. Catalogo, moduli e file coincidono (22/22, prova `jukebox: catalogo…`; la build rifiuta un brano senza file). |
| Brani dell'utente | funziona | `user-tracks.js`: limiti di numero, peso, durata, spazio; il file sta in IndexedDB; `blob()` di un id mancante riallinea l'elenco. |
| Secondo piano a schermo spento solo se scelto | funziona | `wanted()`: `J.bg \|\| !document.hidden`; con `J.bg` falso la scheda nascosta ferma la musica e `musicNotify(…, false, false)` chiude il servizio. |
| Notifica coerente con lo stato | funziona | `session(on)` a ogni avvio/arresto manda titolo e stato a `Bridge.musicNotify` → `MusicService.update`; in pausa il servizio si stacca (`STOP_FOREGROUND_DETACH`) e la notifica resta con «play»; scorrere la notifica la chiude (`stop`). Non provato su telefono. |
| Ripresa dopo chiamata, cuffie staccate | non verificabile | E: `MusicService` non gestisce `AUDIOFOCUS` né `ACTION_AUDIO_BECOMING_NOISY`. Dipende da come la WebView tratta il focus di un elemento `<audio>`. |
| **4. Sintesi vocale**: coda e annullamento | funziona | `CP.speak` annulla sempre prima (`synth.cancel`); l'emulazione APK (`android.js`) svuota la coda con errore `canceled` e chiude la corrente con `interrupted`. |
| Evento di fine garantito | funziona | Per `CP.speak`: `failTimer`. Per l'emulazione APK: ogni `ttsSpeak` finito male risponde con `tts-error` (`later(end("error"))`), e `retryAfterRestart` risponde con errore alla richiesta sostituita; resta scoperto solo il caso in cui il motore non finisca mai di collegarsi (`initTts` senza risposta): lo copre `failTimer`, ma l'enunciato resta «corrente» finché la voce successiva non chiama `cancel`. |
| Cambio di velocità | funziona | `u.rate` per ogni enunciato (`setSpeechRate` in `speakNow`). |
| Voce non disponibile → ripiego | funziona | Errore `language-unavailable` → `onerror` → voce online solo se accesa in ⚙️, altrimenti un messaggio una volta sola. |
| Motore che si riavvia | funziona (con B) | `ttsSpeak`/`retryAfterRestart`/`initTts`: l'ultima richiesta vince; il difetto B (ripetizione dopo 700 ms senza controllo del token) resta. Non provato su telefono. |
| **5. Riconoscimento e volume** | difettoso | A. Il ripristino dopo 800 ms con `musicWasMuted` regge nel caso semplice (un ascolto per volta), non con due ascolti ravvicinati né con l'audio nostro. Il caso «volume a zero» regge (vedi sopra). App in secondo piano durante l'ascolto: `pause()` → `stopRecognizer()` → ripristino dopo 800 ms: regge, ma il `postDelayed` sulla vista parte solo se la vista è ancora collegata alla finestra. |
| **6. Microfono**: rilascio in ogni uscita | riparato | #6-#9. Errore, pagina nascosta (`visibilitychange` con zero utenti), `pagehide`, sfogliare altrove (`scambio.js`: `lease` + `SES`, bilanciato; `voice-panel`: `_close`), `CP.micClose` ferma tutto (`drop` azzera utenti, timer e registrazione nativa). |
| `M.users` con chiamate concorrenti | riparato | #8, #9 con prova. |
| **7. Voci reali** (solo lettura) | funziona, con C | `voice-clip.js` dà l'indirizzo solo se la clip è sul telefono; `voice-dl.js` scarica quattro alla volta nella cache `mandarino-voice`, segna `cp-voice-dl` solo se non ci sono errori, «Elimina» cancella cache e segno. `CP.speak` ricade sulla voce di sempre se la clip dà errore (`back`). C resta. |
| **8. Effetti sonori** | funziona | `CP.sfx`: un `tap` ogni 60 ms al massimo, tutto su `CP.bus.sfx()`, `pref.sfx` falso → silenzio; se il contesto è sospeso riprende e poi suona (con molte richieste di fila, suonano tutte al risveglio: trascurabile). |
| Tono / accenti nel pannello Parla | riparato | #6, #7. Funzione di analisi (`detect`, `pitchAnalyze`) già provata dall'autodiagnosi (toni puri e silenzio). |
| **9. Test** | vedi sotto | |

## Test

`tools/unit.mjs` copriva dell'audio solo il peso dell'avvio e il manifesto (durata della musica). Aggiunte 27 prove (sezione «audio»),
senza browser: ogni file gira in una sandbox `vm` con finti `AudioContext`, DOM e microfono.

- `duck:` il bus (`CP.bus.duck` e `cut`) con un orologio finto: voci sovrapposte, fine tardiva, fine in più, bus creato mentre parla la voce.
- `jukebox:` avvolgimento di `CP.listen` (abort, abort doppio, secondo ascolto), sblocco tardivo, catalogo/moduli/file.
- `toni:` `pitchSession` con microfono finto: chiusura prima dell'apertura (scarta e non), flusso non collegabile, permesso negato.
- `microfono:` `mic.js` con aperture concorrenti che falliscono e con chi rinuncia prima.

`tools/e2e.mjs` prova in Chromium il giro dei brani senza buchi, l'aggiunta e la rimozione dei brani dell'utente, la cache della
musica e il riconoscimento con un finto motore; non prova il ducking né la pausa per l'ascolto. Non si è potuto eseguire qui
(Playwright non è installato in questa cartella).

## Prove su un telefono vero (aggiunte alla checklist)

Le righe corrispondenti sono in `docs/checklist-dispositivo.md`: volume dei media dopo due ascolti ravvicinati (A), voce registrata
interrotta da un'altra (duck), chiamata o cuffie staccate durante la musica (E), musica che riprende dopo il blocco dello
schermo (F).
