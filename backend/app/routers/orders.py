"""订单路由 - 需要JWT认证"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.order import OrderCreate
from app.services import order_service

router = APIRouter(prefix="/api/v1", tags=["订单"])


@router.post("/orders")
async def create_order(
    req: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建订单（从购物车下单）"""
    return await order_service.create_order(
        db,
        user_id=current_user.id,
        address_id=req.address_id,
        cart_item_ids=req.cart_item_ids,
        remark=req.remark,
    )


@router.get("/orders")
async def list_orders(
    status: Optional[str] = Query(None, description="订单状态筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取用户订单列表"""
    return await order_service.get_orders(
        db,
        user_id=current_user.id,
        status_filter=status,
        page=page,
        page_size=page_size,
    )


@router.get("/orders/{order_id}")
async def order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取订单详情"""
    from fastapi import HTTPException, status

    detail = await order_service.get_order_detail(db, current_user.id, order_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在",
        )
    return detail


@router.put("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    reason: Optional[str] = Query(None, description="取消原因"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取消订单（恢复库存）"""
    return await order_service.cancel_order(db, current_user.id, order_id, reason)


@router.put("/orders/{order_id}/pay")
async def pay_order(
    order_id: int,
    payment_method: str = Query("alipay", description="支付方式"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """模拟支付订单"""
    return await order_service.pay_order(db, current_user.id, order_id, payment_method)


@router.put("/orders/{order_id}/confirm")
async def confirm_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """确认收货"""
    return await order_service.confirm_order(db, current_user.id, order_id)
