
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ConversationMember, Message
from app.routers.auth import get_current_user
from app.routers.realtime import manager


router = APIRouter(prefix="/media", tags=["Media"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
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

    # Remove optional codec parameters, e.g. audio/webm;codecs=opus.
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

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    max_size = MAX_SIZES[message_type]
    total_size = 0
    stored_path = None

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
        stored_path = UPLOAD_DIR / stored_name

        with stored_path.open("wb") as output_file:
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

                output_file.write(chunk)

        if total_size == 0:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        message.media_size_bytes = total_size
        message.media_url = f"/media/{message.id}"

        db.commit()
        db.refresh(message)

        # Broadcast only after the database commit succeeds.
        media_event = build_media_event(message)

        try:
            await manager.broadcast(conversation_id, media_event)
        except Exception:
            # A WebSocket failure must not undo a successfully saved upload.
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

        if stored_path and stored_path.exists():
            stored_path.unlink(missing_ok=True)

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

    stored_path = UPLOAD_DIR / f"{message.id}{extension}"

    if not stored_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Media file is missing from the server.",
        )

    return FileResponse(
        path=stored_path,
        media_type=message.media_mime_type,
        filename=message.media_file_name or stored_path.name,
        content_disposition_type="inline",
    )
