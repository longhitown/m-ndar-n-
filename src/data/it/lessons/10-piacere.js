/* Corso di italiano per chi parla cinese · lezione 10 · 我喜欢：mi piace.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "piacere",
  "n": 10,
  "title": "我喜欢：mi piace",
  "goal": "会说喜欢什么、不喜欢什么。",
  "body": [
    "汉语说\"我喜欢茶\"，意大利语说 **Mi piace il tè**，字面意思是\"茶让我喜欢\"：**被喜欢的东西是主语**。喜欢的人用 mi（我）、ti（你）、gli（他）、le（她）、ci（我们）、vi（你们）、gli（他们）。",
    "所以动词跟着**被喜欢的东西**变：一样东西用 **piace**（Mi piace il tè），几样东西用 **piacciono**（Mi piacciono i cani）。",
    "喜欢做某事：**Mi piace + 动词原形**。Mi piace cucinare = 我喜欢做饭。",
    "否定：**Non mi piace**。\"我也喜欢\"：**Anche a me piace**。",
    "东西前面一般要加定冠词：Mi piace **la** musica，Mi piacciono **i** gatti。"
  ],
  "pattern": ["mi · ti · gli · le …", "piace · piacciono", "+ 东西"],
  "ex": [
    ["Mi piace il tè.", "我喜欢茶。"],
    ["Mi piacciono i cani.", "我喜欢狗。"],
    ["Non mi piacciono i gatti.", "我不喜欢猫。"],
    ["Mi piace cucinare.", "我喜欢做饭。"],
    ["Ti piace l'Italia?", "你喜欢意大利吗？"],
    ["Anche a me piace il tè.", "我也喜欢茶。"],
    ["Ti piace la pizza?", "你喜欢比萨吗？"],
    ["Mi piacciono i ravioli.", "我喜欢饺子。"]
  ],
  "dlg": [
    ["A", "Ti piace il tè?", "你喜欢茶吗？"],
    ["B", "Sì, mi piace il tè. E mi piacciono i ravioli.", "喜欢，我喜欢茶，也喜欢饺子。"],
    ["A", "Anche a me piacciono i ravioli!", "我也喜欢饺子！"],
    ["B", "Ti piace cucinare?", "你喜欢做饭吗？"],
    ["A", "Sì, mi piace cucinare.", "是的，我喜欢做饭。"]
  ],
  "traps": [
    ["Io piace il tè.", "Mi piace il tè.", "喜欢的人用 mi，不用 io。"],
    ["Mi piace i cani.", "Mi piacciono i cani.", "复数的东西用 piacciono。"],
    ["Mi piace tè.", "Mi piace il tè.", "东西前面要加定冠词。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我喜欢猫", "opts": ["Mi piace i gatti.", "Mi piacciono i gatti.", "Io piaccio i gatti."], "a": 1},
    {"k": "pick", "q": "我喜欢音乐", "opts": ["Mi piace la musica.", "Mi piacciono la musica.", "Io piace la musica."], "a": 0},
    {"k": "pick", "q": "Le piace cucinare. 是什么意思？", "opts": ["她喜欢做饭。", "我喜欢她做饭。", "他们喜欢做饭。"], "a": 0, "why": "le = 她（\"让她喜欢\"）。"},
    {"k": "pick", "q": "我不喜欢咖啡", "opts": ["Non mi piace il caffè.", "Mi non piace il caffè.", "Non piace mi il caffè."], "a": 0, "why": "non 放在最前面：Non mi piace。"},
    {"k": "order", "it": "mi piace il tè", "zh": "我喜欢茶。"}
  ]
});
