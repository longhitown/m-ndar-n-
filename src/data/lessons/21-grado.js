/* Lezione 21 · Come lo fai: 得. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "grado",
  "n": 21,
  "path": "hsk2_gram_1",
  "title": "Come lo fai: 说得很好",
  "goal": "Dire come qualcuno fa una cosa: bene, in fretta, tardi.",
  "body": [
    "Per dire **come** si fa un'azione: **verbo + 得 (de) + giudizio**. 他说得很好 = parla bene; 你跑得很快 = corri veloce.",
    "Il giudizio è un aggettivo, di solito con 很, 非常, 太 o 不: 我睡得不好 = ho dormito male.",
    "Se c'è un oggetto, **il verbo si ripete** (oppure l'oggetto va prima): 他说中文说得很好 = 他中文说得很好 = parla bene il cinese. Non si dice 他说中文得很好.",
    "Attenzione: in italiano l'avverbio sta dopo il verbo («parla bene»). In cinese anche, ma con 得 in mezzo: senza 得 la frase non regge."
  ],
  "pattern": ["chi", "verbo", "得", "come"],
  "ex": [
    ["他说得很好。", "Parla bene."],
    ["你跑得很快。", "Corri veloce."],
    ["我昨天睡得不好。", "Ieri ho dormito male."],
    ["他中文说得很好。", "Parla bene il cinese."],
    ["她唱歌唱得非常好。", "Canta benissimo."],
    ["你来得太晚了。", "Sei arrivato troppo tardi."],
    ["她唱歌唱得很好。", "Canta molto bene."],
    ["他跑得很快。", "Corre molto veloce."]
  ],
  "dlg": [
    ["A", "你中文说得很好！", "Parli molto bene il cinese!"],
    ["B", "谢谢，我说得不太好。", "Grazie, ma non lo parlo tanto bene."],
    ["A", "你昨天睡得好吗？", "Ieri hai dormito bene?"],
    ["B", "我昨天睡得不好，今天很累。", "Ieri ho dormito male, oggi sono stanco."]
  ],
  "traps": [
    ["他说中文得很好。", "他说中文说得很好。", "Con l'oggetto il verbo si ripete prima di 得."],
    ["他说很好。", "他说得很好。", "Per dire come si fa una cosa serve 得."]
  ],
  "quiz": [
    {"k": "order", "zh": "你跑得很快", "it": "Corri veloce."},
    {"k": "pick", "q": "Come si dice «Parla bene il cinese»?", "opts": ["他中文说得很好。", "他说中文得很好。", "他说得中文很好。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我昨天睡得不好。", "opts": ["Ieri ho dormito male.", "Ieri non ho dormito.", "Ieri sono andato a letto tardi."], "a": 0},
    {"k": "pick", "q": "Quale frase è giusta?", "opts": ["她唱歌唱得非常好。", "她唱歌得非常好。", "她唱得歌非常好。"], "a": 0},
    {"k": "order", "zh": "你来得太晚了", "it": "Sei arrivato troppo tardi."}
  ]
});
