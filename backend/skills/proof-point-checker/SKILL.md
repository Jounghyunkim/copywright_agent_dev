---
name: proof-point-checker
description: claim별 근거 존재 및 충분성을 확인하는 스킬.
action_tags:
- evaluation
role_tags:
- 품질 검수
---
## 사용 조건

- `claim-extractor`에 의해 추출된 주장 목록(`claims`)이 존재할 때 트리거된다.
- 근거 자료(`proof_assets`)가 최소 1개 이상 제공되었을 때 호출한다.
- `evidence_required=true`인 claim이 1개 이상 존재해야 한다.

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `claims` | `Claim[]` | Y | claim-extractor가 생성한 주장 목록 |
| `claims[].claim_text` | `string` | Y | 주장 원문 |
| `claims[].claim_type` | `string` | Y | 주장 유형 |
| `claims[].certainty` | `string` | Y | 확실성 수준 |
| `claims[].evidence_required` | `boolean` | Y | 근거 필요 여부 |
| `proof_assets` | `ProofAsset[]` | Y | 근거 자료 목록 |
| `proof_assets[].asset_id` | `string` | Y | 근거 자료 고유 식별자 |
| `proof_assets[].type` | `string` | Y | 자료 유형: `clinical_study`, `survey`, `patent`, `certification`, `internal_data`, `third_party_report` |
| `proof_assets[].title` | `string` | Y | 자료 제목 |
| `proof_assets[].summary` | `string` | N | 자료 요약 |
| `proof_assets[].url` | `string` | N | 자료 접근 URL 또는 문서 ID |

### 입력 검증 규칙

- `claims`는 최소 1개 이상이어야 한다.
- `proof_assets`는 빈 배열이 허용되나, 이 경우 모든 `evidence_required=true` claim이 unsupported로 분류된다.
- 각 `proof_asset`은 `asset_id`와 `type`이 반드시 존재해야 한다.

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `claim_evidence_map` | `ClaimEvidenceEntry[]` | claim별 근거 매핑 결과 |
| `claim_evidence_map[].claim_text` | `string` | 주장 원문 |
| `claim_evidence_map[].status` | `string` | `supported`, `partially_supported`, `unsupported` |
| `claim_evidence_map[].matched_assets` | `string[]` | 매핑된 proof_asset의 asset_id 목록 |
| `claim_evidence_map[].sufficiency` | `string` | 근거 충분성 판단: `sufficient`, `weak`, `insufficient` |
| `claim_evidence_map[].sufficiency_reason` | `string` | 충분성 판단 근거 설명 |
| `evidence_gaps` | `EvidenceGap[]` | 근거가 부족하거나 없는 항목 목록 |
| `evidence_gaps[].claim_text` | `string` | 근거 부족 주장 원문 |
| `evidence_gaps[].gap_type` | `string` | `missing` (근거 없음), `weak` (근거 부족), `outdated` (근거 만료) |
| `evidence_gaps[].recommendation` | `string` | 근거 보완을 위한 권고 사항 |

### 품질 기준

- unsupported claim 누락 탐지율: `evidence_required=true`이면서 실제 근거가 없는 claim을 100% 탐지해야 한다.
- `partially_supported` 분류 시 부족한 부분을 `evidence_gaps`에 명시해야 한다.
- 잘못된 매핑(claim과 무관한 근거 연결) 비율이 5% 이하여야 한다.

## 실행 단계

1. **입력 검증** -- `claims`와 `proof_assets`의 스키마 및 필수값을 확인한다.
2. **근거 필요 claim 필터링** -- `evidence_required=true`인 claim만 검증 대상으로 선별한다. `evidence_required=false`인 claim은 `supported`로 자동 분류한다.
3. **근거 매핑** -- 각 검증 대상 claim에 대해 `proof_assets`에서 관련 근거를 매핑한다. 주장의 내용과 근거 자료의 제목/요약을 비교하여 관련성을 판단한다.
4. **충분성 평가** -- 매핑된 근거의 유형과 내용이 해당 claim을 뒷받침하기에 충분한지 평가한다.
   - `sufficient`: 근거가 claim을 완전히 뒷받침
   - `weak`: 근거가 있으나 직접적이지 않거나 범위가 부족
   - `insufficient`: 근거가 claim을 뒷받침하지 못함
5. **상태 결정** -- 충분성 평가를 기반으로 `supported`, `partially_supported`, `unsupported` 상태를 결정한다.
6. **갭 분석** -- `unsupported` 또는 `partially_supported` claim에 대해 `evidence_gaps`를 생성하고, 보완 권고를 작성한다.
7. **결과 반환** -- `claim_evidence_map`과 `evidence_gaps`를 반환한다.

### 가드레일

- `statistical` 또는 `comparative` 유형의 claim은 동일하거나 더 높은 수준의 근거(임상시험, 공인 통계)가 있어야 `sufficient`로 판단한다.
- `regulatory` 유형의 claim("최초", "특허" 등)은 공식 등록/인증 문서가 있어야만 `supported`로 판단한다.
- 근거 자료의 발행일이 3년 이상 경과한 경우 `outdated` gap을 기록한다.

## HITL 정책

- `unsupported` claim이 1개 이상 발견되면 사용자에게 근거 보완 또는 카피 수정을 요청한다.
- 근거 매핑의 관련성 판단이 모호한 경우, 매핑 결과를 사용자에게 제시하여 확인을 받는다.
- 사용자가 추가 근거 자료를 제공하면 재평가를 수행한다.

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `evidence.read` | 근거 자료 원문 열람 및 내용 확인 | N |
| `docs.read` | 과거 근거 매핑 사례 참조 | N |
| `policy.read` | 주장 유형별 요구 근거 수준 기준 참조 | N |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `NO_CLAIMS` | claims 배열이 비어 있음 | 스킬 실행 중단, claim-extractor 선행 실행 요청 |
| `EMPTY_PROOF_ASSETS` | proof_assets가 비어 있고 evidence_required claim 존재 | 모든 해당 claim을 unsupported로 분류, evidence_gaps에 전체 목록 기록 |
| `ASSET_ACCESS_FAILURE` | proof_asset의 URL/문서 접근 불가 | 해당 근거를 매핑에서 제외하고, 접근 불가 경고 첨부 |
| `MAPPING_AMBIGUITY` | claim과 근거의 관련성 판단이 불확실 | 후보 매핑을 모두 제시하고 사용자 확인 요청 |

## 좋은 예시

**입력:**
```json
{
  "claims": [
    {"claim_text": "피부과 전문의 92%가 추천", "claim_type": "statistical", "certainty": "definite", "evidence_required": true},
    {"claim_text": "국내 최초 특허 성분 함유", "claim_type": "regulatory", "certainty": "definite", "evidence_required": true},
    {"claim_text": "당신의 피부에 활력을", "claim_type": "subjective", "certainty": "implied", "evidence_required": false}
  ],
  "proof_assets": [
    {"asset_id": "SURVEY-2025-001", "type": "survey", "title": "피부과 전문의 A크림 추천 의향 설문", "summary": "전문의 200명 대상, 92.3%가 추천 의향 응답"},
    {"asset_id": "PATENT-KR-12345", "type": "patent", "title": "A크림 핵심 성분 특허 등록증", "summary": "2024년 등록, 국내 최초 해당 성분 조합 특허"}
  ]
}
```

**출력:**
```json
{
  "claim_evidence_map": [
    {
      "claim_text": "피부과 전문의 92%가 추천",
      "status": "supported",
      "matched_assets": ["SURVEY-2025-001"],
      "sufficiency": "sufficient",
      "sufficiency_reason": "전문의 200명 대상 설문에서 92.3% 추천 의향 확인. 표본 수 충분."
    },
    {
      "claim_text": "국내 최초 특허 성분 함유",
      "status": "supported",
      "matched_assets": ["PATENT-KR-12345"],
      "sufficiency": "sufficient",
      "sufficiency_reason": "특허 등록증에 '국내 최초' 해당 성분 조합 명시. 공식 문서로 충분."
    },
    {
      "claim_text": "당신의 피부에 활력을",
      "status": "supported",
      "matched_assets": [],
      "sufficiency": "sufficient",
      "sufficiency_reason": "주관적 표현으로 별도 근거 불필요."
    }
  ],
  "evidence_gaps": []
}
```

## 나쁜 예시

**입력:**
```json
{
  "claims": [
    {"claim_text": "임상시험에서 99% 효과 입증", "claim_type": "statistical", "certainty": "definite", "evidence_required": true}
  ],
  "proof_assets": [
    {"asset_id": "BLOG-001", "type": "internal_data", "title": "마케팅팀 내부 메모", "summary": "제품 만족도 높음"}
  ]
}
```

**잘못된 출력:**
```json
{
  "claim_evidence_map": [
    {
      "claim_text": "임상시험에서 99% 효과 입증",
      "status": "supported",
      "matched_assets": ["BLOG-001"],
      "sufficiency": "sufficient",
      "sufficiency_reason": "내부 메모에서 만족도 높음 확인"
    }
  ],
  "evidence_gaps": []
}
```

**문제점:**
- "99% 효과 입증"이라는 통계적 주장에 대해 "마케팅팀 내부 메모"는 적절한 근거가 아니다.
- `statistical` 유형의 claim에는 임상시험 결과 또는 공인 통계가 필요하다.
- 올바른 결과는 `partially_supported` 또는 `unsupported`이며, `evidence_gaps`에 임상시험 데이터 확보를 권고해야 한다.

## 테스트 케이스

| # | 시나리오 | 입력 조건 | 기대 결과 |
|---|---------|-----------|-----------|
| 1 | 완전 지원 | 모든 claim에 적절한 근거 매핑 | 전체 supported, evidence_gaps=[] |
| 2 | 근거 완전 부재 | proof_assets=[], evidence_required claim 존재 | 전체 unsupported, evidence_gaps에 전체 목록 |
| 3 | 부분 지원 | 3개 claim 중 1개만 근거 있음 | 1개 supported, 2개 unsupported |
| 4 | 약한 근거 | 내부 메모로 통계 주장 뒷받침 시도 | partially_supported, sufficiency=weak |
| 5 | 만료된 근거 | 4년 전 임상시험 데이터 | gap_type=outdated 기록 |
| 6 | 주관적 claim만 존재 | 모든 claim이 evidence_required=false | 전체 supported, 검증 스킵 |
| 7 | 접근 불가 근거 | proof_asset URL 접근 실패 | ASSET_ACCESS_FAILURE 경고, 해당 매핑 제외 |
