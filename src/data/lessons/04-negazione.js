/* Lezione 4 · Dire di no: 不 e 没. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "negazione",
  "n": 4,
  "path": "risposte",
  "title": "Dire di no: 不 e 没",
  "goal": "Negare al presente e al passato senza confonderti.",
  "body": [
    "不 (bù) nega il presente, le abitudini e il futuro: 我不喝咖啡 = non bevo caffè; 明天我不去 = domani non vado.",
    "没 (méi) nega il passato, cioè **qualcosa che non è successo**: 我没去 = non sono andato/a; 我没吃饭 = non ho mangiato.",
    "有 (avere, esserci) si nega **solo** con 没: 没有 = non avere, non c'è. Mai 不有.",
    "不 cambia tono davanti a un 4° tono: 不是 si legge bú shì. Nel laboratorio lo vedi sotto «Come si dice davvero»."
  ],
  "pattern": ["chi", "不 / 没", "verbo"],
  "ex": [
    ["我不喝咖啡。", "Non bevo caffè."],
    ["他不忙。", "Lui non è impegnato."],
    ["我没吃饭。", "Non ho mangiato."],
    ["他今天没来。", "Oggi lui non è venuto."],
    ["我没有钱。", "Non ho soldi."],
    ["我不知道。", "Non lo so."]
  ],
  "dlg": [
    ["A", "马可，你今天不忙。", "Marco, oggi non sei impegnato."],
    ["B", "对，我不忙。我没吃饭，我很饿。", "Già, non sono impegnato. Non ho mangiato, ho molta fame."],
    ["A", "我们去吃饭。", "Andiamo a mangiare."],
    ["B", "好，我没有钱。", "Va bene, ma non ho soldi."]
  ],
  "traps": [
    ["我不有钱。", "我没有钱。", "有 si nega solo con 没: 没有."],
    ["我昨天不去。", "我昨天没去。", "Per dire che una cosa non è successa si usa 没."]
  ],
  "quiz": [
    {"k": "pick", "q": "Come si dice «Non ho soldi»?", "opts": ["我不有钱。", "我没有钱。", "我有没钱。"], "a": 1, "why": "有 si nega con 没."},
    {"k": "pick", "q": "Come si dice «Non ho mangiato»?", "opts": ["我不吃饭。", "我没吃饭。"], "a": 1, "why": "Una cosa che non è successa: 没."},
    {"k": "pick", "q": "Come si dice «Non bevo caffè» (per abitudine)?", "opts": ["我不喝咖啡。", "我没喝咖啡。"], "a": 0, "why": "Le abitudini si negano con 不."},
    {"k": "order", "zh": "我没吃饭", "it": "Non ho mangiato."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他今天没来。", "opts": ["Oggi lui non è venuto.", "Oggi lui non viene mai.", "Oggi lui viene."], "a": 0},
    {"k": "order", "zh": "我不喝咖啡", "it": "Non bevo caffè."}
  ]
});
