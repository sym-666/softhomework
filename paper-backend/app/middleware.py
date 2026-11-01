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
