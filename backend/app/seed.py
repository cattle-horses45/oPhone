"""种子数据 - 创建管理员账号和初始分类"""
import asyncio
from app.database import init_db, async_session_factory
from app.models.user import User
from app.models.product import Category, Banner
from app.models.knowledge import KnowledgeItem
from app.utils.security import hash_password


async def seed():
    await init_db()

    async with async_session_factory() as db:
        # 检查是否已存在管理员
        from sqlalchemy import select

        result = await db.execute(select(User).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            # 创建管理员账号
            admin = User(
                username="admin",
                email="admin@ophone.com",
                password_hash=hash_password("admin123"),
                full_name="系统管理员",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            print("✅ 管理员账号已创建: admin / admin123")

            # 创建测试用户
            test_user = User(
                username="testuser",
                email="test@ophone.com",
                password_hash=hash_password("test123"),
                full_name="测试用户",
                role="user",
                is_active=True,
            )
            db.add(test_user)
            print("✅ 测试用户已创建: testuser / test123")

        # 创建商品分类
        categories = [
            {"name": "手机", "slug": "phones", "sort_order": 1},
            {"name": "平板", "slug": "tablets", "sort_order": 2},
            {"name": "手表", "slug": "watches", "sort_order": 3},
            {"name": "耳机", "slug": "earbuds", "sort_order": 4},
            {"name": "配件", "slug": "accessories", "sort_order": 5},
        ]
        for cat_data in categories:
            result = await db.execute(select(Category).where(Category.slug == cat_data["slug"]))
            if not result.scalar_one_or_none():
                category = Category(**cat_data)
                db.add(category)
        print("✅ 商品分类已创建")

        # 创建默认轮播图（使用占位图片URL）
        banners = [
            {"title": "oPhone X30 系列", "image_url": "/uploads/banners/banner1.jpg", "link_url": "/products", "sort_order": 1},
            {"title": "oPhone Watch 3", "image_url": "/uploads/banners/banner2.jpg", "link_url": "/products", "sort_order": 2},
            {"title": "oPhone Buds 2", "image_url": "/uploads/banners/banner3.jpg", "link_url": "/products", "sort_order": 3},
        ]
        for b_data in banners:
            banner = Banner(**b_data)
            db.add(banner)
        print("✅ 轮播图已创建")

        # 创建初始知识库条目
        knowledge_items = [
            {"question": "oPhone的保修政策是什么？", "answer": "oPhone全系列手机享受1年整机保修，X系列享受2年整机保修。保修期内非人为损坏免费维修。", "category": "aftersale", "keywords": "保修,维修,保修期", "priority": 10},
            {"question": "如何申请退换货？", "answer": "oPhone支持7天无理由退货（激活后不支持），15天质量问题换货。请在APP内'我的订单'中申请，或联系客服处理。", "category": "aftersale", "keywords": "退货,换货,退款,无理由", "priority": 10},
            {"question": "oPhone X30有什么颜色可选？", "answer": "oPhone X30提供深空灰、星瀚蓝、月影白三种颜色可选，不同存储版本颜色可能略有差异。", "category": "product", "keywords": "X30,颜色,配色", "priority": 5},
            {"question": "订单发货后多久能收到？", "answer": "一般情况下，顺丰快递全国1-3天送达。具体物流信息可在'我的订单'中查看实时物流状态。", "category": "order", "keywords": "物流,发货,快递,配送", "priority": 8},
            {"question": "oPhone支持哪些支付方式？", "answer": "oPhone商城支持支付宝、微信支付、银行卡支付。部分商品支持花呗分期和京东白条。", "category": "order", "keywords": "支付,支付宝,微信,银行卡", "priority": 5},
            {"question": "如何查询我的订单？", "answer": "登录oPhone商城APP，点击底部'订单'即可查看所有订单。您可以按状态筛选：待付款、已付款、已发货、已完成。", "category": "order", "keywords": "订单查询,订单状态,物流查询", "priority": 8},
        ]
        for ki_data in knowledge_items:
            result = await db.execute(
                select(KnowledgeItem).where(KnowledgeItem.question == ki_data["question"])
            )
            if not result.scalar_one_or_none():
                ki = KnowledgeItem(**ki_data)
                db.add(ki)
        print(f"✅ {len(knowledge_items)} 条知识库条目已创建")

        await db.commit()
        print("\n🎉 种子数据初始化完成！")


if __name__ == "__main__":
    asyncio.run(seed())
