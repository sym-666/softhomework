import threading
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.errors import register_error_handlers
from app.middleware import LowercaseApiPathMiddleware, UploadSizeLimitMiddleware
from app.routers import ai, auth, papers, reading, users
from app.routers.papers import MAX_PDF_BYTES
from app.services.ingestion import resume_ingestion, unfinished_paper_ids


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    # BackgroundTasks 只存在于进程内存，服务重启后未完成的解析要重新发起
    paper_ids = unfinished_paper_ids()
    if paper_ids:
        threading.Thread(target=resume_ingestion, args=(paper_ids,), daemon=True).start()
    yield


app = FastAPI(title="Paper Learning API", lifespan=lifespan)
# 表单字段另算 1MB 余量，精确的文件大小在路由里校验
app.add_middleware(
    UploadSizeLimitMiddleware, path="/api/papers", max_bytes=MAX_PDF_BYTES + 1024 * 1024
)
app.add_middleware(LowercaseApiPathMiddleware)
register_error_handlers(app)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(papers.router)
app.include_router(reading.router)
app.include_router(ai.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
