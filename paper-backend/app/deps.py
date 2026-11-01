from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.security import decode_access_token


def get_current_user(
    token: str | None = Cookie(default=None, alias="AuthToken"),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_access_token(token) if token else None
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise HTTPException(status_code=401, detail="未登录或登录已过期")
    return user
