/* Corso di italiano per chi parla cinese · lezione 7 · 否定和提问.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "domande",
  "n": 7,
  "title": "否定和提问",
  "goal": "会说\"不\"，会问问题。",
  "body": [
    "否定很简单：在动词前面加 **non**。**Non** parlo italiano = 我不说意大利语。",
    "\"从来不\"、\"什么也不\"要用两个否定词：**Non** bevo **mai** caffè（我从来不喝咖啡）；**Non** capisco **niente**（我什么都不懂）。汉语一个\"不\"就够了，意大利语两个都要说。",
    "是非问句没有\"吗\"：句子不变，只是**语调上扬**，写的时候加问号。Sei cinese? = 你是中国人吗？",
    "特殊疑问句的顺序和汉语**相反**：疑问词放在**句子开头**。汉语\"你去哪里？\"→ 意大利语 **Dove** vai?（\"哪里 你去\"）。",
    "常用疑问词：**che cosa**（什么）、**chi**（谁）、**dove**（哪里）、**quando**（什么时候）、**perché**（为什么）、**come**（怎么）、**quanto**（多少）。perché 既是\"为什么\"，也是\"因为\"。"
  ],
  "pattern": ["Dove · Che cosa · Chi …", "+ 动词", "?"],
  "ex": [
    ["Non parlo italiano.", "我不说意大利语。"],
    ["Non bevo mai caffè.", "我从来不喝咖啡。"],
    ["Sei cinese?", "你是中国人吗？"],
    ["Dove vai?", "你去哪里？"],
    ["Che cosa mangi?", "你吃什么？"],
    ["Chi è lui?", "他是谁？"]
  ],
  "traps": [
    ["Vai dove?", "Dove vai?", "疑问词放在句子开头。"],
    ["Bevo mai caffè.", "Non bevo mai caffè.", "mai 前面还要有 non。"]
  ],
  "quiz": [
    {"k": "pick", "q": "你去哪里？", "opts": ["Vai dove?", "Dove vai?", "Dove vai ma?"], "a": 1},
    {"k": "pick", "q": "我从来不喝咖啡。", "opts": ["Bevo mai caffè.", "Non bevo mai caffè.", "Mai non bevo caffè."], "a": 1},
    {"k": "pick", "q": "意大利语里的\"吗\"怎么说？", "opts": ["在句子后面加 ma", "句子不变，语调上扬", "在句子前面加 non"], "a": 1},
    {"k": "pick", "q": "perché 的意思是？", "opts": ["只是\"为什么\"", "既是\"为什么\"，也是\"因为\"", "什么时候"], "a": 1},
    {"k": "order", "it": "che cosa mangi", "zh": "你吃什么？"}
  ]
});
