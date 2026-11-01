import json
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.deps import get_current_user
from app.models import Paper, StudyCard, User
from app.schemas import CamelModel, UtcDatetime
from app.services.study_cards import CardProgress, schedule_review, summarize_progress

router = APIRouter(prefix="/api", tags=["study"])

MAX_DUE_CARDS = 50


class StudyCardOut(CamelModel):
    id: int
    paper_id: int
    paper_title: str
    kind: str
    question: str
    options: list[str]
    answer: str
    explanation: str
    page: int | None
    box: int
    due_at: UtcDatetime


class DueCards(CamelModel):
    items: list[StudyCardOut]
    total: int


class ForecastDay(CamelModel):
    date: date
    count: int


class PaperProgressOut(CamelModel):
    paper_id: int
    title: str
    total: int
    due: int
    mastered: int


class StudySummary(CamelModel):
    total: int
    due: int
    mastered: int
    next_due_at: UtcDatetime | None
    forecast: list[ForecastDay]
    papers: list[PaperProgressOut]


class ReviewRequest(CamelModel):
    correct: bool


def to_card_out(card: StudyCard) -> StudyCardOut:
    return StudyCardOut(
        id=card.id,
        paper_id=card.paper_id,
        paper_title=card.paper.title,
        kind=card.kind,
        question=card.question,
        options=json.loads(card.options),
        answer=card.answer,
        explanation=card.explanation,
        page=card.page,
        box=card.box,
        due_at=card.due_at,
    )


def count_due_cards(db: Session, user_id: str, now: datetime) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(StudyCard)
            .where(StudyCard.user_id == user_id, StudyCard.due_at <= now)
        )
        or 0
    )


def _get_own_card(card_id: int, user: User, db: Session) -> StudyCard:
    card = db.get(StudyCard, card_id)
    # 别人的卡片也返回 404，不透露它是否存在
    if card is None or card.user_id != user.id:
        raise HTTPException(status_code=404, detail="卡片不存在")
    return card


@router.get("/papers/{paper_id}/study-cards", response_model=list[StudyCardOut])
def list_paper_cards(
    paper_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StudyCardOut]:
    cards = db.scalars(
        select(StudyCard)
        .options(joinedload(StudyCard.paper))
        .where(StudyCard.user_id == user.id, StudyCard.paper_id == paper_id)
        .order_by(StudyCard.id)
    ).all()
    return [to_card_out(card) for card in cards]


@router.get("/study-cards/summary", response_model=StudySummary)
def get_study_summary(
    tz_offset: int = Query(default=0, ge=-840, le=840, alias="tzOffset"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySummary:
    rows = db.execute(
        select(StudyCard.paper_id, Paper.title, StudyCard.box, StudyCard.due_at)
        .join(Paper, Paper.id == StudyCard.paper_id)
        .where(StudyCard.user_id == user.id)
    ).all()
    progress = summarize_progress(
        [CardProgress(*row) for row in rows], datetime.now(UTC), tz_offset
    )
    return StudySummary(
        total=progress.total,
        due=progress.due,
        mastered=progress.mastered,
        next_due_at=progress.next_due_at,
        forecast=[ForecastDay(date=day, count=count) for day, count in progress.forecast],
        papers=[PaperProgressOut.model_validate(paper) for paper in progress.papers],
    )


@router.get("/study-cards/due", response_model=DueCards)
def list_due_cards(
    limit: int = Query(default=MAX_DUE_CARDS, ge=1, le=MAX_DUE_CARDS),
    paper_id: int | None = Query(default=None, alias="paperId"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DueCards:
    now = datetime.now(UTC)
    filters = [StudyCard.user_id == user.id, StudyCard.due_at <= now]
    if paper_id is not None:
        filters.append(StudyCard.paper_id == paper_id)
    cards = db.scalars(
        select(StudyCard)
        .options(joinedload(StudyCard.paper))
        .where(*filters)
        .order_by(StudyCard.due_at, StudyCard.id)
        .limit(limit)
    ).all()
    total = db.scalar(select(func.count()).select_from(StudyCard).where(*filters)) or 0
    return DueCards(items=[to_card_out(card) for card in cards], total=total)


@router.post("/study-cards/{card_id}/review", response_model=StudyCardOut)
def review_card(
    card_id: int,
    body: ReviewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyCardOut:
    card = _get_own_card(card_id, user, db)
    schedule_review(card, body.correct, datetime.now(UTC))
    db.commit()
    return to_card_out(card)


@router.delete("/study-cards/{card_id}", status_code=204)
def delete_card(
    card_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.delete(_get_own_card(card_id, user, db))
    db.commit()
