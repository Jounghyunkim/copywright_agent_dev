"""
Reference: User search alternatives for projects WITHOUT LDAP.

Choose one based on your project's data sources.
All return the same UserInfo structure for compatibility with the admin CRUD API.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import or_
from sqlalchemy.orm import Session


@dataclass
class UserInfo:
    user_id: str
    display_name: str
    email: str | None
    department: str | None


# ══════════════════════════════════════════════════════════════
# Option A: Search from a users table (most common)
# ══════════════════════════════════════════════════════════════
#
# Use when: Project has a `users` table with registered users.
# Prerequisite: A User model with username/display_name/email/department.

def search_users_from_db(query: str, db: Session) -> list[UserInfo]:
    """Search registered users by name or username."""
    # from your_app.infra.db.models.user import User

    pattern = f"%{query}%"
    rows = (
        db.query(User)
        .filter(
            or_(
                User.display_name.ilike(pattern),
                User.username.ilike(pattern),
                User.email.ilike(pattern),
            )
        )
        .limit(20)
        .all()
    )
    return [
        UserInfo(
            user_id=r.username,  # or r.id, r.email — whatever your login uses
            display_name=r.display_name or r.username,
            email=r.email,
            department=getattr(r, "department", None),
        )
        for r in rows
    ]


# ══════════════════════════════════════════════════════════════
# Option B: Search from login history (no user table needed)
# ══════════════════════════════════════════════════════════════
#
# Use when: Project has auth_login_events but no user table.
# Only users who logged in at least once are searchable.
# Limitation: display_name may not be available (shows user_id instead).

def search_users_from_login_history(query: str, db: Session) -> list[UserInfo]:
    """Search users who have previously logged in."""
    from sqlalchemy import func
    # from your_app.infra.db.models.auth import AuthLoginEvent

    pattern = f"%{query}%"
    rows = (
        db.query(
            AuthLoginEvent.user_id,
            func.max(AuthLoginEvent.department_snapshot).label("department"),
        )
        .filter(
            AuthLoginEvent.success.is_(True),
            AuthLoginEvent.user_id.isnot(None),
            AuthLoginEvent.user_id.ilike(pattern),
        )
        .group_by(AuthLoginEvent.user_id)
        .limit(20)
        .all()
    )
    return [
        UserInfo(
            user_id=r.user_id,
            display_name=r.user_id,  # login history doesn't have display_name
            email=None,
            department=r.department,
        )
        for r in rows
    ]


# ══════════════════════════════════════════════════════════════
# Option C: Search from external API (OAuth provider, HR system, etc.)
# ══════════════════════════════════════════════════════════════
#
# Use when: User directory is in an external system accessible via API.

def search_users_from_api(query: str) -> list[UserInfo]:
    """Search users via external HR/directory API."""
    import httpx

    # Replace with your actual API
    response = httpx.get(
        "https://hr-api.company.com/users/search",
        params={"q": query, "limit": 20},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    return [
        UserInfo(
            user_id=u["employee_id"],  # or u["username"], u["email"]
            display_name=u.get("name", u["employee_id"]),
            email=u.get("email"),
            department=u.get("department"),
        )
        for u in data.get("results", [])
    ]


# ══════════════════════════════════════════════════════════════
# Integration: Replace LDAP search in admin_users router
# ══════════════════════════════════════════════════════════════
#
# In admin-crud-api.py, change the search endpoint:
#
# BEFORE (LDAP):
#   ldap_results = search_users(query=body.q, bind_user_id=auth.user_id, ...)
#
# AFTER (DB search — no password needed):
#   @router.get("/search", response_model=list[SearchResult])  # GET instead of POST
#   def search_users_endpoint(q: str = Query(..., min_length=2), db=Depends(get_db)):
#       results = search_users_from_db(q, db)
#       ...
#
# NOTE: DB/API search doesn't need a password, so:
#   - Change POST /search-ldap → GET /search?q=...
#   - Remove password from request schema
#   - Remove password gate from frontend (search immediately on type)
