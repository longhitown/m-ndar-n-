/* Lezione 32 · 副词（二）：时间和频率. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "avverbi-tempo",
  "n": 32,
  "title": "副词（二）：时间和频率",
  "goal": "会说\"已经、还没、从来没、总是、常常、刚刚\"，并放在句子里正确的位置。",
  "body": [
    "表示时间和频率的小词：**già**（已经）、**ancora**（还、还没）、**mai**（从来没、曾经）、**sempre**（总是）、**spesso**（常常）、**appena**（刚刚）、**ormai**（如今已经）。",
    "用**近过去时**时，这些小词一般放在**助动词和过去分词之间**：Ho **già** mangiato（我已经吃过了）；Non ho **ancora** mangiato（我还没吃）；Sono **appena** arrivato（我刚到）。",
    "**mai** 和 non 一起用表示\"从来没有\"：Non sono **mai** stato in Cina = 我从来没去过中国。在问句里，mai 表示\"曾经\"：Sei **mai** stato in Cina? = 你去过中国吗？",
    "**sempre**、**spesso** 放在动词后面或前面都可以：Vado **spesso** al cinema = 我常去看电影；Studio **sempre** la sera = 我总是晚上学习。",
    "和汉语对照：已经 = già，还没 = non ... ancora，从来没 = non ... mai，一直 = sempre，刚 = appena。"
  ],
  "pattern": ["ho + già / ancora / mai + 过去分词", "non + 动词 + mai"],
  "ex": [
    ["Ho già mangiato.", "我已经吃过了。"],
    ["Non ho ancora mangiato.", "我还没吃饭。"],
    ["Non sono mai stato in Cina.", "我从来没去过中国。"],
    ["Studio sempre la sera.", "我总是晚上学习。"],
    ["Vado spesso al cinema.", "我常常去看电影。"],
    ["Sono appena arrivato.", "我刚到。"]
  ],
  "dlg": [
    ["A", "Hai già mangiato?", "你已经吃过了吗？"],
    ["B", "No, non ho ancora mangiato.", "没有，我还没吃。"],
    ["A", "Sei mai stato in un ristorante cinese?", "你去过中餐馆吗？"],
    ["B", "Sì, ci vado spesso.", "去过，我常去。"]
  ],
  "traps": [
    ["Ho già non mangiato.", "Non ho ancora mangiato.", "\"还没\"是 non ... ancora，不说 già non。"],
    ["Mai non vado al cinema.", "Non vado mai al cinema.", "mai 要和 non 一起放在动词前后：non vado mai。"],
    ["Ho appena arrivato.", "Sono appena arrivato.", "arrivare 用 essere：sono arrivato。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我还没吃饭", "opts": ["Non ho ancora mangiato.", "Ho già non mangiato.", "Non ho già mangiato."], "a": 0},
    {"k": "pick", "q": "我从来没去过中国", "opts": ["Non sono mai stato in Cina.", "Sono non mai stato in Cina.", "Mai sono non stato in Cina."], "a": 0},
    {"k": "buco", "it": "Ho ___ mangiato.", "opts": ["già", "mai", "spesso"], "a": 0},
    {"k": "pick", "q": "我刚到", "opts": ["Sono appena arrivato.", "Ho appena arrivato.", "Appena sono arrivato io."], "a": 0},
    {"k": "order", "it": "non ho ancora mangiato", "zh": "我还没吃饭。"}
  ]
});
