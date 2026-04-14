# MVP Baseline

## Authentication

- Backend performs LDAP auth.
- Login request includes only `username` and `password`.
- Transport policy:
  - target state: HTTPS required
  - MVP temporary mode: raw IP over HTTP allowed only in isolated internal network
- Backend verifies against LDAP, then issues app session.

## Session

- Redis is the session store.
- Cookie defaults:
  - `Secure=false` (current baseline for raw IP over http)
  - `HttpOnly=true`
  - `SameSite=Lax`
  - `Path=/`
  - `Domain` unset by default (host-only cookie)

Transition rule:

- when domain + https are available, change to `Secure=true`.
- Default session TTL:
  - Access: 30 minutes
  - Absolute: 12 hours

## Logging

- Store audit/statistics logs in PostgreSQL (append-only).
- Use two tables:
  - `auth_login_events`
  - `auth_session_events`
- Default retention: 5 years.
- Default partitioning unit: quarter.

## Failure Handling

- LDAP down: new login fails (`503`), existing session continues until expiry.
- Redis down: new login fails (`503`), session validation failure returns `401` and forces re-login.

## Frontend Integration

- Login page: 사번(ID)/비밀번호 입력 폼 → `POST /auth/login` → 성공 시 메인 페이지 이동.
- Auth guard: ProtectedLayout에서 마운트 시 `GET /auth/me` 호출 → 실패 시 `/login`으로 리디렉트.
- API client 401 처리: `/auth/*` 외 경로에서 `401` 응답 시 자동 `/login` 리디렉트.
- 유저 상태: 앱 상태 관리(Zustand, Context 등)에 `UserInfo` 저장.
- 로그아웃: UI에 로그아웃 버튼 → `POST /auth/logout` → `/login` 이동.
- **유저 정보 표시: 이름과 조직을 프론트엔드 어디에 표시할지는 사용자에게 반드시 확인**.

## `/auth/me` Response

`/auth/me`는 Redis 세션에 저장된 프로필 정보를 포함 반환:

- `user_id` — 로그인 계정명
- `display_name` — LDAP displayName
- `department` — LDAP department
- `email` — LDAP mail
- `roles` — 앱 역할 목록
- `session_id` — 세션 식별자

## MVP Boundaries

- Keep single Redis instance if needed.
- Avoid Sentinel/Cluster automation in MVP unless explicitly required.
- Keep partition lifecycle manual initially if operations bandwidth is limited.
