"""
Auth context middleware — Cookie → Redis session → request.state.auth

Based on skill reference: fastapi_auth_middleware.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

AUTH_COOKIE_NAME = "SESSION_ID"


@dataclass
class AuthContext:
    user_id: str
    display_name: str
    department: str
    email: str
    roles: list[str]
    session_id: str


class AuthContextMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: Any,
        *,
        session_store: Any,
        system_name: str,
        env: str,
        public_paths: Optional[set[str]] = None,
    ) -> None:
        super().__init__(app)
        self.session_store = session_store
        self.system_name = system_name
        self.env = env
        self.public_paths = public_paths or set()

    async def dispatch(self, request: Request, call_next):
        request.state.auth = None

        path = request.url.path

        # Public paths — no auth required
        if path in self.public_paths:
            return await call_next(request)

        # Static/docs
        if path in {"/docs", "/openapi.json", "/redoc"}:
            return await call_next(request)

        session_id = request.cookies.get(AUTH_COOKIE_NAME)
        if not session_id:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "unauthorized"},
            )

        key = f"urn:{self.system_name}:{self.env}:session:{session_id}"
        raw = await self.session_store.get(key)
        if not raw:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "unauthorized"},
            )

        try:
            data = json.loads(raw) if isinstance(raw, str) else json.loads(raw.decode("utf-8"))
            request.state.auth = AuthContext(
                user_id=data["user_id"],
                display_name=data.get("display_name", ""),
                department=data.get("department", ""),
                email=data.get("email", ""),
                roles=data.get("roles", []),
                session_id=session_id,
            )
        except Exception:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "unauthorized"},
            )

        return await call_next(request)


def require_auth(request: Request) -> AuthContext:
    """FastAPI dependency — raises 401 if no auth context."""
    ctx = getattr(request.state, "auth", None)
    if not ctx:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="unauthorized",
        )
    return ctx
