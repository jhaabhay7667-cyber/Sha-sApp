# backend/app/models.py

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# =========================================================
# USER
# =========================================================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    full_name: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone_number_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    about: Mapped[str] = mapped_column(
        String(160), nullable=False, default="", server_default=""
    )

    last_seen: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# =========================================================
# CONTACT REQUEST
# =========================================================

class ContactRequest(Base):
    __tablename__ = "contact_requests"

    __table_args__ = (
        UniqueConstraint(
            "sender_id",
            "receiver_id",
            name="uq_contact_request_pair",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    receiver_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# =========================================================
# CONTACTS
# =========================================================

class Contact(Base):
    __tablename__ = "contacts"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "contact_user_id",
            name="uq_contact_pair",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    contact_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# =========================================================
# CONVERSATION
# =========================================================

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    title: Mapped[str | None] = mapped_column(String(150), nullable=True)

    is_group: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# =========================================================
# CONVERSATION MEMBERS
# =========================================================

class ConversationMember(Base):
    __tablename__ = "conversation_members"

    __table_args__ = (
        UniqueConstraint(
            "conversation_id",
            "user_id",
            name="uq_conversation_member",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# =========================================================
# MESSAGE
# =========================================================

class Message(Base):
    __tablename__ = "messages"

    __table_args__ = (
        CheckConstraint(
            "message_type IN ('text', 'image', 'video', 'audio', 'file')",
            name="ck_messages_type",
        ),
        CheckConstraint(
            "status IN ('sent', 'delivered', 'read')",
            name="ck_messages_status",
        ),
        Index(
            "ix_messages_conversation_created",
            "conversation_id",
            "created_at",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    content: Mapped[str | None] = mapped_column(Text, nullable=True)

    message_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="text", server_default="text"
    )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="sent", server_default="sent"
    )

    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    media_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_mime_type: Mapped[str | None] = mapped_column(String(150), nullable=True)
    media_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    media_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# =========================================================
# MESSAGE READ RECEIPTS
# =========================================================

class MessageRead(Base):
    __tablename__ = "message_reads"

    __table_args__ = (
        UniqueConstraint(
            "message_id",
            "user_id",
            name="uq_message_read_user",
        ),
        Index("ix_message_reads_message", "message_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    message_id: Mapped[int] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    read_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# =========================================================
# MESSAGE DELIVERY RECEIPTS
# =========================================================

class MessageDelivery(Base):
    __tablename__ = "message_deliveries"

    __table_args__ = (
        UniqueConstraint(
            "message_id",
            "user_id",
            name="uq_message_delivery_user",
        ),
        Index("ix_message_deliveries_message", "message_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    message_id: Mapped[int] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    delivered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# =========================================================
# VOICE AND VIDEO CALL SESSIONS
# =========================================================

class CallSession(Base):
    __tablename__ = "call_sessions"

    __table_args__ = (
        CheckConstraint(
            "call_type IN ('voice', 'video')",
            name="ck_call_session_type",
        ),
        CheckConstraint(
            "status IN ('ringing', 'accepted', 'rejected', 'missed', 'ended')",
            name="ck_call_session_status",
        ),
        CheckConstraint(
            "caller_id != callee_id",
            name="ck_call_session_distinct_users",
        ),
        Index("ix_call_sessions_conversation", "conversation_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )

    caller_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    callee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    call_type: Mapped[str] = mapped_column(String(20), nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ringing", server_default="ringing"
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    answered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )