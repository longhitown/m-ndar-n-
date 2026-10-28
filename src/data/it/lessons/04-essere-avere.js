/* Corso di italiano per chi parla cinese · lezione 4 · essere（是）和 avere（有）.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "essere-avere",
  "n": 4,
  "title": "essere（是）和 avere（有）",
  "goal": "说自己是谁、有什么，还有饿了、渴了、几岁了。",
  "body": [
    "essere（是）和 avere（有）是最重要的两个动词，都是不规则的，要背下来。**essere**：io sono、tu sei、lui / lei è、noi siamo、voi siete、loro sono。**avere**：io ho、tu hai、lui / lei ha、noi abbiamo、voi avete、loro hanno（h 不发音）。",
    "动词已经说明了\"谁\"，所以主语代词常常省略：**Sono cinese** = 我是中国人。",
    "国籍是形容词：要跟着性别变，而且**小写**。Sono cinese（男女一样）；Sono italiano（男）/ Sono italiana（女）；Siamo italiani。",
    "有几件事汉语用\"是\"或者不用动词，意大利语却用 **avere**：**Ho fame**（我饿了，字面是\"我有饥饿\"）、**Ho sete**（我渴了）、**Ho freddo**（我冷）、**Ho vent'anni**（我二十岁）。"
  ],
  "pattern": ["sono · sei · è …", "ho · hai · ha …"],
  "ex": [
    ["Sono cinese.", "我是中国人。"],
    ["Lei è italiana.", "她是意大利人。"],
    ["Siamo studenti.", "我们是学生。"],
    ["Ho un fratello.", "我有一个兄弟（意大利语不分哥哥弟弟）。"],
    ["Ho fame.", "我饿了。"],
    ["Lei ha vent'anni.", "她二十岁。"]
  ],
  "dlg": [
    ["A", "Ciao! Sono Luca. Sono italiano.", "你好！我是卢卡。我是意大利人。"],
    ["B", "Ciao, Luca! Sono Li. Sono cinese.", "你好，卢卡！我是李。我是中国人。"],
    ["A", "Hai fame?", "你饿吗？"],
    ["B", "Sì, ho fame.", "是的，我饿了。"],
    ["A", "Anch'io. Andiamo!", "我也是。走吧！"]
  ],
  "traps": [
    ["Sono fame.", "Ho fame.", "饿、渴、冷、热和年龄都用 avere。"],
    ["Io sono Cinese.", "Sono cinese.", "国籍要小写；主语 io 一般省略。"],
    ["Sono vent'anni.", "Ho vent'anni.", "年龄用 avere：\"我有二十年\"。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我饿了", "opts": ["Sono fame.", "Ho fame.", "Faccio fame."], "a": 1},
    {"k": "pick", "q": "她是意大利人", "opts": ["Lei è italiano.", "Lei è italiana.", "Lei ha italiana."], "a": 1, "why": "女性用 italiana。"},
    {"k": "pick", "q": "noi + essere = ?", "opts": ["siamo", "sono", "abbiamo"], "a": 0},
    {"k": "pick", "q": "loro + avere = ?", "opts": ["hanno", "ho", "sono"], "a": 0},
    {"k": "order", "it": "lei ha vent'anni", "zh": "她二十岁。"},
    {"k": "order", "it": "noi siamo studenti", "zh": "我们是学生。"}
  ]
});
