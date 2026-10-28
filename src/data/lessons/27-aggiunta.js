/* Lezione 27 · Non solo… ma anche, mentre, sia… sia: 不但…而且, 一边…一边, 又…又. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "aggiunta",
  "n": 27,
  "path": "hsk2_agg",
  "title": "Non solo… ma anche: 不但…而且",
  "goal": "Aggiungere informazioni: due qualità, due azioni insieme.",
  "body": [
    "**不但… 而且…** = non solo…, ma anche…: 他不但会说中文，而且会写汉字 = non solo parla cinese, sa anche scrivere i caratteri.",
    "**一边… 一边…** = fare due cose **nello stesso momento**: 我们一边吃饭一边聊天 = mangiamo e intanto chiacchieriamo. Tutte e due le parti sono verbi.",
    "**又… 又…** = due **qualità** insieme: 这个苹果又大又甜 = questa mela è grande e dolce. Con 又…又 non serve 很.",
    "Per due qualità in italiano basta «e»; in cinese 和 non collega gli aggettivi: 又大又甜, non 大和甜."
  ],
  "pattern": ["不但 / 一边 / 又", "…", "而且 / 一边 / 又", "…"],
  "ex": [
    ["他不但会说中文，而且会写汉字。", "Non solo parla cinese, sa anche scrivere i caratteri."],
    ["我们一边吃饭一边聊天。", "Mangiamo e intanto chiacchieriamo."],
    ["这个苹果又大又甜。", "Questa mela è grande e dolce."],
    ["她一边听音乐一边做作业。", "Fa i compiti ascoltando la musica."],
    ["这家饭馆又便宜又好吃。", "Questo ristorante è economico e buono."],
    ["这个苹果又大又好吃。", "Questa mela è grande e buona."],
    ["他一边吃一边说。", "Parla mentre mangia."]
  ],
  "dlg": [
    ["A", "这家饭馆又便宜又好吃。", "Questo ristorante è economico e buono."],
    ["B", "对，我们一边吃饭一边聊天吧。", "Già, mangiamo e intanto chiacchieriamo."],
    ["A", "我朋友不但会说中文，而且会写汉字。", "Il mio amico non solo parla cinese, ma sa anche scrivere i caratteri."],
    ["B", "太好了！", "Che bravo!"]
  ],
  "traps": [
    ["这个苹果很大和很甜。", "这个苹果又大又甜。", "和 non collega gli aggettivi: si usa 又…又."],
    ["他不但会说中文，但是会写汉字。", "他不但会说中文，而且会写汉字。", "不但 va con 而且 (o 也)."]
  ],
  "quiz": [
    {"k": "order", "zh": "这个苹果又大又甜", "it": "Questa mela è grande e dolce."},
    {"k": "pick", "q": "Come si dice «Mangiamo e intanto chiacchieriamo»?", "opts": ["我们一边吃饭一边聊天。", "我们又吃饭又聊天了。", "我们吃饭和聊天。"], "a": 0},
    {"k": "pick", "q": "Quale parola completa? 他不但会说中文，___会写汉字。", "opts": ["而且", "但是", "所以"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "这家饭馆又便宜又好吃。", "opts": ["Questo ristorante è economico e buono.", "Questo ristorante è caro ma buono.", "Questo ristorante non è né economico né buono."], "a": 0},
    {"k": "order", "zh": "她一边听音乐一边做作业", "it": "Fa i compiti ascoltando la musica."}
  ]
});
