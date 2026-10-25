/* Slot machine di frasi. Ogni colonna è un blocco; sep = segno dopo la colonna; opzione = [pinyin, caratteri, italiano, fine?]. */
var SLOTS = [
  { id: "ordinare", title: "Ordinare", icon: "🍜", cols: [
      { label: "Come inizi", sep: ",", o: [["Nǐ hǎo", "你好", "ciao"], ["Fú.wù.yuán", "服务员", "cameriere"], ["Bù hǎo yì.si", "不好意思", "scusi"], ["Nín hǎo", "您好", "buongiorno"]] },
      { label: "Cosa dici", sep: "", o: [["wǒ yào", "我要", "prendo"], ["wǒ xiǎng yào", "我想要", "vorrei"], ["qǐng gěi wǒ", "请给我", "mi dia, per favore"], ["wǒ xiǎng diǎn", "我想点", "vorrei ordinare"]] },
      { label: "Cosa ordini", sep: ",", o: [["yí fèn jiǎo.zi", "一份饺子", "una porzione di ravioli"], ["liǎng wǎn miàn.tiáo", "两碗面条", "due ciotole di noodles"], ["sān ge bāo.zi", "三个包子", "tre panini al vapore"], ["yì wǎn mǐ.fàn", "一碗米饭", "una ciotola di riso"], ["yì bēi chá", "一杯茶", "un tè"], ["liǎng bēi pí.jiǔ", "两杯啤酒", "due birre"]] },
      { label: "Per finire", sep: "", o: [["xiè.xie", "谢谢", "grazie"], ["dǎ.bāo", "打包", "da portare via"], ["qǐng kuài yì.diǎn", "请快一点", "fai presto, per favore"], ["xiàn.zài jiù yào", "现在就要", "lo voglio subito"]], end: "." } ] },
  { id: "spostarsi", title: "Spostarsi", icon: "🚆", cols: [
      { label: "Chi chiami", sep: ",", o: [["Qǐng wèn", "请问", "scusi"], ["Shī.fu", "师傅", "autista"], ["Bù hǎo yì.si", "不好意思", "scusi"]] },
      { label: "Come lo dici", sep: "", o: [["qù", "去", "(andare a)"], ["wǒ yào qù", "我要去", "devo andare a"], ["wǒ xiǎng qù", "我想去", "vorrei andare a"], ["wǒ.men yào qù", "我们要去", "dobbiamo andare a"]] },
      { label: "Dove", sep: ",", o: [["huǒ.chē.zhàn", "火车站", "la stazione"], ["jī.chǎng", "机场", "l'aeroporto"], ["dì.tiě.zhàn", "地铁站", "la metro"], ["jiǔ.diàn", "酒店", "l'hotel"], ["yī.yuàn", "医院", "l'ospedale"], ["fàn.diàn", "饭店", "il ristorante"]] },
      { label: "Cosa chiedi", sep: "", o: [["zěn.me zǒu", "怎么走", "come si va", "?"], ["yuǎn ma", "远吗", "è lontano", "?"], ["duō.shao qián", "多少钱", "quanto costa", "?"], ["qǐng kuài yì.diǎn", "请快一点", "fai presto, per favore", "."]], end: "?" } ] },
  { id: "invitare", title: "Invitare", icon: "☕", cols: [
      { label: "Quando", sep: "", o: [["Jīn.tiān wǎn.shang", "今天晚上", "stasera"], ["Míng.tiān", "明天", "domani"], ["Zhōu.mò", "周末", "nel fine settimana"], ["Xià ge xīng.qī", "下个星期", "la prossima settimana"]] },
      { label: "Come proponi", sep: "", o: [["wǒ xiǎng qǐng nǐ", "我想请你", "vorrei invitarti a"], ["wǒ.men yì.qǐ", "我们一起", "noi insieme"]] },
      { label: "Cosa", sep: ",", o: [["chī fàn", "吃饭", "mangiare"], ["hē kā.fēi", "喝咖啡", "bere un caffè"], ["kàn diàn.yǐng", "看电影", "vedere un film"], ["qù gōng.yuán", "去公园", "andare al parco"]] },
      { label: "Chiudi", sep: "", o: [["hǎo ma", "好吗", "ti va?"], ["nǐ yǒu kòng ma", "你有空吗", "sei libero?"], ["zěn.me.yàng", "怎么样", "che ne dici?"], ["nǐ lái ma", "你来吗", "vieni?"]], end: "?" } ] },
  { id: "descrivere", title: "Descrivere", icon: "👀", cols: [
      { label: "Chi o cosa", sep: "", o: [["Zhè jiā fàn.diàn", "这家饭店", "questo ristorante"], ["Zhè ge chéng.shì", "这个城市", "questa città"], ["Zhè jiàn yī.fu", "这件衣服", "questo vestito"], ["Zhè ge fáng.jiān", "这个房间", "questa stanza"], ["Zhè ge shǒu.jī", "这个手机", "questo telefono"]] },
      { label: "Quanto", sep: "", o: [["hěn", "很", "molto"], ["fēi.cháng", "非常", "davvero molto"], ["bú tài", "不太", "non troppo"], ["zhēn", "真", "proprio"]] },
      { label: "Com'è", sep: ",", o: [["dà", "大", "grande"], ["xiǎo", "小", "piccolo"], ["piào.liang", "漂亮", "bello"], ["guì", "贵", "caro"], ["pián.yi", "便宜", "economico"], ["xīn", "新", "nuovo"]] },
      { label: "E poi", sep: "", o: [["wǒ hěn xǐ.huan", "我很喜欢", "mi piace molto", "."], ["nǐ jué.de ne", "你觉得呢", "tu che ne pensi?", "?"], ["duì ma", "对吗", "giusto?", "?"], ["wǒ bù xǐ.huan", "我不喜欢", "non mi piace", "."]] } ] },
  { id: "passato", title: "Raccontare il passato", icon: "⏪", cols: [
      { label: "Quando", sep: "", o: [["Zuó.tiān", "昨天", "ieri"], ["Qián.tiān", "前天", "l'altro ieri"], ["Shàng ge xīng.qī", "上个星期", "la settimana scorsa"], ["Qù nián", "去年", "l'anno scorso"]] },
      { label: "Chi", sep: "", o: [["wǒ", "我", "io"], ["wǒ péng.you", "我朋友", "il mio amico"], ["wǒ.men", "我们", "noi"], ["tā", "他", "lui"]] },
      { label: "Cosa è successo", sep: ",", o: [["mǎi le yì běn shū", "买了一本书", "(ha) comprato un libro"], ["chī le sān ge bāo.zi", "吃了三个包子", "(ha) mangiato tre panini"], ["hē le yì bēi kā.fēi", "喝了一杯咖啡", "(ha) bevuto un caffè"], ["kàn le yí ge diàn.yǐng", "看了一个电影", "(ha) visto un film"], ["qù le Zhōng.guó", "去了中国", "(è) andato in Cina"]] },
      { label: "E poi", sep: "", o: [["", "", "", "."], ["rán.hòu huí jiā le", "然后回家了", "poi è tornato a casa", "."], ["wǒ hěn gāo.xìng", "我很高兴", "ero contento", "."], ["kě.shì hěn lèi", "可是很累", "ma era stanco", "."]], end: "." } ] },
  { id: "prezzi", title: "Chiedere prezzi", icon: "🛍️", cols: [
      { label: "Chi chiami", sep: ",", o: [["Lǎo.bǎn", "老板", "signore"], ["Nǐ hǎo", "你好", "buongiorno"], ["Qǐng wèn", "请问", "scusi"]] },
      { label: "Cosa", sep: "", o: [["zhè ge", "这个", "questo"], ["nà ge", "那个", "quello"], ["zhè jiàn yī.fu", "这件衣服", "questo vestito"], ["nà shuāng xié", "那双鞋", "quelle scarpe"], ["zhè běn shū", "这本书", "questo libro"]] },
      { label: "Domanda", sep: "?", o: [["duō.shao qián", "多少钱", "quanto costa"], ["zěn.me mài", "怎么卖", "come si vende"], ["kě.yǐ pián.yi yì.diǎn ma", "可以便宜一点吗", "si può avere uno sconto"], ["yǒu bié de ma", "有别的吗", "ne avete altri"]] },
      { label: "Reazione", sep: "", o: [["tài guì le, pián.yi yì.diǎn ba", "太贵了，便宜一点吧", "troppo caro, abbassa un po'", "."], ["wǒ zài kàn.kan", "我再看看", "ci penso ancora", "."], ["hǎo, wǒ yào le", "好，我要了", "va bene, lo prendo", "."], ["kě.yǐ yòng shǒu.jī fù qián ma", "可以用手机付钱吗", "posso pagare col telefono?", "?"]], end: "." } ] },
  { id: "bisogni", title: "Esprimere bisogni", icon: "🩹", cols: [
      { label: "Con garbo", sep: ",", o: [["Bù hǎo yì.si", "不好意思", "scusi"], ["Duì.bu.qǐ", "对不起", "mi dispiace"], ["Qǐng wèn", "请问", "scusi"], ["", "", ""]] },
      { label: "Chi", sep: "", o: [["wǒ", "我", "io"], ["wǒ.men", "我们", "noi"], ["wǒ péng.you", "我朋友", "il mio amico"]] },
      { label: "Quanto lo vuoi", sep: "", o: [["xiǎng", "想", "vorrei"], ["yào", "要", "voglio"], ["xū.yào", "需要", "ho bisogno di"]] },
      { label: "Cosa", sep: "", o: [["hē shuǐ", "喝水", "bere acqua"], ["xiū.xi yí.xià", "休息一下", "riposare un po'"], ["qù xǐ.shǒu.jiān", "去洗手间", "andare in bagno"], ["kàn yī.shēng", "看医生", "vedere un medico"], ["dǎ diàn.huà", "打电话", "fare una telefonata"], ["chī diǎn dōng.xi", "吃点东西", "mangiare qualcosa"]], end: "." } ] },
  { id: "paragoni", title: "Fare paragoni", icon: "⚖️", cols: [
      { label: "Cosa confronti", sep: "", o: [["Zhè jiàn yī.fu bǐ nà jiàn", "这件衣服比那件", "questo vestito rispetto a quello"], ["Zhè jiā fàn.diàn bǐ nà jiā", "这家饭店比那家", "questo ristorante rispetto a quello"], ["Wǒ de shǒu.jī bǐ nǐ de", "我的手机比你的", "il mio telefono rispetto al tuo"], ["Wǒ de fáng.jiān bǐ nǐ de", "我的房间比你的", "la mia stanza rispetto alla tua"]] },
      { label: "Com'è", sep: "", o: [["guì", "贵", "più caro"], ["pián.yi", "便宜", "più economico"], ["dà", "大", "più grande"], ["xiǎo", "小", "più piccolo"], ["xīn", "新", "più nuovo"], ["piào.liang", "漂亮", "più bello"]] },
      { label: "Di quanto", sep: ",", o: [["yì.diǎn", "一点", "un po'"], ["duō le", "多了", "molto di più"], ["de duō", "得多", "molto di più"]] },
      { label: "E tu?", sep: "", o: [["nǐ jué.de ne", "你觉得呢", "tu che dici?", "?"], ["wǒ bú tài xǐ.huan", "我不太喜欢", "a me non piace molto", "."], ["duì ma", "对吗", "giusto?", "?"], ["wǒ xǐ.huan", "我喜欢", "a me piace", "."]], end: "." } ] }
];
/* Situazioni da risolvere: need = colonna -> opzione (o lista di opzioni accettate). */
var SITUATIONS = [
  { m: "ordinare", t: "Sei al ristorante. Chiedi due ciotole di noodles da portare via.", need: { 2: 1, 3: 1 } },
  { m: "ordinare", t: "Chiama il cameriere e chiedi un tè con «mi dia, per favore».", need: { 0: 1, 1: 2, 2: 4 } },
  { m: "spostarsi", t: "Sei in aeroporto: chiedi a un passante come si arriva alla stazione dei treni.", need: { 2: 0, 3: 0 } },
  { m: "spostarsi", t: "Sei in taxi: devi andare all'ospedale e ti serve fare presto.", need: { 0: 1, 2: 4, 3: 3 } },
  { m: "invitare", t: "Invita un amico al cinema nel fine settimana.", need: { 0: 2, 2: 2 } },
  { m: "invitare", t: "Domani vuoi offrire un caffè a un amico.", need: { 0: 1, 1: 0, 2: 1 } },
  { m: "descrivere", t: "Descrivi la tua stanza d'hotel: è piccola.", need: { 0: 3, 2: 1 } },
  { m: "descrivere", t: "Di' che questo telefono è davvero molto economico.", need: { 0: 4, 1: 1, 2: 4 } },
  { m: "passato", t: "Racconta che ieri hai bevuto un caffè.", need: { 0: 0, 1: 0, 2: 2 } },
  { m: "passato", t: "Racconta che la settimana scorsa un tuo amico è andato in Cina.", need: { 0: 2, 1: 1, 2: 4 } },
  { m: "prezzi", t: "Dal negoziante: chiedi quanto costano quelle scarpe.", need: { 1: 3, 2: 0 } },
  { m: "prezzi", t: "Hai sentito il prezzo di questo vestito: è troppo caro, chiedi di abbassarlo.", need: { 1: 2, 3: 0 } },
  { m: "bisogni", t: "Hai bisogno di vedere un medico.", need: { 2: 2, 3: 3 } },
  { m: "bisogni", t: "Hai sete: vorresti bere un po' d'acqua.", need: { 2: 0, 3: 0 } },
  { m: "paragoni", t: "Di' che questo vestito è molto più economico di quell'altro.", need: { 0: 0, 1: 1, 2: [1, 2] } },
  { m: "paragoni", t: "Di' che il tuo telefono è un po' più nuovo del suo.", need: { 0: 2, 1: 4, 2: 0 } }
];
