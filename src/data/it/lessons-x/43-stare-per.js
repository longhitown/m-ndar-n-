/* Lezione 43 · 快要……了：stare per. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "stare-per",
  "n": 43,
  "title": "快要……了：stare per",
  "goal": "会说\"要下雨了、火车要开了、我快到了\"。",
  "body": [
    "汉语的\"要……了、快要……了\"在意大利语里是 **stare per + 动词原形**：**Sto per** uscire = 我正要出门；Il treno **sta per** partire = 火车要开了。",
    "注意和 **stare + 副动词**（正在做）的区别：**Sto uscendo** = 我正在出门（动作已经开始）；**Sto per uscire** = 我就要出门（动作还没开始）。",
    "说天气：**Sta per** piovere = 要下雨了。这里 stare 变位：sto、stai、sta、stiamo、state、stanno。",
    "过去用 stare 的未完成过去时：**Stavo per** uscire quando è squillato il telefono = 我正要出门的时候电话响了。",
    "也可以说 **essere sul punto di**（正要）：È **sul punto di** piangere = 他快要哭了。"
  ],
  "pattern": ["stare + per + 动词原形", "stavo per + 动词原形"],
  "ex": [
    ["Sto per uscire.", "我正要出门。"],
    ["Il treno sta per partire.", "火车要开了。"],
    ["Sta per piovere.", "要下雨了。"],
    ["Stiamo per arrivare.", "我们快到了。"],
    ["Stavo per uscire quando hai chiamato.", "你打电话的时候我正要出门。"],
    ["È sul punto di piangere.", "他快要哭了。"]
  ],
  "dlg": [
    ["A", "Pronto, dove sei?", "喂，你在哪儿？"],
    ["B", "Sto per arrivare. Il treno sta per fermarsi.", "我快到了。火车要停了。"],
    ["A", "Ti aspetto alla stazione.", "我在车站等你。"],
    ["B", "Perfetto, grazie.", "好的，谢谢。"]
  ],
  "traps": [
    ["Sto di uscire.", "Sto per uscire.", "\"正要\"用 stare per。"],
    ["Sto per uscendo.", "Sto per uscire.", "per 后面用动词原形，不用副动词。"],
    ["Sto uscire.", "Sto per uscire.", "缺少 per。"]
  ],
  "quiz": [
    {"k": "pick", "q": "火车要开了", "opts": ["Il treno sta per partire.", "Il treno sta partendo per.", "Il treno sta di partire."], "a": 0},
    {"k": "pick", "q": "要下雨了", "opts": ["Sta per piovere.", "Sta per piovendo.", "Sta di piovere."], "a": 0},
    {"k": "buco", "it": "Stiamo ___ arrivare.", "opts": ["per", "di", "a"], "a": 0},
    {"k": "pick", "q": "Sto uscendo 和 Sto per uscire 的区别？", "opts": ["前者已经在出门，后者还没出门", "没有区别", "后者已经出门了"], "a": 0},
    {"k": "order", "it": "il treno sta per partire", "zh": "火车要开了。"}
  ]
});
