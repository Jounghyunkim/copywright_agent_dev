"""
Admin user CRUD API + LDAP search.
All endpoints require admin role.
"""

from __future__ import annotations

import logging
import os
import ssl

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from ldap3 import Connection, Server, Tls, SUBTREE
from ldap3.core.exceptions import LDAPBindError, LDAPException, LDAPSocketOpenError

from ..database import async_session
from ..models import AdminUser
from .middleware import AuthContext, require_auth

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


# ── require_admin dependency ──

def require_admin(ctx: AuthContext = Depends(require_auth)) -> AuthContext:
    """Require authenticated user with 'admin' role."""
    if "admin" not in ctx.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="admin_required",
        )
    return ctx


# ── 1. List all admins ──

@router.get("", response_model=list[AdminUserResponse])
async def list_admins(ctx: AuthContext = Depends(require_admin)):
    async with async_session() as db:
        result = await db.execute(
            select(AdminUser).order_by(AdminUser.created_at.desc())
        )
        rows = result.scalars().all()
        return [
            AdminUserResponse(
                user_id=r.user_id,
                display_name=r.display_name,
                department=r.department,
                email=r.email,
                added_by=r.added_by,
                created_at=r.created_at.isoformat() if r.created_at else "",
            )
            for r in rows
        ]


# ── 2. Search LDAP (caller's own password) ──

@router.post("/search-ldap", response_model=list[LdapSearchResult])
async def search_ldap_users(
    body: LdapSearchRequest,
    ctx: AuthContext = Depends(require_admin),
):
    ldap_url = os.getenv("LDAP_URL", "ldaps://lgesaads03.lge.net")
    base_dn = os.getenv("LDAP_BASE_DN", "dc=lge,dc=net")
    upn_domain = os.getenv("LDAP_UPN_DOMAIN", "lge.com")
    connect_timeout = 5
    search_timeout = max(connect_timeout * 3, 15)

    tls = Tls(validate=ssl.CERT_NONE)
    server = Server(ldap_url, use_ssl=True, tls=tls, connect_timeout=connect_timeout)
    upn = f"{ctx.user_id}@{upn_domain}"

    try:
        conn = Connection(
            server,
            user=upn,
            password=body.password,
            auto_bind=True,
            read_only=True,
            receive_timeout=search_timeout,
        )
    except LDAPBindError:
        raise HTTPException(status_code=401, detail="invalid_ldap_password")
    except (LDAPSocketOpenError, LDAPException):
        raise HTTPException(status_code=503, detail="ldap_unavailable")

    # Escape special chars
    escaped = body.q.replace("\\", "\\5c").replace("*", "\\2a").replace("(", "\\28").replace(")", "\\29")
    search_filter = (
        f"(&(objectCategory=person)(objectClass=user)"
        f"(|(displayName=*{escaped}*)(sAMAccountName=*{escaped}*)))"
    )

    results: list[LdapSearchResult] = []
    try:
        conn.search(
            search_base=base_dn,
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=["sAMAccountName", "displayName", "mail", "department"],
            size_limit=20,
            time_limit=search_timeout,
        )

        # Get existing admin IDs
        async with async_session() as db:
            admin_result = await db.execute(select(AdminUser.user_id))
            admin_ids = {row[0] for row in admin_result.all()}

        for entry in conn.entries:
            sam = str(entry.sAMAccountName) if hasattr(entry, "sAMAccountName") else None
            if not sam:
                continue
            results.append(LdapSearchResult(
                user_id=sam,
                display_name=str(entry.displayName) if hasattr(entry, "displayName") else sam,
                department=str(entry.department) if hasattr(entry, "department") else None,
                email=str(entry.mail) if hasattr(entry, "mail") else None,
                is_admin=sam in admin_ids,
            ))
    except LDAPException:
        logger.warning("[LDAP-SEARCH] search failed", exc_info=True)
    finally:
        try:
            conn.unbind()
        except Exception:
            pass

    return results


# ── 3. Add admin ──

@router.post("", response_model=AdminUserResponse, status_code=201)
async def add_admin(
    body: AddAdminRequest,
    ctx: AuthContext = Depends(require_admin),
):
    async with async_session() as db:
        existing = await db.execute(
            select(AdminUser).where(AdminUser.user_id == body.user_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="user_already_admin")

        admin_user = AdminUser(
            user_id=body.user_id,
            display_name=body.display_name or body.user_id,
            department=body.department,
            email=body.email,
            added_by=ctx.user_id,
        )
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)

        return AdminUserResponse(
            user_id=admin_user.user_id,
            display_name=admin_user.display_name,
            department=admin_user.department,
            email=admin_user.email,
            added_by=admin_user.added_by,
            created_at=admin_user.created_at.isoformat() if admin_user.created_at else "",
        )


# ── 4. Remove admin ──

@router.delete("/{user_id}", status_code=204)
async def remove_admin(
    user_id: str,
    ctx: AuthContext = Depends(require_admin),
):
    async with async_session() as db:
        result = await db.execute(
            select(AdminUser).where(AdminUser.user_id == user_id)
        )
        target = result.scalar_one_or_none()
        if not target:
            raise HTTPException(status_code=404, detail="admin_not_found")

        # Prevent removing last admin
        count_result = await db.execute(sa_func.count(AdminUser.id))
        total = count_result.scalar() or 0
        if total <= 1:
            raise HTTPException(status_code=409, detail="cannot_remove_last_admin")

        await db.delete(target)
        await db.commit()
