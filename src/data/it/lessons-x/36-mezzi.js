/* Lezione 36 · 怎么去：in、a、con 和交通工具. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "mezzi",
  "n": 36,
  "title": "怎么去：in、a、con 和交通工具",
  "goal": "会说\"坐火车、开车、走路、骑自行车\"，不再说错 in treno / a piedi。",
  "body": [
    "说坐什么交通工具，用 **in** + 交通工具，**不加冠词**：**in** treno（坐火车）、**in** macchina（开车）、**in** autobus（坐公共汽车）、**in** aereo（坐飞机）、**in** bici（骑车）、**in** metropolitana（坐地铁）。",
    "**走路**是固定说法 **a piedi**：Vado al lavoro **a piedi**。骑马：a cavallo。",
    "也可以用 **con** + 冠词 + 交通工具：Vado **con il** treno。但 in treno 更常用；有具体指某一辆车时用 con：Vado a Roma **con la** macchina di Marco。",
    "**come** 是\"怎么\"：**Come** vai a scuola? = 你怎么去学校？回答：**In** autobus / **A** piedi。",
    "汉语\"坐\"、\"开\"、\"骑\"是不同的动词，意大利语一般只用 andare / venire + **in / a**，不用再翻译\"坐、开、骑\"。"
  ],
  "pattern": ["andare + in + 交通工具", "andare + a piedi"],
  "ex": [
    ["Vado a scuola in autobus.", "我坐公共汽车去学校。"],
    ["Viaggio in treno.", "我坐火车旅行。"],
    ["Vado al lavoro a piedi.", "我走路去上班。"],
    ["Andiamo a Roma in macchina.", "我们开车去罗马。"],
    ["Vengo in bici.", "我骑自行车来。"],
    ["Come vai a Milano?", "你怎么去米兰？"]
  ],
  "dlg": [
    ["A", "Come vai al lavoro?", "你怎么去上班？"],
    ["B", "Vado in metropolitana. E tu?", "我坐地铁去。你呢？"],
    ["A", "Io vado a piedi, abito vicino.", "我走路去，我住得近。"],
    ["B", "Beato te!", "你真幸运！"]
  ],
  "traps": [
    ["Vado a scuola con piedi.", "Vado a scuola a piedi.", "\"走路\"是固定说法 a piedi。"],
    ["Vado in il treno.", "Vado in treno.", "交通工具前一般不用冠词：in treno。"],
    ["Vado a autobus.", "Vado in autobus.", "坐交通工具用 in，不用 a。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我坐火车去罗马", "opts": ["Vado a Roma in treno.", "Vado a Roma a treno.", "Vado a Roma in il treno."], "a": 0},
    {"k": "pick", "q": "我走路去上班", "opts": ["Vado al lavoro a piedi.", "Vado al lavoro in piedi.", "Vado al lavoro con piedi."], "a": 0},
    {"k": "buco", "it": "Vengo ___ bici.", "opts": ["in", "a", "da"], "a": 0},
    {"k": "pick", "q": "你怎么去米兰？", "opts": ["Come vai a Milano?", "Quale vai a Milano?", "Che vai a Milano?"], "a": 0},
    {"k": "order", "it": "vado a scuola in autobus", "zh": "我坐公共汽车去学校。"}
  ]
});
