from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.deps import get_current_user
from app.models import Paper, User
from app.schemas import CamelModel, UtcDatetime

router = APIRouter(prefix="/api/papers", tags=["papers"])


class PaperOut(CamelModel):
    id: int
    title: str
    authors: str
    year: int
    abstract: str
    tags: list[str]
    source_url: str | None
    download_url: str
    has_local_file: bool
    created_by_user_id: str
    created_by_user_name: str
    created_at: UtcDatetime


class PaperPage(CamelModel):
    items: list[PaperOut]
    total: int
    page: int
    page_size: int


def to_paper_out(paper: Paper) -> PaperOut:
    return PaperOut(
        id=paper.id,
        title=paper.title,
        authors=paper.authors,
        year=paper.year,
        abstract=paper.abstract,
        tags=[tag for tag in paper.tags.split(",") if tag],
        source_url=paper.source_url,
        download_url=f"/api/Papers/{paper.id}/download",
        has_local_file=paper.stored_file_name is not None,
        created_by_user_id=paper.created_by_user_id,
        created_by_user_name=paper.created_by.username,
        created_at=paper.created_at,
    )


@router.get("", response_model=PaperPage)
def list_papers(
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=50, alias="pageSize"),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaperPage:
    filters = []
    if search and search.strip():
        # autoescape：搜索词里的 % 和 _ 按字面匹配，不当作通配符
        value = search.strip()
        filters.append(
            or_(
                Paper.title.icontains(value, autoescape=True),
                Paper.authors.icontains(value, autoescape=True),
                Paper.tags.icontains(value, autoescape=True),
                Paper.abstract.icontains(value, autoescape=True),
            )
        )

    total = db.scalar(select(func.count()).select_from(Paper).where(*filters)) or 0
    papers = db.scalars(
        select(Paper)
        .options(joinedload(Paper.created_by))
        .where(*filters)
        .order_by(Paper.created_at.desc(), Paper.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaperPage(
        items=[to_paper_out(paper) for paper in papers],
        total=total,
        page=page,
        page_size=page_size,
    )
