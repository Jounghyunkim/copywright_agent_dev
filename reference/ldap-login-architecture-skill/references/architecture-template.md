# LDAP Authentication Architecture - {{SYSTEM_NAME}}

작성일: {{DATE}}

> Note: This template is an optional artifact. Primary output of this skill is code implementation.

## 1. Decision Summary

- Authentication pattern: Backend LDAP authentication
- Session store: Redis (prefix auto-generated from `SYSTEM_NAME` + env)
- Audit/statistics store: PostgreSQL (append-only logs)
- Scope level: MVP-first

## Preflight Status

- Redis reachable: {{REDIS_PREFLIGHT_STATUS}}
- PostgreSQL reachable: {{POSTGRES_PREFLIGHT_STATUS}}
- Migration tooling ready: {{MIGRATION_TOOLING_STATUS}}
- Notes: {{PREFLIGHT_NOTES}}

## 2. Authentication Flow

1. User submits `username/password` on frontend.
2. Frontend calls `POST /api/v1/auth/login`.
3. Backend validates user against LDAP (`ldaps://lgesaads03.lge.net`, `dc=lge,dc=net`).
4. On success, backend creates app session in Redis and sets auth cookie.
5. Frontend calls `GET /api/v1/auth/me` for profile/role rendering.

## 3. API Contract

### POST `/api/v1/auth/login`

Request:

```json
{
  "username": "user@lge.com",
  "password": "plain-text-over-tls"
}
```

Response 200:

```json
{
  "user": {
    "id": "ldap-user-id",
    "display_name": "User Name",
    "email": "user@example.com",
    "department": "Dept",
    "roles": ["operator"]
  },
  "auth": {
    "token_type": "session_cookie",
    "expires_in": 1800
  }
}
```

Error codes:

- `401` invalid credentials
- `429` too many attempts
- `503` LDAP/Redis unavailable

### POST `/api/v1/auth/logout`

- Invalidate server session and expire cookie.

### GET `/api/v1/auth/me`

- Return user profile and app roles from current session.

## 4. Session Strategy (Redis)

- Redis key prefix (auto-generated from `SYSTEM_NAME` + env):
  - `urn:{{SYSTEM_NAME}}:{env}:session:{session_id}`
  - `urn:{{SYSTEM_NAME}}:{env}:user-sessions:{user_id}`
- Environments: {{ENVIRONMENTS}}
- Cookie domain:
  - default unset (`Domain` attribute omitted; host-only cookie)
  - set explicit domain only when cross-subdomain sharing is required
- Cookie secure:
  - current baseline (raw IP + http): `Secure=false`
  - after domain + https rollout: `Secure=true` required
- Session timeout:
  - Access TTL: 30m
  - Absolute TTL: 12h

## 5. Audit/Statistics Logging (PostgreSQL)

- Tables:
  - `auth_login_events`
  - `auth_session_events`
- Retention: `{{LOG_RETENTION_YEARS}} years`
- Partitioning: `{{LOG_PARTITION_UNIT}}`

Use SQL from:

- `references/postgresql-audit-ddl.sql`
- `references/analytics-queries.sql`

## 6. Security Baseline

- TLS policy:
  - target state: TLS required for client-backend and backend-LDAP paths
  - MVP temporary mode: client-backend raw IP over HTTP allowed only in isolated internal network
- Do not store LDAP password in logs/session payload.
- Mask sensitive fields in logs.
- If legacy TLS compatibility exists, treat as temporary and define secure target state.

## 7. Failure Handling

- LDAP down:
  - new login returns `503`
  - existing sessions continue until expiry
- Redis down:
  - new login returns `503`
  - invalid session validation returns `401`

## 8. MVP vs Deferred

### MVP

- Backend LDAP auth
- Redis session store
- PostgreSQL audit/statistics tables
- Basic failure handling

### Deferred

- Redis HA/Sentinel/Cluster
- automated partition lifecycle jobs
- advanced session hardening and token rotation policies

## 9. Implementation Checklist

- [ ] finalize variable values
- [ ] implement auth APIs
- [ ] integrate LDAP client and attribute mapping
- [ ] add Redis session management
- [ ] apply PostgreSQL DDL migrations
- [ ] wire login/session events logging
- [ ] run integration/security smoke tests
