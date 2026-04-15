"""
Reference: FastAPI dependency for admin role enforcement.

Adapt get_auth_context and AuthContext imports to your project.
"""

from fastapi import HTTPException, Request, status

# from your_app.security.rbac import AuthContext


# ── Option 1: Role-based (recommended if roles exist in session/token) ──

def require_admin(request: Request):
    """Require authenticated user with 'admin' role."""
    auth = get_auth_context(request)  # your existing auth dependency
    auth.require_any({"admin"})
    return auth


# ── Option 2: User ID whitelist (if no role system) ──

def require_admin_by_whitelist(request: Request):
    """Check admin access via environment variable whitelist."""
    auth = get_auth_context(request)
    settings = get_settings()
    allowed = {u.strip() for u in settings.stats_admin_user_ids.split(",") if u.strip()}
    if allowed and auth.user_id not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
    return auth


# ── Option 3: DB-backed check per request (if roles not in session) ──

def require_admin_from_db(request: Request, db=None):
    """Check admin_users table on every request."""
    auth = get_auth_context(request)
    from your_app.infra.db.models.admin import AdminUser
    is_admin = db.query(AdminUser).filter(AdminUser.user_id == auth.user_id).first()
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
    return auth


# ── Usage in endpoint ──
#
# @router.get("/admin/something")
# def admin_endpoint(auth: AuthContext = Depends(require_admin)):
#     ...
