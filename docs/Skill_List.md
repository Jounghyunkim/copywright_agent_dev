# Skills 디렉토리

이 디렉토리에는 에이전트가 참조하는 모든 SKILL이 정의되어 있습니다.
각 스킬은 `스킬명/SKILL.md` 파일로 관리되며, frontmatter(메타데이터) + 마크다운 본문으로 구성됩니다.

현재 **60개** 스킬이 등록되어 있습니다.

---

## 워크플로우 / 메타 (2개) `orchestration` `generation`

카피 생성 파이프라인과 스킬 관리를 위한 메타 스킬입니다.

| 스킬 | 설명 |
|---|---|
| `workflow-adcopy-production` | 광고 카피 생산 워크플로우 (브리프 → 생성 → 평가 → 승인 → 지역화 → 배포) |
| `SKILLMD-generator` | 현업 담당자의 자유 서술을 표준 SKILL.md로 구조화하는 메타 스킬 (자유 입력 → 구조화 초안 + 갭 분석 + 보완 질문) |

---

## LG 브랜드 (2개) `reference` `evaluation`

LG Electronics 브랜드 철학과 톤앤매너를 정의하고 검수하는 스킬들입니다.

| 스킬 | 설명 | 비고 |
|---|---|---|
| `lg-brand-voice` | LG 브랜드 철학, 5가지 브랜드 원칙(Life's Good, Warmth, Innovation, Premium, Young & Vibrant), 카피 적용 원칙, 금지 패턴을 정의하는 단일 원천(Single Source of Truth) | 카피 생성·평가 시 공통 참조 |
| `lg-brand-fit-check` | LG 브랜드 가이드라인 기반 카피 검수 (5개 원칙별 0-20점 평가) | **필수 평가 스킬** — 모든 카피 후보 평가에 항상 포함 |

---

## AI 작가 (11개) `generation`

페르소나별 창작 프롬프트. 캠페인 목표에 따라 최적의 5명이 자동 선택됩니다.
공통 작성 규칙은 `writer-base`에 정의되어 있으며, 모든 작가 스킬이 이를 참조합니다.
생성 시 `lg-brand-voice` 브랜드 원칙을 반영하며, 각 카피에 `[강조 원칙]` 섹션을 포함합니다.

| 스킬 | 설명 |
|---|---|
| `writer-base` | 모든 AI 작가에 공통 적용되는 카피 작성 가이드라인 (부모 스킬) |
| `writer-metaphor-master` | 은유/감성 카피라이터 |
| `writer-viral-specialist` | SNS 바이럴 전문가 |
| `writer-data-driven` | 데이터 드리븐 마케터 |
| `writer-storyteller` | 브랜드 스토리텔러 |
| `writer-minimalist` | 미니멀리스트 |
| `writer-humor-wit` | 유머리스트 |
| `writer-challenger` | 챌린저 |
| `writer-urgency-fomo` | 어전시 메이커 |
| `writer-social-proof` | 소셜 프루프 |
| `writer-sensory-premium` | 감각 디자이너 |

---

## 카피 생성 (5개) `generation`

카피 생성 파이프라인을 구성하는 스킬들입니다.

| 스킬 | 설명 |
|---|---|
| `campaign-brief-normalizer` | 입력 브리프를 표준 JSON 구조로 정규화 |
| `main-message-clarifier` | 모호한 핵심 메시지를 단일 주장으로 명확화 |
| `global-core-copy-generation` | 캠페인 브리프 기반 글로벌 코어 카피 생성 |
| `headline-body-cta-composer` | 헤드라인/본문/CTA 구조적 조합 |
| `tone-and-voice-enforcer` | 브랜드 톤/보이스 위반 탐지 및 수정 제안 |

---

## 컴플라이언스 (6개) `evaluation`

광고 카피의 법적/규정 준수 여부를 검증하는 스킬들입니다.

| 스킬 | 설명 | 비고 |
|---|---|---|
| `regulatory-copy-validation` | 광고 카피의 법적 규정 준수 여부 종합 검증 | 필수 평가 |
| `compliance-redflag-detector` | 법적/규정 위반 가능성이 있는 레드플래그 표현 탐지 | 필수 평가 |
| `brand-lexicon-check` | 브랜드 용어집 기반 금지어/필수어/톤 일관성 검증 | 필수 평가 + 생성 시 가드레일 주입 |
| `ai-washing-risk-check` | AI 관련 과장/오인 표현 사전 검증 | 조건부 (AI 관련 캠페인) |
| `environmental-claim-risk-check` | 친환경/ESG 관련 그린워싱 리스크 검증 | 조건부 (환경 관련 캠페인) |
| `comparative-ad-risk-check` | 비교 광고 표현의 법적 리스크와 근거 충분성 검증 | 조건부 (비교 광고) |

---

## 품질 검수 (4개) `evaluation`

카피 품질을 다차원으로 평가하는 스킬들입니다.

| 스킬 | 설명 | 비고 |
|---|---|---|
| `copy-scorecard-generator` | 카피 품질을 다차원(명확성, 설득력, 톤 등)으로 평가하여 스코어카드 생성 | 필수 평가 |
| `claim-extractor` | 카피의 주장(claim) 문장을 구조화하여 추출 | |
| `proof-point-checker` | 각 claim별 근거 존재 및 충분성 확인 | |
| `creative-impact-scorer` | 카피의 창의성과 임팩트를 정량 평가 (주목도/의외성/감정/기억/독창성) | |

---

## 차별화 분석 (2개) `evaluation`

경쟁사 대비 차별화를 검토하는 스킬들입니다.

| 스킬 | 설명 |
|---|---|
| `competitive-differentiation-review` | 경쟁사 대비 차별화 포인트가 카피에 반영되었는지 검토 |
| `competitor-copy-contrast-check` | 경쟁사 카피와 비교하여 유사도/차별성 분석 |

---

## 지역화 검증 (6개) `localization`

국가별 지역화 품질을 검증하는 스킬들입니다.
공통 지역화 규칙은 `localization-base`에 정의되어 있으며, 모든 문화 프로필 스킬이 이를 참조합니다.

| 스킬 | 설명 |
|---|---|
| `localization-base` | 모든 국가 지역화에 공통 적용되는 기본 가이드라인 (부모 스킬) |
| `regional-copy-adaptation` | 지역별 문화/규정/언어 특성에 맞게 카피를 현지화 |
| `language-transcreation` | 단순 번역이 아닌 문화적 맥락을 반영한 트랜스크리에이션 |
| `regional-culture-fit-check` | 지역 문화적 맥락에 카피가 적합한지 검증 |
| `seasonality-fit-check` | 시즌/시기에 맞는 카피 표현인지 검증 |
| `customer-segment-fit-check` | 타겟 고객 세그먼트에 카피 메시지가 적합한지 검증 |

---

## 문화 프로필 (20개국) `localization`

각 국가의 문화적 특성을 정의한 스킬들입니다. 지역화 시 DeepAgent가 해당 국가의 문화 프로필을 읽고 적용합니다.
각 프로필은 Cultural Values, Communication Style, Taboos, **Profanity & Taboo Words**, Seasonal Context, Successful Patterns, Language 섹션으로 구성됩니다.

**Profanity & Taboo Words** 섹션에는 해당 지역에서 사전에는 정상 단어이지만 구어/속어로 비속어 의미를 가지는 이중 의미 단어, 지역 한정 비속어, 문화적 금기 표현이 정리되어 있습니다. 번역 시 LLM이 이 목록을 참조하여 비속어를 자동 검출하고 안전한 대체어로 교체합니다.

| 지역 | 국가 |
|---|---|
| 유럽 (8) | `culture-uk` 영국, `culture-germany` 독일, `culture-france` 프랑스, `culture-spain` 스페인, `culture-italy` 이탈리아, `culture-netherlands` 네덜란드, `culture-poland` 폴란드, `culture-sweden` 스웨덴 |
| 아시아 (5) | `culture-japan` 일본, `culture-china` 중국, `culture-india` 인도, `culture-indonesia` 인도네시아, `culture-thailand` 태국 |
| 아메리카 (5) | `culture-usa` 미국, `culture-canada` 캐나다, `culture-brazil` 브라질, `culture-mexico` 멕시코, `culture-argentina` 아르헨티나 |
| 중동/아프리카 (2) | `culture-uae` UAE, `culture-south-africa` 남아프리카공화국 |

---

## 승인 절차 (2개) `evaluation`

워크플로우의 승인/검토 단계를 담당하는 절차 스킬들입니다.

| 스킬 | 설명 |
|---|---|
| `final-copy-signoff` | 최종 승인 및 배포 가능 상태를 확정하는 절차 |
| `local-approval-pack-preparation` | 승인자가 바로 판단 가능한 검토 패키지를 생성하는 절차 |

---

## 필수 평가 스킬 (MUST_HAVE_EVAL)

캠페인 유형이나 목표에 관계없이 **모든 카피 후보 평가에 항상 포함**되는 스킬입니다.
`routing_policy.py`의 `MUST_HAVE_EVAL` 리스트에 정의되어 있습니다.

| 스킬 | 역할 |
|---|---|
| `regulatory-copy-validation` | 법적 규정 준수 |
| `brand-lexicon-check` | 금지어/필수어 검증 |
| `copy-scorecard-generator` | 다차원 품질 평가 |
| `compliance-redflag-detector` | 레드플래그 탐지 |
| `lg-brand-fit-check` | LG 브랜드 적합도 평가 |

---

## 생성 시 가드레일 주입 (ALWAYS_INJECT)

카피 **생성** 프롬프트에 항상 주입되는 컴플라이언스 가드레일입니다.
`guardrail_extractor.py`의 `ALWAYS_INJECT` 리스트에 정의되어 있습니다.

| 스킬 | 역할 |
|---|---|
| `customer-segment-fit-check` | 인구통계 표현 노출 방지 |
| `compliance-redflag-detector` | 규정 위반 표현 방지 |
| `brand-lexicon-check` | 금지어/필수어 준수 |

추가로 `lg-brand-voice` 브랜드 원칙이 생성 프롬프트에 별도 주입됩니다.

---

## 스킬 참조 관계

스킬은 본문에서 `[다른-스킬-이름]` 형태로 다른 스킬을 참조할 수 있습니다.
DeepAgent가 스킬을 읽을 때 참조된 스킬을 자율적으로 따라가서 로드합니다.

**부모-자식 관계:**
- `writer-base` ← 11개 AI 작가 스킬
- `localization-base` ← 20개 문화 프로필 스킬
- `lg-brand-voice` ← `lg-brand-fit-check`, `writer-base` (브랜드 원칙 공통 참조)

**스킬 간 참조 예시:**
- `regulatory-copy-validation` → `ai-washing-risk-check`, `brand-lexicon-check`, `comparative-ad-risk-check` 등
- `regional-copy-adaptation` → `language-transcreation`, `regional-culture-fit-check`, `seasonality-fit-check` 등
- `lg-brand-fit-check` → `lg-brand-voice` (브랜드 철학, 5가지 원칙, 금지 패턴 참조)

프론트엔드의 스킬 카탈로그 > 그래프 뷰에서 전체 참조 관계를 시각적으로 확인할 수 있습니다.
