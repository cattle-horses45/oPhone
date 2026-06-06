"""收货地址路由 - 需要JWT认证"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Address
from app.schemas.address import AddressCreate, AddressUpdate

router = APIRouter(prefix="/api/v1", tags=["收货地址"])


@router.get("/addresses")
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取用户收货地址列表"""
    result = await db.execute(
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.id.desc())
    )
    addresses = result.scalars().all()

    return {
        "items": [
            {
                "id": addr.id,
                "user_id": addr.user_id,
                "receiver_name": addr.receiver_name,
                "phone": addr.phone,
                "province": addr.province,
                "city": addr.city,
                "district": addr.district,
                "detail_address": addr.detail_address,
                "is_default": addr.is_default,
                "created_at": addr.created_at,
            }
            for addr in addresses
        ]
    }


@router.post("/addresses")
async def create_address(
    req: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """新增收货地址"""
    # 如果设为默认，取消其他默认地址
    if req.is_default:
        await db.execute(
            update(Address)
            .where(Address.user_id == current_user.id)
            .values(is_default=False)
        )

    address = Address(
        user_id=current_user.id,
        receiver_name=req.receiver_name,
        phone=req.phone,
        province=req.province,
        city=req.city,
        district=req.district,
        detail_address=req.detail_address,
        is_default=req.is_default,
    )
    db.add(address)
    await db.flush()
    await db.refresh(address)

    return {
        "id": address.id,
        "user_id": address.user_id,
        "receiver_name": address.receiver_name,
        "phone": address.phone,
        "province": address.province,
        "city": address.city,
        "district": address.district,
        "detail_address": address.detail_address,
        "is_default": address.is_default,
        "created_at": address.created_at,
    }


@router.put("/addresses/{address_id}")
async def update_address(
    address_id: int,
    req: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新收货地址"""
    result = await db.execute(
        select(Address).where(
            and_(Address.id == address_id, Address.user_id == current_user.id)
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地址不存在",
        )

    # 如果设为默认，取消其他默认地址
    if req.is_default:
        await db.execute(
            update(Address)
            .where(Address.user_id == current_user.id)
            .values(is_default=False)
        )

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(address, key, value)

    await db.flush()
    await db.refresh(address)

    return {
        "id": address.id,
        "user_id": address.user_id,
        "receiver_name": address.receiver_name,
        "phone": address.phone,
        "province": address.province,
        "city": address.city,
        "district": address.district,
        "detail_address": address.detail_address,
        "is_default": address.is_default,
        "created_at": address.created_at,
    }


@router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除收货地址"""
    result = await db.execute(
        select(Address).where(
            and_(Address.id == address_id, Address.user_id == current_user.id)
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地址不存在",
        )

    await db.delete(address)
    await db.flush()
    return {"message": "地址已删除"}


@router.put("/addresses/{address_id}/default")
async def set_default_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """设为默认地址"""
    result = await db.execute(
        select(Address).where(
            and_(Address.id == address_id, Address.user_id == current_user.id)
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地址不存在",
        )

    # 取消其他默认地址
    await db.execute(
        update(Address)
        .where(Address.user_id == current_user.id)
        .values(is_default=False)
    )

    address.is_default = True
    await db.flush()
    await db.refresh(address)

    return {
        "id": address.id,
        "user_id": address.user_id,
        "receiver_name": address.receiver_name,
        "phone": address.phone,
        "province": address.province,
        "city": address.city,
        "district": address.district,
        "detail_address": address.detail_address,
        "is_default": address.is_default,
        "created_at": address.created_at,
    }
