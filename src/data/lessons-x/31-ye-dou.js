/* Lezione 31 · Anche e tutti: 也 e 都. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "ye-dou",
  "n": 31,
  "title": "Anche e tutti: 也 e 都",
  "goal": "Dire «anche» e «tutti» e metterli al posto giusto, anche insieme e con la negazione.",
  "body": [
    "也 (yě) = «anche» e 都 (dōu) = «tutti, tutto» sono **avverbi**: stanno **dopo il soggetto e prima del verbo**. 我也是学生 = anch'io sono studente; 我们都是学生 = siamo tutti studenti.",
    "Non vanno mai in fondo alla frase, né davanti al soggetto: «anch'io» è 我也 (mai 也我), «siamo tutti» è 我们都 (mai 都我们).",
    "Se ci sono tutti e due, l'ordine è **也 + 都**: 我们也都是学生 = anche noi siamo tutti studenti.",
    "Con la negazione, **不 viene dopo 也 e 都**: 我也不去 = non vado nemmeno io; 我们都不去 = nessuno di noi va. Invece 不都 vuol dire «non tutti»: 我们不都去 = non andiamo tutti.",
    "都 riassume **quello che sta prima**: 你们都是学生 = voi siete tutti studenti. Con una cosa sola davanti non ha senso: 我都是学生 è strano."
  ],
  "pattern": ["chi", "也 / 都", "verbo"],
  "ex": [
    ["我也是学生。", "Anch'io sono studente."],
    ["他也喜欢茶。", "Anche a lui piace il tè."],
    ["我们都是学生。", "Siamo tutti studenti."],
    ["我们也都喜欢咖啡。", "Anche a tutti noi piace il caffè."],
    ["他们都不去。", "Nessuno di loro va."],
    ["我也不知道。", "Non lo so nemmeno io."]
  ],
  "dlg": [
    ["A", "我喝茶。你们喝什么？", "Io bevo tè. Voi che cosa bevete?"],
    ["B", "我们都喝咖啡。", "Noi beviamo tutti caffè."],
    ["A", "我朋友也喝咖啡。", "Anche il mio amico beve caffè."],
    ["B", "太好了，我们都喝咖啡。", "Bene, allora beviamo tutti caffè."]
  ],
  "traps": [
    ["我是也学生。", "我也是学生。", "也 sta prima del verbo, non dopo."],
    ["我们是都学生。", "我们都是学生。", "都 sta prima del verbo."],
    ["我不也去。", "我也不去。", "Con la negazione: 也 + 不."]
  ],
  "quiz": [
    {"k": "order", "zh": "我们也都是学生", "it": "Anche noi siamo tutti studenti."},
    {"k": "pick", "q": "Come si dice «Anch'io sono studente»?", "opts": ["我也是学生。", "我是也学生。", "也我是学生。"], "a": 0},
    {"k": "buco", "zh": "我们＿是学生。", "opts": ["都", "在", "吗"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他们都不去。", "opts": ["Nessuno di loro va.", "Non tutti vanno.", "Anche loro vanno."], "a": 0},
    {"k": "pick", "q": "«Non vado nemmeno io»:", "opts": ["我也不去。", "我不也去。", "我也去不。"], "a": 0},
    {"k": "order", "zh": "他们都不去", "it": "Nessuno di loro va."}
  ]
});
