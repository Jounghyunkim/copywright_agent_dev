---
name: campaign-brief-normalizer
description: 입력 브리프를 표준 JSON 구조로 정규화하는 스킬.
action_tags:
- generation
role_tags:
- 카피 생성
---
## 사용 조건

- 캠페인 브리프가 자유 텍스트, 비정형 문서, 또는 불완전한 구조로 입력되었을 때 트리거된다.
- 광고 카피 생성 파이프라인의 첫 번째 단계로, 후속 스킬들이 표준화된 입력을 필요로 할 때 호출된다.
- 이미 표준 JSON 구조를 갖춘 브리프에 대해서도 필수 필드 검증 목적으로 호출할 수 있다.

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `raw_brief` | `string` | Y | 자유 텍스트 또는 비정형 형태의 캠페인 브리프 원문 |

### 입력 검증 규칙

- `raw_brief`는 빈 문자열이 아니어야 하며, 최소 10자 이상이어야 한다.
- 텍스트, Markdown, HTML, 또는 비정형 JSON 형태 모두 허용한다.

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `normalized_brief` | `NormalizedBrief` | 표준 구조로 정규화된 브리프 JSON |
| `normalized_brief.product_name` | `string` | 제품/서비스명 |
| `normalized_brief.campaign_objective` | `string` | 캠페인 목적 (인지도, 전환, 리텐션 등) |
| `normalized_brief.target_audience` | `TargetAudience` | 타깃 고객 세그먼트 정보 |
| `normalized_brief.key_messages` | `string[]` | 핵심 전달 메시지 목록 |
| `normalized_brief.tone` | `string` | 요구 톤/보이스 |
| `normalized_brief.constraints` | `Constraint[]` | 제약 조건 (글자 수, 금지 표현 등) |
| `normalized_brief.channels` | `string[]` | 배포 채널 (display, social, search 등) |
| `normalized_brief.cta` | `string` | 행동 유도 문구 (Call to Action) |
| `normalized_brief.missing_fields` | `string[]` | 원문에서 추출 불가능했던 필수 필드 목록 (빈 배열이 품질 기준) |

### 품질 기준

- `missing_fields` 배열의 길이가 0이어야 한다 (누락 필수필드 0개).
- 추출 불가능한 필드가 있을 경우, `missing_fields`에 명시하고 해당 필드는 빈 값으로 설정한다.

## 실행 단계

1. **입력 수신 및 형식 감지** -- `raw_brief`의 형식(텍스트, Markdown, HTML, JSON)을 자동 감지한다.
2. **전처리** -- HTML 태그 제거, 인코딩 정규화, 불필요한 공백/개행 정리를 수행한다.
3. **필수 필드 추출** -- `product_name`, `campaign_objective`, `target_audience`, `key_messages`, `tone`, `constraints`, `channels`, `cta`를 추출한다.
4. **추출 결과 검증** -- 각 필수 필드의 존재 여부를 확인하고, 누락된 필드를 `missing_fields`에 기록한다.
5. **값 정규화** -- `campaign_objective`를 사전 정의된 enum 값으로 매핑하고, `channels`를 표준 채널 코드로 변환한다.
6. **구조 조립** -- 추출 및 정규화된 값을 `NormalizedBrief` JSON 구조로 조립한다.
7. **최종 검증** -- 출력 JSON의 스키마 적합성을 확인하고 반환한다.

### 가드레일

- 추출 시 원문에 없는 정보를 추론하여 채우지 않는다. 확인 불가능한 필드는 반드시 `missing_fields`에 기록한다.
- `campaign_objective`가 사전 정의 enum에 매핑되지 않으면 원문 표현을 그대로 유지하고 경고를 첨부한다.

## HITL 정책

- `missing_fields`가 1개 이상인 경우, 사용자에게 누락 정보 보완을 요청한다.
- 자동 추출된 `target_audience`의 정확성이 불확실한 경우(신뢰도 0.7 미만), 사용자 확인을 요청한다.
- 정규화 결과는 사용자가 검토 후 승인할 수 있으나, 필수 사항은 아니다.

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `docs.read` | 브리프 템플릿 및 기존 브리프 참조 | N |
| `brand_guide.read` | 브랜드 톤/보이스 기준 참조 | N |
| `policy.read` | 필수 필드 정의 및 제약 조건 참조 | N |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `EMPTY_BRIEF` | raw_brief가 빈 문자열 또는 10자 미만 | 스킬 실행 중단, 유효한 브리프 입력 요청 |
| `PARSE_FAILURE` | 형식 감지 실패 또는 심각한 인코딩 오류 | 평문(plain text)으로 폴백 처리 후 재시도 |
| `EXCESSIVE_MISSING_FIELDS` | 필수 필드 중 50% 이상 추출 불가 | 경고와 함께 부분 결과 반환, 사용자 보완 요청 |
| `AMBIGUOUS_OBJECTIVE` | campaign_objective가 모호하여 매핑 불가 | 원문 표현을 유지하고, 가능한 매핑 후보 목록을 제안한다 |

## 좋은 예시

**입력:**
```json
{
  "raw_brief": "제품: 스마트워치 X1\n목적: 20-30대 직장인 대상 인지도 확대\n핵심 메시지: 건강 관리를 더 쉽게, 일상에 자연스럽게\n톤: 친근하고 활동적인\n채널: 인스타그램, 유튜브\n제약: 15자 이내 헤드카피\nCTA: 지금 체험하기"
}
```

**출력:**
```json
{
  "normalized_brief": {
    "product_name": "스마트워치 X1",
    "campaign_objective": "awareness",
    "target_audience": {"age_range": "20-30", "occupation": "직장인"},
    "key_messages": ["건강 관리를 더 쉽게", "일상에 자연스럽게"],
    "tone": "친근하고 활동적인",
    "constraints": [{"type": "max_length", "target": "headline", "value": 15}],
    "channels": ["instagram", "youtube"],
    "cta": "지금 체험하기",
    "missing_fields": []
  }
}
```

## 나쁜 예시

**입력:**
```json
{
  "raw_brief": "좋은 광고 만들어주세요"
}
```

**문제점:**
- 제품명, 타깃, 채널, 톤 등 핵심 정보가 모두 누락되어 있다.
- `missing_fields`에 대부분의 필수 필드가 포함되며, `EXCESSIVE_MISSING_FIELDS` 경고가 발생한다.
- 이 입력만으로는 유의미한 정규화가 불가능하므로 사용자에게 보완을 요청해야 한다.

## 테스트 케이스

| # | 시나리오 | 입력 조건 | 기대 결과 |
|---|---------|-----------|-----------|
| 1 | 완전한 브리프 | 모든 필수 정보 포함된 텍스트 | missing_fields=[], 모든 필드 정상 추출 |
| 2 | 부분 누락 브리프 | 채널, CTA 누락 | missing_fields=["channels", "cta"] |
| 3 | HTML 형식 브리프 | HTML 태그 포함 브리프 | 태그 제거 후 정상 추출 |
| 4 | 빈 입력 | raw_brief="" | EMPTY_BRIEF 오류 |
| 5 | 모호한 목적 | "매출 올리고 브랜드도 알리기" | campaign_objective 매핑 후보 제안 |
| 6 | JSON 형식 입력 | 이미 구조화된 JSON 브리프 | 필수 필드 검증 후 그대로 정규화 |
| 7 | 다국어 혼재 브리프 | 한/영 혼합 텍스트 | 정상 추출, 원문 언어 보존 |
