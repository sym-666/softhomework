import json

import httpx
import pytest
from fastapi.testclient import TestClient
from openai import OpenAI

from app.config import get_settings
from app.services import llm
from app.services.llm import LlmError, LlmTruncatedError


def use_transport(monkeypatch: pytest.MonkeyPatch, handler) -> None:
    def build() -> OpenAI:
        return OpenAI(
            base_url="http://llm.test/v1",
            api_key="k",
            max_retries=0,
            http_client=httpx.Client(transport=httpx.MockTransport(handler)),
        )

    monkeypatch.setattr(llm, "_build_client", build)


def sse(*payloads: dict) -> httpx.Response:
    body = "".join(f"data: {json.dumps(payload)}\n\n" for payload in payloads) + "data: [DONE]\n\n"
    return httpx.Response(200, headers={"content-type": "text/event-stream"}, text=body)


def delta(content: str | None) -> dict:
    return {
        "id": "1",
        "object": "chat.completion.chunk",
        "created": 1,
        "model": "m",
        "choices": [{"index": 0, "delta": {"content": content}, "finish_reason": None}],
    }


def test_complete_returns_stripped_text(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: list[dict] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content))
        return httpx.Response(
            200,
            json={
                "id": "1",
                "object": "chat.completion",
                "created": 1,
                "model": "m",
                "choices": [
                    {
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {"role": "assistant", "content": "  answer \n"},
                    }
                ],
            },
        )

    use_transport(monkeypatch, handler)

    assert llm.complete([{"role": "user", "content": "q"}], max_tokens=50) == "answer"
    assert seen[0]["max_tokens"] == 50


def test_stream_yields_text_and_skips_empty_deltas(monkeypatch: pytest.MonkeyPatch) -> None:
    use_transport(monkeypatch, lambda _: sse(delta("Hel"), delta(None), delta("lo")))

    assert list(llm.stream([{"role": "user", "content": "q"}])) == ["Hel", "lo"]


def test_complete_wraps_upstream_error(monkeypatch: pytest.MonkeyPatch) -> None:
    use_transport(monkeypatch, lambda _: httpx.Response(500, json={"error": {"message": "x"}}))

    with pytest.raises(LlmError):
        llm.complete([{"role": "user", "content": "q"}])


def test_stream_wraps_auth_error(monkeypatch: pytest.MonkeyPatch) -> None:
    use_transport(monkeypatch, lambda _: httpx.Response(401, json={"error": {"message": "x"}}))

    with pytest.raises(LlmError):
        list(llm.stream([{"role": "user", "content": "q"}]))


def test_status_requires_login(client: TestClient) -> None:
    assert client.get("/api/Ai/Status").status_code == 401


def test_status_reports_configuration(
    user_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("AI_OPENAI_API_KEY", "")
    monkeypatch.setenv("AI_OPENAI_MODEL_ID", "")
    get_settings.cache_clear()
    assert user_client.get("/api/Ai/Status").json() == {"enabled": False}

    monkeypatch.setenv("AI_OPENAI_API_KEY", "key")
    monkeypatch.setenv("AI_OPENAI_MODEL_ID", "model")
    get_settings.cache_clear()
    assert user_client.get("/api/Ai/Status").json() == {"enabled": True}

    monkeypatch.undo()
    get_settings.cache_clear()


def finished(reason: str) -> dict:
    return delta(None) | {
        "choices": [{"index": 0, "delta": {}, "finish_reason": reason}],
    }


def test_complete_rejects_truncated_answer(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "id": "1",
                "object": "chat.completion",
                "created": 1,
                "model": "m",
                "choices": [
                    {
                        "index": 0,
                        "finish_reason": "length",
                        "message": {"role": "assistant", "content": '{"quiz": [{"que'},
                    }
                ],
            },
        )

    use_transport(monkeypatch, handler)

    with pytest.raises(LlmTruncatedError):
        llm.complete([{"role": "user", "content": "q"}], max_tokens=50)


def test_stream_raises_after_truncated_text(monkeypatch: pytest.MonkeyPatch) -> None:
    use_transport(monkeypatch, lambda _: sse(delta("half"), finished("length")))
    received: list[str] = []

    with pytest.raises(LlmTruncatedError):
        for text in llm.stream([{"role": "user", "content": "q"}]):
            received.append(text)

    assert received == ["half"]


def test_stream_accepts_normal_finish(monkeypatch: pytest.MonkeyPatch) -> None:
    use_transport(monkeypatch, lambda _: sse(delta("done"), finished("stop")))

    assert list(llm.stream([{"role": "user", "content": "q"}])) == ["done"]


def test_truncation_counts_as_model_failure() -> None:
    assert issubclass(LlmTruncatedError, LlmError)


def capture_body(monkeypatch: pytest.MonkeyPatch, effort: str) -> list[dict]:
    monkeypatch.setenv("AI_OPENAI_REASONING_EFFORT", effort)
    get_settings.cache_clear()
    seen: list[dict] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content))
        return sse(delta("ok"), finished("stop"))

    use_transport(monkeypatch, handler)
    return seen


def test_reasoning_effort_is_sent_when_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    seen = capture_body(monkeypatch, "low")

    list(llm.stream([{"role": "user", "content": "q"}]))

    assert seen[0]["reasoning_effort"] == "low"
    get_settings.cache_clear()


def test_reasoning_effort_is_omitted_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    seen = capture_body(monkeypatch, "")

    list(llm.stream([{"role": "user", "content": "q"}]))

    assert "reasoning_effort" not in seen[0]
    get_settings.cache_clear()
