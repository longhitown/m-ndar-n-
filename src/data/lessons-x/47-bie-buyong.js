/* Lezione 47 · Non fare, non c'è bisogno: 别, 不要, 不用. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "bie-buyong",
  "n": 47,
  "title": "Non fare, non c'è bisogno: 别, 不要, 不用",
  "goal": "Dire «non farlo!», «non c'è bisogno» e rispondere ai ringraziamenti.",
  "body": [
    "**别** (bié) e **不要** (búyào) servono per **vietare o sconsigliare**: 别走 = non andare via; 不要说话 = non parlare. **别** è più breve e colloquiale, **不要** più netto.",
    "Per essere gentili si aggiunge **请** o **吧**: 请别说话 = per favore, non parlare; 别走吧 = dai, non andare.",
    "**不用** (búyòng) = «non serve, non c'è bisogno»: 不用买 = non serve comprare; 你不用来 = non c'è bisogno che tu venga. 不用谢 = non c'è di che.",
    "**别** non si usa per il passato: «non l'ho fatto» è 我没做, mai 我别做.",
    "Con un'azione già in corso, 别…了 chiede di **smettere**: 别说了 = smettila di parlare; 别哭了 = non piangere più."
  ],
  "pattern": ["别 / 不要 / 不用", "verbo"],
  "ex": [
    ["别走。", "Non andare via."],
    ["不要说话。", "Non parlare."],
    ["请别说话。", "Per favore, non parlare."],
    ["不用买。", "Non serve comprare."],
    ["你不用来。", "Non c'è bisogno che tu venga."],
    ["别说了！", "Smettila di parlare!"]
  ],
  "dlg": [
    ["A", "谢谢你！", "Grazie!"],
    ["B", "不用谢。", "Non c'è di che."],
    ["A", "我去买东西，你来吗？", "Vado a fare spese, vieni?"],
    ["B", "你不用等我，别等了。", "Non devi aspettarmi, non aspettare."]
  ],
  "traps": [
    ["我别去。", "我不去。", "别 è un divieto o una richiesta, non una negazione."],
    ["你别不要走。", "你别走。", "Non si usano insieme."],
    ["不用谢你。", "不用谢。", "Rispondendo a un ringraziamento basta 不用谢."]
  ],
  "quiz": [
    {"k": "order", "zh": "请别说话", "it": "Per favore, non parlare."},
    {"k": "pick", "q": "Come dici «Non andare via»?", "opts": ["别走。", "没走。", "走别。"], "a": 0},
    {"k": "buco", "zh": "你＿来。", "opts": ["不用", "别了", "没"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "别说了！", "opts": ["Smettila di parlare!", "Parla ancora!", "Non ho parlato."], "a": 0},
    {"k": "pick", "q": "Come rispondi a 谢谢?", "opts": ["不用谢。", "没谢谢。", "不谢谢。"], "a": 0}
  ]
});
