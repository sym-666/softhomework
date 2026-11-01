import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    # 沿用前端约定：1 普通用户、2 管理员、3 超级管理员。注册用户固定为 1
    role_id: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Paper(Base):
    """论文库全站共享；上传者记录在 created_by_user_id。"""

    __tablename__ = "papers"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    authors: Mapped[str] = mapped_column(String(1000))
    year: Mapped[int] = mapped_column(Integer, index=True)
    abstract: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[str] = mapped_column(String(500), default="")
    source_url: Mapped[str | None] = mapped_column(String(2048))
    stored_file_name: Mapped[str | None] = mapped_column(String(128))
    original_file_name: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, index=True
    )

    created_by: Mapped[User] = relationship()


class ReadingState(Base):
    """每个用户对每篇论文的阅读进度，没有记录时视为未读。"""

    __tablename__ = "reading_states"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    paper_id: Mapped[int] = mapped_column(
        ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True
    )
    # unread / reading / done
    status: Mapped[str] = mapped_column(String(16), default="unread")
    last_page: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
