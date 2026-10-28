/* Lezione 41 · Appena… subito: 一…就. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "yi-jiu",
  "n": 41,
  "title": "Appena… subito: 一…就",
  "goal": "Dire che una cosa segue subito un'altra: «appena arrivo, ti chiamo».",
  "body": [
    "**一…就…** (yī… jiù…) = «appena… subito…». Il primo verbo ha **一**, il secondo ha **就**: 我一到家就给你打电话 = appena arrivo a casa ti telefono.",
    "Vale per il passato, il presente e il futuro: 他一看就懂了 = ha capito appena ha guardato; 我一下课就去吃饭 = appena finisce la lezione vado a mangiare.",
    "Quando i soggetti sono diversi, ognuno sta prima del suo verbo: 你一来，我就走 = appena arrivi, me ne vado.",
    "Non confondere **一…就** (due azioni che si seguono) con **只要…就** (condizione) e **如果…就** (ipotesi): qui non c'è nessuna ipotesi, solo la successione.",
    "Si mette il 就 prima del secondo verbo anche se ci sono altre parole: 我一到就马上给你打电话 (马上 = subito)."
  ],
  "pattern": ["chi", "一 + verbo", "，", "就 + verbo"],
  "ex": [
    ["我一到家就给你打电话。", "Appena arrivo a casa ti telefono."],
    ["他一看就懂了。", "Ha capito appena ha guardato."],
    ["我一下课就去吃饭。", "Appena finisce la lezione vado a mangiare."],
    ["你一来，我就走。", "Appena arrivi, me ne vado."],
    ["我一听就知道是他。", "L'ho riconosciuto appena l'ho sentito."],
    ["孩子一回家就看电视。", "Appena torna a casa, il bambino guarda la TV."]
  ],
  "dlg": [
    ["A", "你什么时候给我打电话？", "Quando mi telefoni?"],
    ["B", "我一到家就给你打电话。", "Appena arrivo a casa ti telefono."],
    ["A", "好。你一回家就休息吧。", "Va bene. Appena torni a casa, riposati."],
    ["B", "对，我一回家就休息。", "Sì, appena torno a casa mi riposo."]
  ],
  "traps": [
    ["我到家就给你打电话。", "我一到家就给你打电话。", "Manca 一 nella prima parte."],
    ["我一到家给你打电话。", "我一到家就给你打电话。", "Manca 就 prima del secondo verbo."],
    ["我就到家一给你打电话。", "我一到家就给你打电话。", "一 prima del primo verbo, 就 prima del secondo."]
  ],
  "quiz": [
    {"k": "order", "zh": "我一到家就给你打电话", "it": "Appena arrivo a casa ti telefono."},
    {"k": "pick", "q": "Come si dice «Ha capito appena ha guardato»?", "opts": ["他一看就懂了。", "他看一就懂了。", "他一看懂就了。"], "a": 0},
    {"k": "buco", "zh": "我一下课＿去吃饭。", "opts": ["就", "才", "再"], "a": 0},
    {"k": "buco", "zh": "你＿来，我就走。", "opts": ["一", "也", "还"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "孩子一回家就看电视。", "opts": ["Appena torna a casa, il bambino guarda la TV.", "Il bambino guarda la TV a casa.", "Il bambino non guarda la TV."], "a": 0}
  ]
});
