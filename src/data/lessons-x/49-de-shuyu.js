/* Lezione 49 · La cosa che…: 的 con una frase. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "de-shuyu",
  "n": 49,
  "title": "La cosa che…: 的 con una frase",
  "goal": "Descrivere un nome con una frase intera: «il libro che ho comprato», «la persona che parla».",
  "body": [
    "In italiano la frase che descrive un nome viene **dopo** il nome («il libro **che ho comprato**»). In cinese viene **prima**, e finisce con **的**: **(frase) + 的 + nome**. 我买的书 = il libro che ho comprato.",
    "Si può costruire con ogni verbo: 他说的话 = le cose che ha detto; 我喜欢的人 = la persona che mi piace; 坐在那儿的人 = la persona seduta là.",
    "Se il nome è chiaro dal contesto, si può **togliere**: 这本书是我买的 = questo libro l'ho comprato io (vedi anche 是…的).",
    "Non esiste un «che» da tradurre: la frase prima di 的 fa tutto. Più la frase è lunga, più sta **prima** del nome.",
    "Trucco: leggi la frase con 的 **al contrario**, dal nome verso sinistra: 书 ← 我买的 = «il libro che ho comprato»."
  ],
  "pattern": ["chi", "verbo", "的", "nome"],
  "ex": [
    ["我买的书很好看。", "Il libro che ho comprato è bello."],
    ["他说的话我都听懂了。", "Ho capito tutto quello che ha detto."],
    ["我喜欢的人是他。", "La persona che mi piace è lui."],
    ["坐在那儿的人是我朋友。", "La persona seduta là è un mio amico."],
    ["这是我昨天买的手机。", "Questo è il cellulare che ho comprato ieri."],
    ["你吃的饺子是我做的。", "I ravioli che mangi li ho fatti io."]
  ],
  "dlg": [
    ["A", "你看的那本书好看吗？", "Il libro che stai leggendo è bello?"],
    ["B", "很好看，是朋友给我的。", "Molto, me l'ha dato un amico."],
    ["A", "你喜欢的书都很好看。", "I libri che ti piacciono sono tutti belli."],
    ["B", "谢谢，我们一起看吧。", "Grazie, leggiamo insieme."]
  ],
  "traps": [
    ["书我买的很好看。", "我买的书很好看。", "La frase con 的 sta prima del nome."],
    ["我买书的很好看。", "我买的书很好看。", "的 viene subito prima del nome descritto."],
    ["我喜欢人是他。", "我喜欢的人是他。", "Manca 的 tra la frase e il nome."]
  ],
  "quiz": [
    {"k": "order", "zh": "我买的书很好看", "it": "Il libro che ho comprato è bello."},
    {"k": "pick", "q": "Come dici «La persona che mi piace»?", "opts": ["我喜欢的人", "人我喜欢的", "我喜欢人的"], "a": 0},
    {"k": "buco", "zh": "这是我昨天买＿手机。", "opts": ["的", "了", "吗"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他说的话我都听懂了。", "opts": ["Ho capito tutto quello che ha detto.", "Lui ha capito quello che ho detto.", "Non ho capito niente."], "a": 0},
    {"k": "pick", "q": "Dove sta la frase che descrive il nome?", "opts": ["Prima del nome, con 的", "Dopo il nome, con 的", "Dopo il nome, senza 的"], "a": 0}
  ]
});
