from pathlib import Path

from sqlalchemy import text

from app.db import build_engine


def test_build_engine_creates_parent_directory(tmp_path: Path) -> None:
    database = tmp_path / "nested" / "app.db"

    with build_engine(f"sqlite:///{database}").connect() as connection:
        connection.execute(text("SELECT 1"))

    assert database.exists()


def test_sqlite_foreign_keys_are_enabled(tmp_path: Path) -> None:
    engine = build_engine(f"sqlite:///{tmp_path / 'app.db'}")

    with engine.connect() as connection:
        assert connection.execute(text("PRAGMA foreign_keys")).scalar() == 1
