# LDAP 로그인 구현 문서

※ 참고로, ID/PASSWD : copywriting / 123*

## 개요

Copywriting Agent 플랫폼에 LG 사내 LDAP 기반 인증 시스템을 구현한 내역입니다.
Redis 세션 + PostgreSQL 감사 로그 + Cookie 기반 세션 유지 아키텍처를 적용합니다.

---

## Decision Summary

| 항목 | 결정 |
|------|------|
| 인증 방식 | 백엔드 LDAP bind (`ldap3`) |
| 세션 저장 | Redis (`redis.asyncio`) |
| 감사 로그 | PostgreSQL append-only (`auth_login_events`, `auth_session_events`) |
| Cookie | `SESSION_ID`, HttpOnly, SameSite=Lax, Secure=false (MVP) |
| ID 정책 | mail local-part (예: `jounghyun.kim`) → `{username}@lge.com` UPN |
| 유저 표시 위치 | topbar 우측 (이름 + 조직 뱃지 + 로그아웃 버튼) |

---

## 확정 변수

| 변수 | 값 |
|------|-----|
| `SYSTEM_NAME` | `copywriting-agent` |
| `LDAP_ID_POLICY` | `mail local-part` |
| `LDAP_URL` | `ldaps://lgesaads03.lge.net` (LG 고정) |
| `LDAP_BASE_DN` | `dc=lge,dc=net` (LG 고정) |
| `LDAP_UPN_DOMAIN` | `lge.com` (LG 고정) |
| `REDIS_URL` | `redis://localhost:6379/0` |
| Redis key prefix | `urn:copywriting-agent:{env}:session:{session_id}` (자동 생성) |
| Cookie Domain | 미설정 (host-only, MVP) |
| Cookie Secure | `false` (현재 IP + HTTP 접근, HTTPS 전환 시 `true`) |
| `AUTH_SESSION_TTL_MINUTES` | 30 |
| `AUTH_SESSION_ABSOLUTE_TTL_HOURS` | 12 |
| `AUTH_ENV` | `dev` |
| `LOG_RETENTION_YEARS` | 5 (기본값) |
| `LOG_PARTITION_UNIT` | quarter (기본값) |

---

## 생성/변경 파일 목록

### 백엔드

```
backend/
├── app/auth/                    ← 신규 모듈
│   ├── __init__.py
│   ├── redis_store.py           ← Redis 세션 CRUD
│   ├── ldap_service.py          ← LDAP bind 인증 + 사용자 정보 조회
│   ├── middleware.py             ← AuthContextMiddleware (Cookie→Redis→request.state.auth)
│   ├── routes.py                ← POST /auth/login, POST /auth/logout, GET /auth/me
│   └── audit.py                 ← PostgreSQL 감사 로그 기록
├── app/database.py              ← 수정: auth_login_events, auth_session_events DDL 추가
├── app/main.py                  ← 수정: 미들웨어 등록, auth 라우터 추가, Redis lifecycle
├── .env.template                ← 수정: LDAP_URL, REDIS_URL, AUTH_* 변수 추가
└── pyproject.toml               ← 수정: ldap3, redis 의존성 추가
```

### 프론트엔드

```
frontend-v2/
├── src/shared/api/types.ts           ← 수정: LoginRequest, LoginResponse, UserInfo 타입 추가
├── src/shared/api/client.ts          ← 수정: 401 → /login 자동 리디렉트 (/auth/* 제외)
├── src/shared/state/auth-store.ts    ← 신규: Zustand auth 스토어 (user/setUser/clearUser)
├── src/app/protected-layout.tsx      ← 신규: GET /auth/me guard → 실패 시 /login 리디렉트
├── src/app/router.tsx                ← 수정: /login (public) + ProtectedLayout으로 감싸기
├── src/pages/login/login-page.tsx    ← 신규: ID/PW 입력 폼 → POST /auth/login
├── src/shared/ui/app-shell.tsx       ← 수정: TopbarUser (이름 + 조직 뱃지 + 로그아웃)
└── vite.config.ts                    ← 수정: /auth 프록시 추가
```

---

## 모듈별 상세 설명

### 1. Redis 세션 스토어 (`backend/app/auth/redis_store.py`)

- **키 규칙**: `urn:copywriting-agent:{env}:session:{session_id}`
- **사용자 세션 인덱스**: `urn:copywriting-agent:{env}:user-sessions:{user_id}` (Set)
- **함수**:
  - `get_redis()` — Redis 연결 싱글턴
  - `create_session(user_id, display_name, department, email, roles)` → `session_id`
  - `get_session(session_id)` → `dict | None`
  - `delete_session(session_id, user_id)`
  - `refresh_session(session_id)` → `bool`
  - `close_redis()` — 앱 종료 시 연결 해제
- **TTL**: Access 30분 (`AUTH_SESSION_TTL_MINUTES`), Absolute 12시간 (`AUTH_SESSION_ABSOLUTE_TTL_HOURS`)

### 2. LDAP 인증 서비스 (`backend/app/auth/ldap_service.py`)

- **인증 흐름**:
  1. `username` → `{username}@lge.com` UPN 구성
  2. LDAP `bind` 시도 (자격증명 검증)
  3. 성공 시 `userPrincipalName`으로 사용자 검색
  4. `displayName`, `department`, `mail` 속성 조회
  5. `LdapUserInfo` 반환
- **TLS**: LDAPS 사용, MVP에서는 `CERT_NONE` (자체 서명 인증서 허용)
- **에러 코드**:
  - `empty_credentials` — 빈 입력
  - `invalid_credentials` — 인증 실패
  - `ldap_unreachable` — LDAP 서버 연결 불가
  - `user_not_found` — 인증 성공 but 디렉터리에 엔트리 없음

### 3. Auth 미들웨어 (`backend/app/auth/middleware.py`)

- **`AuthContextMiddleware`**: Starlette `BaseHTTPMiddleware` 기반
  - 요청마다 `SESSION_ID` 쿠키 → Redis 조회 → `request.state.auth` 주입
  - Public paths (`/`, `/health`, `/auth/login`, `/auth/logout`, `/docs`, `/openapi.json`) 제외
  - 인증 실패 시 `401 Unauthorized` 반환
- **`AuthContext`** dataclass: `user_id`, `display_name`, `department`, `email`, `roles`, `session_id`
- **`require_auth`** 의존성: protected route에서 사용

### 4. Auth API 라우트 (`backend/app/auth/routes.py`)

| Method | Path | 인증 | Request Body | Response | 설명 |
|--------|------|:----:|-------------|----------|------|
| POST | `/auth/login` | - | `{username, password}` | `{status, user_id, display_name, department}` | LDAP bind → Redis 세션 생성 → Set-Cookie |
| POST | `/auth/logout` | - | - | `{status: "logged_out"}` | Redis 세션 삭제 + 쿠키 제거 |
| GET | `/auth/me` | ✅ | - | `{user_id, display_name, department, email, roles, session_id}` | 현재 사용자 정보 |

### 5. 감사 로그 (`backend/app/auth/audit.py`)

- **`auth_login_events`**: 모든 로그인 시도 기록
  - `user_id`, `username_input`, `success`, `failure_code`, `source_ip`, `user_agent`, `department_snapshot`
- **`auth_session_events`**: 세션 생명주기 이벤트
  - `session_id`, `user_id`, `event_type` (`created`/`logout`/`expired`/`revoked`), `source_ip`
- 비차단(best-effort) 기록: 감사 로그 실패가 인증 흐름을 차단하지 않음

### 6. main.py 통합

- Lifespan: Redis 연결 확인 (`ping`) + 종료 시 `close_redis()`
- 미들웨어 등록 순서: CORS → AuthContextMiddleware (starlette은 역순 처리)
- `app.include_router(auth_router)` — `/auth/login`, `/auth/logout`, `/auth/me` 등록
- Public paths에서 기존 비즈니스 API (`/api/v1/*`)는 인증 필수

### 7. DB 마이그레이션

`database.py`의 `init_db()`에 `CREATE TABLE IF NOT EXISTS` 추가:
- `auth_login_events` — 로그인 시도 (성공/실패)
- `auth_session_events` — 세션 생명주기

---

## 프론트엔드 상세

### 인증 흐름

```
[/login] → POST /auth/login → Set-Cookie: SESSION_ID
         → GET /auth/me → auth-store.setUser(UserInfo)
         → navigate('/') → ProtectedLayout → AppShell + Outlet
```

### Auth Store (`shared/state/auth-store.ts`)

```typescript
interface AuthState {
  user: UserInfo | null
  setUser: (user: UserInfo) => void
  clearUser: () => void
}
```

### ProtectedLayout (`app/protected-layout.tsx`)

- 마운트 시 `GET /auth/me` 호출
- 성공: `auth-store.setUser(me)` → 자식 라우트(Outlet) 렌더
- 실패: `/login`으로 리디렉트
- 이미 `user`가 store에 있으면 API 호출 생략 (SPA 내 탐색)

### 401 인터셉터 (`shared/api/client.ts`)

- 모든 API 응답에서 `401` 감지
- `/auth/*` 경로는 제외 (로그인 실패 시 인터셉터가 개입하지 않음)
- 그 외 경로에서 401 → `window.location.href = '/login'`

### 로그인 페이지 (`pages/login/login-page.tsx`)

- ID 입력: mail local-part (예: `jounghyun.kim`)
- 비밀번호 입력
- LG Red 그라디언트 배경, 중앙 카드 레이아웃
- 에러 표시: 인증 실패(401), 서버 연결 불가(503)

### TopbarUser (`shared/ui/app-shell.tsx`)

```
┌─ topbar ──────────────────────────────────────────────┐
│ Copywriting Agent            홍길동  [개발팀]  [로그아웃] │
└───────────────────────────────────────────────────────┘
```

- `auth-store.user.display_name` 표시
- `auth-store.user.department` → Badge로 표시
- 로그아웃 버튼 → `POST /auth/logout` → cookie 삭제 → `/login` 이동

### 라우터 구조 (`app/router.tsx`)

```
/login                    ← Public (LoginPage)
/                         ← ProtectedLayout
  └─ AppShell + Outlet
      ├─ / (HomePage)
      ├─ /workflow (EditorPage)
      ├─ /copy-review (CopyReviewPage)
      ├─ /workflow-list (WorkflowListPage)
      ├─ /approvals (ApprovalsPage)
      ├─ /skills (SkillsPage)
      └─ /settings (SettingsPage)
```

### Vite 프록시 (`vite.config.ts`)

```typescript
'/auth': {
  target: 'http://localhost:5000',
  changeOrigin: true,
},
```

---

## Failure Handling

| 장애 상황 | 동작 |
|-----------|------|
| **LDAP 서버 다운** | 신규 로그인 실패 (`503`), 기존 세션은 Redis TTL 만료까지 유지 |
| **Redis 다운** | 신규 로그인 실패 (`503`), 세션 검증 실패 → `401` → 재로그인 강제 |
| **PostgreSQL 감사 로그 실패** | 로그인/로그아웃 흐름 차단하지 않음 (best-effort 기록) |

---

## 환경변수 추가 사항 (`backend/.env.template`)

```env
# Redis (Session Store)
REDIS_URL=redis://localhost:6379/0

# LDAP Authentication
LDAP_URL=ldaps://lgesaads03.lge.net
LDAP_BASE_DN=dc=lge,dc=net
LDAP_UPN_DOMAIN=lge.com

# Auth
AUTH_SESSION_TTL_MINUTES=30
AUTH_SESSION_ABSOLUTE_TTL_HOURS=12
AUTH_ENV=dev
```

---

## Python 의존성 추가

`pyproject.toml`에 추가된 패키지:

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `ldap3` | >=2.9 | LDAP bind 인증 + 사용자 속성 조회 |
| `redis` | >=5.0 | Redis async 세션 저장소 |

---

## MVP vs Deferred 범위

### MVP (구현 완료)

- LDAP bind 인증 (mail local-part → UPN)
- Redis 세션 (30분 TTL, 12시간 절대 TTL)
- Cookie 기반 세션 유지 (HttpOnly, SameSite=Lax, Secure=false)
- Auth 미들웨어 (전체 `/api/v1/*` 보호)
- 감사 로그 (`auth_login_events` + `auth_session_events`)
- 로그인 페이지 (LG Red 테마)
- ProtectedLayout (Auth Guard)
- 401 자동 리디렉트
- topbar 유저 이름 + 조직 뱃지 + 로그아웃

### Deferred (향후 구현)

- 세션 sliding window 갱신
- 동시 세션 제한 (max sessions per user)
- 관리자 세션 강제 종료
- RBAC 역할 기반 접근 제어
- 로그인 통계 대시보드 (조직별 사용량, 로그인 빈도)
- MFA (다중 인증)
- `Secure=true` + HTTPS 전환
- LDAP TLS 인증서 검증 (`CERT_REQUIRED`)
- 감사 로그 분기별 파티셔닝 자동화

---

## 운영 시 확인사항

1. **Redis 실행 확인**: `redis-cli ping` → `PONG`
2. **`.env` 설정**: `REDIS_URL`, `LDAP_URL` 등이 올바르게 설정되어 있는지 확인
3. **백엔드 재시작**: 새 미들웨어와 라우트가 적용되도록 `uvicorn` 재시작
4. **프론트엔드 재빌드**: `npm run build` 또는 dev 서버 재시작
5. **LDAP 네트워크 접근**: 백엔드 서버에서 `ldaps://lgesaads03.lge.net:636` 접근 가능 확인
