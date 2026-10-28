/* Lezione 30 · Perfino e tranne: 连…都, 除了…以外. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "enfasi",
  "n": 30,
  "path": "hsk3_agg_3",
  "title": "Perfino e tranne: 连…都, 除了…以外",
  "goal": "Sottolineare una cosa sorprendente e fare eccezioni.",
  "body": [
    "**连 … 都 / 也** = perfino: 他连一个汉字都不认识 = non conosce nemmeno un carattere; 这个问题连孩子都知道 = lo sa perfino un bambino.",
    "La cosa sorprendente va **tra 连 e 都**, il verbo dopo. Con la negazione si usa spesso un numero piccolo: 连一 … 都不 / 也没 = neanche uno.",
    "**除了 … 以外，都 …** = tranne: 除了他以外，我们都去了 = tranne lui, ci siamo andati tutti.",
    "**除了 … 以外，还 / 也 …** = oltre a: 除了中文以外，我还学英语 = oltre al cinese, studio anche l'inglese. La parola dopo (都 o 还) decide il senso: escludere o aggiungere.",
    "以外 si può togliere: 除了他，我们都去了."
  ],
  "pattern": ["连", "…", "都 / 也", "verbo"],
  "ex": [
    ["他连一个汉字都不认识。", "Non conosce nemmeno un carattere."],
    ["这个问题连孩子都知道。", "Questa cosa la sa perfino un bambino."],
    ["除了他以外，我们都去了。", "Tranne lui, ci siamo andati tutti."],
    ["除了中文以外，我还学英语。", "Oltre al cinese, studio anche l'inglese."],
    ["我忙得连饭都没吃。", "Ero così occupato che non ho nemmeno mangiato."],
    ["他连我的名字都不知道。", "Non sa nemmeno il mio nome."],
    ["除了茶以外，我还喝咖啡。", "Oltre al tè, bevo anche il caffè."]
  ],
  "dlg": [
    ["A", "你吃饭了吗？", "Hai mangiato?"],
    ["B", "没有，我忙得连饭都没吃。", "No, ero così occupato che non ho nemmeno mangiato."],
    ["A", "除了你以外，我们都吃了。", "Tranne te, abbiamo mangiato tutti."],
    ["B", "那我现在去吃。", "Allora vado a mangiare adesso."]
  ],
  "traps": [
    ["他连一个汉字不认识。", "他连一个汉字都不认识。", "连 vuole 都 (o 也) prima del verbo."],
    ["除了他以外，我们还去了。", "除了他以外，我们都去了。", "Per escludere (tranne) si usa 都; 还 vuol dire «oltre a»."]
  ],
  "quiz": [
    {"k": "order", "zh": "他连一个汉字都不认识", "it": "Non conosce nemmeno un carattere."},
    {"k": "pick", "q": "Come si dice «Tranne lui, ci siamo andati tutti»?", "opts": ["除了他以外，我们都去了。", "除了他以外，我们还去了。", "连他以外，我们都去了。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "除了中文以外，我还学英语。", "opts": ["Oltre al cinese, studio anche l'inglese.", "Tranne il cinese, studio l'inglese.", "Studio solo il cinese."], "a": 0, "why": "除了…还 = oltre a."},
    {"k": "pick", "q": "Quale frase è giusta?", "opts": ["这个问题连孩子都知道。", "这个问题连孩子知道。", "这个问题孩子连都知道。"], "a": 0},
    {"k": "order", "zh": "除了他以外我们都去了", "it": "Tranne lui, ci siamo andati tutti."}
  ]
});
