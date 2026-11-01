from fastapi import FastAPI

from app.errors import register_error_handlers
from app.middleware import LowercaseApiPathMiddleware, UploadSizeLimitMiddleware
from app.routers import auth, papers, users
from app.routers.papers import MAX_PDF_BYTES

app = FastAPI(title="Paper Learning API")
# 表单字段另算 1MB 余量，精确的文件大小在路由里校验
app.add_middleware(
    UploadSizeLimitMiddleware, path="/api/papers", max_bytes=MAX_PDF_BYTES + 1024 * 1024
)
app.add_middleware(LowercaseApiPathMiddleware)
register_error_handlers(app)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(papers.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
