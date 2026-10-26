/* Lezione 24 · Sto facendo: 正在 … 呢. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "incorso",
  "n": 24,
  "path": "hsk1_utili",
  "title": "Sto facendo: 正在 … 呢",
  "goal": "Dire che cosa stai facendo proprio adesso, o che cosa facevi in quel momento.",
  "body": [
    "Per un'azione **in corso** si mette **正在** (o solo **在**) prima del verbo: 我正在吃饭 = sto mangiando.",
    "Spesso alla fine si aggiunge **呢**, che dà il tono di «proprio adesso»: 我在吃饭呢. Nel parlato basta anche solo 呢: 他睡觉呢 = sta dormendo.",
    "Il tempo non cambia la forma: 昨天你给我打电话的时候，我正在洗澡 = quando ieri mi hai telefonato, stavo facendo la doccia.",
    "Al negativo si dice semplicemente **没在** o **没**: 我没在看电视 = non sto guardando la TV.",
    "Attenzione al doppio 在: 他在家 = è a casa (verbo «essere in»); 他在吃饭 = sta mangiando. Si possono anche unire: 他在家吃饭 = mangia a casa."
  ],
  "pattern": ["chi", "正在 / 在", "verbo", "呢"],
  "ex": [
    ["我正在吃饭。", "Sto mangiando."],
    ["他睡觉呢。", "Sta dormendo."],
    ["你在做什么呢？", "Che cosa stai facendo?"],
    ["我在学中文呢。", "Sto studiando cinese."],
    ["我没在看电视。", "Non sto guardando la TV."],
    ["妈妈在做饭呢。", "La mamma sta cucinando."]
  ],
  "traps": [
    ["我正在吃饭了。", "我正在吃饭。", "In corso: niente 了 (了 dice che è finita)."],
    ["我不在看电视。", "我没在看电视。", "La negazione dell'azione in corso è 没在."]
  ],
  "quiz": [
    {"k": "order", "zh": "你在做什么呢", "it": "Che cosa stai facendo?"},
    {"k": "pick", "q": "Come si dice «Sta dormendo»?", "opts": ["他睡觉呢。", "他睡觉了。", "他不睡觉。"], "a": 0},
    {"k": "pick", "q": "Quale frase è giusta?", "opts": ["我没在看电视。", "我不在看电视了。", "我正在没看电视。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "妈妈在做饭呢。", "opts": ["La mamma sta cucinando.", "La mamma ha cucinato.", "La mamma è a casa."], "a": 0},
    {"k": "order", "zh": "我正在吃饭", "it": "Sto mangiando."}
  ]
});
