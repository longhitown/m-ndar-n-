/* Lezione 2 · Il possesso: 的. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "possesso",
  "n": 2,
  "path": "famiglia",
  "title": "Il possesso: 的",
  "goal": "Dire di chi è una cosa e presentare la tua famiglia.",
  "body": [
    "的 (de) è il «di» del possesso, ma l'ordine è al contrario rispetto all'italiano: **prima chi possiede, poi la cosa**. 我的书 = il mio libro (alla lettera «io-di libro»).",
    "Funziona con tutti: 你的手机 = il tuo cellulare, 老师的书 = il libro dell'insegnante.",
    "Con i **parenti e le persone vicine** il 的 si può togliere: 我妈妈 = la mia mamma, 我朋友 = il mio amico. Con le cose no: «il mio libro» è sempre 我的书.",
    "In italiano davanti al possessivo c'è l'articolo, tranne che con molti parenti al singolare: «il mio libro», ma «mio fratello». In cinese non ci sono articoli: pensa solo all'ordine."
  ],
  "pattern": ["chi possiede", "的", "che cosa"],
  "ex": [
    ["这是我的书。", "Questo è il mio libro."],
    ["那是我的手机。", "Quello è il mio cellulare."],
    ["她是我妈妈。", "Lei è la mia mamma."],
    ["我的朋友是中国人。", "Il mio amico è cinese."],
    ["老师的书很贵。", "Il libro dell'insegnante è caro."],
    ["这是我爸爸的书。", "Questo è il libro del mio papà."],
    ["这是你的手机。", "Questo è il tuo cellulare."],
    ["她是我的朋友。", "Lei è la mia amica."]
  ],
  "dlg": [
    ["A", "这是我的书，那是你的书。", "Questo è il mio libro, quello è il tuo."],
    ["B", "对。这是我朋友的手机。", "Esatto. Questo è il cellulare del mio amico."],
    ["A", "你朋友是中国人。", "Il tuo amico è cinese."],
    ["B", "对，他是中国人。", "Sì, è cinese."]
  ],
  "traps": [
    ["书的我", "我的书", "Prima chi possiede, poi la cosa: «io 的 libro»."],
    ["这是我书。", "这是我的书。", "Senza 的 vanno solo parenti e amici (我妈妈, 我朋友); con le cose serve 的."]
  ],
  "quiz": [
    {"k": "order", "zh": "这是我的书", "it": "Questo è il mio libro."},
    {"k": "pick", "q": "Come si dice «il tuo cellulare»?", "opts": ["手机的你", "你的手机", "你手机的"], "a": 1, "why": "Chi possiede + 的 + la cosa."},
    {"k": "pick", "q": "Quali frasi vanno bene per «la mia mamma è insegnante»?", "opts": ["Solo 我妈妈是老师。", "Solo 我的妈妈是老师。", "Tutte e due"], "a": 2, "why": "Con i parenti il 的 si può mettere o togliere."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "老师的书很贵。", "opts": ["Il libro dell'insegnante è caro.", "L'insegnante ha un libro caro.", "L'insegnante compra un libro."], "a": 0},
    {"k": "order", "zh": "我的朋友是中国人", "it": "Il mio amico è cinese."},
    {"k": "pick", "q": "Quale frase è sbagliata?", "opts": ["这是我的书。", "这是我书。", "这是我的手机。"], "a": 1, "why": "Con le cose il 的 serve sempre."}
  ]
});
