import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.config import get_settings
from app.db import SessionLocal
from app.models import Paper, PaperGuide
from app.services import paper_guide
from app.services.llm import LlmError
from app.services.paper_guide import (
    MAX_GUIDE_CHARS,
    build_guide_messages,
    guide_events,
    save_guide,
    select_guide_passages,
)
from app.services.retrieval import Passage
from tests.pdf_factory import make_pdf
from tests.test_papers import upload

PAPER = Paper(title="Attention", authors="Vaswani", abstract="We propose the Transformer.")


def make_passages(count: int, size: int = 1000) -> list[Passage]:
    return [Passage(index + 1, "x" * size) for index in range(count)]


def test_short_paper_is_kept_whole() -> None:
    passages = make_passages(10)

    assert select_guide_passages(passages) == passages


def test_long_paper_stays_within_budget() -> None:
    selected = select_guide_passages(make_passages(500))

    assert sum(len(passage.text) for passage in selected) <= MAX_GUIDE_CHARS


def test_long_paper_covers_beginning_middle_and_end() -> None:
    selected = select_guide_passages(make_passages(500))
    pages = [passage.page for passage in selected]

    assert pages[0] == 1
    assert pages[-1] == 500
    assert any(200 <= page <= 300 for page in pages)
    assert pages == sorted(pages)
    assert len(set(pages)) == len(pages)


def test_empty_passages_stay_empty() -> None:
    assert select_guide_passages([]) == []


def test_guide_prompt_follows_language() -> None:
    passages = make_passages(1, 10)

    assert "研究方法" in build_guide_messages(PAPER, passages, "zh-CN")[-1]["content"]
    assert "Research question" in build_guide_messages(PAPER, passages, "en")[-1]["content"]


def test_guide_falls_back_to_abstract() -> None:
    assert "We propose the Transformer." in build_guide_messages(PAPER, [], "en")[-1]["content"]


LONG_TEXT = "Attention lets a model focus on relevant tokens. " * 12


def stored_guides(paper_id: int) -> list[PaperGuide]:
    with SessionLocal() as db:
        return list(db.scalars(select(PaperGuide).where(PaperGuide.paper_id == paper_id)))


def saved_paper(client: TestClient) -> Paper:
    paper_id = upload(client, make_pdf([LONG_TEXT]))
    with SessionLocal() as db:
        return db.get(Paper, paper_id)


def fake_stream(texts: list[str], fail: bool = False):
    def stream(_messages, max_tokens=0):
        yield from texts
        if fail:
            raise LlmError

    return stream


def test_complete_generation_is_cached(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper = saved_paper(user_client)
    monkeypatch.setattr(paper_guide.llm, "stream", fake_stream(["## 导读", "内容"]))

    events = list(guide_events(paper, [Passage(1, "text")], "zh-CN"))

    assert [event.split("\n")[0] for event in events] == [
        "event: delta",
        "event: delta",
        "event: done",
    ]
    assert stored_guides(paper.id)[0].content == "## 导读内容"


def test_failed_generation_is_not_cached(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper = saved_paper(user_client)
    monkeypatch.setattr(paper_guide.llm, "stream", fake_stream(["半篇"], fail=True))

    events = list(guide_events(paper, [Passage(1, "text")], "zh-CN"))

    assert any(event.startswith("event: error") for event in events)
    assert stored_guides(paper.id) == []


def test_abandoned_generation_is_not_cached(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper = saved_paper(user_client)
    monkeypatch.setattr(paper_guide.llm, "stream", fake_stream(["第一段", "第二段"]))

    events = guide_events(paper, [Passage(1, "text")], "zh-CN")
    next(events)
    events.close()  # 模拟客户端断开

    assert stored_guides(paper.id) == []


def test_empty_output_is_not_cached(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper = saved_paper(user_client)
    monkeypatch.setattr(paper_guide.llm, "stream", fake_stream([]))

    list(guide_events(paper, [Passage(1, "text")], "zh-CN"))

    assert stored_guides(paper.id) == []


def test_save_replaces_guide_for_same_language(user_client: TestClient) -> None:
    paper = saved_paper(user_client)

    save_guide(paper.id, "zh-CN", "旧内容")
    save_guide(paper.id, "zh-CN", "新内容")
    save_guide(paper.id, "en", "English")

    guides = {guide.language: guide.content for guide in stored_guides(paper.id)}
    assert guides == {"zh-CN": "新内容", "en": "English"}


def test_save_ignores_deleted_paper(user_client: TestClient) -> None:
    save_guide(999, "zh-CN", "内容")

    assert stored_guides(999) == []


GUIDE_URL = "/api/Ai/PaperGuide"


@pytest.fixture
def ai_enabled(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("AI_OPENAI_API_KEY", "key")
    monkeypatch.setenv("AI_OPENAI_MODEL_ID", "test-model")
    monkeypatch.setattr(paper_guide.llm, "stream", fake_stream(["## Guide"]))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_guide_is_empty_before_generation(user_client: TestClient) -> None:
    paper = saved_paper(user_client)

    response = user_client.get(GUIDE_URL, params={"id": paper.id, "lang": "zh-CN"})

    assert response.status_code == 200
    assert response.json() is None


def test_generate_then_read_guide(user_client: TestClient, ai_enabled: None) -> None:
    paper = saved_paper(user_client)

    stream = user_client.post(GUIDE_URL, params={"id": paper.id, "lang": "en"})

    assert stream.headers["content-type"].startswith("text/event-stream")
    assert "event: delta" in stream.text
    guide = user_client.get(GUIDE_URL, params={"id": paper.id, "lang": "en"}).json()
    assert guide["content"] == "## Guide"
    assert guide["model"] == "test-model"
    assert guide["createdAt"].endswith("Z")


def test_guide_is_cached_per_language(user_client: TestClient, ai_enabled: None) -> None:
    paper = saved_paper(user_client)
    user_client.post(GUIDE_URL, params={"id": paper.id, "lang": "en"})

    assert user_client.get(GUIDE_URL, params={"id": paper.id, "lang": "zh-CN"}).json() is None


def test_guide_is_shared_between_users(
    user_client: TestClient, other_client: TestClient, ai_enabled: None
) -> None:
    paper = saved_paper(user_client)
    user_client.post(GUIDE_URL, params={"id": paper.id, "lang": "en"})

    guide = other_client.get(GUIDE_URL, params={"id": paper.id, "lang": "en"}).json()

    assert guide["content"] == "## Guide"


def test_cached_guide_is_readable_without_ai_configuration(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper = saved_paper(user_client)
    save_guide(paper.id, "en", "cached")
    monkeypatch.setenv("AI_OPENAI_API_KEY", "")
    get_settings.cache_clear()

    response = user_client.get(GUIDE_URL, params={"id": paper.id, "lang": "en"})

    get_settings.cache_clear()
    assert response.json()["content"] == "cached"


def test_generate_requires_configuration(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper = saved_paper(user_client)
    monkeypatch.setenv("AI_OPENAI_API_KEY", "")
    get_settings.cache_clear()

    response = user_client.post(GUIDE_URL, params={"id": paper.id, "lang": "en"})

    get_settings.cache_clear()
    assert response.status_code == 503


def test_guide_rejects_unknown_language(user_client: TestClient, ai_enabled: None) -> None:
    paper = saved_paper(user_client)

    assert user_client.get(GUIDE_URL, params={"id": paper.id, "lang": "fr"}).status_code == 422
    assert user_client.post(GUIDE_URL, params={"id": paper.id, "lang": "fr"}).status_code == 422


def test_guide_requires_login(client: TestClient) -> None:
    assert client.get(GUIDE_URL, params={"id": 1, "lang": "en"}).status_code == 401
    assert client.post(GUIDE_URL, params={"id": 1, "lang": "en"}).status_code == 401


def test_generate_rejects_unknown_paper(user_client: TestClient, ai_enabled: None) -> None:
    assert user_client.post(GUIDE_URL, params={"id": 999, "lang": "en"}).status_code == 404


def test_deleting_paper_removes_guide(user_client: TestClient) -> None:
    paper = saved_paper(user_client)
    save_guide(paper.id, "en", "cached")

    user_client.delete(f"/api/Papers/{paper.id}")

    assert stored_guides(paper.id) == []
