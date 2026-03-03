// 豪密密码工具 - 密码本管理
import type { Codebook, CodebookPage } from '../types';

// 缓存的密码本
let cachedCodebook: Codebook | null = null;

/**
 * 从三国演义.txt提取汉字生成密码本
 * @returns 默认密码本
 */
export async function generateDefaultCodebook(): Promise<Codebook> {
  // 如果已缓存，直接返回
  if (cachedCodebook) {
    return cachedCodebook;
  }

  try {
    // 读取三国演义.txt文件
    const response = await fetch('/haoMi/三国演义.txt');
    if (!response.ok) {
      throw new Error(`Failed to load: ${response.status}`);
    }
    const content = await response.text();

    // 提取所有汉字（包含重复），全量使用
    const chars: string[] = [];
    for (const char of content) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        chars.push(char);
      }
    }

    const charsPerPage = 300; // 每页300字
    const maxPages = Math.ceil(chars.length / charsPerPage); // 根据实际字符数计算页数

    const pages: CodebookPage[] = [];

    for (let i = 0; i < maxPages; i++) {
      const startIdx = i * charsPerPage;
      const endIdx = startIdx + charsPerPage;

      if (startIdx >= chars.length) break;

      // 截取当前页的字符
      let pageChars = chars.slice(startIdx, endIdx);

      // 补足300字（用空字符串填充）
      while (pageChars.length < charsPerPage) {
        pageChars.push('');
      }

      // 使用基于页码的固定种子，确保跨浏览器/跨会话一致性
      // 种子公式：100000 + 页码 * 1234，确保在100000-999999范围内
      const fixedSeed = 100000 + (i + 1) * 1234;

      pages.push({
        pageNumber: i + 1,
        rows: 10,
        cols: 30,
        characters: pageChars,
        randomSeed: fixedSeed
      });
    }

    cachedCodebook = {
      name: '三国演义密码本-V1',
      version: '1.0.0',
      totalPages: pages.length,
      pages
    };

    return cachedCodebook;
  } catch (error) {
    console.error('Failed to load codebook from file:', error);
    // 返回备用密码本（使用硬编码字符）
    return generateFallbackCodebook();
  }
}

/**
 * 生成备用密码本（当文件读取失败时使用）
 * @returns 备用密码本
 */
function generateFallbackCodebook(): Codebook {
  // 《三国演义》前3000个不重复汉字
  const SANGUO_CHARS = `三国演义罗贯中是古代第一部长篇章回小说历史的经典之作描写了公元世纪以曹刘备孙权为首魏蜀吴个政治军事集团间矛盾和斗争在广阔社会背景上展示出那时尖锐复杂又极具特色冲突谋略方面对后产生深远影响本书语言动场宏大性鲜明塑造关羽张飞等许多不朽人物形象其文学成就使它实已入到艺术及活滚江东逝水浪花淘尽英雄非败转头空青山依旧几度夕阳红白发渔樵渚惯看秋月春风壶浊酒喜相逢今少都付笑谈调寄临仙宴桃园豪杰结斩黄巾立功话天下势分久必合周末七并于秦灭楚汉朝自高祖蛇而起统来光武兴传至献帝遂推致乱由殆始桓灵二禁锢善类崇信宦官崩即位将窦太傅陈蕃共辅佐有节弄诛机密反所害涓此愈横建宁年四望日御温德殿升座角狂骤只见条从梁蟠椅惊倒左右急救宫百俱奔避须臾忽然雷雨加冰雹落半夜止坏却房屋无数洛地震海泛溢沿居民被卷雌鸡化六朔黑气十余丈虹现玉堂五原岸皆裂种祥端诏问群臣灾异议郎蔡邕疏蜺堕乃妇寺干颇切直览奏叹息因更衣窃视悉宣告他陷罪放归田里让赵忠封谞段珪侯蹇硕程旷夏恽郭胜朋比奸号常侍尊呼阿父心思盗贼蜂巨鹿郡兄弟名宝秀才采药遇老碧眼童颜手执藜杖唤洞授曰平要汝得当普若萌获恶报拜姓吾南华也讫阵清去晓攻习能道正内疫流行散施符病称贤良师徒云游念咒次众万千各渠帅讹苍死岁甲子吉令土字家门幽徐冀荆扬兖豫八州奉遣党马暗赍金帛交应与商难者顺乘取诚可惜私旗约期举唐驰径赴省变召何进兵擒收狱闻知露星申运终圣宜乐裹浩靡火速降处讨卢植皇甫嵩朱儁引精路且前犯界守焉竟陵氏鲁恭王校尉邹靖计我寡招敌随榜募涿县甚好读宽怒素志专身尺寸两耳垂肩双过膝目顾如冠唇涂脂阁玄昔贞亭坐酎失遗这枝弘曾孝廉亦尝吏早丧幼孤母贫贩屦织席业住楼桑村树遥车盖贵乡儿戏叔奇资给郑瓒友矣慨厉声夫力故豹环燕颔虎貌某翼庄卖屠猪恰室宗亲倡欲破安恨财勇同店饮着辆歇便保快斟吃待赶城投九髯重枣丹凤卧蚕眉威凛邀叩改河解倚凌杀逃湖己开盛祭协图齐乌牛礼项焚香再誓虽既则困扶危黎庶求愿鉴忘恩戮毕罢宰设聚士痛醉拾器但匹虑客伙伴佑迎接苏每往北近寇请置管诉意送赠银镔铁斤用谢别命匠打股剑龙偃刀冷艳锯点钢全铠参通派认侄欣领披抹额鞭骂逆副邓茂战挺刺窝翻折拍舞纵措挥诗赞颖试兮初把标戈走追赏劳龚牒围乞赐援混退寨谓伏鸣鼓噪岭摩夹溃率助剿筹决算神还逊伟绩鼎穷犒帐留听拒未负颍川垒探消捕利草营束埋击焰慌鞍残夺彪截闪细骑沛谯操孟腾养冒瞒猎歌荡责诈状恙乎爱罔恣桥济君顒亡劭答除任棒提巡拿外莫敢顿丘步值拦级幡脱袭喊烛乏簇护槛囚缘妖廷差丰体索贿赂粮尚缺钱承挟惰慢董卓京论岂拥逮冈漫塞野职轻血厮情犹谁识督邮舅竖仲陇西洮骄傲怠擅甘离稍连厚跟曲屯先锋搦麾仗法似限忙彼羊狗候坡泼拨秽准摇擂际砂石驱炮纸纷坠荒箭臂带坚捷屡棺尸枭牧表班催促严韩烧劫仇据宛抵恐弃掩定断纳耶主附劝惟容掠策桶况撤独恋果射暂熊腰富台塘赃奋叫指荐稽昌司韶臧旻盐渎丞盱眙邳诸旅淮泗登槊弓尹郁街闲钧鬻爵悬郊布欺逐怨教铨注微理晚府克署毫感食桌寝床稠倦凡沙汰疑适馆驿阶喝虚滥污喏勒番免役阻肯杯闷哭逼苦遭睁圆咬碎牙挡厅绑么揪扯桩缚攀柳腿喧闹观仁慈傍边仅侮辱枳棘丛栖鸾印绶挂颈姑饶缴捉恢匿题握互列嗟区纯雪片藏谏陶恸旦陛阉侵祸跪朕怜休刑勿耽受毁谤躬肉敬稷摧撞牵假虞征巢挫凶暴卒缢赦迁整笃妹辩宠幸美嫉妒鸩苌妻继偏绝患潘隐宅质滋蔓倘族详叱辈踌躇赛秘矫册借新扫袁隗绍隶林荀攸泰员柩阴娘悯忧旨寒享妄根录抬孩僚腹帘掌骠预酣捧吕口辄敕沽竞系藩妃仍刎哀废珠玩构苗遮蔽庭葬托殃俊务伐顷尔庙没唯允奈妙檄镇薄琳俗雀骧洪炉燎毛霆阙怀持柄懦易侧宵智丁馈李肃足料鳌凉显陆续婿陕傕汜樊儒味汤沸薪痈毒钟豺狼狠渑池按斧嘉诣骨齑粉谕簿泄防测选琐懿昂疾荣效寻闭砍倾墙掷胁宥匡翠剁泥擐窗跳属误摄觅烟邙掾闵贡饥馁挤怕觉吞莽爬满萤芒照耀渐堆畔院梦户崔烈毅偶瘦杨淳琼鲍驾另换谣谶旌尘绣栗向抚慰检玺市惶忌惮诱迟排筵遍卿惧停静仪弱聪案嫡篡掣佩宇轩画戟否伊桐邑霍强拔彭伯怖跃潜顶袍猊狮蛮炭哉凭烂舌拱贲赤兔词颗揖渡履浑般尾蹄嘶咆哮单埃紫雾丝缰辔驹甜擎孰钦囊禽择木悔罚慕沈吟真秉旱锦畅越鄠卫农践辞恕毖伍忿购渤嗣佻恪彰忝永惑纲毋懋规矩戚邪誉兹服悲惨愤溅简委墟括贺锁基趋福擢徵泪嫩绿凝袅陌羡呈弑女融寿短练妾存潸颓姬茕抱俄延撺绞灌淫宿男装载轸孚瑜伺抠瞪盈剖剐堪忍跋扈贱屈舍酌祝诞叙想奄骁禄沥羸拣忖胖耐仰镜遽嵌饰递鞘寓紧窜牟覆熟沉晌讳监审究鸿鹄屏觑兽释盘费皋奢最榻樽匆驴磨搜厨鞒瓶携菜款憎默敲喂饱睡插句齿骈谦曼惇婴枪渊壮娴办盟达谨戾充积拯馥孔伷岱邈乔瑁超祁蒙卑裔筑层帜旄钺坛衅虐沦纠渝俾育歃慷涕较律遵违总挑险禀芥枕割猿胡岑抄垠脊零辽支帻锭鬃咽喉矢或猛餐价躲拽鹊戴盔柱劈扎伤胄叉竿俞涉著丑量酾热振塌岳撼铃乾坤辕冬盏俺哥牢玲珑悦境些队飐穆锤腕奴抖擞斜灯呆架隔拖炎魂夸躯砌鳞簪雉错踏荧煌胆踊线电恼灿霜鹦鹉蛱蝶鬼嚎绕迷杆销彩绒绦飘伞移隙谗配夷你鼠斯旺悟衰捐察琬瓦砾兼播崤函砖爽骚籍赀押沟壑啼刃焦掘坟冢缎铺犬疲益荥坞旁遏摆徙脚昼锅饭搭膊踅创祀辉垣井捞样匣启镌纽镶篆卞凰工琢狩舟漏偷烦津酸固敖仓轘谷制驻析耻翔麟范滂博昱康檀敷俭咥蒯襄邻垓怎磐跨亏唾谌辛评耿鼻譬乳哺饿沮懊冤健捻扒浓颐欠辖羌弩麴圈辰巳牌呐搴呵兜鍪扑透狈输磾仆岐讲曩洒睦叵船翊弼季朗霸怯弦削脑袋泊柔拙壕毙岘娶吹兆旋趱昏拴锣浆迸扛泣贮殒巧僭晃璜郿库珍凿睛煮慄箸畏荼蘼牡吁窥伎貂蝉佳伸肺腑训优愁泉涌累卵嫁谍肴馔迓殷勤妆佯央靠哩妨频波趁帏幔午巍觞舜尧禹勋供坊栊笙簧缭昭彻莲稳暖黛脸肠榆买丽唱板低讴樱绛喷吐衠惠浅毡襟怪昨奁音耗梳蹙做态拭怏染朦胧恍惚记栏拂箕帚诀荷愉闺羞惭搂偎抢肥胸膛贾诩缨蒋壁噬慎裙凯缓晤跌挽述迈惹芳笔臭诺瑞痊禅罩颤欢轮辇卜晨谒掖衷衢脐膏蓄绮皿庆骇黥刖赎辜喈逸佞讪肆葛隆洗挠激填苟努馗胪奂颀徘徊弥亘霄魄魁赚衔品皮雕凑椁霹雳晴邵盩厔峻忻联骏搠舒隘僮阑吓俯彧绲访陋聘晔虔邱玠韦涧梧骋岌袄瑯琊闿僧廊湿们勉辎厕阖循鄄摘剜墓穿缟濮朐糜竺搬楷阜宙膺阍炜宾亥米倍添莱粟修拈札鄙谊敛繇酬替掎潮衙豁愕扰拆孽踞讥讽竭庞亟颠枯瞑葺赖滕薛兰雁郝宋宪梆劲穗纬吊赢壳轰巷柴胯肢蝗虫禾稻斛诲祐幕奠狐硬陂坑钩褚耕掳贽麦堤诡竹滨忒压瞋叶陪劣嫌狭需讶粪汁暹嫔獭殄馑兢瓯肝剩茫黍苞戒维腐琦撄袖映巫郦抗羿恃敦涣贪饵祈祷銮舆揭哄骅骝跸煨膳刚抛啸渭件疆绳绢包缆粗粝茅篱触殴医刻锥莩轵芜蒿剥砀雅凋怬晋慓哙腴淡觐爪鸟介殊厌艾艰扮罕喟碍挞编占逞帮觥该唬澄醒绰眷嫂缝麋庐泾鄣衡姿瑾昆谐纮邸滩奕洋笮栅渗逶迤松秣丢霎疮辑谙芦苇绊蠢恤颂枫阊裨钉杭姚浙鏖查燃隅胀佗鹤蕤芬蛟淯胤抽稚拉稀筋翅愧笄媒姻婚例俟渺诰络妓瞻兀熬虏堑枷秩鹰飏璋纣冯沂琅碣浚媚叛瓜孺贝垕吝伪损猖獗刈鸠块拟戕悚懔貔貅梯凳啖锹钁划遁验暮繁浸润淆愚谀嗤夙雍肘途萧豨盍旬戎绵褒戌缠眭淹减槽酿憩捆儆狻恫侣笥蛔倨鹕砥栋材滔枉墀谱漳胶泽仕诬彦劾肱狝攘逍鈚弯扣剔完衬像酂聊仔踪迹碾缀伦寐底幅茶证嚼鸳鹭序潢夤浇韬晦圃梅渴俎漠涛叨庇藉碌匙迅嵫谑觳灰笕惺拊骸愦萸魃恚朴劬栉笼网鱼羁考裁侈暑庖蜜呕璆瓮辨跑穴婢忤愬弊廪增楫缮迫臻饕餮匄璧货赘犭票狡瑕谘衄补奖谄孥咎彷徨蹈返旆警匪遑局钳眦睚含杜梓柏裸摸隳桀苛科罾蹊阱酷诘绪缩厥螳螂隧漯焫蓬沧沃咸徂弛畿拘勖哲汗郃阄躁担偿豕虾祢黜乂畴咨熙睿纂厄昃淑亮跞睹奥诵鸷鹗坌粹騕褐赋铸糟版挝裤尼胥蜾呀洲俦柯髓扭罐煎拷唆针淋漓孕贬娩憔悴疥谭廨邺钓馀捱卸俸赡妥谅缉绫皂纱畜森械獬豸悠剽颊翩哨辟缄缔楮廖坦冗迭净讯蒲歹钵模滑琪撑翰墨甥沱烘焙踢肖翁裴肋虬镫吼拼偕杳歆靶湄疗氅煽厘缧绁瑟帕沐浴霖喨溪勃斫麻禳`;

  const chars = Array.from(SANGUO_CHARS);
  const charsPerPage = 300;
  const maxPages = 10;

  const pages: CodebookPage[] = [];

  for (let i = 0; i < maxPages; i++) {
    const startIdx = i * charsPerPage;
    const endIdx = startIdx + charsPerPage;

    if (startIdx >= chars.length) break;

    let pageChars = chars.slice(startIdx, endIdx);
    while (pageChars.length < charsPerPage) {
      pageChars.push('');
    }

    // 使用基于页码的固定种子，确保跨浏览器/跨会话一致性
    const fixedSeed = 100000 + (i + 1) * 1234;

    pages.push({
      pageNumber: i + 1,
      rows: 10,
      cols: 30,
      characters: pageChars,
      randomSeed: fixedSeed
    });
  }

  return {
    name: '三国演义密码本-V1(备用)',
    version: '1.0.0',
    totalPages: pages.length,
    pages
  };
}

/**
 * 查找汉字在密码本中的位置
 * @param char - 要查找的汉字
 * @param codebook - 密码本
 * @returns 位置信息 { pageNumber, row, col }，未找到返回null
 */
export function findCharPosition(
  char: string,
  codebook: Codebook
): { pageNumber: number; row: number; col: number } | null {
  for (const page of codebook.pages) {
    const index = page.characters.indexOf(char);
    if (index !== -1) {
      const row = Math.floor(index / page.cols);
      const col = index % page.cols;
      return { pageNumber: page.pageNumber, row, col };
    }
  }
  return null;
}

/**
 * 根据位置获取汉字
 * @param pageNumber - 页码
 * @param row - 行号
 * @param col - 列号
 * @param codebook - 密码本
 * @returns 汉字，未找到返回null
 */
export function getCharAtPosition(
  pageNumber: number,
  row: number,
  col: number,
  codebook: Codebook
): string | null {
  const page = codebook.pages.find(p => p.pageNumber === pageNumber);
  if (!page) return null;

  const index = row * page.cols + col;
  return page.characters[index] || null;
}

/**
 * 汉字转明码（7位数字：3位页码+2位行号+2位列号）
 * @param char - 汉字
 * @param codebook - 密码本
 * @returns 7位明码字符串，未找到返回null
 */
export function encodeToClearCode(
  char: string,
  codebook: Codebook
): string | null {
  const position = findCharPosition(char, codebook);
  if (!position) return null;

  const { pageNumber, row, col } = position;
  return `${String(pageNumber).padStart(3, '0')}${String(row).padStart(2, '0')}${String(col).padStart(2, '0')}`;
}

/**
 * 明码转汉字
 * @param code - 7位明码（3位页码+2位行号+2位列号）
 * @param codebook - 密码本
 * @returns 汉字，未找到返回null
 */
export function decodeFromClearCode(
  code: string,
  codebook: Codebook
): string | null {
  if (code.length !== 7) return null;

  const pageNum = parseInt(code.slice(0, 3), 10);
  const row = parseInt(code.slice(3, 5), 10);
  const col = parseInt(code.slice(5, 7), 10);

  return getCharAtPosition(pageNum, row, col, codebook);
}

/**
 * 验证密码本格式
 * @param data - 待验证的数据
 * @returns 是否是有效的密码本
 */
export function isValidCodebook(data: unknown): data is Codebook {
  if (typeof data !== 'object' || data === null) return false;

  const cb = data as Partial<Codebook>;

  if (typeof cb.name !== 'string') return false;
  if (typeof cb.version !== 'string') return false;
  if (typeof cb.totalPages !== 'number') return false;
  if (!Array.isArray(cb.pages)) return false;

  for (const page of cb.pages) {
    if (typeof page.pageNumber !== 'number') return false;
    if (typeof page.rows !== 'number') return false;
    if (typeof page.cols !== 'number') return false;
    if (!Array.isArray(page.characters)) return false;
    if (typeof page.randomSeed !== 'number') return false;
  }

  return true;
}

/**
 * 导出密码本为JSON字符串
 * @param codebook - 密码本
 * @returns JSON字符串
 */
export function exportCodebook(codebook: Codebook): string {
  return JSON.stringify(codebook, null, 2);
}

/**
 * 从JSON字符串导入密码本
 * @param json - JSON字符串
 * @returns 密码本，解析失败返回null
 */
export function importCodebook(json: string): Codebook | null {
  try {
    const data = JSON.parse(json);
    if (isValidCodebook(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// localStorage keys
const CODEBOOK_STORAGE_KEY = 'haomi_codebook';

/**
 * 从localStorage加载密码本
 * @returns 密码本，未找到返回null
 */
export function loadCodebook(): Codebook | null {
  try {
    const data = localStorage.getItem(CODEBOOK_STORAGE_KEY);
    if (data) {
      return importCodebook(data);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 保存密码本到localStorage
 * @param codebook - 密码本
 */
export function saveCodebook(codebook: Codebook): void {
  try {
    localStorage.setItem(CODEBOOK_STORAGE_KEY, exportCodebook(codebook));
  } catch (error) {
    console.error('Failed to save codebook:', error);
  }
}
