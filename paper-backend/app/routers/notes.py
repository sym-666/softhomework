from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.deps import get_current_user
from app.models import Note, Paper, User
from app.schemas import CamelModel, UtcDatetime

router = APIRouter(prefix="/api", tags=["notes"])


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


@router.get("/notes", response_model=NotePage)
def list_my_notes(
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50, alias="pageSize"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotePage:
    filters = [Note.user_id == user.id]
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
