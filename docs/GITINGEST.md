Directory structure:
└── jhaabhay7667-cyber-sha-sapp/
    ├── backend/
    │   ├── requirements.txt
    │   ├── test_realtime.py
    │   └── app/
    │       ├── database.py
    │       ├── main.py
    │       ├── models.py
    │       ├── schemas.py
    │       ├── security.py
    │       ├── storage.py
    │       └── routers/
    │           ├── auth.py
    │           ├── contacts.py
    │           ├── media.py
    │           ├── messages.py
    │           └── realtime.py
    └── frontend/
        ├── capacitor.config.json
        ├── contacts-bridge.js
        ├── index.html
        ├── package.json
        ├── android/
        │   ├── gradle.properties
        │   ├── gradlew
        │   ├── gradlew.bat
        │   ├── app/
        │   │   ├── proguard-rules.pro
        │   │   └── src/
        │   │       ├── androidTest/
        │   │       │   └── java/
        │   │       │       └── com/
        │   │       │           └── getcapacitor/
        │   │       │               └── myapp/
        │   │       │                   └── ExampleInstrumentedTest.java
        │   │       ├── main/
        │   │       │   ├── AndroidManifest.xml
        │   │       │   ├── java/
        │   │       │   │   └── com/
        │   │       │   │       └── shasapp/
        │   │       │   │           └── app/
        │   │       │   │               └── MainActivity.java
        │   │       │   └── res/
        │   │       │       ├── drawable/
        │   │       │       │   └── ic_launcher_background.xml
        │   │       │       ├── drawable-v24/
        │   │       │       │   └── ic_launcher_foreground.xml
        │   │       │       ├── layout/
        │   │       │       │   └── activity_main.xml
        │   │       │       ├── mipmap-anydpi-v26/
        │   │       │       │   ├── ic_launcher.xml
        │   │       │       │   └── ic_launcher_round.xml
        │   │       │       ├── values/
        │   │       │       │   ├── ic_launcher_background.xml
        │   │       │       │   ├── strings.xml
        │   │       │       │   └── styles.xml
        │   │       │       └── xml/
        │   │       │           └── file_paths.xml
        │   │       └── test/
        │   │           └── java/
        │   │               └── com/
        │   │                   └── getcapacitor/
        │   │                       └── myapp/
        │   │                           └── ExampleUnitTest.java
        │   └── gradle/
        │       └── wrapper/
        │           └── gradle-wrapper.properties
        ├── css/
        │   └── style.css
        ├── js/
        │   └── app-backup.js
        └── www/
            ├── index.html
            ├── css/
            │   └── style.css
            └── js/
                ├── app-backup.js
                └── contacts-bridge.js


Files Content:

================================================
FILE: backend/requirements.txt
================================================
fastapi
uvicorn[standard]
python-dotenv
sqlalchemy
psycopg[binary]
alembic
pydantic-settings
pwdlib[argon2]
PyJWT
email-validator
python-multipart
phonenumbers
supabase==2.33.0



================================================
FILE: backend/test_realtime.py
================================================

import asyncio
import json
import websockets

CONVERSATION_ID = 1


async def listen(name, websocket):
    try:
        async for message in websocket:
            data = json.loads(message)
            event = data.get("type")

            if event == "typing":
                user = "Abhay" if data["user_id"] == 4 else "shasha"
                status = "is typing..." if data["is_typing"] else "stopped typing."
                print(f"\n[CHAT] {user} {status}")

            elif event == "presence":
                print(
                    f"\n[PRESENCE] User {data['user_id']} "
                    f"is {data['status']}"
                )

            elif event == "message":
                print(
                    f"\n[MESSAGE] User {data['sender_id']}: "
                    f"{data['content']}"
                )

            else:
                print(f"\n[{name}] {json.dumps(data, ensure_ascii=False)}")

    except websockets.exceptions.ConnectionClosed:
        print(f"\n{name} disconnected.")


async def main():
    print("========== SHA'SAPP TYPING TEST ==========")

    abhay_token = input("Abhay's new JWT token: ").strip()
    shasha_token = input("shasha's new JWT token: ").strip()

    if not abhay_token or not shasha_token:
        print("Both tokens are required.")
        return

    abhay_url = (
        f"ws://127.0.0.1:8000/ws/{CONVERSATION_ID}"
        f"?token={abhay_token}"
    )

    shasha_url = (
        f"ws://127.0.0.1:8000/ws/{CONVERSATION_ID}"
        f"?token={shasha_token}"
    )

    try:
        async with websockets.connect(abhay_url) as abhay_ws:
            print("\nAbhay connected!")

            async with websockets.connect(shasha_url) as shasha_ws:
                print("shasha connected!")
                print("\nCommands:")
                print("A = Abhay")
                print("S = shasha")
                print("exit = Stop test")

                tasks = [
                    asyncio.create_task(listen("ABHAY", abhay_ws)),
                    asyncio.create_task(listen("SHASHA", shasha_ws)),
                ]

                try:
                    while True:
                        choice = (
                            await asyncio.to_thread(
                                input, "\nChoose user (A/S): "
                            )
                        ).strip().lower()

                        if choice == "exit":
                            break

                        if choice not in ("a", "s"):
                            print("Choose A or S.")
                            continue

                        sender = abhay_ws if choice == "a" else shasha_ws

                        print("\n1. Start typing")
                        print("2. Stop typing")
                        print("3. Send message")

                        action = (
                            await asyncio.to_thread(
                                input, "Choose action: "
                            )
                        ).strip()

                        if action == "1":
                            await sender.send(json.dumps({
                                "type": "typing",
                                "is_typing": True,
                            }))
                            print("Typing started!")

                        elif action == "2":
                            await sender.send(json.dumps({
                                "type": "typing",
                                "is_typing": False,
                            }))
                            print("Typing stopped!")

                        elif action == "3":
                            content = await asyncio.to_thread(
                                input, "Enter message: "
                            )
                            await sender.send(json.dumps({
                                "type": "message",
                                "content": content,
                            }))

                        else:
                            print("Invalid action.")

                finally:
                    for task in tasks:
                        task.cancel()

                    await asyncio.gather(*tasks, return_exceptions=True)

    except Exception as error:
        print("\nConnection error:", error)


if __name__ == "__main__":
    asyncio.run(main())



================================================
FILE: backend/app/database.py
================================================

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing from backend/.env"
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()



================================================
FILE: backend/app/main.py
================================================
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import Base, engine
from app import models
from app.routers.auth import router as auth_router
from app.routers.contacts import router as contacts_router
from app.routers.messages import router as messages_router
from app.routers.realtime import router as realtime_router
from app.routers.media import router as media_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create missing tables during development.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sha'sapp API",
    description="Backend API for the Sha'sapp messaging platform",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=["Authorization", "Content-Type"],
)

# Register API routers.
app.include_router(auth_router)
app.include_router(contacts_router)
app.include_router(messages_router)
app.include_router(realtime_router)
app.include_router(media_router)


@app.get("/")
def home():
    return {
        "app": "Sha'sapp",
        "status": "online",
        "message": "Sha'sapp API is running",
    }


@app.get("/api/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except SQLAlchemyError:
        return {
            "status": "unhealthy",
            "database": "disconnected",
        }


================================================
FILE: backend/app/models.py
================================================
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


================================================
FILE: backend/app/schemas.py
================================================

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



================================================
FILE: backend/app/security.py
================================================

import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "")

if len(SECRET_KEY) < 64:
    raise RuntimeError(
        "Set a strong random SECRET_KEY in backend/.env. "
        "Generate one with Python's secrets.token_hex(32)."
    )

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(
    password: str,
    stored_hash: str,
) -> bool:
    try:
        return password_hasher.verify(password, stored_hash)
    except Exception:
        return False


def create_access_token(user_id: int) -> tuple[str, int]:
    expires_in = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return token, expires_in


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["sub", "exp"]},
        )

        subject = payload.get("sub")

        if not isinstance(subject, str):
            return None

        user_id = int(subject)

        if user_id <= 0:
            return None

        return user_id

    except (InvalidTokenError, ValueError, TypeError):
        return None



================================================
FILE: backend/app/storage.py
================================================
﻿import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from backend/.env"
    )

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

STORAGE_BUCKET = "chat-media"



================================================
FILE: backend/app/routers/auth.py
================================================

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    ProfileUpdate,
)
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

bearer_scheme = HTTPBearer()


# ------------------------------------------
# GET CURRENT AUTHENTICATED USER
# ------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    user_id = decode_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(
        select(User).where(
            User.id == user_id,
            User.is_active.is_(True),
        )
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# ------------------------------------------
# USER REGISTRATION
# ------------------------------------------

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    data: UserRegister,
    db: Session = Depends(get_db),
):
    email = str(data.email).lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=data.full_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    token, expires_in = create_access_token(user.id)

    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user=user,
    )


# ------------------------------------------
# USER LOGIN
# ------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    data: UserLogin,
    db: Session = Depends(get_db),
):
    email = str(data.email).lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if (
        user is None
        or not user.is_active
        or not verify_password(
            data.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token, expires_in = create_access_token(user.id)

    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user=user,
    )


# ------------------------------------------
# GET MY PROFILE
# ------------------------------------------

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ------------------------------------------
# UPDATE MY PROFILE
# ------------------------------------------

@router.patch(
    "/profile",
    response_model=UserResponse,
)
def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.full_name = data.full_name.strip()

    db.commit()
    db.refresh(current_user)

    return current_user



================================================
FILE: backend/app/routers/contacts.py
================================================

import phonenumbers

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contact, ContactRequest, User
from app.schemas import (
    ContactRequestResponse,
    PublicUserResponse,
)
from app.routers.auth import get_current_user


router = APIRouter(prefix="/contacts", tags=["Contacts"])


# =========================================================
# PHONE CONTACT REQUEST SCHEMAS
# =========================================================

class PhoneContactInput(BaseModel):
    name: str = Field(default="", max_length=100)
    phone_number: str = Field(min_length=5, max_length=30)


class PhoneContactsMatchRequest(BaseModel):
    contacts: list[PhoneContactInput] = Field(
        min_length=1,
        max_length=100,
    )


# =========================================================
# HELPER: BUILD CONTACT REQUEST RESPONSE
# =========================================================

def build_request_response(
    request: ContactRequest,
    db: Session,
):
    sender = db.get(User, request.sender_id)
    receiver = db.get(User, request.receiver_id)

    if sender is None or receiver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A user in this contact request no longer exists.",
        )

    return ContactRequestResponse(
        id=request.id,
        sender=PublicUserResponse(
            id=sender.id,
            full_name=sender.full_name,
            email=sender.email,
            relationship="pending",
        ),
        receiver=PublicUserResponse(
            id=receiver.id,
            full_name=receiver.full_name,
            email=receiver.email,
            relationship="pending",
        ),
        status=request.status,
        created_at=request.created_at,
    )


# =========================================================
# HELPER: GET USER RELATIONSHIP
# =========================================================

def get_user_relationship(
    current_user_id: int,
    other_user_id: int,
    db: Session,
) -> str:

    existing_contact = db.scalar(
        select(Contact.id).where(
            or_(
                (
                    (Contact.user_id == current_user_id)
                    & (Contact.contact_user_id == other_user_id)
                ),
                (
                    (Contact.user_id == other_user_id)
                    & (Contact.contact_user_id == current_user_id)
                ),
            )
        )
    )

    if existing_contact:
        return "contact"

    pending_request = db.scalar(
        select(ContactRequest.id).where(
            ContactRequest.status == "pending",
            or_(
                (
                    (ContactRequest.sender_id == current_user_id)
                    & (ContactRequest.receiver_id == other_user_id)
                ),
                (
                    (ContactRequest.sender_id == other_user_id)
                    & (ContactRequest.receiver_id == current_user_id)
                ),
            ),
        )
    )

    return "pending" if pending_request else "none"


# =========================================================
# SEARCH USERS BY NAME OR EMAIL
# =========================================================

@router.get("/search", response_model=list[PublicUserResponse])
def search_users(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = q.strip()

    if len(query) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter at least 2 characters to search.",
        )

    users = db.scalars(
        select(User)
        .where(
            User.id != current_user.id,
            User.is_active.is_(True),
            or_(
                User.full_name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%"),
            ),
        )
        .limit(20)
    ).all()

    results = []

    for user in users:
        relationship = get_user_relationship(
            current_user.id,
            user.id,
            db,
        )

        results.append(
            PublicUserResponse(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                relationship=relationship,
            )
        )

    return results


# =========================================================
# MATCH MANUALLY SELECTED PHONE CONTACTS
# =========================================================

@router.post("/match-phone")
def match_phone_contacts(
    payload: PhoneContactsMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    selected_numbers = {}

    # Normalize only the phone numbers explicitly submitted.
    for contact in payload.contacts:
        try:
            parsed = phonenumbers.parse(
                contact.phone_number,
                "IN",
            )

            if not phonenumbers.is_valid_number(parsed):
                continue

            normalized_number = phonenumbers.format_number(
                parsed,
                phonenumbers.PhoneNumberFormat.E164,
            )

            selected_numbers[normalized_number] = contact.name

        except phonenumbers.NumberParseException:
            continue

    if not selected_numbers:
        return {
            "matches": [],
            "message": "No valid phone numbers found.",
        }

    # Match only active accounts with verified phone numbers.
    users = db.scalars(
        select(User).where(
            User.id != current_user.id,
            User.is_active.is_(True),
            User.phone_number_verified.is_(True),
            User.phone_number.in_(list(selected_numbers.keys())),
        )
    ).all()

    matches = []

    for user in users:
        relationship = get_user_relationship(
            current_user.id,
            user.id,
            db,
        )

        matches.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "relationship": relationship,
            
        })

    return {
        "matches": matches,
        "message": f"Found {len(matches)} registered contact(s).",
    }


# =========================================================
# SEND CONTACT REQUEST
# =========================================================

@router.post(
    "/{user_id}/request",
    response_model=ContactRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_contact_request(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send a contact request to yourself.",
        )

    receiver = db.get(User, user_id)

    if receiver is None or not receiver.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    existing_contact = db.scalar(
        select(Contact.id).where(
            or_(
                (
                    (Contact.user_id == current_user.id)
                    & (Contact.contact_user_id == user_id)
                ),
                (
                    (Contact.user_id == user_id)
                    & (Contact.contact_user_id == current_user.id)
                ),
            )
        )
    )

    if existing_contact:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already in your contacts.",
        )

    reverse_pending = db.scalar(
        select(ContactRequest).where(
            ContactRequest.sender_id == user_id,
            ContactRequest.receiver_id == current_user.id,
            ContactRequest.status == "pending",
        )
    )

    if reverse_pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user has already sent you a request. Check incoming requests.",
        )

    existing_request = db.scalar(
        select(ContactRequest).where(
            ContactRequest.sender_id == current_user.id,
            ContactRequest.receiver_id == user_id,
        )
    )

    if existing_request:
        if existing_request.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already sent a request to this user.",
            )

        if existing_request.status == "accepted":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already connected with this user.",
            )

        existing_request.status = "pending"
        db.commit()
        db.refresh(existing_request)

        return build_request_response(existing_request, db)

    contact_request = ContactRequest(
        sender_id=current_user.id,
        receiver_id=user_id,
        status="pending",
    )

    db.add(contact_request)
    db.commit()
    db.refresh(contact_request)

    return build_request_response(contact_request, db)


# =========================================================
# GET INCOMING REQUESTS
# =========================================================

@router.get(
    "/requests/incoming",
    response_model=list[ContactRequestResponse],
)
def get_incoming_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requests = db.scalars(
        select(ContactRequest)
        .where(
            ContactRequest.receiver_id == current_user.id,
            ContactRequest.status == "pending",
        )
        .order_by(ContactRequest.created_at.desc())
    ).all()

    return [
        build_request_response(request, db)
        for request in requests
    ]


# =========================================================
# GET OUTGOING REQUESTS
# =========================================================

@router.get(
    "/requests/outgoing",
    response_model=list[ContactRequestResponse],
)
def get_outgoing_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requests = db.scalars(
        select(ContactRequest)
        .where(
            ContactRequest.sender_id == current_user.id,
            ContactRequest.status == "pending",
        )
        .order_by(ContactRequest.created_at.desc())
    ).all()

    return [
        build_request_response(request, db)
        for request in requests
    ]


# =========================================================
# ACCEPT CONTACT REQUEST
# =========================================================

@router.post(
    "/requests/{request_id}/accept",
    response_model=ContactRequestResponse,
)
def accept_contact_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.get(ContactRequest, request_id)

    if request is None or request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact request not found.",
        )

    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request has already been processed.",
        )

    request.status = "accepted"

    db.add_all([
        Contact(
            user_id=request.sender_id,
            contact_user_id=request.receiver_id,
        ),
        Contact(
            user_id=request.receiver_id,
            contact_user_id=request.sender_id,
        ),
    ])

    db.commit()
    db.refresh(request)

    return build_request_response(request, db)


# =========================================================
# REJECT CONTACT REQUEST
# =========================================================

@router.post(
    "/requests/{request_id}/reject",
    response_model=ContactRequestResponse,
)
def reject_contact_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.get(ContactRequest, request_id)

    if request is None or request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact request not found.",
        )

    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request has already been processed.",
        )

    request.status = "rejected"

    db.commit()
    db.refresh(request)

    return build_request_response(request, db)


# =========================================================
# GET CONTACT LIST
# =========================================================

@router.get("/", response_model=list[PublicUserResponse])
def get_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact_rows = db.scalars(
        select(Contact).where(
            Contact.user_id == current_user.id
        )
    ).all()

    results = []

    for contact in contact_rows:
        user = db.get(User, contact.contact_user_id)

        if user and user.is_active:
            results.append(
                PublicUserResponse(
                    id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    relationship="contact",
                )
            )

    return results



================================================
FILE: backend/app/routers/media.py
================================================

from pathlib import Path
from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ConversationMember, Message
from app.routers.auth import get_current_user
from app.routers.realtime import manager
from app.storage import supabase, STORAGE_BUCKET


router = APIRouter(prefix="/media", tags=["Media"])

CHUNK_SIZE = 1024 * 1024

MAX_SIZES = {
    "image": 25 * 1024 * 1024,
    "video": 100 * 1024 * 1024,
    "audio": 20 * 1024 * 1024,
}

ALLOWED_TYPES = {
    "image": {
        "image/jpeg": {".jpg", ".jpeg"},
        "image/png": {".png"},
        "image/webp": {".webp"},
        "image/gif": {".gif"},
    },
    "video": {
        "video/mp4": {".mp4"},
        "video/webm": {".webm"},
        "video/quicktime": {".mov"},
    },
    "audio": {
        "audio/mpeg": {".mp3"},
        "audio/mp4": {".m4a", ".mp4"},
        "audio/wav": {".wav"},
        "audio/x-wav": {".wav"},
        "audio/ogg": {".ogg"},
        "audio/webm": {".webm"},
    },
}


def ensure_conversation_member(db, conversation_id, user_id):
    membership = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this conversation.",
        )


def get_message_for_member(db, message_id, user_id):
    message = (
        db.query(Message)
        .join(
            ConversationMember,
            ConversationMember.conversation_id == Message.conversation_id,
        )
        .filter(
            Message.id == message_id,
            ConversationMember.user_id == user_id,
        )
        .first()
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Media message not found.",
        )

    return message


def build_media_event(message):
    return {
        "type": "media_message",
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "content": message.content,
        "message_type": message.message_type,
        "status": message.status,
        "created_at": (
            message.created_at.isoformat()
            if message.created_at
            else None
        ),
        "delivered_at": (
            message.delivered_at.isoformat()
            if message.delivered_at
            else None
        ),
        "media_url": message.media_url,
        "media_mime_type": message.media_mime_type,
        "media_file_name": message.media_file_name,
        "media_size_bytes": message.media_size_bytes,
        "duration_seconds": message.duration_seconds,
        "thumbnail_url": message.thumbnail_url,
    }


def remove_storage_file(file_path):
    try:
        supabase.storage.from_(STORAGE_BUCKET).remove([file_path])
    except Exception:
        pass


@router.post("/conversations/{conversation_id}")
async def upload_media(
    conversation_id: int,
    file: UploadFile = File(...),
    message_type: str = Form(...),
    duration_seconds: int | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if message_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported media type.",
        )

    ensure_conversation_member(db, conversation_id, current_user.id)

    original_name = Path(file.filename or "upload").name
    extension = Path(original_name).suffix.lower()

    mime_type = (
        (file.content_type or "")
        .lower()
        .split(";", 1)[0]
        .strip()
    )

    allowed_extensions = ALLOWED_TYPES[message_type].get(mime_type)

    if not allowed_extensions or extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="The file extension and MIME type do not match.",
        )

    if duration_seconds is not None:
        if message_type != "audio" or not 0 <= duration_seconds <= 3600:
            raise HTTPException(
                status_code=400,
                detail="Invalid audio duration.",
            )

    max_size = MAX_SIZES[message_type]
    total_size = 0
    file_data = bytearray()
    stored_name = None
    storage_uploaded = False

    try:
        message = Message(
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=None,
            message_type=message_type,
            status="sent",
            media_url=None,
            media_mime_type=mime_type,
            media_file_name=original_name,
            media_size_bytes=0,
            duration_seconds=duration_seconds,
        )

        db.add(message)
        db.flush()

        stored_name = f"{message.id}{extension}"

        while True:
            chunk = await file.read(CHUNK_SIZE)

            if not chunk:
                break

            total_size += len(chunk)

            if total_size > max_size:
                raise HTTPException(
                    status_code=413,
                    detail=(
                        "File exceeds the maximum size of "
                        f"{max_size // (1024 * 1024)} MB."
                    ),
                )

            file_data.extend(chunk)

        if total_size == 0:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        storage = supabase.storage.from_(STORAGE_BUCKET)

        storage.upload(
            stored_name,
            bytes(file_data),
            file_options={
                "content-type": mime_type,
                "upsert": "false",
            },
        )

        storage_uploaded = True

        message.media_size_bytes = total_size
        message.media_url = f"/media/{message.id}"

        db.commit()
        db.refresh(message)

        media_event = build_media_event(message)

        try:
            await manager.broadcast(conversation_id, media_event)
        except Exception:
            pass

        return {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "content": message.content,
            "message_type": message.message_type,
            "status": message.status,
            "created_at": (
                message.created_at.isoformat()
                if message.created_at
                else None
            ),
            "delivered_at": (
                message.delivered_at.isoformat()
                if message.delivered_at
                else None
            ),
            "media_url": message.media_url,
            "media_mime_type": message.media_mime_type,
            "media_file_name": message.media_file_name,
            "media_size_bytes": message.media_size_bytes,
            "duration_seconds": message.duration_seconds,
            "thumbnail_url": message.thumbnail_url,
        }

    except Exception:
        db.rollback()

        if stored_name and storage_uploaded:
            remove_storage_file(stored_name)

        raise

    finally:
        await file.close()


@router.get("/{message_id}")
def download_media(
    message_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    message = get_message_for_member(db, message_id, current_user.id)

    if message.message_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=404,
            detail="This message has no media file.",
        )

    if not message.media_url or not message.media_mime_type:
        raise HTTPException(
            status_code=404,
            detail="Media information is unavailable.",
        )

    extension = Path(message.media_file_name or "").suffix.lower()

    if extension not in ALLOWED_TYPES[message.message_type].get(
        message.media_mime_type,
        set(),
    ):
        raise HTTPException(
            status_code=404,
            detail="Invalid media file information.",
        )

    stored_name = f"{message.id}{extension}"

    try:
        file_data = (
            supabase.storage
            .from_(STORAGE_BUCKET)
            .download(stored_name)
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Media file is missing from cloud storage.",
        )

    safe_filename = quote(
        message.media_file_name or stored_name,
        safe="",
    )

    return Response(
        content=file_data,
        media_type=message.media_mime_type,
        headers={
            "Content-Disposition": (
                f"inline; filename*=UTF-8''{safe_filename}"
            ),
            "Content-Length": str(len(file_data)),
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )



================================================
FILE: backend/app/routers/messages.py
================================================

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



================================================
FILE: backend/app/routers/realtime.py
================================================

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



================================================
FILE: frontend/capacitor.config.json
================================================
{
  "appId": "com.shasapp.app",
  "appName": "Sha'sapp",
  "webDir": "www"
}



================================================
FILE: frontend/contacts-bridge.js
================================================
﻿import { Contacts } from "@capacitor-community/contacts";

window.ShaContacts = Contacts;



================================================
FILE: frontend/index.html
================================================
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#101828">
    <meta name="description" content="Sha'sapp — Connect, chat, and stay close.">

    <title>Sha'sapp — Messaging Made Personal</title>

    <link rel="stylesheet" href="css/style.css">
    <script src="js/app.js" defer></script>
</head>

<body>
    <!-- Authentication -->
    <section id="authScreen" class="auth-screen">
        <div class="auth-decoration decoration-one"></div>
        <div class="auth-decoration decoration-two"></div>

        <div class="auth-card">
            <a href="#" class="brand auth-brand">
                <span class="brand-icon">S</span>
                <span>Sha's<span class="brand-accent">app</span></span>
            </a>

            <div class="auth-heading">
                <p class="eyebrow">YOUR WORLD, CONNECTED</p>
                <h1 id="authTitle">Welcome back.</h1>
                <p id="authDescription">
                    Sign in to continue your conversations.
                </p>
            </div>

            <form id="authForm">
                <div id="nameField" class="form-field hidden">
                    <label for="fullName">Full name</label>
                    <input
                        id="fullName"
                        type="text"
                        placeholder="Enter your name"
                        autocomplete="name"
                    >
                </div>

                <div class="form-field">
                    <label for="email">Email address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        autocomplete="email"
                        required
                    >
                </div>

                <div class="form-field">
                    <div class="label-row">
                        <label for="password">Password</label>
                        <button
                            id="togglePassword"
                            class="text-button"
                            type="button"
                        >
                            Show
                        </button>
                    </div>

                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        autocomplete="current-password"
                        required
                    >
                </div>

                <p id="authError" class="error-message" role="alert"></p>

                <button id="authSubmit" class="primary-button" type="submit">
                    Sign in <span>→</span>
                </button>
            </form>

            <p class="auth-switch">
                <span id="authSwitchText">New to Sha'sapp?</span>
                <button id="authSwitch" class="text-button" type="button">
                    Create account
                </button>
            </p>

            <div class="auth-footer">
                PRIVATE CONVERSATIONS. MEANINGFUL CONNECTIONS.
            </div>
        </div>
    </section>

    <!-- Main application -->
    <main id="appScreen" class="app-screen hidden">

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <header class="sidebar-header">
                <a href="#" class="brand">
                    <span class="brand-icon">S</span>
                    <span>Sha's<span class="brand-accent">app</span></span>
                </a>

                <button
                    id="themeToggle"
                    class="icon-button"
                    type="button"
                    aria-label="Toggle theme"
                    title="Toggle light/dark theme"
                >☾</button>
            </header>

            <div class="profile-mini">
                <div id="myAvatar" class="avatar avatar-large">S</div>

                <div class="profile-details">
                    <strong id="myName">Your Profile</strong>
                    <span id="myEmail">Welcome to Sha'sapp</span>
                </div>

                <button
                    id="logoutButton"
                    class="icon-button"
                    type="button"
                    title="Sign out"
                    aria-label="Sign out"
                >↗</button>
            </div>

            <div class="sidebar-title-row">
                <h2>Messages</h2>
                <span id="chatCount" class="count-badge">0</span>
            </div>

            <div class="search-box">
                <span aria-hidden="true">⌕</span>
                <input
                    id="searchInput"
                    type="search"
                    placeholder="Search conversations"
                    aria-label="Search conversations"
                >
            </div>

            <div class="filter-tabs">
                <button class="filter-tab active" data-filter="all" type="button">
                    All
                </button>
                <button class="filter-tab" data-filter="unread" type="button">
                    Unread
                </button>
                <button class="filter-tab" data-filter="groups" type="button">
                    Groups
                </button>
            </div>

            <div id="conversationList" class="conversation-list"></div>

            <div class="sidebar-bottom">
                <div class="connection-indicator">
                    <span class="status-dot"></span>
                    <span id="connectionText">Frontend preview</span>
                </div>
                <p>Sha'sapp · Built for connection</p>
            </div>
        </aside>

        <!-- Chat area -->
        <section class="chat-area">

            <div id="emptyState" class="empty-state">
                <div class="empty-illustration">
                    <div class="illustration-bubble bubble-one">Hi!</div>
                    <div class="illustration-bubble bubble-two">Hello 👋</div>
                    <div class="illustration-circle">S</div>
                </div>

                <p class="eyebrow">YOUR PEOPLE, YOUR SPACE</p>
                <h1>Every conversation<br>starts somewhere.</h1>
                <p>
                    Select a conversation to get started.
                    Your next meaningful connection is one message away.
                </p>

                <button id="previewButton" class="secondary-button" type="button">
                    Explore preview conversations
                </button>
            </div>

            <section id="chatPanel" class="chat-panel hidden">

                <header class="chat-header">
                    <button
                        id="backButton"
                        class="icon-button mobile-back"
                        type="button"
                        aria-label="Back to conversations"
                    >←</button>

                    <div id="chatAvatar" class="avatar">A</div>

                    <div class="chat-contact-details">
                        <h2 id="chatName">Contact</h2>
                        <p id="chatStatus">Preview conversation</p>
                    </div>

                    <div class="chat-header-actions">
                        <button
                            id="searchMessagesButton"
                            class="icon-button"
                            type="button"
                            aria-label="Find messages"
                            title="Find messages"
                        >⌕</button>

                        <button
                            id="chatInfoButton"
                            class="icon-button"
                            type="button"
                            aria-label="Conversation information"
                            title="Conversation information"
                        >ⓘ</button>
                    </div>
                </header>

                <div id="messageSearch" class="message-search hidden">
                    <input
                        id="messageSearchInput"
                        type="search"
                        placeholder="Find a message in this conversation..."
                        aria-label="Find a message"
                    >
                    <button id="closeMessageSearch" class="text-button" type="button">
                        Close
                    </button>
                </div>

                <div id="messageList" class="message-list">
                    <div class="date-divider">
                        <span>Today</span>
                    </div>
                </div>

                <div id="typingIndicator" class="typing-indicator hidden">
                    Typing...
                </div>

                <form id="messageForm" class="message-composer">
                    <button
                        id="attachButton"
                        class="icon-button composer-action"
                        type="button"
                        aria-label="Attach a file"
                        title="File attachments will be enabled later"
                    >＋</button>

                    <input
                        id="messageInput"
                        type="text"
                        placeholder="Write a message..."
                        maxlength="4000"
                        autocomplete="off"
                        aria-label="Write a message"
                    >

                    <button
                        id="emojiButton"
                        class="icon-button composer-action"
                        type="button"
                        aria-label="Insert an emoji"
                    >☺</button>

                    <button
                        id="sendButton"
                        class="send-button"
                        type="submit"
                        aria-label="Send message"
                    >➤</button>
                </form>

                <p class="preview-notice">
                    Preview mode · Messages are not sent to other users yet.
                </p>
            </section>

        </section>

        <!-- Conversation details -->
        <aside id="infoPanel" class="info-panel hidden">
            <header class="info-header">
                <h2>Conversation details</h2>
                <button id="closeInfoButton" class="icon-button" type="button">
                    ×
                </button>
            </header>

            <div class="info-profile">
                <div id="infoAvatar" class="avatar avatar-xl">A</div>
                <h3 id="infoName">Contact</h3>
                <p id="infoStatus">Preview conversation</p>
            </div>

            <div class="info-section">
                <span>ABOUT</span>
                <p id="infoAbout">A Sha'sapp contact.</p>
            </div>

            <div class="info-section">
                <span>CONVERSATION</span>
                <p id="infoMessageCount">0 preview messages</p>
            </div>

            <div class="info-section">
                <span>PRIVACY</span>
                <p>Account privacy controls will be connected to the backend in a later stage.</p>
            </div>
        </aside>
    </main>
</body>
</html>


================================================
FILE: frontend/package.json
================================================
{
  "name": "frontend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@capacitor-community/contacts": "^8.0.0",
    "@capacitor/android": "^8.6.0",
    "@capacitor/core": "^8.6.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^8.6.0",
    "esbuild": "^0.28.2"
  }
}



================================================
FILE: frontend/android/gradle.properties
================================================
# Project-wide Gradle settings.

# IDE (e.g. Android Studio) users:
# Gradle settings configured through the IDE *will override*
# any settings specified in this file.

# For more details on how to configure your build environment visit
# http://www.gradle.org/docs/current/userguide/build_environment.html

# Specifies the JVM arguments used for the daemon process.
# The setting is particularly useful for tweaking memory settings.
org.gradle.jvmargs=-Xmx1536m

# When configured, Gradle will run in incubating parallel mode.
# This option should only be used with decoupled projects. More details, visit
# http://www.gradle.org/docs/current/userguide/multi_project_builds.html#sec:decoupled_projects
# org.gradle.parallel=true

# AndroidX package structure to make it clearer which packages are bundled with the
# Android operating system, and which are packaged with your app's APK
# https://developer.android.com/topic/libraries/support-library/androidx-rn
android.useAndroidX=true



================================================
FILE: frontend/android/gradlew
================================================
#!/bin/sh

#
# Copyright © 2015-2021 the original authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0
#

##############################################################################
#
#   Gradle start up script for POSIX generated by Gradle.
#
#   Important for running:
#
#   (1) You need a POSIX-compliant shell to run this script. If your /bin/sh is
#       noncompliant, but you have some other compliant shell such as ksh or
#       bash, then to run this script, type that shell name before the whole
#       command line, like:
#
#           ksh Gradle
#
#       Busybox and similar reduced shells will NOT work, because this script
#       requires all of these POSIX shell features:
#         * functions;
#         * expansions «$var», «${var}», «${var:-default}», «${var+SET}»,
#           «${var#prefix}», «${var%suffix}», and «$( cmd )»;
#         * compound commands having a testable exit status, especially «case»;
#         * various built-in commands including «command», «set», and «ulimit».
#
#   Important for patching:
#
#   (2) This script targets any POSIX shell, so it avoids extensions provided
#       by Bash, Ksh, etc; in particular arrays are avoided.
#
#       The "traditional" practice of packing multiple parameters into a
#       space-separated string is a well documented source of bugs and security
#       problems, so this is (mostly) avoided, by progressively accumulating
#       options in "$@", and eventually passing that to Java.
#
#       Where the inherited environment variables (DEFAULT_JVM_OPTS, JAVA_OPTS,
#       and GRADLE_OPTS) rely on word-splitting, this is performed explicitly;
#       see the in-line comments for details.
#
#       There are tweaks for specific operating systems such as AIX, CygWin,
#       Darwin, MinGW, and NonStop.
#
#   (3) This script is generated from the Groovy template
#       https://github.com/gradle/gradle/blob/HEAD/platforms/jvm/plugins-application/src/main/resources/org/gradle/api/internal/plugins/unixStartScript.txt
#       within the Gradle project.
#
#       You can find Gradle at https://github.com/gradle/gradle/.
#
##############################################################################

# Attempt to set APP_HOME

# Resolve links: $0 may be a link
app_path=$0

# Need this for daisy-chained symlinks.
while
    APP_HOME=${app_path%"${app_path##*/}"}  # leaves a trailing /; empty if no leading path
    [ -h "$app_path" ]
do
    ls=$( ls -ld "$app_path" )
    link=${ls#*' -> '}
    case $link in             #(
      /*)   app_path=$link ;; #(
      *)    app_path=$APP_HOME$link ;;
    esac
done

# This is normally unused
# shellcheck disable=SC2034
APP_BASE_NAME=${0##*/}
# Discard cd standard output in case $CDPATH is set (https://github.com/gradle/gradle/issues/25036)
APP_HOME=$( cd -P "${APP_HOME:-./}" > /dev/null && printf '%s\n' "$PWD" ) || exit

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD=maximum

warn () {
    echo "$*"
} >&2

die () {
    echo
    echo "$*"
    echo
    exit 1
} >&2

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
nonstop=false
case "$( uname )" in                #(
  CYGWIN* )         cygwin=true  ;; #(
  Darwin* )         darwin=true  ;; #(
  MSYS* | MINGW* )  msys=true    ;; #(
  NONSTOP* )        nonstop=true ;;
esac

CLASSPATH="\\\"\\\""


# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD=$JAVA_HOME/jre/sh/java
    else
        JAVACMD=$JAVA_HOME/bin/java
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
else
    JAVACMD=java
    if ! command -v java >/dev/null 2>&1
    then
        die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
fi

# Increase the maximum file descriptors if we can.
if ! "$cygwin" && ! "$darwin" && ! "$nonstop" ; then
    case $MAX_FD in #(
      max*)
        # In POSIX sh, ulimit -H is undefined. That's why the result is checked to see if it worked.
        # shellcheck disable=SC2039,SC3045
        MAX_FD=$( ulimit -H -n ) ||
            warn "Could not query maximum file descriptor limit"
    esac
    case $MAX_FD in  #(
      '' | soft) :;; #(
      *)
        # In POSIX sh, ulimit -n is undefined. That's why the result is checked to see if it worked.
        # shellcheck disable=SC2039,SC3045
        ulimit -n "$MAX_FD" ||
            warn "Could not set maximum file descriptor limit to $MAX_FD"
    esac
fi

# Collect all arguments for the java command, stacking in reverse order:
#   * args from the command line
#   * the main class name
#   * -classpath
#   * -D...appname settings
#   * --module-path (only if needed)
#   * DEFAULT_JVM_OPTS, JAVA_OPTS, and GRADLE_OPTS environment variables.

# For Cygwin or MSYS, switch paths to Windows format before running java
if "$cygwin" || "$msys" ; then
    APP_HOME=$( cygpath --path --mixed "$APP_HOME" )
    CLASSPATH=$( cygpath --path --mixed "$CLASSPATH" )

    JAVACMD=$( cygpath --unix "$JAVACMD" )

    # Now convert the arguments - kludge to limit ourselves to /bin/sh
    for arg do
        if
            case $arg in                                #(
              -*)   false ;;                            # don't mess with options #(
              /?*)  t=${arg#/} t=/${t%%/*}              # looks like a POSIX filepath
                    [ -e "$t" ] ;;                      #(
              *)    false ;;
            esac
        then
            arg=$( cygpath --path --ignore --mixed "$arg" )
        fi
        # Roll the args list around exactly as many times as the number of
        # args, so each arg winds up back in the position where it started, but
        # possibly modified.
        #
        # NB: a `for` loop captures its iteration list before it begins, so
        # changing the positional parameters here affects neither the number of
        # iterations, nor the values presented in `arg`.
        shift                   # remove old arg
        set -- "$@" "$arg"      # push replacement arg
    done
fi


# Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

# Collect all arguments for the java command:
#   * DEFAULT_JVM_OPTS, JAVA_OPTS, and optsEnvironmentVar are not allowed to contain shell fragments,
#     and any embedded shellness will be escaped.
#   * For example: A user cannot expect ${Hostname} to be expanded, as it is an environment variable and will be
#     treated as '${Hostname}' itself on the command line.

set -- \
        "-Dorg.gradle.appname=$APP_BASE_NAME" \
        -classpath "$CLASSPATH" \
        -jar "$APP_HOME/gradle/wrapper/gradle-wrapper.jar" \
        "$@"

# Stop when "xargs" is not available.
if ! command -v xargs >/dev/null 2>&1
then
    die "xargs is not available"
fi

# Use "xargs" to parse quoted args.
#
# With -n1 it outputs one arg per line, with the quotes and backslashes removed.
#
# In Bash we could simply go:
#
#   readarray ARGS < <( xargs -n1 <<<"$var" ) &&
#   set -- "${ARGS[@]}" "$@"
#
# but POSIX shell has neither arrays nor command substitution, so instead we
# post-process each arg (as a line of input to sed) to backslash-escape any
# character that might be a shell metacharacter, then use eval to reverse
# that process (while maintaining the separation between arguments), and wrap
# the whole thing up as a single "set" statement.
#
# This will of course break if any of these variables contains a newline or
# an unmatched quote.
#

eval "set -- $(
        printf '%s\n' "$DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS" |
        xargs -n1 |
        sed ' s~[^-[:alnum:]+,./:=@_]~\\&~g; ' |
        tr '\n' ' '
    )" '"$@"'

exec "$JAVACMD" "$@"



================================================
FILE: frontend/android/gradlew.bat
================================================
@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem
@rem SPDX-License-Identifier: Apache-2.0
@rem

@if "%DEBUG%"=="" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
@rem This is normally unused
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH. 1>&2
echo. 1>&2
echo Please set the JAVA_HOME variable in your environment to match the 1>&2
echo location of your Java installation. 1>&2

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME% 1>&2
echo. 1>&2
echo Please set the JAVA_HOME variable in your environment to match the 1>&2
echo location of your Java installation. 1>&2

goto fail

:execute
@rem Setup the command line

set CLASSPATH=


@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" -jar "%APP_HOME%\gradle\wrapper\gradle-wrapper.jar" %*

:end
@rem End local scope for the variables with windows NT shell
if %ERRORLEVEL% equ 0 goto mainEnd

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% equ 0 set EXIT_CODE=1
if not ""=="%GRADLE_EXIT_CONSOLE%" exit %EXIT_CODE%
exit /b %EXIT_CODE%

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega



================================================
FILE: frontend/android/app/proguard-rules.pro
================================================
# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile



================================================
FILE: frontend/android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java
================================================
package com.getcapacitor.myapp;

import static org.junit.Assert.*;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Test
    public void useAppContext() throws Exception {
        // Context of the app under test.
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("com.getcapacitor.app", appContext.getPackageName());
    }
}



================================================
FILE: frontend/android/app/src/main/AndroidManifest.xml
================================================
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>



================================================
FILE: frontend/android/app/src/main/java/com/shasapp/app/MainActivity.java
================================================
package com.shasapp.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}



================================================
FILE: frontend/android/app/src/main/res/drawable/ic_launcher_background.xml
================================================
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="#26A69A"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#00000000"
        android:pathData="M9,0L9,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,0L19,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M29,0L29,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M39,0L39,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M49,0L49,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M59,0L59,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M69,0L69,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M79,0L79,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M89,0L89,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M99,0L99,108"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,9L108,9"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,19L108,19"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,29L108,29"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,39L108,39"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,49L108,49"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,59L108,59"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,69L108,69"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,79L108,79"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,89L108,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M0,99L108,99"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,29L89,29"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,39L89,39"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,49L89,49"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,59L89,59"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,69L89,69"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M19,79L89,79"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M29,19L29,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M39,19L39,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M49,19L49,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M59,19L59,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M69,19L69,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
    <path
        android:fillColor="#00000000"
        android:pathData="M79,19L79,89"
        android:strokeColor="#33FFFFFF"
        android:strokeWidth="0.8" />
</vector>



================================================
FILE: frontend/android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml
================================================
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillType="evenOdd"
        android:pathData="M32,64C32,64 38.39,52.99 44.13,50.95C51.37,48.37 70.14,49.57 70.14,49.57L108.26,87.69L108,109.01L75.97,107.97L32,64Z"
        android:strokeColor="#00000000"
        android:strokeWidth="1">
        <aapt:attr name="android:fillColor">
            <gradient
                android:endX="78.5885"
                android:endY="90.9159"
                android:startX="48.7653"
                android:startY="61.0927"
                android:type="linear">
                <item
                    android:color="#44000000"
                    android:offset="0.0" />
                <item
                    android:color="#00000000"
                    android:offset="1.0" />
            </gradient>
        </aapt:attr>
    </path>
    <path
        android:fillColor="#FFFFFF"
        android:fillType="nonZero"
        android:pathData="M66.94,46.02L66.94,46.02C72.44,50.07 76,56.61 76,64L32,64C32,56.61 35.56,50.11 40.98,46.06L36.18,41.19C35.45,40.45 35.45,39.3 36.18,38.56C36.91,37.81 38.05,37.81 38.78,38.56L44.25,44.05C47.18,42.57 50.48,41.71 54,41.71C57.48,41.71 60.78,42.57 63.68,44.05L69.11,38.56C69.84,37.81 70.98,37.81 71.71,38.56C72.44,39.3 72.44,40.45 71.71,41.19L66.94,46.02ZM62.94,56.92C64.08,56.92 65,56.01 65,54.88C65,53.76 64.08,52.85 62.94,52.85C61.8,52.85 60.88,53.76 60.88,54.88C60.88,56.01 61.8,56.92 62.94,56.92ZM45.06,56.92C46.2,56.92 47.13,56.01 47.13,54.88C47.13,53.76 46.2,52.85 45.06,52.85C43.92,52.85 43,53.76 43,54.88C43,56.01 43.92,56.92 45.06,56.92Z"
        android:strokeColor="#00000000"
        android:strokeWidth="1" />
</vector>



================================================
FILE: frontend/android/app/src/main/res/layout/activity_main.xml
================================================
<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <WebView
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</androidx.coordinatorlayout.widget.CoordinatorLayout>



================================================
FILE: frontend/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
================================================
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>


================================================
FILE: frontend/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
================================================
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>


================================================
FILE: frontend/android/app/src/main/res/values/ic_launcher_background.xml
================================================
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>


================================================
FILE: frontend/android/app/src/main/res/values/strings.xml
================================================
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Sha\'sapp</string>
    <string name="title_activity_main">Sha\'sapp</string>
    <string name="package_name">com.shasapp.app</string>
    <string name="custom_url_scheme">com.shasapp.app</string>
</resources>



================================================
FILE: frontend/android/app/src/main/res/values/styles.xml
================================================
<?xml version="1.0" encoding="utf-8"?>
<resources>

    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <!-- Customize your theme here. -->
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
    </style>


    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
    </style>
</resources>


================================================
FILE: frontend/android/app/src/main/res/xml/file_paths.xml
================================================
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="." />
    <cache-path name="my_cache_images" path="." />
</paths>


================================================
FILE: frontend/android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java
================================================
package com.getcapacitor.myapp;

import static org.junit.Assert.*;

import org.junit.Test;

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
public class ExampleUnitTest {

    @Test
    public void addition_isCorrect() throws Exception {
        assertEquals(4, 2 + 2);
    }
}



================================================
FILE: frontend/android/gradle/wrapper/gradle-wrapper.properties
================================================
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists



================================================
FILE: frontend/css/style.css
================================================
:root {
    color-scheme: dark;

    --bg: #0b1020;
    --panel: #111a2e;
    --panel-2: #172239;
    --panel-hover: #1c2a44;
    --input-bg: #101a2e;

    --text: #f1f5ff;
    --muted: #94a3b8;
    --border: rgba(148, 163, 184, 0.15);

    --accent: #6d8cff;
    --accent-hover: #5274f5;
    --accent-soft: rgba(109, 140, 255, 0.13);

    --bubble-out: #334db1;
    --bubble-in: #19263d;

    --success: #43d9a3;
    --danger: #ff7272;

    --radius: 18px;
    --shadow: 0 25px 80px rgba(0, 0, 0, 0.28);
}

body.light-theme {
    color-scheme: light;

    --bg: #f2f5fb;
    --panel: #ffffff;
    --panel-2: #f7f9fd;
    --panel-hover: #edf1f9;
    --input-bg: #f1f4fa;

    --text: #182238;
    --muted: #758198;
    --border: rgba(30, 41, 59, 0.10);

    --accent: #4668ed;
    --accent-hover: #3455d6;
    --accent-soft: rgba(70, 104, 237, 0.09);

    --bubble-out: #4668ed;
    --bubble-in: #edf1f8;

    --success: #119b73;
    --danger: #dc4545;

    --shadow: 0 25px 80px rgba(40, 60, 100, 0.10);
}

* {
    box-sizing: border-box;
}

html,
body {
    width: 100%;
    min-width: 320px;
    min-height: 100%;
    margin: 0;
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: Inter, "Segoe UI", Arial, sans-serif;
    font-size: 14px;
    transition: background 0.25s, color 0.25s;
}

button,
input {
    font: inherit;
}

button {
    color: inherit;
}

button:focus-visible,
input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
}

button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

button {
    cursor: pointer;
}

.hidden {
    display: none !important;
}

/* Brand */

.brand {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    color: var(--text);
    font-size: 21px;
    font-weight: 800;
    letter-spacing: -0.8px;
    text-decoration: none;
}

.brand-icon {
    display: grid;
    width: 39px;
    height: 39px;
    place-items: center;
    border-radius: 13px;
    color: white;
    background: linear-gradient(145deg, #8098ff, #4e67ee);
    box-shadow: 0 8px 25px rgba(84, 108, 242, 0.27);
}

.brand-accent {
    color: var(--accent);
}

/* Authentication */

.auth-screen {
    position: relative;
    display: grid;
    min-height: 100vh;
    padding: 32px 18px;
    place-items: center;
    overflow: hidden;
    isolation: isolate;
}

.auth-decoration {
    position: absolute;
    z-index: -1;
    width: 340px;
    height: 340px;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.15;
    pointer-events: none;
}

.decoration-one {
    top: -100px;
    left: -90px;
    background: #536fff;
}

.decoration-two {
    right: -100px;
    bottom: -100px;
    background: #a65bff;
}

.auth-card {
    width: min(100%, 440px);
    padding: 39px;
    border: 1px solid var(--border);
    border-radius: 26px;
    background: var(--panel);
    box-shadow: var(--shadow);
}

.auth-brand {
    margin-bottom: 38px;
}

.auth-heading {
    margin-bottom: 27px;
}

.eyebrow {
    margin: 0 0 13px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
}

.auth-heading h1 {
    margin: 0 0 11px;
    font-size: clamp(29px, 6vw, 36px);
    letter-spacing: -1.5px;
}

.auth-heading > p:last-child {
    color: var(--muted);
    line-height: 1.7;
}

.form-field {
    margin-bottom: 20px;
}

.form-field label,
.label-row {
    display: block;
    margin-bottom: 9px;
    font-size: 12px;
    font-weight: 700;
}

.label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.label-row label {
    margin: 0;
}

.form-field input,
.search-box input,
.message-search input {
    width: 100%;
    min-width: 0;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--input-bg);
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
}

.form-field input:focus,
.search-box input:focus,
.message-search input:focus {
    border-color: var(--accent);
}

.form-field input::placeholder,
.search-box input::placeholder,
.message-search input::placeholder,
.message-composer input::placeholder {
    color: var(--muted);
}

.text-button {
    padding: 4px;
    border: 0;
    background: transparent;
    color: var(--accent);
    font-size: 12px;
    font-weight: 700;
}

.primary-button {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 15px;
    border: 0;
    border-radius: 12px;
    background: var(--accent);
    color: white;
    font-weight: 800;
    transition: background 0.2s, transform 0.2s;
}

.primary-button:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
}

.primary-button span {
    font-size: 18px;
}

.error-message {
    min-height: 18px;
    color: var(--danger);
    font-size: 12px;
    line-height: 1.5;
}

.auth-switch {
    margin-top: 23px;
    color: var(--muted);
    text-align: center;
}

.auth-footer {
    margin-top: 35px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 9px;
    letter-spacing: 1.2px;
    text-align: center;
}

/* Application layout */

.app-screen {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    width: 100%;
    height: 100dvh;
    min-height: 480px;
    overflow: hidden;
    background: var(--bg);
}

.sidebar {
    display: flex;
    min-width: 0;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--panel);
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 20px;
}

.icon-button {
    display: grid;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 11px;
    background: transparent;
    color: var(--muted);
    font-size: 20px;
    transition: background 0.2s, color 0.2s;
}

.icon-button:hover {
    background: var(--panel-hover);
    color: var(--text);
}

.profile-mini {
    display: flex;
    align-items: center;
    gap: 11px;
    margin: 0 15px 27px;
    padding: 13px;
    border: 1px solid var(--border);
    border-radius: 15px;
    background: var(--panel-2);
}

.avatar {
    display: grid;
    width: 43px;
    height: 43px;
    flex: 0 0 auto;
    place-items: center;
    overflow: hidden;
    border-radius: 15px;
    background: linear-gradient(140deg, #91a6ff, #6674de);
    color: white;
    font-size: 17px;
    font-weight: 800;
}

.avatar-large {
    width: 43px;
    height: 43px;
    border-radius: 14px;
}

.avatar-xl {
    width: 84px;
    height: 84px;
    border-radius: 27px;
    font-size: 30px;
}

.profile-details,
.chat-contact-details {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 5px;
}

.profile-details strong,
.chat-contact-details h2 {
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.profile-details span,
.chat-contact-details p {
    overflow: hidden;
    color: var(--muted);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sidebar-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px 17px;
}

.sidebar-title-row h2 {
    margin: 0;
    font-size: 18px;
    letter-spacing: -0.5px;
}

.count-badge {
    display: grid;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    place-items: center;
    border-radius: 7px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 10px;
    font-weight: 800;
}

.search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 15px 15px;
    padding-left: 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--input-bg);
    color: var(--muted);
}

.search-box input {
    padding: 12px 8px 12px 0;
    border: 0;
    background: transparent;
    font-size: 11px;
}

.search-box input:focus {
    border: 0;
}

.filter-tabs {
    display: flex;
    gap: 7px;
    padding: 0 15px 13px;
}

.filter-tab {
    padding: 8px 13px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: transparent;
    color: var(--muted);
    font-size: 11px;
}

.filter-tab.active {
    border-color: transparent;
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 800;
}

.conversation-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 9px;
}

.conversation-item {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 11px;
    margin-bottom: 4px;
    padding: 12px 10px;
    border: 1px solid transparent;
    border-radius: 13px;
    background: transparent;
    color: var(--text);
    text-align: left;
}

.conversation-item:hover {
    background: var(--panel-hover);
}

.conversation-item.active {
    border-color: var(--border);
    background: var(--accent-soft);
}

.conversation-item .avatar {
    position: relative;
}

.conversation-item .avatar.online::after {
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 10px;
    height: 10px;
    border: 2px solid var(--panel);
    border-radius: 50%;
    background: var(--success);
    content: "";
}

.conversation-details {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 6px;
}

.conversation-top,
.conversation-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
}

.conversation-top strong {
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.conversation-top time {
    flex: 0 0 auto;
    color: var(--muted);
    font-size: 9px;
}

.conversation-bottom span:first-child {
    overflow: hidden;
    color: var(--muted);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.unread-badge {
    display: grid;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    place-items: center;
    border-radius: 6px;
    background: var(--accent);
    color: white;
    font-size: 9px;
    font-weight: 800;
}

.no-conversations {
    padding: 25px 15px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
    text-align: center;
}

.sidebar-bottom {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
}

.connection-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    font-weight: 700;
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f5bd4f;
}

.sidebar-bottom p {
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 10px;
}

/* Chat area */

.chat-area {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background:
        radial-gradient(
            circle at 50% 35%,
            var(--accent-soft),
            transparent 45%
        ),
        var(--bg);
}

.empty-state {
    display: flex;
    width: min(100%, 530px);
    margin: auto;
    padding: 35px;
    align-items: center;
    flex-direction: column;
    text-align: center;
}

.empty-illustration {
    position: relative;
    display: grid;
    width: 180px;
    height: 145px;
    margin-bottom: 25px;
    place-items: center;
}

.illustration-circle {
    display: grid;
    width: 85px;
    height: 85px;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 30px;
    background: linear-gradient(145deg, #8198ff, #4f67e9);
    box-shadow: 0 15px 40px rgba(79, 103, 233, 0.3);
    color: white;
    font-size: 35px;
    font-weight: 900;
    transform: rotate(-8deg);
}

.illustration-bubble {
    position: absolute;
    padding: 11px 16px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
    box-shadow: var(--shadow);
    font-size: 12px;
    font-weight: 700;
}

.bubble-one {
    top: 8px;
    left: 0;
    transform: rotate(-8deg);
}

.bubble-two {
    right: -4px;
    bottom: 10px;
    transform: rotate(7deg);
}

.empty-state h1 {
    margin: 0;
    font-size: clamp(28px, 4vw, 39px);
    line-height: 1.2;
    letter-spacing: -1.5px;
}

.empty-state > p:not(.eyebrow) {
    max-width: 390px;
    margin: 17px 0 24px;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.8;
}

.secondary-button {
    padding: 12px 17px;
    border: 1px solid var(--border);
    border-radius: 11px;
    background: var(--panel);
    color: var(--text);
    font-size: 11px;
    font-weight: 700;
}

.secondary-button:hover {
    border-color: var(--accent);
}

/* Active conversation */

.chat-panel {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
}

.chat-header {
    display: flex;
    min-height: 78px;
    align-items: center;
    gap: 13px;
    padding: 15px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
}

.chat-contact-details h2 {
    margin: 0;
    font-size: 14px;
}

.chat-contact-details p {
    margin: 0;
}

.chat-header-actions {
    display: flex;
    gap: 5px;
}

.mobile-back {
    display: none;
}

.message-search {
    display: flex;
    gap: 10px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
}

.message-search input {
    padding: 10px;
}

.message-list {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    gap: 13px;
    overflow-y: auto;
    padding: 25px clamp(15px, 5vw, 65px);
}

.date-divider {
    display: flex;
    justify-content: center;
    margin: 0 0 8px;
}

.date-divider span {
    padding: 7px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--panel);
    color: var(--muted);
    font-size: 10px;
}

.message-row {
    display: flex;
    max-width: 80%;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
}

.message-row.outgoing {
    align-self: flex-end;
    align-items: flex-end;
}

.message-bubble {
    padding: 12px 15px;
    border: 1px solid var(--border);
    border-radius: 5px 15px 15px 15px;
    background: var(--bubble-in);
    color: var(--text);
    font-size: 12px;
    line-height: 1.7;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

.outgoing .message-bubble {
    border-color: transparent;
    border-radius: 15px 5px 15px 15px;
    background: var(--bubble-out);
    color: white;
}

.message-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 3px;
    color: var(--muted);
    font-size: 9px;
}

.message-status {
    color: var(--accent);
    font-weight: 800;
}

.typing-indicator {
    padding: 0 25px 10px;
    color: var(--muted);
    font-size: 11px;
}

.message-composer {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 9px;
    margin: 0 20px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 17px;
    background: var(--panel);
    box-shadow: var(--shadow);
}

.message-composer input {
    width: 100%;
    min-width: 0;
    padding: 11px 4px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text);
    font-size: 12px;
}

.message-composer input:focus-visible {
    outline: none;
}

.composer-action {
    font-size: 22px;
}

.send-button {
    display: grid;
    width: 39px;
    height: 39px;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    border-radius: 12px;
    background: var(--accent);
    color: white;
    font-size: 18px;
}

.send-button:hover {
    background: var(--accent-hover);
}

.preview-notice {
    margin: 10px 20px 14px;
    color: var(--muted);
    font-size: 9px;
    text-align: center;
}

/* Information panel */

.info-panel {
    position: fixed;
    z-index: 5;
    top: 0;
    right: 0;
    display: flex;
    width: min(320px, 90vw);
    height: 100dvh;
    flex-direction: column;
    overflow-y: auto;
    border-left: 1px solid var(--border);
    background: var(--panel);
    box-shadow: var(--shadow);
}

.info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid var(--border);
}

.info-header h2 {
    margin: 0;
    font-size: 14px;
}

.info-profile {
    display: flex;
    padding: 28px 20px;
    align-items: center;
    flex-direction: column;
    border-bottom: 1px solid var(--border);
}

.info-profile h3 {
    margin: 15px 0 5px;
    font-size: 16px;
}

.info-profile p {
    margin: 0;
    color: var(--muted);
    font-size: 11px;
}

.info-section {
    padding: 20px;
    border-bottom: 1px solid var(--border);
}

.info-section > span {
    color: var(--accent);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.3px;
}

.info-section p {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
}

/* Light theme refinement */

body.light-theme .illustration-circle {
    border-color: rgba(255, 255, 255, 0.3);
}

/* Responsive design */

@media (min-width: 1250px) {
    .app-screen {
        grid-template-columns: 320px minmax(0, 1fr);
    }
}

@media (max-width: 850px) {
    .app-screen {
        grid-template-columns: 265px minmax(0, 1fr);
    }

    .chat-header {
        padding: 12px 15px;
    }

    .chat-header-actions {
        gap: 0;
    }

    .message-list {
        padding-right: 18px;
        padding-left: 18px;
    }

    .message-row {
        max-width: 90%;
    }

    .empty-state {
        padding: 20px;
    }
}

@media (max-width: 600px) {
    .auth-card {
        padding: 28px 22px;
        border-radius: 21px;
    }

    .app-screen {
        position: relative;
        display: block;
        min-height: 100dvh;
        height: 100dvh;
    }

    .sidebar {
        width: 100%;
        height: 100%;
        border-right: 0;
    }

    .chat-area {
        position: absolute;
        inset: 0;
        display: none;
        width: 100%;
        height: 100%;
    }

    .app-screen.mobile-chat-open .sidebar {
        display: none;
    }

    .app-screen.mobile-chat-open .chat-area {
        display: flex;
    }

    .mobile-back {
        display: grid;
    }

    .chat-header {
        gap: 8px;
        padding: 10px;
    }

    .chat-header > .avatar {
        width: 38px;
        height: 38px;
        border-radius: 12px;
    }

    .chat-header-actions .icon-button {
        width: 32px;
    }

    .message-list {
        padding: 18px 12px;
    }

    .message-row {
        max-width: 88%;
    }

    .message-composer {
        gap: 4px;
        margin: 0 8px;
        padding: 7px;
    }

    .composer-action {
        width: 30px;
        height: 34px;
        font-size: 19px;
    }

    .send-button {
        width: 35px;
        height: 35px;
    }

    .preview-notice {
        margin-bottom: 9px;
    }

    .empty-state h1 {
        font-size: 30px;
    }
}

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}


================================================
FILE: frontend/js/app-backup.js
================================================
"use strict";

const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "shasapp_access_token";

const $ = (selector) => document.querySelector(selector);

const authScreen = $("#authScreen");
const appScreen = $("#appScreen");
const authForm = $("#authForm");
const authTitle = $("#authTitle");
const authDescription = $("#authDescription");
const authSubmit = $("#authSubmit");
const authSwitch = $("#authSwitch");
const authSwitchText = $("#authSwitchText");
const authError = $("#authError");
const nameField = $("#nameField");
const fullNameInput = $("#fullName");
const emailInput = $("#email");
const passwordInput = $("#password");

let authMode = "login";
let activeConversationId = null;
let activeFilter = "all";
let messageSearchTerm = "";
let conversationSequence = 100;

/* --------------------------------------------------
   PREVIEW CONVERSATIONS
   These messages are currently sample data.
-------------------------------------------------- */

const conversations = [
    {
        id: "preview-1",
        name: "Aarav Sharma",
        about: "Always here for a good conversation.",
        color: "linear-gradient(140deg,#6d8cff,#4454ba)",
        online: true,
        group: false,
        unread: 2,
        messages: [
            {
                id: 1,
                text: "Hey! How are you doing?",
                outgoing: false,
                time: "10:24 AM"
            },
            {
                id: 2,
                text: "I'm doing great! How about you?",
                outgoing: true,
                time: "10:25 AM"
            },
            {
                id: 3,
                text: "Pretty good. Have you checked out the new project?",
                outgoing: false,
                time: "10:26 AM"
            }
        ]
    },
    {
        id: "preview-2",
        name: "Priya Verma",
        about: "Dream big. Work hard. Stay kind.",
        color: "linear-gradient(140deg,#f59ac2,#b45ad7)",
        online: true,
        group: false,
        unread: 0,
        messages: [
            {
                id: 4,
                text: "Hi! Hope your day is going well.",
                outgoing: false,
                time: "09:45 AM"
            },
            {
                id: 5,
                text: "Thank you! Hope yours is going well too.",
                outgoing: true,
                time: "09:47 AM"
            }
        ]
    },
    {
        id: "preview-3",
        name: "College Friends 🎓",
        about: "Friends sharing college updates.",
        color: "linear-gradient(140deg,#48c6a8,#258a9b)",
        online: false,
        group: true,
        unread: 5,
        messages: [
            {
                id: 6,
                text: "Anyone ready for tomorrow's class?",
                outgoing: false,
                time: "Yesterday"
            },
            {
                id: 7,
                text: "Yes! Let's prepare together.",
                outgoing: true,
                time: "Yesterday"
            }
        ]
    },
    {
        id: "preview-4",
        name: "Rohan Das",
        about: "Music, technology, and creativity.",
        color: "linear-gradient(140deg,#ffb86b,#e77750)",
        online: false,
        group: false,
        unread: 0,
        messages: [
            {
                id: 8,
                text: "That sounds like a great idea!",
                outgoing: false,
                time: "Yesterday"
            }
        ]
    }
];

/* --------------------------------------------------
   GENERAL HELPERS
-------------------------------------------------- */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getInitials(name) {
    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase() || "?";
}

function currentTime() {
    return new Intl.DateTimeFormat([], {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date());
}

/* --------------------------------------------------
   THEME
-------------------------------------------------- */

function setTheme(theme) {
    const isLight = theme === "light";

    document.body.classList.toggle("light-theme", isLight);

    $("#themeToggle").textContent = isLight ? "☀" : "☾";

    $("#themeToggle").setAttribute(
        "aria-label",
        isLight ? "Switch to dark theme" : "Switch to light theme"
    );

    try {
        localStorage.setItem("sha-app-theme", theme);
    } catch {
        // Theme still works if browser storage is unavailable.
    }
}

function initializeTheme() {
    let savedTheme = null;

    try {
        savedTheme = localStorage.getItem("sha-app-theme");
    } catch {
        // Use the default theme.
    }

    setTheme(savedTheme || "dark");
}

$("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-theme")
        ? "dark"
        : "light";

    setTheme(nextTheme);
});

/* --------------------------------------------------
   AUTHENTICATION UI
-------------------------------------------------- */

function setAuthMode(mode) {
    authMode = mode;

    const registering = mode === "register";

    authTitle.textContent = registering
        ? "Create your account."
        : "Welcome back.";

    authDescription.textContent = registering
        ? "Join Sha'sapp and start connecting."
        : "Sign in to continue your conversations.";

    nameField.classList.toggle("hidden", !registering);

    fullNameInput.required = registering;

    passwordInput.autocomplete = registering
        ? "new-password"
        : "current-password";

    authSubmit.innerHTML = registering
        ? 'Create account <span>→</span>'
        : 'Sign in <span>→</span>';

    authSwitchText.textContent = registering
        ? "Already have an account?"
        : "New to Sha'sapp?";

    authSwitch.textContent = registering
        ? "Sign in"
        : "Create account";

    authError.textContent = "";
}

authSwitch.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
});

$("#togglePassword").addEventListener("click", () => {
    const currentlyHidden = passwordInput.type === "password";

    passwordInput.type = currentlyHidden ? "text" : "password";

    $("#togglePassword").textContent = currentlyHidden
        ? "Hide"
        : "Show";
});

/* --------------------------------------------------
   BACKEND API REQUEST HELPER
-------------------------------------------------- */

async function authApiRequest(path, options = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch {
        throw new Error(
            "Cannot connect to the backend. Make sure FastAPI is running at http://127.0.0.1:8000."
        );
    }

    const responseText = await response.text();
    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error("The server returned an invalid response.");
        }
    }

    if (!response.ok) {
        let detail = data.detail;

        if (Array.isArray(detail)) {
            detail = detail
                .map((item) => item.msg || "Invalid input")
                .join(", ");
        }

        throw new Error(
            typeof detail === "string"
                ? detail
                : `Request failed with status ${response.status}.`
        );
    }

    return data;
}

/* --------------------------------------------------
   SHOW APPLICATION AFTER LOGIN
-------------------------------------------------- */

function showAuthenticatedApp(user) {
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    const displayName = user.full_name || "Sha'sapp User";

    $("#myName").textContent = displayName;
    $("#myAvatar").textContent = getInitials(displayName);
    $("#myEmail").textContent = user.email || "";
    $("#connectionText").textContent = "Connected";

    renderConversations();

    if (activeConversationId) {
        selectConversation(activeConversationId);
    } else {
        $("#emptyState").classList.remove("hidden");
        $("#chatPanel").classList.add("hidden");
    }
}

function showAuthenticationScreen() {
    appScreen.classList.add("hidden");
    authScreen.classList.remove("hidden");

    authForm.reset();

    $("#togglePassword").textContent = "Show";
    passwordInput.type = "password";

    setAuthMode("login");
}

/* --------------------------------------------------
   REGISTER AND LOGIN
-------------------------------------------------- */

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    authError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const registering = authMode === "register";

    if (registering && !fullNameInput.value.trim()) {
        authError.textContent = "Please enter your full name.";
        return;
    }

    const originalButtonText = authSubmit.innerHTML;

    authSubmit.disabled = true;

    authSubmit.textContent = registering
        ? "Creating account..."
        : "Signing in...";

    try {
        /* REGISTER */

        if (registering) {
            await authApiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    full_name: fullNameInput.value.trim(),
                    email,
                    password
                })
            });

            setAuthMode("login");

            emailInput.value = email;
            passwordInput.value = "";

            authError.textContent =
                "Account created successfully! Please sign in.";

            return;
        }

        /* LOGIN */

        const loginData = await authApiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!loginData.access_token) {
            throw new Error(
                "The server did not return an access token."
            );
        }

        sessionStorage.setItem(
            TOKEN_KEY,
            loginData.access_token
        );

        try {
            const user = await authApiRequest("/auth/me", {
                headers: {
                    Authorization: `Bearer ${loginData.access_token}`
                }
            });

            showAuthenticatedApp(user);
        } catch (error) {
            sessionStorage.removeItem(TOKEN_KEY);
            throw error;
        }

    } catch (error) {
        authError.textContent =
            error.message || "Authentication failed. Please try again.";

    } finally {
        authSubmit.disabled = false;

        authSubmit.innerHTML = authMode === "register"
            ? 'Create account <span>→</span>'
            : 'Sign in <span>→</span>';
    }
});

/* --------------------------------------------------
   CONVERSATION LIST
-------------------------------------------------- */

function renderConversations() {
    const query = $("#searchInput").value.trim().toLowerCase();

    const filtered = conversations.filter((conversation) => {
        const matchesSearch =
            conversation.name.toLowerCase().includes(query) ||
            (conversation.messages.at(-1)?.text || "")
                .toLowerCase()
                .includes(query);

        const matchesFilter =
            activeFilter === "all" ||
            (activeFilter === "unread" && conversation.unread > 0) ||
            (activeFilter === "groups" && conversation.group);

        return matchesSearch && matchesFilter;
    });

    $("#chatCount").textContent = String(conversations.length);

    if (filtered.length === 0) {
        $("#conversationList").innerHTML =
            '<div class="no-conversations">No conversations found.</div>';
        return;
    }

    $("#conversationList").innerHTML = filtered.map((conversation) => {
        const lastMessage = conversation.messages.at(-1);

        const preview = lastMessage
            ? `${lastMessage.outgoing ? "You: " : ""}${lastMessage.text}`
            : "No messages yet";

        const isActive = conversation.id === activeConversationId;

        return `
            <button
                type="button"
                class="conversation-item ${isActive ? "active" : ""}"
                data-conversation-id="${escapeHTML(conversation.id)}"
            >
                <span
                    class="avatar ${conversation.online ? "online" : ""}"
                    style="background:${conversation.color}"
                >${escapeHTML(getInitials(conversation.name))}</span>

                <span class="conversation-details">
                    <span class="conversation-top">
                        <strong>${escapeHTML(conversation.name)}</strong>
                        <time>${escapeHTML(lastMessage?.time || "")}</time>
                    </span>

                    <span class="conversation-bottom">
                        <span>${escapeHTML(preview)}</span>

                        ${
                            conversation.unread > 0
                                ? `<span class="unread-badge">${conversation.unread}</span>`
                                : ""
                        }
                    </span>
                </span>
            </button>
        `;
    }).join("");

    $("#conversationList")
        .querySelectorAll("[data-conversation-id]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                selectConversation(button.dataset.conversationId);
            });
        });
}

/* --------------------------------------------------
   SELECT CONVERSATION
-------------------------------------------------- */

function selectConversation(id) {
    const conversation = conversations.find(
        (item) => item.id === id
    );

    if (!conversation) return;

    activeConversationId = id;
    conversation.unread = 0;
    messageSearchTerm = "";

    $("#messageSearch").classList.add("hidden");
    $("#messageSearchInput").value = "";

    $("#emptyState").classList.add("hidden");
    $("#chatPanel").classList.remove("hidden");
    $("#infoPanel").classList.add("hidden");

    $("#chatAvatar").textContent = getInitials(conversation.name);
    $("#chatAvatar").style.background = conversation.color;

    $("#chatName").textContent = conversation.name;

    $("#chatStatus").textContent = conversation.online
        ? "Online · Preview"
        : "Offline · Preview";

    $("#infoAvatar").textContent = getInitials(conversation.name);
    $("#infoAvatar").style.background = conversation.color;

    $("#infoName").textContent = conversation.name;

    $("#infoStatus").textContent = conversation.online
        ? "Online · Preview"
        : "Offline · Preview";

    $("#infoAbout").textContent = conversation.about;

    $("#infoMessageCount").textContent =
        `${conversation.messages.length} preview messages`;

    appScreen.classList.add("mobile-chat-open");

    renderConversations();
    renderMessages();

    $("#messageInput").focus();
}

/* --------------------------------------------------
   DISPLAY MESSAGES
-------------------------------------------------- */

function renderMessages() {
    const conversation = conversations.find(
        (item) => item.id === activeConversationId
    );

    if (!conversation) return;

    const filteredMessages = conversation.messages.filter((message) =>
        message.text.toLowerCase().includes(messageSearchTerm)
    );

    const messagesHTML = filteredMessages.map((message) => `
        <div class="message-row ${message.outgoing ? "outgoing" : ""}">
            <div class="message-bubble">${escapeHTML(message.text)}</div>

            <div class="message-meta">
                <time>${escapeHTML(message.time)}</time>

                ${
                    message.outgoing
                        ? '<span class="message-status" title="Preview status">✓</span>'
                        : ""
                }
            </div>
        </div>
    `).join("");

    const noResults = filteredMessages.length === 0
        ? '<p class="no-conversations">No matching messages.</p>'
        : "";

    $("#messageList").innerHTML = `
        <div class="date-divider">
            <span>Preview conversation</span>
        </div>

        ${messagesHTML}
        ${noResults}
    `;

    $("#messageList").scrollTop = $("#messageList").scrollHeight;

    $("#infoMessageCount").textContent =
        `${conversation.messages.length} preview messages`;
}

/* --------------------------------------------------
   MESSAGE COMPOSER - PREVIEW ONLY
-------------------------------------------------- */

$("#messageForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("#messageInput");
    const text = input.value.trim();

    if (!text || !activeConversationId) return;

    const conversation = conversations.find(
        (item) => item.id === activeConversationId
    );

    if (!conversation) return;

    conversation.messages.push({
        id: ++conversationSequence,
        text,
        outgoing: true,
        time: currentTime()
    });

    input.value = "";

    renderMessages();
    renderConversations();
});

/* --------------------------------------------------
   SEARCH CONVERSATIONS
-------------------------------------------------- */

$("#searchInput").addEventListener("input", renderConversations);

/* --------------------------------------------------
   CONVERSATION FILTERS
-------------------------------------------------- */

document.querySelectorAll(".filter-tab").forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        document.querySelectorAll(".filter-tab").forEach((tab) => {
            tab.classList.toggle("active", tab === button);
        });

        renderConversations();
    });
});

/* --------------------------------------------------
   SEARCH MESSAGES
-------------------------------------------------- */

$("#searchMessagesButton").addEventListener("click", () => {
    $("#messageSearch").classList.remove("hidden");
    $("#messageSearchInput").focus();
});

$("#closeMessageSearch").addEventListener("click", () => {
    $("#messageSearch").classList.add("hidden");
    $("#messageSearchInput").value = "";

    messageSearchTerm = "";

    renderMessages();
});

$("#messageSearchInput").addEventListener("input", (event) => {
    messageSearchTerm = event.target.value.trim().toLowerCase();

    renderMessages();
});

/* --------------------------------------------------
   CHAT INFORMATION PANEL
-------------------------------------------------- */

$("#chatInfoButton").addEventListener("click", () => {
    $("#infoPanel").classList.remove("hidden");
});

$("#closeInfoButton").addEventListener("click", () => {
    $("#infoPanel").classList.add("hidden");
});

/* --------------------------------------------------
   MOBILE BACK BUTTON
-------------------------------------------------- */

$("#backButton").addEventListener("click", () => {
    appScreen.classList.remove("mobile-chat-open");

    $("#infoPanel").classList.add("hidden");
});

/* --------------------------------------------------
   PREVIEW CONVERSATION BUTTON
-------------------------------------------------- */

$("#previewButton").addEventListener("click", () => {
    selectConversation(conversations[0].id);
});

/* --------------------------------------------------
   EMOJI BUTTON
-------------------------------------------------- */

$("#emojiButton").addEventListener("click", () => {
    const input = $("#messageInput");

    input.value += " 😊";
    input.focus();
});

/* --------------------------------------------------
   FILE ATTACHMENT BUTTON
-------------------------------------------------- */

$("#attachButton").addEventListener("click", () => {
    alert(
        "File sharing will be implemented after the backend and secure file storage are connected."
    );
});

/* --------------------------------------------------
   LOGOUT
-------------------------------------------------- */

$("#logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem(TOKEN_KEY);

    activeConversationId = null;
    activeFilter = "all";
    messageSearchTerm = "";

    appScreen.classList.remove("mobile-chat-open");

    showAuthenticationScreen();
});

/* --------------------------------------------------
   INITIALIZATION
-------------------------------------------------- */

initializeTheme();
setAuthMode("login");
showAuthenticationScreen();


================================================
FILE: frontend/www/index.html
================================================
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#101828">
    <meta name="description" content="Sha'sapp — Connect, chat, and stay close.">

    <title>Sha'sapp — Messaging Made Personal</title>

    <link rel="stylesheet" href="css/style.css">
    <script src="js/contacts-bridge.js"></script>
    <script src="js/app.js" defer></script>
</head>

<body>
    <!-- Authentication -->
    <section id="authScreen" class="auth-screen">
        <div class="auth-decoration decoration-one"></div>
        <div class="auth-decoration decoration-two"></div>

        <div class="auth-card">
            <a href="#" class="brand auth-brand">
                <span class="brand-icon">S</span>
                <span>Sha's<span class="brand-accent">app</span></span>
            </a>

            <div class="auth-heading">
                <p class="eyebrow">YOUR WORLD, CONNECTED</p>
                <h1 id="authTitle">Welcome back.</h1>
                <p id="authDescription">
                    Sign in to continue your conversations.
                </p>
            </div>

            <form id="authForm">
                <div id="nameField" class="form-field hidden">
                    <label for="fullName">Full name</label>
                    <input
                        id="fullName"
                        type="text"
                        placeholder="Enter your name"
                        autocomplete="name"
                    >
                </div>

                <div class="form-field">
                    <label for="email">Email address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        autocomplete="email"
                        required
                    >
                </div>

                <div class="form-field">
                    <div class="label-row">
                        <label for="password">Password</label>
                        <button
                            id="togglePassword"
                            class="text-button"
                            type="button"
                        >Show</button>
                    </div>

                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        autocomplete="current-password"
                        required
                    >
                </div>

                <p id="authError" class="error-message" role="alert"></p>

                <button id="authSubmit" class="primary-button" type="submit">
                    Sign in <span>→</span>
                </button>
            </form>

            <p class="auth-switch">
                <span id="authSwitchText">New to Sha'sapp?</span>
                <button id="authSwitch" class="text-button" type="button">
                    Create account
                </button>
            </p>

            <div class="auth-footer">
                PRIVATE CONVERSATIONS. MEANINGFUL CONNECTIONS.
            </div>
        </div>
    </section>

    <!-- Main application -->
    <main id="appScreen" class="app-screen hidden">

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <header class="sidebar-header">
                <a href="#" class="brand">
                    <span class="brand-icon">S</span>
                    <span>Sha's<span class="brand-accent">app</span></span>
                </a>

                <button
                    id="themeToggle"
                    class="icon-button"
                    type="button"
                    aria-label="Toggle theme"
                    title="Toggle light/dark theme"
                >☾</button>
            </header>

            <div class="profile-mini">
                <div id="myAvatar" class="avatar avatar-large">S</div>

                <div class="profile-details">
                    <strong id="myName">Your Profile</strong>
                    <span id="myEmail">Welcome to Sha'sapp</span>
                </div>

                <button
                    id="logoutButton"
                    class="icon-button"
                    type="button"
                    title="Sign out"
                    aria-label="Sign out"
                >↗</button>
            </div>

            <div class="sidebar-title-row">
                <h2>Messages</h2>
                <span id="chatCount" class="count-badge">0</span>
            </div>

            <div class="search-box">
                <span aria-hidden="true">⌕</span>
                <input
                    id="searchInput"
                    type="search"
                    placeholder="Search conversations"
                    aria-label="Search conversations"
                >
            </div>

<!-- Find People -->
<div class="find-people-section">
    <div class="find-people-input-row">
        <input
            id="findPeopleInput"
            type="search"
            placeholder="Search by name or email..."
            aria-label="Search people by name or email"
        >
        <button id="findPeopleButton" type="button">
            Search
        </button>
    </div>
</div>

            <!-- Phone Contacts -->
<div class="phone-contacts-section">
    <button
        id="selectPhoneContactsButton"
        class="select-phone-contacts-button"
        type="button"
    >
        <span>＋</span>
        <span>Select from Phone</span>
    </button>

    <div
        id="phoneContactsResults"
        class="phone-contacts-results hidden"
        aria-live="polite"
    ></div>
</div>

            <div class="filter-tabs">
                <button class="filter-tab active" data-filter="all" type="button">
                    All
                </button>
                <button class="filter-tab" data-filter="unread" type="button">
                    Unread
                </button>
                <button class="filter-tab" data-filter="groups" type="button">
                    Groups
                </button>
            </div>

            <div id="conversationList" class="conversation-list"></div>

            <div class="sidebar-bottom">
                <div class="connection-indicator">
                    <span class="status-dot"></span>
                    <span id="connectionText">Frontend preview</span>
                </div>
                <p>Sha'sapp · Built for connection</p>
            </div>
        </aside>

        <!-- Chat area -->
        <section class="chat-area">

            <div id="emptyState" class="empty-state">
                <div class="empty-illustration">
                    <div class="illustration-bubble bubble-one">Hi!</div>
                    <div class="illustration-bubble bubble-two">Hello 👋</div>
                    <div class="illustration-circle">S</div>
                </div>

                <p class="eyebrow">YOUR PEOPLE, YOUR SPACE</p>
                <h1>Every conversation<br>starts somewhere.</h1>
                <p>
                    Select a conversation to get started.
                    Your next meaningful connection is one message away.
                </p>

                <button id="previewButton" class="secondary-button" type="button">
                    Explore preview conversations
                </button>
            </div>

            <section id="chatPanel" class="chat-panel hidden">

                <header class="chat-header">
                    <button
                        id="backButton"
                        class="icon-button mobile-back"
                        type="button"
                        aria-label="Back to conversations"
                    >←</button>

                    <div id="chatAvatar" class="avatar">A</div>

                    <div class="chat-contact-details">
                        <h2 id="chatName">Contact</h2>
                        <p id="chatStatus">Preview conversation</p>
                    </div>

                    <div class="chat-header-actions">
                        <button
                            id="searchMessagesButton"
                            class="icon-button"
                            type="button"
                            aria-label="Find messages"
                            title="Find messages"
                        >⌕</button>

                        <button
                            id="chatInfoButton"
                            class="icon-button"
                            type="button"
                            aria-label="Conversation information"
                            title="Conversation information"
                        >ⓘ</button>
                    </div>
                </header>

                <div id="messageSearch" class="message-search hidden">
                    <input
                        id="messageSearchInput"
                        type="search"
                        placeholder="Find a message in this conversation..."
                        aria-label="Find a message"
                    >
                    <button
                        id="closeMessageSearch"
                        class="text-button"
                        type="button"
                    >Close</button>
                </div>

                <div id="messageList" class="message-list">
                    <div class="date-divider">
                        <span>Today</span>
                    </div>
                </div>

                <div id="typingIndicator" class="typing-indicator hidden">
                    Typing...
                </div>

                <!-- Upload progress -->
                <div id="uploadProgress" class="upload-progress hidden">
                    <div class="upload-progress-heading">
                        <span id="uploadProgressText">Uploading media...</span>
                        <span id="uploadProgressPercent">0%</span>
                    </div>
                    <div class="upload-progress-track">
                        <div id="uploadProgressBar" class="upload-progress-bar"></div>
                    </div>
                    <button
                        id="cancelUploadButton"
                        class="text-button"
                        type="button"
                    >Cancel</button>
                </div>

                <!-- Media preview before sending -->
                <div id="mediaPreview" class="media-preview hidden">
                    <div id="mediaPreviewContent" class="media-preview-content"></div>
                    <div class="media-preview-actions">
                        <span id="mediaPreviewName">Selected media</span>
                        <button
                            id="removeMediaButton"
                            class="icon-button"
                            type="button"
                            aria-label="Remove selected media"
                            title="Remove selected media"
                        >×</button>
                    </div>
                </div>

                <!-- Hidden file inputs -->
                <input
                    id="galleryInput"
                    class="hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                >

                <input
                    id="cameraInput"
                    class="hidden"
                    type="file"
                    accept="image/*"
                    capture="environment"
                >

                <input
                    id="audioFileInput"
                    class="hidden"
                    type="file"
                    accept="audio/*"
                >

                <!-- Attachment menu -->
                <div id="attachmentMenu" class="attachment-menu hidden">
                    <button id="chooseGalleryButton" type="button">
                        <span class="attachment-icon">▧</span>
                        <span>Photos & videos</span>
                    </button>

                    <button id="openCameraButton" type="button">
                        <span class="attachment-icon">◎</span>
                        <span>Camera</span>
                    </button>

                    <button id="chooseAudioButton" type="button">
                        <span class="attachment-icon">♫</span>
                        <span>Audio file</span>
                    </button>
                </div>

                <!-- Voice recording status -->
                <div id="recordingPanel" class="recording-panel hidden">
                    <span class="recording-dot"></span>
                    <span id="recordingTimer">00:00</span>
                    <span class="recording-label">Recording voice message</span>
                    <button
                        id="cancelRecordingButton"
                        class="text-button"
                        type="button"
                    >Cancel</button>
                    <button
                        id="stopRecordingButton"
                        class="record-stop-button"
                        type="button"
                    >Stop</button>
                </div>

                <form id="messageForm" class="message-composer">
                    <button
                        id="attachButton"
                        class="icon-button composer-action"
                        type="button"
                        aria-label="Attach a file"
                        title="Attach media"
                    >＋</button>

                    <input
                        id="messageInput"
                        type="text"
                        placeholder="Write a message..."
                        maxlength="4000"
                        autocomplete="off"
                        aria-label="Write a message"
                    >

                    <button
                        id="emojiButton"
                        class="icon-button composer-action"
                        type="button"
                        aria-label="Insert an emoji"
                    >☺</button>

                    <button
                        id="recordButton"
                        class="icon-button composer-action"
                        type="button"
                        aria-label="Record voice message"
                        title="Record voice message"
                    >🎙</button>

                    <button
                        id="sendButton"
                        class="send-button"
                        type="submit"
                        aria-label="Send message"
                    >➤</button>
                </form>

                <p class="preview-notice">
                    Sha'sapp · Private conversations
                </p>
            </section>
        </section>

        <!-- Conversation details -->
        <aside id="infoPanel" class="info-panel hidden">
            <header class="info-header">
                <h2>Conversation details</h2>
                <button
                    id="closeInfoButton"
                    class="icon-button"
                    type="button"
                >×</button>
            </header>

            <div class="info-profile">
                <div id="infoAvatar" class="avatar avatar-xl">A</div>
                <h3 id="infoName">Contact</h3>
                <p id="infoStatus">Preview conversation</p>
            </div>

            <div class="info-section">
                <span>ABOUT</span>
                <p id="infoAbout">A Sha'sapp contact.</p>
            </div>

            <div class="info-section">
                <span>CONVERSATION</span>
                <p id="infoMessageCount">0 messages</p>
            </div>

            <div class="info-section">
                <span>PRIVACY</span>
                <p>Account privacy controls will be connected to the backend in a later stage.</p>
            </div>
        </aside>
    </main>
    <!-- Friend Request Popup -->
<div id="friendRequestModal" class="friend-request-modal hidden">
    <div class="friend-request-card">
        <div class="friend-request-icon">👋</div>
        <h2>New Friend Request</h2>
        <p id="friendRequestMessage">Someone wants to connect with you.</p>

        <div class="friend-request-actions">
            <button id="acceptFriendRequestButton" type="button">
                Accept
            </button>
            <button id="declineFriendRequestButton" type="button">
                Decline
            </button>
        </div>
    </div>
</div>
</body>
</html>


================================================
FILE: frontend/www/css/style.css
================================================
:root {
    color-scheme: dark;

    --bg: #0b1020;
    --panel: #111a2e;
    --panel-2: #172239;
    --panel-hover: #1c2a44;
    --input-bg: #101a2e;

    --text: #f1f5ff;
    --muted: #94a3b8;
    --border: rgba(148, 163, 184, 0.15);

    --accent: #6d8cff;
    --accent-hover: #5274f5;
    --accent-soft: rgba(109, 140, 255, 0.13);

    --bubble-out: #334db1;
    --bubble-in: #19263d;

    --success: #43d9a3;
    --danger: #ff7272;

    --radius: 18px;
    --shadow: 0 25px 80px rgba(0, 0, 0, 0.28);
}

body.light-theme {
    color-scheme: light;

    --bg: #f2f5fb;
    --panel: #ffffff;
    --panel-2: #f7f9fd;
    --panel-hover: #edf1f9;
    --input-bg: #f1f4fa;

    --text: #182238;
    --muted: #758198;
    --border: rgba(30, 41, 59, 0.10);

    --accent: #4668ed;
    --accent-hover: #3455d6;
    --accent-soft: rgba(70, 104, 237, 0.09);

    --bubble-out: #4668ed;
    --bubble-in: #edf1f8;

    --success: #119b73;
    --danger: #dc4545;

    --shadow: 0 25px 80px rgba(40, 60, 100, 0.10);
}

* {
    box-sizing: border-box;
}

html,
body {
    width: 100%;
    min-width: 320px;
    min-height: 100%;
    margin: 0;
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: Inter, "Segoe UI", Arial, sans-serif;
    font-size: 14px;
    transition: background 0.25s, color 0.25s;
}

button,
input {
    font: inherit;
}

button {
    color: inherit;
}

button:focus-visible,
input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
}

button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

button {
    cursor: pointer;
}

.hidden {
    display: none !important;
}

/* Brand */

.brand {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    color: var(--text);
    font-size: 21px;
    font-weight: 800;
    letter-spacing: -0.8px;
    text-decoration: none;
}

.brand-icon {
    display: grid;
    width: 39px;
    height: 39px;
    place-items: center;
    border-radius: 13px;
    color: white;
    background: linear-gradient(145deg, #8098ff, #4e67ee);
    box-shadow: 0 8px 25px rgba(84, 108, 242, 0.27);
}

.brand-accent {
    color: var(--accent);
}

/* Authentication */

.auth-screen {
    position: relative;
    display: grid;
    min-height: 100vh;
    padding: 32px 18px;
    place-items: center;
    overflow: hidden;
    isolation: isolate;
}

.auth-decoration {
    position: absolute;
    z-index: -1;
    width: 340px;
    height: 340px;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.15;
    pointer-events: none;
}

.decoration-one {
    top: -100px;
    left: -90px;
    background: #536fff;
}

.decoration-two {
    right: -100px;
    bottom: -100px;
    background: #a65bff;
}

.auth-card {
    width: min(100%, 440px);
    padding: 39px;
    border: 1px solid var(--border);
    border-radius: 26px;
    background: var(--panel);
    box-shadow: var(--shadow);
}

.auth-brand {
    margin-bottom: 38px;
}

.auth-heading {
    margin-bottom: 27px;
}

.eyebrow {
    margin: 0 0 13px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
}

.auth-heading h1 {
    margin: 0 0 11px;
    font-size: clamp(29px, 6vw, 36px);
    letter-spacing: -1.5px;
}

.auth-heading > p:last-child {
    color: var(--muted);
    line-height: 1.7;
}

.form-field {
    margin-bottom: 20px;
}

.form-field label,
.label-row {
    display: block;
    margin-bottom: 9px;
    font-size: 12px;
    font-weight: 700;
}

.label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.label-row label {
    margin: 0;
}

.form-field input,
.search-box input,
.message-search input {
    width: 100%;
    min-width: 0;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--input-bg);
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
}

.form-field input:focus,
.search-box input:focus,
.message-search input:focus {
    border-color: var(--accent);
}

.form-field input::placeholder,
.search-box input::placeholder,
.message-search input::placeholder,
.message-composer input::placeholder {
    color: var(--muted);
}

.text-button {
    padding: 4px;
    border: 0;
    background: transparent;
    color: var(--accent);
    font-size: 12px;
    font-weight: 700;
}

.primary-button {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 15px;
    border: 0;
    border-radius: 12px;
    background: var(--accent);
    color: white;
    font-weight: 800;
    transition: background 0.2s, transform 0.2s;
}

.primary-button:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
}

.primary-button span {
    font-size: 18px;
}

.error-message {
    min-height: 18px;
    color: var(--danger);
    font-size: 12px;
    line-height: 1.5;
}

.auth-switch {
    margin-top: 23px;
    color: var(--muted);
    text-align: center;
}

.auth-footer {
    margin-top: 35px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 9px;
    letter-spacing: 1.2px;
    text-align: center;
}

/* Application layout */

.app-screen {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    width: 100%;
    height: 100dvh;
    min-height: 480px;
    overflow: hidden;
    background: var(--bg);
}

.sidebar {
    display: flex;
    min-width: 0;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--panel);
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 20px;
}

.icon-button {
    display: grid;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 11px;
    background: transparent;
    color: var(--muted);
    font-size: 20px;
    transition: background 0.2s, color 0.2s;
}

.icon-button:hover {
    background: var(--panel-hover);
    color: var(--text);
}

.profile-mini {
    display: flex;
    align-items: center;
    gap: 11px;
    margin: 0 15px 27px;
    padding: 13px;
    border: 1px solid var(--border);
    border-radius: 15px;
    background: var(--panel-2);
}

.avatar {
    display: grid;
    width: 43px;
    height: 43px;
    flex: 0 0 auto;
    place-items: center;
    overflow: hidden;
    border-radius: 15px;
    background: linear-gradient(140deg, #91a6ff, #6674de);
    color: white;
    font-size: 17px;
    font-weight: 800;
}

.avatar-large {
    width: 43px;
    height: 43px;
    border-radius: 14px;
}

.avatar-xl {
    width: 84px;
    height: 84px;
    border-radius: 27px;
    font-size: 30px;
}

.profile-details,
.chat-contact-details {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 5px;
}

.profile-details strong,
.chat-contact-details h2 {
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.profile-details span,
.chat-contact-details p {
    overflow: hidden;
    color: var(--muted);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sidebar-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px 17px;
}

.sidebar-title-row h2 {
    margin: 0;
    font-size: 18px;
    letter-spacing: -0.5px;
}

.count-badge {
    display: grid;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    place-items: center;
    border-radius: 7px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 10px;
    font-weight: 800;
}

.search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 15px 15px;
    padding-left: 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--input-bg);
    color: var(--muted);
}

.search-box input {
    padding: 12px 8px 12px 0;
    border: 0;
    background: transparent;
    font-size: 11px;
}

.search-box input:focus {
    border: 0;
}

.filter-tabs {
    display: flex;
    gap: 7px;
    padding: 0 15px 13px;
}

.filter-tab {
    padding: 8px 13px;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: transparent;
    color: var(--muted);
    font-size: 11px;
}

.filter-tab.active {
    border-color: transparent;
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 800;
}

.conversation-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 9px;
}

.conversation-item {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 11px;
    margin-bottom: 4px;
    padding: 12px 10px;
    border: 1px solid transparent;
    border-radius: 13px;
    background: transparent;
    color: var(--text);
    text-align: left;
}

.conversation-item:hover {
    background: var(--panel-hover);
}

.conversation-item.active {
    border-color: var(--border);
    background: var(--accent-soft);
}

.conversation-item .avatar {
    position: relative;
}

.conversation-item .avatar.online::after {
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 10px;
    height: 10px;
    border: 2px solid var(--panel);
    border-radius: 50%;
    background: var(--success);
    content: "";
}

.conversation-details {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 6px;
}

.conversation-top,
.conversation-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
}

.conversation-top strong {
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.conversation-top time {
    flex: 0 0 auto;
    color: var(--muted);
    font-size: 9px;
}

.conversation-bottom span:first-child {
    overflow: hidden;
    color: var(--muted);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.unread-badge {
    display: grid;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    place-items: center;
    border-radius: 6px;
    background: var(--accent);
    color: white;
    font-size: 9px;
    font-weight: 800;
}

.no-conversations {
    padding: 25px 15px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
    text-align: center;
}

.sidebar-bottom {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
}

.connection-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    font-weight: 700;
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f5bd4f;
}

.sidebar-bottom p {
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 10px;
}

/* Chat area */

.chat-area {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    background:
        radial-gradient(
            circle at 50% 35%,
            var(--accent-soft),
            transparent 45%
        ),
        var(--bg);
}

.empty-state {
    display: flex;
    width: min(100%, 530px);
    margin: auto;
    padding: 35px;
    align-items: center;
    flex-direction: column;
    text-align: center;
}

.empty-illustration {
    position: relative;
    display: grid;
    width: 180px;
    height: 145px;
    margin-bottom: 25px;
    place-items: center;
}

.illustration-circle {
    display: grid;
    width: 85px;
    height: 85px;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 30px;
    background: linear-gradient(145deg, #8198ff, #4f67e9);
    box-shadow: 0 15px 40px rgba(79, 103, 233, 0.3);
    color: white;
    font-size: 35px;
    font-weight: 900;
    transform: rotate(-8deg);
}

.illustration-bubble {
    position: absolute;
    padding: 11px 16px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
    box-shadow: var(--shadow);
    font-size: 12px;
    font-weight: 700;
}

.bubble-one {
    top: 8px;
    left: 0;
    transform: rotate(-8deg);
}

.bubble-two {
    right: -4px;
    bottom: 10px;
    transform: rotate(7deg);
}

.empty-state h1 {
    margin: 0;
    font-size: clamp(28px, 4vw, 39px);
    line-height: 1.2;
    letter-spacing: -1.5px;
}

.empty-state > p:not(.eyebrow) {
    max-width: 390px;
    margin: 17px 0 24px;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.8;
}

.secondary-button {
    padding: 12px 17px;
    border: 1px solid var(--border);
    border-radius: 11px;
    background: var(--panel);
    color: var(--text);
    font-size: 11px;
    font-weight: 700;
}

.secondary-button:hover {
    border-color: var(--accent);
}

/* Active conversation */

.chat-panel {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
}

.chat-header {
    display: flex;
    min-height: 78px;
    align-items: center;
    gap: 13px;
    padding: 15px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
}

.chat-contact-details h2 {
    margin: 0;
    font-size: 14px;
}

.chat-contact-details p {
    margin: 0;
}

.chat-header-actions {
    display: flex;
    gap: 5px;
}

.mobile-back {
    display: none;
}

.message-search {
    display: flex;
    gap: 10px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
}

.message-search input {
    padding: 10px;
}

.message-list {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    gap: 13px;
    overflow-y: auto;
    padding: 25px clamp(15px, 5vw, 65px);
}

.date-divider {
    display: flex;
    justify-content: center;
    margin: 0 0 8px;
}

.date-divider span {
    padding: 7px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--panel);
    color: var(--muted);
    font-size: 10px;
}

.message-row {
    display: flex;
    max-width: 80%;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
}

.message-row.outgoing {
    align-self: flex-end;
    align-items: flex-end;
}

.message-bubble {
    padding: 12px 15px;
    border: 1px solid var(--border);
    border-radius: 5px 15px 15px 15px;
    background: var(--bubble-in);
    color: var(--text);
    font-size: 12px;
    line-height: 1.7;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

.outgoing .message-bubble {
    border-color: transparent;
    border-radius: 15px 5px 15px 15px;
    background: var(--bubble-out);
    color: white;
}

.message-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 3px;
    color: var(--muted);
    font-size: 9px;
}

.message-status {
    color: var(--accent);
    font-weight: 800;
}

.typing-indicator {
    padding: 0 25px 10px;
    color: var(--muted);
    font-size: 11px;
}

.message-composer {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 9px;
    margin: 0 20px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 17px;
    background: var(--panel);
    box-shadow: var(--shadow);
}

.message-composer input {
    width: 100%;
    min-width: 0;
    padding: 11px 4px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text);
    font-size: 12px;
}

.message-composer input:focus-visible {
    outline: none;
}

.composer-action {
    font-size: 22px;
}

.send-button {
    display: grid;
    width: 39px;
    height: 39px;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    border-radius: 12px;
    background: var(--accent);
    color: white;
    font-size: 18px;
}

.send-button:hover {
    background: var(--accent-hover);
}

.preview-notice {
    margin: 10px 20px 14px;
    color: var(--muted);
    font-size: 9px;
    text-align: center;
}

/* Information panel */

.info-panel {
    position: fixed;
    z-index: 5;
    top: 0;
    right: 0;
    display: flex;
    width: min(320px, 90vw);
    height: 100dvh;
    flex-direction: column;
    overflow-y: auto;
    border-left: 1px solid var(--border);
    background: var(--panel);
    box-shadow: var(--shadow);
}

.info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid var(--border);
}

.info-header h2 {
    margin: 0;
    font-size: 14px;
}

.info-profile {
    display: flex;
    padding: 28px 20px;
    align-items: center;
    flex-direction: column;
    border-bottom: 1px solid var(--border);
}

.info-profile h3 {
    margin: 15px 0 5px;
    font-size: 16px;
}

.info-profile p {
    margin: 0;
    color: var(--muted);
    font-size: 11px;
}

.info-section {
    padding: 20px;
    border-bottom: 1px solid var(--border);
}

.info-section > span {
    color: var(--accent);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.3px;
}

.info-section p {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.7;
}

/* Light theme refinement */

body.light-theme .illustration-circle {
    border-color: rgba(255, 255, 255, 0.3);
}

/* Responsive design */

@media (min-width: 1250px) {
    .app-screen {
        grid-template-columns: 320px minmax(0, 1fr);
    }
}

@media (max-width: 850px) {
    .app-screen {
        grid-template-columns: 265px minmax(0, 1fr);
    }

    .chat-header {
        padding: 12px 15px;
    }

    .chat-header-actions {
        gap: 0;
    }

    .message-list {
        padding-right: 18px;
        padding-left: 18px;
    }

    .message-row {
        max-width: 90%;
    }

    .empty-state {
        padding: 20px;
    }
}

@media (max-width: 600px) {
    .auth-card {
        padding: 28px 22px;
        border-radius: 21px;
    }

    .app-screen {
        position: relative;
        display: block;
        min-height: 100dvh;
        height: 100dvh;
    }

    .sidebar {
        width: 100%;
        height: 100%;
        border-right: 0;
    }

    .chat-area {
        position: absolute;
        inset: 0;
        display: none;
        width: 100%;
        height: 100%;
    }

    .app-screen.mobile-chat-open .sidebar {
        display: none;
    }

    .app-screen.mobile-chat-open .chat-area {
        display: flex;
    }

    .mobile-back {
        display: grid;
    }

    .chat-header {
        gap: 8px;
        padding: 10px;
    }

    .chat-header > .avatar {
        width: 38px;
        height: 38px;
        border-radius: 12px;
    }

    .chat-header-actions .icon-button {
        width: 32px;
    }

    .message-list {
        padding: 18px 12px;
    }

    .message-row {
        max-width: 88%;
    }

    .message-composer {
        gap: 4px;
        margin: 0 8px;
        padding: 7px;
    }

    .composer-action {
        width: 30px;
        height: 34px;
        font-size: 19px;
    }

    .send-button {
        width: 35px;
        height: 35px;
    }

    .preview-notice {
        margin-bottom: 9px;
    }

    .empty-state h1 {
        font-size: 30px;
    }
}

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* =========================================
   SHA'SAPP MEDIA SHARING
========================================= */

.upload-progress {
    margin: 10px 20px;
    padding: 13px 15px;
    border: 1px solid var(--border);
    border-radius: 13px;
    background: var(--panel);
}

.upload-progress-heading {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 9px;
    color: var(--text);
    font-size: 11px;
    font-weight: 700;
}

.upload-progress-track {
    height: 6px;
    overflow: hidden;
    border-radius: 20px;
    background: var(--panel-hover);
}

.upload-progress-bar {
    width: 0;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #6d8cff, #a16bff);
    transition: width 0.15s linear;
}

.upload-progress > .text-button {
    margin-top: 8px;
}

.media-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 10px 20px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 13px;
    background: var(--panel);
}

.media-preview-content {
    display: grid;
    width: 65px;
    height: 58px;
    flex: 0 0 auto;
    overflow: hidden;
    place-items: center;
    border-radius: 9px;
    background: var(--panel-hover);
}

.media-preview-content img,
.media-preview-content video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.media-preview-content audio {
    width: 220px;
    max-width: 100%;
}

.media-preview-actions {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.media-preview-actions span {
    overflow: hidden;
    color: var(--text);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.attachment-menu {
    display: flex;
    width: min(260px, calc(100% - 30px));
    flex-direction: column;
    gap: 4px;
    margin: 0 20px 10px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: 15px;
    background: var(--panel);
    box-shadow: var(--shadow);
}

.attachment-menu button {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--text);
    font-size: 12px;
    text-align: left;
}

.attachment-menu button:hover {
    background: var(--panel-hover);
}

.attachment-icon {
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border-radius: 10px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 19px;
}

.recording-panel {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 20px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 13px;
    background: var(--panel);
}

.recording-dot {
    width: 9px;
    height: 9px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--danger);
    animation: recording-pulse 1s infinite;
}

.recording-label {
    flex: 1;
    color: var(--muted);
    font-size: 11px;
}

.record-stop-button {
    padding: 8px 12px;
    border: 0;
    border-radius: 9px;
    background: var(--danger);
    color: white;
    font-size: 11px;
    font-weight: 700;
}

@keyframes recording-pulse {
    50% {
        opacity: 0.35;
        transform: scale(0.8);
    }
}

/* Media messages */

.message-media {
    display: block;
    max-width: min(320px, 100%);
    overflow: hidden;
    border-radius: 11px;
    background: rgba(0, 0, 0, 0.12);
}

.message-media img {
    display: block;
    width: 100%;
    max-height: 320px;
    object-fit: contain;
}

.message-media video {
    display: block;
    width: 100%;
    max-height: 320px;
    background: #000;
}

.message-media audio {
    display: block;
    width: 260px;
    max-width: 100%;
}

.media-file-details {
    padding: 8px 3px 2px;
    color: var(--muted);
    font-size: 10px;
    overflow-wrap: anywhere;
}

.message-bubble:has(.message-media) {
    padding: 6px;
}

.message-row.outgoing .media-file-details {
    color: rgba(255, 255, 255, 0.8);
}

/* Voice recording button */

#recordButton.recording {
    color: var(--danger);
    background: rgba(255, 114, 114, 0.12);
}

#recordButton {
    font-size: 18px;
}

@media (max-width: 600px) {
    .upload-progress {
        margin: 8px;
    }

    .media-preview {
        margin: 8px;
    }

    .attachment-menu {
        margin-left: 8px;
    }

    .recording-panel {
        margin: 8px;
        gap: 7px;
    }

    .recording-label {
        font-size: 10px;
    }

    .message-media {
        max-width: min(260px, 100%);
    }

    .message-media img,
    .message-media video {
        max-height: 260px;
    }
}


/* ==================================================
   PHONE CONTACTS
================================================== */

.phone-contacts-section {
    padding: 12px 0;
    width: 100%;
}

.select-phone-contacts-button {
    width: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border: 1px solid var(--border-color, rgba(128, 128, 128, 0.25));
    border-radius: 12px;
    background: var(--surface-color, rgba(128, 128, 128, 0.08));
    color: inherit;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s ease;
}

.select-phone-contacts-button:hover {
    transform: translateY(-1px);
    opacity: 0.85;
}

.select-phone-contacts-button:disabled {
    opacity: 0.5;
    cursor: wait;
}

.phone-contacts-results {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
}

.phone-contact-result {
    padding: 12px;
    border: 1px solid var(--border-color, rgba(128, 128, 128, 0.2));
    border-radius: 12px;
    background: var(--surface-color, rgba(128, 128, 128, 0.06));
}

.phone-contact-name {
    font-weight: 700;
    margin-bottom: 5px;
    overflow-wrap: anywhere;
}

.phone-contact-description {
    font-size: 13px;
    opacity: 0.75;
    margin-bottom: 10px;
    overflow-wrap: anywhere;
}

.phone-contact-action {
    min-height: 36px;
    padding: 7px 13px;
    border: 0;
    border-radius: 9px;
    background: var(--accent-color, #6757e8);
    color: white;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
}

.phone-contact-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.phone-contacts-message {
    font-size: 13px;
    opacity: 0.8;
    padding: 8px 2px;
}

/* FIND PEOPLE */
.find-people-section {
    width: 100%;
    margin-bottom: 12px;
}

.find-people-input-row {
    display: flex;
    gap: 8px;
    width: 100%;
}

.find-people-input-row input {
    flex: 1;
    min-width: 0;
    height: 44px;
    padding: 0 12px;
    border: 1px solid var(--border-color, rgba(128, 128, 128, 0.25));
    border-radius: 12px;
    background: var(--surface-color, var(--bg));
    color: var(--text);
    outline: none;
}

.find-people-input-row input:focus {
    border-color: var(--primary, #6674de);
}

.find-people-input-row button {
    min-width: 76px;
    padding: 0 14px;
    border: none;
    border-radius: 12px;
    background: var(--primary, #6674de);
    color: white;
    font-weight: 600;
    cursor: pointer;
}

.find-people-input-row button:disabled {
    opacity: 0.6;
    cursor: wait;
}
/* Friend Request Popup */
.friend-request-modal {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(8px);
}

.friend-request-modal.hidden {
    display: none !important;
}

.friend-request-card {
    width: 100%;
    max-width: 380px;
    padding: 28px 24px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 20px;
    background: #171827;
    color: #fff;
    box-shadow: 0 20px 70px rgba(0, 0, 0, 0.45);
}

.friend-request-icon {
    font-size: 42px;
    margin-bottom: 12px;
}

.friend-request-card h2 {
    margin: 0 0 10px;
    font-size: 22px;
}

.friend-request-card p {
    color: #b8b9c9;
    line-height: 1.5;
    margin-bottom: 24px;
}

.friend-request-actions {
    display: flex;
    gap: 12px;
}

.friend-request-actions button {
    flex: 1;
    min-height: 44px;
    border: 0;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
}

#acceptFriendRequestButton {
    background: #16a36a;
    color: #fff;
}

#declineFriendRequestButton {
    background: #343548;
    color: #fff;
}

.friend-request-actions button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}


================================================
FILE: frontend/www/js/app-backup.js
================================================
"use strict";

const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "shasapp_access_token";

const $ = (selector) => document.querySelector(selector);

const authScreen = $("#authScreen");
const appScreen = $("#appScreen");
const authForm = $("#authForm");
const authTitle = $("#authTitle");
const authDescription = $("#authDescription");
const authSubmit = $("#authSubmit");
const authSwitch = $("#authSwitch");
const authSwitchText = $("#authSwitchText");
const authError = $("#authError");
const nameField = $("#nameField");
const fullNameInput = $("#fullName");
const emailInput = $("#email");
const passwordInput = $("#password");

let authMode = "login";
let activeConversationId = null;
let activeFilter = "all";
let messageSearchTerm = "";
let conversationSequence = 100;

/* --------------------------------------------------
   PREVIEW CONVERSATIONS
   These messages are currently sample data.
-------------------------------------------------- */

const conversations = [
    {
        id: "preview-1",
        name: "Aarav Sharma",
        about: "Always here for a good conversation.",
        color: "linear-gradient(140deg,#6d8cff,#4454ba)",
        online: true,
        group: false,
        unread: 2,
        messages: [
            {
                id: 1,
                text: "Hey! How are you doing?",
                outgoing: false,
                time: "10:24 AM"
            },
            {
                id: 2,
                text: "I'm doing great! How about you?",
                outgoing: true,
                time: "10:25 AM"
            },
            {
                id: 3,
                text: "Pretty good. Have you checked out the new project?",
                outgoing: false,
                time: "10:26 AM"
            }
        ]
    },
    {
        id: "preview-2",
        name: "Priya Verma",
        about: "Dream big. Work hard. Stay kind.",
        color: "linear-gradient(140deg,#f59ac2,#b45ad7)",
        online: true,
        group: false,
        unread: 0,
        messages: [
            {
                id: 4,
                text: "Hi! Hope your day is going well.",
                outgoing: false,
                time: "09:45 AM"
            },
            {
                id: 5,
                text: "Thank you! Hope yours is going well too.",
                outgoing: true,
                time: "09:47 AM"
            }
        ]
    },
    {
        id: "preview-3",
        name: "College Friends 🎓",
        about: "Friends sharing college updates.",
        color: "linear-gradient(140deg,#48c6a8,#258a9b)",
        online: false,
        group: true,
        unread: 5,
        messages: [
            {
                id: 6,
                text: "Anyone ready for tomorrow's class?",
                outgoing: false,
                time: "Yesterday"
            },
            {
                id: 7,
                text: "Yes! Let's prepare together.",
                outgoing: true,
                time: "Yesterday"
            }
        ]
    },
    {
        id: "preview-4",
        name: "Rohan Das",
        about: "Music, technology, and creativity.",
        color: "linear-gradient(140deg,#ffb86b,#e77750)",
        online: false,
        group: false,
        unread: 0,
        messages: [
            {
                id: 8,
                text: "That sounds like a great idea!",
                outgoing: false,
                time: "Yesterday"
            }
        ]
    }
];

/* --------------------------------------------------
   GENERAL HELPERS
-------------------------------------------------- */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getInitials(name) {
    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase() || "?";
}

function currentTime() {
    return new Intl.DateTimeFormat([], {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date());
}

/* --------------------------------------------------
   THEME
-------------------------------------------------- */

function setTheme(theme) {
    const isLight = theme === "light";

    document.body.classList.toggle("light-theme", isLight);

    $("#themeToggle").textContent = isLight ? "☀" : "☾";

    $("#themeToggle").setAttribute(
        "aria-label",
        isLight ? "Switch to dark theme" : "Switch to light theme"
    );

    try {
        localStorage.setItem("sha-app-theme", theme);
    } catch {
        // Theme still works if browser storage is unavailable.
    }
}

function initializeTheme() {
    let savedTheme = null;

    try {
        savedTheme = localStorage.getItem("sha-app-theme");
    } catch {
        // Use the default theme.
    }

    setTheme(savedTheme || "dark");
}

$("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-theme")
        ? "dark"
        : "light";

    setTheme(nextTheme);
});

/* --------------------------------------------------
   AUTHENTICATION UI
-------------------------------------------------- */

function setAuthMode(mode) {
    authMode = mode;

    const registering = mode === "register";

    authTitle.textContent = registering
        ? "Create your account."
        : "Welcome back.";

    authDescription.textContent = registering
        ? "Join Sha'sapp and start connecting."
        : "Sign in to continue your conversations.";

    nameField.classList.toggle("hidden", !registering);

    fullNameInput.required = registering;

    passwordInput.autocomplete = registering
        ? "new-password"
        : "current-password";

    authSubmit.innerHTML = registering
        ? 'Create account <span>→</span>'
        : 'Sign in <span>→</span>';

    authSwitchText.textContent = registering
        ? "Already have an account?"
        : "New to Sha'sapp?";

    authSwitch.textContent = registering
        ? "Sign in"
        : "Create account";

    authError.textContent = "";
}

authSwitch.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
});

$("#togglePassword").addEventListener("click", () => {
    const currentlyHidden = passwordInput.type === "password";

    passwordInput.type = currentlyHidden ? "text" : "password";

    $("#togglePassword").textContent = currentlyHidden
        ? "Hide"
        : "Show";
});

/* --------------------------------------------------
   BACKEND API REQUEST HELPER
-------------------------------------------------- */

async function authApiRequest(path, options = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch {
        throw new Error(
            "Cannot connect to the backend. Make sure FastAPI is running at http://127.0.0.1:8000."
        );
    }

    const responseText = await response.text();
    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error("The server returned an invalid response.");
        }
    }

    if (!response.ok) {
        let detail = data.detail;

        if (Array.isArray(detail)) {
            detail = detail
                .map((item) => item.msg || "Invalid input")
                .join(", ");
        }

        throw new Error(
            typeof detail === "string"
                ? detail
                : `Request failed with status ${response.status}.`
        );
    }

    return data;
}

/* --------------------------------------------------
   SHOW APPLICATION AFTER LOGIN
-------------------------------------------------- */

function showAuthenticatedApp(user) {
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    const displayName = user.full_name || "Sha'sapp User";

    $("#myName").textContent = displayName;
    $("#myAvatar").textContent = getInitials(displayName);
    $("#myEmail").textContent = user.email || "";
    $("#connectionText").textContent = "Connected";

    renderConversations();

    if (activeConversationId) {
        selectConversation(activeConversationId);
    } else {
        $("#emptyState").classList.remove("hidden");
        $("#chatPanel").classList.add("hidden");
    }
}

function showAuthenticationScreen() {
    appScreen.classList.add("hidden");
    authScreen.classList.remove("hidden");

    authForm.reset();

    $("#togglePassword").textContent = "Show";
    passwordInput.type = "password";

    setAuthMode("login");
}

/* --------------------------------------------------
   REGISTER AND LOGIN
-------------------------------------------------- */

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    authError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const registering = authMode === "register";

    if (registering && !fullNameInput.value.trim()) {
        authError.textContent = "Please enter your full name.";
        return;
    }

    const originalButtonText = authSubmit.innerHTML;

    authSubmit.disabled = true;

    authSubmit.textContent = registering
        ? "Creating account..."
        : "Signing in...";

    try {
        /* REGISTER */

        if (registering) {
            await authApiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    full_name: fullNameInput.value.trim(),
                    email,
                    password
                })
            });

            setAuthMode("login");

            emailInput.value = email;
            passwordInput.value = "";

            authError.textContent =
                "Account created successfully! Please sign in.";

            return;
        }

        /* LOGIN */

        const loginData = await authApiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!loginData.access_token) {
            throw new Error(
                "The server did not return an access token."
            );
        }

        sessionStorage.setItem(
            TOKEN_KEY,
            loginData.access_token
        );

        try {
            const user = await authApiRequest("/auth/me", {
                headers: {
                    Authorization: `Bearer ${loginData.access_token}`
                }
            });

            showAuthenticatedApp(user);
        } catch (error) {
            sessionStorage.removeItem(TOKEN_KEY);
            throw error;
        }

    } catch (error) {
        authError.textContent =
            error.message || "Authentication failed. Please try again.";

    } finally {
        authSubmit.disabled = false;

        authSubmit.innerHTML = authMode === "register"
            ? 'Create account <span>→</span>'
            : 'Sign in <span>→</span>';
    }
});

/* --------------------------------------------------
   CONVERSATION LIST
-------------------------------------------------- */

function renderConversations() {
    const query = $("#searchInput").value.trim().toLowerCase();

    const filtered = conversations.filter((conversation) => {
        const matchesSearch =
            conversation.name.toLowerCase().includes(query) ||
            (conversation.messages.at(-1)?.text || "")
                .toLowerCase()
                .includes(query);

        const matchesFilter =
            activeFilter === "all" ||
            (activeFilter === "unread" && conversation.unread > 0) ||
            (activeFilter === "groups" && conversation.group);

        return matchesSearch && matchesFilter;
    });

    $("#chatCount").textContent = String(conversations.length);

    if (filtered.length === 0) {
        $("#conversationList").innerHTML =
            '<div class="no-conversations">No conversations found.</div>';
        return;
    }

    $("#conversationList").innerHTML = filtered.map((conversation) => {
        const lastMessage = conversation.messages.at(-1);

        const preview = lastMessage
            ? `${lastMessage.outgoing ? "You: " : ""}${lastMessage.text}`
            : "No messages yet";

        const isActive = conversation.id === activeConversationId;

        return `
            <button
                type="button"
                class="conversation-item ${isActive ? "active" : ""}"
                data-conversation-id="${escapeHTML(conversation.id)}"
            >
                <span
                    class="avatar ${conversation.online ? "online" : ""}"
                    style="background:${conversation.color}"
                >${escapeHTML(getInitials(conversation.name))}</span>

                <span class="conversation-details">
                    <span class="conversation-top">
                        <strong>${escapeHTML(conversation.name)}</strong>
                        <time>${escapeHTML(lastMessage?.time || "")}</time>
                    </span>

                    <span class="conversation-bottom">
                        <span>${escapeHTML(preview)}</span>

                        ${
                            conversation.unread > 0
                                ? `<span class="unread-badge">${conversation.unread}</span>`
                                : ""
                        }
                    </span>
                </span>
            </button>
        `;
    }).join("");

    $("#conversationList")
        .querySelectorAll("[data-conversation-id]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                selectConversation(button.dataset.conversationId);
            });
        });
}

/* --------------------------------------------------
   SELECT CONVERSATION
-------------------------------------------------- */

function selectConversation(id) {
    const conversation = conversations.find(
        (item) => item.id === id
    );

    if (!conversation) return;

    activeConversationId = id;
    conversation.unread = 0;
    messageSearchTerm = "";

    $("#messageSearch").classList.add("hidden");
    $("#messageSearchInput").value = "";

    $("#emptyState").classList.add("hidden");
    $("#chatPanel").classList.remove("hidden");
    $("#infoPanel").classList.add("hidden");

    $("#chatAvatar").textContent = getInitials(conversation.name);
    $("#chatAvatar").style.background = conversation.color;

    $("#chatName").textContent = conversation.name;

    $("#chatStatus").textContent = conversation.online
        ? "Online · Preview"
        : "Offline · Preview";

    $("#infoAvatar").textContent = getInitials(conversation.name);
    $("#infoAvatar").style.background = conversation.color;

    $("#infoName").textContent = conversation.name;

    $("#infoStatus").textContent = conversation.online
        ? "Online · Preview"
        : "Offline · Preview";

    $("#infoAbout").textContent = conversation.about;

    $("#infoMessageCount").textContent =
        `${conversation.messages.length} preview messages`;

    appScreen.classList.add("mobile-chat-open");

    renderConversations();
    renderMessages();

    $("#messageInput").focus();
}

/* --------------------------------------------------
   DISPLAY MESSAGES
-------------------------------------------------- */

function renderMessages() {
    const conversation = conversations.find(
        (item) => item.id === activeConversationId
    );

    if (!conversation) return;

    const filteredMessages = conversation.messages.filter((message) =>
        message.text.toLowerCase().includes(messageSearchTerm)
    );

    const messagesHTML = filteredMessages.map((message) => `
        <div class="message-row ${message.outgoing ? "outgoing" : ""}">
            <div class="message-bubble">${escapeHTML(message.text)}</div>

            <div class="message-meta">
                <time>${escapeHTML(message.time)}</time>

                ${
                    message.outgoing
                        ? '<span class="message-status" title="Preview status">✓</span>'
                        : ""
                }
            </div>
        </div>
    `).join("");

    const noResults = filteredMessages.length === 0
        ? '<p class="no-conversations">No matching messages.</p>'
        : "";

    $("#messageList").innerHTML = `
        <div class="date-divider">
            <span>Preview conversation</span>
        </div>

        ${messagesHTML}
        ${noResults}
    `;

    $("#messageList").scrollTop = $("#messageList").scrollHeight;

    $("#infoMessageCount").textContent =
        `${conversation.messages.length} preview messages`;
}

/* --------------------------------------------------
   MESSAGE COMPOSER - PREVIEW ONLY
-------------------------------------------------- */

$("#messageForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("#messageInput");
    const text = input.value.trim();

    if (!text || !activeConversationId) return;

    const conversation = conversations.find(
        (item) => item.id === activeConversationId
    );

    if (!conversation) return;

    conversation.messages.push({
        id: ++conversationSequence,
        text,
        outgoing: true,
        time: currentTime()
    });

    input.value = "";

    renderMessages();
    renderConversations();
});

/* --------------------------------------------------
   SEARCH CONVERSATIONS
-------------------------------------------------- */

$("#searchInput").addEventListener("input", renderConversations);

/* --------------------------------------------------
   CONVERSATION FILTERS
-------------------------------------------------- */

document.querySelectorAll(".filter-tab").forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        document.querySelectorAll(".filter-tab").forEach((tab) => {
            tab.classList.toggle("active", tab === button);
        });

        renderConversations();
    });
});

/* --------------------------------------------------
   SEARCH MESSAGES
-------------------------------------------------- */

$("#searchMessagesButton").addEventListener("click", () => {
    $("#messageSearch").classList.remove("hidden");
    $("#messageSearchInput").focus();
});

$("#closeMessageSearch").addEventListener("click", () => {
    $("#messageSearch").classList.add("hidden");
    $("#messageSearchInput").value = "";

    messageSearchTerm = "";

    renderMessages();
});

$("#messageSearchInput").addEventListener("input", (event) => {
    messageSearchTerm = event.target.value.trim().toLowerCase();

    renderMessages();
});

/* --------------------------------------------------
   CHAT INFORMATION PANEL
-------------------------------------------------- */

$("#chatInfoButton").addEventListener("click", () => {
    $("#infoPanel").classList.remove("hidden");
});

$("#closeInfoButton").addEventListener("click", () => {
    $("#infoPanel").classList.add("hidden");
});

/* --------------------------------------------------
   MOBILE BACK BUTTON
-------------------------------------------------- */

$("#backButton").addEventListener("click", () => {
    appScreen.classList.remove("mobile-chat-open");

    $("#infoPanel").classList.add("hidden");
});

/* --------------------------------------------------
   PREVIEW CONVERSATION BUTTON
-------------------------------------------------- */

$("#previewButton").addEventListener("click", () => {
    selectConversation(conversations[0].id);
});

/* --------------------------------------------------
   EMOJI BUTTON
-------------------------------------------------- */

$("#emojiButton").addEventListener("click", () => {
    const input = $("#messageInput");

    input.value += " 😊";
    input.focus();
});

/* --------------------------------------------------
   FILE ATTACHMENT BUTTON
-------------------------------------------------- */

$("#attachButton").addEventListener("click", () => {
    alert(
        "File sharing will be implemented after the backend and secure file storage are connected."
    );
});

/* --------------------------------------------------
   LOGOUT
-------------------------------------------------- */

$("#logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem(TOKEN_KEY);

    activeConversationId = null;
    activeFilter = "all";
    messageSearchTerm = "";

    appScreen.classList.remove("mobile-chat-open");

    showAuthenticationScreen();
});

/* --------------------------------------------------
   INITIALIZATION
-------------------------------------------------- */

initializeTheme();
setAuthMode("login");
showAuthenticationScreen();


================================================
FILE: frontend/www/js/contacts-bridge.js
================================================
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor-community/contacts/dist/esm/definitions.js
  var PhoneType, EmailType, PostalAddressType;
  var init_definitions = __esm({
    "node_modules/@capacitor-community/contacts/dist/esm/definitions.js"() {
      (function(PhoneType2) {
        PhoneType2["Home"] = "home";
        PhoneType2["Work"] = "work";
        PhoneType2["Other"] = "other";
        PhoneType2["Custom"] = "custom";
        PhoneType2["Mobile"] = "mobile";
        PhoneType2["FaxWork"] = "fax_work";
        PhoneType2["FaxHome"] = "fax_home";
        PhoneType2["Pager"] = "pager";
        PhoneType2["Callback"] = "callback";
        PhoneType2["Car"] = "car";
        PhoneType2["CompanyMain"] = "company_main";
        PhoneType2["Isdn"] = "isdn";
        PhoneType2["Main"] = "main";
        PhoneType2["OtherFax"] = "other_fax";
        PhoneType2["Radio"] = "radio";
        PhoneType2["Telex"] = "telex";
        PhoneType2["TtyTdd"] = "tty_tdd";
        PhoneType2["WorkMobile"] = "work_mobile";
        PhoneType2["WorkPager"] = "work_pager";
        PhoneType2["Assistant"] = "assistant";
        PhoneType2["Mms"] = "mms";
      })(PhoneType || (PhoneType = {}));
      (function(EmailType2) {
        EmailType2["Home"] = "home";
        EmailType2["Work"] = "work";
        EmailType2["Other"] = "other";
        EmailType2["Custom"] = "custom";
        EmailType2["Mobile"] = "mobile";
      })(EmailType || (EmailType = {}));
      (function(PostalAddressType2) {
        PostalAddressType2["Home"] = "home";
        PostalAddressType2["Work"] = "work";
        PostalAddressType2["Other"] = "other";
        PostalAddressType2["Custom"] = "custom";
      })(PostalAddressType || (PostalAddressType = {}));
    }
  });

  // node_modules/@capacitor-community/contacts/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    ContactsWeb: () => ContactsWeb
  });
  var ContactsWeb;
  var init_web = __esm({
    "node_modules/@capacitor-community/contacts/dist/esm/web.js"() {
      init_dist();
      ContactsWeb = class extends WebPlugin {
        async checkPermissions() {
          throw this.unimplemented("Not implemented on web.");
        }
        async requestPermissions() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getContact() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getContacts() {
          throw this.unimplemented("Not implemented on web.");
        }
        async createContact() {
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteContact() {
          throw this.unimplemented("Not implemented on web.");
        }
        async pickContact() {
          throw this.unimplemented("Not implemented on web.");
        }
      };
    }
  });

  // node_modules/@capacitor-community/contacts/dist/esm/index.js
  var Contacts;
  var init_esm = __esm({
    "node_modules/@capacitor-community/contacts/dist/esm/index.js"() {
      init_dist();
      init_definitions();
      Contacts = registerPlugin("Contacts", {
        web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.ContactsWeb())
      });
    }
  });

  // contacts-bridge.js
  var require_contacts_bridge = __commonJS({
    "contacts-bridge.js"() {
      init_esm();
      window.ShaContacts = Contacts;
    }
  });
  require_contacts_bridge();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/


