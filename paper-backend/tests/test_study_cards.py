from datetime import UTC, date, datetime, timedelta

import pytest

from app.models import Paper, StudyCard
from app.services import llm_json
from app.services.llm_json import LlmJsonError
from app.services.retrieval import Passage
from app.services.study_cards import (
    FORECAST_DAYS,
    CardDraft,
    CardProgress,
    build_card_messages,
    generate_cards,
    parse_cards,
    schedule_review,
    summarize_progress,
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


def progress(paper_id: int, box: int, due_at: datetime) -> CardProgress:
    return CardProgress(paper_id, f"Paper {paper_id}", box, due_at)


def test_summary_counts_due_and_mastered() -> None:
    cards = [
        progress(1, 0, NOW - timedelta(days=1)),
        progress(1, 3, NOW + timedelta(days=7)),
        progress(2, 5, NOW + timedelta(days=30)),
    ]

    summary = summarize_progress(cards, NOW, 0)

    assert (summary.total, summary.due, summary.mastered) == (3, 1, 2)
    assert summary.next_due_at == NOW + timedelta(days=7)


def test_forecast_covers_a_week_and_counts_overdue_today() -> None:
    cards = [
        progress(1, 0, NOW - timedelta(days=5)),
        progress(1, 1, NOW + timedelta(days=2)),
        progress(1, 2, NOW + timedelta(days=40)),
    ]

    forecast = summarize_progress(cards, NOW, 0).forecast

    assert len(forecast) == FORECAST_DAYS
    assert forecast[0] == (NOW.date(), 1)
    assert forecast[2] == (NOW.date() + timedelta(days=2), 1)
    assert sum(count for _day, count in forecast) == 2


def test_forecast_uses_the_users_day() -> None:
    now = datetime(2026, 1, 1, 20, 0, tzinfo=UTC)
    # 东八区此时已是 1 月 2 日，两小时后到期的卡片也在这一天
    cards = [progress(1, 1, now + timedelta(hours=2))]

    forecast = summarize_progress(cards, now, -480).forecast

    assert forecast[0][0] == date(2026, 1, 2)
    assert forecast[0][1] == 1


def test_naive_due_time_is_treated_as_utc() -> None:
    naive = (NOW - timedelta(hours=1)).replace(tzinfo=None)

    assert summarize_progress([progress(1, 0, naive)], NOW, 0).due == 1


def test_papers_with_more_due_cards_come_first() -> None:
    cards = [
        progress(1, 0, NOW + timedelta(days=1)),
        progress(2, 0, NOW),
        progress(2, 3, NOW + timedelta(days=9)),
    ]

    papers = summarize_progress(cards, NOW, 0).papers

    assert [paper.paper_id for paper in papers] == [2, 1]
    assert (papers[0].total, papers[0].due, papers[0].mastered) == (2, 1, 1)


def test_no_cards_gives_empty_summary() -> None:
    summary = summarize_progress([], NOW, 0)

    assert (summary.total, summary.due, summary.next_due_at, summary.papers) == (0, 0, None, [])
    assert all(count == 0 for _day, count in summary.forecast)
