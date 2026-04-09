---
name: copy-scorecard-generator
description: 카피 품질을 다차원(명확성, 설득력, 톤 등)으로 평가하여 스코어카드 생성
action_tags:
- evaluation
role_tags:
- 품질 검수
---
최종 카피 초안에 대해 전략 적합도, 브랜드 일관성, 지역 적합도, 규제 준수도, 채널 최적화도 등 다차원 품질 점수표를 생성한다. 승인자가 카피 품질을 종합적으로 판단할 수 있는 근거 자료를 제공한다.

## 사용 조건

이 스킬은 다음 상황에서 트리거된다.

- 최종 카피 초안이 완성되어 승인 전 품질 평가가 필요한 경우
- 다수의 카피 후보 중 최적안을 선정하기 위한 비교 평가가 필요한 경우
- 리뷰 피드백 반영 후 개선도를 정량적으로 측정하고자 하는 경우
- 캠페인 종료 후 카피 품질을 사후 분석하고자 하는 경우

## 입력

필수 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `final_draft` | `dict` | 최종 카피 초안. `headline`, `body`, `cta`, `target_market`, `channel`, `campaign_id` 포함 |
| `risk_reports` | `list[dict]` | 사전 리스크 검증 결과 목록. `report_type`(compliance/brand/regional 등), `risk_level`, `issues`, `skill_name` 포함 |

선택 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `review_feedback` | `list[dict]` | 리뷰어 피드백 목록. `reviewer_role`, `feedback_text`, `severity`(critical/major/minor) 포함 |
| `campaign_brief` | `dict` | 원래 캠페인 브리프. 전략 적합도 평가에 활용 |
| `brand_guide` | `dict` | 브랜드 가이드라인. 브랜드 일관성 평가에 활용 |
| `previous_scorecard` | `dict` | 이전 버전의 스코어카드. 개선도 비교에 활용 |

## 출력

주요 출력:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `strategy_score` | `float (0.0-1.0)` | 전략 적합도. 캠페인 브리프의 목표/타겟/메시지 전략과의 일치도 |
| `brand_score` | `float (0.0-1.0)` | 브랜드 일관성. 톤앤보이스, 브랜드 키워드, 비주얼 언어 가이드 준수도 |
| `regional_score` | `float (0.0-1.0)` | 지역 적합도. 타겟 시장의 문화적/언어적 적합성 |
| `regulation_score` | `float (0.0-1.0)` | 규제 준수도. 법적 리스크 검증 결과 반영 |
| `channel_score` | `float (0.0-1.0)` | 채널 최적화도. 채널별 제약 조건 준수, 형식 적합성 |
| `overall_score` | `float (0.0-1.0)` | 가중 평균 종합 점수 |
| `score_breakdown` | `dict` | 각 점수의 세부 평가 항목과 근거 |
| `improvement_areas` | `list[dict]` | 개선이 필요한 영역. `dimension`, `current_score`, `issue`, `suggestion` 포함 |
| `approval_recommendation` | `str` | 승인 권고. `approve` / `conditional_approve` / `revise` / `reject` |

## 실행 단계

1. **전략 적합도 평가** (`strategy_score`):
   - `campaign_brief`가 있으면 캠페인 목표와 카피 메시지의 일치도를 평가
   - 타겟 오디언스 적합성 확인
   - 핵심 메시지 전달 여부 검증
   - 차별화 포인트 반영 여부 확인
2. **브랜드 일관성 평가** (`brand_score`):
   - `brand_guide`가 있으면 톤앤보이스 일치도 평가
   - 브랜드 필수 키워드 포함 여부
   - 금지어/금지 표현 사용 여부
   - 브랜드 보이스의 일관성
3. **지역 적합도 평가** (`regional_score`):
   - `final_draft.target_market` 기반 문화적 적합성 평가
   - 현지어 자연스러움 검증
   - 문화적 금기/민감 표현 검토
   - `risk_reports`에서 regional 관련 리스크 반영
4. **규제 준수도 평가** (`regulation_score`):
   - `risk_reports`에서 compliance 관련 보고서 집계
   - hard_fail 발생 여부 확인 (hard_fail 있으면 regulation_score = 0.0)
   - 리스크 수준별 감점 적용
5. **채널 최적화도 평가** (`channel_score`):
   - `final_draft.channel` 기반 채널 적합성 평가
   - 길이 제한 준수 여부
   - 채널별 형식 규칙 준수 여부
   - CTA 적합성
6. **종합 점수 산출**: 가중 평균으로 `overall_score`를 산출한다.
   - 기본 가중치: strategy 0.25, brand 0.20, regional 0.15, regulation 0.25, channel 0.15
   - 규제 관련 hard_fail이 있으면 `overall_score`는 자동으로 0.0 이하로 설정
7. **승인 권고 결정**:
   - `approve`: overall_score >= 0.8, 모든 개별 점수 >= 0.6
   - `conditional_approve`: overall_score >= 0.6, regulation_score >= 0.7
   - `revise`: overall_score >= 0.4 또는 특정 차원 점수 < 0.5
   - `reject`: overall_score < 0.4 또는 regulation_score < 0.5

## HITL 정책

- **필수 사람 개입 조건**: 모든 스코어카드는 승인자(크리에이티브 디렉터 또는 브랜드 매니저)가 최종 확인
- **권장 사람 개입 조건**: `approval_recommendation`이 `conditional_approve`인 경우 관련 팀 추가 검토 권장
- **승인 역할**: 크리에이티브 디렉터, 브랜드 매니저, 법무팀(regulation 관련)

## 도구 정책

- **허용 도구**: `docs.read` (캠페인 브리프/기존 스코어카드 조회), `brand_guide.read` (브랜드 가이드라인 확인), `policy.read` (평가 기준 정책 조회), `evidence.read` (리스크 보고서/리뷰 피드백 조회)
- **승인 필요 도구**: `external.publish` (스코어카드 외부 공유), `bulk.export` (대량 내보내기), `system.write` (스코어카드 시스템 기록)
- **금지 도구**: 스코어 임의 조작, 리스크 보고서 무시

## 실패 모드

| 실패 상황 | 처리 방법 |
|-----------|----------|
| `final_draft`가 비어 있는 경우 | "평가할 카피 초안을 입력하세요." 반환 |
| `risk_reports`가 누락된 경우 | regulation_score를 평가 불가(N/A)로 표시하고 리스크 검증 선행 요청 |
| `campaign_brief`가 없는 경우 | strategy_score를 카피 자체 품질 기준으로 대체 평가 후 경고 메시지 출력 |
| 이전 스코어카드 대비 점수가 하락한 경우 | 하락 원인 분석과 함께 `improvement_areas`에 상세 기술 |
| 리스크 보고서 간 충돌(한 보고서는 pass, 다른 보고서는 fail) | 충돌 내용을 명시하고 가장 보수적인 판정 적용 |

## 좋은 예시

**입력:**
```json
{
  "final_draft": {
    "headline": "가볍게 바르고, 강력히 차단",
    "body": "워터 제형으로 산뜻하게, SPF50+로 확실하게",
    "cta": "지금 만나보세요",
    "target_market": "KR",
    "channel": "banner",
    "campaign_id": "CAMP-2026-SUMMER-01"
  },
  "risk_reports": [
    {"report_type": "compliance", "risk_level": "low", "issues": [], "skill_name": "compliance-redflag-detector"},
    {"report_type": "brand", "risk_level": "low", "issues": [], "skill_name": "brand-lexicon-check"}
  ],
  "review_feedback": [
    {"reviewer_role": "copywriter", "feedback_text": "톤이 적절합니다", "severity": "minor"}
  ]
}
```

**출력:**
```json
{
  "strategy_score": 0.88,
  "brand_score": 0.92,
  "regional_score": 0.90,
  "regulation_score": 0.95,
  "channel_score": 0.87,
  "overall_score": 0.90,
  "approval_recommendation": "approve",
  "improvement_areas": [
    {
      "dimension": "channel",
      "current_score": 0.87,
      "issue": "배너 CTA 길이가 권장 범위(6-8자) 상단에 위치",
      "suggestion": "CTA를 '지금 보기'로 축약하면 클릭률 향상 기대"
    }
  ]
}
```
**이유:** 전 차원에서 고르게 높은 점수, 리스크 이슈 없음, 구체적 개선 제안 포함

## 나쁜 예시

**나쁜 출력 (이렇게 하면 안 됨):**
```json
{
  "strategy_score": 0.95,
  "brand_score": 0.95,
  "regional_score": 0.95,
  "regulation_score": 0.95,
  "channel_score": 0.95,
  "overall_score": 0.95,
  "approval_recommendation": "approve",
  "improvement_areas": []
}
```
**이유:** 모든 차원에서 동일한 높은 점수를 부여하여 차별적 평가 부재. 개선 영역이 하나도 없다는 것은 비현실적. 리스크 보고서와 리뷰 피드백이 점수에 구체적으로 반영되지 않음.

## 테스트 케이스

| # | 시나리오 | 입력 요약 | 기대 출력 | 판정 |
|---|---------|----------|----------|------|
| 1 | 전 차원 양호 | 완성된 카피 + 리스크 low + 긍정 리뷰 | overall >= 0.8, approve | PASS |
| 2 | 규제 hard_fail 존재 | compliance 리스크 critical | regulation_score = 0.0, reject | FAIL |
| 3 | 브랜드 불일치 | 브랜드 톤 위반 지적 | brand_score < 0.5, revise 권고 | CAUTION |
| 4 | 리스크 보고서 누락 | risk_reports 빈 배열 | regulation_score = N/A, 선행 검증 요청 | CAUTION |
| 5 | 이전 대비 개선 | previous_scorecard 대비 향상 | 개선도 표시, 점수 상승 확인 | PASS |
| 6 | 다수 리뷰어 피드백 충돌 | critical + minor 피드백 혼재 | critical 피드백 우선 반영, 보수적 판정 | CAUTION |
| 7 | 지역 부적합 | target_market=JP, 한국어 표현 사용 | regional_score < 0.3, revise 권고 | FAIL |
