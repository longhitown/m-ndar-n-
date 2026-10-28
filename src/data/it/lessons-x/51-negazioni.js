/* Lezione 51 · 否定的各种说法：mai、niente、nessuno、più、neanche. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "negazioni",
  "n": 51,
  "title": "否定的各种说法：mai、niente、nessuno、più、neanche",
  "goal": "会说\"从来不、什么都没有、没有人、不再、也不\"，掌握意大利语的双重否定。",
  "body": [
    "意大利语里，否定词放在动词**后面**时，动词**前面必须加 non**：**Non** vedo **niente** = 我什么都没看见；**Non** viene **nessuno** = 没有人来；**Non** vado **mai** al cinema = 我从来不去看电影。",
    "常用的否定词：**niente / nulla**（什么都不）、**nessuno**（没有人）、**mai**（从来不）、**più**（不再）、**neanche / nemmeno**（连……也不）、**né … né**（既不……也不）。",
    "否定词放在**动词前面**时，**不用 non**：**Nessuno** viene = 没有人来；**Mai** ho visto una cosa così（我从来没见过这样的事，较书面）。",
    "**non … più** = 不再：**Non** fumo **più** = 我不再抽烟。**non … ancora** = 还没：Non ho **ancora** mangiato。",
    "**Neanche io**（我也不）用来回应否定句：Non parlo cinese. — **Neanche io**。汉语的\"也不\"在这里对应 neanche / nemmeno，不是 anche。"
  ],
  "pattern": ["non + 动词 + niente / nessuno / mai / più", "neanche io"],
  "ex": [
    ["Non vedo niente.", "我什么都没看见。"],
    ["Non viene nessuno.", "没有人来。"],
    ["Non vado mai al cinema.", "我从来不去看电影。"],
    ["Non fumo più.", "我不再抽烟。"],
    ["Non parlo cinese. — Neanche io.", "我不会说中文。——我也不会。"],
    ["Nessuno lo sa.", "没有人知道。"]
  ],
  "dlg": [
    ["A", "Vai spesso al cinema?", "你常去看电影吗？"],
    ["B", "No, non vado mai al cinema.", "不，我从来不去看电影。"],
    ["A", "Neanche io. Non mi piace.", "我也不去。我不喜欢。"],
    ["B", "Allora non andiamo più!", "那我们再也不去了！"]
  ],
  "traps": [
    ["Vedo niente.", "Non vedo niente.", "niente 在动词后面时，动词前要加 non。"],
    ["Non parlo anche cinese.", "Non parlo neanche cinese.", "否定句里\"连……也不\"用 neanche，不用 anche。"],
    ["Non nessuno viene.", "Non viene nessuno.", "nessuno 放在动词后面，前面要加 non，不能重复放在前面。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我什么都没看见", "opts": ["Non vedo niente.", "Vedo niente.", "Non vedo non niente."], "a": 0},
    {"k": "pick", "q": "没有人来", "opts": ["Non viene nessuno.", "Viene nessuno non.", "Non nessuno viene."], "a": 0},
    {"k": "buco", "it": "Non fumo ___.", "opts": ["più", "mai non", "nessuno"], "a": 0},
    {"k": "pick", "q": "我也不去（接别人的否定）", "opts": ["Neanche io.", "Anche io non.", "Io anche."], "a": 0},
    {"k": "order", "it": "non vado mai al cinema", "zh": "我从来不去看电影。"}
  ]
});
