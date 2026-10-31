/* màndarínō · «Novità» (⚙️ → Informazioni): l'elenco dei cambiamenti, dal più recente.
   Ogni voce: { v: versione, d: "AAAA-MM", it: [righe], zh: [righe] }. Righe brevi (una frase), scritte per chi studia, non per chi
   programma; le novità della versione in corso in cima, il resto riassunto per temi in una voce sola. Una versione nuova va in cima;
   tools/build.mjs controlla che ogni voce abbia le due lingue con lo stesso numero di righe; le prime righe finiscono anche nelle
   note di rilascio degli store (tools/store-assets.mjs, 500 caratteri). */
var CHANGELOG = [
  { v: "6.7", d: "2026-10",
    it: [
      "Scambio linguistico (facoltativo): registra con la tua voce frasi nella tua lingua madre, per aiutare chi studia. Frasi e parole a caso, tutto sul telefono finché non decidi tu: un solo tasto prepara il file e apre l'e-mail. Prima c'è un foglio del consenso e serve avere 18 anni.",
      "Corso di italiano: anche il tuo Taccuino del viaggiatore, da Guilin a Roma. Ogni lezione superata ti porta più vicino alla prossima città.",
      "Grammatica più ricca: 55 lezioni per il cinese e 51 per l'italiano, con mini-dialoghi, esempi con audio e un ripasso ogni cinque lezioni.",
      "Apertura animata: i quattro toni volano sulle lettere e sulle foglie del logo.",
      "Microfono e voce più affidabili su Android, e messaggi chiari al posto dei codici di errore.",
      "La card di oggi del cinese ha formato, colore e firma, come quella di italiano.",
      "Cambiare la lingua dei menu non ripete l'animazione e riapre la stessa pagina delle impostazioni.",
      "Più ordine: niente menu «Copia» di Android sul tocco lungo, Stampa funzionante nell'app, mappa del Taccuino visibile intera.",
      "Su Android: widget «Oggi» e «Pausa» in stile Giada, che cambiano con l'ora (mattina, pomeriggio, sera, notte).",
      "Su Android i widget sono quattro: il nuovo «Ripasso rapido» mostra quante carte sono da ripassare e un tocco apre il ripasso. Si aggiungono da ⚙️ → Comunità e voci, solo se lo vuoi.",
      "Il microfono ora funziona anche su telefoni dove prima falliva.",
      "Nuova pagina ⚙️ → Comunità e voci: lo Scambio linguistico, quante frasi hai registrato (numeri che restano sul telefono), un messaggio da copiare per consigliare l'app a un amico e il controllo manuale del pacchetto voci."
    ],
    zh: [
      "语言交换（可选）：用你的母语录下句子，帮助学习的人。随机句子和词语，在你决定之前一切都只保存在手机上：一个按钮就会准备好文件并打开电子邮件。录音前有同意书，需年满 18 岁。",
      "意大利语课程也有旅行手账了：从桂林到罗马，每通过一课，就离下一座城市更近。",
      "语法更丰富：中文 55 课、意大利语 51 课，带小对话、有声例句，每五课一次复习。",
      "启动动画：四个声调飞到标志的字母和两片叶子上。",
      "安卓上的麦克风和语音更稳定，出错时显示清楚的说明，不再显示错误代码。",
      "中文课程的今日卡片也能选择比例、颜色和署名，与意大利语课程一致。",
      "切换菜单语言不再重复动画，并回到刚才的设置页面。",
      "更整洁：长按不再弹出安卓的“复制”菜单，应用内可以打印，旅行手账的地图完整可见。",
      "安卓桌面小组件：“今天”和“休息”换成翡翠风格，随时间（早晨、下午、傍晚、夜晚）变化。",
      "安卓上的小组件增加到四个：新的“快速复习”显示有多少卡片要复习，点一下就打开复习。你愿意的话，可在 ⚙️ → 社区与声音 中添加。",
      "麦克风现在也能在以前出问题的手机上使用。",
      "新页面 ⚙️ → 社区与声音：语言交换、你录了多少句子（数字只留在手机上）、可复制的推荐消息，以及手动检查语音包。"
    ] },
  { v: "6.0–6.6", d: "2026-10",
    it: [
      "Due corsi in un'app: il cinese per italiani (6385 parole, HSK 1–5) e l'italiano per chi parla cinese (4780 parole).",
      "Ripasso a intervalli (FSRS-6) in tre stili, Guidato, Misto e Classico, con esercizi vari e verifica di tappa.",
      "Voci reali, 22 brani originali, orecchio ai toni, pronuncia con il microfono e modalità guida a mani libere.",
      "Laboratorio di frasi, radicali, ordine dei tratti, lettura graduata e 32 dialoghi.",
      "Sincronizzazione senza server (cloud tuo o QR), backup, esportazione per Anki e foglio di lavoro in PDF.",
      "Gradi, serie con giorno di riposo, sfida a un amico, pacchetto classe e carte da condividere.",
      "Taccuino del viaggiatore: una mappa da Roma a Guilin, una città per ogni tappa del Percorso.",
      "Sostieni il progetto e sigilli di gratitudine, solo estetici: tutto resta gratis."
    ],
    zh: [
      "一个应用，两门课程：给意大利人的中文（6385 个词，HSK 1–5）和给中国人的意大利语（4780 个词）。",
      "间隔复习（FSRS-6），三种方式：引导、混合、经典；有多种练习和阶段测验。",
      "真人录音、22 首原创音乐、声调听力、麦克风发音练习和免手持导览模式。",
      "造句实验室、部件、笔顺、分级阅读和 32 个对话。",
      "无需服务器的同步（自己的云端或二维码）、备份、导出到 Anki、可打印的练习 PDF。",
      "等级、可休息一天的连续天数、和朋友比一比、班级学习包和分享卡片。",
      "旅行手账：一张从罗马到桂林的地图，每学完一站到一座城市。",
      "支持项目和仅作纪念的感谢印章：一切依然免费。"
    ] }
];
