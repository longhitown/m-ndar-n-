/* Lezione 40 · Due verbi in fila: andare a fare. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "liandong",
  "n": 40,
  "title": "Due verbi in fila: andare a fare",
  "goal": "Mettere due azioni una dopo l'altra senza congiunzioni: «vado al negozio a comprare…».",
  "body": [
    "In cinese si possono mettere **due verbi uno dopo l'altro**, nell'ordine in cui accadono, senza «e», «per» o «a»: 我去商店买东西 = vado al negozio (e) compro delle cose.",
    "Il primo verbo dice **come o dove**, il secondo **che cosa fai**: 我坐飞机去北京 = vado a Pechino in aereo; 我用手机看书 = leggo con il telefono; 他来这里学中文 = viene qui a studiare cinese.",
    "L'**ordine è quello del tempo**: prima 去 (andare), poi 买 (comprare). Non si può invertire: 我买东西去商店 non vuol dire «vado a comprare».",
    "Per la **negazione** e per **了** si segue il verbo giusto: 我没去商店买东西 = non sono andato a fare spese; 我去商店买了一本书 = sono andato al negozio e ho comprato un libro.",
    "In italiano serve una preposizione («vado A comprare», «vengo PER studiare»): in cinese basta mettere i verbi in fila."
  ],
  "pattern": ["chi", "verbo 1", "(luogo)", "verbo 2", "che cosa"],
  "ex": [
    ["我去商店买东西。", "Vado al negozio a fare spese."],
    ["我坐飞机去北京。", "Vado a Pechino in aereo."],
    ["他来这里学中文。", "Viene qui a studiare cinese."],
    ["我用手机看书。", "Leggo con il telefono."],
    ["我去商店买了一本书。", "Sono andato al negozio e ho comprato un libro."],
    ["我没去商店买东西。", "Non sono andato a fare spese."]
  ],
  "dlg": [
    ["A", "你今天做什么？", "Che cosa fai oggi?"],
    ["B", "我去商店买东西。你呢？", "Vado al negozio a fare spese. E tu?"],
    ["A", "我去朋友家吃饭。", "Io vado a mangiare a casa di un amico."],
    ["B", "你怎么去？", "Come ci vai?"],
    ["A", "我坐地铁去。", "Ci vado in metropolitana."]
  ],
  "traps": [
    ["我买东西去商店。", "我去商店买东西。", "I verbi seguono l'ordine del tempo: prima 去, poi 买."],
    ["我去到商店为了买东西。", "我去商店买东西。", "Non servono preposizioni tra i due verbi."],
    ["我去北京坐飞机。", "我坐飞机去北京。", "Il mezzo (坐飞机) viene prima di 去."]
  ],
  "quiz": [
    {"k": "order", "zh": "我去商店买东西", "it": "Vado al negozio a fare spese."},
    {"k": "pick", "q": "Come si dice «Vado a Pechino in aereo»?", "opts": ["我坐飞机去北京。", "我去北京坐飞机。", "我飞机坐去北京。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他来这里学中文。", "opts": ["Viene qui a studiare cinese.", "Studia cinese e viene qui.", "Non viene qui."], "a": 0},
    {"k": "buco", "zh": "我＿手机看书。", "opts": ["用", "对", "请"], "a": 0},
    {"k": "pick", "q": "«Non sono andato a fare spese»:", "opts": ["我没去商店买东西。", "我去商店没买东西。", "我不去买东西商店。"], "a": 0}
  ]
});
