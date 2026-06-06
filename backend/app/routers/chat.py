"""客服路由 - REST API"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services import chat_service

router = APIRouter(prefix="/api/v1/chat", tags=["客服"])


class CreateSessionRequest(BaseModel):
    pass


class TransferRequest(BaseModel):
    reason: str = "用户请求转人工"


@router.get("/sessions")
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取我的聊天会话列表"""
    return await chat_service.get_user_sessions(db, current_user.id)


@router.post("/sessions")
async def create_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建新的AI客服会话"""
    session = await chat_service.create_session(db, current_user.id)
    return {
        "id": session.id,
        "session_type": session.session_type,
        "status": session.status,
        "created_at": session.created_at.isoformat() if session.created_at else None,
    }


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取会话消息历史"""
    return await chat_service.get_session_messages(db, session_id, current_user.id)


@router.post("/sessions/{session_id}/transfer")
async def transfer_session(
    session_id: int,
    req: TransferRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """请求转人工客服"""
    return await chat_service.transfer_to_human(
        db, session_id, current_user.id, req.reason
    )


@router.post("/sessions/{session_id}/close")
async def close_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """关闭会话"""
    return await chat_service.close_session(db, session_id, current_user.id)
