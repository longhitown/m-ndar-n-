/* Lezione 41 · 介词后面的"我、你、他"：me、te、lui. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "pronomi-tonici",
  "n": 41,
  "title": "介词后面的\"我、你、他\"：me、te、lui",
  "goal": "会说\"和我、给你、从他那儿\"，不再说 con io 或 per tu。",
  "body": [
    "介词后面不能用 io、tu，要用**重读代词**：**me**（我）、**te**（你）、**lui**（他）、**lei**（她）、**noi**（我们）、**voi**（你们）、**loro**（他们）。",
    "**con me**（和我）、**per te**（给你）、**da lui**（从他那里）、**di noi**（我们的）、**senza di me / senza me**（没有我）。",
    "**注意**：只有 me 和 te 和主语形式 io、tu 不一样；lui、lei、noi、voi、loro 和主语形式一样，所以不会错。",
    "重读代词也用在**强调**或对比时：**Io** vado，**tu** resti（我去，你留下）；**A me** piace il tè（我，我喜欢茶）。",
    "**mi / ti**（轻读）放在动词前：Mi dici la verità（你对我说实话）；**重读 me / te** 放在介词后或强调：Dillo a **me**（对我说）。"
  ],
  "pattern": ["con / per / da + me / te / lui / lei", "a me / a te"],
  "ex": [
    ["Vieni con me?", "你跟我一起去吗？"],
    ["Questo regalo è per te.", "这个礼物是给你的。"],
    ["Vado da lui.", "我去他那儿。"],
    ["Parlo di te.", "我在说你。"],
    ["Senza di me non vai.", "没有我你不去。"],
    ["A me piace il tè.", "我喜欢茶。"]
  ],
  "dlg": [
    ["A", "Vieni con me al cinema?", "你跟我一起去看电影吗？"],
    ["B", "Sì, vengo con te.", "好，我跟你去。"],
    ["A", "Anna viene con noi?", "安娜跟我们一起吗？"],
    ["B", "No, va da lui.", "不，她去他那儿。"]
  ],
  "traps": [
    ["Vieni con io?", "Vieni con me?", "介词后面不能用 io，要用 me。"],
    ["Questo è per tu.", "Questo è per te.", "介词后面不能用 tu，要用 te。"],
    ["Parlo di tu.", "Parlo di te.", "介词 di 后面用 te，不用 tu。"]
  ],
  "quiz": [
    {"k": "pick", "q": "你跟我一起来吗？", "opts": ["Vieni con me?", "Vieni con io?", "Vieni con mi?"], "a": 0},
    {"k": "pick", "q": "这是给你的", "opts": ["È per te.", "È per tu.", "È per ti."], "a": 0},
    {"k": "buco", "it": "Vado ___ lui.", "opts": ["da", "con io", "per tu"], "a": 0},
    {"k": "pick", "q": "我，我喜欢茶（强调）", "opts": ["A me piace il tè.", "A io piace il tè.", "Me piace il tè."], "a": 0},
    {"k": "order", "it": "vieni con me al cinema", "zh": "你跟我一起去看电影吗？"}
  ]
});
