import re
import unicodedata
from collections.abc import Iterable

from app.models import Paper

# BibTeX 里有特殊含义的字符，不转义会破坏整个文件
BIBTEX_ESCAPES = {
    "\\": r"\textbackslash{}",
    "{": r"\{",
    "}": r"\}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}
AUTHOR_SEPARATOR = re.compile(r"\s*(?:[,;，；、]|\band\b|&)\s*")
ET_AL = re.compile(r"\s*\bet\s+al\.?\s*$", re.IGNORECASE)
TITLE_STOPWORDS = {"a", "an", "the", "on", "of", "in", "for", "and", "to", "with"}


def escape_bibtex(text: str) -> str:
    return "".join(BIBTEX_ESCAPES.get(char, char) for char in " ".join(text.split()))


def _ascii_word(text: str) -> str:
    """转成纯 ASCII：引用键里的非 ASCII 字符在传统 BibTeX 下会报错。"""
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", normalized.lower())


def format_authors(authors: str) -> str:
    """把“A, B 和 et al.”这类写法转成 BibTeX 的 A and B and others。"""
    has_et_al = ET_AL.search(authors) is not None
    names = [name.strip() for name in AUTHOR_SEPARATOR.split(ET_AL.sub("", authors))]
    parts = [escape_bibtex(name) for name in names if name]
    if has_et_al:
        parts.append("others")
    return " and ".join(parts)


def citation_key(paper: Paper) -> str:
    """形如 vaswani2017attention；作者或标题无法转成 ASCII 时用论文编号。"""
    names = [name for name in AUTHOR_SEPARATOR.split(ET_AL.sub("", paper.authors)) if name.strip()]
    surname = _ascii_word(names[0].split()[-1]) if names else ""
    words = (_ascii_word(word) for word in paper.title.split())
    title_word = next((word for word in words if word and word not in TITLE_STOPWORDS), "")
    if not surname or not title_word:
        return f"paper{paper.id}"
    return f"{surname}{paper.year}{title_word}"


def bibtex_entry(paper: Paper, key: str) -> str:
    fields = [
        f"  title = {{{escape_bibtex(paper.title)}}},",
        f"  author = {{{format_authors(paper.authors)}}},",
        f"  year = {{{paper.year}}},",
    ]
    if paper.source_url:
        # 网址不做转义，否则链接会失效；只去掉会破坏字段边界的花括号
        fields.append(f"  url = {{{re.sub(r'[{}]', '', paper.source_url)}}},")
    return "\n".join([f"@article{{{key},", *fields, "}"])


def unique_key(key: str, used: set[str]) -> str:
    candidate = key
    suffix = 1
    while candidate in used:
        suffix += 1
        candidate = f"{key}{suffix}"
    used.add(candidate)
    return candidate


def papers_to_bibtex(papers: Iterable[Paper]) -> str:
    used: set[str] = set()
    entries = [bibtex_entry(paper, unique_key(citation_key(paper), used)) for paper in papers]
    return "\n\n".join(entries) + "\n" if entries else ""
