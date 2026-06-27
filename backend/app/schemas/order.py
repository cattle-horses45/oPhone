"""订单相关 Pydantic Schema"""
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field


class OrderCreate(BaseModel):
    address_id: Optional[int] = Field(None, description="收货地址ID（已保存地址时使用）")
    receiver_name: Optional[str] = Field(None, max_length=50, description="收货人姓名")
    phone: Optional[str] = Field(None, max_length=20, description="手机号码")
    detail_address: Optional[str] = Field(None, max_length=255, description="详细地址")
    cart_item_ids: Optional[list[int]] = Field(None, min_length=1, description="要结算的购物车项ID列表")
    remark: Optional[str] = Field(None, max_length=500)


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    sku_id: int
    product_name: str
    sku_name: str
    product_image: Optional[str] = None
    price: float
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    order_no: str
    user_id: int
    address_snapshot: dict
    total_amount: float
    status: str
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    remark: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
