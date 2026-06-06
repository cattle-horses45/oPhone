"""管理员服务 - 仪表盘统计"""
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.models.knowledge import KnowledgeItem


async def get_dashboard_stats(db: AsyncSession) -> dict:
    """获取仪表盘统计数据"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 用户总数
    user_count_result = await db.execute(
        select(func.count()).select_from(User)
    )
    total_users = user_count_result.scalar() or 0

    # 商品总数
    product_count_result = await db.execute(
        select(func.count()).select_from(Product).where(Product.is_active == True)  # noqa: E712
    )
    total_products = product_count_result.scalar() or 0

    # 订单总数
    order_count_result = await db.execute(
        select(func.count()).select_from(Order)
    )
    total_orders = order_count_result.scalar() or 0

    # 今日订单数
    today_order_result = await db.execute(
        select(func.count()).select_from(Order).where(
            Order.created_at >= today_start
        )
    )
    today_orders = today_order_result.scalar() or 0

    # 各状态订单数量
    pending_payment_result = await db.execute(
        select(func.count()).select_from(Order).where(
            Order.status == "pending_payment"
        )
    )
    pending_payment = pending_payment_result.scalar() or 0

    paid_result = await db.execute(
        select(func.count()).select_from(Order).where(Order.status == "paid")
    )
    paid = paid_result.scalar() or 0

    shipped_result = await db.execute(
        select(func.count()).select_from(Order).where(
            Order.status == "shipped"
        )
    )
    shipped = shipped_result.scalar() or 0

    completed_result = await db.execute(
        select(func.count()).select_from(Order).where(
            Order.status == "completed"
        )
    )
    completed = completed_result.scalar() or 0

    cancelled_result = await db.execute(
        select(func.count()).select_from(Order).where(
            Order.status == "cancelled"
        )
    )
    cancelled = cancelled_result.scalar() or 0

    # 总销售额（已完成订单）
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).select_from(Order).where(
            Order.status.in_(["paid", "shipped", "completed"])
        )
    )
    total_revenue = round(revenue_result.scalar() or 0, 2)

    # 本月销售额
    month_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .select_from(Order)
        .where(
            Order.status.in_(["paid", "shipped", "completed"]),
            Order.created_at >= month_start,
        )
    )
    month_revenue = round(month_revenue_result.scalar() or 0, 2)

    # 知识库条目数
    knowledge_count_result = await db.execute(
        select(func.count()).select_from(KnowledgeItem).where(
            KnowledgeItem.is_active == True  # noqa: E712
        )
    )
    total_knowledge = knowledge_count_result.scalar() or 0

    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "today_orders": today_orders,
        "order_status": {
            "pending_payment": pending_payment,
            "paid": paid,
            "shipped": shipped,
            "completed": completed,
            "cancelled": cancelled,
        },
        "total_revenue": total_revenue,
        "month_revenue": month_revenue,
        "total_knowledge": total_knowledge,
    }
