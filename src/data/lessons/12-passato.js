/* Lezione 12 · Fatto e finito: 了. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "passato",
  "n": 12,
  "path": "viaggi",
  "title": "Fatto e finito: 了",
  "goal": "Raccontare quello che hai fatto.",
  "body": [
    "Il verbo cinese non ha il passato. Per dire che un'azione è **compiuta** si mette 了 (le) dopo il verbo: 我买了一本书 = ho comprato un libro.",
    "了 in fondo alla frase dice che qualcosa è successo o è **cambiato**: 我饿了 = (adesso) ho fame; 下雨了 = ha cominciato a piovere.",
    "Al negativo 了 sparisce: si usa 没 + verbo. 我没吃饭 = non ho mangiato. Mai 没…了.",
    "La domanda: 你吃饭了吗? = hai mangiato?"
  ],
  "pattern": ["chi", "verbo", "了", "che cosa"],
  "ex": [
    ["我买了一本书。", "Ho comprato un libro."],
    ["他昨天去了上海。", "Ieri lui è andato a Shanghai."],
    ["我们昨天吃了饺子。", "Ieri abbiamo mangiato i ravioli."],
    ["你吃饭了吗？", "Hai mangiato?"],
    ["我没吃饭。", "Non ho mangiato."],
    ["下雨了。", "Piove."],
    ["我吃了早饭。", "Ho fatto colazione."],
    ["他没来。", "Lui non è venuto."]
  ],
  "dlg": [
    ["A", "你吃饭了吗？", "Hai mangiato?"],
    ["B", "没有，我没吃饭。你吃了吗？", "No, non ho mangiato. E tu, hai mangiato?"],
    ["A", "我吃了。我昨天吃了饺子。", "Sì. Ieri ho mangiato i ravioli."],
    ["B", "太好了！我今天想吃饺子。", "Che bello! Oggi vorrei mangiare i ravioli."]
  ],
  "traps": [
    ["我没吃饭了。", "我没吃饭。", "Al negativo niente 了: basta 没."],
    ["我了买一本书。", "我买了一本书。", "了 va dopo il verbo, mai prima."]
  ],
  "quiz": [
    {"k": "order", "zh": "我买了一本书", "it": "Ho comprato un libro."},
    {"k": "pick", "q": "Come si dice «Non ho mangiato»?", "opts": ["我没吃饭了。", "我没吃饭。", "我不吃了饭。"], "a": 1, "why": "Negativo del passato: 没, senza 了."},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我饿了。", "opts": ["Ho fame (adesso).", "Ho avuto fame.", "Non ho fame."], "a": 0, "why": "了 in fondo: la situazione è cambiata."},
    {"k": "pick", "q": "Come si dice «Ieri lui è andato a Shanghai»?", "opts": ["他昨天去了上海。", "他去了上海昨天。", "他昨天了去上海。"], "a": 0},
    {"k": "order", "zh": "你吃饭了吗", "it": "Hai mangiato?"}
  ]
});
