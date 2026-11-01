import re
from dataclasses import dataclass

from rank_bm25 import BM25Okapi

DEFAULT_LIMIT = 6
# 英文按词，中文按字：不引入分词库也能匹配中文论文
TOKEN_PATTERN = re.compile(r"[a-z0-9]+|[一-鿿]")
CJK_PATTERN = re.compile(r"[一-鿿]")


@dataclass(frozen=True)
class Passage:
    page: int
    text: str


def tokenize(text: str) -> list[str]:
    return TOKEN_PATTERN.findall(text.lower())


def contains_cjk(text: str) -> bool:
    return CJK_PATTERN.search(text) is not None


def rank_passages(
    passages: list[Passage], query: str, limit: int = DEFAULT_LIMIT
) -> list[Passage]:
    """按相关度返回切块。没有任何词命中时返回开头部分，这类问题通常是在问整篇论文。"""
    if not passages:
        return []

    corpus = [tokenize(passage.text) for passage in passages]
    query_tokens = tokenize(query)
    query_terms = set(query_tokens)
    overlaps = [len(query_terms & set(tokens)) for tokens in corpus]
    if not any(overlaps):
        return passages[:limit]

    # BM25 在切块很少时 IDF 可能全为 0，用命中词数作为第二排序键，短论文也能排序
    scores = BM25Okapi(corpus).get_scores(query_tokens)
    ranked = sorted(
        (index for index, overlap in enumerate(overlaps) if overlap),
        key=lambda index: (scores[index], overlaps[index]),
        reverse=True,
    )
    return [passages[index] for index in ranked[:limit]]
