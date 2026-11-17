// Reorganize an existing resource pack by practice topic; print a new pack.
// Usage: node scripts/regroup-vocabulary.mjs path/to/bundled-data.js
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(process.argv[2]||'bundled-data.js','utf8'),context);
const decks=context.window.BUNDLED_DECKS;
const taxonomy=[
 ['shared-dates','P1/P4 · 日期、数字与计量'],
 ['shared-places','P1/P4 · 国家、城市与方位'],
 ['p1-home','P1 · 租房住宿与家居'],
 ['p1-travel','P1 · 交通出行与旅游'],
 ['p1-work','P1 · 学校报名与工作服务'],
 ['p1-money','P1 · 银行、费用与购物'],
 ['p1-food','P1 · 餐饮与食物'],
 ['p1-health','P1 · 医疗、运动与休闲'],
 ['p1-map','P1/P2 · 地图、位置与设施'],
 ['p4-ecology','P4 · 动植物与生态'],
 ['p4-environment','P4 · 地理、环境与能源'],
 ['p4-history','P4 · 历史、文化与艺术'],
 ['p4-business','P4 · 商业、社会与管理'],
 ['p4-study','P4 · 教育、研究与学术表达'],
 ['p4-tech','P4 · 科技、材料与健康研究'],
 ['shared-general','P1/P4 · 通用描述与表达']
];
const groups=new Map(taxonomy.map(([id,name])=>[id,{id:'resource-'+id,name,words:[]} ]));
const normal=s=>String(s).toLowerCase().replace(/\([a-z]+\)/g,'').replace(/[^\p{L}\p{N}]/gu,'');
const whole=(text,terms)=>terms.split('|').some(t=>new RegExp('(?:^|[^a-z])'+t+'(?:s|es)?(?:$|[^a-z])','i').test(text));
const commonDate='monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|morning|afternoon|evening|night|midday|midnight|week|weekend|day|month|year|hour|minute|second|spring|summer|autumn|winter|litre|liter|mile|kilogram|inch|kilometer|kilometre|feet|gram|gallon|hectare|centimeter|centimetre|ounce|metre|meter|number|half|double|quarter|thousand|hundred|million|billion|percent|percentage';
const places='america|american|australia|australian|britain|british|england|english|canada|canadian|spain|spanish|china|chinese|egypt|egyptian|france|french|germany|german|greece|greek|india|indian|italy|italian|japan|japanese|russia|russian|scotland|scottish|scotsman|london|leeds|liverpool|edinburgh|manchester|glasgow|sheffield|wales|birmingham|cardiff|sydney|victoria|canberra|melbourne|queensland|perth|brisbane|adelaide|ottawa|toronto|vancouver|quebec|seattle|boston|chicago|european|europe|north|south|east|west|northeast|northwest|southeast|southwest|northern|southern|eastern|western';
const rules=[
 ['p1-home',/住宿|租房|租金|房租|押金|公寓|卧室|厨房|家居|家具|窗帘|床单|地板|家政|清洁|房东|旅舍|旅馆|壁炉|冰箱|烤炉|烤箱|碗柜|楼下|地毯|屋顶|维修/,'accommodation|homestay|hotel|hostel|house|housing|flat|apartment|building|bedroom|bathroom|downstairs|upstairs|kitchen|cupboard|cushion|sofa|oven|roof|window|door|mirror|table|chair|lamp|floor|carpet|washing|cleaning|laundry|receptionist|rent|landlord|landlady|deposit|maintenance|furniture|linen|curtain|towel|pillow|mat|vacuum|fireplace'],
 ['p1-travel',/交通|旅行|旅游|行李|航班|登机|机场|车站|车票|票务|汽油|航运|驾驶|飞行员|轮胎|停泊|停车|护照|假日|假期/,'transport|transportation|airport|airplane|aeroplane|airline|flight|ticket|car|bus|bike|bicycle|train|boat|ferry|boarding|holiday|vacation|shipping|driving|drive|pilot|tire|tyre|parking|platform|luggage|passport|tour|tourism|travel|railway|subway|petrol|tram|route|caravan|vehicle|canoe|cabin|cruise|journey|trip|tourist|traffic'],
 ['p1-money',/购物|商店|商场|购物中心|超市|售价|价钱|价格|费用|收据|银行|账单|信用卡|账户|付款|支付|现金|支票|硬币|折扣|退款|货币|税款|零钱|免费|昂贵|购买|礼物/,'bank|account|payment|cash|cheque|check|coin|price|cost|fee|fare|receipt|refund|discount|purchase|buy|sell|shop|shopping|store|mall|market|money|tax|gift|expensive|free|card|insurance|guarantee|wallet'],
 ['p1-food',/食物|食品|餐厅|餐饮|菜单|早餐|午餐|晚餐|厨师|烹饪|蛋糕|奶油|奶酪|比萨|披萨|三明治|土豆|马铃薯|蔬菜|水果|咖啡|蜂蜜|橄榄|饮料|果汁|葡萄|玉米|肉|牛奶|谷物|食盐|香料|汤匙|餐巾|热量|营养|进餐/,'food|meal|breakfast|lunch|dinner|restaurant|cafe|coffee|cook|kiosk|menu|fruit|vegetable|milk|cream|cheese|salt|sugar|honey|olive|potato|sandwich|pizza|cake|bread|butter|drink|juice|eat|chicken|beef|pork|lamb|steak|fish|tuna|corn|nut|chocolate|salad|sauce|cereal|napkin|spoon|fork|knife|calorie|diet|snack|dried|dressing|flavour|flavor|recipe|pot|pan|apron|boil|grill|bake'],
 ['p1-health',/医院|诊所|医生|病人|患者|处方|药物|药片|药房|疼痛|伤口|伤痛|牙科|牙医|护士|眼睛|毛发|手指|体育|运动|球门|赛跑|棒球|游泳|泳池|徒步|远足|聚会|娱乐|放松|爱好|按摩|健身|会员/,'hospital|clinic|doctor|patient|prescription|medicine|medication|chemist|nurse|pain|injury|hair|eye|hand|dentist|flu|skin|health|fitness|exercise|sport|swim|swimming|pool|race|baseball|tennis|soccer|football|yoga|gym|hike|hiking|walking|walk|hobby|game|party|fun|judo|bowling|golf|basketball|volleyball|badminton|massage|membership|leisure|relaxation|entertainment'],
 ['p1-work',/报名|注册|申请|预约|求职|职位|职业|雇主|雇员|雇用|工作经验|招聘|秘书|同事|主管|经理|接待|服务台|电话|电话号码|邮件|邮政|邮寄|地址|邮编|证书|护照|图书馆|课程|学校|学院|文具|铅笔|日历|日记|办公室|活动组织/,'school|college|university|library|course|certificate|application|appointment|registration|enrolment|enrollment|job|work|occupation|employer|employee|secretary|director|manager|office|reception|service|phone|email|mail|post|letter|address|postcode|calendar|diary|pencil|pen|notebook|booklist|booklet|stationery|enquiry|interview|volunteer|architect|engineer|conference|meeting'],
 ['p1-map',/方位|方向|地图|位置|入口|出口|对面|拐角|路口|十字路口|箭头|左侧|右侧|平行|圆形|三角|长方|正方|广场|大厅|场馆|设施|路线/,'map|mapping|position|location|direction|intersection|crossroad|entrance|exit|gate|corner|arrow|opposite|left|right|beside|near|parallel|triangle|triangular|rectangular|rectangle|circle|circular|square|hall|booth|front|back|middle|top|bottom|side'],
 ['p4-ecology',/生态|动物|植物|野生|物种|栖息|灭绝|繁殖|迁徙|捕食|寄生|鲸|海豚|昆虫|鸟|狮子|大象|蛇|马$|树|根茎|种子|化石|骨骼|基因|遗传|生物多样|蜥蜴|花粉|叶|光合作用/,'ecology|ecosystem|animal|plant|wild|wildlife|species|habitat|conservation|extinction|breeding|migration|predator|parasite|whale|dolphin|insect|bird|lion|elephant|snake|horse|tree|root|seed|fossil|skeleton|genetic|gene|biodiversity|biology|bee|flora|fauna|vegetation|hunting|farm|agriculture|farming|nutrient|germination|nest|hive|feather|shell|pet|rose|grass|flower|forest|forestry|cattle|herb'],
 ['p4-environment',/环境|地理|气候|天气|污染|矿产|矿物|资源|能源|河流|海洋|海岸|沙漠|土壤|岩石|石头|风暴|暴风|风力|电力|煤|石油|天然气|火山|沉积|蒸发|温度|湿度|风，|太阳|星球|火星|保护区|回收|废物|垃圾|灌溉/,'environment|environmental|geography|climate|weather|pollution|pollutant|mineral|resource|energy|river|ocean|coast|desert|soil|rock|stone|wind|storm|power|electricity|coal|petroleum|volcano|evaporation|temperature|humidity|sun|mars|solar|recycling|rubbish|trash|garbage|irrigation|sand|mud|clay|carbon|nitrogen|oxygen|drought|flood|erosion|sediment|water|air|heat|peak|mountain|landscape|rainfall|rainforest'],
 ['p4-history',/历史|文化|传统|文物|古代|考古|博物|艺术|绘画|音乐|歌曲|歌唱|钢琴|吉他|爵士|电影|演员|诗|雕刻|手工|织|王冠|君主|国王|皇帝|军队|陆军|武器|枪，|传说|神话|节日|陶瓷|瓷器|珠宝|铭文|遗址/,'history|historical|culture|cultural|traditional|archaeology|archeology|museum|art|picture|painting|music|song|singing|piano|guitar|jazz|film|movie|actor|poem|sculpture|weaving|crown|king|emperor|army|soldier|weapon|gun|myth|festival|porcelain|pottery|jewellery|jewelry|inscription|artefact|artifact|medieval|mediaeval|heritage|monument|theatre|theater|drama|tragedy|fashion|ornament|joke|humor|humour|drum|band'],
 ['p4-business',/商业|经济|商务|公司|管理|营销|市场|生产|制造|包装|产业|企业|组织|人口|社会|选举|监狱|法律|犯罪|权力|退休|消费|金融|财务|投资|广告|利润|收益|收入|支出|通胀|职场|冲突|领导|税收/,'business|commercial|economy|economic|company|management|marketing|production|manufacturing|packaging|industry|organisation|organization|population|social|society|election|prison|law|crime|retirement|consumption|finance|financial|investment|advertising|profit|income|expense|leadership|conflict|employment|career|trade|distribution|consumer|client|customer|attitude|behaviour|behavior|cooperation|taxes|loss'],
 ['p4-study',/教育|研究|学术|调查|问卷|实验|观察|数据|统计|分析|理论|假设|论文|讲座|研讨|讨论|作业|考试|评价|评估|认知|记忆|学习|语言|语义|语法|摘要|解释|结论|比较|变化|原因|频率|证据|观点|方法|技能|技巧|测量|精度|数量|比重|比例|质量/,'education|educational|research|academic|survey|questionnaire|experiment|observation|data|statistics|analysis|theory|hypothesis|essay|lecture|seminar|discussion|assignment|examination|evaluation|assessment|cognitive|memory|learning|language|semantic|grammar|abstract|explanation|conclusion|comparison|change|reason|frequency|evidence|opinion|method|skill|measurement|precision|quantity|proportion|quality|estimate|variable|impact|factor|effect|information|instrument|measurer|strategy|communication|literature|psychology|mathematics|math|maths|book|word|printed|publication|magazine|newspaper|journal|printed|author|syllabus|curriculum|tutorial|bibliography'],
 ['p4-tech',/科技|技术|科学|化学|物质|材料|金属|磁铁|磁体|银|铜|铅；|金$|钢|电缆|电路|机器|机械|机器人|计算机|电脑|互联网|数字技术|电子|电气|塑料|合成|器械|肾脏|医学|健康|细胞|疾病|反应|液体|固体|气体|粉末|光线|反射|癌|激素|心血管|综合征|神经|营养|疾病/,'technology|technical|science|scientific|chemical|chemistry|material|metal|magnet|silver|copper|lead|gold|steel|cable|circuit|machine|machinery|robot|computer|computing|internet|digital|electronic|electrical|plastic|synthesized|kidney|medical|health|cell|disease|reaction|liquid|solid|gas|powder|light|reflective|cancer|hormone|cardiovascular|syndrome|nerve|brain|nutrition|software|hardware|engine|fuel|mechanical|wax|rubber|battery|concrete|brick|ink|paper|tool|sound|recording|audio|video|camera|printer|online|user|code|zoom|wire|screen|lens|photocopy|photocopier']
];
const legacy={住宿场景:'p1-home',旅游场景:'p1-travel',工作场景:'p1-work',地图场景:'p1-map',学院生活与研究:'p4-study',生物场景:'p4-ecology',商业场景:'p4-business',环境地理场景:'p4-environment',娱乐场景:'p1-health',运动场景:'p1-health',银行场景:'p1-money',餐厅场景:'p1-food',医药场景:'p1-health',计量单位:'shared-dates'};
const topic={自然生态专题:'p4-ecology',历史文化专题:'p4-history',健康科技专题:'p4-tech'};
const extra={
 'shared-dates':'century|clock|time|timing|pound',
 'shared-places':'New York|Washington D.C.|Los Angeles|Argentina|New South Wales|New Zealand|North America|South America',
 'p1-home':'wall|room|home|household|roommate|common room|central heating|storeroom|soundproof|microwave|shower|lighting|safety check|clean|help desk|residential|hospitality|locker|storage',
 'p1-travel':'automobile|motorbike|motorway|highway|harbour|compass|parachute|guide|cargo|lane|avenue|park|lake|land bridge|guidebook|greyhound|boarding pass|vacation|traffic lights|cable car|pilot|car park',
 'p1-work':'childcare|hotline|password|whiteboard|teamwork|student|teacher|primary|class|child|full-time|absent|confirmation|message|name|apology|congratulation|welcome|return|list|completion|absent|planning|pencil|handbook|newsletter|childhood|mother|father|friend|person|son|girl|adult|elder|teenager|family name|surname',
 'p1-money':'receipt|wallet|trader|tailor|sales|coat|jeans|sock|hat|shoe|sandals|clothes|bag|toy|box|boot|necklace|cosmetic|label|display|stall|cash machine|opening time',
 'p1-food':'seafood|cocktail|orange|lemon|beer|berry|melon|strawberry|egg|hungry|frozen|vegetarian|vegetable|meal|dried|starvation',
 'p1-health':'healthcare|heartbeat|psychotherapy|depression|saliva|glasses|eyesight|leg|foot|shoulder|knee|mouth|blind|sunblock|sunscreen|sunshade|sunshield|suntan|whistle|runner|ball|dive|lifting|indoor|outdoor|dancing|comedy|party|clapping',
 'p1-map':'outside|inside|centre|layout|spaces|street|room number|wicket door|crossing|wheelchair|wheelchair access|railway station|at the end of|next to',
 'p4-ecology':'livestock|crop|agricultural|organic|hibernate|instinctive|monkey|greenhouse|hothouse|fishing net|mould|fertiliser|fertilizer|farmland|timber|conservation|preserved',
 'p4-environment':'firewood|footprint|rainbow|raindrop|wasteland|city|island|sandy|ash|thunderstorm|sunlight|sunset|cloud|stream|ozone|planet|eclipse|world|reusable|lake|geographical|landmass|waterproof',
 'p4-history':'craftsman|craftwork|realism|classical|aristocrat|slave|battle|cartoon|story|gallery|painter|drawing|photography|photo|biography|audience|ceremony|opera|marriage|landmark|art gallery|pottery|emperor',
 'p4-business':'copyright|charity|donation|sponsor|wealthy|profitable|labor|labour|servant|robber|scandal|status|rank|congress|immigration|population|testimony|morality|lifestyle|wealth|profitability',
 'p4-study':'footnote|guideline|leaflet|textbook|reading|writing|listening|definition|cognition|recall|record|error|mistake|math|debate|ratio|average|trend|stability|consistency|characteristic|concentrated|convention|scenario|source|symbol|foundation|rate|reduction|identification|development|developing|support|talent|talented|journalism|literacy|printed',
 'p4-tech':'flashlight|headphones|remote control|submarine|videotape|satellite|rocket|telescope|hammer|element|iron|antifreeze|durable|elastic|radar|invented|printing|disc|visible|tracking|bottle|pipe|wire|fan|television|TV|alarm|board|tool|machinery|brush|frame|string|rope|leak|camera|energy saving|wavelength'
};
const extraIndex=new Map(Object.entries(extra).flatMap(([tag,terms])=>terms.split('|').map(t=>[normal(t),tag])));
const vocabulary=new Map();
for(const deck of decks.filter(d=>!d.name.startsWith('综合听写'))){for(const w of deck.words){const k=normal(w.term),old=vocabulary.get(k);if(old){old.members.add(deck.name);old.aliases=[...new Set([...old.aliases,...w.aliases,w.term])];if(w.meaning&&!old.meanings.includes(w.meaning))old.meanings.push(w.meaning)}else vocabulary.set(k,{...w,members:new Set([deck.name]),meanings:w.meaning?[w.meaning]:[]})}}
function classify(w){const text=w.term.toLowerCase(),zh=w.meanings.join('；'),tags=new Set();
 const explicit=extraIndex.get(normal(w.term));if(explicit?.startsWith('shared-'))return [explicit];if(explicit)tags.add(explicit);
 if(whole(text,commonDate)&&(/^(?:\w+|new year)$/i.test(text)||/计量单位/.test([...w.members].join(''))))return ['shared-dates'];
 if(whole(text,places)&&(!/\s/.test(text)||/^(?:new south wales|new york|new zealand|north america|south america|los angeles|washington d\.c\.)$/i.test(text)))return ['shared-places'];
 if(!tags.size)for(const [tag,re,terms] of rules)if(re.test(zh)||whole(text,terms)){tags.add(tag);break}
 // Preserve a second substantive use, but do not perpetuate duplicated broad lists.
 for(const name of w.members){if(legacy[name]&&tags.size===0)tags.add(legacy[name]);if(topic[name])tags.add(topic[name])}
 if(w.members.has('商业社会与教育建筑专题')&&tags.size===0)tags.add(/教育|学校|大学|建筑/.test(zh)?'p4-study':'p4-business');
 if(tags.size===0)tags.add('shared-general');return [...tags];
}
for(const w of vocabulary.values()){for(const tag of classify(w)){const deck=groups.get(tag);deck.words.push({term:w.term,meaning:w.meanings.join('；'),category:deck.name,aliases:[...new Set(w.aliases)].filter(t=>t!==w.term),audio:w.audio||''})}}
const output=[...groups.values()].filter(d=>d.words.length).concat(decks.filter(d=>d.name.startsWith('综合听写')));
process.stdout.write('// Vocabulary grouped by practice topic; P1/P4 are study-use labels, not source claims.\nwindow.BUNDLED_REVISION = 2;\nwindow.BUNDLED_DECKS = '+JSON.stringify(output)+';\n');
