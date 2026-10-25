/* Frasi corte di tutti i giorni, in 12 situazioni: [pinyin, caratteri, italiano]. Target dei contributi: phr:<gruppo>:<riga>, da 0. */
var PHRASES = [
  {
    "title": "1. Presentarsi e rompere il ghiaccio",
    "items": [
      ["Nǐ hǎo! Hěn gāo.xìng rèn.shi nǐ.","你好！很高兴认识你。","Ciao! Molto lieto di conoscerti."],
      ["Nǐ jiào shén.me?","你叫什么？","Come ti chiami?"],
      ["Wǒ shì Yì.dà.lì rén, wǒ shì Xī.xī.lǐ rén.","我是意大利人，我是西西里人。","Sono italiano, sono siciliano."],
      ["Nǐ shì nǎ.lǐ rén?","你是哪里人？","Di dove sei?"],
      ["Wǒ zhù zài Xī.xī.lǐ dǎo.","我住在西西里岛。","Abito sull'isola della Sicilia."],
      ["Wǒ zhèng.zài xué Zhōng.wén.","我正在学中文。","Sto studiando il cinese."],
      ["Wǒ zhǐ huì shuō yì.diǎn Zhōng.wén.","我只会说一点中文。","So parlare solo un po' di cinese."],
      ["Nǐ huì shuō Yīng.yǔ ma?","你会说英语吗？","Sai parlare inglese?"],
      ["Zhè shì wǒ dì.yī cì lái Zhōng.guó.","这是我第一次来中国。","Questa è la prima volta che vengo in Cina."],
      ["Wǒ fēi.cháng xǐ.huan Zhōng.guó wén.huà.","我非常喜欢中国文化。","Mi piace moltissimo la cultura cinese."]
    ]
  },
  {
    "title": "2. Capire, farsi capire e chiedere aiuto",
    "items": [
      ["Duì.bu.qǐ, wǒ tīng bù dǒng.","对不起，我听不懂。","Scusa, non capisco (ascoltando)."],
      ["Wǒ kàn bù dǒng Hàn.zì.","我看不懂汉字。","Non capisco i caratteri cinesi (leggendo)."],
      ["Qǐng nǐ shuō màn yì.diǎn.","请你说慢一点。","Per favore parla un po' più lentamente."],
      ["Qǐng zài shuō yí cì.","请再说一次。","Per favore ripeti ancora una volta."],
      ["Zhè.ge Zhōng.wén zěn.me shuō?","这个中文怎么说？","Come si dice questo in cinese?"],
      ["Zhè shì shén.me yì.si?","这是什么意思？","Che cosa significa questo?"],
      ["Nǐ néng bāng wǒ ma?","你能帮我吗？","Puoi aiutarmi?"],
      ["Qǐng bǎ tā xiě xià.lái.","请把它写下来。","Per favore scrivilo."],
      ["Méi wèn.tí, wǒ míng.bai le!","没问题，我明白了！","Nessun problema, ho capito!"],
      ["Bù hǎo yì.si, má.fan nǐ le.","不好意思，麻烦你了。","Scusa il disturbo, ti ho dato fastidio."]
    ]
  },
  {
    "title": "3. Al bar e a colazione",
    "items": [
      ["Zǎo.shang hǎo! Wǒ yào yì bēi kā.fēi.","早上好！我要一杯咖啡。","Buongiorno! Prendo un caffè."],
      ["Nǐ xiǎng hē chá hái.shì kā.fēi?","你想喝茶还是咖啡？","Vuoi bere tè oppure caffè?"],
      ["Wǒ yào yì bēi rè lǜ.chá, xiè.xie.","我要一杯热绿茶，谢谢。","Prendo una tazza di tè verde caldo, grazie."],
      ["Qǐng gěi wǒ yì píng bīng.shuǐ.","请给我一瓶冰水。","Per favore dammi una bottiglia d'acqua fredda."],
      ["Bú yào táng, bú yào niú.nǎi.","不要糖，不要牛奶。","Senza zucchero e senza latte."],
      ["Zhè.lǐ yǒu miàn.bāo hé jī.dàn ma?","这里有面包和鸡蛋吗？","Qui ci sono pane e uova?"],
      ["Wǒ yào liǎng gè ròu bāo.zi.","我要两个肉包子。","Prendo due panini al vapore con la carne."],
      ["Zài zhè.lǐ chī hái.shì dǎ.bāo?","在这里吃还是打包？","Mangi qui o porti via?"],
      ["Dǎ.bāo, wǒ mǎ.shàng yào zǒu.","打包，我马上要走。","Porto via, devo andare subito."],
      ["Zhè.ge kā.fēi zhēn hǎo.hē!","这个咖啡真好喝！","Questo caffè è davvero buono!"]
    ]
  },
  {
    "title": "4. Al ristorante e ordinare",
    "items": [
      ["Nǐ.men hǎo, qǐng.wèn jǐ wèi?","你们好，请问几位？","Salve, in quanti siete?"],
      ["Wǒ.men liǎng wèi, qǐng gěi wǒ.men cài.dān.","我们两位，请给我们菜单。","Siamo in due, ci porti il menù per favore."],
      ["Zhè.lǐ yǒu shén.me hǎo.chī de cài?","这里有什么好吃的菜？","Quali piatti buoni ci sono qui?"],
      ["Wǒ.men yào yì pán jiǎo.zi hé yì wǎn miàn.tiáo.","我们要一盘饺子和一碗面条。","Prendiamo un piatto di ravioli e una ciotola di noodles."],
      ["Zhè.ge cài là ma? Wǒ bù chī là.","这个菜辣吗？我不吃辣。","Questo piatto è piccante? Io non mangio piccante."],
      ["Wǒ chī.sù, wǒ bù chī ròu.","我吃素，我不吃肉。","Sono vegetariano, non mangio carne."],
      ["Qǐng zài lái liǎng píng pí.jiǔ.","请再来两瓶啤酒。","Per favore portaci altre due bottiglie di birra."],
      ["Qǐng gěi wǒ yì shuāng kuài.zi hé yí gè chā.zi.","请给我一双筷子和一个叉子。","Mi dia un paio di bacchette e una forchetta, per favore."],
      ["Wǒ chī bǎo le, fēi.cháng hǎo.chī!","我吃饱了，非常好吃！","Sono sazio, era buonissimo!"],
      ["Fú.wù.yuán, mǎi.dān! Kě.yǐ shuā.kǎ ma?","服务员，买单！可以刷卡吗？","Cameriere, il conto! Si può pagare con la carta?"]
    ]
  },
  {
    "title": "5. Fare acquisti, prezzi e pagamenti",
    "items": [
      ["Qǐng.wèn, zhè.ge duō.shao qián?","请问，这个多少钱？","Scusi, quanto costa questo?"],
      ["Tài guì le! Kě.yǐ pián.yi yì.diǎn ma?","太贵了！可以便宜一点吗？","È troppo caro! Puoi farmi un po' di sconto?"],
      ["Wǒ zhǐ shì kàn.kan, xiè.xie.","我只是看看，谢谢。","Sto solo dando un'occhiata, grazie."],
      ["Zhè jiàn yī.fu wǒ kě.yǐ shì.chuan ma?","这件衣服我可以试穿吗？","Posso provare questo vestito?"],
      ["Zhè.ge tài xiǎo le, yǒu dà yì.diǎn de ma?","这个太小了，有大一点的吗？","Questo è troppo piccolo, ne avete uno un po' più grande?"],
      ["Yǒu qí.tā yán.sè ma? Wǒ xǐ.huan hēi.sè.","有其他颜色吗？我喜欢黑色。","Ci sono altri colori? Mi piace il nero."],
      ["Hǎo, wǒ mǎi zhè.ge. Zěn.me fù.qián?","好，我买这个。怎么付钱？","Ok, compro questo. Come pago?"],
      ["Nǐ kě.yǐ yòng wēi.xìn huò.zhě zhī.fù.bǎo sǎo.mǎ.","你可以用微信或者支付宝扫码。","Puoi scansionare il QR con WeChat o Alipay."],
      ["Wǒ méi.yǒu wēi.xìn, wǒ kě.yǐ yòng xiàn.jīn ma?","我没有微信，我可以用现金吗？","Non ho WeChat, posso usare i contanti?"],
      ["Qǐng gěi wǒ yí gè dài.zi hé shōu.jù.","请给我一个袋子和收据。","Mi dia un sacchetto e lo scontrino, per favore."]
    ]
  },
  {
    "title": "6. Chiedere indicazioni e orientarsi",
    "items": [
      ["Qǐng.wèn, dì.tiě zhàn zài nǎ.lǐ?","请问，地铁站在哪里？","Scusi, dov'è la stazione della metropolitana?"],
      ["Xǐ.shǒu.jiān zài nǎ.lǐ?","洗手间在哪里？","Dov'è il bagno?"],
      ["Nǐ yì.zhí wǎng qián zǒu, rán.hòu wǎng zuǒ guǎi.","你一直往前走，然后往左拐。","Vai sempre dritto, e poi gira a sinistra."],
      ["Yín.háng jiù zài chāo.shì páng.biān.","银行就在超市旁边。","La banca è proprio accanto al supermercato."],
      ["Fàn.diàn zài huǒ.chē.zhàn duì.miàn.","饭店在火车站对面。","Il ristorante è di fronte alla stazione dei treni."],
      ["Lí zhè.lǐ yuǎn ma? Zǒu.lù yào duō.jiǔ?","离这里远吗？走路要多久？","È lontano da qui? Quanto ci vuole a piedi?"],
      ["Bù yuǎn, zǒu.lù zhǐ yào shí fēn.zhōng.","不远，走路只要十分钟。","Non è lontano, a piedi ci vogliono solo dieci minuti."],
      ["Duì.bu.qǐ, wǒ mí.lù le, zhè.ge dì.zhǐ zěn.me qù?","对不起，我迷路了，这个地址怎么去？","Scusa, mi sono perso, come si va a questo indirizzo?"],
      ["Fù.jìn yǒu yào.diàn huò.zhě yī.yuàn ma?","附近有药店或者医院吗？","Qui vicino c'è una farmacia o un ospedale?"],
      ["Wǒ.men zài dì.tiě rù.kǒu jiàn.miàn ba!","我们在地铁入口见面吧！","Incontriamoci all'ingresso della metro!"]
    ]
  },
  {
    "title": "7. Taxi, treni e aeroporto",
    "items": [
      ["Sī.jī shī.fu, qǐng dài wǒ qù zhè.ge jiǔ.diàn.","司机师傅，请带我去这个酒店。","Autista, per favore mi porti a questo hotel."],
      ["Qù jī.chǎng yào duō.shao qián? Yào duō.jiǔ?","去机场要多少钱？要多久？","Quanto costa andare in aeroporto? Quanto ci vuole?"],
      ["Xiàn.zài lù.shang hěn dǔ.chē, wǒ hěn zháo.jí.","现在路上很堵车，我很着急。","Adesso c'è molto traffico per strada, sono di fretta."],
      ["Qǐng zài zhè.lǐ tíng.chē, wǒ yào xià.chē.","请在这里停车，我要下车。","Si fermi qui per favore, devo scendere."],
      ["Wǒ yào mǎi liǎng zhāng míng.tiān qù Shàng.hǎi de gāo.tiě piào.","我要买两张明天去上海的高铁票。","Vorrei comprare due biglietti del treno veloce per Shanghai per domani."],
      ["Huǒ.chē shén.me shí.hou chū.fā? Shén.me shí.hou dào.dá?","火车什么时候出发？什么时候到达？","Quando parte il treno? Quando arriva?"],
      ["Qù Běi.jīng yào zuò jǐ hào xiàn? Zài nǎ.lǐ huàn.chéng?","去北京要坐几号线？在哪里换乘？","Per andare a Pechino che linea devo prendere? Dove cambio?"],
      ["Qǐng gěi wǒ kàn yí.xià nǐ de hù.zhào hé chē.piào.","请给我看一下你的护照和车票。","Mi faccia vedere un attimo il passaporto e il biglietto."],
      ["Wǒ de xíng.li diū le, qǐng bāng.zhù wǒ!","我的行李丢了，请帮助我！","Ho perso il mio bagaglio, per favore aiutatemi!"],
      ["Zhù nǐ yí.lù píng.ān, dào le gěi wǒ fā wēi.xìn!","祝你一路平安，到了给我发微信！","Buon viaggio, quando arrivi mandami un WeChat!"]
    ]
  },
  {
    "title": "8. In hotel e problemi con la stanza",
    "items": [
      ["Nǐ hǎo, wǒ yǒu yù.dìng, wǒ jiào Kè.láo.dí.ào.","你好，我有预订，我叫克劳迪奥。","Buongiorno, ho una prenotazione, mi chiamo Claudio."],
      ["Wǒ yào yì jiān shuāng.rén.jiān, zhù sān gè wǎn.shang.","我要一间双人间，住三个晚上。","Vorrei una camera doppia per tre notti."],
      ["Qǐng.wèn, fáng.jiān hán zǎo.cān ma? Zǎo.cān jǐ diǎn kāi.shǐ?","请问，房间含早餐吗？早餐几点开始？","Scusi, la camera include la colazione? A che ora inizia?"],
      ["Zhè shì nǐ de fáng.kǎ, nǐ de fáng.jiān zài wǔ lóu, diàn.tī zài yòu.bian.","这是你的房卡，你的房间在五楼，电梯在右边。","Ecco la chiave, la camera è al 5° piano, l'ascensore è a destra."],
      ["Qǐng.wèn, jiǔ.diàn de wú.xiàn.wǎng mì.mǎ shì shén.me?","请问，酒店的无线网密码是什么？","Scusi, qual è la password del Wi-Fi dell'hotel?"],
      ["Bù hǎo yì.si, wǒ fáng.jiān de kōng.tiáo huài.le, tài rè le.","不好意思，我房间的空调坏了，太热了。","Mi scusi, l'aria condizionata della mia stanza è rotta, fa troppo caldo."],
      ["Fáng.jiān lǐ méi.yǒu rè.shuǐ, yě méi.yǒu máo.jīn.","房间里没有热水，也没有毛巾。","Nella stanza non c'è acqua calda e non ci sono asciugamani."],
      ["Wǒ kě.yǐ huàn yí gè ān.jìng yì.diǎn de fáng.jiān ma?","我可以换一个安静一点的房间吗？","Posso cambiare con una stanza un po' più silenziosa?"],
      ["Nǐ hǎo, wǒ xiàn.zài yào tuì.fáng, kě.yǐ bāng wǒ jiào chū.zū.chē ma?","你好，我现在要退房，可以帮我叫出租车吗？","Salve, devo fare il check-out ora, può chiamarmi un taxi?"],
      ["Wǒ kě.yǐ bǎ xíng.li fàng zài qián.tái dào xià.wǔ ma?","我可以把行李放在前台到下午吗？","Posso lasciare i bagagli alla reception fino al pomeriggio?"]
    ]
  },
  {
    "title": "9. Tempo, appuntamenti e vita con gli amici",
    "items": [
      ["Xiàn.zài jǐ diǎn le? Wǒ de shǒu.jī méi.diàn le.","现在几点了？我的手机没电了。","Che ore sono adesso? Il mio telefono è scarico."],
      ["Jīn.tiān wǎn.shang nǐ yǒu shí.jiān ma? Wǒ.men yì.qǐ chī wǎn.fàn ba!","今天晚上你有时间吗？我们一起吃晚饭吧！","Stasera hai tempo? Ceniamo insieme!"],
      ["Zhōu.mò nǐ dǎ.suàn zuò shén.me?","周末你打算做什么？","Cosa pensi di fare nel fine settimana?"],
      ["Míng.tiān xià.wǔ sān diǎn bàn wǒ.men zài kā.fēi.guǎn jiàn!","明天下午三点半我们在咖啡馆见！","Ci vediamo domani pomeriggio alle tre e mezza al bar!"],
      ["Duì.bu.qǐ, wǒ chí.dào le, ràng nǐ jiǔ děng le.","对不起，我迟到了，让你久等了。","Scusa se sono in ritardo, ti ho fatto aspettare tanto."],
      ["Méi guān.xi, wǒ yě gāng.cái dào.","没关系，我也刚才到。","Non fa niente, anch'io sono arrivato poco fa."],
      ["Jīn.tiān wǒ qǐng.kè, nǐ bié gēn wǒ kè.qi!","今天我请客，你别跟我客气！","Oggi offro io, non fare complimenti con me!"],
      ["Nǐ kě.yǐ gěi wǒ nǐ de wēi.xìn ma? Wǒ sǎo nǐ!","你可以给我你的微信吗？我扫你！","Mi dai il tuo WeChat? Ti scansiono io!"],
      ["Wǒ.men yì.qǐ pāi zhāng zhào.piàn ba!","我们一起拍张照片吧！","Facciamoci una foto insieme!"],
      ["Jīn.tiān wán de hěn kāi.xīn, xià cì zài.jiàn!","今天玩得很开心，下次再见！","Oggi mi sono divertito molto, alla prossima!"]
    ]
  },
  {
    "title": "10. Lavoro, studio e routine giornaliera",
    "items": [
      ["Nǐ zuò shén.me gōng.zuò? Zài nǎ.lǐ shàng.bān?","你做什么工作？在哪里上班？","Che lavoro fai? Dove lavori?"],
      ["Wǒ zài yì jiā Yì.dà.lì gōng.sī gōng.zuò, jīng.cháng hěn máng.","我在一家意大利公司工作，经常很忙。","Lavoro in un'azienda italiana, sono spesso molto impegnato."],
      ["Wǒ měi.tiān zǎo.shang qī diǎn qǐ.chuáng, bā diǎn kāi.shǐ gōng.zuò.","我每天早上七点起床，八点开始工作。","Ogni giorno mi alzo alle 7 e alle 8 inizio a lavorare."],
      ["Jīn.tiān gōng.zuò tài duō le, wǒ hěn lèi, xiǎng zǎo.diǎn xiū.xi.","今天工作太多了，我很累，想早点休息。","Oggi c'era troppo lavoro, sono stanco e voglio riposare presto."],
      ["Nǐ xué Zhōng.wén xué le duō.jiǔ le?","你学中文学了多久了？","Da quanto tempo studi il cinese?"],
      ["Zhōng.wén de fā.yīn hé shēng.diào yǒu yì.diǎn nán, dàn.shì hěn yǒu yì.si.","中文的发音和声调有一点难，但是很有意思。","La pronuncia e i toni del cinese sono un po' difficili, ma molto interessanti."],
      ["Wǒ měi.tiān dōu liàn.xí shí fēn.zhōng, xī.wàng néng kuài.diǎn jìn.bù.","我每天都练习十分钟，希望能快点进步。","Mi esercito 10 minuti ogni giorno, spero di migliorare in fretta."],
      ["Nǐ de Zhōng.wén shuō de zhēn hǎo! Nǎ.lǐ nǎ.lǐ, hái chà de yuǎn!","你的中文说得真好！哪里哪里，还差得远！","Parli davvero bene il cinese! Macché, me ne manca ancora tanto!"],
      ["Wǒ yào qǐng.jià, míng.tiān bú shàng.bān.","我要请假，明天不上班。","Devo chiedere un permesso, domani non vado al lavoro."],
      ["Xià.bān yǐ.hòu wǒ yào qù xué Zhōng.wén.","下班以后我要去学中文。","Dopo il lavoro vado a studiare cinese."]
    ]
  },
  {
    "title": "11. Salute, corpo ed emergenze",
    "items": [
      ["Wǒ jīn.tiān shēn.tǐ bù shū.fu, tóu hěn téng.","我今天身体不舒服，头很疼。","Oggi non mi sento bene, mi fa molto male la testa."],
      ["Wǒ hǎo.xiàng gǎn.mào le, hái yǒu yì.diǎn fā.shāo.","我好像感冒了，还有一点发烧。","Mi sa che ho preso il raffreddore e ho anche un po' di febbre."],
      ["Wǒ dù.zi téng, zuó.tiān chī huài dōng.xi le.","我肚子疼，昨天吃坏东西了。","Mi fa male la pancia, ieri ho mangiato qualcosa che mi ha fatto male."],
      ["Nǐ yǒu gǎn.mào yào huò.zhě zhǐ.téng yào ma?","你有感冒药或者止疼药吗？","Hai una medicina per il raffreddore o un antidolorifico?"],
      ["Zhè.ge yào zěn.me chī? Yì tiān chī jǐ cì?","这个药怎么吃？一天吃几次？","Come si prende questa medicina? Quante volte al giorno?"],
      ["Fàn hòu chī, yì tiān sān cì, duō hē rè.shuǐ, duō xiū.xi.","饭后吃，一天三次，多喝热水，多休息。","Dopo i pasti, tre volte al giorno, bevi tanta acqua calda e riposa."],
      ["Wǒ duì huā.shēng hé hǎi.xiān guò.mǐn, qǐng bú yào fàng!","我对花生和海鲜过敏，请不要放！","Sono allergico alle arachidi e ai frutti di mare, non metteteli!"],
      ["Jiù.mìng! Qǐng bāng wǒ jiào jǐng.chá huò.zhě yī.shēng!","救命！请帮我叫警察或者医生！","Aiuto! Per favore chiamate la polizia o un medico!"],
      ["Wǒ yào qù yī.yuàn, qǐng bāng wǒ jiào jiù.hù.chē!","我要去医院，请帮我叫救护车！","Devo andare all'ospedale, chiamate un'ambulanza per favore!"],
      ["Yǒu rén tōu le wǒ de shǒu.jī, wǒ yào bào.jǐng.","有人偷了我的手机，我要报警。","Qualcuno mi ha rubato il telefono, voglio chiamare la polizia."]
    ]
  },
  {
    "title": "12. Parlare della Sicilia, dell'Italia e del meteo",
    "items": [
      ["Xī.xī.lǐ shì Yì.dà.lì nán.biān zuì dà de dǎo.","西西里是意大利南边最大的岛。","La Sicilia è l'isola più grande del sud Italia."],
      ["Xī.xī.lǐ de tiān.qì hěn hǎo, yǒu dà.hǎi, měi.shí hé huǒ.shān!","西西里的天气很好，有大海、美食和火山！","Il clima in Sicilia è ottimo, ci sono il mare, il buon cibo e il vulcano!"],
      ["Jīn.tiān tiān.qì zěn.me.yàng? Huì xià.yǔ ma?","今天天气怎么样？会下雨吗？","Com'è il tempo oggi? Pioverà?"],
      ["Jīn.tiān shì qíng.tiān, dàn.shì wài.mian fēng hěn dà, yǒu.diǎn lěng.","今天是晴天，但是外面风很大，有点冷。","Oggi c'è il sole, ma fuori c'è molto vento e fa un po' freddo."],
      ["Chū.mén jì.de dài yǔ.sǎn, duō chuān yí jiàn wài.tào.","出门记得带雨伞，多穿一件外套。","Quando esci ricordati di portare l'ombrello e metti una giacca in più."],
      ["Nǐ qù.guo Yì.dà.lì ma? Huān.yíng nǐ lái Xī.xī.lǐ lǚ.yóu!","你去过意大利吗？欢迎你来西西里旅游！","Sei mai stato in Italia? Sei il benvenuto a viaggiare in Sicilia!"],
      ["Wǒ xǐ.huan Xī.xī.lǐ de měi.shí, yě xǐ.huan hǎi.xiān.","我喜欢西西里的美食，也喜欢海鲜。","Mi piace il cibo siciliano, e anche il pesce."],
      ["Xī.xī.lǐ de xià.tiān hěn rè, dōng.tiān bú tài lěng.","西西里的夏天很热，冬天不太冷。","In Sicilia l'estate è molto calda, l'inverno non è troppo freddo."],
      ["Huān.yíng nǐ lái Xī.xī.lǐ, wǒ qǐng nǐ chī Xī.xī.lǐ měi.shí!","欢迎你来西西里，我请你吃西西里美食！","Vieni in Sicilia, ti invito a mangiare il cibo siciliano!"],
      ["Nǐ qù.guo Běi.jīng ma? Wǒ xiǎng qù Zhōng.guó lǚ.yóu.","你去过北京吗？我想去中国旅游。","Sei stato a Pechino? Io voglio viaggiare in Cina."]
    ]
  }
];
