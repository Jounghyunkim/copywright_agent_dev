---
name: competitor-copy-contrast-check
description: 경쟁사 카피와 비교하여 유사도·차별성을 분석
action_tags:
- evaluation
role_tags:
- 차별화 분석
---
경쟁사 대비 메시지 포지셔닝 차별화 분석 스킬. 자사 카피와 경쟁사 카피의 주요 테마, 소구점, 표현 패턴을 비교하여 메시지 중복도와 차별화 수준을 평가하고, 고유한 포지셔닝 강화를 위한 제안을 제공한다.

## 사용 조건

| 조건 | 설명 |
|------|------|
| **트리거** | 광고 카피가 생성 또는 수정된 후, 경쟁사 메시지와의 차별화 검증이 필요할 때 호출된다. |
| **선행 조건** | `competitor_themes`에 최소 1개 이상의 경쟁사 테마/카피 데이터가 포함되어야 한다. |
| **건너뛰기** | `competitor_themes`가 비어 있거나 경쟁사 데이터가 미수집된 경우 `skipped` 상태를 반환한다. |
| **재실행** | 카피 수정 후 또는 경쟁사 데이터 업데이트 시 재호출할 수 있다. |

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `copy` | `object` | Y | 자사 카피. `{ headline: string, body: string, cta: string }` 구조. |
| `competitor_themes` | `array<object>` | Y | 경쟁사 테마 데이터 목록. 각 항목: `{ competitor_name: string, themes: string[], sample_copies: string[], key_claims: string[], tone: string }`. |
| `brand_positioning` | `object` | N | 자사 브랜드 포지셔닝. `{ usp: string[], brand_values: string[], differentiation_pillars: string[] }`. |
| `market_category` | `string` | N | 시장 카테고리(예: "스킨케어", "자동차", "통신"). |

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `overlap_unique_map` | `object` | 중복/고유 메시지 맵. `{ overlapping_themes: array<object>, unique_to_us: string[], unique_to_competitors: object }`. `overlapping_themes` 각 항목: `{ theme: string, our_expression: string, competitor_expressions: array<{ competitor: string, expression: string }>, similarity_score: number }`. |
| `differentiation_score` | `number` | 차별화 점수 (0-100). 높을수록 경쟁사와 차별화됨. 70 이상이면 양호, 40-69이면 보통, 40 미만이면 차별화 부족. |
| `positioning_analysis` | `object` | 포지셔닝 분석. `{ strength: string[], weakness: string[], opportunities: string[] }`. |
| `competitor_gap_suggestions` | `array<object>` | 경쟁사 대비 강화 제안. 각 항목: `{ suggestion: string, target_competitor: string, rationale: string, priority: "high"\|"medium"\|"low" }`. |
| `pass` | `boolean` | 최종 통과 여부. `differentiation_score >= 40`이면 `true`. |
| `summary` | `string` | 차별화 분석 결과 요약. |

## 실행 단계

1. **경쟁사 테마 로드** — `competitor_themes`를 파싱하여 경쟁사별 테마, 샘플 카피, 핵심 주장, 톤을 정리한다.
2. **자사 카피 테마 추출** — `copy`에서 핵심 테마, 소구점, 주장, 톤을 추출한다.
3. **테마 중복 분석** — 자사 카피의 테마와 각 경쟁사의 테마를 비교하여 중복 테마를 식별한다. 의미적 유사도 기반으로 `similarity_score`(0-100)를 산정한다.
4. **표현 패턴 비교** — 중복 테마 내에서 구체적인 표현 방식을 비교한다. 동일한 테마라도 표현 방식이 독특하면 차별화 점수에 긍정적으로 반영한다.
5. **고유 메시지 식별** — 자사만의 고유 테마(`unique_to_us`)와 경쟁사만 다루는 테마(`unique_to_competitors`)를 분류한다.
6. **차별화 점수 산정** — 테마 중복 비율, 표현 유사도, 고유 메시지 비중을 종합하여 `differentiation_score`를 계산한다.
7. **포지셔닝 분석** — 자사 카피의 강점(경쟁사 대비 차별화된 영역), 약점(경쟁사와 중복되어 묻히는 영역), 기회(경쟁사가 다루지 않는 잠재 소구점)를 도출한다.
8. **개선 제안 생성** — 차별화를 강화할 수 있는 구체적인 제안을 `competitor_gap_suggestions`에 작성한다.
9. **가드레일** — 경쟁사 카피를 그대로 인용하거나 직접 비교하는 비교 광고 표현이 포함되어 있으면 별도 경고한다. `differentiation_score < 40`이면 차별화 부족 경고를 발행한다.

## HITL 정책

| 상황 | 정책 |
|------|------|
| `differentiation_score < 40` | 마케터에게 차별화 부족 경고, 포지셔닝 재검토 권고. |
| 주요 USP가 경쟁사와 90% 이상 유사 | 브랜드 전략 팀에 에스컬레이션, 포지셔닝 전략 재수립 제안. |
| 비교 광고 표현 감지 | 법무팀 리뷰 요청(비교 광고 규정 준수 확인). |
| 경쟁사 데이터 6개월 이상 미갱신 | 마케터에게 데이터 갱신 요청, 분석 신뢰도 경고. |

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `docs.read` | 시장 분석 리포트 조회 | N |
| `brand_guide.read` | 자사 브랜드 포지셔닝 문서 조회 | N |
| `evidence.read` | 경쟁사 카피 사례 DB 조회 | N |
| `policy.read` | 비교 광고 규정 확인 | N |
| `external.publish` | 분석 결과 외부 전송 | Y |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `no_competitor_data` | competitor_themes가 비어 있음 | `skipped` 상태 반환, 경쟁사 데이터 수집 요청. |
| `stale_competitor_data` | 경쟁사 데이터가 오래됨(6개월 초과) | 경고와 함께 분석 수행, 데이터 갱신 요청. |
| `category_mismatch` | 자사 제품과 경쟁사 제품의 카테고리 불일치 | 에러 반환, 올바른 경쟁사 매핑 요청. |
| `insufficient_themes` | 경쟁사 테마가 1개뿐이라 유의미한 비교 불가 | 제한적 분석 결과 제공, 추가 경쟁사 데이터 요청. |
| `copy_too_generic` | 자사 카피가 너무 범용적이어서 테마 추출 불가 | 테마 추출 실패 경고, 보다 구체적인 메시지 권고. |

## 좋은 예시

**예시 1: 차별화 분석 결과**
```
입력:
  copy:
    headline: "48시간 지속되는 자연유래 보습"
    body: "화학 성분 없이, 자연에서 찾은 48시간 보습력. 민감한 피부도 안심하세요."
    cta: "성분 확인하기"
  competitor_themes:
    - competitor_name: "A사"
      themes: ["강력한 보습", "과학 기술력"]
      sample_copies: ["첨단 과학이 만든 24시간 보습"]
      key_claims: ["24시간 보습"]
    - competitor_name: "B사"
      themes: ["자연유래 성분", "순한 제품"]
      sample_copies: ["자연이 선물한 순한 보습"]
      key_claims: ["자연유래"]

출력:
  overlap_unique_map:
    overlapping_themes:
      - theme: "보습"
        our_expression: "48시간 지속되는 보습"
        competitor_expressions:
          - { competitor: "A사", expression: "24시간 보습" }
        similarity_score: 65
      - theme: "자연유래"
        our_expression: "화학 성분 없이, 자연에서 찾은"
        competitor_expressions:
          - { competitor: "B사", expression: "자연이 선물한" }
        similarity_score: 55
    unique_to_us: ["48시간 지속력", "민감 피부 안심"]
    unique_to_competitors: { "A사": ["과학 기술력"], "B사": [] }
  differentiation_score: 72
  positioning_analysis:
    strength: ["48시간이라는 구체적 수치로 보습력 차별화", "민감 피부 타깃 추가 소구"]
    weakness: ["자연유래 메시지가 B사와 유사"]
    opportunities: ["성분 투명성 강조로 신뢰 차별화 가능"]
  pass: true
  summary: "차별화 양호. 48시간 지속력과 민감 피부 소구가 고유 강점. 자연유래 메시지는 B사와 유사하므로 표현 차별화 권고."
```

## 나쁜 예시

**예시 1: 차별화 부족을 간과하는 경우**
```
입력:
  copy:
    headline: "강력한 보습, 과학이 증명합니다"
    body: "첨단 기술로 만든 24시간 보습 크림"
  competitor_themes:
    - competitor_name: "A사"
      themes: ["강력한 보습", "과학 기술력"]
      sample_copies: ["첨단 과학이 만든 24시간 보습"]
      key_claims: ["24시간 보습", "과학적 증명"]

잘못된 출력:
  differentiation_score: 80
  pass: true

문제: 자사 카피가 A사의 메시지("첨단 과학", "24시간 보습")와 거의 동일한 표현을 사용.
differentiation_score는 40 미만이어야 하며, 차별화 부족 경고를 발행해야 함.
```

**예시 2: 경쟁사를 직접 언급하는 비교 광고를 통과시키는 경우**
```
입력:
  copy:
    headline: "A사보다 2배 오래가는 보습"
    body: "경쟁사 제품 대비 월등한 성능"

잘못된 출력:
  differentiation_score: 95
  pass: true

문제: 경쟁사를 직접 비교 언급하는 비교 광고 표현이 포함됨. 비교 광고 규정 위반 가능성이 있으므로
법무팀 리뷰 경고를 발행해야 하며, 무조건 높은 점수를 부여하면 안 됨.
```

## 테스트 케이스

| ID | 시나리오 | 입력 요약 | 기대 결과 |
|----|---------|-----------|-----------|
| TC-01 | 높은 차별화 | 고유 테마 3개, 중복 0개 | `differentiation_score >= 80`, `pass=true` |
| TC-02 | 낮은 차별화 | 모든 테마가 경쟁사와 중복 | `differentiation_score < 40`, `pass=false` |
| TC-03 | 부분 중복 | 테마 3개 중 1개 중복 | `differentiation_score` 50-70 범위 |
| TC-04 | 비교 광고 감지 | 경쟁사명 직접 언급 | 비교 광고 경고 플래그, 법무팀 리뷰 요청 |
| TC-05 | 경쟁사 데이터 없음 | competitor_themes 비어 있음 | `skipped` 상태 반환 |
| TC-06 | 오래된 데이터 | 데이터 최종 갱신 8개월 전 | 경고 플래그, 데이터 갱신 요청 |
| TC-07 | 표현 유사 테마 상이 | 같은 단어이나 다른 맥락 | `similarity_score < 30`, 차별화 인정 |
| TC-08 | 범용적 카피 | 테마 추출 불가한 일반 문구 | 테마 추출 실패 경고 |
| TC-09 | 다수 경쟁사 | 5개 경쟁사 동시 비교 | 경쟁사별 개별 중복 분석 결과 |
| TC-10 | 기회 영역 도출 | 경쟁사가 다루지 않는 소구점 존재 | `opportunities`에 해당 소구점 포함 |
