/* Lezione 33 · 介词：位置. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "prep-luogo",
  "n": 33,
  "title": "介词：位置",
  "goal": "会说\"在……上面、下面、前面、旁边、中间、远、近\"，并避免常见的介词错误。",
  "body": [
    "说东西在哪里，用表示位置的词：**sopra**（上面）、**sotto**（下面）、**davanti a**（前面）、**dietro**（后面）、**accanto a**（旁边）、**vicino a**（附近）、**lontano da**（远离）、**tra / fra**（中间）、**dentro**（里面）、**fuori**（外面）。",
    "有些后面必须带介词：**vicino a** casa，**accanto a** me，**davanti a** una porta，**lontano da** Roma。不能说 vicino casa（口语里偶尔有，但标准意大利语要加 a）。",
    "**sopra、sotto、dentro、dietro** 可以直接加名词：Il libro è **sopra** il tavolo，Il gatto è **sotto** la sedia。**不要**加 di。",
    "**tra** 和 **fra** 意思一样，选哪个看好不好听：tra fratelli, fra tre giorni。",
    "汉语把位置词放在名词后面（桌子上、房子里），意大利语放在前面：il tavolo → **sul** tavolo / **sopra** il tavolo。"
  ],
  "pattern": ["essere + sopra / sotto + 名词", "vicino a / lontano da + 名词"],
  "ex": [
    ["Il libro è sopra il tavolo.", "书在桌子上面。"],
    ["Il gatto è sotto la sedia.", "猫在椅子下面。"],
    ["La banca è davanti alla stazione.", "银行在火车站前面。"],
    ["Il bar è vicino a casa.", "咖啡馆在我家附近。"],
    ["Abito lontano dal centro.", "我住得离市中心很远。"],
    ["La farmacia è tra la banca e il bar.", "药店在银行和咖啡馆中间。"]
  ],
  "dlg": [
    ["A", "Scusa, dov'è la farmacia?", "请问，药店在哪儿？"],
    ["B", "È davanti alla stazione.", "在火车站前面。"],
    ["A", "E la banca?", "那银行呢？"],
    ["B", "È vicino alla farmacia, accanto al bar.", "在药店附近，咖啡馆旁边。"]
  ],
  "traps": [
    ["Il bar è vicino la stazione.", "Il bar è vicino alla stazione.", "vicino 后面要加介词 a（a + la = alla）。"],
    ["Abito lontano casa.", "Abito lontano da casa.", "lontano 后面要加 da。"],
    ["Il libro è sopra del tavolo.", "Il libro è sopra il tavolo.", "sopra 后面直接加名词，不加 di。"]
  ],
  "quiz": [
    {"k": "pick", "q": "咖啡馆在我家附近", "opts": ["Il bar è vicino da casa.", "Il bar è vicino a casa.", "Il bar è vicino di casa."], "a": 1},
    {"k": "pick", "q": "猫在椅子下面", "opts": ["Il gatto è sotto la sedia.", "Il gatto è sopra la sedia.", "Il gatto è dietro di la sedia."], "a": 0},
    {"k": "buco", "it": "Abito ___ da Roma.", "opts": ["lontano", "lontana a", "vicino"], "a": 0},
    {"k": "pick", "q": "药店在银行和咖啡馆中间", "opts": ["La farmacia è tra la banca e il bar.", "La farmacia è su la banca e il bar.", "La farmacia è in la banca e il bar."], "a": 0},
    {"k": "order", "it": "il bar è vicino a casa", "zh": "咖啡馆在我家附近。"}
  ]
});
