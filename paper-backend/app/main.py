from fastapi import FastAPI

from app.middleware import LowercaseApiPathMiddleware

app = FastAPI(title="Paper Learning API")
app.add_middleware(LowercaseApiPathMiddleware)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
