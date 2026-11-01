import pytest

from app.services.chunking import CHUNK_CHARS, chunk_pages, split_text
from app.services.pdf_text import PageText

WORD_TEXT = " ".join(f"word{index}" for index in range(2000))


def test_short_text_stays_whole() -> None:
    assert split_text("short text") == ["short text"]


def test_empty_text_has_no_parts() -> None:
    assert split_text("") == []
    assert split_text("   ") == []


def test_parts_respect_size_limit() -> None:
    assert all(len(part) <= CHUNK_CHARS for part in split_text(WORD_TEXT))


def test_all_words_are_covered() -> None:
    joined = " ".join(split_text(WORD_TEXT))

    assert all(f"word{index}" in joined for index in range(2000))


def test_adjacent_parts_overlap() -> None:
    parts = split_text(WORD_TEXT, size=200, overlap=50)

    assert parts[0].split()[-1] in parts[1]


def test_prefers_sentence_boundary() -> None:
    sentence = "This is a sentence that ends here. "
    parts = split_text(sentence * 20, size=200, overlap=0)

    assert parts[0].endswith(".")


@pytest.mark.parametrize("text", ["x" * 5000, "。" * 5000, " " * 5000 + "y" * 5000])
def test_terminates_on_text_without_normal_breaks(text: str) -> None:
    parts = split_text(text, size=100, overlap=30)

    assert parts
    assert all(len(part) <= 100 for part in parts)


def test_chunks_keep_page_numbers_and_sequence() -> None:
    chunks = chunk_pages([PageText(2, "first page"), PageText(5, WORD_TEXT)])

    assert chunks[0].page == 2
    assert {chunk.page for chunk in chunks[1:]} == {5}
    assert [chunk.index for chunk in chunks] == list(range(len(chunks)))
