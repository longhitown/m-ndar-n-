/* Corso di italiano per chi parla cinese · lezione 8 · 介词：a、in、di、da.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "preposizioni",
  "n": 8,
  "title": "介词：a、in、di、da",
  "goal": "会说去哪儿、在哪儿、从哪儿来、谁的东西。",
  "body": [
    "**城市**前用 **a**：vado **a** Roma，abito **a** Pechino。**国家**和大地区前用 **in**：vado **in** Italia，abito **in** Cina。",
    "回家、去学校：**a casa、a scuola**（不加冠词）。很多场所用 **in**：in banca、in ufficio、in farmacia。",
    "介词碰到定冠词要**合成一个词**：a + il = **al**（al ristorante），di + il = **del**，da + il = **dal**，in + il = **nel**，su + il = **sul**；a + la = **alla**，di + la = **della**，in + la = **nella**……",
    "**di** 表示\"的\"，但顺序和汉语相反：先说东西，再说是谁的。il libro **dell'**insegnante = 老师的书。",
    "**da** 表示\"从\"：Vengo **dalla** Cina = 我从中国来。"
  ],
  "pattern": ["a + 城市", "in + 国家", "a + il = al"],
  "ex": [
    ["Vado a Roma.", "我去罗马。"],
    ["Abito in Cina.", "我住在中国。"],
    ["Vado al ristorante.", "我去饭店。"],
    ["Sono a casa.", "我在家。"],
    ["Il libro dell'insegnante è caro.", "老师的书很贵。"],
    ["Vengo dalla Cina.", "我从中国来。"]
  ],
  "traps": [
    ["Vado in Roma.", "Vado a Roma.", "城市前用 a。"],
    ["Vado a il ristorante.", "Vado al ristorante.", "a + il 要合成 al。"],
    ["Abito a Cina.", "Abito in Cina.", "国家前用 in。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我去意大利", "opts": ["Vado a Italia.", "Vado in Italia.", "Vado al Italia."], "a": 1},
    {"k": "pick", "q": "a + il = ?", "opts": ["al", "ail", "a il"], "a": 0},
    {"k": "pick", "q": "in + la = ?", "opts": ["nella", "inla", "nela"], "a": 0},
    {"k": "pick", "q": "我去北京", "opts": ["Vado a Pechino.", "Vado in Pechino."], "a": 0, "why": "北京是城市：a。"},
    {"k": "order", "it": "vado al ristorante", "zh": "我去饭店。"}
  ]
});
