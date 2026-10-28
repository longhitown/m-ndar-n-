/* Lezione 44 · Uguale e non così: 跟…一样, 没有. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "meiyou-yiyang",
  "n": 44,
  "title": "Uguale e non così: 跟…一样, 没有",
  "goal": "Dire che due cose sono uguali, quasi uguali o che una non arriva all'altra.",
  "body": [
    "**A 跟 B 一样** = «A è uguale a B»: 我的手机跟你的一样 = il mio cellulare è uguale al tuo. Per dire **in che cosa** si aggiunge l'aggettivo: 他跟我一样高 = è alto come me.",
    "Al negativo: 跟…不一样 = «è diverso da…»: 我的跟你的不一样 = il mio è diverso dal tuo.",
    "**A 没有 B + aggettivo** = «A non è (così) … come B»: 今天没有昨天热 = oggi non fa caldo come ieri. È il contrario di 比 (lezione 15): 昨天比今天热 = ieri faceva più caldo di oggi.",
    "Per «un po' più» o «molto più» si mette dopo l'aggettivo: 比他高一点 (un po' più alto), 比他高多了 (molto più alto).",
    "Attenzione: **non si usa 很** né con 比 né con 没有: 他比我高 (non 他比我很高), 今天没有昨天热 (non 今天没有昨天很热)."
  ],
  "pattern": ["A", "跟 B 一样 / 没有 B", "aggettivo"],
  "ex": [
    ["我的手机跟你的一样。", "Il mio cellulare è uguale al tuo."],
    ["他跟我一样高。", "È alto come me."],
    ["我的跟你的不一样。", "Il mio è diverso dal tuo."],
    ["今天没有昨天热。", "Oggi non fa caldo come ieri."],
    ["他比我高一点。", "È un po' più alto di me."],
    ["北京比上海大多了。", "Pechino è molto più grande di Shanghai."]
  ],
  "dlg": [
    ["A", "你的手机跟我的一样。", "Il tuo cellulare è uguale al mio."],
    ["B", "对，不过我的比你的新一点。", "Sì, ma il mio è un po' più nuovo."],
    ["A", "今天没有昨天热，我们出去吧。", "Oggi non fa caldo come ieri, usciamo."],
    ["B", "好啊。", "Volentieri."]
  ],
  "traps": [
    ["他跟我高一样。", "他跟我一样高。", "Prima 一样, poi l'aggettivo."],
    ["今天没有昨天很热。", "今天没有昨天热。", "Niente 很 davanti all'aggettivo."],
    ["他比我很高。", "他比我高。", "Con 比 non si mette 很."]
  ],
  "quiz": [
    {"k": "order", "zh": "他跟我一样高", "it": "È alto come me."},
    {"k": "pick", "q": "Come si dice «Oggi non fa caldo come ieri»?", "opts": ["今天没有昨天热。", "今天没有昨天很热。", "今天不昨天热。"], "a": 0},
    {"k": "buco", "zh": "我的手机＿你的一样。", "opts": ["跟", "对", "给"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他比我高一点。", "opts": ["È un po' più alto di me.", "È alto come me.", "È molto più alto di me."], "a": 0},
    {"k": "pick", "q": "Quale frase è sbagliata?", "opts": ["他比我很高。", "他比我高。", "他比我高多了。"], "a": 0}
  ]
});
