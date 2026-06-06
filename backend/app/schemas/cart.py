"""购物车相关 Pydantic Schema"""
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    product_id: int = Field(..., description="商品ID")
    sku_id: int = Field(..., description="SKU ID")
    quantity: int = Field(1, ge=1, description="数量")


class CartItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    sku_id: int
    quantity: int
    created_at: Optional[datetime] = None
    # 商品和SKU详情
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    sku_name: Optional[str] = None
    sku_code: Optional[str] = None
    specs: Optional[dict] = None
    price: Optional[float] = None
    stock: Optional[int] = None

    class Config:
        from_attributes = True


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, description="新数量")


class CartListResponse(BaseModel):
    items: list[CartItemResponse]
    total_count: int
    total_amount: float
