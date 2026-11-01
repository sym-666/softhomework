from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置，来自环境变量或 paper-backend/.env。"""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    data_dir: Path = Path("data")
    database_url: str = "sqlite:///./data/app.db"

    # 必填且没有默认值：宁可启动失败，也不能用公开的默认密钥签发登录凭证
    jwt_key: str = Field(min_length=32)
    jwt_expiry_days: int = 7
    # 生产环境走 HTTPS 时设为 true
    cookie_secure: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
