
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User,
    Contact,
    Conversation,
    ConversationMember,
    Message,
    MessageRead,
    MessageDelivery,
)
from app.routers.auth import get_current_user
from app.schemas import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    MessageReadResponse,
    MessageStatusResponse,
    MessageDeliveryResponse,
)


router = APIRouter(
    prefix="/messages",
    tags=["Private Messaging"],
)


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def get_conversation_member(
    db: Session,
    conversation_id: int,
    user_id: int,
):
    """Check whether a user belongs to a conversation."""

    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation.",
        )

    return member


def build_conversation_response(
    db: Session,
    conversation: Conversation,
):
    """Build a conversation response with its member IDs."""

    members = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation.id
        )
        .all()
    )

    return ConversationResponse(
        id=conversation.id,
        title=getattr(conversation, "title", None),
        is_group=conversation.is_group,
        created_by=conversation.created_by,
        member_ids=[member.user_id for member in members],
        created_at=conversation.created_at,
    )


def build_message_response(message: Message):
    """Build a message response with its delivery status."""

    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        content=message.content,
        message_type=message.message_type,
        status=message.status,
        delivered_at=message.delivered_at,
        created_at=message.created_at,
    )


def get_message_for_user(
    db: Session,
    message_id: int,
    user_id: int,
):
    """Find a message only if the user belongs to its conversation."""

    message = (
        db.query(Message)
        .filter(Message.id == message_id)
        .first()
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message not found.",
        )

    get_conversation_member(
        db,
        message.conversation_id,
        user_id,
    )

    return message


def get_or_create_delivery(
    db: Session,
    message_id: int,
    user_id: int,
):
    """Create a delivery receipt if one does not already exist."""

    delivery = (
        db.query(MessageDelivery)
        .filter(
            MessageDelivery.message_id == message_id,
            MessageDelivery.user_id == user_id,
        )
        .first()
    )

    if not delivery:
        delivery = MessageDelivery(
            message_id=message_id,
            user_id=user_id,
            delivered_at=datetime.now(timezone.utc),
        )
        db.add(delivery)
        db.flush()

    return delivery


# ==========================================
# CREATE OR GET DIRECT CONVERSATION
# ==========================================

@router.post(
    "/conversations/direct/{contact_user_id}",
    response_model=ConversationResponse,
)
def create_direct_conversation(
    contact_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a direct conversation or return the existing one."""

    if contact_user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot create a conversation with yourself.",
        )

    contact = (
        db.query(User)
        .filter(
            User.id == contact_user_id,
            User.is_active.is_(True),
        )
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    accepted_contact = (
        db.query(Contact)
        .filter(
            Contact.user_id == current_user.id,
            Contact.contact_user_id == contact_user_id,
        )
        .first()
    )

    if not accepted_contact:
        raise HTTPException(
            status_code=403,
            detail="You can chat only with accepted contacts.",
        )

    # Find an existing direct conversation.
    existing_conversations = (
        db.query(Conversation)
        .filter(Conversation.is_group.is_(False))
        .all()
    )

    for conversation in existing_conversations:
        members = (
            db.query(ConversationMember.user_id)
            .filter(
                ConversationMember.conversation_id == conversation.id
            )
            .all()
        )

        member_ids = {member.user_id for member in members}

        if member_ids == {current_user.id, contact_user_id}:
            return build_conversation_response(db, conversation)

    # Create a new direct conversation.
    conversation = Conversation(
        is_group=False,
        created_by=current_user.id,
    )

    db.add(conversation)
    db.flush()

    db.add_all([
        ConversationMember(
            conversation_id=conversation.id,
            user_id=current_user.id,
        ),
        ConversationMember(
            conversation_id=conversation.id,
            user_id=contact_user_id,
        ),
    ])

    db.commit()
    db.refresh(conversation)

    return build_conversation_response(db, conversation)


# ==========================================
# LIST USER CONVERSATIONS
# ==========================================

@router.get(
    "/conversations",
    response_model=list[ConversationResponse],
)
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all conversations belonging to the logged-in user."""

    memberships = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.user_id == current_user.id
        )
        .all()
    )

    conversation_ids = [
        member.conversation_id for member in memberships
    ]

    if not conversation_ids:
        return []

    conversations = (
        db.query(Conversation)
        .filter(Conversation.id.in_(conversation_ids))
        .order_by(Conversation.created_at.desc())
        .all()
    )

    return [
        build_conversation_response(db, conversation)
        for conversation in conversations
    ]


# ==========================================
# GET MESSAGE HISTORY
# ==========================================

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def get_messages(
    conversation_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    before_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get chronological message history for a conversation."""

    get_conversation_member(
        db,
        conversation_id,
        current_user.id,
    )

    query = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id
        )
    )

    if before_id is not None:
        query = query.filter(Message.id < before_id)

    messages = (
        query
        .order_by(Message.created_at.desc(), Message.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    messages.reverse()

    return [
        build_message_response(message)
        for message in messages
    ]


# ==========================================
# SEND TEXT MESSAGE
# ==========================================

@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a text message in a conversation."""

    get_conversation_member(
        db,
        conversation_id,
        current_user.id,
    )

    content = payload.content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    if len(content) > 5000:
        raise HTTPException(
            status_code=400,
            detail="Message cannot exceed 5000 characters.",
        )

    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=content,
        message_type="text",
        status="sent",
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return build_message_response(message)


# ==========================================
# MARK MESSAGE AS DELIVERED
# ==========================================

@router.post(
    "/{message_id}/delivered",
    response_model=MessageDeliveryResponse,
)
def mark_message_delivered(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record delivery for a recipient."""

    message = get_message_for_user(
        db,
        message_id,
        current_user.id,
    )

    if message.sender_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot mark your own message as delivered.",
        )

    delivery = get_or_create_delivery(
        db,
        message_id,
        current_user.id,
    )

    # Never downgrade a message that has already been read.
    if message.status == "sent":
        message.status = "delivered"

    if not message.delivered_at:
        message.delivered_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(delivery)

    return MessageDeliveryResponse(
        id=delivery.id,
        message_id=delivery.message_id,
        user_id=delivery.user_id,
        delivered_at=delivery.delivered_at,
    )


# ==========================================
# MARK MESSAGE AS READ
# ==========================================

@router.post(
    "/{message_id}/read",
    response_model=MessageReadResponse,
)
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record that the recipient has read a message."""

    message = get_message_for_user(
        db,
        message_id,
        current_user.id,
    )

    if message.sender_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot mark your own message as read.",
        )

    # Reading a message also means it was delivered.
    get_or_create_delivery(
        db,
        message_id,
        current_user.id,
    )

    read_record = (
        db.query(MessageRead)
        .filter(
            MessageRead.message_id == message_id,
            MessageRead.user_id == current_user.id,
        )
        .first()
    )

    if not read_record:
        read_record = MessageRead(
            message_id=message_id,
            user_id=current_user.id,
            read_at=datetime.now(timezone.utc),
        )
        db.add(read_record)

    message.status = "read"

    if not message.delivered_at:
        message.delivered_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(read_record)

    return MessageReadResponse(
        id=read_record.id,
        message_id=read_record.message_id,
        user_id=read_record.user_id,
        read_at=read_record.read_at,
    )


# ==========================================
# GET MESSAGE STATUS
# ==========================================

@router.get(
    "/{message_id}/status",
    response_model=MessageStatusResponse,
)
def get_message_status(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the delivery/read status of a message."""

    message = get_message_for_user(
        db,
        message_id,
        current_user.id,
    )

    return MessageStatusResponse(
        message_id=message.id,
        status=message.status,
        delivered_at=message.delivered_at,
    )


# ==========================================
# GET MESSAGE DELIVERY RECEIPTS
# ==========================================

@router.get(
    "/{message_id}/deliveries",
    response_model=list[MessageDeliveryResponse],
)
def get_message_deliveries(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return delivery receipts for a message."""

    message = get_message_for_user(
        db,
        message_id,
        current_user.id,
    )

    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the sender can view delivery receipts.",
        )

    deliveries = (
        db.query(MessageDelivery)
        .filter(
            MessageDelivery.message_id == message_id
        )
        .order_by(MessageDelivery.delivered_at.asc())
        .all()
    )

    return [
        MessageDeliveryResponse(
            id=item.id,
            message_id=item.message_id,
            user_id=item.user_id,
            delivered_at=item.delivered_at,
        )
        for item in deliveries
    ]
