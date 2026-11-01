import logging
from collections.abc import Iterator

from openai import OpenAI, OpenAIError

from app.config import get_settings

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT_SECONDS = 60
# 推理型模型的思考过程也计入 max_tokens，上限要远高于正文长度。这只是上限，不会增加实际消耗
DEFAULT_MAX_TOKENS = 6000
Message = dict[str, str]


class LlmError(Exception):
    """调用模型失败（网络、限流、鉴权等）。"""


class LlmTruncatedError(LlmError):
    """回答达到 max_tokens 被截断，内容不完整，不能当作成功结果保存。"""


def is_configured() -> bool:
    settings = get_settings()
    return bool(settings.ai_openai_api_key and settings.ai_openai_model_id)


def _build_client() -> OpenAI:
    settings = get_settings()
    return OpenAI(
        base_url=settings.ai_openai_base_url,
        api_key=settings.ai_openai_api_key,
        timeout=REQUEST_TIMEOUT_SECONDS,
        max_retries=1,
    )


def complete(messages: list[Message], max_tokens: int = DEFAULT_MAX_TOKENS) -> str:
    try:
        response = _build_client().chat.completions.create(
            model=get_settings().ai_openai_model_id,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0,
        )
    except OpenAIError as exc:
        logger.warning("模型调用失败：%s", exc)
        raise LlmError from exc
    choice = response.choices[0]
    if choice.finish_reason == "length":
        logger.warning("模型回答被截断，max_tokens=%d", max_tokens)
        raise LlmTruncatedError
    return (choice.message.content or "").strip()


def stream(messages: list[Message], max_tokens: int = DEFAULT_MAX_TOKENS) -> Iterator[str]:
    try:
        response = _build_client().chat.completions.create(
            model=get_settings().ai_openai_model_id,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.2,
            stream=True,
        )
        # 用 with 关闭连接：客户端中途断开时不再继续消耗额度
        truncated = False
        with response:
            for chunk in response:
                if not chunk.choices:
                    continue
                choice = chunk.choices[0]
                if choice.delta.content:
                    yield choice.delta.content
                truncated = truncated or choice.finish_reason == "length"
    except OpenAIError as exc:
        logger.warning("模型流式调用失败：%s", exc)
        raise LlmError from exc
    if truncated:
        logger.warning("模型流式回答被截断，max_tokens=%d", max_tokens)
        raise LlmTruncatedError
