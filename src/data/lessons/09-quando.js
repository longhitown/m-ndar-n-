/* Lezione 9 · Quando: il tempo prima del verbo. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "quando",
  "n": 9,
  "path": "tempo",
  "title": "Quando: il tempo prima del verbo",
  "goal": "Dire quando fai le cose, con l'ordine giusto.",
  "body": [
    "In cinese il «quando» viene **prima del verbo**: chi + quando + verbo. 我明天去北京 = domani vado a Pechino.",
    "Il tempo può stare anche all'inizio, prima del soggetto: 明天我去北京. **Mai in fondo** come in italiano («vado a Pechino domani»).",
    "I verbi cinesi non cambiano con il tempo: è la parola di tempo (今天, 明天, 昨天) a dire quando. 我每天学中文 = studio cinese ogni giorno.",
    "Se le parole di tempo sono più d'una, si va dal grande al piccolo: 每天早上 = ogni giorno, la mattina → ogni mattina."
  ],
  "pattern": ["chi", "quando", "verbo", "che cosa"],
  "ex": [
    ["我明天去北京。", "Domani vado a Pechino."],
    ["我每天学中文。", "Ogni giorno studio cinese."],
    ["他周末去公园。", "Nel fine settimana lui va al parco."],
    ["我们晚上看电视。", "La sera guardiamo la televisione."],
    ["星期六我们去北京。", "Sabato andiamo a Pechino."],
    ["她每天早上跑。", "Ogni mattina lei corre."]
  ],
  "traps": [
    ["我去北京明天。", "我明天去北京。", "Il tempo va prima del verbo, non in fondo."],
    ["我学中文每天。", "我每天学中文。", "Anche «ogni giorno» va prima del verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "我明天去北京", "it": "Domani vado a Pechino."},
    {"k": "pick", "q": "Dove va 今天 in «oggi compro il pane»?", "opts": ["我买面包今天。", "我今天买面包。", "我买今天面包。"], "a": 1, "why": "Prima del verbo."},
    {"k": "order", "zh": "我们晚上看电视", "it": "La sera guardiamo la televisione."},
    {"k": "pick", "q": "Quale frase va bene?", "opts": ["明天我去北京。", "我去北京明天。"], "a": 0, "why": "Il tempo può andare all'inizio, ma non in fondo."},
    {"k": "pick", "q": "Come si dice al passato il verbo 去?", "opts": ["Non cambia: lo dicono la parola di tempo o 了.", "Diventa sempre 去过.", "Si aggiunge 是."], "a": 0}
  ]
});
