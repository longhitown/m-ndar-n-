/* Corso di italiano per chi parla cinese · lezione 5 · 形容词要和名词一致.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "accordo",
  "n": 5,
  "title": "形容词要和名词一致",
  "goal": "形容词跟着名词变性、变数。",
  "body": [
    "意大利语的形容词要和它修饰的名词**同性同数**：un libro nuov**o**、una casa nuov**a**、due libri nuov**i**、due case nuov**e**。",
    "以 -o 结尾的形容词有四种形式（-o、-a、-i、-e）；以 -e 结尾的只有两种：单数 -e，复数 -i。un libro / una casa interessant**e**，due libri / due case interessant**i**。",
    "形容词一般放在**名词后面**：un libro nuovo（一本新书），和汉语\"新书\"的顺序相反。少数常用的短形容词（bello、buono、grande、piccolo）也可以放在前面。",
    "用 essere 的时候也要一致：Il tè è caldo；La zuppa è calda；I ravioli sono buoni。",
    "汉语的\"很\"常常只是连接，不一定要翻成 molto：茶很热 = Il tè è caldo。真要说\"非常\"才用 molto：Il tè è molto caldo。"
  ],
  "pattern": ["-o · -a · -i · -e", "-e · -i"],
  "ex": [
    ["un libro nuovo", "一本新书"],
    ["una casa nuova", "一栋新房子"],
    ["due libri nuovi", "两本新书"],
    ["La zuppa è calda.", "汤很热。"],
    ["I ravioli sono buoni.", "饺子很好吃。"],
    ["Il tè è caldo.", "茶很热。"]
  ],
  "dlg": [
    ["A", "Com'è la zuppa?", "汤怎么样？"],
    ["B", "La zuppa è calda e buona.", "汤很热，很好吃。"],
    ["A", "E i ravioli?", "那饺子呢？"],
    ["B", "I ravioli sono buoni.", "饺子很好吃。"],
    ["A", "Il tè è caldo?", "茶是热的吗？"],
    ["B", "Sì, il tè è caldo.", "是的，茶是热的。"]
  ],
  "traps": [
    ["una casa nuovo", "una casa nuova", "casa 是阴性，形容词也用阴性 -a。"],
    ["due libri nuovo", "due libri nuovi", "复数名词配复数形容词。"]
  ],
  "quiz": [
    {"k": "pick", "q": "una ragazza ___（高）", "opts": ["alto", "alta", "alti"], "a": 1},
    {"k": "pick", "q": "due case ___（新）", "opts": ["nuove", "nuovi", "nuova"], "a": 0},
    {"k": "pick", "q": "un libro ___（有意思）", "opts": ["interessanto", "interessante", "interessanta"], "a": 1, "why": "-e 结尾的形容词单数阴阳同形。"},
    {"k": "pick", "q": "一本新书", "opts": ["un libro nuovo", "un libro nuova", "una libro nuovo"], "a": 0},
    {"k": "order", "it": "la casa è nuova", "zh": "这栋房子是新的。"}
  ]
});
