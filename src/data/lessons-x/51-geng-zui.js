/* Lezione 51 · Di più e il più: 更, 最, 比较, 特别. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "geng-zui",
  "n": 51,
  "title": "Di più e il più: 更, 最, 比较, 特别",
  "goal": "Dire «ancora più», «il più», «abbastanza» e «particolarmente» davanti a un aggettivo.",
  "body": [
    "Davanti a un aggettivo (o a certi verbi come 喜欢) si mettono avverbi di grado: **更** (gèng) = «ancora più», **最** (zuì) = «il più, più di tutti», **比较** (bǐjiào) = «abbastanza, piuttosto», **特别** (tèbié) = «particolarmente, davvero».",
    "**更**: 今天更热 = oggi fa ancora più caldo. Spesso con 比: 他比我更高 = è ancora più alto di me.",
    "**最**: 他最高 = è il più alto; 我最喜欢茶 = il tè è quello che mi piace di più. Il gruppo di confronto si mette prima: 我们班他最高 = nella nostra classe lui è il più alto.",
    "**比较** e **特别** sono più morbidi: 这本书比较贵 = questo libro è piuttosto caro; 今天特别冷 = oggi fa particolarmente freddo.",
    "Con questi avverbi **non si mette 很**: 他最高 (non 他很最高). E con 比 si può usare 更 o 还 ma non 很."
  ],
  "pattern": ["chi", "更 / 最 / 比较 / 特别", "aggettivo"],
  "ex": [
    ["今天更热。", "Oggi fa ancora più caldo."],
    ["他比我更高。", "È ancora più alto di me."],
    ["他最高。", "È il più alto."],
    ["我最喜欢茶。", "Il tè è quello che mi piace di più."],
    ["这本书比较贵。", "Questo libro è piuttosto caro."],
    ["今天特别冷。", "Oggi fa particolarmente freddo."]
  ],
  "dlg": [
    ["A", "你喜欢茶还是咖啡？", "Preferisci il tè o il caffè?"],
    ["B", "我最喜欢茶。你呢？", "Il tè è quello che preferisco. E tu?"],
    ["A", "我更喜欢咖啡。", "Io preferisco ancora di più il caffè."],
    ["B", "今天特别冷，我们喝茶吧。", "Oggi fa particolarmente freddo, beviamo tè."]
  ],
  "traps": [
    ["他很最高。", "他最高。", "最 non si usa insieme a 很."],
    ["他高最。", "他最高。", "最 sta prima dell'aggettivo."],
    ["今天更是热。", "今天更热。", "更 sta direttamente davanti all'aggettivo, senza 是."]
  ],
  "quiz": [
    {"k": "order", "zh": "他最高", "it": "È il più alto."},
    {"k": "pick", "q": "Come dici «Oggi fa ancora più caldo»?", "opts": ["今天更热。", "今天很更热。", "今天热更。"], "a": 0},
    {"k": "buco", "zh": "我＿喜欢茶。", "opts": ["最", "很最", "比"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "这本书比较贵。", "opts": ["Questo libro è piuttosto caro.", "Questo libro è il più caro.", "Questo libro non è caro."], "a": 0},
    {"k": "pick", "q": "Quale frase è sbagliata?", "opts": ["他很最高。", "他最高。", "他比我更高。"], "a": 0}
  ]
});
