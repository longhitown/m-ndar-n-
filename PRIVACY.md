# Privacy · 隐私说明

[Italiano](#italiano) · [中文](#中文)

Ultimo aggiornamento · 最后更新：2026-11

## Italiano

**In breve: màndarínō non raccoglie dati.** Non ha account, server, pubblicità, statistiche d'uso, tracciamento o cookie di
terze parti. Tutto quello che fai nell'app resta sul tuo dispositivo. Lo stesso vale per il sito mandarinoapp.org.

### Che cosa resta sul tuo dispositivo

I progressi (parole, ripassi, punti, lezioni), le impostazioni, i contributi non ancora mandati, i sigilli e il nickname
facoltativo stanno nella memoria del browser o dell'app (`localStorage` e IndexedDB, chiavi `cp-*`). Nessuno li riceve.
Si cancellano con ⚙️ → Dati e sincronizzazione, oppure cancellando i dati del sito o disinstallando l'app.

### Quando l'app usa la rete

L'app funziona tutta offline. La rete si usa solo in questi casi, che decidi tu:

| Che cosa | Quando | Che cosa parte | Dove |
|---|---|---|---|
| **Controllo degli aggiornamenti** (solo app Android scaricata dal sito o da GitHub: nelle versioni di Google Play e di F-Droid non esiste, aggiorna lo store) | al massimo una volta al giorno; si spegne in ⚙️ | una richiesta senza dati personali | GitHub (`api.github.com`) |
| **Voce online** | solo se la accendi in ⚙️ → Suoni e musica → Voce (spenta di base) | il testo cinese da leggere | un servizio di sintesi vocale di Google, non ufficiale |
| **Riconoscimento della voce** negli esercizi di pronuncia | solo quando tocchi il microfono | l'audio di quello che dici | nel browser Chrome lo elabora il fornitore del browser (Google); nell'app Android il riconoscitore del telefono, che può funzionare anche offline |
| **Controllo del pacchetto voci** (⚙️ → Comunità e voci → «Controlla aggiornamenti») | solo quando tocchi il pulsante, mai da sola | una richiesta `GET` senza cookie e senza intestazione Referer a `https://mandarinoapp.org/voci/index.json`, un piccolo elenco pubblico (versione, data, numero di voci, dimensione, file). Non parte nessun dato tuo: la richiesta è uguale per tutti | `mandarinoapp.org` (GitHub Pages: come per ogni visita al sito può registrare l'indirizzo IP, vedi sotto). Nell'app resta solo l'ultimo esito (data, numero, dimensione, quando hai controllato), in `localStorage` alla chiave `md-voicepack`, fuori dai backup. Per ora non scarica nulla |
| **Link esterni** (sostegno, GitHub, e-mail) | solo quando li tocchi | quello che apri tu | il sito che apri |
| **Musica e dizionario dei nomi** (versione web) | al primo ascolto di un brano, al primo uso dei «nomi e termini» del Lettore | la richiesta del file | lo stesso sito dell'app |
| **Aggiornamenti dell'app** (versione web) | all'apertura, se c'è rete | la richiesta della versione nuova | lo stesso sito dell'app |

### Dove scaricare l'app (sito, Google Play, F-Droid)

L'app è la stessa; cambia solo chi la distribuisce. La versione dal sito o da GitHub (APK) controlla da sola le novità, come
spiegato sopra. Quando l'app è distribuita da **Google Play** o da **F-Droid**, quel controllo è spento: gli aggiornamenti li
porta lo store. Lo store ha la sua informativa: Google Play può raccogliere dati sull'installazione e, se hai acconsentito
sul telefono, sugli arresti anomali; io ricevo soltanto totali anonimi nella Play Console, mai dati su di te. Dal codice
dell'app non parte nessuna richiesta verso gli store.

### Il sito mandarinoapp.org

Il sito presenta l'app e ne contiene la versione web. Non usa cookie, statistiche, pubblicità né servizi di terzi, e non
salva niente nel tuo browser: font, script e immagini arrivano tutti dal sito stesso.

- **«Provala qui».** Le tre microprove (toni, scrittura dei caratteri, parole) lavorano nel tuo browser. I toni sono generati
  sul momento dal tuo dispositivo. Quello che fai e i punti che totalizzi non vengono salvati né inviati.
- **Voce del dispositivo.** Il pulsante «Ascolta» delle parole usa una voce cinese già presente sul tuo dispositivo o nel
  tuo browser. In alcuni browser, come Chrome, certe voci possono essere elaborate online dal fornitore del browser.
- **Musica.** I brani del sito si scaricano solo dopo che tocchi il pulsante di ascolto, dallo stesso sito.
- **Dove sta il sito.** È ospitato da GitHub Pages. Come ogni servizio di hosting, GitHub può registrare dati tecnici delle
  visite (per esempio l'indirizzo IP) secondo la propria informativa. Io non ricevo questi dati.
- **Scaricare l'APK.** Dal sito o da GitHub: vale quello che sopra per il sito che apri.

### Fotocamera, microfono, notifiche

- **Microfono:** solo per gli esercizi di pronuncia e solo mentre li usi. L'oscilloscopio dei toni lavora sul dispositivo;
  la registrazione non viene salvata né inviata.
- **Scambio linguistico (facoltativo, spento di base):** solo se apri ⚙️ → Suoni e musica → Scambio linguistico e confermi il foglio
  del consenso, registri la tua voce mentre leggi frasi dell'app. Le registrazioni restano solo sul telefono finché non le mandi tu
  (un file `.zip` che invii come vuoi: nessun caricamento automatico). Se le mandi, possono essere pubblicate nell'app con licenza CC BY 4.0;
  le ascolta soltanto chi gestisce il progetto. Si possono cancellare in qualsiasi momento dallo stesso foglio. Solo per maggiorenni.
- **Fotocamera:** solo per leggere un QR (passaggio a un altro telefono, sigilli). Le immagini non vengono salvate.
- **Notifiche (Android):** solo per il promemoria facoltativo e per la musica in secondo piano.
- **Pleco** (facoltativo, spento di base, solo sul telefono): se lo accendi e tocchi «Apri in Pleco», la parola passa
  all'app Pleco sul tuo telefono, non a internet.

- **Altri permessi di Android:** Internet (le richieste elencate nella tabella), vibrazione, gestione dell'audio mentre ascolti o
  registri, avvio del telefono (solo per rimettere il promemoria facoltativo) e servizio in primo piano (solo per la musica in
  secondo piano). Nessuno di questi legge contatti, posizione, messaggi o file tuoi.

### Backup automatico di Android

Nell'app Android, se il backup è acceso nelle impostazioni del telefono, Android copia i dati dell'app (i progressi)
nel backup del tuo account Google e li riporta su un telefono nuovo. È un servizio del sistema, non di màndarínō: io
non vedo niente. Si spegne nelle impostazioni del telefono (Sistema → Backup).

### Sincronizzazione e backup

La sincronizzazione scrive un file che scegli tu, nel tuo cloud (Google Drive, OneDrive, Dropbox, iCloud…), oppure passa
i dati da un telefono all'altro con dei QR. Non vedo né il file né i QR. Il backup è un file che scarichi tu.

### Contributi

Una correzione o una parola proposta parte solo quando la mandi tu, con il canale che scegli (condividi, e-mail, file,
GitHub). Contiene le tue proposte e, se lo scrivi, un nickname. Se scegli GitHub o l'e-mail, valgono le regole di quei
servizi, e chi riceve vede il tuo account o il tuo indirizzo.

### Carte da condividere

Le carte da condividere (corso di cinese e corso di italiano) nascono **sul tuo telefono**. Usano solo dati creati lì:
- grado, serie, parole e la frase del giorno;
- il nome, ma solo se scegli di firmare. È spento di base e resta solo su questo telefono.

Le vedi prima di inviarle; quello che ne fai è una tua scelta. Il QR porta alla pagina dell'app senza parametri né codici,
e l'app non registra se e dove condividi.

### Sfide e pacchetti classe

Una **sfida a un amico** è un codice con dieci parole e un numero che decide l'ordine delle domande: niente nome, niente
punteggio. Lo mandi tu, come e a chi vuoi. Se lo mandi come link, il codice sta dopo il simbolo «#» e non arriva a
nessun server.

Un **pacchetto classe** contiene solo un titolo, un tratto del corso, un obiettivo e una data. Il **riepilogo per chi
insegna** si crea solo se lo chiedi e spunti il consenso. Contiene soltanto:
- quante parole o lezioni del pacchetto hai fatto;
- se l'obiettivo è raggiunto;
- in quanti giorni hai studiato negli ultimi 30;
- la data;
- il nome, se lo scrivi.

Nessun registro dei ripassi. L'app non lo manda da sola: lo scarichi o lo condividi tu.

### Donazioni e sigilli

L'app non sa chi ha donato. Una donazione passa da Ko-fi, con la sua informativa. Vedo solo quello che Ko-fi mi mostra
(nome, e-mail, importo, messaggio) e lo uso soltanto per mandare il sigillo a chi lo chiede. Su richiesta cancello questi
dati dal mio registro. Il codice del sigillo non contiene dati personali.

### Contatti

`mandarinoapp@gmail.com` · Claudio Longhitano, autore di màndarínō.

## 中文

**简而言之：màndarínō 不收集任何数据。** 没有账号、服务器、广告、使用统计、跟踪或第三方 Cookie。你在应用里的一切都只保存在你的设备上。网站 mandarinoapp.org 也是如此。

### 保存在你设备上的内容

学习进度（词语、复习、积分、课程）、设置、尚未发送的贡献、印章和可选的昵称保存在浏览器或应用的存储中（`localStorage` 和 IndexedDB，键名 `cp-*`）。
没有人会收到这些数据。可以在 ⚙️ → 数据与同步 中删除，或清除网站数据、卸载应用。

### 应用什么时候联网

应用可以完全离线使用。只有以下情况会联网，并且由你决定：

| 内容 | 时间 | 发送什么 | 发往哪里 |
|---|---|---|---|
| **检查更新**（仅限从网站或 GitHub 下载的安卓应用；Google Play 和 F-Droid 版本没有这个功能，由商店负责更新） | 每天最多一次；可在 ⚙️ 中关闭 | 一个不含个人数据的请求 | GitHub（`api.github.com`） |
| **在线语音** | 只有在 ⚙️ → 声音和音乐 → 语音 中打开后（默认关闭） | 要朗读的文字 | 谷歌的一个非官方语音合成服务 |
| **语音识别**（发音练习） | 只有点麦克风时 | 你说话的音频 | 在 Chrome 浏览器中由浏览器提供方（谷歌）处理；在安卓应用中由手机的识别器处理，可能离线 |
| **检查语音包**（⚙️ → 社区与声音 → “检查更新”） | 只有点按钮时，绝不会自动进行 | 向 `https://mandarinoapp.org/voci/index.json` 发出一个不带 Cookie、不带 Referer 的 `GET` 请求，取回一份公开的小清单（版本、日期、录音数量、大小、文件）。不会发送任何你的数据：这个请求对所有人都一样 | `mandarinoapp.org`（GitHub Pages：和访问网站一样，可能记录 IP 地址，见下文）。应用里只保留最近一次的结果（日期、数量、大小、检查时间），存在 `localStorage` 的 `md-voicepack` 键里，不进入备份。目前不下载任何内容 |
| **外部链接**（支持、GitHub、电子邮件） | 只有点击时 | 你打开的内容 | 你打开的网站 |
| **音乐和人名地名词典**（网页版） | 第一次播放某首曲子、第一次使用阅读器的“人名和术语”时 | 文件请求 | 应用所在的同一网站 |
| **应用更新**（网页版） | 打开应用且有网络时 | 新版本请求 | 应用所在的同一网站 |

### 在哪里下载应用（网站、Google Play、F-Droid）

应用是同一个，只是发布渠道不同。从网站或 GitHub 下载的版本（APK）会自己检查更新，见上文。通过 **Google Play** 或 **F-Droid** 分发时，这项检查是关闭的：更新由商店负责。商店有各自的隐私政策：Google Play 可能收集安装信息，以及（如果你在手机上同意了）崩溃信息；我只能在 Play 管理后台看到匿名的汇总数字，看不到任何关于你的数据。应用代码本身不会向商店发出任何请求。

### 网站 mandarinoapp.org

网站介绍应用，也提供网页版。它不使用 Cookie、统计、广告或第三方服务，也不会在你的浏览器里保存任何东西：字体、脚本和图片都来自网站本身。

- **“试一试”：** 三个小练习（声调、写汉字、词语）都在你的浏览器里运行。声调由你的设备当场生成。你做了什么、得了多少分，既不会保存，也不会发送。
- **设备语音：** 词语练习里的“听”按钮使用你的设备或浏览器里已有的中文语音。在某些浏览器（例如 Chrome）里，部分语音可能由浏览器提供方在线处理。
- **音乐：** 只有在你点击播放后，才会从网站本身下载曲子。
- **网站托管：** 网站由 GitHub Pages 托管。和所有托管服务一样，GitHub 可能依照其隐私政策记录访问的技术信息（例如 IP 地址）。我不会收到这些信息。
- **下载 APK：** 可从网站或 GitHub 下载，适用你所打开网站的规则。

### 相机、麦克风、通知

- **麦克风：** 只用于发音练习，并且只在练习时使用。声调示波器在设备上运行；录音不会保存或发送。
- **相机：** 只用于扫描二维码（换手机、印章）。图像不会保存。
- **通知（安卓）：** 只用于可选的提醒和后台音乐。
- **Pleco**（可选，默认关闭，仅限手机）：打开后点击“在 Pleco 中打开”，词语会传给你手机上的 Pleco 应用，不会发送到网络。

- **语言交流（可选，默认关闭）：** 只有在你打开 ⚙️ → 声音和音乐 → 语言交换并确认同意书之后，才会在你朗读应用里的句子时录下你的声音。录音在你自己发送之前只保存在手机上（一个 `.zip` 文件，你想怎么发都行：不会自动上传）。如果你发送，录音可能以 CC BY 4.0 许可发布在应用里；只有项目管理者会听到。可以随时在同一界面删除。仅限成年人。
- **安卓的其他权限：** 联网（表格里列出的请求）、振动、听音或录音时的音频管理、开机（仅用于恢复可选的提醒）、前台服务（仅用于后台音乐）。这些权限都不会读取你的通讯录、位置、信息或文件。

### 安卓自动备份

在安卓应用中，如果手机设置里打开了备份，安卓系统会把应用数据（学习进度）复制到你的 Google 账号备份中，并在换新手机时恢复。这是系统服务，不是 màndarínō 的服务：我什么也看不到。可以在手机设置中关闭（系统 → 备份）。

### 同步和备份

同步会写入一个由你选择、保存在你自己云端（Google Drive、OneDrive、Dropbox、iCloud 等）的文件，或者通过二维码在两部手机之间传输数据。我看不到文件，也看不到二维码。备份是你自己下载的文件。

### 贡献

更正或新词只有在你自己发送时才会发出，通过你选择的方式（分享、电子邮件、文件、GitHub）。内容只有你的建议，以及你填写的昵称（如有）。通过 GitHub 或电子邮件发送时，适用这些服务的规则，收件人会看到你的账号或邮箱。

### 分享卡片

分享卡片在**你的手机上**生成，只使用手机上的数据：等级、连续天数、单词、今日句子，以及你选择署名时填写的名字（默认关闭，只保存在这台手机上）。发送前你可以先看到图片；要不要分享由你决定。二维码指向应用的介绍页，不带任何参数或代码，应用也不会记录你是否分享、分享到哪里。

### 挑战和班级学习包

**挑战朋友**的代码里只有十个词和一个决定题目顺序的数字，没有名字，也没有分数。发给谁、怎么发，由你决定。用链接发送时，代码在“#”后面，不会传到任何服务器。**班级学习包**只有标题、一段课程、目标和日期。**给老师的学习小结**只有在你提出并勾选同意后才会生成，内容只有：完成了学习包里的多少词或课、是否达成目标、最近 30 天学习了几天、日期，以及你自己填写的名字（可不填）。不包含复习记录。应用不会自动发送：由你下载或分享。

### 捐助和印章

应用不知道谁捐助过。捐助通过 Ko-fi 进行，适用其隐私政策。我只能看到 Ko-fi 显示的信息（姓名、电子邮件、金额、留言），并且只用来给提出请求的人发送印章。应要求，我会从记录中删除这些数据。印章代码不含个人数据。

### 联系方式

`mandarinoapp@gmail.com` · Claudio Longhitano，màndarínō 的作者。
