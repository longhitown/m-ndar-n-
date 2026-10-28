/* Lezione 46 · 我觉得……：secondo me、mi sembra、credo. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "opinioni",
  "n": 46,
  "title": "我觉得……：secondo me、mi sembra、credo",
  "goal": "会说出自己的看法：\"我觉得、在我看来、好像\"。",
  "body": [
    "说自己的看法，最简单的是 **secondo me** = **在我看来**：**Secondo me** è troppo caro = 我觉得太贵了。问别人：**Secondo te**? = 你觉得呢？",
    "**mi sembra / mi pare** = **我觉得、好像**：**Mi sembra** una buona idea（我觉得是个好主意）；**Mi sembra che** sia tardi（我觉得晚了）。",
    "**penso che / credo che** 后面常用**虚拟式**（见第 27 课）：Penso che **sia** vero。如果很肯定，用直陈式：**So che** è vero。",
    "表示同意/不同意：**Sono d'accordo** = 我同意；**Non sono d'accordo** = 我不同意；**Hai ragione** = 你说得对；**Hai torto** = 你错了。",
    "**Che ne pensi?** = 你怎么看？（ne 见第 23 课）。回答：**Penso di sì / di no** = 我觉得是 / 不是。"
  ],
  "pattern": ["secondo me / te / lui + 句子", "mi sembra / credo che + 虚拟式"],
  "ex": [
    ["Secondo me è troppo caro.", "我觉得太贵了。"],
    ["Mi sembra una buona idea.", "我觉得是个好主意。"],
    ["Sono d'accordo con te.", "我同意你的看法。"],
    ["Non sono d'accordo.", "我不同意。"],
    ["Hai ragione.", "你说得对。"],
    ["Che ne pensi?", "你怎么看？"]
  ],
  "dlg": [
    ["A", "Che ne pensi di questo ristorante?", "你觉得这家饭馆怎么样？"],
    ["B", "Secondo me è buono, ma un po' caro.", "我觉得不错，就是有点贵。"],
    ["A", "Sono d'accordo con te.", "我同意你。"],
    ["B", "Allora andiamo in un altro posto?", "那我们去别的地方？"]
  ],
  "traps": [
    ["Secondo me, io penso è caro.", "Secondo me è caro.", "secondo me 已经表示\"我觉得\"，不用再加 penso。"],
    ["Sono accordo.", "Sono d'accordo.", "固定说法 essere d'accordo。"],
    ["Ho d'accordo con te.", "Sono d'accordo con te.", "\"同意\"用 essere，不用 avere。"]
  ],
  "quiz": [
    {"k": "pick", "q": "我觉得太贵了", "opts": ["Secondo me è troppo caro.", "Secondo io è troppo caro.", "Per secondo me è troppo caro."], "a": 0},
    {"k": "pick", "q": "我同意", "opts": ["Sono d'accordo.", "Ho d'accordo.", "Sono accordo."], "a": 0},
    {"k": "buco", "it": "Hai ___.", "opts": ["ragione", "ragionare", "ragionevole"], "a": 0},
    {"k": "pick", "q": "你怎么看？", "opts": ["Che ne pensi?", "Che pensi ne?", "Cosa pensi di ne?"], "a": 0},
    {"k": "order", "it": "secondo me è troppo caro", "zh": "我觉得太贵了。"}
  ]
});
