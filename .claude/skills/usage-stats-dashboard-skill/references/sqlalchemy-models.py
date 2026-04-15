"""
Reference: SQLAlchemy ORM models for auth audit tables.

These models map to the DDL in audit-tables-ddl.sql.
Adapt Base import and column types to your project.
"""

from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

# from your_app.infra.db.models.base import Base


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class AuthLoginEvent:
    """Append-only login attempt log. One row per login attempt (success or failure)."""

    __tablename__ = "auth_login_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )
    request_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    username_input: Mapped[str] = mapped_column(Text, nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    failure_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_ip: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    department_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)


class AuthSessionEvent:
    """Append-only session lifecycle log. Includes 'accessed' for daily active tracking."""

    __tablename__ = "auth_session_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )
    session_id: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[str] = mapped_column(Text, nullable=False)
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # Valid event_type values: 'created', 'accessed', 'refreshed', 'revoked', 'expired', 'logout'
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_ip: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)


# ── Column Usage by Endpoint ──
#
# auth_login_events:
#   - summary:     success, user_id (total logins, unique users, success rate)
#   - users:       user_id, department_snapshot, occurred_at (login count, last login, department)
#   - departments: department_snapshot, user_id, success (unique users, login count per dept)
#
# auth_session_events:
#   - summary:     user_id, event_type, occurred_at (DAU today, MAU this month)
#   - dau:         user_id, event_type, occurred_at (daily distinct users)
#   - mau:         user_id, event_type, occurred_at (monthly distinct users)
#   - users:       user_id, event_type, occurred_at (active days per user)
#   - departments: user_id, event_type, occurred_at (active days for avg calculation)
