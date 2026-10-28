/* Lezione 54 · Come e perché: 怎么, 怎么样, 怎么了. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "zenme",
  "n": 54,
  "title": "Come e perché: 怎么, 怎么样, 怎么了",
  "goal": "Chiedere «come si fa», «com'è» e «che cosa è successo».",
  "body": [
    "**怎么 + verbo** chiede **il modo**: 你怎么去？ = come ci vai? 这个字怎么写？ = come si scrive questo carattere? 怎么办？ = che cosa si fa?",
    "**怎么样** (zěnmeyàng) = «com'è, come va?», a fine frase: 今天天气怎么样？ = com'è il tempo oggi? 你的中文怎么样？ = come va il tuo cinese?",
    "**怎么了？** = «che cosa è successo?»: 你怎么了？ = che cos'hai, che ti succede?",
    "**怎么** davanti a un verbo, con tono sorpreso, vuol dire anche **«come mai?»**: 你怎么不去？ = come mai non vai? Qui chiede il motivo.",
    "Non confondere con **为什么** (perché?), che chiede il motivo in modo diretto: 你为什么不去？ = perché non vai?"
  ],
  "pattern": ["怎么 + verbo", "…怎么样？", "怎么了？"],
  "ex": [
    ["你怎么去？", "Come ci vai?"],
    ["这个字怎么写？", "Come si scrive questo carattere?"],
    ["今天天气怎么样？", "Com'è il tempo oggi?"],
    ["你的中文怎么样？", "Come va il tuo cinese?"],
    ["你怎么了？", "Che cos'hai?"],
    ["你怎么不去？", "Come mai non vai?"]
  ],
  "dlg": [
    ["A", "你怎么了？", "Che cos'hai?"],
    ["B", "我有点累。今天天气怎么样？", "Sono un po' stanco. Com'è il tempo oggi?"],
    ["A", "天气很好。你怎么不出去？", "Il tempo è bello. Come mai non esci?"],
    ["B", "好，我们出去吧。", "Va bene, usciamo."]
  ],
  "traps": [
    ["你去怎么？", "你怎么去？", "怎么 sta prima del verbo."],
    ["今天天气怎么？", "今天天气怎么样？", "A fine frase serve 怎么样."],
    ["你怎么了吗？", "你怎么了？", "怎么了 è già una domanda: niente 吗."]
  ],
  "quiz": [
    {"k": "order", "zh": "这个字怎么写", "it": "Come si scrive questo carattere?"},
    {"k": "pick", "q": "Come chiedi «Com'è il tempo oggi?»", "opts": ["今天天气怎么样？", "今天天气怎么？", "怎么样今天天气？"], "a": 0},
    {"k": "buco", "zh": "你＿了？", "opts": ["怎么", "对", "在"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "你怎么不去？", "opts": ["Come mai non vai?", "Come ci vai?", "Non vai."], "a": 0},
    {"k": "pick", "q": "Che cosa chiede 怎么 davanti a un verbo?", "opts": ["Il modo (come)", "Il tempo (quando)", "Il luogo (dove)"], "a": 0}
  ]
});
