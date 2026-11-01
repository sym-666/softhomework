from pathlib import Path

from app.config import get_settings


def paper_storage_dir() -> Path:
    return get_settings().data_dir / "papers"
