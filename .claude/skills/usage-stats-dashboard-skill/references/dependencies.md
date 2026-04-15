# Dependencies for Usage Stats Dashboard

## Backend (Python)

### Required (stats API + middleware daily access recording)

- `fastapi>=0.110` — API framework
- `pydantic>=2.6` — request/response schemas
- `sqlalchemy>=2.0` — ORM, aggregate queries (func.count, func.date_trunc, etc.)
- `redis>=5.0` — daily access dedup (redis.asyncio)

### Already present if using ldap-login-architecture-skill

- `psycopg[binary]>=3.2` 또는 `psycopg2-binary` — PostgreSQL driver
- `python-dotenv>=1.0` — .env 로딩
- `pydantic-settings>=2.4` — Settings 클래스

### pyproject.toml example (추가 필요 항목만)

```toml
dependencies = [
  # ... 기존 의존성 ...
  "redis>=5.0",       # daily access dedup (없는 경우 추가)
]
```

> `redis` 패키지가 이미 있으면 추가 설치 불필요.

## Frontend (Node.js)

### Required

- `recharts` — 차트 라이브러리 (AreaChart, BarChart, ResponsiveContainer)

### Install

```bash
npm install recharts
```

### Already present (typical React project)

- `react>=18`
- `react-dom>=18`
- `react-router-dom` — 라우팅

## Infrastructure

### Required services

| 서비스 | 용도 | 비고 |
|--------|------|------|
| PostgreSQL | 감사 로그 저장 + 통계 쿼리 | `auth_login_events`, `auth_session_events` 테이블 |
| Redis | 일별 접근 기록 중복 제거 | SET NX with 26h TTL |

> 두 서비스 모두 ldap-login-architecture-skill 적용 시 이미 구성됨.
