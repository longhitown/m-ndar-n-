# Sigilli di gratitudine: come funzionano

I sigilli (支 Sostegno, 交 Cultura, 永 Custodire) sono un ringraziamento estetico per chi sostiene màndarínō. Non aprono nessuna funzione, né ora né in futuro.

L'app non sa chi ha donato né quanto, e non contatta mai nessuno. Tutto quello che riguarda i donatori vive sul computer di chi gestisce il progetto, negli strumenti `tools/seal-keygen.mjs`
e `tools/seal-issue.mjs`. Gli strumenti stanno nel repository, ma non entrano mai nell'app.

## Come funziona, in breve

1. La persona dona su Ko-fi (`MD_CONFIG.SUPPORT_URL`) e scrive **SIGILLO** nel messaggio (va bene anche 印章 o SEAL).
2. Passati 7 giorni, si lancia `tools/seal-issue.mjs`. Lo strumento:
   - somma le donazioni della stessa e-mail;
   - decide quale sigillo spetta;
   - firma il codice;
   - prepara e-mail, link e QR.
3. Chi gestisce il progetto rilegge e manda l'e-mail dal proprio programma di posta. Nessun invio automatico.
4. La persona apre il link, oppure incolla il codice o inquadra il QR, in ⚙️ → Informazioni e supporto → Sostieni il progetto.

Un'app offline e senza server non può controllare un pagamento. Può controllare soltanto che il codice sia firmato da chi gestisce il progetto, e infatti nell'app compare «sigillo autentico», mai
«pagamento verificato». Il pagamento si controlla sul pannello di Ko-fi.

## Regole

Le soglie stanno **solo** nello strumento (costanti in testa a `tools/seal-issue.mjs`), mai nell'app né in questo testo.

- **Sigillo assegnato:** dipende dal totale donato da una persona nel tempo, e vale il livello più alto raggiunto. Chi sale di fascia riceve il sigillo nuovo e tiene i precedenti.
- **Sotto la prima soglia:** nessun sigillo, ma una bozza di ringraziamento senza importi.
- **Solo su richiesta:** le donazioni senza la parola chiave si ignorano del tutto. Non si scrive mai a chi non l'ha chiesto.
- **Attesa:** 7 giorni dalla donazione (`HOLD_DAYS`), per le contestazioni. Un codice offline non si può revocare.
- **Persona:** è un indirizzo e-mail, normalizzato. Due indirizzi della stessa persona si uniscono a mano con `merge`.
- **Valute:** le somme si convertono in euro con `cambi.json`, che si aggiorna a mano (euro per unità di valuta), arrotondando sempre a favore di chi dona.
- **Numerazione:** ogni sigillo ha l'anno dell'edizione e un numero progressivo per anno e livello. Un'edizione passata non si ottiene più.

## La prima volta: la chiave

```
node tools/seal-keygen.mjs --kid k2026
```

1. Lo strumento scrive la chiave privata, cifrata con una frase segreta, in `$MANDARINO_SEAL_HOME` (se non c'è, `~/.mandarino-sigilli`), fuori dal repository.
2. Stampa la chiave pubblica: va copiata in `src/config.js`, dentro `SEAL_PUBKEYS: [ { kid, jwk } ]`, poi `node tools/build.mjs` e un push. Finché `SEAL_PUBKEYS` è vuoto, nell'app la parte
   «Riscatta un sigillo» non compare.
3. **Si fa subito una copia** della chiave e della frase segreta fuori da GitHub: una chiavetta, un gestore di password. Se si perde, non si possono più emettere sigilli; quelli già dati restano validi.

La build si ferma se nel repository compare un file `.pem`, `.key`, `.jks` o una chiave privata. Le prove automatiche usano chiavi usa-e-getta generate al momento.

## Ogni tanto: emettere

```
node tools/seal-issue.mjs process notifiche.json                        # simulazione: mostra, non scrive niente
node tools/seal-issue.mjs process notifiche.json --apply                # emette: registro, codici, e-mail, QR
node tools/seal-issue.mjs process --manual "email=a@b.it,amount=IMPORTO,currency=EUR,id=TX123,date=2026-11-01,message=SIGILLO" --apply
node tools/seal-issue.mjs process ko-fi.csv --map "Transaction Id=id,Email=email,Amount=amount,Currency=currency,Date=date,Message=message" --apply
```

**Ingressi.** Lo strumento accetta tre tipi di ingresso:

- le notifiche dei webhook di Ko-fi, salvate in un file (JSON: un oggetto, un elenco o una notifica per riga), di tipo Tip o Donation;
- un'esportazione CSV del pannello, con la mappa delle colonne scritta a mano (`--map`): il formato di Ko-fi non è garantito, quindi lo strumento non indovina;
- una donazione scritta a mano (`--manual`).

Rielaborare la stessa transazione non emette nulla di nuovo: la chiave è `kofi_transaction_id`.

**Uscite.** Per ogni sigillo, in `$MANDARINO_SEAL_HOME/uscita/<data>/` si trovano `codice.txt`, `link.txt`, `qr.svg`, `email.txt` (italiano e cinese, dai modelli in `docs/sigilli/`) e `mailto.txt`, un link `mailto:`
già compilato.

- **Link:** parte da `MD_CONFIG.SITE_URL` (l'indirizzo del sito), oppure da `--site URL`, e porta all'app (`…/app/`). Il codice sta nel frammento `#seal=…`, che non arriva a nessun server.
- **Sotto soglia:** per chi ha chiesto il sigillo ma è sotto la prima soglia c'è una bozza di ringraziamento in `uscita/<data>/grazie/`, senza importi.

## Il registro: dati personali

`registro.json` contiene solo il minimo: e-mail, totale in euro, sigilli emessi, id delle transazioni, date. Sta in `$MANDARINO_SEAL_HOME`, mai nel repository (lo esclude anche `.gitignore`).

- `node tools/seal-issue.mjs forget --email a@b.it --apply` cancella una persona.
- `node tools/seal-issue.mjs export-anon` dà un riepilogo senza dati personali.
- **Copia di sicurezza:** se il registro si perde, si rompe la numerazione progressiva e lo strumento non sa più chi ha già ricevuto che cosa.

## Ruotare la chiave

Serve in caso di abuso: non esiste revoca offline.

1. `node tools/seal-keygen.mjs --kid k2027`.
2. Si aggiunge la nuova chiave pubblica a `SEAL_PUBKEYS` e si toglie la vecchia.
3. Si riemettono i codici legittimi con `--kid k2027`.

I codici firmati con la vecchia chiave smettono di valere alla prima apertura dell'app aggiornata.

## Limiti accettati

- **Un codice si può copiare:** non è legato a un dispositivo. È un riconoscimento, non una licenza. I numeri sono univoci: se due persone mostrano lo stesso numero, una l'ha preso in prestito, e va bene così.
- **Si può aggirare:** chi modifica la propria copia dell'app può mostrarsi un sigillo. Per un segno estetico non importa.
- **Versione per gli store:** donazione e sigilli sono spenti (`FEATURE_DONATE`, `FEATURE_SEALS`); vedi [store/README.md](store/README.md).
