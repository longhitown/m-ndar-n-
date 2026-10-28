/* Lezione 46 · Scegliere: 去不去 e 还是. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "zhengfan-haishi",
  "n": 46,
  "title": "Scegliere: 去不去 e 还是",
  "goal": "Fare domande «x o non x?» e «A oppure B?».",
  "body": [
    "Oltre a 吗, c'è un altro modo per fare una domanda sì/no: **ripetere il verbo con 不 in mezzo**. 你去不去？ = vai o non vai? 你是不是中国人？ = sei cinese (o no)? Con questa forma **non si mette 吗**.",
    "Con 有 si usa 没: 你有没有时间？ = hai tempo (o no)?",
    "Per scegliere tra **due possibilità** si usa **还是** (háishi) = «oppure»: 你喝茶还是咖啡？ = bevi tè o caffè? 你今天去还是明天去？ = vai oggi o domani?",
    "还是 si usa **nelle domande**. Nelle frasi affermative «o» si dice **或者** (huòzhě): 茶或者咖啡都可以 = tè o caffè, va bene tutto e due.",
    "Non si usa 吗 con 还是: la domanda c'è già."
  ],
  "pattern": ["verbo + 不 + verbo", "A 还是 B"],
  "ex": [
    ["你去不去？", "Vai o non vai?"],
    ["你是不是中国人？", "Sei cinese?"],
    ["你有没有时间？", "Hai tempo?"],
    ["你喝茶还是咖啡？", "Bevi tè o caffè?"],
    ["你今天去还是明天去？", "Vai oggi o domani?"],
    ["茶或者咖啡都可以。", "Tè o caffè, va bene tutto e due."]
  ],
  "dlg": [
    ["A", "你喝茶还是咖啡？", "Bevi tè o caffè?"],
    ["B", "我喝茶。你呢？", "Io tè. E tu?"],
    ["A", "我喝咖啡。你今天去不去学校？", "Io caffè. Oggi vai a scuola o no?"],
    ["B", "我去。你去不去？", "Vado. E tu?"]
  ],
  "traps": [
    ["你去不去吗？", "你去不去？", "Con la forma «verbo + 不 + verbo» non si aggiunge 吗."],
    ["你喝茶或者咖啡？", "你喝茶还是咖啡？", "Nelle domande «o» è 还是, non 或者."],
    ["你有不有时间？", "你有没有时间？", "Con 有 si dice 有没有, mai 有不有."]
  ],
  "quiz": [
    {"k": "order", "zh": "你喝茶还是咖啡", "it": "Bevi tè o caffè?"},
    {"k": "pick", "q": "Come chiedi «Vai o non vai?»", "opts": ["你去不去？", "你去不去吗？", "你不去去？"], "a": 0},
    {"k": "buco", "zh": "你喝茶＿咖啡？", "opts": ["还是", "或者", "和"], "a": 0},
    {"k": "pick", "q": "Come chiedi «Hai tempo?» con la forma ripetuta?", "opts": ["你有没有时间？", "你有不有时间？", "你没有有时间？"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "茶或者咖啡都可以。", "opts": ["Tè o caffè, va bene tutto e due.", "Bevi tè o caffè?", "Non bevo né tè né caffè."], "a": 0}
  ]
});
