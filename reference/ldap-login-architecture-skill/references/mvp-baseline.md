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

## MVP Boundaries

- Keep single Redis instance if needed.
- Avoid Sentinel/Cluster automation in MVP unless explicitly required.
- Keep partition lifecycle manual initially if operations bandwidth is limited.
