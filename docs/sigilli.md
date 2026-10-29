# Sigilli di gratitudine: come funzionano e perché la chiave si genera in privato

I sigilli (支 Sostegno, 交 Cultura, 永 Custodire) sono un ringraziamento estetico per chi sostiene màndarínō. **Non aprono nessuna funzione, né
ora né in futuro.** L'app non sa chi ha donato né quanto, e non contatta nessuno.

## Come funziona

1. La persona dona su Ko-fi e, se vuole un sigillo, lo scrive nel messaggio.
2. Chi gestisce il progetto, sul proprio computer, decide se e quale sigillo spetta e firma un codice.
3. Il codice arriva alla persona per e-mail, come link, testo o QR.
4. La persona lo riscatta in ⚙️ → Informazioni → Sostieni il progetto. L'app controlla la firma e mostra «sigillo autentico».

Nessuno di questi passaggi manda dati dall'app a un server, e nessun passaggio è automatico: l'e-mail la manda una persona.

## Il codice

`MDS1.<contenuto>.<firma>`, in base64url. Il contenuto è il testo `1.<kid>.<livello>.<anno>.<numero>`: versione, nome della chiave, livello
(1 Sostegno, 2 Cultura, 3 Custodire), anno dell'edizione e numero progressivo. **Nessun dato personale.** La firma è ECDSA P-256 con SHA-256, nella
forma «grezza» r‖s di 64 byte che WebCrypto legge direttamente.

Il verificatore è pubblico e si legge in `src/core/seal-code.js`; la schermata è in `src/ui/seals.js`. La verifica avviene tutta sul telefono, anche senza rete.

## Che cosa si controlla e che cosa no

L'app controlla **soltanto che il codice sia firmato dalla chiave del progetto**. Per questo mostra «sigillo autentico» e mai «pagamento verificato»:
un'app offline e senza server non può sapere se un pagamento è avvenuto. Il pagamento si controlla sul pannello di Ko-fi, da chi gestisce il progetto.
Un codice offline non si può revocare: per questo l'emissione è un gesto ponderato e fatto a mano.

## Perché la chiave si genera in privato

La chiave di firma ha due metà. **La chiave pubblica** sta nell'app (`MD_CONFIG.SEAL_PUBKEYS` in `src/config.js`): non è un segreto e serve a verificare.
**La chiave privata** si genera sul computer di chi gestisce il progetto, si conserva cifrata con una frase segreta e **non entra mai** in questo repository,
nell'app, nei segreti della CI né in un servizio online. I motivi:

1. **Chi ha la chiave privata può firmare sigilli validi.** Se stesse nel codice, in un file di configurazione o in un segreto della CI, chiunque
   avesse accesso al repository o alle sue copie potrebbe emetterne: i sigilli smetterebbero di valere come ringraziamento.
2. **L'app non ha un server.** Una firma fatta altrove, e controllata qui con la sola chiave pubblica, permette di avere sigilli verificabili senza
   server da mantenere, senza conti e senza che l'app contatti qualcuno.
3. **I dati di chi dona restano fuori.** Indirizzi e-mail e importi non passano mai dall'app né dal repository: li vede solo chi gestisce il progetto
   su Ko-fi, li usa per mandare il sigillo a chi lo chiede e li cancella su richiesta.
4. **È verificabile da tutti.** Il formato, il verificatore e la chiave pubblica sono pubblici: chiunque può controllare che l'app accetti soltanto codici
   firmati dalla chiave dichiarata e che non esista alcuna scorciatoia.
5. **Lo impone anche la build.** `tools/build.mjs` si ferma se nel repository compare un file `.pem`, `.key`, `.p8`, `.jks` o `.keystore`, una chiave privata,
   un token o un campo delle notifiche di Ko-fi.

## Chiavi nuove e chiave perduta

Ogni chiave ha un nome (`kid`, per esempio `k2026`). Per cambiare chiave si genera una coppia nuova e si **aggiunge** la nuova chiave pubblica alla lista: i sigilli
già emessi continuano a verificarsi con la vecchia. Se una chiave privata andasse perduta o fosse compromessa, si toglie la sua chiave pubblica dalla lista e
i suoi sigilli smettono di essere riconosciuti. La lista oggi è vuota: finché non c'è una chiave pubblica, «riscatta» non compare.

## Prove

Le prove automatiche (`tools/unit.mjs`, `tools/e2e.mjs`) usano chiavi usa-e-getta generate al momento: controllano che un codice firmato in Node si verifichi
con WebCrypto, che un codice alterato, di una chiave sconosciuta, con firma in formato sbagliato o con livello fuori intervallo sia rifiutato, che la raccolta si unisca
tra dispositivi e che nessun testo abbia desinenze di genere.
