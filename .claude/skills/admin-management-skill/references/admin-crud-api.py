"""
Reference: Admin user CRUD API endpoints for FastAPI.

4 endpoints under /admin/users prefix, all admin-only.
Adapt model/auth imports to your project.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session

# from your_app.api.deps import get_db, require_admin
# from your_app.infra.db.models.admin import AdminUser
# from your_app.security.ldap_auth import LdapBindFailure, LdapServerUnavailable, search_users
# from your_app.security.rbac import AuthContext

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/users", tags=["admin-users"])


# ── Schemas ──

class AdminUserResponse(BaseModel):
    user_id: str
    display_name: str
    department: str | None
    email: str | None
    added_by: str
    created_at: str


class LdapSearchRequest(BaseModel):
    q: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=1, max_length=200)


class LdapSearchResult(BaseModel):
    user_id: str
    display_name: str
    department: str | None
    email: str | None
    is_admin: bool


class AddAdminRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=128)
    display_name: str | None = None
    department: str | None = None
    email: str | None = None


# ── 1. List all admins ──

# @router.get("", response_model=list[AdminUserResponse])
def list_admins(db: Session, auth):
    rows = db.query(AdminUser).order_by(AdminUser.created_at.desc()).all()
    return [
        AdminUserResponse(
            user_id=r.user_id,
            display_name=r.display_name,
            department=r.department,
            email=r.email,
            added_by=r.added_by,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]


# ── 2. Search LDAP (uses caller's own password) ──

# @router.post("/search-ldap", response_model=list[LdapSearchResult])
def search_ldap_users(body: LdapSearchRequest, db: Session, auth):
    try:
        ldap_results = search_users(
            query=body.q,
            bind_user_id=auth.user_id,  # caller's own AD ID
            bind_password=body.password,  # caller's own password from frontend prompt
            size_limit=20,
        )
    except LdapBindFailure:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_ldap_password")
    except LdapServerUnavailable:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="ldap_unavailable")

    # Cross-reference with existing admins
    admin_ids = {r.user_id for r in db.query(AdminUser.user_id).all()}

    return [
        LdapSearchResult(
            user_id=u.user_id,
            display_name=u.display_name,
            department=u.department,
            email=u.email,
            is_admin=u.user_id in admin_ids,
        )
        for u in ldap_results
    ]


# ── 3. Add admin ──

# @router.post("", response_model=AdminUserResponse, status_code=201)
def add_admin(body: AddAdminRequest, db: Session, auth):
    existing = db.query(AdminUser).filter(AdminUser.user_id == body.user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="user_already_admin")

    admin_user = AdminUser(
        user_id=body.user_id,
        display_name=body.display_name or body.user_id,
        department=body.department,
        email=body.email,
        added_by=auth.user_id,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    return AdminUserResponse(
        user_id=admin_user.user_id,
        display_name=admin_user.display_name,
        department=admin_user.department,
        email=admin_user.email,
        added_by=admin_user.added_by,
        created_at=admin_user.created_at.isoformat(),
    )


# ── 4. Remove admin ──

# @router.delete("/{user_id}", status_code=204)
def remove_admin(user_id: str, db: Session, auth):
    target = db.query(AdminUser).filter(AdminUser.user_id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="admin_not_found")

    # *** CRITICAL: Prevent removing last admin ***
    total = db.query(sa_func.count(AdminUser.id)).scalar() or 0
    if total <= 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="cannot_remove_last_admin")

    db.delete(target)
    db.commit()


# ── Bootstrap seeding (add to main.py startup) ──
#
# if settings.initial_admin_user_ids:
#     with SessionLocal() as db:
#         admin_count = db.query(sa_func.count(AdminUser.id)).scalar() or 0
#         if admin_count == 0:
#             for uid in settings.initial_admin_user_ids.split(","):
#                 uid = uid.strip()
#                 if uid:
#                     db.add(AdminUser(
#                         user_id=uid,
#                         display_name=uid,  # placeholder; updated on first login
#                         added_by="system_bootstrap",
#                     ))
#             db.commit()
#
# ── Login flow addition (add to login handler) ──
#
# admin_record = db.query(AdminUser).filter(AdminUser.user_id == user_info.user_id).first()
# if admin_record:
#     roles.append("admin")
#     # Refresh profile from auth provider (LDAP, OAuth, etc.)
#     admin_record.display_name = user_info.display_name
#     admin_record.department = user_info.department
#     admin_record.email = user_info.email
#     db.commit()
