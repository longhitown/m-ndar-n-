/* Lezione 19 · Verso chi parla o lontano: 来 e 去 dopo il verbo. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "direzione",
  "n": 19,
  "path": "hsk1_verbi",
  "title": "Di qua o di là: 进来, 出去, 回来",
  "goal": "Dire entra, esci, torna, sali e scendi, dal punto di vista giusto.",
  "body": [
    "Dopo un verbo di movimento il cinese aggiunge **来** se il movimento viene **verso chi parla**, **去** se va **lontano da chi parla**.",
    "进来 = entra (qui dove sono io); 进去 = entra (là). 出来 = esci (verso di me); 出去 = esci (via di qui). 回来 = torna qui; 回去 = torna là.",
    "Lo stesso con 上 e 下: 上来 = sali (dove sono io), 下去 = scendi (via da me). Se sei al piano di sopra e chiami un amico: 你上来吧!",
    "Il luogo va **prima di 来 / 去**: 他回家去了 = è tornato a casa; 请进房间来 = entra nella stanza.",
    "L'italiano non distingue: «entra!» va bene sempre. In cinese chi parla dalla stanza dice 进来, chi sta fuori e indica la porta dice 进去."
  ],
  "pattern": ["verbo", "luogo", "来 / 去"],
  "ex": [
    ["请进来。", "Entra, prego (qui da me)."],
    ["我们出去吧。", "Usciamo."],
    ["他回家去了。", "È tornato a casa."],
    ["你什么时候回来？", "Quando torni?"],
    ["你上来吧！", "Sali (qui da me)!"],
    ["老师进教室来了。", "L'insegnante è entrato in aula."]
  ],
  "traps": [
    ["他回去家了。", "他回家去了。", "Il luogo va tra il verbo e 去."],
    ["你什么时候回去？", "你什么时候回来？", "Se aspetti l'altro qui, è 回来 (verso di te)."]
  ],
  "quiz": [
    {"k": "pick", "q": "Sei in casa e qualcuno bussa. Che cosa dici?", "opts": ["请进来。", "请进去。", "请出来。"], "a": 0, "why": "Entra verso di te: 来."},
    {"k": "pick", "q": "Sei al piano di sopra e chiami un amico che è giù. Che cosa dici?", "opts": ["你上来吧！", "你上去吧！", "你下来吧！"], "a": 0},
    {"k": "order", "zh": "他回家去了", "it": "È tornato a casa."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我们出去吧。", "opts": ["Usciamo.", "Entriamo.", "Torniamo."], "a": 0},
    {"k": "order", "zh": "你什么时候回来", "it": "Quando torni?"}
  ]
});
