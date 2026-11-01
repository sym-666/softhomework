import threading
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app import main
from app.db import SessionLocal
from app.main import app
from app.models import Paper, PaperChunk
from app.services import ingestion
from app.services.ingestion import ingest_paper, resume_ingestion, unfinished_paper_ids
from app.services.storage import paper_storage_dir
from tests.pdf_factory import make_pdf
from tests.test_papers import upload

LONG_TEXT = "Attention lets a model focus on relevant tokens. " * 12


def chunks_of(paper_id: int) -> list[PaperChunk]:
    with SessionLocal() as db:
        return list(
            db.scalars(
                select(PaperChunk)
                .where(PaperChunk.paper_id == paper_id)
                .order_by(PaperChunk.chunk_index)
            )
        )


def status_of(client: TestClient, paper_id: int) -> str:
    return client.get(f"/api/Papers/{paper_id}").json()["ingestStatus"]


def test_upload_ingests_pdf_with_page_numbers(user_client: TestClient) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT, "", "Second section body text."]))

    assert status_of(user_client, paper_id) == "ready"
    chunks = chunks_of(paper_id)
    assert {chunk.page for chunk in chunks} == {1, 3}
    assert "Attention" in chunks[0].text


def test_external_paper_is_not_ingested(user_client: TestClient) -> None:
    created = user_client.post(
        "/api/Papers",
        data={"Title": "T", "Authors": "A", "Year": "2020", "Url": "https://example.com"},
    )

    assert created.json()["ingestStatus"] == "none"


def test_scanned_pdf_is_marked_no_text(user_client: TestClient) -> None:
    paper_id = upload(user_client, make_pdf(["", ""]))

    assert status_of(user_client, paper_id) == "no_text"
    assert chunks_of(paper_id) == []


def test_corrupt_pdf_is_marked_failed(user_client: TestClient) -> None:
    paper_id = upload(user_client, b"%PDF-1.4\nnot really a pdf")

    assert status_of(user_client, paper_id) == "failed"


def test_missing_file_is_marked_failed(user_client: TestClient) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    with SessionLocal() as db:
        stored = db.get(Paper, paper_id).stored_file_name
    Path(paper_storage_dir() / stored).unlink()

    ingest_paper(paper_id)

    assert status_of(user_client, paper_id) == "failed"
    assert chunks_of(paper_id) == []


def test_unexpected_error_does_not_leave_processing_state(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    def explode(_pages: list) -> list:
        raise RuntimeError("boom")

    monkeypatch.setattr(ingestion, "chunk_pages", explode)
    ingest_paper(paper_id)

    assert status_of(user_client, paper_id) == "failed"


def test_reingest_replaces_chunks(user_client: TestClient) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    count = len(chunks_of(paper_id))

    ingest_paper(paper_id)

    assert len(chunks_of(paper_id)) == count


def test_ingest_ignores_missing_paper() -> None:
    ingest_paper(999)


def test_deleting_paper_removes_chunks(user_client: TestClient) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    user_client.delete(f"/api/Papers/{paper_id}")

    assert chunks_of(paper_id) == []


def test_unfinished_papers_can_be_resumed(user_client: TestClient) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    with SessionLocal() as db:
        db.get(Paper, paper_id).ingest_status = "processing"
        db.commit()

    assert unfinished_paper_ids() == [paper_id]
    resume_ingestion([paper_id])

    assert status_of(user_client, paper_id) == "ready"
    assert unfinished_paper_ids() == []


def test_startup_resumes_unfinished_papers(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    with SessionLocal() as db:
        db.get(Paper, paper_id).ingest_status = "pending"
        db.commit()
    resumed: list[list[int]] = []
    done = threading.Event()

    def record(paper_ids: list[int]) -> None:
        resumed.append(paper_ids)
        done.set()

    monkeypatch.setattr(main, "resume_ingestion", record)

    with TestClient(app):
        assert done.wait(timeout=5)

    assert resumed == [[paper_id]]


def test_startup_does_nothing_without_unfinished_papers(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail(_paper_ids: list[int]) -> None:
        raise AssertionError("不应发起恢复")

    monkeypatch.setattr(main, "resume_ingestion", fail)

    with TestClient(app):
        pass


def retry(client: TestClient, paper_id: int):
    return client.post(f"/api/Papers/{paper_id}/ingest")


def test_retry_reprocesses_failed_paper(user_client: TestClient) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    with SessionLocal() as db:
        db.get(Paper, paper_id).ingest_status = "failed"
        db.commit()

    response = retry(user_client, paper_id)

    assert response.status_code == 202
    assert response.json()["ingestStatus"] == "pending"
    assert status_of(user_client, paper_id) == "ready"


def test_retry_is_limited_to_uploader(
    user_client: TestClient, other_client: TestClient
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    assert retry(other_client, paper_id).status_code == 403


def test_retry_rejects_paper_in_progress(user_client: TestClient) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    with SessionLocal() as db:
        db.get(Paper, paper_id).ingest_status = "processing"
        db.commit()

    assert retry(user_client, paper_id).status_code == 409


def test_retry_rejects_external_paper(user_client: TestClient) -> None:
    created = user_client.post(
        "/api/Papers",
        data={"Title": "T", "Authors": "A", "Year": "2020", "Url": "https://example.com"},
    )

    assert retry(user_client, created.json()["id"]).status_code == 400
