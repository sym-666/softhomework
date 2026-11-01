from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Note, Paper, ReadingState, User
from app.schemas import CamelModel

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

ACTIVITY_DAYS = 14
CONTINUE_READING_LIMIT = 5


class DailyActivity(CamelModel):
    date: date
    papers: int
    notes: int


class ContinueReadingItem(CamelModel):
    paper_id: int
    title: str
    authors: str
    last_page: int


class Dashboard(CamelModel):
    total_papers: int
    reading: int
    done: int
    notes: int
    activity: list[DailyActivity]
    continue_reading: list[ContinueReadingItem]


def _count_states(db: Session, user: User, status: str) -> int:
    query = select(func.count()).select_from(ReadingState).where(
        ReadingState.user_id == user.id, ReadingState.status == status
    )
    return db.scalar(query) or 0


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


def build_activity(
    reading_times: list[datetime],
    note_times: list[datetime],
    now: datetime,
    tz_offset_minutes: int,
    days: int = ACTIVITY_DAYS,
) -> list[DailyActivity]:
    """按用户所在时区分天。tz_offset_minutes 与 JS getTimezoneOffset 相同：UTC 减本地时间。"""
    offset = timedelta(minutes=tz_offset_minutes)
    today = (now - offset).date()
    dates = [today - timedelta(days=index) for index in range(days - 1, -1, -1)]
    papers = dict.fromkeys(dates, 0)
    notes = dict.fromkeys(dates, 0)

    for moment in reading_times:
        day = (_as_utc(moment) - offset).date()
        if day in papers:
            papers[day] += 1
    for moment in note_times:
        day = (_as_utc(moment) - offset).date()
        if day in notes:
            notes[day] += 1

    return [DailyActivity(date=day, papers=papers[day], notes=notes[day]) for day in dates]


@router.get("", response_model=Dashboard)
def get_dashboard(
    tz_offset: int = Query(default=0, ge=-840, le=840, alias="tzOffset"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dashboard:
    now = datetime.now(UTC)
    # 多取一天，时区换算后第一天的数据才完整
    since = now - timedelta(days=ACTIVITY_DAYS + 1)
    reading_times = db.scalars(
        select(ReadingState.updated_at).where(
            ReadingState.user_id == user.id, ReadingState.updated_at >= since
        )
    ).all()
    note_times = db.scalars(
        select(Note.created_at).where(Note.user_id == user.id, Note.created_at >= since)
    ).all()
    unfinished = db.execute(
        select(Paper.id, Paper.title, Paper.authors, ReadingState.last_page)
        .join(ReadingState, ReadingState.paper_id == Paper.id)
        .where(ReadingState.user_id == user.id, ReadingState.status == "reading")
        .order_by(ReadingState.updated_at.desc())
        .limit(CONTINUE_READING_LIMIT)
    ).all()

    return Dashboard(
        total_papers=db.scalar(select(func.count()).select_from(Paper)) or 0,
        reading=_count_states(db, user, "reading"),
        done=_count_states(db, user, "done"),
        notes=db.scalar(select(func.count()).select_from(Note).where(Note.user_id == user.id))
        or 0,
        activity=build_activity(list(reading_times), list(note_times), now, tz_offset),
        continue_reading=[
            ContinueReadingItem(paper_id=row[0], title=row[1], authors=row[2], last_page=row[3])
            for row in unfinished
        ],
    )
