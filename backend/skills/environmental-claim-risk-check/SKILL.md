---
name: environmental-claim-risk-check
description: 친환경·ESG 관련 주장의 그린워싱 리스크를 검증
action_tags:
- evaluation
role_tags:
- 컴플라이언스
---
친환경/ESG 관련 주장의 규제 리스크를 검증하여, 근거 없는 그린워싱(greenwashing) 표현이 광고 카피에 포함되지 않도록 사전 차단한다.

## 사용 조건

이 스킬은 다음 상황에서 트리거된다.

- 광고 카피에 "친환경", "에코", "그린", "탄소중립", "지속가능", "제로 웨이스트", "탄소배출 제로", "재활용", "생분해" 등 환경 관련 키워드가 포함된 경우
- ESG 경영 활동을 마케팅 메시지로 활용하려는 경우
- 환경 인증 마크나 친환경 라벨을 광고에 사용하려는 경우
- EU 그린 클레임 지침, 한국 표시광고법 등 환경 광고 규제 대응이 필요한 경우

## 입력

필수 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `environmental_claims` | `list[str]` | 카피에 포함된 환경 관련 주장 문장 목록. 예: ["100% 탄소중립 제품", "친환경 포장재 사용"] |
| `evidence` | `list[dict]` | 각 주장을 뒷받침하는 근거 목록. `claim_ref`, `evidence_type`(인증서/보고서/측정데이터), `evidence_url`, `valid_until` 포함 |

선택 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `target_market` | `str` | 타겟 시장. EU/한국/미국 등 지역별 환경 광고 규제 차이 반영 |
| `product_category` | `str` | 제품 분류. 식품/화장품/전자제품 등 카테고리별 환경 주장 기준 상이 |
| `certification_list` | `list[str]` | 보유 환경 인증 목록. 예: ["FSC", "EU Ecolabel", "환경부 환경마크"] |

## 출력

주요 출력:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `risk_level` | `str` | 종합 리스크 수준. `low` / `medium` / `high` / `critical` |
| `unsupported_claims` | `list[dict]` | 근거가 부족하거나 없는 주장 목록. `claim`, `issue`, `required_evidence` 포함 |
| `supported_claims` | `list[str]` | 근거가 충분한 주장 목록 |
| `revision_suggestions` | `list[dict]` | 수정 제안. `original`, `suggestion`, `reason` 포함 |
| `hard_fail` | `bool` | 근거 없는 환경 주장 발견 시 `true` |
| `fail_reason` | `str` | hard_fail 사유 설명 |

## 실행 단계

1. **환경 키워드 추출**: 입력 `environmental_claims`에서 환경 관련 표현을 식별한다. 대상 패턴:
   - 절대 표현: "100% 친환경", "완전한 탄소중립", "제로 탄소", "무공해"
   - 모호한 표현: "친환경적인", "자연 친화적", "지구를 생각하는", "깨끗한"
   - 인증 관련: "친환경 인증", "탄소중립 인증", "그린 마크 획득"
2. **근거 매칭**: 각 환경 주장을 `evidence` 목록과 매칭한다.
   - 매칭되는 근거가 없으면 `unsupported_claims`에 추가
   - 근거의 `valid_until`이 만료되었으면 경고
   - 인증 주장 시 `certification_list`에 해당 인증이 있는지 확인
3. **규제 기준 대조**: 타겟 시장의 환경 광고 규제 기준과 대조한다.
   - EU: 그린 클레임 지침에 따라 정량적 근거 필수
   - 한국: 표시광고법상 환경 관련 부당 표시광고 기준
   - 미국: FTC 그린 가이드 기준
4. **리스크 수준 산출**:
   - `critical`: 근거 없는 절대 환경 주장 1건 이상
   - `high`: 근거 불충분한 주장 2건 이상 또는 만료된 근거 사용
   - `medium`: 모호한 환경 표현 사용 (근거는 있으나 표현이 과장)
   - `low`: 모든 주장에 유효한 근거 존재
5. **hard_fail 판정**: `risk_level = critical`이면 `hard_fail = true`
6. **수정안 생성**: 문제 문장별로 근거에 기반한 구체적 대체 표현을 제안한다.

## HITL 정책

- **필수 사람 개입 조건**: `hard_fail = true`인 경우 법무/ESG 담당자 승인 필수
- **권장 사람 개입 조건**: `risk_level`이 `medium` 이상인 경우 마케팅 매니저 및 ESG 담당자 검토 권장
- **승인 역할**: 법무팀, ESG 담당자, 브랜드 매니저, 품질관리팀

## 도구 정책

- **허용 도구**: `docs.read` (내부 ESG 보고서 조회), `brand_guide.read` (브랜드 환경 정책 확인), `policy.read` (환경 광고 규제 정책 조회), `evidence.read` (환경 인증/측정 데이터 조회)
- **승인 필요 도구**: `external.publish` (외부 게시), `bulk.export` (대량 내보내기), `system.write` (시스템 기록)
- **금지 도구**: 인증되지 않은 외부 환경 데이터 소스 접근

## 실패 모드

| 실패 상황 | 처리 방법 |
|-----------|----------|
| `environmental_claims`가 비어 있는 경우 | "환경 관련 주장이 입력되지 않았습니다." 반환 |
| `evidence`가 누락된 경우 | 모든 환경 주장을 `unsupported`로 분류하고 근거 제출 요청 메시지 출력 |
| 환경 관련 키워드가 카피에 없는 경우 | `risk_level = low`, "환경 관련 주장이 탐지되지 않았습니다." 안내 |
| 근거 문서 URL 접근 불가 | 해당 근거를 미검증으로 처리하고 수동 확인 요청 |
| `target_market`이 누락된 경우 | 가장 엄격한 규제 기준(EU) 적용 후 경고 메시지 출력 |

## 좋은 예시

**입력:**
```json
{
  "environmental_claims": ["FSC 인증 종이로 제작된 포장재를 사용합니다"],
  "evidence": [
    {
      "claim_ref": "FSC 인증 포장재",
      "evidence_type": "인증서",
      "evidence_url": "https://internal.docs/fsc-cert-2025",
      "valid_until": "2026-12-31"
    }
  ],
  "certification_list": ["FSC"]
}
```

**출력:**
```json
{
  "risk_level": "low",
  "unsupported_claims": [],
  "supported_claims": ["FSC 인증 종이로 제작된 포장재를 사용합니다"],
  "hard_fail": false
}
```
**이유:** 구체적 인증 명시, 유효한 인증서 근거 존재, 절대 주장 없음

## 나쁜 예시

**입력:**
```json
{
  "environmental_claims": [
    "100% 친환경 제품입니다",
    "탄소 배출 제로로 지구를 지킵니다",
    "자연에서 온 깨끗한 성분"
  ],
  "evidence": []
}
```

**출력:**
```json
{
  "risk_level": "critical",
  "unsupported_claims": [
    {
      "claim": "100% 친환경 제품입니다",
      "issue": "근거 없는 절대 친환경 주장. '100% 친환경'의 정의와 측정 기준 불명확",
      "required_evidence": "제품 전 과정(LCA) 환경영향 평가 보고서 또는 공인 환경 인증"
    },
    {
      "claim": "탄소 배출 제로로 지구를 지킵니다",
      "issue": "근거 없는 탄소중립 절대 주장",
      "required_evidence": "탄소배출량 측정 보고서 및 상쇄 인증(VCS, Gold Standard 등)"
    },
    {
      "claim": "자연에서 온 깨끗한 성분",
      "issue": "모호한 친환경 표현. '자연', '깨끗한'의 구체적 의미 불명확",
      "required_evidence": "원재료 원산지 및 성분 분석표"
    }
  ],
  "revision_suggestions": [
    {
      "original": "100% 친환경 제품입니다",
      "suggestion": "환경부 환경마크 인증을 획득한 제품입니다",
      "reason": "'100% 친환경'은 정량적 근거 없이 사용 불가"
    }
  ],
  "hard_fail": true,
  "fail_reason": "근거 없는 절대 환경 주장 2건 탐지 (100% 친환경, 탄소 배출 제로)"
}
```
**이유:** 근거 없는 절대 환경 주장, 모호한 친환경 표현 사용

## 테스트 케이스

| # | 시나리오 | 입력 요약 | 기대 출력 | 판정 |
|---|---------|----------|----------|------|
| 1 | 유효 인증 기반 구체적 주장 | "환경부 환경마크 인증 획득" + 인증서 근거 | risk_level = low, hard_fail = false | PASS |
| 2 | 근거 없는 "친환경" 표현 | "친환경 소재로 만들었습니다" + 근거 없음 | unsupported_claims에 포함, hard_fail = true | FAIL |
| 3 | "탄소중립" 절대 주장 | "탄소중립 달성" + 근거 없음 | risk_level = critical, hard_fail = true | FAIL |
| 4 | 근거 만료 | "재활용 가능 포장재" + 인증서 유효기간 만료 | risk_level = high, 근거 갱신 요청 | CAUTION |
| 5 | 모호한 표현 + 근거 존재 | "자연 친화적 공정" + 공정 환경영향 보고서 존재 | risk_level = medium, 표현 구체화 제안 | CAUTION |
| 6 | 환경 키워드 없음 | "새로운 맛의 건강 음료" | risk_level = low, 환경 주장 미탐지 안내 | PASS |
| 7 | EU 시장 대상 | "지속가능한 패션" + 부분적 근거 | EU 기준 적용, risk_level = high | CAUTION |
