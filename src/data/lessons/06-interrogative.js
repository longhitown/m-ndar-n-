/* Lezione 6 · Che cosa, chi, dove: le parole interrogative. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "interrogative",
  "n": 6,
  "path": "domande",
  "title": "Che cosa, chi, dove: le parole interrogative",
  "goal": "Chiedere che cosa, chi, dove, quanti, perché e quando.",
  "body": [
    "什么 = che cosa · 谁 = chi · 哪里 = dove · 几 / 多少 = quanti · 为什么 = perché · 什么时候 = quando · 怎么 = come.",
    "La regola d'oro: **la parola interrogativa sta esattamente dove starebbe la risposta**. 你吃什么? — 我吃饺子. 你去哪里? — 我去北京.",
    "In italiano la parola interrogativa va all'inizio («Dove vai?»); in cinese no: non spostarla.",
    "Con queste parole **non** si usa 吗: la domanda c'è già.",
    "几 è per i numeri piccoli e vuole il classificatore (你有几个孩子?); 多少 per i numeri grandi e i prezzi (多少钱?)."
  ],
  "pattern": ["chi", "verbo", "什么 / 哪里 / 谁"],
  "ex": [
    ["你吃什么？", "Che cosa mangi?"],
    ["你去哪里？", "Dove vai?"],
    ["他是谁？", "Chi è lui?"],
    ["你有几个孩子？", "Quanti figli hai?"],
    ["你为什么学中文？", "Perché studi cinese?"],
    ["你什么时候去中国？", "Quando vai in Cina?"]
  ],
  "traps": [
    ["你去哪里吗？", "你去哪里？", "Con una parola interrogativa niente 吗."],
    ["哪里你去？", "你去哪里？", "La parola interrogativa resta dove sarebbe la risposta: dopo il verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "你去哪里", "it": "Dove vai?"},
    {"k": "pick", "q": "Come si dice «Che cosa mangi?»?", "opts": ["什么你吃？", "你吃什么？", "你吃什么吗？"], "a": 1, "why": "什么 sta dove starebbe la risposta, e niente 吗."},
    {"k": "pick", "q": "Una risposta giusta a 你去哪里?", "opts": ["我去北京。", "北京我去哪里。", "我去哪里北京。"], "a": 0, "why": "La risposta prende il posto di 哪里."},
    {"k": "pick", "q": "Come si dice «Quanti figli hai?»?", "opts": ["你有几孩子？", "你有几个孩子？", "你几个孩子有？"], "a": 1, "why": "几 vuole il classificatore: 几个."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他是谁？", "opts": ["Chi è lui?", "Lui chi conosce?", "Lui è qui?"], "a": 0},
    {"k": "order", "zh": "你为什么学中文", "it": "Perché studi cinese?"}
  ]
});
