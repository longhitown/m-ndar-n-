/* Lezione 29 · Quando, dove, come è successo: 是…的. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "shide",
  "n": 29,
  "path": "hsk3_nomi_1",
  "title": "Quando, dove, come: 是…的",
  "goal": "Chiedere e dire i dettagli di una cosa già successa: quando, dove, con chi, come.",
  "body": [
    "Quando si sa già che una cosa **è successa** e si vuole parlare di un **dettaglio** (quando, dove, come, con chi), si usa **是 … 的**: 我是昨天来的 = sono arrivato **ieri**.",
    "Il dettaglio va **subito dopo 是**, il verbo prima di 的: 你是怎么来的? — 我是坐飞机来的 = come sei venuto? — In aereo.",
    "Nel parlato il 是 si può togliere (我昨天来的), il **的 no**.",
    "Al negativo: **不是…的**: 我不是一个人来的 = non sono venuto da solo.",
    "Differenza con 了: 我昨天来了 = sono venuto ieri (la notizia è che sono venuto); 我是昨天来的 = che sono venuto si sa, la notizia è **ieri**."
  ],
  "pattern": ["chi", "是", "quando / dove / come", "verbo", "的"],
  "ex": [
    ["我是昨天来的。", "Sono arrivato ieri."],
    ["你是怎么来的？", "Come sei venuto?"],
    ["我是坐飞机来的。", "Sono venuto in aereo."],
    ["你是在哪儿学的中文？", "Dove hai studiato il cinese?"],
    ["我不是一个人来的。", "Non sono venuto da solo."],
    ["他是跟朋友一起去的。", "Ci è andato con un amico."],
    ["我是在北京学的中文。", "Ho studiato cinese a Pechino."],
    ["他不是昨天来的。", "Non è arrivato ieri."]
  ],
  "dlg": [
    ["A", "你是什么时候来的？", "Quando sei arrivato?"],
    ["B", "我是昨天来的。", "Sono arrivato ieri."],
    ["A", "你是怎么来的？", "Come sei venuto?"],
    ["B", "我是坐飞机来的。你是一个人来的吗？", "Sono venuto in aereo. Tu sei venuto da solo?"],
    ["A", "不是，我是跟朋友一起来的。", "No, sono venuto con un amico."]
  ],
  "traps": [
    ["我是昨天来了。", "我是昨天来的。", "Con 是 per il dettaglio, alla fine va 的, non 了."],
    ["我是来昨天的。", "我是昨天来的。", "Il dettaglio va subito dopo 是, prima del verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "我是坐飞机来的", "it": "Sono venuto in aereo."},
    {"k": "pick", "q": "Come si dice «Sono arrivato ieri» (si sa che sei arrivato, conta quando)?", "opts": ["我是昨天来的。", "我是昨天来了。", "我昨天是来。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我不是一个人来的。", "opts": ["Non sono venuto da solo.", "Non sono una persona che viene.", "Sono venuto da solo."], "a": 0},
    {"k": "pick", "q": "Quale domanda chiede «come» sei venuto?", "opts": ["你是怎么来的？", "你是什么时候来的？", "你是跟谁来的？"], "a": 0},
    {"k": "order", "zh": "他是跟朋友一起去的", "it": "Ci è andato con un amico."}
  ]
});
