/* Lezione 11 · Volere e potere: 想, 要, 会, 能, 可以. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "modali",
  "n": 11,
  "path": "verbi1",
  "title": "Volere e potere: 想, 要, 会, 能, 可以",
  "goal": "Dire che cosa vuoi, che cosa sai fare e che cosa puoi fare.",
  "body": [
    "Questi verbi vanno **davanti all'altro verbo**, come in italiano: 我想喝茶 = vorrei bere un tè.",
    "想 = vorrei, ho voglia di (gentile). 要 = voglio (più deciso; al bar 我要… = prendo…).",
    "会 = so fare, l'ho imparato: 我会游泳 = so nuotare. Ma 会 dice anche che una cosa probabilmente succederà: 明天会下雨 = domani pioverà.",
    "能 = posso, riesco. 可以 = posso, è permesso: 我可以坐这里吗? = posso sedermi qui?",
    "Il negativo va prima di loro: 我不想去 = non voglio andare; 我不会开车 = non so guidare."
  ],
  "pattern": ["chi", "想 / 要 / 会 / 能 / 可以", "verbo"],
  "ex": [
    ["我想喝咖啡。", "Vorrei bere del caffè."],
    ["我要一杯茶。", "Voglio una tazza di tè."],
    ["我会说中文。", "So parlare cinese."],
    ["我不会开车。", "Non so guidare."],
    ["我可以坐这里吗？", "Posso sedermi qui?"],
    ["明天会下雨。", "Domani pioverà."]
  ],
  "traps": [
    ["我喝想茶。", "我想喝茶。", "Il verbo «volere / potere» va prima dell'altro verbo."]
  ],
  "quiz": [
    {"k": "pick", "q": "Come si dice «So nuotare» (l'ho imparato)?", "opts": ["我会游泳。", "我能游泳。", "我可以游泳。"], "a": 0, "why": "Un'abilità imparata: 会. 能 e 可以 dicono «posso»."},
    {"k": "pick", "q": "Come si dice «Posso sedermi qui?»?", "opts": ["我可以坐这里吗？", "我会坐这里吗？", "我坐可以这里吗？"], "a": 0, "why": "Chiedere il permesso: 可以."},
    {"k": "order", "zh": "我想喝咖啡", "it": "Vorrei bere del caffè."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "明天会下雨。", "opts": ["Domani pioverà.", "Domani so piovere.", "Domani può piovere?"], "a": 0, "why": "会 + verbo che non è un'abilità = futuro probabile."},
    {"k": "pick", "q": "Come si dice «Non voglio andare»?", "opts": ["我不想去。", "我想去不。", "不我想去。"], "a": 0, "why": "不 prima di 想."}
  ]
});
