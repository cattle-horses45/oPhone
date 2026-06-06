"""WebSocket 连接管理器 - 客服聊天"""
import json
from datetime import datetime
from typing import Optional

from fastapi import WebSocket


class ConnectionManager:
    """管理所有 WebSocket 连接、会话和转接队列"""

    def __init__(self):
        # session_id -> {"user": WebSocket, "admin": WebSocket | None}
        self.active_sessions: dict[int, dict] = {}
        # admin_id -> WebSocket
        self.admin_connections: dict[int, WebSocket] = {}
        # user_id -> WebSocket
        self.user_connections: dict[int, WebSocket] = {}
        # 转接等待队列: [{"session_id": int, "user_id": int, "user_name": str, "reason": str, "waiting_since": str}]
        self.transfer_queue: list[dict] = []

    async def connect_user(self, user_id: int, websocket: WebSocket):
        """用户连接"""
        await websocket.accept()
        self.user_connections[user_id] = websocket

    async def connect_admin(self, admin_id: int, websocket: WebSocket):
        """管理员连接"""
        await websocket.accept()
        self.admin_connections[admin_id] = websocket

    def disconnect_user(self, user_id: int):
        """用户断开"""
        self.user_connections.pop(user_id, None)

    def disconnect_admin(self, admin_id: int):
        """管理员断开"""
        self.admin_connections.pop(admin_id, None)

    def register_session(self, session_id: int, user_ws: WebSocket):
        """注册聊天会话"""
        self.active_sessions[session_id] = {"user": user_ws, "admin": None}

    def assign_admin(self, session_id: int, admin_ws: WebSocket):
        """分配管理员到会话"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["admin"] = admin_ws

    def remove_session(self, session_id: int):
        """移除会话"""
        removed = self.active_sessions.pop(session_id, None)
        # 清理转接队列
        self.transfer_queue = [
            t for t in self.transfer_queue if t["session_id"] != session_id
        ]
        return removed

    def add_to_transfer_queue(
        self, session_id: int, user_id: int, user_name: str, reason: str
    ):
        """添加到转接等待队列"""
        # 检查是否已在队列中
        for item in self.transfer_queue:
            if item["session_id"] == session_id:
                return
        self.transfer_queue.append(
            {
                "session_id": session_id,
                "user_id": user_id,
                "user_name": user_name,
                "reason": reason,
                "waiting_since": datetime.now().isoformat(),
            }
        )

    def get_queue(self) -> list[dict]:
        """获取等待队列"""
        return self.transfer_queue

    def remove_from_queue(self, session_id: int):
        """从队列中移除"""
        self.transfer_queue = [
            t for t in self.transfer_queue if t["session_id"] != session_id
        ]

    async def send_to_user(self, user_id: int, data: dict):
        """发送消息给用户"""
        ws = self.user_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(data, ensure_ascii=False))
            except Exception:
                self.disconnect_user(user_id)

    async def send_to_admin(self, admin_id: int, data: dict):
        """发送消息给管理员"""
        ws = self.admin_connections.get(admin_id)
        if ws:
            try:
                await ws.send_text(json.dumps(data, ensure_ascii=False))
            except Exception:
                self.disconnect_admin(admin_id)

    async def broadcast_to_admins(self, data: dict):
        """广播给所有在线管理员"""
        for admin_id, ws in list(self.admin_connections.items()):
            try:
                await ws.send_text(json.dumps(data, ensure_ascii=False))
            except Exception:
                self.disconnect_admin(admin_id)

    async def send_to_session(self, session_id: int, data: dict, sender: str = "all"):
        """发送消息到会话中的双方

        sender: "user" = 消息来自用户，只发给管理员(不回声给用户)
                "admin" = 消息来自管理员，只发给用户
                "all" = 发给双方
        """
        session = self.active_sessions.get(session_id)
        if not session:
            return
        message = json.dumps(data, ensure_ascii=False)
        # 不发给发送者自己（避免回声）
        if sender != "user" and session.get("user"):
            try:
                await session["user"].send_text(message)
            except Exception:
                pass
        if sender != "admin" and session.get("admin"):
            try:
                await session["admin"].send_text(message)
            except Exception:
                pass


# 全局单例
manager = ConnectionManager()
