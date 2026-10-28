/* Lezione 7 · Avere e «c'è»: 有. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "avere",
  "n": 7,
  "path": "casa",
  "title": "Avere e «c'è»: 有",
  "goal": "Dire che cosa hai e che cosa c'è in un posto.",
  "body": [
    "有 (yǒu) vuol dire «avere»: 我有一个哥哥 = ho un fratello maggiore.",
    "Vuol dire anche «c'è, ci sono»: **prima il luogo, poi 有**. 这里有一个超市 = qui c'è un supermercato.",
    "Il negativo è sempre 没有, mai 不有: 我没有时间 = non ho tempo; 这里没有超市 = qui non ci sono supermercati.",
    "Spesso il cinese non dice quanti: 我有朋友 = ho degli amici. Se vuoi contare serve il classificatore: 我有三个朋友."
  ],
  "pattern": ["chi / dove", "有 / 没有", "che cosa"],
  "ex": [
    ["我有一个哥哥。", "Ho un fratello maggiore."],
    ["她没有孩子。", "Lei non ha figli."],
    ["你有时间吗？", "Hai tempo?"],
    ["我们有很多朋友。", "Abbiamo molti amici."],
    ["这里有一个超市。", "Qui c'è un supermercato."],
    ["这里没有超市。", "Qui non ci sono supermercati."],
    ["我有一个姐姐。", "Ho una sorella maggiore."],
    ["这里没有咖啡。", "Qui non c'è caffè."]
  ],
  "dlg": [
    ["A", "你有哥哥吗？", "Hai un fratello maggiore?"],
    ["B", "有，我有一个哥哥。你有孩子吗？", "Sì, ho un fratello maggiore. Tu hai figli?"],
    ["A", "我没有孩子，我有很多朋友。", "Non ho figli, ho molti amici."]
  ],
  "traps": [
    ["我不有时间。", "我没有时间。", "有 si nega solo con 没."],
    ["有一个超市这里。", "这里有一个超市。", "Prima il luogo, poi 有."]
  ],
  "quiz": [
    {"k": "order", "zh": "我有一个哥哥", "it": "Ho un fratello maggiore."},
    {"k": "pick", "q": "Come si dice «Non ho tempo»?", "opts": ["我不有时间。", "我没有时间。", "我有没时间。"], "a": 1},
    {"k": "pick", "q": "Come si dice «Qui c'è un supermercato»?", "opts": ["这里有一个超市。", "这里是一个超市。", "有这里一个超市。"], "a": 0, "why": "«C'è» = 有. Con 是 diresti «questo posto è un supermercato»."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "她没有孩子。", "opts": ["Lei non ha figli.", "Lei non è una bambina.", "Lei non vuole figli."], "a": 0},
    {"k": "order", "zh": "你有时间吗", "it": "Hai tempo?"}
  ]
});
