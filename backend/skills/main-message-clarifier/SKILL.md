---
name: main-message-clarifier
description: 모호한 핵심 메시지를 단일 주장으로 명확화하는 스킬.
action_tags:
- generation
role_tags:
- 카피 생성
---
## 사용 조건

- `campaign-brief-normalizer`에 의해 정규화된 브리프(`normalized_brief`)가 존재할 때 트리거된다.
- `normalized_brief.key_messages`가 모호하거나 복수의 주장이 혼재되어 있을 때 호출한다.
- 카피 생성 전 핵심 메시지를 확정하는 단계에서 사용한다.

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `normalized_brief` | `NormalizedBrief` | Y | campaign-brief-normalizer가 생성한 표준 브리프 JSON |

### 입력 검증 규칙

- `normalized_brief`는 유효한 NormalizedBrief 스키마를 따라야 한다.
- `normalized_brief.key_messages`가 최소 1개 이상 존재해야 한다.
- `normalized_brief.campaign_objective`와 `normalized_brief.target_audience`가 비어 있지 않아야 한다.

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `core_messages` | `CoreMessage[]` | 명확화된 핵심 메시지 1~3개 |
| `core_messages[].message` | `string` | 단일 주장으로 정리된 메시지 문장 |
| `core_messages[].objective_alignment` | `string` | 캠페인 목적과의 정합성 설명 |
| `core_messages[].target_relevance` | `string` | 타깃 고객과의 관련성 설명 |
| `core_messages[].cta_connection` | `string` | 행동 유도(CTA)와의 연결 설명 |
| `excluded_messages` | `ExcludedMessage[]` | 제외된 메시지와 제외 사유 |
| `excluded_messages[].original` | `string` | 제외된 원본 메시지 |
| `excluded_messages[].reason` | `string` | 제외 사유 (목적 불일치, 타깃 부적합, 중복 등) |

### 품질 기준

- 각 `core_message`는 캠페인 목적(`campaign_objective`), 타깃 고객(`target_audience`), 행동 유도(`cta`)와 일치해야 한다.
- `core_messages`는 1~3개 범위를 벗어나지 않아야 한다.
- 제외된 메시지에는 반드시 명확한 제외 사유가 포함되어야 한다.

## 실행 단계

1. **입력 검증** -- `normalized_brief`의 스키마 적합성 및 필수 필드 존재 여부를 확인한다.
2. **메시지 분해** -- `key_messages`를 개별 주장 단위로 분해한다. 하나의 문장에 복수 주장이 포함된 경우 분리한다.
3. **목적 정합성 평가** -- 각 주장이 `campaign_objective`와 얼마나 부합하는지 평가한다.
4. **타깃 관련성 평가** -- 각 주장이 `target_audience`의 관심사, 니즈, 언어 수준에 적합한지 평가한다.
5. **CTA 연결성 평가** -- 각 주장이 `cta`로 자연스럽게 이어지는지 평가한다.
6. **핵심 메시지 선별** -- 세 가지 평가를 종합하여 상위 1~3개를 `core_messages`로 선정한다.
7. **제외 메시지 기록** -- 선정되지 않은 메시지를 `excluded_messages`에 사유와 함께 기록한다.
8. **메시지 명확화** -- 선정된 메시지를 단일 주장, 명확한 문장으로 다듬는다.

### 가드레일

- 원문 메시지의 핵심 의도를 변경하지 않는다. 명확화는 표현 정리에 한정한다.
- 4개 이상의 `core_messages`를 반환하지 않는다. 우선순위를 결정하여 최대 3개로 제한한다.
- `excluded_messages`의 사유 없이 메시지를 제외하지 않는다.

## HITL 정책

- `core_messages` 선정 결과는 사용자에게 제시하여 확인을 받을 수 있다.
- 사용자가 제외된 메시지의 복원을 요청하면 재평가를 수행한다.
- 목적/타깃/CTA 평가 기준에 대한 이견이 있으면 사용자 판단을 우선한다.

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `docs.read` | 캠페인 이력 및 유사 사례 참조 | N |
| `brand_guide.read` | 브랜드 메시지 가이드라인 참조 | N |
| `policy.read` | 메시지 제약 조건 확인 | N |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `NO_KEY_MESSAGES` | normalized_brief.key_messages가 비어 있음 | 스킬 실행 중단, 브리프 보완 요청 |
| `ALL_MESSAGES_EXCLUDED` | 모든 메시지가 목적/타깃/CTA와 불일치 | 경고 반환, 브리프 재검토 권고 |
| `AMBIGUOUS_OBJECTIVE` | campaign_objective가 불명확하여 정합성 평가 불가 | 사용자에게 목적 명확화 요청 |
| `MESSAGE_MERGE_CONFLICT` | 분해된 주장들이 상충하여 통합 불가 | 상충하는 주장 쌍을 제시하고 사용자에게 선택 요청 |

## 좋은 예시

**입력:**
```json
{
  "normalized_brief": {
    "product_name": "스마트워치 X1",
    "campaign_objective": "awareness",
    "target_audience": {"age_range": "20-30", "occupation": "직장인"},
    "key_messages": ["건강도 챙기고 스타일도 챙기는 스마트워치", "운동 안 해도 건강 관리 가능", "하루 종일 배터리 걱정 없이"],
    "tone": "친근하고 활동적인",
    "cta": "지금 체험하기",
    "channels": ["instagram"],
    "constraints": [],
    "missing_fields": []
  }
}
```

**출력:**
```json
{
  "core_messages": [
    {
      "message": "바쁜 일상 속에서도 손목 위 하나로 건강을 관리하세요.",
      "objective_alignment": "인지도 확대 목적에 부합 -- 제품의 핵심 가치를 간결하게 전달",
      "target_relevance": "20-30대 직장인의 시간 부족 페인포인트에 직접 대응",
      "cta_connection": "'체험하기'로 자연스럽게 연결 -- 직접 사용해보고 싶은 동기 부여"
    },
    {
      "message": "하루 종일 충전 없이, 당신의 하루를 함께합니다.",
      "objective_alignment": "경쟁 제품 대비 차별 포인트로 인지도 강화",
      "target_relevance": "직장인의 긴 근무 시간에 적합한 배터리 수명 강조",
      "cta_connection": "'체험하기'를 통해 배터리 성능을 직접 확인하도록 유도"
    }
  ],
  "excluded_messages": [
    {
      "original": "건강도 챙기고 스타일도 챙기는 스마트워치",
      "reason": "핵심 메시지 1과 의미 중복. '스타일' 요소는 브리프의 핵심 목적(건강 관리)과 초점이 분산됨."
    }
  ]
}
```

## 나쁜 예시

**입력:**
```json
{
  "normalized_brief": {
    "product_name": "워치 Y2",
    "campaign_objective": "awareness",
    "target_audience": {"age_range": "전체"},
    "key_messages": ["좋은 시계입니다"],
    "tone": "",
    "cta": "",
    "channels": [],
    "constraints": [],
    "missing_fields": ["tone", "cta", "channels"]
  }
}
```

**문제점:**
- "좋은 시계입니다"는 구체적 주장이 아니므로 명확화할 실질적 내용이 부족하다.
- `cta`가 비어 있어 CTA 연결성 평가가 불가능하다.
- `target_audience`가 "전체"로 설정되어 타깃 관련성 평가의 변별력이 없다.
- 이 경우 `AMBIGUOUS_OBJECTIVE` 경고와 함께 브리프 보완을 요청해야 한다.

## 테스트 케이스

| # | 시나리오 | 입력 조건 | 기대 결과 |
|---|---------|-----------|-----------|
| 1 | 정상 명확화 | 3개 메시지, 명확한 목적/타깃/CTA | core_messages 1~3개, excluded 포함 |
| 2 | 단일 메시지 | key_messages 1개, 이미 명확 | core_messages 1개, excluded 0개 |
| 3 | 복수 주장 혼재 | 하나의 문장에 3개 주장 포함 | 분해 후 개별 평가, 1~3개 선정 |
| 4 | 전체 불일치 | 모든 메시지가 목적과 무관 | ALL_MESSAGES_EXCLUDED 경고 |
| 5 | 목적 불명확 | campaign_objective 비어 있음 | AMBIGUOUS_OBJECTIVE 오류 |
| 6 | 상충 주장 | "가격이 저렴" + "프리미엄 품질" 동시 존재 | MESSAGE_MERGE_CONFLICT 경고, 사용자 선택 요청 |
| 7 | key_messages 비어 있음 | key_messages=[] | NO_KEY_MESSAGES 오류 |
