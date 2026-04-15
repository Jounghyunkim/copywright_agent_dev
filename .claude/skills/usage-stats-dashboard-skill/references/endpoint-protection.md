# Stats Endpoint Protection Guide

통계 엔드포인트는 관리자만 접근해야 한다. 프로젝트의 권한 시스템에 따라 적절한 방법을 선택.

## 방법 1: admin 역할 기반 (권장, 역할 시스템 있는 경우)

```python
# deps.py
def require_admin(request: Request) -> AuthContext:
    auth = get_auth_context(request)
    auth.require_any({"admin"})
    return auth

# stats router
@router.get("/admin/stats/summary")
def get_summary(db: Session = Depends(get_db), auth: AuthContext = Depends(require_admin)):
    ...
```

## 방법 2: 특정 user_id 화이트리스트 (간단, 역할 시스템 없는 경우)

```python
# config.py
STATS_ADMIN_USER_IDS = Field(default="", alias="STATS_ADMIN_USER_IDS")
# .env: STATS_ADMIN_USER_IDS=alice,bob

# deps.py
def require_stats_access(request: Request) -> AuthContext:
    auth = get_auth_context(request)
    settings = get_settings()
    allowed = {u.strip() for u in settings.stats_admin_user_ids.split(",") if u.strip()}
    if allowed and auth.user_id not in allowed:
        raise HTTPException(status_code=403, detail="forbidden")
    return auth
```

## 방법 3: 인증만 확인 (모든 로그인 사용자 접근 허용)

보안이 덜 중요한 내부 도구의 경우:

```python
@router.get("/admin/stats/summary")
def get_summary(db: Session = Depends(get_db), auth: AuthContext = Depends(get_auth_context)):
    ...
```

## 방법 4: API 키 기반 (서버 간 호출)

```python
# 별도 미들웨어나 dependency로 X-API-Key 헤더 검증
def require_api_key(request: Request):
    key = request.headers.get("X-API-Key")
    if key != settings.stats_api_key:
        raise HTTPException(status_code=401)
```

## 프론트엔드 네비게이션 가드

역할 시스템이 있는 경우:
```typescript
// admin 역할일 때만 메뉴 표시
...(user?.roles?.includes('admin') ? [{ label: '사용 통계', path: '/admin/stats' }] : [])
```

역할 시스템이 없는 경우:
```typescript
// 모든 인증 사용자에게 표시
{ label: '사용 통계', path: '/admin/stats' }
```

> 프론트엔드 가드는 UX 용도일 뿐, 실제 보안은 백엔드 엔드포인트에서 담당해야 한다.
