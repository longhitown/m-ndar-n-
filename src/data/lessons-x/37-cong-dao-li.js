/* Lezione 37 · Da…a… e la distanza: 从, 到, 离. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "cong-dao-li",
  "n": 37,
  "title": "Da…a… e la distanza: 从, 到, 离",
  "goal": "Dire da dove a dove si va, da quando a quando, e quanto è lontano un posto.",
  "body": [
    "**从** (cóng) = «da» (punto di partenza), **到** (dào) = «a, fino a» (punto di arrivo). Vanno **prima del verbo**: 我从家去学校 = vado da casa a scuola; 从八点到十点 = dalle otto alle dieci.",
    "Funzionano anche per il tempo: 我们从星期一到星期五学中文 = studiamo cinese dal lunedì al venerdì.",
    "**到** può anche essere il verbo «arrivare»: 我到北京了 = sono arrivato a Pechino.",
    "**离** (lí) = «distante da»: dice quanto sono lontani **due posti**, o **due momenti**. 学校离我家很近 = la scuola è vicina a casa mia; 这里离火车站很远 = da qui alla stazione è lontano.",
    "Attenzione: 从 è un **punto di partenza** (da dove parti), 离 una **distanza** (quanto sono lontane due cose). Non si scambiano."
  ],
  "pattern": ["chi", "从 + luogo", "到 + luogo", "verbo"],
  "ex": [
    ["我从家去学校。", "Vado da casa a scuola."],
    ["我们从星期一到星期五学中文。", "Studiamo cinese dal lunedì al venerdì."],
    ["从八点到十点。", "Dalle otto alle dieci."],
    ["学校离我家很近。", "La scuola è vicina a casa mia."],
    ["这里离火车站很远。", "Da qui alla stazione è lontano."],
    ["我到北京了。", "Sono arrivato a Pechino."]
  ],
  "dlg": [
    ["A", "你家离学校远吗？", "Casa tua è lontana dalla scuola?"],
    ["B", "不远，很近。", "Non è lontana, è vicina."],
    ["A", "你从家到学校要多长时间？", "Quanto tempo ci metti da casa a scuola?"],
    ["B", "我走着去，要二十分钟。", "Ci vado a piedi, ci vogliono venti minuti."]
  ],
  "traps": [
    ["我去学校从家。", "我从家去学校。", "从 + luogo sta prima del verbo."],
    ["学校从我家很近。", "学校离我家很近。", "Per la distanza si usa 离, non 从."],
    ["我们学中文从星期一到星期五。", "我们从星期一到星期五学中文。", "从…到… sta prima del verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "学校离我家很近", "it": "La scuola è vicina a casa mia."},
    {"k": "pick", "q": "Come si dice «Vado da casa a scuola»?", "opts": ["我从家去学校。", "我去学校从家。", "我离家去学校。"], "a": 0},
    {"k": "buco", "zh": "这里＿火车站很远。", "opts": ["离", "从", "在"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "从八点到十点。", "opts": ["Dalle otto alle dieci.", "Alle otto e alle dieci.", "Dopo le dieci."], "a": 0},
    {"k": "buco", "zh": "我们＿星期一到星期五学中文。", "opts": ["从", "离", "把"], "a": 0}
  ]
});
