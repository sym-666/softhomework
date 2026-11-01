import re
from dataclasses import dataclass
from pathlib import Path

import pymupdf

# 少于这个字符数视为提取不到文字，通常是扫描版 PDF
MIN_TEXT_CHARS = 100


@dataclass(frozen=True)
class PageText:
    page: int
    text: str


class PdfReadError(Exception):
    """PDF 损坏或加密，无法读取。"""


def clean_text(raw: str) -> str:
    # 行尾连字符是排版折行，拼回完整单词
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", raw)
    # 段内换行转空格，段落之间保留一个空行
    paragraphs = re.split(r"\n\s*\n", text)
    cleaned = (re.sub(r"\s+", " ", paragraph).strip() for paragraph in paragraphs)
    return "\n\n".join(paragraph for paragraph in cleaned if paragraph)


def extract_pages(path: Path) -> list[PageText]:
    """按页提取文字，页码从 1 开始，跳过空白页。"""
    try:
        with pymupdf.open(path) as document:
            if document.needs_pass:
                raise PdfReadError("PDF 已加密")
            pages = [
                PageText(number, clean_text(page.get_text()))
                for number, page in enumerate(document, start=1)
            ]
    except (pymupdf.FileDataError, pymupdf.EmptyFileError, RuntimeError, ValueError) as exc:
        raise PdfReadError(str(exc)) from exc
    return [page for page in pages if page.text]


def has_enough_text(pages: list[PageText]) -> bool:
    return sum(len(page.text) for page in pages) >= MIN_TEXT_CHARS
