from fastapi import FastAPI

app = FastAPI(title="Paper Learning API")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
