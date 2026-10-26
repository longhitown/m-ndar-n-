# màndarínō · il cinese per italiani, l'italiano per cinesi (V6.7)

Due corsi in un'app: **il cinese per italiani** e, scelto dal benvenuto o da ⚙️ → Corso, **意大利语课程, l'italiano per
chi parla cinese**. Un'app che si pubblica come file unico (`dist/index.html`, generato da `src/`): 6385 parole in 220 sezioni (con le liste HSK 3.0), una frase d'esempio per parola, pinyin davanti, toni a colori, ripasso FSRS-6,
dialoghi, laboratorio di frasi, oscilloscopio dei toni. Nessuna libreria esterna, nessuna richiesta di rete
all'avvio; i progressi restano nel browser (localStorage + copia in IndexedDB) e si salvano su file.

## Com'è fatto il repository

```
src/                       ← si lavora qui (si apre anche così com'è, da file://, senza build)
  index.html               struttura della pagina + l'elenco ordinato di stili e script (l'ordine è quello di esecuzione)
  boot.js                  primo script: copia pulita della pagina, registri SECTIONS e DIALOGS
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
  audio/synth.js           attrezzi sonori + registro delle tracce (CP.audioTracks.add)
  audio/tracks/<id>.js     una traccia per file;  audio/tracks/index.js = catalogo (ordine)
  audio/player.js          motore del jukebox e interfaccia;  audio/audio-ui.js = audio a tre stati, voci, microfono
  styles/*.css             stili, in ordine di cascata
  pwa/                     manifest.json, sw.js (modello), _headers, icone
dist/                      ← generato da tools/build.mjs: è questo che si pubblica e si scarica
  index.html               un file unico (stili, script e dati dentro): funziona offline da file://, su https e nell'APK
  sw.js                    APP_VERSION = impronta di index.html: ogni build che cambia l'app fa comparire «Aggiorna»
  phrases/translate.js     il traduttore del laboratorio (regole); phrases/italian.js = coniugazioni e articoli
  it/course.js             il corso di italiano per chi parla cinese; data/it/lessons/ = le sue lezioni (in cinese)
android/                   l'app Android: una WebView che apre dist/index.html dal pacchetto + un ponte nativo (Java, solo SDK)
.github/workflows/apk.yml  costruisce l'APK su GitHub e lo pubblica come Release
tools/                     build.mjs, grammar.mjs, ux-audit.mjs, e2e.mjs, merge-contrib.mjs, cedict-check.mjs, morphit-check.mjs,
                           freq.mjs (rigenera freq.js), strokes.mjs (rigenera strokes.js da Make Me a Hanzi), android-smoke.mjs,
                           hunspell-check.py, lib/ (Node puro, zero dipendenze; gli strumenti di controllo leggono file esterni solo in sviluppo)
```

**Dopo ogni modifica in `src/`:** `node tools/build.mjs`, poi committa anche `dist/`.
La build si ferma se i dati non sono validi (chiavi doppie, sillabe ≠ caratteri, HTML) o se un file di
vocabolario, dialogo o traccia non è elencato in `src/index.html`. `node tools/build.mjs --check` dice se `dist/` è aggiornato.

**Aggiungere parole:** apri il file della sezione in `src/data/vocab/` e aggiungi una riga `["pin.yin","汉字","italiano"]`.
Una sezione nuova: un file nuovo `NNN-<id>.js` (copia la forma di uno esistente) e una riga `<script src="data/vocab/…">` in `src/index.html`.
I caratteri sono la chiave dei progressi: una parola esistente non cambia mai i suoi caratteri.

**Aggiungere una lezione:** un file nuovo in `src/data/lessons/` (il formato è spiegato in cima a `01-essere.js`) e una riga
`<script src="data/lessons/…">` in `src/index.html`. La build controlla che ogni frase cinese sia fatta di parole del
vocabolario e che gli esercizi siano ben formati. Il campo `path` la fa comparire nella tappa giusta del Percorso.

**Frasi d'esempio:** in `src/data/examples/` una riga `"chiave": ["中文句子。", "Frase italiana."]`. La build controlla che
la frase usi solo parole del vocabolario e che il taglio in parole la restituisca come parola (中 non vale dentro 中国).
Se il taglio sbaglia una frase giusta, si corregge `core/segment.js` (WEAK, CTX, BOUND), non la frase.

**Aggiungere o sostituire una traccia:** `src/audio/tracks/<id>.js` chiama
`CP.audioTracks.add({ id, ico, name, desc, mood: "calm" | "focus" | "energy", make(c, bus) })`; `make` restituisce
`{ step(until, now), stop() }`. Gli attrezzi (pluck, partials, flute, groove…) arrivano da `CP.synth`. Poi l'id va in
`audio/tracks/index.js` e il file in `src/index.html`.

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
2. Build command: vuoto (`dist/` è già nel repository). Output directory: `dist`.
3. Dal telefono apri `https://….pages.dev` → menu del browser → «Aggiungi a schermata Home».

Su https il microfono chiede il permesso una volta sola; dopo il primo caricamento l'app funziona senza rete.
**Aggiornare:** basta `node tools/build.mjs` e un push: `APP_VERSION` cambia da solo e i telefoni vedono
«Nuova versione disponibile · Aggiorna». **Scaricare l'app come file:** `dist/index.html` funziona da solo, anche offline.

**Nome del repository:** GitHub ha tolto gli accenti e il repository si chiama `m-ndar-n-`. Conviene rinominarlo
`mandarino` (Settings → General → Repository name): i vecchi indirizzi vengono reindirizzati.

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

Come funziona dentro: la pagina è servita all'indirizzo `https://appassets.androidplatform.net/` (sempre lo stesso: è lì che
la WebView tiene i progressi). `src/pwa/android.js` ricostruisce sopra il ponte nativo le API web standard che la WebView
non ha: voce (`speechSynthesis` → motore di sintesi del telefono, anche offline se la voce è installata), riconoscimento
vocale (`SpeechRecognition` → riconoscimento del telefono), download dei backup (→ cartella Download), condivisione, tasto
Indietro. Il resto dell'app non sa di essere dentro un APK.

## Il corso di italiano per chi parla cinese

Si sceglie dal benvenuto («我是中国人，我想学意大利语») o da ⚙️ → Corso · 课程; per tornare indietro, stesso posto.
I due corsi hanno progressi separati. Le schede: 课程 (10 lezioni in cinese, `src/data/it/lessons/`), 单词 (370 parole
italiane ricavate dalle schede di `src/data/grammar.js`: articolo, plurale, forme, coniugazioni), 复习 (ripasso FSRS),
变位 (coniugazioni), 句子 (frasi e dialoghi bilingui con la voce italiana).

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
node tools/e2e.mjs          # 24 prove su dist/ (anche il corso di italiano), ~1 minuto
node tools/ux-audit.mjs     # 0 problemi attesi; --quick = solo 360×740 tema chiaro
```
In più, dentro l'app: aggiungi `#selftest` all'indirizzo (25 controlli, tutti verdi).

**Sul dispositivo Android:** a ogni push GitHub Actions avvia anche un emulatore Android 14 vero (job «dispositivo») e
`tools/android-smoke.mjs` controlla dentro la WebView dell'APK: caricamento all'origine dell'app, `#selftest`, backup in
Download con UTF-8 intatto, permesso del microfono, dati che restano dopo la chiusura forzata, tasto Indietro, nessun crash.
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
Modulo Google e GitHub Issue compaiono quando li configuri in `src/contrib/contrib.js`, cerca `var CFG = { email: "", form: "", formEntry: "", repo: "" }`
(per le issue basta il nome di questo repository, ora che è pubblico).

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

## Che cosa resta aperto

- Corso di italiano: le lezioni sono 10; se ne aggiungono altre con un file in `src/data/it/lessons/` (stesso formato).
  Correttore di frasi italiane: da fare.
- I testi interni dei moduli più vecchi del corso di cinese (esercizi, dialoghi, lettore, guida, Pensiero, laboratorio,
  oscilloscopio, contributi) sono ancora solo in italiano e vanno portati su `t()` un po' alla volta.
- La modalità a schermo pieno vale per la sessione di studio, l'Orecchio e la Sfida; per gli esercizi di Frasi
  (puzzle, laboratorio, dialoghi) non è ancora attiva.
- Facoltativa: una GitHub Action che lanci `merge-contrib.mjs` sulle issue con etichetta `contributo`.
- 有一些 è l'unica parola senza frase d'esempio (il taglio la legge sempre come 有|一些, che è corretto).
- Sincronizzazione tra telefono e computer: oggi si passa il file di backup (il ripristino unisce). Senza server e senza
  dati personali presso terzi le strade possibili sono due: (1) un file di sincronizzazione scelto dall'utente nella propria
  cartella cloud (Drive, Dropbox, OneDrive…: su Android con il selettore di documenti del sistema, sul computer con
  l'API File System Access), che l'app riscrive dopo ogni sessione e riunisce all'avvio con le regole del ripristino;
  (2) passaggio diretto da telefono a telefono con una sequenza di codici QR animati, del tutto offline. La (1) è la più
  comoda e non porta nessun dato su server nostri; la (2) non richiede nessun account. Nessuna delle due è ancora fatta.

**Come si comportano adesso alcune parti delicate:**
- FSRS: il giorno di studio cambia alle 4 del mattino (come Anki); la ripetizione di una carta nella stessa sessione la
  aggiorna solo se chiude un «Non la so», non dopo un «Quasi».
- Ricerca: l'italiano combacia dall'inizio delle parole, il pinyin dall'inizio delle sillabe; sopra i risultati, le
  corrispondenze esatte da toccare.
- Lettore: gli omografi (花 fiore / spendere) mostrano tutti i significati; un carattere noto solo dentro altre parole
  (泳 in 游泳) mostra la lettura e dove compare.
- Voce: la prima lettura aspetta 6 secondi prima di ripiegare sulla voce online (3 le successive; nell'APK nessun timer),
  e la voce online legge i testi lunghi a pezzi sotto i 180 caratteri.
