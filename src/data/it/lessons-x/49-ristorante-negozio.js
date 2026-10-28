/* Lezione 49 · 在饭馆和商店：常用说法. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "ristorante-negozio",
  "n": 49,
  "title": "在饭馆和商店：常用说法",
  "goal": "会点餐、买东西、问价钱，并礼貌地说\"请、谢谢、不客气\"。",
  "body": [
    "点餐和买东西，最常用的是 **Vorrei**（我想要，客气）：**Vorrei** un caffè, per favore = 请给我一杯咖啡。",
    "**Mi porta … ?**（您能给我拿……吗？）、**Posso avere … ?**（我可以要……吗？）、**C'è … ?**（有……吗？）、**Avete … ?**（你们有……吗？）都是常用的。",
    "问价格：**Quanto costa?**（多少钱？一件东西）、**Quanto costano?**（多少钱？几件东西）；结账：**Il conto, per favore.**（请结账）；付款：**Posso pagare con la carta?**（可以刷卡吗？）。",
    "礼貌用语：**per favore**（请）、**grazie**（谢谢）、**prego**（不客气、请）、**scusi**（打扰一下，对您）、**mi dispiace**（对不起、很抱歉）。",
    "说\"一杯咖啡、两杯咖啡\"时用 **un caffè / due caffè**（caffè 复数不变）；\"一份\"、\"一块\"用 **una porzione di / un pezzo di**。"
  ],
  "pattern": ["Vorrei + 名词, per favore", "Quanto costa / costano …?"],
  "ex": [
    ["Vorrei un caffè, per favore.", "请给我一杯咖啡。"],
    ["Avete un tavolo per due?", "你们有两个人的桌子吗？"],
    ["Quanto costa questo libro?", "这本书多少钱？"],
    ["Quanto costano queste scarpe?", "这双鞋多少钱？"],
    ["Il conto, per favore.", "请结账。"],
    ["Posso pagare con la carta?", "我可以刷卡吗？"]
  ],
  "dlg": [
    ["A", "Buonasera. Avete un tavolo per due?", "晚上好。你们有两个人的桌子吗？"],
    ["B", "Certo, si accomodi. Che cosa prendete?", "当然有，请坐。你们要点什么？"],
    ["A", "Vorrei una pizza e un'acqua, per favore.", "我想要一个披萨和一瓶水。"],
    ["B", "Ecco il menù. Prego.", "这是菜单。请。"]
  ],
  "traps": [
    ["Io volere un caffè.", "Vorrei un caffè, per favore.", "点餐用 vorrei（客气的说法），不要用动词原形 volere。"],
    ["Quanto costa queste scarpe?", "Quanto costano queste scarpe?", "scarpe 是复数，动词用 costano。"],
    ["Posso pagare per la carta?", "Posso pagare con la carta?", "用……付款说 con。"]
  ],
  "quiz": [
    {"k": "pick", "q": "请给我一杯咖啡", "opts": ["Vorrei un caffè, per favore.", "Voglio un caffè.", "Io caffè dare."], "a": 0},
    {"k": "pick", "q": "这双鞋多少钱？", "opts": ["Quanto costano queste scarpe?", "Quanto costa queste scarpe?", "Quanti costano queste scarpe?"], "a": 0},
    {"k": "buco", "it": "Il ___, per favore.", "opts": ["conto", "costo", "costa"], "a": 0},
    {"k": "pick", "q": "可以刷卡吗？", "opts": ["Posso pagare con la carta?", "Posso pagare per la carta?", "Posso pagare di carta?"], "a": 0},
    {"k": "order", "it": "vorrei un caffè per favore", "zh": "请给我一杯咖啡。"}
  ]
});
