# Environment & Config Settings

## .env에 추가할 항목

```env
# ── Admin ──
# 초기 관리자 시딩용. AD ID(sAMAccountName)를 쉼표로 구분.
# 테이블이 비어있을 때만 시딩됨. 이후엔 API로만 관리.
INITIAL_ADMIN_USER_IDS=firstname.lastname,another.admin
```

### LDAP 검색 사용 시 추가 (선택)

LDAP 검색을 사용하는 경우, 기존 LDAP 설정이 필요하다.
관리자 본인 자격증명으로 검색하므로 서비스 계정 설정은 불필요.

```env
# 이미 LDAP 인증을 쓰고 있다면 아래 값은 이미 존재할 것:
LDAP_URL=ldaps://ldap.company.com
LDAP_BASE_DN=dc=company,dc=com
LDAP_UPN_DOMAIN=company.com
LDAP_CONNECT_TIMEOUT=5
```

## Pydantic Settings 클래스에 추가할 필드

```python
# config.py (또는 settings.py)
class Settings(BaseSettings):
    # ... 기존 설정 ...

    # ── Admin ──
    initial_admin_user_ids: str = Field(default="", alias="INITIAL_ADMIN_USER_IDS")
```

## .env.example 업데이트

```env
# ── Admin ──
# AD ID(sAMAccountName) 쉼표 구분. 로그인 시 사용하는 ID와 동일한 형식이어야 함.
INITIAL_ADMIN_USER_IDS=firstname.lastname
```

## 주의사항

- `INITIAL_ADMIN_USER_IDS`에 넣는 값은 **로그인 시 사용하는 AD ID(sAMAccountName)**와 반드시 동일해야 함
- 형식이 다르면 로그인 시 admin_users 테이블 매칭이 안 되어 admin 역할이 부여되지 않음
- 서비스 계정(LDAP_SERVICE_BIND_DN 등)은 **불필요** — 관리자 본인 비밀번호로 검색
