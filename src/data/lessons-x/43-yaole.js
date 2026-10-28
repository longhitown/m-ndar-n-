/* Lezione 43 · Sta per succedere: 要…了. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
LESSONS.push({
  "id": "yaole",
  "n": 43,
  "title": "Sta per succedere: 要…了",
  "goal": "Dire che qualcosa sta per succedere e che qualcosa è cambiato.",
  "body": [
    "**要…了** (yào… le) = «sta per…, tra poco»: 要下雨了 = sta per piovere; 火车要开了 = il treno sta per partire. 要 è davanti al verbo, 了 in fondo.",
    "**快要…了** e **就要…了** rafforzano l'idea di «tra pochissimo»: 快要考试了 = gli esami sono vicini; 我们就要到了 = stiamo per arrivare.",
    "Con un **tempo preciso** davanti si usa 就要…了: 我明天就要走了 = domani parto già.",
    "了 in fondo alla frase indica un **cambiamento di situazione**: 天黑了 = si è fatto buio; 我饿了 = ho fame (adesso); 他是大人了 = ormai è un adulto.",
    "Non confondere con il 了 del passato dopo il verbo (我吃了饭): qui 了 è alla **fine della frase** e dice «ora la situazione è così»."
  ],
  "pattern": ["chi / cosa", "要 / 快要 / 就要", "verbo", "了"],
  "ex": [
    ["要下雨了。", "Sta per piovere."],
    ["火车要开了。", "Il treno sta per partire."],
    ["我们快要到了。", "Stiamo per arrivare."],
    ["我明天就要走了。", "Domani parto già."],
    ["天黑了。", "Si è fatto buio."],
    ["我饿了。", "Ho fame (ora)."]
  ],
  "dlg": [
    ["A", "你看，要下雨了。", "Guarda, sta per piovere."],
    ["B", "对，天黑了。我们回家吧。", "Già, si è fatto buio. Torniamo a casa."],
    ["A", "好。我饿了，我们吃饭吧。", "Va bene. Ho fame, mangiamo."],
    ["B", "我们快要到家了。", "Stiamo per arrivare a casa."]
  ],
  "traps": [
    ["下雨要了。", "要下雨了。", "要 sta davanti al verbo, 了 in fondo."],
    ["火车了要开。", "火车要开了。", "了 va in fondo alla frase."],
    ["我们要明天到了。", "我们明天就要到了。", "Con un tempo preciso si usa 就要…了, e il tempo sta prima."]
  ],
  "quiz": [
    {"k": "order", "zh": "火车要开了", "it": "Il treno sta per partire."},
    {"k": "pick", "q": "Come si dice «Sta per piovere»?", "opts": ["要下雨了。", "下雨要了。", "了要下雨。"], "a": 0},
    {"k": "buco", "zh": "我们快要到＿。", "opts": ["了", "吗", "的"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "天黑了。", "opts": ["Si è fatto buio.", "È buio da ieri.", "Sta per piovere."], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "我明天就要走了。", "opts": ["Domani parto già.", "Ieri sono partito.", "Non parto."], "a": 0}
  ]
});
