# Materiali: frasi, testi e voci per gli esercizi

Questa cartella contiene i dati di partenza degli esercizi, della lettura graduata e delle voci registrate. `tools/materiali.mjs` li legge, li controlla con il
vocabolario dell'app e scrive `src/data/ex/`; la build mette le clip audio in `dist/audio/voce/`. Fonti e licenze di ogni parte sono in
[FONTI-E-LICENZE.md](FONTI-E-LICENZE.md). Dati ricavati dall'esportazione di Tatoeba del 24 ottobre 2026 e da Common Voice 27.0.

## Che cosa c'è

```
runtime/        i dati compatti dell'app (JSON, circa 470 KB, letti al primo uso)
  frasi-zh.json   2.484 frasi cinese → italiano, livelli 1-6
  frasi-it.json   3.048 frasi italiano → cinese
  testi-zh.json   15 testi graduati di cinese (livelli 1-5), con domande di comprensione
  testi-it.json   8 testi graduati di italiano per chi parla cinese (A1-B1), con domande
  voce-zh.json    indice di 720 clip di voce cinese
  voce-it.json    indice di 434 clip di voce italiana
audio/
  it/             434 clip di voce italiana (Tatoeba, parlante NM1, CC BY 4.0), Opus mono, circa 2,6 MB
  zh/             720 clip di voce cinese (Common Voice 27.0, CC0), Opus mono, circa 4,9 MB
dati/insiemi-confondibili.json   gruppi di elementi grammaticali da confondere, per le frasi a buco grammaticali
crediti/autori-frasi.tsv          441 autori delle frasi (l'attribuzione che chiede la licenza)
riferimenti/digitazione.mjs       pinyin digitato (numeri, accenti, senza toni) e italiano (accenti, refusi), con le prove in `tools/unit.mjs`
escludi-frasi.txt                 le frasi da togliere da esercizi e voci, una per riga
```

Ogni file di `runtime/` ha un campo `campi` (i nomi delle colonne di `righe`). Nei file `voce-*.json` ogni riga è `[audio_id, chiave, testo, livello, durata_s]`; la **chiave** serve a
cercare la clip dal testo: per il cinese solo i caratteri, senza punteggiatura né spazi; per l'italiano minuscolo, apostrofi normali, punteggiatura tolta e spazi singoli. Gli
identificativi di Tatoeba (`zh_id`, `it_id`) servono a citare le frasi (`https://tatoeba.org/sentences/show/<id>`).

Peso complessivo portato nell'app: dati compatti circa 470 KB, audio circa 7,5 MB (cinese 4,9, italiano 2,6).

## Regole

1. **Attribuzione** (CC BY): nei Crediti dell'app, una voce per le frasi («Tatoeba (tatoeba.org), CC BY 2.0 FR», con rinvio a `crediti/autori-frasi.tsv`), una per l'audio italiano
   («voce: NM1, Tatoeba, CC BY 4.0») e una per Common Voice («CC0», citata per cortesia).
2. **La build ricontrolla tutto**: tagli in parole e livelli; il taglio ufficiale è `core/segment.js`. Se una frase esce dal vocabolario o manca una clip, si ferma.
3. **I testi originali sono bozze** scritte per il progetto con l'aiuto di strumenti di intelligenza artificiale e controllate solo dai programmi: vanno riletti da madrelingua
   (per questo c'è `tools/review-sample.mjs`).
4. **Le traduzioni collegate tramite l'inglese** vanno usate con cautela: nei testi di verifica solo quelle dirette, oppure rilette.

## Come sono state scelte le voci cinesi

Le clip vengono da Common Voice Scripted Speech 27.0 (cinese, Cina), CC0. L'archivio pesa quasi 23 GB e se ne è scaricata una parte (circa 3 GB: 79.322 clip, 380 parlanti).
Si sono tenute le clip con:

- voti favorevoli almeno 2 e nessuno contrario;
- frasi di 4-20 caratteri, fatte **solo di parole dell'app**, e durata da 1 a 7 secondi;
- fonti conversazionali: esclusi Wikipedia (frasi enciclopediche, date, nomi) e le traduzioni dall'inglese, le frasi segnalate e i temi sensibili.

Risultato: 720 clip, 4,78 MB, 384 parlanti, 718 frasi diverse, 1.229 parole dell'app coperte, con quote per livello di 100 / 150 / 180 / 150 / 100 / 40. Le voci maschili sono 310, le
femminili 124 e 286 non dichiarate (squilibrio dei dati). Il genere, l'accento e l'identificativo di chi parla non si mostrano mai. Per togliere una frase si aggiunge a `escludi-frasi.txt` e si
rilancia `node tools/materiali.mjs`. Gli script di preparazione (Python) non fanno parte del repository: i dati qui sono il loro risultato.

## Limiti

- **Audio cinese di Tatoeba:** quasi tutte le registrazioni non hanno una licenza che ne consenta il riuso (campo vuoto: 5.741 su 5.825) o sono «non commerciali» (84): escluse.
  Le voci cinesi vengono da Common Voice.
- **Letture graduate:** per il cinese moderno non risultano raccolte aperte con una licenza compatibile; i 15 + 8 testi sono originali.
- **Livelli:** quelli del cinese seguono le liste del progetto (HSK 3.0, `levels.js`); quelli dell'italiano sono una stima.
- **Qualità delle frasi di Tatoeba:** è un corpus di volontari. Nei campioni letti le frasi sono per lo più naturali e corrette, con qualche traduzione libera, registro diverso («tu» / «Lei») o
  contenuto banale. Qualche frase delle clip cinesi resta ufficiale o poco naturale. Le prove automatiche non sostituiscono una rilettura da parte di madrelingua.
