from fastapi.testclient import TestClient

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
