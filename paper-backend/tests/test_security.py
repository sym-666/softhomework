from datetime import UTC, datetime, timedelta

import jwt

from app.config import get_settings
from app.security import (
    JWT_ALGORITHM,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_is_not_plaintext_and_verifies() -> None:
    hashed = hash_password("correct horse")

    assert "correct horse" not in hashed
    assert verify_password("correct horse", hashed)
    assert not verify_password("wrong", hashed)


def test_missing_user_never_verifies() -> None:
    assert not verify_password("dummy-password-for-timing", None)


def test_malformed_hash_does_not_raise() -> None:
    assert not verify_password("anything", "not-a-hash")


def test_token_round_trip() -> None:
    assert decode_access_token(create_access_token("user-1")) == "user-1"


def test_expired_token_is_rejected() -> None:
    token = jwt.encode(
        {"sub": "user-1", "exp": datetime.now(UTC) - timedelta(seconds=1)},
        get_settings().jwt_key,
        algorithm=JWT_ALGORITHM,
    )

    assert decode_access_token(token) is None


def test_token_signed_with_other_key_is_rejected() -> None:
    token = jwt.encode({"sub": "user-1"}, "x" * 40, algorithm=JWT_ALGORITHM)

    assert decode_access_token(token) is None


def test_unsigned_token_is_rejected() -> None:
    token = jwt.encode({"sub": "user-1"}, key=None, algorithm="none")

    assert decode_access_token(token) is None
