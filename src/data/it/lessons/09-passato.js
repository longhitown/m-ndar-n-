/* Corso di italiano per chi parla cinese · lezione 9 · 说过去的事：近过去时.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "passato",
  "n": 9,
  "title": "说过去的事：近过去时",
  "goal": "会说\"我吃了\"、\"我去了\"、\"我去过\"。",
  "body": [
    "说已经完成的事，用**近过去时**（passato prossimo）：**avere 或 essere 的现在时 + 过去分词**。Ho mangiato（我吃了），Sono andato（我去了）。",
    "过去分词：-are → **-ato**（mangiare → mangiato），-ere → **-uto**（avere → avuto），-ire → **-ito**（dormire → dormito）。很多常用动词不规则：fare → fatto，bere → bevuto，vedere → visto，prendere → preso，leggere → letto，scrivere → scritto。",
    "大多数动词用 **avere**。表示**移动或变化**的动词（andare、venire、tornare、arrivare、partire、uscire、entrare）和**反身动词**（alzarsi）用 **essere**。",
    "用 essere 的时候，分词要和主语**一致**：lui è andat**o**，lei è andat**a**，loro sono andat**i**。",
    "和汉语对照：\"了\"一般翻成近过去时；表示经历的\"过\"也用近过去时，常加 già 或 mai：Sei mai stato in Cina? = 你去过中国吗？"
  ],
  "pattern": ["ho · hai · ha … + mangiato", "sono · sei · è … + andato / andata"],
  "ex": [
    ["Ho mangiato.", "我吃了。"],
    ["Ho comprato un libro.", "我买了一本书。"],
    ["Lui è andato a Shanghai.", "他去了上海。"],
    ["Lei è arrivata.", "她到了。"],
    ["Abbiamo mangiato i ravioli.", "我们吃了饺子。"],
    ["Sei mai stato/a in Cina?", "你去过中国吗？（问男性说 stato，问女性说 stata）"],
    ["Ho studiato italiano.", "我学了意大利语。"],
    ["Siamo arrivati.", "我们到了。"]
  ],
  "dlg": [
    ["A", "Dove sei andato?", "你去哪儿了？"],
    ["B", "Sono andato al ristorante.", "我去了饭店。"],
    ["A", "Che cosa hai mangiato?", "你吃了什么？"],
    ["B", "Ho mangiato i ravioli.", "我吃了饺子。"]
  ],
  "traps": [
    ["Sono mangiato.", "Ho mangiato.", "mangiare 用 avere。"],
    ["Ho andato.", "Sono andato.", "andare 表示移动，用 essere。"],
    ["Lei è andato.", "Lei è andata.", "用 essere 时，分词跟主语一致。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我吃了", "opts": ["Sono mangiato.", "Ho mangiato.", "Ho mangiare."], "a": 1},
    {"k": "pick", "q": "她去了", "opts": ["Lei è andato.", "Lei è andata.", "Lei ha andata."], "a": 1},
    {"k": "pick", "q": "fare 的过去分词是？", "opts": ["fato", "fatto", "fareto"], "a": 1},
    {"k": "pick", "q": "哪个动词用 essere？", "opts": ["mangiare", "arrivare", "comprare"], "a": 1, "why": "arrivare（到达）表示移动。"},
    {"k": "order", "it": "ho comprato un libro", "zh": "我买了一本书。"}
  ]
});
