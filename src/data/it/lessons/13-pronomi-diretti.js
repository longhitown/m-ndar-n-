/* Corso di italiano per chi parla cinese · lezione 13 · 代替东西和人：直接宾语代词.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "pronomi-diretti",
  "n": 13,
  "title": "代替东西和人：直接宾语代词",
  "goal": "会说\"我买了它\"、\"我认识他\"。",
  "body": [
    "不想重复前面说过的东西或人，就用**直接宾语代词**：**mi**（我）、**ti**（你）、**lo**（他、它，阳性）、**la**（她、它，阴性）、**ci**（我们）、**vi**（你们）、**li**（他们，阳性）、**le**（她们，阴性）。",
    "代词放在**变位动词前面**，和汉语的语序不一样：Vedo Marco → **Lo vedo.**（我看见他。）汉语说\"我看见他\"，意大利语说\"他我看见\"。",
    "动词是不定式时，代词**接在后面**：Voglio vederlo / **Lo voglio vedere**（两种都对）。",
    "近过去时里，lo、la 在 h 前面省略成 **l'**，而且分词要和代词一致：Ho comprato la mela → **L'ho comprata.**（我买了它。）",
    "否定时 non 放在代词前面：**Non lo so.**（我不知道。）这是最常用的句子之一。"
  ],
  "pattern": ["lo · la · li · le + 动词", "l'ho comprato / l'ho comprata"],
  "ex": [
    ["Conosci Marco? Sì, lo conosco.", "你认识马可吗？认识。"],
    ["Dov'è la chiave? Non la trovo.", "钥匙在哪儿？我找不到。"],
    ["Ti amo.", "我爱你。"],
    ["Il libro? L'ho comprato ieri.", "那本书？我昨天买的。"],
    ["Non lo so.", "我不知道。"],
    ["Li conosco.", "我认识他们。"],
    ["Lo vedo.", "我看见他了。"]
  ],
  "dlg": [
    ["A", "Conosci Marco?", "你认识马可吗？"],
    ["B", "Sì, lo conosco.", "认识，我认识他。"],
    ["A", "Hai comprato il libro?", "你买书了吗？"],
    ["B", "Sì, l'ho comprato ieri.", "买了，我昨天买的。"]
  ],
  "traps": [
    ["Vedo lo.", "Lo vedo.", "代词放在变位动词前面。"],
    ["La ho comprata.", "L'ho comprata.", "la 在 ho 前面省略成 l'。"],
    ["Lo ho visto Maria.", "L'ho vista.", "Maria 是阴性，用 la，分词也要变成 vista。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我认识他", "opts": ["Conosco lo.", "Lo conosco.", "Gli conosco."], "a": 1},
    {"k": "pick", "q": "我买了它（la torta 蛋糕）", "opts": ["L'ho comprato.", "L'ho comprata.", "La ho comprato."], "a": 1, "why": "torta 是阴性：L'ho comprata。"},
    {"k": "pick", "q": "我不知道", "opts": ["Non lo so.", "Lo non so.", "Non so lo."], "a": 0},
    {"k": "pick", "q": "Ti amo. 是什么意思？", "opts": ["我爱你。", "你爱我。", "我爱他。"], "a": 0},
    {"k": "order", "it": "non la trovo", "zh": "我找不到它（钥匙）。"}
  ]
});
