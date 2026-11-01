from fastapi.testclient import TestClient

from tests.test_notes import add_note
from tests.test_papers import upload

RECT = {"x": 0.1, "y": 0.2, "width": 0.5, "height": 0.02}


def url(paper_id: int) -> str:
    return f"/api/Papers/{paper_id}/highlights"


def add(client: TestClient, paper_id: int, **fields):
    body = {"page": 2, "color": "yellow", "text": " key idea ", "rects": [RECT]} | fields
    return client.post(url(paper_id), json=body)


def test_create_and_list(user_client: TestClient) -> None:
    paper_id = upload(user_client)

    created = add(user_client, paper_id)

    assert created.status_code == 201
    body = created.json()
    assert body["text"] == "key idea"
    assert body["rects"] == [RECT]
    assert body["noteId"] is None
    assert body["createdAt"].endswith("Z")
    assert [item["id"] for item in user_client.get(url(paper_id)).json()] == [body["id"]]


def test_list_is_ordered_by_page(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    add(user_client, paper_id, page=5)
    add(user_client, paper_id, page=1)

    pages = [item["page"] for item in user_client.get(url(paper_id)).json()]

    assert pages == [1, 5]


def test_invalid_highlights_are_rejected(user_client: TestClient) -> None:
    paper_id = upload(user_client)

    assert add(user_client, paper_id, color="purple").status_code == 422
    assert add(user_client, paper_id, text="   ").status_code == 422
    assert add(user_client, paper_id, page=0).status_code == 422
    assert add(user_client, paper_id, rects=[]).status_code == 422
    assert add(user_client, paper_id, rects=[{**RECT, "x": 1.5}]).status_code == 422
    assert add(user_client, paper_id, rects=[{**RECT, "width": 0}]).status_code == 422


def test_highlight_requires_existing_paper(user_client: TestClient) -> None:
    assert add(user_client, 999).status_code == 404


def test_change_color(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    highlight_id = add(user_client, paper_id).json()["id"]

    response = user_client.patch(f"/api/Highlights/{highlight_id}", json={"color": "pink"})

    assert response.json()["color"] == "pink"


def test_link_and_unlink_note(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    highlight_id = add(user_client, paper_id).json()["id"]
    note_id = add_note(user_client, paper_id).json()["id"]
    target = f"/api/Highlights/{highlight_id}"

    assert user_client.patch(target, json={"noteId": note_id}).json()["noteId"] == note_id
    # 只改颜色时不能把关联清掉
    assert user_client.patch(target, json={"color": "green"}).json()["noteId"] == note_id
    assert user_client.patch(target, json={"noteId": None}).json()["noteId"] is None


def test_note_from_another_paper_is_rejected(user_client: TestClient) -> None:
    first = upload(user_client)
    second = upload(user_client)
    highlight_id = add(user_client, first).json()["id"]
    note_id = add_note(user_client, second).json()["id"]

    response = user_client.patch(f"/api/Highlights/{highlight_id}", json={"noteId": note_id})

    assert response.status_code == 404


def test_cannot_link_someone_elses_note(
    user_client: TestClient, other_client: TestClient
) -> None:
    paper_id = upload(user_client)
    highlight_id = add(user_client, paper_id).json()["id"]
    note_id = add_note(other_client, paper_id).json()["id"]

    response = user_client.patch(f"/api/Highlights/{highlight_id}", json={"noteId": note_id})

    assert response.status_code == 404


def test_deleting_note_keeps_highlight(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    highlight_id = add(user_client, paper_id).json()["id"]
    note_id = add_note(user_client, paper_id).json()["id"]
    user_client.patch(f"/api/Highlights/{highlight_id}", json={"noteId": note_id})

    user_client.delete(f"/api/Notes/{note_id}")

    assert user_client.get(url(paper_id)).json()[0]["noteId"] is None


def test_deleting_highlight_keeps_note(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    highlight_id = add(user_client, paper_id).json()["id"]
    note_id = add_note(user_client, paper_id).json()["id"]
    user_client.patch(f"/api/Highlights/{highlight_id}", json={"noteId": note_id})

    assert user_client.delete(f"/api/Highlights/{highlight_id}").status_code == 204

    assert user_client.get(url(paper_id)).json() == []
    assert len(user_client.get(f"/api/Papers/{paper_id}/notes").json()) == 1


def test_highlights_are_private(user_client: TestClient, other_client: TestClient) -> None:
    paper_id = upload(user_client)
    highlight_id = add(user_client, paper_id).json()["id"]

    assert other_client.get(url(paper_id)).json() == []
    target = f"/api/Highlights/{highlight_id}"
    assert other_client.patch(target, json={"color": "pink"}).status_code == 404
    assert other_client.delete(target).status_code == 404


def test_highlights_require_login(client: TestClient) -> None:
    assert client.get(url(1)).status_code == 401
    assert client.delete("/api/Highlights/1").status_code == 401
