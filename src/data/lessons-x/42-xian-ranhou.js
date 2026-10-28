/* Lezione 42 · Prima, poi, dopo: 先, 然后, 以前, 以后. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "xian-ranhou",
  "n": 42,
  "title": "Prima, poi, dopo: 先, 然后, 以前, 以后",
  "goal": "Raccontare una sequenza e collocare un fatto «prima» o «dopo» un altro.",
  "body": [
    "**先… 然后…** = «prima… poi…»: 我先吃饭，然后看电视 = prima mangio, poi guardo la TV. **先** va davanti al primo verbo, **然后** apre la seconda azione. Per una terza: 最后 = «alla fine».",
    "**再** può sostituire 然后 in una sequenza che deve ancora avvenire: 你先想一想，再说 = pensaci un po', poi parla.",
    "**以前** (yǐqián) = «prima, in passato» e **以后** (yǐhòu) = «dopo, in futuro». Da soli: 以前我不会说中文 = prima non sapevo parlare cinese; 以后我常来 = in futuro verrò spesso.",
    "Dopo un verbo o una frase indicano il **momento**: 吃饭以后 = dopo mangiato; 下课以前 = prima che finisca la lezione; 到北京以后 = dopo essere arrivato a Pechino. Il momento sta **prima** del verbo principale: 吃饭以后我去学校.",
    "Nel racconto, in italiano ci sono molte congiunzioni; in cinese basta l'ordine dei fatti."
  ],
  "pattern": ["先", "verbo 1", "，", "然后", "verbo 2"],
  "ex": [
    ["我先吃饭，然后看电视。", "Prima mangio, poi guardo la TV."],
    ["你先想一想，再说。", "Pensaci un po', poi parla."],
    ["以前我不会说中文。", "Prima non sapevo parlare cinese."],
    ["以后我常来。", "In futuro verrò spesso."],
    ["吃饭以后我去学校。", "Dopo mangiato vado a scuola."],
    ["下课以前别走。", "Non andare via prima della fine della lezione."]
  ],
  "dlg": [
    ["A", "你今天晚上做什么？", "Che cosa fai stasera?"],
    ["B", "我先做饭，然后看电视。", "Prima cucino, poi guardo la TV."],
    ["A", "吃饭以后你学中文吗？", "Dopo mangiato studi cinese?"],
    ["B", "对，我先休息一会儿，再学。", "Sì, prima mi riposo un po', poi studio."]
  ],
  "traps": [
    ["我吃饭先，然后看电视。", "我先吃饭，然后看电视。", "先 sta davanti al verbo."],
    ["吃饭我去学校以后。", "吃饭以后我去学校。", "以后 sta subito dopo l'azione a cui si riferisce."],
    ["我然后吃饭先看电视。", "我先吃饭，然后看电视。", "先 apre la sequenza, 然后 la seconda azione."]
  ],
  "quiz": [
    {"k": "order", "zh": "我先吃饭然后看电视", "it": "Prima mangio, poi guardo la TV."},
    {"k": "pick", "q": "Come si dice «Dopo mangiato vado a scuola»?", "opts": ["吃饭以后我去学校。", "我去学校吃饭以后。", "我以后吃饭去学校。"], "a": 0},
    {"k": "buco", "zh": "我＿吃饭，然后看电视。", "opts": ["先", "又", "也"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "以前我不会说中文。", "opts": ["Prima non sapevo parlare cinese.", "In futuro non parlerò cinese.", "Non parlo cinese."], "a": 0},
    {"k": "buco", "zh": "下课＿别走。", "opts": ["以前", "以后", "然后"], "a": 0}
  ]
});
