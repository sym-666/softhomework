from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.config import get_settings

JWT_ALGORITHM = "HS256"

_hasher = PasswordHasher()
# 用户不存在时也做一次验证，让响应耗时与用户存在时接近，避免枚举账号
_dummy_hash = _hasher.hash("dummy-password-for-timing")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    try:
        return _hasher.verify(password_hash or _dummy_hash, password) and password_hash is not None
    except (VerificationError, InvalidHashError):
        return False


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(days=settings.jwt_expiry_days)
    return jwt.encode(
        {"sub": user_id, "exp": expires_at}, settings.jwt_key, algorithm=JWT_ALGORITHM
    )


def decode_access_token(token: str) -> str | None:
    """返回用户 id；令牌无效或过期时返回 None。"""
    try:
        payload = jwt.decode(token, get_settings().jwt_key, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        return None
    subject = payload.get("sub")
    return subject if isinstance(subject, str) else None
