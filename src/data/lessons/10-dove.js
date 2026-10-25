/* Lezione 10 · Dove: 在. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "dove",
  "n": 10,
  "path": "spazio",
  "title": "Dove: 在",
  "goal": "Dire dove sei e dove fai le cose.",
  "body": [
    "在 (zài) + luogo dice dove si trova qualcuno: 我在家 = sono a casa. Qui 在 fa da verbo: «essere (in un posto)».",
    "Se fai qualcosa in un posto, **在 + luogo va prima del verbo**: 我在家吃饭 = mangio a casa. Ordine: chi + dove + che cosa fai.",
    "La domanda è 在哪里: 你在哪里? = dove sei? 你在哪里工作? = dove lavori?",
    "在 + verbo, senza luogo, vuol dire «sto facendo»: 我在学中文 = sto studiando cinese."
  ],
  "pattern": ["chi", "在 + luogo", "verbo"],
  "ex": [
    ["我在家。", "Sono a casa."],
    ["我妈妈在医院。", "La mia mamma è in ospedale."],
    ["我在家吃饭。", "Mangio a casa."],
    ["她在医院工作。", "Lei lavora in ospedale."],
    ["你在哪里工作？", "Dove lavori?"],
    ["我在学中文。", "Sto studiando cinese."]
  ],
  "traps": [
    ["我吃饭在家。", "我在家吃饭。", "Il luogo (在 + luogo) va prima del verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "我在家吃饭", "it": "Mangio a casa."},
    {"k": "pick", "q": "Come si dice «Dove sei?»?", "opts": ["你在哪里？", "你哪里在？", "你是哪里？"], "a": 0},
    {"k": "pick", "q": "Come si dice «Lavoro in banca»?", "opts": ["我工作在银行。", "我在银行工作。", "在银行工作我。"], "a": 1, "why": "Prima dove, poi che cosa fai."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我在学中文。", "opts": ["Sto studiando cinese.", "Studio cinese a scuola.", "Sono in Cina."], "a": 0, "why": "在 + verbo = sto facendo."},
    {"k": "order", "zh": "你在哪里工作", "it": "Dove lavori?"}
  ]
});
