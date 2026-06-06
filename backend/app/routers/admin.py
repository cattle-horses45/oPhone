"""管理后台路由 - 仪表盘、商品/订单/用户/分类/轮播/知识库管理"""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, update

from app.database import get_db
from app.dependencies import admin_required, get_current_user
from app.models.user import User
from app.models.product import Product, Category, SKU, ProductImage, Banner
from app.models.order import Order, OrderItem
from app.models.knowledge import KnowledgeItem
from app.services import admin_service
from app.utils.pagination import paginate

router = APIRouter(prefix="/api/v1/admin", tags=["管理后台"])


# ==================== 仪表盘 ====================

@router.get("/dashboard")
async def get_dashboard(
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """管理后台仪表盘统计数据"""
    stats = await admin_service.get_dashboard_stats(db)

    # 最近订单
    result = await db.execute(
        select(Order).order_by(desc(Order.created_at)).limit(10)
    )
    recent_orders = result.scalars().all()

    return {
        "stats": {
            "user_count": stats["total_users"],
            "product_count": stats["total_products"],
            "order_count": stats["total_orders"],
            "today_orders": stats["today_orders"],
            "revenue": stats["total_revenue"],
            "month_revenue": stats["month_revenue"],
            "knowledge_count": stats["total_knowledge"],
            "order_status": stats["order_status"],
        },
        "recent_orders": [
            {
                "id": o.id,
                "order_no": o.order_no,
                "status": o.status,
                "total_amount": o.total_amount,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in recent_orders
        ],
    }


# ==================== 用户管理 ====================

@router.get("/users")
async def admin_list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """管理端用户列表"""
    query = select(User)
    if search:
        query = query.where(
            User.username.contains(search) | User.email.contains(search)
        )
    query = query.order_by(desc(User.created_at))

    result = await paginate(db, query, page, page_size)
    users = []
    for row in result["items"]:
        u = row[0]
        users.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "avatar_url": u.avatar_url,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {**result, "items": users}


@router.put("/users/{user_id}/toggle-active")
async def admin_toggle_user(
    user_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """启用/禁用用户"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "用户不存在")
    if user.role == "admin":
        raise HTTPException(400, "不能禁用管理员账号")
    user.is_active = not user.is_active
    await db.flush()
    return {
        "id": user.id,
        "username": user.username,
        "is_active": user.is_active,
        "message": "用户已启用" if user.is_active else "用户已禁用",
    }


# ==================== 分类管理 ====================

@router.get("/categories")
async def admin_list_categories(
    all: bool = Query(False, description="是否包含禁用分类"),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """管理端分类列表（平铺）"""
    query = select(Category)
    if not all:
        query = query.where(Category.is_active == True)  # noqa: E712
    query = query.order_by(Category.sort_order, Category.id)
    result = await db.execute(query)
    categories = result.scalars().all()
    return {
        "items": [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "icon_url": c.icon_url,
                "parent_id": c.parent_id,
                "sort_order": c.sort_order,
                "is_active": c.is_active,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in categories
        ]
    }


@router.post("/categories")
async def admin_create_category(
    name: str = Query(..., description="分类名称"),
    slug: str = Query(..., description="URL别名"),
    icon_url: Optional[str] = Query(None),
    parent_id: Optional[int] = Query(None),
    sort_order: int = Query(0),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """创建分类"""
    # 检查slug唯一性
    result = await db.execute(select(Category).where(Category.slug == slug))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="分类别名已存在"
        )

    category = Category(
        name=name,
        slug=slug,
        icon_url=icon_url,
        parent_id=parent_id,
        sort_order=sort_order,
    )
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
        "icon_url": category.icon_url,
        "parent_id": category.parent_id,
        "sort_order": category.sort_order,
        "is_active": category.is_active,
    }


@router.put("/categories/{category_id}")
async def admin_update_category(
    category_id: int,
    name: Optional[str] = Query(None),
    slug: Optional[str] = Query(None),
    icon_url: Optional[str] = Query(None),
    parent_id: Optional[int] = Query(None),
    sort_order: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """更新分类"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="分类不存在")

    if name is not None:
        category.name = name
    if slug is not None:
        category.slug = slug
    if icon_url is not None:
        category.icon_url = icon_url
    if parent_id is not None:
        category.parent_id = parent_id
    if sort_order is not None:
        category.sort_order = sort_order
    if is_active is not None:
        category.is_active = is_active

    await db.flush()
    await db.refresh(category)
    return {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
        "is_active": category.is_active,
        "message": "分类已更新",
    }


@router.delete("/categories/{category_id}")
async def admin_delete_category(
    category_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """删除分类"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="分类不存在")

    # 检查是否有子分类
    child_result = await db.execute(
        select(func.count()).select_from(Category).where(Category.parent_id == category_id)
    )
    if child_result.scalar() > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="请先删除子分类"
        )

    await db.delete(category)
    await db.flush()
    return {"message": "分类已删除"}


# ==================== 商品管理 ====================

@router.get("/products")
async def admin_list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    category_id: int = Query(None),
    is_active: Optional[bool] = Query(None),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """管理端商品列表"""
    query = select(Product)
    conditions = []
    if search:
        conditions.append(Product.name.contains(search))
    if category_id:
        conditions.append(Product.category_id == category_id)
    if is_active is not None:
        conditions.append(Product.is_active == is_active)
    if conditions:
        query = query.where(and_(*conditions))
    query = query.order_by(desc(Product.created_at))

    result = await paginate(db, query, page, page_size)
    products = []
    for row in result["items"]:
        p = row[0]
        # 获取最低价
        min_price = await db.scalar(
            select(func.min(SKU.price)).where(SKU.product_id == p.id)
        )
        # 获取总库存
        total_stock = await db.scalar(
            select(func.coalesce(func.sum(SKU.stock), 0)).where(SKU.product_id == p.id)
        )
        # 获取封面图
        cover_image = await db.scalar(
            select(ProductImage.image_url)
            .where(ProductImage.product_id == p.id)
            .order_by(ProductImage.sort_order)
            .limit(1)
        )
        products.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "category_id": p.category_id,
            "brand": p.brand,
            "is_active": p.is_active,
            "is_featured": p.is_featured,
            "sales_count": p.sales_count,
            "min_price": float(min_price) if min_price else 0,
            "total_stock": total_stock,
            "cover_image": cover_image,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })

    return {**result, "items": products}


@router.post("/products")
async def admin_create_product(
    name: str = Query(..., description="商品名称"),
    slug: str = Query(..., description="URL别名"),
    category_id: int = Query(..., description="分类ID"),
    brand: str = Query("oPhone", description="品牌"),
    description: Optional[str] = Query(None, description="商品描述"),
    is_featured: bool = Query(False, description="是否为推荐商品"),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """创建商品"""
    product = Product(
        name=name,
        slug=slug,
        category_id=category_id,
        brand=brand,
        description=description,
        is_featured=is_featured,
    )
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "category_id": product.category_id,
        "brand": product.brand,
        "is_active": product.is_active,
        "is_featured": product.is_featured,
        "message": "商品已创建",
    }


@router.put("/products/{product_id}")
async def admin_update_product(
    product_id: int,
    name: Optional[str] = Query(None),
    slug: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    brand: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    is_featured: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """更新商品信息"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在"
        )

    if name is not None:
        product.name = name
    if slug is not None:
        product.slug = slug
    if category_id is not None:
        product.category_id = category_id
    if brand is not None:
        product.brand = brand
    if description is not None:
        product.description = description
    if is_featured is not None:
        product.is_featured = is_featured
    if is_active is not None:
        product.is_active = is_active

    await db.flush()
    await db.refresh(product)
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "is_active": product.is_active,
        "message": "商品已更新",
    }


@router.put("/products/{product_id}/toggle")
async def admin_toggle_product(
    product_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """上架/下架商品"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    product.is_active = not product.is_active
    await db.flush()
    return {"id": product.id, "is_active": product.is_active}


@router.delete("/products/{product_id}")
async def admin_delete_product(
    product_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """删除商品"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    await db.delete(product)
    await db.flush()
    return {"message": "商品已删除"}


# ==================== SKU管理 ====================

@router.get("/products/{product_id}/skus")
async def admin_list_skus(
    product_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """获取商品的SKU列表"""
    result = await db.execute(
        select(SKU).where(SKU.product_id == product_id).order_by(SKU.id)
    )
    skus = result.scalars().all()
    return {
        "items": [
            {
                "id": s.id,
                "product_id": s.product_id,
                "sku_code": s.sku_code,
                "sku_name": s.sku_name,
                "specs": s.specs,
                "price": s.price,
                "stock": s.stock,
                "image_url": s.image_url,
            }
            for s in skus
        ]
    }


@router.post("/products/{product_id}/skus")
async def admin_create_sku(
    product_id: int,
    sku_name: str = Query(..., description="SKU名称"),
    sku_code: str = Query(..., description="SKU编码"),
    price: float = Query(..., gt=0, description="价格"),
    stock: int = Query(0, ge=0, description="库存"),
    specs: str = Query("{}", description="规格JSON字符串"),
    image_url: Optional[str] = Query(None, description="SKU图片URL"),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """创建SKU"""
    # 验证商品存在
    product_result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在"
        )

    # 检查sku_code唯一性
    code_result = await db.execute(select(SKU).where(SKU.sku_code == sku_code))
    if code_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="SKU编码已存在"
        )

    try:
        specs_data = json.loads(specs)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="规格JSON格式错误"
        )

    sku = SKU(
        product_id=product_id,
        sku_name=sku_name,
        sku_code=sku_code,
        price=price,
        stock=stock,
        specs=specs_data,
        image_url=image_url,
    )
    db.add(sku)
    await db.flush()
    await db.refresh(sku)
    return {
        "id": sku.id,
        "product_id": sku.product_id,
        "sku_code": sku.sku_code,
        "sku_name": sku.sku_name,
        "specs": sku.specs,
        "price": sku.price,
        "stock": sku.stock,
        "image_url": sku.image_url,
    }


@router.put("/skus/{sku_id}")
async def admin_update_sku(
    sku_id: int,
    sku_name: Optional[str] = Query(None),
    price: Optional[float] = Query(None, gt=0),
    stock: Optional[int] = Query(None, ge=0),
    specs: Optional[str] = Query(None, description="规格JSON字符串"),
    image_url: Optional[str] = Query(None),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """更新SKU"""
    result = await db.execute(select(SKU).where(SKU.id == sku_id))
    sku = result.scalar_one_or_none()
    if not sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="SKU不存在"
        )

    if sku_name is not None:
        sku.sku_name = sku_name
    if price is not None:
        sku.price = price
    if stock is not None:
        sku.stock = stock
    if specs is not None:
        try:
            sku.specs = json.loads(specs)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="规格JSON格式错误"
            )
    if image_url is not None:
        sku.image_url = image_url

    await db.flush()
    await db.refresh(sku)
    return {
        "id": sku.id,
        "sku_code": sku.sku_code,
        "sku_name": sku.sku_name,
        "price": sku.price,
        "stock": sku.stock,
        "message": "SKU已更新",
    }


@router.delete("/skus/{sku_id}")
async def admin_delete_sku(
    sku_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """删除SKU"""
    result = await db.execute(select(SKU).where(SKU.id == sku_id))
    sku = result.scalar_one_or_none()
    if not sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="SKU不存在"
        )

    await db.delete(sku)
    await db.flush()
    return {"message": "SKU已删除"}


# ==================== 商品图片管理 ====================

@router.post("/products/{product_id}/images")
async def admin_add_product_image(
    product_id: int,
    image_url: str = Query(..., description="图片URL"),
    sort_order: int = Query(0, description="排序"),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """添加商品图片"""
    image = ProductImage(
        product_id=product_id,
        image_url=image_url,
        sort_order=sort_order,
    )
    db.add(image)
    await db.flush()
    await db.refresh(image)
    return {
        "id": image.id,
        "product_id": image.product_id,
        "image_url": image.image_url,
        "sort_order": image.sort_order,
    }


@router.delete("/product-images/{image_id}")
async def admin_delete_product_image(
    image_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """删除商品图片"""
    result = await db.execute(
        select(ProductImage).where(ProductImage.id == image_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="图片不存在"
        )

    await db.delete(image)
    await db.flush()
    return {"message": "图片已删除"}


# ==================== 订单管理 ====================

@router.get("/orders")
async def admin_list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str = Query("", alias="status"),
    search: str = Query(""),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """管理端订单列表"""
    query = select(Order)
    if status_filter:
        query = query.where(Order.status == status_filter)
    if search:
        query = query.where(Order.order_no.contains(search))
    query = query.order_by(desc(Order.created_at))

    result = await paginate(db, query, page, page_size)
    orders = []
    for row in result["items"]:
        o = row[0]
        orders.append({
            "id": o.id,
            "order_no": o.order_no,
            "user_id": o.user_id,
            "total_amount": o.total_amount,
            "status": o.status,
            "payment_method": o.payment_method,
            "paid_at": o.paid_at.isoformat() if o.paid_at else None,
            "shipped_at": o.shipped_at.isoformat() if o.shipped_at else None,
            "completed_at": o.completed_at.isoformat() if o.completed_at else None,
            "cancelled_at": o.cancelled_at.isoformat() if o.cancelled_at else None,
            "cancel_reason": o.cancel_reason,
            "remark": o.remark,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })

    return {**result, "items": orders}


@router.get("/orders/{order_id}")
async def admin_get_order(
    order_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """管理端订单详情"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    items = items_result.scalars().all()

    return {
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "address_snapshot": order.address_snapshot,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
        "completed_at": order.completed_at.isoformat() if order.completed_at else None,
        "cancelled_at": order.cancelled_at.isoformat() if order.cancelled_at else None,
        "cancel_reason": order.cancel_reason,
        "remark": order.remark,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "items": [
            {
                "id": i.id,
                "product_id": i.product_id,
                "sku_id": i.sku_id,
                "product_name": i.product_name,
                "sku_name": i.sku_name,
                "product_image": i.product_image,
                "price": i.price,
                "quantity": i.quantity,
                "subtotal": i.subtotal,
            }
            for i in items
        ],
    }


@router.put("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: int,
    status_new: str = Query(..., alias="status", description="新状态: paid, shipped, completed, cancelled"),
    cancel_reason: Optional[str] = Query(None, description="取消原因"),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """更新订单状态（管理端）"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在"
        )

    valid_statuses = ["paid", "shipped", "completed", "cancelled"]
    if status_new not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效状态，可选: {valid_statuses}",
        )

    from datetime import datetime, timezone

    # 发货操作
    if status_new == "shipped":
        if order.status != "paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只有已支付订单可以发货",
            )
        order.status = "shipped"
        order.shipped_at = datetime.now(timezone.utc)

    # 取消操作（恢复库存）
    elif status_new == "cancelled":
        if order.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="已完成的订单不可取消",
            )
        # 如果之前不是已取消状态，恢复库存
        if order.status != "cancelled":
            items_result = await db.execute(
                select(OrderItem).where(OrderItem.order_id == order.id)
            )
            for item in items_result.scalars().all():
                sku_result = await db.execute(
                    select(SKU).where(SKU.id == item.sku_id)
                )
                sku = sku_result.scalar_one_or_none()
                if sku:
                    sku.stock += item.quantity
        order.status = "cancelled"
        order.cancelled_at = datetime.now(timezone.utc)
        if cancel_reason:
            order.cancel_reason = cancel_reason

    # 完成订单
    elif status_new == "completed":
        order.status = "completed"
        order.completed_at = datetime.now(timezone.utc)

    else:
        order.status = status_new

    await db.flush()
    await db.refresh(order)
    return {
        "id": order.id,
        "order_no": order.order_no,
        "status": order.status,
        "message": "订单状态已更新",
    }


# ==================== 轮播图管理 ====================

@router.get("/banners")
async def admin_list_banners(
    all: bool = Query(False, description="是否包含禁用轮播图"),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """轮播图列表"""
    query = select(Banner)
    if not all:
        query = query.where(Banner.is_active == True)  # noqa: E712
    query = query.order_by(Banner.sort_order, Banner.id)
    result = await db.execute(query)
    banners = result.scalars().all()
    return {
        "items": [
            {
                "id": b.id,
                "title": b.title,
                "image_url": b.image_url,
                "link_url": b.link_url,
                "sort_order": b.sort_order,
                "is_active": b.is_active,
            }
            for b in banners
        ]
    }


@router.post("/banners")
async def admin_create_banner(
    image_url: str = Query(..., description="图片URL"),
    title: Optional[str] = Query(None, description="标题"),
    link_url: Optional[str] = Query(None, description="链接URL"),
    sort_order: int = Query(0, description="排序"),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """创建轮播图"""
    banner = Banner(
        title=title,
        image_url=image_url,
        link_url=link_url,
        sort_order=sort_order,
    )
    db.add(banner)
    await db.flush()
    await db.refresh(banner)
    return {
        "id": banner.id,
        "title": banner.title,
        "image_url": banner.image_url,
        "link_url": banner.link_url,
        "sort_order": banner.sort_order,
        "is_active": banner.is_active,
    }


@router.put("/banners/{banner_id}")
async def admin_update_banner(
    banner_id: int,
    title: Optional[str] = Query(None),
    image_url: Optional[str] = Query(None),
    link_url: Optional[str] = Query(None),
    sort_order: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """更新轮播图"""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="轮播图不存在"
        )

    if title is not None:
        banner.title = title
    if image_url is not None:
        banner.image_url = image_url
    if link_url is not None:
        banner.link_url = link_url
    if sort_order is not None:
        banner.sort_order = sort_order
    if is_active is not None:
        banner.is_active = is_active

    await db.flush()
    await db.refresh(banner)
    return {
        "id": banner.id,
        "title": banner.title,
        "image_url": banner.image_url,
        "is_active": banner.is_active,
        "message": "轮播图已更新",
    }


@router.delete("/banners/{banner_id}")
async def admin_delete_banner(
    banner_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """删除轮播图"""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="轮播图不存在"
        )

    await db.delete(banner)
    await db.flush()
    return {"message": "轮播图已删除"}


# ==================== 知识库管理 ====================

@router.get("/knowledge")
async def admin_list_knowledge(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """知识库列表"""
    query = select(KnowledgeItem)
    conditions = []
    if search:
        conditions.append(
            KnowledgeItem.question.contains(search)
            | KnowledgeItem.answer.contains(search)
            | KnowledgeItem.keywords.contains(search)
        )
    if category:
        conditions.append(KnowledgeItem.category == category)
    if is_active is not None:
        conditions.append(KnowledgeItem.is_active == is_active)
    if conditions:
        query = query.where(and_(*conditions))
    query = query.order_by(desc(KnowledgeItem.priority), desc(KnowledgeItem.updated_at))

    result = await paginate(db, query, page, page_size)
    items = []
    for row in result["items"]:
        k = row[0]
        items.append({
            "id": k.id,
            "question": k.question,
            "answer": k.answer,
            "category": k.category,
            "keywords": k.keywords,
            "priority": k.priority,
            "is_active": k.is_active,
            "created_at": k.created_at.isoformat() if k.created_at else None,
            "updated_at": k.updated_at.isoformat() if k.updated_at else None,
        })

    return {**result, "items": items}


@router.post("/knowledge")
async def admin_create_knowledge(
    question: str = Query(..., description="问题"),
    answer: str = Query(..., description="答案"),
    category: str = Query("general", description="分类: product, order, aftersale, general"),
    keywords: Optional[str] = Query(None, description="逗号分隔的关键词"),
    priority: int = Query(0, description="优先级"),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """创建知识库条目"""
    knowledge = KnowledgeItem(
        question=question,
        answer=answer,
        category=category,
        keywords=keywords,
        priority=priority,
    )
    db.add(knowledge)
    await db.flush()
    await db.refresh(knowledge)
    return {
        "id": knowledge.id,
        "question": knowledge.question,
        "answer": knowledge.answer,
        "category": knowledge.category,
        "keywords": knowledge.keywords,
        "priority": knowledge.priority,
        "is_active": knowledge.is_active,
        "message": "知识库条目已创建",
    }


@router.put("/knowledge/{knowledge_id}")
async def admin_update_knowledge(
    knowledge_id: int,
    question: Optional[str] = Query(None),
    answer: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    keywords: Optional[str] = Query(None),
    priority: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """更新知识库条目"""
    result = await db.execute(
        select(KnowledgeItem).where(KnowledgeItem.id == knowledge_id)
    )
    knowledge = result.scalar_one_or_none()
    if not knowledge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="知识库条目不存在"
        )

    if question is not None:
        knowledge.question = question
    if answer is not None:
        knowledge.answer = answer
    if category is not None:
        knowledge.category = category
    if keywords is not None:
        knowledge.keywords = keywords
    if priority is not None:
        knowledge.priority = priority
    if is_active is not None:
        knowledge.is_active = is_active

    await db.flush()
    await db.refresh(knowledge)
    return {
        "id": knowledge.id,
        "question": knowledge.question,
        "message": "知识库条目已更新",
    }


@router.delete("/knowledge/{knowledge_id}")
async def admin_delete_knowledge(
    knowledge_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """删除知识库条目"""
    result = await db.execute(
        select(KnowledgeItem).where(KnowledgeItem.id == knowledge_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="知识条目不存在")

    await db.delete(item)
    await db.flush()
    return {"message": "知识条目已删除"}


# ==================== 人工客服管理 ====================

@router.get("/chat/queue")
async def admin_chat_queue(admin: User = Depends(admin_required)):
    """获取转人工等待队列"""
    from app.ws.manager import manager
    return {"queue": manager.get_queue(), "count": len(manager.transfer_queue)}


@router.post("/chat/sessions/{session_id}/accept")
async def admin_accept_chat(
    session_id: int,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """接受转接会话"""
    from app.models.chat import ChatSession
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")

    session.admin_id = admin.id
    session.session_type = "human"
    session.status = "active"
    await db.flush()

    return {"session_id": session.id, "message": "已接受会话", "admin_name": admin.full_name}
