import logging
import time

import httpx
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger(__name__)

SEARCH_ENDPOINT = "https://api.semanticscholar.org/graph/v1/paper/search"
SEARCH_FIELDS = "paperId,title,abstract,year,authors,url,openAccessPdf"
MAX_ATTEMPTS = 3
REQUEST_TIMEOUT_SECONDS = 15


class SearchUnavailableError(Exception):
    """在线检索暂时不可用（限流、网络或上游错误）。"""


class SearchResult(BaseModel):
    id: str
    title: str
    authors: str
    year: int | None
    abstract: str | None
    url: str | None
    pdf_url: str | None


def _to_result(item: dict) -> SearchResult:
    names = [author.get("name", "") for author in item.get("authors") or []]
    return SearchResult(
        id=item.get("paperId") or "",
        title=item.get("title") or "",
        authors=", ".join(names) if names else "Unknown",
        year=item.get("year"),
        abstract=item.get("abstract"),
        url=item.get("url"),
        pdf_url=(item.get("openAccessPdf") or {}).get("url"),
    )


def search_papers(
    query: str, limit: int, client: httpx.Client | None = None
) -> list[SearchResult]:
    headers = {"Accept": "application/json", "User-Agent": "PaperLearning/1.0"}
    api_key = get_settings().semantic_scholar_api_key
    if api_key:
        headers["x-api-key"] = api_key
    params = {"query": query, "fields": SEARCH_FIELDS, "limit": limit, "offset": 0}

    http = client or httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS)
    try:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                response = http.get(SEARCH_ENDPOINT, params=params, headers=headers)
                if response.status_code == 429:
                    logger.info("Semantic Scholar 限流，第 %d 次尝试", attempt)
                    if attempt < MAX_ATTEMPTS:
                        time.sleep(attempt)
                    continue
                response.raise_for_status()
                return [_to_result(item) for item in response.json().get("data") or []]
            except httpx.HTTPError as exc:
                logger.warning("Semantic Scholar 第 %d 次请求失败：%s", attempt, exc)
            except ValueError as exc:
                # 响应不是合法 JSON，重试也没有意义
                raise SearchUnavailableError from exc
    finally:
        if client is None:
            http.close()

    raise SearchUnavailableError
