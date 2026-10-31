
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
