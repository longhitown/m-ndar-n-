/* Lezione 13 · L'hai mai fatto? 过. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "esperienze",
  "n": 13,
  "path": "luoghi",
  "title": "L'hai mai fatto? 过",
  "goal": "Dire dove sei già stato e che cosa hai già provato.",
  "body": [
    "过 (guo) dopo il verbo dice che una cosa l'hai fatta **almeno una volta nella vita**: 我去过中国 = sono stato/a in Cina.",
    "Il negativo è 没 + verbo + 过: 我没去过中国 = non sono mai stato/a in Cina.",
    "La domanda: 你去过中国吗? = sei mai stato/a in Cina? 你吃过饺子吗? = hai mai mangiato i ravioli?",
    "Differenza con 了: 我吃了饺子 = ho mangiato i ravioli (quella volta); 我吃过饺子 = li ho già provati (nella vita)."
  ],
  "pattern": ["chi", "verbo", "过", "che cosa"],
  "ex": [
    ["我去过意大利。", "Sono stato/a in Italia."],
    ["你去过中国吗？", "Sei mai stato/a in Cina?"],
    ["我没去过中国。", "Non sono mai stato/a in Cina."],
    ["你吃过饺子吗？", "Hai mai mangiato i ravioli?"]
  ],
  "traps": [
    ["我不去过中国。", "我没去过中国。", "Con 过 il negativo è 没."],
    ["我去中国过。", "我去过中国。", "过 va subito dopo il verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "我去过意大利", "it": "Sono stato/a in Italia."},
    {"k": "pick", "q": "Come si dice «Non sono mai stato in Cina»?", "opts": ["我不去过中国。", "我没去过中国。", "我没去中国过。"], "a": 1},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "你吃过饺子吗？", "opts": ["Hai mai mangiato i ravioli?", "Hai mangiato i ravioli oggi?", "Mangi i ravioli?"], "a": 0},
    {"k": "pick", "q": "Che differenza c'è tra 我吃了饺子 e 我吃过饺子?", "opts": ["Il primo: li ho mangiati quella volta. Il secondo: li ho già provati nella vita.", "Vogliono dire la stessa cosa.", "过 è il futuro."], "a": 0}
  ]
});
