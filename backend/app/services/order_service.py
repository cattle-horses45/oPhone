"""订单服务 - 创建、查询、取消、支付、确认收货"""
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.models.product import SKU, Product, ProductImage
from app.models.user import Address
from app.utils.pagination import paginate

# 订单状态常量
STATUS_PENDING = "pending_payment"
STATUS_PAID = "paid"
STATUS_SHIPPED = "shipped"
STATUS_COMPLETED = "completed"
STATUS_CANCELLED = "cancelled"


def _generate_order_no() -> str:
    """生成唯一订单号"""
    now = datetime.now(timezone.utc)
    date_part = now.strftime("%Y%m%d%H%M%S")
    random_part = uuid.uuid4().hex[:8].upper()
    return f"OP{date_part}{random_part}"


def _format_order(order: Order) -> dict:
    """格式化订单为字典"""
    return {
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "address_snapshot": order.address_snapshot,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at,
        "shipped_at": order.shipped_at,
        "completed_at": order.completed_at,
        "cancelled_at": order.cancelled_at,
        "cancel_reason": order.cancel_reason,
        "remark": order.remark,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "sku_id": item.sku_id,
                "product_name": item.product_name,
                "sku_name": item.sku_name,
                "product_image": item.product_image,
                "price": item.price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            }
            for item in (order.items or [])
        ],
    }


async def create_order(
    db: AsyncSession,
    user_id: int,
    address_id: int,
    cart_item_ids: list[int],
    remark: str | None = None,
) -> dict:
    """
    从购物车创建订单（事务）

    步骤:
    1. 验证收货地址
    2. 验证购物车项，检查库存
    3. 扣减库存
    4. 生成订单和订单项
    5. 清空已结算的购物车项
    """
    # 1. 验证收货地址
    addr_result = await db.execute(
        select(Address).where(
            and_(Address.id == address_id, Address.user_id == user_id)
        )
    )
    address = addr_result.scalar_one_or_none()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="收货地址不存在",
        )

    # 2. 验证购物车项
    cart_items = []
    for cid in cart_item_ids:
        result = await db.execute(
            select(CartItem).where(
                and_(CartItem.id == cid, CartItem.user_id == user_id)
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"购物车项ID {cid} 不存在",
            )
        cart_items.append(item)

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="购物车项不能为空",
        )

    # 3. 扣减库存并计算总金额
    order_items_data = []
    total_amount = 0.0

    for cart_item in cart_items:
        sku_result = await db.execute(
            select(SKU).where(SKU.id == cart_item.sku_id)
        )
        sku = sku_result.scalar_one_or_none()
        if not sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SKU({cart_item.sku_id})不存在",
            )

        # 检查库存
        if sku.stock < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"商品 {sku.sku_name} 库存不足（剩余{sku.stock}件）",
            )

        # 扣减库存
        sku.stock -= cart_item.quantity

        # 获取商品信息
        product_result = await db.execute(
            select(Product).where(Product.id == cart_item.product_id)
        )
        product = product_result.scalar_one_or_none()

        # 获取商品图片
        product_image = None
        if product:
            img_result = await db.execute(
                select(ProductImage.image_url)
                .where(ProductImage.product_id == product.id)
                .order_by(ProductImage.sort_order)
                .limit(1)
            )
            product_image = img_result.scalar_one_or_none()

        subtotal = sku.price * cart_item.quantity
        total_amount += subtotal

        order_items_data.append({
            "product_id": cart_item.product_id,
            "sku_id": cart_item.sku_id,
            "product_name": product.name if product else "",
            "sku_name": sku.sku_name,
            "product_image": product_image,
            "price": sku.price,
            "quantity": cart_item.quantity,
            "subtotal": round(subtotal, 2),
        })

    total_amount = round(total_amount, 2)

    # 4. 创建订单
    address_snapshot = {
        "receiver_name": address.receiver_name,
        "phone": address.phone,
        "province": address.province,
        "city": address.city,
        "district": address.district,
        "detail_address": address.detail_address,
    }

    order = Order(
        order_no=_generate_order_no(),
        user_id=user_id,
        address_snapshot=address_snapshot,
        total_amount=total_amount,
        status=STATUS_PENDING,
        remark=remark,
    )
    db.add(order)
    await db.flush()

    # 创建订单项
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=order.id,
            **item_data,
        )
        db.add(order_item)
        # 更新商品销量
        product_result = await db.execute(
            select(Product).where(Product.id == item_data["product_id"])
        )
        product = product_result.scalar_one_or_none()
        if product:
            product.sales_count += item_data["quantity"]

    # 5. 删除已结算的购物车项
    for cart_item in cart_items:
        await db.delete(cart_item)

    await db.flush()
    await db.refresh(order)

    # 重新查询订单以获取关联项
    result = await db.execute(
        select(Order).where(Order.id == order.id)
    )
    order = result.scalar_one()
    # 手动加载items
    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    order_items = items_result.scalars().all()

    return {
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "address_snapshot": order.address_snapshot,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at,
        "shipped_at": order.shipped_at,
        "completed_at": order.completed_at,
        "cancelled_at": order.cancelled_at,
        "cancel_reason": order.cancel_reason,
        "remark": order.remark,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "sku_id": item.sku_id,
                "product_name": item.product_name,
                "sku_name": item.sku_name,
                "product_image": item.product_image,
                "price": item.price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            }
            for item in order_items
        ],
    }


async def get_orders(
    db: AsyncSession,
    user_id: int,
    status_filter: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """用户订单列表"""
    query = select(Order).where(Order.user_id == user_id)
    if status_filter:
        query = query.where(Order.status == status_filter)
    query = query.order_by(Order.created_at.desc())

    result = await paginate(db, query, page=page, page_size=page_size)
    orders = [row[0] for row in result["items"]]

    # 加载每个订单的订单项
    items = []
    for order in orders:
        items_result = await db.execute(
            select(OrderItem).where(OrderItem.order_id == order.id)
        )
        order_items = items_result.scalars().all()

        items.append({
            "id": order.id,
            "order_no": order.order_no,
            "user_id": order.user_id,
            "address_snapshot": order.address_snapshot,
            "total_amount": order.total_amount,
            "status": order.status,
            "payment_method": order.payment_method,
            "paid_at": order.paid_at,
            "shipped_at": order.shipped_at,
            "completed_at": order.completed_at,
            "cancelled_at": order.cancelled_at,
            "cancel_reason": order.cancel_reason,
            "remark": order.remark,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "items": [
                {
                    "id": item.id,
                    "order_id": item.order_id,
                    "product_id": item.product_id,
                    "sku_id": item.sku_id,
                    "product_name": item.product_name,
                    "sku_name": item.sku_name,
                    "product_image": item.product_image,
                    "price": item.price,
                    "quantity": item.quantity,
                    "subtotal": item.subtotal,
                }
                for item in order_items
            ],
        })

    return {
        "items": items,
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
        "total_pages": result["total_pages"],
    }


async def get_order_detail(
    db: AsyncSession,
    user_id: int,
    order_id: int,
) -> dict | None:
    """订单详情"""
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == user_id)
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        return None

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    order_items = items_result.scalars().all()

    return {
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "address_snapshot": order.address_snapshot,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at,
        "shipped_at": order.shipped_at,
        "completed_at": order.completed_at,
        "cancelled_at": order.cancelled_at,
        "cancel_reason": order.cancel_reason,
        "remark": order.remark,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "sku_id": item.sku_id,
                "product_name": item.product_name,
                "sku_name": item.sku_name,
                "product_image": item.product_image,
                "price": item.price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            }
            for item in order_items
        ],
    }


async def cancel_order(
    db: AsyncSession,
    user_id: int,
    order_id: int,
    reason: str | None = None,
) -> dict:
    """
    取消订单（恢复库存）

    状态机: pending_payment -> cancelled
    """
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == user_id)
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在",
        )

    if order.status != STATUS_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只有待支付订单可以取消",
        )

    # 恢复库存
    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    order_items = items_result.scalars().all()

    for item in order_items:
        sku_result = await db.execute(select(SKU).where(SKU.id == item.sku_id))
        sku = sku_result.scalar_one_or_none()
        if sku:
            sku.stock += item.quantity

    order.status = STATUS_CANCELLED
    order.cancelled_at = datetime.now(timezone.utc)
    order.cancel_reason = reason
    await db.flush()
    await db.refresh(order)

    # 重新查询订单项
    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    order_items = items_result.scalars().all()

    return {
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "address_snapshot": order.address_snapshot,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at,
        "shipped_at": order.shipped_at,
        "completed_at": order.completed_at,
        "cancelled_at": order.cancelled_at,
        "cancel_reason": order.cancel_reason,
        "remark": order.remark,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "sku_id": item.sku_id,
                "product_name": item.product_name,
                "sku_name": item.sku_name,
                "product_image": item.product_image,
                "price": item.price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            }
            for item in order_items
        ],
    }


async def pay_order(
    db: AsyncSession,
    user_id: int,
    order_id: int,
    payment_method: str | None = None,
) -> dict:
    """
    模拟支付

    状态机: pending_payment -> paid
    """
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == user_id)
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在",
        )

    if order.status != STATUS_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只有待支付订单可以支付",
        )

    order.status = STATUS_PAID
    order.payment_method = payment_method or "alipay"
    order.paid_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(order)

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    order_items = items_result.scalars().all()

    return {
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "address_snapshot": order.address_snapshot,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at,
        "shipped_at": order.shipped_at,
        "completed_at": order.completed_at,
        "cancelled_at": order.cancelled_at,
        "cancel_reason": order.cancel_reason,
        "remark": order.remark,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "sku_id": item.sku_id,
                "product_name": item.product_name,
                "sku_name": item.sku_name,
                "product_image": item.product_image,
                "price": item.price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            }
            for item in order_items
        ],
    }


async def confirm_order(
    db: AsyncSession,
    user_id: int,
    order_id: int,
) -> dict:
    """
    确认收货

    状态机: shipped -> completed
    """
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == user_id)
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在",
        )

    if order.status != STATUS_SHIPPED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只有已发货订单可以确认收货",
        )

    order.status = STATUS_COMPLETED
    order.completed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(order)

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    order_items = items_result.scalars().all()

    return {
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "address_snapshot": order.address_snapshot,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at,
        "shipped_at": order.shipped_at,
        "completed_at": order.completed_at,
        "cancelled_at": order.cancelled_at,
        "cancel_reason": order.cancel_reason,
        "remark": order.remark,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "sku_id": item.sku_id,
                "product_name": item.product_name,
                "sku_name": item.sku_name,
                "product_image": item.product_image,
                "price": item.price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            }
            for item in order_items
        ],
    }
