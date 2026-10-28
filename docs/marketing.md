# Marketing: piano per immagini e caroselli (bozza)

> **Stato: bozza di lavoro**, da discutere nei prossimi giorni. Gli esempi si generano con `node tools/carousel.mjs` (vedi sotto).

## Che cosa si racconta (e che cosa no)

màndarínō è gratuita, offline, privata, senza pubblicità e senza account (il [Manifesto](../MANIFESTO.md)). Questo è il messaggio:
**niente mascotte, niente urgenza finta, niente promesse di «parlare in 30 giorni»**, niente confronti con altre app. Si mostra
l'app che funziona e si dà una cosa utile in ogni immagine. Ogni post si chiude con «gratis · offline · senza pubblicità» e
`mandarinoapp.org`, mai con «scarica ora».

Due pubblici, due lingue, mai mescolati nello stesso post:

| Pubblico | Lingua del post | Che cosa impara | Dove |
|---|---|---|---|
| Italiani che studiano il cinese | italiano | parole, toni, frasi da viaggio, caratteri | Instagram, TikTok, Facebook, Reddit (r/italy, r/ChineseLanguage), YouTube Shorts |
| Cinesi che studiano l'italiano | cinese semplificato | parole, frasi, verbi, vita quotidiana in Italia | 小红书 (Xiaohongshu), 微信 (Moments e 公众号), 抖音, 微博, B站 |

I contenuti vengono dall'app (vocabolario, dialoghi, frasi, toni, lezioni): quello che si pubblica è già stato controllato.

## I pilastri (rubriche fisse, con un formato riconoscibile)

1. **Una parola, una scena**: carattere grande, pinyin, significato, una frase. (italiano e cinese)
2. **Al bar / in hotel / in taxi**: cinque parole o frasi per una situazione (carosello 6-8 slide).
3. **I toni**: *mā má mǎ mà* e le coppie che fanno ridere ma non penalizzano (妈/马); video corto dell'oscilloscopio dell'app.
4. **Il carattere si scompone**: i radicali (女 + 子 = 好) con le animazioni del Laboratorio, in video 9:16.
5. **Italiano per chi parla cinese**: 5 verbi, la differenza *il/lo/la*, i falsi amici; sempre con pinyin per il cinese «a fianco».
6. **Dietro l'app**: come funziona il ripasso, perché offline, perché nessun dato; il Manifesto in carta; il Taccuino del viaggiatore.
7. **Scambio linguistico**: appello a chi vuole registrare la propria voce (solo adulti, CC BY 4.0), con il link alla pagina del progetto.

## Formati e dimensioni

| Formato | Misura | Uso |
|---|---|---|
| Post / carosello | 1080 × 1350 (4:5) | Instagram, Facebook, 小红书 (3:4 va bene), WeChat |
| Quadrato | 1080 × 1080 | LinkedIn, X, Reddit |
| Storia / video | 1080 × 1920 (9:16) | Stories, Reels, TikTok, 抖音, Shorts |
| Anteprima del link | 1200 × 630, tutto nel quadrato centrale | WhatsApp, WeChat, Telegram, X (già fatta: `docs/img/anteprima.png`) |

Un carosello = copertina (titolo + promessa piccola), 4-8 slide di contenuto, chiusura con «gratis · offline · senza pubblicità» e l'indirizzo.
Testo grande (almeno 48 px), contrasto alto, niente testo nei bordi (i social li coprono). I caratteri cinesi sempre con il pinyin sotto.

## Come produrne tante (la fabbrica)

`tools/carousel.mjs` disegna le slide con Playwright **dai dati dell'app** (parole, pinyin e significati vengono da `src/data`): per
una nuova serie basta elencare le parole nel file. Esempi pronti: `bar`, `saluti`, `toni` (italiano) e `ciao` (cinese).

```bash
node tools/carousel.mjs --serie bar                    # post 4:5, cartella _carousel/bar/
node tools/carousel.mjs --serie saluti --formato storia
node tools/carousel.mjs --elenco
```

Da costruire nei prossimi giorni:

- **Serie in blocco**: una per ognuna delle 146 sezioni tematiche del vocabolario (titolo = nome della sezione, 5 parole più usate), in italiano; e
  una per ogni lezione di italiano per sinofoni (51), in cinese. Sono circa 200 caroselli già pronti da pianificare.
- **Video 9:16** dalle clip che già esistono (`docs/img/clip-*.mp4`: toni, parole, frasi, ripasso, italiano): sottotitoli e musica libera dell'app.
- **Schede «sfida»**: l'immagine delle carte da condividere dell'app (carta del giorno, Taccuino, Manifesto) già generate dall'app.
- **Traduzioni**: ogni serie esiste in italiano e in cinese; il cinese lo rilegge un madrelingua prima di uscire.
- **Calendario**: 3 caroselli a settimana per lingua + 2 video corti; una rubrica diversa per giorno; scheda di pianificazione in un foglio.

## Regole di qualità prima di pubblicare

1. Ogni parola e ogni frase vengono dall'app (niente testo scritto a mano nel post): così sono già passate dai controlli linguistici.
2. Il cinese del pubblico cinese lo rilegge un madrelingua, finché non c'è l'importazione dei contributi.
3. Nessun dato personale, nessun nome di utente, nessuna foto di terzi. Le registrazioni dello scambio linguistico non si usano nei post senza il permesso (vedi `scambio-linguistico.md`).
4. Un solo invito per post: guarda l'app, oppure partecipa allo scambio; mai due.

## Cose da decidere insieme

- Quali piattaforme aprire per prime (proposta: Instagram + 小红书, poi TikTok/抖音).
- Se pubblicare con il nome dell'autore o solo con quello dell'app.
- Un profilo per lingua o uno solo bilingue (proposta: due profili, per non mescolare i pubblici).
- Budget: nessuno (solo contenuti); un'eventuale sponsorizzazione non è prevista.
