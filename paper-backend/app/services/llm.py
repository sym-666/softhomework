import logging
from collections.abc import Iterator

from openai import OpenAI, OpenAIError

from app.config import get_settings

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT_SECONDS = 60
Message = dict[str, str]


class LlmError(Exception):
    """调用模型失败（网络、限流、鉴权等）。"""


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


def complete(messages: list[Message], max_tokens: int = 200) -> str:
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
    return (response.choices[0].message.content or "").strip()


def stream(messages: list[Message], max_tokens: int = 1500) -> Iterator[str]:
    try:
        response = _build_client().chat.completions.create(
            model=get_settings().ai_openai_model_id,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.2,
            stream=True,
        )
        # 用 with 关闭连接：客户端中途断开时不再继续消耗额度
        with response:
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
    except OpenAIError as exc:
        logger.warning("模型流式调用失败：%s", exc)
        raise LlmError from exc
