/* Lezione 16 · Che cosa fai a una cosa: 把. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "ba",
  "n": 16,
  "path": "hsk2_verbi_1",
  "title": "Che cosa fai a una cosa: 把",
  "goal": "Dire dove metti una cosa, che cosa ci fai e come la lasci.",
  "body": [
    "Quando conta **che cosa succede all'oggetto**, il cinese lo porta prima del verbo con 把 (bǎ): **chi + 把 + cosa + verbo + risultato**. 我把书放在桌子上 = metto il libro sul tavolo.",
    "Dopo il verbo deve esserci **qualcosa in più**: dove va la cosa (放在桌子上), come finisce (喝完了, 关上), a chi va (给我). Un verbo da solo non basta: 我把书看 è sbagliato.",
    "La cosa dopo 把 è **una cosa precisa**, che tutti e due sapete: il libro, la porta, quel caffè. Non si dice 我把一本书… quando il libro è uno qualunque.",
    "La negazione e i verbi modali vanno **prima di 把**: 我没把门关上 = non ho chiuso la porta; 你要把作业做完 = devi finire i compiti.",
    "In italiano basta l'ordine normale («metto il libro sul tavolo»); in cinese 把 serve proprio a dire «e il libro finisce lì»."
  ],
  "pattern": ["chi", "把", "cosa", "verbo", "risultato"],
  "ex": [
    ["我把书放在桌子上了。", "Ho messo il libro sul tavolo."],
    ["请把门关上。", "Per favore, chiudi la porta."],
    ["他把咖啡喝完了。", "Ha finito il caffè."],
    ["你把手机给我。", "Dammi il telefono."],
    ["我没把作业做完。", "Non ho finito i compiti."],
    ["请把窗户打开。", "Per favore, apri la finestra."],
    ["请把书给我。", "Per favore, dammi il libro."],
    ["他把手机放在家里了。", "Ha lasciato il cellulare a casa."]
  ],
  "dlg": [
    ["A", "你的手机在哪里？", "Dov'è il tuo cellulare?"],
    ["B", "我把手机放在桌子上了。", "Ho messo il cellulare sul tavolo."],
    ["A", "请把手机给我。", "Per favore, dammi il cellulare."],
    ["B", "好，给你。", "Va bene, tieni."]
  ],
  "traps": [
    ["我把书看。", "我把书看完了。", "Con 把 il verbo da solo non basta: serve un risultato (看完)."],
    ["我把门没关上。", "我没把门关上。", "La negazione va prima di 把."],
    ["我放书在桌子上。", "我把书放在桌子上。", "Per dire dove metti una cosa si usa 把 + cosa + 放在 + luogo."]
  ],
  "quiz": [
    {"k": "order", "zh": "请把门关上", "it": "Per favore, chiudi la porta."},
    {"k": "pick", "q": "Come si dice «Ho messo il telefono sul tavolo»?", "opts": ["我把手机放在桌子上了。", "我放手机在桌子上了。", "我把手机放了。"], "a": 0},
    {"k": "pick", "q": "Dove va 没 in «Non ho finito i compiti»?", "opts": ["我没把作业做完。", "我把作业没做完。", "我把没作业做完。"], "a": 0, "why": "Negazione e modali stanno prima di 把."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他把咖啡喝完了。", "opts": ["Ha finito il caffè.", "Ha comprato un caffè.", "Non ha bevuto il caffè."], "a": 0},
    {"k": "order", "zh": "我把书放在桌子上了", "it": "Ho messo il libro sul tavolo."}
  ]
});
