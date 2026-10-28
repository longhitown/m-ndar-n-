/* Lezione 35 · con、senza、per：和、没有、为了. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "con-senza-per",
  "n": 35,
  "title": "con、senza、per：和、没有、为了",
  "goal": "会说\"和某人一起\"、\"不加糖\"、\"送给你\"、\"为了工作\"和\"用笔写\"。",
  "body": [
    "**con** 有两个主要意思：**和……一起**（Vado al cinema **con** Anna）和**用……**（Scrivo **con** la penna）。汉语分成\"和\"和\"用\"，意大利语是同一个词。",
    "**senza** = **没有、不带**：Bevo il caffè **senza** zucchero = 我喝不加糖的咖啡；Esco **senza** ombrello = 我没带伞出门。**senza** 后面直接加名词，**不加 di**，也一般**不加冠词**。",
    "**per** 有两个主要意思：**给**（Questo regalo è **per** te）和**为了**（Studio italiano **per** lavoro = 我学意大利语是为了工作）。",
    "**con** 遇到冠词时，现在一般不合成：con il、con la 更常见（口语里 col、colla 已经少用）。",
    "这三个词也可以直接加动词不定式：**per** + 动词 = 为了做……（Vado in Italia **per** studiare），**senza** + 动词 = 不……就（Esce **senza** salutare）。"
  ],
  "pattern": ["con + 人 / 工具", "senza + 名词", "per + 人 / 目的"],
  "ex": [
    ["Vado al cinema con Anna.", "我和安娜去看电影。"],
    ["Scrivo con la penna.", "我用笔写字。"],
    ["Bevo il caffè senza zucchero.", "我喝不加糖的咖啡。"],
    ["Esco senza ombrello.", "我没带伞出门。"],
    ["Questo regalo è per te.", "这个礼物是给你的。"],
    ["Studio italiano per lavoro.", "我学意大利语是为了工作。"]
  ],
  "dlg": [
    ["A", "Vuoi un caffè?", "你要咖啡吗？"],
    ["B", "Sì, senza zucchero, per favore.", "要，请不加糖。"],
    ["A", "Con latte?", "加牛奶吗？"],
    ["B", "No, grazie. È per te questo biscotto?", "不加，谢谢。这块饼干是给你的吗？"]
  ],
  "traps": [
    ["Vado al cinema a Anna.", "Vado al cinema con Anna.", "\"和某人一起\"用 con。"],
    ["Bevo il caffè senza di zucchero.", "Bevo il caffè senza zucchero.", "senza 后面直接加名词，不加 di。"],
    ["Questo regalo è a te.", "Questo regalo è per te.", "\"给某人\"的礼物用 per。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我和安娜去看电影", "opts": ["Vado al cinema con Anna.", "Vado al cinema a Anna.", "Vado al cinema senza Anna."], "a": 0},
    {"k": "pick", "q": "我喝不加糖的咖啡", "opts": ["Bevo il caffè senza zucchero.", "Bevo il caffè con senza zucchero.", "Bevo il caffè senza di zucchero."], "a": 0},
    {"k": "buco", "it": "Questo regalo è ___ te.", "opts": ["per", "con", "senza"], "a": 0},
    {"k": "pick", "q": "我用笔写字", "opts": ["Scrivo con la penna.", "Scrivo per la penna.", "Scrivo senza la penna."], "a": 0},
    {"k": "order", "it": "questo regalo è per te", "zh": "这个礼物是给你的。"}
  ]
});
