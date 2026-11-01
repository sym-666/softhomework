from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import update

from app.db import SessionLocal
from app.models import Note
from tests.conftest import login_as
from tests.test_papers import upload


def notes_url(paper_id: int) -> str:
    return f"/api/Papers/{paper_id}/notes"


def add_note(client: TestClient, paper_id: int, content: str = "note", page: int | None = 3):
    return client.post(notes_url(paper_id), json={"content": content, "page": page})


def test_create_and_list_note(user_client: TestClient) -> None:
    paper_id = upload(user_client)

    created = add_note(user_client, paper_id, "  important  ")

    assert created.status_code == 201
    body = created.json()
    assert body["content"] == "important"
    assert body["page"] == 3
    assert body["paperTitle"] == "Paper"
    assert body["createdAt"].endswith("Z")
    assert [note["id"] for note in user_client.get(notes_url(paper_id)).json()] == [body["id"]]


def test_note_without_page_is_allowed(user_client: TestClient) -> None:
    paper_id = upload(user_client)

    assert add_note(user_client, paper_id, page=None).json()["page"] is None


def test_invalid_notes_are_rejected(user_client: TestClient) -> None:
    paper_id = upload(user_client)

    assert add_note(user_client, paper_id, "   ").status_code == 422
    assert add_note(user_client, paper_id, "x" * 10_001).status_code == 422
    assert add_note(user_client, paper_id, page=0).status_code == 422


def test_note_requires_existing_paper(user_client: TestClient) -> None:
    assert add_note(user_client, 999).status_code == 404


def test_update_note(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    note_id = add_note(user_client, paper_id).json()["id"]

    response = user_client.put(f"/api/Notes/{note_id}", json={"content": "new", "page": 5})

    assert response.status_code == 200
    assert response.json()["content"] == "new"
    assert response.json()["page"] == 5


def test_delete_note(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    note_id = add_note(user_client, paper_id).json()["id"]

    assert user_client.delete(f"/api/Notes/{note_id}").status_code == 204
    assert user_client.get(notes_url(paper_id)).json() == []


def test_notes_are_private(user_client: TestClient, other_client: TestClient) -> None:
    paper_id = upload(user_client)
    note_id = add_note(user_client, paper_id).json()["id"]

    assert other_client.get(notes_url(paper_id)).json() == []
    assert other_client.get("/api/Notes").json()["total"] == 0
    update = other_client.put(f"/api/Notes/{note_id}", json={"content": "hacked"})
    assert update.status_code == 404
    assert other_client.delete(f"/api/Notes/{note_id}").status_code == 404
    assert user_client.get(notes_url(paper_id)).json()[0]["content"] == "note"


def test_my_notes_lists_across_papers_with_search(user_client: TestClient) -> None:
    first = upload(user_client)
    second = upload(user_client)
    add_note(user_client, first, "about attention")
    add_note(user_client, second, "about optimizers")

    assert user_client.get("/api/Notes").json()["total"] == 2
    body = user_client.get("/api/Notes", params={"search": "ATTENTION"}).json()
    assert [note["content"] for note in body["items"]] == ["about attention"]


def test_my_notes_pagination(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    for index in range(3):
        add_note(user_client, paper_id, f"note {index}")

    body = user_client.get("/api/Notes", params={"page": 2, "pageSize": 2}).json()

    assert body["total"] == 3
    assert len(body["items"]) == 1


def test_notes_require_login(client: TestClient) -> None:
    assert client.get("/api/Notes").status_code == 401
    assert client.get(notes_url(1)).status_code == 401
    assert client.post(notes_url(1), json={"content": "x"}).status_code == 401


def test_deleting_paper_removes_notes(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    add_note(user_client, paper_id)

    user_client.delete(f"/api/Papers/{paper_id}")

    assert user_client.get("/api/Notes").json()["total"] == 0


def export(client: TestClient, **params):
    return client.get("/api/Notes/export", params=params)


def test_export_groups_notes_by_paper_and_page(user_client: TestClient) -> None:
    first = upload(user_client)
    second = upload(user_client)
    add_note(user_client, first, "later page", page=9)
    add_note(user_client, first, "no page", page=None)
    add_note(user_client, first, "early page", page=2)
    add_note(user_client, second, "other paper", page=1)

    response = export(user_client)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/markdown")
    assert 'filename="paperpilot-notes.md"' in response.headers["content-disposition"]
    text = response.text
    assert text.startswith("# 我的笔记\n")
    assert text.count("## Paper\n") == 2
    assert text.index("early page") < text.index("later page") < text.index("no page")
    assert text.index("no page") < text.index("other paper")
    assert "### 第 2 页" in text
    assert "### 未标注页码" in text


def test_export_single_paper_notes(user_client: TestClient) -> None:
    first = upload(user_client)
    second = upload(user_client)
    add_note(user_client, first, "keep me")
    add_note(user_client, second, "skip me")

    response = export(user_client, paperId=first, lang="en")

    assert f'filename="paper-{first}-notes.md"' in response.headers["content-disposition"]
    assert "keep me" in response.text
    assert "skip me" not in response.text
    assert response.text.startswith("# My notes\n")
    assert "### Page 3" in response.text


def test_export_only_contains_own_notes(
    user_client: TestClient, other_client: TestClient
) -> None:
    paper_id = upload(user_client)
    add_note(user_client, paper_id, "private thought")

    assert "private thought" not in export(other_client).text
    assert "private thought" not in export(other_client, paperId=paper_id).text


def test_export_rejects_unknown_language(user_client: TestClient) -> None:
    assert export(user_client, lang="fr").status_code == 422


def test_export_requires_login(client: TestClient) -> None:
    assert export(client).status_code == 401


def test_summary_counts_notes_per_paper(user_client: TestClient) -> None:
    first = upload(user_client)
    second = upload(user_client)
    add_note(user_client, first, "a")
    add_note(user_client, second, "b")
    add_note(user_client, second, "c")

    body = user_client.get("/api/Notes/summary").json()

    assert body["total"] == 3
    assert body["recent"] == 3
    assert body["highlights"] == 0
    # 笔记多的论文排在前面
    papers = [(item["paperId"], item["count"]) for item in body["papers"]]
    assert papers == [(second, 2), (first, 1)]


def test_summary_counts_own_highlights_only(
    user_client: TestClient, other_client: TestClient
) -> None:
    paper_id = upload(user_client)
    rect = {"x": 0.1, "y": 0.1, "width": 0.2, "height": 0.02}
    body = {"page": 1, "color": "yellow", "text": "idea", "rects": [rect]}
    user_client.post(f"/api/Papers/{paper_id}/highlights", json=body)
    add_note(user_client, paper_id, "private")

    assert user_client.get("/api/Notes/summary").json()["highlights"] == 1
    other = other_client.get("/api/Notes/summary").json()
    assert (other["total"], other["highlights"], other["papers"]) == (0, 0, [])


def test_summary_excludes_old_notes_from_recent(client: TestClient) -> None:
    login_as(client, "alice")
    paper_id = upload(client)
    note_id = add_note(client, paper_id, "old").json()["id"]
    with SessionLocal() as db:
        db.execute(
            update(Note)
            .where(Note.id == note_id)
            .values(created_at=datetime.now(UTC) - timedelta(days=30))
        )
        db.commit()

    body = client.get("/api/Notes/summary").json()

    assert (body["total"], body["recent"]) == (1, 0)


def test_notes_can_be_filtered_by_paper(user_client: TestClient) -> None:
    first = upload(user_client)
    second = upload(user_client)
    add_note(user_client, first, "keep")
    add_note(user_client, second, "skip")

    body = user_client.get("/api/Notes", params={"paperId": first}).json()

    assert body["total"] == 1
    assert [note["content"] for note in body["items"]] == ["keep"]


def test_summary_requires_login(client: TestClient) -> None:
    assert client.get("/api/Notes/summary").status_code == 401
