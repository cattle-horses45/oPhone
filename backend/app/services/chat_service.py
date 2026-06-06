"""客服服务 - 会话管理"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException, status

from app.models.chat import ChatSession, ChatMessage


async def create_session(db: AsyncSession, user_id: int) -> ChatSession:
    """创建新的AI客服会话"""
    session = ChatSession(
        user_id=user_id,
        session_type="ai",
        status="active",
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


async def get_user_sessions(db: AsyncSession, user_id: int) -> list[dict]:
    """获取用户的会话列表"""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(desc(ChatSession.updated_at))
    )
    sessions = result.scalars().all()

    session_list = []
    for s in sessions:
        # 获取最后一条消息作为预览
        msg_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == s.id)
            .order_by(desc(ChatMessage.created_at))
            .limit(1)
        )
        last_msg = msg_result.scalar_one_or_none()

        session_list.append({
            "id": s.id,
            "session_type": s.session_type,
            "status": s.status,
            "last_message": last_msg.content[:50] if last_msg else "新会话",
            "last_message_time": last_msg.created_at.isoformat() if last_msg and last_msg.created_at else s.created_at.isoformat(),
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return session_list


async def get_session_messages(
    db: AsyncSession, session_id: int, user_id: int | None = None
) -> list[dict]:
    """获取会话消息历史"""
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    # 权限检查：只能看自己的会话
    if user_id and session.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权访问")

    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = msg_result.scalars().all()

    return [
        {
            "id": m.id,
            "sender_type": m.sender_type,
            "sender_id": m.sender_id,
            "content": m.content,
            "extra_data": m.extra_data,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


async def transfer_to_human(
    db: AsyncSession, session_id: int, user_id: int, reason: str
) -> dict:
    """将AI会话转接到人工客服"""
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作")

    session.session_type = "human"
    session.transfer_reason = reason
    await db.flush()

    # 保存系统消息
    sys_msg = ChatMessage(
        session_id=session.id,
        sender_type="ai",
        content=f"已提交转人工请求。原因：{reason}",
        extra_data={"event": "transfer_requested"},
    )
    db.add(sys_msg)
    await db.flush()

    return {
        "session_id": session.id,
        "status": "transferring",
        "message": "已提交转人工请求，请稍候",
    }


async def close_session(db: AsyncSession, session_id: int, user_id: int):
    """关闭会话"""
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="无权操作")

    session.status = "closed"
    await db.flush()
    return {"message": "会话已关闭"}
