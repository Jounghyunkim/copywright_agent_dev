---
name: comparative-ad-risk-check
description: 비교 광고 표현의 법적 리스크와 근거 충분성을 검증
action_tags:
- evaluation
role_tags:
- 컴플라이언스
---
비교광고 표현의 법적 리스크를 평가하여, 경쟁사 비하 또는 근거 없는 비교 우위 주장이 광고에 포함되지 않도록 사전 검증한다.

## 사용 조건

이 스킬은 다음 상황에서 트리거된다.

- 광고 카피에 "업계 최초", "1위", "최고", "유일한", "보다 우수한", "비교 불가" 등 비교/최상급 표현이 포함된 경우
- 경쟁사 또는 경쟁 제품을 직접/간접적으로 언급하는 경우
- "A사 대비", "기존 제품 대비", "타사 제품과 달리" 등 직접 비교 구문이 존재하는 경우
- 성능/가격/품질 등에서 우위를 주장하는 표현이 포함된 경우

## 입력

필수 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `competitor_comparative_phrases` | `list[dict]` | 비교 표현이 포함된 문장 목록. 각 항목에 `phrase`, `comparison_target`(경쟁사/제품명 또는 "업계"), `comparison_type`(직접비교/간접비교/최상급) 포함 |

선택 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `supporting_evidence` | `list[dict]` | 비교 주장을 뒷받침하는 근거. `claim_ref`, `source`(공인기관/자체조사/제3자조사), `date`, `url` 포함 |
| `target_market` | `str` | 타겟 시장. 한국/EU/미국 등 비교광고 규제 차이 반영 |
| `industry_category` | `str` | 산업 분류. 의약품/금융 등 비교광고 제한이 강한 분야 |

## 출력

주요 출력:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `judgments` | `list[dict]` | 각 비교 표현에 대한 판정. `phrase`, `verdict`(`permitted`/`caution`/`prohibited`), `reason`, `suggestion` 포함 |
| `overall_risk` | `str` | 종합 리스크 수준. `low` / `medium` / `high` / `critical` |
| `hard_fail` | `bool` | 경쟁사 실명 비하 또는 근거 없는 비교 우위 주장 시 `true` |
| `fail_reason` | `str` | hard_fail 사유 설명 |
| `permitted_count` | `int` | 허용 판정 건수 |
| `caution_count` | `int` | 주의 판정 건수 |
| `prohibited_count` | `int` | 금지 판정 건수 |

## 실행 단계

1. **비교 표현 분류**: 입력된 `competitor_comparative_phrases`를 다음 유형으로 분류한다.
   - **직접 비교**: 경쟁사/제품을 실명으로 지목하여 비교 ("A사 제품보다 30% 빠른")
   - **간접 비교**: 경쟁사를 특정하지 않지만 비교 의도가 명확한 ("타사 제품과 달리", "기존 제품 대비")
   - **최상급 주장**: "업계 최초", "1위", "최고", "유일한" 등 절대 우위 주장
2. **경쟁사 비하 탐지**: 경쟁사를 실명으로 언급하면서 비하/폄하하는 표현을 탐지한다.
   - 비하 패턴: "열등한", "뒤떨어진", "실패한", "문제 있는", "불량한"
   - 경쟁사 실명 + 부정적 표현 조합 탐지
3. **근거 검증**: 비교 주장에 대한 `supporting_evidence` 존재 여부와 적정성을 검증한다.
   - 공인기관 조사 결과 > 제3자 조사 결과 > 자체 조사 결과 순으로 신뢰도 부여
   - 조사 시점이 1년 이상 경과한 경우 경고
   - "업계 최초", "1위" 주장은 반드시 공인 출처 근거 필요
4. **법적 기준 대조**:
   - 한국: 표시광고법 제3조(부당 비교광고), 비교광고 심사지침
   - EU: 비교광고 지침(Directive 2006/114/EC)
   - 미국: FTC 비교광고 가이드라인, Lanham Act
5. **판정 산출**: 각 비교 표현별로 `permitted` / `caution` / `prohibited` 판정한다.
   - `prohibited`: 경쟁사 실명 비하, 근거 없는 절대 우위, 허위 비교
   - `caution`: 근거는 있으나 표현이 과장되거나 조사 시점이 오래된 경우
   - `permitted`: 객관적 사실에 기반한 비교, 충분한 근거 존재
6. **hard_fail 판정**: `prohibited` 판정이 1건이라도 있으면 `hard_fail = true`
7. **수정안 생성**: `caution` 및 `prohibited` 판정 표현에 대해 법적으로 안전한 대체 표현을 제안한다.

## HITL 정책

- **필수 사람 개입 조건**: `hard_fail = true`인 경우 법무팀 승인 필수
- **권장 사람 개입 조건**: `caution` 판정이 1건 이상인 경우 마케팅 매니저 및 법무팀 검토 권장
- **승인 역할**: 법무팀, 마케팅 매니저, 브랜드 매니저

## 도구 정책

- **허용 도구**: `docs.read` (내부 제품 성능 데이터 조회), `brand_guide.read` (비교광고 가이드라인 확인), `policy.read` (비교광고 규제 정책 조회), `evidence.read` (비교 근거 데이터 조회)
- **승인 필요 도구**: `external.publish` (외부 게시), `bulk.export` (대량 내보내기), `system.write` (시스템 기록)
- **금지 도구**: 경쟁사 내부 정보 접근, 비인가 벤치마크 데이터 사용

## 실패 모드

| 실패 상황 | 처리 방법 |
|-----------|----------|
| `competitor_comparative_phrases`가 비어 있는 경우 | "비교 표현이 입력되지 않았습니다." 반환 |
| `supporting_evidence`가 누락된 경우 | 모든 비교 주장을 `caution` 이상으로 분류하고 근거 제출 요청 |
| 비교 대상을 특정할 수 없는 경우 | 간접 비교로 분류하고 대상 명확화 요청 |
| `target_market`이 누락된 경우 | 가장 엄격한 기준 적용 후 경고 메시지 출력 |
| 근거 데이터 접근 불가 | 해당 근거를 미검증으로 처리하고 수동 확인 요청 |

## 좋은 예시

**입력:**
```json
{
  "competitor_comparative_phrases": [
    {
      "phrase": "자체 실험 결과 기존 모델 대비 배터리 수명 20% 향상",
      "comparison_target": "자사 기존 모델",
      "comparison_type": "간접비교"
    }
  ],
  "supporting_evidence": [
    {
      "claim_ref": "배터리 수명 비교",
      "source": "자체조사",
      "date": "2026-01-15",
      "url": "https://internal.docs/battery-test-report"
    }
  ]
}
```

**출력:**
```json
{
  "judgments": [
    {
      "phrase": "자체 실험 결과 기존 모델 대비 배터리 수명 20% 향상",
      "verdict": "permitted",
      "reason": "자사 기존 모델과의 비교이며, 구체적 수치와 근거 제시",
      "suggestion": null
    }
  ],
  "overall_risk": "low",
  "hard_fail": false,
  "permitted_count": 1,
  "caution_count": 0,
  "prohibited_count": 0
}
```
**이유:** 자사 모델 간 비교, 구체적 수치, 근거 존재

## 나쁜 예시

**입력:**
```json
{
  "competitor_comparative_phrases": [
    {
      "phrase": "S사 제품은 성능이 떨어지지만, 우리 제품은 업계 최고입니다",
      "comparison_target": "S사",
      "comparison_type": "직접비교"
    },
    {
      "phrase": "업계 최초로 선보이는 혁신 기술",
      "comparison_target": "업계",
      "comparison_type": "최상급"
    }
  ],
  "supporting_evidence": []
}
```

**출력:**
```json
{
  "judgments": [
    {
      "phrase": "S사 제품은 성능이 떨어지지만, 우리 제품은 업계 최고입니다",
      "verdict": "prohibited",
      "reason": "경쟁사 실명 비하('성능이 떨어지지만') + 근거 없는 최상급 주장('업계 최고')",
      "suggestion": "독립 기관 테스트에서 높은 성능 평가를 받았습니다"
    },
    {
      "phrase": "업계 최초로 선보이는 혁신 기술",
      "verdict": "prohibited",
      "reason": "'업계 최초' 주장에 대한 공인 출처 근거 없음",
      "suggestion": "새롭게 개발한 기술을 적용했습니다"
    }
  ],
  "overall_risk": "critical",
  "hard_fail": true,
  "fail_reason": "경쟁사 실명 비하 1건 + 근거 없는 최상급 주장 1건",
  "permitted_count": 0,
  "caution_count": 0,
  "prohibited_count": 2
}
```
**이유:** 경쟁사 실명 비하, 근거 없는 "업계 최고", "업계 최초" 주장

## 테스트 케이스

| # | 시나리오 | 입력 요약 | 기대 출력 | 판정 |
|---|---------|----------|----------|------|
| 1 | 자사 모델 간 객관적 비교 | "전작 대비 처리 속도 15% 향상" + 근거 존재 | verdict = permitted | PASS |
| 2 | 경쟁사 실명 비하 | "A사 제품은 불량률이 높지만" + 근거 없음 | verdict = prohibited, hard_fail = true | FAIL |
| 3 | 근거 없는 "1위" 주장 | "고객 만족도 1위" + 근거 없음 | verdict = prohibited, hard_fail = true | FAIL |
| 4 | 근거 있는 "1위" 주장 | "한국능률협회 고객 만족도 1위" + 인증서 존재 | verdict = permitted | PASS |
| 5 | 간접 비교 + 과장 | "타사 제품과 차원이 다른 성능" + 근거 부분적 | verdict = caution, 표현 완화 제안 | CAUTION |
| 6 | "업계 최초" + 오래된 근거 | "업계 최초 적용" + 2년 전 자체 조사 | verdict = caution, 근거 갱신 요청 | CAUTION |
| 7 | 비교 표현 없는 카피 | "새로운 기능을 만나보세요" | 비교 표현 미탐지 안내 | PASS |
