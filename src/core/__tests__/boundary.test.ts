// 豪密密码工具 - 边界条件测试
import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, decryptChar, isValidCiphertext, CipherError } from '../cipher';
import { generateDefaultCodebook, encodeToClearCode } from '../codebook';
import { generateRandom, generateRandomSequence } from '../random';
import type { Codebook } from '../../types';

describe('边界条件测试', () => {
  let codebook: Codebook;

  beforeAll(async () => {
    codebook = await generateDefaultCodebook();
  });

  describe('空输入测试', () => {
    it('空字符串加密应该抛出错误', () => {
      expect(() => encrypt('', codebook)).toThrow(CipherError);
    });

    it('应该处理空字符串解密', () => {
      expect(() => decrypt('', codebook)).toThrow(CipherError);
    });

    it('只有空格的加密应该抛出错误', () => {
      expect(() => encrypt('   ', codebook)).toThrow(CipherError);
    });

    it('只有换行符的加密应该抛出错误', () => {
      expect(() => encrypt('\n\n\n', codebook)).toThrow(CipherError);
    });
  });

  describe('特殊字符测试', () => {
    it('应该正确处理英文+中文字符', () => {
      const result = encrypt('abc123天地', codebook);
      // 3字母 + 3数字 + 2中文 = 8个加密单元
      expect(result.details).toHaveLength(8);
      expect(result.details[0].type).toBe('letter');
      expect(result.details[3].type).toBe('digit');
      expect(result.details[6].char).toBe('天');
      expect(result.details[7].char).toBe('地');
    });

    it('应该处理中英文混合', () => {
      const result = encrypt('Hello天地World', codebook);
      // 5字母 + 2中文 + 5字母 = 12
      expect(result.details).toHaveLength(12);
      const decrypted = decrypt(result.ciphertext, codebook);
      expect(decrypted).toBe('Hello天地World');
    });

    it('应该处理数字和中文混合', () => {
      const result = encrypt('123天地456', codebook);
      // 3数字 + 2中文 + 3数字 = 8
      expect(result.details).toHaveLength(8);
      const decrypted = decrypt(result.ciphertext, codebook);
      expect(decrypted).toBe('123天地456');
    });

    it('应该过滤标点符号，只加密中文', () => {
      const result = encrypt('天，地。玄！黄？', codebook);
      // 标点符号被过滤，只保留4个中文
      expect(result.details).toHaveLength(4);
      expect(result.details.map(d => d.char).join('')).toBe('天地玄黄');
      const decrypted = decrypt(result.ciphertext, codebook);
      expect(decrypted).toBe('天地玄黄');
    });

    it('应该过滤emoji字符', () => {
      // emoji 被过滤，只保留中文
      const result = encrypt('😀天😁地😂', codebook);
      expect(result.details).toHaveLength(2);
      expect(result.details.map(d => d.char).join('')).toBe('天地');
      const decrypted = decrypt(result.ciphertext, codebook);
      expect(decrypted).toBe('天地');
    });

    it('生僻字应该抛出错误', () => {
      // 𠀀 是生僻字，不在密码本中
      expect(() => encrypt('天𠀀地', codebook)).toThrow(CipherError);
    });

    it('应该过滤全角空格', () => {
      const result = encrypt('天　地', codebook); // 全角空格
      // 全角空格被过滤，只保留2个中文
      expect(result.details).toHaveLength(2);
      const decrypted = decrypt(result.ciphertext, codebook);
      expect(decrypted).toBe('天地');
    });
  });

  describe('超长文本测试', () => {
    it('应该处理1000字文本加密', () => {
      // 生成1000个重复字符
      const plaintext = '天地玄黄'.repeat(250);
      expect(plaintext.length).toBe(1000);

      const startTime = performance.now();
      const result = encrypt(plaintext, codebook);
      const duration = performance.now() - startTime;

      expect(result.details).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该处理1000字文本解密', () => {
      const plaintext = '天地玄黄'.repeat(250);
      const encrypted = encrypt(plaintext, codebook);

      const startTime = performance.now();
      const decrypted = decrypt(encrypted.ciphertext, codebook);
      const duration = performance.now() - startTime;

      expect(decrypted).toBe(plaintext);
      expect(duration).toBeLessThan(1000);
    });

    it('应该处理单字符重复长文本', () => {
      const plaintext = '天'.repeat(500);
      const encrypted = encrypt(plaintext, codebook);
      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该处理混合内容长文本', () => {
      const plaintext = 'Hello天地2024'.repeat(100);
      const encrypted = encrypt(plaintext, codebook);
      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('密文格式边界测试', () => {
    it('应该处理带多余连字符的密文', () => {
      const decrypted = decrypt('1234567--2345678', codebook);
      expect(typeof decrypted).toBe('string');
    });

    it('应该处理带空格的密文', () => {
      const decrypted = decrypt('1234567 - 2345678', codebook);
      expect(typeof decrypted).toBe('string');
    });

    it('应该处理5位数字密文（无法解密）', () => {
      const result = decryptChar('12345', codebook, 0);
      expect(result).toBeNull();
    });

    it('应该处理8位数字密文（无法解密）', () => {
      const result = decryptChar('12345678', codebook, 0);
      expect(result).toBeNull();
    });

    it('应该处理非数字密文（其他符号）', () => {
      const result = decryptChar('!', codebook, 0);
      expect(result).toBe('!');
    });

    it('应该验证7位数字密文格式（中文）', () => {
      expect(isValidCiphertext('1234567')).toBe(true);
      expect(isValidCiphertext('0000000')).toBe(true);
      expect(isValidCiphertext('9999999')).toBe(true);
    });

    it('应该验证数字密文格式（以7开头）', () => {
      expect(isValidCiphertext('7000000')).toBe(true);
      expect(isValidCiphertext('7999999')).toBe(true);
      expect(isValidCiphertext('7000000-7999999')).toBe(true);
    });

    it('应该验证字母密文格式（以8开头）', () => {
      expect(isValidCiphertext('8000000')).toBe(true);
      expect(isValidCiphertext('8999999')).toBe(true);
      expect(isValidCiphertext('8000000-8999999')).toBe(true);
    });

    it('应该拒绝无效密文格式', () => {
      expect(isValidCiphertext('12345')).toBe(false); // 5位
      expect(isValidCiphertext('12345678')).toBe(false); // 8位
      expect(isValidCiphertext('abc123')).toBe(false);
      expect(isValidCiphertext('12-34-56')).toBe(false);
    });
  });

  describe('密码本边界测试', () => {
    it('应该处理最后一页的字符', () => {
      const lastPage = codebook.pages[codebook.pages.length - 1];
      const lastChar = lastPage.characters[lastPage.characters.length - 1];

      if (lastChar) {
        const clearCode = encodeToClearCode(lastChar, codebook);
        expect(clearCode).not.toBeNull();

        const encrypted = encrypt(lastChar, codebook);
        expect(encrypted.details).toHaveLength(1);

        const decrypted = decrypt(encrypted.ciphertext, codebook);
        expect(decrypted).toBe(lastChar);
      }
    });

    it('应该处理第一页第一行第一列的字符', () => {
      const firstChar = codebook.pages[0].characters[0];
      const clearCode = encodeToClearCode(firstChar, codebook);
      expect(clearCode).toBe('0010000'); // 3位页码+2位行+2位列
    });

    it('应该处理页码边界', () => {
      // 页码001
      const page1Char = codebook.pages[0].characters[0];
      const code1 = encodeToClearCode(page1Char, codebook);
      expect(code1?.slice(0, 3)).toBe('001');

      // 如果存在第10页，验证页码010
      if (codebook.pages.length >= 10) {
        const page10Char = codebook.pages[9].characters[0];
        const code10 = encodeToClearCode(page10Char, codebook);
        expect(code10?.slice(0, 3)).toBe('010');
      }
    });

    it('应该拒绝无效密码本', () => {
      expect(() => encrypt('天地', { name: '', version: '', totalPages: 0, pages: [] }))
        .toThrow(CipherError);
    });

    it('应该拒绝空页数组密码本', () => {
      const invalidCodebook = {
        name: 'test',
        version: '1.0',
        totalPages: 0,
        pages: []
      };
      expect(() => encrypt('天地', invalidCodebook as Codebook))
        .toThrow(CipherError);
    });
  });

  describe('乱数生成边界测试', () => {
    it('应该处理最小种子值', () => {
      const random = generateRandom(1, 100000, 0);
      expect(random).toBeGreaterThanOrEqual(0);
      expect(random).toBeLessThan(10000000);
    });

    it('应该处理最大种子值', () => {
      const random = generateRandom(999, 999999, 999);
      expect(random).toBeGreaterThanOrEqual(0);
      expect(random).toBeLessThan(10000000);
    });

    it('应该处理页码边界', () => {
      const random1 = generateRandom(1, 123456, 0);
      const random999 = generateRandom(999, 123456, 0);

      expect(random1).toBeGreaterThanOrEqual(0);
      expect(random1).toBeLessThan(10000000);
      expect(random999).toBeGreaterThanOrEqual(0);
      expect(random999).toBeLessThan(10000000);
    });

    it('应该处理位置边界', () => {
      const random0 = generateRandom(1, 123456, 0);
      const random999 = generateRandom(1, 123456, 999);

      expect(random0).toBeGreaterThanOrEqual(0);
      expect(random0).toBeLessThan(10000000);
      expect(random999).toBeGreaterThanOrEqual(0);
      expect(random999).toBeLessThan(10000000);
    });

    it('应该生成大数量乱数序列', () => {
      const sequence = generateRandomSequence(1, 123456, 10000);
      expect(sequence).toHaveLength(10000);

      for (const random of sequence) {
        expect(random).toBeGreaterThanOrEqual(0);
        expect(random).toBeLessThan(10000000);
      }
    });
  });

  describe('加密解密一致性边界测试', () => {
    it('应该处理重复字符加密', () => {
      const plaintext = '天天天天天';
      const encrypted = encrypt(plaintext, codebook);
      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该处理单字符加密', () => {
      const plaintext = '天';
      const encrypted = encrypt(plaintext, codebook);
      expect(encrypted.details).toHaveLength(1);

      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该处理单数字加密', () => {
      const plaintext = '5';
      const encrypted = encrypt(plaintext, codebook);
      expect(encrypted.details).toHaveLength(1);

      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该处理单字母加密', () => {
      const plaintext = 'A';
      const encrypted = encrypt(plaintext, codebook);
      expect(encrypted.details).toHaveLength(1);

      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该处理双字符加密', () => {
      const plaintext = '天地';
      const encrypted = encrypt(plaintext, codebook);
      expect(encrypted.details).toHaveLength(2);

      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该处理无法解密的无效密文', () => {
      // 使用随机密文，很可能无法解密
      const invalidCiphertext = '0000000-1111111-2222222';
      const decrypted = decrypt(invalidCiphertext, codebook);
      // 应该返回空字符串或部分解密结果，不抛出错误
      expect(typeof decrypted).toBe('string');
    });
  });

  describe('性能边界测试', () => {
    it('应该在100ms内完成100字加密', () => {
      // 使用三国演义前100个不重复汉字
      const plaintext = '三国演义罗贯中是古代第一部长篇章回小说历史的经典之作描写了公元世纪以曹刘备孙权为首魏蜀吴个政治军事集团间矛盾和斗争在广阔社会背景上展示出那时尖锐复杂又极具特色冲突谋略方面对后产生深远影响本书语言动场宏大性鲜明塑造关羽张飞等许多不朽人物形象其文学成就使它实已入到艺术及活滚江东逝水浪花淘尽英雄非败转头空青山依旧几度夕阳红白发渔樵渚惯看秋月春风壶浊酒喜相逢今少都付笑谈调寄临仙宴桃园豪杰结斩黄巾立功话天下势分久必合周末七并于秦灭楚汉朝自高祖蛇而起统来光武兴传至献帝遂推致乱由殆始桓灵二禁锢善类崇信宦官崩即位将窦太傅陈蕃共辅佐有节弄诛机密反所害涓此愈横建宁年四望日御温德殿升座角狂骤只见条从梁蟠椅惊倒左右急救宫百俱奔避须臾忽然雷雨加冰雹落半夜止坏却房屋无数洛地震海泛溢沿居民被卷雌鸡化六朔黑气十余丈虹现玉堂五原岸皆裂种祥端诏问群臣灾异议郎蔡邕疏蜺堕乃妇寺干颇切直览奏叹息因更衣窃视悉宣告他陷罪放归田里让赵忠封谞段珪侯蹇硕程旷夏恽郭胜朋比奸号常侍尊呼阿父心思盗贼蜂巨鹿郡兄弟名宝秀才采药遇老碧眼童颜手执藜杖唤洞授曰平要汝得当普若萌获恶报拜姓吾南华也讫阵清去晓攻习能道正内疫流行散施符病称贤良师徒云游念咒次众万千各渠帅讹苍死岁甲子吉令土字家门幽徐冀荆扬兖豫八州奉遣党马暗赍金帛交应与商难者顺乘取诚可惜私旗约期举唐驰径赴省变召何进兵擒收狱闻知露星申运终圣宜乐裹浩靡火速降处讨卢植皇甫嵩朱儁引精路且前犯界守焉竟陵氏鲁恭王校尉邹靖计我寡招敌随榜募涿县甚好读宽怒素志专身尺寸两耳垂肩双过膝目顾如冠唇涂脂阁玄昔贞亭坐酎失遗这枝弘曾孝廉亦尝吏早丧幼孤母贫贩屦织席业住楼桑村树遥车盖贵乡儿戏叔奇资给郑瓒友矣慨厉声夫力故豹环燕颔虎貌某翼庄卖屠猪恰室宗亲倡欲破安恨财勇同店饮着辆歇便保快斟吃待赶城投九髯重枣丹凤卧蚕眉威凛邀叩改河解倚凌杀逃湖己开盛祭协图齐乌牛礼项焚香再誓虽既则困扶危黎庶求愿鉴忘恩戮毕罢宰设聚士痛醉拾器但匹虑客伙伴佑迎接苏每往北近寇请置管诉意送赠银镔铁斤用谢别命匠打股剑龙偃刀冷艳锯点钢全铠参通派认侄欣领披抹额鞭骂逆副邓茂战挺刺窝翻折拍舞纵措挥诗赞颖试兮初把标戈走追赏劳龚牒围乞赐援混退寨谓伏鸣鼓噪岭摩夹溃率助剿筹决算神还逊伟绩鼎穷犒帐留听拒未负颍川垒探消捕利草营束埋击焰慌鞍残夺彪截闪细骑沛谯操孟腾养冒瞒猎歌荡责诈状恙乎爱罔恣桥济君顒亡劭答除任棒提巡拿外莫敢顿丘步值拦级幡脱袭喊烛乏簇护槛囚缘妖廷差丰体索贿赂粮尚缺钱承挟惰慢董卓京论岂拥逮冈漫塞野职轻血厮情犹谁识督邮舅竖仲陇西洮骄傲怠擅甘离稍连厚跟曲屯先锋搦麾仗法似限忙彼羊狗候坡泼拨秽准摇擂际砂石驱炮纸纷坠荒箭臂带坚捷屡棺尸枭牧表班催促严韩烧劫仇据宛抵恐弃掩定断纳耶主附劝惟容掠策桶况撤独恋果射暂熊腰富台塘赃奋叫指荐稽昌司韶臧旻盐渎丞盱眙邳诸旅淮泗登槊弓尹郁街闲钧鬻爵悬郊布欺逐怨教铨注微理晚府克署毫感食桌寝床稠倦凡沙汰疑适馆驿阶喝虚滥污喏勒番免役阻肯杯闷哭逼苦遭睁圆咬碎牙挡厅绑么揪扯桩缚攀柳腿喧闹观仁慈傍边仅侮辱枳棘丛栖鸾印绶挂颈姑饶缴捉恢匿题握互列嗟区纯雪片藏谏陶恸旦陛阉侵祸跪朕怜休刑勿耽受毁谤躬肉敬稷摧撞牵假虞征巢挫凶暴卒缢赦迁整笃妹辩宠幸美嫉妒鸩苌妻继偏绝患潘隐宅质滋蔓倘族详叱辈踌躇赛秘矫册借新扫袁隗绍隶林荀攸泰员柩阴娘悯忧旨寒享妄根录抬孩僚腹帘掌骠预酣捧吕口辄敕沽竞系藩妃仍刎哀废珠玩构苗遮蔽庭葬托殃俊务伐顷尔庙没唯允奈妙檄镇薄琳俗雀骧洪炉燎毛霆阙怀持柄懦易侧宵智丁馈李肃足料鳌凉显陆续婿陕傕汜樊儒味汤沸薪痈毒钟豺狼狠渑池按斧嘉诣骨齑粉谕簿泄防测选琐懿昂疾荣效寻闭砍倾墙掷胁宥匡翠剁泥擐窗跳属误摄觅烟邙掾闵贡饥馁挤怕觉吞莽爬满萤芒照耀渐堆畔院梦户崔烈毅偶瘦杨淳琼鲍驾另换谣谶旌尘绣栗向抚慰检玺市惶忌惮诱迟排筵遍卿惧停静仪弱聪案嫡篡掣佩宇轩画戟否伊桐邑霍强拔彭伯怖跃潜顶袍猊狮蛮炭哉凭烂舌拱贲赤兔词颗揖渡履浑般尾蹄嘶咆哮单埃紫雾丝缰辔驹甜擎孰钦囊禽择木悔罚慕沈吟真秉旱锦畅越鄠卫农践辞恕毖伍忿购渤嗣佻恪彰忝永惑纲毋懋规矩戚邪誉兹服悲惨愤溅简委墟括贺锁基趋福擢徵泪嫩绿凝袅陌羡呈弑女融寿短练妾存潸颓姬茕抱俄延撺绞灌淫宿男装载轸孚瑜伺抠瞪盈剖剐堪忍跋扈贱屈舍酌祝诞叙想奄骁禄沥羸拣忖胖耐仰镜遽嵌饰递鞘寓紧窜牟覆熟沉晌讳监审究鸿鹄屏觑兽释盘费皋奢最榻樽匆驴磨搜厨鞒瓶携菜款憎默敲喂饱睡插句齿骈谦曼惇婴枪渊壮娴办盟达谨戾充积拯馥孔伷岱邈乔瑁超祁蒙卑裔筑层帜旄钺坛衅虐沦纠渝俾育歃慷涕较律遵违总挑险禀芥枕割猿胡岑抄垠脊零辽支帻锭鬃咽喉矢或猛餐价躲拽鹊戴盔柱劈扎伤胄叉竿俞涉著丑量酾热振塌岳撼铃乾坤辕冬盏俺哥牢玲珑悦境些队飐穆锤腕奴抖擞斜灯呆架隔拖炎魂夸躯砌鳞簪雉错踏荧煌胆踊线电恼灿霜鹦鹉蛱蝶鬼嚎绕迷杆销彩绒绦飘伞移隙谗配夷你鼠斯旺悟衰捐察琬瓦砾兼播崤函砖爽骚籍赀押沟壑啼刃焦掘坟冢缎铺犬疲益荥坞旁遏摆徙脚昼锅饭搭膊踅创祀辉垣井捞样匣启镌纽镶篆卞凰工琢狩舟漏偷烦津酸固敖仓轘谷制驻析耻翔麟范滂博昱康檀敷俭咥蒯襄邻垓怎磐跨亏唾谌辛评耿鼻譬乳哺饿沮懊冤健捻扒浓颐欠辖羌弩麴圈辰巳牌呐搴呵兜鍪扑透狈输磾仆岐讲曩洒睦叵船翊弼季朗霸怯弦削脑袋泊柔拙壕毙岘娶吹兆旋趱昏拴锣浆迸扛泣贮殒巧僭晃璜郿库珍凿睛煮慄箸畏荼蘼牡吁窥伎貂蝉佳伸肺腑训优愁泉涌累卵嫁谍肴馔迓殷勤妆佯央靠哩妨频波趁帏幔午巍觞舜尧禹勋供坊栊笙簧缭昭彻莲稳暖黛脸肠榆买丽唱板低讴樱绛喷吐衠惠浅毡襟怪昨奁音耗梳蹙做态拭怏染朦胧恍惚记栏拂箕帚诀荷愉闺羞惭搂偎抢肥胸膛贾诩缨蒋壁噬慎裙凯缓晤跌挽述迈惹芳笔臭诺瑞痊禅罩颤欢轮辇卜晨谒掖衷衢脐膏蓄绮皿庆骇黥刖赎辜喈逸佞讪肆葛隆洗挠激填苟努馗胪奂颀徘徊弥亘霄魄魁赚衔品皮雕凑椁霹雳晴邵盩厔峻忻联骏搠舒隘僮阑吓俯彧绲访陋聘晔虔邱玠韦涧梧骋岌袄瑯琊闿僧廊湿们勉辎厕阖循鄄摘剜墓穿缟濮朐糜竺搬楷阜宙膺阍炜宾亥米倍添莱粟修拈札鄙谊敛繇酬替掎潮衙豁愕扰拆孽踞讥讽竭庞亟颠枯瞑葺赖滕薛兰雁郝宋宪梆劲穗纬吊赢壳轰巷柴胯肢蝗虫禾稻斛诲祐幕奠狐硬陂坑钩褚耕掳贽麦堤诡竹滨忒压瞋叶陪劣嫌狭需讶粪汁暹嫔獭殄馑兢瓯肝剩茫黍苞戒维腐琦撄袖映巫郦抗羿恃敦涣贪饵祈祷銮舆揭哄骅骝跸煨膳刚抛啸渭件疆绳绢包缆粗粝茅篱触殴医刻锥莩轵芜蒿剥砀雅凋怬晋慓哙腴淡觐爪鸟介殊厌艾艰扮罕喟碍挞编占逞帮觥该唬澄醒绰眷嫂缝麋庐泾鄣衡姿瑾昆谐纮邸滩奕洋笮栅渗逶迤松秣丢霎疮辑谙芦苇绊蠢恤颂枫阊裨钉杭姚浙鏖查燃隅胀佗鹤蕤芬蛟淯胤抽稚拉稀筋翅愧笄媒姻婚例俟渺诰络妓瞻兀熬虏堑枷秩鹰飏璋纣冯沂琅碣浚媚叛瓜孺贝垕吝伪损猖獗刈鸠块拟戕悚懔貔貅梯凳啖锹钁划遁验暮繁浸润淆愚谀嗤夙雍肘途萧豨盍旬戎绵褒戌缠眭淹减槽酿憩捆儆狻恫侣笥蛔倨鹕砥栋材滔枉墀谱漳胶泽仕诬彦劾肱狝攘逍鈚弯扣剔完衬像酂聊仔踪迹碾缀伦寐底幅茶证嚼鸳鹭序潢夤浇韬晦圃梅渴俎漠涛叨庇藉碌匙迅嵫谑觳灰笕惺拊骸愦萸魃恚朴劬栉笼网鱼羁考裁侈暑庖蜜呕璆瓮辨跑穴婢忤愬弊廪增楫缮迫臻饕餮匄璧货赘犭票狡瑕谘衄补奖谄孥咎彷徨蹈返旆警匪遑局钳眦睚含杜梓柏裸摸隳桀苛科罾蹊阱酷诘绪缩厥螳螂隧漯焫蓬沧沃咸徂弛畿拘勖哲汗郃阄躁担偿豕虾祢黜乂畴咨熙睿纂厄昃淑亮跞睹奥诵鸷鹗坌粹騕褐赋铸糟版挝裤尼胥蜾呀洲俦柯髓扭罐煎拷唆针淋漓孕贬娩憔悴疥谭廨邺钓馀捱卸俸赡妥谅缉绫皂纱畜森械獬豸悠剽颊翩哨辟缄缔楮廖坦冗迭净讯蒲歹钵模滑琪撑翰墨甥沱烘焙踢肖翁裴肋虬镫吼拼偕杳歆靶湄疗氅煽厘缧绁瑟帕沐浴霖喨溪勃斫麻禳'.slice(0, 100);

      const startTime = performance.now();
      encrypt(plaintext, codebook);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('应该在100ms内完成100字解密', () => {
      // 使用三国演义前100个不重复汉字
      const plaintext = '三国演义罗贯中是古代第一部长篇章回小说历史的经典之作描写了公元世纪以曹刘备孙权为首魏蜀吴个政治军事集团间矛盾和斗争在广阔社会背景上展示出那时尖锐复杂又极具特色冲突谋略方面对后产生深远影响本书语言动场宏大性鲜明塑造关羽张飞等许多不朽人物形象其文学成就使它实已入到艺术及活滚江东逝水浪花淘尽英雄非败转头空青山依旧几度夕阳红白发渔樵渚惯看秋月春风壶浊酒喜相逢今少都付笑谈调寄临仙宴桃园豪杰结斩黄巾立功话天下势分久必合周末七并于秦灭楚汉朝自高祖蛇而起统来光武兴传至献帝遂推致乱由殆始桓灵二禁锢善类崇信宦官崩即位将窦太傅陈蕃共辅佐有节弄诛机密反所害涓此愈横建宁年四望日御温德殿升座角狂骤只见条从梁蟠椅惊倒左右急救宫百俱奔避须臾忽然雷雨加冰雹落半夜止坏却房屋无数洛地震海泛溢沿居民被卷雌鸡化六朔黑气十余丈虹现玉堂五原岸皆裂种祥端诏问群臣灾异议郎蔡邕疏蜺堕乃妇寺干颇切直览奏叹息因更衣窃视悉宣告他陷罪放归田里让赵忠封谞段珪侯蹇硕程旷夏恽郭胜朋比奸号常侍尊呼阿父心思盗贼蜂巨鹿郡兄弟名宝秀才采药遇老碧眼童颜手执藜杖唤洞授曰平要汝得当普若萌获恶报拜姓吾南华也讫阵清去晓攻习能道正内疫流行散施符病称贤良师徒云游念咒次众万千各渠帅讹苍死岁甲子吉令土字家门幽徐冀荆扬兖豫八州奉遣党马暗赍金帛交应与商难者顺乘取诚可惜私旗约期举唐驰径赴省变召何进兵擒收狱闻知露星申运终圣宜乐裹浩靡火速降处讨卢植皇甫嵩朱儁引精路且前犯界守焉竟陵氏鲁恭王校尉邹靖计我寡招敌随榜募涿县甚好读宽怒素志专身尺寸两耳垂肩双过膝目顾如冠唇涂脂阁玄昔贞亭坐酎失遗这枝弘曾孝廉亦尝吏早丧幼孤母贫贩屦织席业住楼桑村树遥车盖贵乡儿戏叔奇资给郑瓒友矣慨厉声夫力故豹环燕颔虎貌某翼庄卖屠猪恰室宗亲倡欲破安恨财勇同店饮着辆歇便保快斟吃待赶城投九髯重枣丹凤卧蚕眉威凛邀叩改河解倚凌杀逃湖己开盛祭协图齐乌牛礼项焚香再誓虽既则困扶危黎庶求愿鉴忘恩戮毕罢宰设聚士痛醉拾器但匹虑客伙伴佑迎接苏每往北近寇请置管诉意送赠银镔铁斤用谢别命匠打股剑龙偃刀冷艳锯点钢全铠参通派认侄欣领披抹额鞭骂逆副邓茂战挺刺窝翻折拍舞纵措挥诗赞颖试兮初把标戈走追赏劳龚牒围乞赐援混退寨谓伏鸣鼓噪岭摩夹溃率助剿筹决算神还逊伟绩鼎穷犒帐留听拒未负颍川垒探消捕利草营束埋击焰慌鞍残夺彪截闪细骑沛谯操孟腾养冒瞒猎歌荡责诈状恙乎爱罔恣桥济君顒亡劭答除任棒提巡拿外莫敢顿丘步值拦级幡脱袭喊烛乏簇护槛囚缘妖廷差丰体索贿赂粮尚缺钱承挟惰慢董卓京论岂拥逮冈漫塞野职轻血厮情犹谁识督邮舅竖仲陇西洮骄傲怠擅甘离稍连厚跟曲屯先锋搦麾仗法似限忙彼羊狗候坡泼拨秽准摇擂际砂石驱炮纸纷坠荒箭臂带坚捷屡棺尸枭牧表班催促严韩烧劫仇据宛抵恐弃掩定断纳耶主附劝惟容掠策桶况撤独恋果射暂熊腰富台塘赃奋叫指荐稽昌司韶臧旻盐渎丞盱眙邳诸旅淮泗登槊弓尹郁街闲钧鬻爵悬郊布欺逐怨教铨注微理晚府克署毫感食桌寝床稠倦凡沙汰疑适馆驿阶喝虚滥污喏勒番免役阻肯杯闷哭逼苦遭睁圆咬碎牙挡厅绑么揪扯桩缚攀柳腿喧闹观仁慈傍边仅侮辱枳棘丛栖鸾印绶挂颈姑饶缴捉恢匿题握互列嗟区纯雪片藏谏陶恸旦陛阉侵祸跪朕怜休刑勿耽受毁谤躬肉敬稷摧撞牵假虞征巢挫凶暴卒缢赦迁整笃妹辩宠幸美嫉妒鸩苌妻继偏绝患潘隐宅质滋蔓倘族详叱辈踌躇赛秘矫册借新扫袁隗绍隶林荀攸泰员柩阴娘悯忧旨寒享妄根录抬孩僚腹帘掌骠预酣捧吕口辄敕沽竞系藩妃仍刎哀废珠玩构苗遮蔽庭葬托殃俊务伐顷尔庙没唯允奈妙檄镇薄琳俗雀骧洪炉燎毛霆阙怀持柄懦易侧宵智丁馈李肃足料鳌凉显陆续婿陕傕汜樊儒味汤沸薪痈毒钟豺狼狠渑池按斧嘉诣骨齑粉谕簿泄防测选琐懿昂疾荣效寻闭砍倾墙掷胁宥匡翠剁泥擐窗跳属误摄觅烟邙掾闵贡饥馁挤怕觉吞莽爬满萤芒照耀渐堆畔院梦户崔烈毅偶瘦杨淳琼鲍驾另换谣谶旌尘绣栗向抚慰检玺市惶忌惮诱迟排筵遍卿惧停静仪弱聪案嫡篡掣佩宇轩画戟否伊桐邑霍强拔彭伯怖跃潜顶袍猊狮蛮炭哉凭烂舌拱贲赤兔词颗揖渡履浑般尾蹄嘶咆哮单埃紫雾丝缰辔驹甜擎孰钦囊禽择木悔罚慕沈吟真秉旱锦畅越鄠卫农践辞恕毖伍忿购渤嗣佻恪彰忝永惑纲毋懋规矩戚邪誉兹服悲惨愤溅简委墟括贺锁基趋福擢徵泪嫩绿凝袅陌羡呈弑女融寿短练妾存潸颓姬茕抱俄延撺绞灌淫宿男装载轸孚瑜伺抠瞪盈剖剐堪忍跋扈贱屈舍酌祝诞叙想奄骁禄沥羸拣忖胖耐仰镜遽嵌饰递鞘寓紧窜牟覆熟沉晌讳监审究鸿鹄屏觑兽释盘费皋奢最榻樽匆驴磨搜厨鞒瓶携菜款憎默敲喂饱睡插句齿骈谦曼惇婴枪渊壮娴办盟达谨戾充积拯馥孔伷岱邈乔瑁超祁蒙卑裔筑层帜旄钺坛衅虐沦纠渝俾育歃慷涕较律遵违总挑险禀芥枕割猿胡岑抄垠脊零辽支帻锭鬃咽喉矢或猛餐价躲拽鹊戴盔柱劈扎伤胄叉竿俞涉著丑量酾热振塌岳撼铃乾坤辕冬盏俺哥牢玲珑悦境些队飐穆锤腕奴抖擞斜灯呆架隔拖炎魂夸躯砌鳞簪雉错踏荧煌胆踊线电恼灿霜鹦鹉蛱蝶鬼嚎绕迷杆销彩绒绦飘伞移隙谗配夷你鼠斯旺悟衰捐察琬瓦砾兼播崤函砖爽骚籍赀押沟壑啼刃焦掘坟冢缎铺犬疲益荥坞旁遏摆徙脚昼锅饭搭膊踅创祀辉垣井捞样匣启镌纽镶篆卞凰工琢狩舟漏偷烦津酸固敖仓轘谷制驻析耻翔麟范滂博昱康檀敷俭咥蒯襄邻垓怎磐跨亏唾谌辛评耿鼻譬乳哺饿沮懊冤健捻扒浓颐欠辖羌弩麴圈辰巳牌呐搴呵兜鍪扑透狈输磾仆岐讲曩洒睦叵船翊弼季朗霸怯弦削脑袋泊柔拙壕毙岘娶吹兆旋趱昏拴锣浆迸扛泣贮殒巧僭晃璜郿库珍凿睛煮慄箸畏荼蘼牡吁窥伎貂蝉佳伸肺腑训优愁泉涌累卵嫁谍肴馔迓殷勤妆佯央靠哩妨频波趁帏幔午巍觞舜尧禹勋供坊栊笙簧缭昭彻莲稳暖黛脸肠榆买丽唱板低讴樱绛喷吐衠惠浅毡襟怪昨奁音耗梳蹙做态拭怏染朦胧恍惚记栏拂箕帚诀荷愉闺羞惭搂偎抢肥胸膛贾诩缨蒋壁噬慎裙凯缓晤跌挽述迈惹芳笔臭诺瑞痊禅罩颤欢轮辇卜晨谒掖衷衢脐膏蓄绮皿庆骇黥刖赎辜喈逸佞讪肆葛隆洗挠激填苟努馗胪奂颀徘徊弥亘霄魄魁赚衔品皮雕凑椁霹雳晴邵盩厔峻忻联骏搠舒隘僮阑吓俯彧绲访陋聘晔虔邱玠韦涧梧骋岌袄瑯琊闿僧廊湿们勉辎厕阖循鄄摘剜墓穿缟濮朐糜竺搬楷阜宙膺阍炜宾亥米倍添莱粟修拈札鄙谊敛繇酬替掎潮衙豁愕扰拆孽踞讥讽竭庞亟颠枯瞑葺赖滕薛兰雁郝宋宪梆劲穗纬吊赢壳轰巷柴胯肢蝗虫禾稻斛诲祐幕奠狐硬陂坑钩褚耕掳贽麦堤诡竹滨忒压瞋叶陪劣嫌狭需讶粪汁暹嫔獭殄馑兢瓯肝剩茫黍苞戒维腐琦撄袖映巫郦抗羿恃敦涣贪饵祈祷銮舆揭哄骅骝跸煨膳刚抛啸渭件疆绳绢包缆粗粝茅篱触殴医刻锥莩轵芜蒿剥砀雅凋怬晋慓哙腴淡觐爪鸟介殊厌艾艰扮罕喟碍挞编占逞帮觥该唬澄醒绰眷嫂缝麋庐泾鄣衡姿瑾昆谐纮邸滩奕洋笮栅渗逶迤松秣丢霎疮辑谙芦苇绊蠢恤颂枫阊裨钉杭姚浙鏖查燃隅胀佗鹤蕤芬蛟淯胤抽稚拉稀筋翅愧笄媒姻婚例俟渺诰络妓瞻兀熬虏堑枷秩鹰飏璋纣冯沂琅碣浚媚叛瓜孺贝垕吝伪损猖獗刈鸠块拟戕悚懔貔貅梯凳啖锹钁划遁验暮繁浸润淆愚谀嗤夙雍肘途萧豨盍旬戎绵褒戌缠眭淹减槽酿憩捆儆狻恫侣笥蛔倨鹕砥栋材滔枉墀谱漳胶泽仕诬彦劾肱狝攘逍鈚弯扣剔完衬像酂聊仔踪迹碾缀伦寐底幅茶证嚼鸳鹭序潢夤浇韬晦圃梅渴俎漠涛叨庇藉碌匙迅嵫谑觳灰笕惺拊骸愦萸魃恚朴劬栉笼网鱼羁考裁侈暑庖蜜呕璆瓮辨跑穴婢忤愬弊廪增楫缮迫臻饕餮匄璧货赘犭票狡瑕谘衄补奖谄孥咎彷徨蹈返旆警匪遑局钳眦睚含杜梓柏裸摸隳桀苛科罾蹊阱酷诘绪缩厥螳螂隧漯焫蓬沧沃咸徂弛畿拘勖哲汗郃阄躁担偿豕虾祢黜乂畴咨熙睿纂厄昃淑亮跞睹奥诵鸷鹗坌粹騕褐赋铸糟版挝裤尼胥蜾呀洲俦柯髓扭罐煎拷唆针淋漓孕贬娩憔悴疥谭廨邺钓馀捱卸俸赡妥谅缉绫皂纱畜森械獬豸悠剽颊翩哨辟缄缔楮廖坦冗迭净讯蒲歹钵模滑琪撑翰墨甥沱烘焙踢肖翁裴肋虬镫吼拼偕杳歆靶湄疗氅煽厘缧绁瑟帕沐浴霖喨溪勃斫麻禳'.slice(0, 100);
      const encrypted = encrypt(plaintext, codebook);

      const startTime = performance.now();
      decrypt(encrypted.ciphertext, codebook);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });
});
