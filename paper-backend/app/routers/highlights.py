import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Highlight, Note, Paper, User
from app.schemas import CamelModel, UtcDatetime

router = APIRouter(prefix="/api", tags=["highlights"])

HighlightColor = Literal["yellow", "green", "pink"]


class HighlightRect(CamelModel):
    """相对页面的比例，取值 0 到 1。"""

    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    width: float = Field(gt=0, le=1)
    height: float = Field(gt=0, le=1)


class HighlightCreate(CamelModel):
    page: int = Field(ge=1)
    color: HighlightColor
    text: str = Field(max_length=5000)
    # 跨多行的选区有多个矩形，上限只防止异常请求
    rects: list[HighlightRect] = Field(min_length=1, max_length=200)

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("高亮内容不能为空")
        return value


class HighlightUpdate(CamelModel):
    color: HighlightColor | None = None
    note_id: int | None = None


class HighlightOut(CamelModel):
    id: int
    paper_id: int
    page: int
    color: str
    text: str
    rects: list[HighlightRect]
    note_id: int | None
    created_at: UtcDatetime


def to_highlight_out(highlight: Highlight) -> HighlightOut:
    return HighlightOut(
        id=highlight.id,
        paper_id=highlight.paper_id,
        page=highlight.page,
        color=highlight.color,
        text=highlight.text,
        rects=json.loads(highlight.rects),
        note_id=highlight.note_id,
        created_at=highlight.created_at,
    )


def _get_own_highlight(highlight_id: int, user: User, db: Session) -> Highlight:
    highlight = db.get(Highlight, highlight_id)
    # 别人的高亮也返回 404，不透露它是否存在
    if highlight is None or highlight.user_id != user.id:
        raise HTTPException(status_code=404, detail="高亮不存在")
    return highlight


@router.get("/papers/{paper_id}/highlights", response_model=list[HighlightOut])
def list_highlights(
    paper_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[HighlightOut]:
    highlights = db.scalars(
        select(Highlight)
        .where(Highlight.user_id == user.id, Highlight.paper_id == paper_id)
        .order_by(Highlight.page, Highlight.id)
    ).all()
    return [to_highlight_out(highlight) for highlight in highlights]


@router.post("/papers/{paper_id}/highlights", response_model=HighlightOut, status_code=201)
def create_highlight(
    paper_id: int,
    body: HighlightCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HighlightOut:
    if db.get(Paper, paper_id) is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    highlight = Highlight(
        user_id=user.id,
        paper_id=paper_id,
        page=body.page,
        color=body.color,
        text=body.text,
        rects=json.dumps([rect.model_dump() for rect in body.rects]),
    )
    db.add(highlight)
    db.commit()
    return to_highlight_out(highlight)


@router.patch("/highlights/{highlight_id}", response_model=HighlightOut)
def update_highlight(
    highlight_id: int,
    body: HighlightUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HighlightOut:
    highlight = _get_own_highlight(highlight_id, user, db)
    if body.color is not None:
        highlight.color = body.color
    # 没有传 noteId 表示不修改，显式传 null 才是解除关联
    if "note_id" in body.model_fields_set:
        if body.note_id is not None:
            note = db.get(Note, body.note_id)
            if note is None or note.user_id != user.id or note.paper_id != highlight.paper_id:
                raise HTTPException(status_code=404, detail="笔记不存在")
        highlight.note_id = body.note_id
    db.commit()
    return to_highlight_out(highlight)


@router.delete("/highlights/{highlight_id}", status_code=204)
def delete_highlight(
    highlight_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.delete(_get_own_highlight(highlight_id, user, db))
    db.commit()
