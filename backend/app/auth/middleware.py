"""
Auth context middleware — Cookie → Redis session → request.state.auth

Based on skill reference: fastapi_auth_middleware.py
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import date
from typing import Any, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

AUTH_COOKIE_NAME = "SESSION_ID"

# Redis dedup key format: urn:{system_name}:{env}:dau:{YYYY-MM-DD}:{user_id}
_DAU_KEY_FMT = "urn:{system_name}:{env}:dau:{day}:{user_id}"
_DAU_TTL_SECONDS = 93600  # 26h — covers timezone edge cases


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

        # Fire-and-forget DAU recording — never blocks or fails the request
        await self._record_daily_access(
            user_id=data["user_id"],
            session_id=session_id,
            request=request,
        )

        return await call_next(request)

    async def _record_daily_access(
        self, *, user_id: str, session_id: str, request: Request
    ) -> None:
        """Write one 'accessed' event per user per day to PostgreSQL.

        Uses a Redis SET NX key as dedup flag (26h TTL) so we only hit DB
        once per user per day. Fire-and-forget: never blocks the request,
        never raises.
        """
        try:
            # Lazy imports to avoid circular deps at module load
            from .redis_store import get_redis
            from ..database import async_session

            dedup_key = _DAU_KEY_FMT.format(
                system_name=self.system_name,
                env=self.env,
                day=date.today().isoformat(),
                user_id=user_id,
            )
            redis = await get_redis()
            was_set = await redis.set(dedup_key, "1", nx=True, ex=_DAU_TTL_SECONDS)
            if not was_set:
                return  # already recorded today

            # First access today — persist to PostgreSQL
            source_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            if not source_ip and request.client:
                source_ip = request.client.host
            user_agent = request.headers.get("User-Agent")

            async with async_session() as db:
                await db.execute(
                    text("""
                        INSERT INTO auth_session_events
                            (session_id, user_id, event_type, source_ip, user_agent)
                        VALUES
                            (:session_id, :user_id, 'accessed', :source_ip, :user_agent)
                    """),
                    {
                        "session_id": session_id,
                        "user_id": user_id,
                        "source_ip": source_ip or None,
                        "user_agent": user_agent,
                    },
                )
                await db.commit()
        except Exception:  # noqa: BLE001 — never block request on audit failure
            logger.debug("daily access recording failed", exc_info=True)


def require_auth(request: Request) -> AuthContext:
    """FastAPI dependency — raises 401 if no auth context."""
    ctx = getattr(request.state, "auth", None)
    if not ctx:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="unauthorized",
        )
    return ctx
