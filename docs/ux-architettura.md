# màndarínō · architettura dell'informazione

Questa mappa dice dove sta ogni funzione e quando compare. Vale per i due corsi. I task successivi la applicano;
`tools/ux-audit.mjs` ne controlla due regole: **un solo pulsante primario visibile per schermata** e
**non più di 7 voci per menu** (`MENU_MAX`).

**Classi.** **E** = essenziale (il primo giorno). **R** = regolare (dopo qualche giorno). **A** = avanzato (chi lo cerca).

## 1. Inventario

### Corso di cinese: barra in basso (4 schede)

| Scheda | Contenuto | Classe | A chi serve, quando |
|---|---|---|---|
| **Percorso** | carta «Continua» (tappa, parole, lezione e dialogo della tappa), grado e serie, capitoli e tappe | E | a tutti, ogni giorno: è la home «Oggi» |
| **Studia** | carta «Oggi» (ripassi, nuove, *Inizia*), personalizza, Orecchio ai toni, Sfida, Progressi, backup | E | a tutti, ogni giorno |
| **Parole** | tabella di 6385 parole, ricerca, filtri, legenda, dettaglio della parola | R | dal 2°-3° giorno, quando si cerca una parola |
| **Frasi** | 4 gruppi, 8 strumenti (sotto) | R/A | dopo le prime parole |

**Frasi oggi.** È organizzata su due livelli di pulsanti:

| Gruppo | Strumento | Classe |
|---|---|---|
| Impara | Lezioni (30) | R |
| Impara | Modelli | A |
| Costruisci | Esercizi (puzzle) | R |
| Costruisci | Laboratorio | A |
| Costruisci | Slot | A |
| Parla | Dialoghi (32) | R |
| Parla | Ordine del Pensiero | A |
| Leggi | Lettore | A |

### Corso di italiano: barra propria (5 schede)

| Scheda | Contenuto | Classe |
|---|---|---|
| 课程 | 30 lezioni con quiz | E |
| 复习 | ripasso FSRS | E |
| 单词 | 4780 parole | R |
| 变位 | coniugazioni | R, dopo la lezione 6 sul presente |
| 句子 | frasi, dialoghi, 句子练习, 句子检查 | R/A |

### Fogli e strati comuni

| Foglio o strato | Classe | Note |
|---|---|---|
| ⚙️ Impostazioni | — | foglio dal basso |
| 🔍 Cerca ovunque | R | |
| 🎵 Jukebox | R | |
| Dettaglio parola e famiglia del carattere | R | |
| Pannello «Parla» (microfono) | R | |
| Immersione a schermo pieno | E | per gli esercizi |
| Carta del giorno | R | |
| Contributi | A | |
| Crediti | A | |
| Passaggio con QR | A | |
| `#selftest` | A | nascosto |
| `#dev` | A | nascosto |

### Impostazioni oggi (un foglio lungo)

Le sezioni sono, in quest'ordine:

1. Aspetto
2. Audio e musica
3. Voce
4. Microfono
5. Backup e ripristino
6. Lingua
7. Come funziona (benvenuto, selftest, crediti)
8. Le sezioni aggiunte dai moduli in `CP.settingsExtras`: Sincronizza, Corso, Contributi, 🔔 Promemoria, App Android

## 2. Proposta

**Navigazione.** La barra resta a quattro schede, in quest'ordine: **Percorso · Studia · Parole · Frasi**.

- L'ordine segue quello in cui le schede si sbloccano, così l'occhio impara una sola sequenza.
- Studia passa dal 3° al 2° posto. È un cambiamento piccolo per chi già usa l'app.
- I nomi restano quelli che gli utenti conoscono. «Oggi» è il titolo della carta in cima al Percorso, non un nome di scheda.

**Percorso = home «Oggi».**

- In cima, una sola carta «Continua», con il tempo stimato, la serie e l'obiettivo del giorno. È l'unico pulsante pieno.
- Sotto, compatti: il grado, la tappa corrente (lezione e dialogo, che si aprono in immersione) e i capitoli.

**Frasi: pagina d'ingresso con 4 carte.** Al posto dei due livelli di pulsanti ci sono quattro carte, ciascuna con una riga
di spiegazione:

| Carta | Che cosa dice |
|---|---|
| Impara | le regole con esempi |
| Costruisci | metti in fila le parole |
| Parla | dialoghi e ordine del pensiero |
| Leggi | un testo, parola per parola |

Toccata una carta, i suoi strumenti stanno su una riga di schede: al massimo 3, sempre sotto il limite di 7. Dentro Frasi
gli strumenti compaiono per gradi (le soglie sono in `src/ui/unlock.js`):

| Momento | Strumenti |
|---|---|
| subito | Lezioni, Esercizi, Dialoghi |
| dopo 3 lezioni superate | Modelli, Ordine del Pensiero |
| dopo 6 lezioni superate o 1000 XP | Laboratorio, Slot, Lettore |

Prima di quel momento lo strumento si vede nella sua carta con «si apre dopo…». Non sparisce mai, e
⚙️ → «Mostra tutto» lo apre subito.

**Impostazioni in 4 gruppi.**

| Gruppo | Contenuto | Aperto? |
|---|---|---|
| Essenziali | aspetto, audio e musica, lingua | aperto |
| Dati e privacy | backup, sincronizzazione, esportazione, contributi | chiuso |
| Avanzate | voce, microfono, forme dei toni, promemoria, app Android, corso, «Mostra tutto» | chiuso |
| Informazioni e supporto | come funziona, novità, crediti, privacy, sostieni il progetto | chiuso |

Un modulo che si aggiunge a `CP.settingsExtras` dichiara il gruppo: `{ group: "data", html: fn }`. Le funzioni semplici di
oggi valgono come gruppo «Avanzate».

**Corso di italiano.**

- All'inizio si vedono 课程 e 复习.
- 单词 arriva a 200 punti.
- 变位 arriva quando si supera la lezione 6 (il presente) oppure a 300 punti, la prima delle due. È l'ordine naturale:
  la coniugazione serve dopo aver visto il presente.
- 句子 arriva a 300 punti.
- Valgono gli stessi minimi di giorni attivi del corso di cinese.

**Sblocco della barra (corso di cinese).**

| Momento | Schede |
|---|---|
| subito | Percorso, Studia |
| 200 XP e almeno 2 giorni attivi | Parole |
| 300 XP e almeno 3 giorni attivi | Frasi |

Le costanti stanno in un solo punto, `UNLOCK` in `src/ui/unlock.js`. Chi ha già progressi o ha già visto il benvenuto
ha tutto sbloccato.

## 3. Glossario (uguale in tutta l'app)

| Italiano | 中文 | Significato |
|---|---|---|
| parola | 词 | una voce del vocabolario (la chiave è il carattere) |
| carta | 卡片 | la parola come si ripassa: domanda e risposta |
| tappa | 站 | un gruppo di parole del Percorso, con lezione e dialogo |
| capitolo | 章 | un gruppo di tappe; capitoli 1-5 = HSK 1-5, 6 = oltre l'HSK |
| lezione | 课 | una spiegazione di grammatica con esercizi |
| ripasso | 复习 | le carte che oggi è il momento di rivedere |
| serie | 连续天数 | i giorni di studio di fila |
| grado | 等级 | il titolo che cresce con i punti (XP) |

## 4. Regole controllate dagli audit

- **[10] Un solo `.btn-main` visibile** per schermata, oppure dentro il foglio aperto. Oggi violava solo «Slot»: il
  pulsante «Gira tutto» è diventato secondario.
- **[11] Un menu non ha più di `MENU_MAX = 7` voci visibili.** Vale per `.dock`, `[role=tablist]` e `.seg`.
- **Le regole già presenti restano:** bersagli da 44 px, contrasto, testi da almeno 13 px, nessun overflow, avvio leggero.

## 5. Parità visiva tra i due corsi (Task 11.3)

Il corso di italiano per chi parla cinese deve essere curato quanto quello di cinese. Da ricontrollare a ogni modifica
grande, in chiaro, carta di riso e scuro, a 360 e 390 px.

| | Corso di cinese | Corso di italiano | Stato |
|---|---|---|---|
| ☑ | Percorso: carta «Continua», grado e serie in alto | 课程: carta «今天» con un solo pulsante primario, grado, anello, serie | fatto |
| ☑ | tappe come percorso | lezioni come percorso: nodi collegati, la corrente evidenziata, «通过» sulle superate | fatto |
| ☑ | sigillo del grado (`CP.stamp`) | lo stesso sigillo, nella carta e in «+N 分» | fatto |
| ☑ | fine sessione con il sigillo | fine lezione con «通过» che si imprime; «分享» | fatto |
| ☑ | progressi in Studia (`CP.story`) | «我的进步», stesso modulo, con «纪念卡» | fatto |
| ☑ | carta del giorno | carte del giorno, del traguardo e della settimana, 3 formati, 3 colori | fatto |
| ☑ | bersagli da 44 px, testi da 13 px, contrasto | gli stessi controlli di `tools/ux-audit.mjs` | fatto |
| ☑ | `prefers-reduced-motion` | «+N 分», «通过» e l'anello hanno la versione ferma | fatto |
| ☑ | icone SVG nella barra | le stesse icone SVG, più una per 变位 | fatto |
| ☑ | ripasso a scelta multipla (stile Misto, Task 12 T1): risposta prima del risultato, segno ✓/✗, un solo «Continua» | arriva con T5 (stesso motore, voto da `CP.itApi.grade`) | cinese fatto, italiano in T5 |
| ☑ | percorso guidato (T3): carta «Continua» con un solo pulsante che dice il passo, verifica di tappa con le cinque parti | carta «今天» con il passo successivo (T5) | cinese fatto, italiano in T5 |
| ☑ | lettura graduata (T4): testi per livello, «giusto per te», pinyin e traduzione a scelta, domande, parole nuove nel ripasso | testi italiani con le domande in cinese (T5) | cinese fatto, italiano in T5 |
| ☐ | testi riletti da un madrelingua | i testi cinesi del corso, della carta e della pagina zh/ | da far rileggere |
| ☐ | vuoti curati | «ancora nessuna lezione»: oggi la carta mostra sempre la prossima lezione | da controllare |
