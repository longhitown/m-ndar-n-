/* Lezione 20 · Direzione composta: 拿出来, 站起来, 想起来. Formato: vedi il commento in cima a 01-essere.js. */
LESSONS.push({
  "id": "direzione2",
  "n": 20,
  "path": "hsk2_verbi_3",
  "title": "Tirare fuori, alzarsi, ricordarsi: 出来, 起来",
  "goal": "Usare le direzioni dopo un altro verbo, anche in senso figurato.",
  "body": [
    "Le direzioni della lezione precedente si attaccano anche **dopo altri verbi**: 拿 (prendere) + 出来 = 拿出来, tirare fuori; 站 (stare in piedi) + 起来 = 站起来, alzarsi in piedi.",
    "Se c'è un oggetto, spesso va **tra le due parti**: 拿出手机来 = tira fuori il telefono. Con 把 diventa più semplice: 把手机拿出来.",
    "Molte di queste forme hanno un **senso figurato** da imparare come parole: **想起来** = ricordarsi (il pensiero «sale» alla mente); **看起来** = sembrare (a guardarlo); **…下去** = continuare (说下去 = continua a parlare).",
    "起来 dopo un aggettivo vuol dire **cominciare a**: 天气热起来了 = comincia a fare caldo."
  ],
  "pattern": ["verbo", "出 / 起 / 下", "来 / 去"],
  "ex": [
    ["她把书拿出来了。", "Ha tirato fuori il libro."],
    ["请站起来。", "Alzatevi, per favore."],
    ["我想起来了！", "Mi sono ricordato!"],
    ["他看起来很累。", "Sembra molto stanco."],
    ["你说下去。", "Continua (a parlare)."],
    ["天气热起来了。", "Comincia a fare caldo."],
    ["请坐下。", "Siediti, per favore."],
    ["天气冷起来了。", "Comincia a fare freddo."]
  ],
  "dlg": [
    ["A", "你看起来很累。", "Sembri molto stanco."],
    ["B", "对，我今天很累。", "Sì, oggi sono molto stanco."],
    ["A", "你把书拿出来吧，我们学中文。", "Tira fuori il libro, studiamo cinese."],
    ["B", "好。我想起来了，我没有书。", "Va bene. Mi sono ricordato: non ho il libro."]
  ],
  "traps": [
    ["他看来起很累。", "他看起来很累。", "看起来 è un blocco unico: 看 + 起来."],
    ["我想来起了。", "我想起来了。", "Ricordarsi = 想起来."]
  ],
  "quiz": [
    {"k": "pick", "q": "Come si dice «Mi sono ricordato!»?", "opts": ["我想起来了！", "我想出来了！", "我想下去了！"], "a": 0},
    {"k": "pick", "q": "Che cosa vuol dire?", "zh": "他看起来很累。", "opts": ["Sembra molto stanco.", "Guarda una persona stanca.", "Si è stancato di guardare."], "a": 0},
    {"k": "order", "zh": "她把书拿出来了", "it": "Ha tirato fuori il libro."},
    {"k": "pick", "q": "Come si dice «Comincia a fare caldo»?", "opts": ["天气热起来了。", "天气热下去了。", "天气热出来了。"], "a": 0, "why": "Aggettivo + 起来 = cominciare a."},
    {"k": "order", "zh": "请站起来", "it": "Alzatevi, per favore."}
  ]
});
