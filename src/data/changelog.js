/* màndarínō · «Novità» (⚙️ → Informazioni e supporto): l'elenco dei cambiamenti, dal più recente.
   Ogni voce: { v: versione, d: "AAAA-MM", it: [righe], zh: [righe] }. Righe brevi, scritte per chi studia, non per chi
   programma. Una versione nuova va in cima; tools/build.mjs controlla che ogni voce abbia le due lingue. */
var CHANGELOG = [
  { v: "6.7", d: "2026-10",
    it: [
      "Benvenuto nuovo: scegli lo scopo e il ritmo, prova i toni, e un test di livello di pochi minuti ti fa partire dal punto giusto.",
      "L'interfaccia si apre un po' alla volta: le schede Parole e Frasi arrivano quando servono. In ⚙️ → Avanzate puoi mostrare tutto subito.",
      "Sostieni il progetto: una voce in ⚙️ e i sigilli di gratitudine, solo estetici.",
      "Licenze e crediti riordinati; i contenuti didattici sono sotto CC BY 4.0.",
      "Corso di italiano per chi parla cinese: 30 lezioni, 4780 parole, esercizi di frasi e un correttore di frasi italiane.",
      "Vocabolario HSK 3.0 livelli 1-5 in sei capitoli, frasi d'esempio per tutte le parole, ordine dei tratti offline.",
      "Sincronizzazione senza server (file nel tuo cloud o QR), app Android con widget e promemoria facoltativo.",
      "«Cerca ovunque», scorrimento tra le schede, immersione a schermo pieno, jukebox con 22 brani originali.",
      "Puoi proporre correzioni e parole nuove da ⚙️ → Dati e privacy → Contributi, e comparire nei Crediti se vuoi."
    ],
    zh: [
      "全新的欢迎流程：选择目标和节奏，试听声调，几分钟的水平测试帮你从合适的地方开始。",
      "界面逐步展开：需要时才出现“词语”和“句子”标签。在 ⚙️ → 高级 中可以立即显示全部。",
      "支持项目：⚙️ 里新增一项，以及仅作纪念的感谢印章。",
      "整理了许可协议和致谢；教学内容采用 CC BY 4.0。",
      "面向中文使用者的意大利语课程：30 课、4780 个词、句子练习和意大利语句子检查。",
      "HSK 3.0 一至五级词汇分为六章，每个词都有例句，离线笔顺。",
      "无需服务器的同步（你自己的云端文件或二维码），安卓应用带小组件和可选提醒。",
      "“全局搜索”、标签间滑动、全屏沉浸练习、22 首原创曲目的音乐盒。",
      "可以在 ⚙️ → 数据和隐私 → 贡献 中提出更正和新词，愿意的话还可以出现在致谢中。"
    ] },
  { v: "6.6", d: "2026-10",
    it: ["La versione di partenza: un solo file index.html con vocabolario, ripasso a intervalli e frasi."],
    zh: ["起始版本：单个网页文件，包含词汇、间隔复习和句子。"] }
];
