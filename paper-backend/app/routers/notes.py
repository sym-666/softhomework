from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.deps import get_current_user
from app.models import Highlight, Note, Paper, User
from app.schemas import CamelModel, UtcDatetime
from app.services.export import notes_to_markdown

router = APIRouter(prefix="/api", tags=["notes"])

RECENT_DAYS = 7


class NoteWrite(CamelModel):
    content: str = Field(max_length=10_000)
    page: int | None = Field(default=None, ge=1)

    @field_validator("content")
    @classmethod
    def strip_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("笔记内容不能为空")
        return value


class NoteOut(CamelModel):
    id: int
    paper_id: int
    paper_title: str
    page: int | None
    content: str
    created_at: UtcDatetime
    updated_at: UtcDatetime


class NotePage(CamelModel):
    items: list[NoteOut]
    total: int
    page: int
    page_size: int


class NotePaperCount(CamelModel):
    paper_id: int
    title: str
    count: int


class NoteSummary(CamelModel):
    total: int
    recent: int
    highlights: int
    papers: list[NotePaperCount]


def to_note_out(note: Note) -> NoteOut:
    return NoteOut(
        id=note.id,
        paper_id=note.paper_id,
        paper_title=note.paper.title,
        page=note.page,
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


def _get_own_note(note_id: int, user: User, db: Session) -> Note:
    note = db.get(Note, note_id)
    # 别人的笔记也返回 404，不透露这条笔记是否存在
    if note is None or note.user_id != user.id:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return note


@router.get("/papers/{paper_id}/notes", response_model=list[NoteOut])
def list_paper_notes(
    paper_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NoteOut]:
    notes = db.scalars(
        select(Note)
        .options(joinedload(Note.paper))
        .where(Note.user_id == user.id, Note.paper_id == paper_id)
        .order_by(Note.created_at.desc(), Note.id.desc())
    ).all()
    return [to_note_out(note) for note in notes]


@router.post("/papers/{paper_id}/notes", response_model=NoteOut, status_code=201)
def create_note(
    paper_id: int,
    body: NoteWrite,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteOut:
    paper = db.get(Paper, paper_id)
    if paper is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    note = Note(user_id=user.id, paper_id=paper_id, page=body.page, content=body.content)
    db.add(note)
    db.commit()
    note.paper = paper
    return to_note_out(note)


@router.put("/notes/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    body: NoteWrite,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteOut:
    note = _get_own_note(note_id, user, db)
    note.content = body.content
    note.page = body.page
    db.commit()
    return to_note_out(note)


@router.delete("/notes/{note_id}", status_code=204)
def delete_note(
    note_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.delete(_get_own_note(note_id, user, db))
    db.commit()


@router.get("/notes/summary", response_model=NoteSummary)
def get_note_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteSummary:
    note_count = func.count(Note.id)
    rows = db.execute(
        select(Paper.id, Paper.title, note_count)
        .join(Note, Note.paper_id == Paper.id)
        .where(Note.user_id == user.id)
        .group_by(Paper.id, Paper.title)
        .order_by(note_count.desc(), Paper.id)
    ).all()
    since = datetime.now(UTC) - timedelta(days=RECENT_DAYS)
    recent = db.scalar(
        select(func.count())
        .select_from(Note)
        .where(Note.user_id == user.id, Note.created_at >= since)
    )
    highlights = db.scalar(
        select(func.count()).select_from(Highlight).where(Highlight.user_id == user.id)
    )
    return NoteSummary(
        total=sum(row[2] for row in rows),
        recent=recent or 0,
        highlights=highlights or 0,
        papers=[NotePaperCount(paper_id=row[0], title=row[1], count=row[2]) for row in rows],
    )


@router.get("/notes", response_model=NotePage)
def list_my_notes(
    search: str | None = None,
    paper_id: int | None = Query(default=None, alias="paperId"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50, alias="pageSize"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotePage:
    filters = [Note.user_id == user.id]
    if paper_id is not None:
        filters.append(Note.paper_id == paper_id)
    if search and search.strip():
        filters.append(Note.content.icontains(search.strip(), autoescape=True))

    total = db.scalar(select(func.count()).select_from(Note).where(*filters)) or 0
    notes = db.scalars(
        select(Note)
        .options(joinedload(Note.paper))
        .where(*filters)
        .order_by(Note.updated_at.desc(), Note.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return NotePage(
        items=[to_note_out(note) for note in notes],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/notes/export", response_model=None)
def export_notes(
    paper_id: int | None = Query(default=None, alias="paperId"),
    language: Literal["zh-CN", "en"] = Query(default="zh-CN", alias="lang"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    filters = [Note.user_id == user.id]
    if paper_id is not None:
        filters.append(Note.paper_id == paper_id)
    notes = db.scalars(
        select(Note)
        .options(joinedload(Note.paper))
        .where(*filters)
        # 同一篇论文按页码排列，读起来和原文顺序一致；没有页码的放在最后
        .order_by(Note.paper_id, Note.page.is_(None), Note.page, Note.created_at)
    ).all()
    filename = "paperpilot-notes.md" if paper_id is None else f"paper-{paper_id}-notes.md"
    return Response(
        notes_to_markdown(notes, language),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
