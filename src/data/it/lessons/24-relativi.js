/* Corso di italiano per chi parla cinese · lezione 24 · ……的人、……的东西：关系代词 che 和 cui.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "relativi",
  "n": 24,
  "title": "……的人、……的东西：关系代词 che 和 cui",
  "goal": "会说\"我昨天买的书\"、\"我说的那个人\"。",
  "body": [
    "汉语用\"的\"把一句话放在名词前面（我昨天买**的**书），意大利语把这句话放在名词**后面**，用 **che** 连接：**il libro che ho comprato ieri**。",
    "**che** 可以当主语也可以当宾语，不变：**la ragazza che parla**（说话的女孩），**la ragazza che conosco**（我认识的女孩）。",
    "前面有介词时用 **cui**：**la persona di cui parlo**（我说的那个人），**la città in cui abito**（我住的城市），**l'amico a cui ho scritto**（我写信给他的那个朋友）。",
    "汉语里很长的定语（穿红衣服的那个女孩）在意大利语里都放后面：**la ragazza che porta il vestito rosso**。",
    "提示：先说名词，再说\"che + 句子\"，不要按汉语的顺序翻。"
  ],
  "pattern": ["名词 + che + 句子", "名词 + 介词 + cui + 句子"],
  "ex": [
    ["Il libro che ho comprato ieri è bello.", "我昨天买的书很好看。"],
    ["La ragazza che parla è mia sorella.", "说话的那个女孩是我妹妹。"],
    ["Questa è la città in cui abito.", "这是我住的城市。"],
    ["È la persona di cui ti ho parlato.", "就是我跟你说过的那个人。"],
    ["Il film che abbiamo visto era lungo.", "我们看的电影很长。"]
  ],
  "traps": [
    ["Ho comprato ieri il libro è bello.", "Il libro che ho comprato ieri è bello.", "要用 che 连接，名词放前面。"],
    ["La città che abito.", "La città in cui abito.", "abitare in：前面有介词，用 in cui。"],
    ["La persona che parlo di.", "La persona di cui parlo.", "介词放在 cui 前面。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我昨天看的电影", "opts": ["il film che ho visto ieri", "il film ho visto ieri", "ieri ho visto il film che"], "a": 0},
    {"k": "pick", "q": "我住的城市", "opts": ["la città che abito", "la città in cui abito", "la città cui abito in"], "a": 1},
    {"k": "pick", "q": "说话的女孩", "opts": ["la ragazza che parla", "la ragazza cui parla", "che parla la ragazza"], "a": 0},
    {"k": "pick", "q": "la persona di cui parlo 是什么意思？", "opts": ["我说的那个人", "跟我说话的人", "说我的人"], "a": 0},
    {"k": "order", "it": "questa è la città in cui abito", "zh": "这是我住的城市。"}
  ]
});
