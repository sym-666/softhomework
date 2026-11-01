from app.models import Paper
from app.services.paper_guide import (
    MAX_GUIDE_CHARS,
    build_guide_messages,
    select_guide_passages,
)
from app.services.retrieval import Passage

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

