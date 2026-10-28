/* Lezione 47 · 我看见他了：过去时和宾语代词. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "pp-pronomi",
  "n": 47,
  "title": "我看见他了：过去时和宾语代词",
  "goal": "会说\"我看见他了、我买了它\"，知道过去分词什么时候要和代词一致。",
  "body": [
    "宾语代词放在**助动词前面**：**L'**ho visto = 我看见他了 / 我看见它了。Hai comprato il libro? — Sì, **l'**ho comprato（买了）。",
    "代词 **lo / la / li / le**（他、她、它、他们、她们）和过去分词的**性数一致**：**lo** ho visto → l'ho visto；**la** ho vista → l'ho vista；**li** ho visti；**le** ho viste。",
    "**l'** 是 lo 或 la 的省音，分词仍然要一致：l'ho visto（他）/ **l'ho vista**（她）；**li / le** 当然也要一致：Ho comprato i libri → **Li** ho comprat**i**；Ho comprato le mele → **Le** ho comprat**e**。",
    "**mi、ti、ci、vi** 后面，分词是否一致是可选的，常常不变：Mi ha chiamato（他给我打过电话）；Ci ha visti / visto。",
    "和汉语对照：汉语常常不说宾语，意大利语的代词放在动词前：**买了**（我买了它）= **L'ho comprato**。"
  ],
  "pattern": ["lo / la / li / le + 助动词 + 过去分词", "l'ho visto / l'ho vista"],
  "ex": [
    ["L'ho visto ieri.", "我昨天看见他了。"],
    ["Hai comprato il libro? Sì, l'ho comprato.", "你买书了吗？买了。"],
    ["Li ho comprati ieri.", "我昨天买了它们。"],
    ["Le ho viste al mercato.", "我在市场上看见她们了。"],
    ["Mi ha chiamato Marco.", "马可给我打过电话。"],
    ["La conosco da due anni.", "我认识她两年了。"]
  ],
  "dlg": [
    ["A", "Hai visto Marco?", "你看见马可了吗？"],
    ["B", "Sì, l'ho visto ieri.", "看见了，我昨天看见他了。"],
    ["A", "E le chiavi?", "那钥匙呢？"],
    ["B", "Le ho trovate sul tavolo.", "我在桌子上找到了。"]
  ],
  "traps": [
    ["Ho li comprati.", "Li ho comprati.", "宾语代词放在助动词前面。"],
    ["Li ho comprato.", "Li ho comprati.", "li 是阳性复数，过去分词要用 comprati。"],
    ["Le ho viste i libri.", "Li ho visti.", "libri 是阳性复数：用 li，分词用 visti。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我买了它们（i libri）", "opts": ["Li ho comprati.", "Li ho comprato.", "Ho li comprati."], "a": 0},
    {"k": "pick", "q": "我看见她了", "opts": ["L'ho vista.", "L'ho visto lei.", "Ho la vista."], "a": 0},
    {"k": "buco", "it": "Le mele? ___ ho comprate.", "opts": ["Le", "Li", "Lo"], "a": 0},
    {"k": "pick", "q": "我昨天看见他了", "opts": ["L'ho visto ieri.", "Ho l'visto ieri.", "L'ho vista ieri lui."], "a": 0},
    {"k": "order", "it": "l'ho visto ieri", "zh": "我昨天看见他了。"}
  ]
});
