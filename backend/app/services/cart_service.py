"""购物车服务 - 添加、修改、删除、清空"""
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.cart import CartItem
from app.models.product import SKU, Product, ProductImage
from app.utils.pagination import paginate


async def get_cart(db: AsyncSession, user_id: int) -> dict:
    """获取用户的购物车列表，包含商品和SKU详情"""
    # 查询购物车项
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .order_by(CartItem.created_at.desc())
    )
    cart_items = result.scalars().all()

    items = []
    total_amount = 0.0

    for item in cart_items:
        # 查询关联的SKU和商品信息
        sku_result = await db.execute(select(SKU).where(SKU.id == item.sku_id))
        sku = sku_result.scalar_one_or_none()

        product_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        product = product_result.scalar_one_or_none()

        # 获取商品封面图
        image_url = None
        if product:
            img_result = await db.execute(
                select(ProductImage.image_url)
                .where(ProductImage.product_id == product.id)
                .order_by(ProductImage.sort_order)
                .limit(1)
            )
            cover = img_result.scalar_one_or_none()
            image_url = cover

        price = sku.price if sku else 0
        subtotal = price * item.quantity
        total_amount += subtotal

        items.append({
            "id": item.id,
            "user_id": item.user_id,
            "product_id": item.product_id,
            "sku_id": item.sku_id,
            "quantity": item.quantity,
            "created_at": item.created_at,
            "product_name": product.name if product else None,
            "product_image": image_url,
            "sku_name": sku.sku_name if sku else None,
            "sku_code": sku.sku_code if sku else None,
            "specs": sku.specs if sku else None,
            "price": price,
            "stock": sku.stock if sku else None,
        })

    return {
        "items": items,
        "total_count": len(items),
        "total_amount": round(total_amount, 2),
    }


async def add_to_cart(
    db: AsyncSession,
    user_id: int,
    product_id: int,
    sku_id: int,
    quantity: int = 1,
) -> dict:
    """添加商品到购物车，如已存在则累加数量"""
    # 校验SKU是否存在且属于该商品
    sku_result = await db.execute(
        select(SKU).where(SKU.id == sku_id, SKU.product_id == product_id)
    )
    sku = sku_result.scalar_one_or_none()
    if not sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SKU不存在或不属于该商品",
        )

    # 校验商品是否存在且活跃
    product_result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.is_active == True,  # noqa: E712
        )
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在或已下架",
        )

    # 检查库存
    if sku.stock < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="库存不足",
        )

    # 查找是否已存在相同的购物车项
    result = await db.execute(
        select(CartItem).where(
            and_(CartItem.user_id == user_id, CartItem.sku_id == sku_id)
        )
    )
    existing_item = result.scalar_one_or_none()

    if existing_item:
        # 累加数量
        new_quantity = existing_item.quantity + quantity
        if new_quantity > sku.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="超过最大库存",
            )
        existing_item.quantity = new_quantity
        await db.flush()
        await db.refresh(existing_item)
        return {
            "id": existing_item.id,
            "user_id": existing_item.user_id,
            "product_id": existing_item.product_id,
            "sku_id": existing_item.sku_id,
            "quantity": existing_item.quantity,
            "message": "购物车数量已更新",
        }
    else:
        cart_item = CartItem(
            user_id=user_id,
            product_id=product_id,
            sku_id=sku_id,
            quantity=quantity,
        )
        db.add(cart_item)
        await db.flush()
        await db.refresh(cart_item)
        return {
            "id": cart_item.id,
            "user_id": cart_item.user_id,
            "product_id": cart_item.product_id,
            "sku_id": cart_item.sku_id,
            "quantity": cart_item.quantity,
            "message": "已添加到购物车",
        }


async def update_cart_item(
    db: AsyncSession,
    user_id: int,
    item_id: int,
    quantity: int,
) -> dict:
    """更新购物车项数量"""
    result = await db.execute(
        select(CartItem).where(
            and_(CartItem.id == item_id, CartItem.user_id == user_id)
        )
    )
    cart_item = result.scalar_one_or_none()
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="购物车项不存在",
        )

    # 检查库存
    sku_result = await db.execute(select(SKU).where(SKU.id == cart_item.sku_id))
    sku = sku_result.scalar_one_or_none()
    if sku and quantity > sku.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="库存不足",
        )

    cart_item.quantity = quantity
    await db.flush()
    await db.refresh(cart_item)
    return {
        "id": cart_item.id,
        "user_id": cart_item.user_id,
        "product_id": cart_item.product_id,
        "sku_id": cart_item.sku_id,
        "quantity": cart_item.quantity,
    }


async def remove_cart_item(
    db: AsyncSession,
    user_id: int,
    item_id: int,
) -> None:
    """删除购物车项"""
    result = await db.execute(
        select(CartItem).where(
            and_(CartItem.id == item_id, CartItem.user_id == user_id)
        )
    )
    cart_item = result.scalar_one_or_none()
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="购物车项不存在",
        )

    await db.delete(cart_item)
    await db.flush()


async def clear_cart(db: AsyncSession, user_id: int) -> None:
    """清空用户购物车"""
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == user_id)
    )
    cart_items = result.scalars().all()
    for item in cart_items:
        await db.delete(item)
    await db.flush()
