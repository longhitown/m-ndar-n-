# màndarínō · come funziona, in ogni suo aspetto

Questo documento descrive l'app **com'è oggi**, parte per parte: che cosa fa chi la usa, che cosa succede sotto, dove sta nel codice e che cosa è
verificato. Ogni numero è stato contato sui dati o misurato; dove una cosa non è stata provata lo dico. È il riferimento per decidere le modifiche
successive: se una frase qui è sbagliata o vaga, quello è il primo punto da correggere.

Stato al 28 ottobre 2026 (versione 6.7). Fonti principali: `src/` (il codice), `tools/` (build, prove, controlli), `android/`, `docs/`.

---

## 1. Che cosa è e quali regole segue

**màndarínō** è un'app per studiare **il cinese partendo dall'italiano** e **l'italiano partendo dal cinese**, nello stesso programma, con progressi separati per corso.
È gratuita, senza pubblicità, senza account e senza server propri: tutto quello che serve sta nell'app, e tutto quello che fa chi studia sta sul suo telefono.

Le regole che guidano ogni scelta (il Manifesto, `MANIFESTO.md`, le dice in prima persona):

1. **Gratis, sempre.** Nessun abbonamento, nessuna funzione a pagamento. Chi vuole può sostenere il progetto (Ko-fi) e riceve, se lo chiede, un *sigillo* di gratitudine: è solo estetico e non sblocca niente.
2. **Offline.** Dopo il primo caricamento funziona senza rete. La rete si usa solo per cose che decide chi studia (sezione 12).
3. **Privata.** Nessun tracciamento, nessuna statistica, nessun cookie di terzi. I dati restano sul dispositivo.
4. **Calma.** Nessuna notifica che crea ansia (il promemoria è facoltativo e spento di base), nessuna interfaccia pensata per catturare l'attenzione.
5. **Verificabile.** Ogni contenuto si controlla con strumenti automatici (sezione 17) e ogni parte di altri è citata con la sua licenza.

Come si distribuisce: un **file unico** (`dist/index.html`, generato da `src/`, circa 4,1 MB con i dati), una **PWA** (si installa dal browser), un'**app Android** (WebView + un piccolo ponte nativo) e un
**sito** (https://mandarinoapp.org, GitHub Pages) che presenta l'app e contiene la versione web in `/app/`.

---

## 2. I due corsi e che cosa contengono (numeri contati)

### Il cinese per italiani (corso di base)

| Contenuto | Quantità |
|---|---|
| Parole con pinyin, toni a colori, significato in italiano e frase d'esempio | **6385**, in **220 sezioni** (HSK 1–5: 174, 470, 692, 717, 832 parole; il resto sono sezioni per argomento) |
| Frasi d'esempio (una per parola, cinese + italiano) | **5754** |
| Frasi di tutti i giorni, per situazione | **120** in 12 gruppi |
| Dialoghi di sopravvivenza (ascolto, tocco sulle parole, recita la parte di B) | **32** dialoghi, 304 battute |
| Lezioni di grammatica | **55** (30 di base + 25 aggiuntive caricate al primo uso), 283 esercizi, un mini-dialogo con audio in ognuna |
| Ripassi di grammatica | uno ogni cinque lezioni (**11**), con domande prese dalle lezioni |
| Frasi verificate a mano per il laboratorio di traduzione | **378** (5 solo «a memoria») |
| Ordine del Pensiero (blocchi in 6 categorie) | **30** esempi |
| Modelli di frase / slot machine / situazioni a tempo | **21** / **8** / **16** |
| Caratteri con ordine e direzione dei tratti (lavagna) | **2146** |
| Caratteri con scomposizione in componenti («Di che cosa è fatto») | **2517** |
| Radicali e ricette del Laboratorio dei radicali | **214** radicali, **1610** ricette |
| Testi per la lettura graduata | **15** testi cinesi, 8 italiani |
| Frasi Tatoeba con traduzione diretta usate negli esercizi | **2481** coppie cinese–italiano (e 3046 per il corso di italiano) |
| Voci reali registrate (cinese, Mozilla Common Voice CC0; italiano, Tatoeba NM1 CC BY 4.0) | **720** clip cinesi e **434** italiane |
| Musica originale | **22 brani**, circa 85 minuti e 77 MB in totale |

### L'italiano per chi parla cinese (意大利语课程, interfaccia in cinese)

| Contenuto | Quantità |
|---|---|
| Lessico (nomi con genere e plurale, aggettivi con 4 forme, verbi con coniugazione) | **4780** parole (da 4406 voci; fonte delle forme: Morph-it!) |
| Lezioni in cinese, con quiz | **51** (30 di base + 21 aggiuntive), 259 esercizi, un mini-dialogo con audio in ognuna |
| Ripassi | uno ogni cinque lezioni (**10**) |
| Esercizi (stile Guidato, Misto, Classico) | 10 tipi: significato, parola, ascolto, dettato con voce reale, frase a buco, ordina, scrivi, forma del verbo… |
| Correttore di frasi italiane (句子检查) | accordi: articolo-nome-aggettivo, soggetto-verbo, participio con «essere» (non il senso, non i tempi, non l'ordine: lo dice) |
| Lettura graduata | 8 testi A1–B1 |

La scelta del corso sta nel benvenuto o in ⚙️ → Studio → Corso (`cp-course = "zh" | "it"`); cambiare corso ricarica la pagina. I due corsi hanno progressi, ripasso e punti separati.

---

## 3. La prima volta e ogni apertura

### L'apertura (la schermata d'avvio)

A ogni avvio, non solo al primo, si vede `#splash` (`index.html`, `styles/splash.css`, `main.js`):

1. il frutto del logo compare con un piccolo rimbalzo; le nove lettere del nome salgono una dopo l'altra (à, í, ō compaiono prima «nude»);
2. i quattro toni (piatto, ascendente, discendente-ascendente, discendente) si disegnano sotto il nome, ognuno nel suo colore;
3. i toni **volano**: il 4° sulla *à*, il 2° sulla *í*, il 1° sulla *ō* (la lettera prende il suo accento quando il tono arriva), il 3° si divide e si posa sulle due foglie, che brillano un istante;
4. i toni si dissolvono, resta il logo un istante e l'app entra, con un'entrata morbida del contenuto.

Dura circa **3,2 s**; **0,5 s** con «movimento ridotto» del sistema; **0,7 s** se si arriva da un collegamento (widget, scorciatoia); **zero** nei test automatici. Se il telefono è lento resta finché l'app non è pronta e, dopo
circa 2,4 s, mostra righe «scheletro» e un suggerimento (un tono, o una parola italiana). Se la persona ha un sigillo, il suo carattere si apre dietro il frutto. Toccando il frutto, rimbalza.
*(Il volo dei toni è nella pull request #26 al momento di scrivere.)*

### Il benvenuto (una volta sola, a meno che non lo si chieda di nuovo)

Tre «porte» (`ui/onboarding.js`, caricato solo quando serve):

- **Parto da zero**: scegli un obiettivo e un ritmo, senti i quattro toni (nel corso di italiano, l'accento di *ciao, grazie, buongiorno*), fai la prima carta.
- **Conosco già le basi**: cinque domande su di te e un **test di livello** di al massimo dieci domande (`data/placement.js`, `ui/placement.js`). Il test non dice se una risposta è giusta, «non lo so» conta come errore senza colpa,
  il livello proposto si corregge prima di confermare e si può rifare o annullare da ⚙️ → Studio.
- **Ho già un backup o un altro dispositivo**: porta dritto a sincronizzazione, QR o backup.

---

## 4. Navigazione e rivelazione progressiva

L'app mostra poco all'inizio e apre le parti man mano (`ui/unlock.js`, le soglie sono in un solo posto, `UNLOCK`):

| Corso | Subito | Si apre con |
|---|---|---|
| Cinese | **Percorso**, **Studia** | **Parole**: 200 punti e 2 giorni di studio · **Frasi**: 300 punti e 3 giorni |
| Cinese, dentro Frasi | Lezioni, Esercizi, Dialoghi | Modelli e Ordine del Pensiero: 3 lezioni superate · Laboratorio, Slot, Lettore, Radicali: 6 lezioni superate (oppure 1000 punti) |
| Italiano | **课程**, **复习** | **单词**: 200 punti e 2 giorni · **变位** e **句子**: 300 punti e 3 giorni (变位 anche dopo la lezione sul presente) |
| Tutto | — | A **1500 punti** (grado «Mercante di Seta») tutto è aperto; chi aveva già progressi ha tutto aperto; ⚙️ → Studio → «Mostra tutto» apre tutto subito |

Uno sblocco non si perde mai, nemmeno azzerando i progressi; tra dispositivi vale «basta uno» (regola d'unione in `core/store.js`).
Altri modi di muoversi: **Cerca ovunque** (🔍 o il tasto `/`: strumenti, lezioni, dialoghi, tappe, parole), **gesti** (scorrimento orizzontale tra schede, dove non confligge), tasto **Indietro** di Android (chiude fogli, poi torna indietro nelle pagine),
**immersione** (gli esercizi di Frasi a schermo pieno: ✕, Esc o Indietro per uscire). Regole di interfaccia controllate da `tools/ux-audit.mjs`: un solo pulsante primario per schermata, al massimo 7 voci per menu.

---

## 5. Studiare ogni giorno

### Percorso (la home)

Una carta «Continua» con **un solo pulsante** che dice che cosa succede («Impara 5 parole nuove · 10 ripassi»), poi le tappe per capitolo (una per sezione di vocabolario). La durata si sceglie tra **5, 10 e 15 minuti**.
Ogni tappa può avere le sue lezioni e il suo dialogo; il Taccuino del viaggiatore (sezione 11) cresce con le tappe finite.

### Studia

Il ripasso del giorno («Oggi»: ripassi, nuove, *Inizia*), «Orecchio ai toni», la **sfida di 60 secondi**, i progressi (con il racconto settimanale), i backup, il Foglio di lavoro in PDF. Il **giorno di studio cambia alle 4 del mattino**.
Sessione a schermo pieno, con due soli controlli principali (Ascolta, Parla) e il resto in «⋯»; limite giornaliero di parole nuove.

### Il motore del ripasso: FSRS-6

`core/fsrs.js` è un porting fedele di **py-fsrs (FSRS-6, 21 parametri)**, verificato vettore per vettore. Le parole tornano quando la probabilità di ricordarle sta calando; i quattro voti (Di nuovo, Difficile, Bene, Facile) mostrano l'intervallo vero.
**Una scelta multipla giusta non vale mai «Facile».** Ogni ripasso finisce nel registro (IndexedDB, con ripiego in `localStorage`).

### Tre stili di ripasso (⚙️ → Studio → Stile di ripasso)

- **Guidato** (predefinito per chi comincia): «impara · esercitati · verifica», una tappa alla volta: cinque parole nuove con frase e ascolto, esercizi sulle stesse parole, ripassi in scadenza. Con l'80% delle parole avviate arriva la **verifica** (12 domande senza aiuti, superata all'80%); il risultato dice il punto più debole e, sotto la soglia, «Rinforza» ripassa le sbagliate.
- **Misto**: esercizi vari al posto dell'autovalutazione.
- **Classico**: le carte di sempre («La so / Non la so»).

Chi ha già progressi parte da Misto. Il motore degli esercizi (gruppo `ESERCIZI`, caricato al primo uso) ha **15 tipi per il cinese**: significato, parola, pinyin, ascolto, tono, frase a buco, buco grammaticale, ascolto della frase, ordina, scrivi il pinyin,
scrivi il significato, buco da scrivere, abbina cinque coppie, traccia il carattere, componente (suono o significato). I **distrattori** sono credibili (livello vicino, stessa tappa, lunghezza simile) e deterministici (seme = parola + data + tipo).
La digitazione perdona accenti e refusi (`core/typing.js`: «esatto / senza toni / quasi / sbagliato»).

### Serie, punti, gradi

Il punteggio (XP) cresce con ripassi, lezioni e sfide; la serie conta i giorni attivi (**un giorno saltato a settimana non spezza la serie, purché non siano due di fila**); l'obiettivo giornaliero predefinito è 10 parole.
**Gradi** (nomi cinesi inclusi): Viaggiatore Curioso 0 · Apprendista dei Toni 200 · Custode di Caratteri 600 · Mercante di Seta 1500 · Poeta del Bambù 3000 · Maestro di Giada 6000 · Saggio Mandarino 10000 · poi Calligrafo d'Inchiostro 15000, Viandante dei Classici 22000,
Saggio del Fiume Giallo 30000, Maestro dei Quattro Mari 40000, e una «stagione» ogni 10000 punti. Il grado compare come sigillo-timbro con un carattere (游, 调…).

---

## 6. Parole

La scheda **Parole** è una tabella **virtualizzata** (solo le righe vicine alla finestra stanno nel DOM) con ricerca, filtri per livello e legenda dei toni. Toccando una parola si apre il suo **foglio**: pinyin, significati, frase d'esempio con audio,
**ordine dei tratti** (lavagna con direzione, tracciabile), e, nel corso di cinese, **«Di che cosa è fatto»** (componenti, radicale, quale parte dà il suono e quale il significato; solo struttura, «senza storie inventate»).
Si possono mettere parole tra i preferiti e dare loro etichette personali. Con il collegamento a **Pleco** acceso (spento di base, doppia conferma) si apre la parola nel dizionario esterno tenendo premuto un carattere per 2 secondi.

---

## 7. Frasi: grammatica, laboratori, lettura

La scheda **Frasi** ha quattro gruppi (`phrases/`):

- **Impara**: **Lezioni**, Modelli, **Radicali**.
- **Costruisci**: Esercizi (puzzle e frasi), **Laboratorio**, **Slot**.
- **Parla**: **Dialoghi**, Ordine del Pensiero.
- **Leggi**: Lettore «Raggi X», Testi (lettura graduata).

### Lezioni di grammatica (cinese)

Ogni lezione (`data/lessons/` e `data/lessons-x/`) ha: titolo e obiettivo, **spiegazione** (5 paragrafi), **schema** della frase, **sei–otto esempi con audio**, un **mini-dialogo** (3–8 battute, ognuna con audio), **errori tipici** (sbagliata → giusta → perché)
ed **esercizi con correzione immediata**: ordine delle tessere, scelta, frase a buco, scrittura (pinyin o italiano). Si supera con l'**80%**. Dopo il quiz: «Rifai i tuoi errori» e una mini-verifica con due domande nuove, che non cambiano il risultato.
Ogni **cinque lezioni** c'è un **ripasso** (`rip-1`, …) fatto a sorte con due domande prese dai quiz delle cinque lezioni: non ha contenuti propri da verificare.
Le prime 30 lezioni sono nel file unico; le **25 aggiuntive** (`LEZIONIX`) si caricano **la prima volta che si apre l'elenco o si cerca**, così l'avvio non cresce con le lezioni (1475 KB di JavaScript su un limite di 1500).
Elenco completo in appendice A.

### Laboratorio (traduttore prudente)

`phrases/translate.js` traduce dal cinese all'italiano **solo quando è sicuro**: 1) una frase verificata (378, più le correzioni dell'utente) vince sempre; 2) altrimenti analizza con regole e schede (`data/grammar.js`) e produce l'italiano con la morfologia di `phrases/italian.js` (coniugazioni, articoli, preposizioni articolate, accordi); 3) se una parola manca, dice quale e non inventa.
`phrases/grammar.js` è il correttore d'ordine delle frasi cinesi (segnala solo errori sicuri). `tools/grammar.mjs` prova che le regole arrivino da sole alle 378 frasi verificate.

### Altri strumenti

**Modelli** (21 schemi con esempi), **Slot** (una slot machine di frasi + situazione casuale a tempo), **Ordine del Pensiero** (30 esempi in 6 categorie, animazione dei blocchi, modalità Puzzle), **Lettore «Raggi X»** (incolli un testo cinese: lo taglia nelle parole del vocabolario con pinyin sopra ogni parola),
**Laboratorio dei radicali** (si accostano due componenti «come elementi chimici» e si vede se formano un carattere dell'app; 214 radicali, 1610 ricette; gruppo `LABRAD` caricato al primo uso).

### Lettura graduata

Testi per livello con il segno «giusto per te» quando si conosce almeno il **90%** delle parole; ogni frase si ascolta, le parole si toccano per il foglio, pinyin e traduzione si accendono a richiesta, in fondo ci sono domande e le parole nuove entrano nel ripasso con un tocco.

---

## 8. Il corso di italiano (意大利语课程)

Barra propria con cinque schede, interfaccia in cinese:

- **课程**: carta **今天** in cima (saluto, un solo pulsante col passo successivo: esercizi se ci sono almeno 10 ripassi, altrimenti un testo o la lezione corrente), poi il **percorso delle lezioni** come nodi collegati con il sigillo «通过» sulle superate e un nodo-ripasso ogni cinque lezioni.
- **复习**: ripasso FSRS con gli stessi tre stili e dieci tipi di esercizio; nessuna scelta multipla vale «Facile».
- **单词**: il lessico (4780 parole), raggruppato per tema/livello.
- **变位**: coniugazioni (presente, participio, futuro, imperfetto, condizionale, gerundio) prodotte dalle regole di `phrases/italian.js`, verificate su Morph-it!.
- **句子**: frasi, dialoghi, lettura graduata A1–B1, 句子练习 e **句子检查**.

Le lezioni hanno la stessa struttura di quelle di cinese (testi in cinese; esempi italiano → cinese), con mini-dialogo e audio (voce del telefono o clip reali). Elenco in appendice B.
Il codice del corso (`it/`, `i18n/it-course.js`) e i dati delle sue lezioni si eseguono **solo se il corso è «it»**: chi studia cinese non li compila.

---

## 9. Suono: voci, musica, microfono

### La voce, in tre livelli (`core/core.js`, `CP.speak`)

1. **Voce reale registrata**, se la frase ne ha una (`core/voice-clip.js`): nell'app Android sono già nel pacchetto; sul web si scaricano una volta da ⚙️ → Suoni e musica → Voce → «Scarica le voci» (circa 7 MB).
2. **Voce del dispositivo** (`speechSynthesis`; nell'APK un ponte con il motore di sintesi di Android).
3. **Voce online di riserva** (servizio non ufficiale), **solo se la si accende** (spenta di base). Se non risponde, dopo un tentativo, per cinque minuti si usa la voce del telefono (corretto nella pull request #22); nell'APK un motore vocale spento dal sistema viene riavviato e la frase riparte.

Velocità lenta/normale, voce scelta da ⚙️, musica che **scende di 10 dB** mentre parla la voce (ducking).

### Toni

Il **logo è interattivo**: toccando le lettere con l'accento si sente il loro tono, toccando le foglie il terzo. «Orecchio ai toni» e il pannello «Parla» con il microfono mostrano la **curva del tono** detto. I suoni dei pulsanti (legno, giada, gong, campana) sono **sintetizzati sul momento** con Web Audio, con tre stati (tutto / effetti / muto) e un volume.

### Jukebox 🎵

**22 brani originali** in loop (calma, concentrazione, energia), con dissolvenze, ordine casuale, abbinamento automatico all'attività (⚡ nella sfida, 🎯 nello studio) e musica che si ferma da sola quando si apre il microfono. Sul web i brani si scaricano al primo ascolto (o tutti insieme, circa 77 MB, da ⚙️). Nell'APK la musica continua in secondo piano con notifica (indietro, pausa, avanti, titolo) e tasti di cuffie e Bluetooth.
**I tuoi brani**: file audio scelti dal telefono, copiati nella memoria privata dell'app (IndexedDB), offline.

### Modalità Guida

«Passeggiata» a mani libere: una frase in italiano, qualche secondo per provare a dirla, poi il cinese (lento, poi normale), in automatico; sorgenti: frasi di tutti i giorni, le parole in ripasso, le frasi dei dialoghi; schermo acceso a richiesta.

### Pronuncia

Il microfono usa il riconoscimento del sistema (`SpeechRecognition`; nell'APK il riconoscitore di Android, che può funzionare offline). Un errore passeggero (servizio occupato) si ritenta una volta in silenzio; il microfono si libera quando l'app va in secondo piano (corretto nella #22).

---

## 10. Con altre persone (sempre senza server)

- **Carte da condividere**: un'immagine creata sul telefono (canvas) con grado, numeri e frase del giorno, e un QR verso l'app; la firma è facoltativa e spenta di base. Modelli: carta del giorno (cinese e italiano), carta del Taccuino, carta del Laboratorio dei radicali; formato e tema scelti.
- **Sfida a un amico**: dieci parole + un seme diventano un codice (`MDC1-…`, link, testo o QR); chi lo apre fa le stesse domande nello stesso ordine. Non tocca ripassi né punti.
- **Pacchetto classe** (per chi insegna): un tratto del corso, un obiettivo e una data diventano un codice (`MDK1-…`); chi studia lo importa e vede l'avanzamento; il riepilogo per l'insegnante si crea solo se lo si chiede e contiene solo conteggi.
- **Sigilli di gratitudine** (印章): codici firmati (ECDSA P-256, `MDS1.<contenuto>.<firma>`) che si riscattano nell'app; 支 Sostegno, 交 Cultura, 永 Custodire; solo estetici. L'app non sa chi ha donato. Le chiavi pubbliche stanno in `src/config.js` (**oggi la lista è vuota**: il riscatto non è ancora attivo finché non si genera una chiave con `lo strumento che genera la chiave`).
- **Taccuino del viaggiatore** (cinese): un viaggio immaginario Roma → Guilin; le città si sbloccano con le tappe del Percorso finite; gli sbagli non sono penalità (una coppia di parole scambiata diventa un aneddoto).
- **Foglio di lavoro**: un PDF A4 personale (caratteri o parole più difficili + quelli delle ultime lezioni) da stampare e scrivere a mano; si può anche condividere come codice.

---

## 11. I tuoi dati

Tutto sta in `localStorage` (chiavi `cp-*`: progressi, impostazioni, lezioni, gioco, sblocchi, brani…) con **copia di sicurezza in IndexedDB** (ripristino automatico se `localStorage` viene svuotato) e registro dei ripassi in IndexedDB (`core/store.js`).
Modi per spostare i dati, tutti senza server di màndarínō:

- **Backup JSON** che scarica chi studia, con **regole d'unione** (non si perde il lavoro fatto su un altro dispositivo).
- **Sincronizzazione su un file nel cloud personale** (Drive, OneDrive, Dropbox, iCloud…): l'app ci scrive i progressi e li riunisce all'avvio.
- **QR da un telefono all'altro**: una sequenza che si ripete, inquadrata dalla fotocamera (anche perdendo qualche fotogramma); i QR sono scritti da zero (`pwa/qr.js`, base45).
- **Esportazione per Anki** (dopo 400 parole o ripassi; porta le parole, non il calendario).
- **Cancellare tutto**: da ⚙️, o disinstallando l'app.

---

## 12. Rete e privacy (la tabella completa è `PRIVACY.md`, anche in cinese)

L'app funziona tutta offline. La rete si usa solo: per il **controllo degli aggiornamenti** (solo APK, al massimo una volta al giorno, spegnibile, una richiesta senza dati personali a `api.github.com`); per la **voce online** (spenta di base);
per il **riconoscimento vocale** (nel browser Chrome lo elabora il fornitore del browser; nell'APK il riconoscitore del telefono); per i **link esterni** che tocchi; per scaricare **musica, voci e il dizionario dei «nomi e termini»** al primo uso (dal sito stesso); per gli **aggiornamenti della versione web** (dal sito stesso).
Il sito è ospitato da GitHub Pages (che può registrare dati tecnici delle visite secondo la propria informativa; io non li ricevo) e non usa cookie, statistiche, font o script di terzi. Permessi Android: microfono (solo esercizi di pronuncia), fotocamera (solo QR), notifiche (solo promemoria facoltativo e musica), vibrazione, internet, avvio dopo il riavvio (promemoria), servizio in primo piano (musica).
Backup automatico di Android: se acceso dal telefono, copia i dati dell'app nell'account Google di chi studia (servizio del sistema, non di màndarínō).

---

## 13. Le impostazioni (⚙️)

Una pagina con **ricerca** e **cinque riquadri**, ognuno con la sua pagina e «Indietro» (due livelli, mai sezioni annidate): **Aspetto** (tema chiaro / carta di riso / notte, caratteri, lingua dei menu, forma dei toni), **Suoni e musica** (audio, voce, microfono, jukebox, brani propri),
**Studio** (corso, stile di ripasso, livello e schede, promemoria, sfide e classe, Pleco), **Dati e sincronizzazione** (sincronizzazione, backup, esportazione, contributi), **Informazioni** (come funziona, novità, privacy, crediti e licenze, sostieni il progetto, test automatico `#selftest`).
I vecchi collegamenti alle sezioni (`grp-ess`, `set-export`…) aprono la pagina giusta.

---

## 14. L'app Android

Una **WebView** che apre `dist/index.html` dal pacchetto, più un **ponte nativo** (`Bridge.java`, solo SDK Android, nessuna libreria) che ricostruisce le API web che la WebView non ha: sintesi vocale, riconoscimento vocale, salvataggio di file in Download, condivisione, backup, sincronizzazione su file, musica in secondo piano.
Due versioni con lo stesso `applicationId` e la stessa chiave: **direct** (GitHub Releases; controllo aggiornamenti, sostegno e sigilli accesi) e **store** (senza queste tre cose).

- **Widget «Oggi»** (4×2 e 2×1): serie di giorni con un messaggio gentile, ripassi in scadenza (calcolati sul telefono dall'istogramma delle prossime 168 ore), parola del giorno (un tocco mostra il significato), «Studia ora».
- **Widget «Pausa»** (4×1): giri di studio da **25 minuti** e **pausa caffè** da 5; il conto alla rovescia è un cronometro in discesa che Android fa scorrere da solo (un widget non può animarsi); un allarme ai cambi di fase aggiorna il widget e manda un avviso; da fermo mostra «Riposo» di notte (22–6) e «Pausa caffè a Xi'an» dalle 14 alle 18.
- **Scorciatoie** (pressione lunga sull'icona): Studia ora, Orecchio ai toni, Musica.
- **Promemoria** facoltativo (⚙️ → Studio): un avviso al giorno all'ora scelta, calcolato sul telefono, solo se oggi non si è studiato e c'è qualcosa da fare.
- **Musica in secondo piano** con comandi fuori dall'app.
- **Aggiornamenti**: una volta al giorno guarda l'ultima Release; gli APK si installano sopra senza perdere i progressi.

*Nota onesta:* il codice Java viene compilato e controllato dalla CI (build, Android lint, emulatori API 34 e 36), ma **non è stato provato su un telefono vero**: la lista è in `docs/checklist-dispositivo.md` (widget, voce, microfono, musica a schermo spento, promemoria).

---

## 15. Il sito e la PWA

`https://mandarinoapp.org` (GitHub Pages, HTTPS, dominio proprio; pubblicazione da un'azione `pages.yml`): pagina di presentazione in **italiano e cinese** (con anteprima sfocata dell'altra lingua), clip animate di ogni funzione,
**microprove** nel browser (toni, scrittura dei caratteri, parole; non salvano né inviano niente), la **radio** (tre brani), la pagina **Privacy** e il **Manifesto** (`/manifesto.html`, italiano e cinese, con due carte da scaricare),
la versione web dell'app in `/app/` (installabile come PWA, offline dopo il primo caricamento), l'APK dell'ultima Release con la sua impronta SHA-256, `robots.txt` e `sitemap.xml`.
Il **service worker** mette in cache l'intera app; ogni build ha una versione (impronta dei contenuti): all'aggiornamento compare «Nuova versione disponibile · Aggiorna».

---

## 16. Come è costruita

`src/` contiene HTML, 12 fogli di stile, script classici (nessun framework) e i dati; `tools/build.mjs` li unisce in `dist/index.html` (un file, circa 4,1 MB) e `dist/sw.js`, controllando dati, lezioni e frasi verificate.
**`dist/` non sta nel repository** (si costruisce in CI e in locale: così le pull request non litigano su un file generato). Moduli grandi o rari sono **testo letto al primo uso**, non codice compilato all'apertura: gruppi `ESERCIZI`, `LABRAD`, `FOGLIO`, `MIEIBRANI`, `LEZIONIX`, il corso di italiano, il benvenuto, le impostazioni, i dati degli esempi e dei tratti.
Il **peso dell'avvio** è un test: oggi **1475 KB** di JavaScript da compilare, limite **1500 KB**.
Struttura: `core/` (stato, FSRS, store, segmentazione, voce), `words/`, `study/`, `phrases/`, `path/`, `ui/`, `it/`, `pwa/`, `audio/`, `voice/`, `data/`, `i18n/` (italiano e cinese di tutta l'interfaccia, ogni chiave in entrambe), `selftest/`.
Dipendenze di terzi dentro l'app: pochi file in `src/vendor/` (jsPDF per il Foglio di lavoro, jsQR per la lettura dei QR), tutte con licenza permissiva e citate in `THIRD-PARTY-NOTICES.md`.

---

## 17. Come si controlla che sia giusto

| Che cosa | Strumento | Esito attuale |
|---|---|---|
| Dati e lezioni validi, frasi cinesi fatte di parole del vocabolario, ogni file di dati elencato | `node tools/build.mjs` | passa |
| Frasi verificate, regole di traduzione | `node tools/grammar.mjs` | 378/378 |
| Prove veloci senza browser (taglio in parole, FSRS, QR, sigilli, sito, peso dell'avvio, widget) | `node tools/unit.mjs` | 75/75 |
| Prove nel browser (benvenuto, corsi, immersione, sincronizzazione, QR, sigilli, musica, voce, impostazioni, apertura…) | `node tools/e2e.mjs` | 284/284 |
| Regole di interfaccia e accessibilità | `node tools/ux-audit.mjs` | nessun problema |
| Documenti: link, ancore, parole vietate, strutture protette | `node tools/check-docs.mjs --strict` | 0 errori |
| Lezioni con fonti esterne (solo sviluppo): CC-CEDICT + Tatoeba | `node tools/lezioni-check.mjs` | 0 errori certi; 8 «sospetti» riletti uno per uno e giusti nel contesto |
| Pinyin e vocabolario contro CC-CEDICT; italiano contro Morph-it! e Hunspell | `tools/cedict-check.mjs`, `tools/morphit-check.mjs`, `tools/hunspell-check.py` | nessuna forma sbagliata nelle regole |
| Android: build, lint, firma, emulatori | GitHub Actions `apk.yml` | verde sulle ultime pull request |

**Che cosa questi controlli non coprono.** Non sostituiscono un **madrelingua**: i testi cinesi del corso di italiano, le frasi d'esempio, i mini-dialoghi e le 46 lezioni aggiunte sono scritti con costruzioni semplici e controllati in modo automatico, ma nessun madrelingua li ha letti.
`docs/rilettura.md` descrive il flusso per farlo un campione alla volta.

---

## 18. Limiti noti e cose da decidere

- **Rilettura da madrelingua**: ancora nessuna (cinese delle lezioni di italiano, italiano delle lezioni di cinese, frasi, mini-dialoghi, versione cinese del Manifesto).
- **Prove su telefono vero** ancora da fare: widget, voce con motore spento, microfono, musica a schermo spento, giro dei brani senza vuoti, voci reali senza rete, comportamento in Cina (Pleco, WeChat).
- **Sigilli**: lista di chiavi pubbliche vuota; per attivarli serve generare una chiave e fare una prova con un codice di prova (`docs/sigilli.md`).
- **Correttore di frasi italiane**: copre solo gli accordi (26 degli 88 errori tipici delle lezioni).
- **Il corso di italiano** non ha ancora «Rifai i tuoi errori» né la mini-verifica dopo la lezione (nel corso di cinese ci sono).
- **Test di livello**: la scala va da 0 a 30 lezioni note (le lezioni aggiuntive sono oltre la scala).
- **Voce online**: è un servizio non ufficiale e può smettere di funzionare; per questo è facoltativa.
- **Conflitti tra pull request in parallelo**: risolti per `dist/`; restano possibili in `tools/e2e.mjs` e `src/data/changelog.js`, che raccolgono righe nuove nello stesso punto.

---

## Appendice A · Lezioni del corso di cinese (55)

Ogni lezione ha anche un mini-dialogo e, se non è tra le prime 30, sta nel gruppo caricato al primo uso. Una lezione è superata all'80%.

| N. | Titolo | Obiettivo | Esempi | Esercizi |
|---|---|---|---|---|
| 1 | Essere: 是 | Dire chi sei, di dove sei e che lavoro fai. | 8 | 6 |
| 2 | Il possesso: 的 | Dire di chi è una cosa e presentare la tua famiglia. | 8 | 6 |
| 3 | Gli aggettivi: 很 | Descrivere cose e persone, dire come stai. | 8 | 6 |
| 4 | Dire di no: 不 e 没 | Negare al presente e al passato senza confonderti. | 8 | 6 |
| 5 | Domande sì o no: 吗 | Fare domande semplici e rispondere sì o no. | 8 | 6 |
| 6 | Che cosa, chi, dove: le parole interrogative | Chiedere che cosa, chi, dove, quanti, perché e quando. | 8 | 6 |
| 7 | Avere e «c'è»: 有 | Dire che cosa hai e che cosa c'è in un posto. | 8 | 5 |
| 8 | Contare: numeri e classificatori | Contare persone e cose con il classificatore giusto. | 8 | 6 |
| 9 | Quando: il tempo prima del verbo | Dire quando fai le cose, con l'ordine giusto. | 8 | 5 |
| 10 | Dove: 在 | Dire dove sei e dove fai le cose. | 8 | 5 |
| 11 | Volere e potere: 想, 要, 会, 能, 可以 | Dire che cosa vuoi, che cosa sai fare e che cosa puoi fare. | 8 | 5 |
| 12 | Fatto e finito: 了 | Raccontare quello che hai fatto. | 8 | 5 |
| 13 | L'hai mai fatto? 过 | Dire dove sei già stato e che cosa hai già provato. | 6 | 4 |
| 14 | Mi piace: 喜欢 | Dire che cosa ti piace e che cosa no. | 8 | 5 |
| 15 | Più … di: 比 | Fare paragoni tra persone, cose e giorni. | 7 | 5 |
| 16 | Che cosa fai a una cosa: 把 | Dire dove metti una cosa, che cosa ci fai e come la lasci. | 8 | 5 |
| 17 | Il passivo: 被 | Raccontare che cosa ti è successo: rubato, rotto, mangiato da qualcun altro. | 8 | 5 |
| 18 | Il risultato: 看完, 听懂, 找到 | Dire non solo che cosa hai fatto, ma come è andata a finire. | 9 | 5 |
| 19 | Di qua o di là: 进来, 出去, 回来 | Dire entra, esci, torna, sali e scendi, dal punto di vista giusto. | 8 | 5 |
| 20 | Tirare fuori, alzarsi, ricordarsi: 出来, 起来 | Usare le direzioni dopo un altro verbo, anche in senso figurato. | 8 | 5 |
| 21 | Come lo fai: 说得很好 | Dire come qualcuno fa una cosa: bene, in fretta, tardi. | 8 | 5 |
| 22 | Ce la fai o no: 听得懂 / 听不懂 | Dire se riesci o non riesci a fare una cosa: capire, finire, trovare. | 8 | 5 |
| 23 | Uno stato che dura: 着 | Descrivere come stanno le cose: la porta aperta, qualcuno seduto, fare due cose insieme. | 8 | 5 |
| 24 | Sto facendo: 正在 … 呢 | Dire che cosa stai facendo proprio adesso, o che cosa facevi in quel momento. | 8 | 5 |
| 25 | Perché e anche se: 因为…所以, 虽然…但是 | Collegare due frasi: la causa e la conseguenza, il contrasto. | 7 | 5 |
| 26 | Se, basta che, solo se: 如果…就 | Fare ipotesi e porre condizioni. | 7 | 5 |
| 27 | Non solo… ma anche: 不但…而且 | Aggiungere informazioni: due qualità, due azioni insieme. | 7 | 5 |
| 28 | Sempre più: 越来越, 越…越 | Dire che qualcosa cresce col tempo, o che una cosa cresce insieme a un'altra. | 7 | 5 |
| 29 | Quando, dove, come: 是…的 | Chiedere e dire i dettagli di una cosa già successa: quando, dove, con chi, come. | 8 | 5 |
| 30 | Perfino e tranne: 连…都, 除了…以外 | Sottolineare una cosa sorprendente e fare eccezioni. | 7 | 5 |
| 31 | Anche e tutti: 也 e 都 | Dire «anche» e «tutti» e metterli al posto giusto, anche insieme e con la negazione. | 6 | 6 |
| 32 | Ancora, di nuovo: 还, 再, 又 | Distinguere i tre «ancora» e dire «ancora» per qualcosa che continua, che si ripete domani o che si è già ripetuto. | 6 | 6 |
| 33 | Presto o tardi: 就 e 才 | Dire che qualcosa succede «già» presto o «solo» tardi, e collegare azioni che si seguono. | 6 | 5 |
| 34 | Suggerire e ammorbidire: 吧 e 啊 | Fare una proposta, chiedere conferma e rendere una frase più morbida con le particelle in fondo alla frase. | 6 | 5 |
| 35 | Quanto tempo: la durata | Dire per quanto tempo si fa o si è fatto qualcosa: «ho studiato tre anni», «aspetto un'ora». | 6 | 5 |
| 36 | Quante volte: 次 e 遍 | Dire quante volte si fa qualcosa: «sono stato tre volte», «leggilo ancora una volta». | 6 | 5 |
| 37 | Da…a… e la distanza: 从, 到, 离 | Dire da dove a dove si va, da quando a quando, e quanto è lontano un posto. | 6 | 5 |
| 38 | A chi, con chi, verso chi: 给, 跟, 对 | Dire «per, a», «con» e «verso, nei confronti di» usando le preposizioni verbali. | 6 | 5 |
| 39 | Chiedere e far fare: 请 e 让 | Chiedere gentilmente, invitare e dire «lasciami», «fammi» con 请 e 让. | 6 | 5 |
| 40 | Due verbi in fila: andare a fare | Mettere due azioni una dopo l'altra senza congiunzioni: «vado al negozio a comprare…». | 6 | 5 |
| 41 | Appena… subito: 一…就 | Dire che una cosa segue subito un'altra: «appena arrivo, ti chiamo». | 6 | 5 |
| 42 | Prima, poi, dopo: 先, 然后, 以前, 以后 | Raccontare una sequenza e collocare un fatto «prima» o «dopo» un altro. | 6 | 5 |
| 43 | Sta per succedere: 要…了 | Dire che qualcosa sta per succedere e che qualcosa è cambiato. | 6 | 5 |
| 44 | Uguale e non così: 跟…一样, 没有 | Dire che due cose sono uguali, quasi uguali o che una non arriva all'altra. | 6 | 5 |
| 45 | Un po' e per provare: 看看, 一点儿 | Usare i verbi raddoppiati per «provare un po'» e distinguere 一点, 有点 e 一下. | 6 | 5 |
| 46 | Scegliere: 去不去 e 还是 | Fare domande «x o non x?» e «A oppure B?». | 6 | 5 |
| 47 | Non fare, non c'è bisogno: 别, 不要, 不用 | Dire «non farlo!», «non c'è bisogno» e rispondere ai ringraziamenti. | 6 | 5 |
| 48 | Appena e già: 刚, 刚才, 已经 | Dire «sono appena arrivato», «poco fa», «ormai è già…» con la parola giusta. | 6 | 5 |
| 49 | La cosa che…: 的 con una frase | Descrivere un nome con una frase intera: «il libro che ho comprato», «la persona che parla». | 6 | 5 |
| 50 | Forse, deve, certamente: 可能, 应该, 一定 | Dire «forse», «dovrebbe», «sicuramente» e il «deve» di dovere. | 6 | 5 |
| 51 | Di più e il più: 更, 最, 比较, 特别 | Dire «ancora più», «il più», «abbastanza» e «particolarmente» davanti a un aggettivo. | 6 | 5 |
| 52 | Dov'è e che cosa c'è: 在, 有, 是 | Descrivere un luogo con i tre verbi dell'esistenza e scegliere quello giusto. | 6 | 5 |
| 53 | Quantità: 一些, 有些, 所有, 每, 别的 | Dire «alcuni», «certi», «tutti», «ogni» e «altro» senza contare. | 6 | 5 |
| 54 | Come e perché: 怎么, 怎么样, 怎么了 | Chiedere «come si fa», «com'è» e «che cosa è successo». | 6 | 5 |
| 55 | Le parole di posizione: 前面, 后面, 左边, 右边, 旁边 | Dire dov'è qualcosa rispetto a qualcos'altro: davanti, dietro, a sinistra, a destra, accanto. | 6 | 5 |

## Appendice B · Lezioni del corso di italiano (51)

Titoli e obiettivi sono in cinese, come nell'app.

| N. | Titolo | Obiettivo | Esempi | Esercizi |
|---|---|---|---|---|
| 1 | 发音：怎么写就怎么读 | 看到意大利语单词，就能读出来。 | 9 | 6 |
| 2 | 名词：阴性、阳性和复数 | 知道名词是阴性还是阳性，会变复数。 | 7 | 6 |
| 3 | 冠词：il、lo、la…… | 在名词前面放上正确的冠词。 | 8 | 6 |
| 4 | essere（是）和 avere（有） | 说自己是谁、有什么，还有饿了、渴了、几岁了。 | 8 | 6 |
| 5 | 形容词要和名词一致 | 形容词跟着名词变性、变数。 | 8 | 5 |
| 6 | 现在时：-are、-ere、-ire | 会说"我说、你拿、他睡"。 | 8 | 5 |
| 7 | 否定和提问 | 会说"不"，会问问题。 | 8 | 5 |
| 8 | 介词：a、in、di、da | 会说去哪儿、在哪儿、从哪儿来、谁的东西。 | 8 | 5 |
| 9 | 说过去的事：近过去时 | 会说"我吃了"、"我去了"、"我去过"。 | 8 | 5 |
| 10 | 我喜欢：mi piace | 会说喜欢什么、不喜欢什么。 | 8 | 5 |
| 11 | 说将来的事：将来时 | 会说"我明天去"、"我们会到的"。 | 8 | 5 |
| 12 | 过去的习惯和背景：未完成过去时 | 会说"小时候我常常……"、"那时候在下雨"。 | 7 | 5 |
| 13 | 代替东西和人：直接宾语代词 | 会说"我买了它"、"我认识他"。 | 7 | 5 |
| 14 | 给谁、对谁：间接宾语代词 | 会说"我给他打电话"、"我对她说"。 | 7 | 5 |
| 15 | 自己对自己做的事：反身动词 | 会说"我七点起床"、"我叫马可"。 | 7 | 5 |
| 16 | 正在做：stare + 副动词 | 会说"我正在吃饭"。 | 7 | 5 |
| 17 | 我的、你的：物主形容词 | 会说"我的书"、"我妈妈"。 | 7 | 5 |
| 18 | 这个、那个：指示词 | 会说"这本书"、"那些人"。 | 7 | 5 |
| 19 | 比较：比……更 | 会说"他比我高"、"最好的"。 | 7 | 5 |
| 20 | 请你……：命令式 | 会说"进来！"、"请坐"、"别走"。 | 7 | 5 |
| 21 | 客气地说：条件式 | 会说"我想要……"、"您能……吗？"。 | 7 | 5 |
| 22 | 介词和冠词合在一起 | 会说"在桌子上"、"从车站"。 | 7 | 5 |
| 23 | 小词 ci 和 ne | 会说"我去那儿"、"我要两个"。 | 7 | 5 |
| 24 | ……的人、……的东西：关系代词 che 和 cui | 会说"我昨天买的书"、"我说的那个人"。 | 7 | 5 |
| 25 | 数字、钟点和日期 | 会说价格、几点、哪天。 | 7 | 5 |
| 26 | 能、要、应该：情态动词 | 会说"我可以……吗"、"我得走了"。 | 7 | 5 |
| 27 | 我觉得……：虚拟式（入门） | 会说"我觉得他是对的"、"希望你来"。 | 7 | 5 |
| 28 | 连接句子：因为、所以、如果、虽然 | 会说"因为下雨，所以我不去"。 | 7 | 5 |
| 29 | 人们怎么说：无人称的 si | 会说"这儿可以抽烟吗"、"意大利人吃得很晚"。 | 7 | 5 |
| 30 | 礼貌地说话：尊称 Lei | 会对陌生人、老人、店员客气地说话。 | 7 | 5 |
| 31 | 副词（一）：怎么样、多少 | 会说"说得好、走得慢、很贵、吃得太多"，分清 bene / buono 和 molto 的各种用法。 | 8 | 5 |
| 32 | 副词（二）：时间和频率 | 会说"已经、还没、从来没、总是、常常、刚刚"，并放在句子里正确的位置。 | 6 | 5 |
| 33 | 介词：位置 | 会说"在……上面、下面、前面、旁边、中间、远、近"，并避免常见的介词错误。 | 6 | 5 |
| 34 | 介词：时间 | 会说"从……到、三天前、两天后、多久了、在……之前"，分清 da、per、fra、fa、entro。 | 6 | 5 |
| 35 | con、senza、per：和、没有、为了 | 会说"和某人一起"、"不加糖"、"送给你"、"为了工作"和"用笔写"。 | 6 | 5 |
| 36 | 怎么去：in、a、con 和交通工具 | 会说"坐火车、开车、走路、骑自行车"，不再说错 in treno / a piedi。 | 6 | 5 |
| 37 | 数量：qualche、alcuni、ogni、tutti、nessuno | 会说"几个、一些、每个、所有、没有一个"，分清单数和复数。 | 6 | 5 |
| 38 | 带介词的疑问句 | 会问"跟谁、给谁、谁的、从哪里、多久了"，把介词放在疑问词前面。 | 6 | 5 |
| 39 | 第几、几月几号：序数词和日期 | 会说"第一、第二"和"十月十号"，会说星期、月份和年份。 | 6 | 5 |
| 40 | 一些：del、dei、delle（部分冠词） | 会说"一些面包、一些朋友"，知道什么时候用部分冠词，什么时候什么都不加。 | 6 | 5 |
| 41 | 介词后面的"我、你、他"：me、te、lui | 会说"和我、给你、从他那儿"，不再说 con io 或 per tu。 | 6 | 5 |
| 42 | 一样：come、tanto … quanto | 会说"和……一样高"、"不如……"，会用 come 比较。 | 6 | 5 |
| 43 | 快要……了：stare per | 会说"要下雨了、火车要开了、我快到了"。 | 6 | 5 |
| 44 | 需要、想要、花时间：avere bisogno、avere voglia、volerci | 会说"我需要"、"我想……"、"需要两个小时"。 | 6 | 5 |
| 45 | 到某人那儿：da + 人 | 会说"去医生那儿、在朋友家、从他那儿来"。 | 6 | 5 |
| 46 | 我觉得……：secondo me、mi sembra、credo | 会说出自己的看法："我觉得、在我看来、好像"。 | 6 | 5 |
| 47 | 我看见他了：过去时和宾语代词 | 会说"我看见他了、我买了它"，知道过去分词什么时候要和代词一致。 | 6 | 5 |
| 48 | 动词和介词的搭配 | 会用 pensare a、parlare di、credere in、aiutare a 等固定搭配，知道意大利语的介词不能直接照汉语翻译。 | 6 | 5 |
| 49 | 在饭馆和商店：常用说法 | 会点餐、买东西、问价钱，并礼貌地说"请、谢谢、不客气"。 | 6 | 5 |
| 50 | 先后顺序：prima di、dopo、quando、mentre | 会说"在……之前、……之后、……的时候、一边……一边"，把两件事按顺序连起来。 | 6 | 5 |
| 51 | 否定的各种说法：mai、niente、nessuno、più、neanche | 会说"从来不、什么都没有、没有人、不再、也不"，掌握意大利语的双重否定。 | 6 | 5 |
