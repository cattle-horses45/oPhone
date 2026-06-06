# oPhone Store - AI智能客服电商平台

oPhone 品牌官方商城，集成 DeepSeek AI 智能客服的完整电商解决方案。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | Python FastAPI + SQLAlchemy + SQLite |
| AI | DeepSeek API + 知识库RAG |
| 实时通信 | WebSocket |
| 状态管理 | Zustand |
| 认证 | JWT |

## 功能特性

### 🛍️ 电商商城
- 商品浏览（分类筛选、搜索、排序、分页）
- 商品详情（SKU规格选择、图片展示）
- 购物车（增删改、全选、批量操作）
- 订单管理（下单、支付、取消、确认收货）
- 收货地址管理
- 用户注册/登录（JWT认证）

### 🤖 AI智能客服
- 右下角悬浮聊天窗（全局可用）
- DeepSeek大模型驱动
- oPhone品牌知识库增强（RAG）
- 快捷问题一键提问
- 实时WebSocket通信

### 👨‍💼 人工客服
- AI自动检测转人工场景
- 用户主动转人工按钮
- 管理员等待队列（实时通知）
- WebSocket点对点聊天
- 会话管理（接受/关闭）

### 🔧 管理后台
- 仪表盘（用户、订单、收入统计）
- 商品管理（上下架、CRUD、库存）
- 订单管理（状态流转）
- 用户管理（启用/禁用）
- 分类、轮播图管理
- 知识库管理（Q&A编辑）

## 快速开始

### 1. 环境变量

```bash
cp .env.example .env
# 编辑 .env，填入 DeepSeek API Key
```

### 2. 后端启动

```bash
cd backend
pip install -r requirements.txt
python -m app.seed          # 初始化数据库和种子数据
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 前端启动

```bash
cd frontend
npm install
npm run dev                 # 开发模式 (http://localhost:5173)
```

### 4. 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 用户 | testuser | test123 |

## 项目结构

```
ophone-store/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── main.py         # 应用入口 + WebSocket端点
│   │   ├── config.py       # 配置管理
│   │   ├── database.py     # 数据库引擎
│   │   ├── dependencies.py # JWT认证依赖注入
│   │   ├── models/         # SQLAlchemy数据模型
│   │   ├── schemas/        # Pydantic请求/响应模型
│   │   ├── routers/        # REST API路由
│   │   ├── services/       # 业务逻辑层
│   │   ├── ws/             # WebSocket管理器
│   │   ├── ai/             # AI客服模块
│   │   └── utils/          # 工具函数
│   └── requirements.txt
├── frontend/               # React 前端
│   └── src/
│       ├── api/            # API请求层
│       ├── stores/         # Zustand状态管理
│       ├── components/     # 共享组件 + ChatWidget
│       ├── layouts/        # MainLayout + AdminLayout
│       ├── pages/          # 用户端 + 管理端页面
│       ├── router/         # 路由配置 + 权限守卫
│       ├── types/          # TypeScript类型定义
│       └── utils/          # 工具函数
├── .env.example
└── .gitignore
```

## API 文档

启动后端后访问 http://localhost:8000/docs 查看 Swagger API 文档。

## WebSocket 端点

| 端点 | 用途 |
|------|------|
| `ws://localhost:8000/ws/chat/{session_id}?token={jwt}` | 用户聊天 |
| `ws://localhost:8000/ws/admin/chat/{session_id}?token={jwt}` | 管理员聊天 |
| `ws://localhost:8000/ws/admin/queue?token={jwt}` | 转接队列监听 |
