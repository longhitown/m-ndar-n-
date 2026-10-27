# Perché la carta funzioni davvero in Cina (Task 11.6): che cosa è pronto e che cosa va verificato

Il QR delle carte da condividere del corso di italiano porta all'indirizzo `SHARE_URL` di `src/config.js`. Senza
parametri, senza codici di campagna: l'app non sa e non conta chi condivide.

## Pronto

- **Pagina cinese** `docs/zh/index.html`, pubblicata con il sito in `…/mandarino/zh/`:
  - cinese per primo e leggera (circa 7 KB), senza font, immagini o script esterni;
  - dice in poche righe che cosa fa l'app, come installarla e come usarla.
- **Il browser interno di WeChat** (User-Agent con `MicroMessenger`). Lì l'installazione di app web e il download di APK
  sono spesso bloccati. La pagina mostra allora una freccia verso l'angolo in alto a destra e il testo «请点右上角「···」，
  选择「在浏览器中打开」», e offre comunque la versione web, usabile subito.
- **Testi onesti**: «免费 · 离线 · 无广告 · 无需注册», che sono veri. Mai «官方» o simili.
- **QR**: generato dall'app (`src/pwa/qr.js`):
  - occupa il 22% della larghezza della carta, scuro su chiaro, con margine bianco e niente disegnato sopra;
  - le prove lo rileggono con jsQR e controllano che restituisca esattamente l'indirizzo.

## Da decidere e da verificare (non si può fare da qui)

1. **`SHARE_URL`**. Oggi è vuoto, quindi il QR porta all'ultimo APK su GitHub. Quando GitHub Pages è attivo, scrivi
   `https://longhitown.github.io/mandarino/zh/`.
2. **Raggiungibilità dalla Cina.** Da una rete cinese (telefono con SIM cinese, senza VPN) prova:
   - che la pagina e l'APK si aprano in tempi accettabili. GitHub Pages e GitHub Releases sono spesso lenti o instabili
     in Cina; annota tempi e risultati;
   - che WeChat riconosca il QR della carta con la pressione lunga e apra la pagina;
   - che 小红书 e Weibo accettino l'immagine (formato 3:4).
3. **Alternative, solo se le prove vanno male.** Vanno valutate dall'autore, perché ognuna ha costi e regole sue:
   - un altro ospite statico già documentato, come Cloudflare Pages. In Cina è anch'esso variabile;
   - un mirror della pagina e dell'APK su un servizio raggiungibile dalla Cina.

   Un sito ospitato in Cina continentale richiede di solito una registrazione ICP: non è una strada da prendere senza
   una decisione esplicita.
4. **Rilettura dei testi cinesi** (carta, pagina, corso) da parte di un madrelingua.

## Proporzioni delle immagini

Il formato predefinito della carta è 3:4 (1080×1440), che va bene per WeChat Moments e 小红书. Ci sono anche il 4:5
(Instagram) e il 9:16 (storie). Prima della scelta finale controlla le indicazioni attuali delle piattaforme: il formato è
una costante (`FORMAT_DEFAULT` in `src/ui/share-card.js`).
