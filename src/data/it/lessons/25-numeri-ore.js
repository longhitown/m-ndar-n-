/* Corso di italiano per chi parla cinese · lezione 25 · 数字、钟点和日期.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "numeri-ore",
  "n": 25,
  "title": "数字、钟点和日期",
  "goal": "会说价格、几点、哪天。",
  "body": [
    "数字：**uno, due, tre, quattro, cinque, sei, sette, otto, nove, dieci**；11–19：**undici, dodici, tredici, quattordici, quindici, sedici, diciassette, diciotto, diciannove**；**venti, trenta, quaranta, cinquanta, sessanta, settanta, ottanta, novanta, cento, mille**。",
    "组合时写成一个词：**ventitré**（23）、**trentotto**（38，元音省略）、**centocinquanta**（150）、**duemila**（2000）。",
    "**几点**：**Che ore sono?** → **Sono le tre.**（三点。）一点是单数：**È l'una.** 半：**e mezza**；一刻：**e un quarto**；差一刻：**meno un quarto**。\"在几点\"：**alle** otto（在八点）。",
    "**日期**：用基数词，只有一号用序数：**il primo maggio**（五月一日），**il 2 giugno**（六月二日）。顺序是 日-月-年，和汉语相反：**il 15 agosto 2026**。",
    "**价格**：Quanto costa? → **Costa dieci euro.** 欧元复数不变：un euro、due euro。"
  ],
  "pattern": ["Sono le tre · È l'una", "il 2 giugno · alle otto"],
  "ex": [
    ["Che ore sono? Sono le otto e mezza.", "几点了？八点半。"],
    ["Ci vediamo alle sette.", "我们七点见。"],
    ["Oggi è il dieci ottobre.", "今天是十月十号。"],
    ["Costa ventitré euro.", "二十三欧元。"],
    ["Sono nato nel duemila.", "我是两千年出生的。"],
    ["Sono le dieci.", "十点了。"],
    ["Il treno parte alle sei e un quarto.", "火车六点一刻开。"]
  ],
  "dlg": [
    ["A", "Che ore sono?", "几点了？"],
    ["B", "Sono le otto e mezza.", "八点半。"],
    ["A", "Ci vediamo alle nove?", "我们九点见？"],
    ["B", "Va bene. Oggi è il dieci ottobre, giusto?", "好。今天是十月十号，对吧？"]
  ],
  "traps": [
    ["Sono l'una.", "È l'una.", "一点用单数 è。"],
    ["Il secondo giugno.", "Il 2 giugno.", "除了每月一号用序数词 primo，其他日期都用基数词：il 2 giugno。"],
    ["Ventiotto.", "Ventotto.", "venti + otto 省略 i：ventotto。"]
  ],
  "quiz": [
    {"k": "pick", "q": "现在三点", "opts": ["È le tre.", "Sono le tre.", "Sono tre ore."], "a": 1},
    {"k": "pick", "q": "我们八点见", "opts": ["Ci vediamo alle otto.", "Ci vediamo a otto.", "Ci vediamo le otto."], "a": 0},
    {"k": "pick", "q": "五月一日", "opts": ["il uno maggio", "il primo maggio", "maggio primo"], "a": 1},
    {"k": "pick", "q": "38", "opts": ["trentaotto", "trentotto", "trenta otto"], "a": 1},
    {"k": "order", "it": "oggi è il dieci ottobre", "zh": "今天是十月十号。"}
  ]
});
