/* Lezione 3 · Gli aggettivi: 很. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "aggettivi",
  "n": 3,
  "path": "aggettivi",
  "title": "Gli aggettivi: 很",
  "goal": "Descrivere cose e persone, dire come stai.",
  "body": [
    "In cinese l'aggettivo fa già da verbo: **non serve «essere»**. «Il tè è caldo» = 茶很热.",
    "Davanti all'aggettivo si mette quasi sempre 很 (hěn). Qui **non vuol dire «molto»**: lega soltanto. 我很好 = sto bene.",
    "Per dire davvero «molto» si usa 非常: 非常贵 = molto caro. 太…了 = troppo: 太贵了 = è troppo caro! 有点 = un po' (di solito per le cose che non vanno): 有点冷 = fa un po' freddo.",
    "Al negativo basta 不 + aggettivo, senza 很: 不贵 = non è caro. 不太贵 = non molto caro.",
    "Alcuni aggettivi in italiano diventano «avere»: 我饿 = ho fame, 我渴 = ho sete. E col tempo che fa: 今天很热 = oggi fa caldo."
  ],
  "pattern": ["chi / che cosa", "很", "aggettivo"],
  "ex": [
    ["茶很热。", "Il tè è caldo."],
    ["我很累。", "Sono stanco/a."],
    ["这本书很贵。", "Questo libro è caro."],
    ["这件衣服太贵了！", "Questo vestito è troppo caro!"],
    ["今天有点冷。", "Oggi fa un po' freddo."],
    ["我不饿。", "Non ho fame."]
  ],
  "dlg": [
    ["A", "你的手机很好。", "Il tuo cellulare è bello."],
    ["B", "谢谢，我的手机不贵。", "Grazie, il mio cellulare non è caro."],
    ["A", "我的书太贵了！", "Il mio libro è troppo caro!"],
    ["B", "今天有点冷，我们喝茶。", "Oggi fa un po' freddo, beviamo del tè."]
  ],
  "traps": [
    ["我是累。", "我很累。", "Con l'aggettivo niente 是."],
    ["茶热很。", "茶很热。", "很 va prima dell'aggettivo."]
  ],
  "quiz": [
    {"k": "order", "zh": "我很累", "it": "Sono stanco/a."},
    {"k": "pick", "q": "Come si dice «È troppo caro!»?", "opts": ["太贵了！", "是贵了！", "贵太了！"], "a": 0, "why": "太 + aggettivo + 了 = troppo."},
    {"k": "pick", "q": "In 我很好, 很 vuol dire per forza «molto»?", "opts": ["Sì, sempre.", "No: qui lega soltanto l'aggettivo.", "Vuol dire «non»."], "a": 1, "why": "Per «molto» si usa 非常."},
    {"k": "pick", "q": "Come si dice «Non è caro»?", "opts": ["不贵。", "没贵。", "不是贵。"], "a": 0, "why": "Al negativo basta 不 + aggettivo."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我饿了。", "opts": ["Ho fame.", "Sono fame.", "Ho mangiato."], "a": 0, "why": "饿 in italiano diventa «avere fame»."},
    {"k": "order", "zh": "今天很热", "it": "Oggi fa caldo."}
  ]
});
