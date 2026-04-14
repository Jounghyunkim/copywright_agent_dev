"""
Audit logging — append-only events to PostgreSQL.

Tables:
  - auth_login_events: login attempts (success/failure)
  - auth_session_events: session lifecycle (created/logout/expired)
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import text

from ..database import async_session


async def log_login_event(
    *,
    user_id: Optional[str],
    username_input: str,
    success: bool,
    failure_code: Optional[str] = None,
    source_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    department_snapshot: Optional[str] = None,
) -> None:
    """Record a login attempt."""
    async with async_session() as db:
        await db.execute(
            text("""
                INSERT INTO auth_login_events
                    (user_id, username_input, success, failure_code, source_ip, user_agent, department_snapshot)
                VALUES
                    (:user_id, :username_input, :success, :failure_code, :source_ip, :user_agent, :department_snapshot)
            """),
            {
                "user_id": user_id,
                "username_input": username_input,
                "success": success,
                "failure_code": failure_code,
                "source_ip": source_ip,
                "user_agent": user_agent,
                "department_snapshot": department_snapshot,
            },
        )
        await db.commit()


async def log_session_event(
    *,
    session_id: str,
    user_id: str,
    event_type: str,
    reason: Optional[str] = None,
    source_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """Record a session lifecycle event."""
    async with async_session() as db:
        await db.execute(
            text("""
                INSERT INTO auth_session_events
                    (session_id, user_id, event_type, reason, source_ip, user_agent)
                VALUES
                    (:session_id, :user_id, :event_type, :reason, :source_ip, :user_agent)
            """),
            {
                "session_id": session_id,
                "user_id": user_id,
                "event_type": event_type,
                "reason": reason,
                "source_ip": source_ip,
                "user_agent": user_agent,
            },
        )
        await db.commit()
