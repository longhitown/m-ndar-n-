# Test chiuso: 12 tester per 14 giorni

Per un account personale nuovo, Google Play chiede un **test chiuso con almeno 12 tester per 14 giorni consecutivi**
prima della produzione (verifica la regola attuale nella guida della Play Console). L'alternativa è un account
«organizzazione», se c'è.

## Come si entra

1. Si crea un Gruppo Google (per esempio «mandarino-tester») e lo collega al test chiuso nella Play Console.
2. La pagina `docs/tester.html` (pubblicata con il sito) spiega in italiano e in cinese che cosa fare: unirsi al gruppo,
   aprire il link di partecipazione, installare da Google Play. L'app non chiede e non riceve nessun dato: l'iscrizione
   avviene tutta su Google.
3. Il link al gruppo e il link di partecipazione si scrivono in `docs/tester.html` (le due costanti in cima).

## Invito (italiano)

> Ciao! Sto per pubblicare màndarínō su Google Play: un'app gratuita, offline e senza pubblicità per imparare il cinese
> (e l'italiano, per chi parla cinese). Google mi chiede 12 persone che la provino per due settimane. Ti va? Basta
> un account Google: le istruzioni sono qui → https://longhitown.github.io/mandarino/tester.html. Non devi fare
> niente di speciale: usala quando vuoi e, se qualcosa non va, dimmelo. Grazie!

## 邀请（中文）

> 你好！我正在把 màndarínō 上架到 Google Play：一款免费、离线、无广告的应用，可以学中文，也可以（给中文使用者）学意大利语。
> Google 要求有 12 个人试用两周。你愿意帮忙吗？只需要一个 Google 账号，说明在这里 → https://longhitown.github.io/mandarino/tester.html。
> 平时随便用就好，遇到问题告诉我。谢谢！

## Checklist

- [ ] Gruppo Google creato e collegato al test chiuso; link scritti in `docs/tester.html`
- [ ] `.aab` della versione store caricato, firmato con la upload key (firma.md)
- [ ] Moduli compilati (moduli.md), indirizzo della privacy che si apre
- [ ] Almeno 12 tester iscritti **e** con l'app installata (contano gli iscritti attivi)
- [ ] 14 giorni consecutivi senza scendere sotto i 12
- [ ] Raccolte le segnalazioni (issue o e-mail) e pubblicato almeno un aggiornamento durante il test
- [ ] Richiesta di accesso alla produzione, con le risposte sul test
