/* Lezione 39 · Chiedere e far fare: 请 e 让. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "rang-qing",
  "n": 39,
  "title": "Chiedere e far fare: 请 e 让",
  "goal": "Chiedere gentilmente, invitare e dire «lasciami», «fammi» con 请 e 让.",
  "body": [
    "**请** (qǐng) = «per favore» e «invitare»: 请坐 = si accomodi; 请你帮我 = ti prego, aiutami; 我请你吃饭 = ti invito a mangiare (offro io).",
    "**让** (ràng) = «lasciare, far fare»: 让我想想 = lasciami pensare; 老师让我们回家 = l'insegnante ci ha fatto tornare a casa; 别让他走 = non lasciarlo andare.",
    "Tutti e due hanno la stessa forma: **chi + 请/让 + persona + verbo**. La persona è insieme **oggetto** del primo verbo e **soggetto** del secondo: 我请他来 = chiedo a lui di venire.",
    "Per dire «non» davanti: 不让 = non lasciare/non permettere (妈妈不让我去 = la mamma non mi lascia andare); 别让 = non far… (come ordine).",
    "Non esiste il «che» dell'italiano: «Ti chiedo di venire» è semplicemente 我请你来."
  ],
  "pattern": ["chi", "请 / 让", "persona", "verbo"],
  "ex": [
    ["请坐。", "Si accomodi."],
    ["我请你吃饭。", "Ti invito a mangiare."],
    ["请你帮我。", "Per favore, aiutami."],
    ["让我想想。", "Lasciami pensare."],
    ["老师让我们回家。", "L'insegnante ci ha fatto tornare a casa."],
    ["妈妈不让我去。", "La mamma non mi lascia andare."]
  ],
  "dlg": [
    ["A", "今天我请你吃饭。", "Oggi ti invito a mangiare."],
    ["B", "好啊！你想去哪里？", "Volentieri! Dove vuoi andare?"],
    ["A", "让我想想。我们去那家饭馆吧。", "Fammi pensare. Andiamo in quel ristorante."],
    ["B", "好，请你带路。", "Va bene, fai strada, per favore."]
  ],
  "traps": [
    ["我请来他。", "我请他来。", "La persona sta tra 请 e il secondo verbo."],
    ["妈妈让不我去。", "妈妈不让我去。", "不 sta prima di 让."],
    ["请我想想。", "让我想想。", "Per «lasciami pensare» si usa 让, non 请."]
  ],
  "quiz": [
    {"k": "order", "zh": "我请你吃饭", "it": "Ti invito a mangiare."},
    {"k": "pick", "q": "Come si dice «Lasciami pensare»?", "opts": ["让我想想。", "请我想想。", "我让想想。"], "a": 0},
    {"k": "buco", "zh": "妈妈不＿我去。", "opts": ["让", "请", "给"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "老师让我们回家。", "opts": ["L'insegnante ci ha fatto tornare a casa.", "Torniamo a casa dall'insegnante.", "L'insegnante torna a casa."], "a": 0},
    {"k": "buco", "zh": "我＿你吃饭。", "opts": ["请", "让", "在"], "a": 0}
  ]
});
