import json
import re

from app.services import llm
from app.services.llm import LlmError, Message

CODE_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)


class LlmJsonError(LlmError):
    """模型的回答不是约定的 JSON。"""


def parse_json_object(text: str) -> dict:
    """提取回答中的 JSON 对象。模型常在 JSON 外包代码块或加一句说明。"""
    fenced = CODE_FENCE.search(text)
    candidate = fenced.group(1) if fenced else text
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start == -1 or end <= start:
        raise LlmJsonError
    try:
        parsed = json.loads(candidate[start : end + 1])
    except json.JSONDecodeError as exc:
        raise LlmJsonError from exc
    if not isinstance(parsed, dict):
        raise LlmJsonError
    return parsed


def complete_json(messages: list[Message], max_tokens: int) -> dict:
    return parse_json_object(llm.complete(messages, max_tokens=max_tokens))
