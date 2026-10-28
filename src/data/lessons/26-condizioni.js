/* Lezione 26 · Se, basta che, solo se: 如果…就, 只要…就, 只有…才. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "condizioni",
  "n": 26,
  "path": "hsk3_agg_1",
  "title": "Se, basta che, solo se: 如果…就",
  "goal": "Fare ipotesi e porre condizioni.",
  "body": [
    "**如果… 就…** = se…, allora…: 如果明天下雨，我就不去了 = se domani piove, non vado. 就 va **dopo il soggetto** della seconda frase, prima del verbo.",
    "Nel parlato al posto di 如果 si usa spesso **要是**, oppure si chiude la condizione con **的话**: 下雨的话，我就不去了.",
    "**只要… 就…** = basta che…: 只要你努力，就能学好 = basta che ti impegni e lo impari bene. La condizione è **sufficiente**.",
    "**只有… 才…** = solo se…: 只有多练习，才能说得好 = solo esercitandoti tanto parlerai bene. La condizione è **necessaria**: senza, niente.",
    "Attenzione all'ordine: 我就不去, mai 就我不去."
  ],
  "pattern": ["如果 / 只要 / 只有", "…，", "chi", "就 / 才", "…"],
  "ex": [
    ["如果明天下雨，我就不去了。", "Se domani piove, non vado."],
    ["下雨的话，我们就在家。", "Se piove, restiamo a casa."],
    ["只要你努力，就能学好。", "Basta che ti impegni e lo imparerai bene."],
    ["只有多练习，才能说得好。", "Solo esercitandoti tanto parlerai bene."],
    ["如果你有时间，就来我家吧。", "Se hai tempo, vieni a casa mia."],
    ["如果你来，我就很高兴。", "Se vieni, sarò molto contento."],
    ["只要你来，我就高兴。", "Basta che tu venga e sono contento."]
  ],
  "dlg": [
    ["A", "如果明天下雨，你就不去吗？", "Se domani piove, non vai?"],
    ["B", "对，如果下雨，我就在家。", "Esatto, se piove resto a casa."],
    ["A", "如果你有时间，就来我家吧。", "Se hai tempo, vieni a casa mia."],
    ["B", "好，只要不下雨，我就来。", "Va bene, basta che non piova e vengo."]
  ],
  "traps": [
    ["如果明天下雨，就我不去了。", "如果明天下雨，我就不去了。", "就 va dopo il soggetto (我就)."],
    ["只有多练习，就能说得好。", "只有多练习，才能说得好。", "只有 va con 才; 只要 va con 就."]
  ],
  "quiz": [
    {"k": "pick", "q": "Come si dice «Se domani piove, non vado»?", "opts": ["如果明天下雨，我就不去了。", "如果明天下雨，就我不去了。", "明天下雨如果，我不去就。"], "a": 0},
    {"k": "pick", "q": "Quale parola completa? 只有多练习，___能说得好。", "opts": ["才", "就", "也"], "a": 0, "why": "只有 (solo se) va con 才."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "只要你努力，就能学好。", "opts": ["Basta che ti impegni e lo imparerai bene.", "Solo se ti impegni lo imparerai.", "Anche se ti impegni non lo imparerai."], "a": 0},
    {"k": "order", "zh": "下雨的话我们就在家", "it": "Se piove, restiamo a casa."},
    {"k": "order", "zh": "如果你有时间就来我家吧", "it": "Se hai tempo, vieni a casa mia."}
  ]
});
