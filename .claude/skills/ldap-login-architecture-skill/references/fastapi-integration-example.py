"""
FastAPI integration example for LDAP auth context middleware.

This example shows:
- middleware registration
- public login/logout endpoints
- protected endpoint using auth context
- role-protected endpoint
"""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from fastapi import Depends, FastAPI, Request

from fastapi_auth_middleware import (
    AuthContext,
    AuthContextMiddleware,
    SessionStore,
    require_auth,
    require_role,
)


class RedisSessionStore(SessionStore):
    def __init__(self, redis_client: Any) -> None:
        self.redis = redis_client

    async def get(self, key: str):
        value = await self.redis.get(key)
        if value is None:
            return None
        if isinstance(value, bytes):
            return value.decode("utf-8")
        return str(value)


def create_app(redis_client: Any, *, system_name: str, env: str) -> FastAPI:
    app = FastAPI(title="Skill Mgmt Auth Example")

    app.add_middleware(
        AuthContextMiddleware,
        session_store=RedisSessionStore(redis_client),
        system_name=system_name,
        env=env,
        public_paths={
            "/api/v1/auth/login",
            "/api/v1/auth/logout",
            "/api/v1/health",
            "/docs",
            "/openapi.json",
        },
        emit_failure_reason_header=False,
    )

    @app.get("/api/v1/health")
    async def health():
        return {"ok": True}

    @app.post("/api/v1/auth/login")
    async def login():
        # Implement LDAP verification + session creation.
        return {"result": "login_not_implemented"}

    @app.post("/api/v1/auth/logout")
    async def logout():
        # Implement session invalidation + cookie clear.
        return {"result": "logout_not_implemented"}

    @app.get("/api/v1/auth/me")
    async def me(request: Request, ctx: AuthContext = Depends(require_auth)):
        # Enrich with display_name / department from Redis session
        session_data = None
        if ctx.session_id:
            store = RedisSessionStore(redis_client)
            key = f"urn:{system_name}:{env}:session:{ctx.session_id}"
            raw = await store.get(key)
            if raw:
                import json

                session_data = json.loads(raw)
        return {
            "user_id": ctx.user_id,
            "display_name": session_data.get("display_name") if session_data else None,
            "department": session_data.get("department") if session_data else None,
            "email": session_data.get("email") if session_data else None,
            "roles": ctx.roles,
            "session_id": ctx.session_id,
        }

    @app.get("/api/v1/skills")
    async def list_skills(ctx: AuthContext = Depends(require_auth)):
        # business logic can trust ctx.user_id / ctx.roles
        return {"items": [], "actor": ctx.user_id}

    @app.post("/api/v1/admin/reindex")
    async def admin_reindex(ctx: AuthContext = Depends(require_role("admin"))):
        return {"status": "queued", "actor": ctx.user_id}

    @app.get("/api/v1/debug/request-context")
    async def debug_context(request: Request, _: AuthContext = Depends(require_auth)):
        auth = request.state.auth
        return {"has_auth": auth is not None, "session_id": auth.session_id}

    return app
