/* Lezione 45 · 到某人那儿：da + 人. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "da-persona",
  "n": 45,
  "title": "到某人那儿：da + 人",
  "goal": "会说\"去医生那儿、在朋友家、从他那儿来\"。",
  "body": [
    "**da** 后面接**人**，表示\"**到某人那里、在某人家里/店里**\"：Vado **da** Marco（我去马可家）；Sono **dal** dottore（我在医生那儿）；Mangio **da** mia madre（我在我妈妈家吃饭）。",
    "对应汉语的\"……那儿/……家\"：da Marco = 马可那儿；**dal** parrucchiere = 理发师那儿；**dalla** nonna = 奶奶那儿。da + 定冠词要合成：dal、dalla、dai、dalle、dall'。",
    "去**地方**用 a / in，去**人**或**他的店**用 da：**Vado al** bar（去咖啡馆）；**Vado dal** dentista（去牙医那儿）。",
    "**da** 也表示\"**从……**\"（来自）：Vengo **da** Roma（我从罗马来），Vengo **da** Marco（我从马可那儿来）。",
    "和\"来自\"一起：**Di dove sei?** 你是哪里人（出生地）；**Da dove vieni?** 你从哪里来（刚从哪里到）。"
  ],
  "pattern": ["andare / stare + da + 人", "andare + dal / dalla + 职业"],
  "ex": [
    ["Vado da Marco.", "我去马可家。"],
    ["Sono dal dottore.", "我在医生那儿。"],
    ["Mangio da mia madre.", "我在我妈妈家吃饭。"],
    ["Vado dal dentista domani.", "我明天去牙医那儿。"],
    ["Vengo dalla nonna.", "我从奶奶那儿来。"],
    ["Stasera ceniamo da noi.", "今晚我们在家吃晚饭。"]
  ],
  "dlg": [
    ["A", "Dove sei?", "你在哪儿？"],
    ["B", "Sono dal dentista.", "我在牙医那儿。"],
    ["A", "Stasera vieni da noi?", "今晚你来我们家吗？"],
    ["B", "Sì, vengo da voi alle otto.", "好，我八点到你们家。"]
  ],
  "traps": [
    ["Vado a Marco.", "Vado da Marco.", "\"去某人那儿\"用 da。"],
    ["Sono al dottore.", "Sono dal dottore.", "在医生那儿用 da + il = dal。"],
    ["Vado da il dentista.", "Vado dal dentista.", "da + il 要合成 dal。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我去马可家", "opts": ["Vado da Marco.", "Vado a Marco.", "Vado in Marco."], "a": 0},
    {"k": "pick", "q": "我在医生那儿", "opts": ["Sono dal dottore.", "Sono al dottore.", "Sono da il dottore."], "a": 0},
    {"k": "buco", "it": "Vengo ___ nonna.", "opts": ["dalla", "della", "alla"], "a": 0},
    {"k": "pick", "q": "da + il =", "opts": ["dal", "del", "al"], "a": 0},
    {"k": "order", "it": "stasera vieni da noi", "zh": "今晚你来我们家吗？"}
  ]
});
