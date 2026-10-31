
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
