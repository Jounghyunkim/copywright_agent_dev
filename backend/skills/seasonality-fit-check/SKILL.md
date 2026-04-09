---
name: seasonality-fit-check
description: 시즌·시기에 맞는 카피 표현인지 검증
action_tags:
- localization
role_tags:
- 지역화 검증
---
시즌/이벤트/시점 적합성 판단 스킬. 광고 카피가 집행 시점의 계절, 기념일, 이벤트, 사회적 분위기와 적합한지 검증하고, 부적합 문구를 탐지하여 수정 제안을 제공한다.

## 사용 조건

| 조건 | 설명 |
|------|------|
| **트리거** | 광고 카피의 집행 일정이 확정된 후, 퍼블리시 전 단계에서 자동 호출된다. |
| **선행 조건** | `calendar_context`에 집행 기간, 해당 지역의 시즌/이벤트 정보가 포함되어야 한다. |
| **건너뛰기** | `calendar_context`가 비어 있거나 시즌 정보가 없는 경우 `skipped` 상태를 반환한다. |
| **재실행** | 집행 일정이 변경되었거나 카피가 수정된 경우 재호출할 수 있다. |

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `copy` | `object` | Y | 검증 대상 카피. `{ headline: string, body: string, cta: string }` 구조. |
| `calendar_context` | `object` | Y | 시점/시즌 맥락. `{ run_start: date, run_end: date, locale: string, season: string, holidays: string[], events: string[], social_mood: string }`. |
| `product_category` | `string` | N | 제품/서비스 카테고리(예: "화장품", "식품", "여행"). 시즌 적합성 판단의 정밀도를 높인다. |
| `historical_data` | `object` | N | 과거 동일 시즌 캠페인 성과 데이터. 시즌별 효과적인 메시지 패턴 참조용. |

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `seasonality_score` | `number` | 시즌 적합성 점수 (0-100). 80 이상이면 적합, 50-79이면 조건부 적합, 50 미만이면 부적합. |
| `revision_suggestions` | `array<object>` | 수정 제안 목록. 각 항목: `{ original_phrase: string, location: "headline"\|"body"\|"cta", issue: string, suggested_revision: string, priority: "high"\|"medium"\|"low" }`. |
| `season_match_details` | `object` | 시즌 매칭 상세. `{ matched_seasons: string[], matched_events: string[], conflicting_elements: string[] }`. |
| `timing_risks` | `array<object>` | 시점 관련 위험 요소. 각 항목: `{ risk: string, description: string, impact: "high"\|"medium"\|"low" }`. |
| `pass` | `boolean` | 최종 통과 여부. `seasonality_score >= 50`이면 `true`, 미만이면 `false`. |
| `summary` | `string` | 시즌 적합성 검증 결과 요약. |

## 실행 단계

1. **캘린더 맥락 분석** — `calendar_context`에서 집행 기간, 계절, 공휴일, 이벤트, 사회적 분위기를 추출하여 시점 프로파일을 구성한다.
2. **카피 시즌 키워드 추출** — 카피에서 계절, 날씨, 이벤트, 기념일 관련 키워드 및 표현을 추출한다. (예: "여름", "크리스마스", "신학기", "봄맞이" 등)
3. **시즌 일치 판정** — 추출된 키워드가 `calendar_context`의 시즌/이벤트와 일치하는지 확인한다. 불일치 항목을 `conflicting_elements`에 기록한다.
4. **시기 부적합 문구 탐지** — 집행 시점과 맞지 않는 표현을 탐지한다. (예: 7월 집행인데 "따뜻한 겨울" 표현, 크리스마스 이후 "크리스마스 특가" 등)
5. **민감 시점 검사** — 집행 기간이 국가 애도 기간, 재난 기념일 등과 겹치는 경우 부적절한 축제/유흥 표현이 있는지 확인한다.
6. **이벤트 활용도 평가** — 해당 시즌/이벤트와 관련된 소구점을 카피가 적절히 활용하고 있는지 평가한다. 활용하지 못한 기회를 `revision_suggestions`에 포함한다.
7. **점수 산정** — 시즌 일치도, 부적합 문구 개수, 민감 시점 위험, 이벤트 활용도를 종합하여 `seasonality_score`를 산정한다.
8. **가드레일** — `seasonality_score < 50`이면 퍼블리시 경고를 발행한다. 민감 시점(애도 기간 등) 관련 위험이 있으면 `timing_risks`에 `impact=high`로 기록하고, HITL 리뷰를 트리거한다.

## HITL 정책

| 상황 | 정책 |
|------|------|
| `seasonality_score < 50` | 마케터에게 시즌 부적합 경고, 수정 또는 집행 일정 변경 권고. |
| 민감 시점(애도, 재난 기념일) 충돌 | 마케터 + 커뮤니케이션 팀 공동 리뷰 필수. |
| 시즌 키워드 불일치 | 마케터에게 불일치 내역 표시, 의도적 사용 여부 확인 요청. |
| 집행 기간이 시즌 전환기에 걸침 | 집행 기간 분할 또는 중립적 표현 사용 권고, 마케터 판단 요청. |

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `docs.read` | 시즌별 마케팅 캘린더 조회 | N |
| `policy.read` | 민감 시점 관련 사내 정책 확인 | N |
| `evidence.read` | 과거 시즌 캠페인 성과 데이터 참조 | N |
| `brand_guide.read` | 브랜드 시즌 커뮤니케이션 가이드 조회 | N |
| `external.publish` | 검증 결과 외부 전송 | Y |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `calendar_empty` | calendar_context가 비어 있음 | `skipped` 상태 반환, 캘린더 정보 입력 요청. |
| `date_range_invalid` | run_start > run_end 또는 과거 날짜 | 에러 반환, 유효한 날짜 범위 입력 요청. |
| `season_data_outdated` | 시즌/이벤트 데이터가 최신이 아님 | 경고와 함께 기존 데이터로 처리, 데이터 업데이트 요청. |
| `ambiguous_season` | 시즌 전환기(예: 2월 말~3월 초)에 명확한 시즌 판정 불가 | 양쪽 시즌 모두 검증하여 결과 제공. |
| `missing_locale_holidays` | 해당 로케일의 공휴일/이벤트 데이터 미등록 | 기본 시즌 검증만 수행, 로케일 데이터 등록 요청. |

## 좋은 예시

**예시 1: 시즌 부적합 문구 탐지**
```
입력:
  copy:
    headline: "따뜻한 겨울, 핫초코와 함께"
    body: "추운 날씨에 딱 맞는 프리미엄 핫초코를 만나보세요."
    cta: "지금 주문"
  calendar_context:
    run_start: "2026-07-01"
    run_end: "2026-07-31"
    locale: "ko-KR"
    season: "여름"
    holidays: []
    events: ["여름 휴가 시즌"]

출력:
  seasonality_score: 25
  revision_suggestions:
    - original_phrase: "따뜻한 겨울"
      location: "headline"
      issue: "7월(여름) 집행인데 겨울 표현 사용"
      suggested_revision: "시원한 여름, 아이스초코와 함께"
      priority: "high"
    - original_phrase: "추운 날씨에 딱 맞는"
      location: "body"
      issue: "여름 시즌에 추운 날씨 언급은 부적합"
      suggested_revision: "더운 날씨에 시원하게 즐기는"
      priority: "high"
  season_match_details:
    matched_seasons: []
    matched_events: []
    conflicting_elements: ["겨울", "추운 날씨"]
  pass: false
  summary: "여름 집행 카피에 겨울 표현 2건 포함. 시즌 적합성 매우 낮음. 수정 필수."
```

**예시 2: 이벤트 적합 카피 통과**
```
입력:
  copy:
    headline: "새 학기, 새 시작!"
    body: "신학기 맞이 학용품 특별 할인. 준비된 아이가 빛납니다."
    cta: "할인 보기"
  calendar_context:
    run_start: "2026-02-20"
    run_end: "2026-03-10"
    locale: "ko-KR"
    season: "봄"
    holidays: []
    events: ["신학기"]

출력:
  seasonality_score: 95
  revision_suggestions: []
  season_match_details:
    matched_seasons: ["봄"]
    matched_events: ["신학기"]
    conflicting_elements: []
  pass: true
  summary: "신학기 시즌과 완벽하게 일치. 시즌 적합성 우수."
```

## 나쁜 예시

**예시 1: 민감 시점을 간과하는 경우**
```
입력:
  copy:
    headline: "신나는 축제 분위기! 대박 파티 세일"
    body: "올해 가장 큰 축제를 놓치지 마세요!"
    cta: "참여하기"
  calendar_context:
    run_start: "2026-04-16"
    run_end: "2026-04-16"
    locale: "ko-KR"
    social_mood: "세월호 참사 추모 기간"

잘못된 출력:
  seasonality_score: 85
  pass: true

문제: 4월 16일은 세월호 참사 추모일로 국가적 애도 분위기. "신나는 축제", "대박 파티"는 부적절한 표현이나 탐지하지 못함.
timing_risks에 민감 시점 충돌을 기록하고, 축제/유흥 표현 수정을 권고해야 함.
```

**예시 2: 시즌 전환기를 무시하는 경우**
```
입력:
  copy:
    headline: "한여름 무더위 탈출!"
    body: "시원한 여름 아이템을 만나보세요."
  calendar_context:
    run_start: "2026-08-25"
    run_end: "2026-09-15"
    season: "여름/가을 전환기"

잘못된 출력:
  seasonality_score: 90
  pass: true

문제: 집행 기간이 8월 말~9월 중순으로 여름에서 가을로 전환되는 시기. 9월 중순까지 "한여름 무더위"를 사용하면 시의성이 떨어짐. 전환기 특성을 반영한 수정 제안이 필요.
```

## 테스트 케이스

| ID | 시나리오 | 입력 요약 | 기대 결과 |
|----|---------|-----------|-----------|
| TC-01 | 시즌 불일치 | 여름 집행에 겨울 표현 | `seasonality_score < 50`, `pass=false` |
| TC-02 | 시즌 완전 일치 | 신학기 시즌에 신학기 카피 | `seasonality_score >= 80`, `pass=true` |
| TC-03 | 민감 시점 충돌 | 추모일에 축제 표현 | `timing_risks`에 `impact=high`, HITL 트리거 |
| TC-04 | 시즌 전환기 | 8월 말~9월 중순 집행, 여름 표현 | `revision_suggestions`에 전환기 고려 수정안 |
| TC-05 | 공휴일 활용 | 설날 시즌인데 설날 언급 없음 | `revision_suggestions`에 설날 활용 제안 |
| TC-06 | 캘린더 비어 있음 | calendar_context 미입력 | `skipped` 상태 반환 |
| TC-07 | 날짜 범위 오류 | run_start > run_end | 에러 반환 |
| TC-08 | 시즌 중립 카피 | 시즌 키워드 없는 범용 카피 | `seasonality_score` 60-80 범위, 조건부 통과 |
| TC-09 | 다중 이벤트 | 크리스마스 + 연말 + 신년 겹침 | 모든 이벤트 매칭 결과 포함 |
| TC-10 | 로케일 미등록 | 해당 locale 공휴일 데이터 없음 | 기본 시즌 검증만 수행, 데이터 등록 요청 |
