"""
Reference: Login handler integration for admin role assignment.

THIS IS THE MOST CRITICAL PIECE — without this, admin_users table exists
but nobody ever gets the "admin" role in their session.

Add this code AFTER successful authentication, BEFORE session/token creation.
"""

# ══════════════════════════════════════════════════════════════
# Pattern: Check admin_users table and assign role on login
# ══════════════════════════════════════════════════════════════
#
# Insert this code block into your login handler:
#   - After: authentication succeeds (LDAP bind, JWT verify, OAuth callback, etc.)
#   - Before: session/token creation (Redis session, JWT issuance, etc.)
#   - Where: the login endpoint that returns credentials to the frontend

# --- Example for FastAPI login handler ---

"""
@router.post("/auth/login")
async def login(body: LoginRequest, db: Session = Depends(get_db)):

    # Step 1: Your existing authentication (LDAP, password hash, OAuth, etc.)
    user_info = authenticate(body.username, body.password)

    # Step 2: Determine roles (DEFAULT + admin check)
    roles = list(DEFAULT_ROLES)  # e.g. ["user", "viewer"]

    # ┌──────────────────────────────────────────────────────┐
    # │  ADD THIS BLOCK — admin role assignment + profile    │
    # │  refresh from auth provider                          │
    # └──────────────────────────────────────────────────────┘
    from your_app.infra.db.models.admin import AdminUser

    admin_record = db.query(AdminUser).filter(
        AdminUser.user_id == user_info.user_id  # MUST match login ID format
    ).first()

    if admin_record:
        roles.append("admin")

        # Refresh admin profile from auth provider on every login
        # This fixes the bootstrap problem (display_name = user_id initially)
        admin_record.display_name = user_info.display_name
        admin_record.department = user_info.department
        admin_record.email = user_info.email
        db.commit()
    # ┌──────────────────────────────────────────────────────┐
    # │  END OF ADMIN BLOCK                                  │
    # └──────────────────────────────────────────────────────┘

    # Step 3: Create session/token with roles
    session_id = await create_session(user_id=user_info.user_id, roles=roles, ...)
    # or: token = create_jwt({"sub": user_info.user_id, "roles": roles})

    return {"status": "ok", ...}
"""


# ══════════════════════════════════════════════════════════════
# Pattern: Bootstrap seeding (add to app startup)
# ══════════════════════════════════════════════════════════════
#
# Add this to your FastAPI startup event or lifespan,
# AFTER database tables are created (create_all / migrations).

"""
from sqlalchemy import func as sa_func
from your_app.infra.db.models.admin import AdminUser

@app.on_event("startup")
def startup():
    # ... existing startup code (create_all, migrations, etc.) ...

    # ┌──────────────────────────────────────────────────────┐
    # │  ADD THIS BLOCK — bootstrap initial admins           │
    # └──────────────────────────────────────────────────────┘
    if settings.initial_admin_user_ids:
        with SessionLocal() as db:
            admin_count = db.query(sa_func.count(AdminUser.id)).scalar() or 0
            if admin_count == 0:  # Only seed if table is empty (idempotent)
                for uid in settings.initial_admin_user_ids.split(","):
                    uid = uid.strip()
                    if uid:
                        db.add(AdminUser(
                            user_id=uid,
                            display_name=uid,  # placeholder → updated on first login
                            added_by="system_bootstrap",
                        ))
                db.commit()
                logger.info("Bootstrapped initial admins: %s", settings.initial_admin_user_ids)
    # ┌──────────────────────────────────────────────────────┐
    # │  END OF BOOTSTRAP BLOCK                              │
    # └──────────────────────────────────────────────────────┘
"""


# ══════════════════════════════════════════════════════════════
# Checklist: After integration
# ══════════════════════════════════════════════════════════════
#
# 1. Set INITIAL_ADMIN_USER_IDS=your.id in .env
# 2. Restart server → check "Bootstrapped initial admins" in log
# 3. Login → check /auth/me response includes "admin" in roles
# 4. If admin_users table uses sAMAccountName but login uses email → NO MATCH
#    The user_id format MUST be identical in both places
