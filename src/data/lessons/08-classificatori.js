/* Lezione 8 · Contare: numeri e classificatori. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "classificatori",
  "n": 8,
  "path": "numeri",
  "title": "Contare: numeri e classificatori",
  "goal": "Contare persone e cose con il classificatore giusto.",
  "body": [
    "Tra il numero e la cosa contata ci vuole un **classificatore**: 一个人 (una persona), 三本书 (tre libri), 两杯茶 (due tazze di tè).",
    "个 (gè) va bene quasi sempre, soprattutto con le persone. Altri da sapere: 本 per i libri, 杯 per tazze e bicchieri, 张 per le cose piatte (biglietti, tavoli), 件 per i vestiti, 只 per gli animali, 瓶 per le bottiglie.",
    "Il «due» davanti a un classificatore è 两 (liǎng), non 二: 两个人, 两杯咖啡. 二 si usa per contare (一, 二, 三) e nei numeri composti (十二, 二十).",
    "Anche 这 (questo) e 那 (quello) vogliono il classificatore: 这本书 = questo libro, 那个人 = quella persona."
  ],
  "pattern": ["numero / 这 / 那", "classificatore", "che cosa"],
  "ex": [
    ["我有三个朋友。", "Ho tre amici."],
    ["我买了一本书。", "Ho comprato un libro."],
    ["我要两杯茶。", "Voglio due tazze di tè."],
    ["他有一只狗。", "Lui ha un cane."],
    ["这本书很贵。", "Questo libro è caro."],
    ["那个人是谁？", "Chi è quella persona?"],
    ["我要三杯咖啡。", "Voglio tre caffè."],
    ["她有两个孩子。", "Lei ha due figli."]
  ],
  "dlg": [
    ["A", "你好，我要一本书。", "Buongiorno, vorrei un libro."],
    ["B", "这本书很贵。", "Questo libro è caro."],
    ["A", "那本书贵吗？", "Quel libro è caro?"],
    ["B", "那本书不贵。", "Quel libro non è caro."],
    ["A", "好，我要那本书。", "Bene, prendo quel libro."]
  ],
  "traps": [
    ["我有三朋友。", "我有三个朋友。", "Tra numero e nome manca il classificatore 个."],
    ["二个人", "两个人", "Davanti al classificatore il «due» è 两."],
    ["这书很贵。", "这本书很贵。", "Anche 这 vuole il classificatore."]
  ],
  "quiz": [
    {"k": "pick", "q": "Come si dice «due persone»?", "opts": ["二个人", "两个人", "两人个"], "a": 1, "why": "Davanti al classificatore: 两."},
    {"k": "pick", "q": "Come si dice «tre libri»?", "opts": ["三书", "三本书", "书三本"], "a": 1, "why": "Numero + 本 + libro."},
    {"k": "pick", "q": "Come si dice «due tazze di tè»?", "opts": ["两杯茶", "二杯茶", "两茶杯"], "a": 0},
    {"k": "order", "zh": "我有三个朋友", "it": "Ho tre amici."},
    {"k": "pick", "q": "Come si dice «questo libro»?", "opts": ["这书", "这本书", "书这本"], "a": 1, "why": "这 + classificatore + nome."},
    {"k": "order", "zh": "我要两杯茶", "it": "Voglio due tazze di tè."}
  ]
});
