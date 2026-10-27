/* màndarínō · «Novità» (⚙️ → Informazioni e supporto): l'elenco dei cambiamenti, dal più recente.
   Ogni voce: { v: versione, d: "AAAA-MM", it: [righe], zh: [righe] }. Righe brevi, scritte per chi studia, non per chi
   programma. Una versione nuova va in cima; tools/build.mjs controlla che ogni voce abbia le due lingue. */
var CHANGELOG = [
  { v: "6.7", d: "2026-10",
    it: [
      "Ripasso con esercizi vari (⚙️ → Avanzate → Stile di ripasso): Guidato «impara · esercitati · verifica», Misto, o Classico come prima.",
      "Frasi a buco, rimetti in ordine, scrivi il pinyin e il significato, abbina, traccia; la verifica di tappa con 12 domande.",
      "Lettura graduata: testi brevi per livello con domande (Frasi → Leggi → Testi).",
      "Voci reali: frasi lette da persone vere. Sul sito si scaricano una volta da ⚙️ → Voce (circa 7 MB); nell'app Android ci sono già.",
      "Benvenuto nuovo: scegli lo scopo e il ritmo, prova i toni, e un test di livello di pochi minuti ti fa partire dal punto giusto.",
      "L'interfaccia si apre un po' alla volta: le schede Parole e Frasi arrivano quando servono. In ⚙️ → Avanzate puoi mostrare tutto subito.",
      "Sostieni il progetto: una voce in ⚙️ e i sigilli di gratitudine, solo estetici.",
      "Licenze e crediti riordinati; i contenuti didattici sono sotto CC BY 4.0.",
      "Corso di italiano per chi parla cinese: 30 lezioni, 4780 parole, esercizi di frasi e un correttore di frasi italiane.",
      "Vocabolario HSK 3.0 livelli 1-5 in sei capitoli, frasi d'esempio per tutte le parole, ordine dei tratti offline.",
      "Sincronizzazione senza server (file nel tuo cloud o QR), app Android con widget e promemoria facoltativo.",
      "«Cerca ovunque», scorrimento tra le schede, immersione a schermo pieno, jukebox con 22 brani originali.",
      "Puoi proporre correzioni e parole nuove da ⚙️ → Dati e privacy → Contributi, e comparire nei Crediti se vuoi.",
      "Un giorno di riposo a settimana non spezza la serie; oltre i 10.000 punti ci sono nuovi gradi e le stagioni; i progressi della settimana sono in evidenza in Studia.",
      "Corso di italiano: la carta «今天» con la lezione da continuare e la frase del giorno, le lezioni come percorso, i traguardi e le carte da condividere.",
      "Per chi lo usa: esportazione per Anki, collegamento a Pleco, informativa sulla privacy in ⚙️.",
      "Di che cosa è fatto un carattere: le sue parti, quale dà il significato e quale il suono. Sfida un amico su dieci parole con un link o un QR; pacchetti classe per chi insegna.",
      "Ripasso più vario: rispondi scegliendo tra quattro risposte, ascolta, riconosci il tono. Se preferisci le carte di prima, ⚙️ → Avanzate → Stile di ripasso → Classico."
    ],
    zh: [
      "复习有了多种练习（⚙️ → 复习方式）：引导、混合，或和以前一样的经典方式。",
      "新练习：填空、排序、听写、动词形式、听句子。",
      "短文阅读：按级别的意大利语短文，附中文问题（在「句子」里）。",
      "真人录音：由真人朗读的句子。网页版在 ⚙️ → 语音 下载一次（约 7 MB）；安卓应用里已经有了。",
      "全新的欢迎流程：选择目标和节奏，试听声调，几分钟的水平测试帮你从合适的地方开始。",
      "界面逐步展开：需要时才出现“词语”和“句子”标签。在 ⚙️ → 高级 中可以立即显示全部。",
      "支持项目：⚙️ 里新增一项，以及仅作纪念的感谢印章。",
      "整理了许可协议和致谢；教学内容采用 CC BY 4.0。",
      "面向中文使用者的意大利语课程：30 课、4780 个词、句子练习和意大利语句子检查。",
      "HSK 3.0 一至五级词汇分为六章，每个词都有例句，离线笔顺。",
      "无需服务器的同步（你自己的云端文件或二维码），安卓应用带小组件和可选提醒。",
      "“全局搜索”、标签间滑动、全屏沉浸练习、22 首原创曲目的音乐盒。",
      "可以在 ⚙️ → 数据和隐私 → 贡献 中提出更正和新词，愿意的话还可以出现在致谢中。",
      "每周休息一天不会中断连续天数；一万分以上有新的等级和“季”；“学习”里突出显示本周进步。",
      "意大利语课程：“今天”卡片显示要继续的课和今日意大利语，课程变成一条路，还有纪念卡和分享卡片。",
      "需要的话：导出到 Anki、Pleco 链接、⚙️ 里的隐私说明。",
      "汉字的组成：由哪些部分构成，哪部分表意、哪部分表音。用链接或二维码和朋友比一比十个词；给老师用的班级学习包。",
      "复习更多样：从四个答案中选择、听音、辨认声调。喜欢以前的卡片的话：⚙️ → 高级 → 复习方式 → 经典。"
    ] },
  { v: "6.6", d: "2026-10",
    it: ["La versione di partenza: un solo file index.html con vocabolario, ripasso a intervalli e frasi."],
    zh: ["起始版本：单个网页文件，包含词汇、间隔复习和句子。"] }
];
