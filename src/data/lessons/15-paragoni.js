/* Lezione 15 · Più … di: 比. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "paragoni",
  "n": 15,
  "path": "aggettivi",
  "title": "Più … di: 比",
  "goal": "Fare paragoni tra persone, cose e giorni.",
  "body": [
    "Per dire «A è più … di B» si usa 比 (bǐ): **A + 比 + B + aggettivo**. 我哥哥比我高 = mio fratello è più alto di me.",
    "Nel paragone **niente 很**: 比我很高 è sbagliato. Per «ancora più» si usa 更: 他比我更高.",
    "Funziona anche col tempo che fa: 今天比昨天热 = oggi fa più caldo di ieri.",
    "In italiano diciamo «più alto di me»; il cinese mette prima il termine di paragone (比我) e poi l'aggettivo (高)."
  ],
  "pattern": ["A", "比", "B", "aggettivo"],
  "ex": [
    ["我哥哥比我高。", "Mio fratello maggiore è più alto di me."],
    ["今天比昨天热。", "Oggi fa più caldo di ieri."],
    ["北京比上海大。", "Pechino è più grande di Shanghai."],
    ["这个比那个贵。", "Questo è più caro di quello."],
    ["面包比米饭贵。", "Il pane è più caro del riso."],
    ["这个比那个大。", "Questo è più grande di quello."],
    ["今天比昨天冷。", "Oggi fa più freddo di ieri."]
  ],
  "dlg": [
    ["A", "今天比昨天热。", "Oggi fa più caldo di ieri."],
    ["B", "对，今天很热。", "Sì, oggi fa molto caldo."],
    ["A", "你哥哥比你高吗？", "Tuo fratello maggiore è più alto di te?"],
    ["B", "对，我哥哥比我高。", "Sì, mio fratello maggiore è più alto di me."]
  ],
  "traps": [
    ["他比我很高。", "他比我高。", "Nel paragone niente 很 (al massimo 更)."],
    ["他高比我。", "他比我高。", "比 + termine di paragone vanno prima dell'aggettivo."]
  ],
  "quiz": [
    {"k": "order", "zh": "北京比上海大", "it": "Pechino è più grande di Shanghai."},
    {"k": "pick", "q": "Come si dice «Oggi fa più caldo di ieri»?", "opts": ["今天比昨天热。", "今天热比昨天。", "今天比昨天很热。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "这个比那个贵。", "opts": ["Questo è più caro di quello.", "Quello è più caro di questo.", "Costano uguale."], "a": 0},
    {"k": "pick", "q": "Come si dice «Lui è più alto di me»?", "opts": ["他比我高。", "我比他高。", "他高我。"], "a": 0, "why": "Chi è «più» viene per primo."},
    {"k": "order", "zh": "这个比那个贵", "it": "Questo è più caro di quello."}
  ]
});
