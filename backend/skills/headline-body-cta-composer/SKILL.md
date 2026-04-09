---
name: headline-body-cta-composer
description: 헤드라인, 본문, CTA를 구조적으로 조합하여 완성된 카피를 생성
action_tags:
- generation
role_tags:
- 카피 생성
---
핵심 메시지, 톤, 길이 제한을 기반으로 headline / body / CTA 조합 후보 세트를 생성한다. 다양한 조합을 제안하여 카피라이터의 선택지를 넓히고, 품질 기준에 따라 각 조합의 적합도를 평가한다.

## 사용 조건

이 스킬은 다음 상황에서 트리거된다.

- 캠페인 브리프가 정리되고 핵심 메시지가 확정된 후, 초안 카피 조합을 생성해야 하는 경우
- 기존 카피의 headline/body/CTA 조합을 다양화하여 A/B 테스트 후보를 만들어야 하는 경우
- 카피라이터가 다수의 조합 후보를 빠르게 탐색하고자 하는 경우
- 브리프 변경 후 새로운 조합을 재생성해야 하는 경우

## 입력

필수 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `core_message` | `str` | 전달하고자 하는 핵심 메시지. 예: "가볍고 강력한 자외선 차단" |
| `tone` | `str` | 카피 톤. 예: "밝고 활기찬", "전문적이고 신뢰감 있는", "감성적이고 따뜻한" |
| `length_limits` | `dict` | 각 구성 요소별 길이 제한. `headline_max`(자), `body_max`(자), `cta_max`(자) 포함 |

선택 입력 필드:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `target_audience` | `str` | 타겟 오디언스 특성. 예: "20-30대 여성, 뷰티 관심" |
| `brand_keywords` | `list[str]` | 반드시 포함해야 할 브랜드 키워드 |
| `exclude_keywords` | `list[str]` | 사용 금지 키워드 |
| `variant_count` | `int` | 생성할 조합 수 (기본값: 3, 최대: 10) |
| `style_preference` | `str` | 선호 스타일. "질문형", "명령형", "서술형", "감탄형" 등 |

## 출력

주요 출력:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `composed_copy_set` | `list[dict]` | headline + body + CTA 조합 후보 세트. 각 항목에 `headline`, `body`, `cta`, `style`, `fit_score` 포함 |
| `cta_clarity_scores` | `list[float]` | 각 조합의 CTA 명확성 점수 (0.0-1.0) |
| `duplication_rate` | `float` | 조합 간 표현 중복률 (0.0-1.0). 0.3 이하 권장 |
| `format_compliance` | `list[bool]` | 각 조합의 길이/형식 제한 준수 여부 |

## 실행 단계

1. **핵심 메시지 분석**: `core_message`를 분석하여 핵심 키워드, 가치 제안(value proposition), 감정 소구점을 추출한다.
2. **톤 매핑**: `tone`을 기반으로 어휘 수준, 문장 구조, 수사법 스타일을 결정한다.
   - 밝고 활기찬: 짧은 문장, 감탄사, 동적 동사
   - 전문적이고 신뢰감 있는: 구체적 수치, 전문 용어(적절히), 논리적 구조
   - 감성적이고 따뜻한: 은유, 공감 표현, 부드러운 어미
3. **Headline 생성**: 다양한 접근법으로 headline 후보를 생성한다.
   - 혜택 중심: 사용자가 얻는 가치를 직접 표현
   - 호기심 유발: 질문형 또는 반전 구조
   - 감정 소구: 감성적 키워드 활용
   - 숫자/데이터 활용: 구체적 수치로 신뢰감 부여
4. **Body 생성**: 각 headline에 맞는 body를 작성한다.
   - headline의 주장을 뒷받침하는 근거/설명 제공
   - 핵심 메시지를 자연스럽게 전달
   - 길이 제한 내에서 최대 정보 전달
5. **CTA 생성**: 명확하고 행동을 유도하는 CTA를 작성한다.
   - 구체적 행동 동사 사용 ("지금 시작하기", "무료로 체험하기")
   - 긴급성 또는 혜택 암시 가능 ("오늘만 할인", "한정 수량")
   - headline/body와 자연스러운 흐름 유지
6. **조합 최적화**: headline + body + CTA 조합을 최적화한다.
   - 각 조합의 논리적 흐름 검증
   - 조합 간 중복 표현 최소화 (`duplication_rate <= 0.3`)
   - CTA 명확성 검증 (`cta_clarity_scores` 산출)
7. **형식 검증**: 모든 조합이 `length_limits`를 준수하는지 확인한다.

## HITL 정책

- **필수 사람 개입 조건**: 최종 카피 선정은 항상 카피라이터가 결정
- **권장 사람 개입 조건**: `duplication_rate > 0.3`이면 다양성 부족 경고와 함께 카피라이터 검토 권장
- **승인 역할**: 카피라이터, 크리에이티브 디렉터

## 도구 정책

- **허용 도구**: `docs.read` (캠페인 브리프 조회), `brand_guide.read` (브랜드 톤앤보이스/금지어 확인), `policy.read` (카피 가이드라인 조회), `evidence.read` (기존 카피 성과 데이터 조회)
- **승인 필요 도구**: `external.publish` (외부 게시), `bulk.export` (대량 내보내기), `system.write` (시스템 기록)
- **금지 도구**: 경쟁사 카피 직접 복사, 비인가 외부 카피 생성기 호출

## 실패 모드

| 실패 상황 | 처리 방법 |
|-----------|----------|
| `core_message`가 비어 있는 경우 | "핵심 메시지를 입력하세요." 반환 |
| `length_limits`가 비현실적으로 작은 경우 (headline 3자 이하) | "지정된 길이 제한 내에서 의미 있는 카피 생성이 어렵습니다." 경고 후 최선의 시도 |
| 생성된 조합이 모두 높은 중복률을 보이는 경우 | `duplication_rate` 경고와 함께 스타일 다양화 재시도 |
| `exclude_keywords` 때문에 핵심 메시지 표현이 어려운 경우 | 대체 표현으로 생성 시도 후, 제약 조건 충돌 경고 출력 |
| `tone`이 모호한 경우 | 기본 톤(중립적, 명확한)으로 대체 후 경고 메시지 출력 |

## 좋은 예시

**입력:**
```json
{
  "core_message": "가볍고 강력한 자외선 차단",
  "tone": "밝고 활기찬",
  "length_limits": {"headline_max": 20, "body_max": 50, "cta_max": 10},
  "variant_count": 3
}
```

**출력:**
```json
{
  "composed_copy_set": [
    {
      "headline": "가볍게 바르고, 강력히 차단!",
      "body": "무거운 선크림은 이제 그만. 산뜻한 워터 제형이 자외선을 확실하게 막아줍니다.",
      "cta": "지금 만나보기",
      "style": "혜택 중심",
      "fit_score": 0.92
    },
    {
      "headline": "올 여름, 피부에 날개를",
      "body": "바른 듯 안 바른 듯 가벼운데, 자외선 차단은 확실합니다.",
      "cta": "체험하기",
      "style": "감정 소구",
      "fit_score": 0.88
    },
    {
      "headline": "SPF50+인데 이렇게 가볍다고?",
      "body": "높은 차단 지수, 놀라운 가벼움. 여름 필수 선크림의 새로운 기준.",
      "cta": "자세히 보기",
      "style": "호기심 유발",
      "fit_score": 0.85
    }
  ],
  "cta_clarity_scores": [0.95, 0.80, 0.85],
  "duplication_rate": 0.18,
  "format_compliance": [true, true, true]
}
```
**이유:** 3가지 다른 스타일, 낮은 중복률, 모든 조합에서 핵심 메시지 유지, CTA 명확

## 나쁜 예시

**나쁜 출력 (이렇게 하면 안 됨):**
```json
{
  "composed_copy_set": [
    {
      "headline": "좋은 선크림 추천",
      "body": "좋은 선크림을 추천합니다. 사용해보세요.",
      "cta": "클릭",
      "style": "서술형",
      "fit_score": 0.3
    },
    {
      "headline": "선크림 추천합니다",
      "body": "이 선크림을 추천드립니다. 좋습니다.",
      "cta": "보기",
      "style": "서술형",
      "fit_score": 0.25
    }
  ],
  "duplication_rate": 0.85
}
```
**이유:** 핵심 메시지(가벼움, 강력한 차단) 미반영, 조합 간 거의 동일한 표현(중복률 0.85), CTA가 모호("클릭", "보기"), 톤(밝고 활기찬)과 불일치

## 테스트 케이스

| # | 시나리오 | 입력 요약 | 기대 출력 | 판정 |
|---|---------|----------|----------|------|
| 1 | 기본 3개 조합 생성 | core_message + tone + limits | 3개 조합, duplication_rate <= 0.3, 전체 format_compliance = true | PASS |
| 2 | 질문형 스타일 지정 | style_preference = "질문형" | 모든 headline이 질문형 | PASS |
| 3 | 극단적 짧은 제한 | headline_max = 5 | 경고 메시지 + 최선의 시도 | CAUTION |
| 4 | 10개 조합 요청 | variant_count = 10 | 10개 생성, duplication_rate 확인 | PASS |
| 5 | 금지어 포함 시도 | exclude_keywords에 핵심 키워드 포함 | 대체 표현 사용 + 제약 충돌 경고 | CAUTION |
| 6 | CTA 명확성 저하 | 모호한 core_message 입력 | cta_clarity_scores 확인, 낮으면 경고 | CAUTION |
| 7 | 브랜드 키워드 필수 포함 | brand_keywords = ["에어핏"] | 모든 조합에 "에어핏" 포함 | PASS |
