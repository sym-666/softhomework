from pathlib import Path

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_settings_read_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATA_DIR", "/tmp/paper-data")
    monkeypatch.setenv("DATABASE_URL", "sqlite:////tmp/paper-data/test.db")

    settings = Settings(_env_file=None)

    assert settings.data_dir == Path("/tmp/paper-data")
    assert settings.database_url == "sqlite:////tmp/paper-data/test.db"


def test_short_jwt_key_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_KEY", "too-short")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)
