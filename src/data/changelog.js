/* màndarínō · «Novità» (⚙️ → Informazioni): l'elenco dei cambiamenti, dal più recente, per far vedere come l'app è cresciuta.
   Ogni voce: { v: titolo (it), vz: titolo (zh), d: "AAAA-MM-GG", it: [righe], zh: [righe] }. Righe brevi (una frase), scritte per chi studia,
   non per chi programma; solo cose vere, ricavate dalla storia del progetto (git). Una versione nuova va in cima; tools/build.mjs controlla
   che ogni voce abbia le due lingue con lo stesso numero di righe; le prime righe della prima voce finiscono anche nelle note di
   rilascio degli store (tools/store-assets.mjs, 500 caratteri). */
var CHANGELOG = [
  { v: "Widget e microfono", vz: "小组件和麦克风", d: "2026-10-31",
    it: [
      "Su Android, il nuovo widget «Ripasso rapido» (4×4): cinque minuti di ripasso dalla schermata Home, una carta alla volta.",
      "Il microfono ora funziona anche sui telefoni dove prima falliva.",
      "Voce e brani più affidabili: corretti nove difetti dell'audio.",
      "Nuova pagina ⚙️ → Comunità e voci (scambio linguistico, pacchetto voci); i widget stanno in ⚙️ → Aspetto, con l'anteprima."
    ],
    zh: [
      "安卓上新增“快速复习”小组件（4×4）：在主屏幕上用五分钟，一张一张复习卡片。",
      "麦克风现在也能在以前出问题的手机上使用。",
      "语音和音乐更稳定：修复了九处音频问题。",
      "新页面 ⚙️ → 社区与声音（语言交换、语音包）；小组件在 ⚙️ → 外观，可先看预览。"
    ] },
  { v: "Scambio linguistico", vz: "语言交换", d: "2026-10-29",
    it: [
      "Scambio linguistico (facoltativo): registra con la tua voce frasi nella tua lingua madre, per aiutare chi studia. Tutto resta sul telefono finché non decidi tu. Serve avere 18 anni.",
      "Diagnosi del microfono su Android, con messaggi chiari al posto dei codici di errore.",
      "Il sito presenta l'app in italiano e in cinese."
    ],
    zh: [
      "语言交换（可选）：用你的母语录下句子，帮助学习的人。在你决定之前一切都只保存在手机上。需年满 18 岁。",
      "安卓上的麦克风诊断，出错时显示清楚的说明，不再显示错误代码。",
      "网站用意大利语和中文介绍这款应用。"
    ] },
  { v: "Lezioni e Taccuino", vz: "课程和旅行手账", d: "2026-10-28",
    it: [
      "Grammatica: 55 lezioni per il cinese e 51 per l'italiano, con mini-dialoghi, esempi con audio e un ripasso ogni cinque lezioni.",
      "Laboratorio dei radicali: unisci due componenti e scopri i caratteri che nascono.",
      "Taccuino del viaggiatore: una mappa da Roma a Guilin, una città per ogni tappa; c'è anche per chi studia italiano.",
      "Su Android i widget «Oggi» e «Pausa» in stile Giada, che cambiano con l'ora.",
      "Foglio di lavoro in PDF da stampare."
    ],
    zh: [
      "语法：中文 55 课、意大利语 51 课，带小对话、有声例句，每五课一次复习。",
      "部件实验室：把两个部件合在一起，看看会出现哪些汉字。",
      "旅行手账：一张从罗马到桂林的地图，每学完一站到一座城市；学意大利语的人也有。",
      "安卓上的“今天”和“休息”小组件换成翡翠风格，随时间变化。",
      "可打印的练习 PDF。"
    ] },
  { v: "Benvenuto e sblocchi", vz: "欢迎和逐步开放", d: "2026-10-27",
    it: [
      "Un test di livello di pochi minuti all'inizio, e l'app si apre un po' alla volta: Parole e Frasi arrivano quando servono.",
      "Tre stili di ripasso: Guidato, Misto e Classico, con esercizi vari e verifica di tappa.",
      "Lettura graduata: testi per livello, con le parole che conosci.",
      "Sfida a un amico e pacchetti classe, senza server.",
      "Pleco facoltativo, musica che continua con lo schermo spento, sostegno volontario con sigilli di gratitudine."
    ],
    zh: [
      "开始时有几分钟的水平测试，应用会一点一点打开：词语和句子在需要时出现。",
      "三种复习方式：引导、混合、经典，有多种练习和阶段测验。",
      "分级阅读：按等级分的文章，用你已经认识的词。",
      "和朋友比一比、班级学习包，都不需要服务器。",
      "可选的 Pleco，息屏后音乐继续播放，自愿支持和感谢印章。"
    ] },
  { v: "Due corsi in un'app", vz: "一个应用，两门课程", d: "2026-10-26",
    it: [
      "Nasce il corso di italiano per chi parla cinese: 4780 parole, esercizi di frasi e un correttore di frasi italiane.",
      "Tutto l'HSK 3.0, livelli 1–5: 6385 parole in sei capitoli, ognuna con una frase d'esempio.",
      "Immersione a schermo pieno per esercizi, lezioni e dialoghi recitati.",
      "Laboratorio di frasi con un traduttore prudente: dice «non so ancora» quando non è sicuro.",
      "Sincronizzazione senza server (un file nel tuo cloud o dei QR) e 22 brani originali per studiare."
    ],
    zh: [
      "给中国人的意大利语课程上线：4780 个词、句子练习和意大利语句子检查。",
      "完整的 HSK 3.0 一至五级：6385 个词，分六章，每个词都有例句。",
      "全屏沉浸模式，用于练习、课程和对话表演。",
      "造句实验室带一个谨慎的翻译器：不确定时会说“还不会”。",
      "无需服务器的同步（自己云端的文件或二维码），以及 22 首原创学习音乐。"
    ] },
  { v: "La base", vz: "基础版本", d: "2026-10-25",
    it: [
      "Ripasso a intervalli (FSRS-6), parole con pinyin, toni e sessioni a schermo pieno.",
      "Interfaccia in italiano o in 中文, tema Carta di riso e caratteri leggibili.",
      "Microfono per la pronuncia: registra e confronta."
    ],
    zh: [
      "间隔复习（FSRS-6），带拼音、声调的词语，以及全屏学习模式。",
      "界面可选意大利语或中文，宣纸主题，字体清晰易读。",
      "用于发音练习的麦克风：录音并对比。"
    ] }
];
