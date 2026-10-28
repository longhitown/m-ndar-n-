/* Lezione 25 · Perché e anche se: 因为…所以, 虽然…但是. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "connettivi",
  "n": 25,
  "path": "hsk2_gram_2",
  "title": "Perché e anche se: 因为…所以, 虽然…但是",
  "goal": "Collegare due frasi: la causa e la conseguenza, il contrasto.",
  "body": [
    "Il cinese ama le **coppie di parole**: una apre la prima frase, l'altra apre la seconda. **因为… 所以…** = perché…, quindi…: 因为下雨，所以我没去 = siccome pioveva, non sono andato.",
    "**虽然… 但是…** = anche se…, però…: 虽然很贵，但是很好吃 = è caro, però è buonissimo. In italiano «anche se… però» suona doppio; in cinese è normale, anzi il 但是 è quasi obbligatorio.",
    "Si può tenere solo una delle due: 因为我很累，我想休息 oppure 我很累，所以想休息. Con 虽然 il secondo pezzo (但是 o 可是) resta quasi sempre.",
    "L'ordine è: **prima la causa, poi l'effetto**; prima la concessione, poi il «però». La forma italiana «non sono andato perché pioveva» in cinese si gira."
  ],
  "pattern": ["因为 / 虽然", "…，", "所以 / 但是", "…"],
  "ex": [
    ["因为下雨，所以我没去。", "Siccome pioveva, non sono andato."],
    ["虽然很贵，但是很好吃。", "È caro, però è buonissimo."],
    ["因为我很累，所以想休息。", "Siccome sono stanco, voglio riposare."],
    ["虽然他很忙，但是每天学中文。", "Anche se è molto impegnato, studia cinese ogni giorno."],
    ["我今天不去，因为我有事。", "Oggi non vado, perché ho un impegno."],
    ["因为很贵，所以我不买。", "Siccome è caro, non lo compro."],
    ["虽然很累，但是我很高兴。", "Anche se sono stanco, sono contento."]
  ],
  "dlg": [
    ["A", "虽然下雨，但是我想去公园。", "Anche se piove, voglio andare al parco."],
    ["B", "因为我很累，所以不想去。", "Siccome sono stanco, non ho voglia di andare."],
    ["A", "那我们明天去吧。", "Allora andiamoci domani."],
    ["B", "好，明天我不累。", "Va bene, domani non sono stanco."]
  ],
  "traps": [
    ["虽然很贵，所以很好吃。", "虽然很贵，但是很好吃。", "虽然 va con 但是 (o 可是), non con 所以."],
    ["所以下雨，因为我没去。", "因为下雨，所以我没去。", "Prima la causa (因为), poi la conseguenza (所以)."]
  ],
  "quiz": [
    {"k": "pick", "q": "Come si dice «È caro, però è buono»?", "opts": ["虽然很贵，但是很好吃。", "因为很贵，所以很好吃。", "虽然很贵，所以很好吃。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "因为下雨，所以我没去。", "opts": ["Siccome pioveva, non sono andato.", "Anche se pioveva, sono andato.", "Se piove, non vado."], "a": 0},
    {"k": "order", "zh": "因为我很累所以想休息", "it": "Siccome sono stanco, voglio riposare."},
    {"k": "pick", "q": "Quale parola completa? 虽然他很忙，___每天学中文。", "opts": ["但是", "所以", "因为"], "a": 0},
    {"k": "order", "zh": "虽然很贵但是很好吃", "it": "È caro, però è buonissimo."}
  ]
});
