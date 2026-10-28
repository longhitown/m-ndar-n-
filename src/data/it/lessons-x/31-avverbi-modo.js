/* Lezione 31 · 副词（一）：怎么样、多少. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "avverbi-modo",
  "n": 31,
  "title": "副词（一）：怎么样、多少",
  "goal": "会说\"说得好、走得慢、很贵、吃得太多\"，分清 bene / buono 和 molto 的各种用法。",
  "body": [
    "副词修饰动词、形容词或另一个副词，说明**怎么样**或**多少**。汉语常用\"得\"（说得好、走得慢），意大利语把副词放在动词**后面**：**Parlo bene** l'italiano = 我意大利语说得好。",
    "**bene**（好地）是副词，**buono**（好的）是形容词：Parlo **bene**，Il caffè è **buono**。反义词：**male**（不好地）/ **cattivo**。不能说 Parlo buono。",
    "很多副词是在形容词（阴性单数）后面加 **-mente**：facile → facilmente，lento → lentamente，veloce → velocemente。形容词以 -le、-re 结尾时去掉 e：facile → facilmente，regolare → regolarmente。",
    "**molto、poco、troppo、tanto、abbastanza** 有两种身份：修饰**形容词和动词**时不变（**molto** caro = 很贵；Mangio **troppo** = 我吃得太多）；修饰**名词**时是形容词，要和名词一致（**molto** tempo、**molta** acqua、**molti** amici、**molte** case）。",
    "汉语的\"很\"常只起连接作用，意大利语不需要：茶很热 = Il tè è caldo；要强调才用 molto：Il tè è molto caldo。"
  ],
  "pattern": ["动词 + bene / male", "molto + 形容词", "molto / molta / molti / molte + 名词"],
  "ex": [
    ["Parlo bene italiano.", "我意大利语说得好。"],
    ["Lui guida piano.", "他开车开得慢。"],
    ["Il treno è molto veloce.", "火车很快。"],
    ["Mangio troppo.", "我吃得太多。"],
    ["Questo libro è abbastanza caro.", "这本书相当贵。"],
    ["Parla velocemente.", "他说得很快。"],
    ["Ho molto tempo.", "我有很多时间。"],
    ["Ho molti amici.", "我有很多朋友。"]
  ],
  "dlg": [
    ["A", "Parli bene italiano!", "你意大利语说得真好！"],
    ["B", "Grazie, ma parlo ancora male.", "谢谢，不过我还说得不好。"],
    ["A", "Parla più lentamente, per favore.", "请说得再慢一点。"],
    ["B", "Certo. Ho molto tempo.", "好的。我有很多时间。"]
  ],
  "traps": [
    ["Parlo buono italiano.", "Parlo bene italiano.", "\"说得好\"用副词 bene，buono 是形容词。"],
    ["Ho molti tempo.", "Ho molto tempo.", "tempo 是阳性单数，所以是 molto tempo；molti 只用于复数（molti amici）。"],
    ["Lui è molta alto.", "Lui è molto alto.", "修饰形容词的 molto 不变，不跟性数一致。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我意大利语说得好", "opts": ["Parlo buono italiano.", "Parlo bene italiano.", "Parlo molto buono."], "a": 1},
    {"k": "pick", "q": "我有很多朋友", "opts": ["Ho molto amici.", "Ho molti amici.", "Ho molte amici."], "a": 1},
    {"k": "buco", "it": "Questa casa è ___ grande.", "opts": ["molto", "molti", "molta"], "a": 0},
    {"k": "pick", "q": "facile 变成副词是：", "opts": ["facilmente", "facilemente", "facilimente"], "a": 0},
    {"k": "order", "it": "parli bene italiano", "zh": "你意大利语说得好。"}
  ]
});
