/* Corso di italiano per chi parla cinese · lezione 12 · 过去的习惯和背景：未完成过去时.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "imperfetto",
  "n": 12,
  "title": "过去的习惯和背景：未完成过去时",
  "goal": "会说\"小时候我常常……\"、\"那时候在下雨\"。",
  "body": [
    "意大利语有两个常用的过去时。**近过去时**（第 9 课）说**完成了的事**：Ieri ho mangiato la pizza.（昨天我吃了披萨。）",
    "**未完成过去时**（imperfetto）说过去的**习惯**、**背景**和**正在进行的事**：Da bambino **mangiavo** sempre la pizza.（小时候我总是吃披萨。）",
    "构成很规则：去掉 -re，加 **-vo、-vi、-va、-vamo、-vate、-vano**：parlare → **parlavo**，avere → **avevo**，dormire → **dormivo**。essere 不规则：**ero、eri、era、eravamo、eravate、erano**。",
    "一句话里常常两个一起用：**Mentre dormivo, è arrivato Marco.**（我正在睡觉的时候，马可到了。）背景用未完成过去时，突然发生的事用近过去时。",
    "和汉语对照：汉语用\"常常、以前、那时候、正在\"表示的过去，意大利语多半用未完成过去时；\"了\"表示的完成用近过去时。"
  ],
  "pattern": ["parlare → parlavo · parlavi · parlava", "essere → ero · eri · era"],
  "ex": [
    ["Da bambino giocavo a calcio.", "小时候我踢足球。"],
    ["Quando ero in Cina, mangiavo spesso i ravioli.", "我在中国的时候，常常吃饺子。"],
    ["Pioveva e faceva freddo.", "那时候在下雨，天很冷。"],
    ["Mentre leggevo, è squillato il telefono.", "我在看书的时候，电话响了。"],
    ["Prima abitavamo a Milano.", "以前我们住在米兰。"],
    ["Ero stanco.", "我那时很累。"],
    ["Mangiavamo sempre insieme.", "我们总是一起吃饭。"]
  ],
  "dlg": [
    ["A", "Dove abitavi da bambino?", "你小时候住在哪里？"],
    ["B", "Abitavo a Milano.", "我住在米兰。"],
    ["A", "Che cosa facevi?", "你那时候做什么？"],
    ["B", "Giocavo a calcio ogni giorno.", "我每天踢足球。"]
  ],
  "traps": [
    ["Da bambino ho giocato sempre a calcio.", "Da bambino giocavo sempre a calcio.", "过去的习惯用未完成过去时。"],
    ["Mentre ho dormito, è arrivato Marco.", "Mentre dormivo, è arrivato Marco.", "背景（正在睡觉）用未完成过去时。"],
    ["Io essevo a casa.", "Io ero a casa.", "essere 的未完成过去时不规则：ero。"]
  ],
  "quiz": [
    {"k": "pick", "q": "小时候我常常看电视", "opts": ["Da bambino ho guardato spesso la TV.", "Da bambino guardavo spesso la TV.", "Da bambino guarderò la TV."], "a": 1},
    {"k": "pick", "q": "essere 的未完成过去时（我）", "opts": ["ero", "essevo", "sono stato"], "a": 0},
    {"k": "pick", "q": "\"我在吃饭的时候，他来了。\"背景部分用哪个？", "opts": ["ho mangiato", "mangiavo", "mangerò"], "a": 1, "why": "正在进行的背景用未完成过去时。"},
    {"k": "pick", "q": "Prima abitavo a Roma. 是什么意思？", "opts": ["我以前住在罗马。", "我将来住在罗马。", "我刚到罗马。"], "a": 0},
    {"k": "order", "it": "prima abitavamo a Milano", "zh": "以前我们住在米兰。"}
  ]
});
