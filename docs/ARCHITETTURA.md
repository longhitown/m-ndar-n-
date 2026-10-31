# Come si agganciano i moduli: l'oggetto `CP`

màndarínō non ha un framework né un sistema di moduli: `src/index.html` elenca gli script **nell'ordine di esecuzione**
(lo stesso ordine che la build usa per il file unico) e ogni file è una funzione `(function () { … })()` che legge e
scrive un solo oggetto globale, `window.CP`. Un modulo può quindi usare soltanto ciò che i file **prima di lui** hanno messo
in `CP`; ciò che arriva dopo lo si chiama con un controllo (`if (CP.x) CP.x()`), così ogni modulo si può togliere
dall'elenco senza rompere gli altri.

Ci sono quattro modi di agganciarsi, sempre gli stessi.

## 0. Configurazione

`src/config.js` è il primo script dopo `boot.js`. Definisce `MD_CONFIG`, che è l'unico posto con l'identità del progetto:
repository GitHub, e-mail di contatto, pagina di sostegno, indirizzi degli store, il *flavor* (`direct` | `store`), gli
interruttori `FEATURE_DONATE` e `FEATURE_SEALS` e le chiavi pubbliche dei sigilli. Lo leggono `pwa/pwa.js`
(aggiornamenti dell'APK) e `contrib/contrib.js` (issue ed e-mail dei contributi). La mappa delle schede, dei fogli e
delle impostazioni, con le regole di rivelazione progressiva, sta in `docs/ux-architettura.md`.

## 1. Funzioni di servizio (definite una volta, chiamate da tutti)

| Che cosa | Dove nasce | A cosa serve |
|---|---|---|
| `CP.t`, `CP.esc`, `CP.attr`, `CP.pinyinHTML`, `CP.hanziHTML` | `words/table.js` (è qui che nasce `window.CP`; `t` viene da `i18n/i18n.js`) | testi tradotti (`it.js`/`zh.js`), escape per HTML e per gli attributi |
| `CP.S`, `CP.state`, `CP.setS`, `CP.save`, `CP.pref`, `CP.setPref` | `core/core.js` | stato delle parole e preferenze (chiavi `cp-*`, vedi `core/store.js`) |
| `CP.srs`, `CP.grade`, `CP.mark`, `CP.dueList` | `core/core.js` (+ `core/fsrs.js`) | ripasso FSRS: voto a una carta, salvataggio, carte in scadenza. `CP.grade(k, g, retry, meta)`: `meta.at` è l'ora del voto (di solito adesso; i voti del widget portano la loro), `meta.quiet` salta `CP.onGrade` (punti del giorno) |
| `CP.wq` | `pwa/wq.js` (al primo uso) | i voti dati nel widget «Ripasso rapido» 4×4: `run()` li legge dal ponte (`widgetPending`), li applica una volta sola con l'ora originale e li conferma (`widgetAck`); `apply(coda, ora)`, `parse(testo)` |
| `CP.game` (`addWord`, `sentence`, `ear`, `xp`, `streak`, `goal`…), `CP.toast` | `core/game.js` | punti, serie di giorni, obiettivo; `xpBy` per dispositivo (la sincronizzazione li unisce) |
| `CP.ita`, `CP.itLexicon`, `CP.itCheck` | `phrases/italian.js`, `it/course.js`, `it/checker.js` | morfologia italiana, lessico del corso di italiano, correttore di frasi |
| `CP.say`, `CP.speak`, `CP.stopSpeak`, `CP.listen`, `CP.canListen` | `core/core.js` | voce del telefono, voce online solo se l'utente l'ha permessa, riconoscimento vocale |
| `CP.sfx`, `CP.bus`, `CP.master`, `CP.getCtx` | `core/core.js` | effetti e grafo Web Audio: bus `sfx`, bus `music`, `bus.duck()` abbassa la musica sotto la voce |
| `CP.openSheet`, `CP.closeSheet`, `CP.topSheet`, `CP.trap`/`CP.untrap` | `core/core.js` | fogli modali con il focus intrappolato (Esc e Indietro li chiudono) |
| `CP.segmentText`, `CP.gloss`, `CP.search` | `core/core.js` (+ `core/segment.js`) | taglio in parole, significato, ricerca |
| `CP.show(nome)` | `core/core.js` | cambia scheda (`words`, `study`, `build`, `path`) |

## 2. Richiami di scheda (uno per scheda: chi arriva dopo lo può avvolgere)

`CP.show` chiama, aprendo la scheda, `CP.onStudy` (`study/study.js`), `CP.onBuild` (`phrases/frasi.js`),
`CP.onPath` (`path/path.js`). `CP.grade` chiama `CP.onGrade(k, g, retry)` (`core/game.js`: conta la parola nuova).

Per aggiungere un comportamento senza toccare il modulo di origine si **avvolge** la funzione, tenendo la vecchia:

```js
var prima = CP.onStudy;
CP.onStudy = function () { if (!modoMio) return prima(); /* … */ };
```

Lo fanno oggi: `study/ear-sprint.js` (`CP.onStudy`, per Orecchio e Sfida), `ui/immerse.js` (`CP.show`: cambiare scheda
chiude l'immersione), `pwa/widget.js` (`CP.mark` e i metodi di `CP.game`: dopo ogni cambiamento aggiorna il widget Android),
`audio/player.js` (`CP.listen`: la musica tace mentre il microfono ascolta).

## 3. Registri (liste e mappe a cui ogni modulo aggiunge la sua voce)

| Registro | Chi lo legge | Chi ci scrive |
|---|---|---|
| `CP.settingsExtras`: una funzione → HTML (pagina «Studio») oppure `{ group: "data" \| "adv" \| "info", html }` | `ui/settings-pages.js`, nelle cinque pagine di ⚙️ (l'ordine e la pagina di ogni sezione sono `ORDER` e `PAGE_OF`) | `pwa/sync.js`, `contrib/contrib.js` e `core/export-anki.js` (Dati e sincronizzazione); `ui/together.js`, `it/switch.js`, `ui/ex-stub.js`, `pwa/reminder.js`, `ui/unlock.js`, `ui/pleco.js`, `words/anatomy.js` (Studio); `ui/seals.js`, `ui/news.js`, `ui/privacy.js` (Informazioni) |
| `CP.subs[id] = { render, after }` | `phrases/frasi.js`, i sottomenu di Frasi | `dialogs.js`, `lessons.js`, `reader.js`, `slot.js`, `thought.js` |
| `CP.audioTracks.add({ id, … make })` | `audio/player.js` (jukebox) | ogni `audio/tracks/<id>.js`; l'ordine è `audio/tracks/index.js` |
| `SECTIONS`, `DIALOGS` (globali di `boot.js`) | vocabolario, dialoghi | `data/vocab/*.js`, `data/dialogs/*.js` |
| `window.__mdEvt(type, id, data)` (catena) | eventi dal ponte Android | `pwa/android.js`, poi `pwa/sync.js`, `pwa/reminder.js`: ognuno gestisce i suoi tipi e passa gli altri al precedente |

Pezzi di HTML che altre schede inseriscono se ci sono: `CP.homeProgress`, `CP.homeBackup`, `CP.homeNotice`
(`study/memory.js`, nella home di Studio), `CP.voiceExtra` (`audio/audio-ui.js`, nel pannello voce).

## 3b. Benvenuto, test di livello, rivelazione progressiva

| Che cosa | Dove | Note |
|---|---|---|
| `CP.unlock` | `ui/unlock.js` | `ok(scheda)`, `toolOk(strumento)`, `why()`, `check()`, `peek(scheda, fn, titolo)`, `nearest()`, `tabs()`, `showAll()`. **Prima di portare l'utente su una scheda, si chiede a `CP.unlock.ok`.** |
| `CP.onboarding` | `ui/onboarding.js` | `open(passo)`, `redoTest()`. Si carica al primo uso; l'innesco è `ui/welcome.js` |
| `CP.placement` | `data/placement.js` (motore, `PLACEMENT`) + `ui/placement.js` | `run`, `apply`, `undo`, `preview`. Si carica al primo uso |
| `CP.game.grant(n)` / `ungrant()` / `granted()` / `activeDays()` | `core/game.js` | punti iniziali che non toccano la serie; ogni corso ha la sua chiave |

`core.js` (`CP.show`), `ui/gestures.js`, `ui/launch.js` (`?go=`), `ui/finder.js`, `path/path.js` e `it/course.js` usano
`CP.unlock` per non mostrare mai una scheda chiusa. `CP.show(nome, instant, force)` con `force` la mostra solo per
l'immersione.

**Moduli caricati al primo uso.** Nel file unico non vengono compilati all'avvio:

- `data/placement.js`, `ui/placement.js` e `ui/onboarding.js`, al primo accesso a `CP.placement` o `CP.onboarding`;
- `it/checker.js`, al primo accesso a `CP.itCheck` o `CP.itCheckHTML`;
- `i18n/together.js`, `ui/challenge.js` e `ui/classroom.js`, al primo accesso a `CP.challenge` o `CP.classroom`;
- `i18n/settings.js` e `ui/settings-pages.js` (le pagine di ⚙️, la ricerca), al primo accesso a `CP.openSettings` o `CP.repaintSettings`;
- `ui/credits.js`, al primo accesso a `CP.credits`;
- `ui/share-card.js`, al primo accesso a `CP.shareCard` (il tocco su `[data-card-open]` lo ascolta `ui/settings.js`);
- `i18n/diary.js`, `data/diary.js` e `ui/diary.js`, al primo accesso a `CP.diary` (il Taccuino del viaggiatore: la carta in «I miei progressi» lo tocca, quindi si carica quando si apre Studia);
- `i18n/voice.js` e `ui/voice-dl.js`, al primo accesso a `CP.voiceDl` (⚙️ → Suoni e musica → Voce → «Voci reali»);
- `pwa/wq.js`, al primo accesso a `CP.wq`: `pwa/widget.js` lo tocca solo se `MandarinoAndroid.widgetPending()` dice che in coda c'è qualcosa, quindi chi non usa il widget non lo carica mai;
- i Crediti caricano anche `i18n/credits-t12.js` (frasi Tatoeba, voci reali).

**Gruppi caricati al primo uso** (`GROUPS` in `tools/build.mjs`): i file restano testo e `window.__mdLoad[NOME]()`
li esegue in ordine, una volta sola. Gruppo ESERCIZI: `i18n/exercises.js`, `core/typing.js`, `study/distractors.js`,
`study/exercises.js`, `study/ex-frasi.js`, `study/ex-varie.js`, `study/guided.js`, `phrases/reading.js`, eseguito da `CP.ex.carica()`.

L'elenco è `LAZYMOD` in `tools/build.mjs`.

## 3c. Sostegno e sigilli

| Che cosa | Dove | Note |
|---|---|---|
| `MDSeal` | `core/seal-code.js` | `parse`, `verify(code, keys)` con WebCrypto, `make` / `encode`; puro, lo usano anche lo strumento di emissione e le prove |
| `CP.seals` | `ui/seals.js` | `svg(livello, px)`, `paint(ctx, …)` per il canvas, `list`, `best`, `offer(codice)`, `forShare()` (lo usa `ui/share-card.js`) |
| `CP.qrScan(titolo, aiuto, onText)` | `pwa/qr-transfer.js` | la fotocamera che legge un QR qualsiasi; `onText` restituisce true per chiudere |
| `tg(chiave, forma)` / `CP.tg` | `i18n/titles.js` | titoli con forma m / f / n (senza titolo); in cinese una forma sola |

`#seal=…` lo legge `ui/seals.js` all'avvio, e convive con `#dev`, `#nodev`, `#selftest` e `?go=`. Gli interruttori
`FEATURE_DONATE` e `FEATURE_SEALS` e le chiavi stanno in `MD_CONFIG`. `window.__mdConfigTest` serve solo alle prove.

## 3d. Contributi, Crediti, Novità

| Che cosa | Dove | Note |
|---|---|---|
| `CONTRIBUTORS` | `data/contributors.js` | nickname di chi ha chiesto di comparire; lo scrive `tools/merge-contrib.mjs --apply`, uguale a `CONTRIBUTORS.md` (controllo nella build) |
| `CHANGELOG` | `data/changelog.js` | `[{ v, d, it, zh }]`, dal più recente; la build vuole lo stesso numero di righe nelle due lingue |
| «Chi ha contribuito» | `ui/credits.js` | prima parte del foglio Crediti |
| «Novità» | `ui/news.js` | voce di ⚙️ → Informazioni |
| `CP.pleco` / `CP.plecoRow(hz)` | `ui/pleco.js` | `on`, `available` (telefono, corso di cinese), `valid`, `open`, `url`; la pressione di 2 s usa `CP.charTarget`; il menu «⋯» della carta (`study/study.js`) chiede la riga a `CP.plecoRow` |
| `CP.anatomy` / `CP.anatomyHTML(ch)` | `words/anatomy.js` | `get`, `html`, `svg`, `radical`, `groups` (componente di ogni tratto, per la lavagna), `on`/`set`; il foglio del carattere (`core/core.js`) chiede l'HTML |
| `CP.challenge` | `ui/challenge.js` (al primo uso) | `create()`, `open(testo)`, `encode`/`decode` del codice `MDC1-…`, `build(sfida)` (domande dal seme), `link`, `base`; la sfida a un amico |
| `CP.classroom` | `ui/classroom.js` (al primo uso) | `section()` (⚙️), `banner()`, `list`/`add`/`remove`, `progress(pacchetto)`, `report(pacchetto, nome)`, `table(riepiloghi)`, `sheet(canvas, pacchetto)` (foglio A4), `encode`/`decode`/`link` del codice `MDK1-…` |
| `CP.ex` | `ui/ex-stub.js` (all'avvio) | `stile()` (`guided` / `mixed` / `classic`, `cp-ex-style`), `set(stile)`, `carica(cb)`: esegue il gruppo ESERCIZI |
| `CP.exEngine` | `study/exercises.js` (gruppo ESERCIZI) | `register(def)`, `render(e, kit)`, `requeue`, `voto`, `famiglia`, `gradino`, `renderers`, `force(tipo)` (prove); `CP.studyKit` (in `study/study.js`) gli dà testa, parti della carta, esempio e `answer(g, meta)` |
| `CP.distract` / `CP.typing` | `study/distractors.js` / `core/typing.js` (gruppo ESERCIZI) | risposte sbagliate credibili (funzioni pure con seme); confronto di pinyin e italiano digitati |
| `CP.exSent` | `study/ex-frasi.js` (gruppo ESERCIZI) | `forWord(parola)` → frasi che la contengono come parola (esempio, Tatoeba, lezioni, voci), `holed(segmenti, i)`; per buchi, ordina, lettura; `ascolto-frase` usa le frasi delle voci reali che sono sul telefono |
| `CP.guided` | `study/guided.js` (gruppo ESERCIZI) | `go(passo, durata)`, `impara(tappa)`, `verifica(tappa)` (12 domande, cinque parti, soglia 80%), `leggi`, `miniQuiz(lezione)`; il passo lo calcola `CP.ex.prossimo(indice)` in `ui/ex-stub.js`, la carta `CP.ex.guidaHTML` |
| `CP.reading` | `phrases/reading.js` (gruppo ESERCIZI) | lettura graduata: `render()` (Frasi → Leggi → Testi), `open(id)`, `texts()`, `knownPct(testo)`; i testi in `TESTI_ZH` / `TESTI_IT` (`src/data/reading/`, da `tools/lettura.mjs`, letti al primo uso) |
| `CP.itEx` | `it/esercizi.js` (COURSE_IT) | esercizi del ripasso del corso di italiano con lo stesso motore: `on()`, `card(voce, nuova)`, `mount(vista)`, `pick(coda)`, `step()` / `stepHTML()` (passo successivo nella carta «今天», stile Guidato), `forms(voce)`, `sentences(voce)`, `only(id)` (prove); il voto da `CP.itApi.grade(voce, g, meta)` |
| `CP.itRead` | `it/lettura.js` (COURSE_IT) | lettura graduata del corso di italiano in 句子: `listHTML()`, `html()`, `open(id)`, `texts()` (`TESTI_IT`), `readMap()` |
| `CP.voiceClip` / `CP.voiceDl` | `core/voice-clip.js` (all'avvio) / `ui/voice-dl.js` (al primo uso) | voci reali: `url(frase, lingua)` solo se le clip sono sul telefono (APK o `cp-voice-dl`), `idOf`, `fileUrl`; «Scarica le voci» nella cache `mandarino-voice` (`download`, `remove`, `html`) |
| `CP.togetherOpen(testo)` / `CP.classBanner()` | `ui/together.js` (all'avvio) | apre una sfida o importa un pacchetto da un testo qualsiasi (link, codice, QR); il riquadro del pacchetto in cima al Percorso e alle lezioni di italiano |
| `CP.story` | `study/story.js` | `html(corso)` → Promise di HTML (riepilogo, numeri, barre di sei settimane), `weeks`, `hardTone`, `sureCount` |
| `CP.game.rest()` / `rank().season` | `core/game.js` | giorni di riposo della serie attuale; stagione oltre l'ultimo grado; `CP.onRankUp(r)` se un modulo vuole festeggiare |
| `CP.diary` | `ui/diary.js` (+ `data/diary.js`, `i18n/diary.js`) | Taccuino del viaggiatore: `card()` (la carta in Studia), `open()` (il foglio con mappa e pagine), `build()`, `earned()` (gli aneddoti guadagnati), `shareData(id, città)`; `CP.exConf(a, b, tipo)` (`study/memory.js`) scrive le coppie scambiate in `cp-ex-v1.conf` |
| `CP.shareCard` | `ui/share-card.js` | `CP.shareCard()` carta del giorno del corso aperto; `.open(modello, dati)`, `.render(canvas, modello, dati, { format, theme, seal })`, `.templates` (`zh-day`, `it-day`, `it-milestone`, `it-week`), `.FORMATS`, `.THEMES`, `.url()` |
| `CP.itApi` / `CP.itToday` / `CP.itCardData` / `CP.itProgress` | `it/course.js` / `it/today.js` | i dati del corso di italiano per la carta «今天», il percorso, i traguardi, «我的进步»; anche `grade(voce, g, meta)`, `entry`, `lex`, `rec`, `example`, `detail`, `nextCard` |
| `CP.toast(msg, { label, run })` | `core/game.js` | un'azione dentro lo stesso messaggio; senza, il messaggio di sempre |
| `CP.onAward(n)` | `core/game.js` | chiamato a ogni punto guadagnato (corso di italiano: «+N 分») |
| `CP.anki` | `core/export-anki.js` | `build({ which: mine \| sure \| all \| sec, sec }, corso)` → `{ text, n }`, `guid(corso, chiave)`, `save`, `allowed()` (soglia `ANKI_MIN`); voce in ⚙️ → Dati e sincronizzazione |
| `credit: 1` nella patch | `contrib/contrib.js` | solo con un nickname e la casella spuntata (`cp-contrib-credit-v1`) |

## 4. Punti d'ingresso dall'esterno

| Ingresso | Dove | Chi lo usa |
|---|---|---|
| `?go=<azione>` nell'indirizzo, `CP.go(azione)` | `ui/launch.js` | scorciatoie del manifest web e dell'APK (`study`, `ear`, `sprint`, `music`, `words`, `frasi`, `path`) |
| `window.__mdGo(azione)` | `ui/launch.js` | `MainActivity.onNewIntent` (scorciatoia o widget con l'app già aperta) |
| `window.__mdBack()` | `pwa/android.js`, `it/course.js` | tasto Indietro di Android: chiude foglio, immersione, sottomenu, poi esce |
| `window.__mdWidget()` = `CP.widgetPush` | `pwa/widget.js` | `MainActivity.onPause`: lo stato «Oggi» va al widget prima che l'app vada in pausa |
| widget «Ripasso rapido» (4×4, da 3×3) | `ReviewBigWidget.java` (+ `ReviewQueue.java`) | le carte da ripassare una alla volta, tutto in `RemoteViews`. Il mazzo (`deck`, fino a 20 carte scadute, le più dimenticate prima; `dc` è il corso) viene dallo stato di `pwa/widget.js`. Sessione di 10 carte: fronte, retro con i quattro voti dell'app, «Ripasso finito» con «Ancora un po'» e «Apri màndarínō». Ogni tocco è un broadcast esplicito verso il widget (`PendingIntent` immutabile, `requestCode` = widget × 16 + azione), il receiver non è esportato; la sessione (quante fatte, retro mostrato, ora dell'ultimo voto) sta nel `SharedPreferences` privato `mandarino_ripasso`. I voti non si applicano qui: vanno nella coda `q` (id, carta, voto 0-3, ora, corso) e in `rv` (carte votate nelle ultime 24 ore, per non riproporle finché l'app non manda uno stato più recente dell'ultimo voto) |
| `MandarinoAndroid.widgetPending()`, `MandarinoAndroid.widgetAck(idsJson)` | `Bridge.java` (in fondo al blocco del widget) → `ReviewQueue.java` | `pwa/widget.js` e `pwa/wq.js`: la coda dei voti del widget come testo JSON (`""` se vuota) e la conferma degli id applicati. Quando l'app applica la coda: all'avvio (dopo 0,8 s), al ritorno in primo piano e prima di ogni invio dello stato al widget (così il mazzo nuovo non contiene carte già votate). Applicare = `CP.grade` con `meta.at` = ora del voto; scarta il voto se la carta è stata ripassata dopo, o non c'è più; gli id applicati stanno in `md-wq-done` (fuori dai backup), scritti prima dell'ack: esattamente una volta anche se l'app si chiude a metà. Corso di italiano: stesso FSRS su `cp-it-srs-v1` |
| widget «Ripasso rapido (piccolo)» (2×1) | `ReviewWidget.java` | il numero di carte da ripassare adesso (`WidgetState`, dallo stato di `setWidgetState`); un tocco apre `mandarino://go/study`, cioè `?go=study` / `CP.go("study")`; si ridisegna da `TodayWidget.updateAll` |
| `MandarinoAndroid.widgetPinSupported()`, `MandarinoAndroid.pinWidget(kind)` | `WidgetPin.java` (da `Bridge.java`, in fondo) | le Impostazioni (JavaScript) per «Aggiungi alla Home»: `kind` è `today_large`, `today_small`, `pause`, `review` (il 4×4) o `review_small` (il 2×1, solo dal selettore dei widget del launcher); mostra la richiesta di sistema (`requestPinAppWidget`, Android 8+) e ritorna `true` se è stata mostrata; non invia dati e non parte mai da sola. Il JavaScript controlla sempre `typeof window.MandarinoAndroid.pinWidget === "function"` |
| `CP.jukebox.remote(cmd)` | `audio/player.js` | pulsanti della notifica della musica (`MusicService.java`) e Media Session |
| `#sfida=MDC1-…`, `#classe=MDK1-…` | `ui/together.js` | link di una sfida o di un pacchetto classe; il frammento si toglie subito dall'indirizzo |
| `#seal=…` | `ui/seals.js` | link di un sigillo di gratitudine (§3c) |
| primo avvio: benvenuto e test di livello | `ui/welcome.js` → `CP.onboarding` (§3b) | si apre se manca `cp-ux-v1.onboarded` (corso di cinese) o `cp-it-welcome` (corso di italiano), e non c'è un `?go=` o un link |
| configurazione | `config.js` → `MD_CONFIG` (§0) | il primo script dopo `boot.js`; nell'APK la versione (`direct`/`store`) la sceglie `MandarinoAndroid.flavor()` |
| `#selftest`, `#dev` / `#nodev` | `selftest/selftest.js`, `selftest/mic-diag.js` (diagnosi del microfono: stato e prova di 3 secondi, nell’APK anche `Bridge.micDiag()`), `audio/audio-ui.js` (`CP.dev()`) | controlli dentro l'app; modo sviluppatore (mostra il «pacchetto PWA per GitHub») |

## Il ponte Android

`android/…/Bridge.java` espone `window.MandarinoAndroid`. Il codice web non lo chiama quasi mai direttamente:
`pwa/android.js` lo trasforma nelle API web standard (`speechSynthesis`, `SpeechRecognition`, download, condivisione) e i
pochi moduli solo-APK (`pwa/sync.js`, `pwa/widget.js`, `pwa/reminder.js`, `pwa/pwa.js` per gli aggiornamenti, `audio/player.js`
per la notifica della musica, `ui/pleco.js` per `openPleco` e `plecoStore`) controllano prima `if (window.MandarinoAndroid)`. `src/config.js` chiede `flavor()` («direct» o «store») per gli interruttori della versione per gli store. Le risposte asincrone tornano da
`window.__mdEvt`.

## Regole che tengono insieme il tutto

- **Le chiavi dei progressi** sono i caratteri della parola (`hz`): non cambiano mai. Ogni chiave salvata è `cp-*` e ha una
  regola d'unione in `core/store.js` (`mergeKey`), usata da ripristino, sincronizzazione e QR.
- **Testi:** mai scritti nel codice; `t("gruppo.chiave")` con le due lingue in `i18n/it.js` e `i18n/zh.js`. Il contenuto
  italiano mostrato a chi usa l'app in cinese si marca `lang="it"`; `tools/e2e.mjs` cerca parole latine «scappate».
- **Niente rete all'avvio**, niente librerie esterne caricate da fuori: quelle poche (jsQR) stanno in `src/vendor/` e la
  build le inserisce come testo che si esegue solo al primo uso.
- **Prove:** `npm test` (unit, build, e2e, ux-audit) gira anche in GitHub Actions (`.github/workflows/web.yml`).
