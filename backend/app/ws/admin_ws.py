"""管理端聊天 WebSocket"""
import json
import logging
import traceback
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.ws.manager import manager


async def handle_admin_chat_ws(
    websocket: WebSocket,
    session_id: int,
    admin: User,
    db: AsyncSession,
):
    """处理管理员聊天 WebSocket 连接 - 接管指定会话"""

    # 获取会话
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        await websocket.close(code=4004, reason="会话不存在")
        return

    await manager.connect_admin(admin.id, websocket)

    # 接受转接（如果 REST API 已经设置了 admin_id，这里覆盖也无妨）
    already_accepted = session.session_type == "human" and session.admin_id == admin.id
    session.admin_id = admin.id
    session.session_type = "human"
    session.status = "active"
    session.transferred_at = None
    await db.flush()

    manager.assign_admin(session.id, websocket)
    manager.remove_from_queue(session.id)

    # 如果不是已经通过 REST 接受的，发送系统消息
    if not already_accepted:
        sys_msg = ChatMessage(
            session_id=session.id,
            sender_type="ai",
            content=f"人工客服已接入，{admin.full_name or admin.username}将为您服务。",
            extra_data={"event": "admin_joined", "admin_id": admin.id},
        )
        db.add(sys_msg)
        await db.flush()
        await db.commit()

        # 通知用户
        await manager.send_to_user(
            session.user_id,
            {
                "event": "new_message",
                "data": {
                    "id": sys_msg.id,
                    "sender_type": "ai",
                    "content": f"人工客服已接入，{admin.full_name or admin.username}将为您服务。",
                },
            },
        )
    else:
        await db.commit()

    # 广播队列更新
    await manager.broadcast_to_admins({
        "event": "queue_update",
        "data": {"queue_count": len(manager.transfer_queue), "queue_list": manager.get_queue()},
    })

    # 发送历史消息给管理员
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(100)
    )
    history = result.scalars().all()
    if history:
        history_data = [
            {
                "id": msg.id,
                "sender_type": msg.sender_type,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            }
            for msg in history
        ]
        await manager.send_to_admin(admin.id, {
            "event": "chat_history",
            "data": {"messages": history_data},
        })

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_data = json.loads(data)
                event = msg_data.get("event")

                if event == "send_message":
                    content = msg_data.get("data", {}).get("content", "")
                    if not content:
                        continue

                    # 保存消息
                    msg = ChatMessage(
                        session_id=session.id,
                        sender_type="admin",
                        sender_id=admin.id,
                        content=content,
                    )
                    db.add(msg)
                    await db.flush()
                    await db.commit()

                    # 发给用户（不发给 admin 自己）
                    await manager.send_to_user(
                        session.user_id,
                        {
                            "event": "new_message",
                            "data": {
                                "id": msg.id,
                                "sender_type": "admin",
                                "sender_name": admin.full_name or admin.username,
                                "content": content,
                                "created_at": msg.created_at.isoformat() if msg.created_at else None,
                            },
                        },
                    )

                elif event == "close_session":
                    session.status = "closed"
                    await db.flush()

                    close_msg = ChatMessage(
                        session_id=session.id,
                        sender_type="ai",
                        content="客服已结束本次会话，感谢您的咨询！",
                        extra_data={"event": "session_closed"},
                    )
                    db.add(close_msg)
                    await db.flush()
                    await db.commit()

                    await manager.send_to_user(
                        session.user_id,
                        {
                            "event": "new_message",
                            "data": {
                                "id": close_msg.id,
                                "sender_type": "ai",
                                "content": "客服已结束本次会话，感谢您的咨询！",
                            },
                        },
                    )
                    await manager.send_to_user(
                        session.user_id,
                        {"event": "session_closed", "data": {"session_id": session.id}},
                    )

                    # 通知 admin 自身
                    await manager.send_to_admin(admin.id, {
                        "event": "new_message",
                        "data": {
                            "id": close_msg.id,
                            "sender_type": "ai",
                            "content": "客服已结束本次会话，感谢您的咨询！",
                        },
                    })

                    manager.remove_session(session.id)
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
                logging.error(f"管理员消息处理失败: {inner_err}\n{traceback.format_exc()}")
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
        logging.error(f"管理员WebSocket异常断开: {e}\n{traceback.format_exc()}")
    finally:
        manager.disconnect_admin(admin.id)


async def handle_admin_queue_ws(
    websocket: WebSocket,
    admin: User,
):
    """管理员等待队列监听"""
    await manager.connect_admin(admin.id, websocket)

    # 发送当前队列状态
    await websocket.send_text(json.dumps(
        {
            "event": "queue_update",
            "data": {
                "queue_count": len(manager.transfer_queue),
                "queue_list": manager.get_queue(),
            },
        },
        ensure_ascii=False,
    ))

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg_data = json.loads(data)
                event = msg_data.get("event")

                if event == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))

                elif event == "accept_session":
                    session_id = msg_data.get("data", {}).get("session_id")
                    if session_id:
                        await websocket.send_text(json.dumps(
                            {
                                "event": "accept_redirect",
                                "data": {"session_id": session_id},
                            },
                            ensure_ascii=False,
                        ))

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
                logging.error(f"队列监听出错: {inner_err}\n{traceback.format_exc()}")

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logging.error(f"队列WebSocket异常断开: {e}\n{traceback.format_exc()}")
    finally:
        manager.disconnect_admin(admin.id)
