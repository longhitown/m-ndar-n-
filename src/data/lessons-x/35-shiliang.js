/* Lezione 35 · Quanto tempo: la durata. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "shiliang",
  "n": 35,
  "title": "Quanto tempo: la durata",
  "goal": "Dire per quanto tempo si fa o si è fatto qualcosa: «ho studiato tre anni», «aspetto un'ora».",
  "body": [
    "In cinese **la durata sta dopo il verbo**: verbo + (了) + durata. 我等了一个小时 = ho aspettato un'ora; 我们看了两个小时电视 = abbiamo guardato la TV per due ore.",
    "Quando il verbo ha anche un **oggetto**, il verbo si ripete: 我学中文学了三年 = ho studiato cinese per tre anni. Oppure la durata si mette prima dell'oggetto: 我学了三年中文.",
    "Se l'azione **continua ancora adesso**, si aggiunge **了 anche in fondo**: 我学中文学了三年了 = sono tre anni che studio cinese (e continuo). Senza il secondo 了 è un periodo concluso.",
    "La domanda è 多长时间 (quanto tempo?): 你学了多长时间了？ = da quanto tempo studi?",
    "Con la negazione la durata va **prima** del verbo e c'è 了 alla fine: 我三天没吃饭了 = sono tre giorni che non mangio.",
    "Attenzione: la **durata** (per quanto tempo) sta dopo il verbo, il **momento** (quando) prima: 我明天学三个小时 = domani studio tre ore."
  ],
  "pattern": ["chi", "verbo", "了", "durata"],
  "ex": [
    ["我等了一个小时。", "Ho aspettato un'ora."],
    ["我们看了两个小时电视。", "Abbiamo guardato la TV per due ore."],
    ["我学中文学了三年。", "Ho studiato cinese per tre anni."],
    ["我学中文学了三年了。", "Sono tre anni che studio cinese."],
    ["你学了多长时间了？", "Da quanto tempo studi?"],
    ["我三天没吃饭了。", "Sono tre giorni che non mangio."]
  ],
  "dlg": [
    ["A", "你学中文学了多长时间了？", "Da quanto tempo studi cinese?"],
    ["B", "我学了三年了。你呢？", "Sono tre anni. E tu?"],
    ["A", "我学了一年了。", "Io da un anno."],
    ["B", "你说得很好！", "Parli molto bene!"]
  ],
  "traps": [
    ["我学三年了中文。", "我学中文学了三年。", "Con un oggetto il verbo si ripete (o si dice 学了三年中文)."],
    ["我三个小时等。", "我等了三个小时。", "La durata sta dopo il verbo."],
    ["我没吃饭三天了。", "我三天没吃饭了。", "Con la negazione la durata va prima."]
  ],
  "quiz": [
    {"k": "order", "zh": "我等了一个小时", "it": "Ho aspettato un'ora."},
    {"k": "pick", "q": "Come si dice «Sono tre anni che studio cinese»?", "opts": ["我学中文学了三年了。", "我三年学中文了。", "我学了中文三年。"], "a": 0},
    {"k": "pick", "q": "Come chiedi «Da quanto tempo studi?»", "opts": ["你学了多长时间了？", "你多长时间学了？", "你学了什么时候？"], "a": 0},
    {"k": "buco", "zh": "我们看了两个＿电视。", "opts": ["小时", "点", "分钟"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我三天没吃饭了。", "opts": ["Sono tre giorni che non mangio.", "Ho mangiato per tre giorni.", "Mangio tra tre giorni."], "a": 0}
  ]
});
