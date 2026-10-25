/* ===== V6: Laboratorio. (1) traduzione fluida in italiano con coniugazione (2) correttore d'ordine delle frasi cinesi ===== */
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
  var CLF = { "个": "", "本": "", "张": "", "件": "", "条": "", "位": "", "只": "", "辆": "", "杯": "tazza", "瓶": "bottiglia", "碗": "ciotola", "盘": "piatto", "双": "paio", "块": "pezzo", "次": "volta", "岁": "anni" };
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

  /* ================== coniugazione italiana ================== */
  var CLITIC = ["mi", "ti", "si", "ci", "vi", "si"];
  function split(inf) { /* "fare la doccia" -> ["fare", " la doccia"]; "partecipare a" -> ["partecipare", " a"] */
    var i = inf.indexOf(" "); return i < 0 ? [inf, ""] : [inf.slice(0, i), inf.slice(i)];
  }
  function presentOf(inf, pi) { /* pi: 0..5 */
    var s = split(inf), v = s[0], tail = s[1], refl = /si$/.test(v), base = refl ? v.replace(/si$/, "e").replace(/rse$/, "re") : v, f;
    if (refl) base = v.replace(/rsi$/, "re");
    if (IRRP[v]) f = IRRP[v][pi];
    else if (IRRP[base]) f = IRRP[base][pi];
    else {
      var st = base.slice(0, -3), t = base.slice(-3);
      if (t === "are") {
        if (/[cg]$/.test(st) && (pi === 1 || pi === 3)) st += "h";
        var e = ["o", "i", "a", "iamo", "ate", "ano"][pi];
        if (/i$/.test(st) && (pi === 1 || pi === 3)) e = e.replace(/^i/, "");
        f = st + e;
        if (/i$/.test(base.slice(0, -3)) && pi === 1) f = base.slice(0, -3);   /* mangi */
        if (/[cg]h$/.test(st) === false && /i$/.test(base.slice(0, -3)) && pi === 3) f = base.slice(0, -3) + "amo";
      } else if (t === "ere") f = st + ["o", "i", "e", "iamo", "ete", "ono"][pi];
      else if (t === "ire") f = NOISC[base] ? st + ["o", "i", "e", "iamo", "ite", "ono"][pi] : (pi === 3 || pi === 4 ? st + ["", "", "", "iamo", "ite"][pi] : st + ["isco", "isci", "isce", "", "", "iscono"][pi]);
      else f = base;
    }
    if (refl) f = CLITIC[pi] + " " + f;
    return f + tail;
  }
  function ppOf(inf) {
    var s = split(inf), v = s[0], refl = /si$/.test(v), base = refl ? v.replace(/rsi$/, "re") : v;
    var pp = IRRPP[v] || IRRPP[base];
    if (!pp) { var t = base.slice(-3), st = base.slice(0, -3); pp = t === "are" ? st + "ato" : t === "ere" ? st + "uto" : st + "ito"; }
    return pp;
  }
  function gerundOf(inf) {
    var v = split(inf)[0], refl = /si$/.test(v), base = refl ? v.replace(/rsi$/, "re") : v;
    return IRRG[base] || (base.slice(-3) === "are" ? base.slice(0, -3) + "ando" : base.slice(0, -3) + "endo");
  }
  function agree(pp, g, num) { /* participio con essere */
    var m = pp.replace(/o$/, ""); if (!/o$/.test(pp)) return pp;
    if (num === "p") return g === "f" ? m + "e" : m + "i";
    return g === "f" ? m + "a" : m + "o";
  }
  function auxForm(aux, pi) { return IRRP[aux][pi]; }

  /* ================== articoli e sintagmi nominali ================== */
  function nounInfo(k) {
    var h = hz(k), t = NT[h];
    if (t) return { s: t[0], g: t[1], p: t[2], known: true };
    var g = W[k] ? W[k].it : "", f = g.split(/[;,(]/)[0].replace(/\s*\/.*$/, "").trim() || h;
    var gen = /a$/.test(f.split(" ")[0]) ? "f" : "m";
    return { s: f, g: gen, p: /o$/.test(f) ? f.replace(/o$/, "i") : /a$/.test(f) ? f.replace(/a$/, "e") : /e$/.test(f) ? f.replace(/e$/, "i") : f, known: false };
  }
  function vowelStart(w) { return /^[aeiouàèéìòù]/i.test(w); }
  function sImpure(w) { return /^(s[bcdfghlmnpqrtvz]|z|gn|ps|x|y)/i.test(w); }
  function defArt(n, plural) {
    var first = n.s.split(" ")[0];
    if (plural) return n.g === "f" ? "le" : (vowelStart(n.p) || sImpure(n.p) ? "gli" : "i");
    if (vowelStart(first)) return "l'";
    if (n.g === "f") return "la";
    return sImpure(first) ? "lo" : "il";
  }
  function indefArt(n) { if (n.g === "f") return vowelStart(n.s) ? "un'" : "una"; return sImpure(n.s) ? "uno" : "un"; }
  function withArt(art, noun) { return art + (/'$/.test(art) ? "" : " ") + noun; }
  function demIt(d, n, plural) {
    var near = d === "这";
    if (near) return plural ? (n.g === "f" ? "queste" : "questi") : (n.g === "f" ? "questa" : "questo");
    var first = n.s.split(" ")[0];
    if (plural) return n.g === "f" ? "quelle" : (vowelStart(n.p) ? "quegli" : sImpure(n.p) ? "quegli" : "quei");
    if (n.g === "f") return vowelStart(first) ? "quell'" : "quella";
    return vowelStart(first) ? "quell'" : sImpure(first) ? "quello" : "quel";
  }
  function possIt(p, n, plural) {
    var base = POSS[p]; if (!base) return null;
    var fam = ["爸爸", "妈妈", "哥哥", "弟弟", "姐姐", "妹妹", "儿子", "女儿", "丈夫", "妻子", "男朋友", "女朋友"];
    var f = base === "loro" ? "loro" : base.replace(/o$/, n.g === "f" ? "a" : "o");
    if (plural && base !== "loro") f = base.replace(/o$/, n.g === "f" ? "e" : "i");
    return f;
  }

  /* ================== analisi in unità (usata da traduzione e correttore) ================== */
  /* ruolo di ogni gettone */
  function roleOf(h, ctx) {
    if (PRON[h]) return "pron"; if (TIMEW[h] !== undefined) return "time"; if (NEG[h]) return "neg";
    if (ADVS[h] !== undefined) return "adv"; if (INTENS[h] !== undefined) return "int"; if (MODAL[h]) return "modal"; if (FINAL[h]) return "final";
    if (QWORDS[h]) return "q"; if (NUMS[h] !== undefined) return "num"; if (h === "这" || h === "那") return "dem"; if (CLF[h] !== undefined && h !== "天") return "clf";
    if (h === "跟" || h === "和" || h === "给") return "with"; if (h === "在") return "at"; if (h === "是") return "cop"; if (h === "有") return "have"; if (h === "的") return "de";
    if (h === "了" || h === "过" || h === "着") return "asp"; if (h === "正在") return "prog";
    if (h === "不是") return "negcop"; if (VO[h]) return "vo"; if (VB[h]) return "verb"; if (ADJS[h] || HAVE[h]) return "adj"; if (PLACE[h]) return "place";
    return "noun";
  }
  var SLOT = { pron: 1, noun1: 1, time: 2, adv: 3, neg: 3, int: 3, prog: 3, "with": 4, at: 5, modal: 6, verb: 7, vo: 7, negcop: 7, cop: 7, have: 7, adj: 7, asp: 8, num: 9, dem: 9, clf: 9, obj: 9, final: 10, q: 9 };
  var SLOTN = { 9.5: "Particella 了 finale", 1: "Soggetto", 2: "Tempo", 3: "Avverbio / negazione", 4: "Con chi", 5: "Luogo", 6: "Verbo modale", 7: "Verbo", 8: "Particella (了/过/着)", 9: "Quantità + oggetto", 10: "Particella finale" };

  /* raggruppa i gettoni in unita' [{slot, i0, keys[], hzs[], kind}] */
  function units(tokens) {
    var hs = tokens.map(hz), n = hs.length, out = [], i = 0, seenVerb = false;
    var verbAhead = function (from) { for (var j = from; j < n; j++) { var r = roleOf(hs[j]); if (r === "verb" || r === "vo" || r === "negcop" || r === "adj" || r === "cop" || r === "have") return true; } return false; };
    while (i < n) {
      var h = hs[i], r = roleOf(h), u = { i0: i, keys: [tokens[i]], hzs: [h], kind: r, slot: SLOT[r] || 9 };
      if (r === "with" || r === "at") {
        /* preposizione + sintagma: prende i gettoni nominali che seguono */
        var j = i + 1; while (j < n && ["noun", "place", "pron", "dem", "num", "clf"].indexOf(roleOf(hs[j])) >= 0 && !(r === "at" && roleOf(hs[j]) === "verb")) { u.keys.push(tokens[j]); u.hzs.push(hs[j]); j++; if (r === "with" && roleOf(hs[j - 1]) === "pron") break; if (u.keys.length >= 3) break; }
        /* 在 senza verbo dopo = verbo "stare/essere in" */
        u.slot = r === "with" ? 4 : 5; if (r === "with" && h === "给" && out.some(function (x) { return x.slot === 7; })) u.slot = 9.2; if (r === "at" && !verbAhead(j) && !out.some(function (x) { return x.slot === 7; })) { u.kind = "atverb"; u.slot = 7; }
        i = j; out.push(u); continue;
      }
      if (r === "modal") { if (!verbAhead(i + 1)) { u.kind = "verb"; u.slot = 7; } }
      if (r === "pron" && i + 1 < n && roleOf(hs[i + 1]) === "noun" && FAMILY.indexOf(hs[i + 1]) >= 0 && !out.some(function (x) { return x.slot >= 6; })) {
        u.keys.push(tokens[i + 1]); u.hzs.push(hs[i + 1]); u.kind = "subj"; u.slot = 1; u.poss = true; i += 2; out.push(u); continue;
      }
      if ((r === "dem") && hs[i + 1] === "是" && !out.length) { u.kind = "subjdem"; u.slot = 1; i++; out.push(u); continue; }
      if (r === "q" && hs[i] === "谁" && !out.some(function (x) { return x.slot === 1; }) && verbAhead(i + 1)) { u.kind = "qsubj"; u.slot = 1; i++; out.push(u); continue; }
      if (r === "asp" && h === "了") { var prev = out[out.length - 1]; if (prev && prev.slot >= 9) { u.slot = 9.5; } }
      if (r === "num" || r === "dem") {
        var j2 = i + 1; u.slot = 9;
        while (j2 < n && ["num", "clf", "noun", "place"].indexOf(roleOf(hs[j2])) >= 0 && u.keys.length < 7) { u.keys.push(tokens[j2]); u.hzs.push(hs[j2]); j2++; if (roleOf(hs[j2 - 1]) === "noun") break; }
        u.kind = "np"; i = j2; out.push(u); continue;
      }
      if (r === "noun" || r === "place") {
        /* nome: soggetto se all'inizio (prima del verbo), altrimenti oggetto/complemento */
        var before = out.some(function (x) { return x.slot >= 6 && x.slot <= 8; });
        if (!before && !out.some(function (x) { return x.slot === 1; }) && (i === 0 || out.every(function (x) { return x.slot === 2 || x.slot === 3 || x.slot < 1; })) && verbAhead(i + 1)) { u.slot = 1; u.kind = "subj"; }
        else if (!before && i < n - 1 && hs[i + 1] === "的") { u.slot = u.slot; }
        else { u.slot = 9; u.kind = "np"; }
      }
      if (r === "pron" && out.some(function (x) { return x.slot >= 6; })) { u.slot = 9; u.kind = "np"; }   /* pronome oggetto */
      if (r === "q") { u.slot = (out.some(function (x) { return x.slot === 7; }) ? 9 : 9); }
      if (r === "adj" && !out.some(function (x) { return x.slot === 7; })) u.slot = 7;
      i++; out.push(u);
    }
    return out;
  }

  var MERGE = { "看见": 1, "想要": 1, "打电话": 1, "喜欢": 1 };
  var V2PREP = { "开始": "a", "决定": "di", "希望": "di", "学": "a", "试试": "a", "准备": "di", "爱": "", "怕": "", "喜欢": "", "帮": "a" };
  function infOf(h) { if (VO[h]) return VO[h][0]; if (VB[h]) return VB[h][0]; return null; }
  /* ================== traduzione fluida ================== */
  function personIdx(p) { return (p[0] - 1) + (p[1] === "p" ? 3 : 0); }
  function numWord(n) { return n <= 10 ? NUMIT[n] : String(n); }
  /* numero cinese da una serie di caratteri numerici consecutivi: 二十 = 20, 十二 = 12, 三十五 = 35, 一百 = 100.
     Abbreviazione parlata: 三百五 = 350 (la cifra dopo 百 vale decine, se non c'è 零). */
  function zhNum(hs) {
    var total = 0, cur = 0, unit = 0, zero = false;
    hs.forEach(function (h) {
      var v = NUMS[h];
      if (v === 10 || v === 100) { total += (cur || 1) * v; cur = 0; unit = v; zero = false; }
      else if (v === 0) zero = true;
      else cur = v;
    });
    if (cur && unit === 100 && !zero && hs.length > 2) cur *= 10;
    return total + cur;
  }
  function nameFromTokens(keys) {
    /* ritorna [numero (or null), classificatore hz or null, dem, nome key] */
    var nums = [], clf = null, dem = null, noun = null;
    keys.forEach(function (k) {
      var h = hz(k), r = roleOf(h);
      if (r === "num") { if (NUMS[h] !== undefined) nums.push(h); } else if (r === "dem") dem = h; else if (r === "clf") clf = h; else if (r === "noun" || r === "place") noun = k;
    });
    return { num: nums.length ? zhNum(nums) : null, clf: clf, dem: dem, noun: noun };
  }
  function npIt(keys, o) {
    var p = nameFromTokens(keys), ap = [];
    if (!p.noun) {
      if (p.dem) return { t: p.dem === "这" ? "questo" : "quello" };
      if (p.num != null && p.clf === "块") return { t: numWord(p.num) + " yuan" };
      if (p.num != null && p.clf) return { t: numWord(p.num) + " " + (CLF[p.clf] || "") };
      return { t: keys.map(function (k) { return gloss(k); }).join(" ") };
    }
    var h = hz(p.noun), n = nounInfo(p.noun);
    if (PLACE[h] && !NT[h]) return { t: PLACE[h], place: true, ap: ap };
    if (!n.known) ap.push(h);
    if (p.num != null) {
      if (p.clf === "杯" && CUP[h]) return { t: p.num === 1 ? CUP[h][0] : CUP[h][1].replace("%N", numWord(p.num)), ap: ap };
      var co = p.clf ? CLF_OF[p.clf] : null, many = p.num > 1;
      if (co) {
        var cont = co[0].indexOf(h) >= 0 ? (many ? co[2] : co[1]) : (many ? co[4] : co[3]);
        var cg = co[0].indexOf(h) >= 0 ? "f" : "m"; if (p.clf === "瓶" || p.clf === "碗" || p.clf === "盘") cg = p.clf === "盘" ? "m" : "f"; if (p.clf === "双" || p.clf === "块") cg = "m";
        var nn = many ? numWord(p.num) : (cg === "f" ? "una" : "un"); if (many === false && p.clf === "盘") nn = "un";
        var noun = n.s; /* di + nome */
        return { t: nn + " " + cont + " di " + (n.g === "f" && p.num === 1 && false ? "" : noun), ap: ap };
      }
      if (p.clf === "岁") return { t: numWord(p.num) + " anni", ap: ap };
      if (p.clf === "次") return { t: numWord(p.num) + (p.num > 1 ? " volte" : " volta"), ap: ap };
      return { t: p.num === 1 ? withArt(indefArt(n), n.s) : numWord(p.num) + " " + n.p, ap: ap };
    }
    if (p.dem) return { t: withArt(demIt(p.dem, n, false), n.s).replace("' ", "'"), ap: ap };
    return { t: o && o.noArt ? n.s : withArt(defArt(n, false), n.s), ap: ap, n: n };
  }
  function gloss(k) { var g = W[k] ? W[k].it : k; return g.split(/[;,(:]/)[0].trim(); }

  /* risultato: {it, notes[], approx[], tense} */
  function fluid(tokens, punct) {
    var notes = [], approx = [], hs = tokens.map(hz);
    if (!tokens.length) return { it: "", notes: notes, approx: approx };
    /* espressioni fisse */
    var hjoin = tokens.map(hz).join(""), FIX = { "你好": "Ciao", "你好吗": "Come stai?", "谢谢": "Grazie", "再见": "Arrivederci", "对不起": "Scusa", "不客气": "Prego", "没关系": "Non fa niente", "早上好": "Buongiorno", "晚上好": "Buonasera", "晚安": "Buonanotte", "请问": "Scusi, posso chiedere…", "干杯": "Cin cin!" };
    if (FIX[hjoin]) return { it: FIX[hjoin] + (/[?!]$/.test(FIX[hjoin]) || punct === "none" ? "" : (punct === "?" ? "?" : punct === "!" ? "!" : ".")).replace(/\.$/, ""), notes: [], approx: [], tense: "pres" };
    /* quanto costa (anche quando 这个多少钱 e' un gettone solo) */
    if (/多少钱$/.test(hjoin) && tokens.length === 1) {
      var ld = hjoin.replace(/多少钱$/, ""); return { it: "Quanto costa" + (ld === "这个" || ld === "这" ? " questo" : ld === "那个" || ld === "那" ? " quello" : "") + "?", notes: [], approx: [], tense: "pres" };
    }
    /* quanto costa */
    var mq = tokens.map(hz).indexOf("多少");
    if (mq < 0) mq = tokens.map(hz).indexOf("多少钱");
    if (mq >= 0 && (hz(tokens[mq]) === "多少钱" || hz(tokens[mq + 1] || "") === "钱")) {
      var lead = tokens.slice(0, mq), qt = "";
      if (lead.length === 1 && (hz(lead[0]) === "这个" || hz(lead[0]) === "那个")) qt = hz(lead[0]) === "这个" ? "questo" : "quello";
      else if (lead.length) { var qn = npIt(lead.filter(function (k) { return roleOf(hz(k)) !== "pron" || true; }), {}); qt = qn.t; }
      return { it: "Quanto costa" + (qt ? " " + qt : "") + "?", notes: [], approx: [], tense: "pres" };
    }
    /* frase relativa: [soggetto][tempo] verbo 的 nome  ->  il nome che ho + participio + tempo */
    var di = tokens.map(hz).indexOf("的");
    if (di > 0 && di < tokens.length - 1 && VB[hz(tokens[di - 1])]) {
      var cl = tokens.slice(0, di), nounK = tokens[di + 1], cs = null, ct = [], cv = null;
      cl.forEach(function (k) { var h0 = hz(k); if (PRON[h0]) cs = h0; else if (TIMEW[h0] !== undefined) ct.push(h0); else if (VB[h0]) cv = h0; });
      if (cv) {
        var rp = cs ? PRON[cs] : [1, "s", "x"], rpi = personIdx(rp), vb = VB[cv], isPast = ct.some(function (t) { return PASTT[t]; }) || cl.map(hz).indexOf("了") >= 0;
        var nI = nounInfo(nounK), saved = P0();
        var verbIt = isPast ? (vb[1] === "e" ? IRRP.essere[rpi] + " " + ppOf(vb[0]) : IRRP.avere[rpi] + " " + ppOf(vb[0])) : presentOf(vb[0], rpi);
        var relT = withArt(defArt(nI, false), nI.s) + " che " + verbIt + (ct.length ? " " + ct.map(function (t) { return TIMEW[t]; }).join(" ") : "");
        var ap0 = nI.known ? [] : [hz(nounK)];
        return { it: relT.charAt(0).toUpperCase() + relT.slice(1) + ".", notes: ["Il verbo viene PRIMA del nome e 的 fa da «che»: 我昨天买的书 = il libro che ho comprato ieri."].concat(ap0.length ? ["Per " + ap0.join(", ") + " ho usato la traduzione più semplice, controllala."] : []), approx: ap0, tense: isPast ? "past" : "pres" };
      }
    }
    function P0() { return null; }
    /* i composti verbo+oggetto (吃 饭) diventano un verbo solo */
    var toks = tokens.slice(), merged = [];
    for (var m = 0; m < toks.length - 1; m++) { var comp = hz(toks[m]) + hz(toks[m + 1]); if (VO[comp] || MERGE[comp]) { merged.push(m); toks.splice(m, 2, "VO:" + comp); } }
    var hs2 = toks.map(function (k) { return /^VO:/.test(k) ? k.slice(3) : hz(k); });
    var us = units(toks);
    var subj = null, subjP = null, subjG = "x", time = [], adv = [], neg = null, withP = null, placeP = null, modal = null, verb = null, asp = null, obj = [], fin = null, q = null, adj = null, cop = false, have = false, prog = false, atverb = null, voV = null, intens = null, deP = [], negNoPast = false, possSubj = null, subjDem = null, qSubj = false, verb2 = null;
    us.forEach(function (u) {
      var h = u.hzs[0], k = u.keys[0];
      switch (u.kind) {
        case "pron": if (!subj && !verb && !cop && !modal) { subj = h; subjP = PRON[h]; subjG = PRON[h][2]; } else obj.push(u); break;
        case "subj":
          if (u.poss) { var fk = u.keys[1], fh = u.hzs[1], fn = nounInfo(fk), fg = fn.g; subj = fh; subjP = [3, "s", fg]; subjG = fg; possSubj = POSS[h] ? { p: possIt(h, fn, false), n: fn, plural: false } : null; if (fh === "父母") subjP[1] = "p"; }
          else { subj = u.hzs[0]; subjP = [3, "s", NT[h] ? NT[h][1] : "m"]; subjG = subjP[2]; u.nIt = nounInfo(k); }
          break;
        case "subjdem": subj = h; subjP = [3, "s", "m"]; subjG = "m"; subjDem = h === "这" ? "questo" : "quello"; break;
        case "qsubj": q = "谁"; subj = null; subjP = [3, "s", "m"]; subjG = "m"; qSubj = true; break;
        case "time": time.push(h); break;
        case "neg": neg = h; break; case "adv": adv.push(h); break; case "int": intens = h; break;
        case "prog": prog = true; break;
        case "with": withP = u; break; case "at": placeP = u; break; case "atverb": atverb = u; break;
        case "modal": modal = h; break;
        case "verb": if (verb) verb2 = h; else verb = h; break;
        case "vo": if (verb) verb2 = h; else { voV = h; verb = h; } break;
        case "negcop": neg = "不"; cop = true; break;
        case "cop": cop = true; break; case "have": have = true; break;
        case "adj": adj = h; break;
        case "asp": asp = h; break;
        case "final": fin = h; break;
        case "q": q = h; break;
        case "np": obj.push(u); break;
        default: if (h === "的") deP.push(u); else obj.push(u);
      }
    });
    if (neg === "没有" && !verb && !modal && !adj && !voV && !cop && !atverb && !have) { have = true; neg = "没"; negNoPast = true; }
    if (cop && adj) cop = false;
    /* "吃/做 + 饭" : l'oggetto è già nel verbo */
    if ((verb === "吃" || verb === "做") && obj.some(function (u) { return u.hzs.length === 1 && u.hzs[0] === "饭"; })) { obj = obj.filter(function (u) { return !(u.hzs.length === 1 && u.hzs[0] === "饭"); }); if (verb === "做") { verb = null; voV = "做饭"; } else { verb = null; voV = "吃饭"; } }
    /* "有" come verbo */
    var tense = "pres", past = false, fut = false;
    time.forEach(function (t) { if (PASTT[t]) past = true; if (FUTT[t]) fut = true; });
    if (asp === "了" && (verb || have || voV) && !(hs2.indexOf("了") === hs2.length - 1 && adj)) past = true;
    if (asp === "过") tense = "exp";
    if ((neg === "没" || neg === "没有") && !negNoPast) { past = !fut; }
    if (past) tense = "past"; else if (fut && tense === "pres") tense = "fut";
    var pi = subjP ? personIdx(subjP) : 0;                       /* senza soggetto: io */
    var subjImplicit = !subj && !qSubj; if (subjImplicit) { subjP = [1, "s", "x"]; pi = 0; if (obj.length && (q || fin === "吗")) { subjP = [2, "s", "x"]; pi = 1; } }
    var P = { pi: pi, g: subjG, num: subjP[1] };
    var parts = { time: "", pre: "", core: "", obj: "", place: "", com: "", fin: "", front: "" };

    /* tempo */
    time = time.filter(function (t, ix) { return time.indexOf(t) === ix; });
    parts.time = time.map(function (t) { return TIMEW[t]; }).join(" ");
    /* avverbi */
    var advIt = adv.map(function (a) { return ADVS[a]; }).filter(Boolean);
    var anche = advIt.indexOf("anche") >= 0, insieme = advIt.indexOf("insieme") >= 0; advIt = advIt.filter(function (a) { return a !== "anche" && a !== "tutti" && a !== "insieme"; });
    var advBefore = advIt.length ? advIt.join(" ") + " " : "";   /* dichiarata qui: il ramo di 喜欢 la azzera e il valore deve restare */
    var tutti = adv.indexOf("都") >= 0;

    /* composizione del verbo */
    function vform(inf, aux, tns, negat) {
      var np = (negat ? "non " : "");
      if (tns === "past" || tns === "exp") {
        var pp = ppOf(inf), s0 = split(inf), refl = /si$/.test(s0[0]);
        if (aux === "e" || refl) {
          var fm = agree(pp, P.g === "x" ? (P.pi <= 2 ? "x" : "m") : P.g, P.num), res = (refl ? CLITIC[P.pi] + " " : "") + auxForm("essere", P.pi) + " " + fm + s0[1];
          if (P.g === "x" && P.num === "s" && P.pi <= 1) res = (refl ? CLITIC[P.pi] + " " : "") + auxForm("essere", P.pi) + " " + pp.replace(/o$/, "o/a") + s0[1];
          else if (P.g === "x" && P.num === "p" && P.pi <= 4 && P.pi >= 3) res = (refl ? CLITIC[P.pi] + " " : "") + auxForm("essere", P.pi) + " " + pp.replace(/o$/, "i/e") + s0[1];
          return np + (tns === "exp" ? "" : "") + res;
        }
        return np + (tns === "exp" && !negat ? "ho già ".replace("ho", auxForm("avere", P.pi)) : auxForm("avere", P.pi) + " ") + pp + s0[1];
      }
      if (tns === "fut") {
        var st2 = split(inf), b = st2[0].replace(/rsi$/, "re"), refl2 = /si$/.test(st2[0]);
        var fb = b.replace(/are$/, "er").replace(/ere$/, "er").replace(/ire$/, "ir"); if (/(andare)$/.test(b)) fb = b.replace(/andare$/, "andr"); if (/^(essere)$/.test(b)) fb = "sar"; if (/^(avere)$/.test(b)) fb = "avr"; if (/^(fare)$/.test(b)) fb = "far"; if (/^(venire)$/.test(b)) fb = "verr"; if (/^(bere)$/.test(b)) fb = "berr"; if (/(care|gare)$/.test(b)) fb = b.replace(/(c|g)are$/, "$1her");
        var ends = ["ò", "ai", "à", "emo", "ete", "anno"], fv = fb + ends[P.pi];
        return np + (refl2 ? CLITIC[P.pi] + " " : "") + fv + st2[1];
      }
      return np + presentOf(inf, P.pi);
    }

    var verbPhrase = "", objText = "", ap = [], used = false;
    /* oggetto */
    function npText(u) {
      var r = npIt(u.keys, {}); r.ap && r.ap.forEach(function (x) { if (approx.indexOf(x) < 0) approx.push(x); }); return r;
    }
    /* possessivo: pron 的 nome  /  nome 的 nome */
    function bindDe(list) {
      /* cerca nei token della frase "X 的 Y" tra le unita' oggetto */
      return list;
    }
    /* costruzione del predicato */
    var nObj = obj.filter(function (u) { return u.kind === "np" || u.kind === "noun" || u.kind === "pron" || u.kind === "place"; });
    var cliticObj = null;
    var objIt = nObj.map(function (u) {
      if (u.hzs.length === 1 && PRON[u.hzs[0]] && !(cop || atverb)) { var pr0 = PRON[u.hzs[0]]; cliticObj = { "1s": "mi", "2s": "ti", "3sm": "lo", "3sf": "la", "1p": "ci", "2p": "vi", "3p": "li" }[pr0[0] + pr0[1] + (pr0[0] === 3 && pr0[1] === "s" ? pr0[2] : "")]; return { t: "", cl: true }; }
      if (u.kind === "pron") { var pr = PRON[u.hzs[0]]; var obs = { "1s": "me", "2s": "te", "3sm": "lui", "3sf": "lei", "1p": "noi", "2p": "voi", "3p": "loro" }[pr[0] + pr[1] + (pr[1] === "s" && pr[0] === 3 ? pr[2] : "")]; return { t: obs || "", pr: true }; }
      return npText(u);
    });
    /* possessivi con 的 */
    var deIdx = hs2.indexOf("的");
    if (deIdx >= 0) {
      var before = toks[deIdx - 1], after = toks[deIdx + 1], bh = hz(before || ""), ah = hz(after || "");
      if (after && roleOf(bh) === "pron" && W[after]) {
        var nn = nounInfo(after), ps = possIt(bh, nn, false), fam = ["爸爸", "妈妈", "哥哥", "弟弟", "姐姐", "妹妹", "儿子", "女儿", "丈夫", "妻子", "男朋友", "女朋友", "家人"].indexOf(ah) >= 0;
        var phrase = (fam && bh !== "他们" ? "" : (nn.g === "f" ? "la " : "il ")) + ps + " " + nn.s;
        objIt = [{ t: phrase }]; if (subj === bh && subjImplicit === false && obj.length) { }
      } else if (after && before && W[before] && W[after]) {
        var n1 = nounInfo(after), n2 = nounInfo(before);
        objIt = [{ t: withArt(defArt(n1, false), n1.s) + " di " + withArt(defArt(n2, false), n2.s).replace(/^di il /, "del ") }];
      }
    }
    var mainObj = objIt.length ? objIt[0] : null;
    var qFront = "", qDone = false;
    if (q) {
      var qm = { "什么": "che cosa", "谁": "chi", "哪里": "dove", "哪儿": "dove", "为什么": "perché", "怎么": "come", "怎么样": "come va", "什么时候": "quando", "多久": "quanto tempo", "多少": "quanto", "几": "quanti", "哪": "quale" };
      qFront = qm[q] || ""; qDone = true;
    }
    var aux = null, core = "", inf = null;
    var negat = !!neg;
    if (atverb) {
      /* 他在家 = lui è a casa */
      var pl = npIt(atverb.keys.slice(1), {}); core = (negat ? "non " : "") + auxForm("essere", P.pi) + " " + (pl.t || ""); if (q === "哪里" || q === "哪儿") core = "dove " + (negat ? "non " : "") + auxForm("essere", P.pi);
      verbPhrase = core; mainObj = null; placeP = null;
    } else if (cop) {
      var cpred = mainObj ? mainObj.t : (adj ? "" : "");
      /* 我是学生 / 这是什么 */
      if (q === "什么" && subjDem) { verbPhrase = "che cos'è " + subjDem; subjDem = null; subj = null; subjImplicit = true; qFront = ""; mainObj = null; qDone = false; }
      else if (qSubj) { verbPhrase = "chi " + (negat ? "non " : "") + "è"; qFront = ""; qDone = false; }
      else if (q === "什么" || q === "谁") { verbPhrase = qFront + " " + (negat ? "non " : "") + auxForm("essere", P.pi); qFront = ""; mainObj = null; }
      else {
        var pred = mainObj ? mainObj.t : "";
        var PROF = ["学生", "老师", "医生", "同事", "老板", "司机", "警察", "厨师", "护士", "朋友"];
        if (mainObj && mainObj.n && nObj[0] && PROF.indexOf(hz(nameFromTokens(nObj[0].keys).noun || "")) >= 0 && nObj[0].keys.length === 1) pred = mainObj.n.s;
        if (P.num === "p" && mainObj && mainObj.n && pred === mainObj.n.s) pred = mainObj.n.p;
        verbPhrase = (negat ? "non " : "") + auxForm("essere", P.pi) + (tutti ? " tutti" : "") + (pred ? " " + pred : ""); mainObj = null; if (tutti) tutti = false;
      }
    } else if (have) {
      var haveInf = "avere";
      if (neg === "没有" || neg === "没") negat = true;
      verbPhrase = vform(haveInf, "a", tense === "exp" ? "pres" : tense, negat);
      if (nObj[0] && nObj[0].keys.length === 1 && W[nObj[0].keys[0]] && !PRON[nObj[0].hzs[0]]) { var hn0 = nounInfo(nObj[0].keys[0]); var plr = ["钱", "衣服", "鞋子", "父母", "作业", "新闻", "行李", "时间"].indexOf(nObj[0].hzs[0]) >= 0; mainObj = { t: plr || negat ? (hn0.s === "soldi" || plr ? hn0.s : hn0.s) : withArt(indefArt(hn0), hn0.s), n: hn0 }; if (hn0.s === "tempo" || nObj[0].hzs[0] === "时间") mainObj.t = negat ? "tempo" : "tempo"; }
      if (tense === "past" || tense === "fut") { }
      if (mainObj) { var oo = mainObj; if (negat && oo.n) oo = { t: oo.n.s }; mainObj = oo; }
    } else if (adj) {
      var a = ADJS[adj], hv = HAVE[adj], ad = intens ? INTENS[intens] : "";
      var subjIsPerson = !subj || subjP[0] <= 2 || (subj && (PRON[subj] || ["朋友", "老师", "学生", "孩子", "妈妈", "爸爸"].indexOf(subj) >= 0));
      if (hv && subjIsPerson && ["饿", "渴", "困"].indexOf(adj) >= 0 || (hv && subjIsPerson && ["冷", "热"].indexOf(adj) >= 0 && subj && PRON[subj])) {
        var amt = ad ? (ad === "molto" ? "molt" + (adj === "饿" || adj === "渴" ? "a" : "o") : ad) : "";
        verbPhrase = (negat ? "non " : "") + vform("avere", "a", tense === "exp" ? "pres" : (tense === "past" ? "past" : tense), false).replace(/^non /, "") + (amt ? " " + amt : "") + " " + hv[0];
      } else if (adj === "好" && subj && PRON[subj] && !mainObj) {
        verbPhrase = (negat ? "non " : "") + presentOf("stare", P.pi) + (ad ? " " + ad : "") + " bene";
      } else if (adj === "热" || adj === "冷") {
        verbPhrase = (negat ? "non " : "") + (tense === "past" ? "faceva" : "fa") + (ad ? " " + ad : "") + " " + (adj === "热" ? "caldo" : "freddo");
      } else if (a) {
        var gg = P.g === "f" ? 1 : 0, num2 = P.num === "p" ? 2 : gg;
        var af = a[num2]; if (P.g === "x" && P.num === "s" && P.pi <= 1 && a[0] !== a[1]) af = a[0] + "/" + a[1].slice(-1);
        if (!subj && !mainObj) { subjImplicit = true; }
        if (subj === "天气" && adj === "好") af = "bello";
        verbPhrase = (negat ? "non " : "") + (tense === "past" ? (P.pi === 2 ? "era" : ["ero", "eri", "era", "eravamo", "eravate", "erano"][P.pi]) : auxForm("essere", P.pi)) + (ad ? " " + ad : "") + " " + af;
      } else { verbPhrase = (negat ? "non " : "") + "è " + gloss(tokens[hs.indexOf(adj)]); approx.push(adj); }
    } else if (verb || modal || voV || (prog && !verb)) {
      var vinf = null, vaux = "a", vH = voV || verb;
      if (voV) { vinf = VO[voV][0]; vaux = "a"; if (VO[voV][1] && !mainObj) mainObj = { t: VO[voV][1] }; }
      else if (verb) { var vv = VB[verb]; vinf = vv ? vv[0] : null; vaux = vv ? vv[1] : "a"; if (!vv) { vinf = gloss(toks[hs2.indexOf(verb)]); approx.push(verb); } }
      if (verb === "想要") {
        verbPhrase = (negat ? "non " : "") + (tense === "past" ? ["volevo", "volevi", "voleva", "volevamo", "volevate", "volevano"][P.pi] : ["vorrei", "vorresti", "vorrebbe", "vorremmo", "vorreste", "vorrebbero"][P.pi]);
      } else if (verb === "叫" && q === "什么") {
        verbPhrase = "come " + presentOf("chiamarsi", P.pi); qFront = ""; qDone = false; negat = false;
      } else if (verb === "喜欢") {
        /* piacere: soggetto cinese = a me; oggetto = chi piace */
        var dat = { 0: "mi", 1: "ti", 2: "gli", 3: "ci", 4: "vi", 5: "gli" }[P.pi]; if (P.g === "f" && P.pi === 2) dat = "le";
        var plural = mainObj && mainObj.n && false;
        var pv = tense === "past" ? "è piaciuto" : "piace"; if (modal) pv = "piace";
        if (anche && subj && PRON[subj]) { dat = ""; var strongP = { 0: "a me", 1: "a te", 2: P.g === "f" ? "a lei" : "a lui", 3: "a noi", 4: "a voi", 5: "a loro" }[P.pi]; verbPhrase = "anche " + strongP + " " + (negat ? "non " : "") + pv; anche = false; advBefore = ""; }
        else verbPhrase = (negat ? "non " : "") + dat + " " + pv;
        if (tutti && !(anche && subj && PRON[subj])) { verbPhrase = "a tutti " + ({ 0: "me", 1: "te", 2: "loro", 3: "noi", 4: "voi", 5: "loro" }[P.pi]) + " " + (negat ? "non " : "") + pv; tutti = false; }
        if (verb2 && infOf(verb2)) { verbPhrase += " " + infOf(verb2); if (VO[verb2] && VO[verb2][1] && !mainObj) mainObj = { t: VO[verb2][1] }; }
        negat = false;
        if (mainObj) mainObj = { t: mainObj.t };
        subjImplicit = true; subj = null;
      } else if (modal) {
        var mInf = { "想": null, "要": "volere", "会": "sapere", "能": "potere", "可以": "potere", "应该": "dovere", "必须": "dovere" }[modal], mform;
        var vi = vinf ? split(vinf) : ["", ""];
        var cond = (modal === "想"), abil = (modal === "会" && (tense !== "fut") && (ABILITY[verb] || voV));
        if (modal === "会" && !abil) { /* futuro */ verbPhrase = vform(vinf || "essere", vaux, "fut", negat); }
        else if (false) {
          verbPhrase = (negat ? "non " : "") + (tense === "past" ? ["volevo", "volevi", "voleva", "volevamo", "volevate", "volevano"][P.pi] : ["vorrei", "vorresti", "vorrebbe", "vorremmo", "vorreste", "vorrebbero"][P.pi]);
        }
        else if (modal === "想") {
          var vol = ["vorrei", "vorresti", "vorrebbe", "vorremmo", "vorreste", "vorrebbero"][P.pi];
          verbPhrase = (negat ? "non " : "") + (tense === "past" ? ["volevo", "volevi", "voleva", "volevamo", "volevate", "volevano"][P.pi] : vol) + " " + (vinf || "");
          if (tense !== "past") notes.push("想 può essere «vorrei» o «ho voglia di».");
        } else {
          var mp = IRRP[mInf][P.pi]; if (tense === "past") mp = { "volere": ["volevo", "volevi", "voleva", "volevamo", "volevate", "volevano"], "potere": ["potevo", "potevi", "poteva", "potevamo", "potevate", "potevano"], "sapere": ["sapevo", "sapevi", "sapeva", "sapevamo", "sapevate", "sapevano"], "dovere": ["dovevo", "dovevi", "doveva", "dovevamo", "dovevate", "dovevano"] }[mInf][P.pi];
          if (modal === "应该") mp = ["dovrei", "dovresti", "dovrebbe", "dovremmo", "dovreste", "dovrebbero"][P.pi];
          verbPhrase = (negat ? "non " : "") + mp + " " + (vinf || "");
        }
      } else if (verb2 && infOf(verb2) && V2PREP[verb] !== undefined) {
        var pre = V2PREP[verb], vInfo = VB[verb] ? VB[verb][0] : vinf, conj0 = vform(vinf, vaux, tense === "exp" ? "pres" : tense, negat);
        if (verb === "怕") conj0 = (negat ? "non " : "") + presentOf("avere", P.pi) + " paura";
        verbPhrase = conj0 + (pre ? " " + pre : (verb === "怕" ? " di" : "")) + " " + infOf(verb2); if (VO[verb2] && VO[verb2][1] && !mainObj) mainObj = { t: VO[verb2][1] };
      } else if (prog) {
        var stv = tense === "past" ? ["stavo", "stavi", "stava", "stavamo", "stavate", "stavano"][P.pi] : presentOf("stare", P.pi);
        var gf = gerundOf(vinf), refl3 = /si$/.test(split(vinf)[0]);
        verbPhrase = (negat ? "non " : "") + (refl3 ? CLITIC[P.pi] + " " : "") + stv + " " + gf.replace(/^(\S+)/, "$1") + split(vinf)[1];
      } else {
        var tns = tense === "exp" ? "exp" : tense, negV = negat;
        if (verb === "要" || verb === "想") { }
        verbPhrase = vform(vinf, vaux, tns, negV);
        if (asp === "着") notes.push("着 indica uno stato che continua: qui è reso con il presente.");
        if (tense === "exp") verbPhrase = verbPhrase.replace(/^(non )?/, "$1") ;
        if (tense === "exp") { var e1 = verbPhrase.split(" "); verbPhrase = verbPhrase.replace(/^(non )?(\S+) /, function (_, n0, au) { return (n0 || "") + au + " già "; }); if (negat) verbPhrase = verbPhrase.replace("non ", "non ").replace(" già ", " mai "); }
      }
    } else if (nObj.some(function (u) { return nameFromTokens(u.keys).clf === "岁"; })) {
      /* 他二十岁: l'età si dice senza verbo in cinese, con «avere» in italiano */
      verbPhrase = vform("avere", "a", tense === "exp" ? "pres" : tense, negat);
    } else if (mainObj || q) {
      verbPhrase = ""; 
    }
    /* destinazione: 去/来/回/到 + luogo */
    var placeIt = "";
    if (placeP) { var pp2 = npIt(placeP.keys.slice(1), {}); placeIt = pp2.t; pp2.ap && pp2.ap.forEach(function (x) { if (approx.indexOf(x) < 0) approx.push(x); }); }
    var withIt = "";
    if (withP && withP.hzs[0] === "给") {
      var gk = withP.keys[1], gh = hz(gk || "");
      if (PRON[gh]) { var gpr = PRON[gh]; cliticObj = { "1s": "mi", "2s": "ti", "3sm": "gli", "3sf": "le", "1p": "ci", "2p": "vi", "3p": "gli" }[gpr[0] + gpr[1] + (gpr[0] === 3 && gpr[1] === "s" ? gpr[2] : "")]; }
      else if (gk) { var gn = nounInfo(gk); withIt = "a " + (FAMILY.indexOf(gh) >= 0 && ["爸爸", "妈妈"].indexOf(gh) >= 0 ? gn.s : withArt(defArt(gn, false), gn.s)); }
    } else if (withP) {
      var wk = withP.keys.slice(1), w0 = wk[0], wh = hz(w0 || "");
      if (PRON[wh]) { var ob = { "我": "me", "你": "te", "您": "Lei", "他": "lui", "她": "lei", "我们": "noi", "你们": "voi", "他们": "loro" }[wh]; withIt = "con " + ob; }
      else if (w0) { var wn = nounInfo(w0); var art = withP.keys.length > 2 ? null : null; withIt = "con " + (["爸爸", "妈妈", "哥哥", "弟弟", "姐姐", "妹妹", "儿子", "女儿"].indexOf(wh) >= 0 ? "mio " + wn.s : withArt(indefArt(wn), wn.s)).replace("mio mamma", "mia mamma").replace("mio sorella", "mia sorella").replace("mio figlia", "mia figlia"); if (!wn.known) { if (approx.indexOf(wh) < 0) approx.push(wh); } }
    }
    /* assemblaggio */
    var sentence = [];
    var subjIt = "";
    if (subjDem) { subjIt = subjDem; }
    else if (qSubj) { subjIt = ""; }
    else if (possSubj) {
      var fam0 = possSubj.n; subjIt = (possSubj.p + " " + fam0.s); subjIt = subjIt.charAt(0).toUpperCase() + subjIt.slice(1);
      if (anche) subjIt = "anche " + subjIt.toLowerCase(); P.pi = (P.pi < 3 ? 2 : 5); if (subj === "父母") P.pi = 5;
    } else if (subj && !subjImplicit) {
      if (PRON[subj]) {
        var key2 = subjP[0] + subjP[1] + (subjP[0] === 3 && subjP[1] === "s" ? subjP[2] : ""); var ex = (subjP[0] === 3 || anche || tutti);
        subjIt = ex ? PRON_IT[key2] || "" : "";
        if (anche) subjIt = { "1s": "anch'io", "2s": "anche tu", "3sm": "anche lui", "3sf": "anche lei", "1p": "anche noi", "2p": "anche voi", "3p": "anche loro" }[key2];
        if (subj === "您") subjIt = "Lei";
        if (subjP[0] === 3 && subjP[1] === "p" && !anche && !tutti) subjIt = "";
      } else {
        var sn = nounInfo(toks[hs2.indexOf(subj)]); subjIt = withArt(defArt(sn, false), sn.s); if (!sn.known) approx.push(subj);
        if (anche) subjIt = "anche " + subjIt;
        P.pi = (P.pi < 3 ? 2 : 5);
      }
    } else if (anche) { subjIt = ""; advBefore = "anche " + advBefore; }
    var mainObjT = mainObj ? mainObj.t : "";
    if (qDone && qFront && !(cop && (q === "什么" || q === "谁"))) {
      /* domanda con parola interrogativa: la parola va davanti */
      if (q === "什么" && !mainObjT) { mainObjT = ""; }
    }
    var tail = [mainObjT, placeIt, withIt, insieme ? "insieme" : ""].filter(Boolean).join(" ");
    if (cliticObj && verbPhrase) verbPhrase = verbPhrase.replace(/^(non )?/, "$1" + cliticObj + " ");
    var core2 = (advBefore + verbPhrase + (tutti && verbPhrase ? " tutti" : "")).trim();
    if (qDone && qFront && !cop) {
      if (q === "哪里" || q === "哪儿") { mainObjT = ""; tail = [withIt, placeIt === "" ? "" : placeIt].filter(Boolean).join(" "); sentence = [qFront, core2, tail]; }
      else if (q === "多少" && hs2.indexOf("钱") >= 0) { sentence = ["quanto costa"]; }
      else sentence = [qFront, core2, tail];
      if (q === "什么" && !verbPhrase) sentence = [qFront, ""];
    } else {
      sentence = [parts.time, subjIt, core2, tail];
    }
    var out = sentence.filter(function (x) { return x && x.trim(); }).join(" ").replace(/\s+/g, " ").replace(/\bdi il\b/g, "del").replace(/\bdi la\b/g, "della").replace(/\bdi lo\b/g, "dello").replace(/\bdi i\b/g, "dei").replace(/\bin il\b/g, "nel").replace(/\bin la\b/g, "nella").replace(/\ba il\b/g, "al").replace(/\ba la\b/g, "alla").trim();
    if (!out) { out = tokens.map(gloss).join(" "); notes.push("Non ho una regola per questa combinazione: ti mostro le parole una per una."); }
    /* particelle finali */
    var isQ = fin === "吗" || !!q || punct === "?";
    var excl = false;
    if (fin === "吧") { if (P.num === "p" && P.pi === 3) excl = true; else { out = out + ", vero"; isQ = true; } }
    if (fin === "呢" && tokens.length === 2 && subj) { out = "e " + (PRON_IT[subjP[0] + subjP[1] + (subjP[0] === 3 && subjP[1] === "s" ? subjP[2] : "")] || out); isQ = true; }
    out = out.charAt(0).toUpperCase() + out.slice(1) + (isQ ? "?" : (punct === "!" || excl) ? "!" : ".");
    if (approx.length) notes.push("Per " + approx.join(", ") + " non ho una regola specifica: ho usato la traduzione più semplice, controllala.");
    if (/\/[a-z]/.test(out)) notes.push("In italiano il participio cambia col genere: «o/a» = scegli tu (maschile/femminile).");
    return { it: out, notes: notes, approx: approx, tense: tense };
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
  CP.lab = { fluid: fluid, check: check, units: units, _roleOf: roleOf, zhNum: zhNum };
})();

