/* Lezione 5 · Domande sì o no: 吗. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "domande",
  "n": 5,
  "path": "risposte",
  "title": "Domande sì o no: 吗",
  "goal": "Fare domande semplici e rispondere sì o no.",
  "body": [
    "Per una domanda a cui si risponde sì o no basta mettere 吗 (ma) **in fondo** alla frase. L'ordine delle parole non cambia: 你是中国人 → 你是中国人吗? = sei cinese?",
    "Un altro modo è ripetere il verbo con 不 in mezzo: 你是不是中国人? 你去不去? Con questa forma 吗 non si mette.",
    "Non c'è una parola per «sì»: si risponde ripetendo il verbo. 你去吗? — 去 (sì, vado) / 不去 (no). Con 是: 是 / 不是."
  ],
  "pattern": ["frase", "吗"],
  "ex": [
    ["你是中国人吗？", "Sei cinese?"],
    ["你饿吗？", "Hai fame?"],
    ["你会说中文吗？", "Sai parlare cinese?"],
    ["你有时间吗？", "Hai tempo?"],
    ["他是不是中国人？", "Lui è cinese?"],
    ["你明天来吗？", "Domani vieni?"]
  ],
  "traps": [
    ["你吗是中国人？", "你是中国人吗？", "吗 va sempre in fondo."],
    ["你是不是中国人吗？", "你是不是中国人？", "Con 是不是 la domanda c'è già: niente 吗."]
  ],
  "quiz": [
    {"k": "order", "zh": "你是中国人吗", "it": "Sei cinese?"},
    {"k": "pick", "q": "Dove va 吗?", "opts": ["All'inizio della frase", "Dopo il soggetto", "In fondo alla frase"], "a": 2},
    {"k": "pick", "q": "你去吗? Come rispondi «sì»?", "opts": ["是。", "去。", "吗。"], "a": 1, "why": "Si risponde ripetendo il verbo."},
    {"k": "pick", "q": "Come si dice «Hai fame?»?", "opts": ["你饿吗？", "你吗饿？", "吗你饿？"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "你是不是学生？", "opts": ["Sei studente?", "Non sei studente.", "Lui è studente."], "a": 0, "why": "是不是 = domanda sì o no."},
    {"k": "order", "zh": "你有时间吗", "it": "Hai tempo?"}
  ]
});
