import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

logger = logging.getLogger(__name__)


def error_response(status_code: int, message: str, headers=None) -> JSONResponse:
    # 前端统一读取 message 字段展示错误
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message},
        headers=headers,
    )


async def handle_http_exception(_request: Request, exc: HTTPException) -> JSONResponse:
    return error_response(exc.status_code, str(exc.detail), exc.headers)


async def handle_validation_error(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    first = exc.errors()[0]
    field = ".".join(str(part) for part in first["loc"] if part not in ("body", "query", "path"))
    message = f"{field}: {first['msg']}" if field else first["msg"]
    return error_response(422, message)


async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("未处理的异常：%s %s", request.method, request.url.path, exc_info=exc)
    return error_response(500, "服务器内部错误")


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(HTTPException, handle_http_exception)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(Exception, handle_unexpected_error)
