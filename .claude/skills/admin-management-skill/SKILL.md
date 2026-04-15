---
name: admin-management-skill
description: Use when adding admin role management (add/remove admins, LDAP user search, role-based endpoint protection, bootstrap seeding) to a Python + React/Vite/TS project.
author: Jays Lee (sjae.lee@lge.com)
created: 2026-04-13
---

# Admin Management Skill

## When To Use

Use this skill when the user asks to:

- add admin role management to a service
- implement admin add/remove with user search
- add role-based endpoint protection (admin-only APIs)
- bootstrap initial admin users from environment variables
- add LDAP/directory user search for admin assignment

## Prerequisites

- Python + FastAPI backend
- React + Vite + TypeScript frontend
- PostgreSQL database
- 어떤 형태든 인증 시스템 존재 (LDAP, JWT, OAuth, 세션 등)
- 사용자 디렉토리 검색 수단 (LDAP, DB 유저 테이블, 외부 API 등)

## Required Variables To Confirm

Collect or infer before implementation:

- `ADMIN_ROLE_NAME` — 역할 문자열 (default: `"admin"`)
- `INITIAL_ADMIN_USER_IDS` — 부트스트랩용 쉼표 구분 ID (default: `""`)
- `USER_ID_TYPE` — 사용자 식별자 형식 (AD ID, 이메일, 사번 등)

## 사용자에게 반드시 사전 확인할 사항

### 1. 사용자 검색 방식

```
질문: "관리자 추가 시 사용자 검색을 어떻게 할까요?"
선택지:
  - LDAP 실시간 검색 (관리자 본인 비밀번호로 LDAP 바인드)
  - LDAP 서비스 계정 검색 (별도 서비스 계정 필요)
  - DB 유저 테이블 검색 (이미 가입된 사용자만)
  - 로그인 이력 기반 검색 (한 번이라도 로그인한 사용자만)
```

### 2. 사용자 ID 형식 확인

로그인 시 사용하는 ID와 admin_users 테이블의 user_id가 **반드시 동일한 형식**이어야 한다.
프로젝트의 로그인 핸들러에서 `user_id`로 사용되는 값이 무엇인지 확인할 것.
(예: AD ID/sAMAccountName인 `firstname.lastname` 형식)

### 3. 기존 역할 시스템 유무

```
질문: "현재 프로젝트에 역할(role) 시스템이 있나요?"
선택지:
  - 있음 (roles 리스트가 세션/토큰에 포함됨)
  - 없음 (새로 추가해야 함)
```

## Architecture Overview

```
[Bootstrap]  .env INITIAL_ADMIN_USER_IDS → admin_users 테이블 시딩 (최초 1회)
                                              │
[Login]      인증 성공 → admin_users 조회 → "admin" 역할 세션에 추가
                                              │
[Admin UI]   비밀번호 입력 → LDAP 검색 → 관리자 추가/제거
                                              │
[Protection] require_admin dependency → admin 역할 없으면 403
```

### 핵심 설계 결정

1. **서비스 계정 불필요** — 관리자 본인의 자격증명으로 LDAP 검색 (보안성 높음)
2. **역할 반영은 로그인 시** — 관리자 추가/제거 후 다음 로그인부터 반영 (기존 세션 변경 안 함)
3. **프로필 자동 갱신** — 관리자가 로그인할 때마다 LDAP에서 이름/조직/이메일 최신화
4. **마지막 관리자 보호** — 관리자가 1명일 때 삭제 불가 (시스템 잠김 방지)
5. **부트스트랩 멱등성** — 테이블이 비어있을 때만 시딩, 이후엔 API로만 관리

## Procedure (Implementation)

1. **사전 확인** — 검색 방식, ID 형식, 역할 시스템 유무 확인
2. **의존성 확인** — `references/dependencies.md`
3. **DB 모델 생성** — `references/admin-user-model.py`
   - `admin_users` 테이블 (user_id unique, display_name, department, email, added_by, created_at)
4. **config + .env 설정 추가** — `references/env-settings.md` 참조
   - Pydantic Settings에 `INITIAL_ADMIN_USER_IDS` 필드 추가
   - `.env` / `.env.example`에 값 추가
5. **부트스트랩 시딩 + 로그인 플로우 수정** — `references/login-flow-integration.py` (**필독**)
   - main.py startup에서 테이블 비어있으면 초기 관리자 추가
   - 로그인 핸들러에서 admin_users 조회 → 역할 추가 + 프로필 갱신
6. **require_admin 의존성** — `references/require-admin-dependency.py`
7. **사용자 검색 함수** — 검색 방식에 따라 선택:
   - LDAP 검색: `references/ldap-user-search.py` (관리자 본인 자격증명 사용)
   - 비LDAP 검색: `references/non-ldap-user-search.py` (DB 테이블, 로그인 이력, 외부 API)
8. **관리자 CRUD API** — `references/admin-crud-api.py` (list, search, add, remove)
10. **기존 관리 엔드포인트 보호** — 기존 admin API에 `Depends(require_admin)` 적용
11. **프론트엔드 관리 페이지** — `references/admin-users-page-structure.md`
12. **라우터/네비 연결** — admin 역할 조건부 메뉴 표시

## Minimum Code Deliverables

### Database

- `admin_users` 테이블 DDL — `references/admin-user-ddl.sql`
- SQLAlchemy ORM 모델 — `references/admin-user-model.py`

### Backend

- `INITIAL_ADMIN_USER_IDS` config 설정
- startup 부트스트랩 시딩 로직
- 로그인 핸들러에 admin 역할 부여 + 프로필 갱신 로직
- `require_admin` FastAPI dependency
- 관리자 CRUD API 4개 엔드포인트 (list, search-ldap, add, remove)
- LDAP 검색 함수 (관리자 본인 자격증명 바인드)

### Frontend

- 관리자 관리 페이지:
  - 현재 관리자 목록 테이블 (이름, ID, 조직, 추가일, 추가자, 제거 버튼)
  - 비밀번호 입력 게이트 → LDAP 검색 → 결과 테이블 (추가 버튼 / 관리자 뱃지)
- 라우트 등록
- admin 역할 조건부 네비게이션 링크

## Known Pitfalls (실제 겪은 문제)

### 1. user_id 형식 불일치

**증상**: 관리자로 등록했는데 로그인 시 admin 역할이 안 붙음.

**원인**: `INITIAL_ADMIN_USER_IDS`에 로그인 ID와 다른 형식의 값을 넣음.

**해결**: 로그인 시 사용되는 ID 형식(예: `firstname.lastname`)과 admin_users.user_id가 **정확히 같은 형식**이어야 함. 스킬 적용 시 반드시 확인.

### 2. 부트스트랩 시딩된 관리자의 이름/조직이 ID로 표시됨

**증상**: 관리자 목록에 `firstname.lastname | firstname.lastname | - ` 처럼 이름 대신 ID가 표시됨.

**원인**: 부트스트랩 시 LDAP 조회 없이 `display_name=user_id`로 저장.

**해결**: 로그인 시 admin 프로필을 자동 갱신하도록 구현. 한 번 로그인하면 실제 이름/조직으로 업데이트됨.

```python
if admin_record:
    roles.append("admin")
    admin_record.display_name = user_info.display_name
    admin_record.department = user_info.department
    admin_record.email = user_info.email
    db.commit()
```

### 3. LDAP 검색 타임아웃 (dc=company,dc=net 전체 검색)

**증상**: `displayName=*query*` 와일드카드 검색이 5초 안에 안 끝남.

**원인**: LDAP connect_timeout과 같은 5초를 search receive_timeout으로 사용. 전체 디렉토리 와일드카드 검색은 더 오래 걸림.

**해결**:
- `receive_timeout`을 15초 이상으로 설정 (connect_timeout의 3배)
- 필터에 `(objectCategory=person)` 추가 (AD에서 인덱싱됨, 검색 범위 대폭 축소)
- `sizeLimit` 파라미터로 결과 수 제한

```python
search_timeout = max(settings.ldap_connect_timeout * 3, 15)
search_filter = f"(&(objectCategory=person)(objectClass=user)(|(displayName=*{q}*)(sAMAccountName=*{q}*)))"
conn.search(..., size_limit=20, time_limit=search_timeout)
```

### 4. LDAP 서비스 계정 vs 본인 자격증명

**고민**: 서비스 계정으로 검색 vs 관리자 본인 비밀번호로 검색.

**결론**: 본인 자격증명 사용.
- 장점: 서비스 계정 관리 불필요, 보안성 높음, 감사 추적 가능
- 단점: 관리자가 비밀번호를 한 번 더 입력해야 함
- UX 보완: 세션 내 한 번만 입력하면 이후 검색은 자유롭게

### 5. 관리자 역할 반영 시점

**고민**: 관리자 추가/제거 즉시 반영 vs 다음 로그인 시 반영.

**결론**: 다음 로그인 시 반영.
- 기존 Redis 세션을 실시간 수정하려면 모든 세션 스캔 + JSON 역직렬화/재직렬화 + 레이스 컨디션 처리 필요
- 세션 TTL이 30분(슬라이딩)/12시간(절대)이므로 지연이 제한적
- 프론트에서 "다음 로그인부터 반영됩니다" 안내로 혼란 방지

### 6. 마지막 관리자 삭제 방지

**증상**: 모든 관리자를 제거하면 관리자 추가가 불가능해짐 (chicken-and-egg).

**해결**: 백엔드에서 `admin_count <= 1`이면 409 반환. 프론트에서 에러 메시지 표시.

## Quick Self-Check Before Final Answer

- admin_users 테이블이 생성되고 main.py에 import 되었는가?
- INITIAL_ADMIN_USER_IDS 부트스트랩이 멱등적인가 (테이블 비어있을 때만)?
- 로그인 시 admin_users 조회 → 역할 추가가 구현되었는가?
- 로그인 시 admin 프로필 (이름/조직/이메일) 갱신이 구현되었는가?
- require_admin dependency가 만들어지고 관리 엔드포인트에 적용되었는가?
- LDAP 검색이 서비스 계정이 아닌 관리자 본인 자격증명을 사용하는가?
- LDAP 검색 타임아웃이 connect_timeout보다 충분히 긴가? (최소 15초)
- LDAP 필터에 objectCategory=person이 포함되었는가?
- 마지막 관리자 삭제 방지가 구현되었는가?
- 프론트에서 비밀번호 입력 게이트가 구현되었는가?
- 프론트에서 admin 역할 조건부 메뉴 표시가 구현되었는가?
- user_id 형식이 로그인 ID와 일치하는가?
