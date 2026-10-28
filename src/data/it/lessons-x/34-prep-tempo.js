/* Lezione 34 · 介词：时间. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "prep-tempo",
  "n": 34,
  "title": "介词：时间",
  "goal": "会说\"从……到、三天前、两天后、多久了、在……之前\"，分清 da、per、fra、fa、entro。",
  "body": [
    "**da** + 时间 = **从……起、已经……了**（一直持续到现在）：Studio italiano **da tre anni** = 我学意大利语三年了。**da quando?** = 从什么时候起？",
    "**per** + 一段时间 = **持续……**（已经结束或有计划）：Ho studiato **per tre ore** = 我学了三个小时。",
    "**fra / tra** + 一段时间 = **……以后**（将来）：Parto **fra due giorni** = 我两天后出发。过去用 **fa**，放在时间后面：Ho incontrato Marco **due giorni fa** = 我两天前见到了马可。",
    "**da … a …** 表示从……到……，遇到冠词要合成：**dalle** nove **alle** cinque = 从九点到五点；**dal** lunedì **al** venerdì = 从星期一到星期五。",
    "**entro** = **在……之前**（最迟）：Torno **entro** venerdì = 我周五之前回来。**fino a** = **直到**：Resto **fino a** domani。"
  ],
  "pattern": ["da + 时间", "fra + 一段时间", "时间 + fa"],
  "ex": [
    ["Studio italiano da tre anni.", "我学意大利语三年了。"],
    ["Ho studiato per tre ore.", "我学了三个小时。"],
    ["Parto fra due giorni.", "我两天后出发。"],
    ["Lavoro dalle nove alle cinque.", "我从九点工作到五点。"],
    ["Ho incontrato Marco due giorni fa.", "我两天前见到了马可。"],
    ["Torno entro venerdì.", "我周五之前回来。"]
  ],
  "dlg": [
    ["A", "Da quanto tempo studi italiano?", "你学意大利语多久了？"],
    ["B", "Studio italiano da un anno.", "我学了一年了。"],
    ["A", "Quando parti per l'Italia?", "你什么时候去意大利？"],
    ["B", "Parto fra due settimane.", "两个星期以后出发。"]
  ],
  "traps": [
    ["Parto in due giorni.", "Parto fra due giorni.", "\"……以后\"用 fra / tra；in + 时间表示\"用了多久\"。"],
    ["Ho incontrato Marco fra due giorni.", "Ho incontrato Marco due giorni fa.", "过去的\"……前\"用 fa，放在时间后面。"],
    ["Torno entro di venerdì.", "Torno entro venerdì.", "entro 后面直接加时间，不加 di。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我两天后出发", "opts": ["Parto fra due giorni.", "Parto due giorni fa.", "Parto da due giorni."], "a": 0},
    {"k": "pick", "q": "我学意大利语三年了", "opts": ["Studio italiano da tre anni.", "Studio italiano fra tre anni.", "Studio italiano tre anni fa."], "a": 0},
    {"k": "buco", "it": "Ho incontrato Anna due giorni ___.", "opts": ["fa", "fra", "da"], "a": 0},
    {"k": "pick", "q": "我周五之前回来", "opts": ["Torno entro venerdì.", "Torno entro di venerdì.", "Torno per venerdì fa."], "a": 0},
    {"k": "order", "it": "parto fra due giorni", "zh": "我两天后出发。"}
  ]
});
