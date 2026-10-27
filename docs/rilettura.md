# Rilettura da madrelingua

L'app ha circa 6400 frasi d'esempio, 32 dialoghi e le frasi di tutti i giorni. Sono state controllate con strumenti
automatici, ma nessun madrelingua cinese le ha ancora rilette tutte. Questo è il flusso per farlo un campione alla volta.
**La rilettura è un'azione umana**: lo strumento prepara e raccoglie, chi gestisce il progetto decide che cosa cambiare.

## Chi fa che cosa

| Passo | Chi | Che cosa |
|---|---|---|
| 1. Preparare il modulo | chi gestisce il progetto | `node tools/review-sample.mjs --seme 1 --out revisione-1.md` |
| 2. Mandarlo | chi gestisce il progetto | il file `.md`, oppure il suo contenuto incollato in un documento condiviso, per e-mail (mandarinoapp@gmail.com) o via WeChat |
| 3. Rileggere | madrelingua | per ogni riga: ✓ / ~ / ✗ nella colonna 判断, e una proposta in 建议 se non è ✓ |
| 4. Rimandarlo | madrelingua | lo stesso file compilato (o il testo della tabella) |
| 5. Importarlo | chi gestisce il progetto | `node tools/review-import.mjs revisione-1.md --nome <chi ha riletto> --out revisione-1.json` |
| 6. Riassumerlo | chi gestisce il progetto | `node tools/merge-contrib.mjs revisione-1.json --out riepilogo.md` |
| 7. Correggere | chi gestisce il progetto | il cinese a mano nei file di `src/data/` (vedi sotto), poi `npm test` |

## Il modulo (passo 1)

- **Contenuto.** Circa 300 righe: una frase d'esempio per ogni sezione del vocabolario, due battute per dialogo, 20 frasi
  di tutti i giorni. Le istruzioni sono in cinese; l'italiano è solo un riferimento.
- **Seme.** Lo stesso `--seme` dà sempre lo stesso campione: per un secondo giro si usa `--seme 2`, e così via, senza
  ripetere le stesse frasi.
- **Opzioni.** `--per-sezione`, `--per-dialogo` e `--frasi` cambiano la misura.
- **Colonna «rif.».** Ogni riga dice da dove viene la frase:
  - `ex:<parola>`: la frase d'esempio della parola, in `src/data/examples/`;
  - `dlg:<id>:<riga>`: la battuta di un dialogo, in `src/data/dialogs/<id>.js`;
  - `phr:<gruppo>:<riga>`: una frase di tutti i giorni, in `src/data/phrases.js`.

## Il formato di ritorno (passi 4-6)

Il formato di ritorno è la stessa tabella Markdown, compilata. `tools/review-import.mjs` legge le righe con ~, ✗ o una
proposta e scrive una patch `mandarino-contrib/1`, lo stesso formato dei contributi dall'app. Ogni riga diventa una
**segnalazione** (`op: "flag"`), con il giudizio, la proposta e la frase originale. Le righe ✓ si contano e basta.

`tools/merge-contrib.mjs` controlla che ogni riferimento esista e mette le segnalazioni nella sezione «da guardare a
mano» del riepilogo, insieme agli altri contributi.

## Perché segnalazioni e non correzioni automatiche

Cambiare il cinese di una frase cambia anche il pinyin, e a volte le parole che il taglio riconosce. Per questo
`merge-contrib.mjs` non tocca mai i caratteri: sono la chiave dei progressi per le parole, e una proposta va comunque
riletta. Dopo una correzione:

1. sistema il pinyin della stessa riga;
2. `node tools/build.mjs`, che controlla pinyin e caratteri;
3. `npm test`;
4. nel messaggio del commit, chi ha riletto (se vuole comparire, aggiungilo a `CONTRIBUTORS.md` e a
   `src/data/contributors.js`: la build controlla che coincidano).

## Che cosa non copre ancora

- **Testi cinesi del corso di italiano.** Le spiegazioni delle lezioni e i testi dell'interfaccia del corso stanno in
  `src/data/it/lessons/` e `src/i18n/it-course.js`, e il modulo non li campiona. Per ora si rileggono aprendo il corso in
  cinese (⚙️ → Corso → 学意大利语) e segnalando dall'app (⚙️ → Dati e privacy → Contributi) o per e-mail.
- **Nome di chi rilegge.** Compare nei Crediti solo se lo chiede. Licenza delle correzioni: CC BY 4.0, come i contenuti
  (CONTRIBUTING.md).
