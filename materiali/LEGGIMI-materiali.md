# Materiali per màndarínō

Materiale pronto per il **Task 12** (ciclo guidato «impara, esercitati, verifica», ripasso con scelta multipla, frasi a buco,
digitazione, lettura graduata). Non fa parte del repository: sta in una cartella a parte e si copia nel repository solo ciò
che serve (vedi «Che cosa copiare nel repository»). Tutto è in sola lettura rispetto all'app: nessun file qui cambia il codice.

Costruito il 27 ottobre 2026 dal repository `longhitown/mandarino` al commit `70a2485` e **riverificato al commit `c591ffe`** (il vocabolario, i livelli, gli esempi e il lessico italiano non sono cambiati: rigenerando tutto da quel commit i file «frasi» e «testi» risultano identici byte per byte) e dai file pubblici di Tatoeba
(esportazione del 24 ottobre 2026). Le fonti e le licenze sono in [FONTI-E-LICENZE.md](FONTI-E-LICENZE.md).

## Che cosa c'è

```
frasi/
  frasi-zh-it-scelta.tsv     2.484 frasi cinese→italiano già scelte (circa 450 per livello, con la copertura di 2.818 parole)
  frasi-zh-it-tutte.tsv      30.231 righe (18.524 frasi cinesi distinte): il serbatoio da cui si pesca; NON metterlo nell'app
  frasi-it-zh-scelta.tsv     3.048 frasi italiano→cinese (tutte quelle con audio e le più semplici senza)
  frasi-it-zh-tutte.tsv      47.764 righe: il serbatoio
testi/
  testi-zh.json              15 testi graduati di cinese (livelli 1-5), con domande di comprensione
  testi-it.json              8 testi graduati di italiano per chi parla cinese (A1-B1), con domande
audio/it/                    434 clip di voce italiana reale (Tatoeba, CC BY 4.0) in Opus mono, 12,9 minuti, 2,6 MB: frasi semplici (400 di livello A1), 231 con
                             traduzione cinese. indice.tsv elenca solo quelle presenti. Su Tatoeba ce ne sono 1.548: altre si scaricano con strumenti/scarica-audio-it.py <numero>
audio/zh/                    720 clip di voce cinese reale (Common Voice 27.0, CC0), 4,9 MB in Opus mono, frasi quotidiane fatte solo di parole dell'app;
                             indice.tsv (frase, pinyin, tagli, livello, durata...)
runtime/                     i dati COMPATTI da mettere nell'app (JSON, circa 470 KB in tutto, da leggere al primo uso): frasi, testi e indici delle voci,
                             senza tagli e pinyin (l'app li ricalcola). Li crea strumenti/compatta.py
dati/insiemi-confondibili.json   gruppi di elementi grammaticali da confondere, per le frasi a buco grammaticali
riferimenti/digitazione.mjs  codice di esempio provato: pinyin digitato (numeri, accenti, senza toni) e italiano (accenti, refusi)
crediti/autori-frasi.tsv     441 autori delle frasi della scelta (l'attribuzione che chiede la licenza)
strumenti/                   gli script con cui è stato costruito tutto (Python, solo libreria standard) e i testi sorgente
```

## Formato dei file

**`frasi-zh-it-*.tsv`** (tabulazioni, UTF-8, prima riga = intestazioni)

- `zh_id`, `it_id`: numeri delle frasi su Tatoeba (`https://tatoeba.org/sentences/show/<id>`). Sono anche il modo di citare ogni frase.
- `via`: `dir` = traduzione diretta su Tatoeba; `eng` = le due frasi sono collegate tramite l'inglese (di solito va bene, ma è meno sicura: per le prove e per il primo uso preferire `dir`).
- `lv`: livello **dell'app** (1-5 = HSK 1-5 come in `src/data/levels.js`; 6 = HSK 6 o oltre), cioè il livello più alto tra le parole della frase.
- `n_parole`, `tagli`, `pinyin`: la frase tagliata in parole (separate da spazio) con il vocabolario dell'app e il pinyin delle parole (dal vocabolario, senza contesto: per le parole con più letture vale la prima). **Tutte le parole sono nel vocabolario dell'app**: le frasi con parole ignote sono state scartate.
- `zh`: frase in cinese **semplificato**. Dove l'originale era tradizionale è usata la conversione in semplificato che Tatoeba stessa pubblica.
- `it`: traduzione italiana.
- `autore_zh`, `autore_it`: utenti Tatoeba che hanno scritto le due frasi (obbligo di citazione, vedi sotto).
- `audio_it`: numero del file audio italiano (CC BY 4.0), se esiste.
- `flag`: `sensibile` = contiene argomenti delicati (morte, violenza, sesso, droghe…). **Le righe `sensibile` non sono nei file «scelta»**; nei file «tutte» ci sono, segnate, e vanno escluse a meno di una rilettura.

**`frasi-it-zh-*.tsv`**: `it_id`, `it`, `zh`, `via`, `livello`, `rango_max`, `n_parole`, `autore_it`, `autore_zh`, `audio_it`, `flag`.
`livello` (A1, A2, B1, B2+) è solo una **stima grezza per frequenza delle parole** nel corpus di Tatoeba (che è sbilanciato: pieno
di «Tom» e di frasi tradotte dall'inglese): non è il livello CEFR e non coincide con le lezioni del corso. Per decidere
quale lezione o livello serve una frase, usare il lessico del corso (`src/data/it/lexicon.js`) e `CP.ita`. `zh` può essere vuoto
(frasi con audio ma senza traduzione cinese utile).

**`testi-zh.json`**: elenco di testi. Per ogni testo: `id`, `livello` (massimo livello delle sue parole, calcolato), `titolo {zh, it}`,
`frasi [{zh, it, parole [{w, py, lv}]}]`, `domande [{frase, domanda_it, scelte_it[], giusta}]` (`frase` = indice della frase a cui si
riferisce), `autore`, `licenza`, `stato`. Tutte le frasi usano **solo parole del vocabolario dell'app** (controllato con
`strumenti/controlla_testi_zh.py`; la build dell'app lo deve ricontrollare con `core/segment.js`).

**`testi-it.json`**: come sopra, con `livello` A1-B1 (scelto da chi scrive, non calcolato), `frasi [{it, zh}]` e
`domande [{frase, domanda_zh, domanda_it, scelte_it[], giusta}]`.

**`insiemi-confondibili.json`**: `zh` e `it`, ogni insieme con `id`, `membri` e una nota (italiana per il cinese, cinese per l'italiano).

**`audio/it/indice.tsv`**: `audio_id`, `it_id`, `testo`, `zh`, `livello`, `parlante`, `licenza`, `fonte`, `durata_s`, `byte`, `presente` (1 se il file `.ogg` è qui).

## I file compatti per l'app (`runtime/`)

Sono quelli da portare nel repository. Ogni file ha `campi` (i nomi delle colonne, nello stesso ordine di `righe`).

- `frasi-zh.json`: `[zh, it, lv, zh_id, it_id, diretta]` (189 KB, 2.484 frasi).
- `frasi-it.json`: `[it, zh, livello, it_id, audio_id]` (179 KB, 3.048 frasi). `audio_id` è 0 se la clip non c'è nel pacchetto (434 sì, le altre no).
- `voce-zh.json`: `[audio_id, chiave, frase, lv, durata_s]` (53 KB, 720 clip). **`chiave`** è la frase normalizzata per cercare la clip: solo i caratteri cinesi, senza punteggiatura né spazi. File audio: `audio/zh/<audio_id>.ogg`.
- `voce-it.json`: `[audio_id, chiave, testo, livello, durata_s]` (28 KB, 434 clip). **`chiave`** = minuscolo, apostrofi normali, punteggiatura tolta, spazi singoli (come `normalizeIt` in `riferimenti/digitazione.mjs`, ma senza togliere gli accenti). File audio: `audio/it/<audio_id>.ogg`.
- `testi-zh.json`, `testi-it.json`: i testi senza i tagli in parole (18 KB e 8 KB).
- I campi `credito` e `ext` dei file voce dicono che cosa scrivere nei Crediti e l'estensione dei file.

Gli ID di Tatoeba (`zh_id`, `it_id`) servono a citare la frase (`https://tatoeba.org/sentences/show/<id>`); gli autori stanno in `crediti/autori-frasi.tsv`.

**Peso complessivo da portare nell'app:** dati compatti circa 470 KB (letti al primo uso) + audio 7,5 MB (cinese 4,9, italiano 2,6).

## Regole da rispettare

1. **Attribuzione** (CC BY): vedi [FONTI-E-LICENZE.md](FONTI-E-LICENZE.md). Nell'app, nei Crediti, una voce «Frasi: Tatoeba (tatoeba.org), CC BY 2.0 FR» con rinvio a `crediti/autori-frasi.tsv`, e una per l'audio italiano («voce: NM1, Tatoeba, CC BY 4.0»).
2. **Niente dati nell'app che non siano ricontrollati dalla build**: i tagli e i livelli qui sono calcolati con un algoritmo semplice (programmazione dinamica sul vocabolario). Il taglio ufficiale è `core/segment.js`.
3. **Non copiare i file «tutte» nel repository**: sono il serbatoio (9,5 MB). Servono come ingresso degli strumenti.
4. **I testi originali sono bozze**: scritti da Claude per questo progetto, controllati solo dai programmi. Prima della pubblicazione vanno riletti da un madrelingua (c'è `tools/review-sample.mjs` nel repository per questo).
5. **Le traduzioni «eng»** sono state collegate tramite l'inglese: nei testi di verifica (quiz) usare solo `dir` o rileggerle.

## Che cosa copiare nel repository (consigliato)

- `runtime/*.json` (circa 470 KB): sono i dati dell'app, già nella forma giusta.
- `audio/it/` (434 clip, 2,6 MB) e `audio/zh/` (720 clip, 4,9 MB): **in tutto circa 7,5 MB**, con i rispettivi `indice.tsv`.
- `dati/insiemi-confondibili.json`, `riferimenti/digitazione.mjs` e le sue prove, `crediti/autori-frasi.tsv`.
- Non copiare: i file `frasi/*-tutte.tsv` (serbatoio), le versioni TSV «scelta» (ci sono già in `runtime/`), `strumenti/` (a meno di volerli versionare) e le copie grezze di Tatoeba.

## Come rigenerare

Servono: Python 3, `ffmpeg` (con libopus), una copia del repository e i file di Tatoeba in `tatoeba-raw/` (vedi `FONTI-E-LICENZE.md` per gli indirizzi).

```
export MANDARINO_LAVORO=cartella-di-lavoro   # contiene tatoeba-raw/
export MANDARINO_REPO=percorso/del/repository
python strumenti/costruisci-frasi-zh-it.py
python strumenti/costruisci-frasi-it-zh.py
python strumenti/assembla.py                 # scelte, testi, JSON  → uscita/
python strumenti/scarica-audio-it.py 400     # scarica le prime 400 clip per priorità (A1, A2, con traduzione cinese); senza numero tutte (lento: circa 3-7 clip al minuto; si può interrompere e riprendere)
python strumenti/converti-audio-it.py        # mp3 → ogg Opus 24 kbit/s, scrive audio/it/indice.tsv (solo le clip presenti)
python strumenti/compatta.py                 # rigenera runtime/ dai file sopra
```

### Voci cinesi reali (Common Voice), sul computer dell'autore

Fatti verificati con l'API pubblica di Mozilla Data Collective (`cv-scarica.py dettagli`, non serve la chiave):
**Scripted Speech 27.0** (`cmu5lcunh00qimh078sdd5so8`) è un archivio `.tar.gz` di **22,98 GB**, MP3, licenza **CC0-1.0**;
**Spontaneous Speech 5.0** (`cmu60so4600hto107mg006pl7`) pesa solo **124.840 byte** (0,12 MB), CC0-1.0: scaricato e ispezionato, **contiene una sola clip** (inutile, escluso). Sul disco C: ci sono circa 18,5 GB liberi
(H: 17,6 GB): **l'archivio intero non entra**, quindi si scarica solo una parte.

```
pip install datacollective
mkdir C:\cv                                   # fuori da OneDrive e da Git
# in C:\cv crea il file .env con una sola riga:  MDC_API_KEY=la-tua-chiave   (Profilo → API su Mozilla Data Collective)
# le condizioni d'uso di ogni dataset si accettano una volta sul sito
python strumenti/cv-scarica.py dettagli                                     # dimensioni e licenze, senza chiave
python strumenti/cv-scarica.py campione parlato --cartella C:\cv            # il campione dell'editore (se esiste): mostra il formato vero
python strumenti/cv-scarica.py parziale parlato --max-gb 3 --cartella C:\cv # scarica i primi 3 GB e si ferma (riprende se rilanci con piu GB)
python strumenti/cv-scarica.py intero spontaneo --cartella C:\cv            # il piccolo: tutto
python strumenti/cv-seleziona.py --ispeziona C:\cv\<archivio.tar.gz.part>  # PRIMO PASSO: file e colonne veri
python strumenti/cv-seleziona.py --archivio C:\cv\<archivio.tar.gz.part>   # simulazione: quante clip per livello
python strumenti/cv-seleziona.py --archivio C:\cv\<archivio.tar.gz.part> --scrivi   # converte in Opus: uscita/audio/zh/ e indice.tsv
```

**Come funziona il download parziale** (verificato leggendo il codice della libreria `datacollective` 0.7.0): `download_dataset` scrive in un file
`<nome>.tar.gz.part` a blocchi da 64 KB e sa riprendere; `cv-scarica.py parziale` lo lancia in un processo a parte e lo ferma a N GB. Un `.tar.gz`
troncato si legge in sequenza fino al punto in cui arriva: `cv-seleziona.py --archivio` fa due passate (dati e elenco delle clip; poi estrae
solo le clip scelte) e non decomprime tutto su disco. **Rischio:** se i file di dati (`validated.tsv`) stanno in fondo all'archivio, nei primi N GB
non ci sono e senza di loro le clip non hanno frasi: lo script lo dice (esce con codice 4). In quel caso: più GB, oppure il campione dell'editore.
Le clip dei primi GB possono venire da pochi parlanti (dipende dall'ordine dell'archivio): lo script stampa quanti parlanti ha trovato.

### Risultato (27 ottobre 2026)

- Scaricati **3 GB su 23** dell'archivio (`cv-scarica.py parziale --max-gb 3`): i file di dati stanno **prima** delle clip, quindi il parziale funziona; nei 3 GB ci sono 79.322 clip e 380 parlanti diversi.
- `cv-seleziona.py --archivio <...part> --budget-mb 8 --scrivi` ha scelto **720 clip, 4,78 MB reali** (4,92 MB con l'indice), 37,7 minuti, 384 parlanti, 718 frasi diverse, **1.229 parole dell'app** coperte. Quote per livello: 100 / 150 / 180 / 150 / 100 / 40.
- **Filtri di qualità** (tutti in `cv-seleziona.py`, modificabili): voti favorevoli ≥ 2 e nessuno contrario; frasi di 4-20 caratteri; **solo parole del vocabolario dell'app**; durata 1-7 s; **fonti escluse**: Wikipedia (frasi enciclopediche, date, nomi: 8.578 clip candidate su 13.951, quasi tutte dei livelli 4-6), traduzioni dall'inglese, testi legali o tecnici; **frasi segnalate** dalla comunità (`reported.tsv`); **temi esclusi** (sesso, violenza, autolesionismo, politica, religione, alcol e tabacco, slogan e linguaggio amministrativo, battute da internet); al massimo 25 clip per parlante e 2 per frase (la seconda con un altro parlante).
- **Limiti:** voci maschili 310, femminili 124, non dichiarate 286 (squilibrio dovuto ai dati); qualche frase resta ufficiale o poco naturale (es. «立法院围墙»); **vanno rilette da un madrelingua**. Per togliere frasi: aggiungerle a `BLOCCO` in `cv-seleziona.py` e ripetere la selezione (o cancellarle dall'indice e dalla cartella).
- **Nell'intero archivio** ci sono 5.373 clip candidate di fonti conversazionali (1.473 frasi): per averne di più basta scaricare più GB (`--max-gb`, si riprende da dove si era arrivati) e rilanciare la selezione.
- **Peso: l'app è offline e non scarica nulla in esecuzione.** Le clip scelte pesano poco: `--budget-mb` (di base 10 MB) è un tetto, `--quote` dà le clip per livello, `--bitrate` 20 kbit/s Opus. I giga di Common Voice stanno solo sul computer di chi prepara i dati (`C:\cv`, cancellabile), mai nell'app.
- *Spontaneous Speech 5.0* (CC0): scaricato e ispezionato, contiene **una sola clip**: escluso.

## Limiti, detti chiaramente

- **Audio cinese reale:** su Tatoeba quasi tutte le registrazioni cinesi non hanno una licenza che ne consenta il riuso (campo vuoto: 5.741 su 5.825) o sono «non commerciali» (84): escluse. Le voci cinesi reali vengono da **Common Voice (CC0)**: 720 clip già scelte in `audio/zh/` (vedi «Risultato»). Sono frasi, non parole singole; i filtri sono automatici e **non sostituiscono una rilettura**.
- **Non esistono, per quanto ho trovato, letture graduate aperte per il cinese moderno** (le raccolte esistenti sono a pagamento o con licenza che vieta la ridistribuzione con le licenze del progetto). I 15 + 8 testi qui sono originali e servono da campione del formato.
- **Livelli**: il livello cinese segue le liste del progetto (HSK 3.0, `levels.js`); il livello italiano è una stima.
- **Qualità delle frasi di Tatoeba**: è un corpus di volontari. Nel campione che ho letto le frasi sono per lo più naturali e corrette, con qualche traduzione libera, registro diverso («tu» / «Lei») o contenuto banale. Le prove automatiche non possono sostituire una rilettura.
