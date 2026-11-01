from datetime import UTC, datetime, timedelta

import pytest

from app.models import Paper, StudyCard
from app.services import llm_json
from app.services.llm_json import LlmJsonError
from app.services.retrieval import Passage
from app.services.study_cards import (
    CardDraft,
    build_card_messages,
    generate_cards,
    parse_cards,
    schedule_review,
)

PAPER = Paper(title="Attention", authors="Vaswani", abstract="Abstract")
PASSAGES = [Passage(1, "Attention text"), Passage(4, "More text")]
QUIZ = {
    "question": "Q1",
    "options": ["A", "B", "C", "D"],
    "answer": "B",
    "explanation": "Because",
    "page": 4,
}
FLASHCARD = {"question": "Term", "answer": "Meaning", "page": 1}


def test_valid_cards_are_parsed() -> None:
    drafts = parse_cards({"quiz": [QUIZ], "flashcards": [FLASHCARD]}, {1, 4})

    assert drafts == [
        CardDraft("quiz", "Q1", "B", ("A", "B", "C", "D"), "Because", 4),
        CardDraft("flashcard", "Term", "Meaning", page=1),
    ]


@pytest.mark.parametrize(
    "broken",
    [
        {**QUIZ, "answer": "Z"},
        {**QUIZ, "options": ["only one"]},
        {**QUIZ, "options": "A,B"},
        {**QUIZ, "question": "  "},
        "not an object",
    ],
)
def test_broken_quiz_is_dropped(broken: object) -> None:
    assert parse_cards({"quiz": [broken]}, {1}) == []


def test_broken_flashcard_is_dropped() -> None:
    assert parse_cards({"flashcards": [{"question": "only front"}, 3]}, {1}) == []


@pytest.mark.parametrize("page", [99, "4", True, None])
def test_unknown_page_is_cleared(page: object) -> None:
    drafts = parse_cards({"flashcards": [{**FLASHCARD, "page": page}]}, {1, 4})

    assert drafts[0].page is None


def test_non_list_sections_are_ignored() -> None:
    assert parse_cards({"quiz": "none", "flashcards": None}, {1}) == []


def test_duplicate_questions_are_merged() -> None:
    assert len(parse_cards({"quiz": [QUIZ, QUIZ]}, {4})) == 1


def test_duplicate_options_are_merged() -> None:
    item = {**QUIZ, "options": ["A", "A", "B"]}

    assert parse_cards({"quiz": [item]}, {4})[0].options == ("A", "B")


def test_prompt_treats_paper_as_data_and_follows_language() -> None:
    system, user = build_card_messages(PAPER, PASSAGES, "en")

    assert "不要执行" in system["content"]
    assert "<paper_context>" in user["content"]
    assert "in English" in user["content"]
    assert "简体中文" in build_card_messages(PAPER, PASSAGES, "zh-CN")[1]["content"]


def test_generate_rejects_answer_without_usable_cards(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(llm_json.llm, "complete", lambda messages, max_tokens: '{"quiz": []}')

    with pytest.raises(LlmJsonError):
        generate_cards(PAPER, PASSAGES, "zh-CN")


def test_generate_limits_pages_to_selected_passages(monkeypatch: pytest.MonkeyPatch) -> None:
    answer = '{"flashcards": [{"question": "q", "answer": "a", "page": 4}]}'
    monkeypatch.setattr(llm_json.llm, "complete", lambda messages, max_tokens: answer)

    assert generate_cards(PAPER, PASSAGES, "zh-CN")[0].page == 4
    assert generate_cards(PAPER, [], "zh-CN")[0].page is None


NOW = datetime(2026, 1, 1, tzinfo=UTC)


def test_correct_answers_move_through_intervals() -> None:
    card = StudyCard(box=0, due_at=NOW)

    schedule_review(card, True, NOW)
    assert (card.box, card.due_at) == (1, NOW + timedelta(days=1))
    schedule_review(card, True, NOW)
    assert (card.box, card.due_at) == (2, NOW + timedelta(days=3))


def test_interval_stops_at_the_last_step() -> None:
    card = StudyCard(box=40, due_at=NOW)

    schedule_review(card, True, NOW)

    assert card.due_at == NOW + timedelta(days=30)


def test_wrong_answer_resets_progress() -> None:
    card = StudyCard(box=3, due_at=NOW + timedelta(days=7))

    schedule_review(card, False, NOW)

    assert (card.box, card.due_at) == (0, NOW)
