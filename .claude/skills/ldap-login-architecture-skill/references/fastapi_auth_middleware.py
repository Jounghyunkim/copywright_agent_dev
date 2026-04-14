"""
FastAPI auth middleware template for Redis-backed session auth.

Usage:
1) Provide a Redis client with `get(key)` async method.
2) Register `AuthContextMiddleware` in FastAPI app.
3) Use `require_auth` dependency in protected routes.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


AUTH_COOKIE_NAME = "AUTH_COOKIE"
REDIS_KEY_FORMAT = "urn:{system_name}:{env}:session:{session_id}"


@dataclass
class AuthContext:
    user_id: str
    roles: list[str]
    session_id: str


class SessionStore:
    """Adapter interface. Inject your real Redis implementation."""

    async def get(self, key: str) -> Optional[str]:
        raise NotImplementedError


class AuthContextMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: Any,
        *,
        session_store: SessionStore,
        system_name: str,
        env: str,
        public_paths: Optional[set[str]] = None,
        emit_failure_reason_header: bool = False,
    ) -> None:
        super().__init__(app)
        self.session_store = session_store
        self.system_name = system_name
        self.env = env
        self.emit_failure_reason_header = emit_failure_reason_header
        self.public_paths = public_paths or {
            "/api/v1/auth/login",
            "/api/v1/auth/logout",
            "/api/v1/health",
            "/docs",
            "/openapi.json",
            "/health",
        }

    async def dispatch(self, request: Request, call_next):
        request.state.auth = None

        if request.url.path in self.public_paths:
            return await call_next(request)

        session_id = request.cookies.get(AUTH_COOKIE_NAME)
        if not session_id:
            return _unauthorized(
                "missing_auth_cookie",
                include_reason_header=self.emit_failure_reason_header,
            )

        key = REDIS_KEY_FORMAT.format(
            system_name=self.system_name,
            env=self.env,
            session_id=session_id,
        )

        raw = await self.session_store.get(key)
        if not raw:
            return _unauthorized(
                "invalid_or_expired_session",
                include_reason_header=self.emit_failure_reason_header,
            )

        try:
            data = json.loads(raw)
            user_id = data["user_id"]
            roles = data.get("roles", [])
        except Exception:
            return _unauthorized(
                "invalid_session_payload",
                include_reason_header=self.emit_failure_reason_header,
            )

        request.state.auth = AuthContext(
            user_id=user_id,
            roles=roles,
            session_id=session_id,
        )
        return await call_next(request)


def require_auth(request: Request) -> AuthContext:
    ctx = getattr(request.state, "auth", None)
    if not ctx:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="unauthorized",
        )
    return ctx


def require_role(required_role: str):
    def _dep(ctx: AuthContext = Depends(require_auth)) -> AuthContext:
        if required_role not in ctx.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="forbidden",
            )
        return ctx

    return _dep


def _unauthorized(reason: str, *, include_reason_header: bool = False):
    # Keep response body simple to avoid account/session probing signals.
    headers = {"X-Auth-Failure-Reason": reason} if include_reason_header else {}
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "unauthorized"},
        headers=headers,
    )
