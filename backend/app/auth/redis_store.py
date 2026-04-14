"""
Redis-backed session store for LDAP auth.

Key naming: urn:copywriting-agent:{env}:session:{session_id}
User session index: urn:copywriting-agent:{env}:user-sessions:{user_id}
"""

from __future__ import annotations

import json
import os
import uuid
from typing import Any, Optional

from redis.asyncio import Redis

SYSTEM_NAME = "copywriting-agent"

_redis: Optional[Redis] = None


def _env() -> str:
    return os.getenv("AUTH_ENV", "dev")


def _session_ttl() -> int:
    """Access session TTL in seconds."""
    return int(os.getenv("AUTH_SESSION_TTL_MINUTES", "30")) * 60


def _absolute_ttl() -> int:
    """Absolute session TTL in seconds."""
    return int(os.getenv("AUTH_SESSION_ABSOLUTE_TTL_HOURS", "12")) * 3600


def _session_key(session_id: str) -> str:
    return f"urn:{SYSTEM_NAME}:{_env()}:session:{session_id}"


def _user_sessions_key(user_id: str) -> str:
    return f"urn:{SYSTEM_NAME}:{_env()}:user-sessions:{user_id}"


async def get_redis() -> Redis:
    global _redis
    if _redis is None:
        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _redis = Redis.from_url(url, decode_responses=True)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None


async def create_session(
    user_id: str,
    *,
    display_name: str = "",
    department: str = "",
    email: str = "",
    roles: Optional[list[str]] = None,
    extra: Optional[dict[str, Any]] = None,
) -> str:
    """Create a new session in Redis. Returns session_id."""
    redis = await get_redis()
    session_id = uuid.uuid4().hex
    key = _session_key(session_id)

    payload = {
        "user_id": user_id,
        "display_name": display_name,
        "department": department,
        "email": email,
        "roles": roles or [],
        **(extra or {}),
    }

    await redis.set(key, json.dumps(payload, ensure_ascii=False), ex=_session_ttl())

    # User session index (for future session listing/revocation)
    user_key = _user_sessions_key(user_id)
    await redis.sadd(user_key, session_id)
    await redis.expire(user_key, _absolute_ttl())

    return session_id


async def get_session(session_id: str) -> Optional[dict[str, Any]]:
    """Retrieve session data from Redis. Returns None if expired/missing."""
    redis = await get_redis()
    raw = await redis.get(_session_key(session_id))
    if raw is None:
        return None
    return json.loads(raw)


async def delete_session(session_id: str, user_id: Optional[str] = None) -> None:
    """Delete a session from Redis."""
    redis = await get_redis()
    await redis.delete(_session_key(session_id))
    if user_id:
        user_key = _user_sessions_key(user_id)
        await redis.srem(user_key, session_id)


async def refresh_session(session_id: str) -> bool:
    """Extend session TTL (sliding window). Returns False if session doesn't exist."""
    redis = await get_redis()
    key = _session_key(session_id)
    exists = await redis.exists(key)
    if not exists:
        return False
    await redis.expire(key, _session_ttl())
    return True
