# Componenti di terzi

Tutto ciò che màndarínō contiene e non è stato scritto per màndarínō. I testi delle licenze stanno in `LICENZE/` e nella
schermata ⚙️ → Informazioni → Come funziona → Crediti. La build (`tools/build.mjs`) si ferma se in `src/vendor/`
compare un file, o in `src/data/` un dato esterno, che non è nominato qui. Il sito (`docs/`) usa anche le tre parti elencate sotto «Solo per il sito».

| Componente | Licenza | Indirizzo | Versione / data | File nell'app |
|---|---|---|---|---|
| Make Me a Hanzi (Shaunak Kishore), dai font Arphic PL KaitiM GB e UKai | Arphic Public License (`LICENZE/ARPHIC-PUBLIC-LICENSE.txt`) | https://github.com/skishore/makemeahanzi | `graphics.txt` del ramo principale, importato il 2026-10-26 (commit non annotato) | `src/data/strokes.js` |
| Make Me a Hanzi (Shaunak Kishore), `dictionary.txt`, derivato da Unihan e CJKlib: solo la struttura dei caratteri (scomposizione, radicale, tipo, parte fonetica e semantica, componente di ogni tratto) | GNU LGPL 3.0 o successiva (`LICENZE/LGPL-3.0.txt`, `LICENZE/GPL-3.0.txt`) | https://github.com/skishore/makemeahanzi | `dictionary.txt` del ramo principale, ottobre 2026; definizioni, pinyin e spiegazioni tolti | `src/data/anatomy.js` |
| Make Me a Hanzi (Shaunak Kishore), `dictionary.txt`: le «ricette» del Laboratorio dei radicali (1610 caratteri del vocabolario fatti di due componenti), ricavate da `src/data/anatomy.js` con `tools/radicali.mjs`; nessun dato in più | GNU LGPL 3.0 o successiva (`LICENZE/LGPL-3.0.txt`, `LICENZE/GPL-3.0.txt`) | https://github.com/skishore/makemeahanzi | derivato da `src/data/anatomy.js`, ottobre 2026 | `src/data/lab-recipes.js` |
| Tatoeba (tatoeba.org), frasi cinese–italiano e italiano–cinese scelte per gli esercizi e la lettura (2.484 + 3.048), con il numero di ogni frase; autori in `materiali/crediti/autori-frasi.tsv` (441) | CC BY 2.0 Francia | https://tatoeba.org/en/downloads | esportazione del 24 ottobre 2026 | `src/data/ex/frasi-zh.js`, `src/data/ex/frasi-it.js`, `materiali/runtime/` |
| Mozilla Common Voice Scripted Speech 27.0, cinese (Cina): 720 clip di voce (Opus, 20 kbit/s) e le loro frasi; nessun dato dei parlanti | CC0-1.0 | https://commonvoice.mozilla.org | archivio del 17 settembre 2026 (scelta di ottobre 2026) | `src/data/ex/voce-zh.js`, `materiali/audio/zh/` |
| Tatoeba, audio italiano: 434 clip della voce «NM1» (Opus) | CC BY 4.0 | https://tatoeba.org | ottobre 2026 | `src/data/ex/voce-it.js`, `materiali/audio/it/` |
| complete-hsk-vocabulary (Yanis Zafirópulos) | MIT (`LICENZE/MIT-complete-hsk-vocabulary.txt`) | https://github.com/drkameleon/complete-hsk-vocabulary | `complete.json` importato a ottobre 2026 (commit non annotato) | `src/data/levels.js`, `src/data/freq.js`, le parole HSK aggiunte al vocabolario |
| py-fsrs (Open Spaced Repetition), porting in JavaScript | MIT (`LICENZE/MIT-py-fsrs.txt`) | https://github.com/open-spaced-repetition/py-fsrs | FSRS-6, 21 parametri, dal ramo principale (2026) | `src/core/fsrs.js` |
| jsQR (Cosmo Wolfe) | Apache 2.0 (`LICENZE/APACHE-2.0-jsQR.txt`) | https://github.com/cozmo/jsQR | 1.4.0, copia minificata non modificata | `src/vendor/jsqr.min.js` |
| jsPDF (James Hall e yWorks GmbH), scrive il PDF del «Foglio di lavoro» | MIT (`LICENZE/MIT-jspdf.txt`) | https://github.com/parallax/jsPDF | 4.2.1, `dist/jspdf.umd.min.js` del pacchetto npm, copia non modificata | `src/vendor/jspdf.umd.min.js` (gruppo FOGLIO, caricato solo al primo uso) |
| wikidict-it, dati di Wikidata | CC0 1.0 | https://github.com/open-dict-data/wikidict-it | `zh-it_wiki.txt`, ottobre 2026 | `src/data/wiki/zh-it.txt` |
| Morph-it! (Marco Baroni, Eros Zanchetta, Università di Bologna), © 2004-2009: genere, plurale e forme degli aggettivi | doppia licenza CC BY-SA 2.0 / LGPL, usata con la LGPL (`LICENZE/MORPH-IT.txt`, `LICENZE/LGPL-2.1.txt`) | https://docs.sslmit.unibo.it/doku.php?id=resources:morph-it | 0.4.8, 23 febbraio 2009 (`morph-it_048.txt`) | `src/data/it/lexicon.js` |
| Campioni della musica: VSCO 2 CE, VCSL, Osiris Piano, Karoryfer Samples, sfzinstruments, BigSoundBank | CC0 | vedi `src/audio/CREDITI-MUSICA.md` | — | dentro i brani di `src/audio/music/` |
| jSteelDrum | pubblico dominio (Unlicense) | vedi `src/audio/CREDITI-MUSICA.md` | — | dentro i brani di `src/audio/music/` |

## Solo per il sito (non contenute nell'app)

Servono alla pagina di presentazione e alle microprove (`docs/`). Sono copiate nel repository, mai caricate da servizi esterni; i testi delle licenze sono in `docs/licenze/` e il sito li cita nel piè di pagina.

| Componente | Licenza | Indirizzo | Versione | File |
|---|---|---|---|---|
| Hanzi Writer (David Chanin) | MIT (`docs/licenze/HANZI-WRITER-MIT.txt`) | https://hanziwriter.org, https://github.com/chanind/hanzi-writer | 3.7.3, copia minificata non modificata | `docs/assets/vendor/hanzi-writer.min.js` |
| canvas-confetti (Kiril Vatev) | ISC (`docs/licenze/CANVAS-CONFETTI-ISC.txt`) | https://github.com/catdad/canvas-confetti | 1.9.4, copia non modificata | `docs/assets/vendor/confetti.browser.js` |
| Dati dei tratti di 8 caratteri, dal pacchetto `hanzi-writer-data` (Make Me a Hanzi, font Arphic PL KaitiM GB e UKai) | Arphic Public License (`docs/licenze/ARPHIC-PUBLIC-LICENSE.txt`) | https://github.com/chanind/hanzi-writer-data | 2.0.1 | `docs/assets/dati/hanzi.json` |

Gli estratti di musica del sito (`docs/audio/`) vengono dai brani dell'app e hanno la stessa licenza (CC BY 4.0).

## Solo durante lo sviluppo, non contenuti nell'app

- **CC-CEDICT** (MDBG, CC BY-SA 4.0): controllo del pinyin (`tools/cedict-check.mjs`). Volutamente non entra nei dati,
  perché la sua licenza obbligherebbe a ridistribuirli con la stessa licenza.
- **Morph-it!**: controllo dell'italiano (`tools/morphit-check.mjs`), oltre al lessico sopra.
- **Dizionario Hunspell it_IT di LibreOffice**: controllo ortografico (`tools/hunspell-check.py`).
- **Playwright** (Apache 2.0): prove automatiche e generazione delle icone.
- **Inter**: solo per disegnare le icone PNG con `tools/icons.mjs`; il carattere non è contenuto nell'app.

## Note sulle licenze

- **Morph-it!**: la doppia licenza (CC BY-SA 2.0 o LGPL) è quella dichiarata nel file `readme-morph-it.txt` della versione 0.4.8, ufficiale, che si trova in `LICENZE/MORPH-IT.txt` insieme ai ringraziamenti; il testo della LGPL 2.1 distribuito con Morph-it! è in `LICENZE/LGPL-2.1.txt`. `src/data/it/lexicon.js` è un estratto modificato (solo le parole del corso) e porta nell'intestazione l'avviso di modifica.
- **Versioni**: per Make Me a Hanzi e complete-hsk-vocabulary il commit esatto non è stato annotato al momento dell'import. `tools/strokes.mjs` e `tools/levels.mjs` scrivono la data; al prossimo aggiornamento
  conviene annotare anche il commit.

## Librerie valutate e non adottate (ottobre 2026)

Per non aggiungere codice che non serve, queste sono state lette e **non** sono nell'app; qui sta il perché, per non rifare la stessa valutazione.

- **Pitchy** (MIT, McLeod Pitch Method): l'app ha già il suo NSDF in `src/voice/pitch.js`; la chiarezza del segnale si ricava già dal massimo della NSDF.
- **RecordRTC / Extendable-Media-Recorder** (MIT): ne abbiamo preso solo l'idea di un unico gestore del flusso di microfono (`src/voice/mic.js`), senza il codice.
- **Perfect Freehand** (MIT): la lavagna (`src/voice/pad.js`) disegna già un tratto morbido a spessore variabile con curve quadratiche.
- **html-to-image** (MIT): le carte da condividere hanno già un motore a canvas unico (`src/ui/share-card.js`); non serve un secondo generatore.
- **Vosk, Sherpa-ONNX** (Apache-2.0): riconoscimento vocale offline, valutato come lavoro futuro per l'APK (modelli da decine di MB); non necessario oggi.
- **RosaeNLG, regole italiane di LanguageTool** (MIT / LGPL): utili come riferimento in sviluppo per estendere il correttore di frasi italiane; non entrano nell'app.
- **pinyin-pro, nodejieba** (MIT): possibili controlli in `tools/` sul pinyin e sul taglio delle frasi; non entrano nell'app.
