/* Lezione 38 · A chi, con chi, verso chi: 给, 跟, 对. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "gei-gen-dui",
  "n": 38,
  "title": "A chi, con chi, verso chi: 给, 跟, 对",
  "goal": "Dire «per, a», «con» e «verso, nei confronti di» usando le preposizioni verbali.",
  "body": [
    "Molte preposizioni cinesi vengono da verbi e stanno **prima del verbo principale**: chi + preposizione + persona + verbo.",
    "**给** (gěi) = «a, per» (il destinatario): 我给你打电话 = ti telefono; 我给妈妈买了一本书 = ho comprato un libro per la mamma.",
    "**跟** (gēn) = «con» (insieme a qualcuno): 我跟朋友一起去 = vado con un amico; 我想跟你说话 = voglio parlare con te.",
    "**对** (duì) = «verso, riguardo a, a»: 他对我很好 = è molto gentile con me; 我对中文很有兴趣 = mi interessa molto il cinese.",
    "In italiano queste idee stanno **dopo il verbo** («telefono a te, vado con un amico»): in cinese passano davanti. 给 e 对 non sono intercambiabili: 给 = a chi va qualcosa, 对 = atteggiamento verso qualcuno."
  ],
  "pattern": ["chi", "给 / 跟 / 对", "persona", "verbo"],
  "ex": [
    ["我给你打电话。", "Ti telefono."],
    ["我给妈妈买了一本书。", "Ho comprato un libro per la mamma."],
    ["我跟朋友一起去。", "Vado con un amico."],
    ["我想跟你说话。", "Voglio parlare con te."],
    ["他对我很好。", "È molto gentile con me."],
    ["我对中文很有兴趣。", "Mi interessa molto il cinese."]
  ],
  "dlg": [
    ["A", "你今天晚上做什么？", "Che cosa fai stasera?"],
    ["B", "我想给妈妈打电话，然后跟朋友一起吃饭。", "Voglio telefonare alla mamma e poi mangiare con un amico."],
    ["A", "你的朋友对你很好。", "Il tuo amico è molto gentile con te."],
    ["B", "对，他对我很好。", "Sì, è molto gentile con me."]
  ],
  "traps": [
    ["我买一本书妈妈。", "我给妈妈买一本书。", "Il destinatario va introdotto da 给, prima del verbo."],
    ["我一起去跟朋友。", "我跟朋友一起去。", "跟 + persona sta prima del verbo."],
    ["他很好对我。", "他对我很好。", "对 + persona sta prima di aggettivo e verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "我给妈妈买了一本书", "it": "Ho comprato un libro per la mamma."},
    {"k": "pick", "q": "Come si dice «Vado con un amico»?", "opts": ["我跟朋友一起去。", "我一起去跟朋友。", "我给朋友一起去。"], "a": 0},
    {"k": "buco", "zh": "他＿我很好。", "opts": ["对", "给", "在"], "a": 0},
    {"k": "buco", "zh": "我＿你打电话。", "opts": ["给", "对", "和"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我对中文很有兴趣。", "opts": ["Mi interessa molto il cinese.", "Studio cinese con un amico.", "Parlo cinese con te."], "a": 0}
  ]
});
