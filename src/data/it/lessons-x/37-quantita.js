/* Lezione 37 · 数量：qualche、alcuni、ogni、tutti、nessuno. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "quantita",
  "n": 37,
  "title": "数量：qualche、alcuni、ogni、tutti、nessuno",
  "goal": "会说\"几个、一些、每个、所有、没有一个\"，分清单数和复数。",
  "body": [
    "**qualche** = **几个、一些**，后面**必须用单数名词**：qualche amico（几个朋友）、qualche giorno。**alcuni / alcune** 意思一样，后面用**复数**：alcuni amici，alcune case。",
    "**un po' di** = 一点（不可数）：un po' **di** pane，un po' **di** tempo。",
    "**ogni** = **每**，后面用**单数**且不变：**ogni** giorno（每天）、**ogni** volta（每次）。",
    "**tutti / tutte** = **所有的**，后面加定冠词：**tutti gli** studenti（所有学生）、**tutte le** case。**tutto il** giorno = 一整天。",
    "**nessuno / nessun** = **没有一个**，句子里需要 non：**Non** c'è **nessuno** = 没有人；**Non** ho **nessun** amico = 我没有一个朋友。汉语的\"没有人\"在意大利语里是双重否定。"
  ],
  "pattern": ["qualche + 单数名词", "alcuni + 复数名词", "ogni + 单数名词"],
  "ex": [
    ["Ho qualche amico a Roma.", "我在罗马有几个朋友。"],
    ["Ci sono alcuni studenti.", "有一些学生。"],
    ["Ogni giorno studio un'ora.", "我每天学一个小时。"],
    ["Tutti gli studenti sono qui.", "所有学生都在这里。"],
    ["Vuoi un po' di pane?", "你要一点面包吗？"],
    ["Non c'è nessuno.", "没有人。"]
  ],
  "dlg": [
    ["A", "Hai amici a Roma?", "你在罗马有朋友吗？"],
    ["B", "Sì, ho qualche amico.", "有，我有几个朋友。"],
    ["A", "Li vedi spesso?", "你常见他们吗？"],
    ["B", "Quasi ogni settimana.", "差不多每个星期都见。"]
  ],
  "traps": [
    ["Ho qualche amici.", "Ho qualche amico.", "qualche 后面用单数名词。"],
    ["Ogni giorni studio.", "Ogni giorno studio.", "ogni 后面用单数。"],
    ["Ho nessuno amico.", "Non ho nessun amico.", "nessuno 放在动词后面时前面要有 non。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我有几个朋友", "opts": ["Ho qualche amico.", "Ho qualche amici.", "Ho qualche di amici."], "a": 0},
    {"k": "pick", "q": "我每天学习", "opts": ["Ogni giorno studio.", "Ogni giorni studio.", "Ogni il giorno studio."], "a": 0},
    {"k": "buco", "it": "Non c'è ___.", "opts": ["nessuno", "qualche", "ogni"], "a": 0},
    {"k": "pick", "q": "所有学生都在这里", "opts": ["Tutti gli studenti sono qui.", "Tutti studenti sono qui.", "Tutto gli studenti sono qui."], "a": 0},
    {"k": "order", "it": "ho qualche amico a roma", "zh": "我在罗马有几个朋友。"}
  ]
});
