/* Lezione 38 · 带介词的疑问句. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "domande-prep",
  "n": 38,
  "title": "带介词的疑问句",
  "goal": "会问\"跟谁、给谁、谁的、从哪里、多久了\"，把介词放在疑问词前面。",
  "body": [
    "意大利语的疑问词**前面带着介词**，而汉语是把\"跟谁\"放在动词前：**Con chi** parli? = 你在跟谁说话？介词**不能留到句尾**：不说 Chi parli con?",
    "常用的：**con chi**（跟谁）、**a chi**（给谁）、**di chi**（谁的）、**da dove**（从哪里）、**per chi**（给谁、为谁）、**per che cosa**（为了什么）。",
    "问所属用 **di chi**：**Di chi** è questo libro? = 这是谁的书？回答：È **di** Marco / È **mio**。",
    "问多久：**da quanto tempo**（已经多久了，持续到现在）：**Da quanto tempo** studi italiano? ；**quanto tempo**（需要多长时间）：**Quanto tempo** ci vuole? = 需要多久？",
    "问地点和来源：**Dove** vai? 去哪儿；**Da dove** vieni? 你从哪里来；**Di dove** sei? 你是哪里人。"
  ],
  "pattern": ["con chi / a chi / di chi", "da dove / da quanto tempo", "+ 动词 + ?"],
  "ex": [
    ["Con chi parli?", "你在跟谁说话？"],
    ["A chi telefoni?", "你给谁打电话？"],
    ["Di chi è questo libro?", "这是谁的书？"],
    ["Da dove vieni?", "你从哪里来？"],
    ["Da quanto tempo studi italiano?", "你学意大利语多久了？"],
    ["Per chi è questo regalo?", "这个礼物是给谁的？"]
  ],
  "dlg": [
    ["A", "Con chi vai al cinema?", "你跟谁去看电影？"],
    ["B", "Vado con Anna.", "我跟安娜去。"],
    ["A", "Di dove è Anna?", "安娜是哪里人？"],
    ["B", "È di Milano. Vive qui da due anni.", "她是米兰人。她在这里住了两年了。"]
  ],
  "traps": [
    ["Chi parli con?", "Con chi parli?", "介词要放在疑问词前面，不能放在句尾。"],
    ["Chi è questo libro?", "Di chi è questo libro?", "问\"谁的\"用 di chi。"],
    ["Dove vieni da?", "Da dove vieni?", "介词 da 要放在 dove 前面。"]
  ],
  "quiz": [
    {"k": "pick", "q": "你在跟谁说话？", "opts": ["Con chi parli?", "Chi parli con?", "Chi con parli?"], "a": 0},
    {"k": "pick", "q": "这是谁的书？", "opts": ["Di chi è questo libro?", "Chi è questo libro?", "Che è questo libro?"], "a": 0},
    {"k": "buco", "it": "___ dove vieni?", "opts": ["Da", "In", "Per"], "a": 0},
    {"k": "pick", "q": "你学意大利语多久了？", "opts": ["Da quanto tempo studi italiano?", "Quanto tempo da studi italiano?", "Per quanto studi italiano da?"], "a": 0},
    {"k": "order", "it": "con chi vai al cinema", "zh": "你跟谁去看电影？"}
  ]
});
