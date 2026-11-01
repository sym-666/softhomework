from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置，来自环境变量或 paper-backend/.env。"""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    data_dir: Path = Path("data")
    database_url: str = "sqlite:///./data/app.db"


@lru_cache
def get_settings() -> Settings:
    return Settings()
