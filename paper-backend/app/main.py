from fastapi import FastAPI

from app.errors import register_error_handlers
from app.middleware import LowercaseApiPathMiddleware
from app.routers import auth

app = FastAPI(title="Paper Learning API")
app.add_middleware(LowercaseApiPathMiddleware)
register_error_handlers(app)
app.include_router(auth.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
