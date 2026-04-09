---
name: ai-washing-risk-check
description: AI 관련 과장·오인 표현을 사전 검증하여 AI 워싱 리스크를 방지
action_tags:
- evaluation
role_tags:
- 컴플라이언스
---

AI 관련 과장 또는 오인 가능성을 평가하여, 근거 없는 AI 성능 주장이 광고 카피에 포함되지 않도록 사전 검증한다.

## 사용 조건

이 스킬은 다음 상황에서 트리거된다.

- 광고 카피에 "AI", "인공지능", "머신러닝", "딥러닝", "자동화", "스마트" 등 AI 관련 키워드가 포함된 경우
- 제품/서비스의 AI 기능을 마케팅 메시지로 활용하려는 경우
- 기존 카피 리뷰 과정에서 AI 워싱 리스크가 의심되어 수동 트리거하는 경우
- 신규 AI 기능 출시에 따른 광고 캠페인 준비 시

## 입력

필수 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `ai_related_claims` | `list[str]` | 카피에 포함된 AI 관련 주장 문장 목록. 예: ["AI가 알아서 맞춤 추천합니다", "100% 자동 분석"] |
| `product_capabilities` | `dict` | 실제 제품이 보유한 AI 기능 명세. `feature_name`, `accuracy`, `automation_level`, `evidence_url` 등 포함 |

선택 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `target_market` | `str` | 타겟 시장(국가/지역). 지역별 AI 광고 규제 차이 반영 |
| `industry_category` | `str` | 산업 분류. 의료/금융 등 고위험 산업은 기준이 더 엄격 |

## 출력

주요 출력:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `risk_score` | `float (0.0-1.0)` | AI 워싱 리스크 종합 점수. 0.7 이상이면 hard_fail 후보 |
| `prohibited_sentences` | `list[str]` | 즉시 삭제 또는 수정이 필요한 문장 목록 |
| `revision_suggestions` | `list[dict]` | 각 문제 문장에 대한 수정 제안. `original`, `suggestion`, `reason` 포함 |
| `hard_fail` | `bool` | 근거 없는 AI 성능 절대 주장이 발견되면 `true` |
| `fail_reason` | `str` | hard_fail 사유 설명 |

## 실행 단계

1. **AI 키워드 추출**: 입력 `ai_related_claims`에서 AI 관련 표현을 식별한다. 대상 패턴: "AI가 알아서", "100% 자동", "완벽한 AI", "AI 기반 완전 자동화", "인공지능이 스스로 판단" 등
2. **절대 주장 탐지**: 다음 절대 표현 패턴을 탐지한다.
   - 정확도 절대 주장: "100%", "완벽한", "오류 없는", "틀릴 수 없는"
   - 자율성 과장: "알아서", "스스로", "사람 없이도", "완전 자동"
   - 범용성 과장: "모든 상황에서", "어떤 경우에도", "만능"
3. **근거 대조**: 각 AI 주장을 `product_capabilities`의 실제 기능 명세와 대조한다. 근거가 없거나 과장된 주장을 식별한다.
4. **리스크 점수 산출**: 탐지된 문제의 심각도와 빈도를 기반으로 `risk_score`를 산출한다.
   - 절대 주장 1건당 +0.3
   - 근거 불일치 1건당 +0.2
   - 모호한 AI 표현 1건당 +0.1
5. **hard_fail 판정**: `risk_score >= 0.7` 이거나 근거 없는 AI 성능 절대 주장이 1건이라도 있으면 `hard_fail = true`로 판정한다.
6. **수정안 생성**: 문제 문장별로 근거에 기반한 대체 표현을 제안한다.

## HITL 정책

- **필수 사람 개입 조건**: `hard_fail = true`인 경우 법무/컴플라이언스 담당자 승인 필수
- **권장 사람 개입 조건**: `risk_score`가 0.4~0.7 사이인 경우 마케팅 매니저 검토 권장
- **승인 역할**: 법무팀, 컴플라이언스 담당자, 브랜드 매니저

## 도구 정책

- **허용 도구**: `docs.read` (내부 AI 기능 문서 조회), `brand_guide.read` (브랜드 가이드 확인), `policy.read` (AI 광고 규제 정책 조회), `evidence.read` (기술 검증 근거 조회)
- **승인 필요 도구**: `external.publish` (외부 게시), `bulk.export` (대량 내보내기), `system.write` (시스템 기록)
- **금지 도구**: 외부 경쟁사 데이터 크롤링, 비인가 API 호출

## 실패 모드

| 실패 상황 | 처리 방법 |
|-----------|----------|
| `ai_related_claims`가 비어 있는 경우 | "AI 관련 주장이 입력되지 않았습니다. 카피에서 AI 관련 문장을 추출하여 입력하세요." 반환 |
| `product_capabilities`가 누락된 경우 | 근거 대조 불가로 모든 AI 주장을 `caution`으로 분류하고 경고 메시지 출력 |
| AI 관련 키워드가 카피에 없는 경우 | `risk_score = 0.0`, 빈 결과 반환 및 "AI 관련 주장이 탐지되지 않았습니다." 안내 |
| 산업 분류가 의료/금융인데 `industry_category`가 누락된 경우 | 최대 엄격 기준 적용 후 경고 메시지 출력 |

## 좋은 예시

**입력:**
```json
{
  "ai_related_claims": ["AI 추천 엔진이 고객 취향을 분석하여 맞춤 상품을 제안합니다"],
  "product_capabilities": {
    "feature_name": "추천 엔진",
    "accuracy": "78%",
    "automation_level": "semi-auto",
    "evidence_url": "https://internal.docs/rec-engine-report"
  }
}
```

**출력:**
```json
{
  "risk_score": 0.1,
  "prohibited_sentences": [],
  "revision_suggestions": [],
  "hard_fail": false
}
```
**이유:** 구체적 기능 명시, 절대 주장 없음, 근거 문서 존재

## 나쁜 예시

**입력:**
```json
{
  "ai_related_claims": ["AI가 알아서 완벽하게 관리해드립니다", "100% 자동으로 최적의 결과를 보장합니다"],
  "product_capabilities": {
    "feature_name": "자동 리포트",
    "accuracy": "65%",
    "automation_level": "assisted"
  }
}
```

**출력:**
```json
{
  "risk_score": 0.9,
  "prohibited_sentences": [
    "AI가 알아서 완벽하게 관리해드립니다",
    "100% 자동으로 최적의 결과를 보장합니다"
  ],
  "revision_suggestions": [
    {
      "original": "AI가 알아서 완벽하게 관리해드립니다",
      "suggestion": "AI 기반 분석으로 관리 업무를 지원합니다",
      "reason": "자율성 과장('알아서') + 정확도 절대 주장('완벽하게'). 실제 자동화 수준은 assisted"
    },
    {
      "original": "100% 자동으로 최적의 결과를 보장합니다",
      "suggestion": "자동 분석 기능으로 효율적인 결과를 도출합니다",
      "reason": "정확도 절대 주장('100%') + 결과 보장 표현. 실제 정확도 65%"
    }
  ],
  "hard_fail": true,
  "fail_reason": "근거 없는 AI 성능 절대 주장 2건 탐지 (100% 자동, 완벽하게)"
}
```
**이유:** "알아서", "완벽하게", "100% 자동", "보장" 등 절대 주장이 실제 기능 수준과 불일치

## 테스트 케이스

| # | 시나리오 | 입력 요약 | 기대 출력 | 판정 |
|---|---------|----------|----------|------|
| 1 | 근거 있는 구체적 AI 기능 설명 | "머신러닝 기반 분석으로 처리 시간을 30% 단축합니다" + 근거 있음 | risk_score < 0.2, hard_fail = false | PASS |
| 2 | "AI가 알아서" 패턴 | "AI가 알아서 최적의 가격을 찾아드립니다" + 근거 없음 | risk_score >= 0.7, hard_fail = true | FAIL |
| 3 | "100% 자동" 패턴 | "100% AI 자동 번역" + 실제 정확도 85% | prohibited_sentences에 포함, revision_suggestions 제공 | FAIL |
| 4 | 복합 과장 | "완벽한 AI가 모든 상황에서 스스로 판단합니다" + 근거 없음 | risk_score = 1.0, hard_fail = true | FAIL |
| 5 | AI 키워드 없는 일반 카피 | "신선한 재료로 만든 건강한 간식" | risk_score = 0.0, AI 관련 주장 없음 안내 | PASS |
| 6 | 의료 분야 AI 주장 | "AI 진단으로 질병을 조기 발견합니다" + industry_category 누락 | 최대 엄격 기준 적용, 경고 메시지 | CAUTION |
