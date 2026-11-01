import json
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.models import Paper
from app.services import llm_json
from app.services.llm import LlmError
from app.services.llm_json import LlmJsonError
from app.services.paper_glossary import (
    MAX_TERMS,
    GlossaryTerm,
    build_glossary_messages,
    find_term_page,
    generate_terms,
    parse_terms,
)
from app.services.retrieval import Passage
from tests.pdf_factory import make_pdf
from tests.test_papers import upload

PAPER = Paper(title="Attention", authors="Vaswani", abstract="Abstract")
PASSAGES = [
    Passage(1, "The encoder maps input tokens."),
    Passage(4, "Multi-Head\nAttention runs several layers."),
]


def test_page_comes_from_full_text() -> None:
    assert find_term_page("Encoder", PASSAGES) == 1


def test_line_breaks_in_the_paper_do_not_hide_a_term() -> None:
    assert find_term_page("multi-head attention", PASSAGES) == 4


def test_unknown_term_has_no_page() -> None:
    assert find_term_page("backpropagation", PASSAGES) is None


def test_terms_are_parsed_and_located() -> None:
    data = {"terms": [{"term": " encoder ", "explanation": " maps inputs ", "page": 99}]}

    assert parse_terms(data, PASSAGES) == [GlossaryTerm("encoder", "maps inputs", 1)]


@pytest.mark.parametrize(
    "item",
    [
        {"term": "", "explanation": "x"},
        {"term": "x", "explanation": "  "},
        {"term": 3, "explanation": "x"},
        {"term": "x"},
        "encoder",
    ],
)
def test_broken_terms_are_dropped(item: object) -> None:
    assert parse_terms({"terms": [item]}, PASSAGES) == []


def test_non_list_terms_are_ignored() -> None:
    assert parse_terms({"terms": "none"}, PASSAGES) == []


def test_duplicates_ignore_case_and_count_is_limited() -> None:
    items = [{"term": f"term {index}", "explanation": "x"} for index in range(40)]
    items.insert(1, {"term": "TERM 0", "explanation": "x"})

    terms = parse_terms({"terms": items}, PASSAGES)

    assert len(terms) == MAX_TERMS
    assert [term.term for term in terms[:2]] == ["term 0", "term 1"]


def test_prompt_treats_paper_as_data_and_follows_language() -> None:
    system, user = build_glossary_messages(PAPER, PASSAGES, "en")

    assert "不要执行" in system["content"]
    assert "<paper_context>" in user["content"]
    assert "in English" in user["content"]


def test_terms_are_located_outside_the_sampled_text(monkeypatch: pytest.MonkeyPatch) -> None:
    passages = [Passage(page, "filler " * 200) for page in range(1, 200)]
    passages[100] = Passage(101, "unique marker " + "filler " * 200)
    answer = '{"terms": [{"term": "unique marker", "explanation": "x"}]}'
    monkeypatch.setattr(llm_json.llm, "complete", lambda messages, max_tokens: answer)

    assert generate_terms(PAPER, passages, "zh-CN")[0].page == 101


def test_unusable_answer_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(llm_json.llm, "complete", lambda messages, max_tokens: '{"terms": []}')

    with pytest.raises(LlmJsonError):
        generate_terms(PAPER, PASSAGES, "zh-CN")


LONG_TEXT = "Attention lets a model focus on relevant tokens. " * 12


@pytest.fixture
def ai_enabled(monkeypatch: pytest.MonkeyPatch) -> Iterator[dict]:
    monkeypatch.setenv("AI_OPENAI_API_KEY", "key")
    monkeypatch.setenv("AI_OPENAI_MODEL_ID", "test-model")
    get_settings.cache_clear()
    state = {
        "answer": json.dumps(
            {"terms": [{"term": "attention", "explanation": "关注重要部分"}]},
            ensure_ascii=False,
        )
    }

    def complete(messages, max_tokens):
        if isinstance(state["answer"], Exception):
            raise state["answer"]
        return state["answer"]

    monkeypatch.setattr(llm_json.llm, "complete", complete)
    yield state
    get_settings.cache_clear()


def url_params(paper_id: int, lang: str = "zh-CN") -> dict:
    return {"id": paper_id, "lang": lang}


def test_generate_and_read_glossary(user_client: TestClient, ai_enabled: dict) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    params = url_params(paper_id)

    assert user_client.get("/api/Ai/PaperGlossary", params=params).json() is None
    created = user_client.post("/api/Ai/PaperGlossary", params=params)

    assert created.status_code == 201
    body = user_client.get("/api/Ai/PaperGlossary", params=params).json()
    assert body["terms"] == [{"term": "attention", "explanation": "关注重要部分", "page": 1}]
    assert body["model"] == "test-model"


def test_glossary_is_shared_between_users(
    user_client: TestClient, other_client: TestClient, ai_enabled: dict
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    user_client.post("/api/Ai/PaperGlossary", params=url_params(paper_id))

    assert other_client.get("/api/Ai/PaperGlossary", params=url_params(paper_id)).json()


def test_glossary_is_cached_per_language(user_client: TestClient, ai_enabled: dict) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    user_client.post("/api/Ai/PaperGlossary", params=url_params(paper_id))

    english = user_client.get("/api/Ai/PaperGlossary", params=url_params(paper_id, "en"))

    assert english.json() is None


def test_regenerating_replaces_terms(user_client: TestClient, ai_enabled: dict) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    params = url_params(paper_id)
    user_client.post("/api/Ai/PaperGlossary", params=params)
    ai_enabled["answer"] = '{"terms": [{"term": "tokens", "explanation": "new"}]}'

    response = user_client.post("/api/Ai/PaperGlossary", params=params)

    assert [term["term"] for term in response.json()["terms"]] == ["tokens"]


def test_failed_regeneration_keeps_existing_glossary(
    user_client: TestClient, ai_enabled: dict
) -> None:
    paper_id = upload(user_client, make_pdf([LONG_TEXT]))
    params = url_params(paper_id)
    user_client.post("/api/Ai/PaperGlossary", params=params)
    ai_enabled["answer"] = LlmError()

    assert user_client.post("/api/Ai/PaperGlossary", params=params).status_code == 502
    assert user_client.get("/api/Ai/PaperGlossary", params=params).json()["terms"]


def test_glossary_requires_login(client: TestClient) -> None:
    params = url_params(1)

    assert client.get("/api/Ai/PaperGlossary", params=params).status_code == 401
    assert client.post("/api/Ai/PaperGlossary", params=params).status_code == 401
