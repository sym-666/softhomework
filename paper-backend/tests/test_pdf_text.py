from pathlib import Path

import pymupdf
import pytest

from app.services.pdf_text import (
    PageText,
    PdfReadError,
    clean_text,
    extract_pages,
    has_enough_text,
)
from tests.pdf_factory import make_pdf


def write(tmp_path: Path, content: bytes) -> Path:
    path = tmp_path / "paper.pdf"
    path.write_bytes(content)
    return path


def test_clean_text_rejoins_hyphenated_words() -> None:
    assert clean_text("trans-\nformer model") == "transformer model"


def test_clean_text_collapses_line_breaks_within_paragraph() -> None:
    assert clean_text("first line\nsecond   line") == "first line second line"


def test_clean_text_keeps_paragraph_breaks() -> None:
    assert clean_text("one\n\n\n  \ntwo") == "one\n\ntwo"


def test_extract_pages_keeps_page_numbers(tmp_path: Path) -> None:
    path = write(tmp_path, make_pdf(["alpha text", "", "gamma text"]))

    pages = extract_pages(path)

    assert [page.page for page in pages] == [1, 3]
    assert pages[1].text == "gamma text"


def test_extract_pages_rejects_corrupt_file(tmp_path: Path) -> None:
    path = write(tmp_path, b"%PDF-1.4\nnot really a pdf")

    with pytest.raises(PdfReadError):
        extract_pages(path)


def test_extract_pages_rejects_encrypted_file(tmp_path: Path) -> None:
    document = pymupdf.open()
    document.new_page().insert_text((50, 50), "secret")
    content = document.tobytes(encryption=pymupdf.PDF_ENCRYPT_AES_256, user_pw="pw", owner_pw="o")

    with pytest.raises(PdfReadError):
        extract_pages(write(tmp_path, content))


def test_has_enough_text_uses_total_length() -> None:
    assert has_enough_text([PageText(1, "x" * 60), PageText(2, "y" * 40)])
    assert not has_enough_text([PageText(1, "x" * 99)])
    assert not has_enough_text([])
