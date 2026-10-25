/* Lezione 1 · Essere: 是.
   Formato di una lezione (un file per lezione, elencato in src/index.html):
   id, n (ordine), path (la tappa del Percorso dove compare), title, goal (che cosa saprai fare),
   body: paragrafi (**grassetto**; i caratteri cinesi si colorano da soli), pattern: lo schema della frase,
   ex: esempi [cinese, italiano], traps: errori tipici [sbagliata, giusta, perché],
   quiz: esercizi { k: "order", zh, it } = rimetti in ordine le tessere; { k: "pick", q, zh?, opts, a, why? } = scegli.
   Ogni frase cinese deve essere fatta di parole del vocabolario: la build lo controlla. */
LESSONS.push({
  "id": "essere",
  "n": 1,
  "path": "persone",
  "title": "Essere: 是",
  "goal": "Dire chi sei, di dove sei e che lavoro fai.",
  "body": [
    "是 (shì) è il verbo «essere» quando dici **chi** o **che cosa** è qualcuno o qualcosa: 我是学生 = sono studente.",
    "Non cambia mai: 我是, 你是, 他是, 我们是. Niente coniugazioni, niente maschile e femminile.",
    "La nazionalità si dice con **paese + 人** (persona): 意大利人 = italiano, 中国人 = cinese. Quindi 我是意大利人 = sono italiano (o italiana).",
    "Al negativo 不 va **prima** di 是: 我不是中国人 = non sono cinese.",
    "Attenzione: 是 **non** si usa davanti agli aggettivi. «Sono stanco» non è 我是累 ma 我很累: lo vedi nella lezione sugli aggettivi."
  ],
  "pattern": ["chi", "是", "chi / che cosa"],
  "ex": [
    ["我是意大利人。", "Sono italiano/a."],
    ["她是中国人。", "Lei è cinese."],
    ["我们是学生。", "Siamo studenti."],
    ["他是我朋友。", "Lui è un mio amico."],
    ["我不是老师。", "Non sono insegnante."],
    ["这是我的书。", "Questo è il mio libro."]
  ],
  "traps": [
    ["我是累。", "我很累。", "Con un aggettivo non si usa 是: ci vuole 很."],
    ["我是意大利。", "我是意大利人。", "意大利 è il paese, l'Italia. «Italiano» è 意大利人: la persona dell'Italia."],
    ["我是不中国人。", "我不是中国人。", "不 va prima di 是, non dopo."]
  ],
  "quiz": [
    {"k": "order", "zh": "我是意大利人", "it": "Sono italiano/a."},
    {"k": "pick", "q": "Come si dice «Lei è cinese»?", "opts": ["她是中国。", "她是中国人。", "她中国人是。"], "a": 1, "why": "Paese + 人 = la nazionalità; 是 sta in mezzo, come in italiano."},
    {"k": "pick", "q": "Come si dice «Sono stanco»?", "opts": ["我是累。", "我很累。", "我累是。"], "a": 1, "why": "Con gli aggettivi niente 是: si usa 很."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我不是老师。", "opts": ["Non sono insegnante.", "Sono un insegnante.", "Non ho un insegnante."], "a": 0},
    {"k": "order", "zh": "我们是朋友", "it": "Siamo amici."},
    {"k": "pick", "q": "Dove va 不 in «non sono cinese»?", "opts": ["我是不中国人。", "我不是中国人。", "不我是中国人。"], "a": 1, "why": "Il negativo sta subito prima del verbo: 不是."}
  ]
});
