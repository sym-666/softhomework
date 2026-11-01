import os
import tempfile
from pathlib import Path

# 必须在导入 app 之前设置：app.db 在导入时创建引擎，测试不能碰开发数据库
_test_dir = Path(tempfile.mkdtemp(prefix="paper-backend-tests-"))
os.environ["DATA_DIR"] = str(_test_dir)
os.environ["DATABASE_URL"] = f"sqlite:///{_test_dir / 'test.db'}"
