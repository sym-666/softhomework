import logging

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Paper, PaperChunk
from app.services.chunking import chunk_pages
from app.services.pdf_text import PdfReadError, extract_pages, has_enough_text
from app.services.storage import paper_storage_dir

logger = logging.getLogger(__name__)


def _replace_chunks(db: Session, paper: Paper, status: str, chunks: list[PaperChunk]) -> None:
    db.execute(delete(PaperChunk).where(PaperChunk.paper_id == paper.id))
    db.add_all(chunks)
    paper.ingest_status = status
    db.commit()


def _run(db: Session, paper: Paper) -> None:
    pages = extract_pages(paper_storage_dir() / paper.stored_file_name)
    if not has_enough_text(pages):
        _replace_chunks(db, paper, "no_text", [])
        return
    chunks = [
        PaperChunk(paper_id=paper.id, chunk_index=chunk.index, page=chunk.page, text=chunk.text)
        for chunk in chunk_pages(pages)
    ]
    _replace_chunks(db, paper, "ready", chunks)


def ingest_paper(paper_id: int) -> None:
    """后台解析一篇论文。任何失败都落到 failed，不能让论文一直停在 processing。"""
    with SessionLocal() as db:
        paper = db.get(Paper, paper_id)
        if paper is None or not paper.stored_file_name:
            return
        paper.ingest_status = "processing"
        db.commit()

        try:
            _run(db, paper)
        except PdfReadError as exc:
            logger.info("论文 %d 无法读取：%s", paper_id, exc)
            _mark_failed(db, paper_id)
        except Exception:
            logger.exception("论文 %d 解析失败", paper_id)
            _mark_failed(db, paper_id)


def _mark_failed(db: Session, paper_id: int) -> None:
    db.rollback()
    paper = db.get(Paper, paper_id)
    if paper is not None:  # 解析期间论文可能已被删除
        _replace_chunks(db, paper, "failed", [])


def unfinished_paper_ids() -> list[int]:
    with SessionLocal() as db:
        return list(
            db.scalars(select(Paper.id).where(Paper.ingest_status.in_(("pending", "processing"))))
        )


def resume_ingestion(paper_ids: list[int]) -> None:
    for paper_id in paper_ids:
        ingest_paper(paper_id)
