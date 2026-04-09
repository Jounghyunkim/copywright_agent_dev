---
name: tone-and-voice-enforcer
description: 브랜드 톤/보이스 위반을 탐지하고 수정을 제안하는 스킬.
action_tags:
- generation
role_tags:
- 카피 생성
---
## 사용 조건

- 광고 카피 초안(`draft_copy`)이 작성된 후 톤/보이스 검증이 필요할 때 트리거된다.
- 브랜드 톤 가이드(`tone_guide`)가 사전에 정의되어 있어야 한다.
- 카피 생성, 수정, 또는 검토 단계에서 반복적으로 호출할 수 있다.

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `draft_copy` | `string` | Y | 검증 대상 광고 카피 초안 전문 |
| `tone_guide` | `ToneGuide` | Y | 브랜드 톤/보이스 가이드라인 |
| `tone_guide.allowed_tones` | `string[]` | Y | 허용 톤 목록 (예: "친근한", "전문적인") |
| `tone_guide.prohibited_tones` | `string[]` | Y | 금지 톤 목록 (예: "공격적인", "비하적인") |
| `tone_guide.prohibited_expressions` | `string[]` | N | 금지 표현/단어 목록 |
| `tone_guide.style_rules` | `StyleRule[]` | N | 문체 규칙 (경어체/반말, 문장 길이 등) |

### 입력 검증 규칙

- `draft_copy`는 빈 문자열이 아니어야 한다.
- `tone_guide.allowed_tones`와 `tone_guide.prohibited_tones`는 각각 최소 1개 이상이어야 한다.
- `allowed_tones`와 `prohibited_tones`에 중복 항목이 없어야 한다.

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `violations` | `Violation[]` | 탐지된 톤/보이스 위반 목록 |
| `violations[].location` | `string` | 위반이 발생한 텍스트 위치/구간 |
| `violations[].original_text` | `string` | 위반 원문 |
| `violations[].violation_type` | `string` | 위반 유형: `prohibited_tone`, `prohibited_expression`, `style_rule_breach` |
| `violations[].severity` | `string` | 심각도: `critical`, `warning`, `info` |
| `violations[].rule_reference` | `string` | 위반한 가이드라인 규칙 참조 |
| `suggested_revisions` | `Revision[]` | 위반별 수정 제안 목록 |
| `suggested_revisions[].violation_index` | `number` | 대응하는 violation의 인덱스 |
| `suggested_revisions[].revised_text` | `string` | 수정 제안 텍스트 |
| `suggested_revisions[].rationale` | `string` | 수정 근거 설명 |

### 품질 기준

- `prohibited_tones`에 해당하는 표현을 100% 탐지해야 한다 (금지 톤 표현 recall = 1.0).
- `prohibited_expressions` 목록의 표현은 정확 매칭 기준 100% 탐지해야 한다.
- 모든 `violation`에 대해 최소 1개의 `suggested_revision`이 존재해야 한다.

## 실행 단계

1. **입력 검증** -- `draft_copy`와 `tone_guide`의 스키마 및 필수값을 확인한다.
2. **금지 표현 스캔** -- `prohibited_expressions` 목록을 기준으로 정확 매칭 검사를 수행한다.
3. **금지 톤 분석** -- 문장별로 톤을 분석하고, `prohibited_tones`에 해당하는 표현을 탐지한다.
4. **허용 톤 적합성 평가** -- 전체 카피가 `allowed_tones`에 부합하는지 평가한다. 허용 톤과 동떨어진 문장을 식별한다.
5. **문체 규칙 검사** -- `style_rules`가 정의된 경우, 경어체/반말 일관성, 문장 길이 제한 등을 검사한다.
6. **위반 목록 생성** -- 탐지된 모든 위반을 `violations` 배열로 구성하고, severity를 부여한다.
7. **수정 제안 생성** -- 각 위반에 대해 `allowed_tones`에 부합하는 대체 표현을 제안한다.
8. **결과 반환** -- `violations`와 `suggested_revisions`를 반환한다.

### 가드레일

- 위반 탐지 시 문맥을 고려한다. 인용문이나 예시 내의 표현은 위반으로 분류하지 않는다.
- 수정 제안은 원문의 의미를 보존하면서 톤만 변경해야 한다.
- `critical` severity는 금지 톤/표현의 직접 사용에만 부여한다.

## HITL 정책

- `critical` severity 위반이 발견되면 사용자에게 즉시 알린다.
- 수정 제안의 적용 여부는 사용자가 결정한다. 자동 적용하지 않는다.
- 톤 판단이 모호한 경우(경계 사례), 위반 여부를 사용자에게 확인 요청한다.

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `brand_guide.read` | 톤/보이스 가이드라인 상세 참조 | N |
| `docs.read` | 과거 톤 위반 사례 및 수정 이력 참조 | N |
| `policy.read` | 광고 표현 규제 기준 참조 | N |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `EMPTY_DRAFT` | draft_copy가 빈 문자열 | 스킬 실행 중단, 유효한 카피 입력 요청 |
| `INVALID_TONE_GUIDE` | tone_guide에 allowed/prohibited_tones 누락 | 스킬 실행 중단, 톤 가이드 보완 요청 |
| `TONE_ANALYSIS_UNCERTAINTY` | 톤 분류 신뢰도가 임계값 미만 | 해당 문장을 `info` severity로 표시하고 사용자 확인 요청 |
| `CONFLICTING_TONES` | allowed_tones와 prohibited_tones에 동일 항목 존재 | 스킬 실행 중단, 톤 가이드 충돌 해결 요청 |

## 좋은 예시

**입력:**
```json
{
  "draft_copy": "이 제품 안 사면 진짜 후회할걸? 지금 당장 구매하세요!",
  "tone_guide": {
    "allowed_tones": ["친근한", "신뢰감 있는"],
    "prohibited_tones": ["공격적인", "압박적인"],
    "prohibited_expressions": ["안 사면 후회", "당장"],
    "style_rules": [{"rule": "경어체 사용", "applies_to": "전체"}]
  }
}
```

**출력:**
```json
{
  "violations": [
    {
      "location": "문장 1",
      "original_text": "이 제품 안 사면 진짜 후회할걸?",
      "violation_type": "prohibited_expression",
      "severity": "critical",
      "rule_reference": "금지 표현: '안 사면 후회'"
    },
    {
      "location": "문장 2",
      "original_text": "지금 당장 구매하세요!",
      "violation_type": "prohibited_tone",
      "severity": "warning",
      "rule_reference": "금지 톤: 압박적인"
    }
  ],
  "suggested_revisions": [
    {
      "violation_index": 0,
      "revised_text": "이 제품과 함께라면 더 나은 일상을 경험하실 수 있어요.",
      "rationale": "압박 대신 긍정적 경험을 강조하여 '친근한' 톤으로 변환"
    },
    {
      "violation_index": 1,
      "revised_text": "지금 만나보세요.",
      "rationale": "'당장' 제거, '구매' 대신 '만나보세요'로 부드러운 CTA 전환"
    }
  ]
}
```

## 나쁜 예시

**입력:**
```json
{
  "draft_copy": "프리미엄 스킨케어 솔루션을 경험하세요.",
  "tone_guide": {
    "allowed_tones": [],
    "prohibited_tones": [],
    "prohibited_expressions": []
  }
}
```

**문제점:**
- `allowed_tones`와 `prohibited_tones`가 모두 비어 있어 톤 평가 기준이 없다.
- 이 경우 `INVALID_TONE_GUIDE` 오류를 반환해야 한다.
- 톤 가이드 없이 위반 탐지를 시도하면 무의미한 결과가 생성된다.

## 테스트 케이스

| # | 시나리오 | 입력 조건 | 기대 결과 |
|---|---------|-----------|-----------|
| 1 | 금지 표현 탐지 | prohibited_expressions에 포함된 표현 사용 | violation 탐지, severity=critical |
| 2 | 금지 톤 탐지 | 공격적/압박적 톤의 문장 | violation 탐지, 수정 제안 포함 |
| 3 | 위반 없음 | allowed_tones에 완벽 부합하는 카피 | violations=[], suggested_revisions=[] |
| 4 | 문체 규칙 위반 | 경어체 규칙인데 반말 사용 | style_rule_breach violation |
| 5 | 빈 카피 | draft_copy="" | EMPTY_DRAFT 오류 |
| 6 | 톤 가이드 충돌 | "친근한"이 allowed와 prohibited 모두에 존재 | CONFLICTING_TONES 오류 |
| 7 | 모호한 톤 문장 | 톤 분류 경계에 있는 표현 | info severity, 사용자 확인 요청 |
