"""收货地址相关 Pydantic Schema"""
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field


class AddressCreate(BaseModel):
    receiver_name: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., min_length=1, max_length=20)
    province: str = Field(..., min_length=1, max_length=50)
    city: str = Field(..., min_length=1, max_length=50)
    district: str = Field(..., min_length=1, max_length=50)
    detail_address: str = Field(..., min_length=1, max_length=255)
    is_default: bool = False


class AddressUpdate(BaseModel):
    receiver_name: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = Field(None, min_length=1, max_length=20)
    province: Optional[str] = Field(None, min_length=1, max_length=50)
    city: Optional[str] = Field(None, min_length=1, max_length=50)
    district: Optional[str] = Field(None, min_length=1, max_length=50)
    detail_address: Optional[str] = Field(None, min_length=1, max_length=255)
    is_default: Optional[bool] = None


class AddressResponse(BaseModel):
    id: int
    user_id: int
    receiver_name: str
    phone: str
    province: str
    city: str
    district: str
    detail_address: str
    is_default: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
