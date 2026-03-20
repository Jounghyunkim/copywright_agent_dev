# 재사용 가능한 패턴 카탈로그

ADCOPY 프로젝트에서 추출한 10가지 재사용 패턴을 정리한다. 새로운 워크플로우 서비스를 구축할 때 이 패턴들을 조합하여 사용한다.

---

## 1. HITL Approval (Human-in-the-Loop 승인)

AI 자동 실행 전에 사람의 승인을 요구하는 게이트 패턴이다. Case 생성 후 승인 대기 상태로 전환되며, 관리자가 승인하면 후속 처리가 트리거된다. approval_type별로 분기 로직을 정의할 수 있다.

- **핵심 파일**: `backend/src/app/domain/services/approval_service.py`

## 2. Skill Routing (스킬 라우팅)

사용자 요청의 키워드와 컨텍스트를 분석하여 적합한 스킬을 자동 선택하는 패턴이다. 카테고리와 트리거 키워드를 기반으로 매칭하며, 복수 스킬이 매칭될 경우 우선순위를 적용한다.

- **핵심 파일**: `backend/src/app/domain/services/routing_policy.py`

## 3. Skill Loader (스킬 로더)

파일 시스템의 SKILL.md 파일을 파싱하여 런타임 객체로 변환하는 패턴이다. YAML 프론트매터에서 메타데이터를 추출하고, Markdown 본문에서 프롬프트 템플릿과 평가 기준을 로딩한다. 앱 시작 시 BuiltinCatalog가 기본 스킬을 자동 scaffold한다.

- **핵심 파일**: `backend/src/app/domain/services/skill_loader.py`

## 4. SSE Streaming (서버 이벤트 스트리밍)

백엔드에서 프론트엔드로 실시간 이벤트를 푸시하는 패턴이다. Case 상태 변경, 생성 진행률, 승인 알림 등을 Server-Sent Events로 전달한다. 클라이언트는 EventSource를 통해 구독하며, 연결 끊김 시 자동 재연결한다.

- **핵심 파일**: `backend/src/app/presentation/routes/events.py`

## 5. Persona Generation (페르소나 기반 생성)

동일한 입력에 대해 서로 다른 성격의 페르소나가 각각 결과물을 생성하는 패턴이다. 각 페르소나는 고유한 톤, 스타일, 관점을 가지며, 다양성 있는 결과물을 보장한다. creative_weight 파라미터로 창의성 수준을 조절한다.

- **핵심 파일**: `backend/src/app/domain/services/creative_personas.py`

## 6. Deep Agent Executor (딥 에이전트 실행기)

LangChain 기반 에이전트를 실행하는 패턴이다. 스킬에서 정의된 프롬프트와 도구를 조합하여 멀티스텝 추론을 수행한다. Azure OpenAI와 연동하며, 실행 중 중간 결과를 SSE로 스트리밍한다.

- **핵심 파일**: `backend/src/app/infra/agents/langchain_deep_agent_executor.py`

## 7. Step Wizard (스텝 기반 위자드)

N단계 입력 폼을 상태 머신으로 관리하는 프론트엔드 패턴이다. 각 스텝은 독립적인 검증 로직을 가지며, 이전/다음 네비게이션과 진행 표시기를 제공한다. 스킬의 required_fields에서 동적으로 폼 필드를 생성할 수 있다.

- **핵심 파일**: `frontend/src/pages/new-workflow-page.tsx`

## 8. SSE Bridge (SSE 이벤트 브릿지)

서버에서 수신한 SSE 이벤트를 TanStack Query 캐시 무효화로 연결하는 프론트엔드 패턴이다. 이벤트 타입별로 무효화할 쿼리 키를 매핑하여, 서버 상태 변경 시 관련 UI가 자동으로 갱신된다. 수동 polling 없이 실시간 동기화를 달성한다.

- **핵심 파일**: `frontend/src/hooks/use-sse-bridge.ts`

## 9. Timeline Polling (타임라인 폴링)

처리 진행률을 주기적으로 조회하여 타임라인 UI에 표시하는 패턴이다. SSE가 주요 이벤트를 전달하고, polling은 세부 진행률(퍼센트, 현재 단계)을 보완한다. 처리 완료 시 polling을 자동 중단하여 불필요한 요청을 방지한다.

- **핵심 파일**: `frontend/src/hooks/use-timeline-polling.ts`

## 10. Game Processing Modal (게임형 처리 모달)

AI 처리 대기 시간에 사용자에게 게임형 인터랙션을 제공하는 패턴이다. Phase 기반 애니메이션으로 처리 단계를 시각화하며, 페르소나 아바타가 현재 작업 상태를 표현한다. 대기 시간을 엔터테인먼트로 전환하여 이탈률을 낮춘다.

- **핵심 파일**: `frontend/src/components/game-processing-modal.tsx`

---

## 패턴 조합 가이드

| 시나리오 | 필수 패턴 | 선택 패턴 |
|----------|----------|----------|
| 기본 워크플로우 | HITL Approval, Skill Routing, Skill Loader, Step Wizard | SSE Streaming, SSE Bridge |
| AI 생성 서비스 | 위 전체 + Persona Generation, Deep Agent Executor | Game Processing Modal |
| 실시간 모니터링 | SSE Streaming, SSE Bridge, Timeline Polling | Game Processing Modal |
| 배치 처리 | Skill Routing, Skill Loader, Deep Agent Executor | HITL Approval |
