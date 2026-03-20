# 워크플로우 서비스 아키텍처

## 3-레이어 구조

워크플로우 서비스는 세 개의 독립 레이어로 구성된다. 각 레이어는 명확한 책임을 가지며 정의된 인터페이스를 통해서만 통신한다.

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│  AppShell → StepWizard → SSE Bridge → Timeline  │
└──────────────────────┬──────────────────────────┘
                       │  REST API + SSE
┌──────────────────────▼──────────────────────────┐
│                Backend (FastAPI)                  │
│  Router → Service → Agent Executor → Repository  │
└──────────────────────┬──────────────────────────┘
                       │  SKILL.md 파싱
┌──────────────────────▼──────────────────────────┐
│              Skills (Markdown 기반)               │
│  SKILL.md → SkillLoader → SkillEvaluator         │
└─────────────────────────────────────────────────┘
```

## 레이어별 책임

### Backend (FastAPI)

API 라우팅, 비즈니스 로직, AI 에이전트 실행, 데이터 영속화를 담당한다.

- **API 라우터**: cases, approvals, skills, admin, events 엔드포인트 제공
- **도메인 서비스**: Case 생성, 승인 처리, 생성 실행, 평가, 선택, 번역 오케스트레이션
- **인프라**: DB 리포지토리, LangChain 에이전트 실행기, SSE 이벤트 발행

### Frontend (React)

사용자 인터페이스, 상태 관리, 실시간 이벤트 수신을 담당한다.

- **AppShell**: 전체 레이아웃 (사이드바, 네비게이션, 설정 메뉴)
- **StepWizard**: N단계 워크플로우를 상태 머신으로 관리
- **SSE Bridge**: 서버 이벤트를 수신하여 TanStack Query 캐시를 자동 무효화
- **Timeline**: 처리 진행률을 실시간으로 표시

### Skills (Markdown)

도메인 지식을 코드와 분리하여 Markdown 파일로 관리한다.

- **SKILL.md**: 스킬 메타데이터 (이름, 설명, 입력 필드, 프롬프트 템플릿)
- **SkillLoader**: 파일 시스템에서 SKILL.md를 파싱하여 런타임 객체로 변환
- **SkillEvaluator**: 스킬의 프롬프트를 실행하고 결과를 반환
- **BuiltinCatalog**: 앱 시작 시 기본 스킬을 자동으로 scaffold

## 워크플로우 흐름

하나의 워크플로우 요청은 다음 단계를 거쳐 처리된다.

```
Case 생성 → Approval 대기 → Generation 실행 → Evaluation 평가 → Selection 선택 → Translation 번역
```

### 1. Case 생성

사용자가 프론트엔드 StepWizard를 통해 입력을 제출하면 백엔드에 Case가 생성된다. Case는 워크플로우의 최상위 단위이며 모든 후속 처리의 컨테이너 역할을 한다.

### 2. Approval 대기 (HITL)

Human-in-the-Loop 승인 게이트이다. Case 생성 후 자동 실행 전에 관리자의 승인을 기다린다. `approval_service.py`가 승인 상태를 관리하며, 승인 시 SSE 이벤트를 발행하여 프론트엔드에 알린다.

### 3. Generation 실행

승인된 Case에 대해 AI 에이전트가 콘텐츠를 생성한다. `langchain_deep_agent_executor.py`가 LangChain 기반 에이전트를 실행하며, `creative_personas.py`에 정의된 페르소나별로 다양한 결과물을 생성한다. `routing_policy.py`가 Case의 요청에 적합한 스킬을 선택한다.

### 4. Evaluation 평가

생성된 결과물을 스킬 기반으로 평가한다. 각 스킬의 평가 기준에 따라 점수를 산출하고 순위를 매긴다.

### 5. Selection 선택

평가 결과를 기반으로 최종 결과물을 선택한다. 자동 선택 또는 사용자 선택 모드를 지원한다.

### 6. Translation 번역

선택된 결과물을 필요한 언어로 번역한다. 다국어 서비스의 경우 이 단계에서 최종 산출물이 완성된다.

## 레이어 간 통신

| 구간 | 프로토콜 | 설명 |
|------|----------|------|
| Frontend → Backend | REST API | Case 생성, 승인, 조회 등 CRUD 요청 |
| Backend → Frontend | SSE | 처리 진행 이벤트, 승인 상태 변경 알림 |
| Backend → Skills | 파일 I/O | SKILL.md 파싱, 프롬프트 템플릿 로딩 |
| Backend → LLM | Azure OpenAI API | 에이전트 실행, 콘텐츠 생성/평가 |
