/* Lezione 53 · Quantità: 一些, 有些, 所有, 每, 别的. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "yixie-suoyou",
  "n": 53,
  "title": "Quantità: 一些, 有些, 所有, 每, 别的",
  "goal": "Dire «alcuni», «certi», «tutti», «ogni» e «altro» senza contare.",
  "body": [
    "**一些** (yìxiē) = «alcuni, un po' di», per cose che non si contano con precisione: 我买了一些水果 = ho comprato un po' di frutta; 一些人 = alcune persone. Non va con numeri.",
    "**有些** (yǒuxiē) = «certi, alcuni (non tutti)», e fa da soggetto: 有些人喜欢茶 = alcuni (certe persone) amano il tè.",
    "**所有的** (suǒyǒu de) = «tutti, tutto» (collettivo): 所有的学生都来了 = tutti gli studenti sono venuti. Spesso si rinforza con 都.",
    "**每** (měi) = «ogni», di solito con un classificatore: 每天 = ogni giorno, 每个人 = ogni persona, 每次 = ogni volta. Con 都: 每个人都喜欢 = tutti (ognuno) amano.",
    "**别的** (biéde) = «altro, altri»: 别的人 = altre persone; 你还要别的吗？ = vuoi altro?"
  ],
  "pattern": ["一些 / 有些 / 所有的 / 每", "nome"],
  "ex": [
    ["我买了一些水果。", "Ho comprato un po' di frutta."],
    ["有些人喜欢茶。", "Certe persone amano il tè."],
    ["所有的学生都来了。", "Tutti gli studenti sono venuti."],
    ["每天我都学中文。", "Ogni giorno studio cinese."],
    ["每个人都喜欢他。", "Tutti lo apprezzano."],
    ["你还要别的吗？", "Vuoi altro?"]
  ],
  "dlg": [
    ["A", "你还要别的吗？", "Vuoi altro?"],
    ["B", "我再买一些水果。", "Compro ancora un po' di frutta."],
    ["A", "好，所有的水果都很新。", "Va bene, tutta la frutta è freschissima."],
    ["B", "每个人都喜欢吃水果。", "A tutti piace mangiare frutta."]
  ],
  "traps": [
    ["我买了三一些水果。", "我买了一些水果。", "一些 non si usa con un altro numero."],
    ["每学生都来了。", "每个学生都来了。", "Dopo 每 serve di solito un classificatore."],
    ["每天我学中文都。", "每天我都学中文。", "都 sta prima del verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "所有的学生都来了", "it": "Tutti gli studenti sono venuti."},
    {"k": "pick", "q": "Come dici «Ogni giorno studio cinese»?", "opts": ["每天我都学中文。", "每我天学中文。", "天每我学中文。"], "a": 0},
    {"k": "buco", "zh": "我买了＿水果。", "opts": ["一些", "三一些", "每"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "有些人喜欢茶。", "opts": ["Certe persone amano il tè.", "Tutti amano il tè.", "Nessuno ama il tè."], "a": 0},
    {"k": "pick", "q": "Come chiedi «Vuoi altro?»", "opts": ["你还要别的吗？", "你还别的要吗？", "你要别吗？"], "a": 0}
  ]
});
