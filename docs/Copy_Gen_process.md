# Copy Generation Process (카피 생성 프로세스)

> "카피 생성 조건" 설정 후 "카피 생성" 버튼 클릭 시 내부 동작을 정리한 문서.

---

## 1. 전체 흐름 개요

```
[사용자]
  │  카피 생성 조건 입력 (국가, 연령대, 페르소나, 변형 수)
  │  "카피 생성 →" 버튼 클릭
  ▼
[Frontend — GenerationConfig]
  │  GenerationConfig 객체 생성
  ▼
[Frontend — EditorPage]
  │  brief + analysisReport + strategicMessage + config 결합
  │  GenerateCopyRequest 구성
  ▼
[POST /api/v1/campaigns/generate-copy]  (JSON, 동기 응답)
  │
  ▼
[Backend — main.py]
  │  DeepAgentExecutor 인스턴스 생성
  ▼
[DeepAgentExecutor.generate_copy()]
  │
  │  ① 스킬 자동 선택 (LLM 기반 플래닝)
  │  ② 스킬 컨텍스트 빌드 (SKILL.md body 로드)
  │  ③ 시스템 프롬프트 구성 (config + 스킬 + 규칙)
  │  ④ LLM 호출 (Azure OpenAI, temperature 0.7)
  │  ⑤ JSON 파싱 → CopyResult[]
  │  ⑥ 스킬 리뷰 요약 생성 (LLM, temperature 0.2)
  │
  ▼
[Response: { status, data: CopyResult[] }]
  │
  ▼
[Frontend — CopyResults 렌더링]
```

---

## 2. 입력 데이터 (Request)

### 2.1 사용자가 직접 선택하는 값 (GenerationConfig)

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `countries` | `string[]` | 타겟 국가 코드 (20개 중 선택) | `["US", "KR", "JP"]` |
| `ageGroups` | `string[]` | 타겟 연령대 (브리프 Audience에서 자동 추론 + 사용자 수정) | `["25-34", "35-44"]` |
| `personas` | `string[]` | 타겟 페르소나 (브리프 Audience에서 자동 추론 + 사용자 수정) | `["tech-enthusiast", "premium-lifestyle"]` |
| `skillsets` | `string[]` | 스킬 제약 조건 (현재 항상 빈 배열) | `[]` |
| `copyCount` | `number` | 국가당 카피 변형 수 (1~10, 기본 3) | `3` |

- **연령대 선택지**: `18-24`, `25-34`, `35-44`, `45-54`, `55+`
- **페르소나 선택지**: `tech-enthusiast`, `premium-lifestyle`, `value-seeker`, `family-first`, `eco-conscious`
- **연령대/페르소나 자동 추론**: 브리프의 `audience` 자유 텍스트에서 키워드 매칭으로 사전 선택됨 (`infer-audience.ts`)

### 2.2 이전 워크플로우 단계에서 자동 전달되는 값

| 필드 | 출처 | 설명 |
|------|------|------|
| `brief` | Step 1 (브리핑) | `CampaignBrief` 전체 객체 (13개 필드: projectName, audience, keyMessage, proofPoints 등) |
| `analysisReport` | Step 2 (분석) | `AnalysisReport` (briefSummary, persona, brandFit, marketAnalysis, competitiveKeywords 등 10개 필드) |
| `strategicMessage` | Step 3 (전략 메시지) | `StrategicMessageData` (coreMessage, pillars 등) |

### 2.3 최종 API 요청 형태

```
POST /api/v1/campaigns/generate-copy
Content-Type: application/json

{
  "brief": { ... },           // CampaignBrief 전체
  "analysisReport": { ... },  // AnalysisReport 전체
  "strategicMessage": { ... },// StrategicMessageData 전체
  "config": {
    "countries": ["US", "KR"],
    "ageGroups": ["25-34", "35-44"],
    "personas": ["tech-enthusiast"],
    "skillsets": [],
    "copyCount": 3
  }
}
```

> **참고**: SSE 스트리밍이 아닌 일반 JSON POST → JSON 응답 방식. 분석(`/analyze`)이나 리뷰(`/review`)와 달리 프로그레스 이벤트 없음.

---

## 3. 백엔드 처리 단계 (DeepAgentExecutor)

### 3.1 Step 1 — 스킬 자동 선택 (`_plan_skills`)

LLM이 캠페인 컨텍스트에 맞는 스킬을 자동 선택한다.

**입력**:
- `objective`: 브리프의 `objectiveCommercial`
- `market`: `countries[0]` (첫 번째 타겟 국가)
- `tone`: 브리프의 `tone` (있으면)
- `constraints`: `config.skillsets` (현재 빈 배열)

**과정**:
1. `backend/skills/` 디렉토리에서 모든 SKILL.md 파일의 frontmatter(이름, 설명, 유형) 로드
2. `culture-*`, `writer-*`, `workflow-adcopy-production` 스킬은 카탈로그에서 제외
3. LLM(temperature 0.1)에 카탈로그 + 캠페인 정보를 보내 관련 스킬 목록 요청

**LLM 프롬프트** (skill planner):
```
System: "You are a skill planner for ad-copy workflow. Select ALL
skill names from the catalog that are relevant to ad copy generation,
review, compliance, and quality scoring. Exclude skills for translation,
orchestration, or approval packaging.
Return strict json: {"selected_skills":[...]}"

User: { objective, market, tone, constraints, catalog: [...] }
```

**폴백**: LLM 실패 시 `select_generation_skills()` 사용 →
- `global-core-copy-generation`
- `tone-and-voice-enforcer`
- `headline-body-cta-composer`
- `culture-{market}` (해당 시장의 문화 프로필)
- `lg-brand-voice`

**사용 가능한 스킬 목록** (총 40+ 개):

| 카테고리 | 스킬 예시 |
|----------|-----------|
| 생성 핵심 | `global-core-copy-generation`, `headline-body-cta-composer`, `tone-and-voice-enforcer` |
| 브랜드 | `lg-brand-voice`, `lg-brand-fit-check`, `brand-lexicon-check` |
| 검증/컴플라이언스 | `compliance-redflag-detector`, `regulatory-copy-validation`, `ai-washing-risk-check`, `comparative-ad-risk-check`, `environmental-claim-risk-check` |
| 품질 평가 | `copy-scorecard-generator`, `creative-impact-scorer` |
| 전략/분석 | `claim-extractor`, `competitive-differentiation-review`, `customer-segment-fit-check`, `main-message-clarifier`, `proof-point-checker` |
| 로컬라이제이션 | `localization-base`, `regional-copy-adaptation`, `regional-culture-fit-check`, `language-transcreation`, `seasonality-fit-check` |
| 문화 프로필 | `culture-usa`, `culture-japan`, `culture-germany` 등 20개국 |
| AI Writer 페르소나 | `writer-storyteller`, `writer-minimalist`, `writer-humor-wit` 등 10종 |

### 3.2 Step 2 — 스킬 컨텍스트 빌드 (`_build_skill_context`)

선택된 스킬의 SKILL.md 파일 본문(frontmatter 제외)을 읽어 LLM 프롬프트에 주입할 컨텍스트 블록을 구성한다.

- 스킬당 최대 **3,500자**까지 로드 (초과 시 잘림)
- 형식: `## SKILL: {스킬명}\n{SKILL.md 본문}`
- 모든 스킬 블록을 `\n\n`으로 결합

```
## SKILL: global-core-copy-generation
(SKILL.md body ≤ 3500 chars)

## SKILL: tone-and-voice-enforcer
(SKILL.md body ≤ 3500 chars)

## SKILL: lg-brand-voice
(SKILL.md body ≤ 3500 chars)
...
```

### 3.3 Step 3 — 시스템 프롬프트 구성

config 필드와 스킬 컨텍스트를 하나의 시스템 프롬프트로 조합한다.

```
You are a DeepAgent for enterprise ad-copy automation at LG Electronics.
You follow skill-based instructions to generate safe, high-quality,
culturally adapted copy.

## Generation Config
- Target Countries: USA (English), Korea (한국어), Japan (日本語)
- Target Age Groups: 25-34, 35-44
- Personas: tech-enthusiast, premium-lifestyle
- Number of Copy Variants per Country: 3

## Selected Skill Instructions
Follow these skill guidelines when generating copy:

{스킬 컨텍스트 블록들}
{페르소나 지시문 (있을 경우)}

CRITICAL RULES:
- 인구통계 정보(연령, 소득, 사회 계층)를 고객 대면 카피에 직접 사용 금지
- 타겟 세그먼트 정보는 톤, 소구점, 크리에이티브 전략 가이드로만 활용
- 각 국가별 정확히 {copyCount}개의 카피 변형 필수
- headline, subheadline, bodyCopy, cta → 반드시 해당 국가 현지 언어
- methodology, culturalNotes, toneAnalysis → 항상 한국어

## Output Format
Return a JSON array: [{ countryCode, copies: [...] }]
```

**Config 필드가 프롬프트에서 사용되는 방식**:

| Config 필드 | 프롬프트 내 역할 |
|------------|----------------|
| `countries` | 국가명(+언어)으로 변환 후 "Target Countries"에 표시. 각 국가별 카피 생성 지시. |
| `ageGroups` | "Target Age Groups"에 표시. 톤/소구점 결정의 맥락 정보로 사용. |
| `personas` | "Personas"에 표시. 크리에이티브 전략과 메시지 방향의 맥락 정보로 사용. |
| `copyCount` | "Number of Copy Variants per Country" + CRITICAL RULES에서 각 국가별 정확한 변형 수 강제. |
| `skillsets` | 스킬 플래닝 시 `constraints`로 전달 (현재 미사용). |

### 3.4 Step 4 — LLM 호출

**모델**: Azure OpenAI (환경변수 `AZURE_OPENAI_DEPLOYMENT`로 지정된 배포)
**Temperature**: 0.7 (창의적이되 통제 가능한 수준)

**User 메시지에 포함되는 데이터**:

```
## Campaign Brief
```json
{ "projectName": "...", "audience": "...", "keyMessage": "...", ... }
```

## Market Analyst Report
```json
{ "briefSummary": {...}, "persona": {...}, "brandFit": {...}, ... }
```

## Strategic Message
```json
{ "coreMessage": {...}, "pillars": [...], ... }
```

Generate culturally adapted copy for each target country,
following ALL skill instructions above.
```

> **브리프, 분석 리포트, 전략 메시지가 모두 JSON 전문으로 전달**되므로, LLM은 캠페인의 전체 컨텍스트를 파악하고 카피를 생성한다.

### 3.5 Step 5 — JSON 파싱

LLM 응답을 `JsonOutputParser`로 파싱하여 `CopyResult[]` 구조로 변환한다.

### 3.6 Step 6 — 스킬 리뷰 요약 생성 (`_generate_skill_reviews`)

생성된 카피를 선택된 스킬 관점에서 검토하는 한국어 요약을 생성한다.

**대상**: `writer-*` (페르소나), `culture-*` (문화 프로필)을 제외한 선택 스킬
**모델**: Azure OpenAI, temperature 0.2 (분석적)

**프롬프트**:
```
System: "당신은 광고 카피 품질 검토자입니다.
각 skill에 대해 이번 결과물 관점의 한국어 검토 요약을 작성하세요."

User: {
  objective, market, selected_skills,
  generated_copies_sample (최대 2000자),
  format: { skill_reviews_ko: { "<skill_name>": "20~60자 한국어 요약" } }
}
```

**출력 예시**:
```json
{
  "global-core-copy-generation": "각 국가별 현지 언어로 3개 변형 정상 생성됨",
  "lg-brand-voice": "LG 브랜드 톤 유지하며 혁신 키워드 적절히 반영"
}
```

---

## 4. 출력 데이터 (Response)

### 4.1 응답 구조

```json
{
  "status": "success",
  "data": [
    {
      "countryCode": "US",
      "copies": [
        {
          "headline": "영어 헤드라인",
          "subheadline": "영어 서브헤드라인",
          "bodyCopy": "영어 본문 (2-3문장)",
          "cta": "영어 CTA",
          "methodology": "(한국어) 크리에이티브 접근법 설명",
          "culturalNotes": "(한국어) 문화 적응 노트",
          "toneAnalysis": "(한국어) 톤 분석"
        },
        { ... },  // 변형 2
        { ... }   // 변형 3
      ]
    },
    {
      "countryCode": "KR",
      "copies": [ ... ]
    }
  ]
}
```

### 4.2 CopyItem 필드 설명

| 필드 | 언어 | 설명 |
|------|------|------|
| `headline` | **현지어** | 주 헤드라인 |
| `subheadline` | **현지어** | 보조 헤드라인 |
| `bodyCopy` | **현지어** | 본문 (2~3문장) |
| `cta` | **현지어** | Call-to-Action |
| `methodology` | **한국어** | 크리에이티브 접근 방법론 설명 |
| `culturalNotes` | **한국어** | 해당 국가 문화 맥락 적응 노트 |
| `toneAnalysis` | **한국어** | 카피의 톤 & 매너 분석 |

---

## 5. LLM 호출 요약

카피 생성 1회당 LLM이 **총 3회** 호출된다.

| 순서 | 목적 | Temperature | 입출력 |
|------|------|-------------|--------|
| 1 | 스킬 플래닝 | 0.1 | 카탈로그 + 캠페인 정보 → 스킬명 배열 |
| 2 | **카피 생성** | 0.7 | 시스템 프롬프트(config+스킬) + 브리프/분석/전략 → CopyResult[] JSON |
| 3 | 스킬 리뷰 | 0.2 | 스킬 목록 + 생성 결과 샘플 → 스킬별 한국어 요약 |

---

## 6. 파일 참조

| 구성 요소 | 파일 경로 | 핵심 위치 |
|-----------|-----------|-----------|
| 생성 조건 폼 | `frontend-v2/src/features/copy-generation/generation-config.tsx` | `handleSubmit()` |
| Audience 자동 추론 | `frontend-v2/src/features/copy-generation/infer-audience.ts` | `inferFromAudience()` |
| 에디터 페이지 | `frontend-v2/src/pages/editor/editor-page.tsx` | `handleGenerateCopy()` |
| API 훅 | `frontend-v2/src/shared/api/hooks/use-generate-copy.ts` | `useGenerateCopy()` |
| 타입 정의 | `frontend-v2/src/shared/api/types.ts` | `GenerationConfig`, `GenerateCopyRequest`, `CopyResult` |
| 백엔드 엔드포인트 | `backend/app/main.py` | `generate_copy()` 핸들러 |
| 스키마 | `backend/app/schemas.py` | `GenerateCopyRequest`, `GenerationConfig` |
| DeepAgent 실행기 | `backend/app/skills/deep_agent.py` | `DeepAgentExecutor.generate_copy()` |
| 스킬 로더 | `backend/app/skills/loader.py` | `SkillLoader.get_skill_body()` |
| 라우팅 폴백 | `backend/app/skills/routing_policy.py` | `select_generation_skills()` |
| 스킬 파일 | `backend/skills/{스킬명}/SKILL.md` | 각 스킬의 지침 본문 |
