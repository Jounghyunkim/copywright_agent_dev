---
name: customer-segment-fit-check
description: 타겟 고객 세그먼트에 카피 메시지가 적합한지 검증
action_tags:
- localization
role_tags:
- 지역화 검증
---
핵심 고객 세그먼트 설득력 검증 및 인구통계 유출 방지 스킬. 카피가 타깃 세그먼트에 효과적으로 어필하는지 평가하는 동시에, 인구통계 정보(연령대, 소득수준, 직업, 가족구성 등)가 카피에 직접 노출되는 것을 차단한다. 타깃 세그먼트 정보는 톤/소구점 선택의 참고용으로만 활용하고, 카피에 직접 노출해서는 안 된다.

## 사용 조건

| 조건 | 설명 |
|------|------|
| **트리거** | 세그먼트 타깃팅이 지정된 광고 카피가 생성 또는 수정된 직후, 퍼블리시 전 단계에서 자동 호출된다. |
| **선행 조건** | `segment_profile`에 타깃 세그먼트 정보가 1건 이상 포함되어야 한다. |
| **건너뛰기** | `segment_profile`이 비어 있거나 "전체 대상" 세그먼트인 경우 인구통계 유출 검사만 수행하고 적합성 검증은 건너뛴다. |
| **재실행** | 카피 수정 후 재검증이 필요하면 동일 입력으로 재호출할 수 있다. |

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `regional_copy` | `object` | Y | 검증 대상 카피. `{ headline: string, body: string, cta: string, locale: string }` 구조. |
| `segment_profile` | `object` | Y | 타깃 세그먼트 프로파일. `{ segment_name: string, demographics: object, psychographics: object, pain_points: string[], preferred_tone: string, key_appeals: string[] }`. demographics는 참고용이며 카피 노출 금지 대상. |
| `campaign_goal` | `string` | N | 캠페인 목표(예: "인지도 확대", "전환율 향상", "재구매 유도"). |
| `competitor_context` | `object` | N | 경쟁사의 동일 세그먼트 타깃 메시지 참조. |

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `segment_fit_score` | `number` | 세그먼트 적합성 점수 (0-100). 타깃 세그먼트의 pain_points, preferred_tone, key_appeals와의 일치도 기반. |
| `segment_gaps` | `array<object>` | 세그먼트 적합성 갭 목록. 각 항목: `{ gap_type: string, description: string, suggestion: string, priority: "high"\|"medium"\|"low" }`. |
| `demographic_leakage` | `object` | 인구통계 유출 검사 결과. `{ leaked_tokens: array<object>, hard_fail: boolean }`. `leaked_tokens` 각 항목: `{ token: string, location: "headline"\|"body"\|"cta", demographic_category: "age"\|"income"\|"occupation"\|"family_structure", risk_level: "red" }`. |
| `tone_alignment` | `object` | 톤 정렬도. `{ target_tone: string, detected_tone: string, alignment_score: number }`. |
| `pass` | `boolean` | 최종 통과 여부. `demographic_leakage.hard_fail=true`이면 무조건 `false`. 그 외 `segment_fit_score >= 50`이면 `true`. |
| `summary` | `string` | 검증 결과 요약. |

## 실행 단계

1. **세그먼트 프로파일 로드** — `segment_profile`에서 demographics(참고용), psychographics, pain_points, preferred_tone, key_appeals를 추출한다.
2. **Demographic Leakage Check (hard_fail)** — 헤드라인, 본문, CTA 전체를 스캔하여 인구통계 표현이 직접 노출되는지 검사한다. 탐지 대상:
   - **연령대**: "20대", "30대", "30~40대", "중년", "시니어", "MZ세대" 등 연령을 특정하는 표현
   - **소득수준**: "중산층", "고소득", "저소득", "부유층", "서민" 등 소득을 특정하는 표현
   - **직업**: "맞벌이", "전업주부", "직장인", "프리랜서", "자영업자" 등 직업을 특정하는 표현
   - **가족구성**: "자녀를 둔", "싱글", "신혼부부", "다자녀", "1인 가구" 등 가족구성을 특정하는 표현
   - 위 표현이 1건이라도 탐지되면 `risk_level=red`, `hard_fail=true`로 설정한다. **이 단계는 다른 모든 검증보다 우선하며, hard_fail 시 즉시 차단한다.**
3. **톤 분석** — 카피의 어조를 분석하여 `segment_profile.preferred_tone`과 비교한다. 일치도를 `tone_alignment.alignment_score`로 산정한다.
4. **소구점 매칭** — 카피의 핵심 메시지가 `segment_profile.key_appeals`와 얼마나 부합하는지 평가한다. 누락된 소구점을 `segment_gaps`에 기록한다.
5. **페인 포인트 대응 검증** — 카피가 `segment_profile.pain_points`에 대해 해결책이나 공감을 제시하는지 확인한다. 미대응 페인 포인트를 `segment_gaps`에 기록한다.
6. **점수 산정** — 톤 정렬도, 소구점 매칭율, 페인 포인트 대응율을 종합하여 `segment_fit_score`를 산정한다.
7. **최종 판정** — `demographic_leakage.hard_fail=true`이면 점수에 관계없이 `pass=false`. 그 외에는 `segment_fit_score >= 50`이면 `pass=true`.
8. **가드레일** — 인구통계 유출 탐지 시 대체 표현을 반드시 제안한다. 세그먼트 정보는 톤과 소구점 선택의 참고 자료로만 활용하며, 카피 텍스트에 절대 노출하지 않는다.

## HITL 정책

| 상황 | 정책 |
|------|------|
| `hard_fail=true` (인구통계 유출) | 퍼블리시 즉시 차단. 카피라이터에게 유출 항목과 대체 표현 안내. |
| `segment_fit_score < 50` | 마케터에게 적합성 부족 경고, 세그먼트 전략 재검토 권고. |
| `tone_alignment.alignment_score < 40` | 톤 불일치 경고, 카피라이터에게 톤 조정 요청. |
| 모든 key_appeals 누락 | 마케터에게 소구 전략 재검토 요청. |

## 도구 정책

| 도구 | 용도 | 승인 필요 |
|------|------|-----------|
| `docs.read` | 세그먼트 프로파일 문서 조회 | N |
| `brand_guide.read` | 브랜드 톤 가이드라인 조회 | N |
| `evidence.read` | 과거 세그먼트별 캠페인 성과 참조 | N |
| `policy.read` | 인구통계 표현 관련 사내 정책 확인 | N |
| `external.publish` | 검증 결과 외부 전송 | Y |

## 실패 모드

| 실패 유형 | 원인 | 대응 |
|-----------|------|------|
| `segment_profile_empty` | 세그먼트 프로파일이 비어 있음 | 인구통계 유출 검사만 수행, 적합성 검증 건너뜀. |
| `demographic_detection_ambiguous` | 표현이 인구통계 직접 노출인지 간접 암시인지 불명확 | `risk_level=yellow`로 분류, 리뷰어 판단 요청. |
| `tone_detection_failure` | 카피의 톤을 자동 분류하지 못함 | 톤 분석 건너뜀, 수동 톤 확인 요청. |
| `multi_segment_conflict` | 다수 세그먼트 동시 타깃 시 상충되는 소구점 | 각 세그먼트별 개별 점수 제공, 통합 전략 권고. |
| `copy_too_short` | 카피가 너무 짧아(10자 미만) 유의미한 분석 불가 | 최소 문자수 미달 경고, 카피 보완 요청. |

## 좋은 예시

**예시 1: 인구통계 유출 없이 세그먼트 적합 카피**
```
입력:
  regional_copy:
    headline: "신학기를 맞아, 자녀에게 가벼운 그램을"
    body: "새 학기 준비, 가벼운 무게로 어깨 부담을 덜어주세요."
    cta: "신학기 특가 보기"
    locale: "ko-KR"
  segment_profile:
    segment_name: "30~40대 학부모"
    demographics: { age_range: "30-45", family: "초등학생 자녀" }
    psychographics: { values: ["자녀 교육", "실용성"] }
    pain_points: ["무거운 책가방으로 인한 자녀 건강 걱정"]
    preferred_tone: "따뜻하고 실용적인"
    key_appeals: ["경량 설계", "신학기 시즌"]

출력:
  segment_fit_score: 85
  segment_gaps: []
  demographic_leakage:
    leaked_tokens: []
    hard_fail: false
  tone_alignment: { target_tone: "따뜻하고 실용적인", detected_tone: "따뜻하고 실용적인", alignment_score: 92 }
  pass: true
  summary: "타깃 세그먼트(30~40대 학부모)의 페인 포인트와 소구점에 잘 부합하며, 인구통계 유출 없음. 퍼블리시 가능."
```

**예시 2: 페인 포인트 미대응 시 갭 리포트**
```
입력:
  regional_copy:
    headline: "프리미엄 노트북 신제품 출시"
    body: "최고 성능의 노트북을 만나보세요."
    cta: "구매하기"
  segment_profile:
    segment_name: "대학생"
    pain_points: ["가격 부담", "휴대성"]
    key_appeals: ["합리적 가격", "가벼운 무게", "긴 배터리"]
    preferred_tone: "활기차고 친근한"

출력:
  segment_fit_score: 35
  segment_gaps:
    - { gap_type: "appeal_missing", description: "합리적 가격 소구점 누락", suggestion: "가격 혜택이나 학생 할인 언급 추가", priority: "high" }
    - { gap_type: "appeal_missing", description: "휴대성/가벼운 무게 소구점 누락", suggestion: "무게나 휴대성 관련 표현 추가", priority: "high" }
    - { gap_type: "tone_mismatch", description: "프리미엄 톤이 활기찬 대학생 톤과 불일치", suggestion: "보다 친근하고 활기찬 톤으로 조정", priority: "medium" }
  pass: false
  summary: "핵심 소구점 2개 누락, 톤 불일치. 세그먼트 적합성 낮음."
```

## 나쁜 예시

**예시 1: 인구통계 직접 노출 (hard_fail)**
```
입력:
  regional_copy:
    headline: "30~40대 중산층 학부모님, 주목하세요!"
    body: "맞벌이 가정을 위한 프리미엄 키즈 서비스"
    cta: "신청하기"
  segment_profile:
    segment_name: "30~40대 맞벌이 학부모"

잘못된 출력:
  segment_fit_score: 90
  demographic_leakage: { leaked_tokens: [], hard_fail: false }
  pass: true

문제: headline에 "30~40대"(연령대), "중산층"(소득수준), "학부모님"이 직접 노출되고,
body에 "맞벌이"(직업 형태)가 직접 노출됨. 모두 인구통계 유출에 해당하며 hard_fail=true여야 함.

올바른 출력:
  demographic_leakage:
    leaked_tokens:
      - { token: "30~40대", location: "headline", demographic_category: "age", risk_level: "red" }
      - { token: "중산층", location: "headline", demographic_category: "income", risk_level: "red" }
      - { token: "맞벌이", location: "body", demographic_category: "occupation", risk_level: "red" }
    hard_fail: true
  pass: false
```

**예시 2: 세그먼트 정보를 그대로 카피에 반영**
```
입력:
  regional_copy:
    headline: "고소득 전문직 여성을 위한 럭셔리 케어"
    body: "1인 가구 직장인 맞춤 패키지"
  segment_profile:
    segment_name: "고소득 전문직 여성 1인 가구"

문제: 세그먼트 프로파일의 인구통계 정보("고소득", "전문직", "여성", "1인 가구", "직장인")가
카피에 그대로 노출됨. 세그먼트 정보는 톤/소구점 선택의 참고용으로만 활용해야 하며,
카피 텍스트에 직접 사용해서는 안 됨. hard_fail=true.
```

## 테스트 케이스

| ID | 시나리오 | 입력 요약 | 기대 결과 |
|----|---------|-----------|-----------|
| TC-01 | 인구통계 유출 - 연령대 | headline에 "20대" 포함 | `hard_fail=true`, `pass=false` |
| TC-02 | 인구통계 유출 - 소득 | body에 "중산층" 포함 | `hard_fail=true`, `pass=false` |
| TC-03 | 인구통계 유출 - 직업 | body에 "전업주부" 포함 | `hard_fail=true`, `pass=false` |
| TC-04 | 인구통계 유출 - 가족구성 | headline에 "자녀를 둔" 포함 | `hard_fail=true`, `pass=false` |
| TC-05 | 유출 없이 높은 적합성 | 세그먼트 소구점 반영, 인구통계 노출 없음 | `pass=true`, `segment_fit_score >= 80` |
| TC-06 | 소구점 전체 누락 | 카피가 모든 key_appeals와 무관 | `segment_fit_score < 50`, `segment_gaps` 다수 |
| TC-07 | 톤 불일치 | 격식체 카피 vs 친근한 톤 요구 | `tone_alignment.alignment_score < 40` |
| TC-08 | 다수 세그먼트 | 2개 이상 세그먼트 동시 타깃 | 각 세그먼트별 개별 점수 제공 |
| TC-09 | 전체 대상 세그먼트 | segment_name="전체" | 적합성 건너뜀, 유출 검사만 수행 |
| TC-10 | 간접 암시 경계 | "바쁜 일상 속" (직업 간접 암시?) | `risk_level=yellow`, 리뷰어 판단 요청 |
