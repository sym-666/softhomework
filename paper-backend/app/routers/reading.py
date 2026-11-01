from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Paper, ReadingState, User
from app.schemas import CamelModel, UtcDatetime

router = APIRouter(prefix="/api/papers/{paper_id}/reading-state", tags=["reading"])

ReadingStatus = Literal["unread", "reading", "done"]


class ReadingStateOut(CamelModel):
    status: ReadingStatus
    last_page: int
    updated_at: UtcDatetime | None


class ReadingStateUpdate(CamelModel):
    status: ReadingStatus | None = None
    last_page: int | None = Field(default=None, ge=1)


def _require_paper(paper_id: int, db: Session) -> None:
    if db.get(Paper, paper_id) is None:
        raise HTTPException(status_code=404, detail="论文不存在")


@router.get("", response_model=ReadingStateOut)
def get_reading_state(
    paper_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReadingStateOut:
    _require_paper(paper_id, db)
    state = db.get(ReadingState, (user.id, paper_id))
    if state is None:
        return ReadingStateOut(status="unread", last_page=1, updated_at=None)
    return ReadingStateOut.model_validate(state)


@router.put("", response_model=ReadingStateOut)
def update_reading_state(
    paper_id: int,
    body: ReadingStateUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReadingStateOut:
    _require_paper(paper_id, db)
    state = db.get(ReadingState, (user.id, paper_id))
    if state is None:
        state = ReadingState(user_id=user.id, paper_id=paper_id, status="unread", last_page=1)
        db.add(state)

    if body.last_page is not None:
        state.last_page = body.last_page
        # 翻页说明开始读了；已读的论文回看时不改回在读
        if state.status == "unread":
            state.status = "reading"
    if body.status is not None:
        state.status = body.status
    db.commit()
    return ReadingStateOut.model_validate(state)
