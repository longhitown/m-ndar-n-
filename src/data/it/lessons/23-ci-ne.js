/* Corso di italiano per chi parla cinese · lezione 23 · 小词 ci 和 ne.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "ci-ne",
  "n": 23,
  "title": "小词 ci 和 ne",
  "goal": "会说\"我去那儿\"、\"我要两个\"。",
  "body": [
    "**ci** 代替**地点**（\"那儿、这儿\"）：Vai a Roma? Sì, **ci** vado domani.（你去罗马吗？去，明天去那儿。）",
    "**c'è / ci sono** 就是\"有\"（某处存在）：**C'è un bar qui vicino?**（这儿附近有咖啡馆吗？）**Ci sono molti turisti.**（游客很多。）",
    "**ne** 代替**数量里的东西**（\"……中的\"）：Quante mele vuoi? **Ne** voglio due.（你要几个苹果？我要两个。）意大利语不能只说\"Voglio due\"，要加 ne。",
    "ne 也代替 **di + 某事**：Che **ne** pensi?（你觉得怎么样？——对这件事你怎么想？）",
    "ci 和 ne 跟别的代词一样，放在变位动词前面。"
  ],
  "pattern": ["ci = 那儿 · c'è / ci sono = 有", "ne = 其中的（数量）"],
  "ex": [
    ["C'è un bar qui vicino?", "这儿附近有咖啡馆吗？"],
    ["Ci vado domani.", "我明天去那儿。"],
    ["Quanti anni hai? Ne ho venti.", "你多大了？二十岁。"],
    ["Vuoi del pane? Sì, ne prendo un po'.", "要面包吗？要，我拿一点。"],
    ["Che ne pensi?", "你觉得怎么样？"]
  ],
  "traps": [
    ["Voglio due. (mele)", "Ne voglio due.", "说数量时要用 ne 代替东西。"],
    ["È un bar qui vicino?", "C'è un bar qui vicino?", "\"有\"（存在）用 c'è。"],
    ["Vado ci domani.", "Ci vado domani.", "ci 放在动词前面。"]
  ],
  "quiz": [
    {"k": "pick", "q": "附近有药店吗？", "opts": ["C'è una farmacia qui vicino?", "È una farmacia qui vicino?", "Ha una farmacia qui vicino?"], "a": 0},
    {"k": "pick", "q": "（苹果）我要三个", "opts": ["Voglio tre.", "Ne voglio tre.", "Ci voglio tre."], "a": 1},
    {"k": "pick", "q": "你去米兰吗？去，我明天去。", "opts": ["Sì, ci vado domani.", "Sì, ne vado domani.", "Sì, vado ci domani."], "a": 0},
    {"k": "pick", "q": "Che ne pensi? 是什么意思？", "opts": ["你觉得怎么样？", "你在想谁？", "你有几个？"], "a": 0},
    {"k": "order", "it": "ci sono molti turisti", "zh": "游客很多。"}
  ]
});
