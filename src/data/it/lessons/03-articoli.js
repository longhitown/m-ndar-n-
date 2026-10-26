/* Corso di italiano per chi parla cinese · lezione 3 · 冠词：il、lo、la…….
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "articoli",
  "n": 3,
  "title": "冠词：il、lo、la……",
  "goal": "在名词前面放上正确的冠词。",
  "body": [
    "汉语没有冠词，意大利语几乎每个名词前面都要有。**定冠词**（il、la……）表示双方都知道的那一个，或者泛指一类东西；**不定冠词**（un、una……）表示\"一个\"，第一次提到的东西。",
    "**阳性单数**：一般用 **il / un**（il libro、un libro）；在 **s + 辅音、z、gn、ps** 开头的词前用 **lo / uno**（lo studente、uno zaino）；在元音前用 **l' / un**（l'amico、un amico）。",
    "**阴性单数**：**la / una**（la casa、una casa）；元音前用 **l' / un'**（l'acqua、un'amica）。注意：阳性的 un 后面**不加**撇号，阴性的 un' 要加。",
    "**复数**：阳性用 **i**（i libri）；在 s + 辅音、z 和元音前用 **gli**（gli studenti、gli amici）。阴性都用 **le**（le case、le amiche）。",
    "冠词既跟着**名词的性和数**变，也跟着**后面那个词的开头字母**变。"
  ],
  "pattern": ["il · lo · l'", "la · l'", "i · gli · le"],
  "ex": [
    ["il libro, i libri", "这本书，这些书"],
    ["lo studente, gli studenti", "这个学生，这些学生"],
    ["l'amico, gli amici", "这个朋友，这些朋友"],
    ["la casa, le case", "这栋房子，这些房子"],
    ["l'acqua", "水"],
    ["un amico, un'amica", "一个（男性）朋友，一个（女性）朋友"]
  ],
  "traps": [
    ["il studente", "lo studente", "s + 辅音开头的阳性词用 lo。"],
    ["la acqua", "l'acqua", "元音前 la 变成 l'。"],
    ["un'amico", "un amico", "阳性的 un 永远不加撇号。"],
    ["i amici", "gli amici", "元音前的阳性复数用 gli。"]
  ],
  "quiz": [
    {"k": "pick", "q": "___ studente", "opts": ["il", "lo", "la"], "a": 1, "why": "s + 辅音开头：lo。"},
    {"k": "pick", "q": "___ acqua", "opts": ["la", "l'", "il"], "a": 1, "why": "acqua 是阴性，元音开头：l'。"},
    {"k": "pick", "q": "___ amica（一个女性朋友）", "opts": ["un", "un'", "uno"], "a": 1},
    {"k": "pick", "q": "___ amici", "opts": ["i", "gli", "le"], "a": 1},
    {"k": "pick", "q": "___ case", "opts": ["le", "i", "gli"], "a": 0},
    {"k": "order", "it": "il libro è nuovo", "zh": "这本书是新的。"}
  ]
});
