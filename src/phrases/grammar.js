/* ===== Laboratorio: correttore d'ordine delle frasi cinesi (segnala solo errori sicuri).
   La traduzione in italiano sta in phrases/translate.js (regole) + data/grammar.js (schede) + data/verified.js (frasi verificate). ===== */
(function () {
  var CP = window.CP, W = CP.WORDS, ORDER = CP.ORDER, esc = CP.esc;
  var byHz = null;
  function keyOf(h) {
    if (!byHz) { byHz = {}; ORDER.forEach(function (k) { var x = W[k].hz; if (!byHz[x]) byHz[x] = k; }); }
    return byHz[h] || null;
  }
  function hz(k) { if (/^VO:/.test(k)) return k.slice(3); return W[k] ? W[k].hz : k; }

  /* ================== tabelle ================== */
  /* persona: [numero 's'|'p', persona 1-3, genere 'm'|'f'|'x'(da scegliere)] */
  var PRON = { "我": [1, "s", "x"], "你": [2, "s", "x"], "您": [3, "s", "x"], "他": [3, "s", "m"], "她": [3, "s", "f"], "它": [3, "s", "m"], "我们": [1, "p", "x"], "咱们": [1, "p", "x"], "你们": [2, "p", "x"], "他们": [3, "p", "m"] };
  var POSS = { "我": "mio", "你": "tuo", "您": "Suo", "他": "suo", "她": "suo", "它": "suo", "我们": "nostro", "咱们": "nostro", "你们": "vostro", "他们": "loro" };
  var PRON_IT = { "1s": "io", "2s": "tu", "3sm": "lui", "3sf": "lei", "1p": "noi", "2p": "voi", "3p": "loro" };
  var TIMEW = { "今天": "oggi", "明天": "domani", "昨天": "ieri", "后天": "dopodomani", "前天": "l'altro ieri", "现在": "adesso", "今年": "quest'anno", "明年": "l'anno prossimo", "去年": "l'anno scorso", "早上": "la mattina presto", "上午": "di mattina", "中午": "a mezzogiorno", "下午": "nel pomeriggio", "晚上": "la sera", "每天": "ogni giorno", "经常": "spesso", "有时候": "qualche volta", "马上": "subito", "刚才": "poco fa", "以前": "prima", "以后": "dopo", "周末": "nel fine settimana", "每年": "ogni anno", "星期一": "lunedì", "星期二": "martedì", "星期三": "mercoledì", "星期四": "giovedì", "星期五": "venerdì", "星期六": "sabato", "星期天": "domenica", "半夜": "a notte fonda", "从来不": "mai" };
  var PASTT = { "昨天": 1, "前天": 1, "去年": 1, "刚才": 1, "以前": 1 }, FUTT = { "明天": 1, "后天": 1, "明年": 1, "以后": 1 };
  var ADVS = { "也": "anche", "都": "tutti", "还": "ancora", "只": "solo", "再": "di nuovo", "又": "di nuovo", "一直": "sempre", "已经": "già", "先": "prima", "一起": "insieme", "就": "", "才": "", "别": "non" };
  var INTENS = { "很": "molto", "非常": "moltissimo", "太": "troppo", "真": "davvero", "更": "ancora più", "最": "il più", "特别": "particolarmente", "有点": "un po'", "挺": "piuttosto" };
  var FAMILY = ["爸爸", "妈妈", "哥哥", "弟弟", "姐姐", "妹妹", "儿子", "女儿", "丈夫", "妻子", "男朋友", "女朋友", "朋友", "老师", "同事", "家人", "父母", "孩子", "老板"];
  var NEG = { "不": 1, "没": 1, "没有": 1 };
  var MODAL = { "想": "vorrei", "要": "voglio", "会": "so", "能": "posso", "可以": "posso", "应该": "dovrei", "必须": "devo" };
  var FINAL = { "吗": 1, "吧": 1, "呢": 1 };
  var QWORDS = { "什么": 1, "谁": 1, "哪里": 1, "哪儿": 1, "为什么": 1, "怎么": 1, "多少": 1, "几": 1, "怎么样": 1, "什么时候": 1, "多久": 1, "哪": 1 };
  var NUMS = { "零": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10, "百": 100 };
  var NUMIT = ["zero", "un", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci"];
  var CLF = { "个": "", "本": "", "张": "", "件": "", "条": "", "位": "", "只": "", "辆": "", "部": "", "杯": "tazza", "瓶": "bottiglia", "碗": "ciotola", "盘": "piatto", "双": "paio", "块": "pezzo", "次": "volta", "岁": "anni" };
  var CLF_OF = { "杯": [["茶", "咖啡"], "tazza", "tazze", "bicchiere", "bicchieri"], "瓶": [[], "bottiglia", "bottiglie", "bottiglia", "bottiglie"], "碗": [[], "ciotola", "ciotole", "ciotola", "ciotole"], "盘": [[], "piatto", "piatti", "piatto", "piatti"], "双": [[], "paio", "paia", "paio", "paia"], "块": [[], "pezzo", "pezzi", "pezzo", "pezzi"] };
  /* classificatore consigliato per nome */
  var NCLF = { "茶": "杯", "咖啡": "杯", "水": "杯", "啤酒": "杯", "果汁": "杯", "牛奶": "杯", "葡萄酒": "杯", "书": "本", "衣服": "件", "上衣": "件", "外套": "件", "衬衫": "件", "票": "张", "桌子": "张", "床": "张", "照片": "张", "纸": "张", "鱼": "条", "裤子": "条", "裙子": "条", "路": "条", "狗": "只", "猫": "只", "鸟": "只", "车": "辆", "汽车": "辆", "自行车": "辆", "鞋子": "双", "袜子": "双", "筷子": "双", "人": "个", "朋友": "个", "学生": "个", "苹果": "个", "鸡蛋": "个", "问题": "个", "房间": "个", "手机": "部", "电影": "部", "饺子": "个", "包子": "个", "面包": "个", "礼物": "个", "老师": "位", "医生": "位", "客人": "位", "面条": "碗", "汤": "碗", "米饭": "碗", "菜": "盘", "饭": "碗" };
  var ADJS = { "大": ["grande", "grande", "grandi"], "小": ["piccolo", "piccola", "piccoli"], "多": ["molto", "molta", "molti"], "少": ["poco", "poca", "pochi"], "贵": ["caro", "cara", "cari"], "便宜": ["economico", "economica", "economici"], "热": ["caldo", "calda", "caldi"], "冷": ["freddo", "fredda", "freddi"], "好": ["buono", "buona", "buoni"], "好吃": ["buono", "buona", "buoni"], "好喝": ["buono", "buona", "buoni"], "好看": ["bello", "bella", "belli"], "漂亮": ["bello", "bella", "belli"], "新": ["nuovo", "nuova", "nuovi"], "旧": ["vecchio", "vecchia", "vecchi"], "老": ["vecchio", "vecchia", "vecchi"], "高": ["alto", "alta", "alti"], "矮": ["basso", "bassa", "bassi"], "长": ["lungo", "lunga", "lunghi"], "短": ["corto", "corta", "corti"], "快": ["veloce", "veloce", "veloci"], "慢": ["lento", "lenta", "lenti"], "远": ["lontano", "lontana", "lontani"], "近": ["vicino", "vicina", "vicini"], "忙": ["occupato", "occupata", "occupati"], "累": ["stanco", "stanca", "stanchi"], "干净": ["pulito", "pulita", "puliti"], "脏": ["sporco", "sporca", "sporchi"], "容易": ["facile", "facile", "facili"], "难": ["difficile", "difficile", "difficili"], "简单": ["semplice", "semplice", "semplici"], "重要": ["importante", "importante", "importanti"], "安静": ["tranquillo", "tranquilla", "tranquilli"], "方便": ["comodo", "comoda", "comodi"], "甜": ["dolce", "dolce", "dolci"], "咸": ["salato", "salata", "salati"], "辣": ["piccante", "piccante", "piccanti"], "可爱": ["carino", "carina", "carini"], "开心": ["contento", "contenta", "contenti"], "高兴": ["contento", "contenta", "contenti"], "难过": ["triste", "triste", "tristi"] };
  var CUP = { "咖啡": ["un caffè", "%N caffè"], "啤酒": ["una birra", "%N birre"], "果汁": ["un succo di frutta", "%N succhi di frutta"], "茶": ["una tazza di tè", "%N tazze di tè"], "水": ["un bicchiere d'acqua", "%N bicchieri d'acqua"], "牛奶": ["un bicchiere di latte", "%N bicchieri di latte"], "葡萄酒": ["un bicchiere di vino", "%N bicchieri di vino"] };
  var HAVE = { "饿": ["fame", "molta"], "渴": ["sete", "molta"], "冷": ["freddo", "molto"], "热": ["caldo", "molto"], "困": ["sonno", "molto"], "怕": [] };
  /* nomi: [singolare, genere, plurale] */
  var NT = {
    "书": ["libro", "m", "libri"], "水": ["acqua", "f", "acque"], "茶": ["tè", "m", "tè"], "咖啡": ["caffè", "m", "caffè"], "牛奶": ["latte", "m", "latte"], "啤酒": ["birra", "f", "birre"], "葡萄酒": ["vino", "m", "vini"], "果汁": ["succo di frutta", "m", "succhi di frutta"],
    "米饭": ["riso", "m", "riso"], "面条": ["pasta", "f", "paste"], "饺子": ["raviolo", "m", "ravioli"], "包子": ["panino al vapore", "m", "panini al vapore"], "面包": ["pane", "m", "pani"], "鸡蛋": ["uovo", "m", "uova"], "肉": ["carne", "f", "carni"], "牛肉": ["manzo", "m", "manzo"], "猪肉": ["maiale", "m", "maiale"], "鸡肉": ["pollo", "m", "polli"], "鱼": ["pesce", "m", "pesci"], "海鲜": ["pesce", "m", "pesce"], "菜": ["verdura", "f", "verdure"], "蔬菜": ["verdura", "f", "verdure"], "豆腐": ["tofu", "m", "tofu"], "汤": ["zuppa", "f", "zuppe"], "水果": ["frutta", "f", "frutta"], "苹果": ["mela", "f", "mele"], "香蕉": ["banana", "f", "banane"], "西瓜": ["anguria", "f", "angurie"], "冰淇淋": ["gelato", "m", "gelati"], "甜点": ["dolce", "m", "dolci"],
    "朋友": ["amico", "m", "amici"], "男朋友": ["fidanzato", "m", "fidanzati"], "女朋友": ["fidanzata", "f", "fidanzate"], "老师": ["insegnante", "m", "insegnanti"], "学生": ["studente", "m", "studenti"], "同事": ["collega", "m", "colleghi"], "医生": ["medico", "m", "medici"], "老板": ["capo", "m", "capi"], "孩子": ["bambino", "m", "bambini"], "人": ["persona", "f", "persone"], "男人": ["uomo", "m", "uomini"], "女人": ["donna", "f", "donne"],
    "爸爸": ["papà", "m", "papà"], "妈妈": ["mamma", "f", "mamme"], "哥哥": ["fratello maggiore", "m", "fratelli maggiori"], "弟弟": ["fratello minore", "m", "fratelli minori"], "姐姐": ["sorella maggiore", "f", "sorelle maggiori"], "妹妹": ["sorella minore", "f", "sorelle minori"], "儿子": ["figlio", "m", "figli"], "女儿": ["figlia", "f", "figlie"], "丈夫": ["marito", "m", "mariti"], "妻子": ["moglie", "f", "mogli"], "父母": ["genitori", "m", "genitori"], "家人": ["famiglia", "f", "famiglie"],
    "手机": ["cellulare", "m", "cellulari"], "电脑": ["computer", "m", "computer"], "电话": ["telefono", "m", "telefoni"], "电视": ["televisione", "f", "televisioni"], "电影": ["film", "m", "film"], "音乐": ["musica", "f", "musica"], "钱": ["soldi", "m", "soldi"], "票": ["biglietto", "m", "biglietti"], "护照": ["passaporto", "m", "passaporti"], "行李": ["bagaglio", "m", "bagagli"], "衣服": ["vestiti", "m", "vestiti"], "鞋子": ["scarpe", "f", "scarpe"], "礼物": ["regalo", "m", "regali"], "东西": ["cosa", "f", "cose"], "问题": ["domanda", "f", "domande"], "车": ["macchina", "f", "macchine"], "汽车": ["automobile", "f", "automobili"], "自行车": ["bicicletta", "f", "biciclette"], "出租车": ["taxi", "m", "taxi"], "地铁": ["metropolitana", "f", "metropolitane"], "火车": ["treno", "m", "treni"], "飞机": ["aereo", "m", "aerei"], "狗": ["cane", "m", "cani"], "猫": ["gatto", "m", "gatti"], "花": ["fiore", "m", "fiori"], "房子": ["casa", "f", "case"], "房间": ["camera", "f", "camere"], "桌子": ["tavolo", "m", "tavoli"], "门": ["porta", "f", "porte"], "照片": ["fotografia", "f", "fotografie"], "中文": ["cinese", "m", "cinese"], "汉语": ["cinese", "m", "cinese"], "英语": ["inglese", "m", "inglese"], "意大利语": ["italiano", "m", "italiano"], "作业": ["compiti", "m", "compiti"], "考试": ["esame", "m", "esami"], "课": ["lezione", "f", "lezioni"], "故事": ["storia", "f", "storie"], "新闻": ["notizie", "f", "notizie"], "游戏": ["gioco", "m", "giochi"], "工作": ["lavoro", "m", "lavori"], "菜单": ["menù", "m", "menù"], "饭": ["pasto", "m", "pasti"], "早饭": ["colazione", "f", "colazioni"], "午饭": ["pranzo", "m", "pranzi"], "晚饭": ["cena", "f", "cene"], "名字": ["nome", "m", "nomi"], "天气": ["tempo", "m", "tempo"], "生日": ["compleanno", "m", "compleanni"], "时间": ["tempo", "m", "tempo"], "时候": ["momento", "m", "momenti"]
  };
  /* luoghi: frase completa con la preposizione (stato in luogo e moto a luogo coincidono quasi sempre) */
  var PLACE = { "家": "a casa", "学校": "a scuola", "大学": "all'università", "公司": "in ufficio", "医院": "in ospedale", "药店": "in farmacia", "银行": "in banca", "警察局": "alla stazione di polizia", "店": "in negozio", "商店": "in negozio", "超市": "al supermercato", "市场": "al mercato", "饭店": "al ristorante", "餐厅": "al ristorante", "咖啡馆": "al bar", "酒吧": "al bar", "酒店": "in hotel", "公园": "al parco", "图书馆": "in biblioteca", "博物馆": "al museo", "电影院": "al cinema", "厕所": "in bagno", "洗手间": "in bagno", "中国": "in Cina", "意大利": "in Italia", "西西里": "in Sicilia", "北京": "a Pechino", "上海": "a Shanghai", "罗马": "a Roma", "欧洲": "in Europa", "美国": "negli Stati Uniti", "法国": "in Francia", "德国": "in Germania", "英国": "nel Regno Unito", "日本": "in Giappone", "西班牙": "in Spagna", "车站": "alla stazione", "火车站": "alla stazione", "机场": "in aeroporto", "城市": "in città", "国家": "nel paese", "房间": "in camera", "客厅": "in soggiorno", "卧室": "in camera da letto", "厨房": "in cucina", "这里": "qui", "那里": "là", "这儿": "qui", "那儿": "là", "外面": "fuori", "里面": "dentro", "上面": "sopra", "下面": "sotto", "附近": "qui vicino", "海滩": "in spiaggia", "教堂": "in chiesa", "邮局": "all'ufficio postale", "广场": "in piazza", "市中心": "in centro", "岛": "sull'isola" };
  /* verbi: hz -> infinito, ausiliare 'a'/'e', particolarità */
  var VB = {
    "吃": ["mangiare", "a"], "看见": ["vedere", "a"], "想要": ["volere", "a"], "打电话": ["telefonare", "a"], "要": ["volere", "a"], "想": ["desiderare", "a"], "喝": ["bere", "a"], "去": ["andare", "e"], "来": ["venire", "e"], "回": ["tornare", "e"], "到": ["arrivare", "e"], "走": ["camminare", "a"], "跑": ["correre", "a"], "进": ["entrare", "e"], "出": ["uscire", "e"], "上": ["salire", "e"], "下": ["scendere", "e"], "坐": ["prendere", "a"], "住": ["abitare", "a"], "睡觉": ["dormire", "a"], "起床": ["alzarsi", "e"], "洗": ["lavare", "a"], "洗澡": ["fare la doccia", "a", "fare"], "穿": ["indossare", "a"], "看": ["guardare", "a"], "见": ["vedere", "a"], "听": ["ascoltare", "a"], "说": ["parlare", "a"], "讲": ["raccontare", "a"], "问": ["chiedere", "a"], "回答": ["rispondere", "a"], "告诉": ["dire", "a"], "读": ["leggere", "a"], "写": ["scrivere", "a"], "画": ["disegnare", "a"], "唱歌": ["cantare", "a"], "跳舞": ["ballare", "a"], "玩": ["giocare", "a"], "笑": ["ridere", "a"], "哭": ["piangere", "a"],
    "做": ["fare", "a"], "工作": ["lavorare", "a"], "学": ["studiare", "a"], "学习": ["studiare", "a"], "教": ["insegnare", "a"], "买": ["comprare", "a"], "卖": ["vendere", "a"], "付钱": ["pagare", "a"], "花": ["spendere", "a"], "开": ["aprire", "a"], "关": ["chiudere", "a"], "拿": ["prendere", "a"], "带": ["portare", "a"], "放": ["mettere", "a"], "找": ["cercare", "a"], "找到": ["trovare", "a"], "用": ["usare", "a"], "帮": ["aiutare", "a"], "帮助": ["aiutare", "a"], "等": ["aspettare", "a"], "认识": ["conoscere", "a"], "知道": ["sapere", "a"], "了解": ["capire", "a"], "懂": ["capire", "a"], "明白": ["capire", "a"], "爱": ["amare", "a"], "怕": ["avere paura di", "a", "avere"], "担心": ["preoccuparsi", "e"], "觉得": ["pensare", "a"], "认为": ["ritenere", "a"], "希望": ["sperare", "a"], "相信": ["credere", "a"], "记得": ["ricordare", "a"], "忘记": ["dimenticare", "a"], "开始": ["iniziare", "a"], "完成": ["finire", "a"], "准备": ["preparare", "a"], "决定": ["decidere", "a"], "选择": ["scegliere", "a"], "试试": ["provare", "a"], "休息": ["riposare", "a"], "叫": ["chiamarsi", "e"], "送": ["regalare", "a"], "迟到": ["arrivare in ritardo", "e", "arrivare"], "参加": ["partecipare a", "a", "partecipare"], "邀请": ["invitare", "a"], "介绍": ["presentare", "a"], "出发": ["partire", "e"], "到达": ["arrivare", "e"], "旅游": ["viaggiare", "a"], "游泳": ["nuotare", "a"], "打电话": ["telefonare", "a"], "喜欢": ["piacere", "e"], "生病": ["ammalarsi", "e"], "结婚": ["sposarsi", "e"], "下雨": ["piovere", "e"], "下雪": ["nevicare", "e"], "打包": ["portare via", "a", "portare"], "买单": ["pagare il conto", "a", "pagare"], "想念": ["mancare", "e"]
  };
  /* composti verbo+oggetto: l'oggetto è già dentro il verbo italiano */
  var VO = { "吃饭": ["mangiare", ""], "做饭": ["cucinare", ""], "喝水": ["bere", "acqua"], "看书": ["leggere", ""], "睡觉": ["dormire", ""], "上班": ["andare al lavoro", ""] };
  var IRRP = { "essere": ["sono", "sei", "è", "siamo", "siete", "sono"], "avere": ["ho", "hai", "ha", "abbiamo", "avete", "hanno"], "andare": ["vado", "vai", "va", "andiamo", "andate", "vanno"], "venire": ["vengo", "vieni", "viene", "veniamo", "venite", "vengono"], "fare": ["faccio", "fai", "fa", "facciamo", "fate", "fanno"], "dire": ["dico", "dici", "dice", "diciamo", "dite", "dicono"], "potere": ["posso", "puoi", "può", "possiamo", "potete", "possono"], "volere": ["voglio", "vuoi", "vuole", "vogliamo", "volete", "vogliono"], "dovere": ["devo", "devi", "deve", "dobbiamo", "dovete", "devono"], "sapere": ["so", "sai", "sa", "sappiamo", "sapete", "sanno"], "bere": ["bevo", "bevi", "beve", "beviamo", "bevete", "bevono"], "uscire": ["esco", "esci", "esce", "usciamo", "uscite", "escono"], "stare": ["sto", "stai", "sta", "stiamo", "state", "stanno"], "dare": ["do", "dai", "dà", "diamo", "date", "danno"], "salire": ["salgo", "sali", "sale", "saliamo", "salite", "salgono"], "scegliere": ["scelgo", "scegli", "sceglie", "scegliamo", "scegliete", "scelgono"], "piacere": ["piaccio", "piaci", "piace", "piacciamo", "piacete", "piacciono"], "sedersi": ["siedo", "siedi", "siede", "sediamo", "sedete", "siedono"], "rimanere": ["rimango", "rimani", "rimane", "rimaniamo", "rimanete", "rimangono"], "tenere": ["tengo", "tieni", "tiene", "teniamo", "tenete", "tengono"], "conoscere": ["conosco", "conosci", "conosce", "conosciamo", "conoscete", "conoscono"], "dormire": ["dormo", "dormi", "dorme", "dormiamo", "dormite", "dormono"], "capire": ["capisco", "capisci", "capisce", "capiamo", "capite", "capiscono"] };
  var IRRPP = { "essere": "stato", "fare": "fatto", "dire": "detto", "bere": "bevuto", "leggere": "letto", "scrivere": "scritto", "prendere": "preso", "mettere": "messo", "vedere": "visto", "aprire": "aperto", "chiudere": "chiuso", "rispondere": "risposto", "perdere": "perso", "scegliere": "scelto", "spendere": "speso", "venire": "venuto", "chiedere": "chiesto", "correre": "corso", "ridere": "riso", "piangere": "pianto", "rimanere": "rimasto", "scendere": "sceso", "decidere": "deciso", "conoscere": "conosciuto", "nascere": "nato", "vendere": "venduto", "piacere": "piaciuto", "sedersi": "seduto", "tenere": "tenuto" };
  var IRRG = { "fare": "facendo", "dire": "dicendo", "bere": "bevendo", "dare": "dando", "stare": "stando" };
  var NOISC = { "dormire": 1, "aprire": 1, "partire": 1, "sentire": 1, "offrire": 1, "servire": 1, "seguire": 1, "coprire": 1, "salire": 1, "uscire": 1, "venire": 1 };
  var ABILITY = { "说": 1, "游泳": 1, "唱歌": 1, "跳舞": 1, "做": 1, "写": 1, "读": 1, "开": 1, "画": 1, "吃": 1, "用": 1 };

  /* ================== ruolo di ogni parola (per il correttore) ================== */
  function roleOf(h, ctx) {
    if (PRON[h]) return "pron"; if (TIMEW[h] !== undefined) return "time"; if (NEG[h]) return "neg";
    if (ADVS[h] !== undefined) return "adv"; if (INTENS[h] !== undefined) return "int"; if (MODAL[h]) return "modal"; if (FINAL[h]) return "final";
    if (QWORDS[h]) return "q"; if (NUMS[h] !== undefined) return "num"; if (h === "这" || h === "那") return "dem"; if (CLF[h] !== undefined && h !== "天") return "clf";
    if (h === "跟" || h === "和" || h === "给") return "with"; if (h === "在") return "at"; if (h === "是") return "cop"; if (h === "有") return "have"; if (h === "的") return "de";
    if (h === "了" || h === "过" || h === "着") return "asp"; if (h === "正在") return "prog";
    if (h === "不是") return "negcop"; if (VO[h]) return "vo"; if (VB[h]) return "verb"; if (ADJS[h] || HAVE[h]) return "adj"; if (PLACE[h]) return "place";
    return "noun";
  }
  /* ================== correttore d'ordine ================== */
  /* Prudente: segnala solo errori sicuri (precisione prima della copertura). Ogni regola e' una cosa che un cinese non direbbe mai. */
  var ACTV2 = { "吃": 1, "喝": 1, "学": 1, "学习": 1, "看": 1, "买": 1, "工作": 1, "睡觉": 1, "玩": 1, "做": 1, "读": 1, "写": 1, "唱歌": 1, "跳舞": 1, "洗澡": 1, "吃饭": 1, "做饭": 1, "看书": 1, "卖": 1, "听": 1, "说": 1, "教": 1, "游泳": 1, "跑": 1, "走": 1, "起床": 1 };
  var NOCLF = { "点": 1, "分钟": 1, "小时": 1, "天": 1, "年": 1, "月": 1, "岁": 1, "周": 1, "块": 1, "元": 1, "次": 1 };
  function check(tokens) {
    var res = { ok: true, issues: [], fixed: tokens.slice(), steps: [], changed: false };
    if (tokens.length < 2) return res;
    var t = tokens.slice(), steps = [], issues = [], H = function () { return t.map(hz); };
    var R = function (x) { return roleOf(x); };
    function firstVerb(h) { for (var i = 0; i < h.length; i++) { var r = R(h[i]); if (r === "verb" || r === "vo" || r === "cop" || r === "have" || r === "negcop") return i; } return -1; }
    function subjEnd(h) { var r0 = R(h[0] || ""); if (r0 === "pron") return h.length > 1 && R(h[1]) === "noun" && FAMILY.indexOf(h[1]) >= 0 ? 2 : 1; return 0; }
    function chainStart(h, v) { var i = v; while (i > 0 && ["modal", "neg", "adv", "int", "prog"].indexOf(R(h[i - 1])) >= 0) i--; return i; }
    function groupAt(h, j, kinds) { var e = j + 1; while (e < h.length && e - j < 3 && kinds.indexOf(R(h[e])) >= 0) { e++; if (R(h[e - 1]) === "pron") break; } return e; }
    function addIssue(m) { if (issues.indexOf(m) < 0) issues.push(m); }

    /* 1. 是 + aggettivo senza 很:  我是好 -> 我很好 */
    var h = H(), i;
    if (h.indexOf("把") >= 0 || h.indexOf("被") >= 0 || h.indexOf("请") >= 0) { /* strutture complesse: non correggo */
      var onlyBasic = true; res.fixed = t; return res;
    }
    for (i = 0; i < h.length - 1; i++) {
      if (h[i] === "是" && R(h[i + 1]) === "adj" && !HAVE[h[i + 1]] && (i + 2 >= h.length || FINAL[h[i + 2]])) {
        var kv = keyOf("很"); steps.push("Ho sostituito 是 con 很: davanti a un aggettivo non si usa 是 (si dice 我很好, non 我是好)."); addIssue("是 davanti a un aggettivo."); if (kv) t[i] = kv; else t.splice(i, 1); break;
      }
    }
    /* 2. 二 prima di classificatore -> 两 */
    h = H();
    for (i = 0; i < h.length - 1; i++) {
      if (h[i] === "二" && CLF[h[i + 1]] !== undefined && !NOCLF[h[i + 1]] && !(i > 0 && NUMS[h[i - 1]] !== undefined) && h[i - 1] !== "第") {
        var kl = keyOf("两"); if (kl) { t[i] = kl; steps.push("Ho sostituito 二 con 两: per contare cose e persone davanti a un classificatore si dice 两 (两杯茶, 两个人), non 二."); addIssue("二 davanti a un classificatore."); }
      }
    }
    /* 3. numero / 这 / 那 + nome che vuole il classificatore, senza classificatore */
    h = H();
    for (i = 0; i < h.length - 1; i++) {
      var cur = h[i], nx = h[i + 1];
      var isNum = NUMS[cur] !== undefined && cur !== "百" && cur !== "零" && !(i > 0 && NUMS[h[i - 1]] !== undefined && cur !== "十");
      if ((isNum || cur === "这" || cur === "那") && (NCLF[nx] || FAMILY.indexOf(nx) >= 0) && W[t[i + 1]]) {
        var cl = NCLF[nx] || "个", kc = keyOf(cl) || keyOf("个");
        if (kc) { t.splice(i + 1, 0, kc); steps.push("Ho inserito il classificatore " + hz(kc) + " tra «" + cur + "» e «" + nx + "»: in cinese tra numero (o 这/那) e nome serve un classificatore (" + cur + hz(kc) + nx + ")."); addIssue("Manca il classificatore."); h = H(); }
      }
    }
    /* 4. 吗 + parola interrogativa (什么, 哪里, 谁…): si usa uno solo dei due */
    h = H();
    var qi = -1, mi = h.indexOf("吗"); h.forEach(function (x, ix) { if (QWORDS[x] && x !== "几" && x !== "多少" && x !== "怎么样") qi = ix; });
    if (qi >= 0 && mi >= 0) { t.splice(mi, 1); steps.push("Ho tolto 吗: con una parola interrogativa (什么, 哪里, 谁…) la particella 吗 non si usa."); addIssue("吗 con parola interrogativa."); }
    /* 5. 吗 / 吧 / 呢 non sono alla fine */
    h = H();
    for (i = 0; i < h.length - 1; i++) {
      if ((h[i] === "吗") && h.slice(i + 1).some(function (x) { return !FINAL[x]; })) {
        var mk = t.splice(i, 1)[0]; t.push(mk); steps.push("Ho spostato 吗 in fondo: la particella interrogativa chiude sempre la frase."); addIssue("Ordine non valido."); break;
      }
    }
    /* 6. TEMPO dopo il verbo -> subito dopo il soggetto */
    h = H();
    var v = firstVerb(h), moved = false;
    if (v >= 0) {
      var se = subjEnd(h), tm = [];
      for (i = v + 1; i < h.length; i++) {
        var prevR = R(h[i - 1] || ""), nxr = R(h[i + 1] || "");
        if (TIMEW[h[i]] !== undefined && h[i] !== "从来不" && prevR !== "num" && prevR !== "clf" && prevR !== "de" && ["到", "从", "等", "的", "前", "到了"].indexOf(h[i - 1]) < 0 && h[i - 1] !== "每" && nxr !== "clf") tm.push(i);
      }
      if (tm.length) {
        var tk = tm.map(function (ix) { return t[ix]; });
        for (i = tm.length - 1; i >= 0; i--) t.splice(tm[i], 1);
        t.splice.apply(t, [se, 0].concat(tk));
        steps.push("Ho spostato «" + tk.map(hz).join("") + "» (il TEMPO) subito dopo il soggetto: in cinese si dice QUANDO prima di dire cosa fai (我今天…, 我昨天…).");
        addIssue("Ordine non valido."); moved = true;
      }
    }
    /* 7. 跟 + persona e 在 + luogo dopo un verbo d'azione -> prima del verbo */
    h = H(); v = firstVerb(h);
    if (v >= 0 && ACTV2[h[v]]) {
      var groups = [];
      for (i = v + 1; i < h.length; i++) {
        if (h[i] === "在" || h[i] === "跟") {
          var e = groupAt(h, i, ["noun", "place", "pron"]); if (e > i + 1) { groups.push({ kind: h[i], from: i, to: e }); i = e - 1; }
        }
      }
      if (groups.length) {
        var wh = groups.filter(function (g) { return g.kind === "跟"; }), at = groups.filter(function (g) { return g.kind === "在"; });
        var take = function (g) { return t.slice(g.from, g.to); };
        var wt = [].concat.apply([], wh.map(take)), atk = [].concat.apply([], at.map(take));
        groups.sort(function (a, b) { return b.from - a.from; }).forEach(function (g) { t.splice(g.from, g.to - g.from); });
        h = H(); v = firstVerb(h); var cs = chainStart(h, v);
        t.splice.apply(t, [cs, 0].concat(wt, atk));
        if (wt.length) steps.push("Ho spostato «" + wt.map(hz).join("") + "» prima del verbo: «con chi» (跟 + persona) viene PRIMA dell'azione.");
        if (atk.length) steps.push("Ho spostato «" + atk.map(hz).join("") + "» prima del verbo: il LUOGO (在 + luogo) viene PRIMA dell'azione: 我在家吃饭 (io / a casa / mangio), non 我吃饭在家.");
        addIssue("Ordine non valido.");
      }
    }
    /* 8. 了 / 过 / 着 prima del verbo */
    h = H();
    for (i = 1; i < h.length - 1; i++) {
      if (R(h[i]) === "asp" && ["pron", "time", "adv", "neg"].indexOf(R(h[i - 1])) >= 0 && (R(h[i + 1]) === "verb" || R(h[i + 1]) === "vo")) {
        var ak = t.splice(i, 1)[0]; var vi = i; /* il verbo e' ora a i */ t.splice(vi + 1, 0, ak);
        steps.push("Ho spostato «" + hz(ak) + "» subito dopo il verbo: le particelle 了, 过, 着 stanno dopo il verbo, mai prima."); addIssue("Ordine non valido."); break;
      }
    }
    /* 9. modale dopo il verbo d'azione (想, 会, 能, 可以) */
    h = H();
    for (i = 0; i < h.length - 1; i++) {
      if (ACTV2[h[i]] && ["想", "会", "能", "可以"].indexOf(h[i + 1]) >= 0 && i > 0) {
        var mv = t.splice(i + 1, 1)[0]; t.splice(i, 0, mv);
        steps.push("Ho messo «" + hz(mv) + "» davanti a «" + h[i] + "»: il verbo modale (想, 会, 能, 可以) precede sempre il verbo d'azione."); addIssue("Ordine non valido."); break;
      }
    }
    res.fixed = t; res.steps = steps; res.issues = issues; res.ok = !issues.length; res.changed = t.join("|") !== tokens.join("|");
    return res;
  }
  CP.lab = CP.lab || {}; CP.lab.NCLF = NCLF;   /* i classificatori, anche per le frasi a buco */
  CP.lab.check = check; CP.lab._roleOf = roleOf;
})();

