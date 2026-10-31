
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    ConversationMember,
    Message,
    MessageDelivery,
    MessageRead,
    User,
)
from app.security import decode_access_token


router = APIRouter(tags=["Real-Time Messaging"])


# ==========================================
# CONNECTION MANAGER
# ==========================================

class ConnectionManager:
    def __init__(self):
        # conversation_id -> user_id -> connected WebSocket connections
        self.active_connections: dict[
            int, dict[int, set[WebSocket]]
        ] = {}

    async def connect(
        self,
        websocket: WebSocket,
        conversation_id: int,
        user_id: int,
    ):
        await websocket.accept()

        conversation = self.active_connections.setdefault(
            conversation_id, {}
        )

        user_connections = conversation.setdefault(user_id, set())
        user_connections.add(websocket)

    async def disconnect(
        self,
        websocket: WebSocket,
        conversation_id: int,
        user_id: int,
    ) -> bool:
        """Return True when the user's last connection closes."""

        conversation = self.active_connections.get(conversation_id)

        if not conversation:
            return False

        user_connections = conversation.get(user_id)

        if not user_connections or websocket not in user_connections:
            return False

        user_connections.discard(websocket)

        if not user_connections:
            conversation.pop(user_id, None)

        if not conversation:
            self.active_connections.pop(conversation_id, None)

        return not user_connections

    async def broadcast(
        self,
        conversation_id: int,
        data: dict,
        exclude_user_id: int | None = None,
    ):
        """Send an event to connected users in a conversation."""

        conversation = self.active_connections.get(conversation_id, {})

        for connected_user_id, sockets in list(conversation.items()):
            if connected_user_id == exclude_user_id:
                continue

            for socket in list(sockets):
                try:
                    await socket.send_json(data)
                except Exception:
                    await self.disconnect(
                        socket,
                        conversation_id,
                        connected_user_id,
                    )


manager = ConnectionManager()


# ==========================================
# DATABASE HELPERS
# ==========================================

def is_conversation_member(
    db: Session,
    conversation_id: int,
    user_id: int,
) -> bool:
    return (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .first()
        is not None
    )


def update_message_status(
    db: Session,
    message: Message,
):
    """
    Calculate the overall message status from all recipient receipts.

    Status progression is monotonic:
    sent -> delivered -> read.
    """

    recipient_ids = [
        row.user_id
        for row in (
            db.query(ConversationMember)
            .filter(
                ConversationMember.conversation_id
                == message.conversation_id,
                ConversationMember.user_id != message.sender_id,
            )
            .all()
        )
    ]

    if not recipient_ids:
        return

    # Important: flush pending receipt records before querying them.
    db.flush()

    delivered_ids = {
        row.user_id
        for row in (
            db.query(MessageDelivery)
            .filter(
                MessageDelivery.message_id == message.id,
                MessageDelivery.user_id.in_(recipient_ids),
            )
            .all()
        )
    }

    read_ids = {
        row.user_id
        for row in (
            db.query(MessageRead)
            .filter(
                MessageRead.message_id == message.id,
                MessageRead.user_id.in_(recipient_ids),
            )
            .all()
        )
    }

    if set(recipient_ids).issubset(read_ids):
        new_status = "read"
    elif set(recipient_ids).issubset(delivered_ids):
        new_status = "delivered"
    else:
        new_status = "sent"

    # Never downgrade an existing status.
    status_order = {
        "sent": 0,
        "delivered": 1,
        "read": 2,
    }

    current_status = message.status or "sent"

    if status_order.get(new_status, 0) > status_order.get(
        current_status, 0
    ):
        message.status = new_status

    if message.status in ("delivered", "read") and not message.delivered_at:
        message.delivered_at = datetime.now(timezone.utc)


def get_message_for_conversation(
    db: Session,
    message_id: int,
    conversation_id: int,
):
    return (
        db.query(Message)
        .filter(
            Message.id == message_id,
            Message.conversation_id == conversation_id,
        )
        .first()
    )


def send_error(websocket: WebSocket, message: str):
    return websocket.send_json({
        "type": "error",
        "message": message,
    })


# ==========================================
# WEBSOCKET ROUTE
# ==========================================

@router.websocket("/ws/{conversation_id}")
async def realtime_chat(
    websocket: WebSocket,
    conversation_id: int,
):
    token = websocket.query_params.get("token")
    user_id = None
    db: Session = SessionLocal()
    connected = False

    try:
        # --------------------------------------
        # AUTHENTICATION
        # --------------------------------------

        if not token:
            await websocket.close(
                code=1008,
                reason="Authentication required",
            )
            return

        user_id = decode_access_token(token)

        if user_id is None:
            await websocket.close(
                code=1008,
                reason="Invalid or expired token",
            )
            return

        user = (
            db.query(User)
            .filter(
                User.id == user_id,
                User.is_active.is_(True),
            )
            .first()
        )

        if not user:
            await websocket.close(
                code=1008,
                reason="User not found",
            )
            return

        if not is_conversation_member(
            db,
            conversation_id,
            user_id,
        ):
            await websocket.close(
                code=1008,
                reason="You are not a member of this conversation",
            )
            return

        # --------------------------------------
        # CONNECT
        # --------------------------------------

        await manager.connect(
            websocket,
            conversation_id,
            user_id,
        )
        connected = True

        await websocket.send_json({
            "type": "connected",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "message": "Real-time connection established",
        })

        await manager.broadcast(
            conversation_id,
            {
                "type": "presence",
                "user_id": user_id,
                "status": "online",
            },
            exclude_user_id=user_id,
        )

        # --------------------------------------
        # EVENT LOOP
        # --------------------------------------

        while True:
            try:
                data = await websocket.receive_json()

            except (json.JSONDecodeError, ValueError):
                await send_error(
                    websocket,
                    "Invalid JSON event",
                )
                continue

            if not isinstance(data, dict):
                await send_error(
                    websocket,
                    "Invalid event format",
                )
                continue

            event_type = data.get("type")

            # ==================================
            # SEND TEXT MESSAGE
            # ==================================

            if event_type == "message":
                content = data.get("content")

                if not isinstance(content, str):
                    await send_error(
                        websocket,
                        "Message content must be text",
                    )
                    continue

                content = content.strip()

                if not content or len(content) > 5000:
                    await send_error(
                        websocket,
                        "Message must contain 1 to 5000 characters",
                    )
                    continue

                new_message = Message(
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    content=content,
                    message_type="text",
                    status="sent",
                )

                try:
                    db.add(new_message)
                    db.commit()
                    db.refresh(new_message)

                except Exception:
                    db.rollback()
                    await send_error(
                        websocket,
                        "Could not save message",
                    )
                    continue

                await manager.broadcast(
                    conversation_id,
                    {
                        "type": "message",
                        "id": new_message.id,
                        "conversation_id": new_message.conversation_id,
                        "sender_id": new_message.sender_id,
                        "content": new_message.content,
                        "message_type": new_message.message_type,
                        "status": new_message.status,
                        "delivered_at": (
                            new_message.delivered_at.isoformat()
                            if new_message.delivered_at
                            else None
                        ),
                        "created_at": (
                            new_message.created_at.isoformat()
                            if new_message.created_at
                            else None
                        ),
                    },
                )

            # ==================================
            # MESSAGE DELIVERED
            # ==================================

            elif event_type == "delivered":
                message_id = data.get("message_id")

                if (
                    not isinstance(message_id, int)
                    or isinstance(message_id, bool)
                    or message_id <= 0
                ):
                    await send_error(
                        websocket,
                        "A valid message_id is required",
                    )
                    continue

                message = get_message_for_conversation(
                    db,
                    message_id,
                    conversation_id,
                )

                if not message or message.sender_id == user_id:
                    await send_error(
                        websocket,
                        "Message not found or receipt not allowed",
                    )
                    continue

                try:
                    existing = (
                        db.query(MessageDelivery)
                        .filter(
                            MessageDelivery.message_id == message_id,
                            MessageDelivery.user_id == user_id,
                        )
                        .first()
                    )

                    if not existing:
                        db.add(MessageDelivery(
                            message_id=message_id,
                            user_id=user_id,
                            delivered_at=datetime.now(timezone.utc),
                        ))

                    update_message_status(db, message)
                    db.commit()
                    db.refresh(message)

                except Exception:
                    db.rollback()
                    await send_error(
                        websocket,
                        "Could not update delivery status",
                    )
                    continue

                await manager.broadcast(
                    conversation_id,
                    {
                        "type": "message_status",
                        "message_id": message.id,
                        "status": message.status,
                        "user_id": user_id,
                    },
                )

            # ==================================
            # MESSAGE READ
            # ==================================

            elif event_type == "read":
                message_id = data.get("message_id")

                if (
                    not isinstance(message_id, int)
                    or isinstance(message_id, bool)
                    or message_id <= 0
                ):
                    await send_error(
                        websocket,
                        "A valid message_id is required",
                    )
                    continue

                message = get_message_for_conversation(
                    db,
                    message_id,
                    conversation_id,
                )

                if not message or message.sender_id == user_id:
                    await send_error(
                        websocket,
                        "Message not found or receipt not allowed",
                    )
                    continue

                try:
                    now = datetime.now(timezone.utc)

                    delivery = (
                        db.query(MessageDelivery)
                        .filter(
                            MessageDelivery.message_id == message_id,
                            MessageDelivery.user_id == user_id,
                        )
                        .first()
                    )

                    if not delivery:
                        db.add(MessageDelivery(
                            message_id=message_id,
                            user_id=user_id,
                            delivered_at=now,
                        ))

                    read_receipt = (
                        db.query(MessageRead)
                        .filter(
                            MessageRead.message_id == message_id,
                            MessageRead.user_id == user_id,
                        )
                        .first()
                    )

                    if not read_receipt:
                        db.add(MessageRead(
                            message_id=message_id,
                            user_id=user_id,
                            read_at=now,
                        ))

                    update_message_status(db, message)
                    db.commit()
                    db.refresh(message)

                except Exception:
                    db.rollback()
                    await send_error(
                        websocket,
                        "Could not update read status",
                    )
                    continue

                await manager.broadcast(
                    conversation_id,
                    {
                        "type": "message_status",
                        "message_id": message.id,
                        "status": message.status,
                        "user_id": user_id,
                    },
                )

            # ==================================
            # TYPING INDICATOR
            # ==================================

            elif event_type == "typing":
                is_typing = data.get("is_typing", True)

                if not isinstance(is_typing, bool):
                    await send_error(
                        websocket,
                        "is_typing must be true or false",
                    )
                    continue

                await manager.broadcast(
                    conversation_id,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "is_typing": is_typing,
                    },
                    exclude_user_id=user_id,
                )

            # ==================================
            # UNKNOWN EVENT
            # ==================================

            else:
                await send_error(
                    websocket,
                    "Unknown event type",
                )

    except WebSocketDisconnect:
        pass

    except Exception:
        try:
            await websocket.close(
                code=1011,
                reason="Internal server error",
            )
        except Exception:
            pass

    finally:
        if connected and user_id is not None:
            is_last_connection = await manager.disconnect(
                websocket,
                conversation_id,
                user_id,
            )

            if is_last_connection:
                await manager.broadcast(
                    conversation_id,
                    {
                        "type": "presence",
                        "user_id": user_id,
                        "status": "offline",
                    },
                    exclude_user_id=user_id,
                )

        db.close()
