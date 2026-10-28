/* Corso di italiano per chi parla cinese · lezione 15 · 自己对自己做的事：反身动词.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "riflessivi",
  "n": 15,
  "title": "自己对自己做的事：反身动词",
  "goal": "会说\"我七点起床\"、\"我叫马可\"。",
  "body": [
    "很多日常动作在意大利语里是**反身动词**，好像\"把自己叫醒、把自己洗干净\"：**svegliarsi**（醒来）、**alzarsi**（起床）、**lavarsi**（洗）、**vestirsi**（穿衣服）、**chiamarsi**（名字叫）。",
    "反身代词跟着主语变：**mi、ti、si、ci、vi、si**，放在动词前面：**Mi alzo alle sette.**（我七点起床。）**Come ti chiami?**（你叫什么名字？）",
    "不定式时 -si 接在后面：Devo **alzarmi** presto.（我得早起。）",
    "近过去时用 **essere**，分词和主语一致：**Mi sono alzato**（男）、**Mi sono alzata**（女）。",
    "和汉语对照：汉语\"我叫马可\"没有\"自己\"，意大利语却说 **Mi chiamo Marco**（我把自己叫作马可）。这些动词要整个记下来。"
  ],
  "pattern": ["mi · ti · si · ci · vi · si + 动词", "mi sono alzato / alzata"],
  "ex": [
    ["Mi chiamo Anna.", "我叫安娜。"],
    ["A che ora ti svegli?", "你几点醒？"],
    ["Mi alzo alle sette.", "我七点起床。"],
    ["Ci vediamo domani.", "我们明天见。"],
    ["Stamattina mi sono svegliata tardi.", "今天早上我醒得很晚。（女）"],
    ["Mi lavo.", "我洗漱。"],
    ["Si chiama Luca.", "他叫卢卡。"]
  ],
  "dlg": [
    ["A", "A che ora ti alzi?", "你几点起床？"],
    ["B", "Mi alzo alle sette.", "我七点起床。"],
    ["A", "Ci vediamo domani?", "我们明天见面吗？"],
    ["B", "Sì, ci vediamo domani.", "好，明天见。"]
  ],
  "traps": [
    ["Io chiamo Marco.", "Mi chiamo Marco.", "\"叫……名字\"是反身动词 chiamarsi。"],
    ["Mi ho alzato.", "Mi sono alzato.", "反身动词的近过去时用 essere。"],
    ["Lei si è alzato.", "Lei si è alzata.", "用 essere 时分词和主语一致。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我叫马可", "opts": ["Io chiamo Marco.", "Mi chiamo Marco.", "Mi chiama Marco."], "a": 1},
    {"k": "pick", "q": "你几点起床？", "opts": ["A che ora ti alzi?", "A che ora alzi?", "A che ora si alzi?"], "a": 0},
    {"k": "pick", "q": "她今天起得早（近过去时）", "opts": ["Si è alzato presto.", "Si è alzata presto.", "Si ha alzata presto."], "a": 1},
    {"k": "pick", "q": "Ci vediamo domani. 是什么意思？", "opts": ["我们明天见。", "我们昨天见了。", "你明天来看我们。"], "a": 0},
    {"k": "order", "it": "mi alzo alle sette", "zh": "我七点起床。"}
  ]
});
