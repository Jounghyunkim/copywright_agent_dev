---
name: competitive-differentiation-review
description: 경쟁사 대비 차별화 포인트가 카피에 반영되었는지 검토
action_tags:
- evaluation
role_tags:
- 차별화 분석
---
경쟁사 대비 차별화 강도와 법적 리스크를 동시에 평가하는 프로시저 스킬이다. 후보 카피가 경쟁사와 충분히 차별화되는지 검증하고, 비교 광고 관련 법적 리스크를 식별하여 안전한 대안을 제시한다.

---

## 사용 조건

| 조건 | 설명 |
|------|------|
| 경쟁 환경 분석 필요 | 카피가 경쟁사와의 차별화를 주장하거나 암시할 때 |
| 비교 광고 검토 | 직접적 또는 간접적으로 경쟁사를 언급/비교하는 카피 |
| 차별화 전략 검증 | USP 기반 카피가 실제로 시장에서 차별화되는지 확인할 때 |
| 신규 시장 진입 | 새로운 시장에서 기존 경쟁사 대비 포지셔닝을 잡을 때 |

**선행 조건:**
- `candidate_copy`가 최소 1개 이상 존재해야 한다.
- `competitor_themes`에 주요 경쟁사의 광고 테마/메시지가 포함되어야 한다.

---

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `candidate_copy` | `list[CopyCandidate]` | Y | 차별화 평가 대상 카피 후보 목록 |
| `competitor_themes` | `list[CompetitorTheme]` | Y | 경쟁사별 광고 테마, 핵심 메시지, 슬로건 |
| `market_context` | `MarketContext` | N | 해당 시장의 경쟁 구도, 소비자 인식 |
| `brand_positioning` | `BrandPositioning` | N | 자사 브랜드 포지셔닝 전략 |
| `comparison_regulations` | `ComparisonRegulations` | N | 해당 국가의 비교 광고 규정 |
| `historical_copies` | `list[HistoricalCopy]` | N | 자사 기존 카피 이력 (메시지 일관성 확인용) |

---

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `differentiation_score` | `dict[str, float]` | 카피별 차별화 강도 점수 (0.0-1.0) |
| `comparative_ad_risk` | `dict[str, RiskLevel]` | 카피별 비교 광고 법적 리스크 수준 (red/amber/green) |
| `similarity_analysis` | `list[SimilarityReport]` | 경쟁사 카피와의 유사도 분석 결과 |
| `safe_alternatives` | `list[SafeAlternative]` | 리스크를 제거하면서 차별화를 유지하는 대안 표현 |
| `positioning_alignment` | `dict[str, float]` | 브랜드 포지셔닝과의 정합성 점수 |

---

## 실행 단계

```
1. 경쟁 테마 매핑
   → competitor_themes에서 경쟁사별 핵심 메시지, 톤, 주요 키워드 추출
   → 테마별 클러스터링 수행
   → 자사 candidate_copy와의 메시지 영역 중첩도 파악

2. [competitor-copy-contrast-check] 경쟁사 카피 대비 차별화 분석
   → 각 candidate_copy와 competitor_themes 간 의미적 유사도 측정
   → 차별화 포인트 식별 (메시지, 톤, USP, 표현 방식)
   → differentiation_score 산출
   → 유사도가 높은 경쟁사 카피 명시

3. [comparative-ad-risk-check] 비교 광고 법적 리스크 평가
   → 직접 비교 표현 (사명, 제품명 언급) 탐지
   → 간접 비교 표현 ("타사 대비", "업계 유일" 등) 탐지
   → comparison_regulations 기반 법적 적합성 판정
   → comparative_ad_risk 산출

4. 안전 대안 생성
   → 리스크가 감지된 표현에 대해 차별화를 유지하면서 법적으로 안전한 대안 생성
   → 차별화 강도를 최소한으로 훼손하는 방향으로 대안 설계
   → safe_alternatives 목록 구성

5. 종합 리포트 구성
   → differentiation_score + comparative_ad_risk를 종합
   → positioning_alignment 평가 (브랜드 포지셔닝과 카피 방향성 일치도)
   → 최종 권고: 사용 가능 / 수정 후 사용 / 사용 불가
```

**가드레일:**
- differentiation_score가 0.3 미만인 카피는 "경쟁사와 차별화 부족" 경고를 발행한다.
- 직접 비교 표현(경쟁사명 언급)은 자동으로 amber 이상으로 판정한다.
- 법적 리스크가 red인 카피는 safe_alternatives 없이 출력하지 않는다.
- 경쟁사 카피와의 유사도가 0.8 이상이면 표절 리스크 경고를 추가한다.

---

## HITL 정책

| 게이트 | 승인 역할 | 조건 |
|--------|-----------|------|
| 비교 광고 법무 리뷰 | 법무팀 | comparative_ad_risk가 amber 이상일 때 |
| 차별화 전략 리뷰 | 마케팅 전략팀 | differentiation_score가 0.3-0.5 구간일 때 |
| 경쟁사 직접 비교 승인 | 법무팀 + CMO | 경쟁사명을 직접 언급하는 비교 광고 사용 시 |
| 표절 리스크 리뷰 | 법무팀 | 경쟁사 카피 유사도 0.8 이상 |

- 비교 광고 관련 법적 리스크는 마케팅 부서 단독으로 승인할 수 없으며, 반드시 법무 리뷰를 거쳐야 한다.
- 경쟁사명 직접 언급은 CMO 수준의 승인이 필수이다.

---

## 도구 정책

| 도구 | 권한 | 설명 |
|------|------|------|
| `docs.read` | 허용 | 경쟁사 분석 보고서, 시장 조사 자료 조회 |
| `brand_guide.read` | 허용 | 자사 브랜드 포지셔닝 문서 조회 |
| `policy.read` | 허용 | 비교 광고 규정, 공정거래 관련 법규 조회 |
| `evidence.read` | 허용 | 경쟁사 광고 아카이브, 시장 점유율 데이터 조회 |
| `external.publish` | 승인 필요 | 비교 광고 표현이 포함된 카피 발행 |
| `bulk.export` | 승인 필요 | 경쟁 분석 결과 일괄 내보내기 |
| `system.write` | 승인 필요 | 차별화 평가 결과 기록 |

---

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| 경쟁사 데이터 부족 | competitor_themes가 비어있거나 오래됨 | 워크플로 중단, 최신 경쟁사 분석 요청 |
| 차별화 포인트 부재 | 모든 후보의 differentiation_score가 0.3 미만 | 카피 전략 재수립 권고, 마케팅 전략팀 에스컬레이션 |
| 법적 리스크 과다 | 모든 후보가 red 판정 | 비교 표현 전면 재작성 권고, safe_alternatives만 반환 |
| 표절 감지 | 경쟁사 카피와 유사도 0.9 이상 | 해당 카피 즉시 차단, 완전 재작성 요청 |
| 규정 미비 | 해당 국가의 비교 광고 규정 없음 | 가장 보수적 기준(EU 기준) 적용, 경고 발행 |
| 포지셔닝 불일치 | 카피 방향이 brand_positioning과 괴리 | positioning_alignment 경고, 전략 정합성 재검토 요청 |

---

## 좋은 예시

**시나리오:** 스킨케어 브랜드 카피의 차별화 검증

```yaml
입력:
  candidate_copy:
    - id: v1
      headline: "자연이 만든 보습, HydraShield"
      body: "특허 성분 HydraShield로 24시간 깊은 보습을 경험하세요."
  competitor_themes:
    - competitor: "A사"
      theme: "자연 유래 성분 강조"
      key_message: "자연에서 온 보습력"
      slogan: "Nature's Touch"
    - competitor: "B사"
      theme: "기술력 기반 보습"
      key_message: "과학이 증명한 보습"
      slogan: "Science of Skin"

결과:
  differentiation_score: { v1: 0.72 }
  comparative_ad_risk: { v1: green }
  similarity_analysis:
    - { competitor: "A사", similarity: 0.65, overlap: "자연 유래 보습 메시지 영역 중첩" }
    - { competitor: "B사", similarity: 0.25, overlap: "낮음" }
  positioning_alignment: { v1: 0.88 }
  safe_alternatives: []  # 리스크 없으므로 대안 불필요
```

---

## 나쁜 예시

**시나리오:** 경쟁사를 직접 비하하는 카피

```yaml
문제:
  - "A사 제품은 피부에 자극을 줄 수 있지만, 우리 제품은 안전합니다" 표현 사용
  - 경쟁사 제품의 부정적 주장에 대한 객관적 근거 없음

결과:
  comparative_ad_risk: { v1: red }
  detail_findings:
    - { type: "direct_comparison", severity: "red", reason: "근거 없는 경쟁사 비하" }
    - { type: "unfair_comparison", severity: "red", reason: "공정거래법 위반 가능성" }
  safe_alternatives:
    - { original: "A사 제품은 피부에 자극을 줄 수 있지만", suggested: "민감한 피부도 안심하고 사용할 수 있는", reason: "경쟁사 비하 제거, 자사 장점 부각으로 전환" }
```

**시나리오:** 경쟁사 슬로건과 거의 동일한 카피

```yaml
문제:
  - "Nature's Care" 슬로건 사용 (A사의 "Nature's Touch"와 유사)
  - differentiation_score 0.18

결과:
  differentiation_score: { v1: 0.18 }
  similarity_analysis:
    - { competitor: "A사", similarity: 0.87, overlap: "슬로건 구조 및 키워드 거의 동일" }
  경고: "경쟁사 A사의 슬로건과 유사도가 0.87로 표절 리스크가 있습니다"
  권고: "완전히 다른 방향의 슬로건을 재작성하세요"
```

---

## 테스트 케이스

| ID | 시나리오 | 입력 조건 | 기대 결과 |
|----|----------|-----------|-----------|
| TC-01 | 정상 차별화 확인 | 경쟁사와 명확히 차별화된 카피 | differentiation_score 0.7+, green 판정 |
| TC-02 | 경쟁사 직접 비교 | 경쟁사명 언급 비교 표현 | amber 이상 판정, 법무 리뷰 라우팅 |
| TC-03 | 경쟁사 비하 표현 | 근거 없는 경쟁사 부정적 주장 | red 판정, safe_alternatives 제공 |
| TC-04 | 차별화 부족 | 경쟁사와 메시지 중첩 높음 | differentiation_score 0.3 미만, 전략 재수립 권고 |
| TC-05 | 표절 리스크 | 경쟁사 슬로건과 유사도 0.9 | 즉시 차단, 재작성 요청 |
| TC-06 | 포지셔닝 불일치 | 카피 방향이 brand_positioning과 괴리 | positioning_alignment 경고 |
| TC-07 | 규정 미비 국가 | 비교 광고 규정 없는 국가 | 보수적 기준 적용, 경고 발행 |
