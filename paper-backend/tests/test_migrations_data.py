from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, text

from alembic import command
from app.config import get_settings

BEFORE_INGEST = "090d96ee6ccd"


def test_existing_local_papers_are_queued_for_ingestion(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    url = f"sqlite:///{tmp_path / 'migrated.db'}"
    monkeypatch.setenv("DATABASE_URL", url)
    get_settings.cache_clear()
    config = Config("alembic.ini")
    engine = create_engine(url)
    try:
        command.upgrade(config, BEFORE_INGEST)
        with engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO users (id, username, email, password_hash, role_id, created_at) "
                    "VALUES ('u', 'u', 'u@example.com', 'x', 1, '2026-01-01')"
                )
            )
            for paper_id, stored in [(1, "a.pdf"), (2, None)]:
                connection.execute(
                    text(
                        "INSERT INTO papers (id, created_by_user_id, title, authors, year, "
                        "abstract, tags, stored_file_name, created_at) "
                        "VALUES (:id, 'u', 't', 'a', 2020, '', '', :stored, '2026-01-01')"
                    ),
                    {"id": paper_id, "stored": stored},
                )

        command.upgrade(config, "head")

        with engine.connect() as connection:
            rows = connection.execute(
                text("SELECT id, ingest_status FROM papers ORDER BY id")
            ).all()
    finally:
        monkeypatch.undo()
        get_settings.cache_clear()

    assert rows == [(1, "pending"), (2, "none")]
