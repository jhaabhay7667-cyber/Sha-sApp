
from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


# ==========================================
# AUTHENTICATION SCHEMAS
# ==========================================

class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    is_active: bool
    created_at: datetime


class PublicUserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    relationship: str = "none"


class ContactRequestResponse(BaseModel):
    id: int
    sender: PublicUserResponse
    receiver: PublicUserResponse
    status: str
    created_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# ==========================================
# PROFILE AND PHONE NUMBER SCHEMAS
# ==========================================

class PhoneNumberUpdate(BaseModel):
    phone_number: str = Field(min_length=7, max_length=20)

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        cleaned = value.strip()
        allowed = set("+0123456789 -()")

        if any(character not in allowed for character in cleaned):
            raise ValueError("Phone number contains invalid characters.")

        digits = "".join(c for c in cleaned if c.isdigit())

        if not 7 <= len(digits) <= 15:
            raise ValueError("Enter a valid phone number.")

        return cleaned


class ProfileDetailsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    phone_number: str | None = None
    about: str | None = None
    last_seen: datetime | None = None


# ==========================================
# CONTACT SCHEMAS
# ==========================================

class ContactSearchResult(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    relationship: str = "none"


class ContactSyncItem(BaseModel):
    phone_number: str = Field(min_length=7, max_length=20)
    display_name: str | None = Field(default=None, max_length=80)


class ContactSyncRequest(BaseModel):
    contacts: list[ContactSyncItem] = Field(max_length=500)


class MatchedContactResponse(BaseModel):
    user_id: int
    full_name: str
    phone_number: str | None = None
    relationship: str = "none"


# ==========================================
# PRIVATE MESSAGING SCHEMAS
# ==========================================

class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    content: str | None = None
    message_type: str
    status: Literal["sent", "delivered", "read"] = "sent"
    delivered_at: datetime | None = None
    created_at: datetime


class ConversationCreate(BaseModel):
    contact_user_id: int = Field(gt=0)


class ConversationResponse(BaseModel):
    id: int
    title: str | None = None
    is_group: bool
    created_by: int
    member_ids: list[int]
    created_at: datetime


class MessageReadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    message_id: int
    user_id: int
    read_at: datetime


# ==========================================
# MESSAGE DELIVERY AND STATUS SCHEMAS
# ==========================================

MessageStatus = Literal["sent", "delivered", "read"]


class MessageStatusResponse(BaseModel):
    message_id: int
    status: MessageStatus
    delivered_at: datetime | None = None


class MessageDeliveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    message_id: int
    user_id: int
    delivered_at: datetime


class MarkMessageDeliveredRequest(BaseModel):
    message_id: int = Field(gt=0)


class MarkMessageReadRequest(BaseModel):
    message_id: int = Field(gt=0)


# ==========================================
# MEDIA MESSAGE SCHEMAS
# ==========================================

MediaMessageType = Literal["image", "video", "audio", "file"]


class MediaMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    message_type: MediaMessageType
    media_url: str
    media_file_name: str | None = None
    media_size_bytes: int | None = None
    media_mime_type: str | None = None
    duration_seconds: int | None = None
    thumbnail_url: str | None = None
    created_at: datetime


class MediaUploadResponse(BaseModel):
    message: str
    media: MediaMessageResponse


# ==========================================
# VOICE AND VIDEO CALL SCHEMAS
# ==========================================

CallType = Literal["voice", "video"]

CallStatus = Literal[
    "ringing",
    "accepted",
    "rejected",
    "missed",
    "ended",
]


class CallCreate(BaseModel):
    receiver_id: int = Field(gt=0)
    call_type: CallType


class CallResponse(BaseModel):
    id: int
    conversation_id: int
    caller_id: int
    callee_id: int
    call_type: CallType
    status: CallStatus
    started_at: datetime
    answered_at: datetime | None = None
    ended_at: datetime | None = None


class CallStatusUpdate(BaseModel):
    status: Literal[
        "accepted",
        "rejected",
        "ended",
    ]


# ==========================================
# REAL-TIME EVENT SCHEMAS
# ==========================================

class TypingEvent(BaseModel):
    conversation_id: int = Field(gt=0)
    is_typing: bool


class PresenceResponse(BaseModel):
    user_id: int
    is_online: bool
    last_seen: datetime | None = None
