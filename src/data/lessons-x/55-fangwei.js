/* Lezione 55 · Le parole di posizione: 前面, 后面, 左边, 右边, 旁边. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "fangwei",
  "n": 55,
  "title": "Le parole di posizione: 前面, 后面, 左边, 右边, 旁边",
  "goal": "Dire dov'è qualcosa rispetto a qualcos'altro: davanti, dietro, a sinistra, a destra, accanto.",
  "body": [
    "Le **parole di posizione** sono: **上面** (sopra), **下面** (sotto), **前面** (davanti), **后面** (dietro), **里面** (dentro), **外面** (fuori), **左边** (a sinistra), **右边** (a destra), **旁边** (accanto), **中间** (in mezzo), **对面** (di fronte).",
    "In cinese stanno **dopo** il nome: **nome + parola di posizione**. 桌子上面 = sopra il tavolo; 学校前面 = davanti alla scuola; 我家旁边 = accanto a casa mia. (In italiano vengono prima: «sopra il tavolo».)",
    "Con 在: 书在桌子上面 = il libro è sopra il tavolo; 银行在学校左边 = la banca è a sinistra della scuola. Con 有: 学校前面有一个公园 = davanti alla scuola c'è un parco.",
    "Con le parole di luogo si può togliere 面 o 边 dopo certi nomi: 桌子上 = sul tavolo, 家里 = in casa.",
    "Per indicare una posizione rispetto a una persona: 我左边 = alla mia sinistra; 你对面 = di fronte a te."
  ],
  "pattern": ["nome", "+", "上面 / 前面 / 旁边 / 左边…"],
  "ex": [
    ["书在桌子上面。", "Il libro è sopra il tavolo."],
    ["银行在学校左边。", "La banca è a sinistra della scuola."],
    ["我家旁边有一个公园。", "Accanto a casa mia c'è un parco."],
    ["学校前面有一个超市。", "Davanti alla scuola c'è un supermercato."],
    ["我坐在他对面。", "Mi siedo di fronte a lui."],
    ["他在房子外面。", "È fuori casa."]
  ],
  "dlg": [
    ["A", "请问，银行在哪里？", "Scusi, dov'è la banca?"],
    ["B", "银行在学校左边，超市的对面。", "La banca è a sinistra della scuola, di fronte al supermercato."],
    ["A", "学校前面有公园吗？", "Davanti alla scuola c'è un parco?"],
    ["B", "有，公园在学校前面。", "Sì, il parco è davanti alla scuola."]
  ],
  "traps": [
    ["书在上面桌子。", "书在桌子上面。", "La parola di posizione sta dopo il nome."],
    ["银行在左边学校。", "银行在学校左边。", "Prima il nome (学校), poi 左边."],
    ["我家有旁边一个公园。", "我家旁边有一个公园。", "Con 有 prima il luogo (我家旁边), poi la cosa."]
  ],
  "quiz": [
    {"k": "order", "zh": "银行在学校左边", "it": "La banca è a sinistra della scuola."},
    {"k": "pick", "q": "Come dici «Il libro è sopra il tavolo»?", "opts": ["书在桌子上面。", "书在上面桌子。", "书桌子在上面。"], "a": 0},
    {"k": "buco", "zh": "学校＿有一个公园。", "opts": ["前面", "的前", "面前的"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我坐在他对面。", "opts": ["Mi siedo di fronte a lui.", "Mi siedo accanto a lui.", "Mi siedo dietro di lui."], "a": 0},
    {"k": "pick", "q": "Dove sta la parola di posizione?", "opts": ["Dopo il nome", "Prima del nome", "In fondo alla frase"], "a": 0}
  ]
});
