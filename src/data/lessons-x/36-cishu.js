/* Lezione 36 · Quante volte: 次 e 遍. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "cishu",
  "n": 36,
  "title": "Quante volte: 次 e 遍",
  "goal": "Dire quante volte si fa qualcosa: «sono stato tre volte», «leggilo ancora una volta».",
  "body": [
    "Per contare **le volte** si usa un classificatore di azione dopo il verbo: verbo + numero + **次** (cì) = «volte».",
    "我去过三次 = sono stato (là) tre volte; 我看了两次 = l'ho visto due volte; 他来过一次 = è venuto una volta.",
    "**遍** (biàn) è «volte» riferito all'azione **dall'inizio alla fine**, come leggere, dire, ascoltare: 请再说一遍 = per favore, ripeti (tutto) un'altra volta; 这本书我看了两遍 = ho letto questo libro due volte (tutto).",
    "Con un **nome di luogo o di persona** (o un pronome) come oggetto, il numero di volte va **dopo l'oggetto**: 我去过北京三次 = sono stato tre volte a Pechino; 我见过他两次 = l'ho visto due volte.",
    "La domanda è 几次 / 多少次: 你去过几次？ = quante volte ci sei stato?"
  ],
  "pattern": ["chi", "verbo", "numero", "次 / 遍"],
  "ex": [
    ["我去过三次。", "Ci sono stato tre volte."],
    ["他来过一次。", "È venuto una volta."],
    ["请再说一遍。", "Per favore, ripeti un'altra volta."],
    ["这本书我看了两遍。", "Questo libro l'ho letto due volte."],
    ["我去过北京三次。", "Sono stato a Pechino tre volte."],
    ["你去过几次？", "Quante volte ci sei stato?"]
  ],
  "dlg": [
    ["A", "你去过中国吗？", "Sei mai stato in Cina?"],
    ["B", "去过，我去过两次。", "Sì, ci sono stato due volte."],
    ["A", "你去过北京吗？", "Sei stato a Pechino?"],
    ["B", "去过一次。我很喜欢北京。", "Una volta. Mi piace molto Pechino."]
  ],
  "traps": [
    ["我去过次三。", "我去过三次。", "Prima il numero, poi 次."],
    ["我去三次过。", "我去过三次。", "过 sta subito dopo il verbo."],
    ["我三次去过北京。", "我去过北京三次。", "Il numero di volte sta dopo il verbo (e dopo il luogo)."]
  ],
  "quiz": [
    {"k": "order", "zh": "我去过北京三次", "it": "Sono stato a Pechino tre volte."},
    {"k": "pick", "q": "Come si dice «Ci sono stato tre volte»?", "opts": ["我去过三次。", "我三次去过。", "我去三次过。"], "a": 0},
    {"k": "buco", "zh": "请再说一＿。", "opts": ["遍", "个", "本"], "a": 0},
    {"k": "pick", "q": "Come chiedi «Quante volte ci sei stato?»", "opts": ["你去过几次？", "你去过几个？", "你几次去过？"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他来过一次。", "opts": ["È venuto una volta.", "Verrà una volta.", "Non è mai venuto."], "a": 0}
  ]
});
