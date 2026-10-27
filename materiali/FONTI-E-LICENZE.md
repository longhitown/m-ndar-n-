# Fonti e licenze dei materiali

Regola del progetto: nei dati dell'app entrano solo materiali con licenza che consenta di ridistribuirli con le licenze del
progetto (codice MIT, contenuti CC BY 4.0). **Restano fuori i materiali «share-alike» (CC BY-SA) e «non commerciali» (NC).**
Verifica fatta il 27 ottobre 2026; dove non ho potuto verificare lo dico.

## Usati

### Tatoeba, frasi (testo)
- Licenza: **CC BY 2.0 Francia** (alcune frasi anche CC0). Condizione: **citare l'autore** di ogni frase; le traduzioni sono opere derivate. Le condizioni di una licenza si possono aggiungere, non togliere.
- Fonte: <https://tatoeba.org/en/downloads> e <https://tatoeba.org/en/terms_of_use>.
- File usati (esportazione settimanale del 24 ottobre 2026, base `https://downloads.tatoeba.org/exports/`):
  - `per_language/cmn/cmn_sentences_detailed.tsv.bz2` (1,7 MB): frasi cinesi con nome dell'autore.
  - `per_language/ita/ita_sentences_detailed.tsv.bz2` (15 MB): frasi italiane con nome dell'autore.
  - `per_language/cmn/cmn-ita_links.tsv.bz2` (28 KB): traduzioni dirette cinese–italiano (4.747 coppie).
  - `per_language/cmn/cmn-eng_links.tsv.bz2` (0,5 MB) e `per_language/eng/eng-ita_links.tsv.bz2` (3,8 MB): per collegare cinese e italiano tramite l'inglese (altre 70.319 coppie).
  - `per_language/cmn/cmn_transcriptions.tsv.bz2` (2,6 MB): le versioni in cinese semplificato delle frasi in tradizionale.
  - `sentences_with_audio.tar.bz2` (6,4 MB): elenco delle frasi con audio, parlante e licenza.
- **Come citare nell'app** (Crediti): «Frasi d'esempio: Tatoeba (tatoeba.org), contributori, licenza CC BY 2.0 FR», con rinvio all'elenco dei 441 autori (`crediti/autori-frasi.tsv`) e, per ogni frase usata, il numero (`zh_id`, `it_id`).
- Uso automatico: le condizioni vietano di sovraccaricare il sito (art. 8.4). Gli audio sono stati scaricati in sequenza, con 3 richieste in parallelo e pause (nome del programma e indirizzo del progetto nell'intestazione). Non scaricare in massa a velocità maggiore.

### Tatoeba, audio italiano
- 1.591 frasi italiane con audio, **tutte di un solo parlante («NM1») e tutte con licenza CC BY 4.0** (verificato nel campo licenza dell'elenco). Condizione: citare il parlante e Tatoeba. **Nel pacchetto: 434 clip (2,6 MB)**, le più semplici e con traduzione cinese per prime.
- Indirizzo di ogni file: `https://tatoeba.org/audio/download/<audio_id>`.
- Una voce sola: va bene per il corso, ma ricordare che una voce sola non basta per allenare l'orecchio (più parlanti sono meglio: Task 8 del progetto).

### Mozilla Common Voice, cinese (Cina): voci reali
- Dataset nell'account dell'autore su Mozilla Data Collective, **verificati con l'API pubblica** (`get_dataset_details`, senza chiave):
  - **Common Voice Scripted Speech 27.0, cinese (Cina)**: ID `cmu5lcunh00qimh078sdd5so8`, slug `common-voice-scripted-speech-27-0-chines-b098f12c`, archivio `.tar.gz` di **22,98 GB** (22.978.420.467 byte), MP3, creato il 17 settembre 2026, editore *Mozilla Common Voice*, gratuito, **licenza «Creative Commons Zero v1.0 Universal (CC0-1.0)»**. Descrizione ufficiale: «read speech recordings». Non conosco numero di clip né ore.
  - **Common Voice Spontaneous Speech 5.0, cinese (Cina)**: ID `cmu60so4600hto107mg006pl7`, slug `common-voice-spontaneous-speech-5-0-chin-b0e1d413`, **124.840 byte** (0,12 MB), MP3, CC0-1.0. **Scaricato e ispezionato il 27 ottobre 2026: contiene UNA sola clip** (un solo parlante, 20 secondi, trascrizione ancora «in attesa», 0 ore validate; il suo stesso README lo dice). **Non serve a nulla: escluso.**
- **Scripted Speech 27.0** è quello utile: frasi lette ad alta voce (dominio pubblico). Si scelgono le clip con frasi fatte solo di parole dell'app. CC0 non richiede attribuzione, ma conviene citarlo nei Crediti («voci: Mozilla Common Voice, CC0»).
- **Spontaneous Speech 5.0**: vedi sopra, una sola clip, escluso. (In generale il parlato libero avrebbe vocabolario aperto e probabili riferimenti personali.)
- **Spazio:** l'archivio da 23 GB non entra sul disco dell'autore (C: circa 18,5 GB liberi, H: 17,6 GB). Si scarica solo una parte (`cv-scarica.py parziale`).
- **Fatto:** scaricati 3 GB su 23, scelte **720 clip (4,8 MB)** di fonti conversazionali, senza Wikipedia né traduzioni dall'inglese, senza frasi segnalate né temi esclusi (dettagli in `LEGGIMI.md`, «Risultato»). Licenza delle clip e delle frasi: **CC0-1.0**; `audio/zh/indice.tsv` riporta fonte (slug del dataset) e licenza di ogni riga. Dati personali: l'indice non contiene l'identificativo del parlante (solo un numero progressivo), né età; il genere e l'accento, dichiarati volontariamente dai parlanti, restano come metadato e **non vanno mostrati**.
- Accesso: libreria ufficiale `datacollective` 0.7.0 (<https://github.com/Mozilla-Data-Collective/datacollective-python>): `pip install datacollective`; chiave nella variabile `MDC_API_KEY` o in un `.env` nella cartella da cui si lancia (la libreria lo cerca da lì verso l'alto); cartella di download in `MDC_DOWNLOAD_PATH` (altrimenti `~/.mozdata/datasets`); `download_dataset` riprende da solo grazie ai file `.part` e `.checksum`; `download_sample` scarica il campione dell'editore (serve la chiave e le condizioni accettate; se il dataset non ne pubblica uno risponde 404). Le condizioni d'uso si accettano sul sito.
- **La chiave API è un segreto dell'autore:** mai in un file del repository, mai in un messaggio, mai in un prompt, mai in una cartella sincronizzata (OneDrive). `cv-scarica.py` rifiuta di lavorare dentro OneDrive e controlla soltanto che il `.env` esista, senza mai leggerlo.
- **Formato di Scripted Speech 27.0, verificato sull'archivio vero** (primi 0,33 GB): cartella `cv-corpus-27.0-2026-09-11/zh-CN/` con `README.md`, `clip_durations.tsv`, `dev.tsv`, `invalidated.tsv`, `other.tsv`, `reported.tsv`, `test.tsv`, `train.tsv`, `unvalidated_sentences.tsv`, **`validated.tsv`** (190.406 righe, 56 MB), `validated_sentences.tsv` **e poi le clip**. I file di dati vengono **prima** delle clip: per questo un download parziale basta. Colonne di `validated.tsv`: `client_id, path, sentence_id, sentence, sentence_domain, up_votes, down_votes, age, gender, accents, variant, locale, segment`.
- **Quanto materiale utile c'è in tutto l'archivio** (calcolato su `validated.tsv`, voti ≥ 2 senza voti contrari, 4-20 caratteri, solo parole dell'app): **3.950 frasi distinte, 13.951 clip**, che coprono **3.178 delle 6.380 parole** dell'app. Frasi distinte per livello: 168 (1), 407 (2), 749 (3), 973 (4), 984 (5), 669 (6). Le frasi dei primi livelli sono rare perché il corpus è fatto di frasi lunghe e di argomenti vari (media 10 caratteri).

### Testi originali di questo pacchetto (`testi/`)
- Scritti per il progetto (Claude, su indicazione di Claudio Longhitano). Licenza **CC BY 4.0**, come i contenuti didattici del progetto. Bozze da far rileggere.

## Non usati, e perché

- **Tatoeba, audio cinese.** Delle 5.825 frasi cinesi con audio: **5.741 con campo licenza vuoto** (la pagina dei download avverte che in quel caso l'audio potrebbe non essere riutilizzabile fuori da Tatoeba) e **84 «CC BY-NC 4.0»** (non commerciale). Esclusi tutti. Parlanti: LeviHighway (4.066), fucongcong (1.675), GlossaMatik (69), zhoucantd (15).
- **AISHELL-1 e THCHS-30** (voce cinese, OpenSLR 33 e 18): OpenSLR indica Apache 2.0, ma il testo di presentazione parla di uso gratuito «per scopi accademici» e un catalogo di terzi dà AISHELL-1 come CC BY-NC-ND. Licenza non chiara → esclusi. Fonti: <https://openslr.org/33>, <https://openslr.org/18/>, <https://voxkitchen.readthedocs.io/en/latest/datasets/>.
- **Pacchetto `hsk-sentences-audio`** (4.354 frasi HSK 3.0 con audio): dati sotto **CC BY-SA 4.0** (share-alike) → esclusi come dati. <https://pypi.org/project/hsk-sentences-audio/>.
- **CC-CEDICT** (CC BY-SA): già escluso dal progetto.
- **Letture graduate commerciali**: HSKStory (cinque storie gratuite, il resto a pagamento: <https://challenges.hackingchinese.com/resources/stories/569-hskstory-graded-chinese-stories-with-audio-for-hsk-1-9>), Mandarin Companion (a pagamento), *Graded Chinese Reader* di Sinolingua (protetto da copyright). Nessuna licenza che permetta di ridistribuirli.

## Da valutare (non verificato)

- **Common Voice, cinese (Cina): vedi sopra, ora usabile** (sezione «Usati»). Anche per l'italiano esiste Common Voice (CC0), non verificato.
- **LibriVox**: le registrazioni sono di dominio pubblico negli Stati Uniti (chi è fuori dagli USA deve controllare). Non ho trovato letture in italiano né in cinese adatte a questo uso. <https://librivox.org>.
- **Testi di dominio pubblico** (Wikisource, Liber Liber: per esempio *Pinocchio*, poesie Tang): non verificati; sarebbero testi autentici ma molto sopra il livello del corso, utili come «lettura libera» con glossario, non come lettura graduata.

## Controlli fatti su questi dati

- Le frasi cinesi sono tutte fatte di parole del vocabolario dell'app (taglio per programmazione dinamica); quelle con parole ignote (nomi propri, parole rare) sono state scartate.
- Righe con contenuti sensibili segnate (`flag = sensibile`): 728 su 30.231 per cinese→italiano, 562 su 47.764 per italiano→cinese. Il filtro è una semplice lista di parole: **non è una garanzia**.
- Campione di lettura (16 coppie dirette e 16 via inglese): nessun errore grave; differenze di registro («tu» / «Lei») e traduzioni libere.
