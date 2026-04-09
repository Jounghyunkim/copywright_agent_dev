# Skill System 적용에 따른 UI 변경 사항

> Backend의 DeepAgent + SKILL.md 스킬 시스템 도입에 따른 Frontend 변경 내역

---

## 1. 변경 파일 목록

| 파일 | 변경 유형 | 요약 |
|------|----------|------|
| `frontend/src/shared/api/types.ts` | 수정 | 신규 타입 5개 추가 |
| `frontend/src/features/skill-registry/api.ts` | 수정 | React Query hooks 3개 추가 |
| `frontend/src/components/GenerationConfig.jsx` | 수정 | 국가 확장 + AI Writer 페르소나 섹션 추가 |
| `frontend/src/pages/new-workflow/new-workflow-page.tsx` | 수정 | 페르소나 후보 생성 플로우 연동 |
| `frontend/src/components/EditorViews.jsx` | 수정 | 후보 탭 + 스킬 배지 + 국가 확장 |
| `frontend/src/components/CopyResults.jsx` | 수정 | 국가 메타데이터 확장 |

---

## 2. 신규 타입 정의 (`types.ts`)

```typescript
// AI Writer 페르소나
interface AIPersona {
  id: string        // "writer-metaphor-master"
  name: string      // "Emotion"
  avatar: string    // "🎨"
  color: string     // "#FF6B6B"
  tags: string[]    // ["branding", "emotion", "premium"]
  temperature: number // 0.9
}

// 국가별 문화 프로필
interface CultureProfile {
  id: string          // "culture-japan"
  description: string // "일본 문화 프로필..."
  country_code: string // "JP"
}

// 페르소나별 카피 후보
interface CopyCandidate {
  persona_id: string
  persona_name: string
  persona_avatar: string
  copies: CopyResult[]
  selected_skills: string[]
  skill_reviews: Record<string, string>
}

// 후보 생성 결과
interface CopyCandidateResult {
  candidates: CopyCandidate[]
  selected_personas: Array<{ id: string; name: string; avatar: string }>
  elapsed_ms: number
}

// Skill 타입 확장
type: 'builtin' | 'custom' | 'skillmd'  // skillmd 추가
```

---

## 3. 신규 API Hooks (`skill-registry/api.ts`)

| Hook | 엔드포인트 | 반환 |
|------|-----------|------|
| `useSkillCatalog()` | `GET /api/v1/skills/catalog` | 전체 스킬 카탈로그 (61개, 카테고리별 분류) |
| `usePersonas()` | `GET /api/v1/personas` | AI Writer 페르소나 목록 (10개) |
| `useCultureProfiles()` | `GET /api/v1/culture-profiles` | 국가별 문화 프로필 목록 (20개국) |

---

## 4. UI 변경 상세

### 4-A. Generation Config (Step 4)

#### 국가 선택 확장: 12개국 → 20개국

**추가된 국가:**
JP (일본), CN (중국), NL (네덜란드), PL (폴란드), SE (스웨덴), TH (태국), CA (캐나다), MX (멕시코)

**그리드 레이아웃:** 3열 → 4열 변경 (더 많은 국가 수용)

#### AI Writer Personas 섹션 (신규)

Generation Config 하단에 새로운 섹션이 추가됨:

```
┌──────────────────────────────────────────────┐
│ ✨ AI WRITER PERSONAS                        │
│   — 다양한 스타일의 카피를 병렬 생성합니다      │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ [토글] 페르소나 후보 경쟁 모드             │ │
│ │ 선택한 AI Writer별로 카피를 병렬 생성하여  │ │
│ │ 최적 후보를 비교합니다                    │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────┐ ┌─────────────────────┐  │
│ │ 🎨 Emotion       │ │ 👑 Signature        │  │
│ │ branding emotion │ │ premium luxury      │  │
│ │ premium          │ │ lifestyle           │  │
│ └─────────────────┘ └─────────────────────┘  │
│ ┌─────────────────┐ ┌─────────────────────┐  │
│ │ ⚡ Spark         │ │ 📖 Warmth           │  │
│ │ sns digital      │ │ branding emotion    │  │
│ │ young            │ │ lifestyle           │  │
│ └─────────────────┘ └─────────────────────┘  │
│         ... (10개 AI Writer)                  │
└──────────────────────────────────────────────┘
```

**동작:**
- 토글 OFF (기본): 기존과 동일하게 단일 카피 생성 (`POST /generate-copy`)
- 토글 ON: 선택한 AI Writer별로 병렬 카피 생성 (`POST /generate-copy-candidates`)

**Submit 버튼 변화:**
- 기본 모드: `[→] Generate Copy`
- 페르소나 모드: `[✨] Generate with 3 Writers`

---

### 4-B. Copy Results (Step 4 결과)

#### 페르소나 후보 탭 (신규)

페르소나 모드로 생성한 경우, 결과 상단에 Writer별 탭이 표시됨:

```
┌──────────────────────────────────────────────┐
│ 카피 생성이 완료되었습니다! ✅                 │
│ 3명의 AI Writer가 각각 카피를 생성했습니다.    │
│ 아래 탭에서 페르소나별 결과를 비교하고         │
│ 최적 후보를 선택하세요.                       │
└──────────────────────────────────────────────┘

┌──────────┐ ┌──────────────┐ ┌────────────┐
│🎨 Emotion │ │👑 Signature  │ │📖 Warmth   │
│ (active)  │ │              │ │            │
└──────────┘ └──────────────┘ └────────────┘

┌──────────────────────────────────────────────┐
│ SKILL REVIEWS                                │
│ tone-and-voice-enforcer  감성적 톤 잘 유지됨   │
│ brand-lexicon-check      LG 용어 적절히 사용   │
│ headline-body-cta-...    구조적 흐름 양호      │
└──────────────────────────────────────────────┘

[기존 CopyResults 컴포넌트 — 국가별 카피 표시]
```

**동작:**
- 탭 클릭 시 해당 페르소나의 카피 결과로 전환
- 각 후보의 스킬 리뷰 요약이 함께 표시됨
- 선택한 후보의 카피가 하단 CopyResults에 렌더링

---

### 4-C. Review Settings (Step 5)

#### 스킬 목록 확장

기존 6개 빌트인 스킬에서 **최대 61개** (API에서 로딩)로 확장. 각 스킬에 타입/카테고리 배지 표시:

```
┌──────────────────────────────────────────────┐
│ USE SKILLSETS (61 available)                  │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ brand-lexicon-check                      │ │
│ │ [builtin] [validation]                   │ │
│ │ LG 브랜드 용어 가이드라인 준수 검증       │ [ON]│
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ compliance-redflag-detector              │ │
│ │ [skillmd] [validation]                   │ │
│ │ 법적/규제 레드플래그 감지 및 자동 차단     │ [ON]│
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ copy-scorecard-generator                 │ │
│ │ [skillmd] [validation]                   │ │
│ │ 5차원 종합 품질 스코어카드 생성           │ [OFF│
│ └──────────────────────────────────────────┘ │
│         ...                                  │
└──────────────────────────────────────────────┘
```

**배지 색상:**

| 타입 배지 | 색상 |
|----------|------|
| `builtin` | 파랑 (`#2563EB` / `#EFF6FF`) |
| `skillmd` | 초록 (`#15803D` / `#F0FDF4`) |
| `custom` | 주황 (`#C2410C` / `#FFF7ED`) |

| 카테고리 배지 | 색상 |
|-------------|------|
| `validation` | 황금 (`#92400E` / `#FEF3C7`) |
| `generation` | 파랑 (`#1E40AF` / `#DBEAFE`) |
| `localization` | 보라 (`#3730A3` / `#E0E7FF`) |

---

## 5. 데이터 흐름 변경

### 기존 (Standard Mode)

```
GenerationConfig → config → POST /generate-copy → CopyResult[] → CopyResults
```

### 신규 (Persona Mode)

```
GenerationConfig
  ├─ config.usePersonaMode = true
  ├─ config.selectedWriters = ["writer-metaphor-master", "writer-storyteller", ...]
  ↓
POST /generate-copy-candidates
  ↓
CopyCandidateResult
  ├─ candidates[0] = { persona_id, copies[], skill_reviews{} }
  ├─ candidates[1] = { ... }
  └─ candidates[2] = { ... }
  ↓
CopyResultsView
  ├─ 페르소나 탭 (candidates 배열에서 렌더링)
  ├─ 탭 선택 → setCopyResults(candidates[idx].copies)
  └─ CopyResults (현재 선택된 후보의 copies 표시)
```

### Review 데이터 흐름

```
기존: availableSkills (6개 builtin) → ReviewView → 토글 선택 → POST /review
신규: availableSkills (61개 all)    → ReviewView → 토글 선택 → POST /review
                                     ├─ [builtin] Python 함수 실행
                                     ├─ [skillmd] SKILL.md → LLM 프롬프트 실행
                                     └─ [custom]  Template → LLM 프롬프트 실행
```

---

## 6. State 변경 사항 (`new-workflow-page.tsx`)

| State | 타입 | 용도 |
|-------|------|------|
| `copyCandidates` | `Record<string, unknown> \| null` | 페르소나 후보 생성 결과 전체 |
| `selectedCandidateIdx` | `number` | 현재 선택된 페르소나 후보 인덱스 |

**기존 state 영향:**
- `copyResults` — 페르소나 모드에서는 선택된 후보의 copies가 여기에 설정됨
- `availableSkills` — API에서 61개 스킬(builtin + skillmd + custom)을 로딩

---

## 7. 호환성

- 페르소나 모드 토글이 **OFF**(기본)이면 기존과 완전히 동일하게 동작
- 기존 `POST /generate-copy` 엔드포인트는 그대로 유지 (DeepAgent 기반으로 내부 변경)
- `POST /review` 엔드포인트도 그대로 유지 (skillmd 타입만 내부에서 새로운 실행 경로)
- 기존 저장된 캠페인 로딩 시 `copyCandidates`가 없으면 기존 `copyResults`만 사용
