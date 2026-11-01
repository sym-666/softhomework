import httpx
import pytest

from app.services import semantic_scholar
from app.services.semantic_scholar import SearchUnavailableError, search_papers

ITEM = {
    "paperId": "abc",
    "title": "Attention",
    "abstract": "Text",
    "year": 2017,
    "url": "https://s2.example/abc",
    "authors": [{"name": "A"}, {"name": "B"}],
    "openAccessPdf": {"url": "https://s2.example/abc.pdf"},
}


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(semantic_scholar.time, "sleep", lambda _seconds: None)


def client_with(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_results_are_mapped_and_request_is_built() -> None:
    seen: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(200, json={"data": [ITEM]})

    results = search_papers("deep learning", 5, client_with(handler))

    assert results[0].authors == "A, B"
    assert results[0].pdf_url == "https://s2.example/abc.pdf"
    assert seen[0].url.params["query"] == "deep learning"
    assert seen[0].url.params["limit"] == "5"


def test_missing_optional_fields_are_tolerated() -> None:
    item = {"paperId": "x", "title": "T", "authors": [], "openAccessPdf": None}

    client = client_with(lambda _: httpx.Response(200, json={"data": [item]}))

    results = search_papers("q", 5, client)

    assert results[0].authors == "Unknown"
    assert results[0].pdf_url is None
    assert results[0].year is None


def test_rate_limit_is_retried() -> None:
    responses = [httpx.Response(429), httpx.Response(200, json={"data": [ITEM]})]

    results = search_papers("q", 5, client_with(lambda _: responses.pop(0)))

    assert len(results) == 1


def test_persistent_rate_limit_raises() -> None:
    with pytest.raises(SearchUnavailableError):
        search_papers("q", 5, client_with(lambda _: httpx.Response(429)))


def test_network_error_is_retried_then_raises() -> None:
    calls: list[int] = []

    def handler(_request: httpx.Request) -> httpx.Response:
        calls.append(1)
        raise httpx.ConnectError("down")

    with pytest.raises(SearchUnavailableError):
        search_papers("q", 5, client_with(handler))
    assert len(calls) == 3


def test_invalid_json_fails_without_retry() -> None:
    calls: list[int] = []

    def handler(_request: httpx.Request) -> httpx.Response:
        calls.append(1)
        return httpx.Response(200, text="<html>")

    with pytest.raises(SearchUnavailableError):
        search_papers("q", 5, client_with(handler))
    assert len(calls) == 1
