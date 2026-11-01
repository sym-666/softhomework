import re

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import Field, field_validator
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import CamelModel
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

AUTH_COOKIE = "AuthToken"
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


class LoginRequest(CamelModel):
    username_or_email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class UserOut(CamelModel):
    id: str
    username: str
    email: str
    role_id: int
    avatar: str | None = None


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


@router.post("/login")
def login(
    body: LoginRequest, response: Response, db: Session = Depends(get_db)
) -> dict[str, object]:
    identifier = body.username_or_email.strip()
    user = db.scalar(
        select(User).where(or_(User.username == identifier, User.email == identifier.lower()))
    )
    if not verify_password(body.password, user.password_hash if user else None):
        # 不区分“用户不存在”和“密码错误”，避免泄露账号是否存在
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    settings = get_settings()
    response.set_cookie(
        AUTH_COOKIE,
        create_access_token(user.id),
        max_age=settings.jwt_expiry_days * 24 * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )
    return {"success": True, "user": UserOut.model_validate(user).model_dump(by_alias=True)}


@router.post("/logout")
def logout(response: Response) -> dict[str, object]:
    response.delete_cookie(AUTH_COOKIE, httponly=True, samesite="lax")
    return {"success": True, "message": "已退出登录"}


@router.get("/validate")
def validate(_user: User = Depends(get_current_user)) -> dict[str, bool]:
    return {"valid": True}
