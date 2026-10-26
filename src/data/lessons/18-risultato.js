/* Lezione 18 · Il risultato dell'azione: 完, 懂, 见, 到, 错, 好. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "risultato",
  "n": 18,
  "path": "hsk2_verbi_2",
  "title": "Il risultato: 看完, 听懂, 找到",
  "goal": "Dire non solo che cosa hai fatto, ma come è andata a finire.",
  "body": [
    "In cinese il verbo dice l'azione, e **una seconda parola subito dopo dice il risultato**: 听 (ascoltare) + 懂 (capire) = 听懂, capire ascoltando.",
    "I risultati più usati: **完** (finito: 吃完, 做完), **懂** (capito: 听懂, 看懂), **见** e **到** (percepito, raggiunto: 看见, 听到, 找到, 买到), **错** (sbagliato: 写错), **好** (fatto bene, pronto: 准备好).",
    "Al passato si aggiunge 了: 我听懂了 = ho capito. Al negativo si usa **没** e **niente 了**: 我没听懂 = non ho capito.",
    "La differenza con l'italiano: «ho cercato» (找了) non vuol dire che l'hai trovato; «l'ho trovato» è 找到了. «Ho ascoltato» (听了) non vuol dire che hai capito: 听懂了."
  ],
  "pattern": ["verbo", "risultato", "了"],
  "ex": [
    ["我听懂了。", "Ho capito (ascoltando)."],
    ["我没听懂。", "Non ho capito."],
    ["我吃完饭了。", "Ho finito di mangiare."],
    ["你看见我的手机了吗？", "Hai visto il mio telefono?"],
    ["我找到我的钥匙了。", "Ho trovato le mie chiavi."],
    ["我写错了一个字。", "Ho sbagliato un carattere."],
    ["我买到票了。", "Sono riuscito a comprare il biglietto."]
  ],
  "traps": [
    ["我没听懂了。", "我没听懂。", "Con 没 non si mette 了."],
    ["我找了我的钥匙。", "我找到我的钥匙了。", "找了 = ho cercato; per «ho trovato» serve il risultato 到."]
  ],
  "quiz": [
    {"k": "order", "zh": "我没听懂", "it": "Non ho capito."},
    {"k": "pick", "q": "Come si dice «Ho trovato le chiavi»?", "opts": ["我找到钥匙了。", "我找钥匙了。", "我没找到钥匙。"], "a": 0, "why": "找 = cercare, 找到 = trovare."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我写错了一个字。", "opts": ["Ho sbagliato un carattere.", "Ho scritto un carattere.", "Non so scrivere questo carattere."], "a": 0},
    {"k": "pick", "q": "Quale frase è giusta?", "opts": ["我没吃完。", "我没吃完了。", "我不吃完了。"], "a": 0},
    {"k": "order", "zh": "你看见我的手机了吗", "it": "Hai visto il mio telefono?"}
  ]
});
