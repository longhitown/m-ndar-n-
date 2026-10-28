# màndarínō · guida per chi sviluppa e pubblica

Questa pagina descrive com'è fatta l'app e come si costruisce, si prova e si pubblica. Chi vuole solo usarla trova la guida in
[LEGGIMI.md](../LEGGIMI.md).

Panoramica. Due corsi in un'app: **il cinese per italiani** e, scelto dal benvenuto o da ⚙️ → Studio → Corso, **意大利语课程, l'italiano per
chi parla cinese**. Un'app che si pubblica come file unico (`dist/index.html`, generato da `src/`): 6385 parole in 220 sezioni (con le liste HSK 3.0), una frase d'esempio per parola, pinyin davanti, toni a colori, ripasso FSRS-6,
dialoghi, laboratorio di frasi, pannello «Parla» con la curva dei toni, jukebox di 22 brani originali. Nessuna richiesta di
rete all'avvio, nessuna libreria caricata da fuori (l'unica di terzi, jsQR, è dentro il file); i progressi restano sul
telefono (localStorage + copia in IndexedDB), si salvano su file e si sincronizzano senza server (file nel proprio cloud o QR).
Su Android c'è anche l'APK, con scorciatoie, widget «Oggi», promemoria facoltativo e musica in secondo piano.

Come i moduli si agganciano tra loro (l'oggetto `CP`, i registri, i richiami, il ponte Android): **[docs/ARCHITETTURA.md](ARCHITETTURA.md)**.
Dove vive ogni funzione e quando compare (schede, fogli, impostazioni, glossario): **[docs/ux-architettura.md](ux-architettura.md)**.

## Com'è fatto il repository

```
src/                       ← si lavora qui (si apre anche così com'è, da file://, senza build)
  index.html               struttura della pagina + l'elenco ordinato di stili e script (l'ordine è quello di esecuzione)
  boot.js                  primo script: copia pulita della pagina, registri SECTIONS e DIALOGS
  config.js                MD_CONFIG: repository, e-mail, pagina di sostegno, store, interruttori FEATURE_* (unico punto)
  main.js                  ultimo script: avvio finale
  data/vocab/NNN-<id>.js   il vocabolario, una sezione per file, una parola per riga
  data/dialogs/<id>.js     un dialogo per file (+ _categorie.js)
  data/lessons/NN-<id>.js  le lezioni di grammatica, una per file (le prime 30 qui, le altre in data/lessons-x/) (spiegazione, esempi, errori tipici, esercizi)
  data/examples/*.js       una frase d'esempio per parola: chiave → [cinese, italiano] (il pinyin si ricava dal vocabolario)
  data/freq.js             ordine di frequenza delle parole (lo usa il taglio in parole); data/path-hsk.js = tappe HSK
  data/strokes.js          l'ordine dei tratti (Make Me a Hanzi, licenza Arphic: vedi LICENZE/ e ⚙️ → Informazioni → Come funziona → Crediti)
  data/grammar.js          le schede grammaticali del traduttore (nomi, luoghi, nazionalità, verbi, aggettivi…)
  data/verified.js         le frasi verificate: traduzioni sicure e, insieme, prove per le regole
  data/*.js                frasi, Pensiero, esercizi, modelli, slot, percorso
  i18n/                    i18n.js (t, applyI18n) + it.js + zh.js
  core/                    fsrs.js (ripasso), store.js (salvataggi e backup), core.js (stato condiviso, voce, fogli), game.js,
                           segment.js (taglio di una frase in parole: lo stesso codice nella pagina e negli strumenti)
  words/ study/ path/ phrases/ voice/ ui/ contrib/ selftest/ pwa/   le schede e le funzioni, un modulo per file
  data/lab-recipes.js      le ricette del Laboratorio dei radicali (generato: tools/radicali.mjs);  data/lab-readings.js = le letture simpatiche a mano
  audio/synth.js           attrezzi sonori per gli effetti + registro delle tracce (CP.audioTracks.add)
  audio/music/<id>.ogg     i 22 brani originali del jukebox (la build li copia come <id>.<impronta>.ogg);
                           audio/file-player.js = il loro riproduttore (a flusso: <audio> collegato al grafo Web Audio)
  audio/tracks/<id>.js     un modulo per brano;  audio/tracks/index.js = catalogo (ordine)
  audio/player.js          motore del jukebox e interfaccia;  audio/audio-ui.js = audio a tre stati, voci, microfono
  styles/*.css             stili, in ordine di cascata
  pwa/                     manifest.json (con le scorciatoie), sw.js (modello), _headers, icone; pwa.js (aggiornamenti, anche dell'APK),
                           android.js (ponte), sync.js (sincronizzazione), qr.js + qr-transfer.js (passaggio con i QR),
                           widget.js (stato del widget Android), reminder.js (promemoria)
  ui/launch.js             ?go=<azione>: apre l'app su un'azione (scorciatoie, widget)
  data/wiki/zh-it.txt      «nomi e termini» del Lettore (wikidict-it da Wikidata, CC0), letto al primo uso
  ui/worksheet-stub.js     «Crea il foglio di lavoro» (Studia → Progressi) e il link …/#dettato=<codice> (sempre presente)
  ui/worksheet.js          gruppo FOGLIO, al primo uso: foglio PDF A4 (tianzige, quadretti per l'italiano), anteprima, QR, dettato
  vendor/                  jsQR (Apache 2.0), eseguito solo quando serve leggere un QR; jsPDF (MIT), nel gruppo FOGLIO
docs/ARCHITETTURA.md       dove e come i moduli si agganciano a CP
fastlane/                  testi e immagini per gli store (fonte unica; docs/store/ per firma, moduli, tester)
docs/index.html, docs/img/ la pagina di presentazione (GitHub Pages, con privacy.html e l'app in app/: tools/site.mjs)
dist/                      ← generato da tools/build.mjs (non è nel repository, è in .gitignore): è questo che si pubblica
  index.html               un file unico (stili, script e dati dentro): funziona offline da file://, su https e nell'APK
  sw.js                    APP_VERSION = impronta di index.html: ogni build che cambia l'app fa comparire «Aggiorna»
  phrases/translate.js     il traduttore del laboratorio (regole); phrases/italian.js = coniugazioni e articoli
  it/course.js             il corso di italiano per chi parla cinese; data/it/lessons/ = le sue lezioni (in cinese)
android/                   l'app Android: una WebView che apre dist/index.html dal pacchetto + un ponte nativo (Java, solo SDK)
.github/workflows/web.yml  a ogni push: build, grammatica, prove unitarie, e2e e ux-audit con Playwright
.github/workflows/apk.yml  costruisce l'APK su GitHub, lo prova su un emulatore e lo pubblica come Release
tools/                     build.mjs, grammar.mjs, anatomy.mjs, site.mjs, store-assets.mjs, anki-check.py (solo sviluppo), ux-audit.mjs, e2e.mjs, merge-contrib.mjs, cedict-check.mjs, morphit-check.mjs,
                           freq.mjs (rigenera freq.js), strokes.mjs (rigenera strokes.js da Make Me a Hanzi), radicali.mjs (rigenera lab-recipes.js, le ricette del Laboratorio dei radicali), android-smoke.mjs,
                           unit.mjs (taglio in parole, unione dei backup, peso dell'avvio), misura-avvio.mjs (tempo di apertura), wikidict.mjs, levels.mjs, itlex.mjs,
                           review-sample.mjs e review-import.mjs (rilettura da madrelingua, docs/rilettura.md),
                           icons.mjs (rigenera le icone PWA e Android, mandarino + wordmark, con Playwright),
                           hunspell-check.py, lib/ (Node puro, zero dipendenze; gli strumenti di controllo leggono file esterni solo in sviluppo)
```

**Dopo ogni modifica in `src/`:** `node tools/build.mjs` per provarla in locale. `dist/` **non si committa**: è generato (sta in `.gitignore`) e lo
costruiscono la CI e il sito; così due pull request non litigano più su `dist/sw.js`, che cambia a ogni build. Prima di un push: `npm test` (serve una volta `npm install`, che porta solo Playwright).
La build si ferma se i dati non sono validi (chiavi doppie, sillabe ≠ caratteri, HTML) o se un file di
vocabolario, dialogo o traccia non è elencato in `src/index.html`. `node tools/build.mjs --check` costruisce in memoria e basta (utile per provare senza scrivere).

**Aggiungere parole:** apri il file della sezione in `src/data/vocab/` e aggiungi una riga `["pin.yin","汉字","italiano"]`.
Una sezione nuova: un file nuovo `NNN-<id>.js` (copia la forma di uno esistente) e una riga `<script src="data/vocab/…">` in `src/index.html`.
I caratteri sono la chiave dei progressi: una parola esistente non cambia mai i suoi caratteri.

**Aggiungere una lezione:** un file nuovo in `src/data/lessons/` (il formato è spiegato in cima a `01-essere.js`) e una riga
`<script src="data/lessons/…">` in `src/index.html`. La build controlla che ogni frase cinese sia fatta di parole del
vocabolario e che gli esercizi siano ben formati. Il campo `path` la fa comparire nella tappa giusta del Percorso.

**Livelli e capitoli:** `node tools/levels.mjs complete.json` (complete-hsk-vocabulary) scrive `src/data/levels.js`: il livello
HSK di ogni parola e il capitolo di ogni tappa (1-5 = HSK 1-5, 6 = oltre l'HSK), e rimette in ordine i file del vocabolario
in `src/index.html`. Si rilancia dopo aver aggiunto parole o sezioni; la build controlla capitoli e ordine.

**Navigazione:** 🔍 in alto (o /, Ctrl+K) apre «Cerca ovunque» (`src/ui/finder.js`): strumenti, lezioni, dialoghi, tappe,
parole. Uno scorrimento orizzontale cambia scheda (`src/ui/gestures.js`). All'avvio una schermata col logo
(`styles/splash.css`) copre il caricamento; nel file unico frasi d'esempio, tratti e lessico italiano sono JSON letto al primo uso.

**Frasi d'esempio:** in `src/data/examples/` una riga `"chiave": ["中文句子。", "Frase italiana."]`. La build controlla che
la frase usi solo parole del vocabolario e che il taglio in parole la restituisca come parola (中 non vale dentro 中国).
Se il taglio sbaglia una frase giusta, si corregge `core/segment.js` (WEAK, CTX, BOUND), non la frase.

**Aggiungere o sostituire un brano del jukebox:** il file in `src/audio/music/<id>.ogg` (Opus, in loop senza stacchi, sotto i
25 MB) e un modulo `src/audio/tracks/<id>.js` come gli altri (`CP.audioTracks.add({ id, ico, name, desc, mood, zh: [nome, descrizione],
file: true, sec, make })`, dove `make` chiama `CP.audioFile.player`). Poi l'id in `audio/tracks/index.js` e il modulo in
`src/index.html`. La build copia i brani in `dist/audio/music/` e si ferma se un modulo non trova il suo file.
I brani non stanno dentro `index.html`: nell'APK sono nel pacchetto; sul sito il service worker li salva nella cache
`mandarino-music` al primo ascolto (o tutti insieme con «Scarica tutta la musica» nel pannello 🎵), che resta tra un
aggiornamento e l'altro. Aperta da `file://` l'app funziona, ma il browser non le lascia leggere i brani e il pannello lo dice.

**Il loop si controlla da solo** (`tools/e2e.mjs`, «loop senza buchi»). Ogni brano suona dal riproduttore vero dell'app,
salta a 0,35 s dalla fine e un AnalyserNode registra la cucitura. Il «buco» è la sequenza più lunga sotto −60 dB e deve
restare sotto 20 ms (`LOOP_GAP_MS`). Misure di ottobre 2026 in Chromium: da 3 a 16 ms, a gradini di circa 2,9 ms (un
blocco audio da 128 campioni che il browser lascia vuoto al giro). I file invece non hanno silenzi ai bordi: al massimo
3 ms sotto −60 dB attorno alla cucitura. Sotto la soglia il riproduttore resta com'è, con un solo `<audio loop>`. Se un
brano nuovo la supera, prima si controllano i bordi del file; se il buco viene dal browser, il rimedio previsto sono due
elementi `<audio>` che si danno il cambio con una dissolvenza.

## Benvenuto, test di livello, rivelazione progressiva

**Benvenuto** (`src/ui/welcome.js` + `src/ui/onboarding.js`, uguale per i due corsi):

1. Un'intro di circa 4 secondi (ferma con *riduci movimento*).
2. Tre porte:
   - **Parto da zero**: obiettivo, prova dei quattro toni (corso di italiano: l'accento di ciao / grazie / buongiorno), prima carta.
   - **Conosco già le basi**: cinque domande su di sé, poi il test.
   - **Ho già un backup o un altro dispositivo**: dritto a sincronizzazione, QR o backup, senza test.
3. In piccolo, l'altro corso. Lo scopo (viaggio, lavoro…) è facoltativo: suggerisce l'obiettivo e mette una ⭐ ai temi
   in Parole.

**Test di livello** (`src/data/placement.js` è il motore, `src/ui/placement.js` le domande):

- Al massimo 10 domande. Non dice se la risposta è giusta.
- «Non lo so» conta come errore, senza colpa.
- Le domande d'ascolto si saltano se manca una voce cinese.

| | Corso di cinese | Corso di italiano |
|---|---|---|
| Livelli | capitoli HSK 1-5 (il 6 solo dopo risposte giuste al 5) | 0-30 lezioni |
| Scelta della domanda | scala a gradini | la domanda che riduce di più l'incertezza |
| Stima | massima verosimiglianza | mediana del posteriore |

`node tools/unit.mjs` simula utenti di ogni livello. Il cinese resta entro ±1 livello nel 95-99% dei casi, l'italiano entro
±3 lezioni nel 92-98%.

Il livello proposto si corregge con − / + prima di confermare. Alla conferma:

- **Corso di cinese**: le parole dei capitoli precedenti entrano nel ripasso come note. I record hanno `pl:1`, stabilità
  da 30 a 7 giorni e scadenze sparse tra 2 e 4 settimane. Nessun XP, nessuna voce nel registro, la serie non cambia.
- **Corso di italiano**: le lezioni note risultano superate e le parole dei livelli HSK corrispondenti entrano in
  `cp-it-srs-v1`.
- **Punti iniziali** con `CP.game.grant(n)`: stanno in `cp-game-v1.pl` / `cp-it-game-v1.pl`. L'unione tra dispositivi
  prende il più alto (mai la somma) e un «annulla» vince sempre.

⚙️ → Studio → «Livello e schede» ha tre comandi: «Rifai il test di livello», «Annulla il salto» (toglie le parole del
test mai ripassate, i punti e gli sblocchi del test) e «Mostra tutto, subito» (con doppia conferma).

**Rivelazione progressiva** (`src/ui/unlock.js`, soglie nella costante `UNLOCK`):

| Corso | All'inizio | 200 XP e 2 giorni di studio | 300 XP e 3 giorni | Altro |
|---|---|---|---|---|
| Cinese | Percorso, Studia | Parole | Frasi | — |
| Italiano | 课程, 复习 | 单词 | 句子 | 变位: dopo la lezione sul presente o con 300 XP e 3 giorni |

Dentro Frasi: Lezioni, Esercizi e Dialoghi subito; Modelli e Pensiero dopo 3 lezioni; Laboratorio, Slot e Lettore dopo 6
lezioni o 1000 XP. Quando scatta c'è un messaggio caldo sopra la barra, una novità alla volta.

Simulazione con le sole carte (`tools/unit.mjs`):

| Obiettivo giornaliero | Parole si apre | Frasi si apre |
|---|---|---|
| 5 parole | al 4° giorno | al 6° giorno |
| 10 parole | al 2° giorno | al 3° giorno |
| 20 parole | al 2° giorno | al 3° giorno |

Chi aveva già progressi o aveva già visto il benvenuto ha tutto aperto. Uno sblocco resta, e tra dispositivi vale «basta
uno» (`cp-ux-v1.unl`). Una scheda chiusa non si apre mai per sbaglio:

- `?go=` porta alla scheda aperta più vicina;
- «Cerca ovunque» mostra «si apre…»;
- lezioni e dialoghi della tappa si aprono in immersione;
- widget e scorciatoie di Android portano solo a Studia, ripasso e musica.

**Impostazioni** in una pagina con cinque riquadri (Aspetto, Suoni e musica, Studio, Dati e sincronizzazione, Informazioni) e la ricerca; ogni riquadro apre una pagina. Vedi
`docs/ux-architettura.md`.

## La grammatica del laboratorio: come si migliora

Il traduttore (cinese → italiano) è prudente: traduce solo quando conosce tutte le parole e la costruzione.
Altrimenti dice **«Non so ancora tradurre questa frase.»**, mostra la frase parola per parola e spiega che cosa gli manca.
Una traduzione può venire da tre posti, in quest'ordine:
1. la correzione dell'utente sul suo telefono (`✏️ tua traduzione`);
2. una frase verificata: `src/data/verified.js`, più le frasi già tradotte a mano negli esercizi, nei modelli, nelle frasi, nei dialoghi e nelle lezioni (`✓ frase verificata`);
3. le regole (`src/phrases/translate.js`) con le schede di `src/data/grammar.js`.

**Senza community:**
- `node tools/grammar.mjs 你喜欢什么` traduce una frase e, se non sa, dice perché;
- `node tools/grammar.mjs --copertura` dice quante frasi dell'app le regole sanno fare da sole e quali parole mancano più spesso: aggiungere quelle schede in `grammar.js` sblocca più frasi;
- `node tools/grammar.mjs --nuove frasi.txt` traduce una frase per riga e prepara le righe per `verified.js`, da rileggere una per una;
- ogni frase in `verified.js` è anche una prova: build e `#selftest` falliscono se una regola nuova cambia una traduzione verificata. Le frasi che le regole non sanno ancora fare si segnano `"memoria"` e il laboratorio usa la traduzione scritta a mano.

**Con la community:** sotto ogni traduzione c'è «✏️ La traduzione è sbagliata?» (o «Proponi la traduzione giusta»).
La proposta vale subito sul telefono di chi la scrive e si manda come gli altri contributi.
`node tools/merge-contrib.mjs arrivati/*.json --apply` la porta in `verified.js` come `"memoria"`: rileggila prima di applicarla.

**CC-CEDICT (solo durante lo sviluppo):** `node tools/cedict-check.mjs cedict_ts.u8.gz --out rapporto.md` confronta il nostro
pinyin con CC-CEDICT e mette accanto all'italiano il significato inglese, per rileggere. Il file non entra né nell'app né nel
repository: la sua licenza (CC BY-SA 4.0) obbligherebbe a ridistribuire i nostri dati con la stessa licenza. Nessuna
correzione è automatica: il primo giro ha trovato 7 pinyin sbagliati (es. 答应 dā.ying, 接种 jiē.zhòng), corretti a mano.
Lo stesso comando controlla anche il pinyin di **ogni frase** dell'app (frasi, dialoghi, Ordine del Pensiero, modelli, slot,
percorso: 678 frasi) tagliandola con CC-CEDICT, e i classificatori del correttore (`NCLF` in `src/phrases/grammar.js`) contro
le indicazioni «CL:». Con `--prova` aggiunge errori messi apposta, per vedere che il controllo li trova. Secondo giro: nessuna
sillaba né tono sbagliato nelle frasi, nessun classificatore diverso; corretti 5 significati italiani (取消, 信任, 清蒸, 蒸菜, 保守秘密).

## Pubblicare su GitHub Pages (pagina di presentazione + app)

`.github/workflows/pages.yml` lancia `node tools/build.mjs && node tools/site.mjs --out _site` e pubblica:

- alla radice, la **pagina di presentazione** `docs/index.html`, in italiano e in cinese (due versioni complete nella stessa pagina: la scelta è nitida, l'altra resta sfocata sotto come anteprima), con:
  - un solo invito all'azione («Apri l'app») e un piccolo lettore con tre brani dell'app (estratti in `docs/audio/`, ogni brano in `.ogg` e `.m4a`), che parte solo dopo un tocco;
  - il logo da toccare (le lettere con l'accento e le foglie suonano il loro tono) e tre microprove, «Provala qui» (orecchio ai toni, scrittura dei caratteri con Hanzi Writer, parole), che non salvano né inviano niente;
  - nel telefono in testa alla pagina e in ogni scheda delle funzioni, una clip in loop dell'app vera (`docs/img/clip-*.mp4` con il poster `.jpg`), che parte quando si vede e si ferma quando esce; con «riduci movimento» o il risparmio dati restano una foto e si avviano con un tocco. Le clip si registrano con `node tools/site-video.mjs` (Playwright e ffmpeg, dopo `node tools/build.mjs`) e stanno nel repository;
  - l'installazione per Android (APK, dal sito se c'è, altrimenti da GitHub; più avanti gli store), iPhone (tre immagini, `docs/img/ios-*.svg`) e computer;
  - domande frequenti e link a repository, privacy e sostegno.

  Nessuna risorsa esterna e nessun cookie: stile e script sono in `docs/assets/` (l'unico script in pagina è `assets/sito.js`, che carica da solo `prova.js` e le librerie quando la sezione sta per comparire),
  le librerie sono copie in `docs/assets/vendor/` con le licenze in `docs/licenze/` (lo controlla `tools/unit.mjs`). Anche `docs/404.html`, `robots.txt` e `sitemap.xml` (generati da `tools/site.mjs`) fanno parte del sito;
- **`privacy.html`**, ricavata da PRIVACY.md a ogni pubblicazione: è l'indirizzo pubblico della privacy che chiedono gli
  store (`https://mandarinoapp.org/privacy.html`);
- in `app/`, l'**app** (`dist/` appena costruito);
- `mandarino.apk` e `mandarino.apk.sha256`, scaricati dall'ultima Release a ogni pubblicazione (se non c'è una Release il sito esce senza e la pagina rimanda a GitHub).

L'immagine per le condivisioni (`docs/img/anteprima.png` 1200×630) la genera
`node tools/site.mjs --assets` con Playwright e stanno nel repository: rilancialo quando l'aspetto dell'app cambia molto.

Una volta sola: Settings → Pages → Build and deployment → Source: **GitHub Actions**. Poi la pubblicazione parte da sola
a ogni push sul ramo `main` che tocca l'app, la pagina o PRIVACY.md, a ogni nuova Release (il workflow «APK Android» lancia `pages` dopo averla creata) oppure a mano (Actions → pages → Run workflow). L'indirizzo è
`https://mandarinoapp.org/` (app in `…/app/`, pagina cinese in `…/zh/`): il dominio si imposta in Settings → Pages → Custom domain, con i record DNS descritti in [rilascio.md](rilascio.md). `SITE_URL` e `SHARE_URL` in
`src/config.js` puntano a quell'indirizzo: li usano i link dei sigilli, delle sfide e il QR delle carte.

## Pubblicare (Cloudflare Pages, il più semplice)

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → questo repository.
2. Build command: `node tools/build.mjs` (solo Node, nessuna dipendenza). Output directory: `dist`.
   I file pesanti (i brani, con l'impronta nel nome, e i «nomi e termini» del Lettore) non stanno nel repository dentro
   `dist/`: li genera la build dagli originali in `src/`. Anche `dist/index.html` è generato e non sta nel repository: la versione pubblicata
   (un file unico che funziona da solo) è su https://mandarinoapp.org/app/.
3. Dal telefono apri `https://….pages.dev` → menu del browser → «Aggiungi a schermata Home».

Su https il microfono chiede il permesso una volta sola; dopo il primo caricamento l'app funziona senza rete.
**Aggiornare:** basta `node tools/build.mjs` e un push: `APP_VERSION` cambia da solo e i telefoni vedono
«Nuova versione disponibile · Aggiorna». **Scaricare l'app come file:** `dist/index.html` (dopo `node tools/build.mjs`, o da https://mandarinoapp.org/app/) funziona da solo, anche offline.

**Nome del repository:** `longhitown/mandarino` (prima `m-ndar-n-`, perché GitHub aveva tolto gli accenti; i vecchi indirizzi,
le release e le API vengono reindirizzati). Il nome è in un solo punto, `MD_CONFIG.REPO` in `src/config.js`.

## Versione per gli store (Google Play, F-Droid)

Tutto quello che si può preparare prima di pubblicare sta in [docs/store/](store/README.md): firma, moduli,
F-Droid, tester. Niente viene pubblicato automaticamente.

- **Due versioni** (`productFlavors` in `android/app/build.gradle`), con lo stesso pacchetto e la stessa chiave:
  - `direct`: GitHub Releases, come prima;
  - `store`: senza controllo degli aggiornamenti dell'APK, senza sostegno né sigilli.

  Il codice web è identico: `src/config.js` legge la versione da `MandarinoAndroid.flavor()`. Nella schermata
  «App Android» si vede quale versione è installata.
- **API 36** (compileSdk e targetSdk, Android Gradle Plugin 8.11.1):
  - l'app va da bordo a bordo, e la WebView riceve come margine barre, ritaglio e tastiera;
  - il tasto Indietro usa `OnBackInvokedCallback` da Android 13 (con l'indietro predittivo di Android 16 `onBackPressed`
    non arriva più).

  Il CI prova l'APK in emulatori Android 14 e 16.
- **`.aab`**: la corsa «APK Android» allega `mandarino-store.aab` (circa 84 MB, sotto il limite di 200 MB del modulo
  base), l'APK store e le note di versione di quel `versionCode`. Sono solo artefatti, mai pubblicati.
- **Testi e immagini**: `fastlane/metadata/android/{it-IT,zh-CN}/` è la fonte unica. `node tools/store-assets.mjs`
  rigenera icona, immagine di presentazione 1024×500, quattro schermate per lingua e le schede `docs/store/*.md`.

## L'APK per Android (gratis, senza Play Store)

Ogni push che cambia l'app fa partire **GitHub Actions** (`.github/workflows/apk.yml`): costruisce `dist/`, controlla la grammatica,
costruisce l'APK, lo verifica con Android lint e `apksigner` e, sul ramo principale, lo pubblica come Release.
Il link da mandare a chi vuole l'app non cambia mai:

`https://github.com/longhitown/mandarino/releases/latest/download/mandarino.apk`

(il vecchio indirizzo con `m-ndar-n-` continua a funzionare: GitHub lo reindirizza). Chi lo apre sul telefono deve consentire
l'installazione «da questa fonte» la prima volta. Android 8.0 o più recente.

**La chiave di firma (una volta sola, poi mai più):** perché ogni nuova versione si installi sopra la vecchia senza perdere
i progressi, tutte le versioni devono essere firmate con la stessa chiave. Va messa nei segreti del repository:
Settings → Secrets and variables → Actions → New repository secret:
- `MD_KEYSTORE_B64`: il contenuto del file della chiave in base64;
- `MD_KEYSTORE_PASSWORD`: la sua password.

Senza segreti l'APK viene comunque costruito (si scarica dagli «Artifacts» della corsa) ma con una chiave di prova e non
viene pubblicato. **Conserva una copia della chiave fuori da GitHub**: se si perde, le versioni nuove non si installano
più sopra le vecchie (bisognerebbe disinstallare, dopo aver fatto il backup dei progressi).
Per crearne una nuova: `keytool -genkeypair -keystore mandarino.jks -storetype PKCS12 -alias mandarino -keyalg RSA -keysize 4096 -validity 18250`.

**In locale** (serve l'Android SDK): `node tools/build.mjs` e poi `gradle -p android assembleDirectRelease lintDirectRelease` (versione per gli store: `bundleStoreRelease`).

**Cosa c'è in più nell'APK** (tutto calcolato sul telefono, nessun server):
- **scorciatoie** (pressione lunga sull'icona): Studia ora, Orecchio ai toni, Jukebox; aprono `?go=study|ear|music`;
- **widget «Oggi»** 2×1 e 4×2, stile «Giada» (`TodayWidget.java`, `WidgetState.java`): sfondo verde con vetro smerigliato (senza sfocatura: i `RemoteViews` non la permettono) e quattro atmosfere
  scelte dall'ora, con gli stessi testi in italiano e in cinese (`w_g_*` in `values` e `values-zh`): **mattina 6–11** (riflesso d'alba da destra, sole al tratto, «Inizia la giornata»),
  **pomeriggio 12–16** (verde pieno, sigillo del grado), **sera 17–21** (riflesso arancione da sinistra, fiamma e pulsante più scuri, al posto della parola un proverbio),
  **notte 22–5** (quasi nero, luna, nessun pulsante: «Ottimo lavoro oggi. Riposa la mente.» o «A domani!»). In alto una striscia di dieci segmenti con l'obiettivo del giorno
  (`wt` = parole di oggi, `rank` = carattere del grado, mandati da `pwa/widget.js`); ripassi in scadenza dall'istogramma delle prossime 168 ore; la parola del giorno si scopre
  con un tocco. Un allarme inesatto (`setAndAllowWhileIdle`) ridisegna i widget ai confini di fascia (6, 12, 17, 22); nessun messaggio di perdita o di fretta;
- **widget «Pausa»** 4×1 (`PauseWidget.java`): giri di studio da 25 minuti e pausa caffè da 5. Un widget non si anima né si aggiorna ogni
  secondo, quindi il conto alla rovescia è un `Chronometer` in sola discesa (`setChronometerCountDown`) che Android fa scorrere da solo;
  un allarme (`AlarmManager`, preciso solo se il telefono lo consente senza permessi speciali) ai cambi di fase aggiorna il widget e
  manda un avviso. Fermo, mostra uno stato scelto dall'ora: «Riposo» di notte (22–6), «Pausa caffè a Xi'an» dalle 14 alle 18;
- **promemoria** facoltativo, spento finché non lo accendi da ⚙️ → Studio → 🔔 (il permesso delle notifiche si chiede solo allora;
  `AlarmManager`, nessuna libreria); si riprogramma dopo un riavvio;
- **musica in secondo piano** con notifica (pausa, avanti, stop) se la scegli nel pannello 🎵;
- **aggiornamenti**: una volta al giorno l'app guarda l'ultima Release su GitHub e propone «Nuova versione disponibile»
  (si spegne da ⚙️, nel riquadro dell'app Android).
Sul web (anche su iPhone) widget e promemoria non ci sono: la scorciatoia `?go=` e la card del giorno da condividere sì.

Come funziona dentro: la pagina è servita all'indirizzo `https://appassets.androidplatform.net/` (sempre lo stesso: è lì che
la WebView tiene i progressi). `src/pwa/android.js` ricostruisce sopra il ponte nativo le API web standard che la WebView
non ha: voce (`speechSynthesis` → motore di sintesi del telefono, anche offline se la voce è installata), riconoscimento
vocale (`SpeechRecognition` → riconoscimento del telefono), download dei backup (→ cartella Download), condivisione, tasto
Indietro. Il resto dell'app non sa di essere dentro un APK.

## Il corso di italiano per chi parla cinese

Si sceglie dal benvenuto («我是中国人，我想学意大利语») o da ⚙️ → Studio → Corso · 课程; per tornare indietro, stesso posto.
I due corsi hanno progressi separati. Le schede: 课程 (51 lezioni in cinese, `src/data/it/lessons/` e `lessons-x/`), 单词 (4780 parole: quelle delle schede di
`src/data/grammar.js`, con coniugazioni complete, più `src/data/it/lexicon.js` generato da `node tools/itlex.mjs morph-it.txt`:
nomi con genere e plurale, aggettivi, verbi, espressioni; ogni parola con una frase d'esempio italiano → cinese), 复习
(ripasso FSRS), 变位 (coniugazioni), 句子 (frasi, dialoghi bilingui, esercizio 句子练习 sulle frasi d'esempio e **句子检查**,
il correttore di frasi italiane, `src/it/checker.js`).

**Il correttore** controlla solo ciò che sa controllare con sicurezza, con il lessico del corso e la morfologia di
`phrases/italian.js`: articolo e nome (la libro → il libro, il studente → lo studente), preposizioni articolate (a il → al),
numero e nome (due libro → due libri), possessivi e dimostrativi (il suo casa → la sua casa, la mia madre → mia madre),
aggettivi (la casa bianco, lei è alto), soggetto e verbo (io parla, io parlare, i ragazzi parla), «piacere» (io piace il tè →
mi piace il tè), ausiliare e participio (ho andato, lei è andato, mi ho alzato, sono fame), nazionalità in minuscolo e accenti
dimenticati (citta → città). Spiega l'errore in cinese e propone la frase corretta da ascoltare. Non giudica senso e ordine
delle parole, e lo dice. La regola d'oro è non dare falsi allarmi: `tools/e2e.mjs` gli passa tutte le 6427 frasi italiane
dell'app (giuste) e la prova fallisce se ne segnala anche una sola.

**Le lezioni di grammatica, in sviluppo** (`node tools/lezioni-check.mjs cartella --out rapporto.md`; la cartella contiene CC-CEDICT e le frasi di
[Tatoeba](https://tatoeba.org) in cinese e in italiano con i loro legami, scaricabili gratis: gli indirizzi sono in cima allo strumento). Per
ogni frase di esempio, errore tipico, risposta dei quiz e battuta dei mini-dialoghi controlla che ogni parola sia in CC-CEDICT o nel nostro
vocabolario; che la frase compaia identica in Tatoeba (e mette accanto la traduzione di Tatoeba, per confrontarla con la nostra); che un
errore tipico non sia invece una frase che Tatoeba usa davvero; e un elenco corto di costruzioni che nessun manuale accetta. Non corregge
niente e non sostituisce un madrelingua: dà qualcosa da guardare. Nessuno dei due archivi entra nel repository (licenze CC BY-SA e CC BY).
Le lezioni oltre la trentesima stanno in `src/data/lessons-x/` (cinese) e `src/data/it/lessons-x/` (italiano): quelle del cinese sono un gruppo (`LEZIONIX` in
`tools/build.mjs`) che si carica la prima volta che si apre l'elenco o si cerca (`CP.lessonsMore()`), quelle di italiano seguono il corso di italiano; così
l'avvio non cresce con le lezioni. L'ortografia dell'italiano si controlla con Hunspell (`tools/hunspell-check.py`) e Morph-it!.
Una lezione può avere un **mini-dialogo** (`"dlg": [["A", "cinese", "italiano"], …]`, da 3 a 8 battute; nel corso di italiano
`["A", "italiano", "cinese"]`) e ogni cinque lezioni c'è un **ripasso** (`rip-1`, `rip-2`…), fatto a sorte con le domande dei quiz delle cinque
lezioni: non ha contenuti suoi da verificare.

**L'italiano è controllato due volte, in sviluppo** (i file esterni non entrano nel repository):
```
node tools/morphit-check.mjs morph-it_048.txt --dump da-controllare.txt   # Morph-it: genere, numero, persona di ogni forma
python3 tools/hunspell-check.py cartella/it_IT da-controllare.txt        # Hunspell di LibreOffice: ortografia di ciò che Morph-it non ha
```
Primo giro: nessuna forma sbagliata nelle regole; trovato un errore nei dati (鸡蛋 «uovo» segnato femminile), corretto.

## Prove

```
node tools/build.mjs        # costruisce dist/ e controlla dati, lezioni e frasi verificate
node tools/grammar.mjs      # solo le frasi verificate della grammatica
node tools/unit.mjs         # prove unitarie: taglio in parole, unione dei backup e della sincronizzazione, peso dell'avvio
node tools/e2e.mjs          # 81 prove su dist/ (benvenuto e test di livello, corso di italiano e correttore, immersione, sincronizzazione, QR, sigilli, musica e loop, testi cinesi senza italiano), ~7 minuti
node tools/misura-avvio.mjs # apertura a freddo con CPU 4× e costo dei gruppi al primo uso (non fa parte di `npm test`)
node tools/ux-audit.mjs     # 0 problemi attesi (anche: un solo pulsante primario per schermata, menu ≤ 7 voci); --quick = 360×740 chiaro
node tools/lang-audit.mjs   # rapporto sui testi italiano/cinese: chiavi, segnaposto, punteggiatura, refusi tipici
```
Tutte insieme: `npm test`. Le stesse girano in GitHub Actions a ogni push (`web.yml`). Se l'e2e (o la prova nell'emulatore) fallisce, la CI la ripete una volta sola e segnala un avviso: un guasto vero fallisce due volte, un'incertezza del browser di prova no. Le prove che ricaricano la pagina usano il server locale, non `file://` (lì Chromium non conserva sempre il localStorage).
**Golden del ripasso.** `tools/fixtures/study-classic-v1.js` è una copia fissa di `src/study/study.js` di prima
dell'introduzione degli esercizi vari: `tools/e2e.mjs` fa la stessa sessione (profilo e seme fissi) con l'app in stile «Classico» e con la copia, e
controlla che le 40 schermate (coda, carte pi / ip / hp, voti) siano identiche. Non va nell'app.
In più, dentro l'app: aggiungi `#selftest` all'indirizzo (25 controlli, tutti verdi). `#dev` accende il modo sviluppatore
(in ⚙️ compare «Scarica pacchetto PWA per GitHub»), `#nodev` lo spegne.

**Sul dispositivo Android:** a ogni push GitHub Actions avvia anche un emulatore Android 14 vero (job «dispositivo») e
`tools/android-smoke.mjs` controlla dentro la WebView dell'APK: caricamento all'origine dell'app, `#selftest`, backup in
Download con UTF-8 intatto, permesso del microfono, dati che restano dopo la chiusura forzata, tasto Indietro, scorciatoie,
apertura su un'azione, stato del widget, promemoria, nessun crash.
In locale, con un telefono collegato in debug USB: `node tools/android-smoke.mjs android/app/build/outputs/apk/direct/debug/app-direct-debug.apk`.
Per il controllo «nessun attributo senza CP.attr», in revisione: `grep -rnP "[a-z-]+=\"' \+ (?!CP\.attr)" src`
deve mostrare solo numeri, id interni e classi.

Da fare a mano, su un telefono vero (non si possono simulare qui):
- volume al 50%: il tap si sente, 10 tap di fila non danno fastidio; la musica si abbassa quando parla la voce;
- Lighthouse «Installable» sull'indirizzo https; avvio in modalità aereo;
- iPhone, app aggiunta alla Home: se il riconoscimento vocale manca, il 🎤 deve diventare «Registra e confronta».

## Contributi della community

Chi usa l'app corregge pinyin, italiano o nota di una parola, di una frase o di una battuta (mai i caratteri: sono la
chiave dei progressi), segnala un errore o propone una parola nuova. La correzione si vede subito nella sua copia
(«✏️ tua correzione») e si annulla da ⚙️ → Dati e sincronizzazione → Contributi. Si manda con Condividi (WeChat, WhatsApp…), email o file `.json`;
GitHub Issue è attivo (`repo` in `var CFG` di `src/contrib/contrib.js`); email e Modulo Google compaiono quando li configuri lì.

**Le issue si controllano da sole** (`.github/workflows/contrib.yml`): a ogni issue che contiene una patch, l'Action mette
l'etichetta `contributo`, lancia `merge-contrib.mjs` a secco e risponde con il riepilogo (da applicare, segnalazioni,
doppioni, conflitti, scartati). Se aggiungi tu l'etichetta `applica`, applica le voci valide, ricostruisce `dist/`, controlla
la grammatica e apre una pull request dal ramo `contributo/issue-N`: niente entra nel ramo principale senza che tu la unisca.
Una volta sola: Settings → Actions → General → «Allow GitHub Actions to create and approve pull requests».
(Le pull request aperte da un'Action non fanno partire le altre Action: per le prove, chiudi e riapri la PR o lancia i workflow a mano.)

```
node tools/merge-contrib.mjs arrivati/*.json            # riepilogo: da applicare, segnalazioni, doppioni, conflitti, scartati
node tools/merge-contrib.mjs arrivati/*.json --apply    # scrive in src/data/ solo le voci valide (poi: node tools/build.mjs)
```

**Come aiutare senza programmare:** [CONTRIBUTING.md](../CONTRIBUTING.md), in italiano e in cinese: rileggere frasi, segnalare
pinyin sbagliati, proporre parole, rileggere il cinese del corso di italiano. Le issue hanno tre modelli
(`.github/ISSUE_TEMPLATE/`: correzione, parola nuova, traduzione) con le etichette `correzione`, `parola-nuova`,
`traduzione`. Si mette `good first issue` sulle issue piccole e chiare: GitHub la mostra a chi cerca da dove iniziare.

**Nei Crediti, solo se lo chiedono.** Nel modulo dei contributi c'è la casella «Voglio comparire nei Crediti con questo
nickname», spenta di base. Se è spuntata, la patch porta `credit: 1`. Con `--apply`, `merge-contrib.mjs` aggiunge il
nickname a `src/data/contributors.js` (il foglio Crediti dell'app) e a [CONTRIBUTORS.md](../CONTRIBUTORS.md), ma solo se
almeno una sua voce è stata applicata, e mai un nickname con `@` o un indirizzo web. La build controlla che i due elenchi
coincidano. Per togliere qualcuno: lo cancelli a mano da tutti e due.

**Novità.** ⚙️ → Informazioni → 🆕 Novità mostra `src/data/changelog.js`: a ogni versione aggiungi in cima una
voce `{ v, d, it: [...], zh: [...] }` con righe brevi per chi studia. La build si ferma se le due lingue non hanno lo stesso
numero di righe.

## Chiavi salvate (tutte `cp-*`, tutte con una regola nel ripristino «unisci»)

Chiavi aggiunte con gli esercizi vari e la lettura:

- `cp-ex-v1`: `{ units: {id: {passo, verifica}}, ex: {parola: {tipo: {n, ok, ultimo}}}, read: {id: data} }`; nell'unione il passo più avanzato, la verifica più recente, per ogni tipo la voce con `n` più alto (mai la somma), i testi letti uniti.
- `cp-ex-style`: lo stile di ripasso (`guided`, `mixed`, `classic`); `cp-ex-dur`: durata del passo guidato (5, 10, 15). Preferenze del dispositivo.
- `cp-class-v1`: i pacchetti classe importati `{ p: { id: pacchetto }, x: { id: quando è stato tolto } }`; nell'unione si sommano (per ognuno la data d'importazione più vecchia) e chi è stato tolto resta tolto.
- `cp-it-cards-v1`: i traguardi del corso di italiano `{ m: { id: data } }`; nell'unione, per ognuno la data più vecchia.
- `cp-labrad-v1`: le scoperte del Laboratorio dei radicali `{ f: { carattere: quando } }`; nell'unione si sommano, per ognuna la data più vecchia.
- `cp-card-v1`: formato, colore e nome facoltativo delle carte da condividere; preferenza del dispositivo.
- `cp-pleco-v1`: «1» se è acceso il collegamento a Pleco; preferenza del dispositivo (vince quello corrente).
- `cp-contrib-credit-v1`: «1» se chi contribuisce vuole comparire nei Crediti; preferenza del dispositivo (nell'unione vince quello corrente, come `cp-contrib-nick`).
- `cp-seal-v1`: i sigilli di gratitudine; i codici si uniscono tra dispositivi, le preferenze (titolo, nome, condivisione) vengono dal dispositivo più recente.
- `cp-it-game-v1`: punti e serie del corso di italiano, stessa struttura e stessa unione di `cp-game-v1`.
- `cp-game-v1.pl` / `cp-it-game-v1.pl`: punti del test di livello; nell'unione vale il più alto, −1 = annullato.
- Nuove voci in `cp-ux-v1`:
  - `unl` e `showAll`: sblocchi, uniti con «basta uno»;
  - `unlv`: segna che il profilo è già passato alla rivelazione progressiva;
  - `pl`: riepilogo del test di livello;
  - `purpose`: lo scopo scelto nel benvenuto.
- Record di ripasso con `pl:1`: segnati come noti dal test di livello.

Chiavi dei contributi: `cp-community-contribs` (unione per id, vince la voce più recente; contiene anche le traduzioni proposte, tipo `tr`),
`cp-lessons-v1` e `cp-it-lessons-v1` (lezioni: per ognuna il punteggio migliore, la prima volta superata, l'ultima letta),
`cp-it-srs-v1` (ripasso del corso di italiano: per ogni parola vince la scheda ripassata più di recente),
`cp-course`, `cp-it-tab`, `cp-it-welcome` (preferenze del dispositivo), `cp-ux-v1` (benvenuto, legenda,
suggerimenti; unione), `cp-haptics`, `cp-sfxvol`, `cp-jkmood`, `cp-jkauto`, `cp-toneshapes`, `cp-contrib-nick`,
`cp-lang` (preferenze del dispositivo: vince quello corrente). `cp-game-v1.days[giorno]` ha due campi nuovi:
`nw` (parole nuove introdotte) e `nx` (permesso extra «Ancora 5 parole»). Il formato del backup resta `{app:"mandarino", v:5, kv, log}`.

## Sincronizzare e cambiare telefono

⚙️ → Dati e sincronizzazione → Sincronizzazione. **File nel proprio cloud:** si sceglie (o si crea) un file `mandarino-sync.json` in una cartella di Drive,
Dropbox, OneDrive…; l'app lo riscrive dopo ogni sessione e lo riunisce all'avvio con le regole del ripristino «unisci»
(su Android con il selettore di documenti del sistema, sul computer con l'API File System Access; altrove a mano).
**Passaggio con i QR:** il telefono vecchio mostra una sequenza di QR, il nuovo la inquadra: nessuna rete, nessun account.
I punti si sommano per dispositivo (`xpBy`), così le due copie non si contano due volte.

## Sostegno volontario e sigilli di gratitudine

⚙️ → Informazioni → **Sostieni il progetto** (`src/ui/seals.js`) contiene:

- due righe sul perché;
- un link a Ko-fi (`MD_CONFIG.SUPPORT_URL`), aperto solo da un tocco;
- la riga sui sigilli;
- la trasparenza: l'app non sa chi sei e non invia nulla.

Non ci sono importi, contatori, pop-up o inviti che si ripetono. `.github/FUNDING.yml` mette il link anche su GitHub; il
pulsante nel README è un SVG locale (`docs/img/sostieni.svg`), senza immagini né script di Ko-fi.

**I sigilli** (支 Sostegno, 交 Cultura, 永 Custodire) sono disegnati in SVG e solo estetici:

- arrivano come codice firmato da chi gestisce il progetto (`MDS1.…`, ECDSA P-256, verificato offline con WebCrypto in
  `src/core/seal-code.js`);
- si riscattano dal link `#seal=…`, incollando il codice o inquadrando il QR, sempre con una conferma;
- nell'app si mostrano in grande; nelle immagini condivise solo se la persona lo sceglie; dietro il frutto all'avvio.

L'emissione si fa sul computer di chi gestisce il progetto con `tools/seal-keygen.mjs` e `tools/seal-issue.mjs`: simulazione per
default, registro privato fuori dal repository, invio delle e-mail a mano. La procedura è in
**[docs/sigilli.md](sigilli.md)**.

Con `MD_CONFIG.SEAL_PUBKEYS` vuoto (com'è ora) la parte «Riscatta» non compare. Con `FEATURE_DONATE` e `FEATURE_SEALS`
spenti (versione per gli store) non compare nulla.

La build si ferma se trova nel repository:

- un file di chiave (`.pem`, `.key`, `.jks`);
- una chiave privata;
- un token, un webhook o un campo delle notifiche di Ko-fi in `src/` o nel file unico.

## Corso di italiano: punteggio, «今天» e carte da condividere

- **Punti per corso** (`cp-it-game-v1`, stessa struttura e stessa unione del cinese):
  - parola nuova 10, frase 15, lezione superata 30, esercizio di coniugazione 3;
  - gli stessi gradi del cinese (nomi cinesi) con l'estensione oltre i 10.000 punti, serie e giorno di riposo.

  Chi aveva già studiato parte dai punti che i suoi progressi valgono: 10 per parola e 30 per lezione, una volta sola.
- **Carta «今天»** in cima a 课程 (`src/it/today.js`):
  - saluto in cinese e in italiano e un solo pulsante primario («继续：第 N 课 · titolo», con i minuti stimati);
  - anello dell'obiettivo e serie, sigillo del grado con la barra;
  - «复习 N 张», solo se ci sono carte in scadenza;
  - «今日意大利语»: una frase scelta in modo deterministico tra gli esempi delle lezioni superate (o delle prime tre
    all'inizio), con la sillaba accentata in evidenza dove l'ortografia la segna (città, è).

  Sotto, le lezioni sono un **percorso**: nodi collegati, la corrente in evidenza, «通过» sulle superate.
- **Momenti di piacere**, tutti con la versione ferma per `prefers-reduced-motion`:
  - «+N 分» che sale dopo ogni esercizio, con il sigillo e la barra verso il grado successivo;
  - «通过» che si imprime alla fine di una lezione superata.
- **Traguardi** (`cp-it-cards-v1`; nell'unione vale la prima data):
  - primo gradino, 7/30/100 giorni di fila, 100/500/1000 parole, nuovo grado, tutte le lezioni;
  - il «分享纪念卡» compare dentro il messaggio di congratulazioni già mostrato (`CP.toast(msg, azione)`), mai una
    finestra in più;
  - chi li aveva già raggiunti prima di questa versione li ritrova segnati, senza una pioggia di messaggi.
- **«我的进步»**: il racconto della settimana (`CP.story`), la raccolta «纪念卡» se c'è almeno un traguardo, «分享».
- **Carte da condividere** (`src/ui/share-card.js`, `CP.shareCard.templates`). Lo stesso motore fa la carta del giorno del cinese
  (`zh-day`: grado, tre numeri, parola del giorno, testo in italiano; con gli stessi selettori di formato, colore e firma di quelle di
  italiano) e tre carte del corso di italiano: del giorno, del traguardo, della settimana.
  - Formati 3:4 (1080×1440, predefinito), 4:5 e 9:16; tre colori, i temi dell'app.
  - Contenuto: logo e nome, sigillo e grado, tre numeri, «今日意大利语», data in cinese, «署名» facoltativo (spento di
    base, solo sul telefono: `cp-card-v1`), «màndarínō · 免费 · 离线 · 无广告 · 无需注册» e il QR.
  - **QR**: `MD_CONFIG.SHARE_URL`, oppure, se vuoto, il link all'ultimo APK. Scuro su bianco, 22% della larghezza, mai
    parametri. Le prove lo rileggono con jsQR.
  - Il sigillo di gratitudine compare solo se la persona ha scelto di mostrarlo.
- **Niente spinte**: «分享» c'è solo nella carta «今天», in «我的进步» e alla fine di lezioni e ripasso. Niente pop-up,
  notifiche, conteggi o classifiche: l'app non sa se qualcuno condivide.
- **In Cina**: la pagina cinese `docs/zh/` (con l'indicazione per il browser di WeChat) e le verifiche da fare sono in
  [docs/cina.md](cina.md).
- **Tutti i testi del corso passano da `t()`**, in `src/i18n/it-course.js`, in cinese e in italiano. La build si ferma
  se in `src/it/` compare di nuovo del cinese scritto nel codice.
- **Avvio leggero**: nel file unico il corso di italiano (`i18n/it-course.js`, `it/today.js`, `it/course.js`) si esegue
  solo quando è il corso scelto (`COURSE_IT` in `tools/build.mjs`). La scelta del corso sta in `it/switch.js`.

## Ritorno quotidiano

- **Giorno di riposo**: un giorno saltato a settimana (da lunedì a domenica) non spezza la serie, purché non siano due di
  fila. È gratuito e automatico, e nella settimana del Percorso si vede con ☾ e una frase gentile. Si calcola solo dai
  giorni attivi (`CP.game.rest()`, in `src/core/game.js`), quindi vale anche dopo l'unione tra dispositivi.
- **Oltre i 10.000 punti**: altri quattro gradi e poi una stagione ogni 10.000 punti (`SEASON`), in tutti e due i corsi:

  | Punti | Grado |
  |---|---|
  | 15.000 | Calligrafo d'Inchiostro 墨韵书家 |
  | 22.000 | Viandante dei Classici 经典行者 |
  | 30.000 | Saggio del Fiume Giallo 黄河贤者 |
  | 40.000 | Maestro dei Quattro Mari 四海宗师 |
  | 50.000 e oltre | «stagione 2», «stagione 3»… (第 2 季) |
- **Progressi in evidenza** in Studia (`src/study/story.js`, `CP.story`): un riepilogo gentile della settimana, le parole
  sicure, i ripassi riusciti delle ultime sei settimane e il tono che dà più filo da torcere (dalle parole mancate negli
  ultimi 60 giorni). I numeri tecnici (memoria, matrice dei toni) restano sotto, in un riquadro chiuso. Lo stesso modulo fa
  la pagina 我的进步 del corso di italiano.
- **Taccuino del viaggiatore** (corso di cinese; `src/ui/diary.js`, `src/data/diary.js`, `src/i18n/diary.js`,
  `src/styles/diary.css`). Un viaggio immaginario Roma → Guilin: 11 città, ognuna si apre quando sono finite abbastanza
  tappe del Percorso (`th` in `DIARY.stops`, contate da `CP.pathDoneCount`). Gli sbagli non tolgono niente: se la persona
  ha davvero scambiato una coppia, sulla pagina della città compare l'aneddoto scritto a mano (`DIARY.notes`, 72 righe
  italiano/cinese, ogni membro controllato con il vocabolario da `tools/unit.mjs`). Come si sa che l'ha scambiata:
  `cp-ex-v1.conf` (scritto da `CP.exConf`, in `study/memory.js`) tiene `«a|b»` quando in una scelta multipla (significato,
  parola, ascolto, frase a buco, buco grammaticale) la risposta giusta era a e si è scelta b, e `«a|~N»` quando al posto
  del tono di a si è scelto il tono N (esercizio «tono», pinyin a una sillaba, orecchio e sprint: `CP.confuse`). Si
  tengono le 300 coppie più recenti; l'unione tra dispositivi non somma mai (`mergeEx`). Per aggiungere un aneddoto basta
  una riga in `DIARY.notes` con i membri come nel vocabolario. La mappa è un SVG disegnato nel codice con un tremolio
  fisso: nessuna libreria (rough.js non serve). Una pagina diventa un'immagine con il modello `zh-diary` di
  `ui/share-card.js` (3 formati, 3 colori, QR), solo dal tocco su «Condividi questa pagina». Niente esce dal telefono.
- **Taccuino del viaggiatore, corso di italiano**: `CP.diary.card("it")` / `open("it")`, stesso modulo; le città sono quelle di `DIARY.stops` in ordine inverso con le soglie `DIARY.itTh` (lezioni superate, ≥ 80 % o `done`, da `cp-it-lessons-v1`) e le righe a mano `DIARY.itLines`; le frasi della pagina sono i primi tre `ex` della lezione che ha aperto la città. Niente `cp-ex-v1.conf` e niente condivisione.
- **Scambio linguistico** (`src/ui/scambio.js` + `src/i18n/scambio.js`, caricati al primo uso di `CP.scambio`; `src/ui/scambio-stub.js` è la sezione sempre presente in ⚙️ → Suoni e musica): consenso in `md-voice-consent` (senza `cp-`, fuori dai backup), registrazioni in IndexedDB `mandarino-voices-v1` (store `rec`, chiave `ref|lingua|n/x`), `MediaRecorder` su `CP.micStream()` con rilascio garantito, invio con `CP._zip` (il file si prepara in anticipo, `send("mail")` usa `navigator.share` con il file o ripiega su download + `mailto:`, solo con `consent()` completo: ho capito, 18 anni, pubblicazione). Serie a caso di 10 (7 frasi + 3 parole, `w:<parola>`) da `PHRASES`, `DIALOGS`, `EXAMPLES` e dal vocabolario (riferimenti di `tools/review-sample.mjs`).
  Anteprime dei link (Open Graph, 1200×630, tutto l'essenziale nel quadrato centrale di 630 px perché WhatsApp e WeChat ritagliano): `node tools/site.mjs --anteprime` rigenera `docs/img/anteprima.png` e `manifesto-og.png`. Pagina del sito `docs/partecipa-voci.html` (copiata da `tools/site.mjs`, esclusa da `robots.txt` e dalla sitemap). Specifica e decisioni: `docs/scambio-linguistico.md`.
- **Prove su un telefono vero**: [docs/checklist-dispositivo.md](checklist-dispositivo.md).

## Laboratorio dei radicali (solo corso di cinese)

Frasi → Impara → Radicali (`src/phrases/radicali.js`, gruppo `LABRAD`, letto al primo uso come il gruppo degli esercizi). Un banco da
laboratorio con due posti: si mettono due componenti dei caratteri come elementi chimici e, se formano un carattere del
vocabolario, «reagiscono»: il carattere compare, i suoi tratti si disegnano uno dopo l'altro (colorati per componente), poi
pinyin, significato e una **lettura simpatica**. Se non reagiscono, una battuta gentile: niente penalità, niente punti, niente serie.
Il solo contatore è la collezione («Elementi scoperti», chiave `cp-labrad-v1`, unione con la data più vecchia). Ogni scoperta ha una
carta da condividere (`ui/share-card.js`, modello `zh-rad`: gli stessi formati, colori, QR, firma facoltativa e sigillo delle altre carte).

- **Ricette.** `tools/radicali.mjs` le ricava da `src/data/anatomy.js` e dal vocabolario e scrive `src/data/lab-recipes.js`: un carattere
  del vocabolario è una ricetta se la sua scomposizione è fatta di due componenti (`⿰` a fianco, `⿱` sopra e sotto). Le forme strette
  (亻, 氵, 扌…) valgono come i radicali di `src/data/radicals.js`; un componente fatto di due caratteri uguali (木木) vale il carattere
  che già c'è (林). `node tools/radicali.mjs --check` (e `tools/unit.mjs`) dicono se il file è aggiornato; si rilancia dopo aver aggiunto parole.
  Il file resta sotto la LGPL 3.0 o successiva di Make Me a Hanzi (`THIRD-PARTY-NOTICES.md`).
- **Elementi e composti.** Gli elementi della mensola sono i componenti che non si scompongono ancora (più i radicali Kangxi); i caratteri
  scoperti che sono a loro volta componenti (林 → 森, 你 → 您) compaiono sulla mensola come «composti». La mensola comincia da 18 pezzi
  famosi e se ne aggiungono altri 18 a ogni tocco su «Altri elementi». «Suggerimento» segna con • chi reagisce con l'elemento sul banco.
- **Letture simpatiche.** `src/data/lab-readings.js`: più di cento combinazioni scritte a mano, in italiano e in cinese. Sono battute, **non
  etimologie**: l'app non racconta come sono nati i caratteri (vedi «Anatomia del carattere», qui sotto) e il Laboratorio lo dice sempre accanto
  alla lettura e nella carta. Si parla solo di ciò che i dati confermano (nomi dei componenti da `radicals.js` e dal vocabolario), mai di storia
  o d'origine; tono gentile, mai a spese di una persona. `tools/unit.mjs` controlla che ogni lettura abbia le due parti giuste e non usi parole
  da etimologia. I testi cinesi aspettano un madrelingua (`docs/rilettura.md`). Per aggiungerne una: una riga `"carattere": ["parti", "italiano", "cinese"]`.
- **Gesti.** Pointer Events a mano, senza libreria (nessuna dipendenza in più nell'app): il tocco mette l'elemento nel primo posto libero
  (funziona sempre, anche con la tastiera e i lettori di schermo); il mouse trascina subito, il dito dopo una pressione breve (così la pagina
  continua a scorrere). Movimento ridotto: nessuna animazione, i tratti compaiono già disegnati. Suoni solo dopo un tocco; nessuna richiesta di rete.
- **Prove.** `tools/unit.mjs` (ricette aggiornate, letture coerenti, chiavi dei testi, unione dei salvataggi, peso dell'avvio), `tools/e2e.mjs`
  (apertura, reazione riuscita, reazione a vuoto, trascinamento, movimento ridotto, carta, cinese, rete) e `tools/ux-audit.mjs` (banco vuoto,
  reazione, nessuna reazione).

## Anatomia del carattere (solo corso di cinese)

Nel foglio di ogni carattere (non sul fronte della carta di studio) c'è «Di che cosa è fatto» (`src/words/anatomy.js`):

- il carattere disegnato in SVG con le linee centrali dei tratti, colorate per componente;
- i componenti del primo livello come pulsanti. Per i caratteri fonetico-semantici, la grande maggioranza, si dice
  quale parte dà il **significato** e quale il **suono**; poi il radicale con il suo numero Kangxi;
- un tocco su un componente apre il suo foglio della famiglia: le altre parole che lo contengono e, se il componente è
  scomponibile, la sua anatomia.

Solo la struttura: nessuna «storia» del carattere. I dati non hanno una fonte affidabile per raccontarla, e le etimologie
popolari spesso sono false. Nella lavagna, con la guida accesa, si evidenzia il componente del prossimo tratto.
Interruttore: ⚙️ → Studio → Anatomia dei caratteri (acceso di base).

**Dati.**
- `src/data/anatomy.js` (129 KB, letto solo al primo uso) nasce da `tools/anatomy.mjs` e dal file `dictionary.txt` di
  Make Me a Hanzi. La verifica:
  - `strokes.js` contiene solo le linee centrali dei tratti;
  - la scomposizione sta in `dictionary.txt`, che **non** viene da CC-CEDICT, ma da Unihan e CJKlib, sotto **LGPL 3.0 o
    successiva** (COPYING del progetto). Il campo `matches` dice a quale componente appartiene ogni tratto.

  Si tengono solo decomposizione, radicale, tipo, parte fonetica e semantica e `matches`; non definizioni, pinyin e
  «hint». Ci sono 2517 caratteri: i 2146 del vocabolario più i loro componenti. 25 caratteri del vocabolario sono
  semplici (人, 女, 一…).
- `src/data/radicals.js`: i 214 radicali Kangxi con le varianti; nomi e significati scritti da noi, **da rileggere**.
- La build controlla che ogni carattere del vocabolario abbia una struttura; `#selftest` controlla 国, 好 e 请.

## Sfide e classe, senza server (tutti e due i corsi)

In ⚙️ → Studio → «🎯 Sfide e classe», e con il pulsante «🎯 Sfida un amico» nel Percorso (corso di cinese) e in
«我的进步» (corso di italiano).

**Sfida a un amico** (`src/ui/challenge.js`).
- Dieci parole (tra quelle già studiate, a caso; se sono poche, le prime del corso) e un seme diventano un codice
  `MDC1-…`: base64url di `1|corso|seme|chiavi`.
- Chi lo apre fa la stessa sfida: stesse domande, stesso ordine, stesse quattro risposte tra cui scegliere. Tutto viene
  dal seme e dalle dieci parole: le risposte sbagliate sono le altre parole della sfida, quindi niente dipende dalla
  versione del vocabolario.
- Il codice viaggia in tre modi:
  - come link `…#sfida=MDC1-…`, dove l'app ha un indirizzo web (la pagina aperta nel browser, o `SITE_URL` + `app/`).
    Il frammento non arriva a nessun server e si toglie subito dall'indirizzo;
  - come testo da incollare (va bene anche il messaggio intero);
  - come QR da inquadrare nell'app (⚙️ → Studio → Sfide e classe → Inquadra il QR).
- Corso di cinese: carattere e pinyin → significato in italiano. Corso di italiano: parola italiana → caratteri.
- Un codice dell'altro corso propone di passare a quel corso; un codice con parole sconosciute chiede di aggiornare l'app.
- La sfida non tocca i ripassi né i punti. Dentro il codice non ci sono nomi né punteggi; «Rilancia la sfida» manda lo
  stesso codice con una riga sul proprio risultato, scritta in chiaro nel messaggio.
- Nell'APK non c'è un indirizzo web finché `SITE_URL` è vuoto: si manda il codice, che si incolla o si inquadra.

**Pacchetto classe** (`src/ui/classroom.js`).
- Chi insegna sceglie:
  - un tratto del Percorso: tappe del corso di cinese, lezioni del corso di italiano;
  - un obiettivo (50, 80 o 100% del tratto; predefinito 80%, `GOAL_DEFAULT`);
  - una data.
- Ne escono tre cose:
  - il codice `MDK1-…` (base64url del JSON `{ id, c, t, s, e, g, d }`; le tappe si indicano per id, la prima e l'ultima);
  - il file `.json` con lo stesso contenuto;
  - un **foglio da stampare** (PNG A4 a 150 dpi) con due QR: l'app (lo stesso indirizzo della carta da condividere) e il
    pacchetto (il link `#classe=`, o il codice se non c'è un indirizzo web).
- Chi studia lo importa (file, codice o QR) e vede il riquadro «👩‍🏫 Classe: …» in cima al Percorso o alle lezioni, con
  l'avanzamento e i giorni che mancano.
- **Riepilogo per chi insegna**, solo dopo una spunta di consenso. Contiene solo conteggi:
  - parole del tratto studiate (corso di cinese) o lezioni superate (corso di italiano);
  - obiettivo raggiunto sì/no;
  - giorni di studio negli ultimi 30;
  - data e versione.

  Il nome è facoltativo e finisce solo nel file. Niente registro dei ripassi.
- Chi insegna apre insieme più riepiloghi (`.json`) e li vede in una tabella; i file non vengono salvati.

**Peso.** I due moduli e i loro testi (`src/i18n/together.js`) si caricano al primo uso (`LAZYMOD` in `tools/build.mjs`).
All'avvio c'è solo `src/ui/together.js`: la sezione in ⚙️, i link e il riquadro.

## Esercizi vari e stile di ripasso

⚙️ → Studio → «Stile di ripasso»:
- **Guidato** (consigliato a chi comincia): il ciclo «impara, esercitati, verifica», una tappa alla volta;
- **Misto**: esercizi vari al posto dell'autovalutazione;
- **Classico**: le carte di prima, con «La so / Non la so», identiche riga per riga (prova golden).

`EX_DEFAULT_STYLE` (`src/ui/ex-stub.js`) sceglie Guidato per chi non ha progressi e Misto per chi ne ha, la prima volta che
serve. La scelta resta in `cp-ex-style` (preferenza del dispositivo).

**Come funziona.**
- **Nessun motore parallelo.** La coda, i tempi, «Esci», la barra e il voto restano quelli di `src/study/study.js`.
  Negli stili Misto e Guidato le carte di prova portano `e.ex`, e la carta la disegna `src/study/exercises.js`
  (`CP.exEngine`). Il voto passa sempre da `CP.grade`, con il tipo di esercizio in `meta.type`; FSRS non cambia.
- **Tipi di base:**
  - riconoscimento: `mc-significato`, `mc-parola`, `mc-pinyin`;
  - misto: `mc-ascolto` (solo se c'è una voce cinese) e `tono` (parole di una sillaba; gli errori vanno al Dottore dei Toni).
- **Scelta del tipo** dalla stabilità FSRS: sotto 3 giorni riconoscimento, 3-21 misto, oltre produzione. Il gradino scende
  sotto il 60% di risposte giuste nelle ultime 10 e sale sopra il 90%. Mai lo stesso tipo più di due volte di fila.
  Dopo un errore la parola torna dopo 3 carte con un altro tipo, e una copia di rinforzo dopo 8.
- **Voti.** Scelta multipla giusta = Bene, mai Facile; «Non ero sicuro» = Difficile; sbagliata = Di nuovo. Tasti 1-4 per
  rispondere, Invio per continuare, spazio per ascoltare.
- **Distrattori** (`src/study/distractors.js`, funzioni pure con seme):
  - livello ±1, e per il 40% la stessa tappa;
  - niente glosse con parole in comune con la giusta;
  - pinyin con al massimo due toni diversi e una confusione tipica;
  - nell'ascolto, niente omofoni né parole con più letture;
  - con meno di 3 candidati la domanda non si fa.
- **Digitazione** (`src/core/typing.js`): adattata da `materiali/riferimenti/digitazione.mjs`, con le sue prove in
  `tools/unit.mjs`.
- **Tipi con frasi** (`src/study/ex-frasi.js`, `src/study/ex-varie.js`):
  - misto: frase a buco (`buco`), rimetti in ordine (`ordina`), `traccia` (parole di un carattere, lavagna senza guida) e
    `componente` (quale parte dà il suono o il significato, solo con l'anatomia accesa);
  - produzione: buco grammaticale (`buco-gram`: insiemi confondibili e classificatori di `CP.lab.NCLF`), `scrivi-pinyin`,
    `scrivi-significato` e il buco digitato (`buco-scrivi`);
  - riconoscimento: `abbina` (cinque coppie).
- **Le frasi di una parola** (`CP.exSent.forWord`), in quest'ordine:
  - l'esempio della parola;
  - le frasi Tatoeba con traduzione diretta e livello non sopra quello della parola;
  - gli esempi delle lezioni;
  - le frasi delle voci reali, che non hanno traduzione e servono solo come ultima scelta.

  La parola deve comparire come parola nel taglio dell'app.
- **Digitazione:** sotto il campo i tasti 1-5 e ü. Pinyin senza toni, o italiano con un accento sbagliato o un refuso:
  Difficile, con la correzione.
- **Lezioni:** i quiz accettano anche `{ k: "buco", zh: "我＿学生。", opts, a }` e `{ k: "scrivi", q?, zh?, a, py? }`. Nel corso
  di italiano: `{ k: "buco", it: "Io ___ …", opts, a }` e `{ k: "scrivi", q, a }`. `tools/lib/lab.mjs` li valida; i file
  delle lezioni non sono cambiati.

**Percorso guidato** (stile Guidato, `src/study/guided.js`; il passo successivo lo calcola `CP.ex.prossimo` nello stub, senza
caricare il gruppo).
- **La carta «Continua»** del Percorso ha un solo pulsante, che dice che cosa succederà, per esempio «Impara 5 parole
  nuove · 10 ripassi». La durata si sceglie tra 5, 10 e 15 minuti (`cp-ex-dur`).
- **I passi** di una tappa:
  1. impara (5 parole nuove con frase e ascolto) ed esercitati (esercizi sulle stesse parole e ripassi in scadenza);
  2. con l'80% delle parole avviate, **verifica**: 12 domande senza aiuti, soglia 80%. Il risultato è diviso nelle cinque
     parti del test di livello, con una frase gentile sul punto più debole. Sotto la soglia, «Rinforza» ripassa le parole
     sbagliate. La verifica non tocca FSRS; superata la prima volta dà 20 punti;
  3. il dialogo della tappa.
- **Stato** in `cp-ex-v1.units[tappa]`. Il segno «🏅 Tappa verificata» si aggiunge alla regola dell'80%, che non cambia.
- Si può sempre «Studiare libero» da Studia.
- **Lezioni:** dopo il quiz «Rifai i tuoi errori» e (stili Misto e Guidato) una mini-verifica con 2 domande a buco nuove,
  prese dagli esempi. Nessuna delle due cambia il risultato della lezione.
- `ui/share-card.js` ora si carica al primo uso di `CP.shareCard`; la parola del giorno sta in `pwa/widget.js`.

**Lettura graduata** (Frasi → 📖 Leggi → «Testi», `src/phrases/reading.js`, gruppo ESERCIZI).
- I testi vengono da `materiali/runtime/testi-*.json`; `tools/lettura.mjs` li controlla e scrive `src/data/reading/`
  (`TESTI_ZH`, `TESTI_IT`, letti al primo uso). Ogni frase cinese deve essere fatta di parole del vocabolario nel taglio
  dell'app; il livello del testo è quello della parola più alta, e se quello dichiarato è più basso vince il calcolato
  (alzati: `zh-t03-al-negozio` 1 → 2, `zh-t11-dal-medico` 4 → 6). La build ricontrolla gli stessi punti.
- L'elenco va per livello, con «★ giusto per te» quando conosci almeno il 90% delle parole e «✓ letto».
- Nel testo: un tocco su una parola apre il suo foglio; pinyin (acceso fino al livello 2) e traduzione si accendono e
  spengono; ogni frase si ascolta.
- In fondo le domande di comprensione (risposte mescolate con un seme), poi le parole nuove: un tocco le mette nel ripasso
  (`CP.grade(parola, 0)`, tipo «lettura»). 5 punti la prima volta, segno in `cp-ex-v1.read`.
- I testi sono bozze scritte per il progetto: vanno riletti da un madrelingua. I testi italiani sono descritti più sotto, nel corso di italiano.
- Crediti: «Frasi d'esempio degli esercizi», Tatoeba, CC BY 2.0 FR, con l'elenco degli autori in
  `materiali/crediti/autori-frasi.tsv` (le frasi sono negli esercizi).

**Corso di italiano alla pari** (codice in `COURSE_IT`: `src/it/esercizi.js`, `src/it/lettura.js`).
- **Stessi stili** (⚙️ → Studio → Stile di ripasso): Classico = le carte di prima (da girare, quattro voti); Misto e Guidato = gli
  esercizi dello stesso motore (`CP.exEngine`, con un kit per il corso: parola, scheda, voce italiana, rivelazione).
  Le parole nuove si presentano prima (parola, cinese, forme, frase) con «记住了，练一练».
- **Voto** sempre da `CP.itApi.grade(voce, g, meta)`: scrive `cp-it-srs-v1` nel formato di sempre `{ c, n, lr }`; la
  ripetizione dopo un errore (3 carte dopo, con un altro tipo) aggiorna la scheda solo se chiude un riapprendimento,
  come nel cinese. Mai Facile da una scelta multipla.
- **Tipi** (prefisso `it-` nel registro del motore): `it-significato`, `it-parola`, `it-ascolto` (con la voce italiana del
  telefono), `it-ascolto-frase`, `it-buco`, `it-ordina`, `it-scrivi` (confronto `compareIt` e, se sbagliata, il correttore
  `it/checker.js`), `it-dettato` (solo con una voce reale), `it-buco-gram` (articoli, preposizioni, avere/essere da
  `INSIEMI.it`), `it-verbo` (presente da `CP.ita`).
- **Distrattori** (`CP.distract.itWords`): stessa specie e, per i nomi, stesso genere; livello ±1 dal capitolo della tappa;
  nessun carattere cinese in comune con la giusta (学校/学生); nessun doppione, né in italiano né in cinese.
- **Frasi di una parola:** l'esempio, poi le frasi Tatoeba (`FRASI_IT`, solo con traduzione) e gli esempi delle lezioni,
  con il livello non oltre quello della parola. La parola si cerca tra le sue forme (nomi senza articolo, quattro forme
  degli aggettivi, presente dei verbi regolari).
- **Guidato:** la carta «今天» ha un solo pulsante con il passo successivo: esercizi se ci sono almeno 10 ripassi (durata
  5/10/15 minuti, poi «这次练习完成了»), un testo da leggere (A1 dopo 3 lezioni, A2 dopo 10, B1 dopo 20, al massimo uno
  ogni 3 lezioni), altrimenti la lezione corrente (la lezione con il suo quiz è «impara + verifica»).
- **Lettura** (in 句子, sopra le frasi): gli 8 testi A1-B1 con le domande in cinese e le risposte in italiano, «适合你»,
  «已读», traduzione cinese a richiesta, un tocco su una parola apre il suo foglio, ogni frase si ascolta, parole nuove nel
  ripasso con un tocco, 5 punti la prima volta.

**Voci reali** (`src/core/voice-clip.js`, `src/ui/voice-dl.js`).
- `tools/materiali.mjs` scrive anche `src/data/ex/voci-file.js` (`VOICE_FILES`: per lingua, numero della clip → impronta
  del contenuto; letto al primo uso). La build ricontrolla le impronte e scrive le clip in
  `dist/audio/voce/<lingua>/<numero>.<impronta>.ogg` (fuori dal repository, come i brani; `--check` le ignora).
- `CP.speak` chiede la clip della frase (chiave: per l'italiano minuscole senza punteggiatura, per il cinese solo i
  caratteri); se non parte torna alla voce di sempre. Le clip si usano **solo se sono sul telefono**: nell'APK sempre;
  sul sito dopo ⚙️ → Suoni e musica → Voce → «Scarica le voci (7,3 MB)», che le mette nella cache `mandarino-voice` (il service worker non
  la cancella agli aggiornamenti; `src/pwa/sw.js` e `swSource()` in `src/pwa/pwa.js` restano uguali). Prima di allora
  nessuna richiesta di rete. Mai il sesso, l'accento o il numero di chi parla.
- Crediti: «voce: NM1, Tatoeba, CC BY 4.0» e «voci: Mozilla Common Voice, CC0».
- **Corso di cinese:** «ascolta la frase» (`ascolto-frase`, misto): la clip vera di una frase con la parola, e quale
  frase hai sentito tra quattro scritte (le altre contengono la stessa parola quando si può). Si propone solo se le clip
  sono sul telefono. Dal livello 3, quando c'è la frase vera, l'ascolto della parola sola con la voce sintetica
  (`mc-ascolto`) lascia il posto alla frase.
- `materiali/escludi-frasi.txt`: le frasi da togliere da esercizi e voci (una per riga); poi `node tools/materiali.mjs`.
- Senza `materiali/audio/zh` i materiali si generano lo stesso (0 clip cinesi) e l'app non propone l'ascolto delle frasi
  (prova in `tools/unit.mjs` e in `tools/e2e.mjs`).
- Le prove (blocco 4n): prima di scaricare nessuna richiesta; il pulsante mette le 1154 clip nella cache; in modalità aereo
  arrivano dalla cache; nessuna richiesta fuori dall'app.

**Peso.**
- Tutto il codice nuovo è nel gruppo **ESERCIZI**, testo eseguito al primo uso: `GROUPS` in `tools/build.mjs`, che
  generalizza `COURSE_IT`; lo esegue `CP.ex.carica()`. All'avvio resta solo `ui/ex-stub.js`.
- Per fare spazio, `ui/credits.js` e `ui/share-card.js` si caricano al primo uso. Avvio: 1480 KB su 1500 (la ricerca
  delle voci reali, `core/voice-clip.js`, serve a `CP.speak` fin dall'avvio).

**Che cosa vuol dire «budget di avvio».** Il file è uno solo e sta già sul telefono: i byte non si scaricano, quindi il limite
di 1500 KB di `tools/unit.mjs` non misura la rete. È un sostituto, controllabile ad ogni prova, del lavoro che il telefono
fa all'apertura: leggere, compilare ed eseguire il JavaScript prima che sparisca la schermata d'avvio. Misura con
`node tools/misura-avvio.mjs` (Chromium, CPU 4×, profilo nuovo): apertura a freddo ~2,8 s mediana (2,0–3,5 s).
- I gruppi al primo uso costano pochissimo: a 4× ESERCIZI (79 KB) ~19 ms, correttore di italiano (28 KB) ~9 ms, sfide e
  classe (42 KB) ~8 ms, crediti e carta da condividere 1–3 ms; insieme ~40 ms, circa l'1,5 % dell'apertura. Il testo
  inerte non si compila; il costo resta quasi tutto in ciò che gira all'avvio (dati e moduli eseguiti subito).
- Allungare la schermata d'avvio o eseguire i gruppi nei momenti di inattività (`requestIdleCallback`) non libera
  margine: i KB nel gruppo sono già fuori dal conteggio, e l'esecuzione anticipata toglierebbe al primo uso soltanto
  ~10–20 ms, in cambio di lavoro sul filo principale mentre la persona già tocca lo schermo e di nuove strade da provare
  (i moduli di LAZYMOD hanno effetti all'esecuzione, come `CP.settingsExtras`). Non è stata aggiunta.
- Per fare margine serve spostare codice dall'avvio a un gruppo (`GROUPS`, `LAZYMOD`) quando non serve nei primi
  istanti; ogni funzione nuova che non serve subito va lì, non nell'avvio.

**Materiali** (`materiali/`, dalla cartella dei materiali di lavoro; fonti e licenze in
`materiali/FONTI-E-LICENZE.md`).
- `tools/materiali.mjs` scrive `src/data/ex/` (letti al primo uso), controllando le frasi con il taglio dell'app:
  - frasi Tatoeba: 2484 cinese → italiano e 3048 italiano → cinese;
  - indici delle voci: 720 clip cinesi Common Voice (CC0) e 434 italiane NM1 (CC BY 4.0), 7,0 MB;
  - insiemi confondibili.
- Tutte le frasi passano il taglio; per 135 frasi il livello è salito a quello calcolato (per le frasi fatte fuori
  dall'HSK conta il capitolo della tappa).
- La build ricontrolla tutto e fallisce se:
  - una parola è fuori dal vocabolario;
  - un livello è sotto quello calcolato;
  - manca una clip;
  - un file supera i 60 KB, o le voci insieme superano i 10 MB.
- `materiali/escludi-frasi.txt` (una frase per riga) toglie frasi senza toccare i file.

## Esporta per Anki

Per chi ha studiato molto e vuole portare le parole anche in Anki, senza togliere niente a màndarínō. La voce compare
**solo dopo 400 parole iniziate o 400 ripassi** (`ANKI_MIN` in `src/core/export-anki.js`), in ⚙️ → Dati e sincronizzazione →
«Altre opzioni di esportazione», accanto alla sincronizzazione. Il testo spiega la differenza: sincronizzare passa i
progressi a un altro dispositivo con màndarínō, esportare porta le parole in un'altra app. Prima di salvare servono due
conferme. Il primo foglio dice che cosa fa e che cosa non fa.

**Il file** è testo UTF-8 separato da tabulazioni (`.txt`, tipo `text/tab-separated-values`), con le intestazioni che Anki
legge da solo: `#separator:tab`, `#html:true`, `#guid column:1`, `#tags column:7`, `#columns:…`, `#deck:…`, più una riga di
commento con app, versione e licenza.

| Colonna | Corso di cinese | Corso di italiano |
|---|---|---|
| 1 guid | impronta di corso + chiave | impronta di corso + id |
| 2 Vocabolo | caratteri | parola italiana (per i verbi anche il presente, dalle regole di `CP.ita`) |
| 3 Pinyin | come lo mostra l'app: `yínháng`, `xī'ān` | pinyin del cinese |
| 4 Traduzione | italiano (e nota) | cinese |
| 5 Frase | frase d'esempio con pinyin | frase italiana |
| 6 Traduzione frase | italiano | cinese |
| 7 tag | `mandarino`, `hsk1`…`hsk6`/`hsk_plus`, `tappa::<sezione>`, `sicura`/`in-corso`/`nuova` | `mandarino-it`, tipo di parola, stato |

- **Quali parole:** quelle iniziate (default), solo le sicure (`CP.state` = 2), tutte, oppure una sola tappa.
- **Guid stabile:** è un'impronta della chiave, uguale su ogni dispositivo. Reimportando, Anki aggiorna le note invece di
  duplicarle.
- **Limite:** il file porta le carte, non il calendario FSRS, quindi in Anki le parole ripartono dall'inizio (i tag
  aiutano a filtrarle). Un `.apkg` con il calendario è fuori portata.
- **Corso di italiano:** genere e articolo vengono dal lessico, cioè da Morph-it! (LGPL), e l'intestazione lo cita. Le
  coniugazioni le producono le regole dell'app, non Morph-it!.

**Verificato con Anki vero.** `tools/anki-check.py`, uno strumento di sviluppo che usa la libreria `anki` 26.09.3, legge le
intestazioni come Anki, importa e reimporta. Risultato: 6385 note del corso di cinese e 4780 del corso di italiano, nessun
doppione alla seconda importazione. In Anki si crea una volta un tipo di nota con i 5 campi (o si sceglie come mapparli
nella finestra d'importazione). `Store.download(nome, testo, mime)` ora accetta il tipo del file (di base JSON).

## Pleco (facoltativo)

Chi ha il dizionario Pleco sul telefono può accendere ⚙️ → Studio → «Mostra il collegamento a Pleco». È spento di base e
si accende con due conferme, perché porta a un'altra app. Non c'è sul computer né nel corso di italiano. Acceso:

- sotto i 2 secondi non cambia niente (a mezzo secondo si apre il foglio del carattere, come sempre);
- tenendo premuto un carattere per **2 secondi** (`PLECO_HOLD_MS` in `src/ui/pleco.js`) compare un piccolo pulsante
  «Apri in Pleco», con un'icona generica di dizionario (non il marchio di Pleco). Si esce verso Pleco solo toccandolo,
  e prima appare per un attimo una pagina con il logo e il wordmark;
- nella carta di studio la stessa voce sta anche nel menu «⋯»: è la strada senza gesti.

Passa la parola intera (quella della riga, della carta o del foglio), solo caratteri cinesi e al massimo 16.

**Android.** `Bridge.openPleco` lancia `ACTION_VIEW` su `plecoapi://x-callback-url/s?q=…` con
`setPackage("com.pleco.chinesesystem")`. Il pacchetto è nelle `<queries>` del manifest, come chiede Android 11+. Se Pleco
non c'è compare un messaggio discreto, «Pleco non è installato», con «Scarica Pleco» (`Bridge.plecoStore`: `market://`,
poi la pagina web di Google Play).

**Browser.** Sul telefono è un link `plecoapi://`: se Pleco non c'è non succede niente. Nessuna rete: la parola va a
Pleco, sul telefono.

**Limiti noti.** Lo schema `plecoapi://x-callback-url/s` viene dai forum di Pleco (Android dalla 3.2.10) e non è ancora stato provato su un telefono con Pleco installato: va fatto prima di una release. Nella versione per gli store il link allo store va controllato con le regole di Google Play.

## Privacy

[PRIVACY.md](../PRIVACY.md), in italiano e in cinese, dice che cosa resta sul dispositivo (tutto), quando l'app usa la rete
(controllo aggiornamenti dell'APK, voce online se accesa, riconoscimento vocale del browser, file dello stesso sito, link
toccati), il backup automatico di Android e come funzionano contributi, Pleco e sigilli. In breve, la stessa cosa sta
nell'app: ⚙️ → Informazioni → 🔒 Privacy
(`src/ui/privacy.js`). Chi aggiunge una richiesta di rete aggiorna tutti e due: la tabella di PRIVACY.md e le righe
`pv.*` in `src/i18n/`.

## Licenze

| Parte | Licenza | Testo |
|---|---|---|
| Codice | MIT | `LICENSE` (solo il testo MIT, così GitHub lo riconosce) |
| Contenuti didattici in `src/data/` | CC BY 4.0 | `LICENZE/CONTENUTI.txt` |
| Musica | CC BY 4.0 | `LICENZE/MUSICA.txt` |

Che cosa vale per che cosa è in `NOTICE.md`. Le parti di altri, con indirizzo, versione e file, sono in
`THIRD-PARTY-NOTICES.md`:

| Componente | Licenza |
|---|---|
| Make Me a Hanzi | Arphic |
| complete-hsk-vocabulary | MIT |
| py-fsrs | MIT |
| jsQR | Apache 2.0 |
| jsPDF | MIT |
| wikidict-it / Wikidata | CC0 |
| Morph-it! | LGPL (da verificare) |
| campioni della musica | CC0 |

La build si ferma se in `src/vendor/` o tra i dati compare una parte di altri senza voce. I contributi entrano con la
licenza dei contenuti: lo dicono il foglio dei contributi dell'app, `NOTICE.md` e `CONTRIBUTING.md`.

## Comportamenti delicati

L'elenco di ciò che resta da fare è in [roadmap.md](roadmap.md); per pubblicare una versione c'è [rilascio.md](rilascio.md). Il corso di italiano ha 30 lezioni: se ne aggiungono altre con un file in `src/data/it/lessons/` (stesso formato).

- FSRS: il giorno di studio cambia alle 4 del mattino (come Anki); la ripetizione di una carta nella stessa sessione la
  aggiorna solo se chiude un «Non la so», non dopo un «Quasi».
- Ricerca: l'italiano combacia dall'inizio delle parole, il pinyin dall'inizio delle sillabe; sopra i risultati, le
  corrispondenze esatte da toccare.
- Lettore: gli omografi (花 fiore / spendere) mostrano tutti i significati; un carattere noto solo dentro altre parole
  (泳 in 游泳) mostra la lettura e dove compare.
- Voce: si usa la voce del telefono. La voce online (che manda il testo a un servizio esterno) parte solo se l'hai
  permessa in ⚙️; altrimenti, se manca una voce cinese, un avviso spiega come installarla. Legge i testi lunghi a pezzi sotto i 180 caratteri.

## Difetti trovati sul telefono (ottobre 2026) e come sono risolti

Una prova su un telefono Android vero ha trovato questi difetti, che i test senza telefono non potevano vedere. Ognuno ha ora una prova in `tools/e2e.mjs`
(tranne quelli che dipendono dal sistema Android, elencati in `docs/checklist-dispositivo.md`).

| Difetto | Causa | Soluzione |
|---|---|---|
| «Non riesco a usare il microfono (NotReadableError)» aprendo l'oscilloscopio dei toni dopo un riconoscimento vocale | Android non permette due flussi di microfono insieme: il riconoscimento era ancora aperto | `CP.listenRelease()` chiude il riconoscimento prima; `CP.micStream()` aspetta e riprova fino a 4 volte; il messaggio all'utente non mostra più il nome tecnico |
| «Parola per parola» sembrava non cambiare niente | la scomposizione era solo una riga di glosse | ora mostra «Alla lettera: 我 io → 是 essere → …» e toglie la traduzione fluida e il segno «frase verificata» |
| Tocco lungo sui componenti: menu «Copia / Cerca» di Android | niente `user-select: none` né blocco di `contextmenu` | regola globale in `base.css` e un solo gestore in `core.js`; restano selezionabili i campi di testo e `.selectable`; il tocco lungo di 2 s per Pleco e il foglio del carattere non cambiano |
| Il risultato di «Valuta tratto» finiva sotto lo schermo | veniva aggiunto sotto il pulsante | `scrollIntoView` dopo la valutazione (`voice/pad.js`) |
| «(lei 指女性)» su tutte le domande del passato prossimo | etichetta fissa del tempo | si mostra solo se il soggetto è «lei» (`it/course.js`) |
| Barra «00:00 – 00:00» nella notifica della musica | metadati senza durata ben definita | `METADATA_KEY_DURATION = -1` e nessuna azione di spostamento (`MusicService.java`) |
| Sfida di 60 secondi con le stesse parole | pool piccolo e scelta casuale | pool completato fino a 30 parole e finestra di 8 domande senza ripetizioni (`study/ear-sprint.js`) |
| «Stampa» nelle Parole non faceva niente | `window.print()` non esiste nella WebView | il ponte `Bridge.print()` apre il servizio di stampa di Android (anche «Salva come PDF») |
| Cambiando la lingua dei menu ripartiva l'animazione d'avvio | `location.reload()` | `sessionStorage` `cp-fast`: niente animazione e si riapre la stessa pagina delle impostazioni |

Rifiniture dello stesso giro: istogramma delle settimane con il fondo a filo (un valore 0 non sembra una barra piena); la carta «Continua» del Percorso senza il selettore di
durata (sta in Studia → Personalizza); niente più la riga «Sostieni il progetto» ripetuta in «Come funziona»; la tastiera si abbassa scorrendo «Vai a…» e «Cerca ovunque»;
la carta del giorno del cinese con formato, colore e firma; margine destro del widget «Pausa»; mappa del Taccuino alta al massimo il 46% dello schermo; «Novità» riscritte in sette
righe per versione. Le note sulle librerie valutate e non usate sono in `THIRD-PARTY-NOTICES.md`.
