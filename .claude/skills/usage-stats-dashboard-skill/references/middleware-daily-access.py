"""
Reference: Daily access recording pattern for auth middleware.

Add this method to your auth middleware class.
Called after successful session validation, before call_next.
"""

from datetime import date

from redis.exceptions import RedisError

# Redis dedup key format
_DAU_KEY_FMT = "urn:{system_name}:{env}:dau:{day}:{user_id}"


async def _record_daily_access(
    self, user_id: str, session_id: str, request
) -> None:
    """Write one 'accessed' event per user per day to PostgreSQL.

    Uses a Redis key as dedup flag (TTL 26h) so we only hit DB once/day/user.
    Fire-and-forget: never blocks the request, never raises.
    """
    try:
        settings = get_settings()
        today = date.today().isoformat()
        dedup_key = _DAU_KEY_FMT.format(
            system_name="your_system",  # replace with SYSTEM_NAME
            env=settings.app_env,
            day=today,
            user_id=user_id,
        )
        redis = self.session_store._redis

        # SET NX returns True only on first set → first access today
        was_set = await redis.set(dedup_key, "1", nx=True, ex=93600)  # 26h TTL
        if not was_set:
            return  # already recorded today

        # Write to PostgreSQL (sync, but only once per day per user)
        from your_app.infra.db.session import SessionLocal
        from your_app.infra.db.models.auth import AuthSessionEvent

        source_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        if not source_ip and request.client:
            source_ip = request.client.host

        with SessionLocal() as db:
            db.add(AuthSessionEvent(
                session_id=session_id,
                user_id=user_id,
                event_type="accessed",
                source_ip=source_ip or None,
                user_agent=request.headers.get("User-Agent"),
            ))
            db.commit()

    except (RedisError, Exception):
        # Never block — silently continue
        pass


# ══════════════════════════════════════════════════════════════
# Integration Guide: 인증 방식별 미들웨어 적용 위치
# ══════════════════════════════════════════════════════════════

# ── 1. Cookie/Session 기반 미들웨어 (LDAP, 일반 세션) ──
#
# class AuthSessionMiddleware(BaseHTTPMiddleware):
#     async def dispatch(self, request, call_next):
#         ... (cookie → Redis session 검증) ...
#         request.state.auth = AuthContext(user_id=user_id, roles=roles, session_id=session_id)
#         await self._record_daily_access(user_id, session_id, request)  # <-- 여기
#         return await call_next(request)

# ── 2. JWT 미들웨어 ──
#
# class JWTAuthMiddleware(BaseHTTPMiddleware):
#     async def dispatch(self, request, call_next):
#         token = request.headers.get("Authorization", "").replace("Bearer ", "")
#         payload = decode_jwt(token)  # your JWT decode
#         user_id = payload["sub"]
#         session_id = payload.get("jti", user_id)  # JWT ID or user_id as fallback
#         request.state.auth = AuthContext(user_id=user_id, ...)
#         await self._record_daily_access(user_id, session_id, request)  # <-- 여기
#         return await call_next(request)

# ── 3. FastAPI Depends 기반 (미들웨어 없이) ──
#
# 미들웨어 대신 dependency에서 기록하려면:
#
# async def get_current_user_and_record(request: Request, db: Session = Depends(get_db)):
#     user = await get_current_user(request)  # your auth dependency
#     # daily access recording (동기적, Redis dedup 필요)
#     await _record_daily_access_standalone(user.id, request)
#     return user
#
# 이 방식은 미들웨어보다 유연하지만, 모든 protected route에 적용해야 함.
# 미들웨어 방식을 권장.

# ── 4. session_id가 없는 경우 (stateless JWT 등) ──
#
# session_id 대신 user_id를 사용해도 됨.
# auth_session_events.session_id 필드에 user_id를 넣으면 DAU 계산에는 영향 없음.
# (session_id는 세션 추적용이지 DAU 계산에는 user_id만 사용)
