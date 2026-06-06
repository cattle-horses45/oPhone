"""oPhone Store - FastAPI 应用入口"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db, async_session_factory
from app.utils.security import decode_access_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期 - 启动时初始化数据库"""
    await init_db()
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "products"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "banners"), exist_ok=True)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="oPhone 官方商城 - AI智能客服电商平台",
    lifespan=lifespan,
)

# CORS 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件挂载
uploads_path = os.path.abspath(settings.UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# ==================== 注册 REST 路由 ====================

from app.routers import auth, products, cart, orders, addresses, chat, upload, admin

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(addresses.router)
app.include_router(chat.router)
app.include_router(upload.router)
app.include_router(admin.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


# ==================== WebSocket 端点 ====================

@app.websocket("/ws/chat/{session_id}")
async def ws_chat(websocket: WebSocket, session_id: int):
    """用户聊天 WebSocket"""
    from app.models.user import User
    from sqlalchemy import select

    # 从查询参数获取 token
    token = websocket.query_params.get("token", "")
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001, reason="认证失败")
        return

    user_id = int(payload.get("sub", 0))
    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=4001, reason="用户不存在")
            return

        from app.ws.chat_ws import handle_chat_ws
        await handle_chat_ws(websocket, session_id, db)


@app.websocket("/ws/admin/chat/{session_id}")
async def ws_admin_chat(websocket: WebSocket, session_id: int):
    """管理员聊天 WebSocket"""
    from app.models.user import User
    from sqlalchemy import select

    token = websocket.query_params.get("token", "")
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001, reason="认证失败")
        return

    user_id = int(payload.get("sub", 0))
    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=4001, reason="用户不存在")
            return
        if user.role != "admin":
            await websocket.close(code=4003, reason="需要管理员权限")
            return

        from app.ws.admin_ws import handle_admin_chat_ws
        await handle_admin_chat_ws(websocket, session_id, user, db)


@app.websocket("/ws/admin/queue")
async def ws_admin_queue(websocket: WebSocket):
    """管理员队列监听 WebSocket"""
    from app.models.user import User
    from sqlalchemy import select

    token = websocket.query_params.get("token", "")
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001, reason="认证失败")
        return

    user_id = int(payload.get("sub", 0))
    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=4001, reason="用户不存在")
            return
        if user.role != "admin":
            await websocket.close(code=4003, reason="需要管理员权限")
            return

        from app.ws.admin_ws import handle_admin_queue_ws
        await handle_admin_queue_ws(websocket, user)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
