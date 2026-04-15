"""
Auth API routes: /auth/login, /auth/logout, /auth/me
"""

from __future__ import annotations

import os
from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from .ldap_service import LdapAuthError, authenticate
from .middleware import AUTH_COOKIE_NAME, AuthContext, require_auth
from .redis_store import create_session, delete_session, get_session

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    status: str
    user_id: str
    display_name: str
    department: str


class MeResponse(BaseModel):
    user_id: str
    display_name: str
    department: str
    email: str
    roles: list[str]
    session_id: str


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, request: Request, response: Response):
    """LDAP bind → Redis session → set cookie."""
    # 1. LDAP authentication
    try:
        user_info = authenticate(body.username, body.password)
    except LdapAuthError as e:
        if e.code == "ldap_unreachable":
            raise HTTPException(status_code=503, detail=e.message)
        raise HTTPException(status_code=401, detail=e.message)

    # 2. Admin role check + profile refresh
    roles: list[str] = []
    try:
        from ..models import AdminUser
        from ..database import async_session
        from sqlalchemy import select
        async with async_session() as db:
            result = await db.execute(
                select(AdminUser).where(AdminUser.user_id == user_info.user_id)
            )
            admin_record = result.scalar_one_or_none()
            if admin_record:
                roles.append("admin")
                # Refresh profile from LDAP on every login
                admin_record.display_name = user_info.display_name
                admin_record.department = user_info.department
                admin_record.email = user_info.email
                await db.commit()
    except Exception as e:
        print(f"[auth] Admin role check failed (non-blocking): {e}")

    # 3. Create Redis session
    try:
        session_id = await create_session(
            user_id=user_info.user_id,
            display_name=user_info.display_name,
            department=user_info.department,
            email=user_info.email,
            roles=roles,
        )
    except Exception as e:
        print(f"[auth] Redis session creation failed: {e}")
        raise HTTPException(status_code=503, detail="Session store unavailable.")

    # 3. Log login event (async, best-effort)
    try:
        from .audit import log_login_event
        await log_login_event(
            user_id=user_info.user_id,
            username_input=body.username,
            success=True,
            source_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            department_snapshot=user_info.department,
        )
    except Exception as e:
        print(f"[auth] Audit log failed (non-blocking): {e}")

    # 4. Set session cookie
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=False,  # MVP: raw IP over HTTP
        path="/",
        max_age=int(os.getenv("AUTH_SESSION_ABSOLUTE_TTL_HOURS", "12")) * 3600,
    )

    return LoginResponse(
        status="success",
        user_id=user_info.user_id,
        display_name=user_info.display_name,
        department=user_info.department,
    )


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Clear session from Redis + remove cookie."""
    session_id = request.cookies.get(AUTH_COOKIE_NAME)
    if session_id:
        # Get user_id for audit
        session_data = await get_session(session_id)
        user_id = session_data.get("user_id") if session_data else None
        await delete_session(session_id, user_id)

        # Log session event
        try:
            from .audit import log_session_event
            await log_session_event(
                session_id=session_id,
                user_id=user_id or "unknown",
                event_type="logout",
                source_ip=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
        except Exception as e:
            print(f"[auth] Audit log failed (non-blocking): {e}")

    response.delete_cookie(AUTH_COOKIE_NAME, path="/")
    return {"status": "logged_out"}


@router.get("/me", response_model=MeResponse)
async def me(ctx: AuthContext = Depends(require_auth)):
    """Return current user info from session."""
    return MeResponse(
        user_id=ctx.user_id,
        display_name=ctx.display_name,
        department=ctx.department,
        email=ctx.email,
        roles=ctx.roles,
        session_id=ctx.session_id,
    )
