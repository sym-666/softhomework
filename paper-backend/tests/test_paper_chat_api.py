import json
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.config import get_settings
from app.db import SessionLocal
from app.models import PaperChatMessage
from app.routers import ai
from app.services import paper_chat
from app.services.llm import LlmError, LlmTruncatedError
from tests.conftest import login_as
from tests.pdf_factory import make_pdf
from tests.test_papers import upload

LONG_TEXT = "Attention lets a model focus on relevant tokens. " * 12


@pytest.fixture
def ai_enabled(monkeypatch: pytest.MonkeyPatch) -> Iterator[list]:
    monkeypatch.setenv("AI_OPENAI_API_KEY", "key")
    monkeypatch.setenv("AI_OPENAI_MODEL_ID", "model")
    get_settings.cache_clear()
    captured: list = []

    def stream(messages):
        captured.append(messages)
        yield "答案 [p.1]"

    monkeypatch.setattr(paper_chat.llm, "stream", stream)
    yield captured
    get_settings.cache_clear()


def chat(client: TestClient, paper_id: int, message: str = "what is attention", **extra):
    return client.post(
        "/api/Ai/PaperChat", params={"id": paper_id}, json={"message": message, **extra}
    )


def test_chat_streams_events(user_client: TestClient, ai_enabled: list) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    response = chat(user_client, paper_id)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.headers["x-accel-buffering"] == "no"
    assert "event: citations" in response.text
    assert '"page": 1' in response.text
    assert "event: delta" in response.text
    assert response.text.endswith('event: done\ndata: {}\n\n')


def test_chat_sends_paper_text_to_model(user_client: TestClient, ai_enabled: list) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    chat(user_client, paper_id, history=[{"role": "user", "content": "earlier"}])

    messages = ai_enabled[0]
    assert messages[1] == {"role": "user", "content": "earlier"}
    assert "Attention lets a model" in messages[-1]["content"]


def test_external_paper_uses_abstract(user_client: TestClient, ai_enabled: list) -> None:
    created = user_client.post(
        "/api/Papers",
        data={
            "Title": "T",
            "Authors": "A",
            "Year": "2020",
            "Abstract": "Abstract text here",
            "Url": "https://example.com",
        },
    )

    response = chat(user_client, created.json()["id"])

    assert response.status_code == 200
    assert "Abstract text here" in ai_enabled[0][-1]["content"]


def test_chat_requires_login(user_client: TestClient, ai_enabled: list) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    user_client.cookies.clear()

    assert chat(user_client, paper_id).status_code == 401


def test_chat_reports_missing_configuration(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("AI_OPENAI_API_KEY", "")
    get_settings.cache_clear()
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    response = chat(user_client, paper_id)

    assert response.status_code == 503
    assert response.json()["message"] == "AI 功能未配置，请联系管理员"
    monkeypatch.undo()
    get_settings.cache_clear()


def test_chat_rejects_unknown_paper(user_client: TestClient, ai_enabled: list) -> None:
    assert chat(user_client, 999).status_code == 404


def test_chat_rejects_blank_and_oversized_messages(
    user_client: TestClient, ai_enabled: list
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    assert chat(user_client, paper_id, message="   ").status_code == 400
    assert chat(user_client, paper_id, message="x" * 2001).status_code == 422


def test_chat_rejects_invalid_history_role(user_client: TestClient, ai_enabled: list) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    response = chat(user_client, paper_id, history=[{"role": "system", "content": "x"}])

    assert response.status_code == 422


def test_chat_waits_for_ingestion(user_client: TestClient, ai_enabled: list) -> None:
    from app.db import SessionLocal
    from app.models import Paper

    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    with SessionLocal() as db:
        db.get(Paper, paper_id).ingest_status = "processing"
        db.commit()

    assert chat(user_client, paper_id).status_code == 409


def test_chat_rejects_paper_without_content(user_client: TestClient, ai_enabled: list) -> None:
    created = user_client.post(
        "/api/Papers",
        data={"Title": "T", "Authors": "A", "Year": "2020", "Url": "https://example.com"},
    )

    assert chat(user_client, created.json()["id"]).status_code == 400


def stored_messages() -> list[PaperChatMessage]:
    with SessionLocal() as db:
        return list(db.scalars(select(PaperChatMessage).order_by(PaperChatMessage.id)))


def test_finished_answer_is_saved(user_client: TestClient, ai_enabled: list) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    chat(user_client, paper_id, "what is attention")

    user_message, answer = stored_messages()
    assert (user_message.role, user_message.content) == ("user", "what is attention")
    assert (answer.role, answer.content) == ("assistant", "答案 [p.1]")
    assert json.loads(answer.citations)[0]["page"] == 1


def test_failed_answer_is_not_saved(
    user_client: TestClient, ai_enabled: list, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    def partial(messages):
        yield "只说了一半"
        raise LlmError

    monkeypatch.setattr(paper_chat.llm, "stream", partial)

    response = chat(user_client, paper_id)

    assert "event: error" in response.text
    assert stored_messages() == []


def test_empty_answer_is_not_saved(
    user_client: TestClient, ai_enabled: list, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    monkeypatch.setattr(paper_chat.llm, "stream", lambda messages: iter(()))

    chat(user_client, paper_id)

    assert stored_messages() == []


def history(client: TestClient, paper_id: int):
    return client.get("/api/Ai/PaperChat/history", params={"id": paper_id})


def test_history_returns_messages_in_order(user_client: TestClient, ai_enabled: list) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    chat(user_client, paper_id, "first")
    chat(user_client, paper_id, "second")

    body = history(user_client, paper_id).json()

    assert [item["content"] for item in body] == ["first", "答案 [p.1]", "second", "答案 [p.1]"]
    assert body[0]["citations"] == []
    assert body[1]["citations"][0]["page"] == 1
    assert body[1]["createdAt"].endswith("Z")


def test_history_is_private(
    user_client: TestClient, other_client: TestClient, ai_enabled: list
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    chat(user_client, paper_id)

    assert history(other_client, paper_id).json() == []


def test_clearing_only_affects_own_history(
    user_client: TestClient, other_client: TestClient, ai_enabled: list
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    chat(user_client, paper_id)
    chat(other_client, paper_id)

    response = user_client.delete("/api/Ai/PaperChat/history", params={"id": paper_id})

    assert response.status_code == 204
    assert history(user_client, paper_id).json() == []
    assert len(history(other_client, paper_id).json()) == 2


def test_history_is_limited_to_recent_messages(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(ai, "MAX_RESTORED_MESSAGES", 2)
    user = login_as(client, "alice")
    paper_id = upload(client)
    with SessionLocal() as db:
        db.add_all(
            PaperChatMessage(
                user_id=user["id"], paper_id=paper_id, role="user", content=str(index)
            )
            for index in range(3)
        )
        db.commit()

    body = history(client, paper_id).json()

    assert [item["content"] for item in body] == ["1", "2"]


def test_history_requires_login(client: TestClient) -> None:
    assert history(client, 1).status_code == 401
    assert client.delete("/api/Ai/PaperChat/history", params={"id": 1}).status_code == 401


def test_truncated_answer_is_reported_and_not_saved(
    user_client: TestClient, ai_enabled: list, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    def partial(messages):
        yield "只写到一半"
        raise LlmTruncatedError

    monkeypatch.setattr(paper_chat.llm, "stream", partial)

    response = chat(user_client, paper_id)

    assert "被截断" in response.text
    assert stored_messages() == []


def test_page_being_read_reaches_the_model(user_client: TestClient, ai_enabled: list) -> None:
    pages = ["Attention lets a model focus on tokens. " * 12, "Quantum zebra marker text. " * 12]
    paper_id = upload(user_client, make_pdf(pages))

    chat(user_client, paper_id, "what is attention", page=2)

    assert "Quantum zebra marker" in ai_enabled[0][-1]["content"]
    assert "用户正在阅读第 2 页" in ai_enabled[0][-1]["content"]


def test_invalid_page_is_rejected(user_client: TestClient, ai_enabled: list) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))

    assert chat(user_client, paper_id, page=0).status_code == 422
