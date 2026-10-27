# Componenti di terzi

Tutto ciò che màndarínō contiene e non è stato scritto per màndarínō. I testi delle licenze stanno in `LICENZE/` e nella
schermata ⚙️ → Informazioni e supporto → Come funziona → Crediti. La build (`tools/build.mjs`) si ferma se in `src/vendor/`
compare un file, o in `src/data/` un dato esterno, che non è nominato qui.

| Componente | Licenza | Indirizzo | Versione / data | File nell'app |
|---|---|---|---|---|
| Make Me a Hanzi (Shaunak Kishore), dai font Arphic PL KaitiM GB e UKai | Arphic Public License (`LICENZE/ARPHIC-PUBLIC-LICENSE.txt`) | https://github.com/skishore/makemeahanzi | `graphics.txt` del ramo principale, importato il 2026-10-26 (commit non annotato) | `src/data/strokes.js` |
| Make Me a Hanzi (Shaunak Kishore), `dictionary.txt`, derivato da Unihan e CJKlib: solo la struttura dei caratteri (scomposizione, radicale, tipo, parte fonetica e semantica, componente di ogni tratto) | GNU LGPL 3.0 o successiva (`LICENZE/LGPL-3.0.txt`, `LICENZE/GPL-3.0.txt`) | https://github.com/skishore/makemeahanzi | `dictionary.txt` del ramo principale, ottobre 2026; definizioni, pinyin e spiegazioni tolti | `src/data/anatomy.js` |
| complete-hsk-vocabulary (Yanis Zafirópulos) | MIT (`LICENZE/MIT-complete-hsk-vocabulary.txt`) | https://github.com/drkameleon/complete-hsk-vocabulary | `complete.json` importato a ottobre 2026 (commit non annotato) | `src/data/levels.js`, `src/data/freq.js`, le parole HSK aggiunte al vocabolario |
| py-fsrs (Open Spaced Repetition), porting in JavaScript | MIT (`LICENZE/MIT-py-fsrs.txt`) | https://github.com/open-spaced-repetition/py-fsrs | FSRS-6, 21 parametri, dal ramo principale (2026) | `src/core/fsrs.js` |
| jsQR (Cosmo Wolfe) | Apache 2.0 (`LICENZE/APACHE-2.0-jsQR.txt`) | https://github.com/cozmo/jsQR | 1.4.0, copia minificata non modificata | `src/vendor/jsqr.min.js` |
| wikidict-it, dati di Wikidata | CC0 1.0 | https://github.com/open-dict-data/wikidict-it | `zh-it_wiki.txt`, ottobre 2026 | `src/data/wiki/zh-it.txt` |
| Morph-it! (Eros Zanchetta, Marco Baroni, Università di Bologna): genere, plurale e forme degli aggettivi | doppia licenza CC BY-SA 2.0 / LGPL, usata con la LGPL (`LICENZE/MORPH-IT.txt`) | https://docs.sslmit.unibo.it/doku.php?id=resources:morph-it | 0.48 (`morph-it_048.txt`) | `src/data/it/lexicon.js` |
| Campioni della musica: VSCO 2 CE, VCSL, Osiris Piano, Karoryfer Samples, sfzinstruments, BigSoundBank | CC0 | vedi `src/audio/CREDITI-MUSICA.md` | — | dentro i brani di `src/audio/music/` |
| jSteelDrum | pubblico dominio (Unlicense) | vedi `src/audio/CREDITI-MUSICA.md` | — | dentro i brani di `src/audio/music/` |

## Solo durante lo sviluppo, non contenuti nell'app

- **CC-CEDICT** (MDBG, CC BY-SA 4.0): controllo del pinyin (`tools/cedict-check.mjs`). Volutamente non entra nei dati,
  perché la sua licenza obbligherebbe a ridistribuirli con la stessa licenza.
- **Morph-it!**: controllo dell'italiano (`tools/morphit-check.mjs`), oltre al lessico sopra.
- **Dizionario Hunspell it_IT di LibreOffice**: controllo ortografico (`tools/hunspell-check.py`).
- **Playwright** (Apache 2.0): prove automatiche e generazione delle icone.
- **Inter**: solo per disegnare le icone PNG con `tools/icons.mjs`; il carattere non è contenuto nell'app.

## Da verificare (note per l'autore)

- **Morph-it!**: la doppia licenza CC BY-SA 2.0 / LGPL viene da fonti secondarie (due pacchetti npm che la usano). Le
  pagine ufficiali non erano raggiungibili da qui. Va controllata sul sito dell'Università di Bologna, insieme alla
  versione della LGPL, prima di pubblicare; poi va copiato il testo completo in `LICENZE/`.
- **Versioni**: per Make Me a Hanzi e complete-hsk-vocabulary il commit esatto non è stato annotato al momento
  dell'import. `tools/strokes.mjs` e `tools/levels.mjs` scrivono la data; al prossimo aggiornamento conviene annotare
  anche il commit.
