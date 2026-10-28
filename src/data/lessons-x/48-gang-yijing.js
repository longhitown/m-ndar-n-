/* Lezione 48 · Appena e già: 刚, 刚才, 已经. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "gang-yijing",
  "n": 48,
  "title": "Appena e già: 刚, 刚才, 已经",
  "goal": "Dire «sono appena arrivato», «poco fa», «ormai è già…» con la parola giusta.",
  "body": [
    "**刚** (gāng) = «appena», prima del verbo: 我刚到 = sono appena arrivato; 他刚走 = è appena uscito. Di solito non ha bisogno di 了.",
    "**刚才** (gāngcái) = «poco fa» (è un **momento**, come 昨天): 我刚才在家 = poco fa ero a casa; 刚才你说什么？ = che cosa hai detto poco fa? Come ogni parola di tempo, sta prima del verbo.",
    "**已经** (yǐjīng) = «già, ormai», con **了** in fondo: 我已经吃了 = ho già mangiato; 他已经走了 = è già andato via.",
    "Per «non… ancora» si dice **还没(有)**: 我还没吃饭 = non ho ancora mangiato; 他还没来 = non è ancora venuto.",
    "Non confondere 刚 (azione appena fatta) con 刚才 (momento passato) e con 已经 (quanto è già avvenuto)."
  ],
  "pattern": ["chi", "刚 / 刚才 / 已经", "verbo", "了"],
  "ex": [
    ["我刚到。", "Sono appena arrivato."],
    ["他刚走。", "È appena uscito."],
    ["我刚才在家。", "Poco fa ero a casa."],
    ["刚才你说什么？", "Che cosa hai detto poco fa?"],
    ["我已经吃了。", "Ho già mangiato."],
    ["他还没来。", "Non è ancora venuto."]
  ],
  "dlg": [
    ["A", "你吃饭了吗？", "Hai mangiato?"],
    ["B", "我已经吃了。你呢？", "Ho già mangiato. E tu?"],
    ["A", "我还没吃，我刚到家。", "Io non ancora, sono appena arrivato a casa."],
    ["B", "那你吃吧，我刚才吃过了。", "Allora mangia pure, io ho mangiato poco fa."]
  ],
  "traps": [
    ["我到刚。", "我刚到。", "刚 sta prima del verbo."],
    ["我已经吃。", "我已经吃了。", "已经 di solito vuole 了 in fondo."],
    ["他没还来。", "他还没来。", "«Non ancora» è 还没, con 还 prima."]
  ],
  "quiz": [
    {"k": "order", "zh": "我已经吃了", "it": "Ho già mangiato."},
    {"k": "pick", "q": "Come dici «Sono appena arrivato»?", "opts": ["我刚到。", "我到刚。", "我已经刚到。"], "a": 0},
    {"k": "buco", "zh": "他＿没来。", "opts": ["还", "刚", "已经"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "刚才你说什么？", "opts": ["Che cosa hai detto poco fa?", "Che cosa dirai domani?", "Che cosa dici sempre?"], "a": 0},
    {"k": "buco", "zh": "他＿走了。", "opts": ["已经", "还没", "别"], "a": 0}
  ]
});
