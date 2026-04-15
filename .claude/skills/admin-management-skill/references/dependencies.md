# Dependencies for Admin Management

## Backend (Python)

### Required

- `fastapi>=0.110` — API framework
- `pydantic>=2.6` — request/response schemas
- `sqlalchemy>=2.0` — ORM (admin_users 테이블)

### LDAP 검색 사용 시 추가

- `ldap3>=2.9` — LDAP 검색 (순수 Python, LDAPS/StartTLS 지원)

### DB 기반 검색 사용 시

- 추가 패키지 불필요 (SQLAlchemy로 충분)

### pyproject.toml example

```toml
dependencies = [
  # ... 기존 의존성 ...
  "ldap3>=2.9",   # LDAP 검색 사용 시 (없으면 DB 검색으로 대체)
]
```

## Frontend (Node.js)

### Required

- 추가 패키지 없음 (React + fetch API로 충분)

### Already present (typical React project)

- `react>=18`
- `react-dom>=18`
- `react-router-dom` — 라우팅

## Infrastructure

### Required

| 서비스 | 용도 | 비고 |
|--------|------|------|
| PostgreSQL | admin_users 테이블 | 기존 DB 사용 |

### Optional

| 서비스 | 용도 | 비고 |
|--------|------|------|
| LDAP / AD | 사용자 검색 | LDAP 검색 방식 선택 시 필요 |

> LDAP이 없으면 DB 유저 테이블이나 로그인 이력에서 검색하도록 대체 가능.
