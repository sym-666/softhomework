import re
from dataclasses import dataclass

from app.services.pdf_text import PageText

MAX_REFERENCES = 300
MAX_REFERENCE_CHARS = 1000
MIN_REFERENCE_CHARS = 20
MIN_TITLE_WORDS = 2
NAME_CONNECTORS = {"and", "de", "van", "von", "der", "et", "al"}
MAX_TITLE_CHARS = 300

# 正文里的小写 references 不算标题，所以区分大小写
HEADING = re.compile(
    r"(?:^|(?<=[\s.]))(?:References|REFERENCES|Bibliography|BIBLIOGRAPHY|参考文献)\b"
)
BRACKET_MARKER = re.compile(r"(?:^|(?<=\s))\[(\d{1,3})\]\s+")
DOT_MARKER = re.compile(r"(?:^|(?<=\s))(\d{1,3})\.\s+(?=[A-Z一-鿿])")
# 没有编号的格式靠“姓, 名字缩写”判断新条目的开始
AUTHOR_START = re.compile(r"(?<=[.)])\s+(?=[A-Z][\w'’-]+,\s+[A-Z]\.)")
YEAR = re.compile(r"\b(?:19|20)\d{2}\b")
# 页面底部的页码被提取到了条目末尾
TRAILING_PAGE_NUMBER = re.compile(r"(?<=[.)])\s+\d{1,4}$")
# 括号里的年份不算句尾：作者-年份格式的年份紧跟作者，标题还在后面
SENTENCE_END_AFTER_YEAR = re.compile(r"^.*?\b(?:19|20)\d{2}[a-z]?\.")
SENTENCE_BREAK = re.compile(r"(?<=[.?!])\s+")
TRAILING_YEAR = re.compile(r",?\s*(?:19|20)\d{2}\.?$")
VENUE = re.compile(
    r"^(?:In\b|Proceedings|arXiv|CoRR|Journal of|Transactions)|\b(?:pages?|pp|vol)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Reference:
    index: int
    text: str
    title: str
    year: int | None


def find_reference_section(pages: list[PageText]) -> str:
    """取最后一个标题之后的内容；紧跟编号的标题优先，正文可能提到 Bibliography 一词。"""
    full_text = "\n\n".join(page.text for page in pages)
    matches = list(HEADING.finditer(full_text))
    if not matches:
        return ""
    numbered = [
        match
        for match in matches
        if BRACKET_MARKER.match(full_text[match.end() :].lstrip())
        or DOT_MARKER.match(full_text[match.end() :].lstrip())
    ]
    return full_text[(numbered or matches)[-1].end() :].strip()


def _split_numbered(text: str, marker: re.Pattern[str]) -> list[str]:
    """编号必须连续递增。不连续的数字是正文引用或页码，不是新条目。"""
    starts: list[tuple[int, int]] = []
    expected = 1
    for match in marker.finditer(text):
        if int(match.group(1)) == expected:
            starts.append((match.start(), match.end()))
            expected += 1
    if not starts:
        return []
    ends = [start for start, _ in starts[1:]] + [len(text)]
    return [text[start[1] : end] for start, end in zip(starts, ends, strict=True)]


def split_references(section: str) -> list[str]:
    for marker in (BRACKET_MARKER, DOT_MARKER):
        items = _split_numbered(section, marker)
        if len(items) >= 2:
            return items
    paragraphs = [item for item in section.split("\n\n") if YEAR.search(item)]
    if len(paragraphs) >= 2:
        return paragraphs
    return AUTHOR_START.split(section)


def _normalize(text: str) -> str:
    return TRAILING_PAGE_NUMBER.sub("", " ".join(text.split()))


def _trim_last(text: str) -> str:
    """参考文献之后可能还有附录，会被算进最后一条，截到年份所在的句子。"""
    match = SENTENCE_END_AFTER_YEAR.match(text)
    return match.group(0) if match else text


def _looks_like_authors(part: str) -> bool:
    """作者列表有逗号，且除连接词外全部首字母大写；标题里总有小写单词。"""
    words = [word for word in part.replace(",", " ").split() if word not in NAME_CONNECTORS]
    return "," in part and all(word[0].isupper() for word in words)


def guess_title(text: str) -> str:
    """常见格式是“作者. 标题. 出处”，所以跳过第一句，取后面第一个不像出处的句子。"""
    sentences = [part.strip() for part in SENTENCE_BREAK.split(text) if part.strip()]
    for sentence in sentences[1:]:
        title = TRAILING_YEAR.sub("", sentence).rstrip(".")
        if (
            len(title.split()) >= MIN_TITLE_WORDS
            and not VENUE.search(title)
            and not _looks_like_authors(title)
        ):
            return title[:MAX_TITLE_CHARS]
    # 不符合常见格式时退回全文，检索接口也能处理
    return text[:MAX_TITLE_CHARS]


def parse_references(pages: list[PageText]) -> list[Reference]:
    section = find_reference_section(pages)
    if not section:
        return []
    items = [_normalize(item) for item in split_references(section)]
    if items:
        items[-1] = _trim_last(items[-1])
    references: list[Reference] = []
    for item in items[:MAX_REFERENCES]:
        if len(item) < MIN_REFERENCE_CHARS:
            continue
        text = item[:MAX_REFERENCE_CHARS]
        years = YEAR.findall(text)
        references.append(
            Reference(
                index=len(references) + 1,
                text=text,
                title=guess_title(text),
                year=int(years[-1]) if years else None,
            )
        )
    return references
