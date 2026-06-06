"""文件上传路由"""
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.config import settings
from app.dependencies import admin_required
from app.models.user import User

router = APIRouter(prefix="/api/v1/upload", tags=["文件上传"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    admin: User = Depends(admin_required),
):
    """上传图片（仅管理员）"""
    # 验证文件类型
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"不支持的文件类型: {ext}")

    # 验证文件大小
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(400, "文件大小超过限制")

    # 生成唯一文件名
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, "products")
    os.makedirs(upload_path, exist_ok=True)

    file_path = os.path.join(upload_path, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    url = f"/uploads/products/{filename}"
    return {"url": url, "filename": filename}


@router.post("/banner")
async def upload_banner(
    file: UploadFile = File(...),
    admin: User = Depends(admin_required),
):
    """上传轮播图（仅管理员）"""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"不支持的文件类型: {ext}")

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(400, "文件大小超过限制")

    filename = f"{uuid.uuid4().hex}{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, "banners")
    os.makedirs(upload_path, exist_ok=True)

    file_path = os.path.join(upload_path, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    url = f"/uploads/banners/{filename}"
    return {"url": url, "filename": filename}
