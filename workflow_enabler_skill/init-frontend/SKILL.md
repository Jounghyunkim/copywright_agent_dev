---
name: init-frontend
description: "React 프론트엔드를 초기화한다. 스텝 기반 위자드 UX, SSE 이벤트 브릿지, 처리 모달, 페르소나 아바타를 포함한다."
user-invocable: true
argument-hint: "[project-dir]"
context: fork
allowed-tools: Bash, Write, Read, Edit
---

# React 프론트엔드 초기화

## 개요

워크플로우 기반 AI 서비스를 위한 React 프론트엔드를 생성한다.

## 기술 스택

- React 19 + TypeScript + Vite
- React Router (라우팅)
- TanStack Query (서버 상태)
- Zustand (클라이언트 상태)
- CSS Variables 기반 토큰 시스템

## 생성할 디렉토리 구조

```
{project-dir}/frontend/
├── src/
│   ├── main.tsx                    # React root
│   ├── app/
│   │   ├── providers.tsx           # QueryClient + EventBridge
│   │   └── router.tsx              # React Router 라우트 정의
│   ├── pages/
│   │   ├── home/                   # 홈 랜딩 페이지
│   │   ├── new-workflow/           # 스텝 기반 위자드
│   │   ├── workflow-list/          # 워크플로우 목록
│   │   ├── workflow-detail/        # 워크플로우 상세 (타임라인, 결과)
│   │   ├── settings/               # 설정 (Danger Zone)
│   │   └── login-page.tsx
│   ├── shared/
│   │   ├── api/
│   │   │   ├── client.ts           # fetch wrapper (get/post/patch)
│   │   │   └── types.ts            # API 타입 정의
│   │   ├── state/
│   │   │   ├── event-bridge.tsx    # SSE → TanStack Query invalidation
│   │   │   └── ui-store.ts        # Zustand (sseConnected, processingStatus)
│   │   ├── styles/
│   │   │   ├── tokens.css          # CSS 변수 (색상, 간격)
│   │   │   └── globals.css         # 글로벌 레이아웃
│   │   ├── ui/
│   │   │   ├── app-shell.tsx       # 사이드바 + 톱니바퀴 메뉴
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── field.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx           # 우측 하단 토스트 알림
│   │   │   ├── processing-modal.tsx # 타임라인 polling 모달
│   │   │   ├── game-processing-modal.tsx # 게임형 처리 모달
│   │   │   └── persona-avatar.tsx  # SVG 아바타 (hover 표정 변화)
│   │   └── lib/
│   │       ├── format.ts           # 날짜 포맷
│   │       └── skill-labels.ts     # 스킬 한국어 라벨 맵
│   ├── features/
│   │   ├── case/api.ts             # 워크플로우 API hooks
│   │   ├── approval/api.ts         # 결재 API hooks
│   │   ├── skill-registry/api.ts   # 스킬 API hooks
│   │   └── skill-authoring/api.ts  # 스킬 작성 API hooks
│   └── widgets/
│       ├── case-timeline/          # 타임라인 이벤트 렌더링
│       └── approval-inbox/         # 결재함 테이블
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 핵심 패턴

### 1. 스텝 기반 위자드 UX
[step-wizard.tsx.template 참조](templates/step-wizard.tsx.template)

상태 머신:
- Step 타입: 1 | 2 | 3 | ... | N
- HUMAN 스텝: 입력 폼 → 사용자 클릭으로 전환
- AI 스텝: 인라인 애니메이션 + timeline polling → 자동 전환 또는 결과 확인 후 수동 전환
- URL query param resume: ?caseId=xxx&step=N

API 호출 시퀀스:
- Step 1 → POST /cases → GET /approvals/inbox → POST /approvals/{id}/approve (fire-and-forget)
- Step 2~3 → GET /cases/{id}/timeline (1.5초 polling)
- Step 4 → POST /approvals/{id}/approve (fire-and-forget)
- 완료 → GET /cases/{id}/artifacts

### 2. SSE 이벤트 브릿지
[event-bridge.tsx.template 참조](templates/event-bridge.tsx.template)

- EventSource 연결 → onmessage → JSON 파싱
- event_type에 따라 TanStack Query key invalidation
- processingStatus 업데이트 (Zustand)
- 연결 상태 관리 (sseConnected)

### 3. 타임라인 polling
[processing-modal.tsx.template 참조](templates/processing-modal.tsx.template)

- createPortal로 body에 렌더링
- caseId가 있으면 1.5초 간격으로 GET /cases/{id}/timeline
- 이벤트 → 한국어 상태 메시지 변환 (EVENT_LABELS 맵)
- approve 핸들러가 event loop을 블록할 때 SSE 대안으로 사용

### 4. AppShell 레이아웃
- 좌측 사이드바: 메인 메뉴 (NavLink)
- 하단 톱니바퀴: 팝업 메뉴 (설정, 스킬, 상세 로그)
- 상단 Topbar: 서비스명, 권한 표시
- SSE 끊김 시 Toast 표시

## 도메인 커스터마이징 포인트

1. `app-shell.tsx` — 서비스명, 메뉴 항목, 색상
2. `new-workflow-page.tsx` — 스텝 수, 라벨, 입력 필드
3. `home-page.tsx` — 랜딩 페이지 콘텐츠
4. `tokens.css` — 브랜드 색상
5. `event-bridge.tsx` — 이벤트 타입 → 상태 메시지 매핑
6. `skill-labels.ts` — 스킬 한국어 라벨
