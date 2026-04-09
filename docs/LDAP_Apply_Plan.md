# LDAP 로그인 적용 전략

> Reference: `reference/ldap-login-architecture-skill/`
> 최종 검토: 2026-04-08

---

## 1. 현재 상태 분석

| 항목 | 현재 카피라이팅 에이전트 | Reference LDAP 아키텍처 |
|------|----------------------|----------------------|
| **인증** | 없음 — 모든 엔드포인트 공개 | LDAP bind → Redis 세션 → HttpOnly 쿠키 |
| **사용자 식별** | 하드코딩 "Admin" (app-shell.tsx:206) | AuthContext(user_id, roles, session_id) |
| **세션** | 없음 | Redis (TTL: 접근 30분, 절대 12시간) |
| **감사 로그** | 없음 | PostgreSQL auth_login_events + auth_session_events |
| **역할 제어** | 없음 | `require_auth`, `require_role("admin")` 미들웨어 |
| **CORS** | `allow_credentials=True` 이미 설정 | 쿠키 전송에 필요 (이미 준비됨) |
| **DB** | PostgreSQL (asyncpg) | 동일 — 테이블 추가만 필요 |

---

## 2. 인증 흐름 (적용 후)

```
사용자가 앱 접속
  │
  ├─ 세션 쿠키 없음 → /login 페이지로 리다이렉트
  │   │
  │   └─ username + password 입력 → POST /api/v1/auth/login
  │       │
  │       ├─ Backend: ldap3로 LDAP bind (ldaps://lgesaads03.lge.net)
  │       ├─ 성공 → Redis 세션 생성 + HttpOnly 쿠키 설정
  │       ├─ 실패 → 401 (잘못된 자격증명) / 503 (LDAP 장애)
  │       │
  │       └─ 성공 시 → GET /api/v1/auth/me → 사용자 프로필 로딩
  │           → 홈 페이지로 이동
  │
  ├─ 세션 쿠키 있음 → AuthContextMiddleware가 Redis 검증
  │   │
  │   ├─ 유효 → request.state.auth = AuthContext(user_id, roles)
  │   │   → 모든 API 정상 접근
  │   │
  │   └─ 만료/무효 → 401 → 프론트엔드가 /login으로 리다이렉트
  │
  └─ 로그아웃 → POST /api/v1/auth/logout
      → Redis 세션 삭제 + 쿠키 만료 → /login으로 이동
```

---

## 3. Backend 변경 사항

### 3-A. 신규 파일

| 파일 | 역할 |
|------|------|
| `backend/app/auth/__init__.py` | Auth 모듈 패키지 |
| `backend/app/auth/ldap_service.py` | `ldap3` 기반 LDAP bind 인증 (ldaps://lgesaads03.lge.net, dc=lge,dc=net) |
| `backend/app/auth/session_store.py` | Redis 세션 CRUD (`urn:copywriting:{env}:session:{id}`) |
| `backend/app/auth/middleware.py` | Reference의 `AuthContextMiddleware` 이식 — 모든 요청에서 쿠키 → Redis 검증 |
| `backend/app/auth/dependencies.py` | `require_auth`, `require_role` FastAPI Dependencies |
| `backend/app/auth/routes.py` | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` 엔드포인트 |

### 3-B. 기존 파일 수정

| 파일 | 변경 내용 |
|------|----------|
| `main.py` | AuthContextMiddleware 등록 + auth 라우터 마운트 + public_paths 설정 |
| `database.py` | `auth_login_events`, `auth_session_events` 테이블 마이그레이션 추가 |
| `models.py` | `AuthLoginEvent`, `AuthSessionEvent` ORM 모델 추가 |
| `pyproject.toml` | `ldap3>=2.9`, `redis>=5.0` 의존성 추가 |

### 3-C. Public Paths (인증 면제)

```python
PUBLIC_PATHS = {
    "/",                    # 루트 상태
    "/health",              # 헬스체크 (EventBridge 폴링)
    "/docs",                # Swagger UI
    "/openapi.json",        # OpenAPI 스키마
    "/api/v1/auth/login",   # 로그인
    "/api/v1/auth/logout",  # 로그아웃
}
```

나머지 28개 기존 엔드포인트는 모두 `require_auth` 보호 대상.

### 3-D. 역할 기반 접근 제어 (RBAC)

| 역할 | 접근 가능 영역 |
|------|-------------|
| `user` | 캠페인 CRUD, 카피 생성/리뷰, 채팅 |
| `admin` | 위 전체 + 스킬 생성/수정/삭제, 시스템 설정 |

```python
# 스킬 관리는 admin만
@app.post("/api/v1/skills")
async def create_skill(skill: CustomSkillCreate, ctx: AuthContext = Depends(require_role("admin"))):
    ...

# 캠페인 작업은 일반 user도 가능
@app.post("/api/v1/campaigns/analyze")
async def analyze(req: AnalyzeRequest, ctx: AuthContext = Depends(require_auth)):
    ...
```

### 3-E. 캠페인 소유권

Campaign 모델에 `created_by` 필드 추가:

```python
# models.py Campaign
created_by: Mapped[str] = mapped_column(String(100), nullable=True)
```

- 캠페인 저장 시 `ctx.user_id`를 `created_by`에 기록
- Dashboard에서 본인 캠페인만 표시하거나, 전체 표시 + 소유자 표시 선택 가능

---

## 4. Frontend 변경 사항

### 4-A. 신규 파일

| 파일 | 역할 |
|------|------|
| `shared/state/auth-store.ts` | Zustand: user(id, name, email, department, roles), isAuthenticated, login/logout |
| `pages/login/login-page.tsx` | 로그인 폼 UI (username + password → POST /api/v1/auth/login) |

### 4-B. 기존 파일 수정

| 파일 | 변경 내용 |
|------|----------|
| `shared/api/client.ts` | 401 응답 시 `/login` 페이지로 리다이렉트 처리 |
| `app/router.tsx` | `<AuthGuard>` 래퍼 추가, `/login` 라우트 추가 |
| `shared/ui/app-shell.tsx` | "Admin" → 로그인 사용자 이름(display_name) 표시, 로그아웃 버튼 추가 |
| `shared/i18n/locales.ts` | 로그인/로그아웃 관련 번역 키 추가 (EN/KO/DE) |

### 4-C. AuthGuard 동작

```tsx
// router.tsx
<Route element={<AuthGuard />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/new" element={<NewWorkflowPage />} />
  ...
</Route>
<Route path="/login" element={<LoginPage />} />

// AuthGuard: isAuthenticated가 false이면 /login으로 리다이렉트
```

### 4-D. AppShell 사용자 표시

```
변경 전: "Admin" (하드코딩)
변경 후: "김정현 (마케팅플랫폼)" + 로그아웃 버튼
```

---

## 5. Redis 세션 설계

### 키 패턴

Reference의 URN 규칙을 따름:

```
세션 키:      urn:copywriting:{env}:session:{uuid}
사용자 인덱스:  urn:copywriting:{env}:user-sessions:{user_id}
```

### 세션 데이터 (JSON)

```json
{
  "user_id": "jounghyun.kim",
  "display_name": "김정현",
  "email": "jounghyun.kim@lge.com",
  "department": "마케팅플랫폼",
  "roles": ["user", "admin"]
}
```

### TTL 정책

| 항목 | 값 |
|------|---|
| 접근 타임아웃 | 30분 (마지막 요청 기준) |
| 절대 타임아웃 | 12시간 (세션 생성 기준) |

### 쿠키 설정

| 속성 | MVP 값 | 프로덕션 값 |
|------|--------|-----------|
| Domain | 미설정 (host-only) | 도메인 설정 |
| Secure | false (HTTP/IP 환경) | true (HTTPS) |
| HttpOnly | true | true |
| SameSite | Lax | Lax |
| Path | / | / |

---

## 6. 감사 로그 (PostgreSQL)

### 테이블 구조

**auth_login_events** — 로그인 시도 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT (PK) | 자동 증가 |
| occurred_at | TIMESTAMPTZ | 이벤트 시각 |
| request_id | TEXT | 요청 추적 ID |
| user_id | TEXT (nullable) | 사용자 ID (실패 시 null 가능) |
| username_input | TEXT | 입력된 사용자명 |
| success | BOOLEAN | 성공 여부 |
| failure_code | TEXT (nullable) | 실패 사유 |
| source_ip | INET | 클라이언트 IP |
| user_agent | TEXT | 브라우저 정보 |
| department_snapshot | TEXT | 로그인 시점 부서 |

**auth_session_events** — 세션 생명주기 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT (PK) | 자동 증가 |
| occurred_at | TIMESTAMPTZ | 이벤트 시각 |
| session_id | TEXT | Redis 세션 ID |
| user_id | TEXT | 사용자 ID |
| event_type | TEXT | created / refreshed / revoked / expired / logout |
| reason | TEXT (nullable) | 사유 (idle timeout, user logout 등) |
| source_ip | INET | 클라이언트 IP |
| user_agent | TEXT | 브라우저 정보 |

### 보존 정책

- 기본 보존 기간: 5년
- 파티셔닝 단위: 분기(quarter)

### 활용 쿼리 (Reference 제공)

- 일별 활성 사용자 수
- 사용자별 성공/실패 횟수
- 부서별 사용 현황
- 시간대별 접속 패턴 (KST)

---

## 7. 장애 대응

| 장애 상황 | 신규 로그인 | 기존 세션 |
|----------|-----------|----------|
| **LDAP 서버 다운** | 503 (서비스 불가) | Redis TTL까지 정상 유지 |
| **Redis 다운** | 503 (서비스 불가) | 세션 검증 실패 → 401 → 재로그인 필요 |
| **PostgreSQL 다운** | 인증 자체에 영향 없음 | 감사 로그만 기록 실패 (graceful) |

---

## 8. 의존성 추가

```toml
# pyproject.toml
[project.dependencies]
ldap3 = ">=2.9"        # Pure Python LDAP 클라이언트
redis = ">=5.0"        # 비동기 Redis (redis.asyncio)
```

### ldap3 선택 이유 (Reference 근거)
- Pure Python, 이식성 우수
- LDAPS 및 StartTLS 지원
- python-ldap 대비 의존성 관리 용이

---

## 9. LDAP 설정

| 항목 | 값 |
|------|---|
| LDAP 서버 | `ldaps://lgesaads03.lge.net` |
| Base DN | `dc=lge,dc=net` |
| UPN 도메인 | `lge.com` |
| ID 정책 | sAMAccountName 또는 mail local-part |

### 환경변수 (.env 추가)

```
LDAP_SERVER=ldaps://lgesaads03.lge.net
LDAP_BASE_DN=dc=lge,dc=net
LDAP_UPN_DOMAIN=lge.com
REDIS_URL=redis://localhost:6379/0
AUTH_COOKIE_NAME=copywriting_session
AUTH_SESSION_ACCESS_TTL=1800
AUTH_SESSION_ABSOLUTE_TTL=43200
```

---

## 10. MVP vs 향후 확장

| 구분 | MVP (1차) | 향후 확장 |
|------|----------|----------|
| Redis | 단일 인스턴스 | Sentinel/Cluster HA |
| TLS | HTTP (개발 환경) | HTTPS + Secure 쿠키 |
| 역할 | user/admin 2단계 | 부서별/프로젝트별 세분화 |
| 감사 로그 | 수동 파티션 관리 | 자동 파티션 라이프사이클 |
| 동시 세션 | 무제한 | 세션 수 제한 + 강제 로그아웃 |
| 캠페인 소유권 | 전체 공개 (created_by 기록만) | 본인 캠페인만 표시 + 공유 |

---

## 11. 구현 우선순위

| 순서 | 작업 | 영향도 |
|------|------|--------|
| **1** | Backend auth 모듈 (LDAP + Redis + 미들웨어) | 핵심 인프라 |
| **2** | Auth API 엔드포인트 (login/logout/me) | 인증 동작 |
| **3** | 기존 엔드포인트에 require_auth 적용 | 보안 적용 |
| **4** | Frontend 로그인 페이지 + AuthGuard | 사용자 접근 |
| **5** | AppShell 사용자 표시 + 로그아웃 | UX 완성 |
| **6** | 감사 로그 테이블 + 이벤트 기록 | 운영/감사 |
| **7** | 캠페인 created_by 필드 추가 | 소유권 추적 |
