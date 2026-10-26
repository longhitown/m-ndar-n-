/* Lezione 17 · Il passivo: 被. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "bei",
  "n": 17,
  "path": "hsk3_gram",
  "title": "Il passivo: 被",
  "goal": "Raccontare che cosa ti è successo: rubato, rotto, mangiato da qualcun altro.",
  "body": [
    "被 (bèi) mette al centro **chi subisce**: **cosa + 被 + chi lo fa + verbo + risultato**. 我的手机被偷了 = mi hanno rubato il telefono.",
    "Chi fa l'azione si può dire o no: 蛋糕被弟弟吃了 = la torta l'ha mangiata mio fratello; 我的钱包被偷了 = mi hanno rubato il portafoglio (non si sa chi).",
    "Come con 把, dopo il verbo serve **qualcosa in più**: di solito 了 o un risultato (打破了, 吃完了).",
    "被 si usa soprattutto per **cose spiacevoli**: rubare, rompere, criticare. Per le cose belle il cinese preferisce la frase normale.",
    "La negazione va prima di 被: 我的自行车没被偷 = la mia bici non è stata rubata."
  ],
  "pattern": ["cosa", "被", "chi", "verbo", "了"],
  "ex": [
    ["我的手机被偷了。", "Mi hanno rubato il telefono."],
    ["蛋糕被弟弟吃了。", "La torta l'ha mangiata mio fratello."],
    ["杯子被他打破了。", "Il bicchiere l'ha rotto lui."],
    ["我的钱包被偷了。", "Mi hanno rubato il portafoglio."],
    ["他被老师批评了。", "È stato rimproverato dall'insegnante."],
    ["我的自行车没被偷。", "La mia bici non è stata rubata."]
  ],
  "traps": [
    ["我的手机被偷。", "我的手机被偷了。", "Dopo il verbo serve 了 o un risultato."],
    ["我的自行车被没偷。", "我的自行车没被偷。", "La negazione va prima di 被."]
  ],
  "quiz": [
    {"k": "order", "zh": "我的手机被偷了", "it": "Mi hanno rubato il telefono."},
    {"k": "pick", "q": "Come si dice «La torta l'ha mangiata mio fratello»?", "opts": ["蛋糕被弟弟吃了。", "弟弟被蛋糕吃了。", "蛋糕被吃弟弟了。"], "a": 0, "why": "Prima chi subisce (la torta), poi 被 + chi fa."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "杯子被他打破了。", "opts": ["Il bicchiere l'ha rotto lui.", "Lui ha comprato un bicchiere.", "Il bicchiere è caduto da solo."], "a": 0},
    {"k": "pick", "q": "Quale frase è giusta?", "opts": ["我的自行车没被偷。", "我的自行车被没偷。", "我的自行车被偷没。"], "a": 0},
    {"k": "order", "zh": "他被老师批评了", "it": "È stato rimproverato dall'insegnante."}
  ]
});
