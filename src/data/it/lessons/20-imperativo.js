/* Corso di italiano per chi parla cinese · lezione 20 · 请你……：命令式.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "imperativo",
  "n": 20,
  "title": "请你……：命令式",
  "goal": "会说\"进来！\"、\"请坐\"、\"别走\"。",
  "body": [
    "叫别人做事用**命令式**。对\"你\"：-are 动词变 **-a**（parla! guarda!），-ere、-ire 动词变 **-i**（prendi! senti!）。对\"你们\"：和现在时一样（parlate! prendete!）。对\"我们\"：Andiamo!（我们走吧！）",
    "常用的不规则命令式：**va'**（去）、**fa'**（做）、**da'**（给）、**di'**（说）、**sta'**（待着）。",
    "**否定**对\"你\"用 **non + 不定式**：**Non parlare!**（别说话！）**Non preoccuparti!**（别担心！）",
    "代词接在命令式后面：**Dimmi!**（告诉我！）**Aspettami!**（等等我！）**Siediti!**（坐下！）",
    "对不熟的人用**尊称 Lei**，形式不一样：**Prego, si accomodi.**（请坐。）**Mi scusi.**（对不起，打扰一下。）见第 30 课。"
  ],
  "pattern": ["parla! · prendi! · senti!", "non + 不定式：non parlare!"],
  "ex": [
    ["Vieni qui!", "过来！"],
    ["Aspettami!", "等等我！"],
    ["Non preoccuparti!", "别担心！"],
    ["Andiamo!", "我们走吧！"],
    ["Prego, si accomodi.", "请坐。（对您）"]
  ],
  "traps": [
    ["Non parla!", "Non parlare!", "对\"你\"的否定命令用 non + 不定式。"],
    ["Mi aspetta!", "Aspettami!", "代词接在命令式后面。"],
    ["Prendo il libro! (命令)", "Prendi il libro!", "-ere 动词的命令式是 -i。"]
  ],
  "quiz": [
    {"k": "pick", "q": "别说话！（对你）", "opts": ["Non parla!", "Non parlare!", "Non parli!"], "a": 1},
    {"k": "pick", "q": "等等我！", "opts": ["Mi aspetta!", "Aspettami!", "Aspetta mi!"], "a": 1},
    {"k": "pick", "q": "我们走吧！", "opts": ["Andiamo!", "Andate!", "Va'!"], "a": 0},
    {"k": "pick", "q": "Si accomodi. 是对谁说的？", "opts": ["对朋友", "对您（尊称）", "对孩子们"], "a": 1},
    {"k": "order", "it": "non preoccuparti", "zh": "别担心！"}
  ]
});
