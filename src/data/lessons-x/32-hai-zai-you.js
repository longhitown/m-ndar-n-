/* Lezione 32 · Ancora, di nuovo: 还, 再, 又. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "hai-zai-you",
  "n": 32,
  "title": "Ancora, di nuovo: 还, 再, 又",
  "goal": "Distinguere i tre «ancora» e dire «ancora» per qualcosa che continua, che si ripete domani o che si è già ripetuto.",
  "body": [
    "L'italiano ha un solo «ancora» (e «di nuovo»), il cinese ne ha tre, secondo il **tempo**.",
    "**还** (hái) = «ancora, anche, in più». Dice che qualcosa **continua** o che c'è **altro**: 他还在睡觉 = dorme ancora; 我还要一杯茶 = voglio ancora (un'altra) tazza di tè.",
    "**再** (zài) = «di nuovo» per qualcosa che **non è ancora successo**: un invito o un progetto. 请再说一遍 = per favore, ripeti; 明天再来 = torna domani; 再见 = arrivederci (letteralmente «vediamoci di nuovo»).",
    "**又** (yòu) = «di nuovo» per qualcosa che **è già successo**: 他又来了 = è venuto un'altra volta; 今天又下雨了 = oggi ha piovuto di nuovo.",
    "Un trucco: **再 guarda avanti, 又 guarda indietro**."
  ],
  "pattern": ["chi", "还 / 再 / 又", "verbo"],
  "ex": [
    ["他还在睡觉。", "Dorme ancora."],
    ["我还要一杯茶。", "Voglio ancora una tazza di tè."],
    ["请再说一遍。", "Per favore, ripeti ancora una volta."],
    ["明天再来吧。", "Torna domani."],
    ["他又来了。", "È venuto di nuovo."],
    ["今天又下雨了。", "Oggi ha piovuto di nuovo."]
  ],
  "dlg": [
    ["A", "你还在学中文吗？", "Stai ancora studiando cinese?"],
    ["B", "对，我还在学。你说得太快了，请再说一遍。", "Sì, sto ancora studiando. Hai parlato troppo veloce, per favore ripeti."],
    ["A", "好，我再说一遍。", "Va bene, lo ripeto."],
    ["B", "谢谢！明天我们再学。", "Grazie! Domani studiamo ancora."]
  ],
  "traps": [
    ["请又说一遍。", "请再说一遍。", "Per una richiesta (non ancora avvenuta) si usa 再."],
    ["他明天又来。", "他明天再来。", "Il futuro vuole 再, non 又."],
    ["今天再下雨了。", "今天又下雨了。", "Se è già successo, 又."]
  ],
  "quiz": [
    {"k": "order", "zh": "请再说一遍", "it": "Per favore, ripeti."},
    {"k": "pick", "q": "Come si dice «Oggi ha piovuto di nuovo»?", "opts": ["今天又下雨了。", "今天再下雨了。", "今天还下雨了。"], "a": 0},
    {"k": "buco", "zh": "明天我们＿学。", "opts": ["再", "又", "还"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他还在睡觉。", "opts": ["Dorme ancora.", "Dorme di nuovo.", "Ha dormito."], "a": 0},
    {"k": "buco", "zh": "他昨天来了，今天＿来了。", "opts": ["又", "再", "吧"], "a": 0},
    {"k": "pick", "q": "Quale parola guarda avanti (qualcosa che deve ancora succedere)?", "opts": ["再", "又", "了"], "a": 0}
  ]
});
