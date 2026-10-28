/* Lezione 33 · Presto o tardi: 就 e 才. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "jiu-cai",
  "n": 33,
  "title": "Presto o tardi: 就 e 才",
  "goal": "Dire che qualcosa succede «già» presto o «solo» tardi, e collegare azioni che si seguono.",
  "body": [
    "Davanti al verbo, 就 (jiù) e 才 (cái) dicono **che cosa pensi dell'ora o della quantità**.",
    "**就** = «già, subito»: è presto, è facile, è poco. 我七点就来了 = alle sette ero già qui; 他三岁就会说中文 = a tre anni parlava già cinese.",
    "**才** = «solo, appena»: è tardi, è difficile, è tanto. 我十点才来 = sono arrivato solo alle dieci; 他三十岁才会说中文 = ha imparato il cinese solo a trent'anni.",
    "Con le stesse parole la frase cambia sentimento: 他九点就到了 (è presto!) e 他九点才到 (è tardi!).",
    "**就** collega anche due azioni che si seguono subito: 我吃了饭就去 = appena ho mangiato, vado. Con le condizioni lo vedi nella lezione su 如果…就 e 只有…才."
  ],
  "pattern": ["chi", "tempo", "就 / 才", "verbo"],
  "ex": [
    ["我七点就来了。", "Alle sette ero già qui."],
    ["他九点才到。", "È arrivato solo alle nove."],
    ["他三岁就会说中文。", "A tre anni parlava già cinese."],
    ["我今天十点才起床。", "Oggi mi sono alzato solo alle dieci."],
    ["我吃了饭就去。", "Appena ho mangiato, vado."],
    ["他一个小时就做完了。", "Ha finito già in un'ora."]
  ],
  "dlg": [
    ["A", "你今天几点来的？", "A che ora sei venuto oggi?"],
    ["B", "我七点就来了。你呢？", "Io sono venuto già alle sette. E tu?"],
    ["A", "我九点才来。", "Io sono arrivato solo alle nove."],
    ["B", "你今天来得太晚了！", "Sei arrivato troppo tardi oggi!"]
  ],
  "traps": [
    ["我十点就来了，太晚了。", "我十点才来，太晚了。", "Per dire che è tardi si usa 才, non 就."],
    ["我七点才来了，太早了。", "我七点就来了，太早了。", "Per dire che è presto si usa 就."],
    ["我来七点就了。", "我七点就来了。", "就 sta prima del verbo, dopo il tempo."]
  ],
  "quiz": [
    {"k": "order", "zh": "我七点就来了", "it": "Alle sette ero già qui."},
    {"k": "pick", "q": "«Sono arrivato solo alle nove» (è tardi):", "opts": ["我九点才到。", "我九点就到。", "我才九点到。"], "a": 0},
    {"k": "buco", "zh": "他三岁＿会说中文。", "opts": ["就", "才", "再"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我今天十点才起床。", "opts": ["Oggi mi sono alzato solo alle dieci.", "Oggi mi sono già alzato alle dieci.", "Oggi mi alzo alle dieci."], "a": 0},
    {"k": "buco", "zh": "我吃了饭＿去。", "opts": ["就", "才", "又"], "a": 0}
  ]
});
