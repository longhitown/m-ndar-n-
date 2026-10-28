/* Corso di italiano per chi parla cinese · lezione 17 · 我的、你的：物主形容词.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "possessivi",
  "n": 17,
  "title": "我的、你的：物主形容词",
  "goal": "会说\"我的书\"、\"我妈妈\"。",
  "body": [
    "物主形容词：**mio**（我的）、**tuo**（你的）、**suo**（他的、她的）、**Suo**（您的）、**nostro**（我们的）、**vostro**（你们的）、**loro**（他们的）。",
    "它们要和**被拥有的东西**一致（不是和主人）：**il mio libro**（我的书），**la mia casa**（我的家），**i miei amici**（我的朋友们），**le mie chiavi**（我的钥匙）。",
    "一般要加**定冠词**：**la mia** macchina。汉语\"我的\"没有冠词，这里最容易漏。",
    "**单数亲属**不加冠词：**mia madre**（我妈妈）、**mio fratello**（我哥哥/弟弟）。复数或者有修饰时要加：**i miei fratelli**，**la mia sorellina**。loro 总是加：**la loro madre**。",
    "suo 既是\"他的\"也是\"她的\"，看东西的阴阳性，不看主人：**la sua casa** = 他的家 / 她的家。"
  ],
  "pattern": ["il mio · la mia · i miei · le mie", "mia madre（亲属单数不加冠词）"],
  "ex": [
    ["Questo è il mio libro.", "这是我的书。"],
    ["Mia madre è insegnante.", "我妈妈是老师。"],
    ["Dove sono le mie chiavi?", "我的钥匙在哪儿？"],
    ["La sua casa è grande.", "他（她）的家很大。"],
    ["I nostri amici arrivano domani.", "我们的朋友明天到。"],
    ["Il tuo telefono è nuovo.", "你的手机是新的。"],
    ["I miei amici sono qui.", "我的朋友们在这里。"]
  ],
  "dlg": [
    ["A", "Questo è il tuo libro?", "这是你的书吗？"],
    ["B", "No, il mio libro è qui. Questo è il libro di Marco.", "不是，我的书在这儿。这是马可的书。"],
    ["A", "E le tue chiavi?", "那你的钥匙呢？"],
    ["B", "Le mie chiavi sono a casa.", "我的钥匙在家。"]
  ],
  "traps": [
    ["Mio libro.", "Il mio libro.", "物主形容词前面一般要加定冠词。"],
    ["La mia madre.", "Mia madre.", "单数亲属不加冠词。"],
    ["Il suo casa.", "La sua casa.", "要和东西（casa，阴性）一致。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我的车（la macchina）", "opts": ["mio macchina", "la mia macchina", "il mio macchina"], "a": 1},
    {"k": "pick", "q": "我爸爸", "opts": ["il mio padre", "mio padre", "mia padre"], "a": 1, "why": "单数亲属不加冠词。"},
    {"k": "pick", "q": "我的朋友们", "opts": ["i miei amici", "i mii amici", "le mie amici"], "a": 0},
    {"k": "pick", "q": "la sua borsa 是谁的包？", "opts": ["只能是她的", "他的或她的", "您的"], "a": 1, "why": "suo/sua 看东西的性别，不看主人。"},
    {"k": "order", "it": "questo è il mio libro", "zh": "这是我的书。"}
  ]
});
