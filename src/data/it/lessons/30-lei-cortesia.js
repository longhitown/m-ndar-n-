/* Corso di italiano per chi parla cinese · lezione 30 · 礼貌地说话：尊称 Lei.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "lei-cortesia",
  "n": 30,
  "title": "礼貌地说话：尊称 Lei",
  "goal": "会对陌生人、老人、店员客气地说话。",
  "body": [
    "对**不熟的人、长辈、顾客、店员、老师**，意大利语用尊称 **Lei**（您），动词用**第三人称单数**：**Come sta?**（您好吗？）对朋友才用 tu：Come stai?",
    "尊称的代词也大写：**La** ringrazio（我感谢您），**Le** chiedo scusa（我向您道歉），**Suo**（您的）。",
    "常用客气话：**Buongiorno**（上午和下午都可以用）、**Buonasera**（傍晚以后）、**Per favore / Per piacere**（请）、**Grazie mille**（太谢谢了）、**Prego**（不客气；请）、**Mi scusi**（打扰一下，对不起）、**Permesso?**（借过／可以进来吗？）。",
    "命令式也用 Lei 的形式：**Si accomodi**（请坐）、**Mi dica**（您说）、**Scusi**（对不起）、**Aspetti un attimo**（请稍等）。",
    "什么时候改用 tu？对方说 **Diamoci del tu!**（我们用\"你\"称呼吧！）就可以了。年轻人之间一般直接用 tu。"
  ],
  "pattern": ["Lei + 第三人称：Come sta? · Mi scusi", "tu：Come stai? · Scusa"],
  "ex": [
    ["Buongiorno, come sta?", "您好，您好吗？"],
    ["Mi scusi, dov'è la stazione?", "打扰一下，火车站在哪儿？"],
    ["Si accomodi, prego.", "请坐。"],
    ["La ringrazio molto.", "非常感谢您。"],
    ["Possiamo darci del tu?", "我们可以用\"你\"称呼吗？"]
  ],
  "traps": [
    ["Come stai? (a un professore)", "Come sta?", "对老师、长辈用 Lei：Come sta?"],
    ["Scusa, signora…", "Mi scusi, signora…", "对不熟的人用 Mi scusi。"],
    ["Ti ringrazio, dottore.", "La ringrazio, dottore.", "尊称用 La（您）。"]
  ],
  "quiz": [
    {"k": "pick", "q": "（对店员）打扰一下", "opts": ["Scusa!", "Mi scusi!", "Scusati!"], "a": 1},
    {"k": "pick", "q": "（对老人）您好吗？", "opts": ["Come stai?", "Come sta?", "Come state?"], "a": 1},
    {"k": "pick", "q": "请坐（对您）", "opts": ["Siediti.", "Si accomodi.", "Accomodati, Lei."], "a": 1},
    {"k": "pick", "q": "Diamoci del tu! 是什么意思？", "opts": ["我们用\"你\"称呼吧！", "请用\"您\"！", "我们走吧！"], "a": 0},
    {"k": "order", "it": "mi scusi dov'è la stazione", "zh": "打扰一下，火车站在哪儿？"}
  ]
});
