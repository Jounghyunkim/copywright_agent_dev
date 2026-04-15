# Login Event Recording Guide

로그인 이벤트 기록은 **인증 방식에 따라 적용 위치가 다르다.** 이 가이드는 각 인증 패턴별로 `auth_login_events`에 INSERT하는 방법을 안내한다.

## 공통 원칙

- **성공과 실패 모두 기록** (success=True/False)
- **department_snapshot 포함** — 조직별 통계의 핵심 데이터
- **source_ip, user_agent 수집** — 보안 감사 + 분석용
- user_id는 성공 시 필수, 실패 시 null 가능 (username_input은 항상 기록)

## 인증 방식별 적용 위치

### 1. LDAP 인증 (ldap-login-architecture-skill 사용 시)

이미 `POST /auth/login` 핸들러에서 기록됨. 추가 작업 불필요.

### 2. JWT 인증

로그인 엔드포인트(토큰 발급)에서 기록:

```python
@router.post("/auth/token")
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = authenticate(body.username, body.password)  # your auth logic
    
    source_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if not source_ip and request.client:
        source_ip = request.client.host

    if user is None:
        db.add(AuthLoginEvent(
            username_input=body.username,
            success=False,
            failure_code="invalid_credentials",
            source_ip=source_ip,
            user_agent=request.headers.get("User-Agent"),
        ))
        db.commit()
        raise HTTPException(status_code=401)

    # Success
    db.add(AuthLoginEvent(
        user_id=user.id,
        username_input=body.username,
        success=True,
        source_ip=source_ip,
        user_agent=request.headers.get("User-Agent"),
        department_snapshot=user.department,  # from your user model or profile
    ))
    db.commit()

    token = create_jwt(user)
    return {"access_token": token}
```

### 3. OAuth / SSO 콜백

OAuth 콜백 핸들러에서 기록:

```python
@router.get("/auth/callback")
def oauth_callback(code: str, request: Request, db: Session = Depends(get_db)):
    try:
        user_info = exchange_code_for_user(code)  # your OAuth logic
    except OAuthError:
        db.add(AuthLoginEvent(
            username_input="oauth_callback",
            success=False,
            failure_code="oauth_exchange_failed",
            source_ip=_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
        ))
        db.commit()
        raise HTTPException(status_code=401)

    db.add(AuthLoginEvent(
        user_id=user_info.id,
        username_input=user_info.email or user_info.id,
        success=True,
        source_ip=_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
        department_snapshot=user_info.department,
    ))
    db.commit()
    # ... create session/token and redirect
```

### 4. 기존 세션 기반 (Flask, Django 등)

로그인 뷰/핸들러에서 기록. 패턴은 동일 — 인증 성공/실패 지점에 INSERT.

## department_snapshot이 없는 경우

프로젝트에 조직 정보가 없으면:
- `department_snapshot = None`으로 기록
- 조직별 통계는 빈 결과 반환 (에러 나지 않음)
- 나중에 조직 정보를 추가하면 그 시점부터 데이터 축적

## Helper: source_ip 추출

```python
def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None
```
