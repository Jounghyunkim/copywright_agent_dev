---
name: ldap-login-architecture-skill
description: Use when implementing LDAP login into a new service codebase. Applies a consistent MVP-first backend LDAP auth pattern with Redis session storage, PostgreSQL audit/statistics logs, API wiring, migrations, and tests.
author: Jays Lee (sjae.lee@lge.com)
created: 2026-04-07
---

# LDAP Login Architecture Skill

## When To Use

Use this skill when the user asks to:

- add LDAP login/authentication into a new service codebase
- standardize LDAP auth implementation across multiple services
- implement Redis session + PostgreSQL auth logging in code
- add auth APIs, DB migrations, and tests
- review existing LDAP auth code for alignment with this baseline

Do not use this skill for non-LDAP auth systems unless the user explicitly asks adaptation.

## Output Contract (Code-First)

Always produce these sections in this order:

1. Decision summary
2. Implementation plan (files/modules to change)
3. Code changes applied
4. Migration/DDL changes
5. API contract (`/auth/login`, `/auth/logout`, `/auth/me`)
6. Test changes and results
7. Failure handling
8. MVP scope vs deferred scope

If the user explicitly asks for a document, use `references/architecture-template.md` as an auxiliary output.

## Fixed Architecture Decisions

Unless the user explicitly overrides:

- LDAP authentication is handled in backend (not frontend).
- Frontend never stores/replays LDAP credential after login request.
- Session store is Redis with app-specific URN prefix.
- Audit/statistics logs are append-only in PostgreSQL.
- MVP prefers simple operation over advanced HA automation.

## Required Variables To Confirm

Collect or infer these values before finalizing:

- `SYSTEM_NAME`
- `ENVIRONMENTS` (`dev/stg/prod`)
- `LDAP_ID_POLICY` (`sAMAccountName` or `mail local-part`)
- `LOG_RETENTION_YEARS` (default `5`)
- `LOG_PARTITION_UNIT` (default `quarter`)

If some values are unknown, keep placeholders and mark them as `TO_BE_CONFIRMED`.

## LG Fixed LDAP Constants

For LG-internal systems, do not ask for these values unless the user explicitly requests override:

- `LDAP_URL = ldaps://lgesaads03.lge.net`
- `LDAP_BASE_DN = dc=lge,dc=net`
- `UPN_DOMAIN = lge.com`

## Redis Prefix Rule (Auto)

Do not ask user for `REDIS_KEY_PREFIX`.

Generate automatically from `SYSTEM_NAME` and `env`:

- session key: `urn:{system_name}:{env}:session:{session_id}`
- user session index: `urn:{system_name}:{env}:user-sessions:{user_id}`

## Cookie Domain Rule (Auto)

Do not ask user for `AUTH_COOKIE_DOMAIN` in MVP.

- Default: unset cookie `Domain` attribute (host-only cookie).
- Override only when cross-subdomain cookie sharing is explicitly required.

## Cookie Secure Rule (MVP)

- Current deployment assumption (IP access over `http`): use `Secure=false`.
- Development/Staging/Production using raw IP over `http`: keep `Secure=false`.
- Once domain + `https` is introduced: switch to `Secure=true` immediately.
- If `Domain=.lge.com` is used, service must be accessed by matching domain (not raw IP).

## Guardrails

Never recommend:

- frontend-direct LDAP bind as the default production pattern
- returning/storing LDAP password in frontend/session payload
- using Redis as the long-term audit source of truth

If current code has weak TLS settings (for example `rejectUnauthorized: false`), keep compatibility note but mark it as temporary and call out target secure setting.

## Procedure (Implementation)

1. Run preflight checks (below) before code changes.
2. Start from MVP baseline in `references/mvp-baseline.md`.
3. Inspect codebase auth entry points, session middleware, and DB migration system.
4. Check dependency baseline in `references/python-dependencies.md`.
5. Implement/patch auth APIs (`/auth/login`, `/auth/logout`, `/auth/me`).
6. Add Redis session handling with URN key naming.
7. Add PostgreSQL migration using `references/postgresql-audit-ddl.sql`.
8. Add event writes for login/session lifecycle and wire stats queries as needed.
9. Add/adjust tests (unit + integration smoke).
10. Optionally generate architecture doc only if requested.
11. End with explicit `MVP` and `Deferred` split.

## Preflight Checks (Required)

Before implementation, verify:

- Redis availability:
  - connection endpoint exists in environment/config
  - application can establish connection in current environment
- PostgreSQL availability:
  - DB endpoint/credentials are configured
  - migration runner/tooling exists and can apply schema changes
- Runtime wiring:
  - auth service has access to Redis and PostgreSQL clients
  - secrets/config loading path is defined
  - required Python packages are installed and version-compatible

If preflight fails:

- proceed with code structure and interfaces
- gate runtime-dependent changes behind clear config checks
- mark unresolved infra dependencies as `TO_BE_CONFIRMED`
- do not claim end-to-end completion

## Minimum Code Deliverables

- LDAP auth service/module
- Auth API handlers/routes
- Redis session store integration
- Authentication middleware (cookie -> Redis session -> request context)
- FastAPI wiring example (app middleware registration + protected route usage)
- Python dependency update (`pyproject.toml` or `requirements*.txt`)
- DB migration for:
  - `auth_login_events`
  - `auth_session_events`
- Event logging hooks in login/logout/session-expire paths
- Test coverage for success/failure and outage behavior

## Quick Self-Check Before Final Answer

- Does it clearly choose backend LDAP auth?
- Were code changes actually applied (not only documented)?
- Are Redis key naming and cookie rules implemented?
- Is auth middleware wired using `references/fastapi_auth_middleware.py` pattern?
- Is route/app wiring aligned with `references/fastapi-integration-example.py`?
- Is dependency baseline from `references/python-dependencies.md` reflected in the project?
- Are `auth_login_events` and `auth_session_events` migration + writes included?
- Were Redis/PostgreSQL preflight checks executed and reported?
- Are outage behaviors (`LDAP down`, `Redis down`) enforced in code paths?
- Is MVP scope small enough to ship?
