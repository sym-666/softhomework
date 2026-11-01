import os
import tempfile
from pathlib import Path

# 必须在导入 app 之前设置：app.db 在导入时创建引擎，测试不能碰开发数据库
_test_dir = Path(tempfile.mkdtemp(prefix="paper-backend-tests-"))
os.environ["DATA_DIR"] = str(_test_dir)
os.environ["DATABASE_URL"] = f"sqlite:///{_test_dir / 'test.db'}"
os.environ["JWT_KEY"] = "test-only-key-that-is-long-enough-for-hs256"

from collections.abc import Iterator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import models  # noqa: E402, F401
from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def clean_database() -> Iterator[None]:
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
