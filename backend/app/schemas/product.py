"""商品相关 Pydantic Schema"""
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field


class SKUResponse(BaseModel):
    id: int
    product_id: int
    sku_code: str
    sku_name: str
    specs: dict
    price: float
    stock: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon_url: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: int = 0
    is_active: bool = True
    children: list["CategoryResponse"] = []

    class Config:
        from_attributes = True


class BannerResponse(BaseModel):
    id: int
    title: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    category_id: int
    brand: str = "oPhone"
    is_active: bool = True
    is_featured: bool = False
    sales_count: int = 0
    min_price: Optional[float] = None
    cover_image: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductDetail(ProductResponse):
    category: Optional[CategoryResponse] = None
    skus: list[SKUResponse] = []
    images: list["ProductImageResponse"] = []

    class Config:
        from_attributes = True


class ProductImageResponse(BaseModel):
    id: int
    product_id: int
    image_url: str
    sort_order: int = 0

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
