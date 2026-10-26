/* Corso di italiano per chi parla cinese · lezione 1 · 发音：怎么写就怎么读.
   Formato: come src/data/lessons (vedi 01-essere.js), ma al contrario: spiegazioni in cinese, ex = [italiano, cinese],
   traps = [italiano sbagliato, italiano giusto, perché (in cinese)], quiz order = { it: frase da ricomporre, zh: il senso }.
   L'italiano passa da tools/morphit-check.mjs (Morph-it + Hunspell). */
ITLESSONS.push({
  "id": "pronuncia",
  "n": 1,
  "title": "发音：怎么写就怎么读",
  "goal": "看到意大利语单词，就能读出来。",
  "body": [
    "意大利语基本上**怎么写就怎么读**：每个字母都要读出来，规则不多，例外也很少。记住下面几条，几乎所有单词你都会读。",
    "**p、t、c（k）不送气**：读的时候不出气，很像汉语拼音的 b、d、g。比如 **pane**（面包）的 p 接近拼音的 b。意大利语的 **b、d、g 是浊音**，发音时声带要振动，普通话里没有这样的音。",
    "**c 和 g 的读音看后面的字母**：在 e、i 前面读 [tʃ]、[dʒ]，像英语 church、gin 的开头：**ciao、cena、gelato、giorno**；在 a、o、u 前面读 [k]、[g]：**casa、gatto**。想在 e、i 前读 [k]、[g]，就加一个 h：**che、chi、ghi**。",
    "**gn** 读 [ɲ]，舌面贴住上颚，接近汉语\"你\"的声母：**bagno**（浴室）。**gli** 读 [ʎ]，舌面贴住上颚发 l：**figlio**（儿子）。**sc** 在 e、i 前读 [ʃ]，像英语 she：**pesce**（鱼）。",
    "**双辅音要读长**：**pala**（铲子）和 **palla**（球）、**caro**（贵）和 **carro**（货车）意思不一样。**r** 是舌尖颤音（大舌音）。",
    "**重音**一般在倒数第二个音节：a-**MI**-co。如果重音在最后一个元音上，就要写重音符号：**città、caffè、perché**。"
  ],
  "pattern": ["ca · co · cu = [k]", "ce · ci = [tʃ]", "che · chi = [k]"],
  "ex": [
    ["Ciao!", "你好！（也可以说再见）"],
    ["Buongiorno.", "早上好。/ 你好。"],
    ["Il gelato è buono.", "冰淇淋很好吃。"],
    ["Che cos'è questo?", "这是什么？"],
    ["Mio figlio si chiama Luca.", "我儿子叫卢卡。"],
    ["Il pesce è buono.", "鱼很好吃。"],
    ["La città è bella.", "这座城市很漂亮。"]
  ],
  "traps": [
    ["chiao", "ciao", "ch 读 [k]，chiao 会读成\"kiao\"。要读 [tʃ] 就写 ci。"],
    ["citta", "città", "重音落在最后一个元音上，必须写重音符号，不写就是错字。"],
    ["gelatto", "gelato", "单辅音和双辅音不能混：gelato 只有一个 t。"]
  ],
  "quiz": [
    {"k": "pick", "q": "ciao 里的 c 怎么读？", "opts": ["[k]，像英语 cat", "[tʃ]，像英语 church 的 ch", "[s]"], "a": 1, "why": "c 在 i 前读 [tʃ]，这里的 i 不单独发音，只让 c 变软。"},
    {"k": "pick", "q": "哪个词里的 c 读 [k]？", "opts": ["cena", "ciao", "che"], "a": 2, "why": "ch 加 e 或 i 读 [k]。"},
    {"k": "pick", "q": "pala 和 palla 一样吗？", "opts": ["一样，只是写法不同", "不一样：双辅音要读长，意思也不同（铲子 / 球）"], "a": 1},
    {"k": "pick", "q": "amico 的重音在哪儿？", "opts": ["A-mi-co", "a-MI-co", "a-mi-CO"], "a": 1, "why": "一般在倒数第二个音节。"},
    {"k": "pick", "q": "意大利语 pane 里的 p 更像汉语拼音的哪个音？", "opts": ["p（送气）", "b（不送气）", "f"], "a": 1},
    {"k": "pick", "q": "哪种写法是对的？", "opts": ["citta", "città", "cittá"], "a": 1, "why": "a 上的重音符号是 à（向左下斜）。"}
  ]
});
