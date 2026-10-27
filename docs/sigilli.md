# Sigilli di gratitudine: la procedura dell'autore

I sigilli (支 Sostegno, 交 Cultura, 永 Custodire) sono un ringraziamento estetico per chi sostiene màndarínō. Non aprono
nessuna funzione, né ora né in futuro.

L'app non sa chi ha donato né quanto, e non contatta mai nessuno. Tutto quello che riguarda i donatori vive sul tuo
computer, negli strumenti `tools/seal-keygen.mjs` e `tools/seal-issue.mjs`. Gli strumenti stanno nel repository, ma non
entrano mai nell'app.

## Come funziona, in breve

1. La persona dona su Ko-fi (`MD_CONFIG.SUPPORT_URL`) e scrive **SIGILLO** nel messaggio (va bene anche 印章 o SEAL).
2. Passati 7 giorni, tu lanci `tools/seal-issue.mjs`. Lo strumento:
   - somma le donazioni della stessa e-mail;
   - decide quale sigillo spetta;
   - firma il codice;
   - prepara e-mail, link e QR.
3. Rileggi e **spedisci tu**, dal tuo programma di posta. Nessun invio automatico.
4. La persona apre il link, oppure incolla il codice o inquadra il QR, in ⚙️ → Informazioni e supporto → Sostieni il progetto.

Un'app offline e senza server non può controllare un pagamento. Può controllare soltanto che il codice sia firmato da te,
e infatti nell'app compare «sigillo autentico», mai «pagamento verificato». Il pagamento lo controlli tu, sul pannello di
Ko-fi.

## Regole

Le soglie stanno **solo** nello strumento (costanti in testa a `tools/seal-issue.mjs`), mai nell'app.

| Totale donato da una persona, nel tempo | Sigillo |
|---|---|
| meno di 5 € | nessuno: una bozza di ringraziamento senza importi |
| da 5 € | 支 Sostegno |
| da 20 € | 交 Cultura |
| da 51 € | 永 Custodire |

- **Sigillo assegnato:** vale il livello più alto raggiunto. Quindi 50,50 € dà la Cultura, e chi parte subito da 60 €
  riceve il Custodire.
- **Salire di fascia:** chi sale riceve il sigillo nuovo e tiene i precedenti.
- **Solo su richiesta:** le donazioni senza la parola chiave si ignorano del tutto. Mai scrivere a chi non l'ha chiesto.
- **Attesa:** 7 giorni dalla donazione (`HOLD_DAYS`), per le contestazioni. Un codice offline non si può revocare.
- **Persona:** è un indirizzo e-mail, normalizzato. Due indirizzi della stessa persona si uniscono a mano con `merge`.
- **Valute:** le somme sono in euro. Le altre valute si convertono con `cambi.json`, che aggiorni tu a mano (per esempio
  `{"EUR":1,"USD":0.92,"GBP":1.17}` = euro per unità), arrotondando sempre a favore di chi dona.
- **Numerazione:** ogni sigillo ha l'anno dell'edizione e un numero progressivo per anno e livello. Un'edizione passata
  non si ottiene più.

## La prima volta: la chiave

```
node tools/seal-keygen.mjs --kid k2026
```

1. Lo strumento scrive la chiave privata, cifrata con una frase segreta, in `$MANDARINO_SEAL_HOME` (se non c'è,
   `~/.mandarino-sigilli`), fuori dal repository.
2. Stampa la chiave pubblica: copiala in `src/config.js`, dentro `SEAL_PUBKEYS: [ { kid, jwk } ]`, poi
   `node tools/build.mjs` e un push. Finché `SEAL_PUBKEYS` è vuoto, nell'app la parte «Riscatta un sigillo» non compare.
3. **Fai subito una copia** della chiave e della frase segreta fuori da GitHub: una chiavetta, un gestore di password.
   Se la perdi, non puoi più emettere sigilli. Quelli già dati restano validi.

La build si ferma se nel repository compare un file `.pem`, `.key`, `.jks` o una chiave privata. Le prove automatiche
usano chiavi usa-e-getta generate al momento.

## Ogni tanto: emettere

```
node tools/seal-issue.mjs process notifiche.json                        # simulazione: mostra, non scrive niente
node tools/seal-issue.mjs process notifiche.json --apply                # emette: registro, codici, e-mail, QR
node tools/seal-issue.mjs process --manual "email=a@b.it,amount=10,currency=EUR,id=TX123,date=2026-11-01,message=SIGILLO" --apply
node tools/seal-issue.mjs process ko-fi.csv --map "Transaction Id=id,Email=email,Amount=amount,Currency=currency,Date=date,Message=message" --apply
```

**Ingressi.** Lo strumento accetta tre tipi di ingresso:

- le notifiche dei webhook di Ko-fi, salvate in un file (JSON: un oggetto, un elenco o una notifica per riga), di tipo
  Tip o Donation;
- un'esportazione CSV del pannello, con la mappa delle colonne scritta da te (`--map`): il formato di Ko-fi non è
  garantito, quindi lo strumento non indovina;
- una donazione scritta a mano (`--manual`).

Rielaborare la stessa transazione non emette nulla di nuovo: la chiave è `kofi_transaction_id`.

**Uscite.** Per ogni sigillo, in `$MANDARINO_SEAL_HOME/uscita/<data>/` trovi `codice.txt`, `link.txt`, `qr.svg`,
`email.txt` (italiano e cinese, dai modelli in `docs/sigilli/`) e `mailto.txt`, un link `mailto:` già compilato.

- **Link:** il link usa `MD_CONFIG.SITE_URL`, oppure `--site URL`. Il codice sta nel frammento `#seal=…`, che non arriva
  a nessun server.
- **Sotto soglia:** per chi ha chiesto il sigillo ma è sotto la soglia trovi una bozza di ringraziamento in
  `uscita/<data>/grazie/`, senza importi.

## Il registro: dati personali

`registro.json` contiene solo il minimo: e-mail, totale in euro, sigilli emessi, id delle transazioni, date. Sta in
`$MANDARINO_SEAL_HOME`, mai nel repository (lo esclude anche `.gitignore`).

- `node tools/seal-issue.mjs forget --email a@b.it --apply` cancella una persona.
- `node tools/seal-issue.mjs export-anon` dà un riepilogo senza dati personali.
- **Copia di sicurezza:** se il registro si perde, si rompe la numerazione progressiva e lo strumento non sa più chi ha
  già ricevuto che cosa.

## Ruotare la chiave

Serve in caso di abuso: non esiste revoca offline.

1. `node tools/seal-keygen.mjs --kid k2027`.
2. Aggiungi la nuova chiave pubblica a `SEAL_PUBKEYS` e togli la vecchia.
3. Riemetti i codici legittimi con `--kid k2027`.

I codici firmati con la vecchia chiave smettono di valere alla prima apertura dell'app aggiornata.

## Limiti accettati

- **Un codice si può copiare:** non è legato a un dispositivo. È un riconoscimento, non una licenza. I numeri sono
  univoci: se due persone mostrano lo stesso numero, una l'ha preso in prestito, e va bene così.
- **Si può aggirare:** chi modifica la propria copia dell'app può mostrarsi un sigillo. Per un segno estetico non
  importa.
- **Versione per gli store:** donazione e sigilli sono spenti (`FEATURE_DONATE`, `FEATURE_SEALS`); vedi `docs/store/`.

## Per dopo (da NON fare senza una decisione scritta)

Un piccolo servizio nel cloud potrebbe ricevere le notifiche di Ko-fi e conservarle per `seal-issue.mjs`. Dovrebbe:

- controllare il token di verifica, letto da una variabile d'ambiente del servizio, con un confronto a tempo costante;
- scartare i doppioni;
- tenere solo i campi minimi.

Non conterrebbe la chiave privata e non spedirebbe e-mail. Servono prima tre decisioni: dove ospitarlo, chi è
responsabile del trattamento dei dati (GDPR), e un'informativa. L'app non lo contatterebbe mai.
