---
name: brand-lexicon-check
description: 브랜드 용어집 기반으로 금지어·필수어·톤 일관성을 검증
action_tags:
- evaluation
role_tags:
- 컴플라이언스
---

브랜드 금지어/권장어/필수 문구 적용 검증 스킬. 카피 내 모든 토큰을 브랜드 렉시콘 룰과 대조하여 위반 사항을 탐지하고, 대체 표현을 제안한다.

## 사용 조건

| 조건 | 설명 |
|------|------|
| **트리거** | 광고 카피가 생성 또는 수정된 직후, 퍼블리시 전 단계에서 자동 호출된다. |
| **선행 조건** | `lexicon_rules` 데이터가 로드 가능해야 한다(브랜드 가이드 저장소에 최소 1건 이상의 금지어/권장어/필수 문구 규칙 존재). |
| **건너뛰기** | `lexicon_rules`가 비어 있거나 해당 브랜드에 렉시콘 정책이 미등록된 경우 `skipped` 상태를 반환한다. |
| **재실행** | 카피 수정 후 재검증이 필요하면 동일 입력으로 재호출할 수 있다. |

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `copy` | `object` | Y | 검증 대상 카피. `{ headline: string, body: string, cta: string }` 구조. |
| `lexicon_rules` | `object` | Y | 브랜드 렉시콘 규칙 집합. 하위 키: `banned_words: string[]` (금지어 목록), `preferred_words: Record<string, string>` (비권장어 -> 권장어 매핑), `mandatory_phrases: string[]` (반드시 포함해야 하는 필수 문구). |
| `brand_id` | `string` | N | 브랜드 식별자. 멀티 브랜드 환경에서 규칙 세트를 분기할 때 사용. |
| `locale` | `string` | N | 언어/지역 코드(예: `ko-KR`). 다국어 렉시콘 규칙 분기에 사용. |

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `violation_tokens` | `array<object>` | 위반 토큰 목록. 각 항목: `{ token: string, location: "headline"\|"body"\|"cta", rule_type: "banned"\|"non_preferred"\|"mandatory_missing", severity: "high"\|"medium"\|"low" }`. |
| `replacement_suggestions` | `array<object>` | 대체 제안 목록. 각 항목: `{ original: string, suggested: string, reason: string }`. |
| `mandatory_coverage` | `object` | 필수 문구 충족 현황. `{ total: number, found: number, missing: string[] }`. |
| `pass` | `boolean` | 최종 통과 여부. `violation_tokens` 중 `severity=high`가 1건이라도 있으면 `false`. |
| `summary` | `string` | 사람이 읽을 수 있는 검증 결과 요약 문장. |

## 실행 단계

1. **렉시콘 규칙 로드** — `lexicon_rules`를 파싱하여 `banned_words`, `preferred_words`, `mandatory_phrases` 세 가지 규칙 세트를 메모리에 적재한다.
2. **카피 토큰화** — `copy`의 headline, body, cta 각 필드를 토큰으로 분리한다. 형태소 분석기 또는 공백+구두점 기반 분리를 사용한다.
3. **금지어 스캔** — 모든 토큰을 `banned_words`와 대조한다. 일치 시 `violation_tokens`에 `rule_type=banned`, `severity=high`로 기록한다.
4. **비권장어 스캔** — 토큰을 `preferred_words`의 키와 대조한다. 일치 시 `violation_tokens`에 `rule_type=non_preferred`, `severity=medium`으로 기록하고, `replacement_suggestions`에 권장어를 추가한다.
5. **필수 문구 검증** — `mandatory_phrases` 각 항목이 카피 전체(headline + body + cta 결합 텍스트)에 포함되어 있는지 확인한다. 미포함 시 `violation_tokens`에 `rule_type=mandatory_missing`, `severity=high`로 기록한다.
6. **결과 집계** — `mandatory_coverage`를 계산하고, `pass` 여부를 판정한다. `summary` 문장을 생성한다.
7. **가드레일** — 금지어가 부분 문자열로 포함된 경우(예: "할인" 금지인데 "할인율" 등장) 해당 컨텍스트를 함께 보고하여 오탐을 줄인다. 필수 문구가 약간의 변형(띄어쓰기, 조사 차이)으로 포함된 경우 `fuzzy_match=true` 플래그와 함께 통과 처리하되 리뷰어에게 알린다.

## HITL 정책

| 상황 | 정책 |
|------|------|
| `severity=high` 위반 발견 | 자동 차단(퍼블리시 불가). 마케터에게 위반 내역 알림 전송. |
| `severity=medium` 위반만 존재 | 경고 표시 후 마케터가 승인/수정 선택 가능. |
| `fuzzy_match` 필수 문구 | 리뷰어에게 정확한 문구 포함 여부 최종 확인 요청. |
| 규칙 충돌(금지어와 필수 문구가 겹침) | 자동 판단하지 않고, 브랜드 관리자에게 에스컬레이션. |

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `brand_guide.read` | 브랜드 렉시콘 규칙 조회 | N |
| `docs.read` | 브랜드 스타일 가이드 참조 | N |
| `policy.read` | 사내 마케팅 정책 확인 | N |
| `external.publish` | 검증 결과 외부 전송 | Y |
| `system.write` | 렉시콘 규칙 업데이트 | Y |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `lexicon_rules_empty` | 규칙 세트가 비어 있음 | `skipped` 상태 반환, 로그 기록. |
| `tokenization_error` | 카피 텍스트 인코딩 오류 또는 빈 문자열 | 에러 반환, 원본 카피와 인코딩 정보 로그. |
| `rule_conflict` | 금지어와 필수 문구가 동일 토큰을 참조 | 충돌 항목을 별도 리스트로 반환, 에스컬레이션 플래그 설정. |
| `partial_match_ambiguity` | 부분 문자열 매칭으로 오탐 다수 발생 | 매칭 컨텍스트(앞뒤 5토큰)를 함께 제공하여 리뷰어 판단 지원. |
| `timeout` | 대규모 카피(10,000자 초과)에서 처리 지연 | 청크 분할 후 병렬 처리, 60초 제한. |

## 좋은 예시

**예시 1: 금지어 탐지 + 권장어 제안**
```
입력:
  copy: { headline: "초특가 세일 시작!", body: "가성비 최고의 제품을 만나보세요.", cta: "지금 구매" }
  lexicon_rules:
    banned_words: ["초특가"]
    preferred_words: { "가성비": "합리적 가격" }
    mandatory_phrases: ["공식 인증"]

출력:
  violation_tokens:
    - { token: "초특가", location: "headline", rule_type: "banned", severity: "high" }
    - { token: "가성비", location: "body", rule_type: "non_preferred", severity: "medium" }
    - { token: "공식 인증", location: "-", rule_type: "mandatory_missing", severity: "high" }
  replacement_suggestions:
    - { original: "초특가", suggested: "특별 할인", reason: "브랜드 금지어 '초특가' 대체" }
    - { original: "가성비", suggested: "합리적 가격", reason: "브랜드 권장어 적용" }
  mandatory_coverage: { total: 1, found: 0, missing: ["공식 인증"] }
  pass: false
  summary: "금지어 1건, 비권장어 1건, 필수 문구 누락 1건 발견. 수정 필요."
```

**예시 2: 전체 통과**
```
입력:
  copy: { headline: "특별 할인 시작!", body: "합리적 가격의 공식 인증 제품입니다.", cta: "지금 구매" }
  lexicon_rules:
    banned_words: ["초특가"]
    preferred_words: { "가성비": "합리적 가격" }
    mandatory_phrases: ["공식 인증"]

출력:
  violation_tokens: []
  replacement_suggestions: []
  mandatory_coverage: { total: 1, found: 1, missing: [] }
  pass: true
  summary: "모든 렉시콘 규칙을 충족합니다."
```

## 나쁜 예시

**예시 1: 금지어를 간과하는 경우**
```
입력:
  copy: { headline: "초특가 대박 세일!", body: "지금 바로!", cta: "구매" }
  lexicon_rules:
    banned_words: ["초특가", "대박"]

잘못된 출력:
  violation_tokens: []
  pass: true

문제: "초특가"와 "대박" 두 금지어가 모두 headline에 존재하지만 탐지하지 못함.
```

**예시 2: 필수 문구를 유사 표현으로 잘못 통과 처리**
```
입력:
  mandatory_phrases: ["공식 인증 제품"]
  copy.body: "인증된 공식 제품"

잘못된 출력:
  mandatory_coverage: { total: 1, found: 1, missing: [] }
  pass: true

문제: "공식 인증 제품"과 "인증된 공식 제품"은 어순이 다른 별개 문구. fuzzy_match 플래그 없이 완전 통과 처리하면 안 됨.
```

## 테스트 케이스

| ID | 시나리오 | 입력 요약 | 기대 결과 |
|----|---------|-----------|-----------|
| TC-01 | 금지어 1개 포함 | headline에 금지어 "초특가" 포함 | `violation_tokens`에 banned 1건, `pass=false` |
| TC-02 | 비권장어 2개 포함 | body에 비권장어 2개 | `replacement_suggestions` 2건, `pass=true`(high 없으므로) |
| TC-03 | 필수 문구 누락 | mandatory_phrases 2개 중 1개만 카피에 존재 | `mandatory_coverage.missing` 1건, `pass=false` |
| TC-04 | 모든 규칙 충족 | 금지어 없음, 비권장어 없음, 필수 문구 모두 포함 | `pass=true`, `violation_tokens=[]` |
| TC-05 | 금지어 부분 매칭 | "할인" 금지이나 "할인율"로 등장 | 컨텍스트와 함께 경고, `severity=medium` |
| TC-06 | 필수 문구 fuzzy 매칭 | "공식 인증" 필수이나 "공식인증"(띄어쓰기 없음)으로 등장 | `fuzzy_match=true` 플래그와 함께 통과, 리뷰 요청 |
| TC-07 | 빈 lexicon_rules | 규칙이 모두 빈 배열 | `skipped` 상태 반환 |
| TC-08 | 규칙 충돌 | "프리미엄"이 금지어이자 필수 문구에 동시 등록 | `rule_conflict` 에러, 에스컬레이션 플래그 |
| TC-09 | 대용량 카피 | body가 10,000자 초과 | 60초 이내 정상 처리 완료 |
| TC-10 | 다국어 규칙 분기 | locale=en-US, 영어 금지어 적용 | 영어 규칙 세트로 정상 검증 |
