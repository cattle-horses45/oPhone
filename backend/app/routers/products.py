"""商品公开路由 - 商品列表、详情、分类、轮播图"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services import product_service

router = APIRouter(prefix="/api/v1", tags=["商品"])


@router.get("/products")
async def list_products(
    category_id: Optional[int] = Query(None, description="分类ID"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    sort_by: str = Query("default", description="排序方式: default, price_asc, price_desc, sales"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数"),
    db: AsyncSession = Depends(get_db),
):
    """获取商品列表（分页）"""
    return await product_service.get_products(
        db,
        category_id=category_id,
        search=search,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )


@router.get("/products/featured")
async def featured_products(
    limit: int = Query(10, ge=1, le=50, description="数量"),
    db: AsyncSession = Depends(get_db),
):
    """获取推荐商品列表"""
    items = await product_service.get_featured_products(db, limit=limit)
    return {"items": items, "total": len(items)}


@router.get("/products/{product_id}")
async def product_detail(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取商品详情（含SKU和图片）"""
    from fastapi import HTTPException, status

    detail = await product_service.get_product_detail(db, product_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="商品不存在",
        )
    return detail


@router.get("/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    """获取分类树"""
    return await product_service.get_categories(db)


@router.get("/banners")
async def list_banners(
    db: AsyncSession = Depends(get_db),
):
    """获取轮播图列表"""
    return {"items": await product_service.get_banners(db)}
