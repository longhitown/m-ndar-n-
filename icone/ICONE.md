# Le icone di màndarínō

Il set di icone «D2 · Mandarino & Cinabro»: sostituisce le emoji dentro l'app e si può riusare liberamente. Perché sono fatte così e come
ci siamo arrivati: [DESIGN.md](DESIGN.md). Questo file è la specifica.

| | |
|---|---|
| **Versione del set** | 0.1.0 (fase 1 in corso: 24 icone disegnate su 150) |
| **Licenza** | [CC BY 4.0](../LICENZE/ICONE.txt) |
| **Autore** | Claudio Longhitano (con l'assistente di IA Claude: vedi [NOTICE.md](../NOTICE.md)) |
| **Marchio** | il nome màndarínō e il logo **non** sono inclusi nella licenza: [MARCHIO.md](../MARCHIO.md) |

## Come citarle (attribuzione)

Se usi le icone (o una loro modifica) basta una riga, dove ti sembra naturale (nei crediti, nel piè di pagina, nella descrizione):

> Icone màndarínō, di Claudio Longhitano, CC BY 4.0 · https://mandarinoapp.org

Se le hai modificate, aggiungi «modificate». Non serve chiedere il permesso. Non puoi far credere che il tuo prodotto sia màndarínō né che
màndarínō lo approvi: [MARCHIO.md](../MARCHIO.md).

## Che cosa c'è nella cartella

| Percorso | Che cosa è |
|---|---|
| `svg/<categoria>/<id>.svg` | **La fonte unica.** Un file per icona, 24 × 24, già pronto da usare da solo. Categorie: `ui`, `studio`, `vita`, `comunita` |
| `manifest.json` | Per ogni icona: id, nome in italiano e in cinese, categoria, stato (disegnata o da disegnare) e le emoji che sostituisce |
| `sprite.svg` | Tutte le icone disegnate in un solo file, con `<symbol id="i-…">`; si genera, non si modifica a mano |
| `SHA256SUMS.txt` | La somma SHA-256 di ogni file del set, nel formato di `sha256sum` |
| `DESIGN.md`, `design/` | Il concept e le figure dell'evoluzione grafica |

## Come si usano

Dentro una pagina HTML, con lo sprite incorporato nel documento:

```html
<svg width="24" height="24" aria-hidden="true"><use href="#i-bell"/></svg>
```

Ogni icona prende i colori da tre variabili CSS (con i valori di riserva già nel file, quindi anche da sola si vede giusta):

| Variabile | Che cosa colora | Chiaro | Scuro |
|---|---|---|---|
| `--im` | il tratto | `#DB5F00` | `#FF9A3D` |
| `--iv` | il velo (16 %) dei corpi pieni | `#DB5F00` | `#FF9A3D` |
| `--ia` | i punti pieni (cinabro) | `#C0281D` | `#FF5A4D` |

```css
.pulsante-pieno { --im: #FAF7EE; --iv: #FAF7EE; --ia: #FAF7EE; }   /* in avorio dentro un pulsante pieno */
@media (prefers-color-scheme: dark) { :root { --im: #FF9A3D; --iv: #FF9A3D; --ia: #FF5A4D; } }
```

Per un'icona sola basta aprire il suo file `.svg`; per una pagina o un documento si usano i file `svg/` o lo sprite. Per i nomi vedi `manifest.json`
(`it` e `zh`); nell'app l'icona si sceglie per id (`bell`, `flame`, `gear`…).

## Le regole del set

Le controlla `node tools/icone.mjs` (e la prova automatica del repository): se non sono rispettate, la CI fallisce.

- Griglia 24 × 24, `viewBox="0 0 24 24"`; margine di 2 px (coordinate tra 0 e 24).
- Tratto 1,8 px, con estremità e giunzioni arrotondate, scritto sull'elemento radice.
- Solo `<path>` e `<circle>` (più il `<title>`, che è il nome in italiano del manifest). Niente script, stili, immagini, gradienti, testo, collegamenti.
- Nessun colore fisso: solo le tre variabili, con i valori di riserva `#DB5F00` e `#C0281D`.
- Il velo (`--iv` al 16 %) solo su corpi pieni; il cinabro (`--ia`) solo come punto pieno.
- Al massimo 1800 byte per file; fine riga LF.
- Il file si chiama come l'id e sta nella cartella della sua categoria.

## Come si aggiunge o si cambia un'icona

1. Disegna l'SVG in `svg/<categoria>/<id>.svg` (copia un file vicino per forma e peso).
2. In `manifest.json`: stato `disegnata`, `file`, nomi in italiano e in cinese, e le emoji che sostituisce.
3. `node tools/icone.mjs --scrivi` (riscrive sprite, somme e la tabella qui sotto) e poi `node tools/icone.mjs` (deve dire «0 problemi»).
4. Guarda l'icona a 16, 20 e 24 px, sul tema chiaro e su quello scuro (`DESIGN.md` ha i criteri per dire «finita»).

## Le emoji nell'app

Ogni emoji che c'è oggi nel codice dell'app ha la sua icona nel `manifest.json` (campo `emoji`). Un controllo automatico fallisce se compare
un'emoji non mappata, e, quando la sostituzione sarà attiva (`"sostituzioneAttiva": true`, nella PR che cambia l'app), se ne resta una
sola. Le uniche eccezioni sono i simboli tipografici elencati in `consentitiComeTesto`.

## Come verificare i file (SHA-256)

Se scarichi il pacchetto ufficiale, puoi controllare che non sia stato alterato. Sul tuo computer, dentro la cartella `icone/`:

```bash
sha256sum -c SHA256SUMS.txt
```

Su Windows (PowerShell): `Get-FileHash .\sprite.svg -Algorithm SHA256`. Il risultato deve essere uguale a quello della tabella.

<!-- somme:inizio -->
| File | SHA-256 |
|---|---|
| `icone/sprite.svg` (tutte le icone disegnate, in un file) | `2f37902e26bf86c1e98b95f01bf117d4f6167bacf1984ac86c4d683de6f9e88c` |
| `icone/manifest.json` (nomi, categorie, emoji sostituite) | `fcb1a979140f92f88565c4e1159005031c5140dcd57da5346220112dcbe76d5d` |
| `icone/SHA256SUMS.txt` (una riga per ogni file SVG, 24 icone) | `2df3709c76f9445d3095b4f16e67a10b428f2026f10901feb2786cbb880f5b61` (somma del suo contenuto) |
<!-- somme:fine -->

Le somme del pacchetto compresso (`.zip`) delle release e quelle degli adesivi si aggiungono qui a ogni release.

## Le fasi

1. **Fase 1: il set di base da 150 icone.** Copre ogni funzione dell'app (interfaccia, vocabolario, grammatica, radicali, vita quotidiana in Cina,
   sigilli). È sufficiente per il primo pacchetto di adesivi pubblico.
2. **Fase 2: da 300 a 400 icone, per temi** (cultura cinese, cultura italiana), se e quando la comunità lo chiede.

Un catalogo compatto e coerente è meglio di uno enorme e sbiadito.

## Distribuzione

- **Nell'app:** sprite incorporato, usato al posto delle emoji (PR dedicata).
- **Kit grafico** (cartella con gli SVG ottimizzati e i PNG a 4×), **adesivi** per Telegram e WhatsApp e **pacchetto per il web**: nelle release, con le somme in questa pagina.
- **Codici di testo** (per esempio `:mand-fiamma:`): solo uso interno, nell'app e sul sito.
