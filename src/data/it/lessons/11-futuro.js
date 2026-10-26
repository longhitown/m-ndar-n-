/* Corso di italiano per chi parla cinese · lezione 11 · 说将来的事：将来时.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "futuro",
  "n": 11,
  "title": "说将来的事：将来时",
  "goal": "会说\"我明天去\"、\"我们会到的\"。",
  "body": [
    "说将来的事，口语里常常直接用**现在时**加时间词：**Domani vado a Roma.**（我明天去罗马。）和汉语\"明天我去\"一样简单。",
    "要强调\"将来会\"，用**将来时**（futuro semplice）：去掉动词词尾的 -e，加上 **-ò、-ai、-à、-emo、-ete、-anno**。-are 动词的 a 变成 e：parlare → **parlerò**，mangiare → **mangerò**。",
    "常用的不规则将来时：essere → **sarò**，avere → **avrò**，andare → **andrò**，fare → **farò**，venire → **verrò**，potere → **potrò**，volere → **vorrò**。",
    "将来时还可以表示**猜测**：**Sarà a casa.** = 他大概在家吧。",
    "和汉语对照：\"会\"、\"要\"、\"将\"说将来时，一般都可以用将来时；但汉语的\"会\"表示能力（会说中文）时，意大利语用 **sapere**：So parlare cinese。"
  ],
  "pattern": ["parlare → parlerò · parlerai · parlerà", "essere → sarò · avere → avrò"],
  "ex": [
    ["Domani andrò a Roma.", "明天我会去罗马。"],
    ["Ti telefonerò stasera.", "我今天晚上给你打电话。"],
    ["Sarà difficile.", "会很难的。"],
    ["L'anno prossimo studieremo il cinese.", "明年我们要学中文。"],
    ["Che tempo farà domani?", "明天天气会怎么样？"],
    ["Sarà a casa.", "他大概在家吧。（猜测）"]
  ],
  "traps": [
    ["Domani andarò a Roma.", "Domani andrò a Roma.", "andare 的将来时不规则：andrò。"],
    ["Io mangiarò.", "Io mangerò.", "-are 动词的将来时 a 变成 e：mangerò。"],
    ["Io sarò sapere.", "Io saprò.", "sapere 的将来时是 saprò，不用 essere。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我明天会去（andare）", "opts": ["Domani andarò.", "Domani andrò.", "Domani vado andare."], "a": 1},
    {"k": "pick", "q": "parlare 的将来时（我）", "opts": ["parlarò", "parlerò", "parleró"], "a": 1, "why": "a 变 e，重音符号是 ò。"},
    {"k": "pick", "q": "essere 的将来时（他）", "opts": ["sarà", "esserà", "è stato"], "a": 0},
    {"k": "pick", "q": "Sarà a casa. 是什么意思？", "opts": ["他昨天在家。", "他大概在家吧。", "他不在家。"], "a": 1, "why": "将来时也表示猜测。"},
    {"k": "order", "it": "domani andrò a Roma", "zh": "明天我会去罗马。"}
  ]
});
