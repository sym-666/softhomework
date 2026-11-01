from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.errors import register_error_handlers


def build_client() -> TestClient:
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/missing")
    def missing() -> None:
        raise HTTPException(status_code=404, detail="论文不存在")

    @app.get("/typed")
    def typed(page: int) -> dict[str, int]:
        return {"page": page}

    @app.get("/boom")
    def boom() -> None:
        raise RuntimeError("内部细节 secret")

    return TestClient(app, raise_server_exceptions=False)


def test_http_exception_uses_message_field() -> None:
    response = build_client().get("/missing")

    assert response.status_code == 404
    assert response.json() == {"success": False, "message": "论文不存在"}


def test_unknown_route_uses_message_field() -> None:
    response = build_client().get("/nope")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_validation_error_names_the_field() -> None:
    response = build_client().get("/typed?page=abc")

    assert response.status_code == 422
    assert response.json()["message"].startswith("page: ")


def test_unexpected_error_hides_internal_details() -> None:
    response = build_client().get("/boom")

    assert response.status_code == 500
    assert response.json() == {"success": False, "message": "服务器内部错误"}
