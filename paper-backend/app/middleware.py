from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send


class LowercaseApiPathMiddleware:
    """把 /api 路径转成小写。

    前端沿用 .NET 时代的路径，大小写混用（/Auth/login、/auth/validate），
    而 Starlette 路由区分大小写。接口路径里没有大小写敏感的参数，统一转小写是安全的。
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["path"].lower().startswith("/api/"):
            scope = dict(scope, path=scope["path"].lower())
            if scope.get("raw_path"):
                scope["raw_path"] = scope["raw_path"].lower()
        await self.app(scope, receive, send)


class UploadSizeLimitMiddleware:
    """在解析请求体之前拒绝过大的上传。

    FastAPI 先解析完整个 multipart 表单才会进入路由，所以在路由里判断大小时，
    超大文件已经写到临时目录了。这里根据 Content-Length 提前拒绝。
    """

    def __init__(self, app: ASGIApp, path: str, max_bytes: int) -> None:
        self.app = app
        self.path = path
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if self._is_upload(scope):
            length = self._content_length(scope)
            if length is None:
                await self._reject(scope, receive, send, 411, "缺少 Content-Length")
                return
            if length > self.max_bytes:
                await self._reject(scope, receive, send, 413, "上传内容过大")
                return
        await self.app(scope, receive, send)

    def _is_upload(self, scope: Scope) -> bool:
        return (
            scope["type"] == "http"
            and scope["method"] == "POST"
            and scope["path"].lower() == self.path
        )

    @staticmethod
    def _content_length(scope: Scope) -> int | None:
        for name, value in scope["headers"]:
            if name == b"content-length":
                return int(value) if value.isdigit() else None
        return None

    @staticmethod
    async def _reject(
        scope: Scope, receive: Receive, send: Send, status: int, message: str
    ) -> None:
        response = JSONResponse({"success": False, "message": message}, status_code=status)
        await response(scope, receive, send)
