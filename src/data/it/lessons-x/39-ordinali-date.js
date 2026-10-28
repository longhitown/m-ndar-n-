/* Lezione 39 · 第几、几月几号：序数词和日期. Formato: vedi il commento in cima a lessons/01-essere.js (zh) o it/lessons/01-pronuncia.js. Lezione aggiuntiva: si carica al primo uso (gruppo LEZIONIX / corso di italiano). */
ITLESSONS.push({
  "id": "ordinali-date",
  "n": 39,
  "title": "第几、几月几号：序数词和日期",
  "goal": "会说\"第一、第二\"和\"十月十号\"，会说星期、月份和年份。",
  "body": [
    "**序数词**：primo（第一）、secondo（第二）、terzo（第三）、quarto、quinto、sesto、settimo、ottavo、nono、decimo（第十）。从第十一起去掉词尾元音加 **-esimo**：undicesimo、ventesimo。序数词是形容词，要跟名词一致：il **primo** giorno，la **prima** volta，i **primi** amici。",
    "日期用**基数词**，只有每月 1 号用序数词 **primo**：**il primo** ottobre（十月一号）、**il due** ottobre、**il dieci** ottobre。前面加定冠词 il。",
    "星期一到星期日：lunedì、martedì、mercoledì、giovedì、venerdì、sabato、domenica。**月份**：gennaio、febbraio、marzo、aprile、maggio、giugno、luglio、agosto、settembre、ottobre、novembre、dicembre。星期和月份**小写**。",
    "年份：**nel** duemilaventisei = 在 2026 年；说年份一律用 **nel**。\"几月几号？\"：**Che giorno è oggi?** — Oggi è **il dieci ottobre**。",
    "\"星期一\"要用**定冠词**表示\"每个星期一\"：**Il** lunedì studio（每周一我学习）；单说某一天不用：**Lunedì** vado a Roma（这个星期一我去罗马）。"
  ],
  "pattern": ["il + 基数词 + 月份", "il primo + 月份", "nel + 年份"],
  "ex": [
    ["Oggi è il dieci ottobre.", "今天是十月十号。"],
    ["Il primo gennaio è festa.", "一月一号放假。"],
    ["Sono nato nel duemila.", "我是两千年出生的。"],
    ["È la prima volta in Italia.", "这是第一次来意大利。"],
    ["Lunedì vado a Roma.", "星期一我去罗马。"],
    ["Il lunedì studio italiano.", "每个星期一我学意大利语。"]
  ],
  "dlg": [
    ["A", "Che giorno è oggi?", "今天几号？"],
    ["B", "Oggi è lunedì, il dieci ottobre.", "今天星期一，十月十号。"],
    ["A", "Quando parti?", "你什么时候走？"],
    ["B", "Il primo novembre.", "十一月一号。"]
  ],
  "traps": [
    ["Oggi è il primo ottobre il dieci.", "Oggi è il dieci ottobre.", "先说日，再说月：il dieci ottobre。"],
    ["Il uno ottobre.", "Il primo ottobre.", "每月一号用序数词 primo。"],
    ["Sono nato in duemila.", "Sono nato nel duemila.", "说年份用 nel。"]
  ],
  "quiz": [
    {"k": "pick", "q": "十月一号", "opts": ["il primo ottobre", "il uno ottobre", "l'uno ottobre"], "a": 0},
    {"k": "pick", "q": "我是两千年出生的", "opts": ["Sono nato nel duemila.", "Sono nato in duemila.", "Sono nato al duemila."], "a": 0},
    {"k": "buco", "it": "Oggi è il ___ ottobre.", "opts": ["dieci", "decimo", "diecesimo"], "a": 0},
    {"k": "pick", "q": "每个星期一我学习", "opts": ["Il lunedì studio.", "Lunedì studio ogni.", "Il lunedì io studiare."], "a": 0},
    {"k": "order", "it": "oggi è il dieci ottobre", "zh": "今天是十月十号。"}
  ]
});
