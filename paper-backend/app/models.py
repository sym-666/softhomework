import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
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
    # none（无本地 PDF）/ pending / processing / ready / no_text / failed
    ingest_status: Mapped[str] = mapped_column(
        String(16), default="none", server_default="none", index=True
    )
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


class PaperChunk(Base):
    """论文全文切块，带页码，供检索和引用。"""

    __tablename__ = "paper_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    paper_id: Mapped[int] = mapped_column(
        ForeignKey("papers.id", ondelete="CASCADE"), index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer)
    page: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)


class PaperGuide(Base):
    """AI 生成的导读，全站共享，每篇论文每种语言一份，避免重复调用模型。"""

    __tablename__ = "paper_guides"
    __table_args__ = (UniqueConstraint("paper_id", "language"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"))
    language: Mapped[str] = mapped_column(String(8))
    content: Mapped[str] = mapped_column(Text)
    model: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Note(Base):
    """用户的阅读笔记，只有本人可见。"""

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    paper_id: Mapped[int] = mapped_column(
        ForeignKey("papers.id", ondelete="CASCADE"), index=True
    )
    page: Mapped[int | None] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    paper: Mapped[Paper] = relationship()


class PaperChatMessage(Base):
    """论文问答记录，只有本人可见。"""

    __tablename__ = "paper_chat_messages"
    __table_args__ = (Index("ix_paper_chat_messages_user_paper", "user_id", "paper_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"))
    # user / assistant
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
    # JSON 数组，只在读取时展示，不需要查询，单独建表没有意义
    citations: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class StudyCard(Base):
    """自测题或闪卡。复习进度因人而异，所以每个用户有自己的一份。"""

    __tablename__ = "study_cards"
    __table_args__ = (
        UniqueConstraint("user_id", "paper_id", "question"),
        Index("ix_study_cards_user_due", "user_id", "due_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"))
    # quiz（选择题）/ flashcard（闪卡）
    kind: Mapped[str] = mapped_column(String(16))
    question: Mapped[str] = mapped_column(Text)
    # 选择题的选项，JSON 数组；闪卡为空数组
    options: Mapped[str] = mapped_column(Text, default="[]")
    # 选择题是正确选项的文字，闪卡是背面内容
    answer: Mapped[str] = mapped_column(Text)
    explanation: Mapped[str] = mapped_column(Text, default="")
    page: Mapped[int | None] = mapped_column(Integer)
    # 间隔重复的盒子序号，答对加一，答错归零
    box: Mapped[int] = mapped_column(Integer, default=0)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    paper: Mapped[Paper] = relationship()


class Highlight(Base):
    """PDF 高亮，只有本人可见。"""

    __tablename__ = "highlights"
    __table_args__ = (Index("ix_highlights_user_paper", "user_id", "paper_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"))
    page: Mapped[int] = mapped_column(Integer)
    color: Mapped[str] = mapped_column(String(16))
    text: Mapped[str] = mapped_column(Text)
    # JSON 数组，坐标是相对页面的比例，缩放后仍然准确
    rects: Mapped[str] = mapped_column(Text)
    # 笔记删除后高亮保留，只解除关联
    note_id: Mapped[int | None] = mapped_column(ForeignKey("notes.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
