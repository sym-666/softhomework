import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field, field_validator
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import CamelModel
from app.security import hash_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class RegisterRequest(CamelModel):
    # 不声明 roleId：角色由服务端决定，客户端传了也会被忽略
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def strip_username(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("用户名至少 3 个字符")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_PATTERN.match(value):
            raise ValueError("邮箱格式不正确")
        return value


@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    duplicate = db.scalar(
        select(User).where(or_(User.username == body.username, User.email == body.email))
    )
    if duplicate is not None:
        raise HTTPException(status_code=400, detail="用户名或邮箱已被注册")

    db.add(
        User(
            username=body.username,
            email=body.email,
            password_hash=hash_password(body.password),
        )
    )
    try:
        db.commit()
    except IntegrityError as exc:
        # 并发注册时可能绕过上面的查询，由唯一约束兜底
        db.rollback()
        raise HTTPException(status_code=400, detail="用户名或邮箱已被注册") from exc
    return {"success": True, "message": "注册成功"}
