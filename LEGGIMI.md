# màndarínō · il cinese per italiani (V6.7)

Un'app che si pubblica come file unico (`dist/index.html`, generato da `src/`): 3500 parole in 155 sezioni, pinyin davanti, toni a colori, ripasso FSRS-6,
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
  data/*.js                frasi, Pensiero, esercizi, modelli, slot, percorso
  i18n/                    i18n.js (t, applyI18n) + it.js + zh.js
  core/                    fsrs.js (ripasso), store.js (salvataggi e backup), core.js (stato condiviso, voce, fogli), game.js
  words/ study/ path/ phrases/ voice/ ui/ contrib/ selftest/ pwa/   le schede e le funzioni, un modulo per file
  audio/synth.js           attrezzi sonori + registro delle tracce (CP.audioTracks.add)
  audio/tracks/<id>.js     una traccia per file;  audio/tracks/index.js = catalogo (ordine)
  audio/player.js          motore del jukebox e interfaccia;  audio/audio-ui.js = audio a tre stati, voci, microfono
  styles/*.css             stili, in ordine di cascata
  pwa/                     manifest.json, sw.js (modello), _headers, icone
dist/                      ← generato da tools/build.mjs: è questo che si pubblica e si scarica
  index.html               un file unico (stili, script e dati dentro): funziona offline da file://, su https e nell'APK
  sw.js                    APP_VERSION = impronta di index.html: ogni build che cambia l'app fa comparire «Aggiorna»
tools/                     build.mjs, ux-audit.mjs, e2e.mjs, merge-contrib.mjs, lib/data.mjs (Node puro, zero dipendenze)
```

**Dopo ogni modifica in `src/`:** `node tools/build.mjs`, poi committa anche `dist/`.
La build si ferma se i dati non sono validi (chiavi doppie, sillabe ≠ caratteri, HTML) o se un file di
vocabolario, dialogo o traccia non è elencato in `src/index.html`. `node tools/build.mjs --check` dice se `dist/` è aggiornato.

**Aggiungere parole:** apri il file della sezione in `src/data/vocab/` e aggiungi una riga `["pin.yin","汉字","italiano"]`.
Una sezione nuova: un file nuovo `NNN-<id>.js` (copia la forma di uno esistente) e una riga `<script src="data/vocab/…">` in `src/index.html`.
I caratteri sono la chiave dei progressi: una parola esistente non cambia mai i suoi caratteri.

**Aggiungere o sostituire una traccia:** `src/audio/tracks/<id>.js` chiama
`CP.audioTracks.add({ id, ico, name, desc, mood: "calm" | "focus" | "energy", make(c, bus) })`; `make` restituisce
`{ step(until, now), stop() }`. Gli attrezzi (pluck, partials, flute, groove…) arrivano da `CP.synth`. Poi l'id va in
`audio/tracks/index.js` e il file in `src/index.html`.

## Pubblicare (Cloudflare Pages, il più semplice)

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → questo repository.
2. Build command: vuoto (`dist/` è già nel repository). Output directory: `dist`.
3. Dal telefono apri `https://….pages.dev` → menu del browser → «Aggiungi a schermata Home».

Su https il microfono chiede il permesso una volta sola; dopo il primo caricamento l'app funziona senza rete.
**Aggiornare:** basta `node tools/build.mjs` e un push: `APP_VERSION` cambia da solo e i telefoni vedono
«Nuova versione disponibile · Aggiorna». **Scaricare l'app come file:** `dist/index.html` funziona da solo, anche offline.

**Nome del repository:** GitHub ha tolto gli accenti e il repository si chiama `m-ndar-n-`. Conviene rinominarlo
`mandarino` (Settings → General → Repository name): i vecchi indirizzi vengono reindirizzati.

## Prove

```
node tools/build.mjs        # costruisce dist/ e controlla i dati
node tools/e2e.mjs          # 17 prove su dist/, ~1 minuto
node tools/ux-audit.mjs     # 0 problemi attesi; --quick = solo 360×740 tema chiaro
```
In più, dentro l'app: aggiungi `#selftest` all'indirizzo (24 controlli, tutti verdi).
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

Nuove in V6.7: `cp-community-contribs` (unione per id, vince la voce più recente), `cp-ux-v1` (benvenuto, legenda,
suggerimenti; unione), `cp-haptics`, `cp-sfxvol`, `cp-jkmood`, `cp-jkauto`, `cp-toneshapes`, `cp-contrib-nick`,
`cp-lang` (preferenze del dispositivo: vince quello corrente). `cp-game-v1.days[giorno]` ha due campi nuovi:
`nw` (parole nuove introdotte) e `nx` (permesso extra «Ancora 5 parole»). Il formato del backup resta `{app:"mandarino", v:5, kv, log}`.

## Che cosa resta aperto

- §5 fasi 2 e 3 (corso italiano per cinesi, correttore italiano): da decidere. La fase 1 è fatta: `I18N` + `t()`,
  lingua dei menu in ⚙️. I testi interni dei moduli più vecchi (esercizi, dialoghi, lettore, guida, Pensiero,
  laboratorio, oscilloscopio, contributi) sono ancora solo in italiano e vanno portati su `t()` un po' alla volta.
- La modalità a schermo pieno vale per la sessione di studio, l'Orecchio e la Sfida; per gli esercizi di Frasi
  (puzzle, laboratorio, dialoghi) non è ancora attiva.
- Facoltativa: una GitHub Action che lanci `merge-contrib.mjs` sulle issue con etichetta `contributo`.
