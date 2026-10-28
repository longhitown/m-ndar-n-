/* Lezione 45 · Un po' e per provare: 看看, 一点. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "chongdie",
  "n": 45,
  "title": "Un po' e per provare: 看看, 一点",
  "goal": "Usare i verbi raddoppiati per «provare un po'» e distinguere 一点, 有点 e 一下.",
  "body": [
    "Se **raddoppi un verbo**, la frase diventa più leggera: «fai un po'», «prova a». 看看 = dai un'occhiata; 想想 = pensaci un po'; 试试 = prova. Spesso si aggiunge 一下 (yíxià): 看一下, 等一下 = aspetta un attimo.",
    "Non si raddoppiano i verbi di stato (是, 有). Al passato 了 si mette in mezzo: 我看了看 = ho dato un'occhiata.",
    "**一点** (yìdiǎn) = «un po' di (quantità)»: 我想喝一点茶 = vorrei un po' di tè; 说慢一点 = parla un po' più piano.",
    "**有点** (yǒudiǎn) = «un po'» **di solito per qualcosa di non gradito**: 今天有点冷 = oggi fa un po' freddo; 我有点累 = sono un po' stanco.",
    "Non confonderli: 有点 sta **davanti all'aggettivo** (有点贵 = un po' caro, è un problema), 一点 sta **dopo l'aggettivo** (便宜一点 = un po' più economico, è una richiesta)."
  ],
  "pattern": ["verbo", "verbo (一下)", "一点 / 有点", "aggettivo"],
  "ex": [
    ["你看看。", "Dai un'occhiata."],
    ["请等一下。", "Aspetta un attimo."],
    ["我想想。", "Ci penso un po'."],
    ["我想喝一点茶。", "Vorrei un po' di tè."],
    ["今天有点冷。", "Oggi fa un po' freddo."],
    ["请说慢一点。", "Per favore, parla un po' più piano."]
  ],
  "dlg": [
    ["A", "这件衣服有点贵。", "Questo vestito è un po' caro."],
    ["B", "那你看看这件，便宜一点。", "Allora guarda questo, costa un po' meno."],
    ["A", "好，我试试。", "Va bene, lo provo."],
    ["B", "请等一下。", "Aspetti un attimo."]
  ],
  "traps": [
    ["这件衣服贵有点。", "这件衣服有点贵。", "有点 sta davanti all'aggettivo."],
    ["请便宜点一。", "请便宜一点。", "L'ordine è 一点, dopo l'aggettivo."],
    ["我想喝有点茶。", "我想喝一点茶。", "Per la quantità si usa 一点, dopo il verbo."]
  ],
  "quiz": [
    {"k": "order", "zh": "这件衣服有点贵", "it": "Questo vestito è un po' caro."},
    {"k": "pick", "q": "Come chiedi «Aspetta un attimo»?", "opts": ["请等一下。", "请一下等。", "请等下一。"], "a": 0},
    {"k": "buco", "zh": "请说慢＿。", "opts": ["一点", "有点", "了"], "a": 0},
    {"k": "buco", "zh": "今天＿冷。", "opts": ["有点", "一点", "一下"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "你看看。", "opts": ["Dai un'occhiata.", "Guarda molto.", "Non guardare."], "a": 0}
  ]
});
