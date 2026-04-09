---
name: claim-extractor
description: 카피의 주장(claim) 문장을 구조화하여 추출하는 스킬.
action_tags:
- evaluation
role_tags:
- 품질 검수
---
## 사용 조건

- 광고 카피 초안(`draft_copy`)이 작성되어 주장(claim) 분석이 필요할 때 트리거된다.
- 카피 내 사실적 주장, 수치적 주장, 비교 주장 등을 식별하여 후속 검증(proof-point-checker)에 전달하기 위해 호출된다.
- 카피 생성 후 검증 단계에서 필수적으로 실행되어야 한다.

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `draft_copy` | `string` | Y | 주장을 추출할 광고 카피 전문 |

### 입력 검증 규칙

- `draft_copy`는 빈 문자열이 아니어야 한다.
- 최소 1개 이상의 완성된 문장이 포함되어야 한다.

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `claim_list` | `Claim[]` | 추출된 주장 목록 |
| `claim_list[].claim_text` | `string` | 원문에서 추출한 주장 문장 |
| `claim_list[].claim_type` | `string` | 주장 유형: `factual`, `statistical`, `comparative`, `subjective`, `regulatory` |
| `claim_list[].certainty` | `string` | 확실성 수준: `definite`, `hedged`, `implied` |
| `claim_list[].evidence_required` | `boolean` | 근거 자료 필요 여부 |
| `claim_list[].evidence_reason` | `string` | 근거가 필요한 이유 또는 불필요한 근거 설명 |
| `claim_list[].source_location` | `string` | 원문 내 해당 주장의 위치 (문장 번호 또는 인덱스) |
| `claim_list[].risk_level` | `string` | 주장의 리스크 수준: `high`, `medium`, `low` |

### 품질 기준

- 핵심 claim recall: 카피 내 사실적/수치적/비교 주장의 90% 이상을 추출해야 한다.
- 주관적 표현(감성 카피)은 `subjective` 유형으로 분류하되 누락하지 않아야 한다.
- `evidence_required=true`인 claim은 반드시 `evidence_reason`이 비어 있지 않아야 한다.

## 실행 단계

1. **입력 검증** -- `draft_copy`의 유효성을 확인한다.
2. **문장 분리** -- 카피를 개별 문장 단위로 분리한다. 복합문은 절 단위로 추가 분리한다.
3. **주장 식별** -- 각 문장/절에서 검증 가능한 주장을 식별한다. 단순 감탄사, 인사말, CTA는 주장에서 제외한다.
4. **유형 분류** -- 식별된 주장을 `factual`, `statistical`, `comparative`, `subjective`, `regulatory` 중 하나로 분류한다.
5. **확실성 판단** -- 주장의 표현 강도를 분석하여 `definite`(단정), `hedged`(완화), `implied`(암시) 중 하나로 분류한다.
6. **근거 필요성 판단** -- 주장 유형과 확실성을 기반으로 근거 자료 필요 여부를 결정한다.
7. **리스크 수준 결정** -- 광고법 위반 가능성, 소비자 오인 가능성을 기준으로 리스크 수준을 판단한다.
8. **결과 조립** -- 추출된 주장들을 `claim_list` 배열로 구성하여 반환한다.

### 가드레일

- `factual`, `statistical`, `comparative` 유형은 `evidence_required=true`가 기본값이다.
- `subjective` 유형이라도 최상급 표현("최고", "최초", "유일")을 포함하면 `evidence_required=true`로 설정한다.
- `regulatory` 유형(법적 고지, 면책 조항)은 `evidence_required=true`이며 `risk_level=high`로 설정한다.

## HITL 정책

- 추출 결과는 자동으로 후속 스킬(proof-point-checker)에 전달 가능하나, 사용자가 검토를 요청하면 결과를 제시한다.
- 주장 유형 분류가 모호한 경우(예: 은유적 표현 vs 사실 주장), 사용자에게 확인을 요청한다.
- 사용자가 추가 claim을 수동으로 지정하면 목록에 추가한다.

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `policy.read` | 광고법 규제 기준 참조 (최상급 표현, 비교 광고 기준) | N |
| `docs.read` | 과거 claim 추출 사례 참조 | N |
| `evidence.read` | 기존 근거 자료 목록 참조 (근거 필요성 판단 보조) | N |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `EMPTY_COPY` | draft_copy가 빈 문자열 | 스킬 실행 중단, 유효한 카피 입력 요청 |
| `NO_CLAIMS_FOUND` | 카피에서 식별 가능한 주장이 없음 (예: 순수 감성 카피) | 빈 claim_list 반환, 경고 메시지 첨부 |
| `CLASSIFICATION_AMBIGUITY` | 주장의 유형/확실성 분류가 모호 | 해당 claim에 `ambiguous` 플래그를 추가하고 사용자 확인 요청 |
| `SENTENCE_PARSE_FAILURE` | 문장 분리 실패 (극단적 비정형 텍스트) | 전체 텍스트를 단일 문장으로 처리하고 경고 첨부 |

## 좋은 예시

**입력:**
```json
{
  "draft_copy": "A크림은 피부과 전문의 92%가 추천한 제품입니다. 사용 후 2주 만에 주름이 개선될 수 있습니다. 국내 최초 특허 성분 함유."
}
```

**출력:**
```json
{
  "claim_list": [
    {
      "claim_text": "피부과 전문의 92%가 추천",
      "claim_type": "statistical",
      "certainty": "definite",
      "evidence_required": true,
      "evidence_reason": "구체적 수치(92%)를 제시한 통계적 주장으로, 설문/연구 근거가 필요",
      "source_location": "문장 1",
      "risk_level": "high"
    },
    {
      "claim_text": "사용 후 2주 만에 주름이 개선될 수 있습니다",
      "claim_type": "factual",
      "certainty": "hedged",
      "evidence_required": true,
      "evidence_reason": "효능 주장으로 임상 데이터 필요. '될 수 있습니다'로 완화했으나 근거는 여전히 필요",
      "source_location": "문장 2",
      "risk_level": "medium"
    },
    {
      "claim_text": "국내 최초 특허 성분 함유",
      "claim_type": "regulatory",
      "certainty": "definite",
      "evidence_required": true,
      "evidence_reason": "'최초' 표현은 광고법상 입증 의무가 있으며, 특허 등록 증빙이 필요",
      "source_location": "문장 3",
      "risk_level": "high"
    }
  ]
}
```

## 나쁜 예시

**입력:**
```json
{
  "draft_copy": "A크림은 피부과 전문의 92%가 추천한 제품입니다. 국내 최초 특허 성분 함유."
}
```

**잘못된 출력:**
```json
{
  "claim_list": [
    {
      "claim_text": "A크림은 좋은 제품입니다",
      "claim_type": "subjective",
      "certainty": "definite",
      "evidence_required": false,
      "evidence_reason": "",
      "source_location": "전체",
      "risk_level": "low"
    }
  ]
}
```

**문제점:**
- "92% 추천"이라는 통계적 주장과 "국내 최초"라는 규제 관련 주장을 누락했다.
- 원문에 없는 "좋은 제품"이라는 표현을 임의로 생성했다.
- 고위험 주장을 모두 놓쳐 후속 검증이 불가능해진다.

## 테스트 케이스

| # | 시나리오 | 입력 조건 | 기대 결과 |
|---|---------|-----------|-----------|
| 1 | 복합 주장 카피 | 사실+통계+비교 주장 혼재 | 각 주장 개별 추출, 유형 정확 분류 |
| 2 | 순수 감성 카피 | "당신의 아름다움을 응원합니다" | NO_CLAIMS_FOUND 또는 subjective 1건 |
| 3 | 최상급 표현 포함 | "최고", "최초", "유일" 포함 | evidence_required=true, risk_level=high |
| 4 | 완화 표현 사용 | "~할 수 있습니다", "~에 도움을 줍니다" | certainty=hedged, evidence_required=true |
| 5 | 빈 카피 | draft_copy="" | EMPTY_COPY 오류 |
| 6 | 비교 주장 | "경쟁사 대비 2배 효과" | claim_type=comparative, risk_level=high |
| 7 | 면책 조항 포함 | "개인차가 있을 수 있습니다" 등 | claim_type=regulatory로 분류 |
