/* Lezione 52 · Dov'è e che cosa c'è: 在, 有, 是. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "you-zai-shi",
  "n": 52,
  "title": "Dov'è e che cosa c'è: 在, 有, 是",
  "goal": "Descrivere un luogo con i tre verbi dell'esistenza e scegliere quello giusto.",
  "body": [
    "Per dire **dove si trova** qualcosa si parte dalla cosa: **cosa + 在 + luogo**. 书在桌子上 = il libro è sul tavolo. La cosa è nota, si dice dov'è.",
    "Per dire **che cosa c'è** in un luogo si parte dal luogo: **luogo + 有 + cosa**. 桌子上有书 = sul tavolo c'è un libro. La cosa è nuova, spesso senza «il».",
    "Per dire **che cos'è** un luogo (identità): **luogo + 是 + cosa**. 那边是银行 = là c'è (là è) una banca. Spesso suggerisce che è **l'unica cosa** lì.",
    "In italiano si traduce sempre «c'è/ci sono», ma in cinese l'ordine cambia: 学校旁边有一个超市 = accanto alla scuola c'è un supermercato; 超市在学校旁边 = il supermercato è accanto alla scuola.",
    "Il negativo di 有 è 没有 (mai 不有): 这里没有超市. Il negativo di 在 e 是 è 不在, 不是."
  ],
  "pattern": ["cosa + 在 + luogo", "luogo + 有 / 是 + cosa"],
  "ex": [
    ["书在桌子上。", "Il libro è sul tavolo."],
    ["桌子上有一本书。", "Sul tavolo c'è un libro."],
    ["那边是银行。", "Là c'è una banca."],
    ["学校旁边有一个超市。", "Accanto alla scuola c'è un supermercato."],
    ["超市在学校旁边。", "Il supermercato è accanto alla scuola."],
    ["这里没有超市。", "Qui non c'è un supermercato."]
  ],
  "dlg": [
    ["A", "请问，这里有银行吗？", "Scusi, c'è una banca qui?"],
    ["B", "有，银行在学校旁边。", "Sì, la banca è accanto alla scuola."],
    ["A", "学校在哪里？", "Dov'è la scuola?"],
    ["B", "那边是学校。", "Là c'è la scuola."]
  ],
  "traps": [
    ["桌子上在书。", "书在桌子上。", "Con 在 prima la cosa, poi il luogo."],
    ["书有桌子上。", "桌子上有书。", "Con 有 prima il luogo, poi la cosa."],
    ["这里不有超市。", "这里没有超市。", "Il negativo di 有 è 没有."]
  ],
  "quiz": [
    {"k": "order", "zh": "书在桌子上", "it": "Il libro è sul tavolo."},
    {"k": "pick", "q": "Come dici «Sul tavolo c'è un libro»?", "opts": ["桌子上有一本书。", "桌子上在一本书。", "一本书有桌子上。"], "a": 0},
    {"k": "buco", "zh": "银行＿学校旁边。", "opts": ["在", "有", "没"], "a": 0},
    {"k": "buco", "zh": "这里＿超市。", "opts": ["没有", "不有", "没在"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "那边是银行。", "opts": ["Là c'è una banca.", "La banca è là.", "Là non c'è una banca."], "a": 0}
  ]
});
