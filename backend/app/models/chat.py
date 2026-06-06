"""客服系统模型 - 会话与消息"""
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, Text, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    session_type: Mapped[str] = mapped_column(String(10), nullable=False, default="ai")  # ai | human
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")  # active | closed
    admin_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    transferred_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    transfer_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    closed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    sender_type: Mapped[str] = mapped_column(String(10), nullable=False)  # user | ai | admin
    sender_id: Mapped[int] = mapped_column(Integer, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    extra_data: Mapped[dict] = mapped_column("metadata", JSON, nullable=True, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")
