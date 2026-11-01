from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware import LowercaseApiPathMiddleware


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
