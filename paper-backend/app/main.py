from fastapi import FastAPI

from app.errors import register_error_handlers
from app.middleware import LowercaseApiPathMiddleware

app = FastAPI(title="Paper Learning API")
app.add_middleware(LowercaseApiPathMiddleware)
register_error_handlers(app)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
