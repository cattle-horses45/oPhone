"""商品服务 - 商品查询、分类、轮播图"""
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.product import Product, SKU, ProductImage, Category, Banner
from app.utils.pagination import paginate


async def get_products(
    db: AsyncSession,
    category_id: int | None = None,
    search: str | None = None,
    sort_by: str = "default",
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """
    分页查询商品列表，每个商品附带SKU最低价

    参数:
        category_id: 分类ID筛选
        search: 关键词搜索（商品名称）
        sort_by: 排序方式 - default(默认), price_asc(价格升序), price_desc(价格降序), sales(销量)
        page: 页码
        page_size: 每页条数
    """
    # 子查询获取每个商品的最低SKU价格
    min_price_subq = (
        select(SKU.product_id, func.min(SKU.price).label("min_price"))
        .group_by(SKU.product_id)
        .subquery()
    )

    # 子查询获取每个商品的第一张图片作为封面
    cover_image_subq = (
        select(
            ProductImage.product_id,
            func.min(ProductImage.image_url).label("cover_image"),
        )
        .group_by(ProductImage.product_id)
        .subquery()
    )

    query = select(
        Product,
        func.coalesce(min_price_subq.c.min_price, 0).label("min_price"),
        cover_image_subq.c.cover_image,
    ).outerjoin(
        min_price_subq, Product.id == min_price_subq.c.product_id
    ).outerjoin(
        cover_image_subq, Product.id == cover_image_subq.c.product_id
    )

    # 条件筛选
    conditions = [Product.is_active == True]  # noqa: E712
    if category_id:
        conditions.append(Product.category_id == category_id)
    if search:
        conditions.append(Product.name.ilike(f"%{search}%"))

    query = query.where(and_(*conditions))

    # 排序
    if sort_by == "price_asc":
        query = query.order_by(func.coalesce(min_price_subq.c.min_price, 0).asc())
    elif sort_by == "price_desc":
        query = query.order_by(func.coalesce(min_price_subq.c.min_price, 0).desc())
    elif sort_by == "sales":
        query = query.order_by(Product.sales_count.desc())
    else:
        query = query.order_by(Product.id.desc())

    # 分页
    paginated = await paginate(db, query, page=page, page_size=page_size)

    # 组装返回数据
    items = []
    for product, min_price, cover_image in paginated["items"]:
        items.append({
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "category_id": product.category_id,
            "brand": product.brand,
            "is_active": product.is_active,
            "is_featured": product.is_featured,
            "sales_count": product.sales_count,
            "min_price": min_price,
            "cover_image": cover_image,
            "created_at": product.created_at.isoformat() if product.created_at else None,
        })

    return {
        "items": items,
        "total": paginated["total"],
        "page": paginated["page"],
        "page_size": paginated["page_size"],
        "total_pages": paginated["total_pages"],
    }


async def get_product_detail(db: AsyncSession, product_id: int) -> dict | None:
    """查询商品详情，包含SKU列表、图片列表、分类信息"""
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.skus),
            selectinload(Product.images),
            selectinload(Product.category),
        )
        .where(Product.id == product_id, Product.is_active == True)  # noqa: E712
    )
    product = result.scalar_one_or_none()
    if not product:
        return None

    # 计算最低价
    min_price = None
    if product.skus:
        min_price = min(sku.price for sku in product.skus if sku.price)

    # 获取封面图
    cover_image = None
    if product.images:
        cover_image = product.images[0].image_url

    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "category_id": product.category_id,
        "brand": product.brand,
        "is_active": product.is_active,
        "is_featured": product.is_featured,
        "sales_count": product.sales_count,
        "min_price": min_price,
        "cover_image": cover_image,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "category": {
            "id": product.category.id,
            "name": product.category.name,
            "slug": product.category.slug,
            "icon_url": product.category.icon_url,
            "parent_id": product.category.parent_id,
            "sort_order": product.category.sort_order,
            "is_active": product.category.is_active,
            "children": [],
        } if product.category else None,
        "skus": [
            {
                "id": sku.id,
                "product_id": sku.product_id,
                "sku_code": sku.sku_code,
                "sku_name": sku.sku_name,
                "specs": sku.specs,
                "price": sku.price,
                "stock": sku.stock,
                "image_url": sku.image_url,
            }
            for sku in product.skus
        ],
        "images": [
            {
                "id": img.id,
                "product_id": img.product_id,
                "image_url": img.image_url,
                "sort_order": img.sort_order,
            }
            for img in sorted(product.images, key=lambda x: x.sort_order)
        ],
    }


async def get_featured_products(db: AsyncSession, limit: int = 10) -> list[dict]:
    """获取推荐/首页商品列表 — 优先 featured，补充最新商品"""
    min_price_subq = (
        select(SKU.product_id, func.min(SKU.price).label("min_price"))
        .group_by(SKU.product_id)
        .subquery()
    )

    cover_image_subq = (
        select(
            ProductImage.product_id,
            func.min(ProductImage.image_url).label("cover_image"),
        )
        .group_by(ProductImage.product_id)
        .subquery()
    )

    query = (
        select(
            Product,
            func.coalesce(min_price_subq.c.min_price, 0).label("min_price"),
            cover_image_subq.c.cover_image,
        )
        .outerjoin(min_price_subq, Product.id == min_price_subq.c.product_id)
        .outerjoin(cover_image_subq, Product.id == cover_image_subq.c.product_id)
        .where(Product.is_active == True)  # noqa: E712 — 展示所有上架商品
        .order_by(Product.is_featured.desc(), Product.id.desc())
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "category_id": product.category_id,
            "brand": product.brand,
            "is_active": product.is_active,
            "is_featured": product.is_featured,
            "sales_count": product.sales_count,
            "min_price": min_price,
            "cover_image": cover_image,
            "created_at": product.created_at.isoformat() if product.created_at else None,
        }
        for product, min_price, cover_image in rows
    ]


async def get_categories(db: AsyncSession) -> list[dict]:
    """获取分类树（两级结构）"""
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)  # noqa: E712
        .order_by(Category.sort_order, Category.id)
    )
    categories = result.scalars().all()

    # 构建分类树
    category_map: dict[int, dict] = {}
    roots: list[dict] = []

    for cat in categories:
        node = {
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "icon_url": cat.icon_url,
            "parent_id": cat.parent_id,
            "sort_order": cat.sort_order,
            "is_active": cat.is_active,
            "children": [],
        }
        category_map[cat.id] = node

    for cat in categories:
        node = category_map[cat.id]
        if node["parent_id"] and node["parent_id"] in category_map:
            category_map[node["parent_id"]]["children"].append(node)
        else:
            roots.append(node)

    return roots


async def get_banners(db: AsyncSession) -> list[dict]:
    """获取启用的轮播图列表"""
    result = await db.execute(
        select(Banner)
        .where(Banner.is_active == True)  # noqa: E712
        .order_by(Banner.sort_order, Banner.id)
    )
    banners = result.scalars().all()

    return [
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
