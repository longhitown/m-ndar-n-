/* Corso di italiano per chi parla cinese · lezione 6 · 现在时：-are、-ere、-ire.
   Formato: vedi 01-pronuncia.js. */
ITLESSONS.push({
  "id": "presente",
  "n": 6,
  "title": "现在时：-are、-ere、-ire",
  "goal": "会说\"我说、你拿、他睡\"。",
  "body": [
    "意大利语的动词要根据**谁做**来变化。原形（不定式）以 -are、-ere、-ire 结尾：parlare（说）、prendere（拿、要）、dormire（睡觉）。",
    "去掉 -are、-ere、-ire，加上词尾。**-are**：parlo、parli、parla、parliamo、parlate、parlano。**-ere**：prendo、prendi、prende、prendiamo、prendete、prendono。**-ire**：dormo、dormi、dorme、dormiamo、dormite、dormono。",
    "很多 -ire 动词中间要加 **-isc-**：capisco（我懂）、capisci、capisce、capiamo、capite、capiscono。哪些动词加 -isc- 要记住。",
    "词尾已经说明了是谁，所以主语常常省略：**Parlo cinese** = 我说中文。",
    "现在时也可以说马上要做的事：Domani vado a Roma（明天我去罗马）。"
  ],
  "pattern": ["parlo", "parli", "parla", "parliamo", "parlate", "parlano"],
  "ex": [
    ["Parlo cinese.", "我说中文。"],
    ["Studio italiano.", "我学意大利语。"],
    ["Lui prende un caffè.", "他要一杯咖啡。"],
    ["Dormiamo a casa.", "我们在家睡觉。"],
    ["Capisci?", "你懂吗？"],
    ["Domani vado a Roma.", "明天我去罗马。"],
    ["Mangiamo insieme.", "我们一起吃饭。"],
    ["Voi parlate cinese.", "你们说中文。"]
  ],
  "dlg": [
    ["A", "Parli italiano?", "你会说意大利语吗？"],
    ["B", "Un po'. Studio italiano.", "会一点。我在学意大利语。"],
    ["A", "Capisci?", "你懂吗？"],
    ["B", "Sì, capisco.", "是的，我懂。"]
  ],
  "traps": [
    ["Io parlare cinese.", "Parlo cinese.", "动词要变位，不能直接用原形。"],
    ["Capi?", "Capisci?", "capire 要加 -isc-：capisco、capisci、capisce……"]
  ],
  "quiz": [
    {"k": "pick", "q": "tu + parlare", "opts": ["parlo", "parli", "parla"], "a": 1},
    {"k": "pick", "q": "noi + prendere", "opts": ["prendiamo", "prendemo", "prendono"], "a": 0},
    {"k": "pick", "q": "loro + dormire", "opts": ["dormono", "dormano", "dorminono"], "a": 0},
    {"k": "pick", "q": "io + capire", "opts": ["capo", "capisco", "capiro"], "a": 1},
    {"k": "order", "it": "noi parliamo italiano", "zh": "我们说意大利语。"}
  ]
});
