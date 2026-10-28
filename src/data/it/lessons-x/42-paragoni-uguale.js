/* Lezione 42 · 一样：come、tanto … quanto. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "paragoni-uguale",
  "n": 42,
  "title": "一样：come、tanto … quanto",
  "goal": "会说\"和……一样高\"、\"不如……\"，会用 come 比较。",
  "body": [
    "**(tanto) … quanto** 和 **(così) … come** 表示\"一样……\"：Marco è **alto come** me = 马可和我一样高；Marco è **tanto alto quanto** me。",
    "更常用的是 **come**：Questo vino è **buono come** quello（这种酒和那种一样好）。**come** 后面接人称代词时用重读形式：**come me**，**come te**。",
    "**不如……**：**meno … di**（比……少）：Questo è **meno** caro **di** quello；或 **non … così … come**：Non è **così** caro **come** quello（没有那个那么贵）。",
    "**uguale a**（和……一样）和 **diverso da**（和……不同）：Il mio telefono è **uguale al** tuo；Il tuo è **diverso dal** mio。",
    "和汉语对照：A 跟 B 一样 = A è **come** B；A 没有 B 高 = A **non** è alto **come** B。"
  ],
  "pattern": ["A + essere + 形容词 + come + B", "A + non + essere + così + 形容词 + come + B"],
  "ex": [
    ["Marco è alto come me.", "马可和我一样高。"],
    ["Questo vino è buono come quello.", "这种酒和那种一样好。"],
    ["Non è così caro come quello.", "没有那个那么贵。"],
    ["Il mio telefono è uguale al tuo.", "我的手机和你的一样。"],
    ["Il tuo è diverso dal mio.", "你的和我的不同。"],
    ["Questo è meno caro di quello.", "这个比那个便宜。"]
  ],
  "dlg": [
    ["A", "Il tuo telefono è uguale al mio.", "你的手机和我的一样。"],
    ["B", "Sì, ma il mio è più nuovo.", "对，不过我的更新一点。"],
    ["A", "Non è così nuovo come sembra!", "没有看起来那么新！"],
    ["B", "Hai ragione, ma funziona bene.", "你说得对，不过很好用。"]
  ],
  "traps": [
    ["Marco è alto come io.", "Marco è alto come me.", "come 后面接人称代词要用重读形式 me。"],
    ["Non è tanto caro di quello.", "Non è così caro come quello.", "\"不如\"用 così ... come，不用 di。"],
    ["Il mio è uguale di tuo.", "Il mio è uguale al tuo.", "uguale 后面用 a。"]
  ],
  "quiz": [
    {"k": "pick", "q": "马可和我一样高", "opts": ["Marco è alto come me.", "Marco è alto come io.", "Marco è alto di me."], "a": 0},
    {"k": "pick", "q": "没有那个那么贵", "opts": ["Non è così caro come quello.", "Non è tanto caro di quello.", "È non caro come quello."], "a": 0},
    {"k": "buco", "it": "Il mio telefono è uguale ___ tuo.", "opts": ["al", "di", "da"], "a": 0},
    {"k": "pick", "q": "你的和我的不同", "opts": ["Il tuo è diverso dal mio.", "Il tuo è diverso al mio.", "Il tuo è diverso come il mio."], "a": 0},
    {"k": "order", "it": "marco è alto come me", "zh": "马可和我一样高。"}
  ]
});
