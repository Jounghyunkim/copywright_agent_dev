---
name: language-transcreation
description: 단순 번역이 아닌 문화적 맥락을 반영한 트랜스크리에이션 수행
action_tags:
- localization
role_tags:
- 지역화 검증
---
직역이 아닌 설득력 중심의 의미 재창작 스킬. 원본 카피의 핵심 메시지와 감성을 보존하면서, 타깃 언어/문화권에서 자연스럽고 설득력 있는 표현으로 재구성한다.

## 사용 조건

| 조건 | 설명 |
|------|------|
| **트리거** | 글로벌 코어 카피가 확정된 후, 특정 로케일용 카피를 생성해야 할 때 호출된다. |
| **선행 조건** | `source_copy`가 최종 승인 상태여야 하며, `locale_context`에 타깃 언어 코드와 문화적 맥락 정보가 포함되어야 한다. |
| **건너뛰기** | 소스 언어와 타깃 언어가 동일한 경우 `skipped` 상태를 반환한다. |
| **재실행** | 트랜스크리에이션 결과에 대해 피드백이 있으면 `locale_context`에 피드백을 추가하여 재호출할 수 있다. |

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `source_copy` | `object` | Y | 원본 카피. `{ headline: string, body: string, cta: string, source_locale: string }` 구조. |
| `locale_context` | `object` | Y | 타깃 로케일 정보. `{ target_locale: string, cultural_notes: string[], tone_preference: string, character_limit: object, market_context: string }`. |
| `brand_voice` | `object` | N | 브랜드 보이스 가이드라인. 톤, 말투, 금지 표현 등. |
| `previous_feedback` | `string[]` | N | 이전 트랜스크리에이션에 대한 수정 피드백 목록. |

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `transcreated_variants` | `array<object>` | 트랜스크리에이션 결과 후보군. 각 항목: `{ headline: string, body: string, cta: string, approach: string, naturalness_score: number, meaning_preservation_score: number }`. 최소 2개, 최대 5개 변형을 제공한다. |
| `literal_risk_notes` | `array<object>` | 직역 위험 메모. 각 항목: `{ source_phrase: string, literal_translation: string, risk_description: string, recommended_alternative: string }`. |
| `back_translation` | `string` | 대표 변형에 대한 역번역(타깃 -> 소스 언어). 의미 보존 확인용. |
| `quality_metrics` | `object` | `{ avg_naturalness: number, avg_meaning_preservation: number, character_compliance: boolean }`. |
| `summary` | `string` | 트랜스크리에이션 접근 방식과 핵심 변경점 요약. |

## 실행 단계

1. **소스 카피 분석** — 원본 카피의 핵심 메시지, 감성 톤, 설득 구조(문제 제기 -> 해결 -> 행동 유도 등), 언어적 장치(리듬, 두운, 말장난 등)를 추출한다.
2. **문화 맥락 매핑** — `locale_context`의 `cultural_notes`와 `market_context`를 분석하여, 타깃 시장에서 효과적인 설득 전략을 결정한다. 직역 시 의미가 왜곡되거나 자연스럽지 않은 표현을 사전에 식별한다.
3. **직역 위험 분석** — 소스 카피에서 관용구, 문화 특유 표현, 유머, 말장난 등 직역 시 문제가 되는 요소를 추출하고 `literal_risk_notes`를 작성한다.
4. **변형 생성** — 다양한 트랜스크리에이션 전략을 적용하여 최소 2개, 최대 5개의 변형을 생성한다. 각 변형에 접근 방식(예: "감성 호소 강화", "실용적 혜택 중심", "현지 관용구 활용")을 명시한다.
5. **글자수 검증** — `locale_context.character_limit`에 따라 각 변형의 headline, body, cta가 글자수 제한을 충족하는지 확인한다. 초과 시 축약 버전도 함께 제공한다.
6. **자연스러움/의미 보존 평가** — 각 변형에 대해 `naturalness_score`(1-100)와 `meaning_preservation_score`(1-100)를 산정한다. 두 점수의 가중 평균이 70 미만인 변형은 제외한다.
7. **역번역 생성** — 대표 변형(가장 높은 품질 점수)에 대해 타깃 언어에서 소스 언어로 역번역을 수행하여 의미 보존 수준을 검증한다.
8. **가드레일** — 직역 비율이 70% 이상인 변형은 자동 경고 플래그를 부착한다. 브랜드 보이스 가이드라인 위반 시 해당 변형에 `brand_voice_conflict=true` 표시.

## HITL 정책

| 상황 | 정책 |
|------|------|
| 모든 변형의 `meaning_preservation_score < 60` | 원본 카피 작성자에게 에스컬레이션하여 핵심 메시지 재확인 요청. |
| `literal_risk_notes`가 3건 이상 | 현지 마케터에게 직역 위험 항목 리뷰 요청. |
| 타깃 시장이 민감 시장(규제 시장, 종교적 고려 필요 등) | 현지 법무/문화 전문가 리뷰 필수. |
| 글자수 제한 초과 변형만 존재 | 마케터에게 글자수 조정 또는 원본 축약 협의 요청. |
| `previous_feedback` 반영 재실행 | 피드백 반영 여부를 마케터가 최종 확인. |

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `brand_guide.read` | 브랜드 보이스 가이드라인 조회 | N |
| `docs.read` | 로케일별 문화 참고 자료 조회 | N |
| `evidence.read` | 기존 트랜스크리에이션 사례 참조 | N |
| `external.publish` | 트랜스크리에이션 결과 외부 전송 | Y |
| `bulk.export` | 다량 로케일 일괄 내보내기 | Y |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `unsupported_locale` | 타깃 로케일이 지원 범위 밖 | 에러 반환, 지원 로케일 목록 안내. |
| `source_copy_empty` | 소스 카피가 비어 있음 | 에러 반환, 원본 카피 확인 요청. |
| `all_variants_low_quality` | 모든 변형의 품질 점수가 기준 미달 | 에스컬레이션, 소스 카피 단순화 권고. |
| `character_limit_impossible` | 핵심 메시지를 유지하면서 글자수 제한 충족 불가 | 글자수 제한 완화 요청 또는 메시지 분리 제안. |
| `cultural_conflict` | 소스 카피의 핵심 메시지가 타깃 문화와 근본적으로 충돌 | 마케팅 전략 팀에 에스컬레이션, 대체 메시지 제안. |
| `timeout` | 5개 이상 로케일 동시 트랜스크리에이션 시 지연 | 로케일별 순차 처리로 전환, 120초 제한. |

## 좋은 예시

**예시 1: 영어 -> 한국어 트랜스크리에이션**
```
입력:
  source_copy:
    headline: "Wake up to brighter mornings"
    body: "Our new formula works while you sleep, so you can face the day with confidence."
    cta: "Try it free"
    source_locale: "en-US"
  locale_context:
    target_locale: "ko-KR"
    cultural_notes: ["한국 소비자는 구체적인 효능 표현 선호", "무료 체험 문화에 익숙"]
    tone_preference: "친근하면서도 신뢰감 있는"
    character_limit: { headline: 20, body: 60, cta: 10 }

출력:
  transcreated_variants:
    - headline: "자는 동안 달라지는 아침"
      body: "밤사이 작용하는 새로운 포뮬러로, 자신감 넘치는 하루를 시작하세요."
      cta: "무료 체험"
      approach: "시간 대비 효과 강조"
      naturalness_score: 92
      meaning_preservation_score: 88
    - headline: "잠든 사이, 피부가 깨어납니다"
      body: "수면 중 집중 케어하는 신규 포뮬러. 아침이 기대되는 변화를 경험하세요."
      cta: "무료 체험"
      approach: "감성적 호소 + 의인화"
      naturalness_score: 95
      meaning_preservation_score: 82
  literal_risk_notes:
    - source_phrase: "Wake up to brighter mornings"
      literal_translation: "더 밝은 아침에 일어나세요"
      risk_description: "직역 시 화장품 맥락이 사라지고 단순 기상 권유로 읽힘"
      recommended_alternative: "자는 동안 달라지는 아침"
  back_translation: "While you sleep, your skin awakens"
  quality_metrics: { avg_naturalness: 93.5, avg_meaning_preservation: 85, character_compliance: true }
```

**예시 2: 글자수 제한 내 축약 변형 제공**
```
입력:
  source_copy:
    headline: "The ultimate summer getaway package"
    source_locale: "en-US"
  locale_context:
    target_locale: "ja-JP"
    character_limit: { headline: 15 }

출력:
  transcreated_variants:
    - headline: "究極の夏旅パッケージ"
      approach: "직접적 의미 전달"
      naturalness_score: 88
      meaning_preservation_score: 90
    - headline: "この夏、特別な旅へ"
      approach: "감성 호소, 축약형"
      naturalness_score: 94
      meaning_preservation_score: 78
```

## 나쁜 예시

**예시 1: 직역 결과를 트랜스크리에이션으로 제출**
```
입력:
  source_copy:
    headline: "Break the ice with our new collection"
    source_locale: "en-US"
  locale_context:
    target_locale: "ko-KR"

잘못된 출력:
  transcreated_variants:
    - headline: "우리의 새 컬렉션으로 얼음을 깨세요"
      naturalness_score: 90
      meaning_preservation_score: 95

문제: "Break the ice"는 관용구인데 직역하여 의미가 왜곡됨. naturalness_score가 부적절하게 높게 평가됨.
literal_risk_notes가 누락되어 직역 위험을 알리지 못함.
```

**예시 2: 타깃 문화를 고려하지 않은 변형**
```
입력:
  source_copy.body: "Grab a cold one and enjoy the game!"
  locale_context:
    target_locale: "ar-SA"
    cultural_notes: ["주류 광고 금지 지역"]

잘못된 출력:
  transcreated_variants:
    - body: "차가운 맥주를 잡고 경기를 즐기세요!"

문제: 사우디아라비아는 주류 광고가 금지된 시장. 문화적 맥락을 무시한 직역으로 규제 위반.
```

## 테스트 케이스

| ID | 시나리오 | 입력 요약 | 기대 결과 |
|----|---------|-----------|-----------|
| TC-01 | 기본 트랜스크리에이션 | en-US -> ko-KR, 일반 카피 | 최소 2개 변형, naturalness >= 70, meaning_preservation >= 70 |
| TC-02 | 관용구 포함 | 소스에 관용구 2개 포함 | `literal_risk_notes` 2건 이상, 직역 아닌 변형 제공 |
| TC-03 | 글자수 제한 | headline 제한 15자 | 모든 변형이 15자 이내, `character_compliance=true` |
| TC-04 | 동일 언어 | source_locale == target_locale | `skipped` 상태 반환 |
| TC-05 | 역번역 검증 | 대표 변형 선정 후 | `back_translation` 존재, 원본과 의미 유사 |
| TC-06 | 민감 시장 | target_locale=ar-SA, 문화 민감 내용 | HITL 리뷰 플래그 활성화 |
| TC-07 | 품질 미달 변형 | 모든 변형 점수 < 70 | 에스컬레이션 플래그, 빈 `transcreated_variants` 또는 경고 포함 |
| TC-08 | 피드백 반영 재실행 | previous_feedback 포함 | 피드백 내용이 반영된 새 변형 생성 |
| TC-09 | 다수 로케일 | 5개 로케일 동시 요청 | 각 로케일별 독립 결과, 120초 내 완료 |
| TC-10 | 브랜드 보이스 충돌 | 변형이 brand_voice 위반 | `brand_voice_conflict=true` 플래그 부착 |
