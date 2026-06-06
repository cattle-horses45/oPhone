"""购物车路由 - 需要JWT认证"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemUpdate
from app.services import cart_service

router = APIRouter(prefix="/api/v1", tags=["购物车"])


@router.get("/cart")
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取购物车列表"""
    return await cart_service.get_cart(db, current_user.id)


@router.post("/cart/items")
async def add_to_cart(
    req: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """添加商品到购物车"""
    return await cart_service.add_to_cart(
        db,
        user_id=current_user.id,
        product_id=req.product_id,
        sku_id=req.sku_id,
        quantity=req.quantity,
    )


@router.put("/cart/items/{item_id}")
async def update_cart_item(
    item_id: int,
    req: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新购物车项数量"""
    return await cart_service.update_cart_item(
        db,
        user_id=current_user.id,
        item_id=item_id,
        quantity=req.quantity,
    )


@router.delete("/cart/items/{item_id}")
async def delete_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除购物车项"""
    await cart_service.remove_cart_item(db, current_user.id, item_id)
    return {"message": "已删除"}


@router.delete("/cart")
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """清空购物车"""
    await cart_service.clear_cart(db, current_user.id)
    return {"message": "购物车已清空"}
