from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import SessionLocal
from app.models import User

VALID = {"username": "alice", "email": "alice@example.com", "password": "password123"}


def test_register_creates_user_with_hashed_password(client: TestClient) -> None:
    response = client.post("/api/Auth/register", json=VALID)

    assert response.status_code == 200
    assert response.json()["success"] is True
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.username == "alice"))
    assert user is not None
    assert user.password_hash != VALID["password"]


def test_register_ignores_client_supplied_role(client: TestClient) -> None:
    client.post("/api/Auth/register", json={**VALID, "roleId": 3})

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.username == "alice"))
    assert user is not None
    assert user.role_id == 1


def test_register_rejects_duplicate_username(client: TestClient) -> None:
    client.post("/api/Auth/register", json=VALID)

    response = client.post("/api/Auth/register", json={**VALID, "email": "other@example.com"})

    assert response.status_code == 400
    assert response.json()["message"] == "用户名或邮箱已被注册"


def test_register_treats_email_case_insensitively(client: TestClient) -> None:
    client.post("/api/Auth/register", json=VALID)

    response = client.post(
        "/api/Auth/register", json={**VALID, "username": "bob", "email": "ALICE@example.com"}
    )

    assert response.status_code == 400


def test_register_validates_input(client: TestClient) -> None:
    assert client.post("/api/Auth/register", json={**VALID, "email": "bad"}).status_code == 422
    assert client.post("/api/Auth/register", json={**VALID, "password": "short"}).status_code == 422
    assert client.post("/api/Auth/register", json={**VALID, "username": "  a  "}).status_code == 422


def test_login_with_username_sets_http_only_cookie(client: TestClient) -> None:
    client.post("/api/Auth/register", json=VALID)

    response = client.post(
        "/api/Auth/login", json={"usernameOrEmail": "alice", "password": "password123"}
    )

    assert response.status_code == 200
    assert response.json()["user"]["username"] == "alice"
    assert response.json()["user"]["roleId"] == 1
    cookie = response.headers["set-cookie"]
    assert cookie.startswith("AuthToken=")
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie


def test_login_with_email_is_case_insensitive(client: TestClient) -> None:
    client.post("/api/Auth/register", json=VALID)

    response = client.post(
        "/api/Auth/login", json={"usernameOrEmail": "ALICE@example.com", "password": "password123"}
    )

    assert response.status_code == 200


def test_login_response_never_contains_password_hash(client: TestClient) -> None:
    client.post("/api/Auth/register", json=VALID)

    response = client.post(
        "/api/Auth/login", json={"usernameOrEmail": "alice", "password": "password123"}
    )

    assert "password" not in response.text.lower()


def test_wrong_password_and_unknown_user_look_identical(client: TestClient) -> None:
    client.post("/api/Auth/register", json=VALID)

    wrong = client.post("/api/Auth/login", json={"usernameOrEmail": "alice", "password": "nope"})
    unknown = client.post("/api/Auth/login", json={"usernameOrEmail": "bob", "password": "nope"})

    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()
    assert "set-cookie" not in wrong.headers


def test_logout_clears_cookie(client: TestClient) -> None:
    response = client.post("/api/Auth/Logout")

    assert response.status_code == 200
    assert 'AuthToken=""' in response.headers["set-cookie"]
