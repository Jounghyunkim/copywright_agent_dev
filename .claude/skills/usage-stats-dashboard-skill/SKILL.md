---
name: usage-stats-dashboard-skill
description: Use when adding DAU/MAU statistics, per-user and per-department usage dashboards to a service codebase. Implements middleware-level daily access recording, stats API endpoints, and a Recharts-based admin dashboard.
author: Jays Lee (sjae.lee@lge.com)
created: 2026-04-13
---

# Usage Stats Dashboard Skill

## When To Use

Use this skill when the user asks to:

- add DAU/MAU statistics dashboard to a service
- implement per-user or per-department usage tracking
- add activity-based analytics (login counts, active days, etc.)
- build an admin stats page with charts and tables

## Prerequisites

This skill assumes:

- Python + FastAPI backend (adaptable to other frameworks)
- React + Vite + TypeScript frontend
- PostgreSQL database
- Redis (daily access dedup용)
- 어떤 형태든 인증이 존재할 것 (LDAP, JWT, OAuth, 세션 등)

`ldap-login-architecture-skill`과 함께 사용하면 감사 테이블과 미들웨어가 이미 존재하므로 바로 통계 API + 대시보드만 추가하면 된다.

**독립 적용 시** (ldap-login-architecture-skill 없이):
1. 감사 테이블 생성 — `references/audit-tables-ddl.sql`
2. 로그인 이벤트 기록 추가 — `references/login-event-recording.md`
3. 미들웨어에 daily access 기록 추가 — `references/middleware-daily-access.py`
4. 통계 API + 대시보드 구현

## Required Variables To Confirm

Collect or infer before implementation:

- `SYSTEM_NAME` — for Redis dedup key prefix
- `APP_ENV` — environment name in dedup key
- `ADMIN_ROLE_NAME` — role string that gates access to stats (default: `"admin"`)
- `STATS_DEFAULT_DAYS` — default period for stats queries (default: `30`)
- `RECHARTS_BRAND_COLOR` — primary chart color (default: project's primary color)

## 사용자에게 반드시 사전 확인할 사항

구현 시작 전에 **어떤 통계가 필요한지** 사용자에게 물어볼 것. 선택에 따라 구현 범위가 달라진다.

| 통계 항목 | 설명 | 관련 API | 관련 UI |
|-----------|------|----------|---------|
| DAU/MAU 트렌드 | 일별/월별 활성 사용자 수 차트 | summary, dau, mau | 요약 카드 + AreaChart + BarChart |
| 조직별 활동 | 조직별 사용자 수, 로그인 횟수, 평균 활동일 | departments | 조직별 테이블 |
| 개인별 활동 | 사용자별 활동일, 로그인 횟수, 최근 접속 | users | 개인별 테이블 (정렬 가능) |

**질문 예시 (AskUserQuestion 사용):**

```
질문: "어떤 사용 통계가 필요한가요?"
선택지 (multiSelect: true):
  - DAU/MAU 트렌드 (일별/월별 활성 사용자 차트 + 요약 카드)
  - 조직별 활동 통계 (조직별 사용자 수, 로그인 횟수, 평균 활동일)
  - 개인별 활동 통계 (사용자별 활동일, 로그인 횟수, 최근 접속 시간)
```

**선택에 따른 구현 범위:**

- **DAU/MAU만 선택**: summary + dau + mau 엔드포인트, 요약 카드 + 차트 2개
- **DAU/MAU + 조직별**: 위 + departments 엔드포인트 + 조직 테이블
- **DAU/MAU + 개인별**: 위 + users 엔드포인트 + 개인 테이블 (정렬 기능)
- **전체 선택**: 5개 엔드포인트 모두 + 전체 대시보드

> 미들웨어 daily access 기록과 감사 테이블은 어떤 조합이든 공통으로 필요하다.

## Architecture Overview

```
[Browser Request]
      |
[Auth Middleware] ──→ Redis SET NX (dedup) ──→ PostgreSQL INSERT (1/user/day)
      |
[Stats API] ──→ PostgreSQL aggregate queries ──→ JSON response
      |
[Frontend Dashboard] ──→ Recharts (AreaChart, BarChart) + Tables
```

### Data Flow

1. **Recording**: Auth middleware records one `accessed` event per user per day
   - Redis key `urn:{system}:{env}:dau:{date}:{user_id}` with SET NX (26h TTL)
   - Only hits PostgreSQL on first access of the day (max 1 write/user/day)
   - Fire-and-forget: never blocks the request

2. **Aggregation**: Stats API runs SQLAlchemy queries on audit tables
   - DAU: distinct users per day from session events
   - MAU: distinct users per month from session events
   - Per-user: login count + active days + last login
   - Per-department: unique users + login count + avg active days

3. **Display**: Frontend fetches on mount and period change, renders charts + sortable tables

## Procedure (Implementation)

1. **Check dependencies** — `references/dependencies.md` 참조
   - Backend: `redis>=5.0` 설치 여부 확인 (`pyproject.toml` 또는 `requirements.txt`)
   - Frontend: `recharts` 설치 (`npm install recharts`)
   - Infra: PostgreSQL, Redis 사용 가능 여부 확인

2. **Verify audit tables exist** — `auth_login_events` and `auth_session_events`
   - If not, apply DDL from `references/audit-tables-ddl.sql`
   - SQLAlchemy ORM 모델 추가 — `references/sqlalchemy-models.py`
   - Ensure `auth_session_events.event_type` allows `'accessed'`

3. **로그인 이벤트 기록 추가** — `references/login-event-recording.md` 참조
   - 프로젝트의 인증 방식(LDAP/JWT/OAuth/세션)에 맞게 로그인 핸들러에 INSERT 추가
   - 성공/실패 모두 기록, department_snapshot 포함

4. **Add daily access recording to auth middleware**
   - Use `references/middleware-daily-access.py` pattern
   - 프로젝트의 인증 미들웨어에 맞게 적응 — `references/middleware-daily-access.py` 하단 가이드 참조
   - Redis SET NX with 26h TTL for dedup
   - Sync PostgreSQL INSERT inside the dedup guard
   - Wrap in try/except — never block the request

5. **Create stats API endpoints** following `references/stats-api-endpoints.py`
   - `GET /admin/stats/summary` — DAU today, MAU this month, totals
   - `GET /admin/stats/dau?days=30` — daily trend with zero-fill
   - `GET /admin/stats/mau?months=12` — monthly trend
   - `GET /admin/stats/users?days=30` — per-user breakdown
   - `GET /admin/stats/departments?days=30` — per-department breakdown
   - 엔드포인트 보호: admin 역할이 있으면 `require_admin` 사용, 없으면 `references/endpoint-protection.md` 참조

6. **Create frontend dashboard page** following `references/stats-page-structure.md`
   - Summary cards (DAU, MAU, total users)
   - DAU AreaChart + MAU BarChart
   - Department table + User table (sortable)
   - Period selector (7/14/30/90 days)

7. **Wire routing and navigation**
   - Add route `/admin/stats`
   - Add nav link (admin role 있으면 조건부, 없으면 항상 표시 또는 별도 가드)

8. **Register router in main app**

## Fixed Architecture Decisions

Unless the user explicitly overrides:

- Daily access recording uses **Redis SET NX dedup** (not DB-level dedup)
- Redis dedup key TTL is **26 hours** (covers timezone edge cases)
- Stats queries use **session events** (`accessed` + `created`) for DAU/MAU, not login events
- Login events are used for **login count, success rate, department snapshot**
- Charts use **Recharts** (React-native, composable, lightweight)
- All stats endpoints are **admin-only** (protected by role check)
- Frontend sorting is **client-side** (no API round-trip)
- Dates are **zero-filled** in DAU trend (missing days show count=0)

## Redis Dedup Key Rule (Auto)

Generate automatically from `SYSTEM_NAME` and `env`:

```
urn:{system_name}:{env}:dau:{YYYY-MM-DD}:{user_id}
```

Example: `urn:skill_mgmt:production:dau:2026-04-13:sjae.lee`

## Minimum Code Deliverables

### Database

- PostgreSQL 감사 테이블 DDL — `references/audit-tables-ddl.sql`
- SQLAlchemy ORM 모델 — `references/sqlalchemy-models.py`
  - `AuthLoginEvent`: 로그인 시도 기록 (성공/실패, user_id, department_snapshot)
  - `AuthSessionEvent`: 세션 이벤트 기록 (created, accessed, logout 등)

### Backend

- Auth middleware `_record_daily_access()` method (Redis dedup + PostgreSQL insert)
- Stats API router with 5 endpoints (summary, dau, mau, users, departments)
- All endpoints protected with admin role dependency
- Pydantic response schemas for each endpoint
- 각 엔드포인트별 SQL 패턴 — `references/analytics-queries.sql` (A~F 섹션별 정리)

### Frontend

- Stats dashboard page with:
  - Summary stat cards (3-column grid)
  - DAU AreaChart (ResponsiveContainer, gradient fill)
  - MAU BarChart (ResponsiveContainer, rounded bars)
  - Department stats table
  - User stats table (sortable columns: active_days, login_count, last_login, user_id)
  - Period selector (7/14/30/90 days)
- Route registration
- Admin-conditional nav link

## Query Patterns

### DAU (daily active users)

```sql
SELECT DATE(occurred_at) AS day,
       COUNT(DISTINCT user_id) AS cnt
FROM auth_session_events
WHERE event_type IN ('accessed', 'created')
  AND DATE(occurred_at) >= :since
GROUP BY DATE(occurred_at)
ORDER BY DATE(occurred_at)
```

Zero-fill missing dates in application code.

### MAU (monthly active users)

```sql
SELECT TO_CHAR(DATE_TRUNC('month', occurred_at), 'YYYY-MM') AS month,
       COUNT(DISTINCT user_id) AS cnt
FROM auth_session_events
WHERE event_type IN ('accessed', 'created')
GROUP BY DATE_TRUNC('month', occurred_at)
ORDER BY DATE_TRUNC('month', occurred_at)
```

Important: GROUP BY must use the same `DATE_TRUNC()` expression, not the `TO_CHAR()` wrapper.

### Per-user stats

Two-table join:
- `auth_login_events` → login_count, last_login, department_snapshot
- `auth_session_events` → active_days (distinct dates with accessed/created events)

### Per-department stats

Subquery approach:
1. Aggregate user → active_days from session events
2. Map user → department from login events
3. Join and compute avg(active_days) per department

## Recharts Component Patterns

### AreaChart (DAU)

```tsx
<ResponsiveContainer width="100%" height={220}>
  <AreaChart data={dau}>
    <defs>
      <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="{BRAND_COLOR}" stopOpacity={0.15} />
        <stop offset="95%" stopColor="{BRAND_COLOR}" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
    <XAxis dataKey="date" tickFormatter={formatDate} fontSize={11} />
    <YAxis allowDecimals={false} fontSize={11} />
    <Tooltip />
    <Area type="monotone" dataKey="count" stroke="{BRAND_COLOR}" fill="url(#dauGrad)" strokeWidth={2} />
  </AreaChart>
</ResponsiveContainer>
```

### BarChart (MAU)

```tsx
<ResponsiveContainer width="100%" height={200}>
  <BarChart data={mau}>
    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
    <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={11} />
    <YAxis allowDecimals={false} fontSize={11} />
    <Tooltip />
    <Bar dataKey="count" fill="{BRAND_COLOR}" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

## Known Pitfalls (실제 겪은 문제)

### 1. MAU GROUP BY 오류 (PostgreSQL)

**증상**: `column "auth_session_events.occurred_at" must appear in the GROUP BY clause`

**원인**: SELECT에서 `to_char(date_trunc(...))` 쓰고 GROUP BY에서 `date_trunc(...)`만 쓰면 PostgreSQL이 다른 표현식으로 인식.

**해결**: `date_trunc()`을 `.label("m")`으로 라벨링하고 GROUP BY/ORDER BY에서 동일 라벨 사용.

```python
# WRONG
.group_by(func.date_trunc("month", Event.occurred_at))

# RIGHT
month_trunc = func.date_trunc("month", Event.occurred_at).label("m")
db.query(func.to_char(month_trunc, "YYYY-MM"), ...).group_by(month_trunc)
```

### 2. DAU zero-fill 누락

**증상**: 차트에 데이터 없는 날짜가 빠져서 X축이 불규칙하게 표시됨.

**해결**: DB 결과를 dict로 변환 후 Python에서 전체 날짜 범위를 순회하며 0으로 채움.

```python
result_map = {str(row.day): row.cnt for row in rows}
for i in range(days):
    d = since + timedelta(days=i)
    result.append(DauEntry(date=d.isoformat(), count=result_map.get(d.isoformat(), 0)))
```

### 3. department_snapshot은 시점 데이터

`auth_login_events.department_snapshot`은 로그인 시점의 조직 정보. 사용자가 조직 이동하면 최신 로그인의 snapshot만 현재 조직을 반영. `MAX(department_snapshot)`으로 가장 최근 값 사용.

### 4. Redis 없이 daily access 기록 시 DB 폭주

Redis dedup 없이 매 요청마다 PostgreSQL INSERT하면 활성 사용자 100명 기준 하루 수만 건 적재. 반드시 Redis SET NX로 하루 1회만 기록.

### 5. 미들웨어 recording이 요청을 블로킹하면 안 됨

`_record_daily_access()`는 반드시 try/except로 감싸고 예외 발생 시 pass. 통계 기록 실패가 사용자 요청을 실패시키면 안 됨.

## Quick Self-Check Before Final Answer

- Is daily access recording wired into auth middleware (not a separate cron)?
- Does Redis dedup use SET NX with 26h TTL?
- Does the recording never block the request (fire-and-forget)?
- Do DAU/MAU queries use session events (accessed + created), not just login events?
- Are missing dates zero-filled in DAU trend?
- Does MAU GROUP BY use the same expression as SELECT (not TO_CHAR wrapper)?
- Are all stats endpoints admin-only?
- Does the frontend period selector trigger re-fetch of all relevant endpoints?
- Are user stats tables sortable client-side?
- Is recharts installed and AreaChart/BarChart used correctly?
