---
name: workflow-service
description: "워크플로우 기반 AI 서비스의 전체 프로젝트를 초기화한다. FastAPI 백엔드 + React 프론트엔드 + 스킬 시스템을 한번에 구성한다."
user-invocable: true
argument-hint: "[project-name] [domain-name]"
context: fork
agent: general-purpose
allowed-tools: Bash, Write, Read, Edit, Glob, Agent
---

# 워크플로우 기반 AI 서비스 초기화

## 개요

ADCOPY 프로젝트에서 검증된 패턴을 기반으로 워크플로우 기반 AI 서비스를 초기화한다.

인자:
- `$ARGUMENTS[0]`: 프로젝트 이름 (디렉토리명)
- `$ARGUMENTS[1]`: 도메인 이름 (예: adcopy, legal-review, content-moderation)

## 초기화 순서

### Step 1: 프로젝트 루트 생성

프로젝트 디렉토리를 생성하고 기본 파일을 배치한다.

```bash
mkdir -p $ARGUMENTS[0]
cd $ARGUMENTS[0]
```

### Step 2: 백엔드 초기화

`/init-backend` 스킬을 실행하여 FastAPI 백엔드를 구성한다.

포함 항목:
- FastAPI 앱 부트스트랩 (main.py, config.py)
- HITL 승인 게이트웨이 (approval_service.py)
- 스킬 라우팅 정책 (routing_policy.py)
- SSE 이벤트 스트리밍 (events.py)
- Deep Agent 실행기 (langchain_deep_agent_executor.py)
- 페르소나 기반 생성 (creative_personas.py)
- DB 모델/리포지토리 (models/, repositories/)
- API 라우터 (cases, approvals, skills, admin, events)

### Step 3: 프론트엔드 초기화

`/init-frontend` 스킬을 실행하여 React 프론트엔드를 구성한다.

포함 항목:
- AppShell 레이아웃 (사이드바 + 톱니바퀴 메뉴)
- 스텝 기반 위자드 UX (N단계 상태 머신)
- SSE 이벤트 브릿지 (TanStack Query invalidation)
- 타임라인 polling (처리 진행률)
- 게임형 처리 모달 (Phase 기반 애니메이션)
- 페르소나 SVG 아바타 (hover 표정 변화)
- 홈 랜딩 페이지

### Step 4: 스킬 시스템 초기화

`/init-skills-system` 스킬을 실행하여 SKILL.md 기반 지식 관리를 구성한다.

포함 항목:
- SkillParser / SkillLoader / SkillEvaluator
- BuiltinCatalog (앱 시작 시 scaffold 자동 생성)
- SkillRequirementsResolver (입력 필드 → HITL 폼)
- RoutingPolicy (키워드 기반 스킬 선택)

### Step 5: 환경 설정

`.env` 파일을 생성한다.

```env
APP_NAME={project-name} Backend
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
API_PREFIX=/api/v1

DATABASE_URL=postgresql+psycopg://user:pass@127.0.0.1:5432/{project-name}

AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=2024-12-01-preview

DEEPAGENTS_ENABLED=true
DEEPAGENTS_LANGCHAIN_ENABLED=true
DEEPAGENTS_MAX_SKILLS=0

CREATIVE_WEIGHT=0.4
SKILLS_ROOT=../skills
BUILTIN_SKILLS_BOOTSTRAP=true
```

### Step 6: README 생성

프로젝트 README.md를 생성한다. 포함 내용:
- 프로젝트 설명
- 기술 스택
- 시작 방법 (backend, frontend)
- 스킬 시스템 설명
- 워크플로우 흐름 설명

## 파라미터화 안내

프로젝트 생성 후 도메인에 맞게 커스터마이징이 필요한 항목:

| 레이어 | 파일 | 변경 내용 |
|--------|------|----------|
| 백엔드 | config.py | 도메인별 설정 |
| 백엔드 | approval_service.py | approval_type 분기 |
| 백엔드 | creative_personas.py | 도메인별 페르소나 |
| 백엔드 | routing_policy.py | 스킬 카테고리/트리거 |
| 프론트 | new-workflow-page.tsx | 스텝 정의/라벨/필드 |
| 프론트 | app-shell.tsx | 서비스명/메뉴 |
| 프론트 | home-page.tsx | 랜딩 페이지 콘텐츠 |
| 스킬 | skills/*.md | 도메인별 스킬 정의 |

## 검증

초기화 완료 후 다음을 확인한다:

1. `backend/` 디렉토리에 main.py, config.py 존재
2. `frontend/` 디렉토리에 package.json, vite.config.ts 존재
3. `skills/` 디렉토리에 최소 1개 SKILL.md 존재
4. `.env` 파일 존재
