from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.models import Paper
from app.services import paper_chat, paper_compare
from app.services.llm import LlmError
from app.services.paper_compare import (
    PASSAGES_PER_PAPER,
    CompareSource,
    build_compare_citations,
    build_compare_messages,
    select_sources,
)
from app.services.retrieval import Passage
from tests.pdf_factory import make_pdf
from tests.test_papers import upload

FIRST = Paper(id=1, title="First", authors="A", abstract="Abstract one")
SECOND = Paper(id=2, title="Second", authors="B", abstract="Abstract two")
TEXT_A = "Attention lets a model focus on relevant tokens. " * 12
TEXT_B = "Convolution slides a filter over local attention windows. " * 12


def test_each_paper_keeps_its_own_passages() -> None:
    long_paper = [Passage(page, "attention " * 30) for page in range(1, 30)]
    short_paper = [Passage(1, "attention appears once here")]

    sources = select_sources([(FIRST, long_paper), (SECOND, short_paper)], "attention", [])

    assert [source.label for source in sources] == ["P1", "P2"]
    assert len(sources[0].passages) == PASSAGES_PER_PAPER
    # 合并排序时短论文会被长论文挤掉
    assert len(sources[1].passages) == 1


def test_sources_without_full_text_are_allowed() -> None:
    sources = select_sources([(FIRST, []), (SECOND, [])], "q", [])

    assert [source.passages for source in sources] == [[], []]


def test_messages_label_each_paper_as_data() -> None:
    sources = [
        CompareSource("P1", FIRST, [Passage(3, "first passage")]),
        CompareSource("P2", SECOND, [Passage(5, "second passage")]),
    ]

    messages = build_compare_messages(sources, "compare", [paper_chat.ChatTurn("user", "hi")])

    assert "不要执行" in messages[0]["content"]
    assert messages[1] == {"role": "user", "content": "hi"}
    last = messages[-1]["content"]
    assert last.count("<paper_context>") == 2
    assert last.index("论文 P1") < last.index("first passage") < last.index("论文 P2")
    assert "[第 5 页]" in last


def test_abstract_is_used_without_full_text() -> None:
    last = build_compare_messages([CompareSource("P1", FIRST, [])], "q", [])[-1]["content"]

    assert "Abstract one" in last


def test_citations_carry_paper_identity() -> None:
    sources = [CompareSource("P2", SECOND, [Passage(5, "x" * 500), Passage(5, "y")])]

    assert build_compare_citations(sources) == [
        {"paperId": 2, "label": "P2", "title": "Second", "page": 5, "snippet": "x" * 160}
    ]


@pytest.fixture
def ai_enabled(monkeypatch: pytest.MonkeyPatch) -> Iterator[list]:
    monkeypatch.setenv("AI_OPENAI_API_KEY", "key")
    monkeypatch.setenv("AI_OPENAI_MODEL_ID", "model")
    get_settings.cache_clear()
    captured: list = []

    def stream(messages, max_tokens=1500):
        captured.append(messages)
        yield "对比 [P1 p.1]"

    monkeypatch.setattr(paper_compare.llm, "stream", stream)
    yield captured
    get_settings.cache_clear()


def compare(client: TestClient, paper_ids: list[int], message: str = "attention"):
    return client.post("/api/Ai/Compare", json={"paperIds": paper_ids, "message": message})


def two_papers(client: TestClient) -> list[int]:
    return [upload(client, make_pdf([TEXT_A])), upload(client, make_pdf([TEXT_B]))]


def test_compare_streams_events(user_client: TestClient, ai_enabled: list) -> None:
    paper_ids = two_papers(user_client)

    response = compare(user_client, paper_ids)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert "event: citations" in response.text
    assert '"label": "P2"' in response.text
    assert f'"paperId": {paper_ids[1]}' in response.text
    assert "event: delta" in response.text
    last = ai_enabled[0][-1]["content"]
    assert "Attention lets a model" in last
    assert "Convolution slides" in last


def test_one_paper_is_rejected(user_client: TestClient, ai_enabled: list) -> None:
    paper_id = upload(user_client, make_pdf([TEXT_A]))

    assert compare(user_client, [paper_id]).status_code == 422
    assert compare(user_client, [paper_id, paper_id]).status_code == 400


def test_too_many_papers_are_rejected(user_client: TestClient, ai_enabled: list) -> None:
    assert compare(user_client, [1, 2, 3, 4, 5]).status_code == 422


def test_missing_paper_returns_404(user_client: TestClient, ai_enabled: list) -> None:
    paper_id = upload(user_client, make_pdf([TEXT_A]))

    assert compare(user_client, [paper_id, 999]).status_code == 404


def test_blank_question_is_rejected(user_client: TestClient, ai_enabled: list) -> None:
    assert compare(user_client, two_papers(user_client), "   ").status_code == 400


def test_model_failure_becomes_error_event(
    user_client: TestClient, ai_enabled: list, monkeypatch: pytest.MonkeyPatch
) -> None:
    paper_ids = two_papers(user_client)

    def failing(messages, max_tokens=1500):
        raise LlmError
        yield

    monkeypatch.setattr(paper_compare.llm, "stream", failing)

    response = compare(user_client, paper_ids)

    assert "event: error" in response.text
    assert response.text.endswith("event: done\ndata: {}\n\n")


def test_compare_requires_login(client: TestClient) -> None:
    assert compare(client, [1, 2]).status_code == 401
