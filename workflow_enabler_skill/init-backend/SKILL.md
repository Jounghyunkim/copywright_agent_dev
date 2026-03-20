---
name: init-backend
description: "FastAPI 백엔드를 초기화한다. HITL 승인 워크플로우, 스킬 라우팅, SSE 이벤트 스트리밍, Deep Agent 실행기를 포함한다."
user-invocable: true
argument-hint: "[project-dir] [domain-name]"
context: fork
allowed-tools: Bash, Write, Read, Edit
---

# FastAPI 백엔드 초기화

## 개요

워크플로우 기반 AI 서비스를 위한 FastAPI 백엔드를 생성한다.

인자:
- `$ARGUMENTS[0]`: 프로젝트 디렉토리
- `$ARGUMENTS[1]`: 도메인 이름

## 생성할 디렉토리 구조

```
{project-dir}/backend/
├── src/app/
│   ├── main.py              # FastAPI 앱 부팅, CORS, DB 초기화, 라우터 등록
│   ├── config.py            # Pydantic Settings (환경변수 기반)
│   ├── api/
│   │   ├── deps.py          # get_db, get_auth_context 의존성
│   │   ├── routers/
│   │   │   ├── cases.py     # Case CRUD + 취소
│   │   │   ├── approvals.py # 5가지 승인 액션 (approve/edit/reject/request-alternative/escalate)
│   │   │   ├── events.py    # SSE 스트리밍 (0.5초 polling)
│   │   │   ├── skills.py    # 스킬 카탈로그 + publish (channel: review/prod)
│   │   │   ├── admin.py     # 시스템 초기화 (DB truncate + 사용자 스킬 삭제)
│   │   │   └── health.py    # 헬스체크
│   │   └── schemas/         # Pydantic 요청/응답 모델
│   ├── domain/
│   │   └── services/
│   │       ├── case_service.py       # Case 생성 → 승인 게이트 자동 생성
│   │       ├── approval_service.py   # HITL 의사결정 + asyncio.to_thread 비동기 처리
│   │       └── generation_service.py # 페르소나 기반 생성 + 스킬 평가 + 2축 랭킹
│   └── infra/
│       ├── agents/
│       │   ├── deep_agent_executor.py       # Custom 2단 planner/executor
│       │   ├── langchain_deep_agent_executor.py  # Native Deep Agent (FilesystemBackend)
│       │   └── creative_personas.py         # 10명 페르소나 + 캠페인 기반 자동 선택
│       ├── db/
│       │   ├── models/core.py    # WorkRequest, WorkflowInstance, ApprovalRequest, Artifact, ExecutionEvent 등
│       │   ├── repositories/     # cases.py, approvals.py, artifacts.py
│       │   └── session.py        # SQLAlchemy 세션
│       ├── llm/
│       │   └── client.py         # Azure OpenAI 클라이언트
│       └── skills/
│           ├── loader.py         # 파일 시스템 기반 스킬 탐색
│           ├── parser.py         # YAML frontmatter + 본문 파싱
│           ├── evaluator.py      # frontmatter 필수 필드 검사
│           ├── requirements.py   # 입력 필드 → HITL 폼 필드 변환
│           ├── routing_policy.py # 키워드 기반 스킬 선택 + 카테고리 보장
│           └── builtin_catalog.py # 빌트인 스킬 scaffold 자동 생성
├── pyproject.toml
└── main.py                  # uvicorn 진입점
```

## 핵심 패턴 설명

### HITL 승인 게이트웨이
[approval_service.py.template 참조](templates/approval_service.py.template)

- approval_type별 분기 (예: brand_manager_review → 생성 트리거, copy_selection → 번역 트리거)
- missing_fields 검증: 모든 required_fields가 payload에 있는지 확인
- asyncio.to_thread: 무거운 LLM 처리를 별도 스레드에서 실행하여 event loop 비차단
- 이벤트 기록: APPROVAL_RESOLVED, CASE_STATUS_CHANGED 등

### 스킬 라우팅 정책
[routing_policy.py.template 참조](templates/routing_policy.py.template)

- BASE_REQUIRED: 항상 포함되는 필수 스킬
- EXCLUDED_SKILLS: 평가에서 제외할 스킬
- 정규식 트리거: objective/constraints 텍스트 매칭 → 스킬 추가
- 카테고리 보장: 각 카테고리에서 최소 1개
- DEEPAGENTS_MAX_SKILLS: 0 = 무제한

### SSE 이벤트 스트리밍
[events_router.py.template 참조](templates/events_router.py.template)

- execution_events 테이블을 polling (0.5초 간격)
- incremental cursor 기반 (WHERE id > cursor)
- DB 장애 시 keep-alive 유지
- StreamingResponse + text/event-stream

### 페르소나 기반 생성
- 10명 페르소나 정의 (각각 다른 system_prompt_suffix + temperature + tags)
- select_personas_for_campaign(): 캠페인 목표 키워드 → 태그 매칭 → 최적 5명 선택
- ThreadPoolExecutor 병렬 seed 생성 + 변형 생성

### 2축 평가 시스템
- safety_score: 컴플라이언스/품질 스킬 점수 평균
- creative_score: creative-impact-scorer 스킬 점수
- total_score = safety × (1-CREATIVE_WEIGHT) + creative × CREATIVE_WEIGHT
- hard_fail: 6개 컴플라이언스 스킬만 탈락 가능, 나머지는 감점

## 도메인 커스터마이징 포인트

생성 후 `{domain-name}`에 맞게 수정할 부분:
1. `config.py` — APP_NAME, DATABASE_URL
2. `case_service.py` — request_type 목록, 기본 스킬
3. `approval_service.py` — approval_type별 핸들러
4. `creative_personas.py` — 도메인별 페르소나, 태그 규칙
5. `routing_policy.py` — BASE_REQUIRED, EXCLUDED_SKILLS, 카테고리, 트리거
6. `generation_service.py` — LLM 프롬프트, 출력 형식
