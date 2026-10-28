/* Grammatica del laboratorio: le schede che il traduttore usa per passare dal cinese a un italiano corretto.
   Il traduttore traduce SOLO le parole che hanno una scheda qui: per le altre dice «Non so ancora tradurre
   questa frase» e mostra la frase parola per parola. Per insegnargli una parola nuova basta aggiungere una riga
   nella tabella giusta; poi «node tools/grammar.mjs» prova tutte le frasi verificate (src/data/verified.js).
   Le chiavi sono i caratteri (o la chiave del vocabolario, es. "花#huā", quando due parole hanno gli stessi caratteri). */
var GRAM = {
  /* pronomi: [persona 1-3, numero "s"|"p", genere "m"|"f"|"x" (non si sa), possessivo] */
  pron: {
    "我": [1, "s", "x", "mio"], "你": [2, "s", "x", "tuo"], "您": [3, "s", "x", "Suo"], "他": [3, "s", "m", "suo"], "她": [3, "s", "f", "suo"],
    "我们": [1, "p", "x", "nostro"], "咱们": [1, "p", "x", "nostro"], "你们": [2, "p", "x", "vostro"], "他们": [3, "p", "m", "loro"]
  },

  /* nomi: [singolare, genere, plurale, segni, femminile singolare, femminile plurale]
     segni: m = massa (acqua, tè: «dell'acqua»)      p = di solito al plurale quando è da solo (vestiti, soldi)
            l = lingua («parlo cinese»)            k = parente: col possessivo, al singolare, senza articolo («mio padre»)
            r = relazione: si dice 我朋友 anche senza 的   u = «un mio amico» (uno dei tanti)
            j = mestiere o ruolo: dopo «essere» senza articolo («sono studente»)     t = mezzo di trasporto
            z = mai il partitivo («hai tempo?», non «hai del tempo?»)
            1 = di solito uno solo (ragazzo, moglie): «ha un ragazzo?», non «ha ragazzi?»
            N = il genere è solo grammaticale («questa persona è un mio amico») */
  nouns: {
    "人": ["persona", "f", "persone", "N"], "男人": ["uomo", "m", "uomini"], "女人": ["donna", "f", "donne"],
    "孩子": ["bambino", "m", "bambini", "", "bambina", "bambine"], "男孩": ["ragazzo", "m", "ragazzi"], "女孩": ["ragazza", "f", "ragazze"],
    "朋友": ["amico", "m", "amici", "ru", "amica", "amiche"], "男朋友": ["ragazzo", "m", "ragazzi", "r1"], "女朋友": ["ragazza", "f", "ragazze", "r1"],
    "老人": ["anziano", "m", "anziani", "", "anziana", "anziane"], "客人": ["ospite", "m", "ospiti", "N"], "邻居": ["vicino di casa", "m", "vicini di casa", "ru", "vicina di casa", "vicine di casa"],
    "家人": ["familiare", "m", "familiari", "p"], "父母": ["genitori", "m", "genitori", "pr"],
    "爸爸": ["papà", "m", "papà", "r"], "妈妈": ["mamma", "f", "mamme", "r"],
    "哥哥": ["fratello maggiore", "m", "fratelli maggiori", "k"], "弟弟": ["fratello minore", "m", "fratelli minori", "k"],
    "姐姐": ["sorella maggiore", "f", "sorelle maggiori", "k"], "妹妹": ["sorella minore", "f", "sorelle minori", "k"],
    "丈夫": ["marito", "m", "mariti", "k1"], "妻子": ["moglie", "f", "mogli", "k1"], "儿子": ["figlio", "m", "figli", "k"], "女儿": ["figlia", "f", "figlie", "k"],
    "爷爷": ["nonno", "m", "nonni", "k"], "奶奶": ["nonna", "f", "nonne", "k"], "外公": ["nonno", "m", "nonni", "k"], "外婆": ["nonna", "f", "nonne", "k"],
    "叔叔": ["zio", "m", "zii", "k"], "阿姨": ["zia", "f", "zie", "k"],
    "老师": ["insegnante", "m", "insegnanti", "rj", "insegnante", "insegnanti"], "学生": ["studente", "m", "studenti", "j", "studentessa", "studentesse"],
    "同学": ["compagno di classe", "m", "compagni di classe", "ru", "compagna di classe", "compagne di classe"],
    "同事": ["collega", "m", "colleghi", "ru", "collega", "colleghe"], "老板": ["capo", "m", "capi", "r"],
    "医生": ["medico", "m", "medici", "j", "medico", "medici"], "护士": ["infermiere", "m", "infermieri", "j", "infermiera", "infermiere"],
    "司机": ["autista", "m", "autisti", "j", "autista", "autiste"], "警察": ["poliziotto", "m", "poliziotti", "j", "poliziotta", "poliziotte"],
    "厨师": ["cuoco", "m", "cuochi", "j", "cuoca", "cuoche"], "服务员": ["cameriere", "m", "camerieri", "j", "cameriera", "cameriere"],
    "水": ["acqua", "f", "acque", "m"], "热水": ["acqua calda", "f", "acque calde", "m"], "茶": ["tè", "m", "tè", "m"], "绿茶": ["tè verde", "m", "tè verdi", "m"],
    "咖啡": ["caffè", "m", "caffè", "m"], "牛奶": ["latte", "m", "latte", "m"], "果汁": ["succo di frutta", "m", "succhi di frutta", "m"],
    "啤酒": ["birra", "f", "birre", "m"], "葡萄酒": ["vino", "m", "vini", "m"],
    "米饭": ["riso", "m", "riso", "m"], "早饭": ["colazione", "f", "colazioni"], "午饭": ["pranzo", "m", "pranzi"], "晚饭": ["cena", "f", "cene"],
    "面条": ["noodles", "m", "noodles", "mp"], "饺子": ["raviolo", "m", "ravioli", "p"], "包子": ["panino al vapore", "m", "panini al vapore"],
    "面包": ["pane", "m", "pani", "m"], "鸡蛋": ["uovo", "m", "uova"], "肉": ["carne", "f", "carni", "m"], "牛肉": ["manzo", "m", "manzo", "m"],
    "猪肉": ["maiale", "m", "maiale", "m"], "鸡肉": ["pollo", "m", "pollo", "m"], "鱼": ["pesce", "m", "pesci", "m"], "海鲜": ["frutti di mare", "m", "frutti di mare", "mp"],
    "蔬菜": ["verdura", "f", "verdure", "m"], "豆腐": ["tofu", "m", "tofu", "m"], "汤": ["zuppa", "f", "zuppe"], "小吃": ["spuntino", "m", "spuntini"], "水果": ["frutta", "f", "frutta", "m"],
    "苹果": ["mela", "f", "mele"], "香蕉": ["banana", "f", "banane"], "西瓜": ["anguria", "f", "angurie"], "冰淇淋": ["gelato", "m", "gelati"],
    "甜点": ["dolce", "m", "dolci"], "糖": ["zucchero", "m", "zuccheri", "m"], "盐": ["sale", "m", "sali", "m"], "菜单": ["menù", "m", "menù"],
    "披萨": ["pizza", "f", "pizze"], "意大利面": ["pasta", "f", "paste", "m"], "奶酪": ["formaggio", "m", "formaggi", "m"], "橙子": ["arancia", "f", "arance"],
    "葡萄": ["uva", "f", "uve", "m"], "草莓": ["fragola", "f", "fragole"], "土豆": ["patata", "f", "patate"], "西红柿": ["pomodoro", "m", "pomodori"],
    "书": ["libro", "m", "libri"], "手机": ["cellulare", "m", "cellulari"], "电话": ["telefono", "m", "telefoni"], "电脑": ["computer", "m", "computer"],
    "电视": ["televisione", "f", "televisioni"], "电影": ["film", "m", "film"], "音乐": ["musica", "f", "musiche", "m"], "钱": ["soldi", "m", "soldi", "mp"],
    "票": ["biglietto", "m", "biglietti"], "护照": ["passaporto", "m", "passaporti"], "行李": ["bagaglio", "m", "bagagli"], "地图": ["mappa", "f", "mappe"],
    "衣服": ["vestito", "m", "vestiti", "p"], "衬衫": ["camicia", "f", "camicie"], "裤子": ["pantaloni", "m", "pantaloni", "p"], "鞋子": ["scarpa", "f", "scarpe", "p"],
    "帽子": ["cappello", "m", "cappelli"], "手表": ["orologio", "m", "orologi"], "礼物": ["regalo", "m", "regali"], "东西": ["cosa", "f", "cose"],
    "问题": ["domanda", "f", "domande"], "房子": ["casa", "f", "case"], "房间": ["camera", "f", "camere"], "门": ["porta", "f", "porte"],
    "窗户": ["finestra", "f", "finestre"], "桌子": ["tavolo", "m", "tavoli"], "椅子": ["sedia", "f", "sedie"], "床": ["letto", "m", "letti"],
    "照片": ["foto", "f", "foto"], "笔": ["penna", "f", "penne"], "包": ["borsa", "f", "borse"], "钥匙": ["chiave", "f", "chiavi"], "雨伞": ["ombrello", "m", "ombrelli"],
    "狗": ["cane", "m", "cani"], "猫": ["gatto", "m", "gatti"], "鸟": ["uccello", "m", "uccelli"], "马": ["cavallo", "m", "cavalli"], "熊猫": ["panda", "m", "panda"],
    "花#huā": ["fiore", "m", "fiori"], "树": ["albero", "m", "alberi"],
    "中文": ["cinese", "m", "cinese", "l"], "汉语": ["cinese", "m", "cinese", "l"], "英语": ["inglese", "m", "inglese", "l"], "意大利语": ["italiano", "m", "italiano", "l"],
    "汉字": ["carattere cinese", "m", "caratteri cinesi"], "作业": ["compiti", "m", "compiti", "p"], "考试": ["esame", "m", "esami"], "课": ["lezione", "f", "lezioni"],
    "故事": ["storia", "f", "storie"], "新闻": ["notizie", "f", "notizie", "p"], "游戏": ["gioco", "m", "giochi"], "工作": ["lavoro", "m", "lavori"],
    "名字": ["nome", "m", "nomi"], "天气": ["tempo", "m", "tempo"], "生日": ["compleanno", "m", "compleanni"], "时间": ["tempo", "m", "tempo", "mz"],
    "足球": ["calcio", "m", "calcio"], "药": ["medicina", "f", "medicine"],
    "车": ["macchina", "f", "macchine", "t"], "汽车": ["automobile", "f", "automobili", "t"], "出租车": ["taxi", "m", "taxi", "t"],
    "公共汽车": ["autobus", "m", "autobus", "t"], "地铁": ["metropolitana", "f", "metropolitane", "t"], "火车": ["treno", "m", "treni", "t"],
    "高铁": ["treno ad alta velocità", "m", "treni ad alta velocità", "t"], "飞机": ["aereo", "m", "aerei", "t"], "船": ["nave", "f", "navi", "t"],
    "自行车": ["bicicletta", "f", "biciclette", "t"],
    /* luoghi che si usano anche come nomi (这里有一个超市, 超市很大): «in…» e «a…» stanno nella tabella dei luoghi */
    "学校": ["scuola", "f", "scuole"], "大学": ["università", "f", "università"], "医院": ["ospedale", "m", "ospedali"], "药店": ["farmacia", "f", "farmacie"],
    "银行": ["banca", "f", "banche"], "商店": ["negozio", "m", "negozi"], "超市": ["supermercato", "m", "supermercati"], "市场": ["mercato", "m", "mercati"],
    "饭店": ["ristorante", "m", "ristoranti"], "餐厅": ["ristorante", "m", "ristoranti"], "咖啡馆": ["bar", "m", "bar"], "酒店": ["hotel", "m", "hotel"],
    "公园": ["parco", "m", "parchi"], "图书馆": ["biblioteca", "f", "biblioteche"], "博物馆": ["museo", "m", "musei"], "电影院": ["cinema", "m", "cinema"],
    "厕所": ["bagno", "m", "bagni"], "洗手间": ["bagno", "m", "bagni"], "车站": ["stazione", "f", "stazioni"], "火车站": ["stazione", "f", "stazioni"],
    "机场": ["aeroporto", "m", "aeroporti"], "城市": ["città", "f", "città"], "厨房": ["cucina", "f", "cucine"], "海滩": ["spiaggia", "f", "spiagge"],
    "教堂": ["chiesa", "f", "chiese"], "邮局": ["ufficio postale", "m", "uffici postali"], "广场": ["piazza", "f", "piazze"]
  },

  /* nomi che cambiano significato dopo 有 (avere): 我有两个孩子 = ho due figli */
  haveNouns: { "孩子": ["figlio", "m", "figli", "", "figlia", "figlie"] },

  /* luoghi: [come nome (con l'articolo), «stato o moto a luogo», «moto da luogo» se diverso dalla regola] */
  places: {
    "家": ["casa", "a casa", "da casa"], "学校": ["la scuola", "a scuola"], "大学": ["l'università", "all'università"], "公司": ["l'ufficio", "in ufficio"],
    "医院": ["l'ospedale", "in ospedale"], "药店": ["la farmacia", "in farmacia"], "银行": ["la banca", "in banca"], "警察局": ["la stazione di polizia", "alla stazione di polizia"],
    "商店": ["il negozio", "in negozio"], "超市": ["il supermercato", "al supermercato"], "市场": ["il mercato", "al mercato"], "饭店": ["il ristorante", "al ristorante"],
    "餐厅": ["il ristorante", "al ristorante"], "咖啡馆": ["il bar", "al bar"], "酒吧": ["il pub", "al pub"], "酒店": ["l'hotel", "in hotel"],
    "公园": ["il parco", "al parco"], "图书馆": ["la biblioteca", "in biblioteca"], "博物馆": ["il museo", "al museo"], "电影院": ["il cinema", "al cinema"],
    "厕所": ["il bagno", "in bagno"], "洗手间": ["il bagno", "in bagno"], "车站": ["la stazione", "alla stazione"], "火车站": ["la stazione", "alla stazione"],
    "机场": ["l'aeroporto", "in aeroporto"], "城市": ["la città", "in città"], "厨房": ["la cucina", "in cucina"], "客厅": ["il soggiorno", "in soggiorno"],
    "卧室": ["la camera da letto", "in camera da letto"], "海滩": ["la spiaggia", "in spiaggia"], "教堂": ["la chiesa", "in chiesa"], "邮局": ["l'ufficio postale", "all'ufficio postale"],
    "广场": ["la piazza", "in piazza"], "市中心": ["il centro", "in centro"], "办公室": ["l'ufficio", "in ufficio"], "大使馆": ["l'ambasciata", "all'ambasciata"],
    "寺庙": ["il tempio", "al tempio"], "海": ["il mare", "al mare"], "山": ["la montagna", "in montagna"],
    "中国": ["la Cina", "in Cina"], "意大利": ["l'Italia", "in Italia"], "西西里": ["la Sicilia", "in Sicilia"], "欧洲": ["l'Europa", "in Europa"],
    "美国": ["gli Stati Uniti", "negli Stati Uniti"], "法国": ["la Francia", "in Francia"], "德国": ["la Germania", "in Germania"],
    "英国": ["il Regno Unito", "nel Regno Unito"], "日本": ["il Giappone", "in Giappone"], "西班牙": ["la Spagna", "in Spagna"],
    "北京": ["Pechino", "a Pechino"], "上海": ["Shanghai", "a Shanghai"], "罗马": ["Roma", "a Roma"],
    "这里": [null, "qui", "da qui"], "那里": [null, "lì", "da lì"], "哪里": [null, "dove", "da dove"], "哪儿": [null, "dove", "da dove"]
  },

  /* paese o città + 人 = di quel posto: [maschile, femminile, maschile plurale, femminile plurale] o una forma sola */
  nations: {
    "中国": ["cinese", "cinese", "cinesi", "cinesi"], "意大利": ["italiano", "italiana", "italiani", "italiane"],
    "西西里": ["siciliano", "siciliana", "siciliani", "siciliane"], "美国": ["americano", "americana", "americani", "americane"],
    "法国": ["francese", "francese", "francesi", "francesi"], "德国": ["tedesco", "tedesca", "tedeschi", "tedesche"],
    "英国": ["inglese", "inglese", "inglesi", "inglesi"], "日本": ["giapponese", "giapponese", "giapponesi", "giapponesi"],
    "西班牙": ["spagnolo", "spagnola", "spagnoli", "spagnole"], "欧洲": ["europeo", "europea", "europei", "europee"],
    "罗马": ["romano", "romana", "romani", "romane"], "北京": "di Pechino", "上海": "di Shanghai"
  },

  /* verbi: [infinito, ausiliare "a" (avere) | "e" (essere), segni, preposizione dell'oggetto, infinito dopo 去/来 se diverso]
     segni: d = va verso un luogo (去中国 = vado in Cina)     e = mangiare/bere (massa senza articolo: «bevo acqua»)
            s = abilità (会 = «sapere»: so nuotare)           l = con le lingue («parlo cinese»)
            o = vuole per forza un oggetto (senza oggetto non lo traduco)   n = non prende oggetti
            L = senza oggetto prende «lo» (知道 = lo so) */
  verbs: {
    "吃": ["mangiare", "a", "e"], "喝": ["bere", "a", "e"], "去": ["andare", "e", "dn"], "来": ["venire", "e", "dn"], "回": ["tornare", "e", "dn"],
    "到": ["arrivare", "e", "dn"], "走": ["andare via", "e", "n"], "跑": ["correre", "a", "n"], "住": ["abitare", "a", "dn"],
    "睡觉": ["dormire", "a", "n"], "起床": ["alzarsi", "e", "n"], "洗澡": ["fare la doccia", "a", "n"], "看": ["guardare", "a", "o"], "见": ["vedere", "a", ""],
    "听": ["ascoltare", "a", "o"], "说": ["parlare", "a", "ls"], "问": ["chiedere", "a", "o", "a"], "回答": ["rispondere", "a", "", "a"], "读": ["leggere", "a", "s"],
    "写": ["scrivere", "a", "s"], "画": ["disegnare", "a", "s"], "唱歌": ["cantare", "a", "sn"], "跳舞": ["ballare", "a", "sn"], "玩": ["giocare", "a", "n"],
    "笑": ["ridere", "a", "n"], "哭": ["piangere", "a", "n"], "做": ["fare", "a", "so"], "工作": ["lavorare", "a", "n"], "学": ["studiare", "a", "l"],
    "学习": ["studiare", "a", "l"], "教": ["insegnare", "a", "l"], "买": ["comprare", "a", "o"], "卖": ["vendere", "a", "o"], "付钱": ["pagare", "a", "n"],
    "找": ["cercare", "a", "o"], "找到": ["trovare", "a", "o"], "用": ["usare", "a", "o"], "帮": ["aiutare", "a", ""], "帮助": ["aiutare", "a", ""],
    "等": ["aspettare", "a", ""], "认识": ["conoscere", "a", "o"], "知道": ["sapere", "a", "L"], "懂": ["capire", "a", ""], "明白": ["capire", "a", ""],
    "爱": ["amare", "a", "o"], "担心": ["preoccuparsi", "e", "n"], "希望": ["sperare", "a", "n"], "记得": ["ricordare", "a", "o"], "忘记": ["dimenticare", "a", "o"],
    "开始": ["iniziare", "a", ""], "准备": ["preparare", "a", "o"], "选择": ["scegliere", "a", "o"], "休息": ["riposare", "a", "n"],
    "送": ["regalare", "a", "o"], "告诉": ["dire", "a", "o"], "迟到": ["arrivare in ritardo", "e", "n"], "参加": ["partecipare", "a", "o", "a"], "邀请": ["invitare", "a", "o"],
    "出发": ["partire", "e", "n"], "旅游": ["viaggiare", "a", "n", "", "fare turismo"], "游泳": ["nuotare", "a", "sn"], "下雨": ["piovere", "e", "n"], "下雪": ["nevicare", "e", "n"],
    "生病": ["ammalarsi", "e", "n"], "结婚": ["sposarsi", "e", "n"], "做饭": ["cucinare", "a", "sn"], "吃饭": ["mangiare", "a", "n"], "吃早饭": ["fare colazione", "a", "n"], "吃午饭": ["pranzare", "a", "n"], "吃晚饭": ["cenare", "a", "n"], "看书": ["leggere", "a", "n"],
    "上班": ["andare al lavoro", "e", "n"], "下班": ["staccare dal lavoro", "a", "n"], "打电话": ["telefonare", "a", "", "a"], "开车": ["guidare", "a", "sn"],
    "穿": ["indossare", "a", "o"], "洗": ["lavare", "a", "o"], "等等": ["aspettare", "a", "n"], "试试": ["provare", "a", "o"], "坐": ["sedersi", "e", ""], "看见": ["vedere", "a", "o"], "给": ["dare", "a", "o"]
  },
  /* verbo + oggetto preciso = un altro verbo italiano: [infinito, ausiliare, resa fissa dell'oggetto ("" = sparisce)]
     看书 = leggere, 看电影 = guardare un film, 买东西 = fare acquisti, 坐 + mezzo ("t") = prendere la metropolitana */
  verbObj: {
    "坐": { "t": ["prendere", "a"] },
    "看": { "书": ["leggere", "a"], "电影": ["guardare", "a", "un film"] },
    "买": { "东西": ["fare acquisti", "a", ""] },
    "送": { "礼物": ["fare", "a"] }
  },

  /* aggettivi: [m s, f s, m p, f p] */
  adjs: {
    "好": ["buono", "buona", "buoni", "buone"],
    "大": ["grande", "grande", "grandi", "grandi"], "小": ["piccolo", "piccola", "piccoli", "piccole"], "贵": ["caro", "cara", "cari", "care"],
    "便宜": ["economico", "economica", "economici", "economiche"], "热": ["caldo", "calda", "caldi", "calde"], "冷": ["freddo", "fredda", "freddi", "fredde"],
    "好吃": ["buono", "buona", "buoni", "buone"], "好喝": ["buono", "buona", "buoni", "buone"], "好看": ["bello", "bella", "belli", "belle"],
    "漂亮": ["bello", "bella", "belli", "belle"], "新": ["nuovo", "nuova", "nuovi", "nuove"], "旧": ["vecchio", "vecchia", "vecchi", "vecchie"],
    "老": ["vecchio", "vecchia", "vecchi", "vecchie"], "高": ["alto", "alta", "alti", "alte"], "矮": ["basso", "bassa", "bassi", "basse"],
    "长": ["lungo", "lunga", "lunghi", "lunghe"], "短": ["corto", "corta", "corti", "corte"], "快": ["veloce", "veloce", "veloci", "veloci"],
    "慢": ["lento", "lenta", "lenti", "lente"], "远": ["lontano", "lontana", "lontani", "lontane"], "近": ["vicino", "vicina", "vicini", "vicine"],
    "忙": ["impegnato", "impegnata", "impegnati", "impegnate"], "累": ["stanco", "stanca", "stanchi", "stanche"], "干净": ["pulito", "pulita", "puliti", "pulite"],
    "脏": ["sporco", "sporca", "sporchi", "sporche"], "容易": ["facile", "facile", "facili", "facili"], "难": ["difficile", "difficile", "difficili", "difficili"],
    "简单": ["semplice", "semplice", "semplici", "semplici"], "复杂": ["complicato", "complicata", "complicati", "complicate"],
    "重要": ["importante", "importante", "importanti", "importanti"], "安静": ["tranquillo", "tranquilla", "tranquilli", "tranquille"],
    "方便": ["comodo", "comoda", "comodi", "comode"], "甜": ["dolce", "dolce", "dolci", "dolci"], "咸": ["salato", "salata", "salati", "salate"],
    "辣": ["piccante", "piccante", "piccanti", "piccanti"], "酸": ["aspro", "aspra", "aspri", "aspre"], "苦": ["amaro", "amara", "amari", "amare"],
    "可爱": ["carino", "carina", "carini", "carine"], "开心": ["contento", "contenta", "contenti", "contente"], "高兴": ["contento", "contenta", "contenti", "contente"],
    "难过": ["triste", "triste", "tristi", "tristi"], "胖": ["grasso", "grassa", "grassi", "grasse"], "瘦": ["magro", "magra", "magri", "magre"],
    "重": ["pesante", "pesante", "pesanti", "pesanti"], "轻": ["leggero", "leggera", "leggeri", "leggere"], "奇怪": ["strano", "strana", "strani", "strane"],
    "危险": ["pericoloso", "pericolosa", "pericolosi", "pericolose"], "安全": ["sicuro", "sicura", "sicuri", "sicure"], "生气": ["arrabbiato", "arrabbiata", "arrabbiati", "arrabbiate"],
    "紧张": ["nervoso", "nervosa", "nervosi", "nervose"], "聪明": ["intelligente", "intelligente", "intelligenti", "intelligenti"],
    "有意思": ["interessante", "interessante", "interessanti", "interessanti"], "新鲜": ["fresco", "fresca", "freschi", "fresche"], "饱": ["sazio", "sazia", "sazi", "sazie"]
  },
  /* aggettivi che in italiano diventano «avere …» con le persone: 我饿 = ho fame */
  haveAdjs: { "饿": "fame", "渴": "sete", "困": "sonno" },
  /* aggettivi del tempo che fa: senza soggetto o col tempo come soggetto = «fa caldo» */
  weatherAdjs: { "热": "caldo", "冷": "freddo" },

  /* gradi dell'aggettivo: 很 lega soltanto (很好 = bene), gli altri cambiano il senso */
  degree: { "很": "", "非常": "molto", "太": "troppo", "真": "davvero", "特别": "particolarmente", "有点": "un po'", "挺": "piuttosto" },

  /* tempo: [italiano, "past" | "fut" | ""] */
  time: {
    "今天": ["oggi", ""], "明天": ["domani", "fut"], "昨天": ["ieri", "past"], "后天": ["dopodomani", "fut"], "前天": ["l'altro ieri", "past"],
    "现在": ["adesso", ""], "今年": ["quest'anno", ""], "明年": ["l'anno prossimo", "fut"], "去年": ["l'anno scorso", "past"],
    "早上": ["la mattina", ""], "上午": ["la mattina", ""], "中午": ["a mezzogiorno", ""], "下午": ["il pomeriggio", ""], "晚上": ["la sera", ""],
    "每天": ["ogni giorno", ""], "每年": ["ogni anno", ""], "周末": ["nel fine settimana", ""], "刚才": ["poco fa", "past"],
    "星期一": ["lunedì", ""], "星期二": ["martedì", ""], "星期三": ["mercoledì", ""], "星期四": ["giovedì", ""], "星期五": ["venerdì", ""],
    "星期六": ["sabato", ""], "星期天": ["domenica", ""]
  },

  /* numeri e classificatori */
  nums: { "零": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10, "百": 100 },
  /* classificatori: "" = non si traduce (一本书 = un libro); [contenitore, genere, plurale] = si traduce (一杯茶 = una tazza di tè) */
  clf: {
    "个": "", "本": "", "张": "", "件": "", "条": "", "位": "", "只": "", "辆": "", "部": "", "双": ["paio", "m", "paia"],
    "杯": ["tazza", "f", "tazze"], "瓶": ["bottiglia", "f", "bottiglie"], "碗": ["ciotola", "f", "ciotole"], "盘": ["piatto", "m", "piatti"]
  },
  /* 一杯 + bevanda: la forma che si usa davvero al bar */
  cups: { "咖啡": ["un caffè", "%N caffè"], "啤酒": ["una birra", "%N birre"], "水": ["un bicchiere d'acqua", "%N bicchieri d'acqua"], "牛奶": ["un bicchiere di latte", "%N bicchieri di latte"], "葡萄酒": ["un bicchiere di vino", "%N bicchieri di vino"], "果汁": ["un succo di frutta", "%N succhi di frutta"] },

  /* frasi fatte: si traducono intere */
  fixed: {
    "你好": "Ciao", "您好": "Buongiorno", "你好吗": "Come stai?", "谢谢": "Grazie", "谢谢你": "Grazie", "再见": "Arrivederci", "对不起": "Scusa", "不客气": "Prego",
    "没关系": "Non fa niente", "早上好": "Buongiorno", "晚上好": "Buonasera", "晚安": "Buonanotte", "干杯": "Cin cin!", "明天见": "A domani",
    "我也是": "Anch'io", "多少钱": "Quanto costa?", "这个多少钱": "Quanto costa questo?", "太贵了": "È troppo caro!", "你叫什么": "Come ti chiami?",
    "你叫什么名字": "Come ti chiami?", "我不知道": "Non lo so", "我知道": "Lo so", "我不懂": "Non capisco", "我懂了": "Ho capito", "我明白了": "Ho capito"
  }
};
