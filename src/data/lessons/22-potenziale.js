/* Lezione 22 · Ce la fai o no: 听得懂, 买不到. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "potenziale",
  "n": 22,
  "path": "hsk3_verbi_1",
  "title": "Ce la fai o no: 听得懂 / 听不懂",
  "goal": "Dire se riesci o non riesci a fare una cosa: capire, finire, trovare.",
  "body": [
    "Mettendo **得** o **不** in mezzo a un verbo con risultato si dice se **è possibile** arrivare a quel risultato: 听懂 → 听得懂 (riesco a capire), 听不懂 (non riesco a capire).",
    "È il modo più naturale per dire «non ci riesco» per un limite pratico: 我吃不完 = non riesco a finirlo (è troppo); 票买不到 = i biglietti non si trovano.",
    "La domanda si fa con le due forme insieme: 你听得懂听不懂? oppure 你听得懂吗? = riesci a capire?",
    "Differenza con 不会 e 不能: 我不会说中文 = non so il cinese (non l'ho imparato); 我听不懂 = ascolto ma non capisco; 我不能去 = non posso andare (non mi è permesso o ho un impegno)."
  ],
  "pattern": ["verbo", "得 / 不", "risultato"],
  "ex": [
    ["我听得懂。", "Riesco a capire."],
    ["我听不懂。", "Non capisco (ascoltando)."],
    ["太多了，我吃不完。", "È troppo, non riesco a finirlo."],
    ["你看得见吗？", "Riesci a vedere?"],
    ["我找不到我的手机。", "Non riesco a trovare il mio telefono."],
    ["票买不到了。", "I biglietti non si trovano più."]
  ],
  "traps": [
    ["我不听懂。", "我听不懂。", "Per «non riesco a capire» 不 va in mezzo: 听不懂."],
    ["我不会听懂。", "我听不懂。", "不会 = non so fare; qui il problema è riuscire a capire."]
  ],
  "quiz": [
    {"k": "pick", "q": "Ascolti un cinese che parla velocissimo. Che cosa dici?", "opts": ["我听不懂。", "我不听懂。", "我没听。"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "太多了，我吃不完。", "opts": ["È troppo, non riesco a finirlo.", "Non mi piace, non lo mangio.", "Ho già finito."], "a": 0},
    {"k": "order", "zh": "我找不到我的手机", "it": "Non riesco a trovare il mio telefono."},
    {"k": "pick", "q": "Come si dice «Riesci a vedere?»", "opts": ["你看得见吗？", "你看见得吗？", "你得看见吗？"], "a": 0},
    {"k": "order", "zh": "我听得懂", "it": "Riesco a capire."}
  ]
});
