# Python Dependencies (FastAPI + LDAP + Redis)

Use this baseline when implementing LDAP auth with Redis sessions.

## Required Packages

- `fastapi>=0.110`
- `starlette>=0.36`
- `pydantic>=2.6`
- `ldap3>=2.9`
- `redis>=5.0` (use `redis.asyncio`)

## Optional but Recommended

- `uvicorn>=0.27` (app runtime)
- `python-dotenv>=1.0` (local env loading)
- `pytest>=8.0`
- `pytest-asyncio>=0.23`
- `httpx>=0.27` (API tests)

## Why `ldap3`

- Pure Python and widely portable in internal environments.
- Supports LDAPS and StartTLS patterns.
- Easier dependency management than `python-ldap` for many teams.

## Minimal `requirements.txt` Example

```txt
fastapi>=0.110
starlette>=0.36
pydantic>=2.6
ldap3>=2.9
redis>=5.0
```

## Minimal `pyproject.toml` Example

```toml
[project]
dependencies = [
  "fastapi>=0.110",
  "starlette>=0.36",
  "pydantic>=2.6",
  "ldap3>=2.9",
  "redis>=5.0",
]
```

## Implementation Note

- For Redis async usage:
  - `from redis.asyncio import Redis`
- Keep package pinning strategy aligned with your org policy
  - exact pin (`==`) for reproducibility, or bounded range for flexibility.

