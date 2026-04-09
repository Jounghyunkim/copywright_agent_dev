# Agent & Skill System 적용 방안

> Reference: `reference/skill_mgmt/` 코드베이스의 DeepAgent + 60개 SKILL.md 체계를 현재 Copywriting Agent에 적용하기 위한 분석 및 구현 계획

## 1. 현재 시스템 vs Reference 비교

| 구분 | 현재 (copywriting_agent) | Reference (skill_mgmt) |
|------|------------------------|----------------------|
| **스킬 수** | 6개 빌트인 + 커스텀 | **60개** 빌트인 (SKILL.md 기반) |
| **스킬 역할** | Review(5단계)에서만 사용 | **전 단계**에서 사용 (생성/평가/현지화) |
| **스킬 포맷** | Python 함수 (하드코딩) | SKILL.md (YAML frontmatter + Markdown 지침) |
| **에이전트** | LangGraph 4노드 DAG | **DeepAgent** (스킬 자동 선택 + 컨텍스트 주입) |
| **페르소나** | 없음 | 10개 AI Writer 페르소나 |
| **문화 프로필** | 없음 | 19개국 culture-* 프로필 |
| **스킬 라우팅** | 사용자 수동 선택 | LLM 기반 자동 선택 + 조건부 트리거 |

### 현재 빌트인 스킬 (6개)
1. `ai-washing-risk-check` — AI 과장/오해 소지 표현 감지
2. `brand-lexicon-check` — LG 브랜드 용어 가이드라인 준수
3. `campaign-brief-normalizer` — 브리프 표준화 및 일관성 검증
4. `channel-variant-generator` — 채널별 카피 변형 생성
5. `cultural-sensitivity-check` — 문화적 민감성 검증
6. `tone-consistency-guard` — 톤 앤 매너 일관성 유지

### Reference 스킬 분류 (60개)

**오케스트레이션 (3개)**: global-core-copy-generation, regional-copy-adaptation, regulatory-copy-validation

**프로시저 (6개)**: campaign-brief-normalizer, main-message-clarifier, tone-and-voice-enforcer, claim-extractor, proof-point-checker, brand-lexicon-check

**캐퍼빌리티 (18개)**: headline-body-cta-composer, copy-scorecard-generator, creative-impact-scorer, compliance-redflag-detector, ai-washing-risk-check, environmental-claim-risk-check, comparative-ad-risk-check, regional-culture-fit-check, seasonality-fit-check, customer-segment-fit-check, competitive-differentiation-review, competitor-copy-contrast-check, channel-variant-generator, language-transcreation, local-approval-pack-preparation, final-copy-signoff, lg-brand-fit-check, lg-brand-voice

**AI Writer 페르소나 (10개)**: writer-metaphor-master, writer-viral-specialist, writer-data-driven, writer-storyteller, writer-minimalist, writer-humor-wit, writer-challenger, writer-urgency-fomo, writer-social-proof, writer-sensory-premium

**문화 프로필 (19개국)**: culture-uk, culture-germany, culture-france, culture-spain, culture-italy, culture-netherlands, culture-poland, culture-sweden, culture-japan, culture-china, culture-india, culture-indonesia, culture-thailand, culture-usa, culture-canada, culture-brazil, culture-mexico, culture-argentina, culture-uae, culture-south-africa

---

## 2. 워크플로우 단계별 스킬 매핑

### Step 1: Research (브리프 + 분석)

현재 `graph.py`의 `query_planner → [web_search ∥ enhanced_rag] → synthesizer` 파이프라인은 유지하되, 전/후처리에 스킬 적용:

| 스킬 | 용도 | 적용 시점 |
|------|------|----------|
| **campaign-brief-normalizer** | 브리프 입력 표준화 → 후속 노드 품질 향상 | `query_planner` 전 |
| **main-message-clarifier** | 핵심 메시지 1~3개 추출 | `synthesizer` 후 |
| **claim-extractor** | 분석 리포트 내 검증 필요 주장 식별 | `synthesizer` 후 |

### Step 2: Analysis (분석 리포트 검증)

현재는 분석 리포트를 그대로 반환. 스킬 기반 품질 게이트 추가:

| 스킬 | 용도 |
|------|------|
| **lg-brand-fit-check** | LG 브랜드 철학 부합도 평가 (필수) |
| **proof-point-checker** | 리포트 내 주장의 근거 검증 |

### Step 3: Strategic Message

현재 `extract_strategic_message()` LLM 호출 1회. DeepAgent 패턴으로 스킬 컨텍스트 주입:

| 스킬 | 용도 |
|------|------|
| **main-message-clarifier** | 핵심 메시지 정제 |
| **tone-and-voice-enforcer** | 톤 가이드 준수 |

### Step 4: Generation (카피 생성) — 가장 큰 변화

현재 `generate_copy()`를 **DeepAgent 패턴**으로 전환:

| 스킬 | 용도 |
|------|------|
| **global-core-copy-generation** | 카피 생성 오케스트레이션 |
| **headline-body-cta-composer** | 헤드라인/본문/CTA 구조화 |
| **tone-and-voice-enforcer** | 톤 준수 |
| **writer-\*** (10개 페르소나) | 다양한 스타일 후보 생성 |
| **culture-\*** (19개 프로필) | 국가별 문화 맥락 주입 |
| **channel-variant-generator** | 채널별 변형 (기존 스킬 유지) |

### Step 5: Review (카피 검증) — 평가 스킬 확장

| 스킬 | 용도 | 게이트 유형 |
|------|------|-----------|
| **brand-lexicon-check** | LG 브랜드 용어 (기존) | 필수 |
| **compliance-redflag-detector** | 법적 리스크 (신규) | **Hard gate** |
| **lg-brand-fit-check** | LG 브랜드 부합도 (신규) | 필수 |
| **ai-washing-risk-check** | AI 과장 표현 (기존) | 조건부 |
| **copy-scorecard-generator** | 5차원 종합 점수 (신규) | 품질 게이트 |
| **creative-impact-scorer** | 창의성 지표 (신규) | 참조용 |
| **cultural-sensitivity-check** | 문화 민감성 (기존) | 필수 |
| **tone-consistency-guard** | 톤 일관성 (기존) | 필수 |
| **environmental-claim-risk-check** | 환경 주장 리스크 (신규) | 조건부 |
| **comparative-ad-risk-check** | 비교 광고 리스크 (신규) | 조건부 |

---

## 3. 핵심 아키텍처 변경사항

### 3-A. SKILL.md 파일 기반 스킬 시스템 도입

```
backend/
├── skills/                          # SKILL.md 파일들 (reference에서 복사)
│   ├── global-core-copy-generation/SKILL.md
│   ├── headline-body-cta-composer/SKILL.md
│   ├── tone-and-voice-enforcer/SKILL.md
│   ├── lg-brand-fit-check/SKILL.md
│   ├── compliance-redflag-detector/SKILL.md
│   ├── copy-scorecard-generator/SKILL.md
│   ├── creative-impact-scorer/SKILL.md
│   ├── writer-metaphor-master/SKILL.md
│   ├── culture-japan/SKILL.md
│   └── ... (필요한 스킬만 선별 복사)
├── app/
│   ├── skills/
│   │   ├── loader.py          # 신규: SKILL.md 파서 (reference에서 이식)
│   │   ├── routing_policy.py  # 신규: LLM 기반 스킬 자동 선택
│   │   ├── deep_agent.py      # 신규: DeepAgent 실행기
│   │   ├── catalog.py         # 수정: SKILL.md 기반으로 전환
│   │   ├── runner.py          # 수정: SKILL.md 기반 실행 지원
│   │   └── builtin/           # 기존 유지 (호환)
```

### 3-B. DeepAgent 실행기

Reference의 `DeepAgentExecutor` 패턴 이식:

```python
class DeepAgentExecutor:
    def _plan_skills(objective, market, tone, constraints) -> list[str]
        # LLM이 캠페인 컨텍스트에 맞는 스킬 자동 선택
    
    def _read_skill_body(skill_name, max_chars=3500) -> str
        # SKILL.md 본문을 LLM 컨텍스트에 주입
    
    def generate_ad_copy(**kwargs) -> tuple[str, list[str], dict[str, str]]
        # 선택된 스킬 지침 기반 카피 생성
        # Returns: (final_copy, selected_skills, skill_reviews_ko)
```

### 3-C. 스킬 라우팅 정책

```python
# 필수 평가 스킬 (항상 포함)
MUST_HAVE_EVAL = [
    "brand-lexicon-check",
    "compliance-redflag-detector",
    "lg-brand-fit-check",
]

# 조건부 트리거 (키워드 매칭 시 자동 추가)
CONDITIONAL_TRIGGERS = {
    "ai-washing-risk-check": [r"\bai\b", r"인공지능", r"자동화"],
    "environmental-claim-risk-check": [r"친환경", r"환경", r"esg"],
    "comparative-ad-risk-check": [r"비교", r"경쟁", r"vs", r"1위"],
}
```

### 3-D. 페르소나 시스템

10개 AI Writer 페르소나를 통한 다양한 카피 후보 생성:

| 페르소나 | 스타일 | 태그 |
|---------|--------|------|
| writer-metaphor-master | 은유/감성 | branding, emotion, premium |
| writer-viral-specialist | 바이럴 | sns, digital |
| writer-data-driven | 데이터 기반 | data, conversion |
| writer-storyteller | 스토리텔링 | story, narrative |
| writer-minimalist | 미니멀 | minimal, clean |
| writer-humor-wit | 유머 | humor, engagement |
| writer-challenger | 도발적 | challenger, bold |
| writer-urgency-fomo | 긴급성/FOMO | promotion, ecommerce |
| writer-social-proof | 사회적 증거 | trust, authority |
| writer-sensory-premium | 감각/프리미엄 | premium, luxury |

캠페인 목표에 따라 `select_personas_for_campaign()`이 2~3명 자동 선택 → 각 페르소나별 후보 생성 → 스킬 평가 → Top-N 선택

### 3-E. 단계별 엔드포인트 변경

| 엔드포인트 | 변경 사항 |
|-----------|----------|
| `POST /analyze` | `synthesizer` 노드에서 스킬 컨텍스트 주입 (main-message-clarifier, claim-extractor) |
| `POST /strategic-message` | DeepAgent가 tone-and-voice-enforcer + main-message-clarifier 참조 |
| `POST /generate-copy` | **DeepAgent 패턴 전환**: 페르소나 기반 후보 생성 → 스킬 평가 → Top-N 선택 |
| `POST /review` | routing_policy 기반 스킬 자동 선택 + 조건부 트리거 추가 |

---

## 4. 워크플로우 실행 흐름 (적용 후)

```
[User: Campaign Brief]
        ↓
[campaign-brief-normalizer] → NormalizedBrief
        ↓
[LangGraph DAG]
  query_planner → [web_search ∥ enhanced_rag] → synthesizer
        ↓
[main-message-clarifier] → 핵심 메시지 1~3개
[claim-extractor] → 검증 필요 주장 식별
        ↓
[HITL: Analysis Report 승인]
        ↓
[Strategic Message 추출]
  - tone-and-voice-enforcer 컨텍스트 주입
  - main-message-clarifier 결과 활용
        ↓
[HITL: Strategic Message 승인]
        ↓
[DeepAgent: Copy Generation]
  ├─ select_personas_for_campaign() → 2~3 페르소나 선택
  ├─ 페르소나별 후보 생성 (writer-* + culture-* + 스킬 지침)
  ├─ _plan_skills() → 관련 스킬 자동 선택
  └─ headline-body-cta-composer 구조화
        ↓
[Skill-based Evaluation]
  ├─ MUST_HAVE: brand-lexicon, compliance-redflag, lg-brand-fit
  ├─ 조건부: ai-washing, environmental, comparative
  └─ 품질: copy-scorecard, creative-impact
        ↓
[HITL: Copy Selection & Review]
        ↓
[Campaign Save]
```

---

## 5. 구현 결과

> 아래 로드맵의 모든 단계를 구현 완료하였습니다.

| 순서 | 작업 | 상태 | 상세 내용 |
|------|------|------|----------|
| **1** | SKILL.md loader/parser + skills/ 디렉토리 구성 | **완료** | parser.py, loader.py 신규 생성, 57개 SKILL.md 복사 |
| **2** | DeepAgent 실행기 + Generation 단계 적용 | **완료** | deep_agent.py 구현, generate-copy 엔드포인트 DeepAgent 전환 |
| **3** | 페르소나 시스템 + 후보 경쟁 생성 | **완료** | creative_personas.py, 10개 페르소나, 캠페인 자동 매칭 |
| **4** | Review 단계 스킬 확장 | **완료** | routing_policy, 조건부 트리거, SKILL.md 기반 리뷰 실행 |
| **5** | culture-* 프로필 적용 | **완료** | 20개국 문화 프로필, Generation/Review 시 자동 주입 |

---

## 6. 신규 파일 목록

### 6-A. 신규 생성 파일 (7개)

| 파일 | 역할 |
|------|------|
| `backend/app/skills/parser.py` | SKILL.md YAML frontmatter + Markdown body 파서 |
| `backend/app/skills/loader.py` | SKILL.md 스킬 탐색/로딩/필터링 (action_tag, skill_type, persona, culture별) |
| `backend/app/skills/routing_policy.py` | 스킬 자동 선택 — 필수 평가 스킬(3개) + 조건부 트리거 + 생성 스킬 라우팅 |
| `backend/app/skills/deep_agent.py` | DeepAgent 실행기 — LLM 기반 스킬 플래닝 + 컨텍스트 주입 카피 생성 + 페르소나 병렬 후보 생성 |
| `backend/app/skills/creative_personas.py` | AI Writer 페르소나 시스템 — SKILL.md 기반 10개 페르소나, 캠페인 목표 자동 매칭 |
| `backend/app/skills/skillmd_runner.py` | SKILL.md 기반 리뷰 실행 엔진 — 스킬 body를 LLM 프롬프트에 주입하여 평가 |
| `docs/Agent_Skill_apply.md` | 본 문서 (분석 및 적용 방안) |

### 6-B. 기존 수정 파일 (3개)

| 파일 | 변경 내용 |
|------|----------|
| `backend/app/skills/catalog.py` | 3-tier 카탈로그 통합: 기존 빌트인(6개) + SKILL.md(54개) + 커스텀 → 총 61개 |
| `backend/app/skills/runner.py` | 3-tier 실행 분기(builtin/skillmd/custom) + `auto_select` 모드 추가 |
| `backend/app/main.py` | `generate-copy` DeepAgent 전환 + 4개 신규 엔드포인트 추가 |

### 6-C. SKILL.md 파일 (57개 → `backend/skills/`)

Reference에서 선별 복사한 SKILL.md 파일:

**생성 스킬 (7개)**: `global-core-copy-generation`, `headline-body-cta-composer`, `tone-and-voice-enforcer`, `main-message-clarifier`, `campaign-brief-normalizer`, `claim-extractor`, `proof-point-checker`

**평가 스킬 (11개)**: `brand-lexicon-check`, `lg-brand-fit-check`, `lg-brand-voice`, `compliance-redflag-detector`, `copy-scorecard-generator`, `creative-impact-scorer`, `ai-washing-risk-check`, `environmental-claim-risk-check`, `comparative-ad-risk-check`, `competitive-differentiation-review`, `competitor-copy-contrast-check`

**현지화/문화 (5개 + 20개국)**: `regional-copy-adaptation`, `language-transcreation`, `localization-base`, `regional-culture-fit-check`, `customer-segment-fit-check`, `seasonality-fit-check` + `culture-{uk,germany,france,spain,italy,netherlands,poland,sweden,japan,china,india,indonesia,thailand,usa,canada,brazil,mexico,argentina,uae,south-africa}`

**AI Writer 페르소나 (11개)**: `writer-base`, `writer-metaphor-master`, `writer-viral-specialist`, `writer-data-driven`, `writer-storyteller`, `writer-minimalist`, `writer-humor-wit`, `writer-challenger`, `writer-urgency-fomo`, `writer-social-proof`, `writer-sensory-premium`

**오케스트레이션 (2개)**: `workflow-adcopy-production`, `regulatory-copy-validation`

---

## 7. 신규 API 엔드포인트

| 엔드포인트 | 메서드 | 용도 |
|-----------|--------|------|
| `/api/v1/campaigns/generate-copy` | POST | **변경됨** — DeepAgent 기반 카피 생성 (스킬 자동 선택 + 컨텍스트 주입) |
| `/api/v1/campaigns/generate-copy-candidates` | POST | 페르소나 기반 다중 후보 생성 (2~3 페르소나 병렬 → candidates 배열 반환) |
| `/api/v1/personas` | GET | AI Writer 페르소나 목록 (id, name, avatar, color, tags, temperature) |
| `/api/v1/culture-profiles` | GET | 국가별 문화 프로필 목록 (id, description, country_code) |
| `/api/v1/skills/catalog` | GET | 전체 스킬 카탈로그 (카테고리별 분류 포함, 61개) |

---

## 8. 스킬 시스템 아키텍처

### 8-A. 3-Tier 스킬 실행 구조

```
┌─────────────────────────────────────────────────────────┐
│                  Skill Catalog (catalog.py)              │
│  get_all_skills() → 61개 통합 목록                       │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Code Builtin│  │  SKILL.md    │  │ Custom (file)  │  │
│  │ (6개)       │  │  (54개)      │  │ (N개)          │  │
│  │ Python 함수 │  │ YAML+MD 파일 │  │ template+YAML  │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬─────────┘  │
│         │               │                 │             │
│  ┌──────▼──────┐  ┌─────▼────────┐  ┌─────▼──────────┐  │
│  │BUILTIN_     │  │skillmd_      │  │custom_runner.py│  │
│  │REGISTRY[id] │  │runner.py     │  │(template 렌더) │  │
│  │(직접 실행)  │  │(body→LLM)    │  │({{var}}→LLM)   │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 8-B. DeepAgent 실행 흐름

```
generate_copy() 호출
        ↓
_plan_skills()
  ├─ 스킬 카탈로그 로딩 (loader.list_skills())
  ├─ LLM이 캠페인 컨텍스트에 맞는 스킬 선택
  └─ 폴백: select_generation_skills() (기본 스킬셋)
        ↓
_build_skill_context()
  ├─ 선택된 스킬의 SKILL.md body 로딩
  └─ LLM 컨텍스트 블록 조합 (## SKILL: name\n{body})
        ↓
LLM 호출 (시스템 프롬프트에 스킬 지침 포함)
        ↓
_generate_skill_reviews()
  └─ 각 스킬 관점에서 한국어 검토 요약 생성
        ↓
결과: {copies, selected_skills, skill_reviews, elapsed_ms}
```

### 8-C. 페르소나 기반 후보 경쟁 생성

```
generate_copy_with_personas() 호출
        ↓
select_personas_for_campaign()
  ├─ 캠페인 목표 키워드 → 태그 매칭
  ├─ 점수 기반 랭킹 (태그 오버랩)
  └─ Top 2~3 페르소나 선택
        ↓
asyncio.gather() — 페르소나별 병렬 생성
  ├─ 🎨 writer-metaphor-master (emotion, premium)
  ├─ 👑 writer-sensory-premium (luxury, lifestyle)
  └─ 📖 writer-storyteller (branding, emotion)
        ↓
결과: {candidates[], selected_personas[], elapsed_ms}
  각 candidate = {persona_id, persona_name, copies[], selected_skills[], skill_reviews{}}
```

### 8-D. 스킬 라우팅 정책

```python
# 필수 평가 스킬 (항상 포함)
MUST_HAVE_EVAL = [
    "brand-lexicon-check",        # LG 브랜드 용어
    "compliance-redflag-detector", # 법적 리스크 (Hard gate)
    "lg-brand-fit-check",         # LG 브랜드 부합도
]

# 조건부 트리거 (키워드 매칭 시 자동 추가)
CONDITIONAL_TRIGGERS = {
    "ai-washing-risk-check":           [r"\bai\b", r"인공지능", r"자동화"],
    "environmental-claim-risk-check":  [r"친환경", r"환경", r"esg"],
    "comparative-ad-risk-check":       [r"비교", r"경쟁", r"vs", r"1위"],
}

# 생성 스킬 (시장별 문화 프로필 자동 주입)
select_generation_skills(market="JP")
→ ["global-core-copy-generation", "tone-and-voice-enforcer",
   "headline-body-cta-composer", "culture-japan", "lg-brand-voice"]
```

---

## 9. 검증 결과

```
=== Skill System Summary ===
Total skills in catalog: 61
  - Code builtin (Python): 6
  - SKILL.md based: 54
  - AI Writer personas: 10
  - Culture profiles: 20
  - Evaluation skills: 14
  - Generation skills: 17

Auto-selected eval skills for "LG OLED TV 프리미엄 캠페인" (10개):
  - brand-lexicon-check (필수)
  - compliance-redflag-detector (필수)
  - lg-brand-fit-check (필수)
  - comparative-ad-risk-check (조건부 트리거: "경쟁사 대비")
  - ai-washing-risk-check (조건부 트리거: "AI")
  - claim-extractor, competitive-differentiation-review,
    competitor-copy-contrast-check, copy-scorecard-generator,
    creative-impact-scorer

Persona selection for "프리미엄 감성 브랜딩":
  → 🎨 writer-metaphor-master, 👑 writer-sensory-premium, 📖 writer-storyteller

Persona selection for "SNS 바이럴 프로모션":
  → ⏰ writer-urgency-fomo, ⚡ writer-viral-specialist, 😉 writer-humor-wit

Generation skills for Japan:
  → global-core-copy-generation, tone-and-voice-enforcer,
    headline-body-cta-composer, culture-japan, lg-brand-voice
```

---

## 10. SKILL.md 파일 포맷

```yaml
---
name: skill-name-kebab-case
description: 스킬 한글 설명
domain: adcopy
owner_team: marketing-platform
risk_level: low|medium|high
skill_type: capability|orchestration|procedure
version: 1.0.0
action_tags: [generation|evaluation|localization]
role_tags: [AI 작가|컴플라이언스|현지화|품질 검수]
human_review:
  required_for: [hard_fail_conditions]
  approve_roles: [brand_manager|compliance]
tool_policy:
  allowed: [docs.read, brand_guide.read, policy.read]
  approval_required: [external.publish, bulk.export]
outputs: []
calls_skills: []
---

# skill-name

## 사용 조건
트리거 조건 정의

## 입력
필수 입력 계약

## 출력
출력 계약

## 실행 단계
실행 단계와 가드레일
```

---

## 11. 호환성 고려사항

- 기존 6개 빌트인 스킬(Python 함수 기반)은 **그대로 유지** — SKILL.md 기반과 병존
- `catalog.py`에서 3-tier 통합: 코드 빌트인(6) + SKILL.md(54) + 커스텀(N) → 중복 제거 후 반환
- `runner.py`에서 실행 시 `skill_type`에 따라 자동 분기:
  - `builtin` → Python 함수 직접 실행 (BUILTIN_REGISTRY)
  - `skillmd` → SKILL.md body를 LLM 프롬프트에 주입 (skillmd_runner)
  - `custom` → prompt_template 변수 치환 후 LLM 호출 (custom_runner)
- `auto_select=True` 모드로 `run_review()` 호출 시 routing_policy가 자동으로 스킬 선택
- 프론트엔드 스킬 목록/선택 UI는 최소 변경 (카테고리 확장만 필요)
- 기존 `/api/v1/skills` 엔드포인트는 확장된 카탈로그를 그대로 반환 (하위 호환)
