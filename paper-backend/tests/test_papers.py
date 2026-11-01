from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import SessionLocal
from app.models import Paper, User
from app.routers.papers import MAX_PDF_BYTES, paper_storage_dir

PDF_BYTES = b"%PDF-1.4\nminimal test content\n%%EOF\n"
FORM = {"Title": " Paper ", "Authors": "A. Author", "Year": "2020", "Abstract": "text"}


def pdf_upload(content: bytes = PDF_BYTES, name: str = "paper.pdf", kind="application/pdf") -> dict:
    return {"File": (name, content, kind)}


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


def test_upload_requires_login(client: TestClient) -> None:
    assert client.post("/api/Papers", data=FORM, files=pdf_upload()).status_code == 401


def test_upload_stores_pdf_under_generated_name(user_client: TestClient) -> None:
    response = user_client.post(
        "/api/Papers", data={**FORM, "Tags": "a，b, A"}, files=pdf_upload(name="../../evil.pdf")
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Paper"
    assert body["tags"] == ["a", "b"]
    assert body["hasLocalFile"] is True
    with SessionLocal() as db:
        paper = db.get(Paper, body["id"])
    assert "evil" not in paper.stored_file_name
    assert (paper_storage_dir() / paper.stored_file_name).read_bytes() == PDF_BYTES


def test_upload_accepts_url_without_file(user_client: TestClient) -> None:
    response = user_client.post("/api/Papers", data={**FORM, "Url": "https://example.com/a"})

    assert response.status_code == 201
    assert response.json()["hasLocalFile"] is False
    assert response.json()["sourceUrl"] == "https://example.com/a"


def test_upload_requires_file_or_url(user_client: TestClient) -> None:
    response = user_client.post("/api/Papers", data=FORM)

    assert response.status_code == 400
    assert response.json()["message"] == "请上传 PDF 或提供论文网址"


def test_upload_rejects_non_pdf_content(user_client: TestClient) -> None:
    response = user_client.post("/api/Papers", data=FORM, files=pdf_upload(b"<html>not pdf"))

    assert response.status_code == 400
    assert response.json()["message"] == "文件内容不是有效的 PDF"


def test_upload_rejects_wrong_extension_and_type(user_client: TestClient) -> None:
    wrong_extension = pdf_upload(name="paper.exe")
    wrong_type = pdf_upload(kind="text/html")

    assert user_client.post("/api/Papers", data=FORM, files=wrong_extension).status_code == 400
    assert user_client.post("/api/Papers", data=FORM, files=wrong_type).status_code == 400


def test_upload_rejects_file_over_limit(user_client: TestClient) -> None:
    content = PDF_BYTES + b"0" * MAX_PDF_BYTES

    response = user_client.post("/api/Papers", data=FORM, files=pdf_upload(content))

    assert response.status_code == 400
    assert response.json()["message"] == "PDF 文件不能超过 20 MB"


def test_upload_rejects_unsafe_url_scheme(user_client: TestClient) -> None:
    response = user_client.post("/api/Papers", data={**FORM, "Url": "javascript:alert(1)"})

    assert response.status_code == 400


def test_upload_validates_year_and_tags(user_client: TestClient) -> None:
    future = str(datetime.now(UTC).year + 2)
    too_many_tags = ",".join(f"tag{index}" for index in range(11))
    url = {"Url": "https://example.com"}

    assert user_client.post("/api/Papers", data={**FORM, **url, "Year": future}).status_code == 400
    assert (
        user_client.post("/api/Papers", data={**FORM, **url, "Tags": too_many_tags}).status_code
        == 400
    )


def test_uploaded_paper_appears_in_list(user_client: TestClient) -> None:
    user_client.post("/api/Papers", data=FORM, files=pdf_upload())

    assert user_client.get("/api/Papers").json()["total"] == 1
