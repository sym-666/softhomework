import logging
import uuid
from datetime import UTC, datetime
from pathlib import PurePosixPath
from urllib.parse import urlsplit

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
)
from fastapi.responses import FileResponse, RedirectResponse, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.deps import get_current_user
from app.models import Paper, User
from app.schemas import CamelModel, UtcDatetime
from app.services.export import papers_to_bibtex
from app.services.ingestion import ingest_paper
from app.services.semantic_scholar import SearchUnavailableError, search_papers
from app.services.storage import paper_storage_dir

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/papers", tags=["papers"])

MAX_PDF_BYTES = 20 * 1024 * 1024
PDF_SIGNATURE = b"%PDF-"
PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


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
    ingest_status: str
    created_by_user_id: str
    created_by_user_name: str
    created_at: UtcDatetime


class PaperPage(CamelModel):
    items: list[PaperOut]
    total: int
    page: int
    page_size: int


class GlobalPaperOut(CamelModel):
    id: str
    title: str
    authors: str
    year: int | None
    abstract: str | None
    url: str | None
    pdf_url: str | None


class PaperSearchResponse(CamelModel):
    query: str
    total_count: int
    papers: list[GlobalPaperOut]


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
        ingest_status=paper.ingest_status,
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


# 必须放在 /{paper_id} 之前，否则 search 会被当成论文 id 匹配
@router.get("/search", response_model=PaperSearchResponse)
def search_online(
    query: str = Query(max_length=300),
    limit: int = Query(default=12, ge=1, le=50),
    _user: User = Depends(get_current_user),
) -> PaperSearchResponse:
    query = query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="搜索关键词不能为空")
    try:
        papers = search_papers(query, limit)
    except SearchUnavailableError as exc:
        raise HTTPException(status_code=503, detail="学术检索服务暂时不可用，请稍后再试") from exc
    return PaperSearchResponse(
        query=query,
        total_count=len(papers),
        papers=[GlobalPaperOut.model_validate(paper) for paper in papers],
    )


def _get_paper_or_404(paper_id: int, db: Session) -> Paper:
    paper = db.get(Paper, paper_id)
    if paper is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    return paper


def _required(value: str, label: str, max_length: int) -> str:
    value = value.strip()
    if not value:
        raise HTTPException(status_code=400, detail=f"{label}不能为空")
    if len(value) > max_length:
        raise HTTPException(status_code=400, detail=f"{label}不能超过 {max_length} 个字符")
    return value


def _normalize_tags(raw: str) -> str:
    tags: list[str] = []
    seen: set[str] = set()
    for tag in raw.replace("，", ",").split(","):
        tag = tag.strip()
        if tag and tag.lower() not in seen:
            seen.add(tag.lower())
            tags.append(tag)
    if len(tags) > 10:
        raise HTTPException(status_code=400, detail="最多添加 10 个标签")
    if any(len(tag) > 32 for tag in tags):
        raise HTTPException(status_code=400, detail="单个标签不能超过 32 个字符")
    return ",".join(tags)


def _normalize_url(raw: str | None) -> str | None:
    if raw is None or not raw.strip():
        return None
    url = raw.strip()
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.netloc:
        raise HTTPException(status_code=400, detail="论文网址必须是有效的 HTTP 或 HTTPS 地址")
    if len(url) > 2048:
        raise HTTPException(status_code=400, detail="论文网址不能超过 2048 个字符")
    return url


async def _save_pdf(file: UploadFile) -> str:
    if PurePosixPath(file.filename or "").suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="仅支持 PDF 文件")
    if file.content_type not in PDF_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="仅支持 PDF 文件")

    content = await file.read(MAX_PDF_BYTES + 1)
    if len(content) > MAX_PDF_BYTES:
        raise HTTPException(status_code=400, detail="PDF 文件不能超过 20 MB")
    if not content.startswith(PDF_SIGNATURE):
        raise HTTPException(status_code=400, detail="文件内容不是有效的 PDF")

    # 存储名由服务端生成，用户上传的文件名不参与路径拼接
    stored_name = f"{uuid.uuid4().hex}.pdf"
    directory = paper_storage_dir()
    directory.mkdir(parents=True, exist_ok=True)
    (directory / stored_name).write_bytes(content)
    return stored_name


@router.post("", response_model=PaperOut, status_code=201)
async def create_paper(
    background_tasks: BackgroundTasks,
    title: str = Form(alias="Title"),
    authors: str = Form(alias="Authors"),
    year: int = Form(alias="Year"),
    abstract: str = Form(default="", alias="Abstract"),
    tags: str = Form(default="", alias="Tags"),
    url: str | None = Form(default=None, alias="Url"),
    file: UploadFile | None = File(default=None, alias="File"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaperOut:
    title = _required(title, "论文标题", 500)
    authors = _required(authors, "作者", 1000)
    abstract = abstract.strip()
    if len(abstract) > 20_000:
        raise HTTPException(status_code=400, detail="摘要不能超过 20000 个字符")
    tags = _normalize_tags(tags)
    current_year = datetime.now(UTC).year
    if not 1500 <= year <= current_year + 1:
        raise HTTPException(status_code=400, detail=f"年份必须在 1500 到 {current_year + 1} 之间")
    source_url = _normalize_url(url)
    has_file = file is not None and bool(file.filename)
    if not has_file and source_url is None:
        raise HTTPException(status_code=400, detail="请上传 PDF 或提供论文网址")

    stored_name = await _save_pdf(file) if has_file else None
    paper = Paper(
        created_by_user_id=user.id,
        title=title,
        authors=authors,
        year=year,
        abstract=abstract,
        tags=tags,
        source_url=source_url,
        stored_file_name=stored_name,
        original_file_name=(file.filename or "")[:500] if has_file else None,
        ingest_status="pending" if stored_name else "none",
    )
    db.add(paper)
    try:
        db.commit()
    except Exception:
        # 数据库写入失败时不留下孤立文件
        db.rollback()
        if stored_name is not None:
            (paper_storage_dir() / stored_name).unlink(missing_ok=True)
        raise

    paper.created_by = user
    if stored_name is not None:
        background_tasks.add_task(ingest_paper, paper.id)
    return to_paper_out(paper)


def _bibtex_response(content: str, filename: str) -> Response:
    return Response(
        content,
        media_type="application/x-bibtex; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# 必须在 /{paper_id} 之前声明，否则 bibtex 会被当成论文编号
@router.get("/bibtex", response_model=None)
def export_library_bibtex(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    papers = db.scalars(select(Paper).order_by(Paper.created_at, Paper.id)).all()
    return _bibtex_response(papers_to_bibtex(papers), "paperpilot-library.bib")


@router.get("/{paper_id}/bibtex", response_model=None)
def export_paper_bibtex(
    paper_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    paper = _get_paper_or_404(paper_id, db)
    return _bibtex_response(papers_to_bibtex([paper]), f"paper-{paper_id}.bib")


@router.get("/{paper_id}", response_model=PaperOut)
def get_paper(
    paper_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaperOut:
    return to_paper_out(_get_paper_or_404(paper_id, db))


@router.get("/{paper_id}/download", response_model=None)
def download_paper(
    paper_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    paper = _get_paper_or_404(paper_id, db)
    if paper.stored_file_name:
        path = paper_storage_dir() / paper.stored_file_name
        if path.is_file():
            # inline 让阅读器和浏览器直接显示；FileResponse 支持 Range 请求
            return FileResponse(
                path,
                media_type="application/pdf",
                filename=f"{paper.title[:120]}.pdf",
                content_disposition_type="inline",
            )
    if paper.source_url:
        return RedirectResponse(paper.source_url, status_code=302)
    raise HTTPException(status_code=404, detail="论文文件或来源链接不可用")


@router.delete("/{paper_id}", status_code=204)
def delete_paper(
    paper_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    paper = _get_paper_or_404(paper_id, db)
    if paper.created_by_user_id != user.id:
        raise HTTPException(status_code=403, detail="只有上传者可以删除论文")

    stored_name = paper.stored_file_name
    db.delete(paper)
    db.commit()
    # 提交成功后再删文件：反过来的话，提交失败会留下指向空文件的记录
    if stored_name:
        (paper_storage_dir() / stored_name).unlink(missing_ok=True)


@router.post("/{paper_id}/ingest", response_model=PaperOut, status_code=202)
def retry_ingestion(
    paper_id: int,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaperOut:
    paper = _get_paper_or_404(paper_id, db)
    if paper.created_by_user_id != user.id:
        raise HTTPException(status_code=403, detail="只有上传者可以重新解析")
    if paper.stored_file_name is None:
        raise HTTPException(status_code=400, detail="这篇论文没有本地 PDF")
    if paper.ingest_status in ("pending", "processing"):
        raise HTTPException(status_code=409, detail="论文正在解析中")

    paper.ingest_status = "pending"
    db.commit()
    background_tasks.add_task(ingest_paper, paper.id)
    return to_paper_out(paper)
