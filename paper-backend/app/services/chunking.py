from dataclasses import dataclass

from app.services.pdf_text import PageText

CHUNK_CHARS = 1200
OVERLAP_CHARS = 150


@dataclass(frozen=True)
class Chunk:
    index: int
    page: int
    text: str


def _find_boundary(text: str, low: int, high: int) -> int:
    """在 [low, high) 内找最靠后的自然断点，优先段落，其次句子，再次空格。"""
    for separator in ("\n\n", ". ", "。", " "):
        position = text.rfind(separator, low, high)
        if position != -1:
            return position + len(separator)
    return high


def split_text(text: str, size: int = CHUNK_CHARS, overlap: int = OVERLAP_CHARS) -> list[str]:
    """切分文本，相邻片段重叠 overlap 个字符，避免句子被切在边界上检索不到。"""
    parts: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            end = _find_boundary(text, start + size * 3 // 4, end)
        part = text[start:end].strip()
        if part:
            parts.append(part)
        if end >= len(text):
            break
        # 保证 start 前进，否则断点落在重叠区内时会死循环
        start = max(end - overlap, start + 1)
    return parts


def chunk_pages(pages: list[PageText]) -> list[Chunk]:
    """逐页切块，不跨页，这样每个切块都能对应到确切的页码。"""
    chunks: list[Chunk] = []
    for page in pages:
        for text in split_text(page.text):
            chunks.append(Chunk(index=len(chunks), page=page.page, text=text))
    return chunks
