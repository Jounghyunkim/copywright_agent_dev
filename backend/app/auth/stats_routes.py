"""
Usage statistics API — admin-only aggregations over auth audit tables.

Endpoints (all require admin role):
  GET /admin/stats/summary           DAU today, MAU this month, totals, success rate
  GET /admin/stats/dau?days=30       Daily active users trend (zero-filled)
  GET /admin/stats/mau?months=12     Monthly active users trend
  GET /admin/stats/users?days=30     Per-user breakdown
  GET /admin/stats/departments?days=30  Per-department breakdown

Reads from `auth_login_events` and `auth_session_events`.
DAU/MAU use session events (event_type IN ('accessed','created')).
Login count / success rate / department_snapshot come from login events.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text

from ..database import async_session
from .admin_routes import require_admin
from .middleware import AuthContext

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
    display_name: str | None
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

@router.get("/summary", response_model=StatsSummary)
async def get_summary(_ctx: AuthContext = Depends(require_admin)):
    today = date.today()
    month_start = today.replace(day=1)

    async with async_session() as db:
        dau_today = (await db.execute(
            text("""
                SELECT COUNT(DISTINCT user_id)
                FROM auth_session_events
                WHERE event_type IN ('accessed', 'created')
                  AND DATE(occurred_at) = :today
            """),
            {"today": today},
        )).scalar() or 0

        mau_this_month = (await db.execute(
            text("""
                SELECT COUNT(DISTINCT user_id)
                FROM auth_session_events
                WHERE event_type IN ('accessed', 'created')
                  AND occurred_at >= :month_start
            """),
            {"month_start": month_start},
        )).scalar() or 0

        total_unique = (await db.execute(
            text("""
                SELECT COUNT(DISTINCT user_id)
                FROM auth_login_events
                WHERE success = TRUE
            """),
        )).scalar() or 0

        total_logins = (await db.execute(
            text("""
                SELECT COUNT(*)
                FROM auth_login_events
                WHERE success = TRUE
            """),
        )).scalar() or 0

        total_attempts = (await db.execute(
            text("SELECT COUNT(*) FROM auth_login_events"),
        )).scalar() or 0

    success_rate = (total_logins / total_attempts * 100) if total_attempts > 0 else 0.0
    return StatsSummary(
        dau_today=dau_today,
        mau_this_month=mau_this_month,
        total_unique_users=total_unique,
        total_logins=total_logins,
        login_success_rate=round(success_rate, 1),
    )


# ── 2. DAU Trend (zero-filled) ──

@router.get("/dau", response_model=list[DauEntry])
async def get_dau(
    days: int = Query(30, ge=1, le=365),
    _ctx: AuthContext = Depends(require_admin),
):
    since = date.today() - timedelta(days=days - 1)

    async with async_session() as db:
        rows = (await db.execute(
            text("""
                SELECT DATE(occurred_at) AS day,
                       COUNT(DISTINCT user_id) AS cnt
                FROM auth_session_events
                WHERE event_type IN ('accessed', 'created')
                  AND DATE(occurred_at) >= :since
                GROUP BY DATE(occurred_at)
                ORDER BY DATE(occurred_at)
            """),
            {"since": since},
        )).all()

    result_map = {row.day.isoformat() if isinstance(row.day, date) else str(row.day): row.cnt for row in rows}

    result: list[DauEntry] = []
    for i in range(days):
        d = since + timedelta(days=i)
        ds = d.isoformat()
        result.append(DauEntry(date=ds, count=result_map.get(ds, 0)))
    return result


# ── 3. MAU Trend ──
# GROUP BY must use the same date_trunc() expression as SELECT,
# NOT the to_char() wrapper — or PostgreSQL raises
# "column must appear in the GROUP BY clause".

@router.get("/mau", response_model=list[MauEntry])
async def get_mau(
    months: int = Query(12, ge=1, le=36),
    _ctx: AuthContext = Depends(require_admin),
):
    async with async_session() as db:
        rows = (await db.execute(
            text("""
                SELECT TO_CHAR(DATE_TRUNC('month', occurred_at), 'YYYY-MM') AS month,
                       COUNT(DISTINCT user_id) AS cnt
                FROM auth_session_events
                WHERE event_type IN ('accessed', 'created')
                GROUP BY DATE_TRUNC('month', occurred_at)
                ORDER BY DATE_TRUNC('month', occurred_at)
            """),
        )).all()

    result_map = {row.month: row.cnt for row in rows}

    # Build the last `months` month labels ending with current month
    today = date.today().replace(day=1)
    seen: list[str] = []
    cursor = today
    for _ in range(months):
        seen.append(cursor.strftime("%Y-%m"))
        # step back one month
        if cursor.month == 1:
            cursor = cursor.replace(year=cursor.year - 1, month=12)
        else:
            cursor = cursor.replace(month=cursor.month - 1)
    seen.reverse()

    return [MauEntry(month=m, count=result_map.get(m, 0)) for m in seen]


# ── 4. Per-User Stats ──

@router.get("/users", response_model=list[UserStatsEntry])
async def get_user_stats(
    days: int = Query(30, ge=1, le=365),
    _ctx: AuthContext = Depends(require_admin),
):
    since = date.today() - timedelta(days=days)

    async with async_session() as db:
        login_rows = (await db.execute(
            text("""
                SELECT user_id,
                       MAX(department_snapshot) AS department,
                       COUNT(*) AS login_count,
                       MAX(occurred_at) AS last_login
                FROM auth_login_events
                WHERE success = TRUE
                  AND occurred_at >= :since
                  AND user_id IS NOT NULL
                GROUP BY user_id
            """),
            {"since": since},
        )).all()

        session_rows = (await db.execute(
            text("""
                SELECT user_id,
                       COUNT(DISTINCT DATE(occurred_at)) AS active_days
                FROM auth_session_events
                WHERE event_type IN ('accessed', 'created')
                  AND occurred_at >= :since
                GROUP BY user_id
            """),
            {"since": since},
        )).all()

    active_days_map = {row.user_id: row.active_days for row in session_rows}

    result: list[UserStatsEntry] = []
    for row in login_rows:
        last_login = row.last_login
        if isinstance(last_login, datetime):
            last_login_iso = last_login.isoformat()
        else:
            last_login_iso = str(last_login) if last_login else None
        result.append(UserStatsEntry(
            user_id=row.user_id,
            display_name=None,  # not stored in login events — frontend can fall back to user_id
            department=row.department,
            login_count=row.login_count,
            active_days=active_days_map.get(row.user_id, 0),
            last_login=last_login_iso,
        ))

    result.sort(key=lambda x: x.active_days, reverse=True)
    return result


# ── 5. Per-Department Stats ──

@router.get("/departments", response_model=list[DepartmentStatsEntry])
async def get_department_stats(
    days: int = Query(30, ge=1, le=365),
    _ctx: AuthContext = Depends(require_admin),
):
    since = date.today() - timedelta(days=days)

    async with async_session() as db:
        # unique_users + login_count per department (from login events)
        dept_login_rows = (await db.execute(
            text("""
                SELECT department_snapshot AS department,
                       COUNT(DISTINCT user_id) AS unique_users,
                       COUNT(*) AS login_count
                FROM auth_login_events
                WHERE success = TRUE
                  AND occurred_at >= :since
                  AND department_snapshot IS NOT NULL
                  AND department_snapshot <> ''
                GROUP BY department_snapshot
            """),
            {"since": since},
        )).all()

        # avg active_days per department — join session-event active_days with latest department
        dept_active_rows = (await db.execute(
            text("""
                WITH user_active AS (
                    SELECT user_id,
                           COUNT(DISTINCT DATE(occurred_at)) AS active_days
                    FROM auth_session_events
                    WHERE event_type IN ('accessed', 'created')
                      AND occurred_at >= :since
                    GROUP BY user_id
                ),
                user_dept AS (
                    SELECT user_id,
                           MAX(department_snapshot) AS department
                    FROM auth_login_events
                    WHERE success = TRUE
                      AND department_snapshot IS NOT NULL
                      AND department_snapshot <> ''
                    GROUP BY user_id
                )
                SELECT ud.department,
                       AVG(ua.active_days) AS avg_days
                FROM user_dept ud
                JOIN user_active ua ON ua.user_id = ud.user_id
                GROUP BY ud.department
            """),
            {"since": since},
        )).all()

    avg_map = {row.department: float(row.avg_days) for row in dept_active_rows}

    result: list[DepartmentStatsEntry] = []
    for row in dept_login_rows:
        result.append(DepartmentStatsEntry(
            department=row.department,
            unique_users=row.unique_users,
            login_count=row.login_count,
            active_days_avg=round(avg_map.get(row.department, 0.0), 1),
        ))

    result.sort(key=lambda x: x.unique_users, reverse=True)
    return result
