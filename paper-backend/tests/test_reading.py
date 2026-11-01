from fastapi.testclient import TestClient

from tests.test_papers import upload


def state_url(paper_id: int) -> str:
    return f"/api/Papers/{paper_id}/reading-state"


def test_default_state_is_unread(user_client: TestClient) -> None:
    paper_id = upload(user_client)

    body = user_client.get(state_url(paper_id)).json()

    assert body == {"status": "unread", "lastPage": 1, "updatedAt": None}


def test_saving_page_marks_paper_as_reading(user_client: TestClient) -> None:
    paper_id = upload(user_client)

    response = user_client.put(state_url(paper_id), json={"lastPage": 7})

    assert response.status_code == 200
    assert response.json()["status"] == "reading"
    assert user_client.get(state_url(paper_id)).json()["lastPage"] == 7


def test_revisiting_finished_paper_keeps_done_status(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    user_client.put(state_url(paper_id), json={"status": "done"})

    body = user_client.put(state_url(paper_id), json={"lastPage": 2}).json()

    assert body["status"] == "done"
    assert body["lastPage"] == 2


def test_status_can_be_changed_explicitly(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    user_client.put(state_url(paper_id), json={"lastPage": 3})

    body = user_client.put(state_url(paper_id), json={"status": "unread"}).json()

    assert body["status"] == "unread"
    assert body["lastPage"] == 3


def test_invalid_values_are_rejected(user_client: TestClient) -> None:
    paper_id = upload(user_client)

    assert user_client.put(state_url(paper_id), json={"lastPage": 0}).status_code == 422
    assert user_client.put(state_url(paper_id), json={"status": "x"}).status_code == 422


def test_state_is_private_to_each_user(
    user_client: TestClient, other_client: TestClient
) -> None:
    paper_id = upload(user_client)
    user_client.put(state_url(paper_id), json={"lastPage": 9})

    assert other_client.get(state_url(paper_id)).json()["lastPage"] == 1


def test_requires_login(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    user_client.cookies.clear()

    assert user_client.get(state_url(paper_id)).status_code == 401
    assert user_client.put(state_url(paper_id), json={"lastPage": 2}).status_code == 401


def test_unknown_paper_is_404(user_client: TestClient) -> None:
    assert user_client.get(state_url(999)).status_code == 404
    assert user_client.put(state_url(999), json={"lastPage": 2}).status_code == 404


def test_deleting_paper_removes_state(user_client: TestClient) -> None:
    paper_id = upload(user_client)
    user_client.put(state_url(paper_id), json={"lastPage": 2})

    user_client.delete(f"/api/Papers/{paper_id}")

    assert user_client.get(state_url(paper_id)).status_code == 404
