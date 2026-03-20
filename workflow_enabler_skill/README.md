# WORKFLOW_ENABLER_SKILL

작성일: 2026-03-18

## 1. 이 문서는

워크플로우 기반 AI 서비스를 빠르게 구축할 수 있는 **Claude Code Skills 세트**의 사용 가이드다.

ADCOPY 프로젝트에서 검증된 백엔드/프론트엔드 패턴(HITL 승인, 스킬 라우팅, SSE 이벤트, 스텝 위자드 등)이 재사용 가능한 스킬로 패키징되어 있으며, 아래 저장소에서 받을 수 있다.

```
http://mod.lge.com/hub/cx-llm/mktaide/workflow_enabler_skill
```

## 2. 스킬 저장소 구조

```
workflow_enabler_skill/
├── workflow-service/              # /workflow-service — 전체 프로젝트 초기화
│   ├── SKILL.md
│   └── docs/
│       ├── architecture.md        #   3레이어 아키텍처 가이드
│       └── patterns.md            #   10개 재사용 패턴 카탈로그
├── init-backend/                  # /init-backend — FastAPI 백엔드 초기화
│   ├── SKILL.md
│   └── templates/
│       ├── approval_service.py.template   # HITL 승인 게이트웨이
│       ├── routing_policy.py.template     # 스킬 라우팅 정책
│       └── events_router.py.template      # SSE 이벤트 스트리밍
├── init-frontend/                 # /init-frontend — React 프론트엔드 초기화
│   ├── SKILL.md
│   └── templates/
│       ├── step-wizard.tsx.template        # 스텝 기반 위자드 상태 머신
│       ├── event-bridge.tsx.template       # SSE → TanStack Query 브릿지
│       └── processing-modal.tsx.template   # 타임라인 polling 모달
├── init-skills-system/            # /init-skills-system — SKILL.md 지식 관리
│   ├── SKILL.md
│   └── templates/
│       └── SKILL.md.template              # 도메인 스킬 scaffold 템플릿
└── add-workflow-step/             # /add-workflow-step — 스텝 추가
    ├── SKILL.md
    └── templates/
        ├── step-human.tsx.template        # HUMAN 스텝 (입력 폼)
        └── step-ai.tsx.template           # AI 스텝 (프로그레스 + 결과)
```

## 3. 새 프로젝트 만들기

아무 코드도 없는 상태에서 워크플로우 기반 AI 서비스를 처음부터 만드는 경우.

### Step 1: 프로젝트 디렉토리 생성

```bash
mkdir my-service && cd my-service
git init
```

### Step 2: 스킬 저장소를 프로젝트에 clone

```bash
git clone http://mod.lge.com/hub/cx-llm/mktaide/workflow_enabler_skill.git .claude/skills
```

이렇게 하면 `.claude/skills/` 아래에 5개 스킬이 배치된다. Claude Code는 이 위치의 스킬을 자동으로 인식한다.

### Step 3: Claude Code에서 스킬 실행

```bash
claude
```

Claude Code가 열리면:

```
/workflow-service my-service legal-review
```

**두 개의 인자를 전달한다:**

| 인자 | 의미 | 어디에 사용되는지 | 예시 |
|------|------|-----------------|------|
| **프로젝트명** (첫 번째) | 생성될 **폴더 이름**이자 서비스의 식별자 | 프로젝트 루트 폴더명 (`my-service/backend/`, `my-service/frontend/`), `.env`의 `APP_NAME`, DB 이름, `README.md` 제목 | `my-service`, `adcopy-agent`, `contract-reviewer` |
| **도메인명** (두 번째) | 이 서비스가 다루는 **업무 영역** | `skills/` 아래 빌트인 스킬 scaffold 생성, 스킬 frontmatter의 `domain` 필드, 라우팅 정책의 카테고리 정의, LLM 프롬프트의 전문 분야 설정 | `adcopy`, `legal-review`, `content-moderation` |

**프로젝트명 선택:** 영문 kebab-case를 권장한다. 이 이름으로 폴더가 생성된다.

**도메인명 선택:** 이 서비스가 **어떤 종류의 콘텐츠/문서를 AI로 처리하는지**를 나타내는 이름을 정한다. 도메인명에 따라 초기 스킬 scaffold의 방향이 달라진다.

| 만들려는 서비스 | 프로젝트명 예시 | 도메인명 예시 | 생성되는 스킬 예시 |
|---------------|---------------|-------------|-----------------|
| 광고 카피 생성/검토 | `adcopy-agent` | `adcopy` | tone-check, brand-lexicon, compliance-validator |
| 법률 문서 검토 | `contract-reviewer` | `legal-review` | contract-risk-check, clause-validator |
| 콘텐츠 검수 | `content-guard` | `content-moderation` | toxicity-check, brand-safety, fact-checker |
| 코드 리뷰 자동화 | `code-reviewer` | `code-review` | security-scan, style-check, complexity-analyzer |
| 마케팅 기획서 검토 | `brief-checker` | `marketing-brief` | audience-fit, message-clarity, budget-feasibility |

두 이름 모두 이후에 변경할 수 있으며, 초기 scaffold를 생성하는 데만 사용된다.

### Step 4: 결과 확인

```
my-service/
├── .claude/skills/    # 스킬 (clone한 것)
├── backend/           # FastAPI + HITL 승인 + SSE + Deep Agent
├── frontend/          # React + 스텝 위자드 + 이벤트 브릿지
├── skills/            # legal-review 도메인 SKILL.md scaffold
├── .env               # 환경 변수 (DB, LLM API 키 등)
└── README.md
```

### Step 5: 도메인에 맞게 커스터마이징

생성된 코드를 도메인에 맞게 조정한다. Claude Code에서:

```
이 프로젝트의 워크플로우 스텝을 "문서 업로드 → AI 분석 → 위험 검토 → 최종 승인"으로 바꿔줘
```

## 4. 기존 프로젝트에 반영하기

이미 코드가 있는 프로젝트에 워크플로우 패턴을 추가하는 경우.

### 4.1 공통: 스킬 clone

어떤 경우든 먼저 스킬을 프로젝트에 가져온다:

```bash
cd /path/to/my-existing-project

# 방법 A: 직접 clone (간편, .gitignore에 추가 권장)
git clone http://mod.lge.com/hub/cx-llm/mktaide/workflow_enabler_skill.git .claude/skills
echo ".claude/skills/" >> .gitignore

# 방법 B: 서브모듈로 관리 (팀 공유 시)
git submodule add http://mod.lge.com/hub/cx-llm/mktaide/workflow_enabler_skill.git .claude/skills
```

### 4.2 FastAPI + React 프로젝트

기존 구조에 맞게 필요한 패턴만 선택적으로 추가한다. Claude Code에서:

```bash
# 전체 워크플로우 구조 추가
/workflow-service . my-domain

# 또는 개별 패턴만 적용
/init-backend . my-domain              # 백엔드 패턴만
/init-frontend .                       # 프론트엔드 패턴만
/init-skills-system . my-domain        # 스킬 시스템만
/add-workflow-step human "입력" "설명"   # 스텝 하나씩 추가
/add-workflow-step ai "처리" "AI 분석"
```

개별 템플릿만 참고하고 싶을 때:
- HITL 승인만 → `.claude/skills/init-backend/templates/approval_service.py.template`
- SSE만 → `.claude/skills/init-backend/templates/events_router.py.template`
- 스텝 위자드만 → `.claude/skills/init-frontend/templates/step-wizard.tsx.template`

### 4.3 Django / Express / Spring 프로젝트

`.template` 파일은 FastAPI/React 기준이지만, `SKILL.md`에 기술된 패턴은 프레임워크에 독립적이다. Claude Code가 패턴을 읽고 해당 프레임워크에 맞게 자동 변환한다.

```
이 Django 프로젝트에 HITL 승인 워크플로우를 추가하고 싶어.
.claude/skills/init-backend/SKILL.md의 "HITL 승인 게이트웨이" 패턴과
.claude/skills/init-backend/templates/approval_service.py.template을 참고해서
이 프로젝트의 Django 구조에 맞게 구현해줘.
```

### 4.4 Vue / Angular / Next.js 프로젝트

스텝 상태 머신, timeline polling, SSE 브릿지 로직은 프레임워크에 무관하다:

```
이 Vue 프로젝트에 스텝 기반 위자드를 추가하고 싶어.
.claude/skills/init-frontend/templates/step-wizard.tsx.template의
상태 머신 로직을 참고해서 Vue Composition API로 구현해줘.
```

### 4.5 워크플로우는 있지만 체계가 없는 프로젝트

기존 워크플로우 코드를 스킬 시스템 + HITL 패턴으로 구조화할 수 있다:

```
이 프로젝트에 SKILL.md 기반 지식 관리 시스템을 도입하고 싶어.
.claude/skills/init-skills-system/SKILL.md를 참고해서
기존 비즈니스 로직을 스킬 단위로 분리하고,
스킬 로더와 라우팅 정책을 구현해줘.
```

## 5. 팀 공유 및 업데이트

### 5.1 팀원에게 공유 (서브모듈)

프로젝트에 서브모듈로 추가한 경우:

```bash
# 팀원이 프로젝트를 처음 clone할 때
git clone --recurse-submodules http://mod.lge.com/hub/cx-llm/mktaide/my-project.git

# 이미 clone한 경우
git submodule update --init
```

### 5.2 스킬 업데이트

스킬 저장소에 새 패턴/템플릿이 추가되면:

```bash
# 직접 clone한 경우
cd .claude/skills && git pull

# 서브모듈인 경우
git submodule update --remote .claude/skills
```

### 5.3 설치 확인

Claude Code에서:

```
/workflow-service
```

스킬이 인식되면 argument hint `[project-name] [domain-name]`이 표시된다.

인식되지 않으면 확인:
- `.claude/skills/workflow-service/SKILL.md` 파일이 존재하는지
- Claude Code를 프로젝트 루트에서 실행했는지

## 6. 포함된 스킬 요약

| 스킬 | 명령어 | 용도 |
|------|--------|------|
| `workflow-service` | `/workflow-service [name] [domain]` | 전체 프로젝트 초기화 (백엔드+프론트+스킬) |
| `init-backend` | `/init-backend [dir] [domain]` | FastAPI 백엔드 (HITL, SSE, Deep Agent, 페르소나) |
| `init-frontend` | `/init-frontend [dir]` | React 프론트 (스텝 위자드, 이벤트 브릿지, 모달) |
| `init-skills-system` | `/init-skills-system [dir] [domain]` | SKILL.md 지식 관리 (로더, 파서, 라우팅) |
| `add-workflow-step` | `/add-workflow-step [human\|ai] [name] [desc]` | 워크플로우에 스텝 추가 |

## 7. 포함된 패턴

각 스킬에 포함된 검증된 아키텍처 패턴:

### 백엔드

| 패턴 | 설명 | 템플릿 |
|------|------|--------|
| HITL 승인 게이트웨이 | 다단계 승인 + 필드 검증 + `asyncio.to_thread` 비동기 처리 | `approval_service.py.template` |
| 스킬 라우팅 정책 | 키워드 트리거 → 스킬 자동 선택 + 카테고리 보장 + 예산 제한 | `routing_policy.py.template` |
| SSE 이벤트 스트리밍 | append-only 이벤트 → incremental cursor SSE + DB 장애 내성 | `events_router.py.template` |
| Deep Agent 실행기 | LangChain `deepagents` + `FilesystemBackend` 자율 스킬 탐색 | SKILL.md 설명 |
| 페르소나 기반 생성 | 10명 페르소나 태그 매칭 → 최적 5명 자동 선택 → 병렬 생성 | SKILL.md 설명 |
| 2축 평가 시스템 | safety_score(스킬 평균) + creative_score → 가중 합산 | SKILL.md 설명 |

### 프론트엔드

| 패턴 | 설명 | 템플릿 |
|------|------|--------|
| 스텝 기반 위자드 | N단계 상태 머신 + URL resume + HUMAN/AI 스텝 하이브리드 | `step-wizard.tsx.template` |
| SSE 이벤트 브릿지 | EventSource → TanStack Query invalidation + Zustand | `event-bridge.tsx.template` |
| 타임라인 polling | 비동기 처리 중 독립 polling + 이벤트 baseline 추적 | `processing-modal.tsx.template` |
| HUMAN 스텝 | 입력 폼 + 검증 + 다음 스텝 전환 | `step-human.tsx.template` |
| AI 스텝 | 프로그레스 링 + 결과 표시 + 확인 후 전환 | `step-ai.tsx.template` |

## 8. 도메인 커스터마이징 가이드

프로젝트 생성 후 도메인에 맞게 변경이 필요한 항목:

| 레이어 | 변경 항목 | ADCOPY 예시 | 법률 문서 검토 예시 |
|--------|----------|------------|-------------------|
| 백엔드 | Case 상태 모델 | created → waiting_human → ... → completed | created → submitted → reviewing → approved |
| 백엔드 | approval_type | brand_manager_review, copy_selection | legal_review, compliance_check |
| 백엔드 | 이벤트 타입 | ARTIFACT_GENERATION_STARTED | REVIEW_STARTED, RISK_DETECTED |
| 백엔드 | 페르소나 | 은유/감성, 바이럴, 데이터 등 10명 | 보수적 변호사, 공격적 변호사, 중립 분석가 |
| 백엔드 | LLM 프롬프트 | 광고 카피 생성 지침 | 법률 문서 분석 지침 |
| 프론트 | 스텝 정의 | 입력→창작→평가→선택→번역→결과 | 업로드→분석→검토→승인 |
| 프론트 | 입력 필드 | objective, core_message | document_type, jurisdiction |
| 프론트 | 이벤트 라벨 | "카피 생성 시작" | "문서 분석 시작" |
| 프론트 | 색상 테마 | LG Red | 네이비 |
| 스킬 | 도메인 스킬 | tone-check, brand-lexicon | contract-risk, clause-validator |

## 9. 핵심 원칙

스킬의 가치는 `.template` 파일 자체가 아니라 **`SKILL.md`에 기술된 패턴과 설계 의사결정**이다.

- **패턴 설명**: 어떤 문제를 왜 이렇게 해결했는지
- **파라미터화 포인트**: 도메인에 따라 무엇을 바꿔야 하는지
- **템플릿**: 참고용 레퍼런스 구현 (FastAPI/React 기준)

Claude Code는 패턴을 이해하고 어떤 프레임워크든 적용할 수 있으므로, 기술 스택이 달라도 워크플로우 패턴을 도입할 수 있다.

## 10. 기대 효과

| 항목 | 스크래치 개발 | 스킬 활용 |
|------|-------------|----------|
| 백엔드 골격 | 2~3일 | 수 분 (자동 생성) |
| HITL 워크플로우 | 1~2일 | 포함됨 |
| SSE + 실시간 UX | 1일 | 포함됨 |
| 스텝 기반 프론트 | 2~3일 | 포함됨 |
| 스킬 시스템 | 1일 | 포함됨 |
| 도메인 커스터마이징 | - | 파라미터만 변경 |
| 다른 프레임워크 적용 | 패턴 재설계 필요 | Claude Code가 자동 변환 |
