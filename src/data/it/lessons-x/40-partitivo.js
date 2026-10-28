/* Lezione 40 · 一些：del、dei、delle（部分冠词）. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "partitivo",
  "n": 40,
  "title": "一些：del、dei、delle（部分冠词）",
  "goal": "会说\"一些面包、一些朋友\"，知道什么时候用部分冠词，什么时候什么都不加。",
  "body": [
    "**部分冠词**表示\"一些、一点\"：**del** pane（一点面包）、**dello** zucchero、**della** frutta、**dei** libri（一些书）、**degli** amici、**delle** case。形式是 **di + 定冠词**。",
    "它是不定冠词 un / una 的**复数**：un libro → **dei** libri（一本书 → 一些书）；una casa → **delle** case。",
    "可以用 **un po' di**（一点）和 **qualche** 代替：Vuoi **un po' di** pane? / Ho **qualche** amico。",
    "**否定句**里一般**不用**部分冠词：Ho dei libri（我有一些书）→ **Non** ho libri（我没有书）。问句里也常常省略：Hai amici a Roma?",
    "**不用**部分冠词的情况：数词后面（due libri），以及泛指或说职业身份时：Sono studente。"
  ],
  "pattern": ["del / dello / della + 不可数名词", "dei / degli / delle + 复数名词"],
  "ex": [
    ["Vuoi del pane?", "你要一点面包吗？"],
    ["Ho dei libri interessanti.", "我有一些有意思的书。"],
    ["Compro della frutta.", "我买一些水果。"],
    ["Ci sono degli amici a casa.", "家里有几个朋友。"],
    ["Non ho libri.", "我没有书。"],
    ["Prendo delle mele.", "我拿几个苹果。"]
  ],
  "dlg": [
    ["A", "Che cosa compri?", "你买什么？"],
    ["B", "Compro del pane e della frutta.", "我买一点面包和水果。"],
    ["A", "Prendi anche dei biscotti?", "也拿一些饼干吗？"],
    ["B", "Sì, e delle mele.", "要，还要几个苹果。"]
  ],
  "traps": [
    ["Non ho dei libri.", "Non ho libri.", "否定句里一般不用部分冠词。"],
    ["Compro dei frutta.", "Compro della frutta.", "frutta 是阴性单数，所以是 della。"],
    ["Ho dei due libri.", "Ho due libri.", "数词后面不用部分冠词。"]
  ],
  "quiz": [
    {"k": "pick", "q": "你要一点面包吗？", "opts": ["Vuoi del pane?", "Vuoi dei pane?", "Vuoi della pane?"], "a": 0},
    {"k": "pick", "q": "我没有书", "opts": ["Non ho libri.", "Non ho dei libri.", "Non ho dei libro."], "a": 0},
    {"k": "buco", "it": "Compro ___ mele.", "opts": ["delle", "dei", "della"], "a": 0},
    {"k": "pick", "q": "dei amici 对吗？", "opts": ["不对，应该是 degli amici", "对", "应该是 delli amici"], "a": 0},
    {"k": "order", "it": "vuoi del pane", "zh": "你要一点面包吗？"}
  ]
});
