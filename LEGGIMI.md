# màndarínō · il cinese per italiani, l'italiano per cinesi (V6.7)

Due corsi in un'app: **il cinese per italiani** e, scelto dal benvenuto o da ⚙️ → Corso, **意大利语课程, l'italiano per
chi parla cinese**. Un'app che si pubblica come file unico (`dist/index.html`, generato da `src/`): 6385 parole in 220 sezioni (con le liste HSK 3.0), una frase d'esempio per parola, pinyin davanti, toni a colori, ripasso FSRS-6,
dialoghi, laboratorio di frasi, pannello «Parla» con la curva dei toni, jukebox di 22 brani originali. Nessuna richiesta di
rete all'avvio, nessuna libreria caricata da fuori (l'unica di terzi, jsQR, è dentro il file); i progressi restano sul
telefono (localStorage + copia in IndexedDB), si salvano su file e si sincronizzano senza server (file nel proprio cloud o QR).
Su Android c'è anche l'APK, con scorciatoie, widget «Oggi», promemoria facoltativo e musica in secondo piano.

Come i moduli si agganciano tra loro (l'oggetto `CP`, i registri, i richiami, il ponte Android): **[docs/ARCHITETTURA.md](docs/ARCHITETTURA.md)**.
Dove vive ogni funzione e quando compare (schede, fogli, impostazioni, glossario): **[docs/ux-architettura.md](docs/ux-architettura.md)**.

## Com'è fatto il repository

```
src/                       ← si lavora qui (si apre anche così com'è, da file://, senza build)
  index.html               struttura della pagina + l'elenco ordinato di stili e script (l'ordine è quello di esecuzione)
  boot.js                  primo script: copia pulita della pagina, registri SECTIONS e DIALOGS
  config.js                MD_CONFIG: repository, e-mail, pagina di sostegno, store, interruttori FEATURE_* (unico punto)
  main.js                  ultimo script: avvio finale
  data/vocab/NNN-<id>.js   il vocabolario, una sezione per file, una parola per riga
  data/dialogs/<id>.js     un dialogo per file (+ _categorie.js)
  data/lessons/NN-<id>.js  le 30 lezioni di grammatica, una per file (spiegazione, esempi, errori tipici, esercizi)
  data/examples/*.js       una frase d'esempio per parola: chiave → [cinese, italiano] (il pinyin si ricava dal vocabolario)
  data/freq.js             ordine di frequenza delle parole (lo usa il taglio in parole); data/path-hsk.js = tappe HSK
  data/strokes.js          l'ordine dei tratti (Make Me a Hanzi, licenza Arphic: vedi LICENZE/ e ⚙️ → Crediti)
  data/grammar.js          le schede grammaticali del traduttore (nomi, luoghi, nazionalità, verbi, aggettivi…)
  data/verified.js         le frasi verificate: traduzioni sicure e, insieme, prove per le regole
  data/*.js                frasi, Pensiero, esercizi, modelli, slot, percorso
  i18n/                    i18n.js (t, applyI18n) + it.js + zh.js
  core/                    fsrs.js (ripasso), store.js (salvataggi e backup), core.js (stato condiviso, voce, fogli), game.js,
                           segment.js (taglio di una frase in parole: lo stesso codice nella pagina e negli strumenti)
  words/ study/ path/ phrases/ voice/ ui/ contrib/ selftest/ pwa/   le schede e le funzioni, un modulo per file
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
  vendor/                  jsQR (Apache 2.0), eseguito solo quando serve leggere un QR
docs/ARCHITETTURA.md       dove e come i moduli si agganciano a CP
dist/                      ← generato da tools/build.mjs: è questo che si pubblica e si scarica
  index.html               un file unico (stili, script e dati dentro): funziona offline da file://, su https e nell'APK
  sw.js                    APP_VERSION = impronta di index.html: ogni build che cambia l'app fa comparire «Aggiorna»
  phrases/translate.js     il traduttore del laboratorio (regole); phrases/italian.js = coniugazioni e articoli
  it/course.js             il corso di italiano per chi parla cinese; data/it/lessons/ = le sue lezioni (in cinese)
android/                   l'app Android: una WebView che apre dist/index.html dal pacchetto + un ponte nativo (Java, solo SDK)
.github/workflows/web.yml  a ogni push: prove unitarie, dist/ aggiornato, grammatica, build, e2e e ux-audit con Playwright
.github/workflows/apk.yml  costruisce l'APK su GitHub, lo prova su un emulatore e lo pubblica come Release
tools/                     build.mjs, grammar.mjs, ux-audit.mjs, e2e.mjs, merge-contrib.mjs, cedict-check.mjs, morphit-check.mjs,
                           freq.mjs (rigenera freq.js), strokes.mjs (rigenera strokes.js da Make Me a Hanzi), android-smoke.mjs,
                           unit.mjs (taglio in parole, unione dei backup, peso dell'avvio), wikidict.mjs, levels.mjs, itlex.mjs,
                           review-sample.mjs (campione di frasi da far rileggere a un madrelingua),
                           icons.mjs (rigenera le icone PWA e Android, mandarino + wordmark, con Playwright),
                           hunspell-check.py, lib/ (Node puro, zero dipendenze; gli strumenti di controllo leggono file esterni solo in sviluppo)
```

**Dopo ogni modifica in `src/`:** `node tools/build.mjs`, poi committa anche `dist/index.html` (i file pesanti di `dist/` li rigenera la build e non
stanno nel repository). Prima di un push: `npm test` (serve una volta `npm install`, che porta solo Playwright).
La build si ferma se i dati non sono validi (chiavi doppie, sillabe ≠ caratteri, HTML) o se un file di
vocabolario, dialogo o traccia non è elencato in `src/index.html`. `node tools/build.mjs --check` dice se `dist/` è aggiornato.

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

## Pubblicare (Cloudflare Pages, il più semplice)

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → questo repository.
2. Build command: `node tools/build.mjs` (solo Node, nessuna dipendenza). Output directory: `dist`.
   I file pesanti (i brani, con l'impronta nel nome, e i «nomi e termini» del Lettore) non stanno nel repository dentro
   `dist/`: li genera la build dagli originali in `src/`. `dist/index.html` invece resta nel repository (si scarica e
   funziona da solo).
3. Dal telefono apri `https://….pages.dev` → menu del browser → «Aggiungi a schermata Home».

Su https il microfono chiede il permesso una volta sola; dopo il primo caricamento l'app funziona senza rete.
**Aggiornare:** basta `node tools/build.mjs` e un push: `APP_VERSION` cambia da solo e i telefoni vedono
«Nuova versione disponibile · Aggiorna». **Scaricare l'app come file:** `dist/index.html` funziona da solo, anche offline.

**Nome del repository:** GitHub ha tolto gli accenti e il repository si chiama `m-ndar-n-`. Conviene rinominarlo
`mandarino` (Settings → General → Repository name): i vecchi indirizzi, le release e le API vengono reindirizzati.
Dopo, per ordine, aggiorna `REPO` in `src/pwa/pwa.js` (controllo aggiornamenti dell'APK) e il link qui sotto.

## L'APK per Android (gratis, senza Play Store)

Ogni push che cambia l'app fa partire **GitHub Actions** (`.github/workflows/apk.yml`): controlla `dist/` e la grammatica,
costruisce l'APK, lo verifica con Android lint e `apksigner` e, sul ramo principale, lo pubblica come Release.
Il link da mandare a chi vuole l'app non cambia mai:

`https://github.com/longhitown/m-ndar-n-/releases/latest/download/mandarino.apk`

(se rinomini il repository, cambia la parte `longhitown/m-ndar-n-`). Chi lo apre sul telefono deve consentire
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

**In locale** (serve l'Android SDK): `node tools/build.mjs` e poi `gradle -p android assembleRelease lintRelease`.

**Cosa c'è in più nell'APK** (tutto calcolato sul telefono, nessun server):
- **scorciatoie** (pressione lunga sull'icona): Studia ora, Orecchio ai toni, Jukebox; aprono `?go=study|ear|music`;
- **widget «Oggi»** 2×1 e 4×2: serie di giorni, ripassi in scadenza (dall'istogramma delle prossime 168 ore che l'app
  passa con `setWidgetState`), parola del giorno (tocca per il significato), un messaggio gentile la sera se oggi manca lo studio;
- **promemoria** facoltativo, spento finché non lo accendi da ⚙️ → 🔔 (il permesso delle notifiche si chiede solo allora;
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

Si sceglie dal benvenuto («我是中国人，我想学意大利语») o da ⚙️ → Corso · 课程; per tornare indietro, stesso posto.
I due corsi hanno progressi separati. Le schede: 课程 (30 lezioni in cinese, `src/data/it/lessons/`), 单词 (4780 parole: quelle delle schede di
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
node tools/e2e.mjs          # 46 prove su dist/ (corso di italiano e correttore, immersione, sincronizzazione, QR, musica, testi cinesi senza italiano), ~2 minuti
node tools/ux-audit.mjs     # 0 problemi attesi (anche: un solo pulsante primario per schermata, menu ≤ 7 voci); --quick = 360×740 chiaro
```
Tutte insieme: `npm test`. Le stesse girano in GitHub Actions a ogni push (`web.yml`).
In più, dentro l'app: aggiungi `#selftest` all'indirizzo (25 controlli, tutti verdi). `#dev` accende il modo sviluppatore
(in ⚙️ compare «Scarica pacchetto PWA per GitHub»), `#nodev` lo spegne.

**Sul dispositivo Android:** a ogni push GitHub Actions avvia anche un emulatore Android 14 vero (job «dispositivo») e
`tools/android-smoke.mjs` controlla dentro la WebView dell'APK: caricamento all'origine dell'app, `#selftest`, backup in
Download con UTF-8 intatto, permesso del microfono, dati che restano dopo la chiusura forzata, tasto Indietro, scorciatoie,
apertura su un'azione, stato del widget, promemoria, nessun crash.
In locale, con un telefono collegato in debug USB: `node tools/android-smoke.mjs android/app/build/outputs/apk/debug/app-debug.apk`.
Per il controllo «nessun attributo senza CP.attr», in revisione: `grep -rnP "[a-z-]+=\"' \+ (?!CP\.attr)" src`
deve mostrare solo numeri, id interni e classi.

Da fare a mano, su un telefono vero (non si possono simulare qui):
- volume al 50%: il tap si sente, 10 tap di fila non danno fastidio; la musica si abbassa quando parla la voce;
- Lighthouse «Installable» sull'indirizzo https; avvio in modalità aereo;
- iPhone, app aggiunta alla Home: se il riconoscimento vocale manca, il 🎤 deve diventare «Registra e confronta».

## Contributi della community

Chi usa l'app corregge pinyin, italiano o nota di una parola, di una frase o di una battuta (mai i caratteri: sono la
chiave dei progressi), segnala un errore o propone una parola nuova. La correzione si vede subito nella sua copia
(«✏️ tua correzione») e si annulla da ⚙️ → Contributi. Si manda con Condividi (WeChat, WhatsApp…), email o file `.json`;
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

## Chiavi salvate (tutte `cp-*`, tutte con una regola nel ripristino «unisci»)

Nuove in V6.7: `cp-community-contribs` (unione per id, vince la voce più recente; contiene anche le traduzioni proposte, tipo `tr`),
`cp-lessons-v1` e `cp-it-lessons-v1` (lezioni: per ognuna il punteggio migliore, la prima volta superata, l'ultima letta),
`cp-it-srs-v1` (ripasso del corso di italiano: per ogni parola vince la scheda ripassata più di recente),
`cp-course`, `cp-it-tab`, `cp-it-welcome` (preferenze del dispositivo), `cp-ux-v1` (benvenuto, legenda,
suggerimenti; unione), `cp-haptics`, `cp-sfxvol`, `cp-jkmood`, `cp-jkauto`, `cp-toneshapes`, `cp-contrib-nick`,
`cp-lang` (preferenze del dispositivo: vince quello corrente). `cp-game-v1.days[giorno]` ha due campi nuovi:
`nw` (parole nuove introdotte) e `nx` (permesso extra «Ancora 5 parole»). Il formato del backup resta `{app:"mandarino", v:5, kv, log}`.

## Sincronizzare e cambiare telefono

⚙️ → Sincronizza. **File nel proprio cloud:** si sceglie (o si crea) un file `mandarino-sync.json` in una cartella di Drive,
Dropbox, OneDrive…; l'app lo riscrive dopo ogni sessione e lo riunisce all'avvio con le regole del ripristino «unisci»
(su Android con il selettore di documenti del sistema, sul computer con l'API File System Access; altrove a mano).
**Passaggio con i QR:** il telefono vecchio mostra una sequenza di QR, il nuovo la inquadra: nessuna rete, nessun account.
I punti si sommano per dispositivo (`xpBy`), così le due copie non si contano due volte.

## Licenze

Codice: MIT (`LICENSE`), © 2026 Claudio Longhitano. Brani del jukebox: CC BY 4.0 (`LICENZE/MUSICA.txt`, crediti in
`src/audio/CREDITI-MUSICA.md`). Terze parti, con le loro licenze in `LICENZE/` e in ⚙️ → Crediti: Make Me a Hanzi (Arphic),
jsQR (Apache 2.0), wikidict-it/Wikidata (CC0).

## Che cosa resta aperto

- Corso di italiano: 30 lezioni; se ne aggiungono altre con un file in `src/data/it/lessons/` (stesso formato).
- Correttore di frasi italiane: controlla gli accordi, non il senso. Trova 26 degli 88 «errori tipici» delle lezioni; gli altri
  (tempi verbali, ordine delle parole, preposizioni con città e paesi, scelta delle parole) richiedono più che regole d'accordo.
- 有一些 è l'unica parola senza frase d'esempio (il taglio la legge sempre come 有|一些, che è corretto).
- Rilettura da parte di madrelingua cinesi di un campione di frasi d'esempio e dialoghi:
  `node tools/review-sample.mjs --out revisione.md` prepara il modulo (circa 300 righe, istruzioni in cinese).

**Come si comportano adesso alcune parti delicate:**
- FSRS: il giorno di studio cambia alle 4 del mattino (come Anki); la ripetizione di una carta nella stessa sessione la
  aggiorna solo se chiude un «Non la so», non dopo un «Quasi».
- Ricerca: l'italiano combacia dall'inizio delle parole, il pinyin dall'inizio delle sillabe; sopra i risultati, le
  corrispondenze esatte da toccare.
- Lettore: gli omografi (花 fiore / spendere) mostrano tutti i significati; un carattere noto solo dentro altre parole
  (泳 in 游泳) mostra la lettura e dove compare.
- Voce: si usa la voce del telefono. La voce online (che manda il testo a un servizio esterno) parte solo se l'hai
  permessa in ⚙️; altrimenti, se manca una voce cinese, un avviso spiega come installarla. Legge i testi lunghi a pezzi sotto i 180 caratteri.
