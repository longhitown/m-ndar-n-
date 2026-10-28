/* Corso di italiano per chi parla cinese · lezione 2 · 名词：阴性、阳性和复数.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "genere",
  "n": 2,
  "title": "名词：阴性、阳性和复数",
  "goal": "知道名词是阴性还是阳性，会变复数。",
  "body": [
    "意大利语的每个名词都有**性**：阳性或阴性。连书、桌子、城市都有性。性很重要，因为冠词和形容词都要跟着变。",
    "一般规律：以 **-o** 结尾的多半是**阳性**（libro 书），以 **-a** 结尾的多半是**阴性**（casa 房子），以 **-e** 结尾的可能是阳性也可能是阴性（il pane 面包、la chiave 钥匙），只能一个一个记。",
    "复数：**-o → -i**（libro → libri），**-a → -e**（casa → case），**-e → -i**（chiave → chiavi）。",
    "有的词复数不变：最后一个音节有重音的（città、caffè）和外来词（bar、film、computer）。una città → due città。",
    "少数例外要特别记：**uovo**（鸡蛋）是阳性，复数却是阴性的 **uova**；**mano**（手）以 -o 结尾，却是阴性。汉语的名词没有单复数变化，所以要习惯：数量多于一，名词就要变。"
  ],
  "pattern": ["-o → -i", "-a → -e", "-e → -i"],
  "ex": [
    ["un libro, due libri", "一本书，两本书"],
    ["una casa, due case", "一栋房子，两栋房子"],
    ["una chiave, tre chiavi", "一把钥匙，三把钥匙"],
    ["un caffè, due caffè", "一杯咖啡，两杯咖啡"],
    ["un uovo, due uova", "一个鸡蛋，两个鸡蛋"],
    ["un amico, due amici", "一个朋友，两个朋友"],
    ["una mela, due mele", "一个苹果，两个苹果"]
  ],
  "dlg": [
    ["A", "Buongiorno! Due caffè, per favore.", "早上好！请来两杯咖啡。"],
    ["B", "Ecco due caffè. Altro?", "两杯咖啡给您。还要别的吗？"],
    ["A", "Sì, due uova.", "要，两个鸡蛋。"],
    ["B", "Due caffè e due uova. Ecco.", "两杯咖啡和两个鸡蛋。给您。"],
    ["A", "Grazie.", "谢谢。"]
  ],
  "traps": [
    ["due libro", "due libri", "数量多于一，名词就要变复数。"],
    ["due caffès", "due caffè", "以重音结尾的词复数不变，也不加 -s。"],
    ["due uovi", "due uova", "uovo 的复数不规则：uova。"]
  ],
  "quiz": [
    {"k": "pick", "q": "libro 的复数是？", "opts": ["libre", "libri", "libros"], "a": 1},
    {"k": "pick", "q": "casa 的复数是？", "opts": ["case", "casi", "casas"], "a": 0},
    {"k": "pick", "q": "哪个词是阴性？", "opts": ["libro", "chiave", "caffè"], "a": 1, "why": "chiave 以 -e 结尾，却是阴性：la chiave。-e 结尾的词只能记。"},
    {"k": "pick", "q": "una città 的复数是？", "opts": ["due città", "due cittè", "due citte"], "a": 0, "why": "最后一个音节有重音的词复数不变。"},
    {"k": "order", "it": "ho due libri", "zh": "我有两本书。"},
    {"k": "pick", "q": "uovo 的复数是？", "opts": ["uovi", "uova", "uove"], "a": 1}
  ]
});
