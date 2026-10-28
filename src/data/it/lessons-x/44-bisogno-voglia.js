/* Lezione 44 · 需要、想要、花时间：avere bisogno、avere voglia、volerci. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "bisogno-voglia",
  "n": 44,
  "title": "需要、想要、花时间：avere bisogno、avere voglia、volerci",
  "goal": "会说\"我需要\"、\"我想……\"、\"需要两个小时\"。",
  "body": [
    "意大利语用 **avere**（有）说很多汉语里用别的动词的意思：**Ho bisogno di** … = 我需要……；**Ho voglia di** … = 我想要……；**Ho fretta** = 我很急；**Ho ragione** = 我是对的。",
    "后面可以是名词或动词原形：Ho bisogno **di aiuto** = 我需要帮助；Ho voglia **di mangiare** = 我想吃东西；Non ho voglia **di uscire** = 我不想出门。",
    "**Mi serve** + 名词 也是\"我需要\"：**Mi serve** un'informazione（我需要一个信息）。东西是复数用 **mi servono**。",
    "**ci vuole / ci vogliono** = **需要（时间、东西）**：**Ci vuole** un'ora（需要一个小时）；**Ci vogliono** due ore（需要两个小时）。动词跟着时间或东西的数变化。",
    "**metterci** 说\"（某人）花多少时间\"：**Ci metto** un'ora（我花一个小时）；Quanto tempo **ci metti**?（你花多长时间？）"
  ],
  "pattern": ["avere bisogno / voglia + di", "ci vuole / ci vogliono + 时间"],
  "ex": [
    ["Ho bisogno di aiuto.", "我需要帮助。"],
    ["Ho voglia di mangiare.", "我想吃东西。"],
    ["Non ho voglia di uscire.", "我不想出门。"],
    ["Mi serve una penna.", "我需要一支笔。"],
    ["Ci vuole un'ora.", "需要一个小时。"],
    ["Ci vogliono due ore.", "需要两个小时。"]
  ],
  "dlg": [
    ["A", "Quanto tempo ci vuole per arrivare a Roma?", "到罗马需要多长时间？"],
    ["B", "In treno ci vogliono tre ore.", "坐火车需要三个小时。"],
    ["A", "Ho voglia di andare in treno.", "我想坐火车去。"],
    ["B", "Allora ti serve il biglietto.", "那你需要一张票。"]
  ],
  "traps": [
    ["Ho bisogno aiuto.", "Ho bisogno di aiuto.", "avere bisogno 后面要加 di。"],
    ["Ci vuole due ore.", "Ci vogliono due ore.", "两个小时是复数，动词要用 vogliono。"],
    ["Sono voglia di mangiare.", "Ho voglia di mangiare.", "这里用 avere，不用 essere。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我需要帮助", "opts": ["Ho bisogno di aiuto.", "Ho bisogno aiuto.", "Sono bisogno di aiuto."], "a": 0},
    {"k": "pick", "q": "需要两个小时", "opts": ["Ci vogliono due ore.", "Ci vuole due ore.", "Ci vogliamo due ore."], "a": 0},
    {"k": "buco", "it": "Ci ___ un'ora.", "opts": ["vuole", "vogliono", "voglio"], "a": 0},
    {"k": "pick", "q": "我不想出门", "opts": ["Non ho voglia di uscire.", "Non sono voglia di uscire.", "Non ho voglia uscire."], "a": 0},
    {"k": "order", "it": "ci vogliono due ore", "zh": "需要两个小时。"}
  ]
});
