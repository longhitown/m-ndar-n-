/* Lezione 23 · Uno stato che dura: 着. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "zhe",
  "n": 23,
  "path": "hsk3_verbi_2",
  "title": "Uno stato che dura: 着",
  "goal": "Descrivere come stanno le cose: la porta aperta, qualcuno seduto, fare due cose insieme.",
  "body": [
    "着 (zhe) dopo un verbo dice che **lo stato continua**: 门开着 = la porta è aperta (ed è rimasta così); 他坐着 = sta seduto.",
    "Serve per **descrivere una scena**: 桌子上放着一本书 = sul tavolo c'è un libro (appoggiato). Il luogo va all'inizio, poi verbo + 着 + che cosa.",
    "**Verbo 1 + 着 + verbo 2** = fare la seconda cosa nel modo della prima: 他笑着说 = dice sorridendo; 我们走着去吧 = andiamo a piedi.",
    "Differenza con 正在: 正在 guarda l'azione **in corso** (他正在开门 = sta aprendo la porta); 着 guarda lo **stato** che ne risulta (门开着 = la porta è aperta).",
    "La negazione è 没: 门没开着 = la porta non è aperta."
  ],
  "pattern": ["chi / luogo", "verbo", "着"],
  "ex": [
    ["门开着。", "La porta è aperta."],
    ["他在那边坐着。", "È seduto là."],
    ["桌子上放着一本书。", "Sul tavolo c'è un libro."],
    ["他笑着说：「没关系。」", "Dice sorridendo: «Non fa niente.»"],
    ["我们走着去吧。", "Andiamo a piedi."],
    ["门没开着。", "La porta non è aperta."]
  ],
  "traps": [
    ["门开了着。", "门开着。", "着 e 了 non vanno insieme sullo stesso verbo."],
    ["门不开着。", "门没开着。", "La negazione di 着 è 没."]
  ],
  "quiz": [
    {"k": "order", "zh": "桌子上放着一本书", "it": "Sul tavolo c'è un libro."},
    {"k": "pick", "q": "Come si dice «La porta è aperta»?", "opts": ["门开着。", "门开了着。", "门正在开。"], "a": 0, "why": "È uno stato che dura: 着."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他笑着说。", "opts": ["Dice sorridendo.", "Ride e poi parla.", "Ha smesso di ridere."], "a": 0},
    {"k": "pick", "q": "Quale frase è giusta?", "opts": ["门没开着。", "门不开着。", "门开着没。"], "a": 0},
    {"k": "order", "zh": "我们走着去吧", "it": "Andiamo a piedi."}
  ]
});
