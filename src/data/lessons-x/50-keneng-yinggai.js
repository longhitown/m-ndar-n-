/* Lezione 50 · Forse, deve, certamente: 可能, 应该, 一定. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "keneng-yinggai",
  "n": 50,
  "title": "Forse, deve, certamente: 可能, 应该, 一定",
  "goal": "Dire «forse», «dovrebbe», «sicuramente» e il «deve» di dovere.",
  "body": [
    "**可能** (kěnéng) = «forse, è possibile che», prima del verbo: 他可能不来 = forse non viene; 明天可能下雨 = domani forse piove. Si può anche mettere all'inizio: 可能他不来.",
    "**应该** (yīnggāi) = «dovrebbe» (consiglio o previsione): 你应该休息 = dovresti riposare; 他应该到了 = dovrebbe essere già arrivato.",
    "**一定** (yídìng) = «sicuramente, di sicuro»: 他一定来 = verrà di sicuro; 你一定要来 = devi assolutamente venire. Al negativo: 一定不 = sicuramente non.",
    "**要** vuol dire anche «dovere»: 我要走了 = devo andare; 你要小心 = devi fare attenzione. **得** (děi) è «dover fare» più forte: 我得走了 = devo proprio andare.",
    "Sono tutti **prima del verbo**: chi + 可能/应该/一定/要/得 + verbo."
  ],
  "pattern": ["chi", "可能 / 应该 / 一定 / 得", "verbo"],
  "ex": [
    ["他可能不来。", "Forse non viene."],
    ["明天可能下雨。", "Domani forse piove."],
    ["你应该休息。", "Dovresti riposare."],
    ["他应该到了。", "Dovrebbe essere già arrivato."],
    ["他一定来。", "Verrà di sicuro."],
    ["我得走了。", "Devo proprio andare."]
  ],
  "dlg": [
    ["A", "明天你来吗？", "Vieni domani?"],
    ["B", "我可能来，可能不来。", "Forse vengo, forse no."],
    ["A", "你应该来，我们一起学中文。", "Dovresti venire, studiamo cinese insieme."],
    ["B", "好，我一定来。", "Va bene, verrò di sicuro."]
  ],
  "traps": [
    ["他不来可能。", "他可能不来。", "可能 sta prima del verbo."],
    ["你休息应该。", "你应该休息。", "应该 sta prima del verbo."],
    ["他一定不是来。", "他一定不来。", "一定 + 不 + verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "他可能不来", "it": "Forse non viene."},
    {"k": "pick", "q": "Come dici «Dovresti riposare»?", "opts": ["你应该休息。", "你休息应该。", "应该你休息。"], "a": 0},
    {"k": "buco", "zh": "明天＿下雨。", "opts": ["可能", "吗", "着"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他一定来。", "opts": ["Verrà di sicuro.", "Forse viene.", "Non viene."], "a": 0},
    {"k": "buco", "zh": "我＿走了。", "opts": ["得", "吗", "着"], "a": 0}
  ]
});
