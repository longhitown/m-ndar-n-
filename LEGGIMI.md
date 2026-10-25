# màndarínō · il cinese per italiani (V6.7)

Un'app a file unico (`index.html`): 3500 parole in 155 sezioni, pinyin davanti, toni a colori, ripasso FSRS-6,
dialoghi, laboratorio di frasi, oscilloscopio dei toni. Nessuna libreria esterna, nessuna richiesta di rete
all'avvio; i progressi restano nel browser (localStorage + copia in IndexedDB) e si salvano su file.

## Che cosa c'è nel repository

| File | A cosa serve |
|---|---|
| `index.html` | l'app intera (dati compresi) |
| `manifest.json`, `sw.js`, `_headers`, `icon*.svg/png` | la versione installabile (PWA) per Cloudflare Pages, Vercel o GitHub Pages |
| `tools/ux-audit.mjs` | audit dell'interfaccia: 3 schermi × 3 temi, bersagli ≥ 44 px, testo ≥ 13 px, contrasti WCAG, sessione a schermo pieno, profilo di prova intatto |
| `tools/e2e.mjs` | prove end-to-end: #selftest, PWA offline e aggiornamento, backup → ripristino tra due profili, «Registra e confronta» |
| `tools/merge-contrib.mjs` | unisce le patch dei contributi della community (riepilogo; `--apply` scrive i dati) |

I file di `manifest.json`, `sw.js`, `_headers` e delle icone escono dall'app stessa (⚙️ → Voce → «📦 Scarica pacchetto PWA»):
se cambiano manifest o service worker nel codice, rigenerali da lì.

## Pubblicare (Cloudflare Pages, il più semplice)

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → questo repository.
2. Build command: vuoto. Output directory: `/`.
3. Dal telefono apri `https://….pages.dev` → menu del browser → «Aggiungi a schermata Home».

Su https il microfono chiede il permesso una volta sola; dopo il primo caricamento l'app funziona senza rete.
**Aggiornare:** cambia `APP_VERSION` in `sw.js` (o rigenera il pacchetto): i telefoni vedono
«Nuova versione disponibile · Aggiorna». Se cambi solo `index.html` non serve: viene chiesto sempre prima alla rete.

**Nome del repository:** GitHub ha tolto gli accenti e il repository si chiama `m-ndar-n-`. Conviene rinominarlo
`mandarino` (Settings → General → Repository name): i vecchi indirizzi vengono reindirizzati.

## Prove

```
node tools/e2e.mjs          # 17 prove, ~1 minuto
node tools/ux-audit.mjs     # 0 problemi attesi; --quick = solo 360×740 tema chiaro
```
In più, dentro l'app: aggiungi `#selftest` all'indirizzo (24 controlli, tutti verdi).
Per il controllo «nessun attributo senza CP.attr», in revisione: `grep -nP "[a-z-]+=\"' \+ (?!CP\.attr)" index.html`
deve mostrare solo numeri, id interni e classi.

Da fare a mano, su un telefono vero (non si possono simulare qui):
- volume al 50%: il tap si sente, 10 tap di fila non danno fastidio; la musica si abbassa quando parla la voce;
- Lighthouse «Installable» sull'indirizzo https; avvio in modalità aereo;
- iPhone, app aggiunta alla Home: se il riconoscimento vocale manca, il 🎤 deve diventare «Registra e confronta».

## Contributi della community

Chi usa l'app corregge pinyin, italiano o nota di una parola, di una frase o di una battuta (mai i caratteri: sono la
chiave dei progressi), segnala un errore o propone una parola nuova. La correzione si vede subito nella sua copia
(«✏️ tua correzione») e si annulla da ⚙️ → Contributi. Si manda con Condividi (WeChat, WhatsApp…), email o file `.json`;
Modulo Google e GitHub Issue compaiono quando li configuri in `index.html`, cerca `var CFG = { email: "", form: "", formEntry: "", repo: "" }`.
Questo repository è privato: per le issue degli estranei serve un repository pubblico a parte (es. `mandarino-contributi`).

```
node tools/merge-contrib.mjs arrivati/*.json            # riepilogo: da applicare, segnalazioni, doppioni, conflitti, scartati
node tools/merge-contrib.mjs arrivati/*.json --apply    # scrive in index.html solo le voci valide
```

## Chiavi salvate (tutte `cp-*`, tutte con una regola nel ripristino «unisci»)

Nuove in V6.7: `cp-community-contribs` (unione per id, vince la voce più recente), `cp-ux-v1` (benvenuto, legenda,
suggerimenti; unione), `cp-haptics`, `cp-sfxvol`, `cp-jkmood`, `cp-jkauto`, `cp-toneshapes`, `cp-contrib-nick`,
`cp-lang` (preferenze del dispositivo: vince quello corrente). `cp-game-v1.days[giorno]` ha due campi nuovi:
`nw` (parole nuove introdotte) e `nx` (permesso extra «Ancora 5 parole»). Il formato del backup resta `{app:"mandarino", v:5, kv, log}`.

## Che cosa resta aperto

- §5 fasi 2 e 3 (corso italiano per cinesi, correttore italiano): da decidere. La fase 1 è fatta: `I18N` + `t()`,
  lingua dei menu in ⚙️. I testi interni dei moduli più vecchi (esercizi, dialoghi, lettore, guida, Pensiero,
  laboratorio, oscilloscopio, contributi) sono ancora solo in italiano e vanno portati su `t()` un po' alla volta.
- La modalità a schermo pieno vale per la sessione di studio, l'Orecchio e la Sfida; per gli esercizi di Frasi
  (puzzle, laboratorio, dialoghi) non è ancora attiva.
- I dati stanno dentro `index.html` (`build.py` e `data/*.json` citati nei commenti non sono in questo repository).
- Facoltativa: una GitHub Action che lanci `merge-contrib.mjs` sulle issue con etichetta `contributo`.
