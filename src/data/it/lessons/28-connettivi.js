/* Corso di italiano per chi parla cinese · lezione 28 · 连接句子：因为、所以、如果、虽然.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "connettivi",
  "n": 28,
  "title": "连接句子：因为、所以、如果、虽然",
  "goal": "会说\"因为下雨，所以我不去\"。",
  "body": [
    "**perché**（因为）：Non vengo **perché** piove.（我不来，因为下雨。）注意：perché 也是\"为什么\"。",
    "**quindi / allora**（所以）：Piove, **quindi** resto a casa.（下雨了，所以我待在家。）汉语\"因为……所以……\"两个都说，意大利语**只用一个**。",
    "**se**（如果）：**Se** piove, prendo l'ombrello.（如果下雨，我就带伞。）**quando**（……的时候）：**Quando** arrivo, ti chiamo.（我到了就给你打电话。）",
    "**ma / però**（但是）：È caro, **ma** è buono.（贵，但是好。）**anche se**（虽然、即使）：**Anche se** è tardi, esco.（虽然晚了，我还是出去。）",
    "**mentre**（当……的时候、而）：Leggo **mentre** aspetto.（我边等边看书。）"
  ],
  "pattern": ["perché = 因为 · quindi = 所以（只用一个）", "se · quando · anche se · mentre"],
  "ex": [
    ["Non vengo perché sono stanco.", "我不来了，因为我累了。"],
    ["Piove, quindi resto a casa.", "下雨了，所以我待在家里。"],
    ["Se hai tempo, vieni a trovarmi.", "如果你有时间，就来看我。"],
    ["È caro, ma è molto buono.", "贵，但是很好吃。"],
    ["Anche se è tardi, esco.", "虽然晚了，我还是要出去。"]
  ],
  "traps": [
    ["Perché piove, quindi resto a casa.", "Siccome piove, resto a casa.", "\"因为……所以\"只用一个连接词；句首说\"因为\"用 siccome。"],
    ["Se piove, prendo l'ombrello, allora.", "Se piove, prendo l'ombrello.", "\"如果……就\"的\"就\"不用翻。"],
    ["Anche è tardi, esco.", "Anche se è tardi, esco.", "\"虽然、即使\"是 anche se。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我不去，因为下雨", "opts": ["Non vado perché piove.", "Perché piove, quindi non vado.", "Non vado quindi piove."], "a": 0},
    {"k": "pick", "q": "如果你有时间，打电话给我", "opts": ["Se hai tempo, chiamami.", "Quando hai tempo, allora chiamami.", "Anche hai tempo, chiamami."], "a": 0},
    {"k": "pick", "q": "虽然贵，我还是买", "opts": ["Anche se è caro, lo compro.", "Perché è caro, lo compro.", "Quindi è caro, lo compro."], "a": 0},
    {"k": "pick", "q": "quindi 是什么意思？", "opts": ["所以", "因为", "但是"], "a": 0},
    {"k": "order", "it": "piove quindi resto a casa", "zh": "下雨了，所以我待在家里。"}
  ]
});
