---
name: oPhone Store
description: 精密仪器美学 — 钢蓝冷色调，Inter + Space Mono，让产品自己说话
colors:
  deep-steel: "#3D6A94"
  frosted-steel: "#5C8DB8"
  forged-iron: "#2F5579"
  steel-mist: "#D0E1EF"
  cool-slate: "#F4F6F9"
  pure-white: "#FFFFFF"
  chalk: "#EEF1F5"
  cold-ink: "#15181B"
  gunmetal: "#5F6B7A"
  oxide-gray: "#8B95A5"
typography:
  body:
    fontFamily: "Inter, Noto Sans SC, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  title:
    fontFamily: "Inter, Noto Sans SC, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
  headline:
    fontFamily: "Inter, Noto Sans SC, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  label:
    fontFamily: "Inter, Noto Sans SC, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0.04em"
  mono:
    fontFamily: "Space Mono, Courier New, monospace"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "-0.02em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
components:
  button-primary:
    backgroundColor: "{colors.deep-steel}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.md}"
    padding: "12px 32px"
  button-primary-hover:
    backgroundColor: "{colors.forged-iron}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.deep-steel}"
    rounded: "{rounded.md}"
    padding: "10px 28px"
  button-outline-hover:
    backgroundColor: "rgba(61,106,148,0.06)"
  card:
    backgroundColor: "{colors.pure-white}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-hover:
    backgroundColor: "{colors.pure-white}"
  input:
    backgroundColor: "{colors.pure-white}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  input-focus:
    backgroundColor: "{colors.pure-white}"
---

# Design System: oPhone Store — Precision Instruments

## 1. Overview

**Creative North Star: "The Precision Instrument"**

oPhone Store 的设计系统不是装饰，是校准过的精密仪器。每个像素都有计量学意义。字体排印如同技术文档——清晰、可读、不加修饰。颜色来自工业色卡：冷调钢材、氧化铁灰、霜面玻璃。交互反馈是温和的——按钮不会"弹跳"，卡片不会"漂浮"，它们只是做出确认，然后安静地完成任务。

这个系统相信一个原则：信任来自一致性，而不是奇观。一个精密的仪器不需要说服你它很精密 —— 当你使用它时，你能感受到。这正是 oPhone Store 的目标。

系统继承 PRODUCT.md 的战略方向并落地为具体的视觉决策。Hybrid register：用户面保持品牌感（留白、克制、精致），管理面保持工具感（高效、清晰、信息密度合理）。但双眼所见是统一的：同一个色板、同一套字体、同一组交互规则。

**Key Characteristics:**
- 工业冷色调色板：钢蓝 + 冷灰 + 冷黑，无暖色混入
- 单字体族策略：Inter 贯穿所有层级，Space Mono 作为数据锚点
- Soft-touch 交互：hover 温和抬起 1px + 柔光扩散，过渡 200ms
- 扁平默认，阴影仅作为状态信号
- 6px / 8px 圆角体系：足够柔和，不过度圆润
- WCAG AA 合规：正文对比度 ≥4.5:1，键盘可导航

## 2. Colors: The Industrial Cold-Tone Palette

色板来自工业场景：车间里的钢材（Deep Steel）、霜面玻璃（Frosted Steel）、氧化铁铸件（Forged Iron）、精密仪器的冷灰外壳（Cool Slate）。

### Primary
- **Deep Steel** (#3D6A94): 主强调色。用于主 CTA 按钮、文字链接、聚焦边框、选中态标记。10% Rule 适用——每页面出现不超过 10% 面积。
- **Frosted Steel** (#5C8DB8): 强调色浅变。用于渐变色终点、装饰性背景、hover 高光。
- **Forged Iron** (#2F5579): 强调色深变。用于按钮 hover/active、文字链接 hover。
- **Steel Mist** (#D0E1EF): 强调色极淡。用于选中态背景、标签底色。

### Neutral
- **Cool Slate** (#F4F6F9): 页面底色。冷调浅灰——大面积安静背景，不暖不奶油。
- **Pure White** (#FFFFFF): 卡片/容器色。与底色形成微弱但清晰的对比。
- **Chalk** (#EEF1F5): 次级表面。输入框默认背景、页脚、侧边栏。
- **Cold Ink** (#15181B): 正文色。冷调近黑色，与暖黑 (#1C1917) 有明确区分。
- **Gunmetal** (#5F6B7A): 辅助文字。4.7:1 对比度于 Pure White，满足 WCAG AA 正文标准。
- **Oxide Gray** (#8B95A5): 静音文字/占位符。仅用于 placeholder 和非关键辅助信息。

### Named Rules
**The 10% Rule.** Deep Steel 在任何页面上的总面积 ≤10%。如果一屏出现超过 3 个强调色元素，重新审视设计。

**The Cold Canvas Rule.** 所有背景色必须带冷色调。禁止纯中性灰 (#808080 系)，禁止暖色底色。冷灰基底是"科技感"的最基本保证。

**The One Accent Rule.** 系统只有一个强调色族 (Deep Steel → Frosted Steel → Forged Iron)。不引入次要强调色（绿色 success 和红色 danger 是语义状态色，不算强调色）。语义色使用低饱和度变体，不与钢蓝竞争视觉权重。

## 3. Typography: The Single-Family Instrument

**Body Font:** Inter + Noto Sans SC — 人文主义无衬线体，高可读性，中英文混排可靠。
**Mono Font:** Space Mono — 等宽字体，用于价格、规格、订单号、统计数据。
**Character:** 字体排印本身就是精密仪器。一个字族贯穿所有层级，通过 weight 和 size 区分层级，不依赖字体变化。等宽标签是唯一的视觉锚点——它们出现在价格标签、SKU 代码、技术规格中，提供"这台仪器在测量"的信号。

### Hierarchy
- **Headline** (700, clamp(2rem, 5vw, 3.5rem), 1.15): 页面主标题。出现频率低，需要时携带充分重量。letter-spacing: -0.02em。
- **Title** (600, 20px, 1.3): 区块标题、商品名、卡片标题。
- **Body** (400, 15px, 1.6): 正文、描述。最大行宽 65–75ch。
- **Label** (500, 13px, 0.04em): 导航项、分类标签、表单标签。
- **Mono** (400, 13px, -0.02em): 价格数字、SKU 编号、订单号、统计数据。等宽字体。

### Named Rules
**The Single-Typeface Rule.** 整个系统使用一个字族 (Inter) 做所有标题和正文。Space Mono 仅限于数据类标签（价格、规格、订单号）。不用第三种字体。这强制层级表达必须来自 weight + size，而非字体切换——这是更难的约束，也是更纯的结果。

**The Weight-Only Contrast Rule.** 标题与正文的区别来自 weight（700/600 vs 400），不来自字体族。加粗是信号，不是噪音。

## 4. Elevation: Flat-By-Default, Shadow-As-Signal

静态表面完全扁平。卡片边界由 1px 冷灰边框（rgba(15,23,42,0.06)）定义，不是阴影。阴影仅在交互状态出现——它是信号，不是风格。

### Shadow Vocabulary
- **hover-soft** (`box-shadow: 0 2px 12px rgba(15,23,42,0.06)`): 卡片 hover。2px 上浮 + 12px 柔光扩散，低调确认。
- **focus-ring** (`box-shadow: 0 0 0 3px rgba(61,106,148,0.15)`): 聚焦环。15% 透明度钢蓝，3px 宽度。替代浏览器默认 outline。
- **elevated-nav** (`box-shadow: 0 1px 8px rgba(15,23,42,0.04)`): 固定导航栏。唯一允许非交互状态下使用阴影的元素——用于与滚动内容建立 z 轴分离。

### Named Rules
**The Flat-By-Default Rule.** 静态表面必须扁平。阴影只出现在 hover、focus、active 三种状态。如果一张卡片在未交互时就投下阴影，它看起来像 2014 年的设计。

**The Soft-Lift Rule.** hover 时的 elevation 变化：translateY(-1px) + 柔光扩散 12px，过渡 200ms ease-out。没有弹跳、没有大幅抬起、没有强调色发光。精密仪器不会弹跳。

## 5. Components

### Primary Button (`.btn-gold`)
- **Character:** 明确、不喧哗。钢蓝实色块 + 白色文字。
- **Shape:** 6px 圆角。直角足够柔和，但保持"这是按钮"的明确性。
- **Default:** Deep Steel 背景，Pure White 文字，12px 32px 内边距，font-weight 500。
- **Hover:** Forged Iron 背景，translateY(-1px)，200ms ease-out。
- **Active:** translateY(0)，无阴影。
- **Focus-visible:** 3px Deep Steel 15% 透明度环。
- **Disabled:** 40% 不透明度，cursor not-allowed。

### Outline Button (`.btn-outline-gold`)
- **Character:** 克制。透明背景 + 钢蓝边框。
- **Shape:** 6px 圆角，1px Deep Steel 30% 透明度边框。
- **Hover:** Deep Steel 6% 透明度背景填充，边框变为完全不透明。
- **Focus-visible:** 同 Primary。

### Card (`.glass-card`)
- **Character:** 干净的白色容器。扁平、安静。
- **Shape:** 8px 圆角，1px rgba(15,23,42,0.06) 边框，24px 内边距。
- **Hover:** 边框加深至 rgba(15,23,42,0.1)，12px 柔光扩散阴影，translateY(-1px)。200ms ease-out。
- **No shadow at rest.** 静态卡片是纯白色 + 1px 边框。

### Input (`.input-luxury`)
- **Character:** 朴素、可靠。
- **Shape:** 6px 圆角，1px rgba(15,23,42,0.1) 边框，12px 16px 内边距。
- **Default:** Pure White 背景，Cold Ink 文字，Oxide Gray placeholder。
- **Focus:** 边框变为 Deep Steel，3px 钢蓝 12% 透明度环。背景保持 Pure White。
- **Error:** 边框变为 red-300，focus-ring 变为 red-200。红色错误文字 12px。
- **Disabled:** 灰色背景、灰色文字。

### Navigation
- **Character:** 清晰、一致的路径标记。
- **MainLayout:** 白色半透明毛玻璃（rgba(255,255,255,0.92) + blur(24px)），1px 底部边框。导航链接：Gunmetal 默认 → Deep Steel hover。
- **AdminLayout:** Chalk 侧边栏 + 纯白顶栏。活跃项：Steel Mist 背景 + Deep Steel 文字。非活跃项：Gunmetal → hover 时 Chalk 背景加深。

### Chat Widget
- **Character:** 亲切但不幼稚。
- **FAB:** Deep Steel 渐变圆形按钮，4px 钢蓝柔光阴影。hover 时 scale(1.05)。
- **Panel:** 8px 圆角，Pure White 背景，1px 冷灰边框，max-height 80vh。
- **User bubble:** Deep Steel → Forged Iron 渐变，Pure White 文字，右侧小圆角。
- **AI bubble:** Chalk 背景，Cold Ink 文字，左侧小圆角。
- **Input:** Chalk 背景，1px 冷灰边框。发送按钮：Deep Steel 渐变。

### Data Display (Admin)
- **Tables:** 白色背景，2px 冷灰 stripe，hover 时浅灰高亮。表头 Cold Ink 500 weight。
- **Stat Cards:** 白色卡片 + 左侧彩色图标标记。数字使用 Space Mono。
- **Badges:** 6px 圆角胶囊，语义色低饱和度背景 + 深色文字。

## 6. Do's and Don'ts

### Do:
- **Do** 使用 Cool Slate (#F4F6F9) 作为所有页面的默认背景色。这是冷色调的保证。
- **Do** 保持 Deep Steel 稀缺。如果一屏内出现超过 3 个强调色元素，重新设计。
- **Do** 给内容充分的呼吸空间。Section 间距 64–80px，卡片内边距 24px。
- **Do** 使用 1px 冷灰边框 + Pure White 底色来定义卡片边界，而不是阴影。
- **Do** 确保所有文本与背景对比度 ≥4.5:1（正文）或 ≥3:1（大标题 24px+），满足 WCAG AA。
- **Do** 为所有交互元素提供可见的 focus-visible 状态：3px Deep Steel 15% 环。
- **Do** 尊重 `prefers-reduced-motion`：关闭所有过渡动画，使用即时状态切换。
- **Do** Inter 一个字族做所有层级。标题 vs 正文的区别来自 weight + size，不来自字体切换。
- **Do** 圆角使用 6px（按钮/输入框）或 8px（卡片）。不更大，不更小。

### Don't:
- **Don't** 使用 Inter + 紫色渐变 + 圆角卡片 + 嵌套阴影的组合。千篇一律的 SaaS 模板美学。
- **Don't** 使用暖色调底色（奶油色、米色、暖白）。冷灰基底是品牌承诺。
- **Don't** 使用暗黑背景 + 金色/铜色强调色。这是已废弃的旧 oPhone 主题方向。
- **Don't** 添加弹窗、倒计时、促销标签、闪烁动画。与冷静克制的品牌定位冲突。
- **Don't** 使用渐变文字、发光阴影、多重投影。设计不应抢产品风头。
- **Don't** 在静态卡片上使用阴影。扁平默认，阴影仅作状态信号。
- **Don't** 使用超过 8px 的圆角。直角或微圆角更精准、更"科技"。
- **Don't** 引入第三种字体族。系统只有 Inter + Space Mono。
- **Don't** 使用 `border-left` 大于 1px 的彩色侧边条。要么全边框，要么背景色块。
