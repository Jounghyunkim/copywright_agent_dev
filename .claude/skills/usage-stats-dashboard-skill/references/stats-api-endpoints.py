"""
Reference: Stats API endpoint implementation for FastAPI + SQLAlchemy.

5 endpoints under /admin/stats prefix, all admin-only.
Copy and adapt table/model imports to your project.
"""

from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

# from your_app.api.deps import get_db, require_admin
# from your_app.infra.db.models.auth import AuthLoginEvent, AuthSessionEvent
# from your_app.security.rbac import AuthContext

router = APIRouter(prefix="/admin/stats", tags=["admin-stats"])


# ── Response Schemas ──

class StatsSummary(BaseModel):
    dau_today: int
    mau_this_month: int
    total_unique_users: int
    total_logins: int
    login_success_rate: float  # percentage, e.g. 97.5


class DauEntry(BaseModel):
    date: str   # YYYY-MM-DD
    count: int


class MauEntry(BaseModel):
    month: str  # YYYY-MM
    count: int


class UserStatsEntry(BaseModel):
    user_id: str
    department: str | None
    login_count: int
    active_days: int
    last_login: str | None  # ISO datetime


class DepartmentStatsEntry(BaseModel):
    department: str
    unique_users: int
    login_count: int
    active_days_avg: float


# ── 1. Summary ──

# @router.get("/summary", response_model=StatsSummary)
def get_summary(db: Session):
    today = date.today()
    month_start = today.replace(day=1)

    # DAU today
    dau_today = (
        db.query(func.count(func.distinct(AuthSessionEvent.user_id)))
        .filter(
            AuthSessionEvent.event_type.in_(["accessed", "created"]),
            func.date(AuthSessionEvent.occurred_at) == today,
        )
        .scalar()
    ) or 0

    # MAU this month
    mau_this_month = (
        db.query(func.count(func.distinct(AuthSessionEvent.user_id)))
        .filter(
            AuthSessionEvent.event_type.in_(["accessed", "created"]),
            AuthSessionEvent.occurred_at >= month_start,
        )
        .scalar()
    ) or 0

    # Total unique users (all time, successful logins)
    total_unique = (
        db.query(func.count(func.distinct(AuthLoginEvent.user_id)))
        .filter(AuthLoginEvent.success.is_(True))
        .scalar()
    ) or 0

    # Total logins + success rate
    total_logins = (
        db.query(func.count(AuthLoginEvent.id))
        .filter(AuthLoginEvent.success.is_(True))
        .scalar()
    ) or 0
    total_attempts = db.query(func.count(AuthLoginEvent.id)).scalar() or 0
    success_rate = (total_logins / total_attempts * 100) if total_attempts > 0 else 0.0

    return StatsSummary(
        dau_today=dau_today,
        mau_this_month=mau_this_month,
        total_unique_users=total_unique,
        total_logins=total_logins,
        login_success_rate=round(success_rate, 1),
    )


# ── 2. DAU Trend ──

# @router.get("/dau", response_model=list[DauEntry])
def get_dau(days: int, db: Session):
    since = date.today() - timedelta(days=days - 1)

    rows = (
        db.query(
            func.date(AuthSessionEvent.occurred_at).label("day"),
            func.count(func.distinct(AuthSessionEvent.user_id)).label("cnt"),
        )
        .filter(
            AuthSessionEvent.event_type.in_(["accessed", "created"]),
            func.date(AuthSessionEvent.occurred_at) >= since,
        )
        .group_by(func.date(AuthSessionEvent.occurred_at))
        .order_by(func.date(AuthSessionEvent.occurred_at))
        .all()
    )

    # *** CRITICAL: Zero-fill missing dates ***
    result_map = {str(row.day): row.cnt for row in rows}
    result = []
    for i in range(days):
        d = since + timedelta(days=i)
        ds = d.isoformat()
        result.append(DauEntry(date=ds, count=result_map.get(ds, 0)))

    return result


# ── 3. MAU Trend ──
# *** CRITICAL: GROUP BY must use the same date_trunc() expression, NOT to_char() ***

# @router.get("/mau", response_model=list[MauEntry])
def get_mau(months: int, db: Session):
    # Label the expression so GROUP BY and ORDER BY reference the same thing
    month_trunc = func.date_trunc("month", AuthSessionEvent.occurred_at).label("m")

    rows = (
        db.query(
            func.to_char(month_trunc, "YYYY-MM").label("month"),
            func.count(func.distinct(AuthSessionEvent.user_id)).label("cnt"),
        )
        .filter(
            AuthSessionEvent.event_type.in_(["accessed", "created"]),
        )
        .group_by(month_trunc)       # <-- use the label, NOT to_char()
        .order_by(month_trunc)        # <-- same here
        .all()
    )

    result_map = {row.month: row.cnt for row in rows}

    # Generate month list (approximate with timedelta, deduplicate)
    today = date.today()
    result = []
    seen = set()
    for i in range(months - 1, -1, -1):
        d = today.replace(day=1) - timedelta(days=i * 30)
        ms = d.replace(day=1).strftime("%Y-%m")
        if ms not in seen:
            seen.add(ms)
            result.append(MauEntry(month=ms, count=result_map.get(ms, 0)))

    return result


# ── 4. Per-User Stats ──

# @router.get("/users", response_model=list[UserStatsEntry])
def get_user_stats(days: int, db: Session):
    since = date.today() - timedelta(days=days)

    # Source 1: login_events → login_count, last_login, department
    login_stats = (
        db.query(
            AuthLoginEvent.user_id,
            func.max(AuthLoginEvent.department_snapshot).label("department"),
            func.count(AuthLoginEvent.id).label("login_count"),
            func.max(AuthLoginEvent.occurred_at).label("last_login"),
        )
        .filter(
            AuthLoginEvent.success.is_(True),
            AuthLoginEvent.occurred_at >= since,
            AuthLoginEvent.user_id.isnot(None),
        )
        .group_by(AuthLoginEvent.user_id)
        .all()
    )

    # Source 2: session_events → active_days
    active_rows = (
        db.query(
            AuthSessionEvent.user_id,
            func.count(func.distinct(func.date(AuthSessionEvent.occurred_at))).label("active_days"),
        )
        .filter(
            AuthSessionEvent.event_type.in_(["accessed", "created"]),
            AuthSessionEvent.occurred_at >= since,
        )
        .group_by(AuthSessionEvent.user_id)
        .all()
    )
    active_days_map = {row.user_id: row.active_days for row in active_rows}

    # Merge in Python
    result = []
    for row in login_stats:
        result.append(UserStatsEntry(
            user_id=row.user_id,
            department=row.department,
            login_count=row.login_count,
            active_days=active_days_map.get(row.user_id, 0),
            last_login=row.last_login.isoformat() if row.last_login else None,
        ))

    result.sort(key=lambda x: x.active_days, reverse=True)
    return result


# ── 5. Per-Department Stats ──

# @router.get("/departments", response_model=list[DepartmentStatsEntry])
def get_department_stats(days: int, db: Session):
    since = date.today() - timedelta(days=days)

    # Direct aggregation: unique_users + login_count per department
    dept_login = (
        db.query(
            AuthLoginEvent.department_snapshot.label("department"),
            func.count(func.distinct(AuthLoginEvent.user_id)).label("unique_users"),
            func.count(AuthLoginEvent.id).label("login_count"),
        )
        .filter(
            AuthLoginEvent.success.is_(True),
            AuthLoginEvent.occurred_at >= since,
            AuthLoginEvent.department_snapshot.isnot(None),
            AuthLoginEvent.department_snapshot != "",
        )
        .group_by(AuthLoginEvent.department_snapshot)
        .all()
    )

    # Subquery 1: user → active_days
    active_days_subq = (
        db.query(
            AuthSessionEvent.user_id,
            func.count(func.distinct(func.date(AuthSessionEvent.occurred_at))).label("active_days"),
        )
        .filter(
            AuthSessionEvent.event_type.in_(["accessed", "created"]),
            AuthSessionEvent.occurred_at >= since,
        )
        .group_by(AuthSessionEvent.user_id)
        .subquery()
    )

    # Subquery 2: user → department
    user_dept = (
        db.query(
            AuthLoginEvent.user_id,
            func.max(AuthLoginEvent.department_snapshot).label("department"),
        )
        .filter(
            AuthLoginEvent.success.is_(True),
            AuthLoginEvent.department_snapshot.isnot(None),
        )
        .group_by(AuthLoginEvent.user_id)
        .subquery()
    )

    # Join and compute avg
    dept_active = (
        db.query(
            user_dept.c.department,
            func.avg(active_days_subq.c.active_days).label("avg_days"),
        )
        .join(active_days_subq, active_days_subq.c.user_id == user_dept.c.user_id)
        .group_by(user_dept.c.department)
        .all()
    )
    avg_map = {row.department: float(row.avg_days) for row in dept_active}

    result = []
    for row in dept_login:
        result.append(DepartmentStatsEntry(
            department=row.department,
            unique_users=row.unique_users,
            login_count=row.login_count,
            active_days_avg=round(avg_map.get(row.department, 0), 1),
        ))

    result.sort(key=lambda x: x.unique_users, reverse=True)
    return result
