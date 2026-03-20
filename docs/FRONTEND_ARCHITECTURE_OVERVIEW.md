# Frontend Architecture Overview — Copywrite Agent v3.0

> 최종 업데이트: 2026-03-20

---

## 1. 기술 스택

| 항목 | 상세 |
|---|---|
| Framework | React 18.2.0 (Functional Components + Hooks) |
| Build Tool | Vite 5.0.8 |
| Icon Library | Lucide React 0.300.0 |
| Styling | Inline Styles (CSS-in-JS 패턴, 외부 CSS 파일 없음) |
| State Management | Component-local state (useState/useRef/useEffect, 별도 전역 상태 라이브러리 없음) |
| 개발 서버 | `npm run dev` → Vite dev server (기본 포트 5173) |

---

## 2. 프로젝트 구조

```
frontend/
├── index.html                  # 엔트리 HTML (spin 애니메이션 keyframes 포함)
├── package.json                # 의존성 및 스크립트
├── vite.config.js              # Vite 설정 + API 프록시
├── src/
│   ├── main.jsx                # React DOM 렌더링 진입점
│   ├── App.jsx                 # 루트 컴포넌트 (뷰 라우팅 + 백엔드 헬스체크)
│   ├── styles/
│   │   └── theme.js            # 디자인 시스템 (COLORS 상수)
│   ├── pages/
│   │   ├── Dashboard.jsx       # 프로젝트 대시보드 (목데이터)
│   │   └── Editor.jsx          # 메인 캠페인 에디터 (핵심 페이지)
│   ├── components/
│   │   ├── Header.jsx          # 상단 헤더 + 백엔드 상태 램프
│   │   ├── BriefingForm.jsx    # LG 표준 브리프 입력 폼 (좌측 패널)
│   │   ├── WorkflowStepper.jsx # 5단계 워크플로우 진행 표시기
│   │   ├── EditorViews.jsx     # 뷰 분기 + ReviewView (v3.0: 결과카드/요약)
│   │   ├── AnalysisReport.jsx  # 시장 분석 리포트 시각화 (10개 카드)
│   │   ├── GenerationConfig.jsx # 카피 생성 설정 (국가/연령/페르소나/스킬셋)
│   │   ├── StrategicMessage.jsx # 전략 메시지 표시/편집
│   │   ├── CopyResults.jsx     # 생성된 카피 결과 표시
│   │   └── SidebarToggle.jsx   # 사이드바 토글 (현재 미사용)
│   └── data/
│       ├── mockData.js         # 테스트용 목데이터
│       └── brief_guide.txt     # LG 브리프 작성 가이드 원문
├── dist/                       # 빌드 산출물
└── tests_backup/               # 백업된 테스트 파일
```

---

## 3. 디자인 시스템 (theme.js)

```javascript
export const COLORS = {
  LG_RED: '#A50034',         // LG 브랜드 메인 레드
  LG_RED_LIGHT: '#C21E4A',   // 라이트 레드
  BG_GRAY: '#F8F9FA',        // 배경 그레이
  SIDEBAR_BG: '#FFFFFF',     // 사이드바 배경
  TEXT_MAIN: '#2D2D2D',      // 본문 텍스트
  TEXT_SUB: '#6E6E73',       // 보조 텍스트
  BORDER: '#E5E5E7',         // 테두리
  WHITE: '#FFFFFF',          // 순백
  SUCCESS: '#34C759',        // 성공/연결 상태 (초록)
  SHADOW: 'rgba(0,0,0,0.08)' // 그림자
};
```

- **폰트**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif`
- **모서리 반경**: 8px(input) ~ 20px(card) 범위
- **그림자/효과**: Glassmorphic blur(`blur(20px)`), LG Red glow(`rgba(165,0,52,0.2)`)
- **트랜지션**: `0.2s~0.3s ease` 기본, 특수 효과에 `cubic-bezier(0.4,0,0.2,1)`

---

## 4. 컴포넌트 상세

### 4.1 App.jsx (루트)

| 항목 | 내용 |
|---|---|
| State | `view` ('dashboard' / 'editor'), `backendConnected` (boolean) |
| 기능 | 15초 주기 `/health` 폴링으로 백엔드 연결 상태 모니터링 |
| 라우팅 | `view` 상태로 Dashboard ↔ Editor 전환 (라이브러리 없음) |

### 4.2 Header.jsx

| Prop | 타입 | 설명 |
|---|---|---|
| `setView` | function | 뷰 전환 콜백 |
| `backendConnected` | boolean | 연결 상태 (기본 true) |

- 로고 클릭 → Dashboard로 이동
- "V 2.0 PREMIUM ENGINE" 옆 상태 램프: 연결 시 초록(glow), 끊김 시 빨강(glow)
- 우측: "Knowledge Base Ready" 표시, Settings 아이콘

### 4.3 Dashboard.jsx

- 4열 통계 그리드 (Total Projects, Avg Brand Score, Target Regions, Generation Time)
- 최근 캠페인 3건 목록 (목데이터, 검색 UI 포함)
- "New Campaign" 버튼 → Editor 뷰로 전환

### 4.4 Editor.jsx (핵심 페이지)

| State | 타입 | 설명 |
|---|---|---|
| `step` | number(1-5) | 워크플로우 단계 |
| `isAnalyzing` | boolean | 분석 API 호출 중 |
| `analysisResult` | object/null | 백엔드 분석 결과 |
| `isApproved` | boolean | HITL 승인 여부 |
| `chatMessages` | array | 채팅 메시지 이력 |
| `chatInput` | string | 채팅 입력값 |
| `isChatLoading` | boolean | 채팅 API 호출 중 |
| `leftRatio` | float(0-1) | 좌/우 패널 비율 (초기 0.4) |
| `isDragging` | boolean | 패널 경계 드래그 중 |
| `isReviewing` | boolean | Review SSE 진행 중 (v3.0) |
| `reviewResults` | array | 스킬별 결과 누적 (v3.0) |
| `reviewSummary` | object/null | 리뷰 요약 {total, passed, avgScore} (v3.0) |
| `availableSkills` | array/null | API 스킬 목록 (빌트인+커스텀) (v3.0) |

**레이아웃**:
```
┌─────────────────────────────────────────────┐
│ WorkflowStepper (Briefing → Analysis → Strategic Message → ...) │
├──────────────┬──┬───────────────────────────┤
│ BriefingForm │▎│ Messages Area             │
│ (Left Panel) │▎│   InitialView / ResultView│
│              │▎│   Chat Messages           │
│              │▎├───────────────────────────┤
│              │▎│ Chat Input Bar            │
└──────────────┴──┴───────────────────────────┘
       40%     6px         60%
          ← 드래그 가능 →
```

- **드래그 리사이즈**: 6px 핸들, 최소 320px/패널, 드래그 중 전체화면 오버레이
- **가이드 연동**: BriefingForm의 돋보기 클릭 → 채팅 영역에 AI 메시지로 가이드 삽입

### 4.5 BriefingForm.jsx

**9개 섹션 (LG 표준 브리프)**:

| 섹션 | 필드 | 필수 |
|---|---|---|
| Project | projectName, date | Y |
| 1. Project Context | projectContext | Y |
| 2. Objective | objectiveCommercial, objectiveBehavior, objectiveAttitudinal | Y |
| 3. Audience | audience | Y |
| 4. Key Message | keyMessage | Y |
| 5. Proof Points | proofPoints | Y |
| 6. Mandatories | mandatories | N |
| 7. Budget | budget | N |
| 8. Market Needs | marketNeeds | Y |
| 9. Timing | timing | Y |

**주요 기능**:
- 섹션 접기/펼치기 (ChevronDown/Right)
- 섹션 타이틀 옆 돋보기 아이콘 → 채팅에 상세 가이드 삽입
- `AI 자동생성` 버튼 (Project Name 옆) → `/api/v1/campaigns/generate-brief` 호출
- 필수 필드 미입력 시: 빨간 테두리, 접힌 섹션에 빨간 점 표시, 첫 미완료 섹션 자동 펼침
- `field.required` 속성을 단일 진실 공급원(single source of truth)으로 사용

### 4.6 AnalysisReport.jsx (10개 카드 리포트)

12컬럼 CSS Grid 레이아웃으로 10개 분석 카드 + HITL 액션 카드를 렌더링:

| # | 카드 | 너비 | 데이터 소스 |
|---|---|---|---|
| 1 | Brief Summary & AI Direction | span 12 | `briefSummary.{objective, coreChallenge, aiDirection, toneRole}` |
| 2 | Deep-dive Persona | span 7 | `persona.{avatar, name, belief, frustration, purchaseTrigger, emotionalTriggerWords[]}` |
| 3 | Brand Fit Score | span 5 | `brandFit.{score, functionalFit, emotionalFit, culturalFit}` |
| 4 | Market Opportunity & Risk | span 12 | `marketAnalysis.{opportunityGap, riskKeyword}` |
| 5 | Competitive Keywords | span 6 | `competitiveKeywords[{word, count}]` — 수평 바 차트 |
| 6 | Untapped Keywords | span 6 | `marketAnalysis.untappedKeywords[]` — 태그 표시 |
| 7 | Category Narrative Shift | span 12 | `categoryNarrative.{oldNarrative, newNarrative}` — Old→New 화살표 |
| 8 | Emotional JTBD | span 6 | `emotionalJTBD` — 인용 블록 |
| 9 | Cultural Tension Map | span 6 | `culturalTension.tensions[]` — 넘버링 리스트 |
| 10 | Copy Implications & Guardrails | span 12 | `copyImplications.{doList[], dontList[]}` — DO/DON'T 2컬럼 태그 |
| 11 | Recommended Keywords | span 12 | `recommendedKeywords[]` — 초록 태그 |
| HITL | Approve & Strategic Message / Modify Brief 버튼 | span 12 | 승인 전에만 표시 |

모든 신규 필드는 `|| {}` fallback으로 안전하게 접근하여 기존 데이터와도 호환됩니다.

### 4.7 WorkflowStepper.jsx

5단계 수평 스텝퍼:
1. **Briefing** (FileText) → 2. **Analysis** (Search) → 3. **Strategic Message** (MessageSquareText) → 4. **Generation** (Zap) → 5. **Review** (CheckCircle)

- 완료 단계: 초록 체크마크 + SUCCESS 색상
- 현재 단계: LG Red 하단 바 + 강조 아이콘
- 단계 간 커넥터 라인 (완료 시 초록)

### 4.8 EditorViews.jsx

- **InitialView**: AI 인사말 + "Ready to Create" 안내 (분석 전)
- **ResultView**: AI 응답 버블 + AnalysisReport 컴포넌트 (분석 후)
- **StrategicMessageView**: 전략 메시지 표시 + 승인/수정 HITL
- **GenerationConfigView**: 카피 생성 설정 + 결과 표시
- **ReviewView** (v3.0): 리뷰 설정 + API 스킬 목록 + 결과 표시

### 4.9 ReviewView 상세 (v3.0 추가)

**Target Copy 섹션**: 생성된 카피를 국가별로 그룹화, 체크박스로 리뷰 대상 선택

**Use Skillsets 섹션**:
- `GET /api/v1/skills` API에서 빌트인 + 커스텀 스킬 동적 로딩
- 각 스킬에 `builtin`(파랑) / `custom`(주황) 타입 배지 표시
- 토글 스위치로 개별 활성화/비활성화
- 폴백: API 로딩 실패 시 `GenerationConfig.SKILLSETS` 하드코딩 목록 사용

**Submit Review**: `POST /api/v1/campaigns/review` SSE 스트림 호출

**ReviewResultCard** — 개별 스킬 실행 결과:
- pass/fail 배경색 (초록/빨강), score 배지, 실행시간
- findings: severity별 색상 아이콘 (high=빨강, medium=주황, low=파랑)
- suggestions: 원본(취소선) → 제안(볼드 초록) 표시

**ReviewSummaryCard** — 전체 리뷰 요약:
- 다크 그라디언트 배경 (`#1a1a2e → #16213e`)
- 3-column: Total Checks / Passed / Avg Score

---

## 5. 데이터 흐름

```
App (backendConnected, view)
 ├─ Header ← backendConnected
 ├─ Dashboard ← setView
 └─ Editor (step, analysisResult, chatMessages, leftRatio)
     ├─ WorkflowStepper ← currentStep
     ├─ BriefingForm ← onStartAnalysis, isAnalyzing, isDisabled, onGuideSelect
     │    ├─ handleAutoGenerate() → POST /api/v1/campaigns/generate-brief
     │    ├─ onGuideSelect(guideInfo) → chatMessages에 가이드 추가
     │    └─ onStartAnalysis(formData) → handleStartAnalysis()
     ├─ EditorViews
     │    └─ AnalysisReport ← analysisResult, onApprove, onModify
     └─ Chat Interface
          └─ handleChatSend() → POST /api/v1/campaigns/chat
```

---

## 6. API 연동

### Vite Proxy 설정 (`vite.config.js`)

```javascript
proxy: {
  '/api':    { target: 'http://localhost:5000', changeOrigin: true },
  '/health': { target: 'http://localhost:5000', changeOrigin: true },
}
```

### 엔드포인트 목록

| 메서드 | 경로 | 호출 컴포넌트 | 설명 |
|---|---|---|---|
| GET | `/health` | App.jsx | 15초 주기 헬스체크, `status === 'healthy'` 검증 |
| POST | `/api/v1/campaigns/analyze` | Editor.jsx | 브리프 제출 → 시장 분석 리포트 (SSE) |
| POST | `/api/v1/campaigns/strategic-message` | Editor.jsx | 분석 결과 → 전략 메시지 추출 |
| POST | `/api/v1/campaigns/generate-copy` | Editor.jsx | 국가/페르소나별 카피 생성 |
| POST | `/api/v1/campaigns/generate-brief` | BriefingForm.jsx | 프로젝트명 → AI 브리프 초안 생성 |
| POST | `/api/v1/campaigns/chat` | Editor.jsx | 대화 이력 전송 → AI 응답 |
| **POST** | **`/api/v1/campaigns/review`** | **Editor.jsx** | **Review 실행 — SSE 스트림 (v3.0)** |
| **GET** | **`/api/v1/skills`** | **Editor.jsx** | **스킬 목록 로딩 — 앱 초기화 시 (v3.0)** |

---

## 7. 사용자 흐름

### Flow 1: 캠페인 생성
1. Dashboard → "New Campaign" 클릭 → Editor 진입 (Step 1)
2. BriefingForm 9개 섹션 작성 (또는 AI 자동생성)
3. "Submit Brief & Analyze" 클릭 → 백엔드 분석 API 호출
4. Step 2로 이동 → AnalysisReport 10개 카드 표시
5. "Approve & Strategic Message" 또는 "Modify Brief" 선택
6. Step 3(Strategic Message)으로 이동 → 전략 메시지 수립

### Flow 2: AI 자동생성
1. Project Name 입력 → "AI 자동생성" 버튼 클릭
2. `/api/v1/campaigns/generate-brief` 호출
3. 응답 JSON으로 모든 필드 자동 채움 (projectName, date 유지)
4. 모든 섹션 자동 펼침 → 사용자 검토/수정

### Flow 3: 가이드 참조 + 채팅
1. 섹션 타이틀 옆 돋보기 클릭 → 채팅 영역에 가이드 AI 메시지 추가
2. 사용자가 추가 질문 입력 → `/api/v1/campaigns/chat` 호출
3. AI 응답이 채팅 버블로 표시

### Flow 4: Skillset Review (v3.0)
1. Step 4(Generation) → 카피 생성 완료 → "Review" 버튼 클릭
2. Step 5 진입 → ReviewView 렌더링
3. 좌측 패널: 생성된 카피 확인 (CollapsibleSection)
4. 우측 Review Settings: 리뷰 대상 카피 체크 + 스킬셋 토글
5. "Submit Review" 클릭 → `POST /api/v1/campaigns/review` SSE 호출
6. 실시간으로 스킬별 결과 카드 누적 표시
7. 전체 완료 시 요약 카드 (Total/Passed/AvgScore) 표시
8. 결과는 PostgreSQL에 영구 저장 (세션별 이력 조회 가능)

---

## 8. 에러 처리 및 UX

- **API 실패**: try/catch + alert 메시지 + console.error
- **채팅 실패**: 에러 메시지가 AI 버블로 표시 ("죄송합니다. 응답 중 오류가 발생했습니다.")
- **폼 유효성**: 빨간 테두리 + 미완료 섹션 빨간 점 + 첫 미완료 섹션 자동 펼침
- **로딩 상태**: `isAnalyzing` / `isChatLoading` / `isGenerating` 각각 독립 관리, Loader 스피너
- **백엔드 연결**: 초기 `false` → 헬스체크 성공 시 `true`, 실패 시 Header 램프 빨간색
