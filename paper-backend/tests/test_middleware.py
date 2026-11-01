from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware import LowercaseApiPathMiddleware, UploadSizeLimitMiddleware


def build_client() -> TestClient:
    app = FastAPI()
    app.add_middleware(LowercaseApiPathMiddleware)

    @app.get("/api/user/getuser")
    def get_user() -> dict[str, bool]:
        return {"ok": True}

    @app.get("/Static")
    def static_page() -> dict[str, bool]:
        return {"ok": True}

    return TestClient(app)


def test_mixed_case_api_path_reaches_route() -> None:
    assert build_client().get("/api/User/GetUser").status_code == 200


def test_mixed_case_api_prefix_reaches_route() -> None:
    assert build_client().get("/API/user/getuser").status_code == 200


def test_non_api_path_stays_case_sensitive() -> None:
    client = build_client()

    assert client.get("/Static").status_code == 200
    assert client.get("/static").status_code == 404


def test_query_string_case_is_preserved() -> None:
    app = FastAPI()
    app.add_middleware(LowercaseApiPathMiddleware)

    @app.get("/api/echo")
    def echo(value: str) -> dict[str, str]:
        return {"value": value}

    assert TestClient(app).get("/api/Echo?value=MixedCase").json() == {"value": "MixedCase"}


def build_upload_client() -> TestClient:
    app = FastAPI()
    app.add_middleware(UploadSizeLimitMiddleware, path="/api/upload", max_bytes=10)

    @app.post("/api/upload")
    def upload() -> dict[str, bool]:
        return {"ok": True}

    @app.post("/api/other")
    def other() -> dict[str, bool]:
        return {"ok": True}

    return TestClient(app)


def test_oversized_upload_is_rejected() -> None:
    response = build_upload_client().post("/api/upload", content=b"x" * 11)

    assert response.status_code == 413
    assert response.json() == {"success": False, "message": "上传内容过大"}


def test_upload_at_limit_is_allowed() -> None:
    assert build_upload_client().post("/api/upload", content=b"x" * 10).status_code == 200


def test_upload_without_content_length_is_rejected() -> None:
    def chunks():
        yield b"x"

    assert build_upload_client().post("/api/upload", content=chunks()).status_code == 411


def test_size_limit_applies_only_to_upload_path() -> None:
    assert build_upload_client().post("/api/other", content=b"x" * 11).status_code == 200
