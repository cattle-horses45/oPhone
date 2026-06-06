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

# AI 知识库 —— 覆盖所有品类+订单+售后
KNOWLEDGE_ITEMS = [
    # === 手机 (product) ===
    ("oPhone X30 Ultra+ 支持几倍光学变焦？", "oPhone X30 Ultra+ 搭载第二代2亿像素潜望长焦，支持10倍光学变焦和200倍数字变焦。AI超分算法让远摄更清晰。", "product", "X30,变焦,相机,拍照,Ultra+", 8),
    ("oPhone Fold 2 屏幕折痕明显吗？", "oPhone Fold 2 采用第三代UTG超薄玻璃+水滴铰链设计，日常使用折痕几乎不可见。屏幕承诺40万次折叠寿命。", "product", "折叠,折痕,铰链,Fold", 8),
    ("oPhone Flip 2 电池续航如何？", "oPhone Flip 2 内建4200mAh双电池设计，日常使用一天无压力。支持44W有线快充和15W无线充电。", "product", "Flip,折叠,续航,电池", 7),
    ("oPhone 手机支持5G吗？", "所有oPhone手机均支持5G全网通（n1/n3/n5/n8/n28/n41/n77/n78频段）。双卡双5G待机。", "product", "5G,网络,双卡", 10),
    ("oPhone Note 20 的 S Pen 有什么功能？", "oPhone Note 20 内置 S Pen 支持4096级压感、蓝牙遥控拍照、隔空手势翻页、手写笔记转文字。商务办公利器。", "product", "Note,S Pen,手写笔", 7),
    ("oPhone GT Neo 玩游戏散热怎么样？", "oPhone GT Neo 搭载天工散热系统3.0：12000mm²超大VC均热板+石墨烯导热片+AI温控算法。王者荣耀120帧满帧不降频。", "product", "散热,游戏,GT,电竞", 7),
    ("oPhone C50 和 C50 Pro 有什么区别？", "C50 Pro 升级了AMOLED屏幕（C50为LCD）、1亿像素主摄（C50为5000万）、67W快充（C50为33W）。价格相差约300元。", "product", "C50,对比,区别", 6),

    # === 平板 (product) ===
    ("oPhone Pad 系列支持手写笔吗？", "oPhone Pad Pro 12.9、Pad Air 10.9、Pad 11 Pro、Pad 12 Artist 均支持 oPencil 2 手写笔（4096级压感+磁吸充电）。入门款 Pad SE 2 支持 oPencil 1 代。", "product", "平板,手写笔,Pad,oPencil", 9),
    ("oPhone Pad 可以用来代替笔记本吗？", "oPhone Pad 13 和 Pad 14 Max 搭配键盘盖+触控板套装，配合桌面模式，可以完成80%的日常办公任务。但专业软件（如PS、CAD）建议选择 Book 系列笔记本。", "product", "办公,替换笔记本,键盘", 7),
    ("oPhone Pad 屏幕对眼睛好吗？", "oPhone Pad 全系屏幕通过莱茵TÜV低蓝光认证和DC调光。Pad SE 2 和 Pad 9 Lite 采用类纸护眼屏技术，适合长时间阅读。", "product", "护眼,屏幕,蓝光,视力", 8),
    ("oPhone Pad 支持外接显示器吗？", "oPhone Pad Pro、Pad 11 Pro、Pad 14 Max 通过雷电4/USB-C 支持外接4K显示器，可扩展桌面模式。入门款 Pad SE 仅支持屏幕镜像。", "product", "外接显示器,扩展,雷电", 6),
    ("oPhone Pad Flex 折叠后容易坏吗？", "oPhone Pad Flex 折叠机构经过10万次折叠测试，日常使用5年无压力。随机附赠保护套，建议持续使用。", "product", "折叠,Flex,耐用", 7),
    ("oPhone Pad Gaming 玩原神怎么样？", "oPhone Pad Gaming 搭载骁龙8 Elite+12英寸144Hz屏+12000mAh电池。原神最高画质60帧稳定运行6小时以上。", "product", "游戏,原神,性能,Gaming", 7),

    # === 手表 (product) ===
    ("oPhone Watch 3 Pro 的 ECG 功能靠谱吗？", "oPhone Watch 3 Pro ECG心电功能通过国家药监局NMPA认证，30秒快速检测房颤等心律失常。建议定期测量，非医疗诊断。", "product", "ECG,心电,健康,Watch", 9),
    ("oPhone Watch 如何开启 eSIM？", "支持eSIM的型号（Watch 3 Pro、Watch 3 Max、Watch Elite）：在oPhone健康APP中→设备→eSIM管理→选择运营商开通。目前支持移动/联通/电信一号双终端。", "product", "eSIM,开通,运营商", 8),
    ("oPhone Watch 电池能用多久？", "Watch 3 Pro：7天。Watch 3：5天。Watch Sport：20天。Watch Lite：30天。Watch Kids：3天。续航因使用习惯和功能开启情况而异。", "product", "续航,电池,Watch", 9),
    ("oPhone Watch Diver 能潜水多深？", "oPhone Watch Diver 防水等级200米(20ATM)，通过ISO 6425潜水表认证。支持水肺潜水模式（深度+免减压时间+安全停留）。", "product", "潜水,防水,Diver", 7),
    ("oPhone Watch Kids 怎么设置电子围栏？", "在oPhone健康APP中→设备→儿童手表→安全区域→画圈设置围栏范围。孩子离开围栏自动推送警报。支持设置3个围栏区域。", "product", "儿童,安全,围栏,Kids", 8),
    ("oPhone Watch 能测血压吗？", "oPhone Watch Health 支持腕式血压测量（示波法），通过NMPA认证。测量时需保持静止，建议校准时使用上臂式血压计对比。", "product", "血压,Health,健康", 8),

    # === 耳机 (product) ===
    ("oPhone Buds 3 Pro 和 Buds 2 Pro 有什么区别？", "Buds 3 Pro 升级同轴双单元、LDAC无损传输、3麦克风AI通话降噪、Qi反向充电。降噪深度从35dB提升至45dB。音质和通话质量全面提升。", "product", "Buds,对比,降噪,升级", 8),
    ("oPhone Headphones Pro 适合录音室用吗？", "oPhone Headphones Studio 专为录音室设计（50mm平面磁驱动+开放式设计）。Headphones Pro 更适合日常聆听和通勤使用（主动降噪+封闭式设计）。", "product", "录音室,监听,Headphones", 7),
    ("oPhone Buds Sleep 睡眠耳机怎么用？", "oPhone Buds Sleep 配合oPhone健康APP→睡眠→白噪音库（雨声/风声/心跳声等38种）。设定定时关闭（30/60/90分钟）。单次续航8小时。", "product", "睡眠,白噪音,Sleep", 7),
    ("oPhone Buds Gaming 延迟真的低吗？", "oPhone Buds Gaming 2.4G模式下行延迟45ms，蓝牙5.3 LE Audio模式下80ms。吃鸡/原神音画同步。配合GT Neo手机会自动启动低延迟模式。", "product", "游戏,延迟,电竞,Gaming", 7),
    ("oPhone 耳机防水吗？", "Buds 3/Buds 3 Pro/Buds Fit 支持IP57防水防汗（可短时间浸水）。Buds Gaming IPX4防溅。Buds Sleep IPX2防滴。头戴式不防水。", "product", "防水,运动,游泳", 8),
    ("oPhone Buds 支持无线充电吗？", "Buds 3 Pro、Buds Business 充电仓支持Qi无线充电+Buds 3 Pro支持手机反向充电。其他型号仅USB-C有线充电。", "product", "无线充电,电池", 6),

    # === 电脑 (product) ===
    ("oPhone Book Pro 适合剪视频吗？", "oPhone Book Pro 系列搭载 oCore M3 Pro芯片（12核CPU+18核GPU+16核神经引擎），8K ProRes流畅剪辑。Final Cut Pro导出速度快于同级Win本2倍。", "product", "视频剪辑,Pro,性能", 8),
    ("oPhone Book 能玩3A大作吗？", "oPhone Book Gaming 16（RTX5080）和Gaming 14（RTX5070）可流畅运行3A大作。非游戏本型号可玩轻度游戏（LOL/原神），不适合3A。", "product", "游戏,3A,Gaming,性能", 8),
    ("oPhone Book 电池能用多久？", "Book Pro 16：18小时。Book Air 13：12小时。Book Gaming 16：6小时（游戏状态2小时）。Book SE 14：10小时。续航测试基于50%亮度网页浏览。", "product", "续航,电池,Book", 8),
    ("oPhone Book 可以外接几个显示器？", "Book Pro/Studio/Ultra 支持外接2台6K+1台4K显示器。Book Air/SE 支持外接1台4K。Desktop Studio 支持外接4台6K显示器。", "product", "外接,显示器,扩展", 7),
    ("oPhone Desktop Mini 有多小？", "oPhone Desktop Mini 尺寸12.7×12.7×5cm，重量680g。手掌大小，可放入随身包中。双雷电5+双USB-A+HDMI+SD卡槽，接口齐全。", "product", "Mini,尺寸,桌面", 6),
    ("oPhone Book 和 oPhone Pad 怎么选？", "需要专业软件（编程/设计/视频/R Studio）选Book。日常办公/网课/追剧/轻笔记选Pad。Book有更强性能+完整桌面OS，Pad更便携+触屏操作。", "product", "选择,对比,Book,Pad", 9),

    # === 订单与售后 ===
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
