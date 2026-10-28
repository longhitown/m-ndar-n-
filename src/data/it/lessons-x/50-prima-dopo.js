/* Lezione 50 · 先后顺序：prima di、dopo、quando、mentre. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "prima-dopo",
  "n": 50,
  "title": "先后顺序：prima di、dopo、quando、mentre",
  "goal": "会说\"在……之前、……之后、……的时候、一边……一边\"，把两件事按顺序连起来。",
  "body": [
    "**prima di** + 动词原形 / 名词 = **在……之前**：**Prima di** mangiare mi lavo le mani = 吃饭前我洗手。后面是名词时也用 prima di：prima di cena（晚饭前）。",
    "**dopo** + 名词 / **dopo aver / essere** + 过去分词 = **在……之后**：**Dopo** cena guardo la TV（晚饭后我看电视）；**Dopo aver mangiato** esco（吃过饭后我出门）。",
    "**quando** = **当……的时候**：**Quando** arrivo ti chiamo（我到了就给你打电话）。**mentre** = **一边……一边、在……的时候**（两个动作同时）：**Mentre** mangio ascolto la musica（我一边吃饭一边听音乐）。",
    "**appena** = **一……就**：**Appena** arrivo ti chiamo（我一到就给你打电话），对应汉语的\"一……就……\"（见中文第 41 课）。",
    "和汉语的顺序相比：汉语常常\"先说的先发生\"，意大利语可以靠 prima di / dopo 把后发生的事放在前面说：**Prima di uscire**, mangio（出门前，我吃饭）。"
  ],
  "pattern": ["prima di + 动词原形", "dopo + 名词 / dopo aver + 分词", "mentre / quando + 句子"],
  "ex": [
    ["Prima di mangiare mi lavo le mani.", "吃饭前我洗手。"],
    ["Dopo cena guardo la TV.", "晚饭后我看电视。"],
    ["Dopo aver mangiato esco.", "吃过饭后我出门。"],
    ["Quando arrivo ti chiamo.", "我到了给你打电话。"],
    ["Mentre mangio ascolto la musica.", "我一边吃饭一边听音乐。"],
    ["Appena arrivo ti chiamo.", "我一到就给你打电话。"]
  ],
  "dlg": [
    ["A", "Che cosa fai dopo cena?", "晚饭后你做什么？"],
    ["B", "Guardo la TV, ma prima di dormire leggo un libro.", "看电视，不过睡觉前我看书。"],
    ["A", "Io ascolto la musica mentre studio.", "我一边学习一边听音乐。"],
    ["B", "Quando hai tempo, vieni da me.", "你有时间的时候，来我这儿。"]
  ],
  "traps": [
    ["Prima mangiare mi lavo le mani.", "Prima di mangiare mi lavo le mani.", "prima 后面接动词原形时要加 di。"],
    ["Dopo mangiare esco.", "Dopo aver mangiato esco.", "dopo + 动词要用 aver / essere + 过去分词。"],
    ["Mentre arrivo ti chiamo.", "Quando arrivo ti chiamo.", "\"到了\"是一个时间点，用 quando 或 appena，不用 mentre。"]
  ],
  "quiz": [
    {"k": "pick", "q": "吃饭前我洗手", "opts": ["Prima di mangiare mi lavo le mani.", "Prima mangiare mi lavo le mani.", "Prima a mangiare mi lavo le mani."], "a": 0},
    {"k": "pick", "q": "吃过饭后我出门", "opts": ["Dopo aver mangiato esco.", "Dopo mangiare esco.", "Dopo di mangiato esco."], "a": 0},
    {"k": "buco", "it": "___ mangio ascolto la musica.", "opts": ["Mentre", "Prima", "Dopo"], "a": 0},
    {"k": "pick", "q": "我一到就给你打电话", "opts": ["Appena arrivo ti chiamo.", "Mentre arrivo ti chiamo.", "Prima arrivo ti chiamo."], "a": 0},
    {"k": "order", "it": "prima di mangiare mi lavo le mani", "zh": "吃饭前我洗手。"}
  ]
});
