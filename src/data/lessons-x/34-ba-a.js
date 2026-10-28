/* Lezione 34 · Suggerire e ammorbidire: 吧 e 啊. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "ba-a",
  "n": 34,
  "title": "Suggerire e ammorbidire: 吧 e 啊",
  "goal": "Fare una proposta, chiedere conferma e rendere una frase più morbida con le particelle in fondo alla frase.",
  "body": [
    "Le **particelle** stanno in fondo alla frase e non hanno un significato da tradurre: danno il **tono**.",
    "**吧** (ba) **propone o ammorbidisce**: 我们走吧 = andiamo; 你来吧 = vieni pure; 请坐吧 = si accomodi pure. Un ordine con 吧 suona come un invito, non come un comando.",
    "**吧** chiede anche conferma, quando chi parla **è già abbastanza sicuro**: 你是中国人吧？ = sei cinese, vero? (penso di sì).",
    "**啊** (a) rende la frase più calda e colloquiale: 好啊 = va bene (con piacere); 你好啊 = ciao, come va? Dopo una vocale la pronuncia può cambiare (ya, wa), ma si scrive sempre 啊.",
    "Non confondere 吧 con 吗: **吗 chiede un'informazione** (sì o no), **吧 propone o controlla**."
  ],
  "pattern": ["frase", "吧 / 啊"],
  "ex": [
    ["我们走吧。", "Andiamo."],
    ["你来吧。", "Vieni pure."],
    ["请坐吧。", "Si accomodi pure."],
    ["你是中国人吧？", "Sei cinese, vero?"],
    ["好啊，我们去吧。", "Va bene, andiamo."],
    ["你好啊！", "Ciao, come va?"]
  ],
  "dlg": [
    ["A", "我们去公园吧。", "Andiamo al parco."],
    ["B", "好啊！你想几点去？", "Volentieri! A che ora vuoi andare?"],
    ["A", "下午吧。", "Nel pomeriggio, direi."],
    ["B", "好，下午见。", "Va bene, ci vediamo nel pomeriggio."]
  ],
  "traps": [
    ["我们走吗。", "我们走吧。", "Per proporre si usa 吧, non 吗."],
    ["你是中国人吗吧？", "你是中国人吧？", "吗 e 吧 non si usano insieme."],
    ["吧我们走。", "我们走吧。", "Le particelle stanno in fondo alla frase."]
  ],
  "quiz": [
    {"k": "order", "zh": "我们去公园吧", "it": "Andiamo al parco."},
    {"k": "pick", "q": "Come proponi «Andiamo»?", "opts": ["我们走吧。", "我们走吗。", "吧我们走。"], "a": 0},
    {"k": "buco", "zh": "请坐＿。", "opts": ["吧", "吗", "了"], "a": 0},
    {"k": "pick", "q": "Che cosa fa 吧 in 你是中国人吧？", "opts": ["Chiede conferma (penso di sì)", "Fa una domanda a cui non conosci la risposta", "Mette la frase al passato"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "好啊，我们去吧。", "opts": ["Va bene, andiamo.", "Non vado.", "Dove andiamo?"], "a": 0}
  ]
});
