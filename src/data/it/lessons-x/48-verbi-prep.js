/* Lezione 48 · 动词和介词的搭配. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "verbi-prep",
  "n": 48,
  "title": "动词和介词的搭配",
  "goal": "会用 pensare a、parlare di、credere in、aiutare a 等固定搭配，知道意大利语的介词不能直接照汉语翻译。",
  "body": [
    "意大利语很多动词后面**固定带某个介词**，不能按汉语\"字面\"选：**pensare a**（想到）、**parlare di**（谈论）、**credere in**（相信）、**dipendere da**（取决于）、**aiutare a**（帮助做）、**pensare di**（打算）。",
    "**pensare a** + 人/事：**Penso a** te（我在想你）。**pensare di** + 动词原形：**Penso di** partire（我打算走）。",
    "**parlare di** + 话题，**parlare con** + 人：Parlo **di** lavoro **con** Anna（我和安娜谈工作）。",
    "**cominciare a / finire di / smettere di** + 动词：Comincio **a** studiare（我开始学习）；Finisco **di** lavorare（我下班）；Smetto **di** fumare（我戒烟）。",
    "这些搭配要一个一个记，最好整个短语背下来；遇到不确定的，查词典看动词后面的介词。"
  ],
  "pattern": ["pensare a / di", "parlare di / con", "cominciare a · finire di"],
  "ex": [
    ["Penso a te.", "我在想你。"],
    ["Penso di partire domani.", "我打算明天走。"],
    ["Parlo di lavoro con Anna.", "我和安娜谈工作。"],
    ["Comincio a studiare alle nove.", "我九点开始学习。"],
    ["Finisco di lavorare alle sei.", "我六点下班。"],
    ["Credo in te.", "我相信你。"]
  ],
  "dlg": [
    ["A", "A che cosa pensi?", "你在想什么？"],
    ["B", "Penso di andare in Italia.", "我打算去意大利。"],
    ["A", "Quando cominci a studiare italiano?", "你什么时候开始学意大利语？"],
    ["B", "Comincio domani, ma ho già finito di lavorare.", "明天开始，不过我已经下班了。"]
  ],
  "traps": [
    ["Penso te.", "Penso a te.", "pensare 后面带 a。"],
    ["Comincio studiare.", "Comincio a studiare.", "cominciare 后面带 a。"],
    ["Finisco a lavorare.", "Finisco di lavorare.", "finire 后面带 di，不用 a。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我打算明天走", "opts": ["Penso di partire domani.", "Penso a partire domani.", "Penso partire domani."], "a": 0},
    {"k": "pick", "q": "我开始学习", "opts": ["Comincio a studiare.", "Comincio di studiare.", "Comincio studiare."], "a": 0},
    {"k": "buco", "it": "Finisco ___ lavorare alle sei.", "opts": ["di", "a", "per"], "a": 0},
    {"k": "pick", "q": "我在想你", "opts": ["Penso a te.", "Penso di te.", "Penso te."], "a": 0},
    {"k": "order", "it": "penso di partire domani", "zh": "我打算明天走。"}
  ]
});
