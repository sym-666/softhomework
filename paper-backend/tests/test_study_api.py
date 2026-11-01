import json
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import update

from app.config import get_settings
from app.db import SessionLocal
from app.models import StudyCard
from app.services import llm_json
from app.services.llm import LlmError
from tests.pdf_factory import make_pdf
from tests.test_papers import upload

LONG_TEXT = "Attention lets a model focus on relevant tokens. " * 12
ANSWER = json.dumps(
    {
        "quiz": [
            {
                "question": "What does attention do?",
                "options": ["Focus", "Sort", "Hash", "Cache"],
                "answer": "Focus",
                "explanation": "See page 1",
                "page": 1,
            }
        ],
        "flashcards": [{"question": "Attention", "answer": "Weighted focus", "page": 7}],
    }
)


@pytest.fixture
def ai_enabled(monkeypatch: pytest.MonkeyPatch) -> Iterator[dict]:
    monkeypatch.setenv("AI_OPENAI_API_KEY", "key")
    monkeypatch.setenv("AI_OPENAI_MODEL_ID", "model")
    get_settings.cache_clear()
    state = {"answer": ANSWER}

    def complete(messages, max_tokens):
        if isinstance(state["answer"], Exception):
            raise state["answer"]
        return state["answer"]

    monkeypatch.setattr(llm_json.llm, "complete", complete)
    yield state
    get_settings.cache_clear()


def generate(client: TestClient, paper_id: int, lang: str = "zh-CN"):
    return client.post("/api/Ai/StudyCards", params={"id": paper_id, "lang": lang})


def cards_url(paper_id: int) -> str:
    return f"/api/Papers/{paper_id}/study-cards"


def make_paper(client: TestClient) -> int:
    return upload(client, make_pdf([LONG_TEXT]))


def test_generate_saves_cards(user_client: TestClient, ai_enabled: dict) -> None:
    paper_id = make_paper(user_client)

    response = generate(user_client, paper_id)

    assert response.status_code == 201
    quiz, flashcard = response.json()
    assert quiz["kind"] == "quiz"
    assert quiz["options"] == ["Focus", "Sort", "Hash", "Cache"]
    assert quiz["page"] == 1
    assert quiz["paperTitle"] == "Paper"
    assert quiz["dueAt"].endswith("Z")
    assert flashcard["kind"] == "flashcard"
    # 上下文里没有第 7 页，模型给的页码不能相信
    assert flashcard["page"] is None
    assert len(user_client.get(cards_url(paper_id)).json()) == 2


def test_generating_again_skips_existing_questions(
    user_client: TestClient, ai_enabled: dict
) -> None:
    paper_id = make_paper(user_client)
    generate(user_client, paper_id)

    response = generate(user_client, paper_id)

    assert response.json() == []
    assert len(user_client.get(cards_url(paper_id)).json()) == 2


def test_model_failure_returns_502(user_client: TestClient, ai_enabled: dict) -> None:
    paper_id = make_paper(user_client)
    ai_enabled["answer"] = LlmError()

    assert generate(user_client, paper_id).status_code == 502


def test_unparseable_answer_returns_502(user_client: TestClient, ai_enabled: dict) -> None:
    paper_id = make_paper(user_client)
    ai_enabled["answer"] = "抱歉，我不能出题"

    assert generate(user_client, paper_id).status_code == 502
    assert user_client.get(cards_url(paper_id)).json() == []


def test_missing_configuration_returns_503(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("AI_OPENAI_API_KEY", "")
    get_settings.cache_clear()
    paper_id = make_paper(user_client)

    assert generate(user_client, paper_id).status_code == 503
    get_settings.cache_clear()


def test_unknown_language_is_rejected(user_client: TestClient, ai_enabled: dict) -> None:
    assert generate(user_client, make_paper(user_client), "fr").status_code == 422


def test_cards_are_private(
    user_client: TestClient, other_client: TestClient, ai_enabled: dict
) -> None:
    paper_id = make_paper(user_client)
    card_id = generate(user_client, paper_id).json()[0]["id"]

    assert other_client.get(cards_url(paper_id)).json() == []
    assert other_client.get("/api/Study-Cards/due").json()["total"] == 0
    review = other_client.post(f"/api/Study-Cards/{card_id}/review", json={"correct": True})
    assert review.status_code == 404
    assert other_client.delete(f"/api/Study-Cards/{card_id}").status_code == 404


def test_new_cards_are_due_immediately(user_client: TestClient, ai_enabled: dict) -> None:
    generate(user_client, make_paper(user_client))

    body = user_client.get("/api/Study-Cards/due").json()

    assert body["total"] == 2
    assert len(body["items"]) == 2


def test_correct_review_postpones_card(user_client: TestClient, ai_enabled: dict) -> None:
    card_id = generate(user_client, make_paper(user_client)).json()[0]["id"]

    response = user_client.post(f"/api/Study-Cards/{card_id}/review", json={"correct": True})

    assert response.status_code == 200
    assert response.json()["box"] == 1
    due = user_client.get("/api/Study-Cards/due").json()
    assert due["total"] == 1
    assert card_id not in [card["id"] for card in due["items"]]


def test_wrong_review_keeps_card_due(user_client: TestClient, ai_enabled: dict) -> None:
    card_id = generate(user_client, make_paper(user_client)).json()[0]["id"]
    user_client.post(f"/api/Study-Cards/{card_id}/review", json={"correct": True})

    response = user_client.post(f"/api/Study-Cards/{card_id}/review", json={"correct": False})

    assert response.json()["box"] == 0
    assert user_client.get("/api/Study-Cards/due").json()["total"] == 2


def test_due_list_is_ordered_and_limited(user_client: TestClient, ai_enabled: dict) -> None:
    second, first = generate(user_client, make_paper(user_client)).json()
    with SessionLocal() as db:
        db.execute(
            update(StudyCard)
            .where(StudyCard.id == first["id"])
            .values(due_at=datetime.now(UTC) - timedelta(days=2))
        )
        db.commit()

    body = user_client.get("/api/Study-Cards/due", params={"limit": 1}).json()

    assert body["total"] == 2
    assert [card["id"] for card in body["items"]] == [first["id"]]


def test_delete_card(user_client: TestClient, ai_enabled: dict) -> None:
    paper_id = make_paper(user_client)
    card_id = generate(user_client, paper_id).json()[0]["id"]

    assert user_client.delete(f"/api/Study-Cards/{card_id}").status_code == 204
    assert len(user_client.get(cards_url(paper_id)).json()) == 1


def test_study_routes_require_login(client: TestClient) -> None:
    assert client.get("/api/Study-Cards/due").status_code == 401
    assert client.get(cards_url(1)).status_code == 401
    assert client.post("/api/Study-Cards/1/review", json={"correct": True}).status_code == 401


def test_summary_reports_progress_by_paper(user_client: TestClient, ai_enabled: dict) -> None:
    paper_id = make_paper(user_client)
    first, _second = generate(user_client, paper_id).json()
    user_client.post(f"/api/Study-Cards/{first['id']}/review", json={"correct": True})

    body = user_client.get("/api/Study-Cards/summary", params={"tzOffset": -480}).json()

    assert (body["total"], body["due"], body["mastered"]) == (2, 1, 0)
    assert body["nextDueAt"].endswith("Z")
    assert len(body["forecast"]) == 7
    assert body["papers"] == [
        {"paperId": paper_id, "title": "Paper", "total": 2, "due": 1, "mastered": 0}
    ]


def test_summary_is_private(
    user_client: TestClient, other_client: TestClient, ai_enabled: dict
) -> None:
    generate(user_client, make_paper(user_client))

    body = other_client.get("/api/Study-Cards/summary").json()

    assert (body["total"], body["papers"]) == (0, [])


def test_due_cards_can_be_filtered_by_paper(user_client: TestClient, ai_enabled: dict) -> None:
    first = make_paper(user_client)
    second = make_paper(user_client)
    generate(user_client, first)
    generate(user_client, second)

    body = user_client.get("/api/Study-Cards/due", params={"paperId": second}).json()

    assert body["total"] == 2
    assert {card["paperId"] for card in body["items"]} == {second}


def test_summary_requires_login(client: TestClient) -> None:
    assert client.get("/api/Study-Cards/summary").status_code == 401
