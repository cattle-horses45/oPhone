"""80+ oPhone 产品批量插入 + AI知识库"""
import asyncio
from app.database import init_db, async_session_factory
from app.models.product import Product, SKU, Category
from app.models.knowledge import KnowledgeItem
from sqlalchemy import select, func


PRODUCTS = {
    "手机": [
        # 6 款已有 (ids 1-6大概)，追加 10 款新机型
        ("oPhone X30 Ultra+", "ophone-x30-ultra-plus", "年度旗舰升级款。6.8英寸2K+ LTPO屏，第二代2亿像素主摄，骁龙8 Elite芯片，5500mAh+120W快充。IP68防水。"),
        ("oPhone X30 Lite", "ophone-x30-lite", "轻薄影像中端。6.55英寸120Hz AMOLED，6400万OIS主摄，4500mAh+67W快充，7.9mm超薄机身。"),
        ("oPhone S20", "ophone-s20", "入门旗舰体验。6.5英寸90Hz OLED，5000万主摄，4800mAh+44W快充。性价比标杆。"),
        ("oPhone S20 Ultra", "ophone-s20-ultra", "大屏续航王。6.8英寸120Hz屏，6000mAh电池，1亿像素主摄，适合重度用户。"),
        ("oPhone Fold 2", "ophone-fold-2", "折叠旗舰第二代。8英寸内屏+6.5英寸外屏，UTG玻璃，铰链寿命40万次。329g轻量化。"),
        ("oPhone Flip 2", "ophone-flip-2", "竖折时尚旗舰。6.8英寸折叠内屏，3.4英寸外屏。5000万主摄+超广角。小巧便携。"),
        ("oPhone Note 20", "ophone-note-20", "商务大屏旗舰。7.1英寸2K屏，S Pen内置，6500mAh超大电池。12GB+512GB。"),
        ("oPhone C50", "ophone-c50", "5G普及先锋。6.6英寸FHD+ LCD，天玑7200，5000万双摄，5000mAh+33W快充。千元价位。"),
        ("oPhone C50 Pro", "ophone-c50-pro", "千元影像王。6.7英寸AMOLED，1亿像素主摄，5000mAh+67W快充。同价位领先。"),
        ("oPhone GT Neo", "ophone-gt-neo", "电竞性能机。6.74英寸144Hz直屏，天玑9300，120W超级闪充，VC均热板散热。"),
    ],
    "平板": [
        # 4 款已有，追加 12 款新
        ("oPhone Pad 11", "ophone-pad-11", "均衡影音平板。11英寸2.5K 120Hz屏，四扬声器杜比全景声，8000mAh+33W快充。"),
        ("oPhone Pad 11 Pro", "ophone-pad-11-pro", "专业创作平板。11英寸OLED屏，oCore M2芯片，4096级压感触控笔。雷电4接口。"),
        ("oPhone Pad 8.4", "ophone-pad-84", "便携口袋平板。8.4英寸FHD+屏，340g轻薄，5000mAh。适合阅读和轻度娱乐。"),
        ("oPhone Pad Flex", "ophone-pad-flex", "柔性折叠平板。折叠后7英寸手机尺寸，展开12英寸。OLED面板，适合移动办公。"),
        ("oPhone Pad 13", "ophone-pad-13", "桌面级巨屏平板。13.3英寸3K LCD，键盘盖+触控板套装。12GB+512GB。学生的笔记本替代品。"),
        ("oPhone Pad SE 2", "ophone-pad-se-2", "入门学习平板升级版。10.5英寸护眼屏，升级A14芯片，学生模式+家长控制。"),
        ("oPhone Pad 12 Artist", "ophone-pad-12-artist", "画师专属。12.4英寸4K Mini-LED，P3广色域，低延迟触控笔。预装专业绘图软件。"),
        ("oPhone Pad 10 Go", "ophone-pad-10-go", "户外耐用平板。10.1英寸阳光屏，IP68防水防尘，10000mAh。户外工作者首选。"),
        ("oPhone Pad 9 Lite", "ophone-pad-9-lite", "极致轻薄。9英寸FHD+，6.2mm/295g，金属一体机身。适合随身携带。"),
        ("oPhone Pad Gaming", "ophone-pad-gaming", "游戏平板。12英寸144Hz LCD，骁龙8 Elite，12000mAh+100W快充，双X轴线性马达。"),
        ("oPhone Pad 14 Max", "ophone-pad-14-max", "桌面创作中心。14.6英寸3K 120Hz触控屏，oCore M3 Pro芯片，16GB+1TB。可外接双显示器。"),
        ("oPhone Pad 10E", "ophone-pad-10e", "超值影音板。10.4英寸2K屏，6000mAh。学生网课+追剧首选，千元价位。"),
    ],
    "手表": [
        # 2 款已有，追加 14 款新
        ("oPhone Watch 3 SE", "ophone-watch-3-se", "入门智能手表。1.78英寸AMOLED，心率血氧监测，50+运动模式，14天续航。"),
        ("oPhone Watch 3 Lite", "ophone-watch-3-lite", "轻智能手表。1.5英寸LCD常亮屏，基础健康监测，30天超长续航。学生手表首选。"),
        ("oPhone Watch 3 Max", "ophone-watch-3-max", "户外旗舰手表。1.92英寸蓝宝石屏，钛合金表壳，双频GPS，100米防水。探险家装备。"),
        ("oPhone Watch Sport", "ophone-watch-sport", "运动手表。1.8英寸AMOLED，内置GPS，跑步骑行游泳100+模式，20天续航。"),
        ("oPhone Watch Classic", "ophone-watch-classic", "经典商务款。圆形1.4英寸AMOLED，真皮表带+不锈钢表壳，AOD常亮。优雅内敛。"),
        ("oPhone Watch Band", "ophone-watch-band", "智能手环。1.1英寸OLED，轻薄无感佩戴，心率血氧睡眠，14天续航。入门健康伴侣。"),
        ("oPhone Watch Band Pro", "ophone-watch-band-pro", "专业手环。1.47英寸AMOLED，独立GPS，血氧+体温监测，20天续航。跑步专用。"),
        ("oPhone Watch Kids", "ophone-watch-kids", "儿童手表。1.4英寸屏，GPS定位+电子围栏，视频通话，上课禁用。家长放心。"),
        ("oPhone Watch Elite", "ophone-watch-elite", "机械智能融合。1.5英寸圆形AMOLED，瑞士机芯，钛合金表壳+陶瓷表圈。商务精英之选。"),
        ("oPhone Watch Diver", "ophone-watch-diver", "潜水手表。1.6英寸圆形屏，200米防水，潜水电脑+指南针+深度计。水肺潜水认证。"),
        ("oPhone Watch Runner", "ophone-watch-runner", "跑步教练手表。1.4英寸圆形半透屏，进阶跑步动态，训练负荷+恢复时间。马拉松训练搭档。"),
        ("oPhone Watch Health", "ophone-watch-health", "健康监测手表。1.6英寸AMOLED，ECG+血压+血氧+体温+HRV，跌倒检测+紧急SOS。老人关爱款。"),
        ("oPhone Watch Golf", "ophone-watch-golf", "高尔夫手表。1.5英寸圆形屏，预装4万+球场地图，挥杆分析+坡度补偿。果岭指南针。"),
        ("oPhone Watch EDC", "ophone-watch-edc", "日常通勤手表。1.7英寸方形AMOLED，简约设计，NFC门禁+公交，消息提醒。低调实用。"),
    ],
    "耳机": [
        # 3 款已有，追加 13 款新
        ("oPhone Buds 3", "ophone-buds-3", "第三代真无线。自适应降噪3.0，空间音频头部追踪HD，续航10h+40h。IP57防水。"),
        ("oPhone Buds 3 Pro", "ophone-buds-3-pro", "旗舰降噪。同轴双单元，LDAC无损传输，3麦克风通话降噪，无线充电+Qi反向。"),
        ("oPhone Buds Lite 2", "ophone-buds-lite-2", "超轻半入耳。单耳3.8g，舒适无感佩戴。25h总续航，通话降噪。适合长时间佩戴。"),
        ("oPhone Buds Fit", "ophone-buds-fit", "运动耳机。耳翼式固定设计，IPX6防水防汗，低音增强模式。跑步健身不掉。"),
        ("oPhone Buds Color", "ophone-buds-color", "潮流色彩系列。6种撞色设计，半透明充电仓。音质均衡，24h续航。年轻人的第一款。"),
        ("oPhone Headphones Pro", "ophone-headphones-pro", "头戴式旗舰。45mm镀铍振膜，LDAC+主动降噪，60h续航，蛋白皮耳罩。沉浸式聆听。"),
        ("oPhone Headphones ANC", "ophone-headphones-anc", "头戴降噪。40mm动圈，混合降噪35dB，折叠便携，55h续航。通勤利器。"),
        ("oPhone Headphones Studio", "ophone-headphones-studio", "录音室监听。50mm平面磁驱动，频响5Hz-40kHz，开放式设计。为音频工作者而生。"),
        ("oPhone Buds Kids 2", "ophone-buds-kids-2", "儿童耳机。85dB安全音量限制，软硅胶头梁，无线蓝牙。适合网课+娱乐。"),
        ("oPhone Neckband Pro", "ophone-neckband-pro", "颈挂式运动耳机。磁吸开关，IPX5防水，12mm动圈，18h续航。跑步不掉落。"),
        ("oPhone Buds Sleep", "ophone-buds-sleep", "睡眠耳机。超迷你设计（单耳2.3g），白噪音+遮噪，8h单次续航。助眠专用。"),
        ("oPhone Buds Business", "ophone-buds-business", "商务通话耳机。4麦克风AI降噪，多点连接同时连手机+电脑，USB-C无线适配器。会议专用。"),
        ("oPhone Buds Gaming", "ophone-buds-gaming", "低延迟电竞耳机。蓝牙5.3 + 2.4G双模，45ms超低延迟，RGB灯效充电仓。手游专用。"),
    ],
    "电脑": [
        # 全新 16 款
        ("oPhone Book Pro 16", "ophone-book-pro-16", "旗舰创作本。16英寸3K Mini-LED屏，P3广色域，oCore M3 Pro芯片，32GB+1TB。18h续航。"),
        ("oPhone Book Pro 14", "ophone-book-pro-14", "轻薄旗舰。14英寸2.8K OLED，oCore M3芯片，16GB+512GB，1.2kg。商务精英标配。"),
        ("oPhone Book Air 15", "ophone-book-air-15", "大屏轻薄本。15.6英寸FHD IPS，oCore i7，8GB+512GB，1.5kg。学生+办公全场景。"),
        ("oPhone Book Air 13", "ophone-book-air-13", "极致便携。13.3英寸2K屏，oCore i5，整机980g，12h续航。移动办公首选。"),
        ("oPhone Book Studio 16", "ophone-book-studio-16", "创作者工作站。16英寸4K OLED触控屏，独显RTX 5070，64GB+2TB。视频剪辑+3D渲染。"),
        ("oPhone Book SE 14", "ophone-book-se-14", "入门学习本。14英寸FHD IPS，oCore i3，8GB+256GB。适合网课+文档办公。"),
        ("oPhone Book Gaming 16", "ophone-book-gaming-16", "电竞游戏本。16英寸240Hz 2.5K屏，RTX 5080独显，32GB+1TB。金属机身+RGB键盘。"),
        ("oPhone Book Gaming 14", "ophone-book-gaming-14", "轻薄游戏本。14英寸165Hz 2K屏，RTX 5070独显，16GB+512GB。1.7kg。性能与便携兼得。"),
        ("oPhone Book Flip 14", "ophone-book-flip-14", "翻转触控本。14英寸2K触控屏，360°翻转。支持手写笔。设计师+学生笔记神器。"),
        ("oPhone Book Ultra 17", "ophone-book-ultra-17", "移动工作站。17英寸4K Mini-LED，oCore M3 Ultra，128GB+4TB。设计+科研+AI训练。"),
        ("oPhone Book Dual", "ophone-book-dual", "双屏笔记本。双14英寸2K屏，折叠展开=19英寸工作区。多任务处理专家。"),
        ("oPhone Book Go 12", "ophone-book-go-12", "小巧随身本。12.4英寸FHD+，ARM处理器，850g，20h续航。Always Connected。"),
        ("oPhone Desktop Studio", "ophone-desktop-studio", "创作台式机。oCore M3 Ultra，RTX 5090独显，128GB+4TB。塔式设计。创作者终极方案。"),
        ("oPhone Desktop Mini", "ophone-desktop-mini", "迷你主机。手掌大小，oCore M3芯片，16GB+512GB。双雷电5接口。桌面整洁方案。"),
        ("oPhone Desktop All-in-One 27", "ophone-desktop-aio-27", "一体机。27英寸5K屏，oCore M3 Pro芯片，32GB+1TB。超薄机身+磁吸摄像头。家庭+办公。"),
        ("oPhone Desktop All-in-One 24", "ophone-desktop-aio-24", "一体机。24英寸4K屏，oCore i7，16GB+512GB。教育+办公场景，价格友好。"),
    ],
}

# SKU 规格模板：每款产品 2-3 个 SKU (不同配置/颜色)
SKU_TEMPLATES = {
    "手机": [
        {"sku_name": "8GB+256GB | 深空灰", "sku_code": "{slug}-8-256-gray", "price": 2999, "stock": 200, "specs": {"颜色": "深空灰", "存储": "8GB+256GB"}},
        {"sku_name": "12GB+512GB | 星瀚蓝", "sku_code": "{slug}-12-512-blue", "price": 3999, "stock": 150, "specs": {"颜色": "星瀚蓝", "存储": "12GB+512GB"}},
        {"sku_name": "16GB+1TB | 月影白", "sku_code": "{slug}-16-1tb-white", "price": 4999, "stock": 80, "specs": {"颜色": "月影白", "存储": "16GB+1TB"}},
    ],
    "平板": [
        {"sku_name": "WiFi版 8GB+256GB", "sku_code": "{slug}-wifi-8-256", "price": 3499, "stock": 180, "specs": {"版本": "WiFi", "存储": "8GB+256GB"}},
        {"sku_name": "5G版 12GB+512GB", "sku_code": "{slug}-5g-12-512", "price": 4999, "stock": 100, "specs": {"版本": "5G", "存储": "12GB+512GB"}},
    ],
    "手表": [
        {"sku_name": "运动款 | 硅胶表带", "sku_code": "{slug}-sport-silicone", "price": 1999, "stock": 250, "specs": {"款式": "运动款", "表带": "硅胶"}},
        {"sku_name": "商务款 | 真皮表带", "sku_code": "{slug}-business-leather", "price": 2499, "stock": 180, "specs": {"款式": "商务款", "表带": "真皮"}},
        {"sku_name": "旗舰款 | 不锈钢表带", "sku_code": "{slug}-premium-steel", "price": 3299, "stock": 100, "specs": {"款式": "旗舰款", "表带": "不锈钢"}},
    ],
    "耳机": [
        {"sku_name": "标准版 | 曜石黑", "sku_code": "{slug}-std-black", "price": 899, "stock": 300, "specs": {"版本": "标准版", "颜色": "曜石黑"}},
        {"sku_name": "Pro版 | 陶瓷白", "sku_code": "{slug}-pro-white", "price": 1299, "stock": 220, "specs": {"版本": "Pro版", "颜色": "陶瓷白"}},
    ],
    "电脑": [
        {"sku_name": "16GB+512GB | 星光银", "sku_code": "{slug}-16-512-silver", "price": 6999, "stock": 150, "specs": {"存储": "16GB+512GB", "颜色": "星光银"}},
        {"sku_name": "32GB+1TB | 深空灰", "sku_code": "{slug}-32-1tb-gray", "price": 9999, "stock": 80, "specs": {"存储": "32GB+1TB", "颜色": "深空灰"}},
        {"sku_name": "64GB+2TB | 午夜蓝", "sku_code": "{slug}-64-2tb-blue", "price": 14999, "stock": 40, "specs": {"存储": "64GB+2TB", "颜色": "午夜蓝"}},
    ],
}

# AI 知识库 —— 覆盖所有品类+订单+售后（80产品全覆盖）
KNOWLEDGE_ITEMS = [
    # ============================================================
    # === 手机产品全系列 (10款) ===
    # ============================================================
    ("oPhone 有哪些手机型号？", "oPhone手机产品线共10款：旗舰折叠系列——oPhone X30 Ultra+（影像旗舰）、oPhone Fold 2（大折叠）、oPhone Flip 2（竖折叠）；性能系列——oPhone Note 20（商务大屏）、oPhone GT Neo（电竞）、oPhone S20（入门旗舰）、oPhone S20 Ultra（续航王）；普及系列——oPhone X30 Lite（轻薄中端）、oPhone C50（5G普及）、oPhone C50 Pro（千元影像）。价格从1499元到8999元不等。", "product", "手机,型号,全部,产品线,列表", 10),
    ("oPhone X30 Ultra+ 有什么特点？", "oPhone X30 Ultra+ 是年度影像旗舰：6.8英寸2K+ LTPO屏，第二代2亿像素主摄，骁龙8 Elite芯片，5500mAh+120W快充，IP68防水。支持10倍光学变焦和200倍数字变焦，AI超分算法让远摄更清晰。售价5999-8999元。", "product", "X30,Ultra+,旗舰,变焦,相机,拍照", 10),
    ("oPhone X30 Lite 怎么样？", "oPhone X30 Lite 是轻薄影像中端机：6.55英寸120Hz AMOLED，6400万OIS主摄，4500mAh+67W快充，仅7.9mm超薄机身。适合追求轻薄手感+好拍照的用户。售价2999-3999元。", "product", "X30,Lite,轻薄,中端,拍照", 7),
    ("oPhone S20 和 S20 Ultra 怎么选？", "S20 定位入门旗舰：6.5英寸90Hz OLED，5000万主摄，4800mAh+44W快充，性价比标杆（¥2999起）。S20 Ultra 主打大屏续航：6.8英寸120Hz屏，6000mAh超大电池，1亿像素主摄（¥3999起）。重度用户/长续航需求选 Ultra。", "product", "S20,Ultra,对比,续航,选择", 8),
    ("oPhone Fold 2 折叠屏耐用吗？", "oPhone Fold 2 采用第三代UTG超薄玻璃+水滴铰链，铰链寿命40万次（折合每天100次可用10年），通过SGS折叠认证。8英寸内屏+6.5英寸外屏，329g轻量化设计。日常使用折痕几乎不可见。", "product", "Fold,折叠,铰链,折痕,耐用", 9),
    ("oPhone Flip 2 有什么颜色和配置？", "oPhone Flip 2 是竖折时尚旗舰：6.8英寸折叠内屏+3.4英寸外屏，5000万主摄+超广角，4200mAh双电池，44W有线+15W无线充电。小巧便携，翻盖即用。售价4999-6999元。", "product", "Flip,折叠,颜色,配置,便携", 8),
    ("oPhone Note 20 适合办公吗？", "oPhone Note 20 是商务大屏旗舰：7.1英寸2K屏，内置S Pen（4096级压感/蓝牙遥控/手写转文字），6500mAh超大电池，12GB+512GB。支持分屏多任务和桌面模式，是移动办公利器。售价4999-6999元。", "product", "Note,商务,办公,S Pen,手写笔", 8),
    ("oPhone C50 性价比怎么样？", "oPhone C50 是5G普及先锋：6.6英寸FHD+ LCD，天玑7200处理器，5000万双摄，5000mAh+33W快充。千元价位（¥1499起），适合老人/学生/备用机。C50 Pro 升级AMOLED屏+1亿像素+67W快充，贵约300元。", "product", "C50,性价比,千元,5G,入门", 8),
    ("oPhone GT Neo 打游戏怎么样？", "oPhone GT Neo 是专业电竞手机：6.74英寸144Hz直屏，天玑9300处理器，120W超级闪充，12000mm² VC散热。王者荣耀/和平精英满帧运行不降频。售价2999-4499元。", "product", "GT,电竞,游戏,散热,性能,Neo", 9),

    # ============================================================
    # === 平板产品全系列 (12款) ===
    # ============================================================
    ("oPhone 有哪些平板？", "oPhone Pad产品线共12款：旗舰系列——Pad 14 Max（桌面创作）、Pad 12 Artist（画师）、Pad 11 Pro（专业创作）；主流系列——Pad 13（桌面替代）、Pad 11（均衡影音）、Pad Flex（折叠创新）；便携系列——Pad 8.4（口袋平板）、Pad 9 Lite（极致轻薄）；特色系列——Pad Gaming（电竞）、Pad 10 Go（户外耐用）、Pad SE 2（入门学习）、Pad 10E（超值影音）。价格999元到8999元。", "product", "平板,Pad,全部,型号,产品线", 10),
    ("oPhone Pad 11 Pro 适合画画吗？", "oPhone Pad 11 Pro 是专业创作平板：11英寸OLED屏，oCore M2芯片，4096级压感 oPencil 2 手写笔（磁吸充电），雷电4接口。配合 Procreate/画世界等APP，低延迟书写体验。适合插画师和设计师。", "product", "Pad,Pro,画画,手写笔,创作", 8),
    ("oPhone Pad 12 Artist 有什么特别？", "oPhone Pad 12 Artist 是画师专属平板：12.4英寸4K Mini-LED屏，P3广色域△E<1，低延迟触控笔，预装专业绘图软件。色彩精准度对标专业数位屏。售价5999元起。", "product", "Artist,画师,绘画,Mini-LED,色域", 8),
    ("oPhone Pad 13 能替代笔记本吗？", "oPhone Pad 13 定位桌面级平板：13.3英寸3K LCD屏，搭配键盘盖+触控板套装，12GB+512GB。配合桌面模式可完成80%日常办公任务。适合学生记笔记+轻度办公。售价3499元起。", "product", "Pad,笔记本,替代,桌面,学生", 7),
    ("oPhone Pad 14 Max 有多强？", "oPhone Pad 14 Max 是桌面创作中心：14.6英寸3K 120Hz触控屏，oCore M3 Pro芯片，16GB+1TB。可外接双显示器。适合视频剪辑、3D建模等专业创作。售价7999元起。", "product", "Pad,Max,创作,专业,性能", 8),
    ("oPhone Pad Flex 值得买吗？", "oPhone Pad Flex 是柔性折叠平板：折叠后7英寸手机尺寸（便携），展开12英寸OLED面板（大屏）。10万次折叠寿命。适合既想要小平板便携又想要大屏体验的用户。售价4999元起。", "product", "Flex,折叠,便携,大屏", 7),
    ("oPhone Pad Gaming 游戏性能如何？", "oPhone Pad Gaming 是专业游戏平板：12英寸144Hz LCD，骁龙8 Elite处理器，12000mAh+100W快充，双X轴线性马达。原神/崩坏星穹铁道满帧运行6小时+。售价4499元起。", "product", "Gaming,游戏,电竞,性能,原神", 8),
    ("oPhone Pad SE 2 适合学生用吗？", "oPhone Pad SE 2 是入门学习平板：10.5英寸护眼屏（类纸模式），A14芯片，学生模式+家长控制，支持 oPencil 1 代。适合网课、笔记、阅读。售价1499元起。", "product", "SE,学生,学习,护眼,入门", 8),
    ("oPhone Pad 8.4 和 9 Lite 怎么选？", "Pad 8.4：8.4英寸FHD+便携口袋平板，340g。Pad 9 Lite：9英寸FHD+，295g/6.2mm极致轻薄。两者都适合随身携带阅读。8.4更小巧，9 Lite更轻薄。都定价999-1499元。", "product", "Pad,便携,对比,轻薄,选择", 7),
    ("oPhone Pad 10 Go 防水吗？", "oPhone Pad 10 Go 是户外耐用平板：10.1英寸阳光屏（强光下清晰可见），IP68防水防尘，10000mAh超大电池。可承受1.5米跌落。适合户外工作者、工地、野外使用。售价2499元起。", "product", "Go,户外,防水,耐用,三防", 7),
    ("oPhone Pad 10E 性价比高吗？", "oPhone Pad 10E 是超值影音板：10.4英寸2K屏，6000mAh电池。千元价位（¥999起），适合学生网课+追剧。是同价位屏幕最好的影音平板之一。", "product", "10E,性价比,影音,入门,学生", 8),

    # ============================================================
    # === 手表产品全系列 (14款) ===
    # ============================================================
    ("oPhone 手表有哪些型号？", "oPhone Watch产品线共14款：智能系列——Watch 3 SE（入门）、Watch 3 Lite（轻智能）、Watch 3 Max（户外旗舰）；运动系列——Watch Sport（全能运动）、Watch Runner（跑步教练）；商务系列——Watch Classic（经典商务）、Watch Elite（机械融合）、Watch EDC（日常通勤）；健康系列——Watch Health（健康监测）；专业系列——Watch Diver（潜水）、Watch Golf（高尔夫）；儿童系列——Watch Kids（儿童安全）；手环系列——Watch Band（智能手环）、Watch Band Pro（专业手环）。价格199元到5999元。", "product", "手表,Watch,型号,全部,产品线", 10),
    ("oPhone Watch 3 Max 适合户外吗？", "oPhone Watch 3 Max 是户外旗舰：1.92英寸蓝宝石屏，钛合金表壳，双频GPS（精准定位峡谷/高楼），100米防水，-30°C~50°C工作温度。探险家装备。售价3999元起。", "product", "Watch,Max,户外,钛合金,GPS,防水", 9),
    ("oPhone Watch Sport 有哪些运动模式？", "oPhone Watch Sport 支持100+运动模式：跑步、骑行、游泳、登山、滑雪、瑜伽等。内置GPS，自动运动识别，20天续航。专业运动数据：VO2Max、训练负荷、恢复建议。售价1999元起。", "product", "Watch,Sport,运动,跑步,游泳,骑行", 8),
    ("oPhone Watch Health 能测什么？", "oPhone Watch Health 是全面健康监测手表：支持ECG心电（NMPA认证）、腕式血压测量（NMPA认证）、血氧、体温、HRV心率变异性。还具备跌倒检测+紧急SOS功能，特别适合老年人。售价2499元起。", "product", "Health,健康,血压,ECG,心电,老人", 9),
    ("oPhone Watch Diver 潜水功能强吗？", "oPhone Watch Diver 通过ISO 6425潜水表认证：200米防水，潜水电脑（深度+免减压时间+安全停留），指南针，深度计。支持水肺潜水和自由潜水模式。售价4499元起。", "product", "Diver,潜水,防水,潜水电脑", 8),
    ("oPhone Watch Golf 有什么功能？", "oPhone Watch Golf 是高尔夫专用手表：预装全球40,000+球场地图，挥杆分析（速度/角度/节奏），坡度补偿，果岭指南针。自动计分+数据统计。售价3299元起。", "product", "Golf,高尔夫,球场,挥杆,果岭", 7),
    ("oPhone Watch Elite 怎么样？", "oPhone Watch Elite 是机械智能融合手表：1.5英寸圆形AMOLED，瑞士精工机芯，钛合金表壳+陶瓷表圈。既有机械表质感，又有智能功能（通知/健康/NFC）。商务精英之选。售价4999元起。", "product", "Elite,机械,商务,钛合金,陶瓷", 8),
    ("oPhone Watch Kids 怎么用？", "oPhone Watch Kids 是儿童安全手表：GPS+北斗+WiFi三重定位，电子围栏（出入区域自动报警），视频通话，上课禁用模式。家长通过oPhone健康APP远程管理。售价699元起。", "product", "Kids,儿童,定位,安全,围栏", 9),
    ("oPhone Watch Runner 适合马拉松吗？", "oPhone Watch Runner 是跑步教练手表：1.4英寸半透屏（强光下清晰），进阶跑步动态（步频/步幅/垂直振幅/触地时间），训练负荷分析+恢复时间建议。GPS续航30小时。马拉松训练必备。售价2499元起。", "product", "Runner,跑步,马拉松,训练,动态", 8),
    ("oPhone Watch Band 和 Band Pro 怎么选？", "Watch Band：1.1英寸OLED，轻薄无感，心率/血氧/睡眠监测，14天续航（¥299）。Band Pro：1.47英寸AMOLED，独立GPS，血氧+体温监测，20天续航（¥499）。跑步爱好者选Pro。", "product", "Band,手环,对比,选择", 8),
    ("oPhone Watch EDC 支持NFC吗？", "oPhone Watch EDC 支持NFC门禁卡模拟+全国300+城市公交卡。1.7英寸AMOLED方形屏，简约设计，消息提醒+来电拒接。低调实用，日常通勤首选。售价1499元起。", "product", "EDC,NFC,通勤,门禁,公交", 7),
    ("oPhone Watch Classic 续航多久？", "oPhone Watch Classic 经典商务款：圆形1.4英寸AMOLED常亮屏，真皮表带+不锈钢表壳。日常使用约4天续航，省电模式可延长至10天。支持磁吸充电，1小时充至80%。售价2999元起。", "product", "Classic,商务,续航,经典", 7),

    # ============================================================
    # === 耳机产品全系列 (13款) ===
    # ============================================================
    ("oPhone 耳机有哪些型号？", "oPhone耳机产品线共13款：TWS真无线——Buds 3（入门降噪）、Buds 3 Pro（旗舰降噪）、Buds Lite 2（超轻半入耳）、Buds Fit（运动）、Buds Color（潮流）、Buds Sleep（睡眠）、Buds Business（商务通话）、Buds Gaming（电竞低延迟）；头戴式——Headphones Pro（旗舰）、Headphones ANC（通勤降噪）、Headphones Studio（录音室监听）；其他——Neckband Pro（颈挂式运动）、Buds Kids 2（儿童安全）。价格99元到2999元。", "product", "耳机,Buds,Headphones,型号,全部,产品线", 10),
    ("oPhone Buds 3 Pro 降噪效果如何？", "oPhone Buds 3 Pro 是旗舰降噪耳机：同轴双单元（10mm动圈+动铁），自适应降噪3.0（深度45dB），LDAC无损传输，3麦克风AI通话降噪。支持空间音频头部追踪、Qi无线充电+手机反向充电。续航10h+40h。售价1299元。", "product", "Buds,Pro,降噪,LDAC,无损,音质", 9),
    ("oPhone Buds 3 和 Buds 3 Pro 有什么区别？", "Buds 3：自适应降噪3.0（深度38dB），IP57防水，续航10h+40h（¥899）。Buds 3 Pro：同轴双单元，降噪深度45dB，LDAC无损，空间音频头部追踪，Qi无线充电（¥1299）。Pro音质和降噪全面提升。", "product", "Buds,对比,降噪,区别,选择", 9),
    ("oPhone Buds Lite 2 戴着舒服吗？", "oPhone Buds Lite 2 是超轻半入耳设计：单耳仅3.8g，贴合耳廓无压迫感。半入耳不堵塞耳道，适合长时间佩戴（办公/学习/睡前）。25h总续航，通话降噪。售价499元。", "product", "Buds,Lite,舒适,半入耳,轻便", 8),
    ("oPhone Buds Fit 适合跑步吗？", "oPhone Buds Fit 是专业运动耳机：耳翼式固定设计（剧烈运动不掉），IPX6防水防汗，低音增强模式（跑步更有节奏感）。单次8h续航，适合跑步/健身/骑行。售价599元。", "product", "Fit,运动,跑步,防水,健身", 8),
    ("oPhone Headphones Pro 音质好吗？", "oPhone Headphones Pro 是旗舰头戴式耳机：45mm镀铍振膜，LDAC无损传输+主动降噪，60h超长续航。蛋白皮耳罩柔软舒适，折叠收纳。适合沉浸式音乐聆听。售价1999元。", "product", "Headphones,Pro,头戴,音质,降噪", 8),
    ("oPhone Headphones Studio 适合专业用吗？", "oPhone Headphones Studio 是录音室监听耳机：50mm平面磁驱动单元，频率响应5Hz-40kHz，开放式声学设计。中性无音染，适合音频混音/母带制作。售价2999元。", "product", "Headphones,Studio,录音室,监听,平面磁", 8),
    ("oPhone Headphones ANC 通勤用怎么样？", "oPhone Headphones ANC 是通勤降噪耳机：40mm动圈，混合降噪35dB，折叠便携设计，55h续航。轻量化（230g），适合地铁/公交/飞机上使用。售价899元。", "product", "Headphones,ANC,通勤,降噪,便携", 8),
    ("oPhone Buds Sleep 睡眠耳机好用吗？", "oPhone Buds Sleep 是助眠专用耳机：超迷你设计（单耳2.3g），侧睡不硌耳。白噪音库38种（雨声/风声/心跳声等），定时关闭。8h单次续航，配合oPhone健康APP使用。售价399元。", "product", "Sleep,睡眠,白噪音,助眠", 8),
    ("oPhone Buds Business 通话效果好吗？", "oPhone Buds Business 是商务通话耳机：4麦克风AI降噪（过滤环境噪音），多点连接（同时连手机+电脑），USB-C无线适配器（即插即用）。会议/电话通话清晰。售价999元。", "product", "Business,通话,会议,降噪,商务", 8),
    ("oPhone Buds Gaming 打游戏延迟低吗？", "oPhone Buds Gaming 是电竞耳机：蓝牙5.3+2.4G双模，2.4G模式延迟仅45ms，蓝牙LE Audio模式80ms。RGB灯效充电仓。FPS游戏听声辨位精准。售价799元。", "product", "Gaming,游戏,低延迟,电竞,RGB", 8),
    ("oPhone Buds Color 有哪些颜色？", "oPhone Buds Color 是潮流色彩系列：6种撞色设计（霓虹绿/珊瑚粉/电光紫/冰湖蓝/柠檬黄/曜石黑），半透明充电仓。音质均衡，24h续航。年轻人的时尚单品。售价299元。", "product", "Color,颜色,潮流,时尚,色彩", 7),
    ("oPhone Neckband Pro 适合运动吗？", "oPhone Neckband Pro 是颈挂式运动耳机：磁吸开关（吸合暂停/分开播放），IPX5防水，12mm动圈，18h续航。颈挂式设计跑步不掉落，适合不喜欢真无线耳机的用户。售价399元。", "product", "Neckband,运动,颈挂,磁吸", 7),
    ("oPhone Buds Kids 2 对儿童安全吗？", "oPhone Buds Kids 2 是儿童专用耳机：85dB安全音量限制（保护听力），软硅胶头梁，无线蓝牙连接。适合网课学习和娱乐，家长放心。售价299元。", "product", "Kids,儿童,安全,音量,网课", 8),

    # ============================================================
    # === 电脑产品全系列 (16款) ===
    # ============================================================
    ("oPhone 电脑有哪些型号？", "oPhone电脑产品线共16款：笔记本——Book Pro 16/14（旗舰创作）、Book Air 15/13（轻薄便携）、Book Studio 16（工作站）、Book SE 14（入门学习）、Book Gaming 16/14（电竞）、Book Flip 14（翻转触控）、Book Ultra 17（移动工作站）、Book Dual（双屏）、Book Go 12（小巧随身）；台式机——Desktop Studio（创作塔式）、Desktop Mini（迷你主机）、Desktop AIO 27/24（一体机）。价格2999元到29999元。", "product", "电脑,Book,Desktop,型号,全部,产品线", 10),
    ("oPhone Book Pro 16 适合程序员吗？", "oPhone Book Pro 16 是旗舰创作本：16英寸3K Mini-LED屏（P3广色域），oCore M3 Pro芯片（12核CPU+18核GPU），32GB+1TB。编译/Rendering/虚拟化性能强劲。18h续航全天编程无压力。售价10999元起。", "product", "Book,Pro,编程,性能,程序员", 9),
    ("oPhone Book Air 13 有多轻？", "oPhone Book Air 13 仅重980g，厚11.5mm。13.3英寸2K屏，oCore i5处理器，12h续航。极致便携，适合移动办公/出差/上课。售价4999元起。", "product", "Book,Air,轻薄,便携,重量", 8),
    ("oPhone Book Studio 16 适合做3D吗？", "oPhone Book Studio 16 是创作者工作站：16英寸4K OLED触控屏，独显RTX 5070（8GB GDDR7），64GB+2TB。C4D/Blender/Maya流畅运行。视频剪辑+3D渲染专业之选。售价15999元起。", "product", "Book,Studio,3D,渲染,视频,工作站", 9),
    ("oPhone Book Gaming 16 性能怎么样？", "oPhone Book Gaming 16 是旗舰电竞本：16英寸240Hz 2.5K屏，RTX 5080独显（16GB GDDR7），32GB+1TB。赛博朋克2077/原神/CS2最高画质流畅运行。金属机身+RGB键盘。售价14999元起。", "product", "Book,Gaming,电竞,游戏,性能,RTX5080", 9),
    ("oPhone Book Gaming 14 和 Gaming 16 怎么选？", "Gaming 14：14英寸165Hz 2K屏，RTX 5070，16GB+512GB，1.7kg（¥9999）。Gaming 16：16英寸240Hz 2.5K屏，RTX 5080，32GB+1TB（¥14999）。追求便携选14，追求极致性能选16。", "product", "Gaming,对比,14,16,选择", 8),
    ("oPhone Book SE 14 值得买吗？", "oPhone Book SE 14 是入门学习本：14英寸FHD IPS屏，oCore i3处理器，8GB+256GB。适合网课、文档办公、视频播放。学生党入门首选。售价2999元起。", "product", "Book,SE,入门,学生,学习", 8),
    ("oPhone Book Flip 14 翻转好用吗？", "oPhone Book Flip 14 是翻转触控本：14英寸2K触控屏，360°翻转（笔记本/帐篷/站立/平板4种模式）。支持手写笔，设计师+学生笔记神器。售价6999元起。", "product", "Book,Flip,翻转,触控,手写", 8),
    ("oPhone Book Ultra 17 有多强？", "oPhone Book Ultra 17 是移动工作站：17英寸4K Mini-LED，oCore M3 Ultra芯片，128GB+4TB。可外接3台6K显示器。面向AI训练、科研计算、影视后期。售价29999元起。", "product", "Book,Ultra,工作站,AI,科研,专业", 8),
    ("oPhone Book Dual 双屏怎么用？", "oPhone Book Dual 是全球首款双屏笔记本：双14英寸2K屏，折叠展开=19英寸工作区。上下分屏（上查资料/下写文档）或左右扩展。多任务处理专家。售价11999元起。", "product", "Book,Dual,双屏,多任务,创新", 8),
    ("oPhone Book Go 12 能做什么？", "oPhone Book Go 12 是小巧随身本：12.4英寸FHD+，ARM处理器，850g，20h续航，Always Connected（4G LTE）。适合移动办公/出差/记者写稿。售价3999元起。", "product", "Book,Go,便携,续航,轻量", 8),
    ("oPhone Desktop Studio 配置怎么样？", "oPhone Desktop Studio 是顶级创作台式机：oCore M3 Ultra芯片，RTX 5090独显（32GB GDDR7），128GB+4TB。塔式设计，强大散热。8K视频实时渲染/3A游戏直播。售价29999元起。", "product", "Desktop,Studio,台式机,创作,性能,5090", 9),
    ("oPhone Desktop Mini 有多小？", "oPhone Desktop Mini 是迷你主机：12.7×12.7×5cm，仅重680g（手掌大小）。oCore M3芯片，16GB+512GB。双雷电5+双USB-A+HDMI+SD卡槽。桌面整洁方案。售价4999元起。", "product", "Desktop,Mini,迷你,小巧,桌面", 8),
    ("oPhone Desktop AIO 27 和 24 怎么选？", "Desktop AIO 27：27英寸5K屏，oCore M3 Pro芯片，32GB+1TB，家庭+办公旗舰（¥12999）。Desktop AIO 24：24英寸4K屏，oCore i7，16GB+512GB，教育+办公友好（¥6999）。", "product", "Desktop,AIO,一体机,对比,选择", 8),
    ("oPhone Book 和 oPhone Pad 怎么选？", "需要专业软件（编程/设计/视频/R Studio）选Book系列。日常办公/网课/追剧/轻笔记选Pad系列。Book有更强性能+完整桌面OS，Pad更便携+触屏操作。", "product", "选择,对比,Book,Pad,笔记本,平板", 10),

    # ============================================================
    # === 产品对比和选购指南 ===
    # ============================================================
    ("oPhone 最贵的手机是哪款？", "oPhone最贵的手机是X30 Ultra+ 16GB+1TB顶配版，售价8999元。其次是Fold 2顶配版（7999元）和Note 20顶配版（6999元）。折叠屏和影像旗舰是价格最高的品类。", "product", "最贵,价格,旗舰,X30,Fold", 7),
    ("oPhone 有哪些折叠屏产品？", "oPhone折叠屏产品共3款：oPhone Fold 2（大折叠，8英寸内屏+6.5英寸外屏，¥6999起）、oPhone Flip 2（竖折叠，6.8英寸折叠屏，¥4999起）、oPhone Pad Flex（折叠平板，7英寸↔12英寸，¥4999起）。", "product", "折叠屏,折叠,Fold,Flip,Flex", 9),
    ("oPhone 学生买什么合适？", "学生推荐：手机——C50/C50 Pro（千元价位）或 X30 Lite（轻薄拍照）；平板——Pad SE 2 或 Pad 10E（网课学习）；电脑——Book SE 14 或 Book Air 13（轻薄够用）；手表——Watch 3 SE 或 Watch Band；耳机——Buds Lite 2 或 Buds Color。教育优惠最高可省800元。", "product", "学生,推荐,选购,教育,预算", 10),
    ("oPhone 性价比最高的手机是哪款？", "oPhone性价比最高的是 C50（¥1499起）和 C50 Pro（¥1799起）。5G全网通、大电池长续航、千元价位配置均衡。其次是 S20（¥2999起），入门旗舰体验。", "product", "性价比,推荐,便宜,C50,S20", 9),
    ("oPhone 什么产品适合送长辈？", "送长辈推荐：手机——Note 20（大屏大字体，S Pen方便手写）；手表——Watch Health（健康监测：ECG+血压+跌倒检测）；平板——Pad 11（大屏追剧视频通话）；耳机——Buds Lite 2（轻便舒适）。", "product", "长辈,送礼,老人,推荐", 8),

    # ============================================================
    # === 订单与售后 (保持不变) ===
    # ============================================================
    ("oPhone以旧换新怎么操作？", "在oPhone商城APP→我的→以旧换新→输入旧机型号→在线估价→顺丰上门取件→验机后差价购买新机。旧机最高可抵5000元。", "aftersale", "以旧换新,回收,估价", 8),
    ("oPhone的换电池服务多少钱？", "手机换电池：199-399元（视型号）。平板换电池：299-599元。手表换电池：199元。耳机电池不支持更换。维修中心1小时快修。", "aftersale", "电池,更换,维修,价格", 9),
    ("oPhone的意外损坏保修吗？", "标准保修不覆盖意外损坏（碎屏/进水）。建议购买oPhone Care+服务（X系列¥699/年），提供每年2次意外损坏低价维修（屏幕¥188/其他¥628）。", "aftersale", "碎屏,进水,意外,Care+,保修", 9),
    ("oPhone退换货包装丢了怎么办？", "退换货不需要原包装。确保商品、配件、赠品齐全即可。顺丰上门取件免费包装。退款在仓库签收后48小时内原路返还。", "aftersale", "退货,包装,退款", 8),
    ("多个订单可以合并发货吗？", "系统自动合并相同收货地址+相同时间的订单。如已分开发货，无法再合并。建议下单时使用购物车统一结算避免分开。", "order", "合并,发货,订单", 6),
    ("oPhone订单可以修改地址吗？", "付款前可在结算页面修改地址。付款后未发货前联系客服修改（1次机会）。已发货订单可通过顺丰APP转寄（可能产生费用）。", "order", "地址,修改,配送", 8),
    ("oPhone支持分期付款吗？", "oPhone商城支持花呗3/6/12期分期、京东白条3/6/12期分期。部分商品支持24期免息分期（活动期间）。分期额度由支付平台评估。", "order", "分期,花呗,白条,免息", 7),
    ("oPhone礼品卡怎么购买和使用？", "在oPhone商城APP→我的→礼品卡→选择面值（50/100/200/500/1000元）→购买后自动存入账户。结算时默认优先使用礼品卡余额。不可提现，有效期3年。", "order", "礼品卡,购买,使用", 6),
    ("oPhone教育优惠怎么申请？", "在oPhone商城APP→教育优惠→上传学生证/录取通知书/教师工作证→审核通过（1-3工作日）→获得专属优惠价格。Book/Pad系列最高优惠800元。", "order", "教育,优惠,学生,教师", 8),
    ("oPhone企业采购有优惠吗？", "企业采购联系oPhone商务团队（enterprise@ophone.com / 400-888-9999），100台以上享阶梯折扣+专属客服+批量部署服务+增值税专票。", "order", "企业,采购,商务,折扣", 6),
    ("oPhone订单多久不付款会取消？", "订单生成后30分钟内未付款自动取消。秒杀/限时活动商品15分钟内未付款自动释放库存。建议及时付款以免错失优惠。", "order", "付款,取消,订单", 7),
    ("oPhone物流到哪里了怎么查？", "在oPhone商城APP→我的→全部订单→点击订单→查看物流，实时显示配送位置。同时发送短信通知+APP推送。顺丰/京东配送可精确到2小时送达时段。", "order", "物流,查询,配送,快递", 9),
    ("oPhone的客服电话是多少？", "oPhone客服热线：400-888-8888。服务时间：周一至周日 8:00-22:00。也可在APP内联系AI客服小O（7×24小时在线）或转接人工。", "general", "客服,电话,联系,热线", 10),
    ("oPhone实体店在哪里？", "oPhone目前在全国拥有58家直营店和230+授权店。一线城市核心商圈均有覆盖。在oPhone商城APP→门店→可以查看附近门店并预约体验。", "general", "门店,实体店,地址,体验", 7),
    ("oPhone的数据迁移怎么操作？", "使用oPhone换机助手APP（预装在oPhone手机中），支持从安卓/iOS/旧oPhone一键迁移：通讯录、照片、应用、微信聊天记录。WiFi直连传输，100GB数据约15分钟。", "general", "数据迁移,换机,备份", 9),
]


async def seed_products():
    await init_db()

    async with async_session_factory() as db:
        # 获取分类
        result = await db.execute(select(Category).where(Category.is_active == True))
        categories = {c.name: c for c in result.scalars().all()}

        total_products = 0
        total_skus = 0

        for cat_name, cat_products in PRODUCTS.items():
            cat = categories.get(cat_name)
            if not cat:
                print(f"⚠️ 分类 '{cat_name}' 不存在，跳过")
                continue

            for name, slug, description in cat_products:
                # 检查是否已存在
                result = await db.execute(select(Product).where(Product.slug == slug))
                if result.scalar_one_or_none():
                    continue

                # 根据名字判断价格区间
                price_hint = 2999
                if "Ultra" in name or "Pro" in name or "Max" in name or "Elite" in name:
                    price_hint = 5999
                elif "SE" in name or "Lite" in name or "Go" in name or "E" in name:
                    price_hint = 1499
                elif "Fold" in name or "Flip" in name or "Gaming" in name or "Studio" in name:
                    price_hint = 8999
                elif "Mini" in name:
                    price_hint = 4999

                product = Product(
                    name=name,
                    slug=slug,
                    description=description,
                    category_id=cat.id,
                    brand="oPhone",
                    is_active=True,
                    is_featured="Pro" in name or "Ultra" in name or "Studio" in name or "Elite" in name,
                    sales_count=0,
                )
                db.add(product)
                await db.flush()  # 获取 product.id

                # 创建 SKU
                templates = SKU_TEMPLATES.get(cat_name, SKU_TEMPLATES["手机"])
                for i, tpl in enumerate(templates):
                    base_price = tpl["price"]
                    if price_hint > base_price:
                        base_price = price_hint
                    if i == 0:
                        sku_price = base_price
                    elif i == 1:
                        sku_price = base_price + 1000
                    else:
                        sku_price = base_price + 2500

                    sku_code = tpl["sku_code"].replace("{slug}", slug)
                    sku = SKU(
                        product_id=product.id,
                        sku_code=sku_code,
                        sku_name=tpl["sku_name"],
                        specs=tpl["specs"],
                        price=sku_price,
                        stock=tpl["stock"],
                    )
                    db.add(sku)
                    total_skus += 1

                total_products += 1

        await db.flush()

        # === AI 知识库 ===
        ki_count = 0
        for question, answer, category, keywords, priority in KNOWLEDGE_ITEMS:
            result = await db.execute(
                select(KnowledgeItem).where(KnowledgeItem.question == question)
            )
            if result.scalar_one_or_none():
                continue
            ki = KnowledgeItem(
                question=question,
                answer=answer,
                category=category,
                keywords=keywords,
                priority=priority,
                is_active=True,
            )
            db.add(ki)
            ki_count += 1

        await db.commit()

        print(f"\n🎉 种子数据导入完成！")
        print(f"   📦 产品: {total_products} 个新增")
        print(f"   📐 SKU: {total_skus} 个新增")
        print(f"   📚 知识库: {ki_count} 条新增")

        # 统计总数
        total = await db.execute(select(func.count(Product.id)))
        sku_total = await db.execute(select(func.count(SKU.id)))
        ki_total = await db.execute(select(func.count(KnowledgeItem.id)))
        print(f"\n📊 数据库总览:")
        print(f"   产品: {total.scalar()} 个")
        print(f"   SKU: {sku_total.scalar()} 个")
        print(f"   知识库: {ki_total.scalar()} 条")


if __name__ == "__main__":
    asyncio.run(seed_products())
