"""用户端聊天 WebSocket"""
import json
from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.chat import ChatSession, ChatMessage
from app.ws.manager import manager
from app.ai.deepseek_client import chat_completion_stream, detect_intent
from app.ai.knowledge_retriever import retrieve_knowledge
from app.ai.intent_detector import should_transfer_to_human
from app.utils.security import decode_access_token


async def handle_chat_ws(
    websocket: WebSocket,
    session_id: int,
    db: AsyncSession,
):
    """处理用户聊天 WebSocket 连接"""

    # 获取会话信息
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        await websocket.close(code=4004, reason="会话不存在")
        return

    user_id = session.user_id
    if not user_id:
        await websocket.close(code=4001, reason="未登录")
        return

    await manager.connect_user(user_id, websocket)
    manager.register_session(session_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_data = json.loads(data)
                event = msg_data.get("event")

                if event == "send_message":
                    await handle_user_message(msg_data, session, user_id, db)

                elif event == "transfer_to_human":
                    await handle_transfer_request(msg_data, session, user_id, db)

                elif event == "transfer_back_to_ai":
                    await handle_transfer_back(msg_data, session, user_id, db)

                elif event == "close_session":
                    await handle_close_session(session, user_id, db)
                    break

                elif event == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
                else:
                    await websocket.send_text(json.dumps(
                        {"event": "error", "data": {"message": f"未知事件: {event}"}},
                        ensure_ascii=False,
                    ))

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps(
                    {"event": "error", "data": {"message": "无效消息格式"}},
                    ensure_ascii=False,
                ))
            except Exception as inner_err:
                import traceback, logging
                logging.error(f"消息处理失败: {inner_err}\n{traceback.format_exc()}")
                try:
                    await websocket.send_text(json.dumps(
                        {"event": "error", "data": {"message": "处理消息时出错，请重试"}},
                        ensure_ascii=False,
                    ))
                except Exception:
                    pass

    except WebSocketDisconnect:
        pass
    except Exception as e:
        import traceback, logging
        logging.error(f"WebSocket连接异常断开: {e}\n{traceback.format_exc()}")
    finally:
        manager.disconnect_user(user_id)
        manager.remove_session(session_id)


async def handle_user_message(
    msg_data: dict,
    session: ChatSession,
    user_id: int,
    db: AsyncSession,
):
    """处理用户消息"""
    content = msg_data.get("data", {}).get("content", "")
    if not content:
        return

    ws = manager.user_connections.get(user_id)

    # 保存用户消息
    user_msg = ChatMessage(
        session_id=session.id,
        sender_type="user",
        sender_id=user_id,
        content=content,
    )
    db.add(user_msg)
    await db.flush()
    await db.commit()

    # 从数据库刷新 session 状态（管理员接受转接后会修改 admin_id）
    await db.refresh(session)

    # 如果是人工客服会话且有管理员接管，直接转发
    if session.session_type == "human" and session.admin_id:
        await manager.send_to_session(
            session.id,
            {
                "event": "new_message",
                "data": {
                    "id": user_msg.id,
                    "sender_type": "user",
                    "content": content,
                    "created_at": user_msg.created_at.isoformat() if user_msg.created_at else None,
                },
            },
            sender="user",
        )
        return

    # 如果正在排队等人工，不调 AI，告知用户等待
    if session.session_type == "human" and session.status != "closed":
        if ws:
            await ws.send_text(json.dumps(
                {
                    "event": "new_message",
                    "data": {
                        "id": int(user_msg.id) + 1,
                        "sender_type": "ai",
                        "content": "已收到您的消息，人工客服接入后将立即为您处理，请稍候...",
                    },
                },
                ensure_ascii=False,
            ))
        return

    # AI 客服模式
    # 1. 发送"正在输入"状态
    if ws:
        await ws.send_text(json.dumps(
            {"event": "ai_typing", "data": {"is_typing": True}},
            ensure_ascii=False,
        ))

    # 2. 获取对话历史
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
    )
    history = result.scalars().all()
    history_list = [
        {"role": msg.sender_type if msg.sender_type != "ai" else "assistant",
         "content": msg.content}
        for msg in reversed(history)
    ]

    # 3. 知识库检索
    knowledge_items = await retrieve_knowledge(db, content, top_k=3)
    knowledge_context = "\n".join([
        f"Q: {item['question']}\nA: {item['answer']}"
        for item in knowledge_items
    ])

    # 4. 流式调用 DeepSeek API
    stream_start = True
    full_reply = ""

    async for token in chat_completion_stream(
        user_message=content,
        conversation_history=history_list,
        knowledge_context=knowledge_context,
    ):
        # 完成信号
        if isinstance(token, dict) and token.get("__done__"):
            full_reply = token.get("full_text", full_reply)
            break

        # 发送 token 到前端
        if ws:
            if stream_start:
                await ws.send_text(json.dumps(
                    {"event": "stream_start", "data": {}},
                    ensure_ascii=False,
                ))
                stream_start = False
            await ws.send_text(json.dumps(
                {"event": "stream_token", "data": {"token": token}},
                ensure_ascii=False,
            ))

    # 通知流结束
    if ws:
        await ws.send_text(json.dumps(
            {"event": "stream_end", "data": {}},
            ensure_ascii=False,
        ))
        await ws.send_text(json.dumps(
            {"event": "ai_typing", "data": {"is_typing": False}},
            ensure_ascii=False,
        ))

    # 降级处理：如果流式返回空内容
    if not full_reply:
        full_reply = "抱歉，我暂时无法回答，请稍后再试或转人工客服。"

    # 检测意图
    intent = detect_intent(user_message=content, ai_reply=full_reply)

    # 5. 保存 AI 完整回复到数据库
    ai_msg = ChatMessage(
        session_id=session.id,
        sender_type="ai",
        sender_id=None,
        content=full_reply,
        extra_data={"intent": intent, "knowledge_count": len(knowledge_items)},
    )
    db.add(ai_msg)
    await db.flush()
    await db.commit()

    # 通知前端消息 ID
    if ws:
        await ws.send_text(json.dumps(
            {
                "event": "message_saved",
                "data": {
                    "id": ai_msg.id,
                    "intent": intent,
                },
            },
            ensure_ascii=False,
        ))

    # 7. 检测是否需要转人工
    should_transfer, reason = should_transfer_to_human(content, full_reply)
    if should_transfer:
        session.session_type = "human"
        session.transfer_reason = reason
        session.transferred_at = None
        await db.flush()
        manager.add_to_transfer_queue(
            session.id, user_id, f"用户{user_id}", reason
        )
        # 通知所有管理员
        await manager.broadcast_to_admins({
            "event": "transfer_notify",
            "data": {
                "session_id": session.id,
                "user_id": user_id,
                "user_name": f"用户{user_id}",
                "reason": reason,
            },
        })
        # 通知用户
        if ws:
            await ws.send_text(json.dumps(
                {
                    "event": "transfer_notify",
                    "data": {
                        "message": "已为您转接人工客服，请稍候...",
                        "session_id": session.id,
                    },
                },
                ensure_ascii=False,
            ))


async def handle_transfer_request(
    msg_data: dict,
    session: ChatSession,
    user_id: int,
    db: AsyncSession,
):
    """处理转人工请求"""
    reason = msg_data.get("data", {}).get("reason", "用户主动请求转人工")

    session.session_type = "human"
    session.transfer_reason = reason

    manager.add_to_transfer_queue(session.id, user_id, f"用户{user_id}", reason)

    # 保存系统消息
    sys_msg = ChatMessage(
        session_id=session.id,
        sender_type="ai",
        content="正在为您转接人工客服，请稍候...",
        extra_data={"event": "transfer_requested"},
    )
    db.add(sys_msg)
    await db.flush()
    await db.commit()

    # 广播给管理员
    await manager.broadcast_to_admins({
        "event": "transfer_notify",
        "data": {
            "session_id": session.id,
            "user_id": user_id,
            "user_name": f"用户{user_id}",
            "reason": reason,
        },
    })

    ws = manager.user_connections.get(user_id)
    if ws:
        await ws.send_text(json.dumps(
            {
                "event": "new_message",
                "data": {
                    "id": sys_msg.id,
                    "sender_type": "ai",
                    "content": "正在为您转接人工客服，请稍候...",
                },
            },
            ensure_ascii=False,
        ))


async def handle_transfer_back(
    msg_data: dict,
    session: ChatSession,
    user_id: int,
    db: AsyncSession,
):
    """处理转回AI客服请求"""
    ws = manager.user_connections.get(user_id)

    # 切回 AI 模式
    session.session_type = "ai"
    session.admin_id = None
    session.transfer_reason = None
    await db.flush()
    await db.commit()

    # 保存系统消息
    sys_msg = ChatMessage(
        session_id=session.id,
        sender_type="ai",
        content="已切回AI客服模式，我是小O，继续为您服务！请问还有什么可以帮助您的？",
        extra_data={"event": "transfer_back"},
    )
    db.add(sys_msg)
    await db.flush()
    await db.commit()

    # 通知管理员会话已转回AI
    await manager.broadcast_to_admins({
        "event": "transfer_back_notify",
        "data": {
            "session_id": session.id,
            "user_id": user_id,
            "message": f"用户{user_id}的会话已转回AI客服",
        },
    })

    # 从队列中移除
    manager.remove_from_queue(session.id)

    # 通知用户
    if ws:
        await ws.send_text(json.dumps(
            {
                "event": "transfer_back",
                "data": {
                    "message": "已切回AI客服模式",
                    "session_id": session.id,
                },
            },
            ensure_ascii=False,
        ))
        await ws.send_text(json.dumps(
            {
                "event": "new_message",
                "data": {
                    "id": sys_msg.id,
                    "sender_type": "ai",
                    "content": "已切回AI客服模式，我是小O，继续为您服务！请问还有什么可以帮助您的？",
                },
            },
            ensure_ascii=False,
        ))


async def handle_close_session(
    session: ChatSession,
    user_id: int,
    db: AsyncSession,
):
    """关闭会话"""
    session.status = "closed"
    await db.flush()
    await db.commit()

    manager.remove_session(session.id)
    manager.remove_from_queue(session.id)

    # 通知管理员
    await manager.broadcast_to_admins({
        "event": "session_closed",
        "data": {"session_id": session.id, "closed_by": "user"},
    })
