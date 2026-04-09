---
name: regional-culture-fit-check
description: 지역 문화적 맥락에 카피가 적합한지 검증
action_tags:
- localization
role_tags:
- 지역화 검증
---
지역 문화 민감성 및 금기 표현 검증 스킬. 광고 카피가 특정 지역/문화권에서 불쾌감, 오해, 법적 문제를 유발할 수 있는 표현을 포함하고 있는지 검사하고, 문화적 적합성을 평가한다.

## 사용 조건

| 조건 | 설명 |
|------|------|
| **트리거** | 로컬 시장용 카피가 생성 또는 트랜스크리에이션된 직후, 퍼블리시 전 단계에서 자동 호출된다. |
| **선행 조건** | `culture_constraints` 데이터가 해당 지역에 대해 존재해야 한다(최소 1건의 문화 민감성 규칙). |
| **건너뛰기** | 해당 지역의 `culture_constraints`가 미등록된 경우 `skipped` 상태를 반환하고, 수동 리뷰 요청 플래그를 설정한다. |
| **재실행** | 카피 수정 후 재검증이 필요하면 동일 입력으로 재호출할 수 있다. |

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `regional_copy` | `object` | Y | 검증 대상 카피. `{ headline: string, body: string, cta: string, locale: string }` 구조. |
| `culture_constraints` | `object` | Y | 지역 문화 제약 조건. `{ taboo_topics: string[], sensitive_symbols: string[], color_restrictions: string[], religious_considerations: string[], gender_norms: string[], political_sensitivities: string[], humor_boundaries: string[] }`. |
| `campaign_context` | `object` | N | 캠페인 맥락 정보. `{ product_category: string, target_audience: string, campaign_season: string }`. |
| `severity_threshold` | `string` | N | 검출 민감도 수준. `"strict"` \| `"moderate"` \| `"lenient"`. 기본값 `"moderate"`. |

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `culture_risk_items` | `array<object>` | 문화 위험 항목 목록. 각 항목: `{ phrase: string, location: "headline"\|"body"\|"cta", risk_category: string, risk_level: "red"\|"yellow"\|"green", explanation: string, suggestion: string }`. |
| `sensitivity_flags` | `array<object>` | 민감성 플래그 목록. 각 항목: `{ flag_type: string, description: string, requires_local_review: boolean }`. |
| `overall_culture_score` | `number` | 전체 문화 적합성 점수 (0-100). |
| `pass` | `boolean` | 최종 통과 여부. `risk_level=red`인 항목이 1건이라도 있으면 `false`. |
| `summary` | `string` | 문화 적합성 검증 결과 요약. |

## 실행 단계

1. **문화 제약 로드** — `culture_constraints`를 파싱하여 금기 주제, 민감 상징, 색상 제한, 종교적 고려사항, 성별 규범, 정치적 민감성, 유머 경계 등 카테고리별 규칙을 적재한다.
2. **카피 분석** — `regional_copy`의 headline, body, cta 각 필드를 대상으로 텍스트 분석을 수행한다. 명시적 표현뿐 아니라 은유, 암시, 이중 의미도 검토한다.
3. **금기 주제 스캔** — 카피 내용이 `taboo_topics`에 해당하는 주제를 직접 또는 간접적으로 언급하는지 검사한다. 해당 시 `risk_level=red`로 분류.
4. **민감 상징/색상 검사** — 텍스트에 포함된 상징적 표현이나 색상 언급이 해당 문화권에서 부정적 의미를 갖는지 확인한다.
5. **종교/성별/정치 민감성 검사** — 종교적 표현, 성별 고정관념, 정치적으로 민감한 표현을 탐지한다.
6. **유머/관용구 적합성 검사** — 유머 표현이나 관용구가 해당 문화권에서 적절한지, 오해 소지가 있는지 평가한다.
7. **위험 수준 분류** — 발견된 모든 위험 항목에 대해 `red`(즉각 차단), `yellow`(주의/수정 권고), `green`(참고 사항)으로 분류한다.
8. **점수 산정** — 위험 항목의 개수와 심각도를 기반으로 `overall_culture_score`를 계산한다. red 항목은 -30점, yellow는 -10점, green은 -2점.
9. **가드레일** — `risk_level=red` 항목 존재 시 해당 카피의 퍼블리시를 자동 차단한다. 모든 red 항목에 대해 대체 표현(`suggestion`)을 반드시 제공한다. `sensitivity_flags`에 현지 전문가 리뷰 필요 여부를 명시한다.

## HITL 정책

| 상황 | 정책 |
|------|------|
| `risk_level=red` 항목 발견 | 퍼블리시 자동 차단. 현지 문화 전문가 리뷰 필수. |
| `risk_level=yellow` 항목 3건 이상 | 현지 마케터 리뷰 요청. |
| 종교적 고려사항 관련 위험 | 해당 지역 법무팀 + 문화 전문가 공동 리뷰. |
| 정치적 민감성 관련 위험 | 글로벌 커뮤니케이션 팀 에스컬레이션. |
| `culture_constraints` 미등록 지역 | 수동 리뷰 필수, 현지 팀에게 제약 조건 등록 요청. |

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `docs.read` | 지역 문화 가이드 참조 | N |
| `policy.read` | 지역별 광고 규제 확인 | N |
| `evidence.read` | 과거 문화 이슈 사례 조회 | N |
| `brand_guide.read` | 브랜드 글로벌 문화 정책 조회 | N |
| `external.publish` | 검증 결과 외부 전송 | Y |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `constraints_not_found` | 해당 지역의 culture_constraints 미등록 | `skipped` 반환, 수동 리뷰 요청 플래그 설정, 현지 팀에 등록 요청. |
| `locale_mismatch` | regional_copy.locale과 culture_constraints 지역 불일치 | 에러 반환, 올바른 locale 매핑 안내. |
| `ambiguous_context` | 카피의 맥락이 불명확하여 문화 위험 판단 불가 | 해당 항목을 `yellow`로 분류, 맥락 보충 요청. |
| `over_detection` | 과도한 탐지로 오탐 다수 발생 | `severity_threshold` 조정 권고, 오탐 항목에 `confidence_score` 추가. |
| `multi_culture_overlap` | 한 지역 내 다문화 상황(예: 말레이시아) | 모든 주요 문화권 규칙을 병합 적용, 가장 엄격한 기준 우선. |

## 좋은 예시

**예시 1: 중동 시장 금기 표현 탐지**
```
입력:
  regional_copy:
    headline: "올 여름, 시원한 맥주와 함께!"
    body: "무더위를 날려줄 프리미엄 음료를 만나보세요."
    cta: "지금 주문"
    locale: "ar-SA"
  culture_constraints:
    taboo_topics: ["주류", "도박", "성적 표현"]
    religious_considerations: ["이슬람 율법 준수"]

출력:
  culture_risk_items:
    - phrase: "맥주"
      location: "headline"
      risk_category: "taboo_topics"
      risk_level: "red"
      explanation: "사우디아라비아에서 주류 관련 광고는 법적으로 금지됨."
      suggestion: "시원한 음료" 또는 "프리미엄 음료"로 대체
  sensitivity_flags:
    - flag_type: "religious_compliance"
      description: "주류 언급이 이슬람 율법 위반 소지"
      requires_local_review: true
  overall_culture_score: 30
  pass: false
  summary: "주류 관련 금기 표현 1건 발견. 사우디 시장 퍼블리시 불가. 표현 수정 필요."
```

**예시 2: 전체 통과**
```
입력:
  regional_copy:
    headline: "가족과 함께하는 따뜻한 겨울"
    body: "소중한 사람들과 특별한 순간을 만들어보세요."
    cta: "자세히 보기"
    locale: "ko-KR"
  culture_constraints:
    taboo_topics: ["정치적 편향"]
    sensitive_symbols: ["특정 정당 상징"]

출력:
  culture_risk_items: []
  sensitivity_flags: []
  overall_culture_score: 98
  pass: true
  summary: "문화 위험 항목 없음. 퍼블리시 가능."
```

## 나쁜 예시

**예시 1: 고위험 민감성을 간과하는 경우**
```
입력:
  regional_copy:
    headline: "운이 좋은 당신에게, 4가지 특별 혜택!"
    locale: "zh-CN"
  culture_constraints:
    sensitive_symbols: ["숫자 4는 '죽음(死)'과 동음으로 불길하게 인식"]

잘못된 출력:
  culture_risk_items: []
  pass: true

문제: 중국 문화권에서 숫자 4는 죽음을 연상시키는 금기 숫자. "4가지 특별 혜택"을 그대로 통과시키면 안 됨.
최소 yellow 경고로 분류하고 "3가지" 또는 "5가지"로 변경 제안 필요.
```

**예시 2: 성별 고정관념을 탐지하지 못하는 경우**
```
입력:
  regional_copy:
    body: "남편을 위한 완벽한 저녁, 현명한 아내의 선택"
    locale: "se-SE"
  culture_constraints:
    gender_norms: ["성별 고정관념 표현 금지"]

잘못된 출력:
  culture_risk_items: []
  pass: true

문제: 스웨덴은 성평등 의식이 높은 사회. "아내의 선택"을 요리와 연결하는 성별 고정관념 표현을 탐지하지 못함.
```

## 테스트 케이스

| ID | 시나리오 | 입력 요약 | 기대 결과 |
|----|---------|-----------|-----------|
| TC-01 | 금기 주제 탐지 | 주류 금지 지역에 주류 표현 포함 | `risk_level=red` 1건, `pass=false` |
| TC-02 | 숫자 민감성 | 중국 시장에 숫자 4 사용 | `risk_level=yellow` 이상 1건 |
| TC-03 | 종교 민감성 | 이슬람 문화권에 종교 부적절 표현 | `risk_level=red`, `requires_local_review=true` |
| TC-04 | 성별 고정관념 | 성평등 중시 지역에 성별 편향 표현 | `risk_level=yellow` 이상 1건 |
| TC-05 | 정치적 민감성 | 정치적으로 민감한 표현 포함 | 에스컬레이션 플래그 활성화 |
| TC-06 | 전체 통과 | 문화 위험 없는 중립적 카피 | `pass=true`, `overall_culture_score >= 90` |
| TC-07 | 제약 미등록 지역 | culture_constraints 없음 | `skipped` 상태, 수동 리뷰 플래그 |
| TC-08 | 다문화 지역 | 말레이시아(말레이/중국/인도 문화) | 모든 문화권 규칙 병합 적용 |
| TC-09 | 과탐지 | 매우 엄격한 threshold 적용 | 오탐 항목에 `confidence_score` 포함 |
| TC-10 | 색상 민감성 | 흰색이 애도 색상인 문화권에 "순백" 표현 | `risk_level=yellow`, 대체 표현 제안 |
