import pytest

from app.services import llm_json
from app.services.llm_json import LlmJsonError, complete_json, parse_json_object


def test_plain_json() -> None:
    assert parse_json_object('{"a": 1}') == {"a": 1}


def test_code_fence_is_removed() -> None:
    assert parse_json_object('```json\n{"a": 1}\n```') == {"a": 1}
    assert parse_json_object('```\n{"a": 1}\n```') == {"a": 1}


def test_surrounding_text_is_ignored() -> None:
    assert parse_json_object('好的，结果如下：\n{"a": [1, 2]}\n希望有帮助。') == {"a": [1, 2]}


@pytest.mark.parametrize("text", ["", "not json", "[1, 2]", '{"a": ', "{broken}"])
def test_invalid_answers_raise(text: str) -> None:
    with pytest.raises(LlmJsonError):
        parse_json_object(text)


def test_complete_json_passes_token_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = []

    def complete(messages, max_tokens):
        calls.append(max_tokens)
        return '{"ok": true}'

    monkeypatch.setattr(llm_json.llm, "complete", complete)

    assert complete_json([{"role": "user", "content": "x"}], 500) == {"ok": True}
    assert calls == [500]
