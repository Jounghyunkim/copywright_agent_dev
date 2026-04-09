---
name: compliance-redflag-detector
description: 법적·규정 위반 가능성이 있는 레드플래그 표현을 탐지
action_tags:
- evaluation
role_tags:
- 컴플라이언스
---
규정 위반 가능 문구 red flag 탐지 스킬. 광고 카피를 관련 규제/법령 스니펫과 대조하여, 법적 리스크가 있는 표현을 사전에 탐지하고 근거 위치를 명시한다. 고위험 표현에 대해 95% 이상의 재현율을 목표로 한다.

## 사용 조건

| 조건 | 설명 |
|------|------|
| **트리거** | 광고 카피가 생성 또는 수정된 직후, 법무 리뷰 및 퍼블리시 전 단계에서 자동 호출된다. |
| **선행 조건** | `regulation_snippets`에 해당 제품/서비스/지역에 적용되는 규제 조항이 최소 1건 이상 포함되어야 한다. |
| **건너뛰기** | `regulation_snippets`가 비어 있는 경우 `skipped` 상태를 반환하고, 법무팀에 규제 데이터 등록을 요청한다. |
| **재실행** | 카피 수정 후 또는 규제 데이터 업데이트 시 재호출할 수 있다. |

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `copy` | `object` | Y | 검증 대상 카피. `{ headline: string, body: string, cta: string, disclaimer: string }` 구조. |
| `regulation_snippets` | `array<object>` | Y | 적용 규제 조항 목록. 각 항목: `{ regulation_id: string, regulation_name: string, clause: string, prohibited_patterns: string[], required_disclosures: string[], severity: "critical"\|"high"\|"medium" }`. |
| `product_category` | `string` | N | 제품/서비스 카테고리(예: "의약품", "금융", "식품", "화장품"). 카테고리별 규제 가중치 적용. |
| `locale` | `string` | N | 광고 집행 지역(예: "ko-KR", "us-US"). 지역별 규제 분기. |
| `previous_flags` | `array<object>` | N | 이전 검증에서 발견된 red flag 목록. 재검증 시 해소 여부 확인용. |

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `red_flag_list` | `array<object>` | Red flag 목록. 각 항목: `{ flag_id: string, flagged_phrase: string, location: "headline"\|"body"\|"cta"\|"disclaimer", violation_type: string, matched_regulation: string, regulation_clause: string, severity: "critical"\|"high"\|"medium", confidence: number, explanation: string, remediation: string }`. |
| `evidence_locations` | `array<object>` | 근거 위치 목록. 각 항목: `{ flag_id: string, regulation_id: string, clause_text: string, match_type: "exact"\|"semantic"\|"pattern" }`. |
| `disclosure_check` | `object` | 필수 고지사항 충족 검사. `{ required: string[], found: string[], missing: string[] }`. |
| `risk_summary` | `object` | 위험 요약. `{ critical_count: number, high_count: number, medium_count: number, overall_risk: "red"\|"yellow"\|"green" }`. |
| `pass` | `boolean` | 최종 통과 여부. `critical` 또는 `high` severity가 1건이라도 있으면 `false`. |
| `summary` | `string` | 검증 결과 요약. |

## 실행 단계

1. **규제 데이터 로드** — `regulation_snippets`를 파싱하여 규제별 금지 패턴(`prohibited_patterns`), 필수 고지사항(`required_disclosures`), 심각도(`severity`)를 적재한다.
2. **패턴 매칭 스캔** — 카피의 모든 필드(headline, body, cta, disclaimer)를 `prohibited_patterns`와 대조한다. 정규식 패턴, 키워드, 구문 단위 매칭을 수행한다.
3. **의미 기반 스캔** — 패턴 매칭으로 탐지되지 않는 의미적 위반을 탐지한다. 예: "효과가 보장됩니다"는 직접 금지어가 아니지만, "효능 보장 금지" 규정에 의미적으로 해당. `match_type=semantic`으로 기록하고 `confidence` 점수를 부여한다.
4. **필수 고지사항 검사** — `required_disclosures`에 명시된 고지사항이 카피(특히 disclaimer 필드)에 포함되어 있는지 확인한다. 누락 시 `disclosure_check.missing`에 기록하고 `severity=high`의 red flag를 생성한다.
5. **위험 수준 분류** — 각 red flag에 `severity`를 할당한다. `critical`(법적 제재 가능), `high`(규제 위반 가능성 높음), `medium`(주의 필요).
6. **근거 매핑** — 각 red flag에 대해 위반 근거가 되는 규제 조항의 원문(`clause_text`)과 매칭 방식(`match_type`)을 `evidence_locations`에 기록한다.
7. **재검증 처리** — `previous_flags`가 있는 경우, 이전 red flag들이 해소되었는지 확인하고 결과에 반영한다.
8. **가드레일** — `severity=critical` red flag 발견 시 퍼블리시를 즉시 차단한다. 의미 기반 탐지(`match_type=semantic`)의 `confidence < 70`인 항목은 사람 리뷰 대상으로 표시한다. 고위험 표현 재현율 95% 이상을 유지하기 위해 보수적으로 탐지한다(재현율 우선, 정밀도는 사람 리뷰로 보완).

## HITL 정책

| 상황 | 정책 |
|------|------|
| `severity=critical` red flag | 퍼블리시 즉시 차단. 법무팀 리뷰 필수. |
| `severity=high` red flag | 퍼블리시 차단. 법무팀 또는 규제 담당자 리뷰 후 승인/수정. |
| `severity=medium` red flag | 경고 표시, 마케터가 수정 또는 리스크 수용 선택 가능. |
| `match_type=semantic`, `confidence < 70` | 자동 판단하지 않고 법무팀에 사람 리뷰 요청. |
| 필수 고지사항 누락 | 고지사항 추가 후 재검증 필수. |
| `regulation_snippets` 미등록 | 법무팀에 규제 데이터 등록 요청, 수동 리뷰 필수. |

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `policy.read` | 규제 조항 및 사내 컴플라이언스 정책 조회 | N |
| `docs.read` | 규제 가이드라인 문서 참조 | N |
| `evidence.read` | 과거 컴플라이언스 위반 사례 조회 | N |
| `brand_guide.read` | 브랜드 법적 고지사항 가이드 조회 | N |
| `external.publish` | 검증 결과 외부 전송 | Y |
| `system.write` | 규제 데이터 업데이트 | Y |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `regulations_empty` | regulation_snippets가 비어 있음 | `skipped` 상태 반환, 법무팀에 규제 데이터 등록 요청. |
| `pattern_syntax_error` | prohibited_patterns에 잘못된 정규식 포함 | 해당 패턴 건너뛰고 경고 로그, 패턴 수정 요청. |
| `semantic_model_error` | 의미 기반 탐지 모델 오류 | 패턴 매칭 결과만 제공, 의미 기반 탐지 불가 경고. |
| `regulation_conflict` | 서로 다른 규제 간 상충 조항 | 양쪽 규제 모두 적용하여 보수적 판단, 법무팀 에스컬레이션. |
| `locale_regulation_missing` | 해당 지역의 규제 데이터 미등록 | 범용 규제만 적용, 지역별 규제 등록 요청. |
| `high_false_positive_rate` | 과도한 탐지로 오탐 다수 | `confidence` 점수 포함하여 리뷰어 우선순위 판단 지원. |

## 좋은 예시

**예시 1: 다수 red flag 탐지**
```
입력:
  copy:
    headline: "이 크림을 바르면 주름이 사라집니다"
    body: "임상 시험 없이도 효과를 보장합니다. 부작용 걱정 없는 100% 안전한 제품."
    cta: "지금 구매"
    disclaimer: ""
  regulation_snippets:
    - regulation_id: "KFDA-2024-001"
      regulation_name: "화장품 표시/광고 가이드라인"
      clause: "화장품 광고에서 의약품적 효능(질병 치료, 신체 구조/기능 변화)을 표방하는 표현 금지"
      prohibited_patterns: ["사라집니다", "치료", "완치"]
      required_disclosures: ["개인차가 있을 수 있습니다"]
      severity: "critical"
    - regulation_id: "FTC-KR-002"
      regulation_name: "공정거래법 표시광고법"
      clause: "객관적 근거 없이 효능 보장 표현 사용 금지"
      prohibited_patterns: ["효과.*보장", "100%.*안전"]
      severity: "high"

출력:
  red_flag_list:
    - flag_id: "RF-001"
      flagged_phrase: "주름이 사라집니다"
      location: "headline"
      violation_type: "의약품적 효능 표방"
      matched_regulation: "KFDA-2024-001"
      regulation_clause: "화장품 광고에서 의약품적 효능을 표방하는 표현 금지"
      severity: "critical"
      confidence: 98
      explanation: "'사라집니다'는 신체 구조 변화를 암시하는 의약품적 효능 표현에 해당"
      remediation: "'주름 개선에 도움을 줄 수 있습니다'로 수정"
    - flag_id: "RF-002"
      flagged_phrase: "효과를 보장합니다"
      location: "body"
      violation_type: "근거 없는 효능 보장"
      matched_regulation: "FTC-KR-002"
      severity: "high"
      confidence: 95
      explanation: "객관적 임상 근거 없이 효과를 보장하는 표현은 표시광고법 위반"
      remediation: "'효과를 기대할 수 있습니다'로 수정하고 임상 근거 추가"
    - flag_id: "RF-003"
      flagged_phrase: "100% 안전한 제품"
      location: "body"
      violation_type: "절대적 안전성 주장"
      matched_regulation: "FTC-KR-002"
      severity: "high"
      confidence: 97
      explanation: "어떤 제품도 100% 안전을 보장할 수 없으며, 절대적 표현은 허위 광고에 해당"
      remediation: "'안전성 테스트를 완료한 제품'으로 수정"
  evidence_locations:
    - { flag_id: "RF-001", regulation_id: "KFDA-2024-001", clause_text: "화장품 광고에서 의약품적 효능...금지", match_type: "exact" }
    - { flag_id: "RF-002", regulation_id: "FTC-KR-002", clause_text: "객관적 근거 없이 효능 보장 표현 사용 금지", match_type: "pattern" }
    - { flag_id: "RF-003", regulation_id: "FTC-KR-002", clause_text: "객관적 근거 없이 효능 보장 표현 사용 금지", match_type: "pattern" }
  disclosure_check:
    required: ["개인차가 있을 수 있습니다"]
    found: []
    missing: ["개인차가 있을 수 있습니다"]
  risk_summary: { critical_count: 1, high_count: 2, medium_count: 0, overall_risk: "red" }
  pass: false
  summary: "critical 1건, high 2건 발견. 필수 고지사항 1건 누락. 퍼블리시 불가. 법무팀 리뷰 필수."
```

**예시 2: 전체 통과**
```
입력:
  copy:
    headline: "피부 보습에 도움을 줄 수 있는 크림"
    body: "자연유래 성분으로 피부 컨디션 관리를 도와줍니다."
    cta: "자세히 보기"
    disclaimer: "개인차가 있을 수 있습니다. 피부 이상 시 사용을 중단하세요."
  regulation_snippets:
    - regulation_id: "KFDA-2024-001"
      prohibited_patterns: ["사라집니다", "치료", "완치"]
      required_disclosures: ["개인차가 있을 수 있습니다"]
      severity: "critical"

출력:
  red_flag_list: []
  evidence_locations: []
  disclosure_check: { required: ["개인차가 있을 수 있습니다"], found: ["개인차가 있을 수 있습니다"], missing: [] }
  risk_summary: { critical_count: 0, high_count: 0, medium_count: 0, overall_risk: "green" }
  pass: true
  summary: "규정 위반 사항 없음. 필수 고지사항 충족. 퍼블리시 가능."
```

## 나쁜 예시

**예시 1: 고위험 표현을 놓치는 경우**
```
입력:
  copy:
    headline: "이 건강기능식품으로 암을 예방하세요"
    body: "매일 한 알로 질병 걱정 끝!"
  regulation_snippets:
    - regulation_id: "KHSA-001"
      prohibited_patterns: ["암.*예방", "질병.*치료"]
      severity: "critical"

잘못된 출력:
  red_flag_list: []
  pass: true

문제: "암을 예방하세요"는 건강기능식품의 질병 예방 효능 표방으로 critical 위반.
"질병 걱정 끝"도 질병 치료/예방을 암시하는 고위험 표현. 두 건 모두 탐지해야 함.
재현율 95% 목표에 크게 미달.
```

**예시 2: 필수 고지사항 누락을 무시하는 경우**
```
입력:
  copy:
    disclaimer: ""
  regulation_snippets:
    - required_disclosures: ["이 광고는 투자 권유가 아닙니다", "원금 손실 가능성이 있습니다"]
      severity: "high"

잘못된 출력:
  disclosure_check: { required: [], found: [], missing: [] }
  pass: true

문제: 금융 상품 광고에 필수 고지사항 2건이 모두 누락되었으나 탐지하지 못함.
required_disclosures를 올바르게 파싱하여 누락 여부를 검사해야 함.
```

## 테스트 케이스

| ID | 시나리오 | 입력 요약 | 기대 결과 |
|----|---------|-----------|-----------|
| TC-01 | critical 위반 탐지 | 화장품 카피에 "치료" 표현 | `severity=critical` red flag, `pass=false` |
| TC-02 | high 위반 탐지 | "100% 효과 보장" 표현 | `severity=high` red flag, `pass=false` |
| TC-03 | medium 위반 탐지 | 경미한 과장 표현 | `severity=medium` red flag, `pass=true` |
| TC-04 | 필수 고지사항 누락 | disclaimer 비어 있음 | `disclosure_check.missing` 1건 이상 |
| TC-05 | 필수 고지사항 충족 | disclaimer에 모든 고지사항 포함 | `disclosure_check.missing=[]` |
| TC-06 | 의미 기반 탐지 | "효과를 약속드립니다"(패턴 미등록이나 의미적 위반) | `match_type=semantic`, `confidence` 점수 포함 |
| TC-07 | 전체 통과 | 위반 없음, 고지사항 충족 | `pass=true`, `overall_risk=green` |
| TC-08 | 규제 데이터 없음 | regulation_snippets 비어 있음 | `skipped` 상태 반환 |
| TC-09 | 재검증 | previous_flags 포함, 일부 해소 | 해소된 flag 제거, 미해소 flag 유지 |
| TC-10 | 다중 규제 적용 | 2개 이상 규제 동시 적용 | 각 규제별 red flag 독립 검사 |
| TC-11 | 정규식 오류 | prohibited_patterns에 잘못된 정규식 | 해당 패턴 건너뛰기, 경고 로그 |
| TC-12 | 고재현율 검증 | 고위험 표현 20건 포함 카피 | 19건 이상 탐지 (95%+) |
