from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import SessionLocal
from app.models import Paper, User


def seed_paper(**overrides) -> int:
    with SessionLocal() as db:
        owner = db.scalar(select(User).where(User.username == "alice"))
        paper = Paper(
            created_by_user_id=owner.id,
            title=overrides.pop("title", "Attention Is All You Need"),
            authors=overrides.pop("authors", "Vaswani et al."),
            year=overrides.pop("year", 2017),
            abstract=overrides.pop("abstract", "We propose the Transformer."),
            tags=overrides.pop("tags", "nlp,transformer"),
            source_url=overrides.pop("source_url", "https://example.com/paper"),
            **overrides,
        )
        db.add(paper)
        db.commit()
        return paper.id


def test_list_requires_login(client: TestClient) -> None:
    assert client.get("/api/Papers").status_code == 401


def test_list_returns_frontend_contract(user_client: TestClient) -> None:
    paper_id = seed_paper()

    body = user_client.get("/api/Papers").json()

    assert body["total"] == 1
    assert body["page"] == 1
    assert body["pageSize"] == 24
    item = body["items"][0]
    assert item["id"] == paper_id
    assert item["tags"] == ["nlp", "transformer"]
    assert item["downloadUrl"] == f"/api/Papers/{paper_id}/download"
    assert item["hasLocalFile"] is False
    assert item["createdByUserName"] == "alice"
    assert item["createdAt"].endswith("Z")


def test_search_matches_each_field_case_insensitively(user_client: TestClient) -> None:
    seed_paper(title="Deep Residual Learning", abstract="", authors="Kaiming", tags="vision")
    seed_paper(title="Other", abstract="", authors="Someone", tags="")

    for term in ["residual", "KAIMING", "vision"]:
        body = user_client.get("/api/Papers", params={"search": term}).json()
        assert [item["title"] for item in body["items"]] == ["Deep Residual Learning"]


def test_search_treats_wildcards_literally(user_client: TestClient) -> None:
    seed_paper(title="100% accuracy")
    seed_paper(title="Plain title")

    body = user_client.get("/api/Papers", params={"search": "%"}).json()

    assert [item["title"] for item in body["items"]] == ["100% accuracy"]


def test_pagination_orders_newest_first(user_client: TestClient) -> None:
    ids = [seed_paper(title=f"Paper {index}") for index in range(3)]

    body = user_client.get("/api/Papers", params={"page": 2, "pageSize": 2}).json()

    assert body["total"] == 3
    assert [item["id"] for item in body["items"]] == [ids[0]]


def test_page_size_is_limited(user_client: TestClient) -> None:
    assert user_client.get("/api/Papers", params={"pageSize": 51}).status_code == 422
