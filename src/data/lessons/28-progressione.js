/* Lezione 28 · Sempre più: 越来越, 越…越. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "progressione",
  "n": 28,
  "path": "hsk3_agg_2",
  "title": "Sempre più: 越来越, 越…越",
  "goal": "Dire che qualcosa cresce col tempo, o che una cosa cresce insieme a un'altra.",
  "body": [
    "**越来越 + aggettivo** = sempre più: 天气越来越热 = fa sempre più caldo; 你的中文越来越好了 = il tuo cinese migliora sempre di più.",
    "**越 A 越 B** = più A, più B: 越快越好 = prima è, meglio è; 他越说越高兴 = più parlava, più era contento.",
    "Come con il paragone, **niente 很** davanti all'aggettivo: 越来越很热 è sbagliato.",
    "Spesso alla fine c'è **了**, perché la situazione è cambiata: 人越来越多了 = c'è sempre più gente."
  ],
  "pattern": ["chi", "越来越", "aggettivo", "了"],
  "ex": [
    ["天气越来越热了。", "Fa sempre più caldo."],
    ["你的中文越来越好了。", "Il tuo cinese migliora sempre di più."],
    ["越快越好。", "Prima è, meglio è."],
    ["人越来越多了。", "C'è sempre più gente."],
    ["他越说越高兴。", "Più parlava, più era contento."],
    ["天气越来越冷了。", "Fa sempre più freddo."],
    ["我越学越喜欢。", "Più studio, più mi piace."]
  ],
  "dlg": [
    ["A", "天气越来越热了。", "Fa sempre più caldo."],
    ["B", "对，人也越来越多了。", "Già, e c'è sempre più gente."],
    ["A", "你的中文越来越好了。", "Il tuo cinese migliora sempre di più."],
    ["B", "谢谢，我越学越高兴。", "Grazie, più studio e più sono contento."]
  ],
  "traps": [
    ["天气越来越很热。", "天气越来越热。", "Niente 很 dopo 越来越."],
    ["越好越快。", "越快越好。", "L'ordine conta: «più veloce, meglio è»."]
  ],
  "quiz": [
    {"k": "order", "zh": "天气越来越热了", "it": "Fa sempre più caldo."},
    {"k": "pick", "q": "Come si dice «Prima è, meglio è»?", "opts": ["越快越好。", "越好越快。", "越来越快好。"], "a": 0},
    {"k": "pick", "q": "Quale frase è giusta?", "opts": ["你的中文越来越好了。", "你的中文越来越很好了。", "你的中文越好越来了。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他越说越高兴。", "opts": ["Più parlava, più era contento.", "Parla sempre contento.", "È contento di parlare."], "a": 0},
    {"k": "order", "zh": "人越来越多了", "it": "C'è sempre più gente."}
  ]
});
