/* Lezione 14 · Mi piace: 喜欢. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "piacere",
  "n": 14,
  "path": "cibo",
  "title": "Mi piace: 喜欢",
  "goal": "Dire che cosa ti piace e che cosa no.",
  "body": [
    "喜欢 (xǐhuan) è «piacere», ma la frase è costruita al contrario dell'italiano: **chi prova il piacere è il soggetto**. 我喜欢茶 = mi piace il tè (alla lettera «io gradisco tè»).",
    "In italiano si gira: la cosa che piace diventa il soggetto e il verbo si accorda con lei: mi piace il tè, **mi piacciono** i cani (我喜欢狗).",
    "喜欢 + verbo = mi piace fare qualcosa: 我喜欢做饭 = mi piace cucinare.",
    "Per «molto» si dice 很喜欢: 我很喜欢意大利 = mi piace molto l'Italia. Al negativo 不喜欢.",
    "Con le persone: 我喜欢你 = mi piaci. 我爱你 = ti amo."
  ],
  "pattern": ["chi", "喜欢", "che cosa / verbo"],
  "ex": [
    ["我喜欢茶。", "Mi piace il tè."],
    ["我喜欢狗。", "Mi piacciono i cani."],
    ["我不喜欢猫。", "Non mi piacciono i gatti."],
    ["我喜欢做饭。", "Mi piace cucinare."],
    ["我很喜欢意大利。", "Mi piace molto l'Italia."],
    ["你喜欢什么？", "Che cosa ti piace?"]
  ],
  "traps": [
    ["我喜欢很意大利。", "我很喜欢意大利。", "很 va prima di 喜欢."],
    ["茶喜欢我。", "我喜欢茶。", "Prima chi prova il piacere, poi la cosa."]
  ],
  "quiz": [
    {"k": "order", "zh": "我喜欢茶", "it": "Mi piace il tè."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我喜欢狗。", "opts": ["Mi piacciono i cani.", "Piaccio ai cani.", "I cani mi cercano."], "a": 0, "why": "In italiano i cani diventano il soggetto: «piacciono»."},
    {"k": "pick", "q": "Come si dice «Mi piace molto l'Italia»?", "opts": ["我很喜欢意大利。", "我喜欢很意大利。", "意大利很喜欢我。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我喜欢你。", "opts": ["Mi piaci.", "Ti piaccio.", "Mi piace lui."], "a": 0},
    {"k": "order", "zh": "我喜欢做饭", "it": "Mi piace cucinare."}
  ]
});
